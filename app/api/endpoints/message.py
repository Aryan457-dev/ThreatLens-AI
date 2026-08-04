from fastapi import APIRouter
from app.schemas.message import MessageRequest, MessageResponse

router = APIRouter(
    prefix="/message",
    tags=["Message"]
)


@router.post("", response_model=MessageResponse)
def create_message(request: MessageRequest):
    return {
        "received_message": request.message,
        "length": len(request.message)
    }