from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.database import get_db
from app.repositories.user_repository import UserRepository


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    # -----------------------------------------------------
    # Decode JWT
    # -----------------------------------------------------

    try:
        payload = decode_access_token(token)

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # -----------------------------------------------------
    # Get user ID
    # -----------------------------------------------------

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    try:
        user_id = int(user_id)

    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # -----------------------------------------------------
    # Get user from database
    # -----------------------------------------------------

    user = UserRepository.get_by_id(
        db=db,
        user_id=user_id,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
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
            detail="User account is inactive.",
        )

    return user