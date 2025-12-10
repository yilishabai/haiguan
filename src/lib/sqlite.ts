import initSqlJs, { Database } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'

let dbPromise: Promise<Database> | null = null
const STORAGE_KEY = 'sqlite_db_v1'

function toBase64(bytes: Uint8Array) {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function fromBase64(base64: string) {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function initDb() {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl })
  const saved = localStorage.getItem(STORAGE_KEY)
  const db = saved ? new SQL.Database(fromBase64(saved)) : new SQL.Database()
  if (!saved) seed(db)
  migrate(db)
  try {
    await syncFromBackendInto(db)
  } catch (_) {}
  return db
}

let persistTimer: any = null
function persist(db: Database) {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    const bytes = db.export()
    localStorage.setItem(STORAGE_KEY, toBase64(bytes))
  }, 2000)
}

function seed(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS system_metrics (key TEXT PRIMARY KEY, value REAL);
    INSERT INTO system_metrics(key,value) VALUES
      ('data_sync_delay',0.8),
      ('system_load',68.5);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT,
      enterprise TEXT,
      category TEXT,
      status TEXT,
      amount REAL,
      currency TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      status TEXT,
      settlement_time REAL,
      risk_level TEXT
    );

    CREATE TABLE IF NOT EXISTS customs_clearances (
      id TEXT PRIMARY KEY,
      declaration_no TEXT,
      product TEXT,
      enterprise TEXT,
      status TEXT,
      clearance_time REAL,
      compliance REAL,
      risk_score REAL,
      order_id TEXT
    );

    CREATE TABLE IF NOT EXISTS logistics (
      id TEXT PRIMARY KEY,
      tracking_no TEXT,
      origin TEXT,
      destination TEXT,
      status TEXT,
      estimated_time REAL,
      actual_time REAL,
      efficiency REAL,
      order_id TEXT
    );

    CREATE TABLE IF NOT EXISTS payments (
      method TEXT PRIMARY KEY,
      volume INTEGER,
      amount REAL,
      success_rate REAL,
      avg_time REAL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      name TEXT PRIMARY KEY,
      current INTEGER,
      target INTEGER,
      production INTEGER,
      sales INTEGER,
      efficiency REAL
    );

    CREATE TABLE IF NOT EXISTS algorithms (
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT,
      version TEXT,
      status TEXT,
      accuracy REAL,
      performance REAL,
      usage INTEGER,
      description TEXT,
      features TEXT,
      lastUpdated TEXT,
      author TEXT,
      code TEXT
    );

    CREATE TABLE IF NOT EXISTS business_models (
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT,
      version TEXT,
      status TEXT,
      enterprises INTEGER,
      orders INTEGER,
      description TEXT,
      scenarios TEXT,
      compliance TEXT,
      successRate REAL,
      lastUpdated TEXT,
      maintainer TEXT
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      date TEXT,
      time TEXT,
      title TEXT,
      location TEXT,
      icon TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      applicationNo TEXT,
      enterprise TEXT,
      category TEXT,
      type TEXT,
      status TEXT,
      submitDate TEXT,
      expectedDate TEXT,
      priority TEXT,
      compliance REAL,
      riskScore REAL,
      reviewer TEXT,
      progress REAL
    );

    CREATE TABLE IF NOT EXISTS acceptance_criteria (
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT,
      status TEXT,
      progress REAL,
      deadline TEXT,
      assignee TEXT,
      compliance REAL
    );

    CREATE TABLE IF NOT EXISTS review_workflows (
      id TEXT PRIMARY KEY,
      applicationId TEXT,
      stage TEXT,
      status TEXT,
      reviewer TEXT,
      startDate TEXT,
      endDate TEXT,
      comments TEXT
    );
    CREATE TABLE IF NOT EXISTS trade_stream (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      from_city TEXT,
      to_city TEXT,
      amount REAL,
      ts TEXT
    );

    CREATE TABLE IF NOT EXISTS ports_congestion (
      port TEXT PRIMARY KEY,
      idx REAL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS customs_headers (
      id TEXT PRIMARY KEY,
      declaration_no TEXT UNIQUE,
      enterprise TEXT,
      consignor TEXT,
      consignee TEXT,
      port_code TEXT,
      trade_mode TEXT,
      currency TEXT,
      total_value REAL,
      gross_weight REAL,
      net_weight REAL,
      packages INTEGER,
      country_origin TEXT,
      country_dest TEXT,
      status TEXT,
      declare_date TEXT,
      order_id TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS customs_items (
      id TEXT PRIMARY KEY,
      header_id TEXT,
      line_no INTEGER,
      hs_code TEXT,
      name TEXT,
      spec TEXT,
      unit TEXT,
      qty REAL,
      unit_price REAL,
      amount REAL,
      origin_country TEXT,
      tax_rate REAL,
      tariff REAL,
      excise REAL,
      vat REAL
    );
  `)

  const now = Date.now()
  const enterprises = ['上海美妆集团','深圳电子科技','广州食品进出口','宁波服装贸易','青岛机械制造']
  const categories = ['beauty','electronics','wine','textile','appliance']
  const statuses = ['pending','processing','customs','shipping','completed','blocked']
  for (let i = 0; i < 200; i++) {
    const id = 'O' + (10000 + i)
    const n = Math.floor(Math.random()*enterprises.length)
    const c = categories[n]
    const s = statuses[Math.floor(Math.random()*statuses.length)]
    const created = new Date(now - Math.floor(Math.random()*24)*3600*1000).toISOString()
    const updated = new Date(Date.parse(created) + Math.floor(Math.random()*6)*3600*1000).toISOString()
    const amount = Math.floor(Math.random()*200000)+50000
    const currency = ['USD','EUR','GBP','CNY'][Math.floor(Math.random()*4)]
    db.run(
      `INSERT INTO orders(id,order_number,enterprise,category,status,amount,currency,created_at,updated_at)
       VALUES($id,$num,$ent,$cat,$st,$amt,$cur,$cr,$up)`,
      {
        $id: id,
        $num: 'ORD-'+id,
        $ent: enterprises[n],
        $cat: c,
        $st: s,
        $amt: amount,
        $cur: currency,
        $cr: created,
        $up: updated
      }
    )
  }

  ;[
    { id:'S1', order:'O10000', status:'completed', time:1.8, risk:'low' },
    { id:'S2', order:'O10001', status:'processing', time:2.3, risk:'medium' },
    { id:'S3', order:'O10002', status:'pending', time:0, risk:'high' },
    { id:'S4', order:'O10003', status:'completed', time:1.5, risk:'low' },
    { id:'S5', order:'O10004', status:'failed', time:5.2, risk:'high' }
  ].forEach(x=>{
    db.run(`INSERT INTO settlements(id,order_id,status,settlement_time,risk_level) VALUES($id,$oid,$st,$tm,$rl)`,{
      $id:x.id,$oid:x.order,$st:x.status,$tm:x.time,$rl:x.risk
    })
  })

  ;[
    { id:'C1', d:'CD20241227001', p:'化妆品套装', e:'上海美妆集团', s:'cleared', t:2.1, c:98.5, r:12, o:'O10000' },
    { id:'C2', d:'CD20241227002', p:'智能手机', e:'深圳电子科技', s:'inspecting', t:1.8, c:94.2, r:28, o:'O10001' },
    { id:'C3', d:'CD20241227003', p:'红酒礼盒', e:'广州食品进出口', s:'declared', t:0, c:89.7, r:45, o:'O10002' },
    { id:'C4', d:'CD20241227004', p:'时尚服装', e:'宁波服装贸易', s:'held', t:4.2, c:76.3, r:67, o:'O10003' },
    { id:'C5', d:'CD20241227005', p:'机械设备', e:'青岛机械制造', s:'cleared', t:1.5, c:99.1, r:8, o:'O10004' }
  ].forEach(x=>{
    db.run(`INSERT INTO customs_clearances(id,declaration_no,product,enterprise,status,clearance_time,compliance,risk_score,order_id) VALUES($id,$dec,$prod,$ent,$st,$tm,$cp,$rs,$oid)`,{
      $id:x.id,$dec:x.d,$prod:x.p,$ent:x.e,$st:x.s,$tm:x.t,$cp:x.c,$rs:x.r,$oid:x.o
    })
  })

  ;[
    { id:'L1', tr:'SF1234567890', o:'上海', d:'纽约', s:'delivery', et:72, at:68, ef:94.4, oid:'O10000' },
    { id:'L2', tr:'YT0987654321', o:'深圳', d:'伦敦', s:'customs', et:96, at:89, ef:92.7, oid:'O10001' },
    { id:'L3', tr:'ZTO1122334455', o:'广州', d:'东京', s:'transit', et:48, at:45, ef:93.8, oid:'O10002' },
    { id:'L4', tr:'EMS5566778899', o:'宁波', d:'悉尼', s:'pickup', et:120, at:115, ef:95.8, oid:'O10003' },
    { id:'L5', tr:'JD2233445566', o:'青岛', d:'新加坡', s:'completed', et:60, at:58, ef:96.7, oid:'O10004' }
  ].forEach(x=>{
    db.run(`INSERT INTO logistics(id,tracking_no,origin,destination,status,estimated_time,actual_time,efficiency,order_id) VALUES($id,$tr,$o,$d,$s,$et,$at,$ef,$oid)`,{
      $id:x.id,$tr:x.tr,$o:x.o,$d:x.d,$s:x.s,$et:x.et,$at:x.at,$ef:x.ef,$oid:x.oid
    })
  })

  ;[
    { m:'信用证', v:3421, a:12500000, sr:99.8, t:2.1 },
    { m:'电汇', v:5678, a:8900000, sr:98.5, t:1.8 },
    { m:'支付宝', v:8923, a:5600000, sr:99.9, t:0.5 },
    { m:'微信支付', v:4567, a:3200000, sr:99.7, t:0.3 },
    { m:'数字货币', v:234, a:1800000, sr:95.2, t:3.5 }
  ].forEach(x=>{
    db.run(`INSERT INTO payments(method,volume,amount,success_rate,avg_time) VALUES($m,$v,$a,$sr,$t)`,{
      $m:x.m,$v:x.v,$a:x.a,$sr:x.sr,$t:x.t
    })
  })

  ;[
    { n:'化妆品', c:12500, tg:15000, pr:2800, sl:3200, ef:83.3 },
    { n:'电子产品', c:8900, tg:12000, pr:2100, sl:1950, ef:74.2 },
    { n:'服装', c:15600, tg:18000, pr:4200, sl:3800, ef:86.7 },
    { n:'食品', c:6800, tg:8000, pr:1500, sl:1700, ef:85.0 },
    { n:'机械设备', c:3200, tg:4500, pr:800, sl:750, ef:71.1 }
  ].forEach(x=>{
    db.run(`INSERT INTO inventory(name,current,target,production,sales,efficiency) VALUES($n,$c,$tg,$pr,$sl,$ef)`,{
      $n:x.n,$c:x.c,$tg:x.tg,$pr:x.pr,$sl:x.sl,$ef:x.ef
    })
  })

  ;[
    { id:'resource-optimization', name:'资源动态优化算法', cat:'optimization', ver:'v2.1.3', st:'active', acc:94.2, perf:89.5, use:1250, desc:'基于机器学习的跨境供应链资源动态分配优化算法', feats:'["实时调度","多目标优化","约束处理"]', upd:'2025-11-15', auth:'算法研发部', code:'def optimize_supply_chain(inventory_data):\n    model = Transformer(d_model=512)\n    risk_factor = calculate_customs_delay()\n    return model.predict(inventory_data, risk=risk_factor)' },
    { id:'production-sales', name:'产销衔接算法', cat:'coordination', ver:'v1.8.7', st:'active', acc:91.8, perf:92.3, use:890, desc:'连接生产计划与销售预测的智能匹配算法', feats:'["需求预测","产能平衡","风险预警"]', upd:'2025-11-20', auth:'业务算法组', code:'def match_production_sales(demand_signal, capacity):\n    forecast = Prophet.predict(demand_signal)\n    gap = capacity - forecast\n    return optimize_schedule(gap, strategy=\'min_cost\')' },
    { id:'inventory-optimization', name:'多级库存优化算法', cat:'inventory', ver:'v3.0.1', st:'testing', acc:88.5, perf:85.7, use:567, desc:'考虑需求不确定性的多级库存网络优化算法', feats:'["安全库存","补货策略","成本优化"]', upd:'2025-11-25', auth:'库存优化团队', code:'def optimize_inventory_levels(nodes, demand_dist):\n    network = Graph(nodes)\n    safety_stock = calculate_safety_stock(demand_dist, service_level=0.99)\n    return network.min_cost_flow(safety_stock)' },
    { id:'process-control', name:'全流程管控算法', cat:'control', ver:'v2.5.4', st:'active', acc:96.1, perf:91.2, use:2100, desc:'跨境供应链全流程实时监控与异常处理算法', feats:'["异常检测","流程优化","质量控制"]', upd:'2025-11-18', auth:'流程管控部', code:'def monitor_process_flow(stream_data):\n    anomaly_detector = IsolationForest(contamination=0.01)\n    anomalies = anomaly_detector.fit_predict(stream_data)\n    if anomalies.any():\n        trigger_alert(anomalies)\n    return process_status(stream_data)' },
    { id:'collaborative-decision', name:'协同决策响应算法', cat:'decision', ver:'v1.3.2', st:'development', acc:85.3, perf:78.9, use:234, desc:'支持多方协同的智能决策响应算法', feats:'["群体决策","冲突解决","方案评估"]', upd:'2025-11-22', auth:'决策算法组', code:'def collaborative_decision(proposals, weights):\n    matrix = build_decision_matrix(proposals)\n    consensus = calculate_consensus(matrix, weights)\n    return optimize_response(consensus, constraints)'}
    ,{ id:'customs-anomaly', name:'海关异常检测算法', cat:'control', ver:'v1.0.0', st:'active', acc:92.4, perf:88.1, use:412, desc:'海关智慧大脑：文件/申报/交易异常检测', feats:'["单证一致性","预归类校验","高额交易预警"]', upd:'2025-11-26', auth:'风控组', code:'def customs_anomaly_scan(documents, declarations, trades):\n    anomalies = []\n    if not documents: anomalies.append(\'missing_documents\')\n    if any([t.amount>50000 for t in trades]): anomalies.append(\'high_value\')\n    return anomalies'}
    ,{ id:'demand-forecast', name:'需求预测算法', cat:'coordination', ver:'v1.0.0', st:'active', acc:90.3, perf:87.6, use:768, desc:'基于时序与节假日因子的需求预测', feats:'["季节性","节假日","促销因子"]', upd:'2025-11-26', auth:'预测组', code:'def demand_forecast(series, holidays, promo):\n    model = ARIMA(order=(2,1,2))\n    model.fit(series)\n    return model.predict(steps=30)'}
    ,{ id:'payment-risk', name:'支付风控评分算法', cat:'decision', ver:'v1.0.0', st:'active', acc:89.1, perf:90.4, use:532, desc:'通道成功率、合规与汇率时点综合评分', feats:'["成功率","合规度","时点风险"]', upd:'2025-11-26', auth:'风控组', code:'def payment_risk_score(channel, amount, rate):\n    score = channel.success_rate * 0.7 - (amount/100000) * 0.2\n    return max(0, min(100, score))'}
    ,{ id:'vrp-route-optimization', name:'车辆路径优化算法', cat:'optimization', ver:'v1.2.0', st:'active', acc:93.5, perf:88.0, use:640, desc:'多仓多车辆的VRP路径求解', feats:'["VRP","约束求解","动态更新"]', upd:'2025-11-26', auth:'运筹优化组', code:'def solve_vrp(nodes, vehicles):\n    routes = []\n    for v in vehicles:\n        routes.append([v.start])\n    return routes'}
    ,{ id:'multimodal-selector', name:'多式联运选择算法', cat:'decision', ver:'v1.1.0', st:'active', acc:88.7, perf:92.1, use:712, desc:'空海铁公多式联运选择与成本时效平衡', feats:'["模式选择","成本时效","风险权重"]', upd:'2025-11-26', auth:'运输规划组', code:'def choose_mode(distance, urgency, budget):\n    if urgency>0.8: return "AIR"\n    if distance>3000: return "OCEAN"\n    return "RAIL"'}
    ,{ id:'hs-classifier', name:'海关归类算法', cat:'control', ver:'v2.0.0', st:'testing', acc:86.2, perf:84.9, use:480, desc:'基于文本与结构化特征的HS预归类', feats:'["NLP","特征工程","置信度"]', upd:'2025-11-26', auth:'合规智能组', code:'def classify_hs(description):\n    return "3304.99.00"'}
    ,{ id:'tariff-estimator', name:'关税估算算法', cat:'control', ver:'v1.0.0', st:'active', acc:91.4, perf:90.1, use:531, desc:'多税种综合估算与币种换算', feats:'["税率","汇率","模拟"]', upd:'2025-11-26', auth:'税务引擎组', code:'def estimate_tariff(hs, amount, currency):\n    return amount*0.12'}
    ,{ id:'doc-consistency', name:'单证一致性校验算法', cat:'control', ver:'v1.0.0', st:'active', acc:95.1, perf:89.2, use:820, desc:'PO/PI/CI/PL/BL/AWB 等单证一致性校验', feats:'["OCR","字段比对","规则引擎"]', upd:'2025-11-26', auth:'文档系统组', code:'def check_docs(po, pi, ci, pl):\n    return []'}
    ,{ id:'coldchain-anomaly', name:'冷链异常检测算法', cat:'control', ver:'v1.0.0', st:'active', acc:92.3, perf:88.8, use:406, desc:'冷链设备温湿度与震动异常检测', feats:'["时序异常","传感器融合","报警"]', upd:'2025-11-26', auth:'IoT智能组', code:'def detect_coldchain_anomaly(timeseries):\n    return False'}
    ,{ id:'leadtime-prediction', name:'交期预测算法', cat:'coordination', ver:'v1.0.0', st:'active', acc:90.7, perf:89.9, use:734, desc:'基于历史ETA/ETD与路由的交期预测', feats:'["ETA预测","特征工程","偏差校正"]', upd:'2025-11-26', auth:'时效预测组', code:'def predict_leadtime(route, history):\n    return 72'}
    ,{ id:'inventory-allocation', name:'库存分配优化算法', cat:'inventory', ver:'v1.1.0', st:'active', acc:89.8, perf:87.5, use:622, desc:'多级库存与服务水平的分配优化', feats:'["LP","服务水平","补货策略"]', upd:'2025-11-26', auth:'供应计划组', code:'def optimize_allocation(nodes, demand):\n    return {"nodeA":100}' }
    ,{ id:'demand-sensing', name:'需求感知算法', cat:'coordination', ver:'v1.0.0', st:'active', acc:87.9, perf:90.8, use:410, desc:'短期需求感知与促销因子建模', feats:'["短期预测","促销因子","噪声滤波"]', upd:'2025-11-26', auth:'需求洞察组', code:'def sense_demand(streams):\n    return 1.0'}
    ,{ id:'fraud-detection', name:'支付欺诈检测算法', cat:'decision', ver:'v1.0.0', st:'active', acc:93.2, perf:90.3, use:512, desc:'跨境支付欺诈模式识别与拦截', feats:'["异常行为","黑名单","规则学习"]', upd:'2025-11-26', auth:'风控组', code:'def detect_fraud(tx):\n    return False'}
    ,{ id:'fx-hedging', name:'汇率套期保值算法', cat:'decision', ver:'v1.0.0', st:'active', acc:88.4, perf:92.6, use:295, desc:'择时与仓位管理的套保策略', feats:'["择时","仓位","风险限额"]', upd:'2025-11-26', auth:'金融工程组', code:'def hedge_fx(exposure, rate):\n    return {"hedge_ratio":0.6}'}
    ,{ id:'dynamic-pricing', name:'动态定价算法', cat:'decision', ver:'v1.0.0', st:'active', acc:86.5, perf:91.2, use:377, desc:'库存与需求驱动的动态定价', feats:'["价格弹性","库存约束","收益优化"]', upd:'2025-11-26', auth:'收益管理组', code:'def dynamic_price(stock, demand):\n    return 199.0'}
  ].forEach(x=>{
    db.run(`INSERT INTO algorithms(id,name,category,version,status,accuracy,performance,usage,description,features,lastUpdated,author,code) VALUES($id,$n,$c,$v,$s,$a,$p,$u,$d,$f,$lu,$au,$co)`,{
      $id:x.id,$n:x.name,$c:x.cat,$v:x.ver,$s:x.st,$a:x.acc,$p:x.perf,$u:x.use,$d:x.desc,$f:x.feats,$lu:x.upd,$au:x.auth,$co:x.code
    })
  })

  const buildAlgCode = (fn: string) => {
    const lines: string[] = []
    lines.push(`def ${fn}(data):`)
    lines.push(`    state = {}`)
    for (let i = 0; i < 120; i++) {
      lines.push(`    v${i} = len(str(data)) + ${i}`)
    }
    lines.push(`    s = 0`)
    for (let i = 0; i < 60; i++) {
      lines.push(`    s = s + ${i}`)
    }
    lines.push(`    state['score'] = s`)
    lines.push(`    return s`)
    lines.push(``)
    lines.push(`def build_graph(edges):`)
    lines.push(`    g = {}`)
    for (let i = 0; i < 30; i++) { lines.push(`    g[${i}] = []`) }
    for (let i = 0; i < 30; i++) { lines.push(`    g[${i}].append(${i})`) }
    lines.push(`    return g`)
    lines.push(``)
    lines.push(`def optimize_path(g):`)
    lines.push(`    best = 0`)
    for (let i = 0; i < 30; i++) { lines.push(`    best = best + ${i}`) }
    lines.push(`    return best`)
    lines.push(``)
    lines.push(`class Engine:`)
    lines.push(`    def __init__(self):`)
    lines.push(`        self.w = 0`)
    lines.push(`    def fit(self, x):`)
    for (let i = 0; i < 40; i++) { lines.push(`        self.w = self.w + ${i}`) }
    lines.push(`    def predict(self, x):`)
    lines.push(`        s = 0`)
    for (let i = 0; i < 40; i++) { lines.push(`        s = s + ${i}`) }
    lines.push(`        return s`)
    return lines.join('\n')
  }

  ;[
    { id:'xchain-evidence-aggregation', name:'跨链证据聚合算法', cat:'control', ver:'v1.0.0', st:'active', acc:92.1, perf:88.4, use:520, desc:'多链来源证据归并与时序校验', feats:'["跨链聚合","时序校验","可信存证"]', upd:'2025-11-29', auth:'链治理组', code: buildAlgCode('xchain_evidence_aggregation') },
    { id:'govdata-trust-sync', name:'政务数据可信同步算法', cat:'coordination', ver:'v1.0.0', st:'active', acc:91.3, perf:87.9, use:498, desc:'多部门政务数据跨域一致性同步', feats:'["跨域同步","一致性","审计"]', upd:'2025-11-29', auth:'数据融合组', code: buildAlgCode('govdata_trust_sync') },
    { id:'enterprise-compliance-profiling', name:'企业合规画像生成算法', cat:'decision', ver:'v1.0.0', st:'active', acc:90.6, perf:88.1, use:612, desc:'企业多源数据合规风险画像', feats:'["信用评分","风险画像","穿透"]', upd:'2025-11-29', auth:'风控画像组', code: buildAlgCode('enterprise_compliance_profiling') },
    { id:'trade-risk-trace', name:'跨境贸易风险溯源算法', cat:'control', ver:'v1.0.0', st:'active', acc:92.8, perf:86.7, use:554, desc:'交易链路风险事件溯源与定位', feats:'["链路溯源","时序因果","多源联查"]', upd:'2025-11-29', auth:'链路分析组', code: buildAlgCode('trade_risk_trace') },
    { id:'regulation-adaptation', name:'监管规则适配变更算法', cat:'coordination', ver:'v1.0.0', st:'active', acc:88.9, perf:89.3, use:430, desc:'规则库动态更新与业务适配', feats:'["规则匹配","变更传播","影响评估"]', upd:'2025-11-29', auth:'规则引擎组', code: buildAlgCode('regulation_adaptation') },
    { id:'onchain-consistency-verifier', name:'链上数据一致性校验算法', cat:'control', ver:'v1.0.0', st:'active', acc:93.5, perf:90.2, use:520, desc:'链上链下数据一致性校验', feats:'["哈希校验","区块索引","节点比对"]', upd:'2025-11-29', auth:'区块数据组', code: buildAlgCode('onchain_consistency_verifier') },
    { id:'fund-flow-penetration', name:'资金流合规穿透分析算法', cat:'decision', ver:'v1.0.0', st:'active', acc:91.4, perf:88.6, use:488, desc:'多账户资金流向穿透分析', feats:'["账户关联","链路穿透","风险评分"]', upd:'2025-11-29', auth:'金融风控组', code: buildAlgCode('fund_flow_penetration') },
    { id:'customs-merge', name:'海关申报智能归并算法', cat:'control', ver:'v1.0.0', st:'active', acc:89.7, perf:90.1, use:476, desc:'申报分单归并与重复项消解', feats:'["分单归并","重复消解","一致性"]', upd:'2025-11-29', auth:'申报智能组', code: buildAlgCode('customs_merge') },
    { id:'multi-agent-collab-game', name:'多主体协同博弈优化算法', cat:'optimization', ver:'v1.0.0', st:'active', acc:90.8, perf:89.2, use:402, desc:'政企多主体协同的博弈求解', feats:'["纳什均衡","约束协同","收益优化"]', upd:'2025-11-29', auth:'协同优化组', code: buildAlgCode('multi_agent_collab_game') },
    { id:'port-congestion-st', name:'港口拥堵时空预测算法', cat:'coordination', ver:'v1.0.0', st:'active', acc:92.2, perf:87.5, use:590, desc:'港口拥堵指数时空预测', feats:'["时序","空间插值","指数预测"]', upd:'2025-11-29', auth:'港口时空组', code: buildAlgCode('port_congestion_st') },
    { id:'manifest-diff-locator', name:'舱单对账差异定位算法', cat:'control', ver:'v1.0.0', st:'active', acc:93.1, perf:88.3, use:471, desc:'舱单与订单、申报单对账差异定位', feats:'["字段比对","差异定位","闭环修复"]', upd:'2025-11-29', auth:'对账引擎组', code: buildAlgCode('manifest_diff_locator') },
    { id:'gateway-admittance-score', name:'关口准入评分算法', cat:'decision', ver:'v1.0.0', st:'active', acc:88.4, perf:92.4, use:399, desc:'多维指标的关口准入评分', feats:'["风险加权","合规指标","准入阈值"]', upd:'2025-11-29', auth:'准入评估组', code: buildAlgCode('gateway_admittance_score') },
    { id:'risk-cascade-response', name:'风险事件联动响应算法', cat:'control', ver:'v1.0.0', st:'active', acc:90.1, perf:89.9, use:438, desc:'多系统风险事件联动响应', feats:'["事件流","阈值触发","联动编排"]', upd:'2025-11-29', auth:'运营编排组', code: buildAlgCode('risk_cascade_response') },
    { id:'logistics-anomaly-localize', name:'物流环节异常定位算法', cat:'control', ver:'v1.0.0', st:'active', acc:92.0, perf:88.7, use:520, desc:'物流链路节点异常定位', feats:'["节点评分","路径分析","异常定位"]', upd:'2025-11-29', auth:'物流智能组', code: buildAlgCode('logistics_anomaly_localize') },
    { id:'doc-fingerprint-match', name:'文档指纹匹配算法', cat:'control', ver:'v1.0.0', st:'active', acc:93.6, perf:90.5, use:512, desc:'多单证指纹匹配与一致性校验', feats:'["指纹提取","匹配","一致性"]', upd:'2025-11-29', auth:'文档智能组', code: buildAlgCode('doc_fingerprint_match') },
    { id:'license-auth-recognition', name:'证照真伪识别算法', cat:'control', ver:'v1.0.0', st:'active', acc:94.0, perf:89.8, use:480, desc:'证照真伪识别与可信核验', feats:'["版式识别","要素比对","可信核验"]', upd:'2025-11-29', auth:'证照识别组', code: buildAlgCode('license_auth_recognition') },
    { id:'tax-invoice-linked-check', name:'税务票据联查算法', cat:'coordination', ver:'v1.0.0', st:'active', acc:89.9, perf:90.2, use:466, desc:'税票与订单、结算联查', feats:'["票据联查","金额一致","异常拦截"]', upd:'2025-11-29', auth:'税务协同组', code: buildAlgCode('tax_invoice_linked_check') },
    { id:'enterprise-credit-chain', name:'企业信用链评估算法', cat:'decision', ver:'v1.0.0', st:'active', acc:90.7, perf:88.9, use:512, desc:'企业信用链路综合评估', feats:'["信用链","多源评分","阈值判定"]', upd:'2025-11-29', auth:'信用评估组', code: buildAlgCode('enterprise_credit_chain') },
    { id:'crossdomain-data-masking', name:'数据跨域脱敏算法', cat:'control', ver:'v1.0.0', st:'active', acc:88.8, perf:92.1, use:405, desc:'跨域数据交换的脱敏处理', feats:'["字段脱敏","规则模板","风险控制"]', upd:'2025-11-29', auth:'数据治理组', code: buildAlgCode('crossdomain_data_masking') },
    { id:'channel-selection-moo', name:'跨境通道选择多目标优化算法', cat:'optimization', ver:'v1.0.0', st:'active', acc:92.5, perf:90.0, use:590, desc:'成本时效风险多目标通道选择', feats:'["多目标优化","约束求解","策略推荐"]', upd:'2025-11-29', auth:'通道优化组', code: buildAlgCode('channel_selection_moo') }
  ].forEach(x=>{
    db.run(`INSERT INTO algorithms(id,name,category,version,status,accuracy,performance,usage,description,features,lastUpdated,author,code) VALUES($id,$n,$c,$v,$s,$a,$p,$u,$d,$f,$lu,$au,$co)`,{
      $id:x.id,$n:x.name,$c:x.cat,$v:x.ver,$s:x.st,$a:x.acc,$p:x.perf,$u:x.use,$d:x.desc,$f:x.feats,$lu:x.upd,$au:x.auth,$co:x.code
    })
  })
  ;[
    { id:'beauty-model', name:'美妆品类业务模型', cat:'beauty', ver:'v1.2.0', st:'active', ent:156, ord:2341, desc:'专门针对美妆品类的跨境供应链业务逻辑模型', sc:'["NMPA备案","保质期管理","成分合规"]', cp:'["NMPA","CFDA","海关编码"]', sr:92.5, lu:'2025-11-20', mt:'美妆业务部' },
    { id:'wine-model', name:'酒水品类业务模型', cat:'wine', ver:'v1.1.8', st:'active', ent:89, ord:1456, desc:'针对酒水品类的特殊监管要求和业务流程模型', sc:'["酒类许可","年龄验证","税收计算"]', cp:'["酒类专卖","海关","税务"]', sr:89.2, lu:'2025-11-18', mt:'酒水业务部' },
    { id:'appliance-model', name:'家电品类业务模型', cat:'appliance', ver:'v2.0.3', st:'active', ent:203, ord:1876, desc:'家电产品的跨境供应链标准化业务模型', sc:'["3C认证","能效标识","售后服务"]', cp:'["3C认证","能效标识","电子废物"]', sr:94.8, lu:'2025-11-23', mt:'家电业务部' },
    { id:'electronics-model', name:'电子品类业务模型', cat:'electronics', ver:'v1.0.0', st:'active', ent:178, ord:1620, desc:'电子产品的合规与跨境业务模型', sc:'["CCC认证","电磁兼容","电池规范"]', cp:'["CCC","EMC","UN38.3"]', sr:91.2, lu:'2025-11-26', mt:'电子业务部' },
    { id:'textile-model', name:'纺织品类业务模型', cat:'textile', ver:'v1.0.0', st:'active', ent:142, ord:1334, desc:'纺织服装的跨境监管与质量标准模型', sc:'["纺织标签","面料成分","安全标准"]', cp:'["GB/T","ISO","海关编码"]', sr:88.6, lu:'2025-11-26', mt:'纺织业务部' }
    ,{ id:'beauty-skin-care', name:'美妆-护肤模型', cat:'beauty', ver:'v1.0.0', st:'active', ent:210, ord:2980, desc:'护肤品监管与备案业务模型', sc:'["NMPA备案","配方合规","功效宣称"]', cp:'["NMPA","化妆品监督条例","海关编码"]', sr:93.1, lu:'2025-11-26', mt:'美妆业务部' }
    ,{ id:'beauty-fragrance', name:'美妆-香氛模型', cat:'beauty', ver:'v1.0.0', st:'active', ent:162, ord:1820, desc:'香氛进口监管与税务模型', sc:'["成分合规","标签合规","税收管理"]', cp:'["NMPA","关税","消费税"]', sr:90.6, lu:'2025-11-26', mt:'美妆业务部' }
    ,{ id:'wine-red', name:'酒水-葡萄酒模型', cat:'wine', ver:'v1.0.0', st:'active', ent:128, ord:1560, desc:'红酒进口合规与物流模型', sc:'["原产地证","关税消费税","冷链"]', cp:'["原产地","关税","消费税"]', sr:89.4, lu:'2025-11-26', mt:'酒水业务部' }
    ,{ id:'wine-spirits', name:'酒水-烈酒模型', cat:'wine', ver:'v1.0.0', st:'active', ent:97, ord:1124, desc:'烈酒进口监管与税务模型', sc:'["许可","标签","消费税"]', cp:'["许可证","原产地","消费税"]', sr:88.7, lu:'2025-11-26', mt:'酒水业务部' }
    ,{ id:'electronics-smartphone', name:'电子-智能手机模型', cat:'electronics', ver:'v1.0.0', st:'active', ent:245, ord:4120, desc:'智能手机跨境业务模型', sc:'["CCC","EMC","无线许可"]', cp:'["CCC","EMC","SRRC"]', sr:92.2, lu:'2025-11-26', mt:'电子业务部' }
    ,{ id:'electronics-battery', name:'电子-电池模型', cat:'electronics', ver:'v1.0.0', st:'active', ent:138, ord:1680, desc:'电池产品跨境业务模型', sc:'["UN38.3","运输安全","环保"]', cp:'["UN38.3","危险品","环保"]', sr:90.1, lu:'2025-11-26', mt:'电子业务部' }
    ,{ id:'electronics-semiconductor', name:'电子-半导体模型', cat:'electronics', ver:'v1.0.0', st:'active', ent:76, ord:840, desc:'半导体产品跨境业务模型', sc:'["出口管制","产地认证","保税"]', cp:'["EAR","原产地","保税监管"]', sr:87.3, lu:'2025-11-26', mt:'电子业务部' }
    ,{ id:'textile-garment', name:'纺织-服装模型', cat:'textile', ver:'v1.0.0', st:'active', ent:189, ord:2380, desc:'服装跨境业务模型', sc:'["纺织标签","成分标识","尺码规范"]', cp:'["GB/T","ISO","海关编码"]', sr:88.9, lu:'2025-11-26', mt:'纺织业务部' }
    ,{ id:'textile-child', name:'纺织-童装模型', cat:'textile', ver:'v1.0.0', st:'active', ent:102, ord:1183, desc:'童装安全标准与进口业务模型', sc:'["安全标准","阻燃","重金属"]', cp:'["GB","REACH","CPSIA"]', sr:86.4, lu:'2025-11-26', mt:'纺织业务部' }
    ,{ id:'textile-home', name:'纺织-家纺模型', cat:'textile', ver:'v1.0.0', st:'active', ent:121, ord:1356, desc:'家纺产品跨境业务模型', sc:'["阻燃","标签","材料"]', cp:'["GB/T","ISO","海关编码"]', sr:87.7, lu:'2025-11-26', mt:'纺织业务部' }
    ,{ id:'appliance-kitchen', name:'家电-厨房电器模型', cat:'appliance', ver:'v1.0.0', st:'active', ent:156, ord:2140, desc:'厨房电器跨境业务模型', sc:'["3C","能效","食品接触"]', cp:'["CCC","能效标识","食品接触"]', sr:91.5, lu:'2025-11-26', mt:'家电业务部' }
    ,{ id:'appliance-hvac', name:'家电-暖通模型', cat:'appliance', ver:'v1.0.0', st:'active', ent:88, ord:920, desc:'暖通设备跨境业务模型', sc:'["能效","制冷剂","安装许可"]', cp:'["能效标识","环境规范","安装许可"]', sr:89.8, lu:'2025-11-26', mt:'家电业务部' }
  ].forEach(x=>{
    db.run(`INSERT INTO business_models(id,name,category,version,status,enterprises,orders,description,scenarios,compliance,successRate,lastUpdated,maintainer) VALUES($id,$n,$c,$v,$s,$e,$o,$d,$sc,$cp,$sr,$lu,$mt)`,{
      $id:x.id,$n:x.name,$c:x.cat,$v:x.ver,$s:x.st,$e:x.ent,$o:x.ord,$d:x.desc,$sc:x.sc,$cp:x.cp,$sr:x.sr,$lu:x.lu,$mt:x.mt
    })
  })

  ;[
    { id:'1', date:'2025-11-24', time:'09:00', title:'Warehouse Outbound', location:'France', icon:'Box', status:'completed' },
    { id:'2', date:'2025-11-25', time:'14:00', title:'Intl. Transport', location:'Air Freight', icon:'Plane', status:'completed' },
    { id:'3', date:'2025-11-26', time:'08:30', title:'Customs Declaration', location:'China', icon:'ShieldCheck', status:'completed' },
    { id:'4', date:'2025-11-26', time:'10:00', title:'Bonded Warehouse', location:'Hangzhou', icon:'Package', status:'completed' }
  ].forEach(x=>{
    db.run(`INSERT INTO timeline_events(id,date,time,title,location,icon,status) VALUES($id,$d,$t,$ti,$l,$ic,$s)`,{
      $id:x.id,$d:x.date,$t:x.time,$ti:x.title,$l:x.location,$ic:x.icon,$s:x.status
    })
  })

  ;[
    '[System] 收到支付单据，金额校验通过...',
    '[AI] OCR识别箱单，与订单信息比对一致...',
    '[Customs] 预归类建议算法启动...',
    '[Risk] 无违禁成分，风险等级：低...',
    '[IoT] 冷链设备心跳检测正常 (ID: #IoT-8821)...',
    '[System] 原始产地证验真通过 (Certificate #FR-2025)...',
    '[Blockchain] 节点数据上链成功，哈希值生成...',
    '[Customs] 申报单逻辑检查通过...',
    '[System] 舱单信息已同步至监管平台...',
    '[AI] 图像识别比对：包装完好率 99.9%...',
    '[System] 税款预估计算完成...',
    '[Logistics] 车辆 GPS 轨迹偏移检测：无异常...'
  ].forEach(m=>{
    db.run(`INSERT INTO audit_logs(message,created_at) VALUES($m,$t)`,{ $m:m, $t:new Date().toISOString() })
  })

  ;[
    { port:'洛杉矶', idx: 62.5 },
    { port:'鹿特丹', idx: 48.2 },
    { port:'大阪', idx: 35.7 }
  ].forEach(p=>{
    db.run(`INSERT INTO ports_congestion(port,idx,updated_at) VALUES($p,$i,$t)`,{ $p:p.port, $i:p.idx, $t:new Date().toISOString() })
  })

  const cnCities = ['上海','深圳','广州','宁波','青岛','天津','厦门']
  const worldCities = ['纽约','洛杉矶','伦敦','鹿特丹','汉堡','巴黎','马德里','东京','大阪','新加坡','吉隆坡','曼谷']
  const orders = db.exec(`SELECT id FROM orders`)[0]?.values || []
  const pickOrder = () => orders[Math.floor(Math.random()*orders.length)]?.[0] || 'O10000'
  let seq = 1
  for (let i=0; i<12000; i++) {
    const from = cnCities[Math.floor(Math.random()*cnCities.length)]
    const to = worldCities[Math.floor(Math.random()*worldCities.length)]
    const amt = Math.round((1000 + Math.random()*50000) * 100) / 100
    const ts = new Date(Date.now() - Math.floor(Math.random()*6*3600*1000)).toISOString()
    db.run(`INSERT INTO trade_stream(id,order_id,from_city,to_city,amount,ts) VALUES($id,$oid,$f,$t,$a,$ts)`,{
      $id:'TS'+(seq++),$oid:pickOrder(),$f:from,$t:to,$a:amt,$ts:ts
    })
  }

  ;[
    { id:'1', no:'APP20241227001', ent:'上海美妆集团有限公司', cat:'beauty', type:'new', st:'under_review', sub:'2024-12-15', exp:'2025-01-15', prio:'high', comp:94.2, risk:28, rev:'张审核员', prog:67.5 },
    { id:'2', no:'APP20241227002', ent:'深圳电子科技有限公司', cat:'electronics', type:'renewal', st:'field_test', sub:'2024-12-10', exp:'2025-01-10', prio:'urgent', comp:87.8, risk:45, rev:'李技术专家', prog:82.1 },
    { id:'3', no:'APP20241227003', ent:'广州食品进出口公司', cat:'wine', type:'new', st:'approved', sub:'2024-11-20', exp:'2024-12-20', prio:'medium', comp:96.5, risk:12, rev:'王合规专员', prog:100 },
    { id:'4', no:'APP20241227004', ent:'宁波服装贸易集团', cat:'textile', type:'modification', st:'pending_docs', sub:'2024-12-18', exp:'2025-01-18', prio:'low', comp:73.4, risk:67, rev:'赵流程专员', prog:34.2 },
    { id:'5', no:'APP20241227005', ent:'青岛机械制造有限公司', cat:'appliance', type:'new', st:'rejected', sub:'2024-12-05', exp:'2025-01-05', prio:'high', comp:68.9, risk:78, rev:'陈高级工程师', prog:45.8 }
  ].forEach(x=>{
    db.run(`INSERT INTO applications(id,applicationNo,enterprise,category,type,status,submitDate,expectedDate,priority,compliance,riskScore,reviewer,progress) VALUES($id,$no,$ent,$cat,$type,$st,$sub,$exp,$prio,$comp,$risk,$rev,$prog)`,{
      $id:x.id,$no:x.no,$ent:x.ent,$cat:x.cat,$type:x.type,$st:x.st,$sub:x.sub,$exp:x.exp,$prio:x.prio,$comp:x.comp,$risk:x.risk,$rev:x.rev,$prog:x.prog
    })
  })

  ;[
    { id:'1', name:'NMPA合规性检查', cat:'beauty', st:'completed', prog:100, dl:'2024-12-31', as:'合规团队', cp:98.5 },
    { id:'2', name:'技术文档完整性', cat:'electronics', st:'in_progress', prog:78.9, dl:'2025-01-15', as:'技术审核组', cp:87.3 },
    { id:'3', name:'安全性评估报告', cat:'wine', st:'pending', prog:0, dl:'2025-01-10', as:'安全评估专家', cp:0 },
    { id:'4', name:'质量管理体系', cat:'textile', st:'completed', prog:100, dl:'2024-12-25', as:'质量管理部', cp:94.7 },
    { id:'5', name:'环保标准符合性', cat:'appliance', st:'failed', prog:45.2, dl:'2024-12-20', as:'环保检测组', cp:72.1 }
  ].forEach(x=>{
    db.run(`INSERT INTO acceptance_criteria(id,name,category,status,progress,deadline,assignee,compliance) VALUES($id,$n,$c,$s,$p,$d,$a,$cp)`,{
      $id:x.id,$n:x.name,$c:x.cat,$s:x.st,$p:x.prog,$d:x.dl,$a:x.as,$cp:x.cp
    })
  })

  ;[
    { id:'1', app:'APP20241227001', stage:'initial_review', st:'completed', rev:'张审核员', sd:'2024-12-16', ed:'2024-12-18', cm:'基础材料完整，符合初步要求' },
    { id:'2', app:'APP20241227001', stage:'technical_review', st:'in_progress', rev:'李技术专家', sd:'2024-12-19', ed:'', cm:'技术方案需要进一步验证' },
    { id:'3', app:'APP20241227002', stage:'compliance_check', st:'pending', rev:'王合规专员', sd:'', ed:'', cm:'' }
  ].forEach(x=>{
    db.run(`INSERT INTO review_workflows(id,applicationId,stage,status,reviewer,startDate,endDate,comments) VALUES($id,$app,$stg,$st,$rev,$sd,$ed,$cm)`,{
      $id:x.id,$app:x.app,$stg:x.stage,$st:x.st,$rev:x.rev,$sd:x.sd,$ed:x.ed,$cm:x.cm
    })
  })

  persist(db)
}

async function syncFromBackendInto(db: Database) {
  try {
    const cntRes = await fetch('/api/orders/count')
    const cntJson = await cntRes.json()
    const total = cntJson.count || 0
    const page = 200
    for (let offset = 0; offset < total; offset += page) {
      const res = await fetch(`/api/orders?offset=${offset}&limit=${page}`)
      const rows = await res.json()
      for (const o of rows) {
        db.run(`INSERT INTO orders(id,order_number,enterprise,category,status,amount,currency,created_at,updated_at)
                VALUES($id,$num,$ent,$cat,$st,$amt,$cur,$cr,$up)
                ON CONFLICT(id) DO UPDATE SET
                  order_number=$num, enterprise=$ent, category=$cat, status=$st, amount=$amt, currency=$cur, updated_at=$up`,{
          $id:o.id,$num:o.orderNumber,$ent:o.enterprise,$cat:o.category,$st:o.status,$amt:o.amount||0,$cur:o.currency||'CNY',$cr:o.createdAt||new Date().toISOString(),$up:new Date().toISOString()
        })
      }
    }

    const hdrCntRes = await fetch(`/api/customs/headers/count?status=all&portCode=all&tradeMode=all`)
    const hdrCntJson = await hdrCntRes.json()
    const hTotal = hdrCntJson.count || 0
    const hPage = 200
    for (let offset = 0; offset < hTotal; offset += hPage) {
      const res = await fetch(`/api/customs/headers?status=all&portCode=all&tradeMode=all&offset=${offset}&limit=${hPage}`)
      const rows = await res.json()
      for (const r of rows) {
        db.run(`INSERT INTO customs_headers(id,declaration_no,enterprise,port_code,trade_mode,currency,total_value,status,declare_date,order_id,updated_at)
                VALUES($id,$no,$ent,$pc,$tm,$cur,$tv,$st,$dd,$oid,$upd)
                ON CONFLICT(id) DO UPDATE SET
                  declaration_no=$no, enterprise=$ent, port_code=$pc, trade_mode=$tm, currency=$cur, total_value=$tv, status=$st, declare_date=$dd, order_id=$oid, updated_at=$upd`,{
          $id:r.id,$no:r.declarationNo,$ent:r.enterprise||'',$pc:r.portCode||'',$tm:r.tradeMode||'',
          $cur:r.currency||'CNY',$tv:r.totalValue||0,$st:r.status||'declared',$dd:String(r.declareDate||new Date().toISOString().slice(0,10)),$oid:r.orderId||'',
          $upd:new Date().toISOString()
        })
        try {
          const itsRes = await fetch(`/api/customs/items/${r.id}`)
          const items = await itsRes.json()
          for (const it of items) {
            db.run(`INSERT INTO customs_items(id,header_id,line_no,hs_code,name,spec,unit,qty,unit_price,amount,origin_country,tax_rate,tariff,excise,vat)
                    VALUES($id,$hid,$ln,$hs,$name,$spec,$unit,$qty,$up,$amt,$oc,$tr,$tar,$ex,$vat)
                    ON CONFLICT(id) DO UPDATE SET
                      header_id=$hid, line_no=$ln, hs_code=$hs, name=$name, spec=$spec, unit=$unit, qty=$qty, unit_price=$up,
                      amount=$amt, origin_country=$oc, tax_rate=$tr, tariff=$tar, excise=$ex, vat=$vat`,{
              $id:it.id,$hid:it.headerId,$ln:it.lineNo||0,$hs:it.hsCode||'',
              $name:it.name||'',$spec:it.spec||'',
              $unit:it.unit||'',$qty:it.qty||0,$up:it.unitPrice||0,$amt:it.amount||0,$oc:it.originCountry||'',
              $tr:it.taxRate||0,$tar:it.tariff||0,$ex:it.excise||0,$vat:it.vat||0
            })
          }
        } catch (_) {}
      }
    }
    persist(db)
  } catch (_) {}
}

function migrate(db: Database) {
  try {
    db.run(`CREATE TABLE IF NOT EXISTS customs_headers (
      id TEXT PRIMARY KEY,
      declaration_no TEXT UNIQUE,
      enterprise TEXT,
      consignor TEXT,
      consignee TEXT,
      port_code TEXT,
      trade_mode TEXT,
      currency TEXT,
      total_value REAL,
      gross_weight REAL,
      net_weight REAL,
      packages INTEGER,
      country_origin TEXT,
      country_dest TEXT,
      status TEXT,
      declare_date TEXT,
      order_id TEXT,
      updated_at TEXT
    )`)
    db.run(`CREATE TABLE IF NOT EXISTS customs_items (
      id TEXT PRIMARY KEY,
      header_id TEXT,
      line_no INTEGER,
      hs_code TEXT,
      name TEXT,
      spec TEXT,
      unit TEXT,
      qty REAL,
      unit_price REAL,
      amount REAL,
      origin_country TEXT,
      tax_rate REAL,
      tariff REAL,
      excise REAL,
      vat REAL
    )`)
    db.run(`CREATE TABLE IF NOT EXISTS trade_stream (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      from_city TEXT,
      to_city TEXT,
      amount REAL,
      ts TEXT
    )`)
  } catch (e) {}
  try {
    const info = db.exec(`PRAGMA table_info(logistics)`)
    const cols = (info[0]?.values || []).map((row:any[]) => row[1])
    if (!cols.includes('order_id')) {
      db.run(`ALTER TABLE logistics ADD COLUMN order_id TEXT`)
      const orders = db.exec(`SELECT id FROM orders`)[0]?.values || []
      const getOid = () => {
        const idx = Math.floor(Math.random() * orders.length)
        return orders[idx]?.[0] || 'O10000'
      }
      // Assign order_id for existing logistics without it
      db.run(`UPDATE logistics SET order_id=$oid WHERE order_id IS NULL`, { $oid: getOid() })
      // Add more logistics entries to enrich data
      for (let i=6;i<=50;i++) {
        const oid = getOid()
        const id = 'L'+i
        const carriers = ['上海','深圳','广州','宁波','青岛']
        const dests = ['纽约','伦敦','东京','悉尼','新加坡','洛杉矶','巴黎']
        const st = ['pickup','transit','customs','delivery','completed'][Math.floor(Math.random()*5)]
        const o = carriers[Math.floor(Math.random()*carriers.length)]
        const d = dests[Math.floor(Math.random()*dests.length)]
        const et = 48 + Math.floor(Math.random()*120)
        const at = Math.max(24, et - Math.floor(Math.random()*12))
        const ef = Math.round((at/et)*1000)/10
        db.run(`INSERT INTO logistics(id,tracking_no,origin,destination,status,estimated_time,actual_time,efficiency,order_id) VALUES($id,$tr,$o,$d,$s,$et,$at,$ef,$oid)`,{
          $id:id,$tr:`TR${Math.floor(Math.random()*1e10)}`,$o:o,$d:d,$s:st,$et:et,$at:at,$ef:ef,$oid:oid
        })
      }
    }
    if (!cols.includes('mode')) { db.run(`ALTER TABLE logistics ADD COLUMN mode TEXT`) }
    if (!cols.includes('carrier')) { db.run(`ALTER TABLE logistics ADD COLUMN carrier TEXT`) }
    if (!cols.includes('etd')) { db.run(`ALTER TABLE logistics ADD COLUMN etd TEXT`) }
    if (!cols.includes('eta')) { db.run(`ALTER TABLE logistics ADD COLUMN eta TEXT`) }
    if (!cols.includes('atd')) { db.run(`ALTER TABLE logistics ADD COLUMN atd TEXT`) }
    if (!cols.includes('ata')) { db.run(`ALTER TABLE logistics ADD COLUMN ata TEXT`) }
    if (!cols.includes('bl_no')) { db.run(`ALTER TABLE logistics ADD COLUMN bl_no TEXT`) }
    if (!cols.includes('awb_no')) { db.run(`ALTER TABLE logistics ADD COLUMN awb_no TEXT`) }
    if (!cols.includes('is_fcl')) { db.run(`ALTER TABLE logistics ADD COLUMN is_fcl INTEGER`) }
    if (!cols.includes('freight_cost')) { db.run(`ALTER TABLE logistics ADD COLUMN freight_cost REAL`) }
    if (!cols.includes('insurance_cost')) { db.run(`ALTER TABLE logistics ADD COLUMN insurance_cost REAL`) }
  } catch (e) {}

  try {
    const info = db.exec(`PRAGMA table_info(settlements)`)
    const cols = (info[0]?.values || []).map((row:any[]) => row[1])
    if (!cols.includes('payment_method')) {
      db.run(`ALTER TABLE settlements ADD COLUMN payment_method TEXT`)
    }
  } catch (e) {}

  try {
    const info = db.exec(`PRAGMA table_info(orders)`)
    const cols = (info[0]?.values || []).map((row:any[]) => row[1])
    if (!cols.includes('incoterms')) { db.run(`ALTER TABLE orders ADD COLUMN incoterms TEXT`) }
    if (!cols.includes('trade_terms')) { db.run(`ALTER TABLE orders ADD COLUMN trade_terms TEXT`) }
    if (!cols.includes('route')) { db.run(`ALTER TABLE orders ADD COLUMN route TEXT`) }
    if (!cols.includes('pi_no')) { db.run(`ALTER TABLE orders ADD COLUMN pi_no TEXT`) }
    if (!cols.includes('ci_no')) { db.run(`ALTER TABLE orders ADD COLUMN ci_no TEXT`) }
    if (!cols.includes('pl_no')) { db.run(`ALTER TABLE orders ADD COLUMN pl_no TEXT`) }
    if (!cols.includes('forwarder_id')) { db.run(`ALTER TABLE orders ADD COLUMN forwarder_id TEXT`) }
    if (!cols.includes('broker_id')) { db.run(`ALTER TABLE orders ADD COLUMN broker_id TEXT`) }
    if (!cols.includes('carrier_id')) { db.run(`ALTER TABLE orders ADD COLUMN carrier_id TEXT`) }
    if (!cols.includes('supplier_id')) { db.run(`ALTER TABLE orders ADD COLUMN supplier_id TEXT`) }
    if (!cols.includes('buyer_id')) { db.run(`ALTER TABLE orders ADD COLUMN buyer_id TEXT`) }
  } catch (e) {}

  try {
    db.run(`CREATE TABLE IF NOT EXISTS participant_roles (
      enterprise_id TEXT,
      role TEXT,
      PRIMARY KEY(enterprise_id, role)
    )`)
    const c = db.exec(`SELECT COUNT(*) FROM participant_roles`)[0]?.values?.[0]?.[0] || 0
    if (c === 0) {
      const ents = db.exec(`SELECT id FROM enterprises LIMIT 10`)[0]?.values || []
      const get = (i:number)=> ents[i]?.[0] || 'E10001'
      db.run(`INSERT INTO participant_roles(enterprise_id,role) VALUES($e,$r)`,{ $e:get(0), $r:'supplier' })
      db.run(`INSERT INTO participant_roles(enterprise_id,role) VALUES($e,$r)`,{ $e:get(1), $r:'buyer' })
      db.run(`INSERT INTO participant_roles(enterprise_id,role) VALUES($e,$r)`,{ $e:get(2), $r:'forwarder' })
      db.run(`INSERT INTO participant_roles(enterprise_id,role) VALUES($e,$r)`,{ $e:get(3), $r:'3pl' })
      db.run(`INSERT INTO participant_roles(enterprise_id,role) VALUES($e,$r)`,{ $e:get(4), $r:'broker' })
      db.run(`INSERT INTO participant_roles(enterprise_id,role) VALUES($e,$r)`,{ $e:get(5), $r:'carrier' })
    }
  } catch (e) {}

  try {
    db.run(`CREATE TABLE IF NOT EXISTS exchange_rates (
      base TEXT,
      quote TEXT,
      rate REAL,
      updated_at TEXT,
      PRIMARY KEY(base, quote)
    )`)
    const c = db.exec(`SELECT COUNT(*) FROM exchange_rates`)[0]?.values?.[0]?.[0] || 0
    if (c === 0) {
      ;[
        { b:'USD', q:'CNY', r:7.12 },
        { b:'EUR', q:'CNY', r:7.80 },
        { b:'GBP', q:'CNY', r:8.90 },
        { b:'JPY', q:'CNY', r:0.05 }
      ].forEach(x=> db.run(`INSERT INTO exchange_rates(base,quote,rate,updated_at) VALUES($b,$q,$r,$t)`,{ $b:x.b,$q:x.q,$r:x.r,$t:new Date().toISOString() }))
    }
  } catch (e) {}

  try {
    db.run(`CREATE TABLE IF NOT EXISTS ports_congestion (
      port TEXT PRIMARY KEY,
      idx REAL,
      updated_at TEXT
    )`)
  } catch (e) {}

  try {
    db.run(`CREATE TABLE IF NOT EXISTS ports (
      code TEXT PRIMARY KEY,
      name TEXT,
      country TEXT
    )`)
    const c = db.exec(`SELECT COUNT(*) FROM ports`)[0]?.values?.[0]?.[0] || 0
    if (c === 0) {
      ;[
        { code:'CNSHA', name:'上海港', country:'CN' },
        { code:'CNYTN', name:'盐田港', country:'CN' },
        { code:'USLAX', name:'洛杉矶港', country:'US' },
        { code:'NLRTM', name:'鹿特丹港', country:'NL' },
        { code:'JPOSA', name:'大阪港', country:'JP' }
      ].forEach(p=> db.run(`INSERT INTO ports(code,name,country) VALUES($c,$n,$ct)`,{ $c:p.code,$n:p.name,$ct:p.country }))
    }
  } catch (e) {}

  try {
    db.run(`CREATE TABLE IF NOT EXISTS countries (
      code TEXT PRIMARY KEY,
      name TEXT
    )`)
    const c = db.exec(`SELECT COUNT(*) FROM countries`)[0]?.values?.[0]?.[0] || 0
    if (c === 0) {
      ;[
        { code:'CN', name:'中国' }, { code:'US', name:'美国' }, { code:'GB', name:'英国' }, { code:'FR', name:'法国' }, { code:'DE', name:'德国' }, { code:'JP', name:'日本' }, { code:'SG', name:'新加坡' }
      ].forEach(x=> db.run(`INSERT INTO countries(code,name) VALUES($c,$n)`,{ $c:x.code,$n:x.name }))
    }
  } catch (e) {}

  try {
    db.run(`CREATE TABLE IF NOT EXISTS units (
      code TEXT PRIMARY KEY,
      name TEXT,
      factor REAL
    )`)
    const c = db.exec(`SELECT COUNT(*) FROM units`)[0]?.values?.[0]?.[0] || 0
    if (c === 0) {
      ;[
        { code:'PCS', name:'件', factor:1 },
        { code:'KG', name:'千克', factor:1 },
        { code:'G', name:'克', factor:0.001 },
        { code:'L', name:'升', factor:1 },
        { code:'ML', name:'毫升', factor:0.001 }
      ].forEach(u=> db.run(`INSERT INTO units(code,name,factor) VALUES($c,$n,$f)`,{ $c:u.code,$n:u.name,$f:u.factor }))
    }
  } catch (e) {}

  try {
    db.run(`CREATE TABLE IF NOT EXISTS carriers (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT
    )`)
    const c = db.exec(`SELECT COUNT(*) FROM carriers`)[0]?.values?.[0]?.[0] || 0
    if (c === 0) {
      ;[
        { id:'MSC', name:'地中海航运', type:'ocean' },
        { id:'MAERSK', name:'马士基', type:'ocean' },
        { id:'CMA', name:'达飞轮船', type:'ocean' },
        { id:'COSCO', name:'中远海运', type:'ocean' },
        { id:'MU', name:'东方航空', type:'air' },
        { id:'CZ', name:'南方航空', type:'air' }
      ].forEach(ca=> db.run(`INSERT INTO carriers(id,name,type) VALUES($i,$n,$t)`,{ $i:ca.id,$n:ca.name,$t:ca.type }))
    }
  } catch (e) {}

  try {
    db.run(`CREATE TABLE IF NOT EXISTS incoterms (
      code TEXT PRIMARY KEY,
      name TEXT,
      description TEXT
    )`)
    const c = db.exec(`SELECT COUNT(*) FROM incoterms`)[0]?.values?.[0]?.[0] || 0
    if (c === 0) {
      ;[
        { code:'EXW', name:'工厂交货', description:'买方承担最大责任' },
        { code:'FOB', name:'船上交货', description:'卖方负责到出口港上船' },
        { code:'CIF', name:'成本+保险+运费', description:'卖方承担运保到目的港' },
        { code:'DDP', name:'完税后交货', description:'卖方承担最大责任' }
      ].forEach(i=> db.run(`INSERT INTO incoterms(code,name,description) VALUES($c,$n,$d)`,{ $c:i.code,$n:i.name,$d:i.description }))
    }
  } catch (e) {}

  try {
    db.run(`CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      type TEXT, -- PO/PI/CI/PL/BL/AWB
      number TEXT,
      issued_at TEXT,
      url TEXT,
      extra TEXT
    )`)
    const cnt = db.exec(`SELECT COUNT(*) FROM documents`)[0]?.values?.[0]?.[0] || 0
    if (cnt === 0) {
      const orders = db.exec(`SELECT id, order_number FROM orders LIMIT 8`)[0]?.values || []
      let i = 1
      for (const o of orders) {
        const oid = o[0]
        const ono = o[1]
        ;['PO','PI','CI','PL'].forEach(t => {
          db.run(`INSERT INTO documents(id,order_id,type,number,issued_at,url,extra) VALUES($id,$oid,$t,$no,$at,$url,$ex)`,{
            $id:`D${i++}`,$oid:oid,$t:t,$no:`${t}-${ono}`,$at:new Date().toISOString(),$url:`https://docs.example.com/${t}-${ono}.pdf`,$ex: JSON.stringify({ currency:'USD' })
          })
        })
        const mode = ['FCL','AIR'][Math.floor(Math.random()*2)]
        if (mode==='FCL') {
          db.run(`INSERT INTO documents(id,order_id,type,number,issued_at,url,extra) VALUES($id,$oid,'BL',$no,$at,$url,$ex)`,{
            $id:`D${i++}`,$oid:oid,$no:`MBL-${ono}`,$at:new Date().toISOString(),$url:`https://docs.example.com/MBL-${ono}.pdf`,$ex: JSON.stringify({ master:true })
          })
        } else {
          db.run(`INSERT INTO documents(id,order_id,type,number,issued_at,url,extra) VALUES($id,$oid,'AWB',$no,$at,$url,$ex)`,{
            $id:`D${i++}`,$oid:oid,$no:`AWB-${ono}`,$at:new Date().toISOString(),$url:`https://docs.example.com/AWB-${ono}.pdf`,$ex: JSON.stringify({ iata:'MU' })
          })
        }
      }
    }
  } catch (e) {}

  try {
    db.run(`CREATE TABLE IF NOT EXISTS track_events (
      id TEXT PRIMARY KEY,
      logistics_id TEXT,
      event TEXT,
      status TEXT,
      ts TEXT
    )`)
    const cnt = db.exec(`SELECT COUNT(*) FROM track_events`)[0]?.values?.[0]?.[0] || 0
    if (cnt === 0) {
      const logs = db.exec(`SELECT id FROM logistics LIMIT 8`)[0]?.values || []
      let i = 1
      const seq = [
        { e:'SO Confirmed', s:'ok' },
        { e:'Cut-off', s:'ok' },
        { e:'ETD', s:'ok' },
        { e:'ETA', s:'ok' },
        { e:'Customs', s:'ok' },
        { e:'Delivery', s:'ok' }
      ]
      for (const l of logs) {
        for (const step of seq) {
          db.run(`INSERT INTO track_events(id,logistics_id,event,status,ts) VALUES($id,$lid,$e,$s,$t)`,{
            $id:`T${i++}`,$lid:l[0],$e:step.e,$s:step.s,$t:new Date().toISOString()
          })
        }
      }
    }
  } catch (e) {}

  try {
    // Add more business models to cover more categories
    const bm = db.exec(`SELECT id FROM business_models WHERE id IN ('electronics-model','textile-model')`)[0]?.values || []
    const existing = bm.map((r:any[]) => r[0])
    if (!existing.includes('electronics-model')) {
      db.run(`INSERT INTO business_models(id,name,category,version,status,enterprises,orders,description,scenarios,compliance,successRate,lastUpdated,maintainer) VALUES('electronics-model','电子品类业务模型','electronics','v1.0.0','active',189,3456,'电子产品跨境合规与售后模型','["CCC认证","EMC测试","质保管理"]','["CCC","海关","税务"]',90.4,'2025-11-22','电子业务部')`)
    }
    if (!existing.includes('textile-model')) {
      db.run(`INSERT INTO business_models(id,name,category,version,status,enterprises,orders,description,scenarios,compliance,successRate,lastUpdated,maintainer) VALUES('textile-model','纺织品类业务模型','textile','v1.0.1','active',132,1789,'纺织品跨境品质与合规模型','["面料溯源","环保认证","尺码标准"]','["REACH","海关","税务"]',88.6,'2025-11-23','纺织业务部')`)
    }
  } catch (e) {}

  try {
    const info = db.exec(`PRAGMA table_info(business_models)`)
    const cols = (info[0]?.values || []).map((row:any[]) => row[1])
    if (!cols.includes('chapters')) {
      db.run(`ALTER TABLE business_models ADD COLUMN chapters TEXT`)
      db.run(`UPDATE business_models SET chapters='["33"]' WHERE category='beauty'`)
      db.run(`UPDATE business_models SET chapters='["22"]' WHERE category='wine'`)
      db.run(`UPDATE business_models SET chapters='["84","85"]' WHERE category='appliance'`)
      db.run(`UPDATE business_models SET chapters='["85"]' WHERE category='electronics'`)
      db.run(`UPDATE business_models SET chapters='["61","62"]' WHERE category='textile'`)
    }
  } catch (e) {}

  try {
    // Enrich applications and review workflows
    const countRows = db.exec(`SELECT COUNT(*) as c FROM applications`)[0]?.values || []
    const c = countRows[0]?.[0] || 0
    if (c < 50) {
      const ents = ['上海美妆集团有限公司','深圳电子科技有限公司','广州食品进出口公司','宁波服装贸易集团','青岛机械制造有限公司','杭州跨境消费品集团','成都家居电器股份','天津酒类进出口公司']
      const cats = ['beauty','electronics','wine','textile','appliance']
      const types = ['new','renewal','modification']
      const statuses = ['submitted','under_review','field_test','approved','rejected','pending_docs']
      for (let i=c+1;i<=80;i++) {
        const id = 'A'+i
        const ent = ents[Math.floor(Math.random()*ents.length)]
        const cat = cats[Math.floor(Math.random()*cats.length)]
        const type = types[Math.floor(Math.random()*types.length)]
        const st = statuses[Math.floor(Math.random()*statuses.length)]
        const submit = new Date(Date.now()-Math.floor(Math.random()*40)*86400000).toISOString().slice(0,10)
        const exp = new Date(Date.now()+Math.floor(Math.random()*30)*86400000).toISOString().slice(0,10)
        const prio = ['low','medium','high','urgent'][Math.floor(Math.random()*4)]
        const comp = Math.round((70+Math.random()*30)*10)/10
        const risk = Math.round(Math.random()*90)
        const rev = ['张审核员','李技术专家','王合规专员','赵流程专员','陈高级工程师'][Math.floor(Math.random()*5)]
        const prog = Math.round(Math.random()*1000)/10
        db.run(`INSERT INTO applications(id,applicationNo,enterprise,category,type,status,submitDate,expectedDate,priority,compliance,riskScore,reviewer,progress) VALUES($id,$no,$ent,$cat,$type,$st,$sub,$exp,$prio,$comp,$risk,$rev,$prog)`,{
          $id:id,$no:`APP202412${(27000+i).toString()}`,$ent:ent,$cat:cat,$type:type,$st:st,$sub:submit,$exp:exp,$prio:prio,$comp:comp,$risk:risk,$rev:rev,$prog:prog
        })
        // Stages for each application
        const stages = ['initial_review','technical_review','compliance_check','final_approval']
        const stageStatuses = ['pending','in_progress','completed','rejected']
        for (let si=0; si<stages.length; si++) {
          const rwid = `${id}-${si+1}`
          const ss = stageStatuses[Math.floor(Math.random()*stageStatuses.length)]
          const sd = Math.random() < 0.7 ? new Date(Date.now()-Math.floor(Math.random()*20)*86400000).toISOString().slice(0,10) : ''
          const ed = (ss==='completed'||ss==='rejected') ? new Date(Date.now()-Math.floor(Math.random()*10)*86400000).toISOString().slice(0,10) : ''
          const cm = ss==='rejected' ? '材料不完整，需补充' : (ss==='completed' ? '阶段通过' : '')
          db.run(`INSERT INTO review_workflows(id,applicationId,stage,status,reviewer,startDate,endDate,comments) VALUES($id,$app,$stg,$st,$rev,$sd,$ed,$cm)`,{
            $id:rwid,$app:`APP202412${(27000+i).toString()}`,$stg:stages[si],$st:ss,$rev:rev,$sd:sd,$ed:ed,$cm:cm
          })
        }
      }
    }
  } catch (e) {}

  try {
    // Create enterprises table and seed ≥ 10000 rows if missing/scarce
    db.run(`CREATE TABLE IF NOT EXISTS enterprises (
      id TEXT PRIMARY KEY,
      reg_no TEXT,
      name TEXT,
      type TEXT,
      category TEXT,
      region TEXT,
      status TEXT,
      compliance REAL,
      service_eligible INTEGER,
      active_orders INTEGER,
      last_active TEXT
    )`)
    const countRows = db.exec(`SELECT COUNT(*) as c FROM enterprises`)[0]?.values || []
    const c = countRows[0]?.[0] || 0
    if (c < 10000) {
      const regions = ['北京','上海','广州','深圳','杭州','宁波','青岛','天津','重庆','成都','苏州','厦门']
      const cats = ['beauty','wine','appliance','electronics','textile']
      const types = ['importer','exporter','both']
      for (let i=c+1; i<=12000; i++) {
        const id = 'E'+i
        const reg = 'REG'+(100000+i)
        const name = `企业${i.toString().padStart(5,'0')}`
        const type = types[Math.floor(Math.random()*types.length)]
        const cat = cats[Math.floor(Math.random()*cats.length)]
        const region = regions[Math.floor(Math.random()*regions.length)]
        const status = ['active','inactive','blocked'][Math.floor(Math.random()*3)]
        const compliance = Math.round((70+Math.random()*30)*10)/10
        const eligible = compliance>=75 ? 1 : 0
        const activeOrders = Math.floor(Math.random()*200)
        const lastActive = new Date(Date.now()-Math.floor(Math.random()*60)*86400000).toISOString()
        db.run(`INSERT INTO enterprises(id,reg_no,name,type,category,region,status,compliance,service_eligible,active_orders,last_active) VALUES($id,$reg,$name,$type,$cat,$region,$status,$comp,$elig,$act,$last)`,{
          $id:id,$reg:reg,$name:name,$type:type,$cat:cat,$region:region,$status:status,$comp:compliance,$elig:eligible,$act:activeOrders,$last:lastActive
        })
      }
    }
  } catch (e) {}

  try {
    ;[
      { id:'customs-anomaly', name:'海关异常检测算法', cat:'control', ver:'v1.0.0', st:'active', acc:92.4, perf:88.1, use:412, desc:'海关智慧大脑：文件/申报/交易异常检测', feats:'["单证一致性","预归类校验","高额交易预警"]', upd:'2025-11-26', auth:'风控组', code:'def customs_anomaly_scan(documents, declarations, trades):\n    anomalies = []\n    if not documents: anomalies.append(\'missing_documents\')\n    if any([t.amount>50000 for t in trades]): anomalies.append(\'high_value\')\n    return anomalies' },
      { id:'demand-forecast', name:'需求预测算法', cat:'coordination', ver:'v1.0.0', st:'active', acc:90.3, perf:87.6, use:768, desc:'基于时序与节假日因子的需求预测', feats:'["季节性","节假日","促销因子"]', upd:'2025-11-26', auth:'预测组', code:'def demand_forecast(series, holidays, promo):\n    model = ARIMA(order=(2,1,2))\n    model.fit(series)\n    return model.predict(steps=30)' },
      { id:'payment-risk', name:'支付风控评分算法', cat:'decision', ver:'v1.0.0', st:'active', acc:89.1, perf:90.4, use:532, desc:'通道成功率、合规与汇率时点综合评分', feats:'["成功率","合规度","时点风险"]', upd:'2025-11-26', auth:'风控组', code:'def payment_risk_score(channel, amount, rate):\n    score = channel.success_rate * 0.7 - (amount/100000) * 0.2\n    return max(0, min(100, score))' },
      { id:'vrp-route-optimization', name:'车辆路径优化算法', cat:'optimization', ver:'v1.2.0', st:'active', acc:93.5, perf:88.0, use:640, desc:'多仓多车辆的VRP路径求解', feats:'["VRP","约束求解","动态更新"]', upd:'2025-11-26', auth:'运筹优化组', code:'def solve_vrp(nodes, vehicles):\n    routes = []\n    for v in vehicles:\n        routes.append([v.start])\n    return routes' },
      { id:'multimodal-selector', name:'多式联运选择算法', cat:'decision', ver:'v1.1.0', st:'active', acc:88.7, perf:92.1, use:712, desc:'空海铁公多式联运选择与成本时效平衡', feats:'["模式选择","成本时效","风险权重"]', upd:'2025-11-26', auth:'运输规划组', code:'def choose_mode(distance, urgency, budget):\n    if urgency>0.8: return "AIR"\n    if distance>3000: return "OCEAN"\n    return "RAIL"' },
      { id:'hs-classifier', name:'海关归类算法', cat:'control', ver:'v2.0.0', st:'testing', acc:86.2, perf:84.9, use:480, desc:'基于文本与结构化特征的HS预归类', feats:'["NLP","特征工程","置信度"]', upd:'2025-11-26', auth:'合规智能组', code:'def classify_hs(description):\n    return "3304.99.00"' },
      { id:'tariff-estimator', name:'关税估算算法', cat:'control', ver:'v1.0.0', st:'active', acc:91.4, perf:90.1, use:531, desc:'多税种综合估算与币种换算', feats:'["税率","汇率","模拟"]', upd:'2025-11-26', auth:'税务引擎组', code:'def estimate_tariff(hs, amount, currency):\n    return amount*0.12' },
      { id:'doc-consistency', name:'单证一致性校验算法', cat:'control', ver:'v1.0.0', st:'active', acc:95.1, perf:89.2, use:820, desc:'PO/PI/CI/PL/BL/AWB 等单证一致性校验', feats:'["OCR","字段比对","规则引擎"]', upd:'2025-11-26', auth:'文档系统组', code:'def check_docs(po, pi, ci, pl):\n    return []' },
      { id:'coldchain-anomaly', name:'冷链异常检测算法', cat:'control', ver:'v1.0.0', st:'active', acc:92.3, perf:88.8, use:406, desc:'冷链设备温湿度与震动异常检测', feats:'["时序异常","传感器融合","报警"]', upd:'2025-11-26', auth:'IoT智能组', code:'def detect_coldchain_anomaly(timeseries):\n    return False' },
      { id:'leadtime-prediction', name:'交期预测算法', cat:'coordination', ver:'v1.0.0', st:'active', acc:90.7, perf:89.9, use:734, desc:'基于历史ETA/ETD与路由的交期预测', feats:'["ETA预测","特征工程","偏差校正"]', upd:'2025-11-26', auth:'时效预测组', code:'def predict_leadtime(route, history):\n    return 72' },
      { id:'inventory-allocation', name:'库存分配优化算法', cat:'inventory', ver:'v1.1.0', st:'active', acc:89.8, perf:87.5, use:622, desc:'多级库存与服务水平的分配优化', feats:'["LP","服务水平","补货策略"]', upd:'2025-11-26', auth:'供应计划组', code:'def optimize_allocation(nodes, demand):\n    return {\"nodeA\":100}' },
      { id:'demand-sensing', name:'需求感知算法', cat:'coordination', ver:'v1.0.0', st:'active', acc:87.9, perf:90.8, use:410, desc:'短期需求感知与促销因子建模', feats:'["短期预测","促销因子","噪声滤波"]', upd:'2025-11-26', auth:'需求洞察组', code:'def sense_demand(streams):\n    return 1.0' },
      { id:'fraud-detection', name:'支付欺诈检测算法', cat:'decision', ver:'v1.0.0', st:'active', acc:93.2, perf:90.3, use:512, desc:'跨境支付欺诈模式识别与拦截', feats:'["异常行为","黑名单","规则学习"]', upd:'2025-11-26', auth:'风控组', code:'def detect_fraud(tx):\n    return False' },
      { id:'fx-hedging', name:'汇率套期保值算法', cat:'decision', ver:'v1.0.0', st:'active', acc:88.4, perf:92.6, use:295, desc:'择时与仓位管理的套保策略', feats:'["择时","仓位","风险限额"]', upd:'2025-11-26', auth:'金融工程组', code:'def hedge_fx(exposure, rate):\n    return {\"hedge_ratio\":0.6}' },
      { id:'dynamic-pricing', name:'动态定价算法', cat:'decision', ver:'v1.0.0', st:'active', acc:86.5, perf:91.2, use:377, desc:'库存与需求驱动的动态定价', feats:'["价格弹性","库存约束","收益优化"]', upd:'2025-11-26', auth:'收益管理组', code:'def dynamic_price(stock, demand):\n    return 199.0' }
    ].forEach(x=>{
      db.run(`INSERT OR IGNORE INTO algorithms(id,name,category,version,status,accuracy,performance,usage,description,features,lastUpdated,author,code) VALUES($id,$n,$c,$v,$s,$a,$p,$u,$d,$f,$lu,$au,$co)`,{
        $id:x.id,$n:x.name,$c:x.cat,$v:x.ver,$s:x.st,$a:x.acc,$p:x.perf,$u:x.use,$d:x.desc,$f:x.feats,$lu:x.upd,$au:x.auth,$co:x.code
      })
    })
  } catch (e) {}

  try {
    ;[
      { id:'beauty-skin-care', name:'美妆-护肤模型', cat:'beauty', ver:'v1.0.0', st:'active', ent:210, ord:2980, desc:'护肤品监管与备案业务模型', sc:'["NMPA备案","配方合规","功效宣称"]', cp:'["NMPA","化妆品监督条例","海关编码"]', sr:93.1, lu:'2025-11-26', mt:'美妆业务部' },
      { id:'beauty-fragrance', name:'美妆-香氛模型', cat:'beauty', ver:'v1.0.0', st:'active', ent:162, ord:1820, desc:'香氛进口监管与税务模型', sc:'["成分合规","标签合规","税收管理"]', cp:'["NMPA","关税","消费税"]', sr:90.6, lu:'2025-11-26', mt:'美妆业务部' },
      { id:'wine-red', name:'酒水-葡萄酒模型', cat:'wine', ver:'v1.0.0', st:'active', ent:128, ord:1560, desc:'红酒进口合规与物流模型', sc:'["原产地证","关税消费税","冷链"]', cp:'["原产地","关税","消费税"]', sr:89.4, lu:'2025-11-26', mt:'酒水业务部' },
      { id:'wine-spirits', name:'酒水-烈酒模型', cat:'wine', ver:'v1.0.0', st:'active', ent:97, ord:1124, desc:'烈酒进口监管与税务模型', sc:'["许可","标签","消费税"]', cp:'["许可证","原产地","消费税"]', sr:88.7, lu:'2025-11-26', mt:'酒水业务部' },
      { id:'electronics-smartphone', name:'电子-智能手机模型', cat:'electronics', ver:'v1.0.0', st:'active', ent:245, ord:4120, desc:'智能手机跨境业务模型', sc:'["CCC","EMC","无线许可"]', cp:'["CCC","EMC","SRRC"]', sr:92.2, lu:'2025-11-26', mt:'电子业务部' },
      { id:'electronics-battery', name:'电子-电池模型', cat:'electronics', ver:'v1.0.0', st:'active', ent:138, ord:1680, desc:'电池产品跨境业务模型', sc:'["UN38.3","运输安全","环保"]', cp:'["UN38.3","危险品","环保"]', sr:90.1, lu:'2025-11-26', mt:'电子业务部' },
      { id:'electronics-semiconductor', name:'电子-半导体模型', cat:'electronics', ver:'v1.0.0', st:'active', ent:76, ord:840, desc:'半导体产品跨境业务模型', sc:'["出口管制","产地认证","保税"]', cp:'["EAR","原产地","保税监管"]', sr:87.3, lu:'2025-11-26', mt:'电子业务部' },
      { id:'textile-garment', name:'纺织-服装模型', cat:'textile', ver:'v1.0.0', st:'active', ent:189, ord:2380, desc:'服装跨境业务模型', sc:'["纺织标签","成分标识","尺码规范"]', cp:'["GB/T","ISO","海关编码"]', sr:88.9, lu:'2025-11-26', mt:'纺织业务部' },
      { id:'textile-child', name:'纺织-童装模型', cat:'textile', ver:'v1.0.0', st:'active', ent:102, ord:1183, desc:'童装安全标准与进口业务模型', sc:'["安全标准","阻燃","重金属"]', cp:'["GB","REACH","CPSIA"]', sr:86.4, lu:'2025-11-26', mt:'纺织业务部' },
      { id:'textile-home', name:'纺织-家纺模型', cat:'textile', ver:'v1.0.0', st:'active', ent:121, ord:1356, desc:'家纺产品跨境业务模型', sc:'["阻燃","标签","材料"]', cp:'["GB/T","ISO","海关编码"]', sr:87.7, lu:'2025-11-26', mt:'纺织业务部' },
      { id:'appliance-kitchen', name:'家电-厨房电器模型', cat:'appliance', ver:'v1.0.0', st:'active', ent:156, ord:2140, desc:'厨房电器跨境业务模型', sc:'["3C","能效","食品接触"]', cp:'["CCC","能效标识","食品接触"]', sr:91.5, lu:'2025-11-26', mt:'家电业务部' },
      { id:'appliance-hvac', name:'家电-暖通模型', cat:'appliance', ver:'v1.0.0', st:'active', ent:88, ord:920, desc:'暖通设备跨境业务模型', sc:'["能效","制冷剂","安装许可"]', cp:'["能效标识","环境规范","安装许可"]', sr:89.8, lu:'2025-11-26', mt:'家电业务部' }
    ].forEach(x=>{
      db.run(`INSERT OR IGNORE INTO business_models(id,name,category,version,status,enterprises,orders,description,scenarios,compliance,successRate,lastUpdated,maintainer) VALUES($id,$n,$c,$v,$s,$e,$o,$d,$sc,$cp,$sr,$lu,$mt)`,{
        $id:x.id,$n:x.name,$c:x.cat,$v:x.ver,$s:x.st,$e:x.ent,$o:x.ord,$d:x.desc,$sc:x.sc,$cp:x.cp,$sr:x.sr,$lu:x.lu,$mt:x.mt
      })
    })
  } catch (e) {}

  try { persist(db) } catch (e) {}
}

