from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.database import get_db
from app.repositories.user_repository import UserRepository


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("")
def get_users(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return UserRepository.get_all(
        db=db,
        limit=limit,
        offset=offset,
    )


@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    allowed_roles = {"admin", "analyst", "viewer"}

    role = role.lower().strip()

    if role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Allowed roles: admin, analyst, viewer.",
        )

    user = UserRepository.get_by_id(
        db=db,
        user_id=user_id,
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if user.id == current_user.id and role != "admin":
        raise HTTPException(
            status_code=400,
            detail="You cannot remove your own administrator role.",
        )

    return UserRepository.update_role(
        db=db,
        user=user,
        role=role,
    )


@router.put("/{user_id}/status")
def update_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = UserRepository.get_by_id(
        db=db,
        user_id=user_id,
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if user.id == current_user.id and not is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account.",
        )

    return UserRepository.update_status(
        db=db,
        user=user,
        is_active=is_active,
    )