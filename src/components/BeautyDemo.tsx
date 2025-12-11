import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Package, 
  Truck, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Users,
  Globe,
  BarChart3,
  FileText,
  Award,
  Zap,
  Eye,
  Heart,
  Factory
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { HudPanel, DataCard, StatusBadge, GlowButton } from './ui/HudPanel';

interface BeautyProcess {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'completed' | 'warning' | 'compliance';
  progress: number;
  compliance: number;
  riskLevel: 'low' | 'medium' | 'high';
  enterprises: number;
  avgTime: number;
  nmpaStatus: 'approved' | 'pending' | 'reviewing' | 'rejected';
}

interface NMPATracking {
  id: string;
  productName: string;
  enterprise: string;
  applicationNo: string;
  status: 'submitted' | 'under_review' | 'field_test' | 'approved' | 'rejected';
  submitDate: string;
  expectedDate: string;
  compliance: number;
  riskScore: number;
}

interface BeautyMetrics {
  category: string;
  current: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  compliance: number;
}

function generateBeautyProcesses(): BeautyProcess[] {
  return [
    {
      id: 'research',
      name: '美妆研发',
      status: 'completed',
      progress: 100,
      compliance: 98.5,
      riskLevel: 'low',
      enterprises: 234,
      avgTime: 180,
      nmpaStatus: 'approved'
    },
    {
      id: 'testing',
      name: '安全检测',
      status: 'compliance',
      progress: 87.3,
      compliance: 94.2,
      riskLevel: 'medium',
      enterprises: 189,
      avgTime: 45,
      nmpaStatus: 'reviewing'
    },
    {
      id: 'production',
      name: '生产制造',
      status: 'active',
      progress: 92.5,
      compliance: 96.8,
      riskLevel: 'low',
      enterprises: 156,
      avgTime: 21,
      nmpaStatus: 'approved'
    },
    {
      id: 'packaging',
      name: '包装设计',
      status: 'active',
      progress: 78.9,
      compliance: 89.7,
      riskLevel: 'medium',
      enterprises: 298,
      avgTime: 14,
      nmpaStatus: 'pending'
    },
    {
      id: 'customs',
      name: '报关检验',
      status: 'warning',
      progress: 65.4,
      compliance: 82.1,
      riskLevel: 'high',
      enterprises: 134,
      avgTime: 7,
      nmpaStatus: 'reviewing'
    },
    {
      id: 'logistics',
      name: '冷链物流',
      status: 'active',
      progress: 88.7,
      compliance: 93.4,
      riskLevel: 'low',
      enterprises: 89,
      avgTime: 72,
      nmpaStatus: 'approved'
    },
    {
      id: 'sales',
      name: '销售分销',
      status: 'completed',
      progress: 95.2,
      compliance: 97.6,
      riskLevel: 'low',
      enterprises: 445,
      avgTime: 15,
      nmpaStatus: 'approved'
    },
    {
      id: 'feedback',
      name: '用户反馈',
      status: 'active',
      progress: 82.1,
      compliance: 91.3,
      riskLevel: 'medium',
      enterprises: 567,
      avgTime: 30,
      nmpaStatus: 'approved'
    }
  ]
}

function generateNMPATrackings(): NMPATracking[] {
  return [
    {
      id: '1',
      productName: '玻尿酸精华液',
      enterprise: '上海美妆集团',
      applicationNo: 'NMPA20241227001',
      status: 'approved',
      submitDate: '2024-11-15',
      expectedDate: '2024-12-15',
      compliance: 98.5,
      riskScore: 12
    },
    {
      id: '2',
      productName: '维生素C面膜',
      enterprise: '广州化妆品公司',
      applicationNo: 'NMPA20241227002',
      status: 'field_test',
      submitDate: '2024-10-20',
      expectedDate: '2024-12-20',
      compliance: 94.2,
      riskScore: 28
    },
    {
      id: '3',
      productName: '烟酰胺美白霜',
      enterprise: '深圳生物科技',
      applicationNo: 'NMPA20241227003',
      status: 'under_review',
      submitDate: '2024-11-30',
      expectedDate: '2025-01-30',
      compliance: 89.7,
      riskScore: 45
    },
    {
      id: '4',
      productName: '胶原蛋白眼霜',
      enterprise: '杭州护肤品牌',
      applicationNo: 'NMPA20241227004',
      status: 'submitted',
      submitDate: '2024-12-10',
      expectedDate: '2025-03-10',
      compliance: 76.3,
      riskScore: 67
    }
  ]
}

