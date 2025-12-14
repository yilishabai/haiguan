from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from backend_py.db import SessionLocal
from backend_py.models.model_metrics import ModelMetric, ModelExecutionLog
from backend_py.models.business_models import BusinessModel
from backend_py.models.orders import Order
from backend_py.models.algorithms import Algorithm
from backend_py.models.logistics import Logistics
from backend_py.models.settlements import Settlement
from backend_py.models.customs import CustomsHeader
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
    # 1. Online Enterprises: SELECT COUNT(DISTINCT enterprise) FROM orders
    online_enterprises = db.query(Order.enterprise).distinct().count()

    # 2. Active Orders: SELECT COUNT(id) FROM orders WHERE status NOT IN ('completed', 'blocked')
    active_orders = db.query(Order).filter(Order.status.notin_(['completed', 'blocked'])).count()

    # 3. Response Time: SELECT AVG(latency_ms) FROM model_execution_logs
    # Taking recent 1000 for performance if needed, but here simple avg is fine for sqlite
    avg_latency = db.query(func.avg(ModelExecutionLog.latency_ms)).scalar() or 0

    # 4. Success Rate: (放行数 / 总调用数) * 100%
    # business_outcome NOT IN ('blocked', 'reject', 'error')
    total_calls = db.query(ModelExecutionLog).count()
    if total_calls > 0:
        passed_calls = db.query(ModelExecutionLog).filter(
            ModelExecutionLog.business_outcome.notin_(['blocked', 'reject', 'error'])
        ).count()
        success_rate = (passed_calls / total_calls) * 100
    else:
        success_rate = 100.0

    # 5. GMV (Today's Export Value): SUM(amount) WHERE created_at >= Today 00:00
    # Assuming simple currency conversion for now
    rates = {'USD': 7.12, 'EUR': 7.80, 'GBP': 8.90, 'CNY': 1.0, 'JPY': 0.05}
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # We fetch relevant orders to sum in python to handle currency conversion easily
    # (SQLite doesn't have easy currency conversion functions built-in usually)
    today_orders = db.query(Order.amount, Order.currency).filter(Order.created_at >= today_start).all()
    
    gmv_today = 0.0
    for amt, curr in today_orders:
        rate = rates.get(curr, 1.0)
        gmv_today += (amt or 0) * rate

    # 6. Collaboration Accuracy: SELECT AVG(accuracy) FROM algorithms WHERE status='active'
    avg_accuracy = db.query(func.avg(Algorithm.accuracy)).filter(Algorithm.status == 'active').scalar() or 0

    # 7. Logistics Exceptions: COUNT(id) WHERE status='exception' OR efficiency < 60
    logistics_exceptions = db.query(Logistics).filter(
        (Logistics.status == 'exception') | (Logistics.efficiency < 60)
    ).count()

    # --- User Requested Metrics Implementation ---

    # 1. Total Value Created: SUM(business_impact_value)
    total_value_sum = db.query(func.sum(ModelExecutionLog.business_impact_value)).scalar() or 0

    # 2. Risk Prevented Count: COUNT(*) WHERE business_outcome contains 'block' or 'reject'
    risk_count = db.query(ModelExecutionLog).filter(
        or_(
            ModelExecutionLog.business_outcome.ilike('%block%'),
            ModelExecutionLog.business_outcome.ilike('%reject%')
        )
    ).count()

    # 3. Efficiency Gain: AVG(value) WHERE metric_type = 'efficiency_boost'
    efficiency_gain = db.query(func.avg(ModelMetric.value)).filter(
        ModelMetric.metric_type == 'efficiency_boost'
    ).scalar() or 0

    # 4. Active Models Coverage: COUNT(*) FROM algorithms WHERE status = 'active'
    active_models = db.query(Algorithm).filter(Algorithm.status == 'active').count()

    return {
        "online_enterprises": online_enterprises,
        "active_orders": active_orders,
        "response_time": round(avg_latency, 1),
        "success_rate": round(success_rate, 1),
        "gmv_today": round(gmv_today, 2),
        "avg_accuracy": round(avg_accuracy, 1),
        "logistics_exceptions": logistics_exceptions,
        "total_value_created": round(total_value_sum, 2),
        "risk_prevented_count": risk_count,
        "active_models": active_models,
        "efficiency_gain": round(efficiency_gain, 1)
    }

