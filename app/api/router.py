from fastapi import APIRouter

from app.api.endpoints.health import router as health_router
from app.api.endpoints.message import router as message_router
from app.api.endpoints.ioc import router as ioc_router
from app.api.endpoints.threat_feed import router as threat_feed_router
from app.api.endpoints.threat_analysis import router as threat_analysis_router


api_router = APIRouter(prefix="/api/v1")


api_router.include_router(health_router)
api_router.include_router(message_router)
api_router.include_router(ioc_router)
api_router.include_router(threat_feed_router)
api_router.include_router(threat_analysis_router)
