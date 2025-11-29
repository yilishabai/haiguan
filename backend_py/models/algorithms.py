from sqlalchemy import Column, String, Integer, Float, Text
from backend_py.db import Base

class Algorithm(Base):
    __tablename__ = 'algorithms'
    id = Column(String, primary_key=True)
    name = Column(String)
    category = Column(String)
    version = Column(String)
    status = Column(String)
    accuracy = Column(Float)
    performance = Column(Float)
    usage = Column(Integer)
    description = Column(String)
    features = Column(Text)
    last_updated = Column(String)
    author = Column(String)
    code = Column(Text)
