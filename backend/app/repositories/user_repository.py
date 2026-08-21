from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:

    # =========================================================
    # GET USER BY ID
    # =========================================================

    @staticmethod
    def get_by_id(
        db: Session,
        user_id: int
    ):
        return (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )


    # =========================================================
    # GET USER BY USERNAME
    # =========================================================

    @staticmethod
    def get_by_username(
        db: Session,
        username: str
    ):
        return (
            db.query(User)
            .filter(User.username == username)
            .first()
        )


    # =========================================================
    # GET USER BY EMAIL
    # =========================================================

    @staticmethod
    def get_by_email(
        db: Session,
        email: str
    ):
        return (
            db.query(User)
            .filter(User.email == email)
            .first()
        )


    # =========================================================
    # GET ALL USERS
    # =========================================================

    @staticmethod
    def get_all(
        db: Session,
        limit: int = 50,
        offset: int = 0
    ):
        return (
            db.query(User)
            .order_by(User.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )


    # =========================================================
    # CREATE USER
    # =========================================================

    @staticmethod
    def create(
        db: Session,
        username: str,
        email: str,
        password_hash: str,
        role: str = "analyst"
    ) -> User:

        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            role=role,
            is_active=True,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user


    # =========================================================
    # UPDATE USER ROLE
    # =========================================================

    @staticmethod
    def update_role(
        db: Session,
        user: User,
        role: str
    ):

        user.role = role

        db.commit()
        db.refresh(user)

        return user


    # =========================================================
    # UPDATE USER STATUS
    # =========================================================

    @staticmethod
    def update_status(
        db: Session,
        user: User,
        is_active: bool
    ):

        user.is_active = is_active

        db.commit()
        db.refresh(user)

        return user