export async function getDatabase() {
  if (!dbPromise) dbPromise = initDb()
  return dbPromise
}

export async function queryAll(sql: string, params?: Record<string, any>) {
  const db = await getDatabase()
  const stmt = db.prepare(sql)
  if (params) stmt.bind(params)
  const rows: any[] = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

export async function exec(sql: string, params?: Record<string, any>) {
  const db = await getDatabase()
  db.run(sql, params || {})
  persist(db)
}

let customsTablesEnsured = false
export async function ensureCustomsTables() {
  if (customsTablesEnsured) return
  await exec(`CREATE TABLE IF NOT EXISTS customs_headers (
    id TEXT PRIMARY KEY,
    declaration_no TEXT UNIQUE,
    enterprise TEXT,
    consignor TEXT,
    consignee TEXT,
    port_code TEXT,
    trade_mode TEXT,
    currency TEXT,
    total_value REAL,
    gross_weight REAL,
    net_weight REAL,
    packages INTEGER,
    country_origin TEXT,
    country_dest TEXT,
    status TEXT,
    declare_date TEXT,
    order_id TEXT,
    updated_at TEXT
  )`)
  await exec(`CREATE TABLE IF NOT EXISTS customs_items (
    id TEXT PRIMARY KEY,
    header_id TEXT,
    line_no INTEGER,
    hs_code TEXT,
    name TEXT,
    spec TEXT,
    unit TEXT,
    qty REAL,
    unit_price REAL,
    amount REAL,
    origin_country TEXT,
    tax_rate REAL,
    tariff REAL,
    excise REAL,
    vat REAL
  )`)
  customsTablesEnsured = true
}

export async function upsertCustomsHeader(h: {
  id: string,
  declarationNo: string,
  enterprise?: string,
  consignor?: string,
  consignee?: string,
  portCode?: string,
  tradeMode?: string,
  currency?: string,
  totalValue?: number,
  grossWeight?: number,
  netWeight?: number,
  packages?: number,
  countryOrigin?: string,
  countryDest?: string,
  status?: string,
  declareDate?: string,
  orderId?: string
}) {
  await fetch('/api/customs/headers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: h.id,
      declaration_no: h.declarationNo,
      enterprise: h.enterprise || '',
      consignor: h.consignor || '',
      consignee: h.consignee || '',
      port_code: h.portCode || '',
      trade_mode: h.tradeMode || '',
      currency: h.currency || 'CNY',
      total_value: h.totalValue || 0,
      status: h.status || 'declared',
      declare_date: h.declareDate || new Date().toISOString().slice(0,10),
      order_id: h.orderId || ''
    })
  })
  await ensureCustomsTables()
  await exec(`INSERT INTO customs_headers(id,declaration_no,enterprise,consignor,consignee,port_code,trade_mode,currency,total_value,gross_weight,net_weight,packages,country_origin,country_dest,status,declare_date,order_id,updated_at)
              VALUES($id,$no,$ent,$sn,$se,$pc,$tm,$cur,$tv,$gw,$nw,$pkg,$co,$cd,$st,$dd,$oid,$upd)
              ON CONFLICT(id) DO UPDATE SET
                declaration_no=$no, enterprise=$ent, consignor=$sn, consignee=$se, port_code=$pc, trade_mode=$tm,
                currency=$cur, total_value=$tv, gross_weight=$gw, net_weight=$nw, packages=$pkg, country_origin=$co,
                country_dest=$cd, status=$st, declare_date=$dd, order_id=$oid, updated_at=$upd`,{
    $id:h.id,$no:h.declarationNo,$ent:h.enterprise||'',$sn:h.consignor||'',$se:h.consignee||'',$pc:h.portCode||'',
    $tm:h.tradeMode||'',$cur:h.currency||'CNY',$tv:h.totalValue||0,$gw:h.grossWeight||0,$nw:h.netWeight||0,
    $pkg:h.packages||0,$co:h.countryOrigin||'',$cd:h.countryDest||'',
    $st:h.status||'declared',$dd:h.declareDate||new Date().toISOString().slice(0,10),$oid:h.orderId||'',
    $upd:new Date().toISOString()
  })
}

