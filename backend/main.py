from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from assets import router as assets_router
from films import router as films_router

from ai.intent_classifier import classify_intent
from orchestrator import get_response_by_intent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets_router)
app.include_router(films_router)


class ChatRequest(BaseModel):
    message: str


@app.post("/chat")
async def chat(request: ChatRequest):
    user_message = request.message
    intent = classify_intent(user_message)
    reply = get_response_by_intent(intent, user_message)

    return {
        "message": user_message,
        "intent": intent,
        "reply": reply
    }