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

function migrate(db: Database) {
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

export async function ensureCustomsTables() {
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
  await ensureCustomsTables()
  await exec(`INSERT INTO customs_headers(id,declaration_no,enterprise,consignor,consignee,port_code,trade_mode,currency,total_value,gross_weight,net_weight,packages,country_origin,country_dest,status,declare_date,order_id,updated_at)
              VALUES($id,$no,$ent,$sn,$se,$pc,$tm,$cur,$tv,$gw,$nw,$pkg,$co,$cd,$st,$dd,$oid,$upd)
              ON CONFLICT(id) DO UPDATE SET
                declaration_no=$no, enterprise=$ent, consignor=$sn, consignee=$se, port_code=$pc, trade_mode=$tm,
                currency=$cur, total_value=$tv, gross_weight=$gw, net_weight=$nw, packages=$pkg, country_origin=$co,
                country_dest=$cd, status=$st, declare_date=$dd, order_id=$oid, updated_at=$upd`,{
    $id:h.id,$no:h.declarationNo,$ent:h.enterprise||'',$sn:h.consignor||'',$se:h.consignee||'',$pc:h.portCode||'',
    $tm:h.tradeMode||'',$cur:h.currency||'CNY',$tv:h.totalValue||0,$gw:h.grossWeight||0,$nw:h.netWeight||0,
    $pkg:h.packages||0,$co:h.countryOrigin||'',$cd:h.countryDest||'',$st:h.status||'declared',
    $dd:h.declareDate||new Date().toISOString().slice(0,10),$oid:h.orderId||'',$upd:new Date().toISOString()
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
  await ensureCustomsTables()
  await exec(`INSERT INTO customs_items(id,header_id,line_no,hs_code,name,spec,unit,qty,unit_price,amount,origin_country,tax_rate,tariff,excise,vat)
              VALUES($id,$hid,$ln,$hs,$name,$spec,$unit,$qty,$up,$amt,$oc,$tr,$tar,$ex,$vat)
              ON CONFLICT(id) DO UPDATE SET
                header_id=$hid, line_no=$ln, hs_code=$hs, name=$name, spec=$spec, unit=$unit, qty=$qty, unit_price=$up,
                amount=$amt, origin_country=$oc, tax_rate=$tr, tariff=$tar, excise=$ex, vat=$vat`,{
    $id:it.id,$hid:it.headerId,$ln:it.lineNo||0,$hs:it.hsCode||'',$name:it.name||'',$spec:it.spec||'',
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

export async function getCustomsHeadersPaged(q: string, status: string, portCode: string, tradeMode: string, offset: number, limit: number, hsChap?: string, hsHead?: string, hsSub?: string, onlyBadHs?: boolean, onlyMissingUnit?: boolean, onlyAbnormalQty?: boolean) {
  await ensureCustomsTables()
  const where: string[] = []
  const params: any = { $offset: offset, $limit: limit }
  if (q) { where.push(`(declaration_no LIKE $q OR enterprise LIKE $q OR consignor LIKE $q OR consignee LIKE $q)`); params.$q = `%${q}%` }
  if (status && status!=='all') { where.push(`status = $st`); params.$st = status }
  if (portCode && portCode!=='all') { where.push(`port_code = $pc`); params.$pc = portCode }
  if (tradeMode && tradeMode!=='all') { where.push(`trade_mode = $tm`); params.$tm = tradeMode }
  if (hsChap && hsChap!=='all') {
    where.push(`EXISTS(SELECT 1 FROM customs_items ci WHERE ci.header_id=customs_headers.id AND substr(replace(ci.hs_code,'.',''),1,2)=$chap)`)
    params.$chap = hsChap
  }
  if (hsHead && hsHead!=='all') {
    where.push(`EXISTS(SELECT 1 FROM customs_items ci WHERE ci.header_id=customs_headers.id AND substr(replace(ci.hs_code,'.',''),1,4)=$head)`)
    params.$head = hsHead
  }
  if (hsSub && hsSub!=='all') {
    where.push(`EXISTS(SELECT 1 FROM customs_items ci WHERE ci.header_id=customs_headers.id AND replace(ci.hs_code,'.','')=$sub)`)
    params.$sub = hsSub
  }
  if (onlyBadHs) {
    where.push(`EXISTS(SELECT 1 FROM customs_items ci WHERE ci.header_id=customs_headers.id AND length(replace(ci.hs_code,'.','')) < 8)`)
  }
  if (onlyMissingUnit) {
    where.push(`EXISTS(SELECT 1 FROM customs_items ci WHERE ci.header_id=customs_headers.id AND (ci.unit IS NULL OR ci.unit=''))`)
  }
  if (onlyAbnormalQty) {
    where.push(`EXISTS(SELECT 1 FROM customs_items ci WHERE ci.header_id=customs_headers.id AND (ci.qty IS NULL OR ci.qty<=0))`)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  return queryAll(`SELECT id, declaration_no as declarationNo, enterprise, consignor, consignee, port_code as portCode, trade_mode as tradeMode, currency, total_value as totalValue, gross_weight as grossWeight, net_weight as netWeight, packages, country_origin as countryOrigin, country_dest as countryDest, status, declare_date as declareDate, updated_at as updatedAt FROM customs_headers ${whereSql} ORDER BY declare_date DESC LIMIT $limit OFFSET $offset`, params)
}

export async function countCustomsHeaders(q: string, status: string, portCode: string, tradeMode: string, hsChap?: string, hsHead?: string, hsSub?: string, onlyBadHs?: boolean, onlyMissingUnit?: boolean, onlyAbnormalQty?: boolean) {
  await ensureCustomsTables()
  const where: string[] = []
  const params: any = {}
  if (q) { where.push(`(declaration_no LIKE $q OR enterprise LIKE $q OR consignor LIKE $q OR consignee LIKE $q)`); params.$q = `%${q}%` }
  if (status && status!=='all') { where.push(`status = $st`); params.$st = status }
  if (portCode && portCode!=='all') { where.push(`port_code = $pc`); params.$pc = portCode }
  if (tradeMode && tradeMode!=='all') { where.push(`trade_mode = $tm`); params.$tm = tradeMode }
  if (hsChap && hsChap!=='all') { where.push(`EXISTS(SELECT 1 FROM customs_items ci WHERE ci.header_id=customs_headers.id AND substr(replace(ci.hs_code,'.',''),1,2)=$chap)`); params.$chap = hsChap }
  if (hsHead && hsHead!=='all') { where.push(`EXISTS(SELECT 1 FROM customs_items ci WHERE ci.header_id=customs_headers.id AND substr(replace(ci.hs_code,'.',''),1,4)=$head)`); params.$head = hsHead }
  if (hsSub && hsSub!=='all') { where.push(`EXISTS(SELECT 1 FROM customs_items ci WHERE ci.header_id=customs_headers.id AND replace(ci.hs_code,'.','')=$sub)`); params.$sub = hsSub }
  if (onlyBadHs) { where.push(`EXISTS(SELECT 1 FROM customs_items ci WHERE ci.header_id=customs_headers.id AND length(replace(hs_code,'.','')) < 8)`) }
  if (onlyMissingUnit) { where.push(`EXISTS(SELECT 1 FROM customs_items ci WHERE ci.header_id=customs_headers.id AND (ci.unit IS NULL OR ci.unit=''))`) }
  if (onlyAbnormalQty) { where.push(`EXISTS(SELECT 1 FROM customs_items ci WHERE ci.header_id=customs_headers.id AND (ci.qty IS NULL OR ci.qty<=0))`) }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const rows = await queryAll(`SELECT COUNT(*) as c FROM customs_headers ${whereSql}`, params)
  return rows[0]?.c || 0
}

export async function getCustomsItems(headerId: string) {
  await ensureCustomsTables()
  return queryAll(`SELECT id, header_id as headerId, line_no as lineNo, hs_code as hsCode, name, spec, unit, qty, unit_price as unitPrice, amount, origin_country as originCountry, tax_rate as taxRate, tariff, excise, vat FROM customs_items WHERE header_id=$hid ORDER BY line_no`,{ $hid: headerId })
}

export async function getHsHeadings(chapter?: string) {
  const params: any = {}
  const where = chapter ? `WHERE substr(replace(hs_code,'.',''),1,2)=$c` : ''
  if (chapter) params.$c = chapter
  const rows = await queryAll(`SELECT DISTINCT substr(replace(hs_code,'.',''),1,4) as head FROM customs_items ${where} ORDER BY head`, params)
  return rows.map(r => String(r.head).padStart(4,'0'))
}

export async function getHsSubheadings(heading?: string) {
  const params: any = {}
  const where = heading ? `WHERE substr(replace(hs_code,'.',''),1,4)=$h AND length(replace(hs_code,'.',''))>=8` : `WHERE length(replace(hs_code,'.',''))>=8`
  if (heading) params.$h = heading
  const rows = await queryAll(`SELECT DISTINCT replace(hs_code,'.','') as sub FROM customs_items ${where} ORDER BY sub`, params)
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
  const rows = await queryAll(`SELECT id, status, settlement_time as settlementTime, risk_level as riskLevel, payment_method as paymentMethod FROM settlements WHERE order_id=$oid LIMIT 1`, { $oid: orderId })
  return rows[0] || null
}

export async function completeSettlement(orderId: string, method: string) {
  const r = (await queryAll(`SELECT avg_time as t, success_rate as sr FROM payments WHERE method=$m LIMIT 1`, { $m: method }))[0] || {}
  const t = r.t || 2.0
  await exec(`UPDATE settlements SET status='completed', settlement_time=$t, risk_level='low', payment_method=$m WHERE order_id=$oid`, { $t: t, $m: method, $oid: orderId })
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
  return queryAll(`SELECT code, name, country FROM ports ORDER BY name`)
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

export async function getAlgorithms() {
  return queryAll(`SELECT * FROM algorithms`)
}

export async function getBusinessModels() {
  return queryAll(`SELECT * FROM business_models`)
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
  const model = await getBusinessModelForOrder(orderId)
  if (!model) return { applied: false, compliance: 0, messages: ['未匹配到业务模型'] }
  const chapList = JSON.parse(model.chapters || '[]') as string[]
  const [primary] = await queryAll(`SELECT substr(replace(ci.hs_code,'.',''),1,2) as chap, ci.hs_code as hs FROM customs_items ci JOIN customs_headers ch ON ci.header_id=ch.id WHERE ch.order_id=$oid ORDER BY IFNULL(ci.amount,ci.qty*ci.unit_price) DESC LIMIT 1`,{ $oid: orderId })
  const messages: string[] = []
  let score = 90
  if (primary?.chap && chapList.length && !chapList.includes(primary.chap)) { messages.push('HS章节与业务模型不匹配'); score -= 15 }
  const items = await queryAll(`SELECT id, hs_code as hs, unit, qty, unit_price as up, amount, excise FROM customs_items WHERE header_id IN (SELECT id FROM customs_headers WHERE order_id=$oid)`,{ $oid: orderId })
  if (model.category === 'beauty') {
    for (const it of items) { if (!it.unit) { messages.push('美妆商品缺少计量单位'); score -= 5; break } }
  } else if (model.category === 'wine') {
    for (const it of items) {
      const hs = String(it.hs||'').replace(/\./g,'')
      if (hs.startsWith('22') && (!it.excise || Number(it.excise)===0)) {
        const taxes = computeTaxes(it.hs, it.amount || (it.qty||0)*(it.up||0))
        await exec(`UPDATE customs_items SET excise=$ex WHERE id=$id`,{ $ex: taxes.excise, $id: it.id })
        messages.push('酒类消费税自动补全')
      }
    }
  } else if (model.category === 'electronics') {
    const missingOrigin = await queryAll(`SELECT COUNT(*) as c FROM customs_items WHERE header_id IN (SELECT id FROM customs_headers WHERE order_id=$oid) AND (origin_country IS NULL OR origin_country='')`,{ $oid: orderId })
    if ((missingOrigin[0]?.c || 0) > 0) { messages.push('电子产品缺少原产国'); score -= 5 }
  } else if (model.category === 'textile') {
    const noSpec = await queryAll(`SELECT COUNT(*) as c FROM customs_items WHERE header_id IN (SELECT id FROM customs_headers WHERE order_id=$oid) AND (spec IS NULL OR spec='')`,{ $oid: orderId })
    if ((noSpec[0]?.c || 0) > 0) { messages.push('纺织品缺少规格'); score -= 5 }
  } else if (model.category === 'appliance') {
    const settle = await getSettlementByOrder(orderId)
    if (!settle || settle.status!=='completed') { messages.push('家电模型建议在结算完成后安排发运'); score -= 3 }
  }
  const badHs = await queryAll(`SELECT COUNT(*) as c FROM customs_items WHERE header_id IN (SELECT id FROM customs_headers WHERE order_id=$oid) AND length(replace(hs_code,'.','')) < 8`,{ $oid: orderId })
  if ((badHs[0]?.c || 0) > 0) { messages.push('HS编码不完整'); score -= 6 }
  const [orderRow] = await queryAll(`SELECT incoterms FROM orders WHERE id=$id`,{ $id: orderId })
  const inc = orderRow?.incoterms || ''
  const [lg] = await queryAll(`SELECT mode, is_fcl as fcl, insurance_cost as ins FROM logistics WHERE order_id=$oid ORDER BY id DESC LIMIT 1`,{ $oid: orderId })
  const hasAwb = (await queryAll(`SELECT COUNT(*) as c FROM documents WHERE order_id=$oid AND type='AWB'`,{ $oid: orderId }))[0]?.c || 0
  const hasBl = (await queryAll(`SELECT COUNT(*) as c FROM documents WHERE order_id=$oid AND type='BL'`,{ $oid: orderId }))[0]?.c || 0
  if (inc==='CIF') { if (!lg || !(lg.ins || 0)) { messages.push('CIF缺少保险费用'); score -= 6 } }
  if (inc==='FOB') {
    const ocean = (lg?.mode==='FCL' || lg?.mode==='LCL' || typeof lg?.fcl==='number')
    if (ocean && !hasBl) { messages.push('FOB需提单单证'); score -= 5 }
  }
  if (lg && lg.mode==='AIR' && !hasAwb) { messages.push('空运需AWB单证'); score -= 5 }
  if (inc==='DDP') {
    const agg = (await queryAll(`SELECT IFNULL(SUM(tariff),0) as tariff, IFNULL(SUM(vat),0) as vat, IFNULL(SUM(excise),0) as excise FROM customs_items WHERE header_id IN (SELECT id FROM customs_headers WHERE order_id=$oid)`,{ $oid: orderId }))[0] || { tariff:0, vat:0, excise:0 }
    const taxZero = ((agg.tariff || 0) + (agg.vat || 0) + (agg.excise || 0)) <= 0
    if (taxZero) { messages.push('DDP需完税入境'); score -= 8 }
  }
  if (inc==='EXW') {
    const missingOriginAny = await queryAll(`SELECT COUNT(*) as c FROM customs_items WHERE header_id IN (SELECT id FROM customs_headers WHERE order_id=$oid) AND (origin_country IS NULL OR origin_country='')`,{ $oid: orderId })
    if ((missingOriginAny[0]?.c || 0) > 0) { messages.push('EXW缺少原产国信息'); score -= 4 }
  }
  if (score < 0) score = 0
  const [clr] = await queryAll(`SELECT id FROM customs_clearances WHERE order_id=$oid LIMIT 1`,{ $oid: orderId })
  if (clr?.id) await exec(`UPDATE customs_clearances SET compliance=$cp WHERE id=$id`,{ $cp: score, $id: clr.id })
  for (const m of messages) await exec(`INSERT INTO audit_logs(message,created_at) VALUES($m,$t)`,{ $m:`[Model] ${m}`, $t:new Date().toISOString() })
  return { applied: true, compliance: score, messages }
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
  await exec(`CREATE TABLE IF NOT EXISTS business_models (
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
    chapters TEXT,
    successRate REAL,
    lastUpdated TEXT,
    maintainer TEXT
  )`)
  await exec(`INSERT INTO business_models(id,name,category,version,status,enterprises,orders,description,scenarios,compliance,chapters,successRate,lastUpdated,maintainer)
              VALUES($id,$n,$c,$v,$s,$e,$o,$d,$sc,$cp,$ch,$sr,$lu,$mt)
              ON CONFLICT(id) DO UPDATE SET
                name=$n, category=$c, version=$v, status=$s, enterprises=$e, orders=$o, description=$d,
                scenarios=$sc, compliance=$cp, chapters=$ch, successRate=$sr, lastUpdated=$lu, maintainer=$mt`,{
    $id:model.id,$n:model.name,$c:model.category,$v:model.version,$s:model.status,$e:model.enterprises,$o:model.orders,
    $d:model.description,$sc:JSON.stringify(model.scenarios),$cp:JSON.stringify(model.compliance),$ch:JSON.stringify(model.chapters||[]),$sr:model.successRate,
    $lu:model.lastUpdated,$mt:model.maintainer
  })
}

export async function deleteBusinessModel(id: string) {
  await exec(`DELETE FROM business_models WHERE id=$id`, { $id:id })
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
