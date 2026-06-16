import re
from db import get_connection
from ai.platform_assistant import normal_chat


STOP_WORDS = {
    "tell", "me", "about", "show", "give", "find", "search",
    "film", "films", "movie", "movies", "cinema",
    "the", "a", "an", "of", "for", "in", "on",

    "احكيلي", "احكي", "اشرحلي", "اعطيني", "هات", "عن", "على",
    "شو", "ايش", "اشي", "ال", "بدي", "الموجودة", "عندي",
    "في", "بالموقع", "بالصفحة", "الافلام", "الأفلام", "فيلم"
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

        keywords.append(token)

    final = []
    seen = set()

    for keyword in keywords:
        if keyword not in seen:
            seen.add(keyword)
            final.append(keyword)

    return final


def is_general_films_question(message: str) -> bool:
    text = message.lower()

    general_phrases = [
        "films page",
        "movies page",
        "what films",
        "show me films",
        "available films",
        "all films",
        "صفحة الافلام",
        "صفحة الأفلام",
        "الافلام الموجودة",
        "الأفلام الموجودة",
        "شو عندي",
        "شو في",
        "احكيلي عن الافلام",
        "احكيلي عن الأفلام",
        "اعطيني افلام",
        "اعطيني أفلام",
        "هات افلام",
        "هات أفلام",
        "افلام",
        "أفلام",
        "فيلم",
    ]

    return any(phrase in text for phrase in general_phrases)


def build_films_context(rows) -> str:
    films_context = ""

    for row in rows:
        title, description, category, duration = row

        films_context += f"""
Film title: {title}
Description: {description}
Category: {category}
Duration: {duration}
"""

    return films_context


def handle_films(message: str, is_authenticated: bool = False) -> str:
    try:
        conn = get_connection()
        cur = conn.cursor()

        keywords = extract_keywords(message)
        rows = []
        mode = "general"
        is_general = is_general_films_question(message)

        if keywords and not is_general:
            conditions = []
            values = []

            for keyword in keywords:
                pattern = f"%{keyword}%"

                conditions.append("""
                    (
                        title ILIKE %s
                        OR description ILIKE %s
                        OR category ILIKE %s
                    )
                """)

                values.extend([pattern, pattern, pattern])

            query = f"""
                SELECT
                    title,
                    description,
                    category,
                    duration
                FROM films
                WHERE status = 'approved'
                AND ({' OR '.join(conditions)})
                ORDER BY
                    CASE
                        WHEN title ILIKE %s THEN 0
                        ELSE 1
                    END,
                    title
                LIMIT 3;
            """

            values.append(f"%{keywords[0]}%")

            cur.execute(query, values)
            rows = cur.fetchall()
            mode = "specific"

        if not rows and is_general:
            cur.execute("""
                SELECT
                    title,
                    description,
                    category,
                    duration
                FROM films
                WHERE status = 'approved'
                ORDER BY id DESC
                LIMIT 8;
            """)

            rows = cur.fetchall()
            mode = "general"

        cur.close()
        conn.close()

    except Exception as e:
        print("FILMS_HANDLER_ERROR:", e)
        return "Sorry, I couldn't load the films right now. Please try again."

    if not rows:
        return normal_chat(
            f"""
User request:
{message}

No matching film was found in the real database.

Rules:
- Reply in the same language as the user.
- Say naturally that no matching film was found.
- Suggest trying another keyword or browsing the films page.
- Do not invent films.
""".strip(),
            is_authenticated
        )

    films_context = build_films_context(rows)

    if is_authenticated:
        auth_rules = """
The user is signed in.
If the question is about a specific film, explain the film clearly using its description.
Add a short cinematic or emotional touch naturally.
You may encourage the user to watch the film, explore details, or purchase it.
If the question is general, briefly mention different film styles available on the platform and give a few examples.
Keep the answer concise and natural.
"""
    else:
        auth_rules = """
The user is not signed in.
If the question is about a specific film, give a limited short explanation based mainly on its description.
If the question is general, briefly say the films page contains different cinematic films and mention a few examples.
Do not give deep recommendations.
Tell the user to sign in for more details and personalized suggestions.
"""

    prompt = f"""
User request:
{message}

Request mode:
{mode}

Matching films from the real database:
{films_context}

Important:
The films listed above are real films from the platform.
Do NOT say you do not know them.
Do NOT explain the dictionary meaning of film names.

Rules:
{auth_rules}

Response rules:
- Reply in the same language as the user.
- Use only the films provided above.
- Do not expose raw database fields.
- Do not list too many films.
- Be natural, smart, and concise.
""".strip()

    return normal_chat(
    prompt,
    is_authenticated,
    original_user_message=message
)