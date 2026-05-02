import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Target, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';

// ─── Guest Route (redirect if already authenticated) ────────────────
const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isConfigured } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={isConfigured ? '/' : '/settings'} replace />;
  }
  return <>{children}</>;
};

// ─── Protected Route ────────────────────────────────────────────────
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// ─── Redirect to /settings if not configured yet ────────────────────
const ConfiguredRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isConfigured } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isConfigured) return <Navigate to="/settings" replace />;
  return <>{children}</>;
};

// ─── Settings Route — sidebar when configured, bare on first access ──
const SettingsRoute = () => {
  const { isConfigured } = useAuth();
  if (isConfigured) {
    return <AppLayout><Settings /></AppLayout>;
  }
  return <Settings />;
};

// ─── Sidebar nav item with active state ─────────────────────────────
const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        padding: '0.7rem 1rem', textDecoration: 'none', borderRadius: '10px',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--accent-color)' : '3px solid transparent',
        fontWeight: isActive ? 500 : 400,
        transition: 'all 0.18s',
        fontSize: '0.9375rem',
      }}
    >
      {icon}
      {label}
    </Link>
  );
};

// ─── App Layout (sidebar + content) ─────────────────────────────────
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout } = useAuth();
  return (
    <div className="app-container">
      <aside className="sidebar" style={{
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '1.75rem 1.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'var(--accent-color)' }}>
          <Wallet size={26} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.03em' }}>MoneyMind</span>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.75rem' }}>
          <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <NavItem to="/transacoes" icon={<Wallet size={18} />} label="Transações" />
          <NavItem to="/metas" icon={<Target size={18} />} label="Metas" />
        </nav>

        {/* Bottom: settings + logout */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <NavItem to="/settings" icon={<SettingsIcon size={18} />} label="Configurações" />
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.7rem 1rem', borderRadius: '10px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--danger-color)', fontSize: '0.9375rem', fontWeight: 400,
              transition: 'background 0.18s', width: '100%',
            }}
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

// ─── Root App ────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes — redirect if already logged in */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Settings — requires auth, wraps in AppLayout when already configured */}
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <SettingsRoute />
          </PrivateRoute>
        }
      />

      {/* Protected app routes */}
      <Route
        path="/"
        element={
          <ConfiguredRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ConfiguredRoute>
        }
      />
      <Route
        path="/transacoes"
        element={
          <ConfiguredRoute>
            <AppLayout>
              <Transactions />
            </AppLayout>
          </ConfiguredRoute>
        }
      />
      <Route
        path="/metas"
        element={
          <ConfiguredRoute>
            <AppLayout>
              <Goals />
            </AppLayout>
          </ConfiguredRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
