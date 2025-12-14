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
    mode = Column(String, nullable=True)
    etd = Column(String, nullable=True)
    eta = Column(String, nullable=True)
    atd = Column(String, nullable=True)
    ata = Column(String, nullable=True)
    bl_no = Column(String, nullable=True)
    awb_no = Column(String, nullable=True)
    is_fcl = Column(Integer, default=0)
    freight_cost = Column(Float, default=0.0)
    insurance_cost = Column(Float, default=0.0)
    carrier = Column(String, nullable=True)
    warehouse_status = Column(String, nullable=True)
