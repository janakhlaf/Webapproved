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


@router.get("/library/{user_id}")
def get_library(user_id: int):

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                SELECT
                    id,
                    user_id,
                    item_id,
                    item_type,
                    title,
                    preview_url,
                    price
                FROM library
                WHERE user_id = %s
                ORDER BY id DESC
            """, (user_id,))

            rows = cur.fetchall()

    library_items = []

    for row in rows:
        library_items.append({
            "id": row[0],
            "user_id": row[1],
            "item_id": row[2],
            "item_type": row[3],
            "title": row[4],
            "preview_url": row[5],
            "price": float(row[6]) if row[6] else 0,
        })

    return {
        "library": library_items
    }


@router.post("/library/add")
def add_to_library(data: dict):

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                INSERT INTO library (
                    user_id,
                    item_id,
                    item_type,
                    title,
                    preview_url,
                    price
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                data["user_id"],
                data["item_id"],
                data["item_type"],
                data["title"],
                data["preview_url"],
                data["price"]
            ))

            library_id = cur.fetchone()[0]

            conn.commit()

    return {
        "message": "Added to library successfully",
        "library_id": library_id
    }