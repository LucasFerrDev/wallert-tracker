import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

// Money Mind logo icon (same as sidebar)
const LogoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
    <path d="M3 12 L8 4 L13 12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="4" r="1.2" fill="#fff"/>
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, isConfigured } = response.data;
      login(token, isConfigured);
      navigate(isConfigured ? '/' : '/settings');
    } catch {
      setError('E-mail ou senha inválidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <LogoIcon />
          </div>
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: 6, fontSize: 20, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
          Entrar no Money Mind
        </h2>
        <p style={{ textAlign: 'center', color: '#999', fontSize: 13, marginBottom: 24 }}>
          Bem-vindo de volta! Acesse sua conta
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn-orange"
            disabled={loading}
            style={{ marginTop: 8, padding: '11px 18px', fontSize: 14, fontWeight: 600 }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#999' }}>
          Não tem uma conta?{' '}
          <Link to="/register" style={{ color: '#F97316', textDecoration: 'none', fontWeight: 500 }}>
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
