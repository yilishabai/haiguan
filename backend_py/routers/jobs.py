from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend_py.db import SessionLocal
from backend_py.models.jobs import Job
import uuid
import json

router = APIRouter(prefix='/api/jobs')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('')
def list_jobs(status: str = 'all', db: Session = Depends(get_db)):
    q = db.query(Job)
    if status != 'all':
        q = q.filter(Job.status == status)
    rows = q.order_by(Job.created_at.desc()).limit(100).all()
    return [{
        'id': r.id,
        'type': r.type,
        'status': r.status,
        'payload': r.payload,
        'createdAt': r.created_at,
    } for r in rows]

@router.post('')
def enqueue_job(type: str, payload: dict, db: Session = Depends(get_db)):
    jid = str(uuid.uuid4())
    j = Job(id=jid, type=type, payload=json.dumps(payload), status='pending')
    db.add(j)
    db.commit()
    return {'ok': True, 'id': jid}

