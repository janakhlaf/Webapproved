from fastapi import APIRouter, UploadFile, File, Form
import psycopg
import os
import uuid
import requests
from dotenv import load_dotenv
import json
import tempfile
from moviepy import VideoFileClip

from ai.embedding_service import (
    create_embedding,
    embedding_to_pgvector,
    build_film_embedding_text
)

load_dotenv()

router = APIRouter()


def get_connection():
    return psycopg.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
    )


@router.get("/films")
def get_films():
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                id,
                user_id,
                title,
                description,
                category,
                duration,
                thumbnail_url,
                bucket_path,
                mime_type,
                file_size,
                price,
                source_type,
                status,
                rejection_reason,
                thumbnail_basic
            FROM films
                WHERE status = 'approved'
                ORDER BY id DESC
               """)

        rows = cur.fetchall()

        films = []
        for row in rows:
            films.append({
                "id": row[0],
                "user_id": row[1],
                "title": row[2],
                "description": row[3],
                "category": row[4],
                "duration": row[5],
                "thumbnail_url": row[6],
                "bucket_path": row[7],
                "mime_type": row[8],
                "file_size": row[9],
                "price": float(row[10]) if row[10] else 0,
                "source_type": row[11],
                "status": row[12],
                "rejection_reason": row[13],
                "thumbnail_basic": row[14],
            })

        cur.close()
        conn.close()

        return {"films": films}

    except Exception as e:
        return {"error": str(e)}


@router.post("/films/upload")
def upload_film(
    auth_user_id: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    tags: str = Form(...),
    film_file: UploadFile = File(...),
    poster_file: UploadFile = File(...)
):
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    bucket = "films_private"

    parsed_tags = json.loads(tags)

    # upload film
    film_extension = film_file.filename.split(".")[-1].lower()
    film_name = f"{uuid.uuid4()}.{film_extension}"
    film_bucket_path = f"users/{film_name}"
    film_bytes = film_file.file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{film_extension}") as temp_video:
        temp_video.write(film_bytes)
        temp_video_path = temp_video.name

    clip = VideoFileClip(temp_video_path)
    duration_seconds = int(clip.duration)
    clip.close()

    minutes = duration_seconds // 60
    seconds = duration_seconds % 60
    duration = f"{minutes}:{seconds:02d}"

    film_upload_url = f"{supabase_url}/storage/v1/object/{bucket}/{film_bucket_path}"

    film_headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "Content-Type": film_file.content_type or "application/octet-stream",
    }

    film_upload_response = requests.post(
        film_upload_url,
        headers=film_headers,
        data=film_bytes
    )

    if film_upload_response.status_code not in [200, 201]:
        return {
            "error": "Failed to upload film to Supabase Storage",
            "details": film_upload_response.text
        }

    # upload poster
    poster_extension = poster_file.filename.split(".")[-1].lower()
    poster_name = f"{uuid.uuid4()}.{poster_extension}"
    poster_bucket_path = f"users/{poster_name}"
    poster_bytes = poster_file.file.read()

    poster_upload_url = f"{supabase_url}/storage/v1/object/thumbnail_previw/{poster_bucket_path}"

    poster_headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "Content-Type": poster_file.content_type or "image/png",
    }

    poster_upload_response = requests.post(
        poster_upload_url,
        headers=poster_headers,
        data=poster_bytes
    )

    if poster_upload_response.status_code not in [200, 201]:
        return {
            "error": "Failed to upload poster to Supabase Storage",
            "details": poster_upload_response.text
        }

    thumbnail_url = f"{supabase_url}/storage/v1/object/public/thumbnail_previw/{poster_bucket_path}"
    file_size_mb = f"{round(len(film_bytes) / (1024 * 1024), 2)} MB"
    mime_type = film_file.content_type or f"video/{film_extension}"

    embedding_text = build_film_embedding_text(title, description, category)
    embedding = create_embedding(embedding_text)
    pg_vector = embedding_to_pgvector(embedding)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id
                FROM users
                WHERE auth_user_id = %s
            """, (auth_user_id,))

            user_row = cur.fetchone()

            if not user_row:
                return {"error": "User not found"}

            user_id = user_row[0]
            cur.execute("""
                INSERT INTO films (
                    user_id,
                    title,
                    description,
                    category,
                    duration,
                    thumbnail_url,
                    bucket_path,
                    mime_type,
                    file_size,
                    price,
                    source_type,
                    status,
                    thumbnail_basic,
                    tags,
                    embedding
                )
                VALUES (
                   %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    'user', 'pending', %s, %s, %s::vector
                )
                RETURNING id
            """, (
                user_id,
                title,
                description,
                category,
                duration,
                thumbnail_url,
                film_bucket_path,
                mime_type,
                file_size_mb,
                price,
                thumbnail_url,
                parsed_tags,
                pg_vector
            ))

            film_id = cur.fetchone()[0]
            conn.commit()

    return {
        "message": "Film submitted for admin approval",
        "film": {
            "id": film_id,
            "title": title,
            "status": "pending"
        }
    }

@router.patch("/admin/films/{film_id}/approve")
def approve_film(film_id: int):
    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                UPDATE films
                SET status = 'approved'
                WHERE id = %s
                RETURNING id
            """, (film_id,))

            row = cur.fetchone()

            if not row:
                return {"error": "Film not found"}

            conn.commit()

    return {
        "message": "Film approved successfully"
    }


@router.delete("/admin/films/{film_id}/reject")
def reject_film(film_id: int):

    bucket = os.getenv("SUPABASE_FILMS_BUCKET") or os.getenv("SUPABASE_BUCKET")
    preview_bucket = "thumbnail_previw"

    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                SELECT bucket_path, thumbnail_url
                FROM films
                WHERE id = %s
            """, (film_id,))

            row = cur.fetchone()

            if not row:
                return {"error": "Film not found"}

            film_path = row[0]
            thumbnail_url = row[1]

            poster_path = thumbnail_url.split(f"/{preview_bucket}/")[-1]

            headers = {
                "Authorization": f"Bearer {service_key}",
                "apikey": service_key,
                "Content-Type": "application/json",
            }

            requests.delete(
                f"{supabase_url}/storage/v1/object/{bucket}/{film_path}",
                headers=headers
            )

            requests.delete(
                f"{supabase_url}/storage/v1/object/{preview_bucket}/{poster_path}",
                headers=headers
            )

            cur.execute("""
                DELETE FROM films
                WHERE id = %s
            """, (film_id,))

            conn.commit()

    return {
        "message": "Film rejected and deleted"
    }