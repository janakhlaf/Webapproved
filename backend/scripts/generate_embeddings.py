import os
import sys
from dotenv import load_dotenv

load_dotenv()

# 👇 هاي أهم إضافة (عشان Python يشوف db.py)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI
from db import get_connection

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

EMBEDDING_MODEL = "text-embedding-3-small"


def create_embedding(text: str):
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text
    )
    return response.data[0].embedding


def embedding_to_pgvector(embedding):
    return "[" + ",".join(str(x) for x in embedding) + "]"


def build_film_text(title, description, category):
    return f"""
Title: {title}
Category: {category}
Description: {description}
""".strip()


def build_asset_text(name, description, category, file_type):
    return f"""
Asset Name: {name}
Category: {category}
File Type: {file_type}
Description: {description}
""".strip()


def update_films(cur):
    cur.execute("""
        SELECT id, title, description, category
        FROM films
        WHERE embedding IS NULL
        AND status = 'approved';
    """)

    films = cur.fetchall()

    for film in films:
        film_id, title, description, category = film

        text = build_film_text(title, description, category)
        embedding = create_embedding(text)
        pg_vector = embedding_to_pgvector(embedding)

        cur.execute("""
            UPDATE films
            SET embedding = %s::vector
            WHERE id = %s;
        """, (pg_vector, film_id))

        print(f"Film embedding updated: {title}")


def update_assets(cur):
    cur.execute("""
        SELECT id, name, description, category, file_type
        FROM assets
        WHERE embedding IS NULL
        AND status = 'approved';
    """)

    assets = cur.fetchall()

    for asset in assets:
        asset_id, name, description, category, file_type = asset

        text = build_asset_text(name, description, category, file_type)
        embedding = create_embedding(text)
        pg_vector = embedding_to_pgvector(embedding)

        cur.execute("""
            UPDATE assets
            SET embedding = %s::vector
            WHERE id = %s;
        """, (pg_vector, asset_id))

        print(f"Asset embedding updated: {name}")


def main():
    conn = get_connection()
    cur = conn.cursor()

    update_films(cur)
    update_assets(cur)

    conn.commit()
    cur.close()
    conn.close()

    print("All embeddings generated successfully.")


if __name__ == "__main__":
    main()