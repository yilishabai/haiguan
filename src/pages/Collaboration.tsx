import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Package, Truck, CreditCard, Shield, Factory, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, Globe, BarChart3, X, FileText, Activity, Eye } from 'lucide-react';
import { HudPanel, DataCard, StatusBadge, GlowButton } from '../components/ui/HudPanel';
import { BeautyDemo } from '../components/BeautyDemo';
import { getSettlements, getCustomsClearances, getLogisticsData, getPaymentMethods, getInventoryData, queryAll, updateSettlementStatus, updateCustomsStatus, getCollaborationFlows, createOrderFlow, advanceOrderFlow } from '../lib/sqlite';

const DetailModal = ({ isOpen, onClose, title, data, type, onAction }: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  data: any; 
  type: 'settlement' | 'customs' | 'logistics' | 'inventory';
  onAction: (action: string) => void;
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B1120] border border-cyber-cyan/30 rounded-xl p-6 w-[500px] shadow-[0_0_30px_rgba(0,240,255,0.15)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Activity size={20} className="text-cyber-cyan" />
          {title}
        </h3>
        
        <div className="space-y-4 mb-8">
          {Object.entries(data).map(([key, value]) => {
            if (key === 'id' || key === 'status' || key === 'riskLevel' || key === 'compliance' || key === 'riskScore') return null;
            return (
              <div key={key} className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="text-white font-mono">{String(value)}</span>
              </div>
            );
          })}
          
          <div className="flex justify-between border-b border-gray-800 pb-2">
            <span className="text-gray-400">Status</span>
            <StatusBadge status={data.status} />
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            关闭
          </button>
          
          {type === 'settlement' && data.status === 'pending' && (
             <GlowButton onClick={() => onAction('approve')} size="sm">
               审核通过
             </GlowButton>
          )}
          
          {type === 'customs' && data.status === 'inspecting' && (
             <GlowButton onClick={() => onAction('release')} size="sm">
               放行
             </GlowButton>
          )}

          {type === 'logistics' && (
             <GlowButton onClick={() => onAction('track')} size="sm">
               实时追踪
             </GlowButton>
          )}
          
          {(data.status === 'completed' || data.status === 'cleared') && (
             <GlowButton onClick={() => onAction('download')} size="sm" variant="secondary">
               <FileText size={14} className="mr-2" />
               下载凭证
             </GlowButton>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const [overviewSeries, setOverviewSeries] = useState<any[]>([]);
  const [collaborationFlows, setCollaborationFlows] = useState<any[]>([]);
  
  // Modal State
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'settlement' | 'customs' | 'logistics' | 'inventory'>('settlement');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalTitle = modalType === 'settlement' ? '订单结算详情' : modalType === 'customs' ? '报关通关详情' : modalType === 'logistics' ? '智能物流详情' : '库存生产详情';

  const handleOpenModal = (item: any, type: 'settlement' | 'customs' | 'logistics' | 'inventory') => {
    setSelectedItem(item);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleAction = async (action: string) => {
    if (action === 'approve' && selectedItem) {
      await updateSettlementStatus(selectedItem.id, 'completed');
      const s = await getSettlements();
      setOrderSettlements(s as any);
    } else if (action === 'release' && selectedItem) {
      await updateCustomsStatus(selectedItem.id, 'cleared');
      const c = await getCustomsClearances();
      setCustomsClearances(c as any);
    } else if (action === 'track') {
      setActiveTab('logistics');
    } else if (action === 'download' && selectedItem) {
      const blob = new Blob([JSON.stringify(selectedItem, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${modalType}-detail-${selectedItem.id || 'item'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setIsModalOpen(false);
  };

  const handleSimulateOrder = async () => {
    await createOrderFlow();
    const flows = await getCollaborationFlows();
    setCollaborationFlows(flows);
  };

  const handleAdvanceFlow = async (id: string) => {
    await advanceOrderFlow(id);
    const flows = await getCollaborationFlows();
    setCollaborationFlows(flows);
  };

  useEffect(() => {
    const load = async () => {
      const settlements = await getSettlements();
      const customs = await getCustomsClearances();
      const logistics = await getLogisticsData();
      const payments = await getPaymentMethods();
      const inventory = await getInventoryData();
      const flows = await getCollaborationFlows();
      setOrderSettlements(settlements as any);
      setCustomsClearances(customs as any);
      setLogisticsData(logistics as any);
      setPaymentMethods(payments as any);
      setInventoryData(inventory as any);
      setCollaborationFlows(flows);

      const enterprises = await queryAll(`SELECT COUNT(DISTINCT enterprise) as c FROM orders`);
      const settleCompleted = (await queryAll(`SELECT COUNT(*) as c FROM settlements WHERE status='completed'`))[0]?.c || 0;
      const settleTotal = (await queryAll(`SELECT COUNT(*) as c FROM settlements`))[0]?.c || 1;
      const settleAvg = (await queryAll(`SELECT AVG(settlement_time) as a FROM settlements WHERE settlement_time>0`))[0]?.a || 0;
      const customsCleared = (await queryAll(`SELECT COUNT(*) as c FROM customs_clearances WHERE status='cleared'`))[0]?.c || 0;
      const customsTotal = (await queryAll(`SELECT COUNT(*) as c FROM customs_clearances`))[0]?.c || 1;
      const logisticsCompleted = (await queryAll(`SELECT COUNT(*) as c FROM logistics WHERE status='completed'`))[0]?.c || 0;
      const logisticsTotal = (await queryAll(`SELECT COUNT(*) as c FROM logistics`))[0]?.c || 1;
      const invProgress = inventory.reduce((sum: number, x: any) => sum + Math.min(100, (x.current * 100.0) / (x.target || 1)), 0) / (inventory.length || 1);

      const processes: CollaborationProcess[] = [
        { id:'order-settlement', name:'订单结算协同', status:'active', progress: Number(((settleCompleted*100)/settleTotal).toFixed(1)), enterprises: enterprises[0]?.c || 0, avgTime: Number((settleAvg||0).toFixed(1)), successRate: Number(((settleCompleted*100)/settleTotal).toFixed(1)) },
        { id:'customs-clearance', name:'报关通关协同', status:'active', progress: Number(((customsCleared*100)/customsTotal).toFixed(1)), enterprises: enterprises[0]?.c || 0, avgTime: 1.8, successRate: Number(((customsCleared*100)/customsTotal).toFixed(1)) },
        { id:'intelligent-logistics', name:'智能物流协同', status: logisticsCompleted < logisticsTotal ? 'warning' : 'active', progress: Number(((logisticsCompleted*100)/logisticsTotal).toFixed(1)), enterprises: enterprises[0]?.c || 0, avgTime: 3.2, successRate: Number(((logisticsCompleted*100)/logisticsTotal).toFixed(1)) },
        { id:'cross-border-payment', name:'跨境支付协同', status:'active', progress: Number(((settleCompleted*100)/settleTotal).toFixed(1)), enterprises: enterprises[0]?.c || 0, avgTime: 1.5, successRate: Number(((settleCompleted*100)/settleTotal).toFixed(1)) },
        { id:'inventory-production', name:'库存生产协同', status:'pending', progress: Number(invProgress.toFixed(1)), enterprises: enterprises[0]?.c || 0, avgTime: 4.7, successRate: Number(invProgress.toFixed(1)) }
      ];
      setCollaborationProcesses(processes);

      const hours = ['00:00','04:00','08:00','12:00','16:00','20:00'];
      const series = [] as any[];
      for (const h of hours) {
        const orderCount = (await queryAll(`SELECT COUNT(*) as c FROM orders WHERE substr(created_at,12,2)=$h`, { $h: h.slice(0,2) }))[0]?.c || 0;
        const customsCount = (await queryAll(`SELECT COUNT(*) as c FROM customs_clearances`))[0]?.c || 0;
        const logisticsCount = (await queryAll(`SELECT COUNT(*) as c FROM logistics`))[0]?.c || 0;
        const paymentCount = (await queryAll(`SELECT SUM(volume) as v FROM payments`))[0]?.v || 0;
        const inventoryCount = (await queryAll(`SELECT SUM(current) as c FROM inventory`))[0]?.c || 0;
        series.push({ name: h, 订单结算: orderCount, 报关通关: customsCount, 智能物流: logisticsCount, 跨境支付: paymentCount, 库存生产: inventoryCount })
      }
      setOverviewSeries(series)
    };
    load();
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

  const overviewData = overviewSeries;

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
            { id: 'engine', label: '协同引擎', icon: Activity },
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

        {activeTab === 'engine' && (
          <HudPanel className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">协同响应引擎状态机</h3>
              <GlowButton onClick={handleSimulateOrder}>
                <Package size={16} className="mr-2" />
                模拟新订单
              </GlowButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300">订单号</th>
                    <th className="text-left py-3 px-4 text-gray-300">创建时间</th>
                    <th className="text-left py-3 px-4 text-gray-300">企业</th>
                    <th className="text-left py-3 px-4 text-gray-300">金额</th>
                    <th className="text-center py-3 px-4 text-gray-300">协同状态 (Order → Customs → Logistics → Payment → Warehouse)</th>
                    <th className="text-right py-3 px-4 text-gray-300">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {collaborationFlows.map((flow) => (
                    <tr key={flow.id} className="border-b border-gray-800 hover:bg-gray-800">
                      <td className="py-3 px-4 text-cyber-cyan">{flow.order_number}</td>
                      <td className="py-3 px-4 text-gray-400">{flow.created_at?.slice(11,19)}</td>
                      <td className="py-3 px-4 text-white">{flow.enterprise}</td>
                      <td className="py-3 px-4 text-white">{flow.amount?.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-4">
                          {['订单', '通关', '物流', '支付', '入库'].map((label, idx) => {
                            const step = idx + 1;
                            return (
                              <div key={step} className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full mb-1 ${
                                  flow.currentStep > step ? 'bg-emerald-green' :
                                  flow.currentStep === step ? 'bg-cyber-cyan animate-pulse' :
                                  'bg-gray-700'
                                }`} />
                                <span className="text-[10px] text-gray-500">{label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {flow.currentStep < 5 && (
                          <button 
                            onClick={() => handleAdvanceFlow(flow.id)}
                            className="text-xs bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30 px-2 py-1 rounded transition-colors"
                          >
                            推进流程
                          </button>
                        )}
                        {flow.currentStep === 5 && (
                          <span className="text-xs text-emerald-green flex items-center justify-end gap-1">
                            <CheckCircle size={12} />
                            已完成
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </HudPanel>
        )}

        {activeTab === 'settlement' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <DataCard title="今日结算总额" value={orderSettlements.reduce((s, x) => s + (x.amount||0), 0).toLocaleString()} unit="USD" trend="up" status="active" />
              <DataCard title="结算订单数" value={orderSettlements.length} unit="笔" trend="up" status="active" />
              <DataCard title="平均结算时间" value={(orderSettlements.reduce((s, x) => s + (x.settlementTime||0), 0) / (orderSettlements.length||1)).toFixed(1)} unit="小时" trend="down" status="active" />
              <DataCard title="结算成功率" value={(orderSettlements.filter(x => x.status==='completed').length * 100 / (orderSettlements.length||1)).toFixed(1)} unit="%" trend="up" status="active" />
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
                      <tr
                        key={order.id}
                        className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
                        onClick={() => handleOpenModal(order, 'settlement')}
                      >
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
                      <tr
                        key={clearance.id}
                        className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
                        onClick={() => handleOpenModal(clearance, 'customs')}
                      >
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
                      <tr
                        key={logistics.id}
                        className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
                        onClick={() => handleOpenModal(logistics, 'logistics')}
                      >
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
                      <tr
                        key={index}
                        className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
                        onClick={() => handleOpenModal(item, 'inventory')}
                      >
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
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        data={selectedItem}
        type={modalType}
        onAction={handleAction}
      />
    </div>
  );
};
