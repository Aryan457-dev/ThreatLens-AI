from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import (
    require_analyst,
    require_viewer,
)
from app.db.database import get_db
from app.services.threat_feed_service import ThreatFeedService
from app.services.virus_total_service import VirusTotalService
from app.services.threat_correlation_service import (
    ThreatCorrelationService
)
from app.schemas.threat_analysis import ThreatAnalysisResponse
from app.validators.ip_validator import validate_ip


router = APIRouter(
    prefix="/threat-feed",
    tags=["Threat Feed"]
)


# =========================================================
# ABUSEIPDB THREAT FEED
# ADMIN + ANALYST + VIEWER
# =========================================================

@router.get("/check/{ip}")
async def check_ip(
    ip: str,
    current_user=Depends(require_viewer),
):
    return await ThreatFeedService.check_ip(ip)


# =========================================================
# VIRUSTOTAL THREAT FEED
# ADMIN + ANALYST + VIEWER
# =========================================================

@router.get("/virustotal/{ip}")
async def check_virustotal(
    ip: str,
    current_user=Depends(require_viewer),
):
    return await VirusTotalService.check_ip(ip)


# =========================================================
# THREAT ANALYSIS
# ADMIN + ANALYST
# =========================================================

@router.get(
    "/analyze/{ip}",
    response_model=ThreatAnalysisResponse
)
async def analyze_ip(
    ip: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_analyst),
):

    # -----------------------------------------------------
    # Validate IP address
    # -----------------------------------------------------

    if not validate_ip(ip):
        raise HTTPException(
            status_code=400,
            detail="Invalid IP address"
        )

    # -----------------------------------------------------
    # Run threat correlation analysis
    # -----------------------------------------------------

    return await ThreatCorrelationService.analyze_ip(
        ip=ip,
        db=db
    )