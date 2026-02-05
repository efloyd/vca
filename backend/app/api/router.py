from fastapi import APIRouter

from backend.app.api.health import router as health_router
from backend.app.api.chat import router as chat_router
from backend.app.api.documents import router as documents_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router, tags=["health"])
api_router.include_router(chat_router, tags=["chat"])
api_router.include_router(documents_router, tags=["documents"])
