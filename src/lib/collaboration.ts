import { queryAll, exec, consistencyCheck } from './sqlite'

type EventType = 'ORDER_CREATED' | 'CUSTOMS_DECLARING' | 'LOGISTICS_BOOKING' | 'PAYMENT_SETTLED' | 'WAREHOUSE_INBOUND'

interface EventItem { type: EventType; orderId: string }

const queue: EventItem[] = []
let running = false
let consistencyTimer: any = null

async function ensureSettlement(orderId: string) {
  const rows = await queryAll(`SELECT id FROM settlements WHERE order_id=$oid LIMIT 1`,{ $oid: orderId })
  if (!rows.length) {
    const id = 'S'+Math.floor(Math.random()*1e6)
    await exec(`INSERT INTO settlements(id,order_id,status,settlement_time,risk_level) VALUES($id,$oid,$st,$tm,$rl)`,{ $id:id, $oid:orderId, $st:'pending', $tm:0, $rl:'medium' })
  }
}

async function ensureCustoms(orderId: string) {
  const rows = await queryAll(`SELECT id FROM customs_clearances WHERE order_id=$oid LIMIT 1`,{ $oid: orderId })
  if (!rows.length) {
    const id = 'C'+Math.floor(Math.random()*1e6)
    const no = 'CD'+(Date.now())
    await exec(`INSERT INTO customs_clearances(id,declaration_no,product,enterprise,status,clearance_time,compliance,risk_score,order_id) VALUES($id,$dec,$prod,$ent,$st,$tm,$cp,$rs,$oid)`,{
      $id:id,$dec:no,$prod:'商品',$ent:'企业',$st:'declared',$tm:0,$cp:80,$rs:20,$oid:orderId
    })
  }
}

async function ensureLogistics(orderId: string) {
  const rows = await queryAll(`SELECT id FROM logistics WHERE order_id=$oid ORDER BY id DESC LIMIT 1`,{ $oid: orderId })
  if (!rows.length) {
    const id = 'L'+Math.floor(Math.random()*1e6)
    const origins = ['上海','深圳','广州','宁波','青岛']
    const dests = ['纽约','伦敦','东京','悉尼','新加坡','洛杉矶','巴黎']
    const o = origins[Math.floor(Math.random()*origins.length)]
    const d = dests[Math.floor(Math.random()*dests.length)]
    const tr = 'TR'+Math.floor(Math.random()*1e10)
    await exec(`INSERT INTO logistics(id,tracking_no,origin,destination,status,estimated_time,actual_time,efficiency,order_id) VALUES($id,$tr,$o,$d,$st,$et,$at,$ef,$oid)`,{
      $id:id,$tr:tr,$o:o,$d:d,$st:'pickup',$et:72,$at:0,$ef:0,$oid:orderId
    })
  }
}

async function settlePayment(orderId: string) {
  const rows = await queryAll(`SELECT method, avg_time FROM payments ORDER BY amount DESC LIMIT 1`)
  const method = rows[0]?.method || '电汇'
  await exec(`UPDATE settlements SET status=$st, settlement_time=$tm, risk_level=$rl WHERE order_id=$oid`,{ $st:'completed', $tm:rows[0]?.avg_time || 2, $rl:'low', $oid:orderId })
  return method
}

async function progressCustoms(orderId: string) {
  const rows = await queryAll(`SELECT id, status, compliance, risk_score FROM customs_clearances WHERE order_id=$oid LIMIT 1`,{ $oid: orderId })
  if (!rows.length) return
  const cur = rows[0]
  if (cur.status==='declared') {
    await exec(`UPDATE customs_clearances SET status='inspecting', clearance_time=$t WHERE id=$id`,{ $t:1.2, $id:cur.id })
  } else if (cur.status==='inspecting') {
    const held = Math.random() < 0.12
    await exec(`UPDATE customs_clearances SET status=$st, clearance_time=$t, compliance=$cp, risk_score=$rs WHERE id=$id`,{ $st: held ? 'held' : 'cleared', $t: held ? 4.5 : 2.1, $cp: held ? 72 : 98, $rs: held ? 65 : 12, $id:cur.id })
  }
}

async function progressLogistics(orderId: string) {
  const rows = await queryAll(`SELECT id, status, estimated_time, actual_time FROM logistics WHERE order_id=$oid ORDER BY id DESC LIMIT 1`,{ $oid: orderId })
  if (!rows.length) return
  const cur = rows[0]
  const nextMap: Record<string,string> = { pickup:'transit', transit:'delivery', delivery:'completed', customs:'delivery', completed:'completed' }
  const next = nextMap[cur.status] || 'transit'
  const at = next==='completed' ? cur.estimated_time - 2 : 0
  const ef = cur.estimated_time ? Math.round(((at||0)/cur.estimated_time)*1000)/10 : 0
  await exec(`UPDATE logistics SET status=$st, actual_time=$at, efficiency=$ef WHERE id=$id`,{ $st: next, $at: at, $ef: ef, $id: cur.id })
}

export async function startCollaborationEngine() {
  if (running) return
  running = true
  const seed = await queryAll(`SELECT id FROM orders ORDER BY RANDOM() LIMIT 50`)
  for (const r of seed) queue.push({ type:'ORDER_CREATED', orderId: r.id })
  const tick = async () => {
    if (!queue.length) {
      const more = await queryAll(`SELECT id FROM orders ORDER BY RANDOM() LIMIT 20`)
      for (const r of more) queue.push({ type:'ORDER_CREATED', orderId: r.id })
    }
    const evt = queue.shift()
    if (!evt) return
    if (evt.type==='ORDER_CREATED') {
      await ensureSettlement(evt.orderId)
      await ensureCustoms(evt.orderId)
      queue.push({ type:'CUSTOMS_DECLARING', orderId: evt.orderId })
      queue.push({ type:'PAYMENT_SETTLED', orderId: evt.orderId })
    } else if (evt.type==='CUSTOMS_DECLARING') {
      await progressCustoms(evt.orderId)
      await ensureLogistics(evt.orderId)
      queue.push({ type:'LOGISTICS_BOOKING', orderId: evt.orderId })
    } else if (evt.type==='LOGISTICS_BOOKING') {
      await progressLogistics(evt.orderId)
      queue.push({ type:'WAREHOUSE_INBOUND', orderId: evt.orderId })
    } else if (evt.type==='PAYMENT_SETTLED') {
      await settlePayment(evt.orderId)
    } else if (evt.type==='WAREHOUSE_INBOUND') {
      await progressLogistics(evt.orderId)
    }
  }
  const loop = () => { tick().catch(()=>{}); setTimeout(loop, 600) }
  loop()
}

export function startConsistencyScheduler() {
  if (consistencyTimer) return
  const run = async () => {
    try {
      await consistencyCheck()
    } catch {
      // ignore
    }
  }
  consistencyTimer = setInterval(run, 500)
}
