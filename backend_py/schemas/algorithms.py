from pydantic import BaseModel
from typing import Optional

class AlgorithmIn(BaseModel):
    id: str
    name: str
    category: str
    version: str
    status: str
    accuracy: float
    performance: float
    usage: int
    description: str
    features: str
    last_updated: str
    author: str
    code: str