function generateBeautyMetrics(): BeautyMetrics[] {
  return [
    { category: 'NMPA合规率', current: 94.2, target: 95.0, trend: 'up', compliance: 94.2 },
    { category: '安全检测通过率', current: 87.3, target: 90.0, trend: 'stable', compliance: 87.3 },
    { category: '冷链温控精度', current: 99.1, target: 99.5, trend: 'up', compliance: 99.1 },
    { category: '用户满意度', current: 92.8, target: 95.0, trend: 'up', compliance: 92.8 },
    { category: '不良反应率', current: 0.8, target: 0.5, trend: 'down', compliance: 99.2 },
    { category: '溯源完整率', current: 96.5, target: 98.0, trend: 'up', compliance: 96.5 }
  ]
}

function generateRealtimeData() {
  return [
    { time: '00:00', 研发数量: 12, 检测批次: 8, 生产量: 2500, 通关量: 45, 销售额: 125000 },
    { time: '04:00', 研发数量: 8, 检测批次: 6, 生产量: 1800, 通关量: 32, 销售额: 98000 },
    { time: '08:00', 研发数量: 18, 检测批次: 15, 生产量: 4200, 通关量: 78, 销售额: 245000 },
    { time: '12:00', 研发数量: 25, 检测批次: 22, 生产量: 5800, 通关量: 95, 销售额: 320000 },
    { time: '16:00', 研发数量: 20, 检测批次: 18, 生产量: 4600, 通关量: 82, 销售额: 285000 },
    { time: '20:00', 研发数量: 15, 检测批次: 12, 生产量: 3200, 通关量: 65, 销售额: 198000 }
  ]
}

