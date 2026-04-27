from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from assets import router as assets_router
from ai.intent_classifier import classify_intent  # 🔥 إضافة
from orchestrator import get_response_by_intent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 👇 هذا موجود عندك (ما لمسناه)
app.include_router(assets_router)


# =========================
# 🔥 إضافة الشات
# =========================

# شكل الريكويست
class ChatRequest(BaseModel):
    message: str


# endpoint جديد للشات
@app.post("/chat")
async def chat(request: ChatRequest):
    user_message = request.message

    # 🧠 تصنيف النية
    intent = classify_intent(user_message)

    # 🔀 اختيار الرد حسب النية
    reply = get_response_by_intent(intent, user_message)

    return {
        "message": user_message,
        "intent": intent,
        "reply": reply
    }