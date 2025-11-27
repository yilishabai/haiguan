import React, { useEffect, useMemo, useState } from 'react'
import { HudPanel, GlowButton, StatusBadge } from '../components/ui/HudPanel'
import { getEnterprisesPaged, countEnterprises } from '../lib/sqlite'

export const Enterprises: React.FC = () => {
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [region, setRegion] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetch = async () => {
    setLoading(true)
    const offset = (page-1) * pageSize
    const data = await getEnterprisesPaged(q, type, status, category, region, offset, pageSize)
    const cnt = await countEnterprises(q, type, status, category, region)
    setRows(data)
    setTotal(cnt)
    setLoading(false)
  }

  useEffect(()=>{ fetch() }, [q, type, status, category, region, page, pageSize])

  const totalPages = useMemo(()=> Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">参与企业</h1>
        <div className="text-gray-400">共 {total.toLocaleString()} 家企业</div>
      </div>

      <HudPanel title="查询条件">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
          <input value={q} onChange={(e)=>{ setPage(1); setQ(e.target.value) }} placeholder="企业名称/备案号/地区" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          <select value={type} onChange={(e)=>{ setPage(1); setType(e.target.value) }} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="all">类型(全部)</option>
            <option value="importer">进口</option>
            <option value="exporter">出口</option>
            <option value="both">进出口</option>
          </select>
          <select value={status} onChange={(e)=>{ setPage(1); setStatus(e.target.value) }} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text白">
            <option value="all">状态(全部)</option>
            <option value="active">活跃</option>
            <option value="inactive">不活跃</option>
            <option value="blocked">阻断</option>
          </select>
          <select value={category} onChange={(e)=>{ setPage(1); setCategory(e.target.value) }} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text白">
            <option value="all">品类(全部)</option>
            <option value="beauty">美妆</option>
            <option value="wine">酒水</option>
            <option value="appliance">家电</option>
            <option value="electronics">电子</option>
            <option value="textile">纺织</option>
          </select>
          <select value={region} onChange={(e)=>{ setPage(1); setRegion(e.target.value) }} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text白">
            <option value="all">地区(全部)</option>
            <option value="北京">北京</option>
            <option value="上海">上海</option>
            <option value="广州">广州</option>
            <option value="深圳">深圳</option>
            <option value="杭州">杭州</option>
            <option value="宁波">宁波</option>
            <option value="青岛">青岛</option>
            <option value="天津">天津</option>
            <option value="重庆">重庆</option>
            <option value="成都">成都</option>
            <option value="苏州">苏州</option>
            <option value="厦门">厦门</option>
          </select>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">每页</span>
            <select value={pageSize} onChange={(e)=>{ setPage(1); setPageSize(parseInt(e.target.value)) }} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text白">
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </HudPanel>

      <HudPanel title="企业列表" subtitle="海关备案企业数据">
        <div className="overflow-auto custom-scrollbar">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left p-2">备案号</th>
                <th className="text-left p-2">企业名称</th>
                <th className="text-left p-2">类型</th>
                <th className="text-left p-2">品类</th>
                <th className="text-left p-2">地区</th>
                <th className="text-left p-2">状态</th>
                <th className="text-right p-2">合规</th>
                <th className="text-right p-2">活跃订单</th>
                <th className="text-left p-2">最近活跃</th>
                <th className="text-left p-2">协同服务</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r:any)=> (
                <tr key={r.regNo} className="border-t border-gray-800">
                  <td className="p-2 text-gray-300 font-mono">{r.regNo}</td>
                  <td className="p-2 text-white">{r.name}</td>
                  <td className="p-2 text-gray-300">{r.type==='importer'?'进口':r.type==='exporter'?'出口':'进出口'}</td>
                  <td className="p-2 text-gray-300">{r.category==='beauty'?'美妆':r.category==='wine'?'酒水':r.category==='appliance'?'家电':r.category==='electronics'?'电子':'纺织'}</td>
                  <td className="p-2 text-gray-300">{r.region}</td>
                  <td className="p-2">
                    <StatusBadge status={r.status==='active'?'active':r.status==='blocked'?'error':'processing'}>{r.status}</StatusBadge>
                  </td>
                  <td className="p-2 text-right text-emerald-400 font-mono">{r.compliance}%</td>
                  <td className="p-2 text-right text-cyber-cyan font-mono">{r.activeOrders}</td>
                  <td className="p-2 text-gray-400">{(r.lastActive||'').slice(0,10)}</td>
                  <td className="p-2">{r.eligible? '已接入': '待评估'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="text-gray-400 p-3">加载中...</div>}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-gray-400">第 {page} / {totalPages} 页</div>
          <div className="flex items-center gap-2">
            <GlowButton onClick={()=> setPage(p=> Math.max(1, p-1))}>上一页</GlowButton>
            <GlowButton onClick={()=> setPage(p=> Math.min(totalPages, p+1))}>下一页</GlowButton>
          </div>
        </div>
      </HudPanel>
    </div>
  )
}

export default Enterprises
