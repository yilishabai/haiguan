from pydantic import BaseModel
from typing import Optional

class LogisticsIn(BaseModel):
    id: str
    tracking_no: str
    origin: str
    destination: str
    status: str
    estimated_time: int
    actual_time: Optional[int] = 0
    efficiency: Optional[int] = 0
    order_id: Optional[str] = ''
