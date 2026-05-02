import os
from openai import OpenAI
from dotenv import load_dotenv

from ai.embedding_service import create_embedding, embedding_to_pgvector
from db import get_connection

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def detect_result_type_with_ai(message: str) -> str:
    prompt = f"""
Decide if the user wants FILMS or 3D ASSETS.

Return only one word:
film
asset
unknown

User message:
"{message}"
"""

    response = client.responses.create(
        model="gpt-5.4",
        input=prompt,
        temperature=0
    )

    result = response.output_text.strip().lower()

    if result in ["film", "asset"]:
        return result

    return "unknown"


def rewrite_search_query(message: str, result_type: str) -> str:
    prompt = f"""
Rewrite the user message into a clear English semantic search query for {result_type} search.

Rules:
- Translate to English if needed.
- Keep the user's meaning.
- Add useful related keywords only.
- Return only the improved query.

User message:
"{message}"
"""

    response = client.responses.create(
        model="gpt-5.4",
        input=prompt,
        temperature=0
    )

    return response.output_text.strip()


def detect_asset_filter(message: str):
    msg = message.lower()

    if any(word in msg for word in ["روبوت", "روبوتات", "robot", "robots", "humanoid", "mech"]):
        return """
        AND (
            name ILIKE '%%robot%%'
            OR category ILIKE '%%robot%%'
            OR description ILIKE '%%robot%%'
            OR name ILIKE '%%humanoid%%'
            OR category ILIKE '%%humanoid%%'
            OR description ILIKE '%%humanoid%%'
            OR name ILIKE '%%mech%%'
        )
        """

    if any(word in msg for word in ["character", "characters", "شخصية", "شخصيات", "creature", "creatures"]):
        return """
        AND (
            category ILIKE '%%character%%'
            OR category ILIKE '%%creature%%'
            OR description ILIKE '%%character%%'
        )
        """

    if any(word in msg for word in ["environment", "environments", "بيئة", "مدينة", "city", "building", "architecture"]):
        return """
        AND (
            category ILIKE '%%environment%%'
            OR category ILIKE '%%building%%'
            OR category ILIKE '%%architecture%%'
            OR name ILIKE '%%city%%'
            OR description ILIKE '%%environment%%'
        )
        """

    if any(word in msg for word in ["drone", "drones", "درون"]):
        return """
        AND (
            category ILIKE '%%drone%%'
            OR name ILIKE '%%drone%%'
            OR description ILIKE '%%drone%%'
        )
        """

    if any(word in msg for word in ["animal", "animals", "حيوان", "dog", "snail"]):
        return """
        AND (
            category ILIKE '%%animal%%'
            OR name ILIKE '%%dog%%'
            OR name ILIKE '%%snail%%'
        )
        """

    return ""


def format_results(title: str, rows, min_similarity: float):
    filtered_rows = [
        (name, similarity)
        for name, similarity in rows
        if similarity >= min_similarity
    ]

    if not filtered_rows:
        return None

    reply = f"{title}\n\n"

    for name, similarity in filtered_rows:
        reply += f"- {name} ({round(similarity * 100, 1)}%)\n"

    return reply


def handle_similar(message: str, is_authenticated: bool = False) -> str:
    if not is_authenticated:
        return "ميزة البحث عن عناصر مشابهة متاحة بعد تسجيل الدخول."

    result_type = detect_result_type_with_ai(message)

    if result_type == "unknown":
        return "مش واضح إذا بدك أفلام ولا أسيتس."

    search_query = rewrite_search_query(message, result_type)
    query_embedding = create_embedding(search_query)
    pg_vector = embedding_to_pgvector(query_embedding)

    conn = get_connection()
    cur = conn.cursor()

    try:
        if result_type == "film":
            cur.execute("""
                SELECT
                    title,
                    1 - (embedding <=> %s::vector) AS similarity
                FROM films
                WHERE embedding IS NOT NULL
                AND status = 'approved'
                ORDER BY embedding <=> %s::vector
                LIMIT 5;
            """, (pg_vector, pg_vector))

            rows = cur.fetchall()

            if not rows:
                return "ما لقيت أفلام مشابهة."

            reply = format_results("🎬 أقرب الأفلام:", rows, 0.45)

            if reply is None:
                return "ما لقيت أفلام قريبة كفاية من طلبك."

            return reply

        if result_type == "asset":
            asset_filter = detect_asset_filter(message)

            query = f"""
                SELECT
                    name,
                    1 - (embedding <=> %s::vector) AS similarity
                FROM assets
                WHERE embedding IS NOT NULL
                AND status = 'approved'
                {asset_filter}
                ORDER BY embedding <=> %s::vector
                LIMIT 5;
            """

            cur.execute(query, (pg_vector, pg_vector))
            rows = cur.fetchall()

            if not rows:
                return "ما لقيت أسيتس مناسبة."

            reply = format_results("🧊 أقرب الأسيتس:", rows, 0.25)

            if reply is None:
                return "ما لقيت أسيتس قريبة كفاية من طلبك."

            return reply

    except Exception as e:
        return f"خطأ: {str(e)}"

    finally:
        cur.close()
        conn.close()