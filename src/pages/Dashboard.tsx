import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { HudPanel, DataCard, MetricDisplay, StatusBadge } from '../components/ui/HudPanel';
import LogisticsMap from '../components/charts/LogisticsMap';
import { 
  TrendingUp,
  Package,
  Activity,
  Truck,
  DollarSign,
  BarChart3,
  Zap,
  CheckCircle
} from 'lucide-react';

// 模拟实时数据
const generateRealTimeData = () => {
  const now = new Date();
  const timeLabels = [];
  const responseTimeData = [];
  const enterpriseData = [];
  const orderData = [];
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    timeLabels.push(time.getHours() + ':00');
    responseTimeData.push({
      time: time.getHours() + ':00',
      responseTime: Math.random() * 0.8 + 0.5,
      target: 2.0
    });
    enterpriseData.push({
      time: time.getHours() + ':00',
      online: Math.floor(Math.random() * 500) + 800,
      active: Math.floor(Math.random() * 300) + 400
    });
    orderData.push({
      time: time.getHours() + ':00',
      orders: Math.floor(Math.random() * 200) + 300,
      completed: Math.floor(Math.random() * 150) + 200
    });
  }
  
  return { timeLabels, responseTimeData, enterpriseData, orderData };
};

const categoryDistribution = [
  { name: '美妆', value: 45, color: '#00F0FF' },
  { name: '酒水', value: 30, color: '#2E5CFF' },
  { name: '家电', value: 25, color: '#10B981' }
];

const processFunnel = [
  { stage: '订单', count: 8921 },
  { stage: '支付', count: 8756 },
  { stage: '通关', count: 8620 },
  { stage: '物流', count: 8510 },
  { stage: '仓库', count: 8390 }
];

const realtimeMetrics = {
  gmv: 45200000,
  activeOrders: 8921,
  customsRate: 98.5,
  logisticsException: 3,
  successRate: 99.8,
  dataSyncDelay: 0.8,
  systemLoad: 68.5
};

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState(realtimeMetrics);
  const [chartData, setChartData] = useState(generateRealTimeData());
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        gmv: Math.max(0, prev.gmv + Math.floor(Math.random() * 50000 - 20000)),
        activeOrders: Math.max(0, prev.activeOrders + Math.floor(Math.random() * 20 - 10)),
        customsRate: Math.min(100, Math.max(90, prev.customsRate + (Math.random() - 0.5) * 0.2)),
        logisticsException: Math.max(0, prev.logisticsException + Math.floor(Math.random() * 3 - 1)),
        successRate: Math.min(100, Math.max(95, prev.successRate + (Math.random() - 0.5) * 0.2)),
        systemLoad: Math.min(100, Math.max(20, prev.systemLoad + (Math.random() - 0.5) * 5))
      }));
      setChartData(generateRealTimeData());
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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
          <h1 className="text-3xl font-bold text-cyber-cyan mb-2">业务运营控制塔</h1>
          <p className="text-gray-400">聚焦供应链物流、通关与订单流转</p>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge status="active" pulse>实时</StatusBadge>
          <span className="text-sm text-gray-500">
            最后更新: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* 核心业务 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DataCard
          title="GMV (总交易额)"
          value={`¥ ${metrics.gmv.toLocaleString()}`}
          trend="up"
          status="active"
        >
          <div className="mt-4 flex items-center justify-between">
            <DollarSign className="text-cyber-cyan" size={24} />
            <span className="text-xs text-gray-400">交易规模</span>
          </div>
        </DataCard>

        <DataCard
          title="活跃订单"
          value={metrics.activeOrders}
          unit="单"
          trend="up"
          status="active"
        >
          <div className="mt-4 flex items-center justify-between">
            <Package className="text-neon-blue" size={24} />
            <span className="text-xs text-gray-400">在途/处理中</span>
          </div>
        </DataCard>

        <DataCard
          title="通关效率"
          value={metrics.customsRate.toFixed(1)}
          unit="%"
          trend="stable"
          status="active"
        >
          <div className="mt-4 flex items-center justify-between">
            <CheckCircle className="text-emerald-green" size={24} />
            <span className="text-xs text-gray-400">清关通过率</span>
          </div>
        </DataCard>

        <DataCard
          title="物流异常"
          value={metrics.logisticsException}
          trend={metrics.logisticsException > 0 ? 'down' : 'stable'}
          status={metrics.logisticsException > 0 ? 'warning' : 'active'}
        >
          <div className="mt-4 flex items-center justify-between">
            <Truck className="text-alert-red" size={24} />
            <span className="text-xs text-gray-400">延误/阻塞</span>
          </div>
        </DataCard>
      </div>

      {/* 中心视觉（英雄区）：全球物流地图 */}
      <HudPanel title="全球物流态势" subtitle="跨境流向与口岸集群">
        <LogisticsMap height={420} />
      </HudPanel>

      {/* 辅助业务视图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 企业活跃度（保留在侧，弱化技术导向） */}
        <HudPanel title="企业活跃度分析" subtitle="在线与活跃企业对比">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.enterpriseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="online" 
                  stackId="1" 
                  stroke="#2E5CFF" 
                  fill="rgba(46, 92, 255, 0.3)"
                />
                <Area 
                  type="monotone" 
                  dataKey="active" 
                  stackId="1" 
                  stroke="#00F0FF" 
                  fill="rgba(0, 240, 255, 0.3)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </HudPanel>

        {/* 品类分布 */}
        <HudPanel title="重点品类分布" subtitle="美妆/酒水/家电占比">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            {categoryDistribution.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-gray-300">{item.name}</span>
                <span className="digital-display">{item.value}%</span>
              </div>
            ))}
          </div>
        </HudPanel>
      </div>


      {/* 业务流程漏斗 */}
      <HudPanel title="流程漏斗" subtitle="订单 → 支付 → 通关 → 物流 → 仓库">
        <div className="flex items-center space-x-2 overflow-x-auto py-2">
          {processFunnel.map((s, idx) => (
            <div key={s.stage} className="flex items-center">
              <div className="px-4 py-3 rounded-lg border border-slate-700 bg-slate-800/50">
                <div className="text-xs text-gray-400">{s.stage}</div>
                <div className="digital-display text-emerald-green font-bold">{s.count.toLocaleString()}</div>
              </div>
              {idx < processFunnel.length - 1 && (
                <div className="mx-2 text-cyber-cyan">→</div>
              )}
            </div>
          ))}
        </div>
      </HudPanel>

      {/* 技术指标（弱化展示） */}
      <HudPanel title="技术约束状态" subtitle="后台监控（低显）">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MetricDisplay
            label="数据一致性延时"
            value={metrics.dataSyncDelay.toFixed(1)}
            unit="秒"
            icon={<Zap size={16} />}
            change={-12}
            changeLabel="较昨日"
          />
          <MetricDisplay
            label="系统负载"
            value={metrics.systemLoad.toFixed(1)}
            unit="%"
            icon={<BarChart3 size={16} />}
            change={5}
            changeLabel="较昨日"
          />
          <MetricDisplay
            label="成功率"
            value={metrics.successRate.toFixed(1)}
            unit="%"
            icon={<Activity size={16} />}
            change={0.2}
            changeLabel="较昨日"
          />
        </div>
      </HudPanel>
    </div>
  );
};
