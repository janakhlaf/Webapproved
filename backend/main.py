from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from assets import router as assets_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # يسمح لأي origin (حل سريع للتطوير)
    allow_credentials=False,  # مهم لما تستخدم "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets_router)