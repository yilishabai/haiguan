from sqlalchemy import Column, String, Integer, Float, DateTime
from datetime import datetime
from backend_py.db import Base

class Enterprise(Base):
    __tablename__ = 'enterprises'

    id = Column(String, primary_key=True)
    reg_no = Column(String, index=True)
    name = Column(String, index=True)
    type = Column(String)  # importer/exporter/both
    category = Column(String)  # beauty/wine/appliance/electronics/textile
    region = Column(String)
    status = Column(String)  # active/inactive/blocked
    compliance = Column(Float, default=0.0)
    service_eligible = Column(Integer, default=0)  # 0/1
    active_orders = Column(Integer, default=0)
    last_active = Column(DateTime, default=datetime.utcnow)
