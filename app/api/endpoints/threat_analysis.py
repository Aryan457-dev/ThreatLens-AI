from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.repositories.threat_analysis_repository import ThreatAnalysisRepository


router = APIRouter(
    prefix="/threat-analysis",
    tags=["Threat Analysis"]
)


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


@router.get("/{ip}")
def get_threat_analysis_by_ip(
    ip: str,
    db: Session = Depends(get_db)
):
    return ThreatAnalysisRepository.get_by_ip(
        db=db,
        ip=ip
    )