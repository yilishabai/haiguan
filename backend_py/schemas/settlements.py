from pydantic import BaseModel
from typing import Optional

class SettlementIn(BaseModel):
    id: str
    order_id: str
    status: str
    settlement_time: Optional[int] = 0
    risk_level: Optional[str] = 'low'
