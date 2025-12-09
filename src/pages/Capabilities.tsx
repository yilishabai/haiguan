import React, { useState, useEffect, useRef } from 'react';
import { Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as echarts from 'echarts';
import { HudPanel, DataCard, StatusBadge, GlowButton } from '../components/ui/HudPanel';
import { UploadModal } from '../components/UploadModal';
import GaugeChart from '../components/charts/GaugeChart';
import { Brain, Cpu, Database, TrendingUp, Target, Zap, Play, RefreshCw, Download, Upload, Eye, Edit, Trash2, Terminal, X, FileCode, FileText, Activity, ShieldCheck, DollarSign, Clock, ArrowRight, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { getAlgorithms, getBusinessModels, updateAlgorithmCode, upsertBusinessModel, deleteBusinessModel, getAlgorithmRecommendations, applyBusinessModel, queryAll, countAlgorithms, countBusinessModels, getCaseTraces, logAlgoTest, searchCaseTraces, countCaseTraces, bindAlgorithmToOrder, getBindingsForOrder } from '../lib/sqlite';

// ... (existing algorithmLibrary and businessModels arrays kept for fallback/seed) ...
const algorithmLibrary = [
  {
    id: 'resource-optimization',
    name: '资源动态优化算法',
    category: 'optimization',
    version: 'v2.1.3',
    status: 'active',
    accuracy: 94.2,
    performance: 89.5,
    usage: 1250,
    description: '基于机器学习的跨境供应链资源动态分配优化算法',
    features: ['实时调度', '多目标优化', '约束处理'],
    lastUpdated: '2025-11-15',
    author: '算法研发部',
    code: `def optimize_supply_chain(inventory_data):
    # 跨境供应链资源动态优化算法 V2.1
    model = Transformer(d_model=512)
    risk_factor = calculate_customs_delay()
    return model.predict(inventory_data, risk=risk_factor)`
  },
  // ... other algorithms ...
];

// ... (rest of the file content until Capabilities component) ...

export const Capabilities: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'algorithms' | 'models'>('dashboard');
  const [algorithms, setAlgorithms] = useState<any[]>([]);
  // ... (other state) ...
  const [realtimeDecisions, setRealtimeDecisions] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [caseTraces, setCaseTraces] = useState<any[]>([]);
  const [traceQuery, setTraceQuery] = useState('');
  const [traceOutcome, setTraceOutcome] = useState<'all'|'Cleared'|'Risk Review'>('all');
  const [traceModel, setTraceModel] = useState<string>('all');
  const [traceHs, setTraceHs] = useState<string>('all');
  const [tracePage, setTracePage] = useState(1);
  const [tracePageSize, setTracePageSize] = useState(10);
  const [traceTotal, setTraceTotal] = useState(0);
  const [bindingOrders, setBindingOrders] = useState<any[]>([]);
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
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
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

  // ... (useEffect for loading data) ...
  useEffect(() => {
    const load = async () => {
      // 1. Load SQL.js Data
      const a = await getAlgorithms('', (algPage-1)*algPageSize, algPageSize);
      const m = await getBusinessModels('', 'all', 0, 50);
      setAlgorithms(a);
      setModels(m.map((x: any) => ({ ...x, scenarios: JSON.parse(x.scenarios), compliance: JSON.parse(x.compliance), chapters: x.chapters ? JSON.parse(x.chapters) : [] })));
      
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
            setDashboardStats(stats);
            // Fallback/Merge with simulated metrics if needed
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
        if (logsRes.ok) setExecutionLogs(await logsRes.json());
        const ct = await searchCaseTraces({ q: traceQuery, outcome: traceOutcome, model: traceModel, hsChapter: traceHs, offset: (tracePage-1)*tracePageSize, limit: tracePageSize })
        setCaseTraces(ct)
        const totalCt = await countCaseTraces({ q: traceQuery, outcome: traceOutcome, model: traceModel, hsChapter: traceHs })
        setTraceTotal(totalCt)
        const bo = await queryAll(`SELECT id, order_number as orderNo, enterprise FROM orders ORDER BY created_at DESC LIMIT 20`)
        setBindingOrders(bo)
        
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
    const mm = m.map((x: any) => ({ ...x, scenarios: JSON.parse(x.scenarios), compliance: JSON.parse(x.compliance), chapters: x.chapters ? JSON.parse(x.chapters) : [] }));
    setModels(mm)
    setSelectedModel(mm.find((x:any)=>x.id===payload.id) || mm[0] || null)
    setShowModelModal(false)
  }
  const removeModel = async () => {
    if (!selectedModel?.id) return
    await deleteBusinessModel(selectedModel.id)
    const m = await getBusinessModels();
    const mm = m.map((x: any) => ({ ...x, scenarios: JSON.parse(x.scenarios), compliance: JSON.parse(x.compliance) }));
    setModels(mm)
    setSelectedModel(mm[0] || null)
  }

  const handleRunTest = () => {
    setIsTestRunning(true);
    setRightPanelTab('code'); // Switch to code view to show terminal
    setTerminalLogs([`> Initializing weights (Batch Size: ${testParams.batchSize})...`]);
    
    // Simulate testing process
    setTimeout(() => {
      setTerminalLogs(prev => [...prev, '> Loading model architecture...']);
    }, 800);
    setTimeout(() => {
      setTerminalLogs(prev => [...prev, '> Allocating tensors...']);
    }, 1600);
    setTimeout(() => {
      setTerminalLogs(prev => [...prev, `> Running inference on test batch (n=${testParams.batchSize})...`]);
    }, 2400);
    setTimeout(async () => {
      const duration = Math.floor(100 + Math.random() * 50);
      setTerminalLogs(prev => [...prev, '> Verifying outputs...', `> Done (${duration/1000}s)`]);
      setIsTestRunning(false);
      
      // Add to history
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        input: `Batch_#${Math.floor(Math.random() * 9000) + 1000}`,
        status: 'Success',
        duration: `${duration}ms`
      };
      setExecutionHistory(prev => [newLog, ...prev]);
      if (selectedAlgorithm?.id) {
        try { await logAlgoTest(String(selectedAlgorithm.id), newLog.input, newLog.status, duration) } catch {}
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
          <span>算法库</span>
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
            <HudPanel title="模型效果与业务ROI趋势" subtitle="准确率 vs 业务回报率" className="lg:col-span-2">
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

            <HudPanel title="决策路径解释" subtitle="最近一次高风险拦截分析">
               <div className="relative h-80 bg-slate-900/50 rounded-lg p-4 overflow-hidden">
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-xs text-gray-400">
                    <span>Trace ID: {executionLogs[0]?.id?.slice(0,8) || 'TR-2025-X89'}</span>
                    <StatusBadge status="warning">风险拦截</StatusBadge>
                  </div>
                  <div className="mt-8 space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><FileText size={16}/></div>
                       <div>
                         <div className="text-sm text-white">申报单输入</div>
                         <div className="text-xs text-gray-500">包含敏感货品编码</div>
                       </div>
                    </div>
                    <div className="flex justify-center"><ArrowRight className="text-gray-600 rotate-90"/></div>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-cyber-cyan/20 flex items-center justify-center text-cyber-cyan"><Brain size={16}/></div>
                       <div>
                         <div className="text-sm text-white">风控模型 V2.1</div>
                         <div className="text-xs text-gray-500">置信度 98.5%</div>
                       </div>
                    </div>
                    <div className="flex justify-center"><ArrowRight className="text-gray-600 rotate-90"/></div>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400"><AlertTriangle size={16}/></div>
                       <div>
                         <div className="text-sm text-white">业务决策: 拦截</div>
                         <div className="text-xs text-gray-500">触发人工复核流程</div>
                       </div>
                    </div>
                  </div>
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
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-gray-400">{new Date(log.ts || log.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{String(log.id).slice(0,8)}</td>
                      <td className="px-4 py-3 text-white">{log.input || log.input_snapshot}</td>
                      <td className="px-4 py-3 text-cyber-cyan">{log.modelName || log.model_name}</td>
                      <td className="px-4 py-3 text-gray-300">{log.output || log.output_result}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          String(log.businessOutcome || log.business_outcome).includes('Risk') || String(log.businessOutcome || log.business_outcome).includes('Review')
                          ? 'bg-orange-900/30 text-orange-400'
                          : 'bg-emerald-900/30 text-emerald-400'
                        }`}>
                          {log.businessOutcome || log.business_outcome}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{log.businessImpactValue || log.business_impact_value}</td>
                      <td className="px-4 py-3 text-gray-300">{log.confidence ? `${log.confidence}%` : '-'}</td>
                      <td className="px-4 py-3 text-gray-300">{log.latencyMs ? `${log.latencyMs}ms` : '-'}</td>
                      <td className="px-4 py-3 text-gray-300">{log.hsChapter || '-'}</td>
                      <td className="px-4 py-3 text-gray-300">{log.complianceScore ? `${log.complianceScore}` : '-'}</td>
                      <td className="px-4 py-3 text-gray-300">{log.customsStatus || '-'}</td>
                      <td className="px-4 py-3 text-gray-300">{log.logisticsStatus || '-'}</td>
                      <td className="px-4 py-3 text-gray-300">{log.settlementStatus || '-'}</td>
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
              <HudPanel title="算法库管理" subtitle="核心算法列表与状态">
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
                    <div className="space-y-2 font-mono text-xs animate-in fade-in slide-in-from-right-4 duration-300">
                      {executionHistory.map((e) => (
                        <div key={e.id} className="p-3 bg-slate-800/30 rounded border border-slate-700/50 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
                          <div className="space-y-1">
                            <div className="text-gray-400">{new Date().toLocaleDateString()} {e.time}</div>
                            <div className="text-white">Input: {e.input}</div>
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
