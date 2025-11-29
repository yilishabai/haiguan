from sqlalchemy import Column, String, Integer, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend_py.db import Base

class Order(Base):
    __tablename__ = 'orders'
    id = Column(String, primary_key=True)
    order_number = Column(String, index=True)
    enterprise = Column(String, index=True)
    category = Column(String)
    status = Column(String, index=True)
    amount = Column(Float, default=0.0)
    currency = Column(String, default='CNY')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

