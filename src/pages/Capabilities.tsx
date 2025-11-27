import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';
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
  Trash2
} from 'lucide-react';

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
    author: '算法研发部'
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
    author: '业务算法组'
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
    author: '库存优化团队'
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
    author: '流程管控部'
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
    author: '决策算法组'
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

// 算法性能数据
const algorithmPerformance = [
  { name: '准确率', value: 91.2, fullMark: 100 },
  { name: '性能', value: 87.4, fullMark: 100 },
  { name: '稳定性', value: 93.8, fullMark: 100 },
  { name: '可扩展性', value: 85.1, fullMark: 100 },
  { name: '易用性', value: 89.6, fullMark: 100 },
  { name: '维护性', value: 92.3, fullMark: 100 }
];

// 模型使用统计
const modelUsageStats = [
  { month: '2025-07', beauty: 234, wine: 156, appliance: 189 },
  { month: '2025-08', beauty: 267, wine: 178, appliance: 203 },
  { month: '2025-09', beauty: 298, wine: 195, appliance: 234 },
  { month: '2025-10', beauty: 321, wine: 212, appliance: 256 },
  { month: '2025-11', beauty: 345, wine: 234, appliance: 278 }
];

const categoryColors = {
  optimization: '#00F0FF',
  coordination: '#2E5CFF',
  inventory: '#10B981',
  control: '#F59E0B',
  decision: '#FF3B30'
};

const statusColors = {
  active: 'text-emerald-green',
  testing: 'text-yellow-400',
  development: 'text-cyber-cyan',
  deprecated: 'text-gray-500'
};

