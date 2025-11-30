from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend_py.db import SessionLocal
from backend_py.models.business_models import BusinessModel
from backend_py.schemas.business_models import BusinessModelIn

router = APIRouter(prefix='/api/business_models')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('')
def list_models(q: str = '', category: str = 'all', offset: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    query = db.query(BusinessModel)
    if q:
        query = query.filter((BusinessModel.name.like(f'%{q}%')) | (BusinessModel.description.like(f'%{q}%')) | (BusinessModel.category.like(f'%{q}%')))
    if category and category != 'all':
        query = query.filter(BusinessModel.category == category)
    rows = query.order_by(BusinessModel.last_updated.desc()).offset(offset).limit(limit).all()
    return [{
        'id': r.id,
        'name': r.name,
        'category': r.category,
        'version': r.version,
        'status': r.status,
        'enterprises': r.enterprises,
        'orders': r.orders,
        'description': r.description,
        'scenarios': r.scenarios,
        'compliance': r.compliance,
        'chapters': r.chapters,
        'successRate': r.success_rate,
        'lastUpdated': r.last_updated,
        'maintainer': r.maintainer
    } for r in rows]

@router.get('/count')
def count_models(q: str = '', category: str = 'all', db: Session = Depends(get_db)):
    query = db.query(BusinessModel)
    if q:
        query = query.filter((BusinessModel.name.like(f'%{q}%')) | (BusinessModel.description.like(f'%{q}%')) | (BusinessModel.category.like(f'%{q}%')))
    if category and category != 'all':
        query = query.filter(BusinessModel.category == category)
    return {'count': query.count()}

@router.post('')
def upsert_model(data: BusinessModelIn, db: Session = Depends(get_db)):
    r = db.query(BusinessModel).filter(BusinessModel.id == data.id).first()
    if r:
        r.name = data.name
        r.category = data.category
        r.version = data.version
        r.status = data.status
        r.enterprises = data.enterprises
        r.orders = data.orders
        r.description = data.description
        r.scenarios = data.scenarios
        r.compliance = data.compliance
        r.chapters = data.chapters or ''
        r.success_rate = data.success_rate
        r.last_updated = data.last_updated
        r.maintainer = data.maintainer
    else:
        r = BusinessModel(
            id=data.id,
            name=data.name,
            category=data.category,
            version=data.version,
            status=data.status,
            enterprises=data.enterprises,
            orders=data.orders,
            description=data.description,
            scenarios=data.scenarios,
            compliance=data.compliance,
            chapters=data.chapters or '',
            success_rate=data.success_rate,
            last_updated=data.last_updated,
            maintainer=data.maintainer
        )
        db.add(r)
    db.commit()
    return {'ok': True}

@router.delete('/{id}')
def delete_model(id: str, db: Session = Depends(get_db)):
    db.query(BusinessModel).filter(BusinessModel.id == id).delete()
    db.commit()
    return {'ok': True}
