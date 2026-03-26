import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Skeleton, ConfigProvider } from 'antd';
import { isLoggedIn, logout, getAdminEmail } from '../shared/utils/auth';
import { getGagnerTheme, getPalette, type ThemeMode } from '../shared/theme';

import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import ContentCMS from './pages/ContentCMS';
import ParticipantsPage from './pages/ParticipantsPage';
import CouponsPage from './pages/CouponsPage';
import AuditLogPage from './pages/AuditLogPage';
import LeaderboardPage from './pages/LeaderboardPage';
import DMSHub from './pages/DMSHub';
import DMSGalleries from './pages/DMSGalleries';
import DMSLogo from './pages/DMSLogo';
import DMSContact from './pages/DMSContact';
import DMSSponsors from './pages/DMSSponsors';

const { Content } = Layout;

/* ─── THEME CONTEXT ─── */
interface ThemeCtx { mode: ThemeMode; toggle: () => void }
const ThemeContext = createContext<ThemeCtx>({ mode: 'dark', toggle: () => {} });
export const useThemeMode = () => useContext(ThemeContext);

/* ─── AUTH GUARD ─── */
function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

/* ─── PAGE SHIMMER ─── */
function PageShimmer() {
  return (
    <div style={{ padding: '20px 0' }}>
      <Skeleton active paragraph={{ rows: 1, width: 200 }} title={{ width: 300 }} />
      <div style={{ display: 'flex', gap: 16, margin: '24px 0' }}>
        {[1,2,3,4].map(i => (
          <Skeleton.Node key={i} active style={{ width: 200, height: 100, borderRadius: 12 }} />
        ))}
      </div>
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
  );
}

/* ─── ADMIN LAYOUT ─── */
function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggle } = useThemeMode();
  const p = getPalette(mode);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 50);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const selectedKey = (() => {
    const path = location.pathname.replace('/admin/', '').replace('/admin', '');
    if (path.startsWith('dms')) return 'dms';
    return path || 'dashboard';
  })();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminSidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        selectedKey={selectedKey} 
        pal={p} 
        mode={mode} 
      />

      <Layout style={{
        marginLeft: collapsed ? 72 : 260,
        transition: 'margin-left 0.2s cubic-bezier(.4,0,.2,1)',
        background: p.bg,
        minHeight: '100vh',
      }}>
        <AdminHeader 
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mode={mode}
          toggleMode={toggle}
          pal={p}
          userEmail={getAdminEmail()}
          handleLogout={handleLogout}
        />

        <Content style={{
          padding: '24px 28px',
          minHeight: 'calc(100vh - 56px)',
        }}>
          {loading ? (
            <PageShimmer />
          ) : (
            <Routes>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="content" element={<ContentCMS />} />
              <Route path="dms" element={<DMSHub />} />
              <Route path="dms-galleries" element={<DMSGalleries />} />
              <Route path="dms-logo" element={<DMSLogo />} />
              <Route path="dms-contact" element={<DMSContact />} />
              <Route path="dms-sponsors" element={<DMSSponsors />} />
              <Route path="participants" element={<ParticipantsPage />} />
              <Route path="coupons" element={<CouponsPage />} />
              <Route path="audit" element={<AuditLogPage />} />
              <Route path="" element={<Navigate to="dashboard" replace />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

export default function AdminApp() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('gagner_theme') as ThemeMode) || 'dark';
  });

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('gagner_theme', next);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <ConfigProvider theme={getGagnerTheme(mode)}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/admin/login" element={<LoginPage />} />
            <Route
              path="/admin/*"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
