import React, { useEffect, useState, useCallback } from 'react'
import { CreditCard, Truck } from 'lucide-react'
import { HudPanel, StatusBadge, GlowButton } from '../components/ui/HudPanel'
import { getPaymentMethods, completeSettlement, getAlgorithmRecommendations, getHsChapters, getIncotermsList, getTransportModes, getOrdersPaged, countOrders, countCustomsHeaders, getSettlementByOrder, getLatestLogisticsByOrder, getCustomsHeaderByOrder, getCustomsHeadersPaged } from '../lib/sqlite'

export const CollaborationWorkbench: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [copilotOpen, setCopilotOpen] = useState(true)
  const [tasks, setTasks] = useState<{ id:string; orderId:string; title:string; route:string; tags:string[]; payStatus?:string; customsStatus?:string; logisticsStatus?:string; hsChap?:string; hsHead?:string }[]>([])
  const [metrics, setMetrics] = useState<{ pending:number; customsAmount:number; blocked:number }>({ pending:1280, customsAmount: 236, blocked: 42 })
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<'all'|'beauty'|'electronics'|'wine'|'textile'|'appliance'>('all')
  const [onlyAbnormal, setOnlyAbnormal] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [methods, setMethods] = useState<{ name:string; successRate:number; avgTime:number }[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [reco, setReco] = useState<any | null>(null)
  const [hsChapter, setHsChapter] = useState<'all'|'unclassified'|string>('all')
  const [chapters, setChapters] = useState<{ chap:string; name:string }[]>([])
  const [incoterms, setIncoterms] = useState<'all'|'EXW'|'FOB'|'CIF'|'DDP'>('all')
  const [transport, setTransport] = useState<'all'|'FCL'|'LCL'|'AIR'|'RAIL'>('all')
  const [incotermsList, setIncotermsList] = useState<string[]>([])
  const [transportList, setTransportList] = useState<string[]>([])

  const load = useCallback(async () => {
    const offset = (page-1)*pageSize
    const orders = await getOrdersPaged(q, 'all', offset, pageSize, category)
    const enrich = await Promise.all(orders.map(async (o:any)=>{
      const [sett, cust, lg] = await Promise.all([
        getSettlementByOrder(o.id),
        getCustomsHeaderByOrder(o.id),
        getLatestLogisticsByOrder(o.id)
      ])
      const payStatus = sett?.status || undefined
      const customsStatus = cust?.status || undefined
      const logisticsStatus = lg?.status || undefined
      const route = lg ? `${lg.origin} -> ${lg.destination}` : ''
      const tags: string[] = []
      if (customsStatus==='declared') tags.push('已申报')
      if (customsStatus==='held') tags.push('异常阻断')
      if (payStatus==='processing') tags.push('支付处理中')
      if (payStatus==='pending') tags.push('待支付')
      if (!tags.length) tags.push('处理中')
      return { id: o.orderNumber, orderId: o.id, title: o.enterprise, route, tags, payStatus, customsStatus, logisticsStatus }
    }))
    setTasks(enrich)
    // 统计总数（考虑分类过滤）
    const totalCnt = await countOrders(q, 'all', category)
    setTotal(totalCnt)
    // KPI：待处理、报关金额（今日）、异常阻断
    const totalOrders = await countOrders('', 'all')
    const completedOrders = await countOrders('', 'completed')
    const blocked = await countCustomsHeaders('', 'held', 'all', 'all')
    const headersToday = await getCustomsHeadersPaged('', 'all', 'all', 'all', 0, 1000)
    const todayStr = new Date().toISOString().slice(0,10)
    const customsAmount = (headersToday||[]).filter((h:any)=> String(h.declareDate||'').startsWith(todayStr)).reduce((s:number,h:any)=> s + (h.totalValue||0), 0)
    setMetrics({ pending: totalOrders - completedOrders, customsAmount: Math.round((customsAmount/1000)*10)/10, blocked })
    const pm = await getPaymentMethods()
    setMethods(pm.map((x:any)=>({ name:x.name, successRate:x.successRate, avgTime:x.avgTime })))
    const chs = await getHsChapters()
    setChapters(chs)
    setIncotermsList(await getIncotermsList() as any)
    setTransportList(await getTransportModes() as any)
  }, [q, category, page, pageSize])

  useEffect(() => {
    const id = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(id)
  }, [load])
  useEffect(() => {
    const run = async () => {
      const orderId = tasks.find(t=>t.id===selectedTask)?.orderId
      if (!orderId) { setReco(null); return }
      const r = await getAlgorithmRecommendations(orderId)
      setReco(r)
      setSelectedMethod(r?.payment?.bestMethod || '')
    }
    const id = setTimeout(() => { void run() }, 0)
    return () => clearTimeout(id)
  }, [selectedTask, tasks])

  useEffect(() => {
    const id = setInterval(() => {
      setMetrics(prev => ({
        pending: Math.max(1, prev.pending + Math.floor(Math.random()*50) - 15),
        customsAmount: Math.max(1, prev.customsAmount + Math.floor(Math.random()*20) - 6),
        blocked: Math.max(1, prev.blocked + Math.floor(Math.random()*10) - 3)
      }))
    }, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-6">
      {/* 标题与业务KPI */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">供应链协同 - 智能订单管理</h1>
          <p className="text-gray-400">在一个页面清晰查看订单跨多方的流转</p>
        </div>
        <div className="flex space-x-4">
          <div className="hud-panel p-3">
            <div className="text-xs text-gray-400">待处理订单</div>
            <div className="digital-display text-cyber-cyan text-xl">{metrics.pending}</div>
          </div>
          <div className="hud-panel p-3">
            <div className="text-xs text-gray-400">今日报关金额</div>
            <div className="digital-display text-emerald-green text-xl">¥{metrics.customsAmount}k</div>
          </div>
          <div className="hud-panel p-3">
            <div className="text-xs text-gray-400">异常阻断</div>
            <div className="digital-display text-alert-red text-xl">{metrics.blocked}</div>
          </div>
        </div>
      </div>

      <div className="hud-panel p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input value={q} onChange={(e)=>{ setPage(1); setQ(e.target.value) }} placeholder="订单号/企业" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          <select value={category} onChange={(e)=>{ setPage(1); setCategory(e.target.value as any) }} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="all">全部品类</option>
            <option value="beauty">美妆</option>
            <option value="electronics">电子</option>
            <option value="wine">酒水</option>
            <option value="textile">纺织</option>
            <option value="appliance">家电</option>
          </select>
          <select value={hsChapter} onChange={(e)=>{ setPage(1); setHsChapter(e.target.value as any) }} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="all">海关章节: 全部</option>
            <option value="unclassified">海关章节: 未归类</option>
            {chapters.map(c=> (
              <option key={c.chap} value={c.chap}>海关章节: {c.chap} {c.name}</option>
            ))}
          </select>
          <select value={incoterms} onChange={(e)=>{ setPage(1); setIncoterms(e.target.value as any) }} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="all">贸易术语: 全部</option>
            {incotermsList.map(x=> (<option key={x} value={x}>贸易术语: {x}</option>))}
          </select>
          <select value={transport} onChange={(e)=>{ setPage(1); setTransport(e.target.value as any) }} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="all">运输方式: 全部</option>
            {transportList.map(x=> (<option key={x} value={x}>运输方式: {x}</option>))}
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={onlyAbnormal} onChange={(e)=>{ setPage(1); setOnlyAbnormal(e.target.checked) }} /> 仅显示异常
          </label>
          <div></div>
        </div>
      </div>

      {/* 分栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧队列 */}
        <div className="lg:col-span-1 space-y-3">
          {tasks.map(t => (
            <div
              key={t.id}
              className={`p-4 rounded-lg border border-slate-700 bg-slate-800/60 cursor-pointer hover:border-cyber-cyan transition ${selectedTask === t.id ? 'border-cyber-cyan' : ''}`}
              onClick={() => setSelectedTask(t.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-cyber-cyan font-semibold">{t.id}</div>
                <StatusBadge status="processing">待处理</StatusBadge>
              </div>
              <div className="text-white text-sm">{t.title}</div>
              <div className="text-xs text-gray-400 mt-1">{t.route}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {t.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-xs border border-slate-700 bg-slate-700/40">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 右侧流程画布 */}
        <div className="lg:col-span-3">
          <HudPanel className="p-6" title="协同流程进度" subtitle="订单 → 支付 → 通关 → 物流 → 入库">
            <div className="relative">
              {/* 连接线 */}
              <div className="absolute top-14 left-0 right-0 h-2 bg-gradient-to-r from-cyber-cyan/40 to-neon-blue/40 rounded-full"></div>
              <div className="grid grid-cols-5 gap-4">
                {/* 订单 */}
                <div className="flex flex-col items-center">
                  <div className="hud-panel w-full p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">订单</div>
                    <div className="text-white font-semibold">电子合同已签署</div>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-emerald-green/30 text-emerald-green">✅ CA认证</div>
                  </div>
                </div>
                {/* 支付 */}
                <div className="flex flex-col items-center">
                  <div className="hud-panel w-full p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">支付</div>
                    <div className="text-white font-semibold">{(tasks.find(t=>t.id===selectedTask)?.payStatus)==='completed'?'支付完成':(tasks.find(t=>t.id===selectedTask)?.payStatus)==='processing'?'跨境汇款中...':'待支付'}</div>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-cyber-cyan/30 text-cyber-cyan">
                      <CreditCard className="w-3 h-3 mr-1" /> 汇率锁定 7.12
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <select value={selectedMethod} onChange={(e)=>setSelectedMethod(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs">
                        <option value="">选择支付方式</option>
                        {methods.map(m=> (<option key={m.name} value={m.name}>{m.name} · 成功率{m.successRate}% · {m.avgTime}h</option>))}
                      </select>
                      <GlowButton size="sm" onClick={async ()=>{
                        const orderId = tasks.find(t=>t.id===selectedTask)?.orderId
                        if (!orderId || !selectedMethod) return
                        await completeSettlement(orderId, selectedMethod)
                        await load()
                      }}>完成结算</GlowButton>
                      {reco?.payment && (
                        <div className="text-xs text-gray-400 text-left">建议: {reco.payment.bestMethod} · {reco.payment.successRate}% · {reco.payment.etaHours}h</div>
                      )}
                    </div>
                  </div>
                </div>
                {/* 通关（高亮） */}
                <div className="flex flex-col items-center">
                  <div className="hud-panel w-full p-4 text-center border-cyber-cyan/40">
                    <div className="text-sm text-gray-400 mb-1">通关</div>
                    <div className="text-white font-semibold">
                      {((tasks.find(t=>t.id===selectedTask)?.customsStatus)==='cleared')?'通关完成':((tasks.find(t=>t.id===selectedTask)?.customsStatus)==='held')?'异常拦截':((tasks.find(t=>t.id===selectedTask)?.customsStatus)==='inspecting')?'扫描中...':((tasks.find(t=>t.id===selectedTask)?.customsStatus)==='declared')?'已申报':'待处理'}
                    </div>
                    <div className="mt-2 text-xs text-emerald-green">HS编码 匹配成功</div>
                    <div className="text-xs text-emerald-green">成分与备案校验通过</div>
                    {reco?.productionSales && (
                      <div className="mt-2 text-xs text-gray-400">产能建议 +{reco.productionSales.planIncrease}</div>
                    )}
                    <div className="mt-2 px-2 py-1 rounded bg-cyber-cyan/10 text-cyber-cyan text-xs inline-flex items-center">🤖 智能生成报关单</div>
                    {(() => {
                      const st = tasks.find(t=>t.id===selectedTask)?.customsStatus || ''
                      const prog = st==='cleared' ? 100 : st==='inspecting' ? 65 : st==='declared' ? 30 : st==='held' ? 20 : 0
                      const deg = Math.max(0, Math.min(360, Math.round(prog*3.6)))
                      return (
                        <div className="mt-3 relative w-24 h-24">
                          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#22d3ee ${deg}deg, rgba(255,255,255,0.08) 0deg)` }}></div>
                          <div className="absolute inset-2 rounded-full border border-cyber-cyan/30 bg-slate-900/60 flex items-center justify-center">
                            <span className="digital-display text-cyber-cyan text-sm">{prog}%</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
                {/* 物流 */}
                <div className="flex flex-col items-center">
                  <div className="hud-panel w-full p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">物流</div>
                    <div className="text-white font-semibold">{tasks.find(t=>t.id===selectedTask)?.route || '—'}</div>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-yellow-500/30 text-yellow-400">
                      <Truck className="w-3 h-3 mr-1" /> {(() => {
                        const m: Record<string,string> = { pickup:'提货', transit:'在途', delivery:'派送', completed:'完成', customs:'报关' }
                        const st = (tasks.find(t=>t.id===selectedTask)?.logisticsStatus) || 'pickup'
                        return m[st] || st
                      })()}
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      ETA/ETD 以订单为准
                    </div>
                    {reco?.processControl && (
                      <div className="mt-2 text-xs text-gray-400">下一步: {(() => {
                        const m: Record<string,string> = { pickup:'提货', transit:'在途', delivery:'派送', completed:'完成', customs:'报关' }
                        const next = reco.processControl.nextLogisticsStep || ''
                        return m[next] || next
                      })()}</div>
                    )}
                  </div>
                </div>
                {/* 入库（灰度） */}
                <div className={`flex flex-col items-center ${((tasks.find(t=>t.id===selectedTask)?.logisticsStatus)==='completed')?'opacity-100':'opacity-60'}`}>
                  <div className="hud-panel w-full p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">入库</div>
                    <div className="text-white font-semibold">{((tasks.find(t=>t.id===selectedTask)?.logisticsStatus)==='completed')?'已入库':'待入库'}</div>
                  </div>
                </div>
              </div>
            </div>
          </HudPanel>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>共 {total} 条</span>
          <span>|</span>
          <span>每页</span>
          <select value={pageSize} onChange={(e)=>{ setPage(1); setPageSize(parseInt(e.target.value)) }} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 rounded border border-slate-700 bg-slate-800/60 text-white disabled:opacity-50" disabled={page<=1}>上一页</button>
          <div className="px-3 py-1 rounded border border-slate-700 bg-slate-800/60 text-white">第 {page} 页</div>
          <button onClick={()=>setPage(p=> (p*pageSize < total) ? p+1 : p)} className="px-3 py-1 rounded border border-slate-700 bg-slate-800/60 text-white disabled:opacity-50" disabled={page*pageSize>=total}>下一页</button>
        </div>
      </div>

      {/* 右侧 AI 协同助手抽屉 */}
      <div className={`fixed right-0 top-16 bottom-10 w-80 bg-slate-900/80 backdrop-blur-md border-l border-slate-700 transform transition-transform duration-300 ${copilotOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
          <div className="text-cyber-cyan font-semibold">智能协同助手</div>
          <button onClick={() => setCopilotOpen(!copilotOpen)} className="glow-button px-2 py-1 text-xs">{copilotOpen ? '收起' : '展开'}</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-xs text-gray-400">当前订单</div>
          <div className="digital-display text-white">{selectedTask || '未选择'}</div>
          <div className="hud-panel p-3">
            <div className="text-sm text-emerald-green">{((tasks.find(t=>t.id===selectedTask)?.customsStatus)==='cleared')?'通关已完成，可安排配送': '申报材料校验通过，可继续提单'}</div>
            <div className="text-xs text-gray-400 mt-2">建议：{((tasks.find(t=>t.id===selectedTask)?.payStatus)==='pending')?'尽快完成支付以加速流程':'保持物流在途监控与异常预警'}</div>
          </div>
          {reco && (
            <div className="hud-panel p-3">
              <div className="text-xs text-gray-400 mb-2">算法建议</div>
              <div className="space-y-1 text-xs text-white">
                <div>支付: {reco.payment?.bestMethod} · {reco.payment?.successRate}%</div>
                <div>库存: {reco.inventory?.action==='reallocate' ? `调拨 ${reco.inventory?.quantity}` : '稳定'}</div>
                <div>产销: 增加产能 {reco.productionSales?.planIncrease}</div>
                <div>流程: 下一步 {reco.processControl?.nextLogisticsStep}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CollaborationWorkbench
