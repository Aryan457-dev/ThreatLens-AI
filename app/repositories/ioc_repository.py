from sqlalchemy.orm import Session

from app.models.ioc import IOC
from app.schemas.ioc import IOCCreate
from sqlalchemy import or_

class IOCRepository:

    @staticmethod
    def create(db: Session, data: IOCCreate) -> IOC:
        ioc = IOC(
            value=data.value,
            type=data.type,
            source=data.source,
            threat_level=data.threat_level,
        )

        db.add(ioc)
        db.commit()
        db.refresh(ioc)

        return ioc

    @staticmethod
    def get_all(
        db: Session,
        type: str | None = None,
        source: str | None = None,
        threat_level: str | None = None,
        search: str | None = None,
    ):
        query = db.query(IOC)

        if type:
            query = query.filter(IOC.type == type)

        if source:
            query = query.filter(IOC.source == source)

        if threat_level:
            query = query.filter(IOC.threat_level == threat_level)

        if search:
            query = query.filter(
                IOC.value.ilike(f"%{search}%")
            )
        return query.all()

    @staticmethod
    def get_by_id(db: Session, ioc_id: int):
         return db.query(IOC).filter(IOC.id == ioc_id).first() 

    @staticmethod
    def update(db: Session, ioc_id: int, data: IOCCreate):
        ioc = db.query(IOC).filter(IOC.id == ioc_id).first()

        if not ioc:
            return None

        ioc.value = data.value
        ioc.type = data.type
        ioc.source = data.source
        ioc.threat_level = data.threat_level

        db.commit()
        db.refresh(ioc)

        return ioc

    @staticmethod
    def delete(db: Session, ioc_id: int):
        ioc = db.query(IOC).filter(IOC.id == ioc_id).first()

        if not ioc:
            return None

        db.delete(ioc)
        db.commit()

        return ioc
    