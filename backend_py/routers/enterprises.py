import uuid
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend_py.db import SessionLocal
from backend_py.models.enterprises import Enterprise
from backend_py.models.orders import Order

router = APIRouter(prefix='/api/enterprises')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('')
def list_enterprises(q: str = '', type: str = 'all', status: str = 'all', category: str = 'all', region: str = 'all', offset: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    # 1. Sync enterprises from Orders if needed
    try:
        # Find all unique enterprise names in Orders
        # Use set comprehension directly
        active_names = {x[0] for x in db.query(Order.enterprise).distinct().all() if x[0]}
        
        # Find all existing enterprise names (fetch all to avoid 'too many SQL variables' error with IN clause)
        existing_names = {x[0] for x in db.query(Enterprise.name).all()}
        
        # Identify missing ones
        missing = active_names - existing_names
        
        # Insert missing enterprises
        if missing:
            new_ents = []
            for name in missing:
                # Generate dummy data for auto-discovered enterprise
                ent = Enterprise(
                    id=f'E-AUTO-{uuid.uuid4().hex[:8]}',
                    reg_no=f'REG-{uuid.uuid4().hex[:6].upper()}',
                    name=name,
                    type='both', # Default
                    category='electronics', # Default
                    region='Unknown',
                    status='active',
                    compliance=80.0,
                    service_eligible=1,
                    active_orders=0,
                    last_active=datetime.utcnow()
                )
                new_ents.append(ent)
            db.add_all(new_ents)
            db.commit()
    except Exception as e:
        print(f"Error syncing enterprises: {e}")
        # Rollback to ensure the session is clean for the subsequent query
        db.rollback()

    # 2. Query enterprises (now including the synced ones)
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
        'lastActive': (r.last_active.isoformat() if getattr(r.last_active, 'isoformat', None) else (r.last_active if r.last_active else None)),
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
