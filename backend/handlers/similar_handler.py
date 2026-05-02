import os
import json
import re
from openai import OpenAI
from dotenv import load_dotenv

from ai.embedding_service import create_embedding, embedding_to_pgvector
from db import get_connection

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def analyze_user_request(message: str) -> dict:
    prompt = f"""
You analyze user search intent for Human Mind & AI Logic.

Return ONLY valid JSON.

Schema:
{{
  "result_type": "film | asset | unknown",
  "asset_type": "robot | humanoid_character | animal_character | creature | environment | building | vehicle | drone | prop | nature | unknown",
  "film_theme": "sci_fi | adventure | family | comedy | action | cooking | robot | animal | unknown",
  "search_query": "clear English semantic search query"
}}

Rules:
- Translate any language to English.
- If user asks for 3D assets, models, resources, characters, objects, cities, vehicles, buildings, animals, robots → asset.
- If user asks for movies, films, videos, cinematic stories, or watchable content → film.
- Children, kids, boys, girls, human characters → humanoid_character.
- Return ONLY JSON.

User message:
"{message}"
"""

    response = client.responses.create(
        model="gpt-5.4",
        input=prompt,
        temperature=0
    )

    try:
        data = json.loads(response.output_text.strip())
    except Exception:
        return {
            "result_type": "unknown",
            "asset_type": "unknown",
            "film_theme": "unknown",
            "search_query": message
        }

    return {
        "result_type": data.get("result_type", "unknown"),
        "asset_type": data.get("asset_type", "unknown"),
        "film_theme": data.get("film_theme", "unknown"),
        "search_query": data.get("search_query", message)
    }


def force_correct_result_type(message: str, result_type: str) -> str:
    msg = message.lower()

    asset_words = [
        "asset", "assets",
        "اسيت", "اسيتس", "أسيت", "أسيتس",
        "است", "استس", "اسيتش", "استيش",
        "مودل", "موديل", "مجسم", "مجسمات",
        "3d", "glb", "gltf",
        "شخصية", "شخصيات", "ولد", "اولاد", "أولاد", "اطفال", "أطفال",
        "روبوت", "درون", "مدينة", "مبنى", "سيارة", "حيوان"
    ]

    film_words = [
        "film", "films", "movie", "movies", "video", "videos",
        "فيلم", "افلام", "أفلام", "فيديو", "مشاهدة"
    ]

    if any(word in msg for word in asset_words):
        return "asset"

    if any(word in msg for word in film_words):
        return "film"

    return result_type


def build_tags_text(tags):
    if tags is None:
        return ""

    if isinstance(tags, list):
        return ", ".join(str(tag) for tag in tags)

    return str(tags)


def extract_indexes(text: str, max_len: int):
    text = text.strip()

    if text.upper() == "NONE":
        return []

    numbers = re.findall(r"\d+", text)
    indexes = []

    for n in numbers:
        i = int(n) - 1
        if 0 <= i < max_len and i not in indexes:
            indexes.append(i)

    return indexes


def ai_rerank_assets(message: str, rows):
    if not rows:
        return []

    items_text = ""

    for i, row in enumerate(rows):
        name, category, description, tags, similarity = row
        tags_text = build_tags_text(tags)

        items_text += f"""
{i + 1}.
name: {name}
category: {category}
description: {description}
tags: {tags_text}
similarity: {round(similarity * 100, 1)}%
"""

    prompt = f"""
User request:
"{message}"

You are selecting 3D assets from a marketplace.

Choose ONLY assets that truly match the user's request.

Use ALL fields:
- name
- category
- description
- tags
- similarity

Very important rules:
- If user asks for children, kids, boys, girls, or اولاد / اطفال:
  choose human child/character assets only.
  Good matches include tags like child, human, character.
  Do NOT choose monsters, cities, environments, buildings, robots, vehicles, drones, or animals.
- If user asks for animals:
  choose animal assets only.
- If user asks for robots:
  choose robot assets only.
- If user asks for cities/environments:
  choose environment/city assets only.
- If user asks for vehicles:
  choose vehicle assets only.
- Do not select unrelated items even if similarity is high.

Return ONLY item numbers separated by commas.
If none match, return NONE.

Assets:
{items_text}
"""

    response = client.responses.create(
        model="gpt-5.4",
        input=prompt,
        temperature=0
    )

    result = response.output_text.strip()
    indexes = extract_indexes(result, len(rows))

    return [rows[i] for i in indexes]


