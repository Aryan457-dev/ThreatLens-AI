from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import (
    require_admin,
    require_analyst,
    require_viewer,
)
from app.db.database import get_db
from app.schemas.ioc import IOCCreate, IOCResponse
from app.services.ioc_service import IOCService


router = APIRouter(
    prefix="/iocs",
    tags=["IOCs"]
)


# =========================================================
# CREATE IOC
# ADMIN + ANALYST
# =========================================================

@router.post(
    "",
    response_model=IOCResponse
)
def create_ioc(
    data: IOCCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_analyst),
):
    return IOCService.create_ioc(
        db,
        data
    )


# =========================================================
# GET ALL IOCs
# ADMIN + ANALYST + VIEWER
# =========================================================

@router.get(
    "",
    response_model=list[IOCResponse]
)
def get_all_iocs(
    type: str | None = None,
    source: str | None = None,
    threat_level: str | None = None,
    search: str | None = None,
    limit: int = 10,
    offset: int = 0,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
    current_user=Depends(require_viewer),
):
    return IOCService.get_all_iocs(
        db=db,
        type=type,
        source=source,
        threat_level=threat_level,
        search=search,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
        sort_order=sort_order,
    )


# =========================================================
# GET IOC BY ID
# ADMIN + ANALYST + VIEWER
# =========================================================

@router.get(
    "/{ioc_id}",
    response_model=IOCResponse
)
def get_ioc_by_id(
    ioc_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_viewer),
):
    return IOCService.get_ioc_by_id(
        db,
        ioc_id
    )


# =========================================================
# UPDATE IOC
# ADMIN + ANALYST
# =========================================================

@router.put(
    "/{ioc_id}",
    response_model=IOCResponse
)
def update_ioc(
    ioc_id: int,
    data: IOCCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_analyst),
):
    return IOCService.update_ioc(
        db,
        ioc_id,
        data
    )


# =========================================================
# DELETE IOC
# ADMIN ONLY
# =========================================================

@router.delete(
    "/{ioc_id}"
)
def delete_ioc(
    ioc_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    ioc = IOCService.delete_ioc(
        db,
        ioc_id
    )

    if not ioc:
        raise HTTPException(
            status_code=404,
            detail="IOC not found"
        )

    return {
        "message": "IOC deleted successfully"
    }