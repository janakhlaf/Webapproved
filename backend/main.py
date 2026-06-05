import os
import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from favorites import router as favorites_router
from cart import router as cart_router
from assets import router as assets_router
from films import router as films_router
from library import router as library_router

from ai.intent_classifier import classify_intent
from orchestrator import get_response_by_intent


from chat_history import (
    create_chat_session,
    get_user_sessions,
    get_session_messages,
    save_chat_message,
    delete_chat_session,
    get_recent_conversation_context
)
load_dotenv()
app = FastAPI()

print("THIS IS MY MAIN.PY")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets_router)
app.include_router(films_router)
app.include_router(library_router)
app.include_router(favorites_router)
app.include_router(cart_router)


# ========================
# MODELS
# ========================
class ChatRequest(BaseModel):
    message: str
    isAuthenticated: bool = False
    user_id: int | None = None
    session_id: int | None = None


class CreateChatSessionRequest(BaseModel):
    user_id: int

class DeleteProfileImagesRequest(BaseModel):
    file_names: list[str]

# ========================
# ROOT
# ========================
@app.get("/")
async def root():
    return {
        "message": "Backend is running",
        "main_file": "THIS IS MY MAIN.PY"
    }


# ========================
# HEALTH CHECK (مهم جدًا لتشخيص المشكلة)
# ========================
@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/profile-images/delete")
async def delete_profile_images(request: DeleteProfileImagesRequest):
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        return JSONResponse(
            status_code=500,
            content={"error": "Missing Supabase env variables"}
        )

    if not request.file_names:
        return {"deleted": True, "files": []}

    response = requests.delete(
      f"{supabase_url}/storage/v1/object/profile-images",

        headers={
            "Authorization": f"Bearer {service_key}",
            "apikey": service_key,
            "Content-Type": "application/json",
        },
        json={
            "prefixes": request.file_names
        },
    )

    if response.status_code >= 400:
        return JSONResponse(
            status_code=response.status_code,
            content={"error": response.text}
        )

    return {
        "deleted": True,
        "files": request.file_names
    }

# ========================
# SAFE ERROR HANDLER
# ========================
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "message": "Internal server error"
        }
    )


# ========================
# CHAT SESSIONS
# ========================
@app.post("/chat/sessions")
async def create_session(request: CreateChatSessionRequest):
    session = create_chat_session(request.user_id)
    return {"session": session}


@app.get("/chat/sessions/{user_id}")
async def get_sessions(user_id: int):
    sessions = get_user_sessions(user_id)
    return {"sessions": sessions}


@app.get("/chat/sessions/{session_id}/messages")
async def get_messages(session_id: int):
    messages = get_session_messages(session_id)
    return {"messages": messages}


@app.delete("/chat/sessions/{session_id}")
async def delete_session(session_id: int, user_id: int):
    delete_chat_session(session_id, user_id)
    return {"deleted": True}


# ========================
# CHAT ENDPOINT
# ========================
@app.post("/chat")
async def chat(request: ChatRequest):
    user_message = request.message
    intent = classify_intent(user_message)

    conversation_context = []

    if request.session_id:
        conversation_context = get_recent_conversation_context(
            request.session_id
        )

    reply = get_response_by_intent(
        intent,
        user_message,
        request.isAuthenticated,
        conversation_context
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