from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import (
    require_analyst,
    require_viewer,
)
from app.db.database import get_db
from app.repositories.threat_analysis_repository import (
    ThreatAnalysisRepository,
)
from app.services.threat_correlation_service import (
    ThreatCorrelationService,
)


router = APIRouter(
    prefix="/threat-analysis",
    tags=["Threat Analysis"],
)


@router.post("/{ip}/analyze")
async def analyze_ip(
    ip: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_analyst),
):
    return await ThreatCorrelationService.analyze_ip(
        ip=ip,
        db=db,
    )


@router.get("")
def get_all_threat_analyses(
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user=Depends(require_viewer),
):
    return ThreatAnalysisRepository.get_all(
        db=db,
        limit=limit,
        offset=offset,
    )


@router.get("/{ip}")
def get_threat_analysis_by_ip(
    ip: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_viewer),
):
    return ThreatAnalysisRepository.get_by_ip(
        db=db,
        ip=ip,
    )