def ai_rerank_films(message: str, rows):
    if not rows:
        return []

    items_text = ""

    for i, row in enumerate(rows):
        title, category, description, tags, similarity = row
        tags_text = build_tags_text(tags)

        items_text += f"""
{i + 1}.
title: {title}
category: {category}
description: {description}
tags: {tags_text}
similarity: {round(similarity * 100, 1)}%
"""

    prompt = f"""
User request:
"{message}"

You are selecting films from a cinematic platform.

Choose ONLY films that truly match the user's request.

Use ALL fields:
- title
- category
- description
- tags
- similarity

Rules:
- If user asks for cooking, chef, food, rat, or mouse → choose cooking/chef/rat related films.
- If user asks for robots, future, space, sci-fi → choose sci-fi/robot films.
- If user asks for family or animation → choose animated/family films.
- Do not select unrelated films even if similarity is high.

Return ONLY item numbers separated by commas.
If none match, return NONE.

Films:
{items_text}
"""

    response = client.responses.create(
        model="gpt-5.4",
        input=prompt,
        temperature=0
    )

    result = response.output_text.strip()
    indexes = extract_indexes(result, len(rows))

    return [rows[i] for i in indexes]


def format_asset_results(rows):
    if not rows:
        return None

    reply = "🧊 أقرب الأسيتس المناسبة لطلبك:\n\n"

    for name, category, description, tags, similarity in rows[:5]:
        reply += f"- {name} ({round(similarity * 100, 1)}%)\n"

    return reply


def format_film_results(rows):
    if not rows:
        return None

    reply = "🎬 أقرب الأفلام المناسبة لطلبك:\n\n"

    for title, category, description, tags, similarity in rows[:5]:
        reply += f"- {title} ({round(similarity * 100, 1)}%)\n"

    return reply


def handle_similar(message: str, is_authenticated: bool = False) -> str:
    if not is_authenticated:
        return "ميزة البحث عن عناصر مشابهة متاحة بعد تسجيل الدخول."

    intent = analyze_user_request(message)

    result_type = intent["result_type"]
    search_query = intent["search_query"]

    result_type = force_correct_result_type(message, result_type)

    if result_type == "unknown":
        return "مش واضح إذا بدك أفلام ولا أسيتس."

    query_embedding = create_embedding(search_query)
    pg_vector = embedding_to_pgvector(query_embedding)

    conn = get_connection()
    cur = conn.cursor()

    try:
        if result_type == "asset":
            query = """
                SELECT
                    name,
                    category,
                    description,
                    tags,
                    1 - (embedding <=> %s::vector) AS similarity
                FROM assets
                WHERE embedding IS NOT NULL
                AND status = 'approved'
                ORDER BY embedding <=> %s::vector
                LIMIT 20;
            """

            cur.execute(query, (pg_vector, pg_vector))
            rows = cur.fetchall()

            selected_rows = ai_rerank_assets(message, rows)

            if not selected_rows:
                return "ما لقيت أسيتس مناسبة لطلبك."

            return format_asset_results(selected_rows)

        if result_type == "film":
            query = """
                SELECT
                    title,
                    category,
                    description,
                    tags,
                    1 - (embedding <=> %s::vector) AS similarity
                FROM films
                WHERE embedding IS NOT NULL
                AND status = 'approved'
                ORDER BY embedding <=> %s::vector
                LIMIT 20;
            """

            cur.execute(query, (pg_vector, pg_vector))
            rows = cur.fetchall()

            selected_rows = ai_rerank_films(message, rows)

            if not selected_rows:
                return "ما لقيت أفلام مناسبة لطلبك."

            return format_film_results(selected_rows)

    except Exception as e:
        return f"خطأ: {str(e)}"

    finally:
        cur.close()
        conn.close()