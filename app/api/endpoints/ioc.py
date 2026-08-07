from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.ioc import IOCCreate, IOCResponse
from app.services.ioc_service import IOCService


router = APIRouter(
    prefix="/iocs",
    tags=["IOCs"]
)


@router.post("", response_model=IOCResponse)
def create_ioc(
    data: IOCCreate,
    db: Session = Depends(get_db)
):
    return IOCService.create_ioc(db, data)


@router.get("", response_model=list[IOCResponse])
def get_all_iocs(
    db: Session = Depends(get_db)
):
    return IOCService.get_all_iocs(db)

@router.get("/{ioc_id}", response_model=IOCResponse)
def get_ioc_by_id(
    ioc_id: int,
    db: Session = Depends(get_db)
):
    return IOCService.get_ioc_by_id(db, ioc_id)

@router.put("/{ioc_id}", response_model=IOCResponse)
def update_ioc(
    ioc_id: int,
    data: IOCCreate,
    db: Session = Depends(get_db)
):
    return IOCService.update_ioc(db, ioc_id, data)

@router.delete("/{ioc_id}")
def delete_ioc(
    ioc_id: int,
    db: Session = Depends(get_db)
):
   ioc = IOCService.delete_ioc(db, ioc_id)

   if not ioc:
       raise HTTPException(
           status_code=404,
           detail="IOC not found"
       )

   return {
       "message": "IOC deleted successfully"
   }