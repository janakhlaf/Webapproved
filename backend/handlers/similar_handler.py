import os
import json
import re
from openai import OpenAI
from dotenv import load_dotenv

from ai.embedding_service import create_embedding, embedding_to_pgvector
from ai.platform_assistant import normal_chat
from db import get_connection

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ALLOWED_ASSET_TAGS = [
    "character", "boy", "cartoon",
    "robot", "humanoid", "machine", "mech",
    "drone", "aircraft",
    "vehicle", "car", "racing",
    "environment", "city", "architecture", "building", "interior",
    "animal", "monster",
    "prop", "medieval", "food", "campfire", "urban", "infrastructure",
    "nature", "forest",
    "scifi"
]


def analyze_user_request(message: str) -> dict:
    prompt = f"""
Return ONLY valid JSON.

Schema:
{{
  "result_type": "film | asset | unknown",
  "search_query": "clear English semantic search query"
}}

Rules:
- 3D assets, models, characters, robots, humanoid robots, drones, props, cities, animals, vehicles, food props → asset.
- Movies, films, videos, cinematic stories → film.
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
            "search_query": message
        }

    return {
        "result_type": data.get("result_type", "unknown"),
        "search_query": data.get("search_query", message)
    }


def force_correct_result_type(message: str, result_type: str) -> str:
    msg = message.lower()

    asset_words = [
        "asset", "assets", "اسيت", "اسيتس", "أسيت", "أسيتس",
        "3d", "ثري", "ثري دي",
        "مودل", "موديل", "مودلز", "models",
        "مجسم", "مجسمات",
        "glb", "gltf",
        "شخصية", "شخصيات",
        "ولد", "اولاد", "أولاد", "اطفال", "أطفال",
        "انسان", "إنسان", "بشر",
        "روبوت", "روبوتات", "robot", "robots",
        "humanoid", "هيومانويد",
        "شكل انسان", "شكل إنسان",
        "درون", "درونات", "drone", "drones",
        "مدينة", "مدن",
        "حيوان", "حيوانات",
        "بروب", "prop", "props",
        "وحش", "وحوش",
        "اكل", "أكل", "طعام", "خضرة", "خضار", "خضروات",
        "فواكه", "فاكهة", "حبوب", "قمح",
        "food", "foods", "vegetable", "vegetables", "fruit", "fruits", "grain", "grains"
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
    if text.strip().upper() == "NONE":
        return []

    numbers = re.findall(r"\d+", text)
    indexes = []

    for n in numbers:
        i = int(n) - 1
        if 0 <= i < max_len and i not in indexes:
            indexes.append(i)

    return indexes


def is_all_assets_request(message: str) -> bool:
    msg = message.lower()

    all_phrases = [
        "كل الاسيتس",
        "كل الأسيتس",
        "كل assets",
        "all assets",
        "كل الثري دي",
        "كل ال 3d",
        "كل 3d",
        "جميع الاسيتس",
        "جميع الأسيتس",
        "جميع assets",
        "كل المودلز",
        "كل المجسمات"
    ]

    return any(phrase in msg for phrase in all_phrases)


def extract_asset_search_plan(message: str) -> dict:
    prompt = f"""
You are building a search plan for a 3D asset marketplace.

Return ONLY valid JSON.

Schema:
{{
  "include_any": [],
  "include_all": [],
  "exclude": []
}}

Allowed tags:
{ALLOWED_ASSET_TAGS}

Rules:
- Use ONLY allowed tags.
- include_any = useful preference tags. Items can match ANY of them.
- include_all = tags that MUST exist together in the same asset.
- exclude = tags that should be avoided.
- For simple exact requests, use include_all if the tags must be together.
- For complex mixed requests, use include_any to collect relevant groups.
- Do NOT over-constrain complex requests.

