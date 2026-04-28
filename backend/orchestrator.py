from handlers.films_handler import handle_films
from handlers.assets_handler import handle_assets
from handlers.similar_handler import handle_similar

def get_response_by_intent(intent: str, message: str) -> str:
    if intent == "FILM_QUERY":
        return handle_films(message)

    if intent == "ASSET_QUERY":
        return handle_assets(message)

    if intent == "SIMILAR_REQUEST":
        return handle_similar(message)

    if intent == "GREETING":
        return "أهلًا وسهلًا 👋 كيف بقدر أساعدك في منصة Human Mind & AI Logic؟"

    return "فهمت سؤالك، ولسا بنجهز الرد المناسب لهذا النوع من الطلبات."