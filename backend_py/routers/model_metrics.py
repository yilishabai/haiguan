from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend_py.db import SessionLocal
from backend_py.models.model_metrics import ModelMetric, ModelExecutionLog
from backend_py.models.business_models import BusinessModel
from typing import List, Optional
from datetime import datetime, timedelta
import random
import uuid

router = APIRouter(prefix='/api/model-metrics', tags=['Model Metrics'])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('/dashboard-stats')
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get high-level dashboard statistics combining model performance and business impact.
    """
    # specific implementation for the dashboard top cards
    # This simulates the aggregation of data
    
    # 1. Total Value Created (Sum of business_impact_value from logs)
    total_value = db.query(ModelExecutionLog).with_entities(ModelExecutionLog.business_impact_value).all()
    total_value_sum = sum([x[0] for x in total_value if x[0]])
    
    # 2. Risk Intercepted (Count of 'Flagged' outcomes)
    risk_count = db.query(ModelExecutionLog).filter(ModelExecutionLog.business_outcome.like('%Risk%')).count()
    
    # 3. Active Models
    active_models = db.query(BusinessModel).filter(BusinessModel.status == 'active').count()
    
    return {
        "total_value_created": total_value_sum,
        "risk_prevented_count": risk_count,
        "active_models": active_models,
        "efficiency_gain": 35.4 # calculated or static for now
    }

@router.get('/execution-logs')
def get_execution_logs(limit: int = 10, db: Session = Depends(get_db)):
    """
    Get recent model execution traces.
    """
    logs = db.query(ModelExecutionLog).order_by(ModelExecutionLog.timestamp.desc()).limit(limit).all()
    return logs

@router.get('/roi-analysis')
def get_roi_analysis(db: Session = Depends(get_db)):
    """
    Get time-series data for ROI analysis charts.
    """
    # Return last 7 days of metrics
    # In a real app, this would query ModelMetric grouped by date
    # For now, we'll return a structure suitable for the frontend chart
    
    end_date = datetime.now()
    dates = [(end_date - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7)][::-1]
    
    return {
        "dates": dates,
        "roi_trend": [random.randint(80, 120) for _ in range(7)],
        "accuracy_trend": [random.uniform(90, 99) for _ in range(7)]
    }

@router.post('/simulate-traffic')
def simulate_traffic(db: Session = Depends(get_db)):
    """
    Helper to generate some traffic for the demo.
    """
    models = ["RiskModel V2", "ValuationModel V1", "ClassificationModel V3"]
    outcomes = ["Auto-Pass", "Manual-Review", "Risk-Flagged"]
    
    for _ in range(5):
        m_name = random.choice(models)
        outcome = random.choice(outcomes)
        impact = 0
        if outcome == "Auto-Pass":
            impact = random.randint(100, 500) # Saved cost
        elif outcome == "Risk-Flagged":
            impact = random.randint(1000, 5000) # Prevented loss
            
        log = ModelExecutionLog(
            id=str(uuid.uuid4()),
            model_id=m_name.lower().replace(" ", "-"),
            model_name=m_name,
            input_snapshot=f"Declaration_{random.randint(10000,99999)}",
            output_result=f"Score: {random.uniform(0,1):.2f}",
            business_outcome=outcome,
            business_impact_value=impact,
            latency_ms=random.randint(50, 300),
            status="success"
        )
        db.add(log)
    
    db.commit()
    return {"message": "Simulated 5 transactions"}
