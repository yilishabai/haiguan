import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { HudPanel, DataCard, StatusBadge, GlowButton } from '../components/ui/HudPanel';
import { 
  Target, 
  CheckCircle, 
  Clock, 
  BarChart3,
  Lightbulb,
  Settings
} from 'lucide-react';

// 研发目标数据
const researchGoals = [
  {
    id: 'framework-tech',
    name: '大规模跨境供应链敏捷协同框架技术',
    progress: 78,
    status: 'in-progress',
    deadline: '2025-12-31',
    priority: 'high',
    description: '构建支持万级企业并发的分布式协同框架',
    milestones: [
      { name: '架构设计', completed: true, date: '2025-03-15' },
      { name: '核心算法', completed: true, date: '2025-06-30' },
      { name: '原型开发', completed: false, date: '2025-09-30' },
      { name: '性能优化', completed: false, date: '2025-11-30' }
    ]
  },
  {
    id: 'algorithm-lib',
    name: '供应链业务算法',
    progress: 92,
    status: 'completed',
    deadline: '2025-06-30',
    priority: 'high',
    description: '集成5类核心算法：资源优化、产销衔接、库存优化等',
    milestones: [
      { name: '算法研究', completed: true, date: '2025-01-31' },
      { name: '算法实现', completed: true, date: '2025-04-15' },
      { name: '算法验证', completed: true, date: '2025-05-30' },
      { name: '算法集成', completed: true, date: '2025-06-30' }
    ]
  },
  {
    id: 'business-models',
    name: '业务模型库构建',
    progress: 65,
    status: 'in-progress',
    deadline: '2025-10-31',
    priority: 'medium',
    description: '美妆、酒水、家电三大品类业务逻辑模型',
    milestones: [
      { name: '需求分析', completed: true, date: '2025-02-28' },
      { name: '模型设计', completed: true, date: '2025-05-15' },
      { name: '模型开发', completed: false, date: '2025-08-31' },
      { name: '模型测试', completed: false, date: '2025-10-15' }
    ]
  },
  {
    id: 'data-platform',
    name: '跨境数据协同平台',
    progress: 45,
    status: 'in-progress',
    deadline: '2026-03-31',
    priority: 'high',
    description: '对接海关电子口岸，实现数据共享与同步',
    milestones: [
      { name: '接口调研', completed: true, date: '2025-04-30' },
      { name: '数据建模', completed: false, date: '2025-07-31' },
      { name: '接口开发', completed: false, date: '2025-12-31' },
      { name: '集成测试', completed: false, date: '2026-02-28' }
    ]
  }
];

// 约束性指标数据
const constraintMetrics = [
  {
    name: '协同准确率',
    current: 89.2,
    target: 90.0,
    unit: '%',
    trend: 'up',
    status: 'warning',
    description: '提升 > 10%',
    technology: 'Transformer纠错模型'
  },
  {
    name: '任务自动化率',
    current: 82.5,
    target: 85.0,
    unit: '%',
    trend: 'up',
    status: 'good',
    description: '提升 5-15%',
    technology: 'RPA集群'
  },
  {
    name: '关键页面响应',
    current: 1.8,
    target: 3.0,
    unit: '秒',
    trend: 'stable',
    status: 'excellent',
    description: '< 3秒',
    technology: 'SPA + BFF架构'
  },
  {
    name: '单服务接口响应',
    current: 0.9,
    target: 2.0,
    unit: '秒',
    trend: 'stable',
    status: 'excellent',
    description: '< 2秒',
    technology: 'Redis缓存 + 微服务'
  },
  {
    name: '数据一致性时间',
    current: 1.2,
    target: 2.0,
    unit: '秒',
    trend: 'down',
    status: 'excellent',
    description: '< 2秒',
    technology: 'Flink CDC + 联盟链'
  },
  {
    name: '服务规模',
    current: 1247,
    target: 10000,
    unit: '家企业',
    trend: 'up',
    status: 'good',
    description: '> 1万家企业',
    technology: '云原生分布式数据库'
  }
];

