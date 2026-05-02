from fastapi import APIRouter, UploadFile, File, Form
import psycopg
import os
import uuid
import requests
from dotenv import load_dotenv

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
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    duration: str = Form(""),
    price: float = Form(...),
    thumbnail_url: str = Form(""),
    thumbnail_basic: str = Form(""),
    file: UploadFile = File(...)
):
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    bucket = os.getenv("SUPABASE_FILMS_BUCKET") or os.getenv("SUPABASE_BUCKET")

    file_extension = file.filename.split(".")[-1].lower()
    file_name = f"{uuid.uuid4()}.{file_extension}"
    bucket_path = f"films/{file_name}"

    file_bytes = file.file.read()

    upload_url = f"{supabase_url}/storage/v1/object/{bucket}/{bucket_path}"

    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "Content-Type": file.content_type or "application/octet-stream",
    }

    upload_response = requests.post(
        upload_url,
        headers=headers,
        data=file_bytes
    )

    if upload_response.status_code not in [200, 201]:
        return {
            "error": "Failed to upload film to Supabase Storage",
            "details": upload_response.text
        }

    file_size_mb = f"{round(len(file_bytes) / (1024 * 1024), 2)} MB"
    mime_type = file.content_type or f"video/{file_extension}"

    embedding_text = build_film_embedding_text(
        title,
        description,
        category
    )

    embedding = create_embedding(embedding_text)
    pg_vector = embedding_to_pgvector(embedding)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO films (
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
                    embedding
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    'user', 'approved', %s, %s::vector
                )
                RETURNING id
            """, (
                title,
                description,
                category,
                duration,
                thumbnail_url,
                bucket_path,
                mime_type,
                file_size_mb,
                price,
                thumbnail_basic,
                pg_vector
            ))

            film_id = cur.fetchone()[0]
            conn.commit()

    return {
        "message": "Film uploaded and saved successfully",
        "film": {
            "id": film_id,
            "title": title,
            "description": description,
            "category": category,
            "duration": duration,
            "thumbnail_url": thumbnail_url,
            "bucket_path": bucket_path,
            "mime_type": mime_type,
            "file_size": file_size_mb,
            "price": price,
            "source_type": "user",
            "status": "approved",
            "thumbnail_basic": thumbnail_basic
        }
    }