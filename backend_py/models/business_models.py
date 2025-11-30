from sqlalchemy import Column, String, Integer, Float, Text
from backend_py.db import Base

class BusinessModel(Base):
    __tablename__ = 'business_models'
    id = Column(String, primary_key=True)
    name = Column(String)
    category = Column(String)
    version = Column(String)
    status = Column(String)
    enterprises = Column(Integer)
    orders = Column(Integer)
    description = Column(Text)
    scenarios = Column(Text)
    compliance = Column(Text)
    chapters = Column(Text)
    success_rate = Column(Float)
    last_updated = Column(String)
    maintainer = Column(String)
