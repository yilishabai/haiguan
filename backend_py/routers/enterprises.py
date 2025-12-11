from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend_py.db import SessionLocal
from backend_py.models.enterprises import Enterprise

router = APIRouter(prefix='/api/enterprises')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('')
def list_enterprises(q: str = '', type: str = 'all', status: str = 'all', category: str = 'all', region: str = 'all', offset: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(Enterprise)
    if q:
        like = f'%{q}%'
        query = query.filter((Enterprise.name.like(like)) | (Enterprise.reg_no.like(like)) | (Enterprise.region.like(like)))
    if type and type != 'all':
        query = query.filter(Enterprise.type == type)
    if status and status != 'all':
        query = query.filter(Enterprise.status == status)
    if category and category != 'all':
        query = query.filter(Enterprise.category == category)
    if region and region != 'all':
        query = query.filter(Enterprise.region == region)
    rows = query.order_by(Enterprise.last_active.desc()).offset(offset).limit(limit).all()
    return [{
        'id': r.id,
        'regNo': r.reg_no,
        'name': r.name,
        'type': r.type,
        'category': r.category,
        'region': r.region,
        'status': r.status,
        'compliance': r.compliance,
        'eligible': bool(r.service_eligible),
        'activeOrders': r.active_orders,
        'lastActive': r.last_active.isoformat() if r.last_active else None,
    } for r in rows]

@router.get('/count')
def count_enterprises(q: str = '', type: str = 'all', status: str = 'all', category: str = 'all', region: str = 'all', db: Session = Depends(get_db)):
    query = db.query(Enterprise)
    if q:
        like = f'%{q}%'
        query = query.filter((Enterprise.name.like(like)) | (Enterprise.reg_no.like(like)) | (Enterprise.region.like(like)))
    if type and type != 'all':
        query = query.filter(Enterprise.type == type)
    if status and status != 'all':
        query = query.filter(Enterprise.status == status)
    if category and category != 'all':
        query = query.filter(Enterprise.category == category)
    if region and region != 'all':
        query = query.filter(Enterprise.region == region)
    return {'count': query.count()}

@router.post('/batch')
def batch_upsert_enterprises(payload: list[dict], db: Session = Depends(get_db)):
    count = 0
    for row in payload:
        eid = row.get('id') or f'E{count+1}'
        ent = db.query(Enterprise).filter(Enterprise.id == eid).first()
        if not ent:
            ent = Enterprise(id=eid)
            db.add(ent)
        ent.reg_no = row.get('regNo') or row.get('reg_no') or ent.reg_no
        ent.name = row.get('name') or ent.name
        ent.type = row.get('type') or ent.type
        ent.category = row.get('category') or ent.category
        ent.region = row.get('region') or ent.region
        ent.status = row.get('status') or ent.status
        try:
            ent.compliance = float(row.get('compliance') or 0)
        except:
            ent.compliance = 0.0
        ent.service_eligible = 1 if (row.get('eligible') or row.get('service_eligible')) else 0
        try:
            ent.active_orders = int(row.get('activeOrders') or row.get('active_orders') or 0)
        except:
            ent.active_orders = 0
        # last_active optional
        count += 1
    db.commit()
    return {'ok': True, 'count': count}
