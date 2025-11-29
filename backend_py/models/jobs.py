from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.sql import func
from backend_py.db import Base

class Job(Base):
    __tablename__ = 'jobs'
    id = Column(String, primary_key=True)
    type = Column(String, nullable=False)
    payload = Column(Text, nullable=True)
    status = Column(String, nullable=False, default='pending')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

