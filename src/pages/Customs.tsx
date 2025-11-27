import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { HudPanel, GlowButton } from '../components/ui/HudPanel'
import { getCustomsHeadersPaged, countCustomsHeaders, getCustomsItems, upsertCustomsHeader, insertCustomsItem, computeTaxes, ensureCustomsTables } from '../lib/sqlite'
import * as XLSX from 'xlsx'

export const Customs: React.FC = () => {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all'|'declared'|'inspecting'|'cleared'|'held'>('all')
  const [port, setPort] = useState('')
  const [mode, setMode] = useState<'all'|'general'|'processing'|'bonded'|'express'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => { void ensureCustomsTables() }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getCustomsHeadersPaged(q, status, port, mode, (page-1)*pageSize, pageSize)
      setRows(list)
      const cnt = await countCustomsHeaders(q, status, port, mode)
      setTotal(cnt)
    } finally {
      setLoading(false)
    }
  }, [q, status, port, mode, page, pageSize])

  useEffect(() => { const id = setTimeout(() => { void load() }, 0); return () => clearTimeout(id) }, [load])

  useEffect(() => {
    const run = async () => {
      if (!selected) { setItems([]); return }
      const its = await getCustomsItems(selected.id)
      setItems(its)
    }
    const id = setTimeout(() => { void run() }, 0)
    return () => clearTimeout(id)
  }, [selected])

  const totals = useMemo(()=>{
    let tariff = 0, vat = 0, excise = 0
    for (const it of items) {
      tariff += Number(it.tariff||0)
      vat += Number(it.vat||0)
      excise += Number(it.excise||0)
    }
    const sum = tariff + vat + excise
    return { tariff: Math.round(tariff*100)/100, vat: Math.round(vat*100)/100, excise: Math.round(excise*100)/100, sum: Math.round(sum*100)/100 }
  }, [items])

  const warnings = useMemo(()=>{
    const list: string[] = []
    for (const it of items) {
      const hs = String(it.hsCode||'').replace(/\D/g,'')
      if (hs.length < 8) list.push(`商品 ${it.name} 的 HS 编码不完整`)
      if (!it.unit) list.push(`商品 ${it.name} 缺少计量单位`)
      if (!it.qty || Number(it.qty)<=0) list.push(`商品 ${it.name} 数量异常`)
    }
    return list
  }, [items])

  const parseExcel = async () => {
    if (!file) return
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const sheetNames = wb.SheetNames
    const rowsAll: any[] = []
    for (const name of sheetNames) {
      const ws = wb.Sheets[name]
      const arr = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[]
      rowsAll.push(...arr)
    }
    const norm = (s: string) => (s||'').trim()
    const get = (r:any, keys:string[]) => {
      for (const k of keys) { if (r[k]!==undefined && r[k]!==null && (r[k]!=='')) return r[k] }
      const low = Object.fromEntries(Object.entries(r).map(([kk,v])=>[String(kk).toLowerCase(),v]))
      for (const k of keys) { const v = low[String(k).toLowerCase()]; if (v!==undefined && v!==null && v!=='') return v }
      return ''
    }
    const groups: Record<string, any[]> = {}
    for (const r of rowsAll) {
      const declNo = norm(String(get(r,['报关单号','申报单号','DeclarationNo','DeclNo','报关编号'])))
      if (!declNo) continue
      if (!groups[declNo]) groups[declNo] = []
      groups[declNo].push(r)
    }
    for (const [declNo, arr] of Object.entries(groups)) {
      const first = arr[0] || {}
      const enterprise = norm(String(get(first,['企业名称','Enterprise','申报单位','收货单位'])))
      const consignor = norm(String(get(first,['发货人','Consignor'])))
      const consignee = norm(String(get(first,['收货人','Consignee'])))
      const portCode = norm(String(get(first,['口岸代码','进出口岸','PortCode'])))
      const tradeModeRaw = norm(String(get(first,['贸易方式','TradeMode'])))
      const tradeMode = tradeModeRaw.includes('保税')?'bonded':tradeModeRaw.includes('加工')?'processing':tradeModeRaw.includes('一般')?'general':tradeModeRaw.includes('快件')?'express':tradeModeRaw||''
      const currency = norm(String(get(first,['币种','Currency']))) || 'CNY'
      const fx = (cur:string) => {
        if (cur==='USD') return 7.12
        if (cur==='EUR') return 7.80
        if (cur==='GBP') return 8.90
        if (cur==='JPY') return 0.05
        return 1
      }
      let totalValue = 0
      let grossWeight = 0
      let netWeight = 0
      let packages = 0
      const countryOrigin = norm(String(get(first,['起运国','原产国','CountryOfOrigin'])))
      const countryDest = norm(String(get(first,['目的国','CountryOfDest'])))
      for (let i=0;i<arr.length;i++) {
        const r = arr[i]
        let hs = norm(String(get(r,['HS编码','HSCode','商品编码'])))
        if (!hs) {
          const kw = (name||'').toLowerCase()
          if (kw.includes('化妆')||kw.includes('美容')) hs = '3304.9900'
          else if (kw.includes('酒')||kw.includes('wine')) hs = '2204.2100'
          else if (kw.includes('手机')||kw.includes('phone')||kw.includes('电子')) hs = '8517.1200'
          else hs = '8537.1000'
        }
        const name = norm(String(get(r,['商品名称','品名','GoodsName'])))
        const spec = norm(String(get(r,['规格型号','Spec'])))
        const unit = norm(String(get(r,['计量单位','Unit'])))
        const qty = Number(get(r,['数量','Qty'])) || 0
        const unitPrice = Number(get(r,['单价','UnitPrice'])) || 0
        const amount = Number(get(r,['金额','Amount','Total'])) || (qty*unitPrice)
        const originCountry = norm(String(get(r,['原产国','CountryOfOrigin']))) || countryOrigin
        totalValue += amount
        const gw = Number(get(r,['毛重','GrossWeight'])) || 0
        const nw = Number(get(r,['净重','NetWeight'])) || 0
        const pkg = Number(get(r,['件数','Packages'])) || 0
        grossWeight += gw
        netWeight += nw
        packages += pkg
        const tax = computeTaxes(hs, amount * fx(currency))
        const headerId = 'H_'+declNo
        const itemId = headerId+'_'+(i+1)
        await insertCustomsItem({ id:itemId, headerId, lineNo:i+1, hsCode:hs, name, spec, unit, qty, unitPrice, amount, originCountry, taxRate: (Math.round((tax.tariffRate+tax.vatRate+tax.exciseRate)*1000)/1000), tariff: tax.tariff, excise: tax.excise, vat: tax.vat })
      }
      const declareDate = norm(String(get(first,['申报日期','DeclareDate']))) || new Date().toISOString().slice(0,10)
      const st = norm(String(get(first,['通关状态','Status'])))
      const status = st==='已放行'?'cleared':st==='查验'?'inspecting':st==='异常拦截'?'held':st||'declared'
      await upsertCustomsHeader({ id:'H_'+declNo, declarationNo:declNo, enterprise, consignor, consignee, portCode, tradeMode, currency, totalValue, grossWeight, netWeight, packages, countryOrigin, countryDest, status, declareDate })
    }
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">报关管理</h1>
        <div className="flex items-center gap-2">
          <input type="file" accept=".xlsx,.xls" onChange={(e)=>setFile(e.target.files?.[0]||null)} className="text-white" />
          <GlowButton onClick={parseExcel}>导入</GlowButton>
        </div>
      </div>

      <div className="hud-panel p-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input value={q} onChange={(e)=>{ setPage(1); setQ(e.target.value) }} placeholder="报关单号/企业/收发货人" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text白" />
          <select value={status} onChange={(e)=>{ setPage(1); setStatus(e.target.value as any) }} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text白">
            <option value="all">全部状态</option>
            <option value="declared">已申报</option>
            <option value="inspecting">查验中</option>
            <option value="cleared">已放行</option>
            <option value="held">异常拦截</option>
          </select>
          <input value={port} onChange={(e)=>{ setPage(1); setPort(e.target.value) }} placeholder="口岸代码" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text白" />
          <select value={mode} onChange={(e)=>{ setPage(1); setMode(e.target.value as any) }} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text白">
            <option value="all">贸易方式</option>
            <option value="general">一般贸易</option>
            <option value="processing">加工贸易</option>
            <option value="bonded">保税</option>
            <option value="express">快件</option>
          </select>
          <select value={pageSize} onChange={(e)=>{ setPage(1); setPageSize(parseInt(e.target.value)) }} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text白">
            <option value={10}>10/页</option>
            <option value={20}>20/页</option>
            <option value={50}>50/页</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <HudPanel title="申报单列表" subtitle="按条件筛选">
            <div className="space-y-2">
              {loading && <div className="text-gray-400">加载中...</div>}
              {!loading && rows.map(r=> (
                <button key={r.id} onClick={()=>setSelected(r)} className={`w-full text-left px-3 py-2 rounded ${selected?.id===r.id?'bg-slate-700 text白':'hover:bg-slate-800 text白'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono">{r.declarationNo}</span>
                    <span className="text-xs text-gray-400">{r.declareDate}</span>
                  </div>
                  <div className="text-xs text-gray-400">{r.enterprise}</div>
                  <div className="text-xs text-gray-500">{r.portCode} ・ {r.tradeMode} ・ {r.currency}</div>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-gray-400">共 {total} 条</div>
              <div className="flex items-center gap-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 rounded border border-slate-700 bg-slate-800/60 text白 disabled:opacity-50" disabled={page<=1}>上一页</button>
                <div className="px-3 py-1 rounded border border-slate-700 bg-slate-800/60 text白">第 {page} 页</div>
                <button onClick={()=>setPage(p=> (p*pageSize < total) ? p+1 : p)} className="px-3 py-1 rounded border border-slate-700 bg-slate-800/60 text白 disabled:opacity-50" disabled={page*pageSize>=total}>下一页</button>
              </div>
            </div>
          </HudPanel>
        </div>
        <div className="lg:col-span-2">
          {selected ? (
            <HudPanel title="报关明细" subtitle="商品项与税费">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="hud-panel p-3">
                  <div className="text-sm text-gray-400">基本信息</div>
                  <div className="text白">{selected.declarationNo} ・ {selected.enterprise}</div>
                  <div className="text-xs text-gray-500 mt-1">{selected.consignor} → {selected.consignee}</div>
                  <div className="text-xs text-gray-500 mt-1">{selected.portCode} ・ {selected.tradeMode} ・ {selected.currency}</div>
                  <div className="text-xs text-gray-500 mt-1">金额 {selected.totalValue?.toFixed(2)} ・ 毛重 {selected.grossWeight}kg ・ 净重 {selected.netWeight}kg ・ 件数 {selected.packages}</div>
                </div>
                <div className="hud-panel p-3">
                  <div className="text-sm text-gray-400">状态</div>
                  <div className="text白">{selected.status}</div>
                  <div className="text-xs text-gray-500 mt-1">申报日期 {selected.declareDate}</div>
                  <div className="text-xs text-gray-500 mt-2">税费汇总：关税 {totals.tariff.toFixed(2)} ・ 增值税 {totals.vat.toFixed(2)} ・ 消费税 {totals.excise.toFixed(2)} ・ 合计 {totals.sum.toFixed(2)}</div>
                  {warnings.length>0 && (
                    <div className="mt-2 text-xs text-amber-400">
                      {warnings.slice(0,4).map((w,i)=>(<div key={i}>⚠️ {w}</div>))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-400 mb-2">商品项</div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {items.map(it=> (
                    <div key={it.id} className="px-2 py-2 rounded bg-slate-800/50 border border-slate-700 text白">
                      <div className="flex items-center justify-between">
                        <div className="font-mono">{it.hsCode} ・ {it.name}</div>
                        <div className="text-xs text-gray-400">{it.qty} {it.unit} × {it.unitPrice?.toFixed(2)} = {it.amount?.toFixed(2)} {selected.currency}</div>
                      </div>
                      <div className="text-xs text-gray-500">税率 {Math.round((it.taxRate||0)*1000)/10}% ・ 关税 {it.tariff?.toFixed(2)} ・ 增值税 {it.vat?.toFixed(2)} ・ 消费税 {it.excise?.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </HudPanel>
          ) : (
            <HudPanel className="h-full flex items-center justify-center" title="等待选择">
              <div className="text-gray-400">请选择左侧报关单</div>
            </HudPanel>
          )}
        </div>
      </div>
    </div>
  )
}

export default Customs
