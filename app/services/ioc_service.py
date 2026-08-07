from sqlalchemy.orm import Session

from app.repositories.ioc_repository import IOCRepository
from app.schemas.ioc import IOCCreate
from fastapi import HTTPException, status
from app.validators.ioc_validator import IOCValidator

class IOCService:
    @staticmethod
    def create_ioc(db: Session, data: IOCCreate):
        if data.type.upper() == "IP":
           if not IOCValidator.validate_ip(data.value):
              raise HTTPException(
                 status_code=status.HTTP_400_BAD_REQUEST,
                 detail="Invalid IP address."
              )
        elif data.type.upper() == "DOMAIN":
           if not IOCValidator.validate_domain(data.value):
              raise HTTPException(
                 status_code=status.HTTP_400_BAD_REQUEST,
                 detail="Invalid domain."
              )

        return IOCRepository.create(db,data)

    @staticmethod
    def get_all_iocs(
      db: Session,
      type: str | None = None,
      source: str | None = None,
      threat_level: str | None = None,
      search: str | None = None, 
      limit: int = 10,
      offset: int = 0,
      sort_by: str = "created_at",
      sort_order: str = "desc"
    ):
       return IOCRepository.get_all(
          db=db,
          type=type,
          source=source,
          threat_level=threat_level,
          search=search,
          limit=limit,
          offset=offset,
          sort_by=sort_by,
          sort_order=sort_order
       )

    @staticmethod
    def get_ioc_by_id(db: Session, ioc_id: int):
        ioc = IOCRepository.get_by_id(db, ioc_id)

        if not ioc:
           raise HTTPException(
              status_code=404,
              detail="IOC not found"
           )
        return ioc

    @staticmethod
    def update_ioc (db: Session, ioc_id: int, data: IOCCreate):
       if data.type.upper() == "IP":
          if not IOCValidator.validate_ip(data.value):
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid IP address."
             )
       elif data.type.upper() == "DOMAIN":
          if not IOCValidator.validate_domain(data.value):
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid domain."
             )
       ioc = IOCRepository.update(db, ioc_id,data)

       if not ioc:
          raise HTTPException(
             status_code=404,
             detail="IOC not found"
          )
       return ioc

    @staticmethod
    def delete_ioc(db: Session, ioc_id: int):
       return IOCRepository.delete(db, ioc_id)
    
    