// 月度进度数据
const monthlyProgress = [
  { month: '2025-01', completed: 15, planned: 20 },
  { month: '2025-02', completed: 28, planned: 30 },
  { month: '2025-03', completed: 42, planned: 45 },
  { month: '2025-04', completed: 58, planned: 60 },
  { month: '2025-05', completed: 71, planned: 75 },
  { month: '2025-06', completed: 85, planned: 85 },
  { month: '2025-07', completed: 78, planned: 80 },
  { month: '2025-08', completed: 82, planned: 85 },
  { month: '2025-09', completed: 88, planned: 90 },
  { month: '2025-10', completed: 92, planned: 95 },
  { month: '2025-11', completed: 95, planned: 98 }
];

// 资源分配数据
const resourceAllocation = [
  { name: '算法研发', value: 35, color: '#00F0FF' },
  { name: '系统架构', value: 25, color: '#2E5CFF' },
  { name: '前端开发', value: 20, color: '#10B981' },
  { name: '测试验证', value: 15, color: '#F59E0B' },
  { name: '项目管理', value: 5, color: '#FF3B30' }
];

export const Research: React.FC = () => {
  const [selectedGoal, setSelectedGoal] = useState(researchGoals[0]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-green';
      case 'in-progress': return 'text-cyber-cyan';
      case 'delayed': return 'text-alert-red';
      default: return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <StatusBadge status="active">已完成</StatusBadge>;
      case 'in-progress': return <StatusBadge status="processing" pulse>进行中</StatusBadge>;
      case 'delayed': return <StatusBadge status="error">延期</StatusBadge>;
      default: return <StatusBadge status="warning">待开始</StatusBadge>;
    }
  };

  

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/90 backdrop-blur-sm border border-cyber-cyan/30 rounded-lg p-3">
          <p className="text-cyber-cyan font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
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
          <h1 className="text-3xl font-bold text-cyber-cyan mb-2">研发与指标管理</h1>
          <p className="text-gray-400">追踪关键技术研发进度与约束性指标达成情况</p>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge status="active" pulse>实时监控</StatusBadge>
          <span className="text-sm text-gray-500">
            最后更新: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* 总体进度概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DataCard
          title="总体研发进度"
          value="73.5"
          unit="%"
          trend="up"
          status="active"
        >
          <div className="mt-4 flex items-center justify-between">
            <Target className="text-cyber-cyan" size={24} />
            <span className="text-xs text-gray-400">按计划推进</span>
          </div>
        </DataCard>

        <DataCard
          title="已完成项目"
          value="1"
          unit="个"
          trend="stable"
          status="active"
        >
          <div className="mt-4 flex items-center justify-between">
            <CheckCircle className="text-emerald-green" size={24} />
            <span className="text-xs text-gray-400">供应链业务算法完成</span>
          </div>
        </DataCard>

        <DataCard
          title="进行中项目"
          value="3"
          unit="个"
          trend="up"
          status="active"
        >
          <div className="mt-4 flex items-center justify-between">
            <Clock className="text-yellow-400" size={24} />
            <span className="text-xs text-gray-400">按计划执行</span>
          </div>
        </DataCard>

        <DataCard
          title="约束性指标"
          value="4/6"
          unit="达标"
          trend="up"
          status="warning"
        >
          <div className="mt-4 flex items-center justify-between">
            <BarChart3 className="text-neon-blue" size={24} />
            <span className="text-xs text-gray-400">需关注</span>
          </div>
        </DataCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 研发目标列表 */}
        <div className="lg:col-span-2">
          <HudPanel title="研发目标管理" subtitle="关键技术研发进度追踪">
            <div className="space-y-4">
              {researchGoals.map((goal) => (
                <div 
                  key={goal.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedGoal.id === goal.id 
                      ? 'bg-cyber-cyan/10 border-cyber-cyan/50' 
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => setSelectedGoal(goal)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Lightbulb className="text-cyber-cyan" size={20} />
                      <h3 className="font-semibold text-white">{goal.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(goal.status)}
                      <span className={`text-sm font-medium ${getStatusColor(goal.status)}`}>
                        {goal.progress}%
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-3">{goal.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>截止日期: {goal.deadline}</span>
                    <span className={`px-2 py-1 rounded ${
                      goal.priority === 'high' ? 'bg-alert-red/20 text-alert-red' :
                      goal.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-emerald-green/20 text-emerald-green'
                    }`}>
                      {goal.priority === 'high' ? '高优先级' : goal.priority === 'medium' ? '中优先级' : '低优先级'}
                    </span>
                  </div>
                  
                  <div className="mt-3">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-cyber-cyan to-neon-blue h-2 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </HudPanel>
        </div>

        {/* 选中目标的里程碑详情 */}
        <div>
          <HudPanel title="里程碑详情" subtitle={selectedGoal.name}>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-gray-400">总体进度</span>
                <span className="digital-display font-bold text-cyber-cyan">
                  {selectedGoal.progress}%
                </span>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">关键里程碑</h4>
                {selectedGoal.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 rounded hover:bg-slate-800/30">
                    <div className={`w-3 h-3 rounded-full ${
                      milestone.completed ? 'bg-emerald-green' : 'bg-slate-600'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{milestone.name}</p>
                      <p className="text-xs text-gray-500">{milestone.date}</p>
                    </div>
                    {milestone.completed && (
                      <CheckCircle className="text-emerald-green" size={16} />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-slate-700">
                <GlowButton size="sm" variant="secondary">
                  <Settings size={16} className="mr-2" />
                  编辑里程碑
                </GlowButton>
              </div>
            </div>
          </HudPanel>
        </div>
      </div>

      {/* 约束性指标监控 */}
      <HudPanel title="约束性指标监控" subtitle="实时展示技术指标达成情况">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {constraintMetrics.map((metric, index) => (
            <DataCard
              key={index}
              title={metric.name}
              value={metric.current}
              unit={metric.unit}
              trend={metric.trend as 'up' | 'down' | 'stable'}
              status={metric.status as 'active' | 'warning' | 'error'}
            >
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">目标值</span>
                  <span className="digital-display font-bold">
                    {metric.target}{metric.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">技术方案</span>
                  <span className="text-cyber-cyan text-xs">{metric.technology}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">指标要求</span>
                  <span className="text-gray-300 text-xs">{metric.description}</span>
                </div>
              </div>
            </DataCard>
          ))}
        </div>
      </HudPanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 月度进度趋势 */}
        <HudPanel title="月度进度趋势" subtitle="计划vs实际完成度">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b" 
                  fontSize={12}
                  tickFormatter={(value) => value.split('-')[1] + '月'}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="planned" fill="#2E5CFF" name="计划进度" />
                <Bar dataKey="completed" fill="#00F0FF" name="实际进度" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </HudPanel>

        {/* 资源分配 */}
        <HudPanel title="研发资源分配" subtitle="各方向投入占比">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resourceAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {resourceAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 text-xs">
            {resourceAllocation.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-gray-300">{item.name}</span>
                </div>
                <span className="digital-display">{item.value}%</span>
              </div>
            ))}
          </div>
        </HudPanel>
      </div>

      {/* 红绿灯预警系统 */}
      <HudPanel title="红绿灯预警系统" subtitle="项目风险预警与提醒">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-green/10 border border-emerald-green/30 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-4 h-4 bg-emerald-green rounded-full"></div>
              <h3 className="font-semibold text-emerald-green">正常进行</h3>
            </div>
            <p className="text-sm text-gray-300 mb-3">3个项目按计划推进</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">供应链业务算法</span>
                <span className="text-emerald-green">已完成</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">框架技术</span>
                <span className="text-emerald-green">78%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">业务模型</span>
                <span className="text-emerald-green">65%</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <h3 className="font-semibold text-yellow-400">需要关注</h3>
            </div>
            <p className="text-sm text-gray-300 mb-3">2个指标需要改进</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">协同准确率</span>
                <span className="text-yellow-400">89.2%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">服务规模</span>
                <span className="text-yellow-400">1247家</span>
              </div>
            </div>
          </div>

          <div className="bg-alert-red/10 border border-alert-red/30 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-4 h-4 bg-alert-red rounded-full"></div>
              <h3 className="font-semibold text-alert-red">风险项目</h3>
            </div>
            <p className="text-sm text-gray-300 mb-3">暂无高风险项目</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">状态监控</span>
                <span className="text-emerald-green">正常</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">预警机制</span>
                <span className="text-emerald-green">激活</span>
              </div>
            </div>
          </div>
        </div>
      </HudPanel>
    </div>
  );
};
