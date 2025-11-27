import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';
import * as echarts from 'echarts';
import { HudPanel, DataCard, StatusBadge, GlowButton } from '../components/ui/HudPanel';
import { 
  Brain, 
  Cpu, 
  Database, 
  TrendingUp, 
  Target, 
  Zap,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Code,
  FileText,
  Terminal,
  X,
  FileCode
} from 'lucide-react';
import { getAlgorithms, getBusinessModels, updateAlgorithmCode, upsertBusinessModel, deleteBusinessModel } from '../lib/sqlite';

// 算法库数据
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
  {
    id: 'production-sales',
    name: '产销衔接算法',
    category: 'coordination',
    version: 'v1.8.7',
    status: 'active',
    accuracy: 91.8,
    performance: 92.3,
    usage: 890,
    description: '连接生产计划与销售预测的智能匹配算法',
    features: ['需求预测', '产能平衡', '风险预警'],
    lastUpdated: '2025-11-20',
    author: '业务算法组',
    code: `def match_production_sales(demand_signal, capacity):
    # 产销衔接智能匹配 V1.8
    forecast = Prophet.predict(demand_signal)
    gap = capacity - forecast
    return optimize_schedule(gap, strategy='min_cost')`
  },
  {
    id: 'inventory-optimization',
    name: '多级库存优化算法',
    category: 'inventory',
    version: 'v3.0.1',
    status: 'testing',
    accuracy: 88.5,
    performance: 85.7,
    usage: 567,
    description: '考虑需求不确定性的多级库存网络优化算法',
    features: ['安全库存', '补货策略', '成本优化'],
    lastUpdated: '2025-11-25',
    author: '库存优化团队',
    code: `def optimize_inventory_levels(nodes, demand_dist):
    # 多级库存网络优化 V3.0
    network = Graph(nodes)
    safety_stock = calculate_safety_stock(demand_dist, service_level=0.99)
    return network.min_cost_flow(safety_stock)`
  },
  {
    id: 'process-control',
    name: '全流程管控算法',
    category: 'control',
    version: 'v2.5.4',
    status: 'active',
    accuracy: 96.1,
    performance: 91.2,
    usage: 2100,
    description: '跨境供应链全流程实时监控与异常处理算法',
    features: ['异常检测', '流程优化', '质量控制'],
    lastUpdated: '2025-11-18',
    author: '流程管控部',
    code: `def monitor_process_flow(stream_data):
    # 全流程实时监控 V2.5
    anomaly_detector = IsolationForest(contamination=0.01)
    anomalies = anomaly_detector.fit_predict(stream_data)
    if anomalies.any():
        trigger_alert(anomalies)
    return process_status(stream_data)`
  },
  {
    id: 'collaborative-decision',
    name: '协同决策响应算法',
    category: 'decision',
    version: 'v1.3.2',
    status: 'development',
    accuracy: 85.3,
    performance: 78.9,
    usage: 234,
    description: '支持多方协同的智能决策响应算法',
    features: ['群体决策', '冲突解决', '方案评估'],
    lastUpdated: '2025-11-22',
    author: '决策算法组',
    code: `def collaborative_decision(proposals, weights):
    # 协同决策响应 V1.3
    matrix = build_decision_matrix(proposals)
    consensus = calculate_consensus(matrix, weights)
    return optimize_response(consensus, constraints)`
  }
];

// 业务模型库数据
const businessModels = [
  {
    id: 'beauty-model',
    name: '美妆品类业务模型',
    category: 'beauty',
    version: 'v1.2.0',
    status: 'active',
    enterprises: 156,
    orders: 2341,
    description: '专门针对美妆品类的跨境供应链业务逻辑模型',
    scenarios: ['NMPA备案', '保质期管理', '成分合规'],
    compliance: ['NMPA', 'CFDA', '海关编码'],
    successRate: 92.5,
    lastUpdated: '2025-11-20',
    maintainer: '美妆业务部'
  },
  {
    id: 'wine-model',
    name: '酒水品类业务模型',
    category: 'wine',
    version: 'v1.1.8',
    status: 'active',
    enterprises: 89,
    orders: 1456,
    description: '针对酒水品类的特殊监管要求和业务流程模型',
    scenarios: ['酒类许可', '年龄验证', '税收计算'],
    compliance: ['酒类专卖', '海关', '税务'],
    successRate: 89.2,
    lastUpdated: '2025-11-18',
    maintainer: '酒水业务部'
  },
  {
    id: 'appliance-model',
    name: '家电品类业务模型',
    category: 'appliance',
    version: 'v2.0.3',
    status: 'active',
    enterprises: 203,
    orders: 1876,
    description: '家电产品的跨境供应链标准化业务模型',
    scenarios: ['3C认证', '能效标识', '售后服务'],
    compliance: ['3C认证', '能效标识', '电子废物'],
    successRate: 94.8,
    lastUpdated: '2025-11-23',
    maintainer: '家电业务部'
  }
];

