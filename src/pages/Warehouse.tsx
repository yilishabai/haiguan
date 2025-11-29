import React, { useCallback, useEffect, useState } from 'react'
import { HudPanel, GlowButton } from '../components/ui/HudPanel'
import { getInventoryPaged, countInventory, upsertInventory, deleteInventory } from '../lib/sqlite'
import { Factory, Package, ArrowDownCircle, TrendingUp } from 'lucide-react'

export const Warehouse: React.FC = () => {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  
  const [form, setForm] = useState<any>({
    name: '',
    current: 0,
    target: 1000,
    production: 0,
    sales: 0,
    efficiency: 90
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getInventoryPaged(q, (page-1)*pageSize, pageSize)
      setRows(list)
      const cnt = await countInventory(q)
      setTotal(cnt)
    } finally {
      setLoading(false)
    }
  }, [q, page, pageSize])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const df = 5
    if (df !== pageSize) setPageSize(df)
  }, [])

  const handleCreate = () => {
    setForm({
      name: '',
      current: 0,
      target: 1000,
      production: 0,
      sales: 0,
      efficiency: 90
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    await upsertInventory(form)
    setShowModal(false)
    load()
  }

  const handleDelete = async (name: string) => {
    if (confirm(`确定删除 ${name} 的库存记录吗？`)) {
      await deleteInventory(name)
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Factory className="text-cyber-cyan" /> 智能仓储与生产
          </h1>
          <p className="text-gray-400">库存动态平衡与柔性生产调度</p>
        </div>
        <GlowButton onClick={handleCreate}>+ 新增品类</GlowButton>
      </div>

      <HudPanel className="p-4">
        <div className="flex gap-4 mb-4">
          <input 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="搜索品类名称..." 
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white flex-1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((row) => {
            const stockLevel = (row.current / (row.target || 1)) * 100
            const isLow = stockLevel < 30
            
            return (
              <div key={row.name} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-cyber-cyan transition-colors group relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="text-cyber-cyan" size={20} />
                    <h3 className="text-lg font-bold text-white">{row.name}</h3>
                  </div>
                  <button 
                    onClick={() => handleDelete(row.name)}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    删除
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>当前库存: {row.current}</span>
                      <span>目标: {row.target}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(100, stockLevel)}%` }} 
                      />
                    </div>
                    {isLow && <span className="text-xs text-red-400 mt-1 flex items-center gap-1"><ArrowDownCircle size={12} /> 库存预警</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-700/30 p-2 rounded">
                      <span className="text-gray-400 block text-xs">在产</span>
                      <span className="text-white font-mono">{row.production}</span>
                    </div>
                    <div className="bg-gray-700/30 p-2 rounded">
                      <span className="text-gray-400 block text-xs">销量</span>
                      <span className="text-white font-mono">{row.sales}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-gray-700 pt-2 mt-2">
                    <span className="text-gray-400">周转效率</span>
                    <span className="text-cyber-cyan flex items-center gap-1">
                      <TrendingUp size={12} /> {row.efficiency}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
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
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-[400px] shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">新增库存品类</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">品类名称</label>
                <input 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">当前库存</label>
                  <input 
                    type="number"
                    value={form.current} 
                    onChange={(e) => setForm({...form, current: parseInt(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">目标库存</label>
                  <input 
                    type="number"
                    value={form.target} 
                    onChange={(e) => setForm({...form, target: parseInt(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">在产数量</label>
                  <input 
                    type="number"
                    value={form.production} 
                    onChange={(e) => setForm({...form, production: parseInt(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">已售数量</label>
                  <input 
                    type="number"
                    value={form.sales} 
                    onChange={(e) => setForm({...form, sales: parseInt(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
              <GlowButton onClick={handleSave}>保存</GlowButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Warehouse