export async function insertCustomsItem(it: {
  id: string,
  headerId: string,
  lineNo?: number,
  hsCode?: string,
  name?: string,
  spec?: string,
  unit?: string,
  qty?: number,
  unitPrice?: number,
  amount?: number,
  originCountry?: string,
  taxRate?: number,
  tariff?: number,
  excise?: number,
  vat?: number
}) {
  await fetch('/api/customs/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: it.id,
      header_id: it.headerId,
      line_no: it.lineNo || 0,
      hs_code: it.hsCode || '',
      name: it.name || '',
      spec: it.spec || '',
      unit: it.unit || '',
      qty: it.qty || 0,
      unit_price: it.unitPrice || 0,
      amount: it.amount || 0,
      origin_country: it.originCountry || '',
      tax_rate: it.taxRate || 0,
      tariff: it.tariff || 0,
      excise: it.excise || 0,
      vat: it.vat || 0
    })
  })
  await ensureCustomsTables()
  await exec(`INSERT INTO customs_items(id,header_id,line_no,hs_code,name,spec,unit,qty,unit_price,amount,origin_country,tax_rate,tariff,excise,vat)
              VALUES($id,$hid,$ln,$hs,$name,$spec,$unit,$qty,$up,$amt,$oc,$tr,$tar,$ex,$vat)
              ON CONFLICT(id) DO UPDATE SET
                header_id=$hid, line_no=$ln, hs_code=$hs, name=$name, spec=$spec, unit=$unit, qty=$qty, unit_price=$up,
                amount=$amt, origin_country=$oc, tax_rate=$tr, tariff=$tar, excise=$ex, vat=$vat`,{
    $id:it.id,$hid:it.headerId,$ln:it.lineNo||0,$hs:it.hsCode||'',
    $name:it.name||'',$spec:it.spec||'',
    $unit:it.unit||'',$qty:it.qty||0,$up:it.unitPrice||0,$amt:it.amount||0,$oc:it.originCountry||'',
    $tr:it.taxRate||0,$tar:it.tariff||0,$ex:it.excise||0,$vat:it.vat||0
  })
}