export const BeautyDemo: React.FC = () => {
  const [activePhase, setActivePhase] = useState('research');
  const [beautyProcesses, setBeautyProcesses] = useState<BeautyProcess[]>(() => generateBeautyProcesses());
  const [nmpaTrackings, setNmpaTrackings] = useState<NMPATracking[]>(() => generateNMPATrackings());
  const [beautyMetrics, setBeautyMetrics] = useState<BeautyMetrics[]>(() => generateBeautyMetrics());
  const [realtimeData, setRealtimeData] = useState<any[]>(() => generateRealtimeData());

  useEffect(() => {
    const interval = setInterval(() => {
      setBeautyProcesses(generateBeautyProcesses());
      setNmpaTrackings(generateNMPATrackings());
      setBeautyMetrics(generateBeautyMetrics());
      setRealtimeData(generateRealtimeData());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-emerald-green" />;
      case 'warning':
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-alert-red" />;
      case 'compliance':
        return <Shield className="w-4 h-4 text-cyber-cyan" />;
      case 'pending':
      case 'reviewing':
      case 'under_review':
        return <Clock className="w-4 h-4 text-cyber-cyan" />;
      case 'active':
      case 'field_test':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getNMPAColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-emerald-green';
      case 'field_test': return 'text-yellow-400';
      case 'under_review': return 'text-cyber-cyan';
      case 'submitted': return 'text-blue-400';
      case 'rejected': return 'text-alert-red';
      default: return 'text-gray-400';
    }
  };

  

  const complianceData = [
    { name: '成分检测', value: 94.2, fill: '#00F0FF' },
    { name: '微生物检测', value: 87.8, fill: '#2E5CFF' },
    { name: '重金属检测', value: 99.1, fill: '#10B981' },
    { name: '稳定性测试', value: 91.6, fill: '#F59E0B' },
    { name: '包装检测', value: 89.3, fill: '#EF4444' }
  ];

  

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
            <Heart className="w-8 h-8 text-pink-400" />
            <span>美妆品类全流程闭环演示</span>
          </h1>
          <p className="text-gray-400">NMPA合规监管下的化妆品供应链全生命周期管理</p>
        </div>
        <div className="flex space-x-4">
          <GlowButton variant="primary">
            <Eye className="w-4 h-4 mr-2" />
            实时监控
          </GlowButton>
          <GlowButton variant="secondary">
            <FileText className="w-4 h-4 mr-2" />
            合规报告
          </GlowButton>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DataCard 
          title="NMPA合规率" 
          value="94.2" 
          unit="%" 
          trend="up" 
          status="excellent" 
          icon={<Award className="w-6 h-6 text-gold-400" />}
        />
        <DataCard 
          title="安全检测通过率" 
          value="87.3" 
          unit="%" 
          trend="up" 
          status="good" 
          icon={<Shield className="w-6 h-6 text-emerald-green" />}
        />
        <DataCard 
          title="冷链温控精度" 
          value="99.1" 
          unit="%" 
          trend="stable" 
          status="excellent" 
          icon={<TrendingUp className="w-6 h-6 text-cyber-cyan" />}
        />
        <DataCard 
          title="用户满意度" 
          value="92.8" 
          unit="%" 
          trend="up" 
          status="good" 
          icon={<Users className="w-6 h-6 text-pink-400" />}
        />
      </div>

      {/* 流程阶段导航 */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'research', label: '研发阶段', icon: FlaskConical },
            { id: 'testing', label: '检测阶段', icon: Shield },
            { id: 'production', label: '生产阶段', icon: Factory },
            { id: 'packaging', label: '包装阶段', icon: Package },
            { id: 'customs', label: '通关阶段', icon: Globe },
            { id: 'logistics', label: '物流阶段', icon: Truck },
            { id: 'sales', label: '销售阶段', icon: TrendingUp },
            { id: 'feedback', label: '反馈阶段', icon: Users }
          ].map((phase) => {
            const Icon = phase.icon;
            const process = beautyProcesses.find(p => p.id === phase.id);
            return (
              <button
                key={phase.id}
                onClick={() => setActivePhase(phase.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                  activePhase === phase.id
                    ? 'border-pink-400 text-pink-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{phase.label}</span>
                {process && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
                    {getStatusIcon(process.status)}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 流程详情 */}
        <div className="lg:col-span-2 space-y-6">
          <HudPanel className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              {getStatusIcon(activePhase)}
              <span>阶段详情 - {beautyProcesses.find(p => p.id === activePhase)?.name}</span>
            </h3>
            
            {activePhase === 'research' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="text-white font-medium mb-2">成分研究</h4>
                    <div className="text-2xl font-bold text-emerald-green mb-1">85%</div>
                    <div className="text-xs text-gray-400">目标: 90%</div>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="text-white font-medium mb-2">配方优化</h4>
                    <div className="text-2xl font-bold text-cyber-cyan mb-1">78%</div>
                    <div className="text-xs text-gray-400">目标: 85%</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">功效验证</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-pink-400 to-purple-400 h-2 rounded-full" style={{ width: '92%' }} />
                      </div>
                      <span className="text-white text-sm">92%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">安全性评估</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-emerald-green to-cyber-cyan h-2 rounded-full" style={{ width: '88%' }} />
                      </div>
                      <span className="text-white text-sm">88%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePhase === 'testing' && (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="value" fill="#00F0FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <div className="text-gray-400">检测项目总数</div>
                    <div className="text-xl font-bold text-white">1,247</div>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <div className="text-gray-400">平均检测时长</div>
                    <div className="text-xl font-bold text-white">45天</div>
                  </div>
                </div>
              </div>
            )}

            {activePhase === 'production' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <DataCard title="生产批次" value="156" unit="批" trend="up" status="good" small />
                  <DataCard title="合格率" value="96.8" unit="%" trend="up" status="excellent" small />
                  <DataCard title="产能利用率" value="89.2" unit="%" trend="up" status="good" small />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-300">原料验收标准</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-green font-medium">96%</span>
                      <CheckCircle className="w-4 h-4 text-emerald-green" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-300">生产过程控制</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-cyber-cyan font-medium">89%</span>
                      <AlertTriangle className="w-4 h-4 text-cyber-cyan" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-300">成品检验标准</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-green font-medium">94%</span>
                      <CheckCircle className="w-4 h-4 text-emerald-green" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 其他阶段的默认显示 */}
            {!['research', 'testing', 'production'].includes(activePhase) && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {beautyMetrics.slice(0, 4).map((metric, index) => (
                    <div key={index} className="p-4 bg-gray-800 rounded-lg">
                      <div className="text-gray-400 text-sm">{metric.category}</div>
                      <div className="text-2xl font-bold text-white mb-1">{metric.current}%</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-pink-400 to-purple-400 h-2 rounded-full" 
                            style={{ width: `${metric.current}%` }} 
                          />
                        </div>
                        <span className={`text-xs ${metric.trend === 'up' ? 'text-emerald-green' : metric.trend === 'down' ? 'text-alert-red' : 'text-gray-400'}`}>
                          {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </HudPanel>

          {/* 实时监控图表 */}
          <HudPanel className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">美妆供应链实时监控</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={realtimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Line type="monotone" dataKey="研发数量" stroke="#EC4899" strokeWidth={2} />
                <Line type="monotone" dataKey="检测批次" stroke="#8B5CF6" strokeWidth={2} />
                <Line type="monotone" dataKey="生产量" stroke="#06B6D4" strokeWidth={2} />
                <Line type="monotone" dataKey="通关量" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="销售额" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </HudPanel>
        </div>

        {/* 右侧信息面板 */}
        <div className="space-y-6">
          {/* NMPA合规追踪 */}
          <HudPanel className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Award className="w-5 h-5 text-gold-400" />
              <span>NMPA合规追踪</span>
            </h3>
            <div className="space-y-4">
              {nmpaTrackings.map((tracking) => (
                <div key={tracking.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">{tracking.productName}</span>
                    {getStatusIcon(tracking.status)}
                  </div>
                  <div className="text-xs text-gray-400 mb-2">{tracking.enterprise}</div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cyber-cyan text-xs">{tracking.applicationNo}</span>
                    <span className={`text-xs font-medium ${getNMPAColor(tracking.status)}`}>
                      {tracking.status === 'approved' ? '已批准' :
                       tracking.status === 'field_test' ? '现场核查' :
                       tracking.status === 'under_review' ? '技术审评' :
                       tracking.status === 'submitted' ? '已受理' : '已驳回'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">合规评分</span>
                    <span className="text-emerald-green">{tracking.compliance}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-400">风险评分</span>
                    <span className={tracking.riskScore < 30 ? 'text-emerald-green' : tracking.riskScore < 60 ? 'text-cyber-cyan' : 'text-alert-red'}>
                      {tracking.riskScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </HudPanel>

          {/* 关键指标 */}
          <HudPanel className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">关键合规指标</h3>
            <div className="space-y-4">
              {beautyMetrics.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">{metric.category}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${
                        metric.current >= metric.target ? 'text-emerald-green' : 
                        metric.current >= metric.target * 0.9 ? 'text-cyber-cyan' : 'text-alert-red'
                      }`}>
                        {metric.current}%
                      </span>
                      <span className={`text-xs ${
                        metric.trend === 'up' ? 'text-emerald-green' : 
                        metric.trend === 'down' ? 'text-alert-red' : 'text-gray-400'
                      }`}>
                        {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        metric.current >= metric.target ? 'bg-gradient-to-r from-emerald-green to-cyber-cyan' :
                        metric.current >= metric.target * 0.9 ? 'bg-gradient-to-r from-cyber-cyan to-yellow-400' :
                        'bg-gradient-to-r from-red-400 to-alert-red'
                      }`}
                      style={{ width: `${Math.min(metric.current, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>目标: {metric.target}%</span>
                    <span>合规: {metric.compliance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </HudPanel>

          {/* 快速统计 */}
          <HudPanel className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">快速统计</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">参与企业</span>
                <span className="text-white font-bold">1,247</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">在研产品</span>
                <span className="text-white font-bold">234</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">月检测批次</span>
                <span className="text-white font-bold">15,678</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">月销售额</span>
                <span className="text-emerald-green font-bold">¥2.8M</span>
              </div>
            </div>
          </HudPanel>
        </div>
      </div>
    </div>
  );
};
