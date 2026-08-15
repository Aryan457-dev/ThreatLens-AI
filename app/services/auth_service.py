from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserLogin, UserRegister


class AuthService:

    @staticmethod
    def register(
        db: Session,
        data: UserRegister
    ):

        # -----------------------------------------------------
        # Check username
        # -----------------------------------------------------

        existing_username = (
            UserRepository.get_by_username(
                db,
                data.username
            )
        )

        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists."
            )

        # -----------------------------------------------------
        # Check email
        # -----------------------------------------------------

        existing_email = (
            UserRepository.get_by_email(
                db,
                data.email
            )
        )

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists."
            )

        # -----------------------------------------------------
        # Hash password
        # -----------------------------------------------------

        password_hash = hash_password(
            data.password
        )

        # -----------------------------------------------------
        # Create user
        # -----------------------------------------------------

        try:

            return UserRepository.create(
                db=db,
                username=data.username,
                email=data.email,
                password_hash=password_hash,
                role="analyst",
            )

        except IntegrityError:

            db.rollback()

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username or email already exists."
            )

    # =========================================================
    # LOGIN
    # =========================================================

    @staticmethod
    def login(
        db: Session,
        data: UserLogin
    ):

        user = UserRepository.get_by_username(
            db,
            data.username
        )

        if not user:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password.",
                headers={
                    "WWW-Authenticate": "Bearer"
                },
            )

        # -----------------------------------------------------
        # Check account status
        # -----------------------------------------------------

        if not user.is_active:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive."
            )

        # -----------------------------------------------------
        # Verify password
        # -----------------------------------------------------

        if not verify_password(
            data.password,
            user.password_hash
        ):

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password.",
                headers={
                    "WWW-Authenticate": "Bearer"
                },
            )

        # -----------------------------------------------------
        # Generate JWT
        # -----------------------------------------------------

        access_token = create_access_token(
            user_id=user.id,
            username=user.username,
            role=user.role,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user,
        }