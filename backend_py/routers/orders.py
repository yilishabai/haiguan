from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend_py.db import SessionLocal
from backend_py.models.orders import Order
from backend_py.schemas.orders import OrderIn

router = APIRouter(prefix='/api/orders')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('')
def list_orders(q: str = '', status: str = 'all', category: str = 'all', offset: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    query = db.query(Order)
    if q:
        query = query.filter((Order.order_number.like(f'%{q}%')) | (Order.enterprise.like(f'%{q}%')))
    if status and status != 'all':
        query = query.filter(Order.status == status)
    if category and category != 'all':
        query = query.filter(Order.category == category)
    rows = query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()
    return [{
        'id': r.id,
        'orderNumber': r.order_number,
        'enterprise': r.enterprise,
        'category': r.category,
        'status': r.status,
        'amount': r.amount,
        'currency': r.currency,
        'createdAt': r.created_at.isoformat(),
        'incoterms': getattr(r, 'incoterms', '') or '',
        'tradeTerms': getattr(r, 'trade_terms', '') or '',
        'route': getattr(r, 'route', '') or ''
    } for r in rows]

@router.get('/count')
def count_orders(q: str = '', status: str = 'all', category: str = 'all', db: Session = Depends(get_db)):
    query = db.query(Order)
    if q:
        query = query.filter((Order.order_number.like(f'%{q}%')) | (Order.enterprise.like(f'%{q}%')))
    if status and status != 'all':
        query = query.filter(Order.status == status)
    if category and category != 'all':
        query = query.filter(Order.category == category)
    return {'count': query.count()}

@router.post('')
def upsert_order(data: OrderIn, db: Session = Depends(get_db)):
    r = db.query(Order).filter(Order.id == data.id).first()
    if r:
        r.order_number = data.order_number
        r.enterprise = data.enterprise
        r.category = data.category
        r.status = data.status
        r.amount = data.amount
        r.currency = data.currency
        r.incoterms = data.incoterms or ''
        r.trade_terms = data.trade_terms or ''
        r.route = data.route or ''
    else:
        r = Order(
            id=data.id,
            order_number=data.order_number,
            enterprise=data.enterprise,
            category=data.category,
            status=data.status,
            amount=data.amount,
            currency=data.currency,
            incoterms=data.incoterms or '',
            trade_terms=data.trade_terms or '',
            route=data.route or ''
        )
        db.add(r)
    db.commit()
    return {'ok': True}

@router.delete('/{id}')
def delete_order(id: str, db: Session = Depends(get_db)):
    db.query(Order).filter(Order.id == id).delete()
    db.commit()
    return {'ok': True}
