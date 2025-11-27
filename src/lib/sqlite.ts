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
  return db
}

function persist(db: Database) {
  const bytes = db.export()
  localStorage.setItem(STORAGE_KEY, toBase64(bytes))
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
      efficiency REAL
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
    { id:'L1', tr:'SF1234567890', o:'上海', d:'纽约', s:'delivery', et:72, at:68, ef:94.4 },
    { id:'L2', tr:'YT0987654321', o:'深圳', d:'伦敦', s:'customs', et:96, at:89, ef:92.7 },
    { id:'L3', tr:'ZTO1122334455', o:'广州', d:'东京', s:'transit', et:48, at:45, ef:93.8 },
    { id:'L4', tr:'EMS5566778899', o:'宁波', d:'悉尼', s:'pickup', et:120, at:115, ef:95.8 },
    { id:'L5', tr:'JD2233445566', o:'青岛', d:'新加坡', s:'completed', et:60, at:58, ef:96.7 }
  ].forEach(x=>{
    db.run(`INSERT INTO logistics(id,tracking_no,origin,destination,status,estimated_time,actual_time,efficiency) VALUES($id,$tr,$o,$d,$s,$et,$at,$ef)`,{
      $id:x.id,$tr:x.tr,$o:x.o,$d:x.d,$s:x.s,$et:x.et,$at:x.at,$ef:x.ef
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
  ].forEach(x=>{
    db.run(`INSERT INTO algorithms(id,name,category,version,status,accuracy,performance,usage,description,features,lastUpdated,author,code) VALUES($id,$n,$c,$v,$s,$a,$p,$u,$d,$f,$lu,$au,$co)`,{
      $id:x.id,$n:x.name,$c:x.cat,$v:x.ver,$s:x.st,$a:x.acc,$p:x.perf,$u:x.use,$d:x.desc,$f:x.feats,$lu:x.upd,$au:x.auth,$co:x.code
    })
  })

  ;[
    { id:'beauty-model', name:'美妆品类业务模型', cat:'beauty', ver:'v1.2.0', st:'active', ent:156, ord:2341, desc:'专门针对美妆品类的跨境供应链业务逻辑模型', sc:'["NMPA备案","保质期管理","成分合规"]', cp:'["NMPA","CFDA","海关编码"]', sr:92.5, lu:'2025-11-20', mt:'美妆业务部' },
    { id:'wine-model', name:'酒水品类业务模型', cat:'wine', ver:'v1.1.8', st:'active', ent:89, ord:1456, desc:'针对酒水品类的特殊监管要求和业务流程模型', sc:'["酒类许可","年龄验证","税收计算"]', cp:'["酒类专卖","海关","税务"]', sr:89.2, lu:'2025-11-18', mt:'酒水业务部' },
    { id:'appliance-model', name:'家电品类业务模型', cat:'appliance', ver:'v2.0.3', st:'active', ent:203, ord:1876, desc:'家电产品的跨境供应链标准化业务模型', sc:'["3C认证","能效标识","售后服务"]', cp:'["3C认证","能效标识","电子废物"]', sr:94.8, lu:'2025-11-23', mt:'家电业务部' }
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

  persist(db)
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

export async function getCustomsClearances() {
  return queryAll(`SELECT id, declaration_no as declarationNo, product, enterprise, status, clearance_time as clearanceTime, compliance, risk_score as riskScore FROM customs_clearances ORDER BY id`)
}

export async function updateCustomsStatus(id: string, status: string) {
  await exec(`UPDATE customs_clearances SET status=$st WHERE id=$id`, { $st: status, $id: id })
}

export async function getLogisticsData() {
  return queryAll(`SELECT id, tracking_no as trackingNo, origin, destination, status, estimated_time as estimatedTime, actual_time as actualTime, efficiency FROM logistics ORDER BY id`)
}

export async function getPaymentMethods() {
  return queryAll(`SELECT method as name, volume, amount, success_rate as successRate, avg_time as avgTime FROM payments ORDER BY volume DESC`)
}

export async function getInventoryData() {
  return queryAll(`SELECT name, current, target, production, sales, efficiency FROM inventory`)
}

export async function getAlgorithms() {
  return queryAll(`SELECT * FROM algorithms`)
}

export async function getBusinessModels() {
  return queryAll(`SELECT * FROM business_models`)
}

export async function getTimelineEvents() {
  return queryAll(`SELECT * FROM timeline_events ORDER BY id`)
}

export async function getAuditLogs() {
  return queryAll(`SELECT message FROM audit_logs ORDER BY id`)
}

export async function updateAlgorithmCode(id: string, code: string) {
  await exec(`UPDATE algorithms SET code=$co WHERE id=$id`, { $co: code, $id: id })
}

export async function getSettings() {
  await exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`) 
  return queryAll(`SELECT key, value FROM settings`)
}

export async function upsertSetting(key: string, value: string) {
  await exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`)
  await exec(`INSERT INTO settings(key,value) VALUES($k,$v) ON CONFLICT(key) DO UPDATE SET value=$v`, { $k: key, $v: value })
}