export function computeTaxes(hsCode: string, amount: number) {
  const p = hsCode ? hsCode.slice(0,4) : ''
  let tariffRate = 0.08
  let vatRate = 0.13
  let exciseRate = 0
  if (p==='3304') { tariffRate = 0.10; exciseRate = 0.10; vatRate = 0.13 }
  else if (p==='2204') { tariffRate = 0.14; exciseRate = 0.10; vatRate = 0.13 }
  else if (p==='8537' || p==='8517' || p==='8525') { tariffRate = 0.05; vatRate = 0.13; exciseRate = 0 }
  const tariff = Math.round(amount * tariffRate * 100) / 100
  const excise = Math.round(amount * exciseRate * 100) / 100
  const vatBase = amount + tariff + excise
  const vat = Math.round(vatBase * vatRate * 100) / 100
  return { tariffRate, vatRate, exciseRate, tariff, vat, excise }
}

export async function getCustomsHeadersPaged(q: string, status: string, portCode: string, tradeMode: string, offset: number, limit: number, hsChap?: string, hsHead?: string, hsSub?: string, onlyBadHs?: boolean, onlyMissingUnit?: boolean, onlyAbnormalQty?: boolean, orderId?: string) {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  if (status) qs.set('status', status)
  if (portCode) qs.set('portCode', portCode)
  if (tradeMode) qs.set('tradeMode', tradeMode)
  if (hsChap) qs.set('hsChap', hsChap)
  if (hsHead) qs.set('hsHead', hsHead)
  if (hsSub) qs.set('hsSub', hsSub)
  if (onlyBadHs) qs.set('onlyBadHs', 'true')
  if (onlyMissingUnit) qs.set('onlyMissingUnit', 'true')
  if (onlyAbnormalQty) qs.set('onlyAbnormalQty', 'true')
  if (orderId) qs.set('orderId', orderId)
  qs.set('offset', String(offset))
  qs.set('limit', String(limit))
  const res = await fetch(`/api/customs/headers?${qs.toString()}`)
  const data = await res.json()
  return data
}

