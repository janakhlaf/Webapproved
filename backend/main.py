from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from assets import router as assets_router
from films import router as films_router

from ai.intent_classifier import classify_intent
from orchestrator import get_response_by_intent

from chat_history import (
    create_chat_session,
    get_user_sessions,
    get_session_messages,
    save_chat_message,
    delete_chat_session
)

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
    isAuthenticated: bool = False
    user_id: int | None = None
    session_id: int | None = None


class CreateChatSessionRequest(BaseModel):
    user_id: int


@app.post("/chat/sessions")
async def create_session(request: CreateChatSessionRequest):
    session = create_chat_session(request.user_id)

    return {
        "session": session
    }


@app.get("/chat/sessions/{user_id}")
async def get_sessions(user_id: int):
    sessions = get_user_sessions(user_id)

    return {
        "sessions": sessions
    }


@app.get("/chat/sessions/{session_id}/messages")
async def get_messages(session_id: int):
    messages = get_session_messages(session_id)

    return {
        "messages": messages
    }
@app.delete("/chat/sessions/{session_id}")
async def delete_session(session_id: int, user_id: int):
    delete_chat_session(session_id, user_id)

    return {
        "deleted": True
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    user_message = request.message
    intent = classify_intent(user_message)

    reply = get_response_by_intent(
        intent,
        user_message,
        request.isAuthenticated
    )

    if request.user_id and request.session_id:
        save_chat_message(
            request.session_id,
            request.user_id,
            "user",
            user_message
        )

        save_chat_message(
            request.session_id,
            request.user_id,
            "assistant",
            reply
        )

    return {
        "message": user_message,
        "intent": intent,
        "isAuthenticated": request.isAuthenticated,
        "reply": reply
    }