import os
import json
import re
import random

from openai import OpenAI
from dotenv import load_dotenv

from ai.embedding_service import create_embedding, embedding_to_pgvector
from db import get_connection

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
SEARCH_STATE = {}

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
    msg = message.lower()

    if any(word in msg for word in [
        "اسيت",
        "اسيتس",
        "asset",
        "assets",
        "3d",
        "مودلز",
        "مجسمات"
    ]):
        return {
            "result_type": "asset",
            "search_query": ""
        }

    if any(word in msg for word in [
        "فيلم",
        "افلام",
        "أفلام",
        "film",
        "films",
        "movie",
        "movies"
    ]):
        return {
            "result_type": "film",
            "search_query": ""
        }
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

def is_arabic_message(text: str) -> bool:
    return any('\u0600' <= ch <= '\u06FF' for ch in text)
def format_asset_results(rows, message: str, is_authenticated: bool):
    if not rows:
        return None

    names = []
    
    for name, category, description, tags, similarity in rows[:10]:
        names.append(name)

    if is_arabic_message(message):
        response = "ممكن يعجبك هذول:\n\n"
    else:
        response = "You might like these assets:\n\n"

    for name in names:
        response += f"- {name}\n"

    return response.strip()


def format_film_results(rows, message: str, is_authenticated: bool):
    if not rows:
        return None

    names = []

    for title, category, description, tags, similarity in rows[:10]:
        names.append(title)

    if is_arabic_message(message):
        response = "ممكن يعجبك هذول:\n\n"
    else:
        response = "You might like these films:\n\n"

    for title in names:
        response += f"- {title}\n"

    return response.strip()


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
        if is_arabic_message(message):
            return "ما في Assets متاحة داخل الموقع حاليًا."
        return "No assets are currently available on the platform."

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

    if not indexes:
        return rows

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

    if not indexes:
        return rows

    return [rows[i] for i in indexes]

def is_arabic_message(text: str) -> bool:
    return any('\u0600' <= ch <= '\u06FF' for ch in text)



def dynamic_no_more_results(message, result_type):
    if is_arabic_message(message):

        if result_type == "film":
            responses = [
                "عرضت لك كل الأفلام المطابقة الموجودة حالياً داخل الموقع.",
                "حالياً ما في أفلام إضافية مطابقة داخل الموقع.",
                "هاي كانت جميع الأفلام المطابقة المتوفرة حالياً."
            ]
        else:
            responses = [
                "عرضت لك كل الأصول المطابقة الموجودة حالياً داخل الموقع.",
                "حالياً ما في أصول إضافية مطابقة داخل الموقع.",
                "هاي كانت جميع الأصول المطابقة المتوفرة حالياً."
            ]

    else:

        if result_type == "film":
            responses = [
                "I already showed all matching films available on the platform.",
                "No additional matching films are currently available.",
                "These are all matching films available right now."
            ]
        else:
            responses = [
                "I already showed all matching assets available on the platform.",
                "No additional matching assets are currently available.",
                "These are all matching assets available right now."
            ]

    return random.choice(responses)
def detect_last_result_type(conversation_context):
    if not conversation_context:
        return None

    last_text = ""

    for item in conversation_context[-8:]:
        if item.get("role") == "assistant":
            last_text += " " + item.get("content", "").lower()

    film_words = ["فيلم", "أفلام", "افلام", "film", "films", "movie", "movies"]
    asset_words = ["اسيت", "اسيتس", "أصول", "اصول", "3d", "asset", "assets", "model", "models", "glb", "gltf"]

    if any(word in last_text for word in film_words):
        return "film"

    if any(word in last_text for word in asset_words):
        return "asset"

    return None
