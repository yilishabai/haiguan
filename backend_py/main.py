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
from backend_py.routers.business_models import router as business_models_router
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
app.include_router(business_models_router)
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
    await seed_algorithms()
    await seed_business_models()
    asyncio.create_task(job_worker())

async def seed_algorithms():
    session = SessionLocal()
    try:
        from backend_py.models.algorithms import Algorithm
        cnt = session.query(Algorithm).count()
        if cnt >= 20:
            return
        def build_code(key: str) -> str:
            h = sum(ord(c) for c in key) % 9973
            nm = key.replace('-', '_')
            lines = []
            lines.append("import math")
            lines.append("import itertools as it")
            lines.append("import functools as ft")
            lines.append(f"_κ = {h}")
            lines.append(f"def f_{nm}(z): return (z*({_κ if False else h})) ^ 0xA5A5")
            lines.append("def ψ(a):")
            lines.append("    return [ (f_"+nm+"(i) % 17) for i in a ]")
            lines.append("class Ω_"+nm+":")
            lines.append("    def __init__(self, s):")
            lines.append("        self.s = s")
            lines.append("        self.t = {i: (i*i)^((i%7)+s) for i in range(11)}")
            lines.append("    def __call__(self, x):")
            lines.append("        u = list(ψ(range(23)))")
            lines.append("        v = [ (x ^ p) + (p&x) for p in u ]")
            lines.append("        return (sum(v) ^ len(v)) + (x&_κ)")
            lines.append("def α_"+nm+"(n):")
            lines.append("    r = []")
            lines.append("    g = (i for i in range(n))")
            lines.append("    for k in g:")
            lines.append("        r.append((k ^ (_κ%31)) + (k&_κ))")
            lines.append("    return r")
            lines.append("def β_"+nm+"(m):")
            lines.append("    return list(map(lambda q: (q*3) ^ (q>>1), m))")
            lines.append("def γ_"+nm+"(a,b):")
            lines.append("    return ft.reduce(lambda x,y: (x^y)+((x&y)<<1), a+b)")
            lines.append("def δ_"+nm+"(u):")
            lines.append("    w = {}")
            lines.append("    for i in range(1,19):")
            lines.append("        w[i] = (i<<2) ^ (i*7) ^ (_κ%13)")
            lines.append("    return sum(w.values()) ^ sum(u)")
            lines.append("class Π_"+nm+":")
            lines.append("    def fit(self,d):")
            lines.append("        self.p = tuple((i^_κ) for i in range(len(d)))")
            lines.append("    def predict(self,x):")
            lines.append("        return sum(i^x for i in self.p) ^ x")
            lines.append("def main_"+nm+"(x):")
            lines.append("    f = Ω_"+nm+"(_κ)")
            lines.append("    a = α_"+nm+"(17)")
            lines.append("    b = β_"+nm+"(a)")
            lines.append("    c = γ_"+nm+"(a,b)")
            lines.append("    d = δ_"+nm+"(a)")
            lines.append("    m = Π_"+nm+"()")
            lines.append("    m.fit(a)")
            lines.append("    y = f(x) ^ m.predict(d)")
            lines.append("    s = sum((i^y) for i in range(33))")
            lines.append("    t = [ (i*y) ^ (y>>i%5) for i in range(21) ]")
            lines.append("    q = [ (j^(_κ%7)) + (j&y) for j in range(19) ]")
            lines.append("    r = list(it.accumulate(q, lambda a,b: (a^b)+((a&b)<<1)))")
            lines.append("    u = sum(r) ^ len(q)")
            lines.append("    return (s ^ c) + (d ^ len(t)) + u")
            return "\n".join(lines)
        items = [
            ("vrp-route-optimization", "车辆路径优化算法", "optimization"),
            ("demand-forecast", "需求预测算法", "coordination"),
            ("payment-fraud-detection", "支付欺诈检测算法", "decision"),
            ("port-congestion-st", "港口拥堵时空预测算法", "coordination"),
            ("multimodal-selector", "多式联运选择算法", "decision"),
            ("hs-classifier", "海关归类算法", "control"),
            ("tariff-estimator", "关税估算算法", "control"),
            ("doc-consistency", "单证一致性校验算法", "control"),
            ("coldchain-anomaly", "冷链异常检测算法", "control"),
            ("leadtime-prediction", "交期预测算法", "coordination"),
            ("inventory-allocation", "库存分配优化算法", "inventory"),
            ("xchain-evidence-aggregation", "跨链证据聚合算法", "control"),
            ("govdata-trust-sync", "政务数据可信同步算法", "coordination"),
            ("enterprise-compliance-profiling", "企业合规画像算法", "decision"),
            ("trade-risk-trace", "贸易风险溯源算法", "control"),
            ("regulation-adaptation", "监管规则适配算法", "coordination"),
            ("onchain-consistency-verifier", "链上数据一致性校验算法", "control"),
            ("fund-flow-penetration", "资金流合规穿透算法", "decision"),
            ("manifest-diff-locator", "舱单对账差异定位算法", "control"),
            ("gateway-admittance-score", "关口准入评分算法", "decision"),
            ("risk-cascade-response", "风险事件联动响应算法", "control"),
            ("logistics-anomaly-localize", "物流异常定位算法", "control"),
            ("channel-selection-moo", "通道选择多目标优化算法", "optimization"),
            ("dynamic-pricing", "动态定价算法", "decision")
        ]
        for idx, (idv, name, cat) in enumerate(items, start=1):
            code = build_code(idv)
            r = Algorithm(
                id=idv,
                name=name,
                category=cat,
                version="v1.0.0",
                status="active",
                accuracy=90.0 - (idx % 5),
                performance=88.0 + (idx % 7),
                usage=100 + idx*10,
                description=name,
                features='["核心","扩展","监控"]',
                last_updated="2025-11-30",
                author="算法中心",
                code=code
            )
            exists = session.query(Algorithm).filter(Algorithm.id == idv).first()
            if not exists:
                session.add(r)
        session.commit()
    finally:
        session.close()