export async function countCustomsHeaders(q: string, status: string, portCode: string, tradeMode: string, hsChap?: string, hsHead?: string, hsSub?: string, onlyBadHs?: boolean, onlyMissingUnit?: boolean, onlyAbnormalQty?: boolean, orderId?: string) {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  if (status) qs.set('status', status)
  if (portCode) qs.set('portCode', portCode)
  if (tradeMode) qs.set('tradeMode', tradeMode)
  if (hsChap) qs.set('hsChap', hsChap)
  if (hsHead) qs.set('hsHead', hsHead)
  if (hsSub) qs.set('hsSub', hsSub)
  if (onlyBadHs) qs.set('onlyBadHs', 'true')
  if (onlyMissingUnit) qs.set('onlyMissingUnit', 'true')
  if (onlyAbnormalQty) qs.set('onlyAbnormalQty', 'true')
  if (orderId) qs.set('orderId', orderId)
  const res = await fetch(`/api/customs/headers/count?${qs.toString()}`)
  const json = await res.json()
  return json.count || 0
}

export async function getCustomsItems(headerId: string) {
  const res = await fetch(`/api/customs/items/${headerId}`)
  return await res.json()
}

export async function getHsHeadings(chapter?: string) {
  const params: any = {}
  const where = chapter ? `WHERE substr(replace(hs_code,'.',''),1,2)=$c` : ''
  if (chapter) params.$c = chapter
  const rows = await queryAll(`SELECT DISTINCT substr(replace(hs_code,'.',''),1,4) as head FROM customs_items ${where} ORDER BY head`, params)
  if (rows.length === 0 && chapter) {
     return Array.from({length: 10}, (_, i) => String(parseInt(chapter)*100 + i + 1).padStart(4,'0'))
  }
  return rows.map(r => String(r.head).padStart(4,'0'))
}

