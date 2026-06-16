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
    "MORE_RESULTS",
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
def rule_based_intent(message: str) -> str | None:
    text = message.lower().strip()

    text = (
        text.replace("أ", "ا")
            .replace("إ", "ا")
            .replace("آ", "ا")
            .replace("ى", "ي")
            .replace("ة", "ه")
    )

    follow_up_search_words = [
    "شو في كمان",
    "في كمان",
    "كمان",
    "غيرهم",
    "غير هيك"
]

    if any(word in text for word in follow_up_search_words):
     return "MORE_RESULTS"

    has_page = (
        "صفحه" in text
        or "page" in text
        or "تبويب" in text
        or "قسم" in text
    )

    has_film = (
        "فيلم" in text
        or "افلام" in text
        or "films" in text
        or "film" in text
        or "movies" in text
        or "movie" in text
    )

    has_asset = (
        "اسيت" in text
        or "اسيتس" in text
        or "اصول" in text
        or "اصل" in text
        or "assets" in text
        or "asset" in text
        or "3d" in text
        or "ثري دي" in text
    )
    if has_film:
     return "FILM_QUERY"

    if has_asset:
        return "ASSET_QUERY"
    
    if any(word in text for word in follow_up_search_words):
     return "MORE_RESULTS"

    if has_page and has_film:
        return "FILM_QUERY"

    if has_page and has_asset:
        return "ASSET_QUERY"

    return None

def classify_intent(message: str) -> str:
    rule_intent = rule_based_intent(message)

    if rule_intent:
        return rule_intent

    prompt = f"""
You are an intent classifier for Human Mind & AI Logic.

Classify the user's message into EXACTLY ONE intent.

Available intents:
{", ".join(INTENTS)}

Platform context:
- The platform has cinematic films.
- The platform has interactive 3D assets/models.
- Assets include GLB/GLTF models, characters, boys, robots, humanoid robots, drones, vehicles, props, cities, environments, animals, monsters, buildings, and sci-fi models.
- Asset names may be simple words or file-like names such as snail_mail, formula, dog, boy, cartoon_kid, humanoid_robot, drone, or any new uploaded asset name.

Return ONLY the intent label.

High priority:
- If the user asks about a specific asset name/details/explanation → ASSET_QUERY.
- If the user says tell me about / explain / what is / details about / احكيلي عن / اشرحلي عن followed by a possible asset name → ASSET_QUERY.
- Do NOT classify unknown asset names as OUT_OF_SCOPE. The assets handler will search the database.
- SIMILAR_REQUEST is ONLY when the user clearly wants actual recommendations, search results, or lists of films/assets.
- Questions asking about what a page contains, what exists inside a page, how a page works, or what features/pages are available are NOT SIMILAR_REQUEST.
- If the user asks to get/show/give/find/list/recommend/suggest/search specific films or assets themselves → SIMILAR_REQUEST. If the user asks to get/show/give/find/list/recommend/suggest/search specific films or assets → SIMILAR_REQUEST.
- If user asks for all assets, all 3D, كل الاسيتس, كل الثري دي, كل المودلز, كل المجسمات → SIMILAR_REQUEST.
- If user asks for boys, kids, children, humans, robots, humanoid robots, drones, animals, cities, props, monsters, vehicles as results to show/list → SIMILAR_REQUEST.
- If user asks general information about assets page, upload, download, preview, GLB/GLTF → ASSET_QUERY.
- If user asks general information about films page, watching, downloading films → FILM_QUERY.
- If the user asks about what a page/section contains, what is inside it, what exists there, or how to reach/use it, classify by page:
  films page → FILM_QUERY
  assets page → ASSET_QUERY
  profile page → PROFILE_ACTION
  cart page → CART_ACTION
  library page → LIBRARY_ACCESS
  upload page → UPLOAD_ACTION
- Do NOT classify page explanation questions as SIMILAR_REQUEST.
- SIMILAR_REQUEST is only when the user wants actual item recommendations/search results, not page explanation.


Examples for ASSET_QUERY:
- احكيلي عن snail_mail
- احكيلي عن snail mail
- اشرحلي عن formula
- tell me about cartoon_kid
- what is humanoid_robot?
- احكيلي عن الاسيتس الموجودة عندي

Examples for SIMILAR_REQUEST:
- اعطيني اولاد
- اعطيني اطفال
- اعطيني انسان
- اعطيني روبوتات
- اعطيني روبوتات ع شكل انسان
- اعطيني روبوتات على شكل انسان
- اعطيني درونات
- اعطيني حيوانات
- اعطيني مدن
- اعطيني بروبس
- اعطيني كل الاسيتس
- اعطيني كل الثري دي
- اعطيني كل ال 3d
- اعطيني كل المودلز
- اعطيني مجسمات
- similar drones
- assets like robots
- recommend animation films
- هات فيلم خيال علمي

Other:
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
- Unrelated → OUT_OF_SCOPE

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