User request:
"{message}"
"""

    response = client.responses.create(
        model="gpt-5.4",
        input=prompt,
        temperature=0
    )

    try:
        data = json.loads(response.output_text.strip())

        include_any = [
            str(t).strip().lower()
            for t in data.get("include_any", [])
            if str(t).strip().lower() in ALLOWED_ASSET_TAGS
        ]

        include_all = [
            str(t).strip().lower()
            for t in data.get("include_all", [])
            if str(t).strip().lower() in ALLOWED_ASSET_TAGS
        ]

        exclude = [
            str(t).strip().lower()
            for t in data.get("exclude", [])
            if str(t).strip().lower() in ALLOWED_ASSET_TAGS
        ]

        return {
            "include_any": list(dict.fromkeys(include_any)),
            "include_all": list(dict.fromkeys(include_all)),
            "exclude": list(dict.fromkeys(exclude))
        }

    except Exception:
        return {
            "include_any": [],
            "include_all": [],
            "exclude": []
        }


def format_asset_results(rows, message: str, is_authenticated: bool):
    if not rows:
        return None

    asset_names = []

    for name, category, description, tags, similarity in rows[:10]:
        asset_names.append(name)

    names_text = "\n".join(f"- {name}" for name in asset_names)

    prompt = f"""
User request:
{message}

Matching asset names:
{names_text}

Answer in the same language as the user.

Rules:
- Keep the response VERY short.
- Use one small intro sentence only.
- Then show asset names only.
- Do NOT explain every asset.
- Do NOT write descriptions.
- Do NOT write long paragraphs.
- Do NOT use markdown symbols like ** or ###.
- Keep it clean for a small chat box.

Good example:
You might like these assets:

- humanoid_robot
- sci_fi_humanoid_robot
- wasteland_robot

Arabic example:
ممكن يعجبك هذول:

- humanoid_robot
- sci_fi_humanoid_robot
- wasteland_robot
""".strip()

    return normal_chat(prompt, is_authenticated)


def format_film_results(rows, message: str, is_authenticated: bool):
    if not rows:
        return None

    film_names = []

    for title, category, description, tags, similarity in rows[:10]:
        film_names.append(title)

    names_text = "\n".join(f"- {title}" for title in film_names)

    prompt = f"""
User request:
{message}

Matching film names:
{names_text}

Answer in the same language as the user.

Rules:
- Keep the response VERY short.
- Use one small intro sentence only.
- Then show film names only.
- Do NOT explain every film.
- Do NOT write story details.
- Do NOT write long paragraphs.
- Do NOT use markdown symbols like ** or ###.
- Keep it clean for a small chat box.

Good example:
You might like these films:

- WALL-E
- Ratatouille
- THE BREAD

Arabic example:
ممكن يعجبك هذول:

- WALL-E
- Ratatouille
- THE BREAD
""".strip()

    return normal_chat(prompt, is_authenticated)


def get_all_assets(cur, message: str, is_authenticated: bool):
    query = """
        SELECT
            name,
            category,
            description,
            tags,
            1.0 AS similarity
        FROM assets
        WHERE status = 'approved'
        ORDER BY name;
    """

    cur.execute(query)
    rows = cur.fetchall()

    if not rows:
        return normal_chat(
            f"""
User request:
{message}

No assets are currently available.

