from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend_py.db import SessionLocal
from backend_py.models.settlements import Settlement
from backend_py.models.orders import Order
from backend_py.schemas.settlements import SettlementIn

router = APIRouter(prefix='/api/settlements')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('')
def list_settlements(q: str = '', status: str = 'all', offset: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    query = db.query(Settlement)
    if q:
        ids = [o.id for o in db.query(Order).filter((Order.order_number.like(f'%{q}%')) | (Order.enterprise.like(f'%{q}%'))).all()]
        if ids:
            query = query.filter(Settlement.order_id.in_(ids))
        else:
            query = query.filter(Settlement.order_id == q)
    if status and status != 'all':
        query = query.filter(Settlement.status == status)
    rows = query.order_by(Settlement.id.desc()).offset(offset).limit(limit).all()
    order_map = {}
    if rows:
        ids2 = [r.order_id for r in rows if r.order_id]
        if ids2:
            ors = db.query(Order).filter(Order.id.in_(ids2)).all()
            order_map = {o.id: o for o in ors}
    return [{
        'id': r.id,
        'orderId': r.order_id,
        'orderNumber': (order_map.get(r.order_id).order_number if r.order_id in order_map else None),
        'enterprise': (order_map.get(r.order_id).enterprise if r.order_id in order_map else None),
        'status': r.status,
        'settlementTime': r.settlement_time,
        'riskLevel': r.risk_level
    } for r in rows]

@router.get('/count')
def count_settlements(q: str = '', status: str = 'all', db: Session = Depends(get_db)):
    query = db.query(Settlement)
    if q:
        ids = [o.id for o in db.query(Order).filter((Order.order_number.like(f'%{q}%')) | (Order.enterprise.like(f'%{q}%'))).all()]
        if ids:
            query = query.filter(Settlement.order_id.in_(ids))
        else:
            query = query.filter(Settlement.order_id == q)
    if status and status != 'all':
        query = query.filter(Settlement.status == status)
    return {'count': query.count()}

@router.post('')
def upsert_settlement(data: SettlementIn, db: Session = Depends(get_db)):
    r = db.query(Settlement).filter(Settlement.id == data.id).first()
    if r:
        r.order_id = data.order_id
        r.status = data.status
        r.settlement_time = data.settlement_time or 0
        r.risk_level = data.risk_level or 'low'
    else:
        r = Settlement(
            id=data.id,
            order_id=data.order_id,
            status=data.status,
            settlement_time=data.settlement_time or 0,
            risk_level=data.risk_level or 'low'
        )
        db.add(r)
    db.commit()
    return {'ok': True}

@router.delete('/{id}')
def delete_settlement(id: str, db: Session = Depends(get_db)):
    db.query(Settlement).filter(Settlement.id == id).delete()
    db.commit()
    return {'ok': True}
