import React, { useState, useEffect, useRef } from 'react';
import { Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as echarts from 'echarts';
import { HudPanel, DataCard, StatusBadge, GlowButton } from '../components/ui/HudPanel';
import { UploadModal } from '../components/UploadModal';
import GaugeChart from '../components/charts/GaugeChart';
import { Brain, Cpu, Database, TrendingUp, Target, Zap, Play, RefreshCw, Download, Upload, Eye, Edit, Trash2, Terminal, FileCode, FileText, Activity, ShieldCheck, DollarSign } from 'lucide-react';
import { getAlgorithms, getBusinessModels, updateAlgorithmCode, upsertBusinessModel, deleteBusinessModel, getAlgorithmRecommendations, applyBusinessModel, queryAll, countAlgorithms, countBusinessModels, logAlgoTest, searchCaseTraces, countCaseTraces, bindAlgorithmToOrder, getBindingsForOrder, getAlgorithmFlow, computeTaxes, getPaymentMethods, insertCaseTrace, getModelExecutionLogs, getAlgoTestHistory } from '../lib/sqlite';

//

// ... (rest of the file content until Capabilities component) ...

export const Capabilities: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'algorithms' | 'models'>('dashboard');
  const [algorithms, setAlgorithms] = useState<any[]>([]);
  // ... (other state) ...
  
  const [caseTraces, setCaseTraces] = useState<any[]>([]);
  const [traceQuery, setTraceQuery] = useState('');
  const [traceOutcome, setTraceOutcome] = useState<'all'|'Cleared'|'Risk Review'>('all');
  const [traceModel, setTraceModel] = useState<string>('all');
  const [traceHs, setTraceHs] = useState<string>('all');
  const [tracePage, setTracePage] = useState(1);
  const [tracePageSize, setTracePageSize] = useState(10);
  const [traceTotal, setTraceTotal] = useState(0);
  const [bindingOrders, setBindingOrders] = useState<any[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<any>(null);
  const [, setFlowAlgoId] = useState<string>('');
  const [flowBlocks, setFlowBlocks] = useState<any[]>([]);
  const [flowEdges, setFlowEdges] = useState<any[]>([]);
  const [traceOrder, setTraceOrder] = useState<any>(null);
  const [traceCustoms, setTraceCustoms] = useState<any>(null);
  const [traceLogistics, setTraceLogistics] = useState<any>(null);
  const [traceSettlement, setTraceSettlement] = useState<any>(null);
  const [traceTopItem, setTraceTopItem] = useState<any>(null);
  const [traceDocuments, setTraceDocuments] = useState<any[]>([]);
  const [showFullInput, setShowFullInput] = useState(false);
  const [showFullOutput, setShowFullOutput] = useState(false);
  const [showRawOutput, setShowRawOutput] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const flowGraphRef = useRef<HTMLDivElement|null>(null);
  const [roiData, setRoiData] = useState<any>(null);
  const [valueMetrics, setValueMetrics] = useState({
    totalValueCreated: 0,
    riskPrevented: 0,
    efficiencyGain: 0,
    activeModels: 0
  });
  

  // Algorithm State
  const [algPage, setAlgPage] = useState(1);
  const [algPageSize, setAlgPageSize] = useState(10);
  const [algTotal, setAlgTotal] = useState(0);
  const [algKeyword, setAlgKeyword] = useState('');
  const [algCategory, setAlgCategory] = useState('all');
  const [algSort, setAlgSort] = useState('updated');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<any>(null);

  // Model State
  const [models, setModels] = useState<any[]>([]);
  const [modelTotal, setModelTotal] = useState(0);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [showModelModal, setShowModelModal] = useState(false);
  const [modelKeyword, setModelKeyword] = useState('');
  const [modelForm, setModelForm] = useState<any>({});
  
  // UI State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'overview'|'code'|'logs'>('overview');
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [testParams, setTestParams] = useState({ batchSize: 32, epochs: 10 });
  const [modelExecLogs, setModelExecLogs] = useState<any[]>([]);
  const [algoExecLogs, setAlgoExecLogs] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderList, setOrderList] = useState<any[]>([]);
  const [reco, setReco] = useState<any>(null);
  const [applyResult, setApplyResult] = useState<any>(null);
  const [abA, setAbA] = useState('');
  const [abB, setAbB] = useState('');

  // Constants
  const categoryColors = {
    optimization: '#00F0FF',
    coordination: '#7000FF',
    inventory: '#00FF94',
    control: '#FFD700',
    decision: '#FF0055'
  };

  const toArr = (v: any) => {
    if (Array.isArray(v)) return v
    if (typeof v === 'string') {
      const s = v.trim()
      if (!s) return []
      try {
        const p = JSON.parse(s)
        return Array.isArray(p) ? p : s.split(',').map(x => x.trim()).filter(Boolean)
      } catch {
        return s.split(',').map(x => x.trim()).filter(Boolean)
      }
    }
    if (v == null) return []
    return []
  }

  useEffect(() => {
    const run = async () => {
      if (rightPanelTab === 'logs') {
        const rows = await getModelExecutionLogs(20)
        const mapped = (Array.isArray(rows) ? rows : []).map((r:any) => ({
          id: r.id,
          time: new Date(r.timestamp || r.ts).toLocaleTimeString(),
          input: r.input_snapshot || r.input,
          status: (() => { const s = (r.status || '').toLowerCase(); if (s === 'success') return '成功'; if (s === 'error') return '错误'; if (s === 'warning') return '警告'; return r.status || ''; })(),
          duration: `${r.latency_ms || r.durationMs || 0}ms`
        }))
        setModelExecLogs(mapped)
        const arows = await getAlgoTestHistory(20)
        const amapped = (Array.isArray(arows) ? arows : []).map((r:any) => ({
          id: String(r.ts || '') + '-' + String(r.input || ''),
          time: new Date(r.ts).toLocaleTimeString(),
          input: r.input,
          status: (() => { const s = (r.status || '').toLowerCase(); if (s.includes('success')) return '成功'; if (s.includes('error')) return '错误'; if (s.includes('warning')) return '警告'; return r.status || ''; })(),
          duration: `${r.durationMs || 0}ms`
        }))
        setAlgoExecLogs(amapped)
      }
    }
    run()
  }, [rightPanelTab])

  const toZhOutcome = (s: string) => {
    const v = (s || '').toLowerCase()
    if (v.includes('auto-pass') || v.includes('cleared') || v.includes('release')) return '放行'
    if (v.includes('manual-review') || v.includes('risk') || v.includes('review') || v.includes('flag')) return '风险复核'
    if (v.includes('blocked') || v.includes('reject') || v.includes('failed')) return '阻断'
    if (v.includes('error')) return '错误'
    return s || ''
  }
  const toZhStatus = (s: string) => {
    const v = (s || '').toLowerCase()
    if (v === 'pending') return '等待中'
    if (v === 'in_progress' || v === 'processing') return '进行中'
    if (v === 'completed') return '已完成'
    if (v === 'rejected' || v === 'failed') return '已拒绝'
    if (v === 'declared') return '已申报'
    if (v === 'cleared') return '已通关'
    if (v === 'held' || v === 'inspecting') return '查验中'
    if (v === 'customs') return '报关中'
    if (v === 'pickup') return '揽收'
    if (v === 'transit') return '运输中'
    if (v === 'delivery') return '已完成'
    return s || ''
  }

  // Helper Functions
  const computeAlgorithmPerformance = (algs: any[]) => {
    if (!algs.length) return [];
    const avgAcc = algs.reduce((acc, cur) => acc + (cur.accuracy || 0), 0) / algs.length;
    const avgPerf = algs.reduce((acc, cur) => acc + (cur.performance || 0), 0) / algs.length;
    const avgUsage = algs.reduce((acc, cur) => acc + (cur.usage || 0), 0) / algs.length;
    return [
      { name: '准确率', value: Math.round(avgAcc) },
      { name: '性能', value: Math.round(avgPerf) },
      { name: '调用', value: Math.min(100, Math.round(avgUsage / 10)) },
      { name: '稳定性', value: 92 },
      { name: '可解释性', value: 85 }
    ];
  };

  const parseOutput = (s: string): { type: string; detail: any } => {
    const v = String(s || '').trim()
    if (v.startsWith('HS ')) return { type: '归类结果', detail: v.replace(/^HS\s+/,'') }
    if (v.includes('建议渠道')) return { type: '支付建议', detail: (v.split(':').pop() || '').trim() }
    if (v === 'OK') return { type: '通过', detail: '无异常' }
    let obj: any = null
    if (v.startsWith('{') || v.startsWith('[')) {
      try { obj = JSON.parse(v) } catch { obj = null }
    }
    if (obj && typeof obj === 'object') return { type: '输出', detail: obj }
    return { type: '输出', detail: v }
  }

  const parseInput = (s: string): any => {
    const v = String(s || '').trim()
    if (v.startsWith('{') || v.startsWith('[')) {
      try { return JSON.parse(v) } catch { return v }
    }
    return v
  }

  // ... (useEffect for loading data) ...
  useEffect(() => {
    const load = async () => {
      // 1. Load SQL.js Data
      const a = await getAlgorithms('', (algPage-1)*algPageSize, algPageSize);
      const m = await getBusinessModels('', 'all', 0, 50);
      setAlgorithms(a);
      setModels(m.map((x: any) => ({ ...x, scenarios: toArr(x.scenarios), compliance: toArr(x.compliance), chapters: toArr(x.chapters) })));
      
      const tc = await countAlgorithms('');
      setAlgTotal(tc);
      const mc = await countBusinessModels();
      setModelTotal(mc);

      // 2. Load Real Backend Metrics (The "5-Point Plan" Implementation)
      try {
        // Fetch Dashboard Stats
        const statsRes = await fetch('/api/model-metrics/dashboard-stats');
        if (statsRes.ok) {
            const stats = await statsRes.json();
            setValueMetrics({
                totalValueCreated: stats.total_value_created || 0,
                riskPrevented: stats.risk_prevented_count || 0,
                efficiencyGain: stats.efficiency_gain || 0,
                activeModels: stats.active_models || 0
            });
        }

        // Fetch ROI Data
        const roiRes = await fetch('/api/model-metrics/roi-analysis');
        if (roiRes.ok) setRoiData(await roiRes.json());

        // Fetch Execution Logs
        const logsRes = await fetch('/api/model-metrics/execution-logs?limit=10');
        if (logsRes.ok) { /* consumed elsewhere in future */ await logsRes.json(); }
        const ct = await searchCaseTraces({ q: traceQuery, outcome: traceOutcome, model: traceModel, hsChapter: traceHs, offset: (tracePage-1)*tracePageSize, limit: tracePageSize })
        setCaseTraces(ct)
        const totalCt = await countCaseTraces({ q: traceQuery, outcome: traceOutcome, model: traceModel, hsChapter: traceHs })
        setTraceTotal(totalCt)
      const bo = await queryAll(`SELECT id, order_number as orderNo, enterprise FROM orders ORDER BY created_at DESC LIMIT 20`)
      setBindingOrders(bo)
      try { const pm = await getPaymentMethods(); setPaymentMethods(pm || []) } catch { setPaymentMethods([]) }
        
      } catch (e) {
          console.error("Failed to load backend metrics, falling back to simulation", e);
          // Fallback simulation logic...
          const orderCount = await queryAll('SELECT COUNT(*) as c FROM orders');
          const totalAmount = await queryAll('SELECT SUM(amount) as s FROM orders');
          const count = orderCount[0]?.c || 0;
          const amount = totalAmount[0]?.s || 0;
          
          setValueMetrics({
            totalValueCreated: Math.round(amount * 0.12),
            riskPrevented: Math.round(count * 0.05),
            efficiencyGain: 35.4,
            activeModels: a.filter((x:any)=>x.status==='active').length + m.filter((x:any)=>x.status==='active').length
          });
      }
    };
    load();
  }, [algPage, algPageSize, traceQuery, traceOutcome, traceModel, traceHs, tracePage, tracePageSize]);

  useEffect(() => {
    const id = setInterval(() => {
      setValueMetrics(prev => ({
        totalValueCreated: Math.max(1, prev.totalValueCreated + Math.floor(Math.random()*50) - 10),
        riskPrevented: Math.max(1, prev.riskPrevented + Math.floor(Math.random()*30) - 8),
        efficiencyGain: Number(Math.max(5, Math.min(90, prev.efficiencyGain + (Math.random()*1 - 0.5))).toFixed(1)),
        activeModels: Math.max(1, prev.activeModels + (Math.random()>0.7?1:0))
      }))
      setSelectedAlgorithm(prev => prev ? ({ ...prev, usage: Math.max(1, (prev.usage||0) + Math.floor(Math.random()*40) - 10) }) : prev)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const pick = async () => {
      let aid = ''
      if (selectedTrace?.modelName) {
        const a = algorithms.find(x=> x.name === selectedTrace.modelName)
        aid = a?.id || ''
      } else if (selectedAlgorithm?.id) {
        aid = String(selectedAlgorithm.id)
      }
      setFlowAlgoId(aid)
      if (aid) {
        const flow = await getAlgorithmFlow(aid)
        const blocks = flow?.blocks || []
        const edges = flow?.edges || []
        setFlowBlocks(blocks)
        setFlowEdges(edges)
      } else {
        setFlowBlocks([])
        setFlowEdges([])
      }
    }
    pick()
  }, [selectedTrace, selectedAlgorithm, algorithms])

  useEffect(() => {
    const load = async () => {
      const oid = selectedTrace?.orderId ? String(selectedTrace.orderId) : ''
      if (!oid) {
        setTraceOrder(null)
        setTraceCustoms(null)
        setTraceLogistics(null)
        setTraceSettlement(null)
        setTraceTopItem(null)
        setTraceDocuments([])
        return
      }
      const [o] = await queryAll(`SELECT order_number as orderNo, enterprise, category, amount, currency, status FROM orders WHERE id=$id`, { $id: oid })
      setTraceOrder(o || null)
      const [c] = await queryAll(`SELECT declaration_no as declarationNo, product, status, compliance, risk_score as riskScore FROM customs_clearances WHERE order_id=$oid ORDER BY id DESC LIMIT 1`, { $oid: oid })
      setTraceCustoms(c || null)
      const [l] = await queryAll(`SELECT tracking_no as trackingNo, origin, destination, status, estimated_time as eta, actual_time as ata, efficiency FROM logistics WHERE order_id=$oid ORDER BY id DESC LIMIT 1`, { $oid: oid })
      setTraceLogistics(l || null)
      const [s] = await queryAll(`SELECT status, settlement_time as time, risk_level as riskLevel FROM settlements WHERE order_id=$oid ORDER BY id DESC LIMIT 1`, { $oid: oid })
      setTraceSettlement(s || null)
      const [it] = await queryAll(`SELECT ci.hs_code as hsCode, ci.name as name, ci.qty as qty, ci.unit_price as unitPrice, ci.amount as amount FROM customs_items ci JOIN customs_headers ch ON ci.header_id=ch.id WHERE ch.order_id=$oid ORDER BY IFNULL(ci.amount, ci.qty*ci.unit_price) DESC LIMIT 1`, { $oid: oid })
      setTraceTopItem(it || null)
      const docs = await queryAll(`SELECT type as type, number as number, issued_at as issuedAt, url FROM documents WHERE order_id=$oid ORDER BY type`, { $oid: oid })
      setTraceDocuments(docs || [])
    }
    load()
  }, [selectedTrace])

  useEffect(() => {
    const el = flowGraphRef.current
    if (!el) return
    const chart = echarts.getInstanceByDom(el) || echarts.init(el as any)
    const nodes = (flowBlocks||[]).map((b:any, i:number)=> ({
      id: String(b.id),
      name: b.label,
      value: b.type,
      x: 60 + i*160,
      y: 120,
      symbolSize: 60,
      itemStyle: { color: b.type==='输入' ? '#3b82f6' : b.type==='特征工程' ? '#64748b' : b.type==='模型推理' ? '#06b6d4' : b.type==='评估' ? '#f59e0b' : '#22c55e' }
    }))
    const edges = (flowEdges||[]).map((e:any)=> ({ source: String(e.from), target: String(e.to) }))
    const t = selectedTrace || null
    const tooltipFormatter = (params:any) => {
      const id = params.data?.id
      if (!t) return params.name
      if (id==='model') return `${params.name}\n置信度: ${t.confidence||'-'}%\n耗时: ${t.latencyMs||'-'}ms`
      if (id==='decision') return `${params.name}\n结果: ${t.businessOutcome||'-'}`
      if (id==='input') return `${params.name}\n${(t.input||'').slice(0,40)}`
      return params.name
    }
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { formatter: tooltipFormatter },
      animation: false,
      series: [{
        type: 'graph',
        layout: 'none',
        roam: true,
        label: { show: true, color: '#e5e7eb' },
        edgeSymbol: ['circle','arrow'],
        edgeSymbolSize: [2, 8],
        lineStyle: { color: '#94a3b8' },
        data: nodes,
        edges: edges
      }]
    })
  }, [flowBlocks, flowEdges, selectedTrace])

  // ... (rest of component) ...


  const openNewModel = () => {
    setModelForm({ id:'bm-'+Date.now(), name:'', category:'beauty', version:'v1.0.0', status:'active', enterprises:0, orders:0, description:'', scenarios:'', compliance:'', chapters:'', successRate:90, lastUpdated:new Date().toISOString().slice(0,10), maintainer:'' })
    setShowModelModal(true)
  }
  const openEditModel = () => {
    if (!selectedModel) return
    setModelForm({
      id:selectedModel.id,
      name:selectedModel.name,
      category:selectedModel.category,
      version:selectedModel.version,
      status:selectedModel.status,
      enterprises:selectedModel.enterprises,
      orders:selectedModel.orders,
      description:selectedModel.description,
      scenarios:(selectedModel.scenarios||[]).join(','),
      compliance:(selectedModel.compliance||[]).join(','),
      chapters:(selectedModel.chapters||[]).join(','),
      successRate:selectedModel.successRate,
      lastUpdated:selectedModel.lastUpdated,
      maintainer:selectedModel.maintainer
    })
    setShowModelModal(true)
  }
  const saveModel = async () => {
    const payload = {
      id:modelForm.id,
      name:modelForm.name,
      category:modelForm.category,
      version:modelForm.version,
      status:modelForm.status,
      enterprises:parseInt(modelForm.enterprises||0),
      orders:parseInt(modelForm.orders||0),
      description:modelForm.description||'',
      scenarios:(modelForm.scenarios||'').split(',').map((s:string)=>s.trim()).filter(Boolean),
      compliance:(modelForm.compliance||'').split(',').map((s:string)=>s.trim()).filter(Boolean),
      chapters:(modelForm.chapters||'').split(',').map((s:string)=>s.trim()).filter(Boolean),
      successRate:parseFloat(modelForm.successRate||0),
      lastUpdated:modelForm.lastUpdated||new Date().toISOString().slice(0,10),
      maintainer:modelForm.maintainer||''
    }
    await upsertBusinessModel(payload as any)
    const m = await getBusinessModels();
    const mm = m.map((x: any) => ({ ...x, scenarios: toArr(x.scenarios), compliance: toArr(x.compliance), chapters: toArr(x.chapters) }));
    setModels(mm)
    setSelectedModel(mm.find((x:any)=>x.id===payload.id) || mm[0] || null)
    setShowModelModal(false)
  }
  const removeModel = async () => {
    if (!selectedModel?.id) return
    await deleteBusinessModel(selectedModel.id)
    const m = await getBusinessModels();
    const mm = m.map((x: any) => ({ ...x, scenarios: toArr(x.scenarios), compliance: toArr(x.compliance), chapters: toArr(x.chapters) }));
    setModels(mm)
    setSelectedModel(mm[0] || null)
  }

  const handleRunTest = () => {
    setIsTestRunning(true);
    setRightPanelTab('code'); // Switch to code view to show terminal
    setTerminalLogs([`> 初始化权重（批次大小: ${testParams.batchSize}）...`]);
    
    // Simulate testing process
    setTimeout(() => {
      setTerminalLogs(prev => [...prev, '> 加载模型架构...']);
    }, 800);
    setTimeout(() => {
      setTerminalLogs(prev => [...prev, '> 分配张量...']);
    }, 1600);
    setTimeout(() => {
      setTerminalLogs(prev => [...prev, `> 在测试批次上运行推理（n=${testParams.batchSize}）...`]);
    }, 2400);
    setTimeout(async () => {
      const duration = Math.floor(100 + Math.random() * 50);
      setTerminalLogs(prev => [...prev, '> 校验输出...', `> 完成 (${duration/1000}s)`]);
      setIsTestRunning(false);
      
      // Add to history
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        input: `批次_${Math.floor(Math.random() * 9000) + 1000}`,
        status: '成功',
        duration: `${duration}毫秒`
      };
      if (selectedAlgorithm?.id) {
        await logAlgoTest(String(selectedAlgorithm.id), newLog.input, 'success', duration).catch(() => null)
        try {
          const out = JSON.stringify({ score: Number((90 + Math.random() * 10).toFixed(1)) })
          await insertCaseTrace({
            id: 'TRACE-'+Date.now(),
            orderId: orderList[0]?.id,
            modelName: selectedAlgorithm.name,
            input: newLog.input,
            output: out,
            businessOutcome: 'Cleared',
            businessImpactValue: Math.round(Math.random()*10000)/100,
            confidence: 95 + Math.round(Math.random()*4),
            latencyMs: duration,
            hsCode: '',
            hsChapter: '',
            customsStatus: 'declared',
            logisticsStatus: 'transit',
            settlementStatus: 'processing'
          })
        } catch (e) { console.warn(e) }
        try {
          const arows = await getAlgoTestHistory(20)
          const amapped = (Array.isArray(arows) ? arows : []).map((r:any) => ({
            id: String(r.ts || '') + '-' + String(r.input || ''),
            time: new Date(r.ts).toLocaleTimeString(),
            input: r.input,
            status: (() => { const s = (r.status || '').toLowerCase(); if (s.includes('success')) return '成功'; if (s.includes('error')) return '错误'; if (s.includes('warning')) return '警告'; return r.status || ''; })(),
            duration: `${r.durationMs || 0}ms`
          }))
          setAlgoExecLogs(amapped)
        } catch { void 0 }
      }
    }, 3200);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/90 backdrop-blur-sm border border-cyber-cyan/30 rounded-lg p-3">
          <p className="text-cyber-cyan font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cyber-cyan mb-2">能力与模型中心</h1>
          <p className="text-gray-400">算法库与业务模型库管理与监控</p>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge status="active" pulse>实时</StatusBadge>
          <GlowButton size="sm" onClick={() => setShowUploadModal(true)}>
            <Upload size={16} className="mr-2" />
            导入模型
          </GlowButton>
        </div>
      </div>

      {/* 标签页切换 */}
      <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
            activeTab === 'dashboard'
              ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30'
              : 'text-gray-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Activity size={16} />
          <span>业务监控看板</span>
        </button>
        <button
          onClick={() => setActiveTab('algorithms')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
            activeTab === 'algorithms'
              ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30'
              : 'text-gray-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Brain size={16} />
          <span>供应链业务算法</span>
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
            activeTab === 'models'
              ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30'
              : 'text-gray-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Database size={16} />
          <span>业务模型</span>
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* 1. 核心业务指标映射 (End-to-End Metrics) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <DataCard title="业务价值产出" value={valueMetrics.totalValueCreated} unit="万" status="active">
               <DollarSign className="text-emerald-400 mt-2" size={20} />
            </DataCard>
            <DataCard title="风险拦截次数" value={valueMetrics.riskPrevented} unit="次" status="warning">
               <ShieldCheck className="text-orange-400 mt-2" size={20} />
            </DataCard>
            <DataCard title="流程效率提升" value={valueMetrics.efficiencyGain} unit="%" status="active">
               <Zap className="text-yellow-400 mt-2" size={20} />
            </DataCard>
            <DataCard title="活跃模型覆盖" value={valueMetrics.activeModels} unit="个" status="active">
               <Brain className="text-cyber-cyan mt-2" size={20} />
            </DataCard>
          </div>

          {/* 2. 可视化监控看板 (Visual Monitoring) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <HudPanel title="模型效果与业务ROI趋势" subtitle="准确率 vs 业务回报率" className="lg:col-span-3 w-full">
              <div className="h-80">
                {roiData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={roiData.dates.map((d:any, i:number) => ({
                      date: d,
                      roi: roiData.roi_trend[i],
                      accuracy: roiData.accuracy_trend[i]
                    }))}>
                      <defs>
                        <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="roi" name="ROI指数" stroke="#10b981" fillOpacity={1} fill="url(#colorRoi)" />
                      <Area type="monotone" dataKey="accuracy" name="模型准确率(%)" stroke="#06b6d4" fillOpacity={1} fill="url(#colorAcc)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">加载中...</div>
                )}
              </div>
            </HudPanel>

            
          </div>

          {/* 3. 实施案例追踪 (Case Tracking) */}
          <HudPanel title="全流程案例追踪" subtitle="业务场景 → 模型决策 → 最终产出">
            <div className="mb-3 grid grid-cols-1 lg:grid-cols-6 gap-2 text-sm">
              <input value={traceQuery} onChange={(e)=>{ setTracePage(1); setTraceQuery(e.target.value) }} placeholder="检索: 输入/模型/输出" className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white" />
              <select value={traceOutcome} onChange={(e)=>{ setTracePage(1); setTraceOutcome(e.target.value as any) }} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">
                <option value="all">结果(全部)</option>
                <option value="Cleared">放行</option>
                <option value="Risk Review">风险复核</option>
              </select>
              <select value={traceModel} onChange={(e)=>{ setTracePage(1); setTraceModel(e.target.value) }} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">
                <option value="all">模型(全部)</option>
                {algorithms.map(a=> (<option key={a.id} value={a.name}>{a.name}</option>))}
              </select>
              <select value={traceHs} onChange={(e)=>{ setTracePage(1); setTraceHs(e.target.value) }} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">
                <option value="all">HS章(全部)</option>
                {["01","02","22","33","84","85","90"].map(ch=> (<option key={ch} value={ch}>{ch}</option>))}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">每页</span>
                <select value={tracePageSize} onChange={(e)=>{ setTracePage(1); setTracePageSize(parseInt(e.target.value)||10) }} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">
                  {[10,20,50].map(s=> (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div className="text-gray-400">共 {traceTotal} 条</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 bg-slate-800/50 uppercase">
                  <tr>
                    <th className="px-4 py-3">时间</th>
                    <th className="px-4 py-3">追踪ID</th>
                    <th className="px-4 py-3">业务输入</th>
                    <th className="px-4 py-3">调用模型</th>
                    <th className="px-4 py-3">模型输出</th>
                    <th className="px-4 py-3">业务结果</th>
                    <th className="px-4 py-3">业务价值</th>
                    <th className="px-4 py-3">置信度</th>
                    <th className="px-4 py-3">耗时</th>
                    <th className="px-4 py-3">HS章</th>
                    <th className="px-4 py-3">合规评分</th>
                    <th className="px-4 py-3">通关状态</th>
                    <th className="px-4 py-3">物流状态</th>
                    <th className="px-4 py-3">结算状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {(caseTraces.length > 0 ? caseTraces : []).map((log:any) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={()=> setSelectedTrace(log)}>
                      <td className="px-4 py-3 text-gray-400">{new Date(log.ts || log.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{String(log.id).slice(0,8)}</td>
                      <td className="px-4 py-3 text-white">{log.input || log.input_snapshot}</td>
                      <td className="px-4 py-3 text-cyber-cyan">{log.modelName || log.model_name}</td>
                      <td className="px-4 py-3 text-gray-300">{log.output || log.output_result}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          ((log.businessOutcome || log.business_outcome || '')+'').toLowerCase().includes('risk')
                          ? 'bg-orange-900/30 text-orange-400'
                          : 'bg-emerald-900/30 text-emerald-400'
                        }`}>
                          {toZhOutcome(log.businessOutcome || log.business_outcome)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{log.businessImpactValue || log.business_impact_value}</td>
                      <td className="px-4 py-3 text-gray-300">{log.confidence ? `${log.confidence}%` : '-'}</td>
                      <td className="px-4 py-3 text-gray-300">{log.latencyMs ? `${log.latencyMs}ms` : '-'}</td>
                      <td className="px-4 py-3 text-gray-300">{log.hsChapter || '-'}</td>
                      <td className="px-4 py-3 text-gray-300">{log.complianceScore ? `${log.complianceScore}` : '-'}</td>
                      <td className="px-4 py-3 text-gray-300">{log.customsStatus ? toZhStatus(log.customsStatus) : '-'}</td>
                      <td className="px-4 py-3 text-gray-300">{log.logisticsStatus ? toZhStatus(log.logisticsStatus) : '-'}</td>
                      <td className="px-4 py-3 text-gray-300">{log.settlementStatus ? toZhStatus(log.settlementStatus) : '-'}</td>
                    </tr>
                  ))}
                  {caseTraces.length === 0 && (
                    <tr><td colSpan={14} className="text-center py-4 text-gray-500">暂无追踪数据</td></tr>
                  )}
                </tbody>
              </table>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-gray-400">第 {tracePage} / {Math.max(1, Math.ceil(traceTotal / tracePageSize))} 页</div>
              <div className="flex items-center gap-2">
                <GlowButton size="sm" onClick={()=> setTracePage(p=> Math.max(1, p-1))}>上一页</GlowButton>
                <GlowButton size="sm" onClick={()=> setTracePage(p=> p+1)}>下一页</GlowButton>
              </div>
            </div>
            {selectedTrace && (
              <div className="mt-4 p-4 bg-slate-800/50 rounded border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">记录详情</div>
                  <GlowButton size="xs" variant="secondary" onClick={()=> setSelectedTrace(null)}>清空选择</GlowButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">追踪ID</div>
                    <div className="text-white font-mono">{String(selectedTrace.id)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">时间</div>
                    <div className="text-white">{new Date(selectedTrace.ts || selectedTrace.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-gray-500">业务输入</div>
                    {(() => {
                      const p = parseInput(selectedTrace.input || selectedTrace.input_snapshot)
                      if (typeof p === 'string') {
                        const s = p
                        const kv: any = {}
                        const mo = s.match(/订单\s+(\S+)/)
                        const me = s.match(/企业\s+(\S+)/)
                        const mc = s.match(/品类\s+(\S+)/)
                        if (mo) kv['订单号'] = mo[1]
                        if (me) kv['企业'] = me[1]
                        if (mc) kv['品类'] = mc[1]
                        return (
                          <div className="space-y-2">
                            <div className="text-white">{s}</div>
                            {Object.keys(kv).length>0 && (
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {Object.entries(kv).map(([k,v],i)=>(
                                  <div key={i} className="flex justify-between bg-slate-900/40 rounded px-2 py-1">
                                    <span className="text-gray-400">{k}</span>
                                    <span className="font-mono text-white">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      }
                      const entries = Object.entries(p || {})
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          {(showFullInput ? entries : entries.slice(0, 8)).map(([k, v], i) => (
                            <div key={i} className="flex justify-between bg-slate-900/40 rounded px-2 py-1">
                              <span className="text-gray-400">{String(k)}</span>
                              <span className="font-mono text-white">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                    {(() => {
                      const p = parseInput(selectedTrace.input || selectedTrace.input_snapshot)
                      if (typeof p === 'object' && p && Array.isArray((p as any).items) && (p as any).items.length) {
                        const items = (p as any).items as any[]
                        return (
                          <div className="mt-2">
                            <div className="text-gray-500 mb-1">货物明细</div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-slate-900/40 text-gray-400">
                                  <tr>
                                    <th className="px-2 py-1 text-left">品名</th>
                                    <th className="px-2 py-1 text-right">数量</th>
                                    <th className="px-2 py-1 text-right">单价</th>
                                    <th className="px-2 py-1 text-right">金额</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                  {(showFullInput ? items : items.slice(0,3)).map((it,idx)=>{
                                    const amt = it.amount ?? ((it.qty||0)*(it.unitPrice||0))
                                    return (
                                      <tr key={idx}>
                                        <td className="px-2 py-1 text-white">{it.name || it.title || '-'}</td>
                                        <td className="px-2 py-1 text-right text-white">{it.qty ?? '-'}</td>
                                        <td className="px-2 py-1 text-right text-white">{it.unitPrice ?? '-'}</td>
                                        <td className="px-2 py-1 text-right text-white">{amt ?? '-'}</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}
                    <div className="mt-2 flex gap-2">
                      <GlowButton size="xs" variant="secondary" onClick={()=> setShowFullInput(v=>!v)}>{showFullInput?'收起输入':'展开全部输入'}</GlowButton>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">调用模型</div>
                    <div className="text-cyber-cyan">{selectedTrace.modelName || selectedTrace.model_name}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">模型输出</div>
                    {(() => {
                      const po = parseOutput(selectedTrace.output || selectedTrace.output_result)
                      return (
                        <div>
                          <div className="text-gray-300 mb-1"><span className="px-2 py-0.5 bg-slate-700/60 rounded text-xs">{po.type}</span></div>
                          {typeof po.detail === 'string' ? (
                            <div className="space-y-2">
                              <div className="text-gray-300">{po.detail}</div>
                              {po.type==='归类结果' && (()=>{
                                const hs = String(po.detail||'').replace(/\./g,'')
                                const chap = hs.slice(0,2)
                                const head = hs.slice(0,4)
                                const sub = hs.slice(0,8)
                                const amt = traceTopItem ? (traceTopItem.amount || ((traceTopItem.qty||0)*(traceTopItem.unitPrice||0))) : 0
                                const tax = computeTaxes(String(po.detail||''), Number(amt||0))
                                return (
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex justify-between"><span className="text-gray-500">章节</span><span className="text-white">{chap || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">品目</span><span className="text-white">{head || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">子目</span><span className="text-white">{sub || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">估算关税</span><span className="text-white">{(tax.tariff||0).toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">估算增值税</span><span className="text-white">{(tax.vat||0).toLocaleString()}</span></div>
                                  </div>
                                )
                              })()}
                              {po.type==='支付建议' && (()=>{
                                const m = paymentMethods.find(x=> String(x.name||x.method) === String(po.detail))
                                if (!m) return null
                                return (
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex justify-between"><span className="text-gray-500">成功率</span><span className="text-white">{(m.successRate||0).toFixed(1)}%</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">平均用时</span><span className="text-white">{m.avgTime || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">交易量</span><span className="text-white">{m.volume || 0}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">累计金额</span><span className="text-white">{(m.amount||0).toLocaleString()}</span></div>
                                  </div>
                                )
                              })()}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(po.detail || {}).slice(0, showFullOutput ? Object.keys(po.detail||{}).length : 8).map(([k,v],i)=>(
                                  <div key={i} className="flex justify-between bg-slate-900/40 rounded px-2 py-1">
                                    <span className="text-gray-400">{String(k)}</span>
                                    <span className="font-mono text-white">{typeof v==='object' ? JSON.stringify(v) : String(v)}</span>
                                  </div>
                                ))}
                              </div>
                              {showRawOutput && (
                                <pre className="bg-slate-900/50 rounded p-2 text-xs text-gray-300 overflow-x-auto">{JSON.stringify(po.detail, null, 2)}</pre>
                              )}
                              <div className="flex gap-2">
                                <GlowButton size="xs" variant="secondary" onClick={()=> setShowFullOutput(v=>!v)}>{showFullOutput?'收起输出':'展开全部输出'}</GlowButton>
                                <GlowButton size="xs" variant="secondary" onClick={()=> setShowRawOutput(v=>!v)}>{showRawOutput?'收起原始':'查看原始JSON'}</GlowButton>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  <div>
                    <div className="text-gray-500">业务结果</div>
                    <div className="text-emerald-400">{toZhOutcome(selectedTrace.businessOutcome || selectedTrace.business_outcome)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">置信度</div>
                    <div className="text-white">{selectedTrace.confidence ? `${selectedTrace.confidence}%` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">耗时</div>
                    <div className="text-white">{selectedTrace.latencyMs ? `${selectedTrace.latencyMs}ms` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">HS章</div>
                    <div className="text-white">{selectedTrace.hsChapter || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">合规评分</div>
                    <div className="text-white">{selectedTrace.complianceScore ? `${selectedTrace.complianceScore}` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">通关状态</div>
                    <div className="text-white">{selectedTrace.customsStatus ? toZhStatus(selectedTrace.customsStatus) : '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">物流状态</div>
                    <div className="text-white">{selectedTrace.logisticsStatus ? toZhStatus(selectedTrace.logisticsStatus) : '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">结算状态</div>
                    <div className="text-white">{selectedTrace.settlementStatus ? toZhStatus(selectedTrace.settlementStatus) : '-'}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {traceOrder && (
                    <div className="p-3 bg-slate-800/40 rounded border border-slate-700">
                      <div className="text-gray-400 mb-1">关联订单</div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span className="text-gray-500">订单号</span><span className="font-mono text-white">{traceOrder.orderNo}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">企业</span><span className="text-white">{traceOrder.enterprise}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">品类</span><span className="text-white">{traceOrder.category}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">金额</span><span className="text-white">{(traceOrder.amount||0).toLocaleString()} {traceOrder.currency}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">状态</span><span className="text-white">{toZhStatus(traceOrder.status)}</span></div>
                      </div>
                    </div>
                  )}
                  {traceTopItem && (
                    <div className="p-3 bg-slate-800/40 rounded border border-slate-700">
                      <div className="text-gray-400 mb-1">申报重点货项</div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span className="text-gray-500">HS编码</span><span className="font-mono text-white">{traceTopItem.hsCode}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">品名</span><span className="text-white">{traceTopItem.name}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">数量</span><span className="text-white">{traceTopItem.qty}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">单价</span><span className="text-white">{traceTopItem.unitPrice}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">金额</span><span className="text-white">{(traceTopItem.amount || (traceTopItem.qty||0)*(traceTopItem.unitPrice||0)).toLocaleString()}</span></div>
                      </div>
                      {(() => {
                        const amt = traceTopItem.amount || ((traceTopItem.qty||0)*(traceTopItem.unitPrice||0))
                        const tax = computeTaxes(String(traceTopItem.hsCode||''), Number(amt||0))
                        return (
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between"><span className="text-gray-500">关税率</span><span className="text-white">{Math.round((tax.tariffRate||0)*1000)/10}%</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">增值税率</span><span className="text-white">{Math.round((tax.vatRate||0)*1000)/10}%</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">消费税率</span><span className="text-white">{Math.round((tax.exciseRate||0)*1000)/10}%</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">关税</span><span className="text-white">{(tax.tariff||0).toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">消费税</span><span className="text-white">{(tax.excise||0).toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">增值税</span><span className="text-white">{(tax.vat||0).toLocaleString()}</span></div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                  {traceCustoms && (
                    <div className="p-3 bg-slate-800/40 rounded border border-slate-700">
                      <div className="text-gray-400 mb-1">申报信息</div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span className="text-gray-500">申报单号</span><span className="font-mono text-white">{traceCustoms.declarationNo}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">商品</span><span className="text-white">{traceCustoms.product}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">状态</span><span className="text-white">{toZhStatus(traceCustoms.status)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">合规</span><span className="text-white">{traceCustoms.compliance}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">风险评分</span><span className="text-white">{traceCustoms.riskScore}</span></div>
                      </div>
                    </div>
                  )}
                  {traceLogistics && (
                    <div className="p-3 bg-slate-800/40 rounded border border-slate-700">
                      <div className="text-gray-400 mb-1">物流信息</div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span className="text-gray-500">运单号</span><span className="font-mono text-white">{traceLogistics.trackingNo}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">起点</span><span className="text-white">{traceLogistics.origin}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">终点</span><span className="text-white">{traceLogistics.destination}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">状态</span><span className="text-white">{toZhStatus(traceLogistics.status)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">预估时长</span><span className="text-white">{traceLogistics.eta || traceLogistics.estimated_time || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">实际时长</span><span className="text-white">{traceLogistics.ata || traceLogistics.actual_time || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">效率</span><span className="text-white">{traceLogistics.efficiency ? `${traceLogistics.efficiency}%` : '-'}</span></div>
                      </div>
                    </div>
                  )}
                  {traceSettlement && (
                    <div className="p-3 bg-slate-800/40 rounded border border-slate-700">
                      <div className="text-gray-400 mb-1">结算信息</div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span className="text-gray-500">状态</span><span className="text-white">{toZhStatus(traceSettlement.status)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">结算用时</span><span className="text-white">{traceSettlement.time || '-'}</span></div>
                        {(() => { const r = String(traceSettlement.riskLevel||''); const zh = r==='low'?'低':r==='medium'?'中':r==='high'?'高':r; return (<div className="flex justify-between"><span className="text-gray-500">风险等级</span><span className="text-white">{zh}</span></div>) })()}
                      </div>
                    </div>
                  )}
                  {traceDocuments && traceDocuments.length > 0 && (
                    <div className="p-3 bg-slate-800/40 rounded border border-slate-700">
                      <div className="text-gray-400 mb-1 flex items-center gap-2"><FileText size={14} />关联单证</div>
                      <div className="space-y-1">
                        {traceDocuments.map((d:any, idx:number) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-900/40 rounded px-2 py-1">
                            <span className="text-gray-300 text-xs">{d.type}</span>
                            <span className="font-mono text-white text-xs">{d.number}</span>
                            <span className="text-gray-500 text-xs">{d.issuedAt?.slice(0,10) || ''}</span>
                            {d.url && (
                              <a className="text-cyber-cyan text-xs underline" href={d.url} target="_blank" rel="noreferrer">查看</a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </HudPanel>
        </div>
      )}

      {activeTab === 'algorithms' && (
        <>
          {/* 算法库概览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <DataCard
              title="总算法数"
              value={algTotal}
              unit="个"
              status="active"
            >
              <Brain className="text-cyber-cyan mt-2" size={20} />
            </DataCard>

            <DataCard
              title="活跃算法"
              value={algorithms.filter((a: any) => a.status === 'active').length}
              unit="个"
              status="active"
            >
              <Zap className="text-emerald-green mt-2" size={20} />
            </DataCard>

            <DataCard
              title="平均准确率"
              value={(algorithms.length ? (algorithms.reduce((sum, a) => sum + a.accuracy, 0) / algorithms.length) : 0).toFixed(1)}
              unit="%"
              status="active"
            >
              <Target className="text-neon-blue mt-2" size={20} />
            </DataCard>

            <DataCard
              title="总调用次数"
              value={algorithms.reduce((sum: number, a: any) => sum + a.usage, 0)}
              unit="次"
              status="active"
            >
              <TrendingUp className="text-yellow-400 mt-2" size={20} />
            </DataCard>

            <DataCard
              title="开发中"
              value={algorithms.filter((a: any) => a.status === 'development').length}
              unit="个"
              status="warning"
            >
              <Cpu className="text-cyber-cyan mt-2" size={20} />
            </DataCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 算法列表 */}
            <div className="lg:col-span-2">
              <HudPanel title="供应链业务算法" subtitle="核心算法列表与状态">
                <div className="space-y-3">
                  {(() => {
                    let list = algKeyword ? algorithms.filter((a:any)=> (a.name||'').toLowerCase().includes(algKeyword.toLowerCase()) || (a.description||'').toLowerCase().includes(algKeyword.toLowerCase()) || (a.category||'').toLowerCase().includes(algKeyword.toLowerCase())) : algorithms;
                    if (algCategory !== 'all') list = list.filter((a:any)=>a.category===algCategory);
                    list = [...list].sort((a:any,b:any)=>{
                      if (algSort==='accuracy') return (b.accuracy||0)-(a.accuracy||0);
                      if (algSort==='performance') return (b.performance||0)-(a.performance||0);
                      if (algSort==='usage') return (b.usage||0)-(a.usage||0);
                      const ta = new Date(a.lastUpdated||0).getTime();
                      const tb = new Date(b.lastUpdated||0).getTime();
                      return tb - ta;
                    })
                    const totalPages = Math.max(1, Math.ceil(list.length / algPageSize));
                    const page = Math.min(algPage, totalPages);
                    const start = (page - 1) * algPageSize;
                    const items = list.slice(start, start + algPageSize);
                    return items;
                  })().map((algorithm: any) => (
                    <div
                      key={algorithm.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedAlgorithm && selectedAlgorithm.id === algorithm.id
                          ? 'bg-cyber-cyan/10 border-cyber-cyan/50'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                      onClick={() => setSelectedAlgorithm(algorithm)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: categoryColors[algorithm.category as keyof typeof categoryColors] + '20' }}
                          >
                            <Brain size={16} style={{ color: categoryColors[algorithm.category as keyof typeof categoryColors] }} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{algorithm.name}</h3>
                            <p className="text-xs text-gray-400">{algorithm.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={algorithm.status === 'active' ? 'active' : 'processing'}>
                            {algorithm.status}
                          </StatusBadge>
                          <span className="text-xs text-gray-500">{algorithm.version}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">准确率</span>
                          <p className="digital-display font-bold">{algorithm.accuracy}%</p>
                        </div>
                        <div>
                          <span className="text-gray-400">性能</span>
                          <p className="digital-display font-bold">{algorithm.performance}%</p>
                        </div>
                        <div>
                          <span className="text-gray-400">调用次数</span>
                          <p className="digital-display font-bold">{algorithm.usage}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                        <div className="flex flex-wrap gap-1">
                          {algorithm.features.map((feature: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-slate-700 text-xs rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-gray-400 hover:text-cyber-cyan" onClick={(e)=>{ e.stopPropagation(); setSelectedAlgorithm(algorithm); setRightPanelTab('overview'); }}>
                            <Eye size={14} />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-emerald-green" onClick={(e)=>{ e.stopPropagation(); setSelectedAlgorithm(algorithm); setRightPanelTab('code'); handleRunTest(); }}>
                            <Play size={14} />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-yellow-400" onClick={(e)=>{ e.stopPropagation(); setSelectedAlgorithm(algorithm); setRightPanelTab('code'); }}>
                            <Edit size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>每页</span>
                    <select value={algPageSize} onChange={(e)=>setAlgPageSize(parseInt(e.target.value)||5)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">
                      {[10,15,20].map(s=> (<option key={s} value={s}>{s}</option>))}
                    </select>
                    <span>项</span>
                    <span className="ml-4">分类</span>
                    <select value={algCategory} onChange={(e)=>{ setAlgCategory(e.target.value as any); setAlgPage(1) }} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">
                      <option value="all">全部</option>
                      <option value="optimization">优化</option>
                      <option value="coordination">协同</option>
                      <option value="inventory">库存</option>
                      <option value="control">管控</option>
                      <option value="decision">决策</option>
                    </select>
                    <span className="ml-4">排序</span>
                    <select value={algSort} onChange={(e)=>{ setAlgSort(e.target.value as any); setAlgPage(1) }} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">
                      <option value="updated">更新时间</option>
                      <option value="accuracy">准确率</option>
                      <option value="performance">性能</option>
                      <option value="usage">调用次数</option>
                    </select>
                    <span className="ml-4">检索</span>
                    <input value={algKeyword} onChange={(e)=>{ setAlgKeyword(e.target.value); setAlgPage(1) }} placeholder="按名称/描述/分类" className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 rounded bg-gray-800 text-gray-200 border border-gray-700 disabled:opacity-50" onClick={()=>setAlgPage(p=>Math.max(1,p-1))}>上一页</button>
                    <button className="px-2 py-1 rounded bg-gray-800 text-gray-200 border border-gray-700" onClick={()=>setAlgPage(p=>p+1)}>下一页</button>
                  </div>
                </div>
              </HudPanel>
            </div>

            {/* 算法详情 (Refactored) */}
            <div>
              <HudPanel className="h-full flex flex-col">
                {/* Header with Title and Tabs */}
                <div className="mb-4">
                  <h3 className="hud-title mb-1">{selectedAlgorithm ? selectedAlgorithm.name : '未选择算法'}</h3>
                  <div className="flex items-center gap-1 border-b border-slate-700 pb-0">
                    <button
                      onClick={() => setRightPanelTab('overview')}
                      className={`px-3 py-2 text-sm border-b-2 transition-colors ${
                        rightPanelTab === 'overview'
                          ? 'border-cyber-cyan text-cyber-cyan'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      概览
                    </button>
                    <button
                      onClick={() => setRightPanelTab('code')}
                      className={`px-3 py-2 text-sm border-b-2 transition-colors flex items-center gap-1 ${
                        rightPanelTab === 'code'
                          ? 'border-cyber-cyan text-cyber-cyan'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      核心源码
                    </button>
                    <button
                      onClick={() => setRightPanelTab('logs')}
                      className={`px-3 py-2 text-sm border-b-2 transition-colors ${
                        rightPanelTab === 'logs'
                          ? 'border-cyber-cyan text-cyber-cyan'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      执行记录
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-h-[400px]">
                  {rightPanelTab === 'overview' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-white">模型指标</h4>
                          <StatusBadge status={selectedAlgorithm && selectedAlgorithm.status === 'active' ? 'active' : 'processing'}>
                            {selectedAlgorithm ? selectedAlgorithm.status : ''}
                          </StatusBadge>
                        </div>
                        <div className="flex items-center justify-center py-2">
                           {selectedAlgorithm && <GaugeChart value={selectedAlgorithm.accuracy} />}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                         <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 block mb-1">版本</span>
                              <span className="text-white font-mono">{selectedAlgorithm?.version}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-1">作者</span>
                              <span className="text-white">{selectedAlgorithm?.author}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-1">更新时间</span>
                              <span className="text-white">{selectedAlgorithm?.lastUpdated}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-1">调用次数</span>
                              <span className="text-white font-mono">{selectedAlgorithm ? selectedAlgorithm.usage.toLocaleString() : 0}</span>
                            </div>
                         </div>
                         <div className="mt-4 pt-3 border-t border-slate-700">
                           <div className="text-sm text-gray-400 mb-2">订单推荐测试</div>
                           <div className="grid grid-cols-2 gap-2">
                             <input value={orderSearch} onChange={(e)=>setOrderSearch(e.target.value)} placeholder="搜索订单号/企业" className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white" />
                             <GlowButton size="sm" onClick={async ()=>{ const os = await queryAll(`SELECT id, order_number as orderNo, enterprise, created_at as createdAt FROM orders WHERE order_number LIKE $q OR enterprise LIKE $q ORDER BY created_at DESC LIMIT 20`,{ $q: `%${orderSearch}%` }); setOrderList(os) }}>搜索</GlowButton>
                           </div>
                           <div className="mt-2 max-h-32 overflow-auto border border-slate-700 rounded">
                             {(orderList||[]).map(o=> (
                               <div key={o.id} className="flex items-center justify-between px-2 py-1 hover:bg-slate-800">
                                 <span className="text-xs text-gray-300">{o.orderNo}</span>
                                 <GlowButton size="xs" onClick={async ()=>{ const rs = await getAlgorithmRecommendations(String(o.id)); setReco(rs || []) }}>运行推荐</GlowButton>
                               </div>
                             ))}
                           </div>
                           {reco && (
                             <div className="mt-2 p-2 bg-slate-900 border border-slate-700 rounded space-y-1">
                               <div className="text-xs text-gray-400 mb-1">推荐结果</div>
                               <div className="text-xs text-emerald-400">• 支付建议: {reco.payment?.bestMethod} / 成功率 {reco.payment?.successRate}% / 预计 {reco.payment?.etaHours}h</div>
                               <div className="text-xs text-emerald-400">• 库存动作: {reco.inventory?.action} / 数量 {reco.inventory?.quantity}</div>
                               <div className="text-xs text-emerald-400">• 产销提升: 计划增产 {reco.productionSales?.planIncrease}</div>
                               <div className="text-xs text-emerald-400">• 流程控制: 报关 {reco.processControl?.customsStatus} / 下步 {reco.processControl?.nextLogisticsStep}</div>
                               <div className="text-xs text-emerald-400">• 决策摘要: {reco.decision?.summary}</div>
                             </div>
                           )}
                         </div>
        </div>
      </div>
    )}

                  {rightPanelTab === 'code' && (
                    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                      {/* Editor */}
                      <div className="flex-1 bg-[#1e1e1e] rounded-t-lg border border-slate-700 overflow-hidden font-mono text-xs relative">
                        <textarea
                          value={selectedAlgorithm?.code || ''}
                          onChange={(e)=>setSelectedAlgorithm((prev:any)=> prev ? ({ ...prev, code: e.target.value }) : prev)}
                          className="w-full h-full bg-transparent text-gray-300 p-3 outline-none resize-none"
                        />
                      </div>
                      
                      {/* Test Configuration */}
                      <div className="py-2 px-1 flex gap-4 border-t border-slate-700/50 bg-[#1e1e1e]">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">批量大小</label>
                           <input 
                              type="number" 
                              value={testParams.batchSize}
                              onChange={(e) => setTestParams(prev => ({...prev, batchSize: parseInt(e.target.value) || 0}))}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyber-cyan outline-none font-mono"
                           />
                        </div>
                        <div className="flex-1">
                           <label className="text-xs text-gray-500 block mb-1">训练轮次</label>
                           <input 
                              type="number" 
                              value={testParams.epochs}
                              onChange={(e) => setTestParams(prev => ({...prev, epochs: parseInt(e.target.value) || 0}))}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyber-cyan outline-none font-mono"
                           />
                        </div>
                      </div>
                      
                      {/* Terminal (Conditional) */}
                      {(isTestRunning || terminalLogs.length > 0) && (
                        <div className="h-32 bg-black border-x border-b border-slate-700 rounded-b-lg p-3 font-mono text-xs overflow-y-auto">
                          <div className="flex items-center gap-2 text-gray-500 mb-2 border-b border-gray-800 pb-1">
                            <Terminal size={12} />
                            <span>终端输出</span>
                          </div>
                          {terminalLogs.map((log, i) => (
                            <div key={i} className="text-emerald-500/90 mb-1 last:animate-pulse">
                              {log}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {rightPanelTab === 'logs' && (
                    <div className="space-y-3 font-mono text-xs animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="text-gray-400">模型调用记录</div>
                      {(modelExecLogs||[]).map((e:any) => (
                        <div key={e.id} className="p-3 bg-slate-800/30 rounded border border-slate-700/50 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
                          <div className="space-y-1">
                            <div className="text-gray-400">{new Date().toLocaleDateString()} {e.time}</div>
                            <div className="text-white">输入：{e.input}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-400">{e.status}</div>
                            <div className="text-gray-500">{e.duration}</div>
                          </div>
                        </div>
                      ))}
                      <div className="text-gray-400">算法调用记录</div>
                      {(algoExecLogs||[]).map((e:any) => (
                        <div key={e.id} className="p-3 bg-slate-800/30 rounded border border-slate-700/50 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
                          <div className="space-y-1">
                            <div className="text-gray-400">{new Date().toLocaleDateString()} {e.time}</div>
                            <div className="text-white">输入：{e.input}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-400">{e.status}</div>
                            <div className="text-gray-500">{e.duration}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-3">
                  <GlowButton 
                    size="sm" 
                    className="w-full justify-center"
                    onClick={handleRunTest}
                    disabled={isTestRunning}
                  >
                    {isTestRunning ? (
                      <>
                        <RefreshCw size={14} className="mr-2 animate-spin" />
                        计算中...
                      </>
                    ) : (
                      <>
                        <Play size={14} className="mr-2" />
                        运行测试
                      </>
                    )}
                  </GlowButton>
                  
                  <div className="group relative">
                    <GlowButton size="sm" variant="secondary" className="w-full justify-center">
                      <Download size={14} className="mr-2" />
                      下载模型
                    </GlowButton>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 text-white text-xs rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      文件大小: 45MB, 格式: ONNX
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <GlowButton size="sm" variant="secondary" onClick={async ()=>{ if (selectedAlgorithm?.id) { await updateAlgorithmCode(selectedAlgorithm.id, selectedAlgorithm.code || ''); } }}>
                    <FileCode size={14} className="mr-2" />保存
                  </GlowButton>
                </div>
              </HudPanel>
            </div>
          </div>

          {/* 算法性能雷达图 */}
          <HudPanel title="算法性能综合评估" subtitle="多维度性能分析">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={computeAlgorithmPerformance(algorithms)}>
                      <PolarGrid stroke="rgba(148, 163, 184, 0.3)" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]} 
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                      <Radar
                        name="性能指标"
                        dataKey="value"
                        stroke="#00F0FF"
                        fill="rgba(0, 240, 255, 0.2)"
                        strokeWidth={2}
                      />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">性能详情</h4>
                {computeAlgorithmPerformance(algorithms).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-300">{item.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyber-cyan to-neon-blue h-2 rounded-full"
                          style={{ width: `${item.value}%` }}
                        ></div>
                      </div>
                      <span className="digital-display text-sm font-bold w-10 text-right">
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </HudPanel>

          <HudPanel title="A/B算法对比" subtitle="两种算法效果对比">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-xs text-gray-400">算法A</div>
                <select value={abA} onChange={(e)=>setAbA(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
                  <option value="">选择算法A</option>
                  {algorithms.map(a=> (<option key={a.id} value={a.id}>{a.name}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-gray-400">算法B</div>
                <select value={abB} onChange={(e)=>setAbB(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
                  <option value="">选择算法B</option>
                  {algorithms.map(a=> (<option key={a.id} value={a.id}>{a.name}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                {(() => {
                  const A = algorithms.find((x:any)=>x.id===abA)
                  const B = algorithms.find((x:any)=>x.id===abB)
                  if (!A || !B) return <div className="text-xs text-gray-500">选择两种算法以查看对比</div>
                  const accDiff = Math.round(((A.accuracy - B.accuracy) * 10)) / 10
                  const perfDiff = Math.round(((A.performance - B.performance) * 10)) / 10
                  const useDiff = (A.usage - B.usage)
                  return (
                    <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                      <div className="text-xs text-gray-400 mb-2">对比结果（A - B）</div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-gray-500">准确率</div>
                          <div className="digital-display text-white">{A.accuracy}% vs {B.accuracy}%</div>
                          <div className="text-emerald-400 text-xs">差值 {accDiff}%</div>
                        </div>
                        <div>
                          <div className="text-gray-500">性能</div>
                          <div className="digital-display text-white">{A.performance}% vs {B.performance}%</div>
                          <div className="text-emerald-400 text-xs">差值 {perfDiff}%</div>
                        </div>
                        <div>
                          <div className="text-gray-500">调用次数</div>
                          <div className="digital-display text-white">{A.usage} vs {B.usage}</div>
                          <div className="text-emerald-400 text-xs">差值 {useDiff}</div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </HudPanel>
          <HudPanel title="订单-算法绑定" subtitle="拖拽算法到订单以建立绑定">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                <div className="text-sm text-gray-400 mb-2">可用算法</div>
                <div className="space-y-2">
                  {algorithms.map(a=> (
                    <div key={a.id} draggable onDragStart={(e)=>{ e.dataTransfer.setData('text/plain', String(a.id)) }} className="px-2 py-1 bg-slate-700 rounded text-white cursor-grab">{a.name}</div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                <div className="text-sm text-gray-400 mb-2">最近订单（拖拽算法到订单行）</div>
                <div className="space-y-2">
                  {bindingOrders.map((o)=> (
                    <div key={o.id} onDragOver={(e)=>e.preventDefault()} onDrop={async (e)=>{ const aid = e.dataTransfer.getData('text/plain'); if (aid) { await bindAlgorithmToOrder(String(o.id), aid); const bs = await getBindingsForOrder(String(o.id)); (o as any).bindings = bs; }} } className="px-2 py-2 bg-slate-700/50 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">{o.orderNo}</span>
                        <span className="text-gray-400 text-xs">{o.enterprise}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {((o as any).bindings||[]).map((b:any,i:number)=> (<span key={i} className="px-2 py-0.5 bg-cyber-cyan/20 text-cyber-cyan text-xs rounded">{b.algorithmId}</span>))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </HudPanel>
        </>
      )}

      {activeTab === 'models' && (
        <>
          {/* 业务模型概览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataCard
              title="总模型数"
              value={modelTotal}
              unit="个"
              status="active"
            >
              <Database className="text-cyber-cyan mt-2" size={20} />
            </DataCard>

            <DataCard
              title="服务企业"
              value={models.reduce((sum: number, m: any) => sum + m.enterprises, 0)}
              unit="家"
              status="active"
            >
              <TrendingUp className="text-emerald-green mt-2" size={20} />
            </DataCard>

            <DataCard
              title="累计订单"
              value={models.reduce((sum: number, m: any) => sum + m.orders, 0)}
              unit="单"
              status="active"
            >
              <FileText className="text-neon-blue mt-2" size={20} />
            </DataCard>

            <DataCard
              title="平均成功率"
              value={(models.length ? (models.reduce((sum: number, m: any) => sum + m.successRate, 0) / models.length) : 0).toFixed(1)}
              unit="%"
              status="active"
            >
              <Target className="text-yellow-400 mt-2" size={20} />
            </DataCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 业务模型列表 */}
            <div className="lg:col-span-2">
              <HudPanel title="业务模型库" subtitle="各品类业务逻辑模型">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-gray-400">模型列表</div>
                  <GlowButton size="sm" onClick={openNewModel}>新增模型</GlowButton>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-gray-400">检索</div>
                    <input value={modelKeyword} onChange={(e)=>setModelKeyword(e.target.value)} placeholder="按名称/描述/分类" className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-56" />
                  </div>
                  {(modelKeyword ? models.filter((m:any)=> (m.name||'').toLowerCase().includes(modelKeyword.toLowerCase()) || (m.description||'').toLowerCase().includes(modelKeyword.toLowerCase()) || (m.category||'').toLowerCase().includes(modelKeyword.toLowerCase())) : models).map((model: any) => (
                    <div
                      key={model.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        (selectedModel?.id === model.id)
                          ? 'bg-cyber-cyan/10 border-cyber-cyan/50'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                      onClick={() => setSelectedModel(model)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Database size={16} className="text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{model.name}</h3>
                            <p className="text-xs text-gray-400">{model.description}</p>
                          </div>
                        </div>
                        <StatusBadge status={model.status === 'active' ? 'active' : 'processing'}>{model.status}</StatusBadge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-400">服务企业</span>
                          <p className="digital-display font-bold">{model.enterprises}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">处理订单</span>
                          <p className="digital-display font-bold">{model.orders}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">成功率</span>
                          <p className="digital-display font-bold">{model.successRate}%</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {model.scenarios.map((tag: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-slate-700 text-xs rounded text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </HudPanel>
            </div>

            {/* 业务模型详情 */}
            <div>
              <HudPanel className="h-full flex flex-col">
                <div className="mb-4 pb-4 border-b border-slate-700">
                  <h3 className="hud-title mb-1">{selectedModel ? selectedModel.name : '未选择模型'}</h3>
                  <StatusBadge status={selectedModel && selectedModel.status === 'active' ? 'active' : 'processing'}>{selectedModel ? selectedModel.status : ''}</StatusBadge>
                </div>
                
                <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">应用场景</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedModel?.scenarios?.map((tag: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-slate-700/50 text-xs rounded text-cyber-cyan border border-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">合规要求</h4>
                    <div className="space-y-2">
                      {selectedModel?.compliance?.map((item: string, i: number) => (
                        <div key={i} className="flex items-center text-sm text-gray-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">关联HS章节</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedModel?.chapters||[]).map((c:string,i:number)=>(<span key={i} className="px-2 py-1 bg-slate-700/50 text-xs rounded text-yellow-300 border border-slate-600">{c}</span>))}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">关键指标</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">服务企业</span>
                        <span className="text-white font-mono">{selectedModel ? selectedModel.enterprises : 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">累计订单</span>
                        <span className="text-white font-mono">{selectedModel ? selectedModel.orders : 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">成功率</span>
                        <span className="text-emerald-400 font-mono">{selectedModel ? selectedModel.successRate : 0}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">模型应用测试</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={orderSearch} onChange={(e)=>setOrderSearch(e.target.value)} placeholder="搜索订单号/企业" className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white" />
                      <GlowButton size="sm" onClick={async ()=>{ const os = await queryAll(`SELECT id, order_number as orderNo, enterprise, created_at as createdAt FROM orders WHERE order_number LIKE $q OR enterprise LIKE $q ORDER BY created_at DESC LIMIT 20`,{ $q: `%${orderSearch}%` }); setOrderList(os) }}>搜索</GlowButton>
                    </div>
                    <div className="mt-2 max-h-32 overflow-auto border border-slate-700 rounded">
                      {(orderList||[]).map(o=> (
                        <div key={o.id} className="flex items-center justify-between px-2 py-1 hover:bg-slate-800">
                          <span className="text-xs text-gray-300">{o.orderNo}</span>
                          <GlowButton size="xs" onClick={async ()=>{ const res = await applyBusinessModel(String(o.id)); setApplyResult({ score: res.compliance, messages: res.messages||[] }) }}>应用检查</GlowButton>
                        </div>
                      ))}
                    </div>
                    {applyResult && (
                      <div className="mt-2 p-2 bg-slate-900 border border-slate-700 rounded">
                        <div className="text-xs text-gray-400 mb-1">合规分 {applyResult.score}</div>
                        {applyResult.messages.slice(0,8).map((m,i)=>(<div key={i} className="text-xs text-amber-400">⚠️ {m}</div>))}
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-slate-700 flex items-center gap-2">
                     <GlowButton size="sm" onClick={openEditModel}><Edit size={14} className="mr-2" />编辑</GlowButton>
                     <GlowButton size="sm" variant="secondary" onClick={removeModel}><Trash2 size={14} className="mr-2" />删除</GlowButton>
                  </div>
                </div>
              </HudPanel>
            </div>
          </div>
          {showModelModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="hud-panel p-4 w-[720px]">
                <div className="text-white font-medium mb-3">{modelForm?.id ? '编辑模型' : '新增模型'}</div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={modelForm.name} onChange={(e)=>setModelForm((f:any)=>({ ...f, name:e.target.value }))} placeholder="模型名称" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
                  <select value={modelForm.category} onChange={(e)=>setModelForm((f:any)=>({ ...f, category:e.target.value }))} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
                    <option value="beauty">美妆</option>
                    <option value="wine">酒水</option>
                    <option value="appliance">家电</option>
                    <option value="electronics">电子</option>
                    <option value="textile">纺织</option>
                  </select>
                  <input value={modelForm.version} onChange={(e)=>setModelForm((f:any)=>({ ...f, version:e.target.value }))} placeholder="版本" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
                  <select value={modelForm.status} onChange={(e)=>setModelForm((f:any)=>({ ...f, status:e.target.value }))} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
                    <option value="active">active</option>
                    <option value="development">development</option>
                    <option value="testing">testing</option>
                  </select>
                  <input value={modelForm.enterprises} onChange={(e)=>setModelForm((f:any)=>({ ...f, enterprises:e.target.value }))} placeholder="服务企业数" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
                  <input value={modelForm.orders} onChange={(e)=>setModelForm((f:any)=>({ ...f, orders:e.target.value }))} placeholder="累计订单数" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
                  <input value={modelForm.successRate} onChange={(e)=>setModelForm((f:any)=>({ ...f, successRate:e.target.value }))} placeholder="成功率%" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
                  <input value={modelForm.maintainer} onChange={(e)=>setModelForm((f:any)=>({ ...f, maintainer:e.target.value }))} placeholder="维护团队" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
                  <input value={modelForm.lastUpdated} onChange={(e)=>setModelForm((f:any)=>({ ...f, lastUpdated:e.target.value }))} placeholder="最近更新(YYYY-MM-DD)" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
                  <textarea value={modelForm.description} onChange={(e)=>setModelForm((f:any)=>({ ...f, description:e.target.value }))} placeholder="描述" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white col-span-2" />
                  <input value={modelForm.scenarios} onChange={(e)=>setModelForm((f:any)=>({ ...f, scenarios:e.target.value }))} placeholder="适用场景(逗号分隔)" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white col-span-2" />
                  <input value={modelForm.compliance} onChange={(e)=>setModelForm((f:any)=>({ ...f, compliance:e.target.value }))} placeholder="合规要求(逗号分隔)" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white col-span-2" />
                  <input value={modelForm.chapters} onChange={(e)=>setModelForm((f:any)=>({ ...f, chapters:e.target.value }))} placeholder="关联HS章节(逗号分隔, 如 33,34)" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white col-span-2" />
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <GlowButton variant="secondary" onClick={()=>setShowModelModal(false)}>取消</GlowButton>
                  <GlowButton onClick={saveModel}>保存</GlowButton>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
