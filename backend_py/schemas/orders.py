from pydantic import BaseModel
from typing import Optional

class OrderIn(BaseModel):
    id: str
    order_number: str
    enterprise: str
    category: str
    status: str
    amount: float
    currency: str
    created_at: Optional[str] = None

class OrderOut(BaseModel):
    id: str
    order_number: str
    enterprise: str
    category: str
    status: str
    amount: float
    currency: str
    created_at: str
