from fastapi import APIRouter
import psycopg
import os
from dotenv import load_dotenv

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