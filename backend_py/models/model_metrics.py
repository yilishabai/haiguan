from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Boolean
from backend_py.db import Base
from datetime import datetime

class ModelMetric(Base):
    __tablename__ = 'model_metrics'
    id = Column(Integer, primary_key=True, autoincrement=True)
    model_id = Column(String, index=True)
    metric_type = Column(String) # 'accuracy', 'business_roi', 'efficiency'
    value = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

class ModelExecutionLog(Base):
    __tablename__ = 'model_execution_logs'
    id = Column(String, primary_key=True) # trace_id
    model_id = Column(String)
    model_name = Column(String)
    input_snapshot = Column(Text)
    output_result = Column(Text)
    business_outcome = Column(Text) # e.g. "Auto-cleared", "Flagged for Inspection"
    business_impact_value = Column(Float) # e.g. Cost saved, Risk score
    latency_ms = Column(Integer)
    status = Column(String) # 'success', 'warning', 'error'
    timestamp = Column(DateTime, default=datetime.utcnow)