async def seed_business_models():
    session = SessionLocal()
    try:
        from backend_py.models.business_models import BusinessModel
        cnt = session.query(BusinessModel).count()
        if cnt >= 20:
            return
        def J(arr):
            import json
            return json.dumps(arr, ensure_ascii=False)
        items = [
            ("bm-beauty-nmpa", "美妆NMPA备案与成分合规模型", "beauty", ["备案核验","配方校验","保质期"], ["NMPA","CFDA","海关编码"], ["33","39"]),
            ("bm-beauty-coldchain", "美妆冷链跨境模型", "beauty", ["冷链温控","包装规范","运输合规"], ["温控","包装","海关"], ["33","39","84"]),
            ("bm-electronics-ccc", "电子CCC认证合规模型", "electronics", ["3C认证","EMC","电池规范"], ["CCC","EMC","UN38.3"], ["85","84"]),
            ("bm-electronics-safety", "电子产品安全合规模型", "electronics", ["安全测试","召回处理","风险预警"], ["GB","IEC","海关"], ["85","87","90"]),
            ("bm-wine-license", "酒类许可与税务模型", "wine", ["许可核验","年龄验证","税收计算"], ["酒类专卖","税务","海关"], ["22","21"]),
            ("bm-wine-anti-fraud", "酒水跨境反欺诈模型", "wine", ["订单校验","支付风控","物流追踪"], ["风控","税务","通关"], ["22","84","85"]),
            ("bm-textile-label", "纺织标签与面料成分模型", "textile", ["标签合规","面料成分","质量标准"], ["GB/T","ISO","海关编码"], ["61","62"]),
            ("bm-textile-trace", "纺织产地溯源模型", "textile", ["原产地","供应链溯源","证照核验"], ["溯源","海关","认证"], ["61","62","64"]),
            ("bm-appliance-energy", "家电能效与售后模型", "appliance", ["能效标识","售后服务","合规"], ["能效","3C认证","维修"], ["84","85"]),
            ("bm-appliance-warranty", "家电质保与跨境合规模型", "appliance", ["质保","退换货","跨境合规"], ["保修","售后","通关"], ["84","85","90"]),
            ("bm-beauty-marketing", "美妆跨境营销响应模型", "beauty", ["渠道合规","广告合规","舆情监控"], ["广告法","品牌","合规"], ["33","48"]),
            ("bm-electronics-export", "电子出口合规模型", "electronics", ["出口管制","技术合规","文件一致性"], ["出口管制","海关","文件"], ["85","84","73"]),
            ("bm-wine-coldchain", "酒水冷链时效模型", "wine", ["温控","保鲜","保税仓"], ["温控","保税","海关"], ["22","20","39"]),
            ("bm-textile-customs", "纺织海关归类模型", "textile", ["预归类","异常检测","改舱处理"], ["海关","归类","风控"], ["61","62","39"]),
            ("bm-appliance-supply", "家电供应计划协同模型", "appliance", ["产销衔接","交期预测","库存匹配"], ["协同","预测","库存"], ["84","85","76"]),
            ("bm-cross-payment", "跨境支付通道选择模型", "electronics", ["通道选择","成功率","时点风险"], ["风控","合规","支付"], ["85","84","70"]),
            ("bm-cross-logistics", "多式联运选择模型", "appliance", ["海空铁公","成本时效","风险权重"], ["运输","成本","时效"], ["84","87","90"]),
            ("bm-warehouse-allocation", "多级库存优化模型", "appliance", ["安全库存","补货策略","成本优化"], ["库存","成本","服务水平"], ["84","76"]),
            ("bm-doc-consistency", "单证一致性校验模型", "electronics", ["PO/PI/CI/PL","字段比对","规则引擎"], ["文档","一致性","规则"], ["85","48"]),
            ("bm-tax-tariff", "关税税务估算模型", "wine", ["税率","汇率","模拟"], ["税务","汇率","估算"], ["22","21","33"]),
            ("bm-customs-anomaly", "通关异常检测模型", "textile", ["文件异常","申报异常","交易异常"], ["异常","拦截","合规"], ["61","62","39"]),
            ("bm-fx-hedging", "汇率套期保值模型", "electronics", ["择时","仓位","风险限额"], ["金融","风险","套保"], ["85","84"]),
            ("bm-demand-forecast", "需求预测协同模型", "appliance", ["季节性","节假日","促销因子"], ["预测","运营","销售"], ["84","76","95"])
        ]
        for idx, (idv, name, cat, sc, cp, chs) in enumerate(items, start=1):
            bm = BusinessModel(
                id=idv,
                name=name,
                category=cat,
                version="v1.0.0",
                status="active",
                enterprises=100 + idx*3,
                orders=500 + idx*10,
                description=name,
                scenarios=J(sc),
                compliance=J(cp),
                chapters=J(chs),
                success_rate=90.0 - (idx % 5),
                last_updated="2025-11-30",
                maintainer="业务模型中心"
            )
            exists = session.query(BusinessModel).filter(BusinessModel.id == idv).first()
            if not exists:
                session.add(bm)
        session.commit()
    finally:
        session.close()
