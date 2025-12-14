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
    mode: Optional[str] = None
    etd: Optional[str] = None
    eta: Optional[str] = None
    atd: Optional[str] = None
    ata: Optional[str] = None
    bl_no: Optional[str] = None
    awb_no: Optional[str] = None
    is_fcl: Optional[int] = 0
    freight_cost: Optional[float] = 0.0
    insurance_cost: Optional[float] = 0.0
    carrier: Optional[str] = None
