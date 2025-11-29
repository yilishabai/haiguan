from sqlalchemy import Column, String, Integer
from backend_py.db import Base

class Inventory(Base):
    __tablename__ = 'inventory'
    name = Column(String, primary_key=True)
    current = Column(Integer, default=0)
    target = Column(Integer, default=0)
    production = Column(Integer, default=0)
    sales = Column(Integer, default=0)
    efficiency = Column(Integer, default=0)