@router.get('/category-distribution')
def get_category_distribution(db: Session = Depends(get_db)):
    """
    Get order count distribution by category.
    """
    results = db.query(Order.category, func.count(Order.id).label('count')).group_by(Order.category).all()
    return [{"category": r[0], "count": r[1]} for r in results]

@router.get('/process-funnel')
def get_process_funnel(db: Session = Depends(get_db)):
    """
    Get process funnel data: Orders -> Payments -> Customs -> Logistics -> Warehouse
    """
    # 1. Orders: COUNT(id) FROM orders
    count_orders = db.query(Order).count()

    # 2. Payments: COUNT(id) FROM settlements WHERE status = 'completed'
    count_payments = db.query(Settlement).filter(Settlement.status == 'completed').count()

    # 3. Customs: COUNT(id) FROM customs_headers WHERE status = 'cleared'
    count_customs = db.query(CustomsHeader).filter(CustomsHeader.status == 'cleared').count()

    # 4. Logistics: COUNT(id) FROM logistics WHERE status IN ('transit', 'pickup', 'customs')
    count_logistics = db.query(Logistics).filter(Logistics.status.in_(['transit', 'pickup', 'customs'])).count()

    # 5. Warehouse: COUNT(id) FROM logistics WHERE status = 'completed' (proxy)
    count_warehouse = db.query(Logistics).filter(Logistics.status == 'completed').count()

    return [
        {"stage": "订单", "count": count_orders},
        {"stage": "支付", "count": count_payments},
        {"stage": "通关", "count": count_customs},
        {"stage": "物流", "count": count_logistics},
        {"stage": "仓库", "count": count_warehouse}
    ]

from sqlalchemy import func

@router.get('/ports-congestion')
def get_ports_congestion(db: Session = Depends(get_db)):
    """
    Get ports congestion index based on logistics efficiency and customs port code.
    Formula: Congestion Index = AVG(100 - logistics.efficiency) / 10
    """
    # Join CustomsHeader and Logistics on order_id
    results = db.query(
        CustomsHeader.port_code,
        func.avg(Logistics.efficiency).label('avg_efficiency')
    ).join(
        Logistics, CustomsHeader.order_id == Logistics.order_id
    ).group_by(
        CustomsHeader.port_code
    ).all()

    # Port code mapping (frontend dictionary)
    port_mapping = {
        'CNSHA': '上海',
        'CNYTN': '深圳',
        'CNCAN': '广州',
        'CNNGB': '宁波',
        'CNTAO': '青岛',
        'CNXMN': '厦门',
        'CNTNJ': '天津',
        'USLAX': '洛杉矶',
        'NLRTM': '鹿特丹',
        'JPOSA': '大阪'
    }

    data = []
    for r in results:
        port_code = r.port_code
        avg_eff = r.avg_efficiency or 100 # Default to 100 if null
        
        # Calculate congestion index: (100 - efficiency) / 10
        # If efficiency is 90, index is 1.0. If 60, index is 4.0.
        congestion_index = round((100 - avg_eff) / 10, 1)
        
        port_name = port_mapping.get(port_code, port_code) # Fallback to code if not in map
        
        # Filter out ports not in our mapping if strictly required, but better to show what we have.
        # For dashboard map compatibility, we prioritize mapped names.
        if port_code in port_mapping:
            data.append({
                "port": port_name,
                "congestionIndex": congestion_index
            })
    
    # If no data (e.g. empty DB), return mock/default data or empty list
    if not data:
        # Optional: return some defaults if DB is empty to avoid empty chart
        pass

    return data


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
    Get time-series data for ROI analysis charts (Last 7 days).
    
    Y-Axis (Accuracy): AVG(value) from model_metrics WHERE metric_type='accuracy'
    Y-Axis (ROI): SUM(business_impact_value) / (SUM(latency_ms) * CostFactor) from model_execution_logs
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=6) # 7 days inclusive
    
    # Initialize result structure map
    # date_str -> {'roi': 0, 'accuracy': 0, 'acc_count': 0, 'impact_sum': 0, 'latency_sum': 0}
    date_map = {}
    for i in range(7):
        d = (end_date - timedelta(days=i)).strftime('%Y-%m-%d')
        date_map[d] = {
            'accuracy_sum': 0.0, 'accuracy_count': 0, 
            'impact_sum': 0.0, 'latency_sum': 0.0
        }
        
    # 1. Query Accuracy from model_metrics
    # Group by date
    acc_results = db.query(
        func.strftime('%Y-%m-%d', ModelMetric.timestamp).label('date'),
        func.avg(ModelMetric.value).label('avg_val')
    ).filter(
        ModelMetric.metric_type == 'accuracy',
        ModelMetric.timestamp >= start_date
    ).group_by(
        func.strftime('%Y-%m-%d', ModelMetric.timestamp)
    ).all()
    
    for r in acc_results:
        d = r.date
        if d in date_map:
            date_map[d]['accuracy_avg'] = r.avg_val

    # 2. Query ROI components from model_execution_logs
    roi_results = db.query(
        func.strftime('%Y-%m-%d', ModelExecutionLog.timestamp).label('date'),
        func.sum(ModelExecutionLog.business_impact_value).label('total_impact'),
        func.sum(ModelExecutionLog.latency_ms).label('total_latency')
    ).filter(
        ModelExecutionLog.timestamp >= start_date
    ).group_by(
        func.strftime('%Y-%m-%d', ModelExecutionLog.timestamp)
    ).all()
    
    COST_FACTOR = 0.5 # Configurable cost factor
    
    for r in roi_results:
        d = r.date
        if d in date_map:
            impact = r.total_impact or 0
            latency = r.total_latency or 0
            # ROI Formula: Impact / (Latency * CostFactor)
            # Avoid division by zero
            if latency > 0:
                roi = impact / (latency * COST_FACTOR)
            else:
                roi = 0
            date_map[d]['roi'] = roi

    # Format for frontend
    # Sort by date ascending
    sorted_dates = sorted(date_map.keys())
    
    return {
        "dates": sorted_dates,
        "roi_trend": [round(date_map[d].get('roi', 0), 2) for d in sorted_dates],
        "accuracy_trend": [round(date_map[d].get('accuracy_avg', 0), 2) for d in sorted_dates]
    }

