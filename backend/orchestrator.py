from handlers.films_handler import handle_films
from handlers.assets_handler import handle_assets
from handlers.similar_handler import handle_similar
from ai.platform_assistant import normal_chat


def get_response_by_intent(intent: str, message: str, is_authenticated: bool = False) -> str:
    
    # 🎬 أفلام
    if intent == "FILM_QUERY":
        return handle_films(message, is_authenticated)

    # 🧊 أصول 3D
    if intent == "ASSET_QUERY":
        return handle_assets(message, is_authenticated)

    # 🔥 مشابه
    if intent == "SIMILAR_REQUEST":
        return handle_similar(message, is_authenticated)

    # 👋 تحية
    if intent == "GREETING":
        if is_authenticated:
            return (
                "أهلًا وسهلًا 👋 بما إنك مسجل دخول، بقدر أساعدك بتفاصيل أوسع عن الأفلام، "
                "الأصول، الاقتراحات، والاستخدامات داخل منصة Human Mind & AI Logic."
            )
        return "أهلًا وسهلًا 👋 كيف بقدر أساعدك في منصة Human Mind & AI Logic؟"

    # 🤖 أي شيء ثاني → يروح على AI
    return normal_chat(message, is_authenticated)