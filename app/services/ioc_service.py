from sqlalchemy.orm import Session

from app.repositories.ioc_repository import IOCRepository
from app.schemas.ioc import IOCCreate
from fastapi import HTTPException

class IOCService:
    @staticmethod
    def create_ioc(db: Session, data: IOCCreate):
        return IOCRepository.create(db,data)

    @staticmethod
    def get_all_iocs(db: Session):
     return IOCRepository.get_all(db)

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
       ioc = IOCRepository.update(db, ioc_id, data)

       if not ioc:
          raise HTTPException(
             status_code=404,
             detail="IOC not found"
          )
       return ioc

    @staticmethod
    def delete_ioc(db: Session, ioc_id: int):
       return IOCRepository.delete(db, ioc_id)
    
    