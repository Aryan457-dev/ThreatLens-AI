from pydantic import BaseModel

class MessageRequest(BaseModel):
    message: str


class MessageResponse(BaseModel):
    received_message: str
    length: int