import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Package, Truck, CreditCard, Shield, Factory, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, Globe, BarChart3 } from 'lucide-react';
import { HudPanel, DataCard, StatusBadge, GlowButton } from '../components/ui/HudPanel';
import { BeautyDemo } from '../components/BeautyDemo';

interface CollaborationProcess {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'completed' | 'warning';
  progress: number;
  enterprises: number;
  avgTime: number;
  successRate: number;
}

interface OrderSettlement {
  id: string;
  orderNo: string;
  enterprise: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  settlementTime: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface CustomsClearance {
  id: string;
  declarationNo: string;
  product: string;
  enterprise: string;
  status: 'declared' | 'inspecting' | 'cleared' | 'held';
  clearanceTime: number;
  compliance: number;
  riskScore: number;
}

interface LogisticsInfo {
  id: string;
  trackingNo: string;
  origin: string;
  destination: string;
  status: 'pickup' | 'transit' | 'customs' | 'delivery' | 'completed';
  estimatedTime: number;
  actualTime: number;
  efficiency: number;
}

interface PaymentData {
  method: string;
  volume: number;
  amount: number;
  successRate: number;
  avgTime: number;
}

export const Collaboration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [collaborationProcesses, setCollaborationProcesses] = useState<CollaborationProcess[]>([]);
  const [orderSettlements, setOrderSettlements] = useState<OrderSettlement[]>([]);
  const [customsClearances, setCustomsClearances] = useState<CustomsClearance[]>([]);
  const [logisticsData, setLogisticsData] = useState<LogisticsInfo[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentData[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);

  // 实时数据模拟
  useEffect(() => {
    const generateCollaborationProcesses = (): CollaborationProcess[] => [
      {
        id: 'order-settlement',
        name: '订单结算协同',
        status: 'active',
        progress: 87.3,
        enterprises: 1247,
        avgTime: 2.1,
        successRate: 98.7
      },
      {
        id: 'customs-clearance',
        name: '报关通关协同',
        status: 'active',
        progress: 92.5,
        enterprises: 892,
        avgTime: 1.8,
        successRate: 99.2
      },
      {
        id: 'intelligent-logistics',
        name: '智能物流协同',
        status: 'warning',
        progress: 76.8,
        enterprises: 634,
        avgTime: 3.2,
        successRate: 94.3
      },
      {
        id: 'cross-border-payment',
        name: '跨境支付协同',
        status: 'active',
        progress: 89.1,
        enterprises: 1156,
        avgTime: 1.5,
        successRate: 99.8
      },
      {
        id: 'inventory-production',
        name: '库存生产协同',
        status: 'pending',
        progress: 68.4,
        enterprises: 789,
        avgTime: 4.7,
        successRate: 91.6
      }
    ];

    const generateOrderSettlements = (): OrderSettlement[] => [
      { id: '1', orderNo: 'OS20241227001', enterprise: '上海美妆集团', amount: 285000, currency: 'USD', status: 'completed', settlementTime: 1.8, riskLevel: 'low' },
      { id: '2', orderNo: 'OS20241227002', enterprise: '深圳电子科技', amount: 156000, currency: 'EUR', status: 'processing', settlementTime: 2.3, riskLevel: 'medium' },
      { id: '3', orderNo: 'OS20241227003', enterprise: '广州食品进出口', amount: 89000, currency: 'USD', status: 'pending', settlementTime: 0, riskLevel: 'high' },
      { id: '4', orderNo: 'OS20241227004', enterprise: '宁波服装贸易', amount: 234000, currency: 'GBP', status: 'completed', settlementTime: 1.5, riskLevel: 'low' },
      { id: '5', orderNo: 'OS20241227005', enterprise: '青岛机械制造', amount: 445000, currency: 'USD', status: 'failed', settlementTime: 5.2, riskLevel: 'high' }
    ];

    const generateCustomsClearances = (): CustomsClearance[] => [
      { id: '1', declarationNo: 'CD20241227001', product: '化妆品套装', enterprise: '上海美妆集团', status: 'cleared', clearanceTime: 2.1, compliance: 98.5, riskScore: 12 },
      { id: '2', declarationNo: 'CD20241227002', product: '智能手机', enterprise: '深圳电子科技', status: 'inspecting', clearanceTime: 1.8, compliance: 94.2, riskScore: 28 },
      { id: '3', declarationNo: 'CD20241227003', product: '红酒礼盒', enterprise: '广州食品进出口', status: 'declared', clearanceTime: 0, compliance: 89.7, riskScore: 45 },
      { id: '4', declarationNo: 'CD20241227004', product: '时尚服装', enterprise: '宁波服装贸易', status: 'held', clearanceTime: 4.2, compliance: 76.3, riskScore: 67 },
      { id: '5', declarationNo: 'CD20241227005', product: '机械设备', enterprise: '青岛机械制造', status: 'cleared', clearanceTime: 1.5, compliance: 99.1, riskScore: 8 }
    ];

    const generateLogisticsData = (): LogisticsInfo[] => [
      { id: '1', trackingNo: 'SF1234567890', origin: '上海', destination: '纽约', status: 'delivery', estimatedTime: 72, actualTime: 68, efficiency: 94.4 },
      { id: '2', trackingNo: 'YT0987654321', origin: '深圳', destination: '伦敦', status: 'customs', estimatedTime: 96, actualTime: 89, efficiency: 92.7 },
      { id: '3', trackingNo: 'ZTO1122334455', origin: '广州', destination: '东京', status: 'transit', estimatedTime: 48, actualTime: 45, efficiency: 93.8 },
      { id: '4', trackingNo: 'EMS5566778899', origin: '宁波', destination: '悉尼', status: 'pickup', estimatedTime: 120, actualTime: 115, efficiency: 95.8 },
      { id: '5', trackingNo: 'JD2233445566', origin: '青岛', destination: '新加坡', status: 'completed', estimatedTime: 60, actualTime: 58, efficiency: 96.7 }
    ];

    const generatePaymentMethods = (): PaymentData[] => [
      { method: '信用证', volume: 3421, amount: 12500000, successRate: 99.8, avgTime: 2.1 },
      { method: '电汇', volume: 5678, amount: 8900000, successRate: 98.5, avgTime: 1.8 },
      { method: '支付宝', volume: 8923, amount: 5600000, successRate: 99.9, avgTime: 0.5 },
      { method: '微信支付', volume: 4567, amount: 3200000, successRate: 99.7, avgTime: 0.3 },
      { method: '数字货币', volume: 234, amount: 1800000, successRate: 95.2, avgTime: 3.5 }
    ];

    const generateInventoryData = () => [
      { name: '化妆品', current: 12500, target: 15000, production: 2800, sales: 3200, efficiency: 83.3 },
      { name: '电子产品', current: 8900, target: 12000, production: 2100, sales: 1950, efficiency: 74.2 },
      { name: '服装', current: 15600, target: 18000, production: 4200, sales: 3800, efficiency: 86.7 },
      { name: '食品', current: 6800, target: 8000, production: 1500, sales: 1700, efficiency: 85.0 },
      { name: '机械设备', current: 3200, target: 4500, production: 800, sales: 750, efficiency: 71.1 }
    ];

    setCollaborationProcesses(generateCollaborationProcesses());
    setOrderSettlements(generateOrderSettlements());
    setCustomsClearances(generateCustomsClearances());
    setLogisticsData(generateLogisticsData());
    setPaymentMethods(generatePaymentMethods());
    setInventoryData(generateInventoryData());

    const interval = setInterval(() => {
      // 模拟实时数据更新
      setCollaborationProcesses(generateCollaborationProcesses());
      setOrderSettlements(generateOrderSettlements());
      setCustomsClearances(generateCustomsClearances());
      setLogisticsData(generateLogisticsData());
      setPaymentMethods(generatePaymentMethods());
      setInventoryData(generateInventoryData());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'cleared':
        return <CheckCircle className="w-4 h-4 text-emerald-green" />;
      case 'warning':
      case 'held':
        return <AlertTriangle className="w-4 h-4 text-alert-red" />;
      case 'pending':
      case 'inspecting':
        return <Clock className="w-4 h-4 text-cyber-cyan" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-emerald-green';
      case 'medium': return 'text-cyber-cyan';
      case 'high': return 'text-alert-red';
      default: return 'text-gray-400';
    }
  };

  const overviewData = [
    { name: '00:00', 订单结算: 120, 报关通关: 98, 智能物流: 85, 跨境支付: 110, 库存生产: 75 },
    { name: '04:00', 订单结算: 98, 报关通关: 102, 智能物流: 92, 跨境支付: 95, 库存生产: 88 },
    { name: '08:00', 订单结算: 156, 报关通关: 145, 智能物流: 128, 跨境支付: 162, 库存生产: 135 },
    { name: '12:00', 订单结算: 189, 报关通关: 178, 智能物流: 156, 跨境支付: 195, 库存生产: 167 },
    { name: '16:00', 订单结算: 167, 报关通关: 165, 智能物流: 148, 跨境支付: 172, 库存生产: 152 },
    { name: '20:00', 订单结算: 143, 报关通关: 138, 智能物流: 125, 跨境支付: 148, 库存生产: 128 }
  ];

  const paymentPieData = paymentMethods.map((item, index) => ({
    name: item.method,
    value: item.volume,
    amount: item.amount
  }));

  const COLORS = ['#00F0FF', '#2E5CFF', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">平台与协同</h1>
          <p className="text-gray-400">跨境供应链全流程协同管理中心</p>
        </div>
        <div className="flex space-x-4">
          <GlowButton variant="primary">协同监控</GlowButton>
          <GlowButton variant="secondary">流程优化</GlowButton>
        </div>
      </div>

      {/* 协同流程总览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {collaborationProcesses.map((process) => (
          <HudPanel key={process.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">{process.name}</h3>
              {getStatusIcon(process.status)}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>进度</span>
                <span>{process.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-cyber-cyan to-neon-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${process.progress}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">企业数:</span>
                  <span className="text-white ml-1">{process.enterprises}</span>
                </div>
                <div>
                  <span className="text-gray-400">平均时长:</span>
                  <span className="text-white ml-1">{process.avgTime}h</span>
                </div>
              </div>
              <div className="text-xs">
                <span className="text-gray-400">成功率:</span>
                <span className="text-emerald-green ml-1">{process.successRate}%</span>
              </div>
            </div>
          </HudPanel>
        ))}
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: '协同总览', icon: BarChart3 },
            { id: 'beauty-demo', label: '美妆演示', icon: Package },
            { id: 'settlement', label: '订单结算', icon: DollarSign },
            { id: 'customs', label: '报关通关', icon: Shield },
            { id: 'logistics', label: '智能物流', icon: Truck },
            { id: 'payment', label: '跨境支付', icon: CreditCard },
            { id: 'inventory', label: '库存生产', icon: Factory }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-cyber-cyan text-cyber-cyan'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 标签页内容 */}
      <div className="space-y-6">
        {activeTab === 'beauty-demo' && <BeautyDemo />}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HudPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">协同流程趋势</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={overviewData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line type="monotone" dataKey="订单结算" stroke="#00F0FF" strokeWidth={2} />
                  <Line type="monotone" dataKey="报关通关" stroke="#2E5CFF" strokeWidth={2} />
                  <Line type="monotone" dataKey="智能物流" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="跨境支付" stroke="#F59E0B" strokeWidth={2} />
                  <Line type="monotone" dataKey="库存生产" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </HudPanel>

            <HudPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">实时协同状态</h3>
              <div className="space-y-4">
                {collaborationProcesses.map((process) => (
                  <div key={process.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(process.status)}
                      <span className="text-white font-medium">{process.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">{process.enterprises} 企业</div>
                      <div className="text-xs text-gray-400">{process.successRate}% 成功率</div>
                    </div>
                  </div>
                ))}
              </div>
            </HudPanel>
          </div>
        )}

        {activeTab === 'settlement' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <DataCard title="今日结算总额" value="$2.8M" unit="美元" trend="up" status="good" />
              <DataCard title="结算订单数" value="156" unit="笔" trend="up" status="good" />
              <DataCard title="平均结算时间" value="1.8" unit="小时" trend="down" status="good" />
              <DataCard title="结算成功率" value="98.7" unit="%" trend="up" status="excellent" />
            </div>

            <HudPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">订单结算详情</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">订单号</th>
                      <th className="text-left py-3 px-4 text-gray-300">企业</th>
                      <th className="text-left py-3 px-4 text-gray-300">金额</th>
                      <th className="text-left py-3 px-4 text-gray-300">状态</th>
                      <th className="text-left py-3 px-4 text-gray-300">结算时间</th>
                      <th className="text-left py-3 px-4 text-gray-300">风险等级</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderSettlements.map((order) => (
                      <tr key={order.id} className="border-b border-gray-800 hover:bg-gray-800">
                        <td className="py-3 px-4 text-cyber-cyan">{order.orderNo}</td>
                        <td className="py-3 px-4 text-white">{order.enterprise}</td>
                        <td className="py-3 px-4 text-white">
                          {order.currency} {order.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="py-3 px-4 text-white">
                          {order.settlementTime > 0 ? `${order.settlementTime}h` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${getRiskColor(order.riskLevel)}`}>
                            {order.riskLevel === 'low' ? '低风险' : order.riskLevel === 'medium' ? '中风险' : '高风险'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </HudPanel>
          </div>
        )}

        {activeTab === 'customs' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <DataCard title="今日通关量" value="892" unit="票" trend="up" status="good" />
              <DataCard title="通关时效" value="1.8" unit="小时" trend="down" status="excellent" />
              <DataCard title="合规率" value="99.2" unit="%" trend="up" status="excellent" />
              <DataCard title="查验率" value="3.2" unit="%" trend="down" status="good" />
            </div>

            <HudPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">报关通关监控</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">报关单号</th>
                      <th className="text-left py-3 px-4 text-gray-300">商品</th>
                      <th className="text-left py-3 px-4 text-gray-300">企业</th>
                      <th className="text-left py-3 px-4 text-gray-300">状态</th>
                      <th className="text-left py-3 px-4 text-gray-300">通关时间</th>
                      <th className="text-left py-3 px-4 text-gray-300">合规评分</th>
                      <th className="text-left py-3 px-4 text-gray-300">风险评分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customsClearances.map((clearance) => (
                      <tr key={clearance.id} className="border-b border-gray-800 hover:bg-gray-800">
                        <td className="py-3 px-4 text-cyber-cyan">{clearance.declarationNo}</td>
                        <td className="py-3 px-4 text-white">{clearance.product}</td>
                        <td className="py-3 px-4 text-white">{clearance.enterprise}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={clearance.status} />
                        </td>
                        <td className="py-3 px-4 text-white">
                          {clearance.clearanceTime > 0 ? `${clearance.clearanceTime}h` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-emerald-green">{clearance.compliance}%</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={clearance.riskScore < 30 ? 'text-emerald-green' : clearance.riskScore < 60 ? 'text-cyber-cyan' : 'text-alert-red'}>
                            {clearance.riskScore}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </HudPanel>
          </div>
        )}

        {activeTab === 'logistics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <DataCard title="物流订单数" value="634" unit="票" trend="up" status="good" />
              <DataCard title="平均时效" value="68" unit="小时" trend="down" status="good" />
              <DataCard title="准时率" value="94.3" unit="%" trend="up" status="good" />
              <DataCard title="物流效率" value="92.7" unit="%" trend="up" status="good" />
            </div>

            <HudPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">智能物流追踪</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">运单号</th>
                      <th className="text-left py-3 px-4 text-gray-300">始发地</th>
                      <th className="text-left py-3 px-4 text-gray-300">目的地</th>
                      <th className="text-left py-3 px-4 text-gray-300">状态</th>
                      <th className="text-left py-3 px-4 text-gray-300">预计时间</th>
                      <th className="text-left py-3 px-4 text-gray-300">实际时间</th>
                      <th className="text-left py-3 px-4 text-gray-300">效率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logisticsData.map((logistics) => (
                      <tr key={logistics.id} className="border-b border-gray-800 hover:bg-gray-800">
                        <td className="py-3 px-4 text-cyber-cyan">{logistics.trackingNo}</td>
                        <td className="py-3 px-4 text-white">{logistics.origin}</td>
                        <td className="py-3 px-4 text-white">{logistics.destination}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={logistics.status} />
                        </td>
                        <td className="py-3 px-4 text-white">{logistics.estimatedTime}h</td>
                        <td className="py-3 px-4 text-white">{logistics.actualTime}h</td>
                        <td className="py-3 px-4">
                          <span className="text-emerald-green">{logistics.efficiency}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </HudPanel>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <DataCard title="支付总额" value="$32.5M" unit="美元" trend="up" status="excellent" />
              <DataCard title="支付笔数" value="22.8K" unit="笔" trend="up" status="good" />
              <DataCard title="支付成功率" value="99.8" unit="%" trend="up" status="excellent" />
              <DataCard title="平均耗时" value="0.8" unit="秒" trend="down" status="excellent" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HudPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">支付方式分布</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </HudPanel>

              <HudPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">支付方式详情</h3>
                <div className="space-y-4">
                  {paymentMethods.map((payment, index) => (
                    <div key={payment.method} className="p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{payment.method}</span>
                        <span className="text-emerald-green">{payment.successRate}%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">交易量:</span>
                          <span className="text-white ml-1">{payment.volume.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">金额:</span>
                          <span className="text-white ml-1">${(payment.amount / 1000000).toFixed(1)}M</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        平均耗时: {payment.avgTime}秒
                      </div>
                    </div>
                  ))}
                </div>
              </HudPanel>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <DataCard title="库存总量" value="46.8K" unit="件" trend="up" status="good" />
              <DataCard title="生产效率" value="84.1" unit="%" trend="up" status="good" />
              <DataCard title="库存周转" value="12.5" unit="天" trend="down" status="good" />
              <DataCard title="产销平衡" value="96.2" unit="%" trend="up" status="excellent" />
            </div>

            <HudPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">库存生产协同</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">商品类别</th>
                      <th className="text-left py-3 px-4 text-gray-300">当前库存</th>
                      <th className="text-left py-3 px-4 text-gray-300">目标库存</th>
                      <th className="text-left py-3 px-4 text-gray-300">日产量</th>
                      <th className="text-left py-3 px-4 text-gray-300">日销量</th>
                      <th className="text-left py-3 px-4 text-gray-300">效率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryData.map((item, index) => (
                      <tr key={index} className="border-b border-gray-800 hover:bg-gray-800">
                        <td className="py-3 px-4 text-white font-medium">{item.name}</td>
                        <td className="py-3 px-4 text-white">{item.current.toLocaleString()}</td>
                        <td className="py-3 px-4 text-white">{item.target.toLocaleString()}</td>
                        <td className="py-3 px-4 text-white">{item.production.toLocaleString()}</td>
                        <td className="py-3 px-4 text-white">{item.sales.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={item.efficiency >= 85 ? 'text-emerald-green' : item.efficiency >= 75 ? 'text-cyber-cyan' : 'text-alert-red'}>
                            {item.efficiency}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </HudPanel>
          </div>
        )}
      </div>
    </div>
  );
};