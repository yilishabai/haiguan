from pydantic import BaseModel

class InventoryIn(BaseModel):
    name: str
    current: int
    target: int
    production: int
    sales: int
    efficiency: int
