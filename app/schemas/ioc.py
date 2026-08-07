from datetime import datetime
from pydantic import BaseModel

class IOCCreate(BaseModel):
    value: str
    type: str
    source: str
    threat_level: str

class IOCUpdate(BaseModel):
    value: str
    type: str
    source: str
    threat_level: str



class IOCResponse(BaseModel):
    id: int
    value: str
    type: str
    source: str
    threat_level: str
    created_at: datetime


    model_config = {
        "from_attributes": True
    }