@router.post('/simulate-traffic')
def simulate_traffic(days_back: int = 0, db: Session = Depends(get_db)):
    """
    Helper to generate some traffic for the demo.
    """
    models = ["RiskModel V2", "ValuationModel V1", "ClassificationModel V3"]
    outcomes = ["Auto-Pass", "Manual-Review", "Risk-Flagged"]
    
    # Adjust timestamp based on days_back
    base_time = datetime.utcnow() - timedelta(days=days_back)
    
    # Fetch some real order IDs for association
    order_ids = [o.id for o in db.query(Order.id).limit(50).all()]
    if not order_ids:
        order_ids = [str(uuid.uuid4())]

    for _ in range(5):
        m_name = random.choice(models)
        outcome = random.choice(outcomes)
        oid = random.choice(order_ids)
        impact = 0
        if outcome == "Auto-Pass":
            impact = random.randint(100, 500) # Saved cost
        elif outcome == "Risk-Flagged":
            impact = random.randint(1000, 5000) # Prevented loss
            
        log = ModelExecutionLog(
            id=str(uuid.uuid4()),
            order_id=oid,
            model_id=m_name.lower().replace(" ", "-"),
            model_name=m_name,
            input_snapshot=f"Declaration_{random.randint(10000,99999)}",
            output_result=f"Score: {random.uniform(0,1):.2f}",
            business_outcome=outcome,
            business_impact_value=impact,
            latency_ms=random.randint(50, 300),
            status="success",
            timestamp=base_time - timedelta(minutes=random.randint(0, 1440))
        )
        db.add(log)
        
        # Simulate accuracy metric for this model execution
        # Occasional metric log
        if random.random() > 0.5:
            acc_metric = ModelMetric(
                model_id=log.model_id,
                metric_type="accuracy",
                value=random.uniform(85.0, 99.0),
                timestamp=base_time - timedelta(minutes=random.randint(0, 1440))
            )
            db.add(acc_metric)
    
    # Simulate efficiency metric
    eff_metric = ModelMetric(
        model_id="system",
        metric_type="efficiency_boost",
        value=random.uniform(15.0, 45.0),
        timestamp=base_time
    )
    db.add(eff_metric)
    
    db.commit()
    return {"message": "Simulated 5 transactions"}
