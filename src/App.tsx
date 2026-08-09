import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layouts/AppLayout';
import Starfield from '@/components/common/Starfield';

import { routes } from './routes';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-laser animate-pulse font-mono-num">系统启动中…</div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function AppShell() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-laser animate-pulse font-mono-num">系统启动中…</div>
      </div>
    );
  }

  // 未登录且不在登录页 → 跳登录
  if (!user && !isLogin) {
    return <Navigate to="/login" replace />;
  }

  // 登录页直接渲染（无 Layout）
  if (isLogin) {
    return (
      <Routes>
        <Route path="/login" element={routes.find((r) => r.path === '/login')?.element} />
      </Routes>
    );
  }

  // 已登录 → 带布局渲染
  return (
    <RequireAuth>
      <Starfield />
      <AppLayout>
        <Routes>
          {routes.filter((r) => r.path !== '/login').map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </RequireAuth>
  );
}

const App: React.FC = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  return (
    <Router>
      <AuthProvider>
        <IntersectObserver />
        <AppShell />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'hsl(0 0% 6%)',
              border: '1px solid hsl(0 0% 20%)',
              color: 'hsl(0 0% 88%)',
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
};

export default App;
