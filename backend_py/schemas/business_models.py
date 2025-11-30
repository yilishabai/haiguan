from pydantic import BaseModel

class BusinessModelIn(BaseModel):
    id: str
    name: str
    category: str
    version: str
    status: str
    enterprises: int
    orders: int
    description: str
    scenarios: str
    compliance: str
    chapters: str | None = None
    success_rate: float
    last_updated: str
    maintainer: str