export const Capabilities: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'algorithms' | 'models'>('algorithms');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(algorithmLibrary[0]);
  const [selectedModel, setSelectedModel] = useState(businessModels[0]);

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
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cyber-cyan mb-2">能力与模型中心</h1>
          <p className="text-gray-400">算法库与业务模型库管理与监控</p>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge status="active" pulse>实时</StatusBadge>
          <GlowButton size="sm">
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
              value={algorithmLibrary.length}
              unit="个"
              status="active"
            >
              <Brain className="text-cyber-cyan mt-2" size={20} />
            </DataCard>

            <DataCard
              title="活跃算法"
              value={algorithmLibrary.filter(a => a.status === 'active').length}
              unit="个"
              status="active"
            >
              <Zap className="text-emerald-green mt-2" size={20} />
            </DataCard>

            <DataCard
              title="平均准确率"
              value={(algorithmLibrary.reduce((sum, a) => sum + a.accuracy, 0) / algorithmLibrary.length).toFixed(1)}
              unit="%"
              status="active"
            >
              <Target className="text-neon-blue mt-2" size={20} />
            </DataCard>

            <DataCard
              title="总调用次数"
              value={algorithmLibrary.reduce((sum, a) => sum + a.usage, 0)}
              unit="次"
              status="active"
            >
              <TrendingUp className="text-yellow-400 mt-2" size={20} />
            </DataCard>

            <DataCard
              title="开发中"
              value={algorithmLibrary.filter(a => a.status === 'development').length}
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
                  {algorithmLibrary.map((algorithm) => (
                    <div
                      key={algorithm.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedAlgorithm.id === algorithm.id
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
                          {algorithm.features.map((feature, index) => (
                            <span key={index} className="px-2 py-1 bg-slate-700 text-xs rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-gray-400 hover:text-cyber-cyan">
                            <Eye size={14} />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-emerald-green">
                            <Play size={14} />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-yellow-400">
                            <Edit size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </HudPanel>
            </div>

            {/* 算法详情 */}
            <div>
              <HudPanel title="算法详情" subtitle={selectedAlgorithm.name}>
                <div className="space-y-4">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-2">基本信息</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">版本</span>
                        <span className="text-cyber-cyan">{selectedAlgorithm.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">状态</span>
                        <StatusBadge status={selectedAlgorithm.status === 'active' ? 'active' : 'processing'}>
                          {selectedAlgorithm.status}
                        </StatusBadge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">作者</span>
                        <span className="text-white">{selectedAlgorithm.author}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">更新时间</span>
                        <span className="text-white">{selectedAlgorithm.lastUpdated}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-2">性能指标</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">准确率</span>
                          <span className="digital-display">{selectedAlgorithm.accuracy}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-cyber-cyan to-neon-blue h-2 rounded-full"
                            style={{ width: `${selectedAlgorithm.accuracy}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">性能</span>
                          <span className="digital-display">{selectedAlgorithm.performance}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-emerald-green to-cyber-cyan h-2 rounded-full"
                            style={{ width: `${selectedAlgorithm.performance}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-2">使用统计</h4>
                    <div className="text-center">
                      <p className="digital-display text-2xl font-bold">{selectedAlgorithm.usage}</p>
                      <p className="text-xs text-gray-400">总调用次数</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <GlowButton size="sm" className="w-full">
                      <Play size={14} className="mr-2" />
                      运行测试
                    </GlowButton>
                    <GlowButton size="sm" variant="secondary" className="w-full">
                      <Download size={14} className="mr-2" />
                      下载模型
                    </GlowButton>
                  </div>
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
                    <RadarChart data={algorithmPerformance}>
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
                {algorithmPerformance.map((item, index) => (
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
              value={businessModels.length}
              unit="个"
              status="active"
            >
              <Database className="text-cyber-cyan mt-2" size={20} />
            </DataCard>

            <DataCard
              title="服务企业"
              value={businessModels.reduce((sum, m) => sum + m.enterprises, 0)}
              unit="家"
              status="active"
            >
              <Target className="text-emerald-green mt-2" size={20} />
            </DataCard>

            <DataCard
              title="处理订单"
              value={businessModels.reduce((sum, m) => sum + m.orders, 0)}
              unit="单"
              status="active"
            >
              <TrendingUp className="text-neon-blue mt-2" size={20} />
            </DataCard>

            <DataCard
              title="平均成功率"
              value={(businessModels.reduce((sum, m) => sum + m.successRate, 0) / businessModels.length).toFixed(1)}
              unit="%"
              status="active"
            >
              <Zap className="text-yellow-400 mt-2" size={20} />
            </DataCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 业务模型列表 */}
            <div className="lg:col-span-2">
              <HudPanel title="业务模型库" subtitle="品类特定业务逻辑模型">
                <div className="space-y-3">
                  {businessModels.map((model) => (
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
                          <div className="w-8 h-8 bg-gradient-to-r from-cyber-cyan to-neon-blue rounded-lg flex items-center justify-center">
                            <Database size={16} className="text-deep-space" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{model.name}</h3>
                            <p className="text-xs text-gray-400">{model.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <StatusBadge status="active">运行中</StatusBadge>
                          <span className="text-xs text-gray-500">{model.version}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
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

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                        <div className="flex flex-wrap gap-1">
                          {model.scenarios.map((scenario, index) => (
                            <span key={index} className="px-2 py-1 bg-slate-700 text-xs rounded">
                              {scenario}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-gray-400 hover:text-cyber-cyan">
                            <Eye size={14} />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-emerald-green">
                            <Play size={14} />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-yellow-400">
                            <Edit size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </HudPanel>
            </div>

            {/* 模型详情 */}
            <div>
              <HudPanel title="模型详情" subtitle={selectedModel.name}>
                <div className="space-y-4">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-2">基本信息</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">版本</span>
                        <span className="text-cyber-cyan">{selectedModel.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">状态</span>
                        <StatusBadge status="active">运行中</StatusBadge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">维护者</span>
                        <span className="text-white">{selectedModel.maintainer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">更新时间</span>
                        <span className="text-white">{selectedModel.lastUpdated}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-2">业务统计</h4>
                    <div className="space-y-3">
                      <div className="text-center">
                        <p className="digital-display text-2xl font-bold">{selectedModel.enterprises}</p>
                        <p className="text-xs text-gray-400">服务企业数</p>
                      </div>
                      <div className="text-center">
                        <p className="digital-display text-2xl font-bold">{selectedModel.orders}</p>
                        <p className="text-xs text-gray-400">处理订单数</p>
                      </div>
                      <div className="text-center">
                        <p className="digital-display text-2xl font-bold">{selectedModel.successRate}%</p>
                        <p className="text-xs text-gray-400">成功率</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-2">合规要求</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedModel.compliance.map((item, index) => (
                        <span key={index} className="px-2 py-1 bg-slate-700 text-xs rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <GlowButton size="sm" className="w-full">
                      <Play size={14} className="mr-2" />
                      运行测试
                    </GlowButton>
                    <GlowButton size="sm" variant="secondary" className="w-full">
                      <RefreshCw size={14} className="mr-2" />
                      更新模型
                    </GlowButton>
                  </div>
                </div>
              </HudPanel>
            </div>
          </div>

          {/* 模型使用趋势 */}
          <HudPanel title="模型使用趋势" subtitle="各品类模型月度使用情况">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelUsageStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b" 
                    fontSize={12}
                    tickFormatter={(value) => value.split('-')[1] + '月'}
                  />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="beauty" fill="#00F0FF" name="美妆" />
                  <Bar dataKey="wine" fill="#2E5CFF" name="酒水" />
                  <Bar dataKey="appliance" fill="#10B981" name="家电" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </HudPanel>
        </>
      )}
    </div>
  );
};