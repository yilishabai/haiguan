from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend_py.db import SessionLocal
from backend_py.models.orders import Order
from backend_py.models.logistics import Logistics
from backend_py.models.settlements import Settlement
from backend_py.models.customs import CustomsItem, CustomsHeader
from sqlalchemy.sql import func

router = APIRouter(prefix='/api/risk')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('/score')
def score_order(orderId: str, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == orderId).first()
    if not o:
        return {'compliance': 0, 'messages': ['order_not_found']}
    score = 95
    messages = []
    cat = (o.category or '').lower()

    if cat == 'beauty':
        pass
    elif cat == 'wine':
        pass
    elif cat == 'electronics':
        missing_origin = db.query(CustomsItem).join(CustomsHeader, CustomsItem.header_id == CustomsHeader.id).filter(CustomsHeader.order_id == orderId).filter((CustomsItem.origin_country == None) | (CustomsItem.origin_country == '')).count()
        if missing_origin > 0:
            messages.append('电子产品缺少原产国')
            score -= 5
    elif cat == 'textile':
        no_spec = db.query(CustomsItem).join(CustomsHeader, CustomsItem.header_id == CustomsHeader.id).filter(CustomsHeader.order_id == orderId).filter((CustomsItem.spec == None) | (CustomsItem.spec == '')).count()
        if no_spec > 0:
            messages.append('纺织品缺少规格')
            score -= 5
    elif cat == 'appliance':
        s = db.query(Settlement).filter(Settlement.order_id == orderId).first()
        if not s or s.status != 'completed':
            messages.append('家电建议在结算完成后安排发运')
            score -= 3

    bad_hs = db.query(CustomsItem).join(CustomsHeader, CustomsItem.header_id == CustomsHeader.id).filter(CustomsHeader.order_id == orderId).filter((CustomsItem.hs_code == None) | (CustomsItem.hs_code == '') | (func.length(func.replace(CustomsItem.hs_code, '.', '')) < 8)).count()
    if bad_hs > 0:
        messages.append('HS编码不完整')
        score -= 6

    lg = db.query(Logistics).filter(Logistics.order_id == orderId).order_by(Logistics.id.desc()).first()
    inc = getattr(o, 'incoterms', '')
    if inc == 'CIF':
        if not lg or not (lg.efficiency or 0):
            messages.append('CIF缺少保险费用')
            score -= 6

    if score < 0:
        score = 0
    return {'compliance': score, 'messages': messages}
