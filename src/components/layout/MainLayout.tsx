import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  Brain, 
  Network, 
  CheckCircle,
  Menu,
  X,
  Settings,
  Bell
} from 'lucide-react';
import { StatusBadge } from '../ui/HudPanel';
import { getSettings } from '../../lib/sqlite';

interface MainLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { 
    icon: LayoutDashboard, 
    label: '首页总览', 
    path: '/',
    description: '全局态势感知中心'
  },
  { 
    icon: Brain, 
    label: '能力与模型', 
    path: '/capabilities',
    description: '算法库与业务模型'
  },
  { 
    icon: Network, 
    label: '供应链协同', 
    path: '/collaboration',
    description: '智能订单管理工作台',
    badge: '核心'
  },
  { 
    icon: CheckCircle, 
    label: '数字溯源与验收', 
    path: '/acceptance',
    description: '溯源验收单与指标核算'
  },
  { 
    icon: Settings, 
    label: '系统设置', 
    path: '/settings',
    description: '平台配置管理'
  }
];

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const systemStats = {
    onlineEnterprises: 1247,
    activeOrders: 8932,
    responseTime: 1.2,
    successRate: 99.8
  };

  useEffect(() => {
    const apply = async () => {
      try {
        const rows = await getSettings();
        const theme = rows.find((r: any) => r.key === 'theme')?.value || 'dark';
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
      } catch (_) {}
    };
    apply();
  }, []);

  return (
    <div className="min-h-screen bg-deep-space text-white">
      {/* 顶部状态栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors lg:hidden"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyber-cyan to-neon-blue rounded-lg flex items-center justify-center">
                <span className="text-deep-space font-bold text-sm">SC</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-cyber-cyan">跨境供应链协同平台</h1>
                <p className="text-xs text-gray-400">Cross-Border Supply Chain Collaboration</p>
              </div>
            </div>
          </div>

          {/* 系统状态指标 */}
          <div className="hidden md:flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">在线企业:</span>
              <span className="digital-display font-bold">{systemStats.onlineEnterprises.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">活跃订单:</span>
              <span className="digital-display font-bold">{systemStats.activeOrders.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">响应时间:</span>
              <span className="digital-display font-bold">{systemStats.responseTime}s</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">成功率:</span>
              <span className="text-emerald-green font-bold">{systemStats.successRate}%</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-lg hover:bg-slate-800 transition-colors relative">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-alert-red rounded-full"></span>
            </button>
            <div className="w-8 h-8 bg-gradient-to-r from-cyber-cyan to-neon-blue rounded-full"></div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* 侧边栏 */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/90 backdrop-blur-md border-r border-slate-700 transform transition-transform duration-300 ease-in-out pt-16 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-gradient-to-r from-cyber-cyan/20 to-neon-blue/20 border border-cyber-cyan/30 text-cyber-cyan' 
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} className={`${isActive ? 'text-cyber-cyan' : 'text-gray-400 group-hover:text-white'}`} />
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <StatusBadge status="processing" pulse>
                          {item.badge}
                        </StatusBadge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                  
                  {isActive && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="w-1 h-6 bg-gradient-to-b from-cyber-cyan to-neon-blue rounded-full"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 系统状态面板 */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">系统状态</span>
                <StatusBadge status="active">运行中</StatusBadge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">数据同步</span>
                <span className="digital-display">实时</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">版本</span>
                <span className="text-cyber-cyan">v2.1.0</span>
              </div>
            </div>
          </div>
        </aside>

        {/* 遮罩层 */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 主内容区域 */}
        <main className="flex-1 lg:ml-64 min-h-screen">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* 底部技术状态栏（弱化显示） */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/60 backdrop-blur-sm border-t border-slate-700">
        <div className="px-4 py-2 text-xs text-gray-300 opacity-70 flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-green"></span>
            <span>System Latency: <span className="digital-display">1.2s</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-green"></span>
            <span>Data Consistency: <span className="digital-display">&lt; 2s</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-green"></span>
            <span>Service Node: Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