def handle_similar(
    message: str,
    is_authenticated: bool = False,
    conversation_context: list | None = None,
    session_id=None
) -> str:
 

    if not is_authenticated:
        if is_arabic_message(message):
            return "عذرًا، لازم تسجل دخول أولًا لتستخدم البحث عن العناصر المشابهة."
        return "Sorry, you need to sign in first to use similar search."

    exclude_names = []

    follow_up_words = [
        "شو في كمان",
        "في كمان",
        "كمان",
        "غيرهم",
        "غير هيك",
        "more",
        "anything else",
        "else"
    ]

    is_follow_up = any(word in message.lower() for word in follow_up_words)
   

    if conversation_context and is_follow_up:
        last_real_user_message = None
        last_assistant_reply = None

        for item in reversed(conversation_context):
            content = item["content"]

            if item["role"] == "assistant" and last_assistant_reply is None:
                last_assistant_reply = content

            if item["role"] == "user" and not any(word in content.lower() for word in follow_up_words):
                last_real_user_message = content
                break

        if last_assistant_reply:

            names = re.findall(
                r'"([^"]+)"|-\s*([A-Za-z0-9 _.-]+)',
                last_assistant_reply
            )

            for item in names:

                name = item[0] or item[1]

                name = name.strip().lower()

                if name:
                    exclude_names.append(name)

            if last_real_user_message:
                message = last_real_user_message

    intent = analyze_user_request(message)

    result_type = intent["result_type"]
    search_query = intent["search_query"]

    if result_type == "unknown":
        last_type = detect_last_result_type(conversation_context)

        if last_type == "film":
            result_type = "film"

        elif last_type == "asset":
            result_type = "asset"

        else:
            if is_arabic_message(message):
                return "ما قدرت أحدد المطلوب من آخر محادثة. جرّب اكتب: هات أفلام ثانية، أو هات أصول 3D ثانية."

            return "I could not detect the request from the last conversation. Try: show me more films, or show me more 3D assets."
    conn = get_connection()
    cur = conn.cursor()

    try:
        if result_type == "asset":

            if is_all_assets_request(message):
                return get_all_assets(cur, message, is_authenticated)
            

            search_plan = extract_asset_search_plan(message)
            plan_rows = get_assets_by_search_plan(cur, search_plan)

            if plan_rows:
              

                key = session_id or "guest"
               
               
               

                state = SEARCH_STATE.get(key, {
                    "type": None,
                    "shown_films": set(),
                    "shown_assets": set()
                })
                

                if is_follow_up:
                    selected_rows = [
                        row for row in plan_rows
                        if row[0].lower().strip() not in state["shown_assets"]
                    ]
                else:
                    selected_rows = ai_rerank_assets(message, plan_rows)
                    if not selected_rows:
                        selected_rows = plan_rows
                    state["shown_assets"] = set()

                selected_rows = selected_rows[:3]

                if not selected_rows:
                    if is_arabic_message(message):
                        return "لا توجد نتائج إضافية حالياً، تم عرض جميع الأصول المتاحة."
                    return "No additional assets are available right now."

                state["shown_assets"].update(
                    row[0].lower().strip() for row in selected_rows
                )

                state["type"] = "asset"
                SEARCH_STATE[key] = state
              

                if selected_rows:
                    return format_asset_results(
                        selected_rows,
                        message,
                        is_authenticated
                    )

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

            

            key = session_id or "guest"
            

            state = SEARCH_STATE.get(key, {
                "type": None,
                "shown_films": set(),
                "shown_assets": set()
            })
           

            if is_follow_up:
                selected_rows = [
                    row for row in rows
                    if row[0].lower().strip() not in state["shown_assets"]
                ]
            else:
                selected_rows = ai_rerank_assets(message, rows)
                if not selected_rows:
                    selected_rows = rows
                state["shown_assets"] = set()
            selected_rows = selected_rows[:3]

            if not selected_rows:
                if is_arabic_message(message):
                    return "لا توجد نتائج إضافية حالياً، تم عرض جميع الأصول المتاحة."
                return "No additional assets are available right now."

            state["shown_assets"].update(
                row[0].lower().strip() for row in selected_rows
            )

            state["type"] = "asset"
            SEARCH_STATE[key] = state
           

            if not selected_rows:
                if is_follow_up:
                    if is_arabic_message(message):
                        return "لا توجد نتائج إضافية حالياً، تم عرض جميع العناصر المطابقة."
                    return "No additional matching results were found on the platform."

                if is_arabic_message(message):
                   return dynamic_no_more_results(message, "asset")
                return dynamic_no_more_results(message, "asset")

            return format_asset_results(
                selected_rows,
                message,
                is_authenticated
            )

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

            key = session_id or "guest"
           
            state = SEARCH_STATE.get(key, {
                "type": None,
                "shown_films": set(),
                "shown_assets": set()
            })
           

            if is_follow_up:
                selected_rows = [
                    row for row in rows
                    if row[0].lower().strip() not in state["shown_films"]
                ]
            else:
                selected_rows = ai_rerank_films(message, rows)
                if not selected_rows:
                    selected_rows = rows
                state["shown_films"] = set()

            selected_rows = selected_rows[:3]

            if not selected_rows:
                if is_arabic_message(message):
                    return "لا توجد نتائج إضافية حالياً، تم عرض جميع الأفلام المتاحة."
                return "No additional films are available right now."

            state["shown_films"].update(
                row[0].lower().strip() for row in selected_rows
            )

            state["type"] = "film"
            SEARCH_STATE[key] = state
           

            if not selected_rows:

                if is_follow_up:
                    if is_arabic_message(message):
                        return "لا توجد نتائج إضافية حالياً، تم عرض جميع الأفلام المطابقة."
                    return "No additional matching films were found."

                return dynamic_no_more_results(message, "film")
                            
            return format_film_results(
                selected_rows,
                message,
                is_authenticated
            )

    except Exception as e:
        return f"خطأ: {str(e)}"

    finally:
        cur.close()
        conn.close()