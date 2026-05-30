from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/favorites", tags=["favorites"])


def get_connection():
    return psycopg.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
    )


class ToggleFavoriteRequest(BaseModel):
    user_id: int
    item_type: str
    item_id: int


@router.get("/{user_id}")
def get_favorites(user_id: int):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT film_id, asset_id
                FROM favorites
                WHERE user_id = %s
                """,
                (user_id,)
            )

            rows = cur.fetchall()

    films = []
    assets = []

    for film_id, asset_id in rows:
        if film_id is not None:
            films.append(film_id)
        if asset_id is not None:
            assets.append(asset_id)

    return {
        "films": films,
        "assets": assets
    }


@router.post("/toggle")
def toggle_favorite(request: ToggleFavoriteRequest):
    if request.item_type not in ["film", "asset"]:
        raise HTTPException(status_code=400, detail="Invalid item type")

    with get_connection() as conn:
        with conn.cursor() as cur:
            if request.item_type == "film":
                cur.execute(
                    """
                    SELECT id
                    FROM favorites
                    WHERE user_id = %s AND film_id = %s
                    """,
                    (request.user_id, request.item_id)
                )

                existing = cur.fetchone()

                if existing:
                    cur.execute(
                        """
                        DELETE FROM favorites
                        WHERE user_id = %s AND film_id = %s
                        """,
                        (request.user_id, request.item_id)
                    )
                    action = "removed"
                else:
                    cur.execute(
                        """
                        INSERT INTO favorites (user_id, film_id, asset_id)
                        VALUES (%s, %s, NULL)
                        """,
                        (request.user_id, request.item_id)
                    )
                    action = "added"

            else:
                cur.execute(
                    """
                    SELECT id
                    FROM favorites
                    WHERE user_id = %s AND asset_id = %s
                    """,
                    (request.user_id, request.item_id)
                )

                existing = cur.fetchone()

                if existing:
                    cur.execute(
                        """
                        DELETE FROM favorites
                        WHERE user_id = %s AND asset_id = %s
                        """,
                        (request.user_id, request.item_id)
                    )
                    action = "removed"
                else:
                    cur.execute(
                        """
                        INSERT INTO favorites (user_id, film_id, asset_id)
                        VALUES (%s, NULL, %s)
                        """,
                        (request.user_id, request.item_id)
                    )
                    action = "added"

            conn.commit()

    return {
        "success": True,
        "action": action
    }


@router.delete("/clear/{user_id}")
def clear_favorites(user_id: int):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                DELETE FROM favorites
                WHERE user_id = %s
                """,
                (user_id,)
            )
            conn.commit()

    return {"success": True}