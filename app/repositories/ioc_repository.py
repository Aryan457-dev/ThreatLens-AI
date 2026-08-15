from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from fastapi import HTTPException, status

from app.models.ioc import IOC
from app.schemas.ioc import IOCCreate


class IOCRepository:

    @staticmethod
    def create(db: Session, data: IOCCreate) -> IOC:
        # Check if IOC already exists
        existing_ioc = (
            db.query(IOC)
            .filter(IOC.value == data.value)
            .first()
        )

        if existing_ioc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"IOC '{data.value}' already exists."
            )

        ioc = IOC(
            value=data.value,
            type=data.type,
            source=data.source,
            threat_level=data.threat_level,
        )

        try:
            db.add(ioc)
            db.commit()
            db.refresh(ioc)

            return ioc

        except IntegrityError:
            db.rollback()

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"IOC '{data.value}' already exists."
            )

    @staticmethod
    def get_all(
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
        query = db.query(IOC)

        # Filter by IOC type
        if type:
            query = query.filter(IOC.type == type)

        # Filter by source
        if source:
            query = query.filter(IOC.source == source)

        # Filter by threat level
        if threat_level:
            query = query.filter(
                IOC.threat_level == threat_level
            )

        # Search IOC value
        if search:
            query = query.filter(
                IOC.value.contains(search)
            )

        # Allowed sorting columns
        allowed_sort_columns = {
            "id": IOC.id,
            "value": IOC.value,
            "type": IOC.type,
            "source": IOC.source,
            "threat_level": IOC.threat_level,
            "created_at": IOC.created_at,
        }

        column = allowed_sort_columns.get(
            sort_by,
            IOC.created_at
        )

        # Sorting
        if sort_order.lower() == "desc":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())

        # Pagination
        query = query.offset(offset).limit(limit)

        return query.all()

    @staticmethod
    def get_by_id(
        db: Session,
        ioc_id: int
    ):
        return (
            db.query(IOC)
            .filter(IOC.id == ioc_id)
            .first()
        )

    @staticmethod
    def update(
        db: Session,
        ioc_id: int,
        data: IOCCreate
    ):
        ioc = (
            db.query(IOC)
            .filter(IOC.id == ioc_id)
            .first()
        )

        if not ioc:
            return None

        # Check if another IOC already uses the new value
        duplicate_ioc = (
            db.query(IOC)
            .filter(
                IOC.value == data.value,
                IOC.id != ioc_id
            )
            .first()
        )

        if duplicate_ioc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"IOC '{data.value}' already exists."
            )

        ioc.value = data.value
        ioc.type = data.type
        ioc.source = data.source
        ioc.threat_level = data.threat_level

        try:
            db.commit()
            db.refresh(ioc)

            return ioc

        except IntegrityError:
            db.rollback()

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"IOC '{data.value}' already exists."
            )

    @staticmethod
    def delete(
        db: Session,
        ioc_id: int
    ):
        ioc = (
            db.query(IOC)
            .filter(IOC.id == ioc_id)
            .first()
        )

        if not ioc:
            return None

        db.delete(ioc)
        db.commit()

        return ioc