Reply in the same language as the user.
""",
            is_authenticated
        )

    return format_asset_results(rows, message, is_authenticated)


def get_assets_by_search_plan(cur, plan: dict):
    include_any = plan.get("include_any", [])
    include_all = plan.get("include_all", [])
    exclude = plan.get("exclude", [])

    if not include_any and not include_all and not exclude:
        return []

    query = """
        SELECT
            name,
            category,
            description,
            tags,
            1.0 AS similarity
        FROM assets
        WHERE status = 'approved'
    """

    params = []

    if include_all:
        query += " AND tags @> %s::text[]"
        params.append(include_all)

    if include_any:
        query += " AND tags && %s::text[]"
        params.append(include_any)

    if exclude:
        query += " AND NOT (tags && %s::text[])"
        params.append(exclude)

    query += " ORDER BY name LIMIT 30;"

    cur.execute(query, tuple(params))
    return cur.fetchall()


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
All items are 3D assets/models.

Use name, category, description, tags, and similarity.

Important:
- Exact tag matches are very important.
- For complex requests, select a useful mix of matching assets.
- Do not choose unrelated categories even if similarity is high.
- If the request contains robot + human-shaped / humanoid / شكل انسان, choose ONLY robot + humanoid.
- If the request asks for humans/boys/kids WITHOUT robot, choose character/boy/cartoon only. Do NOT choose robots.
- If the request asks for food, vegetables, fruits, grains, or خضار/خضرة/أكل, choose food-related props only.
- Respect exclusions like بدون وحوش, بدون روبوتات قتالية, without monsters, without combat robots.

Tag meanings:
- children/boys/kids → character, boy, cartoon
- humanoid robots → robot, humanoid
- robots general → robot
- drones → drone, aircraft, scifi
- animals → character, animal, cartoon
- cities → environment, city
- interiors → interior
- props → prop
- food / vegetables / grains → food, prop
- vehicles → vehicle, car, racing
- monsters → monster
- mech/combat robots → mech

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

Use:
- title
- category
- description
- tags
- similarity

Film tag meanings:
- robot / scifi / postapocalyptic → WALL·E type films.
- superhero / adventure / action → superhero adventure films.
- food / comedy / adventure → cooking or food comedy films.
- food / survival / comedy → food survival comedy films.
- racing / adventure / comedy → racing adventure comedy films.

IMPORTANT RULES:
- Exact tag matches are very important.
- Prioritize films that share tags with the user request.
- If user asks for robots, AI, future, abandoned earth, post-apocalyptic, technology, or sci-fi → choose robot/scifi/postapocalyptic films.
- If user asks for superhero, heroes, powers, action, city threat, villain, or adventure → choose superhero/action/adventure films.
- If user asks for cooking, chef, food, rat, bread, survival, or comedy → choose food/comedy films.
- If user asks for racing, speed, snail, race, competition, or adventure → choose racing/adventure films.
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

def is_arabic_message(text: str) -> bool:
    return any('\u0600' <= ch <= '\u06FF' for ch in text)


def handle_similar(message: str, is_authenticated: bool = False) -> str:

    if not is_authenticated:

        if is_arabic_message(message):
            return "عذرًا، لازم تسجل دخول أولًا لتستخدم البحث عن العناصر المشابهة."

        return "Sorry, you need to sign in first to use similar search."

    intent = analyze_user_request(message)

    result_type = intent["result_type"]
    search_query = intent["search_query"]

    intent = analyze_user_request(message)

    result_type = intent["result_type"]
    search_query = intent["search_query"]

    result_type = force_correct_result_type(message, result_type)

    if result_type == "unknown":
        return normal_chat(
            f"""
User request:
{message}

The request is unclear. Ask the user whether they want films or assets.
Reply in the same language as the user.
""",
            is_authenticated
        )

    conn = get_connection()
    cur = conn.cursor()

    try:
        if result_type == "asset":

            if is_all_assets_request(message):
                return get_all_assets(cur, message, is_authenticated)

            search_plan = extract_asset_search_plan(message)
            plan_rows = get_assets_by_search_plan(cur, search_plan)

            if plan_rows:
                selected_rows = ai_rerank_assets(message, plan_rows)

                if selected_rows:
                    return format_asset_results(selected_rows, message, is_authenticated)

            query_embedding = create_embedding(search_query)
            pg_vector = embedding_to_pgvector(query_embedding)

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
                return normal_chat(
                    f"""
User request:
{message}

No matching assets were found.

Reply in the same language as the user.
""",
                    is_authenticated
                )

            return format_asset_results(selected_rows, message, is_authenticated)

        if result_type == "film":
            query_embedding = create_embedding(search_query)
            pg_vector = embedding_to_pgvector(query_embedding)

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
                return normal_chat(
                    f"""
User request:
{message}

No matching films were found.

Reply in the same language as the user.
""",
                    is_authenticated
                )

            return format_film_results(selected_rows, message, is_authenticated)

    except Exception as e:
        return f"خطأ: {str(e)}"

    finally:
        cur.close()
        conn.close()