from fastapi import FastAPI
import asyncio
import json
from backend_py.db import SessionLocal
from backend_py.models.jobs import Job
from backend_py.models.settlements import Settlement
from backend_py.models.logistics import Logistics
from backend_py.models.orders import Order
from backend_py.models.customs import CustomsHeader, CustomsItem
from backend_py.models.warehouse import Inventory
from backend_py.db import init_db
from backend_py.routers.orders import router as orders_router
from backend_py.routers.customs import router as customs_router
from backend_py.routers.logistics import router as logistics_router
from backend_py.routers.settlements import router as settlements_router
from backend_py.routers.warehouse import router as warehouse_router
from backend_py.routers.algorithms import router as algorithms_router
from backend_py.routers.jobs import router as jobs_router
from backend_py.routers.risk import router as risk_router

app = FastAPI()
init_db()

app.include_router(orders_router)
app.include_router(customs_router)
app.include_router(logistics_router)
app.include_router(settlements_router)
app.include_router(warehouse_router)
app.include_router(algorithms_router)
app.include_router(jobs_router)
app.include_router(risk_router)

@app.get('/api/health')
def health():
    return {'ok': True}

lock = asyncio.Lock()

async def process_job(session: SessionLocal, job: Job):
    try:
        data = json.loads(job.payload or '{}')
        if job.type == 'settlement_complete':
            oid = data.get('order_id')
            s = session.query(Settlement).filter(Settlement.order_id == oid).first()
            if not s:
                s = Settlement(id='S' + oid, order_id=oid, status='processing', settlement_time=0, risk_level='low')
                session.add(s)
                session.commit()
            s.status = 'completed'
            s.settlement_time = data.get('time', 24)
            session.commit()
        elif job.type == 'customs_progress':
            hid = data.get('header_id')
            h = session.query(CustomsHeader).filter(CustomsHeader.id == hid).first()
            if h:
                h.status = data.get('next_status', 'cleared')
                session.commit()
        elif job.type == 'customs_declare':
            hdr = data.get('header') or {}
            items = data.get('items') or []
            hid = hdr.get('id')
            if not hid:
                raise Exception('missing header id')
            h = session.query(CustomsHeader).filter(CustomsHeader.id == hid).first()
            if not h:
                h = CustomsHeader(
                    id=hid,
                    declaration_no=hdr.get('declarationNo'),
                    enterprise=hdr.get('enterprise'),
                    port_code=hdr.get('portCode'),
                    trade_mode=hdr.get('tradeMode'),
                    currency=hdr.get('currency'),
                    total_value=hdr.get('totalValue') or 0.0,
                    status=hdr.get('status') or 'declared',
                    order_id=hdr.get('orderId')
                )
                session.add(h)
                session.commit()
            for it in items:
                iid = it.get('id')
                exists = session.query(CustomsItem).filter(CustomsItem.id == iid).first()
                if exists:
                    continue
                ci = CustomsItem(
                    id=iid,
                    header_id=hid,
                    line_no=it.get('lineNo') or 0,
                    hs_code=it.get('hsCode') or '',
                    name=it.get('name') or '',
                    spec=it.get('spec') or '',
                    unit=it.get('unit') or '',
                    qty=it.get('qty') or 0.0,
                    unit_price=it.get('unitPrice') or 0.0,
                    amount=it.get('amount') or 0.0,
                    origin_country=it.get('originCountry') or '',
                    tax_rate=it.get('taxRate') or 0.0,
                    tariff=it.get('tariff') or 0.0,
                    excise=it.get('excise') or 0.0,
                    vat=it.get('vat') or 0.0
                )
                session.add(ci)
            session.commit()
        elif job.type == 'logistics_milestone':
            lid = data.get('id')
            l = session.query(Logistics).filter(Logistics.id == lid).first()
            if l:
                cur = l.status or 'pickup'
                nxt = 'transit' if cur == 'pickup' else ('completed' if cur == 'transit' else 'completed')
                l.status = data.get('next_status', nxt)
                session.commit()
                if l.status == 'completed':
                    o = session.query(Order).filter(Order.id == l.order_id).first()
                    cat = (o.category if o else '') or ''
                    name = '电子产品' if cat=='electronics' else ('化妆品' if cat=='beauty' else ('服装' if cat=='textile' else ('食品' if cat=='wine' else ('机械设备' if cat=='appliance' else '通用商品'))))
                    inv = session.query(Inventory).filter(Inventory.name == name).first()
                    if not inv:
                        inv = Inventory(name=name, current=0, target=1000, production=0, sales=0, efficiency=90)
                        session.add(inv)
                        session.commit()
                    inv.current = (inv.current or 0) + 10
                    session.commit()
        else:
            pass
        job.status = 'done'
        session.commit()
    except Exception:
        job.status = 'failed'
        session.commit()

async def job_worker():
    while True:
        async with lock:
            session = SessionLocal()
            try:
                job = session.query(Job).filter(Job.status == 'pending').order_by(Job.created_at.asc()).first()
                if job:
                    job.status = 'processing'
                    session.commit()
                    await process_job(session, job)
            finally:
                session.close()
        await asyncio.sleep(1)

@app.on_event('startup')
async def startup_event():
    asyncio.create_task(job_worker())
