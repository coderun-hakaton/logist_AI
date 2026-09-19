import os
from datetime import datetime  # noqa: F401 (used by routers)

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter

from routers.chat import router as chat_router
from routers.driver_applications import router as driver_applications_router

api_router = APIRouter(prefix="/api")

api_router.include_router(chat_router)
api_router.include_router(driver_applications_router)


@api_router.get("/health")
async def health():
    return {"status": "ok", "service": "karvonboshi-backend", "note": "Ma'lumotlar bazasi: Supabase (bulut)"}


app = FastAPI(title="Karvonboshi Backend", version="1.0.0")

origins = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
