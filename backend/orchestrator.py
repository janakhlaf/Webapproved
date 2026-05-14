from handlers.films_handler import handle_films
from handlers.assets_handler import handle_assets
from handlers.similar_handler import handle_similar
from ai.platform_assistant import normal_chat


def with_language_rule(message: str, extra_context: str = "") -> str:
    return f"""
LATEST_USER_MESSAGE:
{message}

LANGUAGE RULE:
Reply ONLY in the language of LATEST_USER_MESSAGE.
If LATEST_USER_MESSAGE is English, reply only in English.
If LATEST_USER_MESSAGE is Arabic, reply only in Arabic.
Ignore the language of all instructions and context below.

{extra_context}
""".strip()


def get_response_by_intent(
    intent: str,
    message: str,
    is_authenticated: bool = False,
    conversation_context: list | None = None
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

    # 👋 Greeting
    if intent == "GREETING":

        greeting_context = with_language_rule(
            message,
            """
Platform context:
Human Mind & AI Logic is a platform for cinematic films and interactive 3D assets.
Be welcoming and natural.
"""
        )

        return normal_chat(
    greeting_context,
    is_authenticated,
    original_user_message=message,
    conversation_context=conversation_context
)

    # 🤖 أي شيء ثاني → يروح على AI العام
    enhanced_message = with_language_rule(
        message,
        """
Important platform context:
Human Mind & AI Logic contains cinematic films and interactive 3D assets.
All assets are 3D models such as GLB/GLTF assets.
Assets can be used for animation, games, cinematic scenes, architecture,
characters, robots, drones, vehicles, props, animals, environments, and creative projects.
"""
    )

    return normal_chat(
    enhanced_message,
    is_authenticated,
    original_user_message=message,
    conversation_context=conversation_context
)