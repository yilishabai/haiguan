import React, { useCallback, useEffect, useState, useContext } from 'react'
import { HudPanel, GlowButton, StatusBadge } from '../components/ui/HudPanel'
import { getLogisticsPaged, countLogistics, upsertLogistics, deleteLogistics, getLinkableOrders, enqueueJob, queryAll, optimizeRoute } from '../lib/sqlite'
import { Truck, MapPin, Navigation, Leaf, Timer } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export const Logistics: React.FC = () => {
  const { currentRole } = useAuth()
  const role = currentRole?.id
  const canEdit = role === 'logistics'
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<any[]>([])
  const [, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [linkableOrders, setLinkableOrders] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [routeOpt, setRouteOpt] = useState<any | null>(null)
  
  const [form, setForm] = useState<any>({
    id: '',
    trackingNo: '',
    origin: '中国',
    destination: '美国',
    status: 'pickup',
    estimatedTime: 72,
    orderId: ''
  })

  useEffect(() => {
    const run = async () => {
      if (!selected) { setRouteOpt(null); return }
      const opt = await optimizeRoute(selected.origin, selected.destination)
      setRouteOpt(opt)
    }
    run()
  }, [selected])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getLogisticsPaged(q, status, (page-1)*pageSize, pageSize)
      const enriched = await Promise.all(list.map(async (r:any) => {
        const [ext] = await queryAll(`SELECT mode, is_fcl as isFcl, carrier, eta FROM logistics WHERE id=$id`, { $id: r.id })
        return { ...r, mode: ext?.mode || '', isFcl: !!ext?.isFcl, carrier: ext?.carrier || '', eta: ext?.eta || '' }
      }))
      setRows(enriched)
      const cnt = await countLogistics(q, status)
      setTotal(cnt)
    } finally {
      setLoading(false)
    }
  }, [q, status, page, pageSize])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    const orders = await getLinkableOrders('logistics')
    setLinkableOrders(orders)
    setForm({
      id: 'L' + Date.now(),
      trackingNo: 'TRK' + Date.now(),
      origin: '上海，中国',
      destination: '洛杉矶，美国',
      status: 'pickup',
      estimatedTime: 120,
      orderId: orders[0]?.id || ''
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    const [c] = await queryAll(`SELECT COUNT(*) as c FROM customs_headers WHERE order_id=$id AND status IN ('cleared','released')`, { $id: form.orderId })
    const cleared = Number(c?.c || 0) > 0
    if (!cleared) { alert('该订单尚未清关，暂不允许发运'); return }
    await upsertLogistics(form)
    setShowModal(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定删除该运单吗？')) {
      await deleteLogistics(id)
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Truck className="text-cyber-cyan" /> 智能物流管理
          </h1>
          <p className="text-gray-400">跨境物流全链路追踪与调度</p>
        </div>
        {canEdit && (<GlowButton onClick={handleCreate}>+ 新建运单</GlowButton>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HudPanel className="p-4">
            <div className="flex gap-4 mb-4">
              <input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="搜索运单号/始发地/目的地/订单号..." 
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white flex-1"
              />
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-40"
              >
                <option value="all">全部状态</option>
                <option value="pickup">已揽收</option>
                <option value="transit">运输中</option>
                <option value="customs">清关中</option>
                <option value="delivery">派送中</option>
                <option value="completed">已签收</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="bg-gray-800 text-gray-400 uppercase">
                  <tr>
                    <th className="px-4 py-3">运单号</th>
                    <th className="px-4 py-3">关联订单</th>
                    <th className="px-4 py-3">路线</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">预计/实际时效</th>
                    <th className="px-4 py-3">效率评分</th>
                    <th className="px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr 
                      key={row.id} 
                      className={`border-b border-gray-800 cursor-pointer ${selected?.id===row.id ? 'bg-slate-800' : 'hover:bg-gray-800/50'}`}
                      onClick={() => setSelected(row)}
                    >
                      <td className="px-4 py-3 font-mono text-cyber-cyan">{row.trackingNo}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-white">{row.orderNumber || row.orderId || '-'}</span>
                          {row.enterprise && <span className="text-xs text-gray-400">{row.enterprise}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} /> {row.origin} 
                          <span className="text-gray-500">→</span> 
                          <MapPin size={14} /> {row.destination}
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col text-xs">
                          <span>预计: {row.estimatedTime}h</span>
                          {row.actualTime > 0 && <span className="text-emerald-400">实际: {row.actualTime}h</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-emerald-400">{row.efficiency}%</td>
                      <td className="px-4 py-3">
                        {canEdit && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }} className="text-red-400 hover:text-red-300 text-xs underline">删除</button>
                            <button onClick={async(e)=>{ e.stopPropagation(); const next = row.status==='pickup' ? 'transit' : 'completed'; await enqueueJob('logistics_milestone', { id: row.id, next_status: next }); setTimeout(()=>{ load() }, 800) }} className="ml-2 px-2 py-1 text-xs bg-gray-800 rounded hover:bg-gray-700">推进</button>
                          </>
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
          <HudPanel title="智能调度" subtitle={selected ? selected.trackingNo : '请选择运单'}>
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                   <span className="text-gray-400">当前位置</span>
                   <span className="text-white flex items-center gap-1"><Navigation size={14} className="text-cyber-cyan"/> {selected.status==='pickup' ? selected.origin : selected.status==='completed' ? selected.destination : '在途 - 太平洋公海'}</span>
                </div>
                {routeOpt && (
                  <div className="pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                       <h3 className="text-white font-bold text-sm">多式联运方案推荐</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-2 rounded border ${routeOpt.recommendation==='sea' ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-gray-800 border-gray-700'}`}>
                         <div className="text-xs text-gray-400 mb-1 flex justify-between">
                           <span>海运 (Sea)</span>
                           {routeOpt.recommendation==='sea' && <span className="text-emerald-400">推荐</span>}
                         </div>
                         <div className="text-white text-sm font-mono mb-1">{routeOpt.sea.timeDays} 天</div>
                         <div className="text-xs text-gray-500 flex items-center gap-1"><Leaf size={10}/> {routeOpt.sea.co2}kg CO2</div>
                         <div className="text-xs text-gray-300 mt-1">$ {routeOpt.sea.cost}</div>
                      </div>
                      <div className={`p-2 rounded border ${routeOpt.recommendation==='air' ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-gray-800 border-gray-700'}`}>
                         <div className="text-xs text-gray-400 mb-1 flex justify-between">
                           <span>空运 (Air)</span>
                           {routeOpt.recommendation==='air' && <span className="text-emerald-400">推荐</span>}
                         </div>
                         <div className="text-white text-sm font-mono mb-1">{routeOpt.air.timeHours} 小时</div>
                         <div className="text-xs text-gray-500 flex items-center gap-1"><Leaf size={10}/> {routeOpt.air.co2}kg CO2</div>
                         <div className="text-xs text-gray-300 mt-1">$ {routeOpt.air.cost}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-400 flex items-start gap-2 bg-slate-800/50 p-2 rounded">
                      <Timer size={14} className="mt-0.5 shrink-0 text-cyber-cyan" />
                      <span>{routeOpt.recommendation==='sea' ? '当前货物非急件，海运方案碳排放更低且成本节省 80%。' : '时效优先，建议空运直达。'}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">点击左侧运单查看智能调度方案</div>
            )}
          </HudPanel>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-[500px] shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">新建物流运单</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">关联订单 (需已通关)</label>
                <select 
                  value={form.orderId} 
                  onChange={(e) => setForm({...form, orderId: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="">选择订单...</option>
                  {linkableOrders.map(o => (
                    <option key={o.id} value={o.id}>{o.order_number}（ID：{o.id}）</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">运单号</label>
                <input 
                  value={form.trackingNo} 
                  onChange={(e) => setForm({...form, trackingNo: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">始发地</label>
                  <input 
                    value={form.origin} 
                    onChange={(e) => setForm({...form, origin: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">目的地</label>
                  <input 
                    value={form.destination} 
                    onChange={(e) => setForm({...form, destination: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">状态</label>
                <select 
                  value={form.status} 
                  onChange={(e) => setForm({...form, status: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="pickup">已揽收</option>
                  <option value="transit">运输中</option>
                  <option value="customs">清关中</option>
                  <option value="delivery">派送中</option>
                  <option value="completed">已签收</option>
                </select>
              </div>
              <div className="text-xs text-gray-500">FCL（整箱）/ LCL（拼箱），用于描述集装箱使用方式</div>
              <div className="text-xs text-gray-500">ETA（预计到达时间），用于计划到港日期</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">运输方式</label>
                  <select 
                    value={form.mode || ''}
                    onChange={(e)=>setForm({...form, mode: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="SEA">海运</option>
                    <option value="AIR">空运</option>
                    <option value="RAIL">铁路</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">箱型</label>
                  <select 
                    value={form.isFcl ? 'FCL' : 'LCL'}
                    onChange={(e)=>setForm({...form, isFcl: e.target.value==='FCL'})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="FCL">FCL（整箱）</option>
                    <option value="LCL">LCL（拼箱）</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">承运商</label>
                  <input 
                    value={form.carrier || ''}
                    onChange={(e)=>setForm({...form, carrier: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">预计到港</label>
                  <input 
                    type="date"
                    value={form.eta || ''}
                    onChange={(e)=>setForm({...form, eta: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
              {canEdit && (<GlowButton onClick={handleSave}>保存运单</GlowButton>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Logistics