const computeAlgorithmPerformance = (list: any[]) => {
  const total = list.length || 1;
  const avgAcc = list.reduce((s,x)=>s+(x.accuracy||0),0)/total;
  const avgPerf = list.reduce((s,x)=>s+(x.performance||0),0)/total;
  const activeRate = Math.round((list.filter(x=>x.status==='active').length/total)*1000)/10;
  const avgFeatures = list.reduce((s,x)=>s+((x.features||[]).length),0)/total;
  const maxUsage = Math.max(1, ...list.map(x=>x.usage||0));
  const avgUsageRatio = list.reduce((s,x)=>s+((x.usage||0)/maxUsage),0)/total*100;
  const avgDaysSinceUpdate = list.reduce((s,x)=>{
    const d = new Date(x.lastUpdated||Date.now());
    const days = Math.max(0, Math.round((Date.now()-d.getTime())/(1000*60*60*24)));
    return s+days;
  },0)/total;
  const maintainability = Math.max(0, 100 - Math.min(100, avgDaysSinceUpdate*2));
  return [
    { name: '准确率', value: Math.round(avgAcc*10)/10, fullMark: 100 },
    { name: '性能', value: Math.round(avgPerf*10)/10, fullMark: 100 },
    { name: '稳定性', value: Math.round(activeRate*10)/10, fullMark: 100 },
    { name: '可扩展性', value: Math.min(100, Math.round(avgFeatures*20*10)/10), fullMark: 100 },
    { name: '易用性', value: Math.round(avgUsageRatio*10)/10, fullMark: 100 },
    { name: '维护性', value: Math.round(maintainability*10)/10, fullMark: 100 }
  ];
};

const categoryColors = {
  optimization: '#00F0FF',
  coordination: '#2E5CFF',
  inventory: '#10B981',
  control: '#F59E0B',
  decision: '#FF3B30'
};

// --- Components ---

const GaugeChart = ({ value }: { value: number }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    
    const option = {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 5,
          radius: '100%',
          center: ['50%', '70%'],
          itemStyle: {
            color: '#00F0FF',
            shadowColor: 'rgba(0, 240, 255, 0.45)',
            shadowBlur: 10,
            shadowOffsetX: 2,
            shadowOffsetY: 2
          },
          progress: {
            show: true,
            roundCap: true,
            width: 8
          },
          pointer: {
            show: false
          },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 8,
              color: [[1, 'rgba(255,255,255,0.1)']]
            }
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: {
            show: true,
            fontSize: 12,
            color: '#94a3b8',
            offsetCenter: [0, '30%']
          },
          detail: {
            valueAnimation: true,
            fontSize: 24,
            color: '#fff',
            offsetCenter: [0, '-20%'],
            formatter: '{value}%'
          },
          data: [
            {
              value: value,
              name: '准确率'
            }
          ]
        }
      ]
    };

    chart.setOption(option);
    
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [value]);

  return <div ref={chartRef} className="w-full h-32" />;
};

const UploadModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B1120] border border-cyber-cyan/30 rounded-xl p-6 w-[400px] shadow-[0_0_30px_rgba(0,240,255,0.15)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Upload size={20} className="text-cyber-cyan" />
          导入模型
        </h3>
        <p className="text-gray-400 text-sm mb-6">支持 .py, .onnx 格式文件上传</p>
        
        <div className="border-2 border-dashed border-slate-700 hover:border-cyber-cyan/50 rounded-lg h-40 flex flex-col items-center justify-center bg-slate-800/20 transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Upload size={24} className="text-cyber-cyan" />
          </div>
          <p className="text-sm text-gray-300">点击或拖拽文件至此处</p>
          <p className="text-xs text-gray-500 mt-1">最大支持 500MB</p>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            取消
          </button>
          <GlowButton onClick={onClose} size="sm">
            确认上传
          </GlowButton>
        </div>
      </div>
    </div>
  );
};

