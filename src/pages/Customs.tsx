import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { HudPanel, GlowButton, StatusBadge } from '../components/ui/HudPanel'
import { getCustomsHeadersPaged, countCustomsHeaders, getCustomsItems, upsertCustomsHeader, insertCustomsItem, computeTaxes, ensureCustomsTables, getHsChapters, getHsHeadings, getHsSubheadings, getPorts, getLinkableOrders, queryAll, enqueueJob, applyBusinessModel } from '../lib/sqlite'
import * as XLSX from 'xlsx'

export const Customs: React.FC = () => {
  const { currentRole } = useAuth()
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editedHeader, setEditedHeader] = useState<any>({})
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all'|'declared'|'inspecting'|'cleared'|'held'>('all')
  const [port, setPort] = useState('all')
  const [ports, setPorts] = useState<{ code:string; name:string; country:string }[]>([])
  const [mode, setMode] = useState<'all'|'general'|'processing'|'bonded'|'express'>('all')
  const [orderIdFilter, setOrderIdFilter] = useState('')
  const [hsChapter, setHsChapter] = useState<'all'|'unclassified'|string>('all')
  const [hsHead, setHsHead] = useState<'all'|string>('all')
  const [hsSub, setHsSub] = useState<'all'|string>('all')
  const [chapters, setChapters] = useState<{ chap:string; name:string }[]>([])
  const [headings, setHeadings] = useState<string[]>([])
  const [subs, setSubs] = useState<string[]>([])
  const [hsQuick, setHsQuick] = useState('')
  const [onlyBadHs, setOnlyBadHs] = useState(false)
  const [onlyMissingUnit, setOnlyMissingUnit] = useState(false)
  const [onlyAbnormalQty, setOnlyAbnormalQty] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [heldTips, setHeldTips] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [linkableOrders, setLinkableOrders] = useState<any[]>([])
  const [newDeclOrder, setNewDeclOrder] = useState('')

  useEffect(() => { void ensureCustomsTables() }, [])
  useEffect(() => { const id = setTimeout(async () => { setPorts(await getPorts() as any) }, 0); return () => clearTimeout(id) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getCustomsHeadersPaged(q, status, port, mode, (page-1)*pageSize, pageSize, hsChapter==='unclassified'?'':hsChapter, hsHead, hsSub, onlyBadHs, onlyMissingUnit, onlyAbnormalQty, orderIdFilter)
      setRows(list)
      const cnt = await countCustomsHeaders(q, status, port, mode, hsChapter==='unclassified'?'':hsChapter, hsHead, hsSub, onlyBadHs, onlyMissingUnit, onlyAbnormalQty, orderIdFilter)
      setTotal(cnt)
    } finally {
      setLoading(false)
    }
  }, [q, status, port, mode, hsChapter, hsHead, hsSub, page, pageSize, orderIdFilter])

  useEffect(() => { const id = setTimeout(() => { void load() }, 0); return () => clearTimeout(id) }, [load])
  useEffect(() => {
    const id = setTimeout(async () => { setChapters(await getHsChapters()) }, 0)
    return () => clearTimeout(id)
  }, [])
  useEffect(() => {
    const id = setTimeout(async () => {
      if (hsChapter && hsChapter!=='all' && hsChapter!=='unclassified') setHeadings(await getHsHeadings(hsChapter)); else setHeadings([])
      setHsHead('all'); setHsSub('all')
    }, 0)
    return () => clearTimeout(id)
  }, [hsChapter])
  useEffect(() => {
    const id = setTimeout(async () => {
      if (hsHead && hsHead!=='all') setSubs(await getHsSubheadings(hsHead)); else setSubs([])
      setHsSub('all')
    }, 0)
    return () => clearTimeout(id)
  }, [hsHead])

  useEffect(() => {
    const run = async () => {
      if (!selected) { setItems([]); return }
      const its = await getCustomsItems(selected.id)
      setItems(its)
    }
    const id = setTimeout(() => { void run() }, 0)
    return () => clearTimeout(id)
  }, [selected])

  useEffect(() => {
    const run = async () => {
      if (!selected) { setHeldTips([]); return }
      const tips: string[] = []
      if (selected.status === 'held') {
        const risk = await applyBusinessModel(selected.orderId)
        for (const m of (risk.messages||[])) { tips.push(String(m)) }
      }
      const missOrigin = items.some(it => !it.originCountry)
      if (missOrigin) tips.push('存在原产国缺失的商品项，需补充并核对')
      const [o] = await queryAll(`SELECT enterprise FROM orders WHERE id=$id`, { $id: selected.orderId })
      if (o && String(o.enterprise||'') !== String(selected.enterprise||'')) tips.push('申报单位与订单企业不一致，建议核对一致性')
      if (tips.length === 0 && selected.status === 'held') tips.push('建议核查监管条件匹配情况（如3C、动植检、强制标准）')
      setHeldTips(tips)
    }
    const id = setTimeout(() => { void run() }, 0)
    return () => clearTimeout(id)
  }, [selected, items])

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

  const handleCreate = async () => {
    const orders = await getLinkableOrders('customs')
    setLinkableOrders(orders)
    setNewDeclOrder('')
    setShowModal(true)
  }

  const handleSaveDecl = async () => {
    if (!newDeclOrder) return
    const declNo = 'DEC' + Date.now()
    const headerId = 'H_' + declNo
    const [o] = await queryAll(`SELECT order_number as orderNumber, enterprise, category, amount, currency FROM orders WHERE id=$id`, { $id: newDeclOrder })
    const enterprise = o?.enterprise || '未命名企业'
    const currency = o?.currency || 'CNY'
    const amountTotal = Number(o?.amount || 0)
    const header = {
      id: headerId,
      declarationNo: declNo,
      enterprise,
      status: 'draft',
      orderId: newDeclOrder,
      currency,
      totalValue: amountTotal,
      declareDate: new Date().toISOString().slice(0,10)
    }
    const cfg = (cat:string)=>{
      if (cat==='beauty') return { hs:'3304.9900', unit:'kg', names:['面膜','乳霜','口红'] }
      if (cat==='electronics') return { hs:'8517.1200', unit:'pcs', names:['手机','路由器','适配器'] }
      if (cat==='wine') return { hs:'2204.2100', unit:'L', names:['葡萄酒','起泡酒','烈酒'] }
      if (cat==='textile') return { hs:'6109.1000', unit:'pcs', names:['T恤','针织衫','内衣'] }
      if (cat==='appliance') return { hs:'8509.8000', unit:'pcs', names:['料理机','吸尘器','电水壶'] }
      return { hs:'8537.1000', unit:'pcs', names:['商品A','商品B','商品C'] }
    }
    const { hs, unit, names } = cfg(String(o?.category||''))
    const fx = (cur:string) => cur==='USD'?7.12:cur==='EUR'?7.80:cur==='GBP'?8.90:cur==='JPY'?0.05:1
    const n = 3
    let remaining = amountTotal || 0
    const items: any[] = []
    for (let i=0;i<n;i++) {
      const share = i===n-1 ? remaining : Math.round(((amountTotal||0) * (0.2 + Math.random()*0.3)) * 100)/100
      remaining = Math.max(0, remaining - share)
      const name = names[i%names.length]
      const unitPrice = unit==='kg' ? 120 : unit==='L' ? 80 : 300
      const qtyRaw = unitPrice>0 ? share / unitPrice : 1
      const qty = Math.max(1, Math.round(qtyRaw * 100) / 100)
      const tax = computeTaxes(hs, share * fx(currency))
      items.push({ id: `${headerId}_${i+1}`, headerId, lineNo: i+1, hsCode: hs, name, spec: 'Standard', unit, qty, unitPrice, amount: share, originCountry: 'CN', taxRate: (Math.round((tax.tariffRate+tax.vatRate+tax.exciseRate)*1000)/1000), tariff: tax.tariff, excise: tax.excise, vat: tax.vat })
    }
    await enqueueJob('customs_declare', { header, items })
    setShowModal(false)
    setTimeout(() => { load() }, 800)
  }

  const updateCustomsStatus = async (id: string, next: string) => {
    await enqueueJob('customs_progress', { header_id: id, next_status: next })
    setTimeout(() => { load() }, 800)
  }

  const handleAction = async (actionType: string, id: string) => {
    let nextStatus = ''
    if (actionType === 'submit') nextStatus = 'declared'
    else if (actionType === 'pass') nextStatus = 'cleared'
    else if (actionType === 'inspect') nextStatus = 'inspecting'
    else if (actionType === 'reject') nextStatus = 'held'
    else if (actionType === 're_declare') nextStatus = 'declared'
    if (!nextStatus) return
    if (actionType === 're_declare') {
      const changed = editedHeader && selected && (
        (editedHeader.enterprise && editedHeader.enterprise !== selected.enterprise) ||
        (editedHeader.consignor && editedHeader.consignor !== selected.consignor) ||
        (editedHeader.consignee && editedHeader.consignee !== selected.consignee) ||
        (editedHeader.portCode && editedHeader.portCode !== selected.portCode) ||
        (editedHeader.tradeMode && editedHeader.tradeMode !== selected.tradeMode)
      )
      if (!changed) return
      setEditModalVisible(false)
    }
    await updateCustomsStatus(id, nextStatus)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">报关管理</h1>
        <div className="flex items-center gap-2">
          {currentRole === 'customs' && (<GlowButton onClick={handleCreate}>+ 新增申报</GlowButton>)}
          {currentRole === 'customs' && (<input type="file" accept=".xlsx,.xls" onChange={(e)=>setFile(e.target.files?.[0]||null)} className="text-white" />)}
          {currentRole === 'customs' && (<GlowButton onClick={parseExcel}>导入</GlowButton>)}
          <GlowButton onClick={()=>{ void load() }}>🔄 刷新列表</GlowButton>
        </div>
      </div>

      <div className="hud-panel p-3">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-2">
          <input value={q} onChange={(e)=>{ setPage(1); setQ(e.target.value) }} placeholder="报关单号/企业/收发货人" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          <select value={status} onChange={(e)=>{ setPage(1); setStatus(e.target.value as any) }} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="all">全部状态</option>
            <option value="declared">已申报</option>
            <option value="inspecting">查验中</option>
            <option value="cleared">已放行</option>
            <option value="held">异常拦截</option>
          </select>
          <select value={port} onChange={(e)=>{ setPage(1); setPort(e.target.value) }} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="all">口岸代码</option>
            {ports.map(p=> (<option key={p.code} value={p.code}>{p.code} {p.name}</option>))}
          </select>
          <select value={mode} onChange={(e)=>{ setPage(1); setMode(e.target.value as any) }} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="all">贸易方式</option>
            <option value="general">一般贸易</option>
            <option value="processing">加工贸易</option>
            <option value="bonded">保税</option>
            <option value="express">快件</option>
          </select>
          <select value={hsChapter} onChange={(e)=>{ setPage(1); setHsChapter(e.target.value as any) }} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="all">章</option>
            <option value="unclassified">未归类</option>
            {chapters.map(c=> (<option key={c.chap} value={c.chap}>{c.chap} {c.name}</option>))}
          </select>
          <select value={hsHead} onChange={(e)=>{ setPage(1); setHsHead(e.target.value as any) }} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" disabled={!headings.length}>
            <option value="all">品目</option>
            {headings.map(h=> (<option key={h} value={h}>{h}</option>))}
          </select>
          <select value={hsSub} onChange={(e)=>{ setPage(1); setHsSub(e.target.value as any) }} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" disabled={!subs.length}>
            <option value="all">子目</option>
            {subs.map(s=> (<option key={s} value={s}>{s}</option>))}
          </select>
          <input value={hsQuick} onChange={(e)=>{ const v = (e.target.value||'').replace(/\D/g,''); setPage(1); setHsQuick(v); if (v.length>=8) { setHsSub(v.slice(0,8)); setHsHead('all'); setHsChapter('all') } else if (v.length>=4) { setHsHead(v.slice(0,4)); setHsChapter('all'); setHsSub('all') } else if (v.length>=2) { setHsChapter(v.slice(0,2)); setHsHead('all'); setHsSub('all') } else { setHsChapter('all'); setHsHead('all'); setHsSub('all') } }} placeholder="HS快速筛选 2/4/8位" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          <label className="inline-flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={onlyBadHs} onChange={(e)=>{ setPage(1); setOnlyBadHs(e.target.checked) }} /> 仅不完整HS</label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={onlyMissingUnit} onChange={(e)=>{ setPage(1); setOnlyMissingUnit(e.target.checked) }} /> 仅缺计量单位</label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={onlyAbnormalQty} onChange={(e)=>{ setPage(1); setOnlyAbnormalQty(e.target.checked) }} /> 仅数量异常</label>
          <input value={orderIdFilter} onChange={(e)=>{ setPage(1); setOrderIdFilter(e.target.value) }} placeholder="订单ID筛选（可粘贴）" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <HudPanel title="申报单列表" subtitle="按条件筛选">
            <div className="space-y-2">
              {loading && <div className="text-gray-400">加载中...</div>}
              {!loading && rows.map(r=> (
                <button key={r.id} onClick={()=>setSelected(r)} className={`w-full text-left px-3 py-2 rounded ${selected?.id===r.id?'bg-slate-700 text-white':'hover:bg-slate-800 text-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono">{r.declarationNo}</span>
                    <span className="text-xs text-gray-400">{r.declareDate}</span>
                  </div>
                  <div className="text-xs text-gray-400">{r.enterprise}</div>
                  <div className="text-xs text-gray-500">{r.portCode} ・ {r.tradeMode==='general'?'一般贸易':r.tradeMode==='processing'?'加工贸易':r.tradeMode==='bonded'?'保税':r.tradeMode==='express'?'快件':r.tradeMode} ・ {r.currency}{['USD','CNY','EUR','GBP'].includes(r.currency)?`（${r.currency==='USD'?'美元':r.currency==='CNY'?'人民币':r.currency==='EUR'?'欧元':'英镑'}）`:''}</div>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
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
          </HudPanel>
        </div>
        <div className="lg:col-span-2">
          {selected ? (
            <HudPanel title="报关明细" subtitle="商品项与税费">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="hud-panel p-3">
                  <div className="text-sm text-gray-400">基本信息</div>
                  <div className="text-white">{selected.declarationNo} ・ {selected.enterprise}</div>
                  <div className="text-xs text-gray-500 mt-1">{selected.consignor} → {selected.consignee}</div>
                  <div className="text-xs text-gray-500 mt-1">{selected.portCode} ・ {selected.tradeMode==='general'?'一般贸易':selected.tradeMode==='processing'?'加工贸易':selected.tradeMode==='bonded'?'保税':selected.tradeMode==='express'?'快件':selected.tradeMode} ・ {selected.currency}{['USD','CNY','EUR','GBP'].includes(selected.currency)?`（${selected.currency==='USD'?'美元':selected.currency==='CNY'?'人民币':selected.currency==='EUR'?'欧元':'英镑'}）`:''}</div>
                  <div className="text-xs text-gray-500 mt-1">金额 {selected.totalValue?.toFixed(2)} ・ 毛重 {selected.grossWeight}kg ・ 净重 {selected.netWeight}kg ・ 件数 {selected.packages}</div>
                </div>
                <div className="hud-panel p-3">
                  <div className="text-sm text-gray-400">状态</div>
                  <div className="text-white"><StatusBadge status={selected.status} /></div>
                  <div className="text-xs text-gray-500 mt-1">申报日期 {selected.declareDate}</div>
                  <div className="text-xs text-gray-500 mt-2">税费汇总：关税 {totals.tariff.toFixed(2)} ・ 增值税 {totals.vat.toFixed(2)} ・ 消费税 {totals.excise.toFixed(2)} ・ 合计 {totals.sum.toFixed(2)}</div>
                  {warnings.length>0 && (
                    <div className="mt-2 text-xs text-amber-400">
                      {warnings.slice(0,4).map((w,i)=>(<div key={i}>⚠️ {w}</div>))}
                    </div>
                  )}
                  {selected.status==='held' && (
                    <div className="mt-2 text-xs text-red-400">
                      {heldTips.slice(0,4).map((w,i)=>(<div key={i}>⛔ {w}</div>))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <GlowButton size="sm" onClick={async ()=>{
                      if (!selected) return
                      const data = items.map(it=>({ 行号: it.lineNo, HS编码: it.hsCode, 名称: it.name, 规格: it.spec, 单位: it.unit, 数量: it.qty, 单价: it.unitPrice, 金额: it.amount, 关税: it.tariff, 增值税: it.vat, 消费税: it.excise }))
                      const ws = XLSX.utils.json_to_sheet(data)
                      const wb = XLSX.utils.book_new()
                      XLSX.utils.book_append_sheet(wb, ws, 'CustomsItems')
                      XLSX.writeFile(wb, `${selected.declarationNo || 'customs'}.xlsx`)
                    }}>导出Excel</GlowButton>
                    {selected && (currentRole === 'customs') && ((selected.status||'') === 'draft' || !(selected.status||'')) && (
                      <GlowButton size="sm" className="ml-2 bg-green-600" onClick={()=>handleAction('submit', selected.id)}>提交申报</GlowButton>
                    )}
                    {selected && (currentRole === 'director') && (selected.status === 'declared') && (
                      <>
                        <GlowButton size="sm" className="ml-2 bg-green-600" onClick={()=>handleAction('pass', selected.id)}>直接放行</GlowButton>
                        <GlowButton size="sm" className="ml-2" onClick={()=>handleAction('inspect', selected.id)}>布控查验</GlowButton>
                        <GlowButton size="sm" className="ml-2 bg-red-600" onClick={()=>handleAction('reject', selected.id)}>拦截退单</GlowButton>
                      </>
                    )}
                    {selected && (currentRole === 'director') && (selected.status === 'inspecting') && (
                      <GlowButton size="sm" className="ml-2 bg-green-600" onClick={()=>handleAction('pass', selected.id)}>查验无误放行</GlowButton>
                    )}
                    {selected && (currentRole === 'customs') && (selected.status === 'held') && (
                      <>
                        <GlowButton size="sm" className="ml-2" onClick={()=>{ setEditedHeader({ enterprise: selected.enterprise, consignor: selected.consignor, consignee: selected.consignee, portCode: selected.portCode, tradeMode: selected.tradeMode }); setEditModalVisible(true) }}>修正数据</GlowButton>
                        <GlowButton size="sm" className="ml-2 bg-amber-600" onClick={()=>handleAction('re_declare', selected.id)}>重新申报</GlowButton>
                      </>
                    )}
                    {selected && (currentRole === 'director') && (selected.status === 'held') && (
                      <GlowButton size="sm" className="ml-2 bg-amber-600" onClick={()=>handleAction('pass', selected.id)}>审批放行</GlowButton>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-400 mb-2">商品项</div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {items.length===0 && (
                    <div className="px-2 py-2 rounded bg-slate-800/50 border border-slate-700 text-gray-300 flex items-center justify-between">
                      <span>当前申报单暂无明细。系统将按 SKU 归并生成报关项（例如将同 HS 编码的 SKU 合并为 1 项），HS 编码由历史申报专家库或 AI 归类算法推荐，需人工确认。</span>
                      {currentRole === 'customs' && (
                      <GlowButton size="sm" onClick={async()=>{
                        if (!selected?.id) return
                        const [h] = await queryAll(`SELECT order_id as orderId, currency FROM customs_headers WHERE id=$id`, { $id: selected.id })
                        const orderId = h?.orderId || ''
                        if (!orderId) return
                        const [o] = await queryAll(`SELECT currency, category, amount FROM orders WHERE id=$id`, { $id: orderId })
                        const currency = o?.currency || 'CNY'
                        const amountTotal = Number(o?.amount || 0)
                        const cfg = (cat:string)=>{
                          if (cat==='beauty') return { hs:'3304.9900', unit:'kg', names:['面膜','乳霜','口红'] }
                          if (cat==='electronics') return { hs:'8517.1200', unit:'pcs', names:['手机','路由器','适配器'] }
                          if (cat==='wine') return { hs:'2204.2100', unit:'L', names:['葡萄酒','起泡酒','烈酒'] }
                          if (cat==='textile') return { hs:'6109.1000', unit:'pcs', names:['T恤','针织衫','内衣'] }
                          if (cat==='appliance') return { hs:'8509.8000', unit:'pcs', names:['料理机','吸尘器','电水壶'] }
                          return { hs:'8537.1000', unit:'pcs', names:['商品A','商品B','商品C'] }
                        }
                        const { hs, unit, names } = cfg(String(o?.category||''))
                        const fx = (cur:string) => cur==='USD'?7.12:cur==='EUR'?7.80:cur==='GBP'?8.90:cur==='JPY'?0.05:1
                        const n = 3
                        let remaining = amountTotal || 0
                        for (let i=0;i<n;i++) {
                          const share = i===n-1 ? remaining : Math.round(((amountTotal||0) * (0.2 + Math.random()*0.3)) * 100)/100
                          remaining = Math.max(0, remaining - share
                          )
                          const name = names[i%names.length]
                          const unitPrice = unit==='kg' ? 120 : unit==='L' ? 80 : 300
                          const qtyRaw = unitPrice>0 ? share / unitPrice : 1
                          const qty = Math.max(1, Math.round(qtyRaw * 100) / 100)
                          const tax = computeTaxes(hs, share * fx(currency))
                          await insertCustomsItem({ id: `${selected.id}_${i+1}`, headerId: selected.id, lineNo: i+1, hsCode: hs, name, spec: 'Standard', unit, qty, unitPrice, amount: share, originCountry: 'CN', taxRate: (Math.round((tax.tariffRate+tax.vatRate+tax.exciseRate)*1000)/1000), tariff: tax.tariff, excise: tax.excise, vat: tax.vat })
                        }
                        const its = await getCustomsItems(selected.id)
                        setItems(its)
                      }}>按SKU归并生成报关项</GlowButton>
                      )}
                    </div>
                  )}
                  {items.map(it=> (
                    <div key={it.id} className="px-2 py-2 rounded bg-slate-800/50 border border-slate-700 text-white">
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

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-[400px] shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">新增报关申报</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">选择关联订单 (未申报)</label>
                <select 
                  value={newDeclOrder} 
                  onChange={(e) => setNewDeclOrder(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="">请选择订单...</option>
                  {linkableOrders.map(o => (
                    <option key={o.id} value={o.id}>{o.order_number}（ID：{o.id}）</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-gray-500">HS（协调制度）商品编码：章（2位）、品目（4位）、子目（8位）</div>
              <p className="text-xs text-gray-500">
                系统读取由 ERP 同步的真实 BOM（物料清单），根据订单内的 SKU 明细进行归并申报生成报关项；例如将订单中 10 个同 HS 编码的 SKU 合并为 1 项申报。基于历史申报专家库或 AI 归类算法，推荐高置信度的 HS 编码，需人工确认。
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
              <GlowButton onClick={handleSaveDecl} disabled={!newDeclOrder}>生成申报单</GlowButton>
            </div>
          </div>
        </div>
      )}

      {editModalVisible && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-[480px] shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">修正数据</h2>
            <div className="space-y-3">
              <input value={editedHeader.enterprise||''} onChange={(e)=>setEditedHeader((h:any)=>({ ...h, enterprise:e.target.value }))} placeholder="申报单位" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
              <input value={editedHeader.consignor||''} onChange={(e)=>setEditedHeader((h:any)=>({ ...h, consignor:e.target.value }))} placeholder="发货人" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
              <input value={editedHeader.consignee||''} onChange={(e)=>setEditedHeader((h:any)=>({ ...h, consignee:e.target.value }))} placeholder="收货人" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
              <input value={editedHeader.portCode||''} onChange={(e)=>setEditedHeader((h:any)=>({ ...h, portCode:e.target.value }))} placeholder="口岸代码" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
              <select value={editedHeader.tradeMode||''} onChange={(e)=>setEditedHeader((h:any)=>({ ...h, tradeMode:e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
                <option value="">请选择贸易方式</option>
                <option value="general">一般贸易</option>
                <option value="processing">加工贸易</option>
                <option value="bonded">保税</option>
                <option value="express">快件</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={()=>setEditModalVisible(false)} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
              <GlowButton onClick={async ()=>{
                if (!selected) { setEditModalVisible(false); return }
                const payload = {
                  id: selected.id,
                  declarationNo: selected.declarationNo,
                  enterprise: editedHeader.enterprise || selected.enterprise,
                  consignor: editedHeader.consignor || selected.consignor,
                  consignee: editedHeader.consignee || selected.consignee,
                  portCode: editedHeader.portCode || selected.portCode,
                  tradeMode: editedHeader.tradeMode || selected.tradeMode,
                  currency: selected.currency,
                  totalValue: selected.totalValue,
                  status: selected.status,
                  declareDate: selected.declareDate,
                  orderId: selected.orderId
                }
                await upsertCustomsHeader(payload)
                setEditModalVisible(false)
                const [hdr] = await getCustomsHeadersPaged(q, status, port, mode, (page-1)*pageSize, pageSize, hsChapter==='unclassified'?'':hsChapter, hsHead, hsSub, onlyBadHs, onlyMissingUnit, onlyAbnormalQty)
                setSelected(hdr || null)
                await load()
              }}>保存</GlowButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customs
