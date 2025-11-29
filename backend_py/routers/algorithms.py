from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend_py.db import SessionLocal
from backend_py.models.algorithms import Algorithm
from backend_py.schemas.algorithms import AlgorithmIn

router = APIRouter(prefix='/api/algorithms')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('')
def list_algorithms(q: str = '', offset: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    query = db.query(Algorithm)
    if q:
        query = query.filter((Algorithm.id.like(f'%{q}%')) | (Algorithm.name.like(f'%{q}%')))
    rows = query.order_by(Algorithm.id.asc()).offset(offset).limit(limit).all()
    return [{
        'id': r.id,
        'name': r.name,
        'category': r.category,
        'version': r.version,
        'status': r.status,
        'accuracy': r.accuracy,
        'performance': r.performance,
        'usage': r.usage,
        'description': r.description,
        'features': r.features,
        'lastUpdated': r.last_updated,
        'author': r.author,
        'code': r.code
    } for r in rows]

@router.get('/count')
def count_algorithms(q: str = '', db: Session = Depends(get_db)):
    query = db.query(Algorithm)
    if q:
        query = query.filter((Algorithm.id.like(f'%{q}%')) | (Algorithm.name.like(f'%{q}%')))
    return {'count': query.count()}

@router.post('')
def upsert_algorithm(data: AlgorithmIn, db: Session = Depends(get_db)):
    r = db.query(Algorithm).filter(Algorithm.id == data.id).first()
    if r:
        r.name = data.name
        r.category = data.category
        r.version = data.version
        r.status = data.status
        r.accuracy = data.accuracy
        r.performance = data.performance
        r.usage = data.usage
        r.description = data.description
        r.features = data.features
        r.last_updated = data.last_updated
        r.author = data.author
        r.code = data.code
    else:
        r = Algorithm(
            id=data.id,
            name=data.name,
            category=data.category,
            version=data.version,
            status=data.status,
            accuracy=data.accuracy,
            performance=data.performance,
            usage=data.usage,
            description=data.description,
            features=data.features,
            last_updated=data.last_updated,
            author=data.author,
            code=data.code
        )
        db.add(r)
    db.commit()
    return {'ok': True}
