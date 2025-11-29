from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend_py.db import SessionLocal
from backend_py.models.warehouse import Inventory
from backend_py.schemas.warehouse import InventoryIn

router = APIRouter(prefix='/api/inventory')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('')
def list_inventory(q: str = '', offset: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    query = db.query(Inventory)
    if q:
        query = query.filter(Inventory.name.like(f'%{q}%'))
    rows = query.order_by(Inventory.name.asc()).offset(offset).limit(limit).all()
    return [{
        'name': r.name,
        'current': r.current,
        'target': r.target,
        'production': r.production,
        'sales': r.sales,
        'efficiency': r.efficiency
    } for r in rows]

@router.get('/count')
def count_inventory(q: str = '', db: Session = Depends(get_db)):
    query = db.query(Inventory)
    if q:
        query = query.filter(Inventory.name.like(f'%{q}%'))
    return {'count': query.count()}

@router.post('')
def upsert_inventory(data: InventoryIn, db: Session = Depends(get_db)):
    r = db.query(Inventory).filter(Inventory.name == data.name).first()
    if r:
        r.current = data.current
        r.target = data.target
        r.production = data.production
        r.sales = data.sales
        r.efficiency = data.efficiency
    else:
        r = Inventory(
            name=data.name,
            current=data.current,
            target=data.target,
            production=data.production,
            sales=data.sales,
            efficiency=data.efficiency
        )
        db.add(r)
    db.commit()
    return {'ok': True}

@router.delete('/{name}')
def delete_inventory(name: str, db: Session = Depends(get_db)):
    db.query(Inventory).filter(Inventory.name == name).delete()
    db.commit()
    return {'ok': True}
