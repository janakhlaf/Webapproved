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

Your job:
Classify the user's message into EXACTLY ONE intent.

--------------------------------
AVAILABLE INTENTS
--------------------------------

{", ".join(INTENTS)}

--------------------------------
IMPORTANT PLATFORM CONTEXT
--------------------------------

Human Mind & AI Logic contains:
- cinematic films
- interactive 3D assets/models

All assets are 3D assets such as:
- GLB models
- GLTF models
- characters
- cartoon boys
- kids
- robots
- humanoids
- drones
- aircraft
- vehicles
- props
- buildings
- architecture
- cities
- environments
- interiors
- animals
- monsters
- sci-fi models

Assets are used in:
- animation
- games
- cinematic scenes
- storytelling
- architecture visualization
- creative 3D projects

--------------------------------
STRICT RULES
--------------------------------

- Return ONLY the intent label.
- No explanation.
- No extra text.
- No punctuation.

--------------------------------
SIMILAR_REQUEST RULES
--------------------------------

If the user asks to:
- find
- suggest
- recommend
- show
- give
- bring
- search
- closest
- related
- matching
- similar

films or assets by:
- theme
- category
- style
- character type
- robot type
- environment
- sci-fi
- city
- adventure
- animation
- drone
- architecture
- cartoon
- monster
- animal
- vehicle
- prop

→ RETURN:
SIMILAR_REQUEST

Examples:
- اعطيني شخصيات
- اعطيني اولاد
- اعطيني اطفال
- اعطيني درونات
- اعطيني روبوتات
- اعطيني مدن
- اعطيني environments
- assets like robots
- similar drones
- cinematic films about AI
- recommend animation films
- give me cartoon assets
- closest robot asset
- مشابه لهذا
- زي هذا
- مثل هذا
- related assets

→ RETURN:
SIMILAR_REQUEST

--------------------------------
ASSET_QUERY RULES
--------------------------------

If the user asks GENERAL questions about:
- assets page
- 3D assets
- GLB
- GLTF
- asset formats
- downloading assets
- previewing assets
- uploading assets
- asset information

→ RETURN:
ASSET_QUERY

--------------------------------
FILM_QUERY RULES
--------------------------------

If the user asks GENERAL questions about:
- films
- movies
- cinematic content
- animation films
- watching films
- downloading films
- film page

→ RETURN:
FILM_QUERY

--------------------------------
OTHER RULES
--------------------------------

- Greeting → GREETING
- Buying → PURCHASE_INTENT
- Cart → CART_ACTION
- Payment → PAYMENT_ACTION
- Library → LIBRARY_ACCESS
- Upload → UPLOAD_ACTION
- Profile → PROFILE_ACTION
- Favorites → FAVORITES_ACTION
- About page → ABOUT_PAGE
- Platform information → PLATFORM_INFO
- Unrelated requests → OUT_OF_SCOPE

--------------------------------
USER MESSAGE
--------------------------------

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