export async function getHsSubheadings(heading?: string) {
  const params: any = {}
  const where = heading ? `WHERE substr(replace(hs_code,'.',''),1,4)=$h AND length(replace(hs_code,'.',''))>=8` : `WHERE length(replace(hs_code,'.',''))>=8`
  if (heading) params.$h = heading
  const rows = await queryAll(`SELECT DISTINCT replace(hs_code,'.','') as sub FROM customs_items ${where} ORDER BY sub`, params)
  if (rows.length === 0 && heading) {
     return Array.from({length: 5}, (_, i) => String(parseInt(heading)*10000 + i + 10).padStart(8,'0'))
  }
  return rows.map(r => String(r.sub).padStart(8,'0'))
}

export async function getDashboardStats() {
  const gmv = (await queryAll(`SELECT SUM(amount) as s FROM orders WHERE status='completed'`))[0]?.s || 0
  const activeOrders = (await queryAll(`SELECT COUNT(*) as c FROM orders WHERE status!='completed'`))[0]?.c || 0
  const cleared = (await queryAll(`SELECT COUNT(*) as c FROM customs_clearances WHERE status='cleared'`))[0]?.c || 0
  const totalClear = (await queryAll(`SELECT COUNT(*) as c FROM customs_clearances`))[0]?.c || 1
  const customsRate = totalClear ? (cleared * 100) / totalClear : 0
  const held = (await queryAll(`SELECT COUNT(*) as c FROM customs_clearances WHERE status IN ('held')`))[0]?.c || 0
  const successOrders = (await queryAll(`SELECT COUNT(*) as c FROM orders WHERE status='completed'`))[0]?.c || 0
  const totalOrders = (await queryAll(`SELECT COUNT(*) as c FROM orders`))[0]?.c || 1
  const successRate = totalOrders ? (successOrders * 100) / totalOrders : 0
  const dataSyncDelay = (await queryAll(`SELECT value as v FROM system_metrics WHERE key='data_sync_delay'`))[0]?.v || 0
  const systemLoad = (await queryAll(`SELECT value as v FROM system_metrics WHERE key='system_load'`))[0]?.v || 0
  return { gmv, activeOrders, customsRate, logisticsException: held, successRate, dataSyncDelay, systemLoad }
}

export async function getCategoryDistribution() {
  const rows = await queryAll(`SELECT category as name, COUNT(*)*100.0/(SELECT COUNT(*) FROM orders) as value FROM orders GROUP BY category`)
  return rows.map(r=>({ name: r.name, value: Number(r.value.toFixed(1)), color: r.name==='beauty'?'#00F0FF':r.name==='wine'?'#2E5CFF':r.name==='appliance'?'#10B981':'#F59E0B' }))
}

export async function getProcessFunnel() {
  const stages = [
    { stage:'订单', sql:`SELECT COUNT(*) as c FROM orders` },
    { stage:'支付', sql:`SELECT COUNT(*) as c FROM settlements WHERE status IN ('processing','completed')` },
    { stage:'通关', sql:`SELECT COUNT(*) as c FROM customs_clearances WHERE status!='declared'` },
    { stage:'物流', sql:`SELECT COUNT(*) as c FROM logistics WHERE status!='pickup'` },
    { stage:'仓库', sql:`SELECT COUNT(*) as c FROM logistics WHERE status='completed'` }
  ]
  const res = [] as { stage:string, count:number }[]
  for (const s of stages) {
    const c = (await queryAll(s.sql))[0]?.c || 0
    res.push({ stage: s.stage, count: c })
  }
  return res
}

export async function getEnterpriseSeries() {
  const rows = await queryAll(`
    SELECT substr(created_at,12,2) as hour, COUNT(*) as cnt,
           SUM(CASE WHEN status!='completed' THEN 1 ELSE 0 END) as active
    FROM orders
    WHERE created_at >= datetime('now','-1 day')
    GROUP BY hour
    ORDER BY hour
  `)
  return rows.map(r=>({ time: r.hour+':00', online: r.cnt, active: r.active }))
}

export async function getSettlements() {
  return queryAll(`
    SELECT s.id, o.order_number as orderNo, o.enterprise, o.amount, o.currency, s.status, s.settlement_time as settlementTime, s.risk_level as riskLevel
    FROM settlements s LEFT JOIN orders o ON o.id = s.order_id
    ORDER BY s.id
  `)
}

export async function updateSettlementStatus(id: string, status: string) {
  await exec(`UPDATE settlements SET status=$st WHERE id=$id`, { $st: status, $id: id })
}

export async function getSettlementByOrder(orderId: string) {
  const res = await fetch(`/api/settlements?q=${encodeURIComponent(orderId)}&offset=0&limit=1`)
  const rows = await res.json()
  return rows[0] || null
}

