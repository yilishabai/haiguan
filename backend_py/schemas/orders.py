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
    incoterms: Optional[str] = ''
    trade_terms: Optional[str] = ''
    route: Optional[str] = ''

class OrderOut(BaseModel):
    id: str
    order_number: str
    enterprise: str
    category: str
    status: str
    amount: float
    currency: str
    created_at: str
    incoterms: Optional[str] = ''
    trade_terms: Optional[str] = ''
    route: Optional[str] = ''
