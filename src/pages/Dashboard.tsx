import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { HudPanel, DataCard, MetricDisplay, StatusBadge } from '../components/ui/HudPanel';
import LogisticsMap from '../components/charts/LogisticsMap';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getEnterpriseSeries, getCategoryDistribution, getProcessFunnel, getTodayGMV, getPortsCongestion, consistencyCheck, getKpiImprovements, getTradesPerMinute, getLogisticsData, getCurrentLogisticsRoutes } from '../lib/sqlite';
import { 
  Package,
  Activity,
  Truck,
  DollarSign,
  BarChart3,
  Zap,
  CheckCircle
} from 'lucide-react';

 

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ gmv: 0, activeOrders: 0, customsRate: 0, logisticsException: 0, successRate: 0, dataSyncDelay: 0, systemLoad: 0 });
  const [enterpriseSeries, setEnterpriseSeries] = useState<{ time: string; online: number; active: number }[]>([]);
  const [categories, setCategories] = useState<{ name: string; value: number; color: string }[]>([]);
  const [funnel, setFunnel] = useState<{ stage: string; count: number }[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [flows, setFlows] = useState<Array<{ from:[number,number], to:[number,number], tooltip?:string }>>([]);
  const [gmvToday, setGmvToday] = useState(0);
  const [tps, setTps] = useState(0);
  const [ports, setPorts] = useState<{ port:string; index:number }[]>([]);
  const [syncDelay, setSyncDelay] = useState(0);
  const [kpiImp, setKpiImp] = useState<{ acc:number; ef:number; accImp:number; efImp:number }|null>(null);

  useEffect(() => {
    const load = async () => {
      const [s, e, c, f, logisticsList, gmv, portsData, delay, kpi, tpm] = await Promise.all([
        getDashboardStats(),
        getEnterpriseSeries(),
        getCategoryDistribution(),
        getProcessFunnel(),
        getLogisticsData(),
        getTodayGMV(),
        getPortsCongestion(),
        consistencyCheck(),
        getKpiImprovements(),
        getTradesPerMinute(5)
      ])
      const baseActive = s.activeOrders || Math.floor(800 + Math.random() * 4200);
      const overrides = {
        gmv: s.gmv || Math.round((2_000_000 + Math.random() * 40_000_000) * 100) / 100,
        activeOrders: baseActive,
        logisticsException: s.logisticsException || Math.max(50, Math.round(baseActive * (0.02 + Math.random() * 0.03))),
        successRate: (isFinite(s.successRate) && s.successRate > 0) ? s.successRate : Math.round(85 + Math.random() * 10),
        dataSyncDelay: s.dataSyncDelay || Number((0.8 + Math.random() * 0.4).toFixed(1)),
        systemLoad: s.systemLoad || Number((45 + Math.random() * 20).toFixed(1))
      };
      setMetrics({ ...s, ...overrides });
      setEnterpriseSeries(e);
      setCategories(c.map(x=>({
        name: x.name === 'beauty' ? '美妆' : x.name === 'wine' ? '酒水' : x.name === 'appliance' ? '家电' : x.name === 'electronics' ? '电子' : x.name === 'textile' ? '纺织' : x.name,
        value: x.value,
        color: x.color
      })));
      setFunnel(f);
      setLastUpdate(new Date());
      const coords: Record<string, [number, number]> = {
        '上海':[121.4917,31.2333], '深圳':[114.0579,22.5431], '广州':[113.2644,23.1291], '宁波':[121.549,29.868], '青岛':[120.3826,36.0671], '天津':[117.2,39.085], '厦门':[118.089,24.4798],
        '纽约':[-74.006,40.7128], '洛杉矶':[-118.2437,34.0522], '伦敦':[-0.1276,51.5074], '鹿特丹':[4.4777,51.9244], '汉堡':[9.9937,53.5511], '巴黎':[2.3522,48.8566], '马德里':[-3.7038,40.4168],
        '东京':[139.6917,35.6895], '大阪':[135.5022,34.6937], '新加坡':[103.8198,1.3521], '吉隆坡':[101.6869,3.139], '曼谷':[100.5018,13.7563], '悉尼':[151.2093,-33.8688]
      };
      const geo = (city:string):[number,number] => coords[city] ?? [116.4074,39.9042];
      const currentRoutes = await getCurrentLogisticsRoutes();
      const base = (currentRoutes && currentRoutes.length ? currentRoutes : (logisticsList||[])).slice(0,200);
      setFlows(base.map((l:any)=>({ from: geo(String(l.origin||'')), to: geo(String(l.destination||'')), tooltip: `${l.origin} → ${l.destination} ${l.trackingNo||''}` })));
      setGmvToday(gmv || Math.round((1_000_000 + Math.random() * 20_000_000) * 100) / 100);
      setPorts(portsData.map((p:any)=>({ port:p.port, index:p.congestionIndex })));
      setSyncDelay(delay);
      setKpiImp(kpi);
      const perMinute = Math.max(1, tpm/5);
      setTps(perMinute || Math.round(200 + Math.random() * 600));
    };
    load();

    const interval = setInterval(() => {
        if (Math.random() > 0.3) {
            setGmvToday(prev => prev + 5000 + Math.random() * 50000);
        }
        setMetrics(prev => ({
            ...prev,
            activeOrders: Math.max(0, prev.activeOrders + (Math.random() > 0.4 ? Math.floor(Math.random() * 50) - 10 : 0)),
            logisticsException: Math.max(0, prev.logisticsException + Math.floor(Math.random() * 30) - 10),
            dataSyncDelay: Number(Math.max(0.1, Math.min(2.0, prev.dataSyncDelay + (Math.random() * 0.1 - 0.05))).toFixed(1)),
            systemLoad: Number(Math.max(20, Math.min(80, prev.systemLoad + (Math.random() * 4 - 2))).toFixed(1))
        }));
        setTps(p => Math.max(50, Math.min(800, Math.round(p + (Math.random() * 40 - 20)))));
        setLastUpdate(new Date());
        (async () => {
          try {
            const currentRoutes = await getCurrentLogisticsRoutes();
            if (currentRoutes && currentRoutes.length) {
              const coords: Record<string, [number, number]> = {
                '上海':[121.4917,31.2333], '深圳':[114.0579,22.5431], '广州':[113.2644,23.1291], '宁波':[121.549,29.868], '青岛':[120.3826,36.0671], '天津':[117.2,39.085], '厦门':[118.089,24.4798],
                '纽约':[-74.006,40.7128], '洛杉矶':[-118.2437,34.0522], '伦敦':[-0.1276,51.5074], '鹿特丹':[4.4777,51.9244], '汉堡':[9.9937,53.5511], '巴黎':[2.3522,48.8566], '马德里':[-3.7038,40.4168],
                '东京':[139.6917,35.6895], '大阪':[135.5022,34.6937], '新加坡':[103.8198,1.3521], '吉隆坡':[101.6869,3.139], '曼谷':[100.5018,13.7563], '悉尼':[151.2093,-33.8688]
              };
              const geo = (city:string):[number,number] => coords[city] ?? [116.4074,39.9042];
              setFlows(currentRoutes.slice(0,200).map((l:any)=>({ from: geo(String(l.origin||'')), to: geo(String(l.destination||'')), tooltip: `${l.origin} → ${l.destination} ${l.trackingNo||''}` })));
            }
          } catch (_) {}
        })();
    }, 5000); // 改为5秒刷新一次

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <DataCard
          title="GMV (今日出口额)"
          value={`¥ ${gmvToday.toFixed(2)}`}
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
          title="协同TPS"
          value={tps.toFixed(2)}
          unit=""
          trend="stable"
          status="active"
          onClick={() => navigate('/acceptance')}
        >
          <div className="mt-4 flex items-center justify-between">
            <CheckCircle className="text-emerald-green" size={24} />
            <span className="text-xs text-gray-400">实时吞吐量</span>
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

        <DataCard
          title="协同准确率提升"
          value={`${(kpiImp?.accImp||0).toFixed(1)}%`}
          trend={(kpiImp?.accImp||0) >= 10 ? 'up' : 'stable'}
          status={(kpiImp?.accImp||0) >= 10 ? 'active' : 'processing'}
          onClick={() => navigate('/capabilities')}
        >
          <div className="mt-4 flex items-center justify-between">
            <CheckCircle className="text-emerald-green" size={24} />
            <span className="text-xs text-gray-400">当前 {kpiImp?.acc?.toFixed(1)}%，基线 {(kpiImp?.base?.accuracy||0).toFixed?.(1) ? (kpiImp?.base?.accuracy||0).toFixed(1) : kpiImp?.base?.accuracy}</span>
          </div>
        </DataCard>

        <DataCard
          title="效率提升"
          value={`${(kpiImp?.efImp||0).toFixed(1)}%`}
          trend={(kpiImp?.efImp||0) >= 5 ? 'up' : 'stable'}
          status={(kpiImp?.efImp||0) >= 5 ? 'active' : 'processing'}
          onClick={() => navigate('/collaboration')}
        >
          <div className="mt-4 flex items-center justify-between">
            <Activity className="text-neon-blue" size={24} />
            <span className="text-xs text-gray-400">当前 {kpiImp?.ef?.toFixed(1)}%，基线 {(kpiImp?.base?.efficiency||0).toFixed?.(1) ? (kpiImp?.base?.efficiency||0).toFixed(1) : kpiImp?.base?.efficiency}</span>
          </div>
        </DataCard>
      </div>

      {/* 中心视觉（英雄区）：世界物流地图 */}
      <HudPanel title="跨境供应链态势感知" subtitle="世界流向图">
        <LogisticsMap height={420} flows={flows} />
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

      {/* 异常监控雷达：全球主要港口拥堵指数 */}
      <HudPanel title="异常监控雷达" subtitle="全球主要港口拥堵指数">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ports.map(p=> (
            <div key={p.port} className="hud-subpanel p-3">
              <div className="text-xs text-gray-400 mb-1">{p.port}</div>
              <div className="digital-display text-emerald-green text-2xl">{p.index.toFixed(1)}</div>
              <div className="text-xs text-gray-500">拥堵指数</div>
            </div>
          ))}
        </div>
      </HudPanel>


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
            value={(syncDelay || metrics.dataSyncDelay).toFixed(1)}
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
