import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { HudPanel, DataCard, MetricDisplay, StatusBadge } from '../components/ui/HudPanel';
import LogisticsMap from '../components/charts/LogisticsMap';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getEnterpriseSeries, getCategoryDistribution, getProcessFunnel, getSettings } from '../lib/sqlite';
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

const COLORS = ['#00F0FF', '#2E5CFF', '#10B981', '#F59E0B', '#EF4444'];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ gmv: 0, activeOrders: 0, customsRate: 0, logisticsException: 0, successRate: 0, dataSyncDelay: 0, systemLoad: 0 });
  const [enterpriseSeries, setEnterpriseSeries] = useState<{ time: string; online: number; active: number }[]>([]);
  const [categories, setCategories] = useState<{ name: string; value: number; color: string }[]>([]);
  const [funnel, setFunnel] = useState<{ stage: string; count: number }[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      const s = await getDashboardStats();
      const e = await getEnterpriseSeries();
      const c = await getCategoryDistribution();
      const f = await getProcessFunnel();
      setMetrics(s);
      setEnterpriseSeries(e);
      setCategories(c.map(x=>({ name: x.name === 'beauty' ? '美妆' : x.name === 'wine' ? '酒水' : x.name === 'appliance' ? '家电' : x.name, value: x.value, color: x.color })));
      setFunnel(f);
      setLastUpdate(new Date());
    };
    load();
    let timer: any;
    const setup = async () => {
      try {
        const rows = await getSettings();
        const val = rows.find((r: any) => r.key === 'sync_interval')?.value || '5000';
        const delay = Math.max(1000, parseInt(val) || 5000);
        timer = setInterval(load, delay);
      } catch (_) {
        timer = setInterval(load, 5000);
      }
    };
    setup();
    return () => { if (timer) clearInterval(timer); };
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
          onClick={() => navigate('/collaboration')}
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
          onClick={() => navigate('/collaboration')}
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
          onClick={() => navigate('/acceptance')}
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
          onClick={() => navigate('/collaboration')}
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
              <AreaChart data={enterpriseSeries}>
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
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            {categories.map((item, index) => (
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
          {funnel.map((s, idx) => (
            <div key={s.stage} className="flex items-center">
              <div className="px-4 py-3 rounded-lg border border-slate-700 bg-slate-800/50">
                <div className="text-xs text-gray-400">{s.stage}</div>
                <div className="digital-display text-emerald-green font-bold">{s.count.toLocaleString()}</div>
              </div>
              {idx < funnel.length - 1 && (
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
