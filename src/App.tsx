import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import './styles/design-system.css';
import { HudPanel, GlowButton } from './components/ui/HudPanel';
import { getSettings, upsertSetting } from './lib/sqlite';
import { Login } from './pages/Login';
import { UserManagement } from './pages/UserManagement';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Lazy load other modules
const Capabilities = React.lazy(() => import('./pages/Capabilities').then(module => ({ default: module.Capabilities })));
const Collaboration = React.lazy(() => import('./pages/CollaborationWorkbench').then(module => ({ default: module.CollaborationWorkbench })));
const Acceptance = React.lazy(() => import('./pages/AcceptanceTraceability').then(module => ({ default: module.AcceptanceTraceability })));
const Enterprises = React.lazy(() => import('./pages/Enterprises').then(module => ({ default: module.Enterprises })));
const Customs = React.lazy(() => import('./pages/Customs').then(module => ({ default: module.Customs })));
const Logistics = React.lazy(() => import('./pages/Logistics').then(module => ({ default: module.Logistics })));
const Payment = React.lazy(() => import('./pages/Payment').then(module => ({ default: module.Payment })));
const Warehouse = React.lazy(() => import('./pages/Warehouse').then(module => ({ default: module.Warehouse })));
const OrderManagement = React.lazy(() => import('./pages/OrderManagement').then(module => ({ default: module.OrderManagement })));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <MainLayout>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/capabilities"
                    element={
                      <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-white">加载中...</div>}>
                        <ProtectedRoute>
                          <Capabilities />
                        </ProtectedRoute>
                      </React.Suspense>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-white">加载中...</div>}>
                        <ProtectedRoute>
                          <OrderManagement />
                        </ProtectedRoute>
                      </React.Suspense>
                    }
                  />
                  <Route
                    path="/collaboration"
                    element={
                      <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-white">加载中...</div>}>
                        <ProtectedRoute>
                          <Collaboration />
                        </ProtectedRoute>
                      </React.Suspense>
                    }
                  />
                  <Route
                    path="/acceptance"
                    element={
                      <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-white">加载中...</div>}>
                        <ProtectedRoute>
                          <Acceptance />
                        </ProtectedRoute>
                      </React.Suspense>
                    }
                  />
                  <Route
                    path="/enterprises"
                    element={
                      <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-white">加载中...</div>}>
                        <ProtectedRoute>
                          <Enterprises />
                        </ProtectedRoute>
                      </React.Suspense>
                    }
                  />
                  <Route
                    path="/customs"
                    element={
                      <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-white">加载中...</div>}>
                        <ProtectedRoute>
                          <Customs />
                        </ProtectedRoute>
                      </React.Suspense>
                    }
                  />
                  <Route
                    path="/logistics"
                    element={
                      <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-white">加载中...</div>}>
                        <ProtectedRoute>
                          <Logistics />
                        </ProtectedRoute>
                      </React.Suspense>
                    }
                  />
                  <Route
                    path="/payment"
                    element={
                      <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-white">加载中...</div>}>
                        <ProtectedRoute>
                          <Payment />
                        </ProtectedRoute>
                      </React.Suspense>
                    }
                  />
                  <Route
                    path="/warehouse"
                    element={
                      <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-white">加载中...</div>}>
                        <ProtectedRoute>
                          <Warehouse />
                        </ProtectedRoute>
                      </React.Suspense>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute>
                        <UserManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </MainLayout>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
function Settings() {
  const [settings, setSettings] = React.useState<Record<string,string>>({});
  const [loading, setLoading] = React.useState(true);
  React.useEffect(()=>{
    const load = async () => {
      const rows = await getSettings();
      const obj: Record<string,string> = {};
      rows.forEach((r:any)=>{ obj[r.key] = r.value; });
      setSettings({ theme: obj.theme || 'dark', sync_interval: obj.sync_interval || '5000', map_provider: obj.map_provider || 'jsdelivr', baseline_accuracy: obj.baseline_accuracy || '80', baseline_efficiency: obj.baseline_efficiency || '75' });
      setLoading(false);
    };
    load();
  },[]);
  const save = async () => {
    for (const [k,v] of Object.entries(settings)) await upsertSetting(k, v);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">系统设置</h1>
        <GlowButton onClick={save}>保存</GlowButton>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HudPanel title="主题">
          <div className="space-y-2">
            <select value={settings.theme||''} onChange={(e)=>setSettings(s=>({ ...s, theme: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="dark">暗色</option>
              <option value="light">亮色</option>
            </select>
            <div className="text-xs text-gray-500">界面配色方案</div>
          </div>
        </HudPanel>
        <HudPanel title="数据同步间隔">
          <div className="space-y-2">
            <input value={settings.sync_interval||''} onChange={(e)=>setSettings(s=>({ ...s, sync_interval: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            <div className="text-xs text-gray-500">毫秒</div>
          </div>
        </HudPanel>
        <HudPanel title="地图资源提供商">
          <div className="space-y-2">
            <select value={settings.map_provider||''} onChange={(e)=>setSettings(s=>({ ...s, map_provider: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="jsdelivr">jsDelivr</option>
              <option value="unpkg">UNPKG</option>
              <option value="cdnjs">CDNJS</option>
            </select>
            <div className="text-xs text-gray-500">用于全球物流地图的资源加载</div>
          </div>
        </HudPanel>

        <HudPanel title="KPI基线设置">
          <div className="space-y-2">
            <div className="text-xs text-gray-400">协同准确率基线(%)</div>
            <input value={settings.baseline_accuracy||''} onChange={(e)=>setSettings(s=>({ ...s, baseline_accuracy: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            <div className="text-xs text-gray-400">效率基线(%)</div>
            <input value={settings.baseline_efficiency||''} onChange={(e)=>setSettings(s=>({ ...s, baseline_efficiency: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            <div className="text-xs text-gray-500">用于Dashboard 提升幅度计算与验收对比</div>
          </div>
        </HudPanel>
      </div>
      {loading && <div className="text-gray-400">加载中...</div>}
    </div>
  );
}
