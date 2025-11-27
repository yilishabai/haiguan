import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import './styles/design-system.css';

// Lazy load other modules
const Capabilities = React.lazy(() => import('./pages/Capabilities').then(module => ({ default: module.Capabilities })));
const Collaboration = React.lazy(() => import('./pages/CollaborationWorkbench').then(module => ({ default: module.CollaborationWorkbench })));
const Acceptance = React.lazy(() => import('./pages/AcceptanceTraceability').then(module => ({ default: module.AcceptanceTraceability })));

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/capabilities" element={
            <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-white">加载中...</div>}>
              <Capabilities />
            </React.Suspense>
          } />
          <Route path="/collaboration" element={
            <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-white">加载中...</div>}>
              <Collaboration />
            </React.Suspense>
          } />
          <Route path="/acceptance" element={
            <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-white">加载中...</div>}>
              <Acceptance />
            </React.Suspense>
          } />
          <Route path="/settings" element={<div>系统设置</div>} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
