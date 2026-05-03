import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './services/api';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import EditProfileModal from './components/EditProfileModal';

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

// ─── Sidebar nav item ────────────────────────────────────────────────
const NavItem = ({
  to,
  icon,
  label,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} onClick={onClick} className={`nav-item${isActive ? ' active' : ''}`}>
      {icon}
      {label}
    </Link>
  );
};

// ─── SVG Icons matching design.html ─────────────────────────────────
const IconDashboard = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor"/>
    <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" opacity="0.4"/>
    <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" opacity="0.4"/>
    <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" opacity="0.4"/>
  </svg>
);

const IconTransactions = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <path d="M2 8h12M2 4h12M2 12h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconGoals = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <path d="M2 13 L5 9 L8 11 L11 6 L14 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconSettings = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IconLogout = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Money Mind Logo SVG ─────────────────────────────────────────────
const LogoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 12 L8 4 L13 12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="4" r="1.2" fill="#fff"/>
  </svg>
);

// ─── App Layout (sidebar + content) ─────────────────────────────────
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [initials, setInitials] = useState('MM');
  const [displayName, setDisplayName] = useState('Usuário');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const loadUserData = () => {
    api.get('/api/auth/me').then(res => {
      const data = res.data;
      const name: string = data.name || data.email || '';
      setUserName(name);
      setUserEmail(data.email || '');
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        setInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
        setDisplayName(`${parts[0]} ${parts[parts.length - 1][0]}.`);
      } else if (name) {
        setInitials(name.slice(0, 2).toUpperCase());
        setDisplayName(name.split('@')[0]);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
  };

  const handleProfileUpdated = () => {
    loadUserData();
  };

  return (
    <div className="app-container">
      <header className="mobile-topbar">
        <div className="mobile-topbar-brand">
          <div className="sidebar-logo-icon">
            <LogoIcon />
          </div>
          <span className="sidebar-logo-name">Money Mind</span>
        </div>
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={() => setIsMobileMenuOpen(prev => !prev)}
          aria-label="Abrir menu"
          aria-expanded={isMobileMenuOpen}
        >
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {isMobileMenuOpen && (
        <>
          <button
            type="button"
            className="mobile-menu-backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Fechar menu"
          />
          <div className="mobile-menu-dropdown">
            <nav className="mobile-menu-nav">
              <div className="nav-section-label">Principal</div>
              <NavItem to="/" icon={<IconDashboard />} label="Visão geral" onClick={() => setIsMobileMenuOpen(false)} />
              <NavItem to="/transacoes" icon={<IconTransactions />} label="Transações" onClick={() => setIsMobileMenuOpen(false)} />
              <NavItem to="/metas" icon={<IconGoals />} label="Metas" onClick={() => setIsMobileMenuOpen(false)} />

              <div className="nav-section-label" style={{ marginTop: '8px' }}>Configurações</div>
              <NavItem to="/settings" icon={<IconSettings />} label="Configurações" onClick={() => setIsMobileMenuOpen(false)} />
              <button
                onClick={logout}
                className="nav-item nav-item-danger"
                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
              >
                <IconLogout />
                Sair
              </button>
            </nav>

            <button
              type="button"
              className="mobile-menu-user"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleEditClick();
              }}
            >
              <div className="sidebar-user-avatar">{initials}</div>
              <div style={{ overflow: 'hidden', textAlign: 'left' }}>
                <div className="sidebar-user-name">{displayName}</div>
                <div className="sidebar-user-plan">{userEmail}</div>
              </div>
            </button>
          </div>
        </>
      )}

      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <div className="sidebar-logo-icon">
              <LogoIcon />
            </div>
            <span className="sidebar-logo-name">Money Mind</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="nav-section-label">Principal</div>
          <NavItem to="/" icon={<IconDashboard />} label="Visão geral" />
          <NavItem to="/transacoes" icon={<IconTransactions />} label="Transações" />
          <NavItem to="/metas" icon={<IconGoals />} label="Metas" />

          <div className="nav-section-label" style={{ marginTop: '16px' }}>Configurações</div>
          <NavItem to="/settings" icon={<IconSettings />} label="Configurações" />
          <button
            onClick={logout}
            className="nav-item nav-item-danger"
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
          >
            <IconLogout />
            Sair
          </button>
        </nav>

        {/* User card */}
        <div className="sidebar-user" onClick={handleEditClick} style={{ cursor: 'pointer' }}>
          <div className="sidebar-user-avatar">{initials}</div>
          <div style={{ overflow: 'hidden' }}>
            <div className="sidebar-user-name">{displayName}</div>
          </div>
        </div>
      </aside>

      <main className="main-content animate-fade-in">
        {children}
      </main>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        userName={userName}
        userEmail={userEmail}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
};

// ─── Root App ────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Settings */}
      <Route path="/settings" element={<PrivateRoute><SettingsRoute /></PrivateRoute>} />

      {/* Protected app routes */}
      <Route path="/" element={<ConfiguredRoute><AppLayout><Dashboard /></AppLayout></ConfiguredRoute>} />
      <Route path="/transacoes" element={<ConfiguredRoute><AppLayout><Transactions /></AppLayout></ConfiguredRoute>} />
      <Route path="/metas" element={<ConfiguredRoute><AppLayout><Goals /></AppLayout></ConfiguredRoute>} />

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
