import React, { useCallback, useEffect, useState } from 'react'
import { HudPanel, GlowButton, StatusBadge } from '../components/ui/HudPanel'
import { getOrdersPaged, countOrders, upsertOrder, deleteOrder, getEnterprisesPaged, queryAll, applyBusinessModel } from '../lib/sqlite'
import { ShoppingCart, RefreshCw, Upload, Plus, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx'

export const OrderManagement: React.FC = () => {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(() => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900
    const reserved = 360
    const rowH = 64
    const df = Math.max(5, Math.min(50, Math.floor((vh - reserved) / rowH)))
    return df
  })
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [entOpts, setEntOpts] = useState<any[]>([])
  const [entOpen, setEntOpen] = useState(false)
  
  const [form, setForm] = useState<any>({
    id: '',
    orderNumber: '',
    enterprise: '',
    category: 'beauty',
    status: 'created',
    amount: 0,
    currency: 'USD'
  })

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
          {file && <span className="text-xs text-emerald-400">已选: {file.name}</span>}
          {file && <GlowButton size="sm" onClick={handleImport}>确认导入</GlowButton>}
          
          <GlowButton variant="secondary" onClick={handleSync} disabled={loading}>
            <RefreshCw size={16} className={`mr-2 ${loading?'animate-spin':''}`} />
            同步ERP
          </GlowButton>
          
          <GlowButton onClick={handleCreate}>
            <Plus size={16} className="mr-2" />
            新建订单
          </GlowButton>
        </div>
      </div>

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
                <th className="px-4 py-3">术语/路线</th>
                <th className="px-4 py-3">风险</th>
                <th className="px-4 py-3">创建时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono text-cyber-cyan">{row.orderNumber}</td>
                  <td className="px-4 py-3 text-white">{row.enterprise}</td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className="px-4 py-3 text-emerald-400">{row.currency} {row.amount?.toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{row.incoterms || '-'} / {row.tradeTerms || '-'} / {row.route || '-'}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="text-cyber-cyan">{Math.round((row.riskScore||0))}</span>
                    {Array.isArray(row.riskMsgs) && row.riskMsgs.length>0 && (
                      <span className="ml-2 text-amber-300">{String(row.riskMsgs[0])}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{row.createdAt?.slice(0,19).replace('T',' ')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(row.id)} className="text-red-400 hover:text-red-300 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
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
                      setEntQ(v)
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
                    <option value="USD">USD</option>
                    <option value="CNY">CNY</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Incoterms</label>
                  <select 
                    value={form.incoterms}
                    onChange={(e)=>setForm({...form, incoterms: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="EXW">EXW</option>
                    <option value="FOB">FOB</option>
                    <option value="CIF">CIF</option>
                    <option value="DDP">DDP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">贸易条款</label>
                  <select 
                    value={form.tradeTerms}
                    onChange={(e)=>setForm({...form, tradeTerms: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="T/T">T/T</option>
                    <option value="L/C">L/C</option>
                    <option value="OA">O/A</option>
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
