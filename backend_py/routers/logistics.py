from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend_py.db import SessionLocal
from backend_py.models.logistics import Logistics
from backend_py.models.orders import Order
from backend_py.schemas.logistics import LogisticsIn

router = APIRouter(prefix='/api/logistics')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('')
def list_logistics(q: str = '', status: str = 'all', offset: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    query = db.query(Logistics)
    if q:
        query = query.filter((Logistics.tracking_no.like(f'%{q}%')) | (Logistics.origin.like(f'%{q}%')) | (Logistics.destination.like(f'%{q}%')) | (Logistics.order_id.like(f'%{q}%')))
    if status and status != 'all':
        query = query.filter(Logistics.status == status)
    rows = query.order_by(Logistics.id.desc()).offset(offset).limit(limit).all()
    order_map = {}
    if rows:
        ids = [r.order_id for r in rows if r.order_id]
        if ids:
            ors = db.query(Order).filter(Order.id.in_(ids)).all()
            order_map = {o.id: o for o in ors}
    return [{
        'id': r.id,
        'trackingNo': r.tracking_no,
        'origin': r.origin,
        'destination': r.destination,
        'status': r.status,
        'estimatedTime': r.estimated_time,
        'actualTime': r.actual_time,
        'efficiency': r.efficiency,
        'orderId': r.order_id,
        'mode': r.mode,
        'etd': r.etd,
        'eta': r.eta,
        'atd': r.atd,
        'ata': r.ata,
        'blNo': r.bl_no,
        'awbNo': r.awb_no,
        'isFcl': r.is_fcl,
        'freightCost': r.freight_cost,
        'insuranceCost': r.insurance_cost,
        'carrier': r.carrier,
        'warehouseStatus': r.warehouse_status,
        'orderNumber': (order_map.get(r.order_id).order_number if r.order_id in order_map else None),
        'enterprise': (order_map.get(r.order_id).enterprise if r.order_id in order_map else None)
    } for r in rows]

@router.get('/count')
def count_logistics(q: str = '', status: str = 'all', db: Session = Depends(get_db)):
    query = db.query(Logistics)
    if q:
        query = query.filter((Logistics.tracking_no.like(f'%{q}%')) | (Logistics.origin.like(f'%{q}%')) | (Logistics.destination.like(f'%{q}%')) | (Logistics.order_id.like(f'%{q}%')))
    if status and status != 'all':
        query = query.filter(Logistics.status == status)
    return {'count': query.count()}

@router.post('')
def upsert_logistics(data: LogisticsIn, db: Session = Depends(get_db)):
    r = db.query(Logistics).filter(Logistics.id == data.id).first()
    if r:
        r.tracking_no = data.tracking_no
        r.origin = data.origin
        r.destination = data.destination
        r.status = data.status
        r.estimated_time = data.estimated_time
        r.actual_time = data.actual_time or 0
        r.efficiency = data.efficiency or 0
        r.order_id = data.order_id or ''
        r.mode = data.mode
        r.etd = data.etd
        r.eta = data.eta
        r.atd = data.atd
        r.ata = data.ata
        r.bl_no = data.bl_no
        r.awb_no = data.awb_no
        r.is_fcl = data.is_fcl
        r.freight_cost = data.freight_cost
        r.insurance_cost = data.insurance_cost
        r.carrier = data.carrier
    else:
        r = Logistics(
            id=data.id,
            tracking_no=data.tracking_no,
            origin=data.origin,
            destination=data.destination,
            status=data.status,
            estimated_time=data.estimated_time,
            actual_time=data.actual_time or 0,
            efficiency=data.efficiency or 0,
            order_id=data.order_id or '',
            mode=data.mode,
            etd=data.etd,
            eta=data.eta,
            atd=data.atd,
            ata=data.ata,
            bl_no=data.bl_no,
            awb_no=data.awb_no,
            is_fcl=data.is_fcl,
            freight_cost=data.freight_cost,
            insurance_cost=data.insurance_cost,
            carrier=data.carrier
        )
        db.add(r)
    db.commit()
    return {'ok': True}

@router.delete('/{id}')
def delete_logistics(id: str, db: Session = Depends(get_db)):
    db.query(Logistics).filter(Logistics.id == id).delete()
    db.commit()
    return {'ok': True}