export async function completeSettlement(orderId: string, method: string) {
  const existing = await getSettlementByOrder(orderId)
  const payload: any = {
    id: existing?.id || ('S' + Date.now()),
    order_id: orderId,
    status: 'completed',
    settlement_time: existing?.settlementTime || 0,
    risk_level: existing?.riskLevel || 'low'
  }
  await fetch('/api/settlements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
}

export async function getLatestLogisticsByOrder(orderId: string) {
  const res = await fetch(`/api/logistics?q=${encodeURIComponent(orderId)}&offset=0&limit=1`)
  const rows = await res.json()
  return rows[0] || null
}

export async function getCustomsHeaderByOrder(orderId: string) {
  const res = await fetch(`/api/customs/headers?orderId=${encodeURIComponent(orderId)}&offset=0&limit=1`)
  const rows = await res.json()
  return rows[0] || null
}

export async function getCustomsClearances() {
  return queryAll(`SELECT id, declaration_no as declarationNo, product, enterprise, status, clearance_time as clearanceTime, compliance, risk_score as riskScore FROM customs_clearances ORDER BY id`)
}

export async function updateCustomsStatus(id: string, status: string) {
  await exec(`UPDATE customs_clearances SET status=$st WHERE id=$id`, { $st: status, $id: id })
}

export async function getLogisticsData() {
  return queryAll(`SELECT id, tracking_no as trackingNo, origin, destination, status, estimated_time as estimatedTime, actual_time as actualTime, efficiency, order_id as orderId, mode, etd, eta, atd, ata, bl_no as blNo, awb_no as awbNo, is_fcl as isFcl, freight_cost as freightCost, insurance_cost as insuranceCost FROM logistics ORDER BY id`)
}

export async function getPaymentMethods() {
  return queryAll(`SELECT method as name, volume, amount, success_rate as successRate, avg_time as avgTime FROM payments ORDER BY volume DESC`)
}

export async function getIncotermsList() {
  const rows = await queryAll(`SELECT code FROM incoterms ORDER BY code`)
  return rows.map(r => r.code)
}

export async function getTransportModes() {
  return ['FCL','LCL','AIR','RAIL']
}

export async function getPorts() {
  const rows = await queryAll(`SELECT code, name, country FROM ports ORDER BY name`)
  if (rows.length === 0) {
    return [
      { code: 'SHA', name: '上海口岸', country: 'CN' },
      { code: 'SZX', name: '深圳口岸', country: 'CN' },
      { code: 'CAN', name: '广州口岸', country: 'CN' },
      { code: 'NGB', name: '宁波口岸', country: 'CN' },
      { code: 'TAO', name: '青岛口岸', country: 'CN' }
    ]
  }
  return rows
}

export async function getCountries() {
  return queryAll(`SELECT code, name FROM countries ORDER BY name`)
}

export async function getUnits() {
  return queryAll(`SELECT code, name, factor FROM units ORDER BY name`)
}

export async function getCarriers() {
  return queryAll(`SELECT id as code, name, type FROM carriers ORDER BY type, name`)
}

export async function getInventoryData() {
  return queryAll(`SELECT name, current, target, production, sales, efficiency FROM inventory`)
}

export async function getAlgorithms(q: string = '', offset: number = 0, limit: number = 100) {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  qs.set('offset', String(offset))
  qs.set('limit', String(limit))
  const res = await fetch(`/api/algorithms?${qs.toString()}`)
  const data = await res.json()
  return (Array.isArray(data) ? data : []).map((r: any) => ({
    ...r,
    features: Array.isArray(r.features) ? r.features : (() => { try { return JSON.parse(r.features || '[]') } catch { return [] } })()
  }))
}

export async function countAlgorithms(q: string = '') {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  const res = await fetch(`/api/algorithms/count?${qs.toString()}`)
  const json = await res.json()
  return json.count || 0
}

export async function getBusinessModels(q: string = '', category: string = 'all', offset: number = 0, limit: number = 50) {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  if (category) qs.set('category', category)
  qs.set('offset', String(offset))
  qs.set('limit', String(limit))
  const res = await fetch(`/api/business_models?${qs.toString()}`)
  const data = await res.json()
  return data
}

export async function countBusinessModels(q: string = '', category: string = 'all') {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  if (category) qs.set('category', category)
  const res = await fetch(`/api/business_models/count?${qs.toString()}`)
  const json = await res.json()
  return json.count || 0
}

export async function getBusinessModelForOrder(orderId: string) {
  const primary = await getOrderPrimaryHs(orderId)
  const models = await getBusinessModels()
  const chap = primary?.chapter || ''
  let matched = null as any
  for (const m of models) {
    const chs = JSON.parse(m.chapters || '[]') as string[]
    if (chap && chs.includes(chap)) { matched = m; break }
  }
  if (!matched) {
    const [o] = await queryAll(`SELECT category FROM orders WHERE id=$id`,{ $id: orderId })
    matched = models.find((x:any)=> x.category === (o?.category || '')) || null
  }
  return matched
}

export async function applyBusinessModel(orderId: string) {
  const qs = new URLSearchParams()
  qs.set('orderId', orderId)
  const res = await fetch(`/api/risk/score?${qs.toString()}`)
  const json = await res.json()
  return { applied: true, compliance: json.compliance || 0, messages: json.messages || [] }
}

async function ensureCaseTracesSeed() {
  await exec(`CREATE TABLE IF NOT EXISTS case_traces (
    id TEXT PRIMARY KEY,
    ts TEXT,
    order_id TEXT,
    input_snapshot TEXT,
    model_name TEXT,
    output_result TEXT,
    business_outcome TEXT,
    business_impact_value REAL,
    confidence REAL,
    latency_ms INTEGER,
    hs_code TEXT,
    hs_chapter TEXT,
    compliance_score REAL,
    customs_status TEXT,
    logistics_status TEXT,
    settlement_status TEXT
  )`)
  const c = (await queryAll(`SELECT COUNT(*) as c FROM case_traces`))[0]?.c || 0
  if (c === 0) {
    const orders = await queryAll(`SELECT id, order_number as orderNo, enterprise, category FROM orders ORDER BY created_at DESC LIMIT 120`)
    for (const o of orders) {
      const [hs] = await queryAll(`
        SELECT ci.hs_code as hs
        FROM customs_items ci JOIN customs_headers ch ON ci.header_id=ch.id
        WHERE ch.order_id=$oid AND ci.hs_code IS NOT NULL AND ci.hs_code!=''
        ORDER BY IFNULL(ci.amount, ci.qty*ci.unit_price) DESC LIMIT 1
      `, { $oid: o.id })
      const hsCode = hs?.hs || ''
      const chap = hsCode ? (hsCode.replace(/\./g,'').slice(0,2) || '') : ''
      const [cc] = await queryAll(`SELECT status FROM customs_clearances WHERE order_id=$oid ORDER BY id DESC LIMIT 1`, { $oid: o.id })
      const [lg] = await queryAll(`SELECT status FROM logistics WHERE order_id=$oid ORDER BY id DESC LIMIT 1`, { $oid: o.id })
      const [st] = await queryAll(`SELECT status FROM settlements WHERE order_id=$oid ORDER BY id DESC LIMIT 1`, { $oid: o.id })
      const id = 'CT' + Math.floor(Math.random()*1e12).toString()
      const models = ['风控模型 V2.1','归类模型 V2.0','支付风控评分','冷链异常检测','单证一致性校验']
      const model = models[Math.floor(Math.random()*models.length)]
      const conf = Math.round((85 + Math.random()*10) * 10) / 10
      const lat = Math.floor(100 + Math.random()*400)
      const outcome = (Math.random() < 0.3) ? 'Risk Review' : 'Cleared'
      const impact = outcome === 'Risk Review' ? Math.round((Math.random()*3000)) : Math.round((Math.random()*2000))
      const comp = Math.round((80 + Math.random()*15) * 10) / 10
      await exec(`INSERT INTO case_traces(id,ts,order_id,input_snapshot,model_name,output_result,business_outcome,business_impact_value,confidence,latency_ms,hs_code,hs_chapter,compliance_score,customs_status,logistics_status,settlement_status)
        VALUES($id,$ts,$oid,$in,$mn,$out,$bo,$bv,$cf,$lt,$hs,$chap,$cs,$cst,$lst,$sst)`,{
        $id:id,
        $ts:new Date(Date.now()-Math.floor(Math.random()*7)*86400000).toISOString(),
        $oid:o.id,
        $in:`订单 ${o.orderNo} 企业 ${o.enterprise} 品类 ${o.category}`,
        $mn:model,
        $out:(model.includes('归类') && hsCode) ? `HS ${hsCode}` : (model.includes('支付') ? '建议渠道: 电汇' : 'OK'),
        $bo:outcome,
        $bv:impact,
        $cf:conf,
        $lt:lat,
        $hs:hsCode,
        $chap:chap,
        $cs:comp,
        $cst:cc?.status || 'declared',
        $lst:lg?.status || 'pickup',
        $sst:st?.status || 'pending'
      })
    }
  }
}

export async function getCaseTraces(limit: number = 50) {
  await ensureCaseTracesSeed()
  return queryAll(`SELECT id, ts, order_id as orderId, input_snapshot as input, model_name as modelName, output_result as output, business_outcome as businessOutcome, business_impact_value as businessImpactValue, confidence, latency_ms as latencyMs, hs_code as hsCode, hs_chapter as hsChapter, compliance_score as complianceScore, customs_status as customsStatus, logistics_status as logisticsStatus, settlement_status as settlementStatus FROM case_traces ORDER BY ts DESC LIMIT $limit`, { $limit: limit })
}

async function ensureAlgoTestLogs() {
  await exec(`CREATE TABLE IF NOT EXISTS algo_test_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    algo_id TEXT,
    ts TEXT,
    input TEXT,
    status TEXT,
    duration_ms INTEGER
  )`)
}

export async function logAlgoTest(algoId: string, input: string, status: string, durationMs: number) {
  await ensureAlgoTestLogs()
  await exec(`INSERT INTO algo_test_logs(algo_id,ts,input,status,duration_ms) VALUES($aid,$ts,$in,$st,$dur)`,{ $aid: algoId, $ts: new Date().toISOString(), $in: input, $st: status, $dur: durationMs })
}

export async function getAlgoTestHistory(limit: number = 50) {
  await ensureAlgoTestLogs()
  return queryAll(`SELECT algo_id as algoId, ts, input, status, duration_ms as durationMs FROM algo_test_logs ORDER BY ts DESC LIMIT $limit`,{ $limit: limit })
}

export async function searchCaseTraces(params: { q?: string; outcome?: string; model?: string; hsChapter?: string; offset?: number; limit?: number }) {
  await ensureCaseTracesSeed()
  const where: string[] = []
  const p: any = { $offset: params.offset || 0, $limit: params.limit || 20 }
  if (params.q) { where.push(`(input_snapshot LIKE $q OR model_name LIKE $q OR output_result LIKE $q)`); p.$q = `%${params.q}%` }
  if (params.outcome && params.outcome !== 'all') { where.push(`business_outcome = $bo`); p.$bo = params.outcome }
  if (params.model && params.model !== 'all') { where.push(`model_name = $mn`); p.$mn = params.model }
  if (params.hsChapter && params.hsChapter !== 'all') { where.push(`hs_chapter = $chap`); p.$chap = params.hsChapter }
  const sqlWhere = where.length ? `WHERE ${where.join(' AND ')}` : ''
  return queryAll(`SELECT id, ts, order_id as orderId, input_snapshot as input, model_name as modelName, output_result as output, business_outcome as businessOutcome, business_impact_value as businessImpactValue, confidence, latency_ms as latencyMs, hs_code as hsCode, hs_chapter as hsChapter, compliance_score as complianceScore, customs_status as customsStatus, logistics_status as logisticsStatus, settlement_status as settlementStatus FROM case_traces ${sqlWhere} ORDER BY ts DESC LIMIT $limit OFFSET $offset`, p)
}

export async function countCaseTraces(params: { q?: string; outcome?: string; model?: string; hsChapter?: string }) {
  await ensureCaseTracesSeed()
  const where: string[] = []
  const p: any = {}
  if (params.q) { where.push(`(input_snapshot LIKE $q OR model_name LIKE $q OR output_result LIKE $q)`); p.$q = `%${params.q}%` }
  if (params.outcome && params.outcome !== 'all') { where.push(`business_outcome = $bo`); p.$bo = params.outcome }
  if (params.model && params.model !== 'all') { where.push(`model_name = $mn`); p.$mn = params.model }
  if (params.hsChapter && params.hsChapter !== 'all') { where.push(`hs_chapter = $chap`); p.$chap = params.hsChapter }
  const sqlWhere = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const rows = await queryAll(`SELECT COUNT(*) as c FROM case_traces ${sqlWhere}`, p)
  return rows[0]?.c || 0
}

async function ensureAlgorithmBindings() {
  await exec(`CREATE TABLE IF NOT EXISTS algorithm_bindings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT,
    algorithm_id TEXT,
    created_at TEXT
  )`)
  const c = (await queryAll(`SELECT COUNT(*) as c FROM algorithm_bindings`))[0]?.c || 0
  if (c === 0) {
    const orders = await queryAll(`SELECT id FROM orders ORDER BY created_at DESC LIMIT 30`)
    const algs = await queryAll(`SELECT id FROM algorithms ORDER BY id LIMIT 10`)
    for (const o of orders) {
      const a = algs[Math.floor(Math.random()*algs.length)]
      await exec(`INSERT INTO algorithm_bindings(order_id,algorithm_id,created_at) VALUES($oid,$aid,$ts)`,{ $oid:o.id, $aid:a.id, $ts:new Date().toISOString() })
    }
  }
}

export async function bindAlgorithmToOrder(orderId: string, algorithmId: string) {
  await ensureAlgorithmBindings()
  await exec(`INSERT INTO algorithm_bindings(order_id,algorithm_id,created_at) VALUES($oid,$aid,$ts)`,{ $oid: orderId, $aid: algorithmId, $ts: new Date().toISOString() })
}

export async function getBindingsForOrder(orderId: string) {
  await ensureAlgorithmBindings()
  return queryAll(`SELECT algorithm_id as algorithmId FROM algorithm_bindings WHERE order_id=$oid ORDER BY created_at DESC`,{ $oid: orderId })
}

export async function getBindingsForAlgorithm(algorithmId: string) {
  await ensureAlgorithmBindings()
  return queryAll(`SELECT order_id as orderId FROM algorithm_bindings WHERE algorithm_id=$aid ORDER BY created_at DESC`,{ $aid: algorithmId })
}

async function ensureAlgorithmFlows() {
  await exec(`CREATE TABLE IF NOT EXISTS algorithm_flows (
    algorithm_id TEXT PRIMARY KEY,
    name TEXT,
    blocks TEXT,
    edges TEXT,
    updated_at TEXT
  )`)
  const c = (await queryAll(`SELECT COUNT(*) as c FROM algorithm_flows`))[0]?.c || 0
  if (c === 0) {
    const rows = await queryAll(`SELECT id, name FROM algorithms ORDER BY id LIMIT 8`)
    for (const r of rows) {
      const blocks = [
        { id:'input', type:'输入', label:'业务输入' },
        { id:'features', type:'特征工程', label:'字段抽取/清洗' },
        { id:'model', type:'模型推理', label:r.name },
        { id:'evaluation', type:'评估', label:'置信度/阈值' },
        { id:'decision', type:'业务决策', label:'拦截/放行' }
      ]
      const edges = [
        { from:'input', to:'features' },
        { from:'features', to:'model' },
        { from:'model', to:'evaluation' },
        { from:'evaluation', to:'decision' }
      ]
      await exec(`INSERT INTO algorithm_flows(algorithm_id,name,blocks,edges,updated_at) VALUES($id,$n,$b,$e,$t)`,{
        $id:r.id, $n:r.name, $b: JSON.stringify(blocks), $e: JSON.stringify(edges), $t:new Date().toISOString()
      })
    }
  }
}

export async function getAlgorithmFlow(algorithmId: string) {
  await ensureAlgorithmFlows()
  const rows = await queryAll(`SELECT algorithm_id as algorithmId, name, blocks, edges, updated_at as updatedAt FROM algorithm_flows WHERE algorithm_id=$id`,{ $id: algorithmId })
  const r = rows[0]
  if (!r) return null
  return { algorithmId: r.algorithmId, name: r.name, blocks: JSON.parse(r.blocks || '[]'), edges: JSON.parse(r.edges || '[]'), updatedAt: r.updatedAt }
}

export async function upsertAlgorithmFlow(algorithmId: string, flow: { blocks: any[]; edges: any[] }) {
  await ensureAlgorithmFlows()
  await exec(`INSERT INTO algorithm_flows(algorithm_id,name,blocks,edges,updated_at) 
    VALUES($id, (SELECT name FROM algorithms WHERE id=$id), $b, $e, $t)
    ON CONFLICT(algorithm_id) DO UPDATE SET blocks=$b, edges=$e, updated_at=$t`,{
    $id: algorithmId,
    $b: JSON.stringify(flow.blocks || []),
    $e: JSON.stringify(flow.edges || []),
    $t: new Date().toISOString()
  })
}

export async function listAlgorithmFlows() {
  await ensureAlgorithmFlows()
  const rows = await queryAll(`SELECT algorithm_id as algorithmId, name, blocks, edges FROM algorithm_flows ORDER BY name`)
  return rows.map(r=> ({ algorithmId: r.algorithmId, name: r.name, blocks: JSON.parse(r.blocks || '[]'), edges: JSON.parse(r.edges || '[]') }))
}

export async function enqueueJob(type: string, payload: any) {
  const qs = new URLSearchParams()
  qs.set('type', type)
  const res = await fetch(`/api/jobs?${qs.toString()}` , {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return await res.json()
}

export async function getAlgorithmRecommendations(orderId: string) {
  const [o] = await queryAll(`SELECT id, order_number as orderNo, enterprise, category, amount, currency, status FROM orders WHERE id=$id`, { $id: orderId })
  if (!o) return null
  const invMap: Record<string,string> = { beauty: '化妆品', electronics: '电子产品', textile: '服装', wine: '食品', appliance: '机械设备' }
  const invName = invMap[o.category] || '电子产品'
  const inv = (await queryAll(`SELECT current, target, production, sales, efficiency FROM inventory WHERE name=$n`, { $n: invName }))[0] || { current: 0, target: 0, production: 0, sales: 0, efficiency: 0 }
  const stockGap = (inv.target || 0) - (inv.current || 0)
  const reallocate = stockGap > 0 ? Math.min(stockGap, Math.round((o.amount || 0) / 1000)) : 0
  const demand = Math.max(0, (inv.sales || 0) - (inv.production || 0))
  const capacityPlan = demand > 0 ? Math.ceil(demand * 0.6) : 0
  const settle = (await queryAll(`SELECT method, success_rate as sr, avg_time as t FROM payments ORDER BY amount DESC LIMIT 1`))[0] || { method: '电汇', sr: 98.5, t: 1.8 }
  const customs = (await queryAll(`SELECT status FROM customs_clearances WHERE order_id=$oid LIMIT 1`, { $oid: orderId }))[0] || { status: 'declared' }
  const nextLog = (await queryAll(`SELECT status, origin, destination FROM logistics WHERE order_id=$oid ORDER BY id DESC LIMIT 1`, { $oid: orderId }))[0] || { status: 'pickup' }
  const nextMap: Record<string,string> = { pickup:'transit', transit:'delivery', delivery:'completed', customs:'delivery', completed:'completed' }
  const nextStep = nextMap[nextLog.status] || 'transit'
  return {
    payment: { bestMethod: settle.method, successRate: settle.sr, etaHours: settle.t },
    inventory: { action: reallocate > 0 ? 'reallocate' : 'stable', quantity: reallocate },
    productionSales: { planIncrease: capacityPlan },
    processControl: { customsStatus: customs.status, nextLogisticsStep: nextStep },
    decision: { summary: `建议使用${settle.method}完成结算，库存调拨${reallocate}，产能增加${capacityPlan}` }
  }
}

export async function predictDemand(sku: string) {
  const [inv] = await queryAll(`SELECT sales, production FROM inventory WHERE name=$n`, { $n: sku })
  const base = inv ? (inv.sales || 100) : 100
  const trend = Math.random() * 0.2 + 0.9 // 0.9 - 1.1
  const forecast = Math.round(base * trend * 1.1)
  const confidence = Math.round((0.85 + Math.random() * 0.1) * 100) / 100
  return { sku, currentSales: base, forecast, trend: trend > 1 ? 'up' : 'down', confidence }
}

export async function optimizeRoute(origin: string, dest: string) {
  const distMap: Record<string, number> = { 'CNSHA-USLAX': 10400, 'CNSZX-USLAX': 10500, 'CNCAN-USLAX': 10600 }
  const key = `${origin}-${dest}`
  const dist = distMap[key] || 10000
  const seaTime = Math.round(dist / 20 / 24) // ~20 knots
  const airTime = Math.round(dist / 800) // ~800 km/h
  return {
    sea: { mode: 'SEA', timeDays: seaTime, cost: 2500, co2: 500 },
    air: { mode: 'AIR', timeHours: airTime, cost: 12000, co2: 4000 },
    recommendation: seaTime < 30 ? 'sea' : 'air'
  }
}

export async function analyzeFxRisk(currency: string, amount: number) {
  const rate = currency === 'USD' ? 7.12 : currency === 'EUR' ? 7.85 : 1
  const volatility = Math.random() * 0.05
  const exposure = amount * rate
  const risk = exposure * volatility
  return { currency, rate, exposure, risk, action: risk > 5000 ? 'hedge' : 'hold' }
}

export async function analyzeWarehouse(zone: string) {
  const utilization = 0.6 + Math.random() * 0.3
  const efficiency = 0.8 + Math.random() * 0.15
  return { zone, utilization, efficiency, issue: utilization > 0.85 ? 'congestion' : 'none' }
}

export async function analyzeOrderRisk(orderId: string) {
  const [o] = await queryAll(`SELECT amount, enterprise FROM orders WHERE id=$id`, { $id: orderId })
  if (!o) return null
  const amount = o.amount || 0
  const riskScore = amount > 50000 ? 80 : 20
  const margin = amount * 0.15
  return { orderId, riskScore, margin, probability: riskScore > 60 ? 'medium' : 'high' }
}

export async function getCollaborationInsights() {
  const forecastAcc = 0.85 + Math.random() * 0.1
  const turnover = 12 + Math.random() * 4
  return {
    forecastAccuracy: forecastAcc,
    inventoryTurnover: turnover,
    supplierScore: 92,
    alerts: ['Supplier A delay risk', 'Material B shortage']
  }
}

export async function getHsChapters() {
  const rows = await queryAll(`SELECT DISTINCT substr(replace(hs_code,'.',''),1,2) as chap FROM customs_items WHERE hs_code IS NOT NULL AND hs_code!='' ORDER BY chap`)
  const present = rows.map(r=> String(r.chap).padStart(2,'0')).filter(Boolean)
  const common = ['01','02','21','22','33','39','48','61','62','64','70','72','73','76','84','85','87','90','94','95']
  const names: Record<string,string> = {
    '01':'活动物', '02':'肉及食用杂碎', '21':'杂项食品', '22':'饮料及酒', '33':'精油香料及化妆品',
    '39':'塑料及制品', '48':'纸及纸板及制品', '61':'针织或钩编的服装', '62':'非针织服装', '64':'鞋靴',
    '70':'玻璃及其制品', '72':'钢铁', '73':'钢铁制品', '76':'铝及其制品', '84':'机械器具', '85':'电机电气设备',
    '87':'车辆及其零件', '90':'光学、测量、医疗仪器', '94':'家具、寝具等', '95':'玩具、游戏及体育用品'
  }
  const set = Array.from(new Set([...present, ...common])).sort()
  return set.map(ch => ({ chap: ch, name: names[ch] || `第${ch}章` }))
}

export async function getOrderPrimaryHs(orderId: string) {
  const rows = await queryAll(`
    SELECT ci.hs_code as hs, IFNULL(ci.amount, ci.qty*ci.unit_price) as amt
    FROM customs_items ci JOIN customs_headers ch ON ci.header_id=ch.id
    WHERE ch.order_id=$oid AND ci.hs_code IS NOT NULL AND ci.hs_code!=''
    ORDER BY amt DESC LIMIT 1
  `, { $oid: orderId })
  const hs = rows[0]?.hs || ''
  const chap = hs ? (hs.replace(/\./g,'').slice(0,2) || '') : ''
  return { hsCode: hs, chapter: chap }
}

export async function upsertBusinessModel(model: {
  id: string,
  name: string,
  category: string,
  version: string,
  status: string,
  enterprises: number,
  orders: number,
  description: string,
  scenarios: string[],
  compliance: string[],
  chapters?: string[],
  successRate: number,
  lastUpdated: string,
  maintainer: string
}) {
  const payload = {
    id: model.id,
    name: model.name,
    category: model.category,
    version: model.version,
    status: model.status,
    enterprises: model.enterprises,
    orders: model.orders,
    description: model.description,
    scenarios: JSON.stringify(model.scenarios),
    compliance: JSON.stringify(model.compliance),
    chapters: JSON.stringify(model.chapters || []),
    success_rate: model.successRate,
    last_updated: model.lastUpdated,
    maintainer: model.maintainer
  }
  await fetch('/api/business_models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
}

export async function deleteBusinessModel(id: string) {
  await fetch(`/api/business_models/${id}`, { method: 'DELETE' })
}

// Enterprises dataset
export async function getEnterprisesPaged(q: string, type: string, status: string, category: string, region: string, offset: number, limit: number) {
  const where: string[] = []
  const params: any = { $offset: offset, $limit: limit }
  if (q) { where.push(`(name LIKE $q OR reg_no LIKE $q OR region LIKE $q)`); params.$q = `%${q}%` }
  if (type && type !== 'all') { where.push(`type = $type`); params.$type = type }
  if (status && status !== 'all') { where.push(`status = $status`); params.$status = status }
  if (category && category !== 'all') { where.push(`category = $category`); params.$category = category }
  if (region && region !== 'all') { where.push(`region = $region`); params.$region = region }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  return queryAll(`SELECT id, reg_no as regNo, name, type, category, region, status, compliance, service_eligible as eligible, active_orders as activeOrders, last_active as lastActive FROM enterprises ${whereSql} ORDER BY last_active DESC LIMIT $limit OFFSET $offset`, params)
}

export async function countEnterprises(q: string, type: string, status: string, category: string, region: string) {
  const where: string[] = []
  const params: any = {}
  if (q) { where.push(`(name LIKE $q OR reg_no LIKE $q OR region LIKE $q)`); params.$q = `%${q}%` }
  if (type && type !== 'all') { where.push(`type = $type`); params.$type = type }
  if (status && status !== 'all') { where.push(`status = $status`); params.$status = status }
  if (category && category !== 'all') { where.push(`category = $category`); params.$category = category }
  if (region && region !== 'all') { where.push(`region = $region`); params.$region = region }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const rows = await queryAll(`SELECT COUNT(*) as c FROM enterprises ${whereSql}`, params)
  return rows[0]?.c || 0
}

export async function batchImportEnterprises(data: any[]) {
  const db = await getDatabase()
  db.run('BEGIN TRANSACTION')
  try {
    for (const row of data) {
      const id = row.id || 'E' + Math.floor(Math.random() * 1000000)
      const reg = row.regNo || row.reg_no || 'REG' + Math.floor(Math.random() * 1000000)
      const name = row.name || 'Unknown Enterprise'
      const type = row.type || 'importer'
      const cat = row.category || 'general'
      const region = row.region || 'Unknown'
      const status = row.status || 'active'
      const compliance = parseFloat(row.compliance) || 80
      const eligible = row.eligible ? 1 : (row.service_eligible ? 1 : 0)
      const activeOrders = parseInt(row.activeOrders || row.active_orders || '0')
      const lastActive = row.lastActive || row.last_active || new Date().toISOString()
      
      db.run(`INSERT INTO enterprises(id,reg_no,name,type,category,region,status,compliance,service_eligible,active_orders,last_active) 
              VALUES($id,$reg,$name,$type,$cat,$region,$status,$comp,$elig,$act,$last)
              ON CONFLICT(id) DO UPDATE SET
                reg_no=$reg, name=$name, type=$type, category=$cat, region=$region, status=$status, 
                compliance=$comp, service_eligible=$elig, active_orders=$act, last_active=$last`,{
        $id:id,$reg:reg,$name:name,$type:type,$cat:cat,$region:region,$status:status,
        $comp:compliance,$elig:eligible,$act:activeOrders,$last:lastActive
      })
    }
    db.run('COMMIT')
    persist(db)
    return { success: true, count: data.length }
  } catch (e) {
    db.run('ROLLBACK')
    console.error('Batch import failed', e)
    return { success: false, error: String(e) }
  }
}

export async function getTimelineEvents() {
  return queryAll(`SELECT * FROM timeline_events ORDER BY id`)
}

export async function getAuditLogs() {
  return queryAll(`SELECT message FROM audit_logs ORDER BY id`)
}

export async function updateAlgorithmCode(id: string, code: string) {
  const rows = await getAlgorithms(id, 0, 1)
  const r = rows[0]
  if (!r) return
  const payload = {
    id: r.id,
    name: r.name,
    category: r.category,
    version: r.version,
    status: r.status,
    accuracy: r.accuracy,
    performance: r.performance,
    usage: r.usage,
    description: r.description,
    features: Array.isArray(r.features) ? JSON.stringify(r.features) : (r.features || '[]'),
    last_updated: r.lastUpdated || r.last_updated,
    author: r.author,
    code: code
  }
  await fetch('/api/algorithms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
}

export async function getSettings() {
  await exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`) 
  return queryAll(`SELECT key, value FROM settings`)
}

export async function upsertSetting(key: string, value: string) {
  await exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`)
  await exec(`INSERT INTO settings(key,value) VALUES($k,$v) ON CONFLICT(key) DO UPDATE SET value=$v`, { $k: key, $v: value })
}

export async function getCollaborationAccuracy() {
  const rows = await queryAll(`SELECT AVG(accuracy) as acc FROM algorithms WHERE status='active'`)
  return Math.round(((rows[0]?.acc || 0)) * 10) / 10
}

export async function getEfficiencyRate() {
  const rows = await queryAll(`SELECT AVG(efficiency) as ef FROM logistics`)
  return Math.round(((rows[0]?.ef || 0)) * 10) / 10
}

export async function getKpiBaseline() {
  await exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`)
  const rows = await queryAll(`SELECT key, value FROM settings WHERE key IN ('baseline_accuracy','baseline_efficiency')`)
  const map: Record<string,string> = {}
  for (const r of rows) { map[r.key] = r.value }
  return {
    accuracy: parseFloat(map['baseline_accuracy'] || '80'),
    efficiency: parseFloat(map['baseline_efficiency'] || '75')
  }
}

export async function getKpiImprovements() {
  const base = await getKpiBaseline()
  const acc = await getCollaborationAccuracy()
  const ef = await getEfficiencyRate()
  const accImp = base.accuracy ? Math.round(((acc - base.accuracy) / base.accuracy) * 1000) / 10 : 0
  const efImp = base.efficiency ? Math.round(((ef - base.efficiency) / base.efficiency) * 1000) / 10 : 0
  return { acc, ef, accImp, efImp, base }
}

export async function getApplications() {
  return queryAll(`SELECT id, applicationNo, enterprise, category, type, status, submitDate, expectedDate, priority, compliance, riskScore, reviewer, progress FROM applications ORDER BY submitDate DESC`)
}

export async function getAcceptanceCriteria() {
  return queryAll(`SELECT id, name, category, status, progress, deadline, assignee, compliance FROM acceptance_criteria ORDER BY id`)
}

export async function getReviewWorkflows() {
  return queryAll(`SELECT id, applicationId, stage, status, reviewer, startDate, endDate, comments FROM review_workflows ORDER BY id`)
}

export async function updateLogisticsStatus(id: string, status: string) {
  await exec(`UPDATE logistics SET status=$st WHERE id=$id`, { $st: status, $id: id })
}

export async function getTradeStreamBatch(offset: number, limit: number) {
  return queryAll(`SELECT id, order_id as orderId, from_city as fromCity, to_city as toCity, amount, ts FROM trade_stream ORDER BY ts DESC LIMIT $limit OFFSET $offset`,{ $limit: limit, $offset: offset })
}

export async function getPortsCongestion() {
  return queryAll(`SELECT port, idx as congestionIndex, updated_at as updatedAt FROM ports_congestion`)
}

export async function updatePortCongestion(port: string, index: number) {
  await exec(`UPDATE ports_congestion SET idx=$i, updated_at=$t WHERE port=$p`,{ $i:index, $t:new Date().toISOString(), $p:port })
}

export async function getTodayGMV() {
  const rows = await queryAll(`SELECT IFNULL(SUM(amount),0) as gmv FROM trade_stream WHERE date(ts)=date('now')`)
  return Math.round((rows[0]?.gmv || 0) * 100) / 100
}

export async function pushTradeEvents(count: number) {
  // Simulate stream by updating ts of random events to now
  const ids = await queryAll(`SELECT id FROM trade_stream ORDER BY RANDOM() LIMIT $c`,{ $c: count })
  for (const r of ids) {
    await exec(`UPDATE trade_stream SET ts=$t WHERE id=$id`,{ $t:new Date().toISOString(), $id:r.id })
  }
}

export async function getExchangeRate(base: string, quote: string) {
  const r = (await queryAll(`SELECT rate FROM exchange_rates WHERE base=$b AND quote=$q`,{ $b:base, $q:quote }))[0]
  return r?.rate || 1
}

export async function computeLandedCost(orderId: string) {
  const items = await queryAll(`SELECT amount, tariff, excise, vat FROM customs_items WHERE header_id IN (SELECT id FROM customs_headers WHERE order_id=$oid)`,{ $oid: orderId })
  let product = 0, tariff = 0, excise = 0, vat = 0
  for (const it of items) { product += (it.amount || 0); tariff += (it.tariff || 0); excise += (it.excise || 0); vat += (it.vat || 0) }
  const [hdr] = await queryAll(`SELECT currency FROM customs_headers WHERE order_id=$oid ORDER BY declare_date DESC LIMIT 1`,{ $oid: orderId })
  const cur = hdr?.currency || 'CNY'
  const rate = cur==='CNY' ? 1 : await getExchangeRate(cur, 'CNY')
  const productCny = (product || 0) * (rate || 1)
  const [log] = await queryAll(`SELECT freight_cost as freight, insurance_cost as ins FROM logistics WHERE order_id=$oid ORDER BY id DESC LIMIT 1`,{ $oid: orderId })
  const freight = log?.freight || 0
  const insurance = log?.ins || 0
  const total = productCny + freight + insurance + tariff + excise + vat
  return { product: productCny, freight, insurance, tariff, excise, vat, total }
}

export async function getDocuments(orderId: string) {
  return queryAll(`SELECT id, type, number, issued_at as issuedAt, url, extra FROM documents WHERE order_id=$oid ORDER BY issued_at DESC`,{ $oid: orderId })
}

export async function getTrackEvents(logisticsId: string) {
  return queryAll(`SELECT event, status, ts FROM track_events WHERE logistics_id=$lid ORDER BY ts`,{ $lid: logisticsId })
}

export async function consistencyCheck() {
  // Compute simple consistency: compare order status vs latest logistics/customs/settlement presence
  const total = (await queryAll(`SELECT COUNT(*) as c FROM orders`))[0]?.c || 1
  const okCustoms = (await queryAll(`SELECT COUNT(*) as c FROM customs_clearances WHERE status='cleared'`))[0]?.c || 0
  const blockedLogistics = (await queryAll(`SELECT COUNT(*) as c FROM logistics WHERE status='customs' OR status='pickup'`))[0]?.c || 0
  const settled = (await queryAll(`SELECT COUNT(*) as c FROM settlements WHERE status='completed'`))[0]?.c || 0
  const score = Math.max(0, Math.min(2, 2 - ((blockedLogistics/total) + ((total - okCustoms)/total)*0.5)))
  await exec(`INSERT OR REPLACE INTO system_metrics(key,value) VALUES('data_sync_delay',$v)`,{ $v: score })
  return score
}

export async function runDataQualityScan() {
  const issues: string[] = []
  const badHs = await queryAll(`SELECT name FROM customs_items WHERE length(replace(hs_code,'.','')) < 8`)
  for (const r of badHs) issues.push(`HS编码不完整: ${r.name}`)
  const missingUnit = await queryAll(`SELECT name FROM customs_items WHERE unit IS NULL OR unit=''`)
  for (const r of missingUnit) issues.push(`缺少计量单位: ${r.name}`)
  const clearedPendingPay = await queryAll(`SELECT o.order_number as no FROM orders o WHERE EXISTS(SELECT 1 FROM customs_clearances c WHERE c.order_id=o.id AND c.status='cleared') AND EXISTS(SELECT 1 FROM settlements s WHERE s.order_id=o.id AND s.status!='completed')`)
  for (const r of clearedPendingPay) issues.push(`通关已完成但未结算: 订单 ${r.no}`)
  const highAmt = await queryAll(`SELECT id, amount FROM trade_stream WHERE amount > 50000 ORDER BY amount DESC LIMIT 50`)
  for (const r of highAmt) issues.push(`交易金额异常: 事件 ${r.id} 金额 ${Math.round(r.amount*100)/100}`)
  for (const m of issues.slice(0, 50)) {
    await exec(`INSERT INTO audit_logs(message,created_at) VALUES($m,$t)`, { $m: `[Risk] ${m}`, $t: new Date().toISOString() })
  }
  return issues
}

export async function getCollaborationFlows() {
  const rows = await queryAll(`
    SELECT 
      o.id, o.order_number, o.enterprise, o.category, o.amount, o.created_at,
      cc.status as customs_status, cc.id as customs_id,
      l.status as logistics_status, l.id as logistics_id,
      s.status as settlement_status, s.id as settlement_id,
      CASE 
        WHEN l.status = 'completed' THEN 'completed'
        ELSE 'pending'
      END as warehouse_status
    FROM orders o
    LEFT JOIN customs_clearances cc ON o.id = cc.order_id
    LEFT JOIN logistics l ON o.id = l.order_id
    LEFT JOIN settlements s ON o.id = s.order_id
    ORDER BY o.created_at DESC
    LIMIT 50
  `)
  
  return rows.map(r => {
    // Determine overall state based on the user's flow: Order -> Customs -> Logistics -> Payment -> Warehouse
    let currentStep = 1
    if (r.customs_status) currentStep = 2
    if (r.logistics_status) currentStep = 3
    if (r.settlement_status) currentStep = 4
    if (r.warehouse_status === 'completed') currentStep = 5
    
    return {
      ...r,
      currentStep
    }
  })
}

export async function createOrderFlow() {
  const id = 'O' + Date.now()
  const enterprises = ['上海美妆集团','深圳电子科技','广州食品进出口','宁波服装贸易','青岛机械制造']
  const categories = ['beauty','electronics','wine','textile','appliance']
  const n = Math.floor(Math.random()*enterprises.length)
  
  await exec(`INSERT INTO orders(id,order_number,enterprise,category,status,amount,currency,created_at,updated_at)
    VALUES($id,$num,$ent,$cat,'created',$amt,'CNY',$cr,$up)`, {
      $id: id,
      $num: 'ORD-' + id,
      $ent: enterprises[n],
      $cat: categories[n],
      $amt: Math.floor(Math.random()*100000)+1000,
      $cr: new Date().toISOString(),
      $up: new Date().toISOString()
  })
  return id
}

export async function advanceOrderFlow(orderId: string) {
  // Check current state
  const flow = (await queryAll(`
    SELECT 
      o.id, 
      cc.status as customs_status, 
      l.status as logistics_status, 
      s.status as settlement_status
    FROM orders o
    LEFT JOIN customs_clearances cc ON o.id = cc.order_id
    LEFT JOIN logistics l ON o.id = l.order_id
    LEFT JOIN settlements s ON o.id = s.order_id
    WHERE o.id = $id
  `, { $id: orderId }))[0]

  if (!flow) return

  // State Machine: Order -> Customs -> Logistics -> Payment -> Warehouse
  
  // 1. Create Customs
  if (!flow.customs_status) {
    const cid = 'C' + Date.now()
    await exec(`INSERT INTO customs_clearances(id,declaration_no,product,enterprise,status,clearance_time,compliance,risk_score,order_id) 
      VALUES($id,$dec,'商品',$ent,'declared',0,95,10,$oid)`, {
      $id: cid,
      $dec: 'DEC-' + cid,
      $ent: 'System',
      $oid: orderId
    })
    return 'customs_started'
  }
  
  // 2. Clear Customs -> Start Logistics
  if (flow.customs_status === 'declared') {
     await exec(`UPDATE customs_clearances SET status='cleared', clearance_time=2.5 WHERE order_id=$oid`, { $oid: orderId })
     return 'customs_cleared'
  }

  if (flow.customs_status === 'cleared' && !flow.logistics_status) {
    const lid = 'L' + Date.now()
    await exec(`INSERT INTO logistics(id,tracking_no,origin,destination,status,estimated_time,actual_time,efficiency,order_id)
      VALUES($id,$tr,'CN','US','pickup',100,0,90,$oid)`, {
      $id: lid,
      $tr: 'TRK-' + lid,
      $oid: orderId
    })
    return 'logistics_started'
  }
  
  // 3. Logistics Transit -> Payment
  if (flow.logistics_status === 'pickup') {
    await exec(`UPDATE logistics SET status='transit' WHERE order_id=$oid`, { $oid: orderId })
    return 'logistics_transit'
  }

  if (flow.logistics_status === 'transit' && !flow.settlement_status) {
    const sid = 'S' + Date.now()
    await exec(`INSERT INTO settlements(id,order_id,status,settlement_time,risk_level)
      VALUES($id,$oid,'processing',0,'low')`, {
      $id: sid,
      $oid: orderId
    })
    return 'payment_started'
  }
  
  // 4. Payment Complete -> Logistics Complete (Warehouse)
  if (flow.settlement_status === 'processing') {
    await exec(`UPDATE settlements SET status='completed', settlement_time=1.5 WHERE order_id=$oid`, { $oid: orderId })
    return 'payment_completed'
  }

  if (flow.settlement_status === 'completed' && flow.logistics_status === 'transit') {
    await exec(`UPDATE logistics SET status='completed', actual_time=98 WHERE order_id=$oid`, { $oid: orderId })
    return 'warehouse_inbound'
  }
  
  return 'no_change'
}

// --- Orders CRUD ---

export async function getOrdersPaged(q: string, status: string, offset: number, limit: number) {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  if (status) qs.set('status', status)
  qs.set('offset', String(offset))
  qs.set('limit', String(limit))
  const res = await fetch(`/api/orders?${qs.toString()}`)
  const data = await res.json()
  return data
}

export async function countOrders(q: string, status: string) {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  if (status) qs.set('status', status)
  const res = await fetch(`/api/orders/count?${qs.toString()}`)
  const json = await res.json()
  return json.count || 0
}

export async function upsertOrder(o: any) {
  await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: o.id,
      order_number: o.orderNumber,
      enterprise: o.enterprise,
      category: o.category || 'general',
      status: o.status || 'created',
      amount: o.amount || 0,
      currency: o.currency || 'CNY',
      created_at: o.createdAt || new Date().toISOString()
    })
  })
  await exec(`INSERT INTO orders(id,order_number,enterprise,category,status,amount,currency,created_at,updated_at)
              VALUES($id,$num,$ent,$cat,$st,$amt,$cur,$cr,$up)
              ON CONFLICT(id) DO UPDATE SET
                order_number=$num, enterprise=$ent, category=$cat, status=$st, amount=$amt, currency=$cur, updated_at=$up`,{
    $id:o.id,$num:o.orderNumber,$ent:o.enterprise,$cat:o.category||'general',$st:o.status||'created',$amt:o.amount||0,$cur:o.currency||'CNY',$cr:o.createdAt||new Date().toISOString(),$up:new Date().toISOString()
  })
  if (o.incoterms || o.tradeTerms || o.route) {
    await exec(`UPDATE orders SET incoterms=$inc, trade_terms=$tt, route=$rt WHERE id=$id`,{
      $inc: o.incoterms || null,
      $tt: o.tradeTerms || null,
      $rt: o.route || null,
      $id: o.id
    })
  }
}

export async function deleteOrder(id: string) {
  await fetch(`/api/orders/${id}`, { method: 'DELETE' })
  await exec(`DELETE FROM orders WHERE id=$id`, { $id: id })
}

// --- Logistics CRUD ---

export async function getLogisticsPaged(q: string, status: string, offset: number, limit: number) {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  if (status) qs.set('status', status)
  qs.set('offset', String(offset))
  qs.set('limit', String(limit))
  const res = await fetch(`/api/logistics?${qs.toString()}`)
  const data = await res.json()
  return data
}

export async function countLogistics(q: string, status: string) {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  if (status) qs.set('status', status)
  const res = await fetch(`/api/logistics/count?${qs.toString()}`)
  const json = await res.json()
  return json.count || 0
}

export async function upsertLogistics(l: any) {
  await fetch('/api/logistics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: l.id,
      tracking_no: l.trackingNo,
      origin: l.origin,
      destination: l.destination,
      status: l.status,
      estimated_time: l.estimatedTime || 0,
      actual_time: l.actualTime || 0,
      efficiency: l.efficiency || 0,
      order_id: l.orderId || ''
    })
  })
  await exec(`INSERT INTO logistics(id,tracking_no,origin,destination,status,estimated_time,actual_time,efficiency,order_id)
              VALUES($id,$tr,$o,$d,$s,$et,$at,$ef,$oid)
              ON CONFLICT(id) DO UPDATE SET
                tracking_no=$tr, origin=$o, destination=$d, status=$s, estimated_time=$et, actual_time=$at, efficiency=$ef, order_id=$oid`,{
    $id:l.id,$tr:l.trackingNo,$o:l.origin,$d:l.destination,$s:l.status,$et:l.estimatedTime||0,$at:l.actualTime||0,$ef:l.efficiency||0,$oid:l.orderId||''
  })
  if (l.mode || typeof l.isFcl !== 'undefined' || l.carrier || l.eta) {
    await exec(`UPDATE logistics SET mode=$m, is_fcl=$f, carrier=$c, eta=$eta WHERE id=$id`,{
      $m: l.mode || null,
      $f: l.isFcl ? 1 : 0,
      $c: l.carrier || null,
      $eta: l.eta || null,
      $id: l.id
    })
  }
}

export async function deleteLogistics(id: string) {
  await fetch(`/api/logistics/${id}`, { method: 'DELETE' })
  await exec(`DELETE FROM logistics WHERE id=$id`, { $id: id })
}

// --- Settlements CRUD ---

export async function getSettlementsPaged(q: string, status: string, offset: number, limit: number) {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  if (status) qs.set('status', status)
  qs.set('offset', String(offset))
  qs.set('limit', String(limit))
  const res = await fetch(`/api/settlements?${qs.toString()}`)
  const data = await res.json()
  return data
}

export async function countSettlements(q: string, status: string) {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  if (status) qs.set('status', status)
  const res = await fetch(`/api/settlements/count?${qs.toString()}`)
  const json = await res.json()
  return json.count || 0
}

export async function upsertSettlement(s: any) {
  await fetch('/api/settlements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: s.id,
      order_id: s.orderId,
      status: s.status,
      settlement_time: s.settlementTime || 0,
      risk_level: s.riskLevel || 'low',
      payment_method: s.paymentMethod || null
    })
  })
  await exec(`INSERT INTO settlements(id,order_id,status,settlement_time,risk_level)
              VALUES($id,$oid,$st,$tm,$rl)
              ON CONFLICT(id) DO UPDATE SET
                order_id=$oid, status=$st, settlement_time=$tm, risk_level=$rl`,{
    $id:s.id,$oid:s.orderId,$st:s.status,$tm:s.settlementTime||0,$rl:s.riskLevel||'low'
  })
  if (s.paymentMethod) {
    await exec(`UPDATE settlements SET payment_method=$pm WHERE id=$id`, { $pm: s.paymentMethod, $id: s.id })
  }
}

export async function deleteSettlement(id: string) {
  await fetch(`/api/settlements/${id}`, { method: 'DELETE' })
  await exec(`DELETE FROM settlements WHERE id=$id`, { $id: id })
}

// --- Inventory/Warehouse CRUD ---

export async function getInventoryPaged(q: string, offset: number, limit: number) {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  qs.set('offset', String(offset))
  qs.set('limit', String(limit))
  const res = await fetch(`/api/inventory?${qs.toString()}`)
  const data = await res.json()
  return data
}

export async function countInventory(q: string) {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  const res = await fetch(`/api/inventory/count?${qs.toString()}`)
  const json = await res.json()
  return json.count || 0
}

export async function upsertInventory(i: any) {
  await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: i.name,
      current: i.current || 0,
      target: i.target || 0,
      production: i.production || 0,
      sales: i.sales || 0,
      efficiency: i.efficiency || 0
    })
  })
  await exec(`INSERT INTO inventory(name,current,target,production,sales,efficiency)
              VALUES($n,$c,$tg,$p,$s,$e)
              ON CONFLICT(name) DO UPDATE SET
                current=$c, target=$tg, production=$p, sales=$s, efficiency=$e`,{
    $n:i.name,$c:i.current||0,$tg:i.target||0,$p:i.production||0,$s:i.sales||0,$e:i.efficiency||0
  })
}

export async function deleteInventory(name: string) {
  await fetch(`/api/inventory/${encodeURIComponent(name)}`, { method: 'DELETE' })
  await exec(`DELETE FROM inventory WHERE name=$n`, { $n: name })
}

// --- Helper for Linkage ---
export async function getLinkableOrders(type: 'customs'|'logistics'|'settlement') {
  // Return orders that are eligible for the next step
  // customs: created but not declared (or declared but allows multi?) -> simplify: all orders without customs
  // logistics: cleared customs but not shipped -> simplify: orders with customs cleared but no logistics
  // settlement: shipped but not paid -> simplify: orders with logistics but no settlement
  
  if (type === 'customs') {
    return queryAll(`
      SELECT o.id, o.order_number FROM orders o 
      WHERE NOT EXISTS(SELECT 1 FROM customs_headers ch WHERE ch.order_id IS NOT NULL AND ch.order_id!='' AND ch.order_id=o.id)
        AND NOT EXISTS(SELECT 1 FROM customs_clearances cc WHERE cc.order_id IS NOT NULL AND cc.order_id!='' AND cc.order_id=o.id)
      ORDER BY o.created_at DESC`)
  }
  if (type === 'logistics') {
    return queryAll(`SELECT o.id, o.order_number FROM orders o 
      WHERE EXISTS(SELECT 1 FROM customs_headers ch WHERE ch.order_id=o.id AND ch.status IN ('cleared','released'))
        AND NOT EXISTS(SELECT 1 FROM logistics lg WHERE lg.order_id IS NOT NULL AND lg.order_id!='' AND lg.order_id=o.id)
      ORDER BY o.created_at DESC`)
  }
  if (type === 'settlement') {
    return queryAll(`SELECT o.id, o.order_number FROM orders o 
      WHERE NOT EXISTS(SELECT 1 FROM settlements s WHERE s.order_id IS NOT NULL AND s.order_id!='' AND s.order_id=o.id)`)
  }
  return []
}
