from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.repositories.threat_analysis_repository import (
    ThreatAnalysisRepository
)
from app.services.threat_correlation_service import (
    ThreatCorrelationService
)


router = APIRouter(
    prefix="/threat-analysis",
    tags=["Threat Analysis"]
)


# =========================================================
# RUN NEW THREAT ANALYSIS
# =========================================================

@router.post("/{ip}/analyze")
async def analyze_ip(
    ip: str,
    db: Session = Depends(get_db)
):
    """
    Run a fresh threat intelligence analysis for an IP address.

    This calls:
    - AbuseIPDB
    - VirusTotal
    - Threat Correlation Engine

    The resulting analysis is saved to the database.
    """

    return await ThreatCorrelationService.analyze_ip(
        ip=ip,
        db=db
    )


# =========================================================
# GET ALL THREAT ANALYSES
# =========================================================

@router.get("")
def get_all_threat_analyses(
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    return ThreatAnalysisRepository.get_all(
        db=db,
        limit=limit,
        offset=offset
    )


# =========================================================
# GET ANALYSIS HISTORY FOR AN IP
# =========================================================

@router.get("/{ip}")
def get_threat_analysis_by_ip(
    ip: str,
    db: Session = Depends(get_db)
):
    return ThreatAnalysisRepository.get_by_ip(
        db=db,
        ip=ip
    )