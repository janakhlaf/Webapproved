import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

INTENTS = [
    "GREETING",
    "PLATFORM_INFO",
    "FILM_QUERY",
    "ASSET_QUERY",
    "SIMILAR_REQUEST",
    "PURCHASE_INTENT",
    "CART_ACTION",
    "PAYMENT_ACTION",
    "LIBRARY_ACCESS",
    "UPLOAD_ACTION",
    "PROFILE_ACTION",
    "FAVORITES_ACTION",
    "ABOUT_PAGE",
    "OUT_OF_SCOPE",
]


def classify_intent(message: str) -> str:
    prompt = f"""
You are an intent classifier for a platform called Human Mind & AI Logic.

Classify the user's message into exactly ONE of the following intents:

{", ".join(INTENTS)}

Rules:
- Return ONLY the intent label.
- No explanation.

Priority rules:
1. If the user asks to find, recommend, suggest, show, bring, or give films/assets by category, theme, type, description, style, character, robot, environment, adventure, sci-fi, or any similar meaning → SIMILAR_REQUEST.
2. If the user uses words like similar, مشابه, شبه, زي, مثل, قريب من, recommend, suggest, related, matching → SIMILAR_REQUEST.
3. If the user says things like:
   - اعطيني اسيتس تكون Characters
   - هات assets robots
   - بدي اسيتس environment
   - اعطيني أفلام Adventure
   - هات فيلم خيال علمي
   - films like robots
   - assets related to city
   - similar assets
   return SIMILAR_REQUEST.

General rules:
- If user asks general information about films page or film features → FILM_QUERY.
- If user asks general information about 3D assets page or asset features → ASSET_QUERY.
- If asks about buying → PURCHASE_INTENT.
- If about cart → CART_ACTION.
- If about profile → PROFILE_ACTION.
- If greeting → GREETING.
- If unrelated → OUT_OF_SCOPE.

User message:
"{message}"
"""

    response = client.responses.create(
        model="gpt-5.4",
        input=prompt,
        temperature=0
    )

    intent = response.output_text.strip()

    if intent not in INTENTS:
        return "OUT_OF_SCOPE"

    return intent