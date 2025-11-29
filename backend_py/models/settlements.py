from sqlalchemy import Column, String, Integer
from backend_py.db import Base

class Settlement(Base):
    __tablename__ = 'settlements'
    id = Column(String, primary_key=True)
    order_id = Column(String, index=True)
    status = Column(String, index=True)
    settlement_time = Column(Integer, default=0)
    risk_level = Column(String, default='low')
