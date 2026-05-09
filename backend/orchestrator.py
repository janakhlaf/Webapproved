from handlers.films_handler import handle_films
from handlers.assets_handler import handle_assets
from handlers.similar_handler import handle_similar
from ai.platform_assistant import normal_chat


def get_response_by_intent(
    intent: str,
    message: str,
    is_authenticated: bool = False
) -> str:

    # 🎬 أفلام
    if intent == "FILM_QUERY":
        return handle_films(message, is_authenticated)

    # 🧊 أصول 3D
    if intent == "ASSET_QUERY":
        return handle_assets(message, is_authenticated)

    # 🔥 بحث مشابه / اقتراحات
    # مهم: لا نضيف platform context هنا
    # لأنه يخرب فهم الطلب ويخلي similar_handler يقرأ كلمات مثل all/assets/robots/drones/cities
    if intent == "SIMILAR_REQUEST":
        return handle_similar(message, is_authenticated)

    # 👋 تحية
    if intent == "GREETING":
        if is_authenticated:
            return (
                "أهلًا وسهلًا 👋 بما إنك مسجل دخول، بقدر أساعدك بتفاصيل أوسع عن "
                "الأفلام، أصول 3D، الاقتراحات، والاستخدامات داخل منصة Human Mind & AI Logic."
            )

        return (
            "أهلًا وسهلًا 👋 كيف بقدر أساعدك في منصة Human Mind & AI Logic؟ "
            "عنا أفلام وأصول 3D تفاعلية تقدر تستعرضها داخل المنصة."
        )

    # 🤖 أي شيء ثاني → يروح على AI العام
    enhanced_message = f"""
User request:
{message}

Important platform context:
Human Mind & AI Logic contains cinematic films and interactive 3D assets.
All assets are 3D models such as GLB/GLTF assets.
Assets can be used for animation, games, cinematic scenes, architecture,
characters, robots, drones, vehicles, props, animals, environments, and creative projects.
""".strip()

    return normal_chat(enhanced_message, is_authenticated)