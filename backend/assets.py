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
    print("=== CONNECTING TO DATABASE ===")

    return psycopg.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        connect_timeout=5
    )


@router.get("/assets")
def get_assets():
    print("=== /assets endpoint called ===")

    try:
        with get_connection() as conn:
            print("=== DATABASE CONNECTED ===")

            with conn.cursor() as cur:
                print("=== EXECUTING QUERY ===")

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

                print("=== QUERY EXECUTED ===")

                rows = cur.fetchall()

                print(f"=== ROWS FETCHED: {len(rows)} ===")

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

        print("=== RETURNING ASSETS ===")

        return {"assets": assets}

    except Exception as e:
        print("=== ERROR IN /assets ===")
        print(str(e))

        return {
            "error": str(e)
        }


@router.post("/assets/upload")
def upload_asset(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    file: UploadFile = File(...),
    user_id: int = Form(...)
):
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        bucket = os.getenv("SUPABASE_BUCKET")

        file_extension = file.filename.split(".")[-1].lower()
        file_name = f"{uuid.uuid4()}.{file_extension}"
        bucket_path = f"assets/{file_name}"

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
            data=file_bytes,
            timeout=10
        )

        if upload_response.status_code not in [200, 201]:
            return {
                "error": "Failed to upload file to Supabase Storage",
                "details": upload_response.text
            }

        preview_url = f"{supabase_url}/storage/v1/object/public/{bucket}/{bucket_path}"

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
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'approved', 'user_upload', %s::vector)
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
                "status": "approved",
                "source_type": "user_upload",
                "uploader": f"User {user_id}",
            }
        }

    except Exception as e:
        print("=== ERROR IN /assets/upload ===")
        print(str(e))

        return {
            "error": str(e)
        }