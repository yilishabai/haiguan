from sqlalchemy import Column, String, Integer, Float
from backend_py.db import Base

class Logistics(Base):
    __tablename__ = 'logistics'
    id = Column(String, primary_key=True)
    tracking_no = Column(String, index=True)
    origin = Column(String)
    destination = Column(String)
    status = Column(String, index=True)
    estimated_time = Column(Integer, default=0)
    actual_time = Column(Integer, default=0)
    efficiency = Column(Integer, default=0)
    order_id = Column(String, index=True)
