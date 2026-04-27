import os
from openai import OpenAI
from dotenv import load_dotenv

# تحميل .env
load_dotenv()

# إنشاء client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# كل الـ intents تبع مشروعك
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
- If user asks about films → FILM_QUERY
- If about 3D models or assets → ASSET_QUERY
- If asks for similar items → SIMILAR_REQUEST
- If asks about buying → PURCHASE_INTENT
- If about cart → CART_ACTION
- If about profile → PROFILE_ACTION
- If greeting → GREETING
- If unrelated → OUT_OF_SCOPE

User message:
"{message}"
"""

    response = client.responses.create(
        model="gpt-5.4",  # 🔥 هون غيرناه
        input=prompt,
        temperature=0
    )

    intent = response.output_text.strip()

    # fallback حماية
    if intent not in INTENTS:
        return "OUT_OF_SCOPE"

    return intent