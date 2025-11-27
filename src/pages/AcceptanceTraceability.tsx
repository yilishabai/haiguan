import React, { useState, useEffect, useRef } from 'react';
import { HudPanel, GlowButton } from '../components/ui/HudPanel';
import { queryAll } from '../lib/sqlite';
import { 
  LineChart, Line, ResponsiveContainer, YAxis 
} from 'recharts';
import { 
  FileText, Plane, Zap, Package, CheckCircle, 
  MapPin, Activity, Thermometer, ShieldCheck, 
  FileCheck, Box
} from 'lucide-react';

// --- Types & Data ---

interface TimelineEvent {
  id: string;
  time: string;
  date: string;
  title: string;
  location: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'pending';
  details?: React.ReactNode;
}

const tempData = Array.from({ length: 40 }, (_, i) => ({
  time: i,
  value: 22 + Math.random() * 0.5 - 0.25
}));

const auditLogs = [
  "[System] 收到支付单据，金额校验通过...",
  "[AI] OCR识别箱单，与订单信息比对一致...",
  "[Customs] 预归类建议算法启动...",
  "[Risk] 无违禁成分，风险等级：低...",
  "[IoT] 冷链设备心跳检测正常 (ID: #IoT-8821)...",
  "[System] 原始产地证验真通过 (Certificate #FR-2025)...",
  "[Blockchain] 节点数据上链成功，哈希值生成...",
  "[Customs] 申报单逻辑检查通过...",
  "[System] 舱单信息已同步至监管平台...",
  "[AI] 图像识别比对：包装完好率 99.9%...",
  "[System] 税款预估计算完成...",
  "[Logistics] 车辆 GPS 轨迹偏移检测：无异常..."
];

// --- Components ---

