from fastapi import APIRouter
from app.schemas.health import HealthResponse

router = APIRouter(
    prefix="/health",
    tags=["Health"]
)


@router.get("", response_model=HealthResponse)
def health_check():
    return {
        "status": "healthy",
        "service": "ThreatLens AI Backend",
        "version": "0.1.0"
    }