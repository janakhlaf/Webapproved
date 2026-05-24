from fastapi import APIRouter, UploadFile, File, Form
from dotenv import load_dotenv
import psycopg
import requests
import os
import uuid

from ai.embedding_service import (
    create_embedding,
    embedding_to_pgvector,
    build_asset_embedding_text
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


@router.get("/assets")
def get_assets():
    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                SELECT
                    id,
                    user_id,
                    name,
                    description,
                    category,
                    preview_url,
                    bucket_path,
                    file_type,
                    file_size,
                    price,
                    status,
                    source_type
                FROM assets
                WHERE status = 'approved'
                ORDER BY id ASC
            """)

            rows = cur.fetchall()

    assets = []

    for row in rows:
        source_type = row[11] or "user_upload"
        user_id = row[1]

        assets.append({
            "id": row[0],
            "user_id": user_id,
            "title": row[2],
            "name": row[2],
            "description": row[3],
            "category": row[4],
            "preview_url": row[5],
            "bucket_path": row[6],
            "file_type": row[7],
            "file_size": row[8],
            "price": row[9],
            "status": row[10],
            "source_type": source_type,
            "uploader": "Admin" if source_type == "admin" else f"User {user_id}",
        })

    return {"assets": assets}


@router.post("/assets/upload")
def upload_asset(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    file: UploadFile = File(...),
    auth_user_id: str = Form(...)
):
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    preview_bucket = "assets_previwe"
    private_bucket = "assets_private"

    file_extension = file.filename.split(".")[-1].lower()
    file_name = f"{uuid.uuid4()}.{file_extension}"

    preview_bucket_path = f"users/{file_name}"
    private_bucket_path = f"users/{file_name}"

    file_bytes = file.file.read()

    preview_upload_url = (
        f"{supabase_url}/storage/v1/object/"
        f"{preview_bucket}/{preview_bucket_path}"
    )

    private_upload_url = (
        f"{supabase_url}/storage/v1/object/"
        f"{private_bucket}/{private_bucket_path}"
    )

    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "Content-Type": file.content_type or "application/octet-stream",
    }

    preview_upload_response = requests.post(
        preview_upload_url,
        headers=headers,
        data=file_bytes
    )

    private_upload_response = requests.post(
        private_upload_url,
        headers=headers,
        data=file_bytes
    )

    if (
        preview_upload_response.status_code not in [200, 201]
        or
        private_upload_response.status_code not in [200, 201]
    ):
        return {
            "error": "Failed to upload file to Supabase Storage",
            "details": "Upload failed"
        }

    preview_url = (
        f"{supabase_url}/storage/v1/object/public/"
        f"{preview_bucket}/{preview_bucket_path}"
    )

    bucket_path = private_bucket_path

    file_size_mb = round(len(file_bytes) / (1024 * 1024), 2)

    embedding_text = build_asset_embedding_text(
        title,
        description,
        category,
        file_extension
    )

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
            return {
                "error": "User not found"
            }

        user_id = user_row[0]

        cur.execute("""
            INSERT INTO assets (
                user_id,
                name,
                description,
                category,
                preview_url,
                bucket_path,
                file_type,
                file_size,
                price,
                status,
                source_type,
                embedding
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', 'user_upload', %s::vector)
            RETURNING id
        """, (
            user_id,
            title,
            description,
            category,
            preview_url,
            bucket_path,
            file_extension,
            file_size_mb,
            price,
            pg_vector
        ))

        asset_id = cur.fetchone()[0]
        conn.commit()


    return {
        "message": "Asset uploaded and saved successfully",
        "asset": {
            "id": asset_id,
            "user_id": user_id,
            "title": title,
            "name": title,
            "preview_url": preview_url,
            "bucket_path": bucket_path,
            "file_type": file_extension,
            "file_size": file_size_mb,
            "price": price,
            "status": "pending",
            "source_type": "user_upload",
            "uploader": f"User {user_id}",
        }
    }