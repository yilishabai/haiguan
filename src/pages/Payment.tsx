import React, { useCallback, useEffect, useState } from 'react'
import { HudPanel, GlowButton, StatusBadge } from '../components/ui/HudPanel'
import { getSettlementsPaged, countSettlements, upsertSettlement, deleteSettlement, getLinkableOrders, enqueueJob, applyBusinessModel, queryAll } from '../lib/sqlite'
import { CreditCard, ShieldCheck, AlertTriangle } from 'lucide-react'

export const Payment: React.FC = () => {
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
  const [showModal, setShowModal] = useState(false)
  const [linkableOrders, setLinkableOrders] = useState<any[]>([])
  
  const [form, setForm] = useState<any>({
    id: '',
    orderId: '',
    status: 'pending',
    settlementTime: 0,
    riskLevel: 'low',
    paymentMethod: 'T/T'
  })

  const load = useCallback(async () => {
    const list = await getSettlementsPaged(q, status, (page-1)*pageSize, pageSize)
    const enriched = await Promise.all(list.map(async (r:any) => {
      const risk = await applyBusinessModel(r.orderId || r.orderID || r.order_id)
      const [c] = await queryAll(`SELECT COUNT(*) as c FROM customs_headers WHERE order_id=$id AND status='cleared'`, { $id: r.orderId })
      const cleared = Number(c?.c || 0) > 0
      const [l] = await queryAll(`SELECT status FROM logistics WHERE order_id=$id ORDER BY id DESC LIMIT 1`, { $id: r.orderId })
      const ship = String(l?.status || '')
      const advice = !cleared ? '建议先完成清关再结算' : (ship!=='completed' ? '建议待签收后结算，降低风险' : '可即时结算')
      return { ...r, riskScore: risk.compliance || 0, riskMsgs: risk.messages || [], advice }
    }))
    setRows(enriched)
    const cnt = await countSettlements(q, status)
    setTotal(cnt)
  }, [q, status, page, pageSize])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    const orders = await getLinkableOrders('settlement')
    setLinkableOrders(orders)
    setForm({
      id: 'S' + Date.now(),
      orderId: orders[0]?.id || '',
      status: 'pending',
      settlementTime: 0,
      riskLevel: 'low',
      paymentMethod: 'T/T'
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    await upsertSettlement(form)
    setShowModal(false)
    load()
  }

  const startProcessing = async (row: any) => {
    await upsertSettlement({ ...row, status: 'processing' })
    load()
  }

  const completeSettlement = async (row: any) => {
    const digits = Number(String(row.id || row.orderId || '').replace(/\D/g,'')) || 0
    const tm = (digits % 72) + 12
    const [c] = await queryAll(`SELECT COUNT(*) as c FROM customs_headers WHERE order_id=$id AND status='cleared'`, { $id: row.orderId })
    const cleared = Number(c?.c || 0) > 0
    const [l] = await queryAll(`SELECT status FROM logistics WHERE order_id=$id ORDER BY id DESC LIMIT 1`, { $id: row.orderId })
    const ship = String(l?.status || '')
    if (!cleared || ship!=='completed') {
      const go = confirm('订单未清关或未签收，建议暂缓结算。是否仍标记完成？')
      if (!go) return
    }
    await enqueueJob('settlement_complete', { order_id: row.orderId || row.orderID || row.order_id || '', time: tm })
    setTimeout(() => { load() }, 800)
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定删除该结算记录吗？')) {
      await deleteSettlement(id)
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <CreditCard className="text-cyber-cyan" /> 跨境支付结算
          </h1>
          <p className="text-gray-400">全球资金清算与外汇风险管理</p>
        </div>
        <GlowButton onClick={handleCreate}>+ 发起结算</GlowButton>
      </div>

      <HudPanel className="p-4">
        <div className="flex gap-4 mb-4">
          <input 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="搜索订单号..." 
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white flex-1"
          />
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)} 
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-40"
          >
            <option value="all">全部状态</option>
            <option value="pending">待结算</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
            <option value="failed">失败</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="bg-gray-800 text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-3">结算单号</th>
                <th className="px-4 py-3">关联订单</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">结算耗时</th>
                <th className="px-4 py-3">风控等级</th>
                <th className="px-4 py-3">策略提示</th>
                <th className="px-4 py-3">合规提示</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono text-cyber-cyan">{row.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-white">{row.orderNumber || row.orderId}</span>
                      {row.enterprise && <span className="text-xs text-gray-400">{row.enterprise}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-white">{row.settlementTime > 0 ? `${row.settlementTime}h` : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 ${
                      row.riskLevel === 'low' ? 'text-emerald-400' : 
                      row.riskLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {row.riskLevel === 'low' ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                      {row.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{row.advice || '-'}</td>
                  <td className="px-4 py-3 text-xs text-amber-300">{Array.isArray(row.riskMsgs) && row.riskMsgs.length>0 ? String(row.riskMsgs[0]) : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {row.status === 'pending' && (
                        <button onClick={() => startProcessing(row)} className="px-2 py-1 text-xs bg-gray-800 rounded hover:bg-gray-700">开始结算</button>
                      )}
                      {row.status === 'processing' && (
                        <button onClick={() => completeSettlement(row)} className="px-2 py-1 text-xs bg-emerald-600 rounded hover:bg-emerald-500">标记完成</button>
                      )}
                      <button onClick={() => handleDelete(row.id)} className="text-red-400 hover:text-red-300 text-xs underline">删除</button>
                    </div>
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
            <h2 className="text-xl font-bold text-white mb-4">新建结算申请</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">关联订单 (未结算)</label>
                <select 
                  value={form.orderId} 
                  onChange={(e) => setForm({...form, orderId: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="">选择订单...</option>
                  {linkableOrders.map(o => (
                    <option key={o.id} value={o.id}>{o.order_number} (ID: {o.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">初始状态</label>
                <select 
                  value={form.status} 
                  onChange={(e) => setForm({...form, status: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="pending">待结算</option>
                  <option value="processing">处理中</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">支付方式</label>
                <select 
                  value={form.paymentMethod} 
                  onChange={(e) => setForm({...form, paymentMethod: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="T/T">T/T</option>
                  <option value="L/C">L/C</option>
                  <option value="OA">O/A</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">风控预判</label>
                <select 
                  value={form.riskLevel} 
                  onChange={(e) => setForm({...form, riskLevel: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="low">低风险</option>
                  <option value="medium">中风险</option>
                  <option value="high">高风险</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
              <GlowButton onClick={handleSave}>提交结算</GlowButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payment
