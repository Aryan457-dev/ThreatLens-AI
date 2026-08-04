from fastapi import APIRouter
from app.api.endpoints.health import router as health_router
from app.api.endpoints.message import router as message_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health_router)
api_router.include_router(message_router)