from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend_py.db import SessionLocal
from backend_py.models.customs import CustomsHeader, CustomsItem
from backend_py.schemas.customs import CustomsHeaderIn, CustomsItemIn

router = APIRouter(prefix='/api/customs')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('/headers')
def list_headers(q: str = '', status: str = 'all', portCode: str = 'all', tradeMode: str = 'all', hsChap: str = 'all', hsHead: str = 'all', hsSub: str = 'all', onlyBadHs: bool = False, onlyMissingUnit: bool = False, onlyAbnormalQty: bool = False, offset: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    query = db.query(CustomsHeader)
    if q:
        query = query.filter((CustomsHeader.declaration_no.like(f'%{q}%')) | (CustomsHeader.enterprise.like(f'%{q}%')))
    if status and status != 'all':
        query = query.filter(CustomsHeader.status == status)
    if portCode and portCode != 'all':
        query = query.filter(CustomsHeader.port_code == portCode)
    if tradeMode and tradeMode != 'all':
        query = query.filter(CustomsHeader.trade_mode == tradeMode)
    if hsChap and hsChap != 'all':
        query = query.filter(db.query(CustomsItem).filter(CustomsItem.header_id == CustomsHeader.id).filter(func.substr(func.replace(CustomsItem.hs_code, '.', ''), 1, 2) == hsChap).exists())
    if hsHead and hsHead != 'all':
        query = query.filter(db.query(CustomsItem).filter(CustomsItem.header_id == CustomsHeader.id).filter(func.substr(func.replace(CustomsItem.hs_code, '.', ''), 1, 4) == hsHead).exists())
    if hsSub and hsSub != 'all':
        query = query.filter(db.query(CustomsItem).filter(CustomsItem.header_id == CustomsHeader.id).filter(func.replace(CustomsItem.hs_code, '.', '') == hsSub).exists())
    if onlyBadHs:
        query = query.filter(db.query(CustomsItem).filter(CustomsItem.header_id == CustomsHeader.id).filter(func.length(func.replace(CustomsItem.hs_code, '.', '')) < 8).exists())
    if onlyMissingUnit:
        query = query.filter(db.query(CustomsItem).filter(CustomsItem.header_id == CustomsHeader.id).filter((CustomsItem.unit == None) | (CustomsItem.unit == '')).exists())
    if onlyAbnormalQty:
        query = query.filter(db.query(CustomsItem).filter(CustomsItem.header_id == CustomsHeader.id).filter((CustomsItem.qty == None) | (CustomsItem.qty <= 0)).exists())
    rows = query.order_by(CustomsHeader.declare_date.desc()).offset(offset).limit(limit).all()
    return [{
        'id': r.id,
        'declarationNo': r.declaration_no,
        'enterprise': r.enterprise,
        'portCode': r.port_code,
        'tradeMode': r.trade_mode,
        'currency': r.currency,
        'totalValue': r.total_value,
        'status': r.status,
        'declareDate': str(r.declare_date),
        'orderId': r.order_id
    } for r in rows]

@router.get('/headers/count')
def count_headers(q: str = '', status: str = 'all', portCode: str = 'all', tradeMode: str = 'all', hsChap: str = 'all', hsHead: str = 'all', hsSub: str = 'all', onlyBadHs: bool = False, onlyMissingUnit: bool = False, onlyAbnormalQty: bool = False, db: Session = Depends(get_db)):
    query = db.query(CustomsHeader)
    if q:
        query = query.filter((CustomsHeader.declaration_no.like(f'%{q}%')) | (CustomsHeader.enterprise.like(f'%{q}%')))
    if status and status != 'all':
        query = query.filter(CustomsHeader.status == status)
    if portCode and portCode != 'all':
        query = query.filter(CustomsHeader.port_code == portCode)
    if tradeMode and tradeMode != 'all':
        query = query.filter(CustomsHeader.trade_mode == tradeMode)
    if hsChap and hsChap != 'all':
        query = query.filter(db.query(CustomsItem).filter(CustomsItem.header_id == CustomsHeader.id).filter(func.substr(func.replace(CustomsItem.hs_code, '.', ''), 1, 2) == hsChap).exists())
    if hsHead and hsHead != 'all':
        query = query.filter(db.query(CustomsItem).filter(CustomsItem.header_id == CustomsHeader.id).filter(func.substr(func.replace(CustomsItem.hs_code, '.', ''), 1, 4) == hsHead).exists())
    if hsSub and hsSub != 'all':
        query = query.filter(db.query(CustomsItem).filter(CustomsItem.header_id == CustomsHeader.id).filter(func.replace(CustomsItem.hs_code, '.', '') == hsSub).exists())
    if onlyBadHs:
        query = query.filter(db.query(CustomsItem).filter(CustomsItem.header_id == CustomsHeader.id).filter(func.length(func.replace(CustomsItem.hs_code, '.', '')) < 8).exists())
    if onlyMissingUnit:
        query = query.filter(db.query(CustomsItem).filter(CustomsItem.header_id == CustomsHeader.id).filter((CustomsItem.unit == None) | (CustomsItem.unit == '')).exists())
    if onlyAbnormalQty:
        query = query.filter(db.query(CustomsItem).filter(CustomsItem.header_id == CustomsHeader.id).filter((CustomsItem.qty == None) | (CustomsItem.qty <= 0)).exists())
    return {'count': query.count()}

@router.post('/headers')
def upsert_header(data: CustomsHeaderIn, db: Session = Depends(get_db)):
    r = db.query(CustomsHeader).filter(CustomsHeader.id == data.id).first()
    if r:
        r.declaration_no = data.declaration_no
        r.enterprise = data.enterprise
        r.consignor = data.consignor
        r.consignee = data.consignee
        r.port_code = data.port_code
        r.trade_mode = data.trade_mode
        r.currency = data.currency
        r.total_value = data.total_value
        r.status = data.status
        r.order_id = data.order_id
    else:
        r = CustomsHeader(
            id=data.id,
            declaration_no=data.declaration_no,
            enterprise=data.enterprise,
            consignor=data.consignor,
            consignee=data.consignee,
            port_code=data.port_code,
            trade_mode=data.trade_mode,
            currency=data.currency,
            total_value=data.total_value,
            status=data.status,
            declare_date=data.declare_date,
            order_id=data.order_id
        )
        db.add(r)
    db.commit()
    return {'ok': True}

@router.get('/items/{header_id}')
def list_items(header_id: str, db: Session = Depends(get_db)):
    rows = db.query(CustomsItem).filter(CustomsItem.header_id == header_id).order_by(CustomsItem.line_no.asc()).all()
    return [{
        'id': r.id,
        'headerId': r.header_id,
        'lineNo': r.line_no,
        'hsCode': r.hs_code,
        'name': r.name,
        'spec': r.spec,
        'unit': r.unit,
        'qty': r.qty,
        'unitPrice': r.unit_price,
        'amount': r.amount,
        'taxRate': r.tax_rate,
        'tariff': r.tariff,
        'excise': r.excise,
        'vat': r.vat
    } for r in rows]

@router.post('/items')
def insert_item(data: CustomsItemIn, db: Session = Depends(get_db)):
    r = CustomsItem(
        id=data.id,
        header_id=data.header_id,
        line_no=data.line_no,
        hs_code=data.hs_code,
        name=data.name,
        spec=data.spec,
        unit=data.unit,
        qty=data.qty,
        unit_price=data.unit_price,
        amount=data.amount,
        origin_country=data.origin_country,
        tax_rate=data.tax_rate,
        tariff=data.tariff,
        excise=data.excise,
        vat=data.vat
    )
    db.add(r)
    db.commit()
    return {'ok': True}
