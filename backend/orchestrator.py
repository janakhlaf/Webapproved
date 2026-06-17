from handlers.films_handler import handle_films
from handlers.assets_handler import handle_assets
from handlers.similar_handler import handle_similar
from ai.platform_assistant import normal_chat
from openai import OpenAI
import os
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


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
def is_contextual_follow_up(
    message: str,
    conversation_context: list | None = None
) -> bool:

    if not conversation_context:
        return False

    context_text = ""

    for item in conversation_context[-6:]:
        context_text += f"{item['role']}: {item['content']}\n"

    prompt = f"""
You are deciding if the user's latest message depends on previous chat context.

Return ONLY:
YES
or
NO

Previous conversation:
{context_text}

Latest user message:
{message}

Return YES if the latest message refers to something already mentioned before.
Return NO if the latest message is a new independent request.
"""

    response = client.responses.create(
        model="gpt-5.4",
        input=prompt,
        temperature=0
    )

    result = response.output_text.strip().upper()

    return result == "YES"


def get_response_by_intent(
    intent,
    message,
    is_authenticated=False,
    conversation_context=None,
    session_id=None
)-> str:
    text = message.lower().strip()

    follow_up_search_words = [
        "شو في كمان",
        "في كمان",
        "كمان",
        "غيرهم",
        "غير هيك",
        "more",
        "anything else",
        "else"
    ]

    if intent in ["SIMILAR_REQUEST", "MORE_RESULTS"] or any(word in text for word in follow_up_search_words):
     return handle_similar(
    message,
    is_authenticated,
    conversation_context,
    session_id
)

    if is_contextual_follow_up(message, conversation_context):
        follow_up_message = with_language_rule(
            message,
                """
    The user is asking a follow-up question based on the previous conversation.
    Use the conversation context to understand what they are referring to.
    Answer clearly based on the previous assistant and user messages.
    """
            )

        return normal_chat(
            follow_up_message,
            is_authenticated,
            original_user_message=message,
            conversation_context=conversation_context
        )

   
    if intent == "FILM_QUERY":
        return handle_films(message, is_authenticated)

  
    if intent == "ASSET_QUERY":
        if any(word in text for word in [
            "اعطيني", "هات", "في", "تتعلق", "يشبه", "شبيه",
            "show", "give", "list", "find", "related", "similar"
        ]):
            return handle_similar(
                message,
                is_authenticated,
                conversation_context,
                session_id
            )

        return handle_assets(message, is_authenticated)

   

   
    if intent == "GREETING":

        greeting_context = with_language_rule(
            message,
            """
Platform context:
voxeli.ai is a platform for cinematic films and interactive 3D assets.
Be welcoming and natural.
"""
        )

        return normal_chat(
    greeting_context,
    is_authenticated,
    original_user_message=message,
    conversation_context=conversation_context
)

   
    enhanced_message = with_language_rule(
        message,
        """
Important platform context:
voxeli.ai contains cinematic films and interactive 3D assets.
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