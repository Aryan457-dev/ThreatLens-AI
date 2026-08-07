from fastapi import APIRouter

from app.services.threat_feed_service import ThreatFeedService

router = APIRouter (
    prefix="/threat-feed",
    tags=["Threat Feed"]
)

@router.get("/check/{ip}")
async def check_ip(ip: str):
    return await ThreatFeedService.check_ip(ip)