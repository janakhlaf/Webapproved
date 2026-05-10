import re
from db import get_connection
from ai.platform_assistant import normal_chat


STOP_WORDS = {
    "tell", "me", "about", "show", "give", "find", "search",
    "asset", "assets", "model", "models", "glb", "gltf", "3d",
    "the", "a", "an", "of", "for", "in", "on",

    "احكيلي", "احكي", "اشرحلي", "اعطيني", "هات", "عن", "على",
    "شو", "ايش", "اشي", "ال", "بدي", "الموجودة", "عندي",
    "في", "بالموقع", "بالصفحة", "الاسيتس", "الأصول", "اسيتس", "اسيت"
}


ALIASES = {
    "درون": "drone",
    "درونات": "drone",
    "روبوت": "robot",
    "روبوتات": "robot",
    "ولد": "boy",
    "اولاد": "boy",
    "أولاد": "boy",
    "طفل": "kid",
    "اطفال": "kid",
    "مدينة": "city",
    "مدن": "city",
    "سيارة": "car",
    "سيارات": "car",
    "طبيعة": "nature",
    "حيوان": "animal",
    "حيوانات": "animal",
    "حلزون": "snail",
}


def extract_keywords(message: str) -> list[str]:
    text = message.lower().strip()
    keywords = []

    underscored_names = re.findall(r"[a-z0-9]+(?:_[a-z0-9]+)+", text)
    keywords.extend(underscored_names)

    tokens = re.findall(r"[a-zA-Z0-9_]+|[\u0600-\u06FF]+", text)

    for token in tokens:
        token = token.lower().strip()

        if token in STOP_WORDS:
            continue

        if len(token) < 2:
            continue

        keywords.append(ALIASES.get(token, token))

    final = []
    seen = set()

    for keyword in keywords:
        if keyword not in seen:
            seen.add(keyword)
            final.append(keyword)

    return final


def is_general_assets_question(message: str) -> bool:
    text = message.lower()

    general_phrases = [
        "assets page",
        "asset page",
        "what assets",
        "show me assets",
        "available assets",
        "all assets",
        "صفحة الاسيتس",
        "صفحة الأصول",
        "الاسيتس الموجودة",
        "الأصول الموجودة",
        "شو عندي",
        "شو في",
        "احكيلي عن الاسيتس",
        "احكيلي عن الأصول",
    ]

    return any(phrase in text for phrase in general_phrases)


def build_assets_context(rows) -> str:
    assets_context = ""

    for row in rows:
        name, description, category, price, file_type, tags = row
        tags_text = ", ".join(tags) if isinstance(tags, list) else str(tags or "")

        assets_context += f"""
Asset name: {name}
Description: {description}
Category: {category}
Price: ${price}
File type: {file_type}
Tags: {tags_text}
"""

    return assets_context


def handle_assets(message: str, is_authenticated: bool = False) -> str:
    try:
        conn = get_connection()
        cur = conn.cursor()

        keywords = extract_keywords(message)
        rows = []
        mode = "general"
        is_general = is_general_assets_question(message)

        if keywords and not is_general:
            conditions = []
            values = []

            for keyword in keywords:
                pattern = f"%{keyword}%"
                conditions.append("""
                    (
                        name ILIKE %s
                        OR description ILIKE %s
                        OR category ILIKE %s
                        OR tags::text ILIKE %s
                    )
                """)
                values.extend([pattern, pattern, pattern, pattern])

            query = f"""
                SELECT
                    name,
                    description,
                    category,
                    price,
                    file_type,
                    tags
                FROM assets
                WHERE status = 'approved'
                AND ({' OR '.join(conditions)})
                ORDER BY
                    CASE
                        WHEN name ILIKE %s THEN 0
                        ELSE 1
                    END,
                    name
                LIMIT 3;
            """

            values.append(f"%{keywords[0]}%")
            cur.execute(query, values)
            rows = cur.fetchall()
            mode = "specific"

        if not rows and is_general:
            cur.execute("""
                SELECT
                    name,
                    description,
                    category,
                    price,
                    file_type,
                    tags
                FROM assets
                WHERE status = 'approved'
                ORDER BY id DESC
                LIMIT 8;
            """)
            rows = cur.fetchall()
            mode = "general"

        cur.close()
        conn.close()

    except Exception as e:
        print("ASSETS_HANDLER_ERROR:", e)
        return "Sorry, I couldn't load the assets right now. Please try again."

    if not rows:
        return normal_chat(
            f"""
User request:
{message}

No matching asset was found in the real database.

Rules:
- Reply in the same language as the user.
- Say naturally that no matching asset was found.
- Suggest trying another keyword or browsing the assets page.
- Do not invent assets.
""".strip(),
            is_authenticated
        )

    assets_context = build_assets_context(rows)

    if is_authenticated:
        auth_rules = """
The user is signed in.
If the question is about a specific asset, explain that asset clearly using its description.
Add 1 useful project idea and 1 soft purchase-friendly sentence.
If the question is general, briefly mention that the platform has different asset types and give a few examples from the provided assets.
Keep it concise, not a long report.
"""
    else:
        auth_rules = """
The user is not signed in.
If the question is about a specific asset, give a limited short explanation based mainly on its description.
If the question is general, briefly say the assets page includes a variety of 3D assets and mention a few examples from the provided assets.
Do not give deep usage suggestions.
Tell the user to sign in for more details and smart recommendations.
"""

    prompt = f"""
User request:
{message}

Request mode:
{mode}

Matching assets from the real database:
{assets_context}

Important:
The assets listed above are real assets from the platform.
Do NOT say you do not know them.
Do NOT explain the dictionary meaning of the asset name.
For example, if the asset name is snail_mail, treat it as the 3D asset from the database, not the email phrase.

Rules:
{auth_rules}

Response rules:
- Reply in the same language as the user.
- Use only the assets provided above.
- Do not expose raw database fields.
- Do not list too many assets.
- Be smart, natural, and concise.
""".strip()

    return normal_chat(prompt, is_authenticated)