export const Capabilities: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'algorithms' | 'models'>('algorithms');
  const [algorithms, setAlgorithms] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<any | null>(null);
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [algPage, setAlgPage] = useState(1);
  const [algPageSize, setAlgPageSize] = useState(5);
  const [showModelModal, setShowModelModal] = useState(false);
  const [modelForm, setModelForm] = useState<any>({ id:'', name:'', category:'beauty', version:'v1.0.0', status:'active', enterprises:0, orders:0, description:'', scenarios:'', compliance:'', successRate:90, lastUpdated:new Date().toISOString().slice(0,10), maintainer:'' });
  
  // Right Panel State
  const [rightPanelTab, setRightPanelTab] = useState<'overview' | 'code' | 'logs'>('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  // New State for Interactivity
  const [testParams, setTestParams] = useState({ batchSize: 32, epochs: 10 });
  const [executionHistory, setExecutionHistory] = useState([
    { id: 1, time: '10:23:15', input: 'Batch_#2094', status: 'Success', duration: '120ms' },
    { id: 2, time: '10:23:20', input: 'Batch_#2095', status: 'Success', duration: '125ms' },
    { id: 3, time: '10:23:25', input: 'Batch_#2096', status: 'Success', duration: '118ms' },
    { id: 4, time: '10:23:30', input: 'Batch_#2097', status: 'Success', duration: '122ms' },
    { id: 5, time: '10:23:35', input: 'Batch_#2098', status: 'Success', duration: '119ms' }
  ]);

  useEffect(() => {
    const load = async () => {
      const a = await getAlgorithms();
      const m = await getBusinessModels();
      const aa = a.map((x: any) => ({ ...x, features: JSON.parse(x.features) }));
      const mm = m.map((x: any) => ({ ...x, scenarios: JSON.parse(x.scenarios), compliance: JSON.parse(x.compliance) }));
      setAlgorithms(aa);
      setModels(mm);
      setSelectedAlgorithm(aa[0] || null);
      setSelectedModel(mm[0] || null);
      setAlgPage(1);
    };
    load();
  }, []);

  const openNewModel = () => {
    setModelForm({ id:'bm-'+Date.now(), name:'', category:'beauty', version:'v1.0.0', status:'active', enterprises:0, orders:0, description:'', scenarios:'', compliance:'', successRate:90, lastUpdated:new Date().toISOString().slice(0,10), maintainer:'' })
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
      successRate:parseFloat(modelForm.successRate||0),
      lastUpdated:modelForm.lastUpdated||new Date().toISOString().slice(0,10),
      maintainer:modelForm.maintainer||''
    }
    await upsertBusinessModel(payload as any)
    const m = await getBusinessModels();
    const mm = m.map((x: any) => ({ ...x, scenarios: JSON.parse(x.scenarios), compliance: JSON.parse(x.compliance) }));
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
    setTimeout(() => {
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

      {activeTab === 'algorithms' && (
        <>
          {/* 算法库概览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <DataCard
              title="总算法数"
              value={algorithms.length}
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
                    const list = algorithms;
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
                      {[5,10,15].map(s=> (<option key={s} value={s}>{s}</option>))}
                    </select>
                    <span>项</span>
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
                              <span className="text-gray-500 block mb-1">Version</span>
                              <span className="text-white font-mono">{selectedAlgorithm?.version}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-1">Author</span>
                              <span className="text-white">{selectedAlgorithm?.author}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-1">Updated</span>
                              <span className="text-white">{selectedAlgorithm?.lastUpdated}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-1">Usage</span>
                              <span className="text-white font-mono">{selectedAlgorithm ? selectedAlgorithm.usage.toLocaleString() : 0}</span>
                            </div>
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
                           <label className="text-xs text-gray-500 block mb-1">Batch Size</label>
                           <input 
                              type="number" 
                              value={testParams.batchSize}
                              onChange={(e) => setTestParams(prev => ({...prev, batchSize: parseInt(e.target.value) || 0}))}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyber-cyan outline-none font-mono"
                           />
                        </div>
                        <div className="flex-1">
                           <label className="text-xs text-gray-500 block mb-1">Epochs</label>
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
                            <span>Terminal</span>
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
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-3 bg-slate-800/30 rounded border border-slate-700/50 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
                          <div className="space-y-1">
                            <div className="text-gray-400">2025-11-27 10:23:{10 + i}</div>
                            <div className="text-white">Input: Batch_#{2094 + i}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-400">Success</div>
                            <div className="text-gray-500">{120 + i * 5}ms</div>
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
        </>
      )}

      {activeTab === 'models' && (
        <>
          {/* 业务模型概览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataCard
              title="总模型数"
              value={models.length}
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
                  {models.map((model: any) => (
                    <div
                      key={model.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedModel.id === model.id
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
                  
                  <div className="pt-4 border-t border-slate-700 flex items-center gap-2">
                     <GlowButton size="sm" onClick={openEditModel}><Edit size={14} className="mr-2" />编辑</GlowButton>
                     <GlowButton size="sm" variant="secondary" onClick={removeModel}><Trash2 size={14} className="mr-2" />删除</GlowButton>
                  </div>
                </div>
              </HudPanel>
            </div>
          </div>
          {showModelModal && (
            <div className="fixed inset-0 bg黑/60 flex items-center justify-center z-50">
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
};
