from fastapi import APIRouter, UploadFile, File, Form
from dotenv import load_dotenv
import psycopg
import requests
import os
import uuid

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
                SELECT id, name, description, category, preview_url,
                       bucket_path, file_type, file_size, price, status
                FROM assets
                WHERE status = 'approved'
                ORDER BY id ASC
            """)

            rows = cur.fetchall()

    assets = []
    for row in rows:
        assets.append({
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "category": row[3],
            "preview_url": row[4],
            "bucket_path": row[5],
            "file_type": row[6],
            "file_size": row[7],
            "price": row[8],
            "status": row[9],
        })

    return {"assets": assets}


@router.post("/assets/upload")
def upload_asset(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    file: UploadFile = File(...)
):
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
        data=file_bytes
    )

    if upload_response.status_code not in [200, 201]:
        return {
            "error": "Failed to upload file to Supabase Storage",
            "details": upload_response.text
        }

    preview_url = f"{supabase_url}/storage/v1/object/public/{bucket}/{bucket_path}"

    file_size_mb = round(len(file_bytes) / (1024 * 1024), 2)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO assets (
                    name,
                    description,
                    category,
                    preview_url,
                    bucket_path,
                    file_type,
                    file_size,
                    price,
                    status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'approved')
                RETURNING id
            """, (
                title,
                description,
                category,
                preview_url,
                bucket_path,
                file_extension,
                file_size_mb,
                price
            ))

            asset_id = cur.fetchone()[0]
            conn.commit()

    return {
        "message": "Asset uploaded and saved successfully",
        "asset": {
            "id": asset_id,
            "title": title,
            "preview_url": preview_url,
            "bucket_path": bucket_path,
            "file_type": file_extension,
            "file_size": file_size_mb,
            "price": price,
            "status": "approved"
        }
    }