const ProductPassport = ({ order }: { order?: { order_number?: string; enterprise?: string; category?: string } }) => (
  <HudPanel className="h-full flex flex-col" title="Product Passport" subtitle="商品数字护照">
    <div className="flex-1 flex flex-col items-center p-6 space-y-6">
      {/* Product Image Placeholder */}
      <div className="relative w-48 h-48 group">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-700/20 to-amber-900/40 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
        <div className="relative w-full h-full rounded-2xl border border-amber-700/30 bg-[#0B1120]/80 flex items-center justify-center backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1887&auto=format&fit=crop')] bg-cover bg-center opacity-80 hover:scale-110 transition-transform duration-700"></div>
          {/* Fallback if image fails or just overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
             <span className="text-amber-200 text-xs font-mono">{order?.enterprise || 'Enterprise'}</span>
          </div>
        </div>
        <div className="absolute -top-2 -right-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1">
          <CheckCircle size={10} />
          <span>Authentic</span>
        </div>
      </div>

      {/* Details List */}
      <div className="w-full space-y-4 font-mono text-sm">
        <div className="group p-3 rounded-lg bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
          <div className="text-gray-500 text-xs mb-1">SKU Coding</div>
          <div className="text-amber-100 font-semibold tracking-wider">{order?.order_number || 'SKU'}</div>
        </div>

        <div className="group p-3 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors">
          <div className="text-gray-500 text-xs mb-1">Origin</div>
          <div className="text-blue-100 flex items-center gap-2">
            <MapPin size={14} className="text-blue-400" />
            {order?.category === 'beauty' ? 'France (Bordeaux)' : 'China'}
          </div>
        </div>

        <div className="group p-3 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors">
          <div className="text-gray-500 text-xs mb-1">HS Code</div>
          <div className="flex justify-between items-center">
            <span className="text-emerald-100">{order ? (order.category==='beauty'?'3304.9900':order.category==='wine'?'2204.2100':'8537.1000') : '3304.9900'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Auto Match
            </span>
          </div>
        </div>

        <div className="group p-3 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors">
          <div className="text-gray-500 text-xs mb-1">Registration Status</div>
          <div className="flex items-center gap-2 text-purple-200">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
            {order ? (order.category==='beauty'?'NMPA Filed':'CFDA/CIQ') : 'NMPA Filed'}
          </div>
        </div>
      </div>
    </div>
  </HudPanel>
);

const TimelineNode = ({ event, isLast }: { event: TimelineEvent; isLast: boolean }) => (
  <div className="relative pl-8 pb-12 last:pb-0">
    {/* Line */}
    {!isLast && (
      <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 to-blue-500/10"></div>
    )}
    
    {/* Icon */}
    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-[#0B1120] border border-blue-500/50 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
      <event.icon size={14} className="text-blue-400" />
    </div>

    {/* Content */}
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors ml-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-blue-100 font-medium flex items-center gap-2">
            {event.title}
            <span className="text-xs text-gray-500 font-normal px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              {event.location}
            </span>
          </h3>
          <div className="text-xs text-gray-400 mt-1 font-mono">
            {event.date} <span className="text-gray-600">|</span> {event.time}
          </div>
        </div>
      </div>
      
      {event.details && (
        <div className="mt-3 pt-3 border-t border-white/5">
          {event.details}
        </div>
      )}
    </div>
  </div>
);

const TraceabilityTimeline = () => {
  const events: TimelineEvent[] = [
    {
      id: '1',
      date: '2025-11-24',
      time: '09:00',
      title: 'Warehouse Outbound',
      location: 'France',
      icon: Box,
      status: 'completed',
      details: (
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="p-2 rounded bg-blue-500/10 text-blue-400 group-hover:text-blue-300 transition-colors">
            <FileCheck size={16} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Attached Document</div>
            <div className="text-sm text-blue-200 underline decoration-blue-500/30 underline-offset-2">Origin_Certificate.pdf</div>
          </div>
        </div>
      )
    },
    {
      id: '2',
      date: '2025-11-25',
      time: '14:00',
      title: 'Intl. Transport',
      location: 'Air Freight',
      icon: Plane,
      status: 'completed',
      details: (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 flex items-center gap-1">
              <Thermometer size={12} /> Avg Temp
            </span>
            <span className="text-emerald-400 font-mono">22°C</span>
          </div>
          <div className="h-12 w-full bg-emerald-900/10 rounded border border-emerald-500/20 overflow-hidden relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tempData}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={1.5} 
                  dot={false} 
                />
                <YAxis domain={['dataMin', 'dataMax']} hide />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    },
    {
      id: '3',
      date: '2025-11-26',
      time: '08:30',
      title: 'Customs Declaration',
      location: 'China',
      icon: ShieldCheck,
      status: 'completed',
      details: (
        <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-3 rounded border-l-2 border-amber-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-400 fill-amber-400" />
            <span className="text-amber-100 text-sm font-medium">Lightning Release</span>
          </div>
          <div className="text-xs font-mono text-amber-200/70">
            08:30:00 <span className="text-gray-500">→</span> 08:30:05
          </div>
        </div>
      )
    },
    {
      id: '4',
      date: '2025-11-26',
      time: '10:00',
      title: 'Bonded Warehouse',
      location: 'Hangzhou',
      icon: Package,
      status: 'completed',
      details: (
        <div className="flex items-center gap-2 text-sm text-emerald-300">
           <CheckCircle size={14} />
           Inventory Synced
        </div>
      )
    }
  ];

  return (
    <HudPanel className="h-full overflow-hidden flex flex-col" title="Traceability Timeline" subtitle="全链路时空轨迹">
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-md mx-auto">
          {events.map((event, index) => (
            <TimelineNode key={event.id} event={event} isLast={index === events.length - 1} />
          ))}
        </div>
      </div>
    </HudPanel>
  );
};

const AuditLog = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState(auditLogs);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLogs = [...prev.slice(1), prev[0]]; // Rotate logs
        return newLogs;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <HudPanel className="h-full flex flex-col" title="Audit Log" subtitle="智能验算日志">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-hidden p-4 font-mono text-xs space-y-3 bg-black/20"
      >
        {logs.map((log, i) => {
          const type = log.match(/^\[(.*?)\]/)?.[1] || 'Info';
          let colorClass = 'text-gray-400';
          if (type === 'System') colorClass = 'text-blue-400';
          if (type === 'AI') colorClass = 'text-purple-400';
          if (type === 'Customs') colorClass = 'text-amber-400';
          if (type === 'Risk') colorClass = 'text-emerald-400';
          if (type === 'IoT') colorClass = 'text-cyan-400';

          return (
            <div key={i} className="flex gap-2 border-b border-white/5 pb-2 last:border-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <span className="text-gray-600 select-none">{new Date().toLocaleTimeString()}</span>
              <span className={colorClass}>
                {log}
              </span>
            </div>
          );
        })}
        
        <div className="h-8 bg-gradient-to-t from-[#0B1120] to-transparent absolute bottom-0 left-0 right-0 pointer-events-none"></div>
      </div>
    </HudPanel>
  );
};

export const AcceptanceTraceability: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const rows = await queryAll(`SELECT id, order_number, enterprise, category FROM orders WHERE order_number LIKE $q OR enterprise LIKE $q LIMIT 50`, { $q: `%${query}%` });
      setResults(rows);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] min-h-[600px] w-full p-2">
      <div className="mb-3 flex items-center gap-2">
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="检索商品/企业/订单号" className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        <GlowButton size="sm" onClick={handleSearch}>检索</GlowButton>
      </div>
      {!selected && (
        <div className="mb-4 p-3 bg-slate-800/50 border border-slate-700 rounded">
          <div className="text-sm text-gray-400 mb-2">检索结果</div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {loading ? <div className="text-gray-400">加载中...</div> : results.map(r => (
              <button key={r.id} className="w-full text-left px-2 py-1 rounded hover:bg-slate-700 text-white text-sm" onClick={()=>setSelected(r)}>
                {r.order_number} ・ {r.enterprise} ・ {r.category}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        {/* Left: 25% */}
        <div className="lg:col-span-1 h-full">
          <ProductPassport order={selected || undefined} />
        </div>

        {/* Center: 50% (2 cols in 4-col grid) */}
        <div className="lg:col-span-2 h-full">
          {selected ? <TraceabilityTimeline /> : (
            <HudPanel className="h-full flex items-center justify-center" title="等待检索结果">
              <div className="text-gray-400">请输入关键词并选择商品</div>
            </HudPanel>
          )}
        </div>

        {/* Right: 25% */}
        <div className="lg:col-span-1 h-full">
          {selected ? <AuditLog /> : (
            <HudPanel className="h-full flex items-center justify-center" title="提示">
              <div className="text-gray-400">选中商品后显示日志</div>
            </HudPanel>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptanceTraceability;
