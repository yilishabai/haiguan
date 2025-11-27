import React, { useEffect, useState } from 'react'
import { CreditCard, Truck } from 'lucide-react'
import { HudPanel, StatusBadge } from '../components/ui/HudPanel'
import { queryAll } from '../lib/sqlite'

export const CollaborationWorkbench: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [copilotOpen, setCopilotOpen] = useState(true)
  const [tasks, setTasks] = useState<{ id:string; orderId:string; title:string; route:string; tags:string[]; payStatus?:string; customsStatus?:string; logisticsStatus?:string }[]>([])
  const [metrics, setMetrics] = useState<{ pending:number; customsAmount:number; blocked:number }>({ pending:0, customsAmount:0, blocked:0 })
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<'all'|'beauty'|'electronics'|'wine'|'textile'|'appliance'>('all')
  const [onlyAbnormal, setOnlyAbnormal] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)

  const load = async () => {
    const where: string[] = []
    const params: any = { $limit: pageSize, $offset: (page-1)*pageSize }
    if (q) { where.push(`(o.order_number LIKE $q OR o.enterprise LIKE $q)`); params.$q = `%${q}%` }
    if (category !== 'all') { where.push(`o.category = $cat`); params.$cat = category }
    if (onlyAbnormal) { where.push(`EXISTS(SELECT 1 FROM customs_clearances c WHERE c.order_id=o.id AND c.status='held')`) }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const rows = await queryAll(`
      SELECT o.id as id, o.order_number as orderNo, o.enterprise as ent, o.category as cat,
             (SELECT status FROM settlements s WHERE s.order_id=o.id LIMIT 1) as payStatus,
             (SELECT status FROM customs_clearances c WHERE c.order_id=o.id LIMIT 1) as customsStatus,
             (SELECT origin||' -> '||destination FROM logistics l WHERE l.order_id=o.id ORDER BY l.id DESC LIMIT 1) as route,
             (SELECT status FROM logistics l WHERE l.order_id=o.id ORDER BY l.id DESC LIMIT 1) as logisticsStatus
      FROM orders o
      ${whereSql}
      ORDER BY o.created_at DESC LIMIT $limit OFFSET $offset
    `, params)
    const t = rows.map(r => {
      const tags = [] as string[]
      if (r.customsStatus==='declared') tags.push('待报关')
      if (r.customsStatus==='held') tags.push('异常阻断')
      if (r.payStatus==='processing') tags.push('支付处理中')
      if (r.payStatus==='pending') tags.push('待支付')
      if (!tags.length) tags.push('处理中')
      const catTag = r.cat==='beauty'?'美妆':r.cat==='wine'?'酒水':r.cat==='appliance'?'家电':r.cat==='electronics'?'电子':'纺织'
      tags.push(catTag)
      return { id: r.orderNo, orderId: r.id, title: r.ent, route: r.route || '🇫🇷 -> 🇨🇳', tags, payStatus: r.payStatus, customsStatus: r.customsStatus, logisticsStatus: r.logisticsStatus }
    })
    setTasks(t)
    const countRow = await queryAll(`SELECT COUNT(*) as c FROM orders o ${whereSql}`, params)
    setTotal(countRow[0]?.c || 0)
    const mrows = await queryAll(`
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE status!='completed') as pending,
        (SELECT IFNULL(SUM(o.amount),0) FROM orders o WHERE date(o.created_at)=date('now') AND EXISTS(SELECT 1 FROM customs_clearances c WHERE c.order_id=o.id)) as customsAmount,
        (SELECT COUNT(*) FROM customs_clearances WHERE status='held') as blocked
    `)
    setMetrics({ pending: mrows[0]?.pending || 0, customsAmount: Math.round((mrows[0]?.customsAmount || 0)/1000)/1000, blocked: mrows[0]?.blocked || 0 })
  }

  useEffect(() => {
    const id = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(id)
  }, [])
  useEffect(() => {
    const id = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(id)
  }, [q, category, onlyAbnormal, page, pageSize])

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
            <div className="digital-display text-emerald-green text-xl">${metrics.customsAmount}k</div>
          </div>
          <div className="hud-panel p-3">
            <div className="text-xs text-gray-400">异常阻断</div>
            <div className="digital-display text-alert-red text-xl">{metrics.blocked}</div>
          </div>
        </div>
      </div>

      <div className="hud-panel p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={q} onChange={(e)=>{ setPage(1); setQ(e.target.value) }} placeholder="订单号/企业" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          <select value={category} onChange={(e)=>{ setPage(1); setCategory(e.target.value as any) }} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="all">全部品类</option>
            <option value="beauty">美妆</option>
            <option value="electronics">电子</option>
            <option value="wine">酒水</option>
            <option value="textile">纺织</option>
            <option value="appliance">家电</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={onlyAbnormal} onChange={(e)=>{ setPage(1); setOnlyAbnormal(e.target.checked) }} /> 仅显示异常
          </label>
          <div className="flex items-center justify-end gap-2">
            <select value={pageSize} onChange={(e)=>{ setPage(1); setPageSize(parseInt(e.target.value)) }} className="bg-gray-800 border border-gray-700 rounded px-2 py-2 text-white w-24">
              <option value={10}>10/页</option>
              <option value={20}>20/页</option>
              <option value={50}>50/页</option>
            </select>
          </div>
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
                    <div className="mt-2 px-2 py-1 rounded bg-cyber-cyan/10 text-cyber-cyan text-xs inline-flex items-center">🤖 智能生成报关单</div>
                    <div className="mt-3 w-24 h-24 border border-cyber-cyan/30 rounded-full animate-pulse"></div>
                  </div>
                </div>
                {/* 物流 */}
                <div className="flex flex-col items-center">
                  <div className="hud-panel w-full p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">物流</div>
                    <div className="text-white font-semibold">{tasks.find(t=>t.id===selectedTask)?.route || '—'}</div>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-yellow-500/30 text-yellow-400">
                      <Truck className="w-3 h-3 mr-1" /> {(tasks.find(t=>t.id===selectedTask)?.logisticsStatus)||'pickup'}
                    </div>
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
        <div className="text-sm text-gray-400">共 {total} 条</div>
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
        </div>
      </div>
    </div>
  )
}

export default CollaborationWorkbench
