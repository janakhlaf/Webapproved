from fastapi import APIRouter, HTTPException
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
def get_or_create_active_cart(cur, user_id: int):
    cur.execute("""
        SELECT id
        FROM carts
        WHERE user_id = %s AND status = 'active'
        ORDER BY id DESC
        LIMIT 1
    """, (user_id,))

    cart = cur.fetchone()

    if cart:
        return cart[0]

    cur.execute("""
        INSERT INTO carts (user_id, status)
        VALUES (%s, 'active')
        RETURNING id
    """, (user_id,))

    return cur.fetchone()[0]
@router.post("/cart/add")
def add_to_cart(data: dict):
    user_id = data["user_id"]
    item_id = data["item_id"]
    item_type = data["item_type"]
    price = data["price"]

    with get_connection() as conn:
        with conn.cursor() as cur:
            cart_id = get_or_create_active_cart(cur, user_id)

            if item_type == "film":
                cur.execute("""
                    SELECT id FROM cart_items
                    WHERE cart_id = %s AND film_id = %s
                """, (cart_id, item_id))

                if cur.fetchone():
                    return {"message": "Item already in cart", "cart_id": cart_id}

                cur.execute("""
                    INSERT INTO cart_items (cart_id, film_id, asset_id, price_at_addition)
                    VALUES (%s, %s, NULL, %s)
                """, (cart_id, item_id, price))

            elif item_type == "asset":
                cur.execute("""
                    SELECT id FROM cart_items
                    WHERE cart_id = %s AND asset_id = %s
                """, (cart_id, item_id))

                if cur.fetchone():
                    return {"message": "Item already in cart", "cart_id": cart_id}

                cur.execute("""
                    INSERT INTO cart_items (cart_id, film_id, asset_id, price_at_addition)
                    VALUES (%s, NULL, %s, %s)
                """, (cart_id, item_id, price))

            else:
                raise HTTPException(status_code=400, detail="Invalid item_type")

            conn.commit()

    return {"message": "Added to cart", "cart_id": cart_id}


@router.post("/checkout")
def checkout(data: dict):
    user_id = data["user_id"]
    cart_items = data["cart_items"]

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    with get_connection() as conn:
        with conn.cursor() as cur:
            total = sum(float(item["price"]) for item in cart_items)

            cur.execute("""
                INSERT INTO purchases (user_id, total_amount, payment_status)
                VALUES (%s, %s, 'paid')
                RETURNING id
            """, (user_id, total))

            purchase_id = cur.fetchone()[0]

            for item in cart_items:
                raw_id = str(item["id"])

                if raw_id.startswith("film-"):
                    item_id = int(raw_id.replace("film-", ""))
                elif raw_id.startswith("asset-"):
                    item_id = int(raw_id.replace("asset-", ""))
                else:
                    item_id = int(raw_id)

                item_type = item["itemType"]

                film_id = item_id if item_type == "film" else None
                asset_id = item_id if item_type == "asset" else None

                cur.execute("""
                    INSERT INTO purchase_items (
                        purchase_id,
                        film_id,
                        asset_id,
                        price_at_purchase
                    )
                    VALUES (%s, %s, %s, %s)
                """, (
                    purchase_id,
                    film_id,
                    asset_id,
                    item["price"]
                ))

                cur.execute("""
                    SELECT id FROM library
                    WHERE user_id = %s
                      AND item_id = %s
                      AND item_type = %s
                """, (user_id, item_id, item_type))

                exists = cur.fetchone()

                if not exists:
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
                    """, (
                        user_id,
                        item_id,
                        item_type,
                        item["title"],
                        item.get("image", ""),
                        item["price"]
                    ))

            cur.execute("""
                SELECT id
                FROM carts
                WHERE user_id = %s AND status = 'active'
                ORDER BY id DESC
                LIMIT 1
            """, (user_id,))

            active_cart = cur.fetchone()

            if active_cart:
                cart_id = active_cart[0]

                cur.execute("""
                    DELETE FROM cart_items
                    WHERE cart_id = %s
                """, (cart_id,))


            conn.commit()

    return {
        "message": "Purchase completed",
        "purchase_id": purchase_id
    }