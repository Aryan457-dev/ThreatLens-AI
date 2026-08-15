from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:

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