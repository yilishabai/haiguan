import React, { useCallback, useEffect, useState } from 'react'
import { HudPanel, GlowButton, StatusBadge } from '../components/ui/HudPanel'
import { getOrdersPaged, countOrders, upsertOrder, deleteOrder, getEnterprisesPaged, queryAll, applyBusinessModel, analyzeOrderRisk } from '../lib/sqlite'
import { ShoppingCart, RefreshCw, Upload, Plus, Trash2, TrendingUp, AlertTriangle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuth } from '../hooks/useAuth'

export const OrderManagement: React.FC = () => {
  const { currentRole } = useAuth()
  const role = currentRole?.id
  const canEdit = role === 'trade'
  const isWarehouse = role === 'warehouse'
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [entOpts, setEntOpts] = useState<any[]>([])
  const [entOpen, setEntOpen] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [riskAnalysis, setRiskAnalysis] = useState<any | null>(null)

  const [form, setForm] = useState<any>({
    id: '',
    orderNumber: '',
    enterprise: '',
    category: 'beauty',
    status: 'created',
    amount: 0,
    currency: 'USD'
  })

  useEffect(() => {
    const run = async () => {
      if (!selected) { setRiskAnalysis(null); return }
      const risk = await analyzeOrderRisk(selected.id)
      setRiskAnalysis(risk)
    }
    run()
  }, [selected])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getOrdersPaged(q, status, (page-1)*pageSize, pageSize)
      const enriched = await Promise.all(list.map(async (r:any) => {
        const [ext] = await queryAll(`SELECT incoterms, trade_terms as tradeTerms, route FROM orders WHERE id=$id`, { $id: r.id })
        const risk = await applyBusinessModel(r.id)
        return { ...r, incoterms: ext?.incoterms || '', tradeTerms: ext?.tradeTerms || '', route: ext?.route || '', riskScore: risk.compliance || 0, riskMsgs: risk.messages || [] }
      }))
      setRows(enriched)
      const cnt = await countOrders(q, status)
      setTotal(cnt)
    } finally {
      setLoading(false)
    }
  }, [q, status, page, pageSize])

  useEffect(() => { load() }, [load])

  const handleCreate = () => {
    setForm({
      id: 'O' + Date.now(),
      orderNumber: 'ORD-' + Date.now(),
      enterprise: '',
      category: 'beauty',
      status: 'created',
      amount: 1000,
      currency: 'USD',
      incoterms: 'FOB',
      tradeTerms: 'T/T',
      route: 'CN→US',
      createdAt: new Date().toISOString()
    })
    setEntOpts([])
    setEntOpen(false)
    setShowModal(true)
  }

  const handleSave = async () => {
    await upsertOrder(form)
    setShowModal(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定删除该订单吗？')) {
      await deleteOrder(id)
      load()
    }
  }

  const handleImport = async () => {
    if (!file) return
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data: any[] = XLSX.utils.sheet_to_json(ws)
    
    let count = 0
    for (const row of data) {
      const id = 'O' + (Date.now() + count)
      await upsertOrder({
        id,
        orderNumber: row['订单号'] || ('ORD-' + id),
        enterprise: row['企业名称'] || 'Unknown',
        category: row['品类'] || 'general',
        status: 'created',
        amount: row['金额'] || 0,
        currency: row['币种'] || 'CNY',
        createdAt: new Date().toISOString()
      })
      count++
    }
    alert(`成功导入 ${count} 条订单`)
    setFile(null)
    load()
  }

  const handleSync = async () => {
    setLoading(true)
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 1500))
    // Add some random orders
    const count = Math.floor(Math.random() * 5) + 1
    const enterprises = ['上海美妆集团','深圳电子科技','广州食品进出口','宁波服装贸易']
    const categories = ['beauty','electronics','wine','textile']
    
    for (let i=0; i<count; i++) {
      const id = 'O' + (Date.now() + i)
      await upsertOrder({
        id,
        orderNumber: 'SYNC-' + id,
        enterprise: enterprises[Math.floor(Math.random()*enterprises.length)],
        category: categories[Math.floor(Math.random()*categories.length)],
        status: 'created',
        amount: Math.floor(Math.random()*10000),
        currency: 'USD',
        createdAt: new Date().toISOString()
      })
    }
    setLoading(false)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-cyber-cyan" /> 订单管理
          </h1>
          <p className="text-gray-400">跨境电商订单统一接入与分发中心</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <div className="relative">
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={(e)=>setFile(e.target.files?.[0]||null)} 
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <GlowButton variant="secondary">
                <Upload size={16} className="mr-2" />
                导入订单
              </GlowButton>
            </div>
          )}
          {canEdit && file && <span className="text-xs text-emerald-400">已选: {file.name}</span>}
          {canEdit && file && <GlowButton size="sm" onClick={handleImport}>确认导入</GlowButton>}
          {canEdit && (
            <GlowButton variant="secondary" onClick={handleSync} disabled={loading}>
              <RefreshCw size={16} className={`mr-2 ${loading?'animate-spin':''}`} />
              同步ERP
            </GlowButton>
          )}
          {canEdit && (
            <GlowButton onClick={handleCreate}>
              <Plus size={16} className="mr-2" />
              新建订单
            </GlowButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HudPanel className="p-4">
            <div className="flex gap-4 mb-4">
              <input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="搜索订单号/企业..." 
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white flex-1"
              />
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-40"
              >
                <option value="all">全部状态</option>
                <option value="created">已创建</option>
                <option value="pending">处理中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="bg-gray-800 text-gray-400 uppercase">
                  <tr>
                    <th className="px-4 py-3">订单号</th>
                    <th className="px-4 py-3">企业名称</th>
                    <th className="px-4 py-3">品类</th>
                    <th className="px-4 py-3">金额</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr 
                      key={row.id} 
                      className={`border-b border-gray-800 cursor-pointer ${selected?.id === row.id ? 'bg-slate-800' : 'hover:bg-gray-800/50'}`}
                      onClick={() => setSelected(row)}
                    >
                      <td className="px-4 py-3 font-mono text-cyber-cyan">{row.orderNumber}</td>
                      <td className="px-4 py-3 text-white">{row.enterprise}</td>
                      <td className="px-4 py-3">{row.category==='beauty'?'美妆':row.category==='electronics'?'电子':row.category==='wine'?'酒水':row.category==='textile'?'纺织':row.category==='appliance'?'家电':row.category}</td>
                      <td className="px-4 py-3 text-emerald-400">{isWarehouse ? '***' : `${row.currency}${['USD','CNY','EUR','GBP'].includes(row.currency)?`（${row.currency==='USD'?'美元':row.currency==='CNY'?'人民币':row.currency==='EUR'?'欧元':'英镑'}）`:''} ${row.amount?.toLocaleString()}`}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-4 py-3">
                        {canEdit && (
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }} className="text-red-400 hover:text-red-300 transition-colors p-1">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span>共 {total} 条记录</span>
                <span>|</span>
                <span>每页</span>
                <select value={pageSize} onChange={(e)=>{ setPage(1); setPageSize(parseInt(e.target.value)) }} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex gap-2">
                 <button 
                   disabled={page<=1}
                   onClick={()=>setPage(p=>p-1)}
                   className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50"
                 >
                   上一页
                 </button>
                 <span className="px-2 py-1">第 {page} 页</span>
                 <button 
                   disabled={page*pageSize >= total}
                   onClick={()=>setPage(p=>p+1)}
                   className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50"
                 >
                   下一页
                 </button>
              </div>
            </div>
          </HudPanel>
        </div>
        <div className="lg:col-span-1 space-y-4">
          <HudPanel title="订单详情" subtitle={selected ? selected.orderNumber : '请选择订单'}>
            {selected ? (
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-2 text-sm">
                   <div className="text-gray-400">Incoterms</div>
                   <div className="text-white text-right">{selected.incoterms || '-'}</div>
                   <div className="text-gray-400">贸易条款</div>
                   <div className="text-white text-right">{selected.tradeTerms || '-'}</div>
                   <div className="text-gray-400">路线</div>
                   <div className="text-white text-right">{selected.route || '-'}</div>
                   <div className="text-gray-400">创建时间</div>
                   <div className="text-white text-right">{selected.createdAt?.slice(0,10)}</div>
                 </div>
                 {riskAnalysis && (
                   <div className="pt-4 border-t border-gray-700">
                     <div className="flex items-center justify-between mb-2">
                       <h3 className="text-white font-bold flex items-center gap-2"><TrendingUp size={16} className="text-cyber-cyan"/> 智能风控</h3>
                       <span className={`text-xs px-2 py-0.5 rounded ${riskAnalysis.probability==='high'?'bg-red-900/50 text-red-400':'bg-emerald-900/50 text-emerald-400'}`}>
                         {riskAnalysis.probability==='high'?'高风险':'低风险'}
                       </span>
                     </div>
                     <div className="space-y-2 text-xs">
                       <div className="flex justify-between">
                         <span className="text-gray-400">风险评分</span>
                         <span className="text-white">{riskAnalysis.riskScore} / 100</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-400">预估利润</span>
                         <span className="text-emerald-400">+{Math.round(riskAnalysis.margin).toLocaleString()} {selected.currency}</span>
                       </div>
                       {riskAnalysis.riskScore > 50 && (
                         <div className="bg-red-900/20 border border-red-900/50 p-2 rounded flex gap-2 items-start text-red-300">
                           <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                           <span>大额订单建议加强信保审核或要求预付比例。</span>
                         </div>
                       )}
                     </div>
                   </div>
                 )}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">点击左侧订单查看详情与风控分析</div>
            )}
          </HudPanel>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-[500px] shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">新建订单</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">订单号</label>
                <input 
                  value={form.orderNumber} 
                  onChange={(e) => setForm({...form, orderNumber: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">企业名称</label>
                <div className="relative">
                  <input 
                    value={form.enterprise} 
                    onChange={async (e) => {
                      const v = e.target.value
                      setForm({...form, enterprise: v})
                      if (v.trim().length > 0) {
                        const opts = await getEnterprisesPaged(v, 'all', 'all', 'all', 'all', 0, 10)
                        setEntOpts(opts)
                        setEntOpen(opts.length > 0)
                      } else {
                        setEntOpts([])
                        setEntOpen(false)
                      }
                    }}
                    onFocus={async () => {
                      const v = form.enterprise || ''
                      if (v.trim().length > 0) {
                        const opts = await getEnterprisesPaged(v, 'all', 'all', 'all', 'all', 0, 10)
                        setEntOpts(opts)
                        setEntOpen(opts.length > 0)
                      } else {
                        const opts = await getEnterprisesPaged('', 'all', 'active', 'all', 'all', 0, 10)
                        setEntOpts(opts)
                        setEntOpen(opts.length > 0)
                      }
                    }}
                    onBlur={() => setTimeout(() => setEntOpen(false), 150)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                    placeholder="输入以搜索参与企业"
                  />
                  {entOpen && (
                    <div className="absolute z-10 mt-1 w-full max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded shadow">
                      {entOpts.map((e:any) => (
                        <div 
                          key={e.id} 
                          onMouseDown={() => {
                            setForm({...form, enterprise: e.name})
                            setEntOpen(false)
                          }}
                          className="px-3 py-2 text-sm text-white hover:bg-gray-700 cursor-pointer"
                        >
                          {e.name}
                          <span className="ml-2 text-xs text-gray-400">{e.region}</span>
                        </div>
                      ))}
                      {entOpts.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">无匹配企业</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">品类</label>
                  <select 
                    value={form.category} 
                    onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="beauty">美妆</option>
                    <option value="electronics">电子</option>
                    <option value="wine">酒水</option>
                    <option value="textile">纺织</option>
                    <option value="appliance">家电</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">状态</label>
                  <select 
                    value={form.status} 
                    onChange={(e) => setForm({...form, status: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="created">已创建</option>
                    <option value="pending">处理中</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">金额</label>
                  <input 
                    type="number"
                    value={form.amount} 
                    onChange={(e) => setForm({...form, amount: Number(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">币种</label>
                  <select 
                    value={form.currency} 
                    onChange={(e) => setForm({...form, currency: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="USD">USD（美元）</option>
                    <option value="CNY">CNY（人民币）</option>
                    <option value="EUR">EUR（欧元）</option>
                    <option value="GBP">GBP（英镑）</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Incoterms（国际贸易术语解释通则）</label>
                  <select 
                    value={form.incoterms}
                    onChange={(e)=>setForm({...form, incoterms: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="EXW">EXW（工厂交货）</option>
                    <option value="FOB">FOB（装运港船上交货）</option>
                    <option value="CIF">CIF（到岸价，含保险与运费）</option>
                    <option value="DDP">DDP（完税后交货）</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">贸易条款（Payment Terms）</label>
                  <select 
                    value={form.tradeTerms}
                    onChange={(e)=>setForm({...form, tradeTerms: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="T/T">T/T（电汇）</option>
                    <option value="L/C">L/C（信用证）</option>
                    <option value="OA">O/A（赊销）</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">路线</label>
                  <input 
                    value={form.route}
                    onChange={(e)=>setForm({...form, route: e.target.value})}
                    placeholder="如 CN→US"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
              <GlowButton onClick={handleSave}>保存订单</GlowButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderManagement
