import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const LogoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
    <path d="M3 12 L8 4 L13 12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="4" r="1.2" fill="#fff"/>
  </svg>
);

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    if (password.length < 6) { setError('A senha deve ter no mínimo 6 caracteres.'); return; }

    setLoading(true);
    try {
      await api.post('/api/auth/register', { name, email, password });
      setSuccess('Conta criada com sucesso! Redirecionando...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data || `Erro ${err.response.status}: ${err.response.statusText}`);
      } else if (err.request) {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else {
        setError('Erro inesperado. Consulte o console do navegador para detalhes.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in" style={{ maxWidth: 440 }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <LogoIcon />
          </div>
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: 6, fontSize: 20, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
          Criar conta
        </h2>
        <p style={{ textAlign: 'center', color: '#999', fontSize: 13, marginBottom: 24 }}>
          Comece a controlar suas finanças hoje
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Nome completo', value: name, setter: setName, type: 'text', placeholder: 'Seu nome' },
            { label: 'E-mail', value: email, setter: setEmail, type: 'email', placeholder: 'seu@email.com' },
            { label: 'Senha', value: password, setter: setPassword, type: 'password', placeholder: '••••••••' },
            { label: 'Confirmar senha', value: confirmPassword, setter: setConfirmPassword, type: 'password', placeholder: '••••••••' },
          ].map(({ label, value, setter, type, placeholder }) => (
            <div key={label} className="form-group">
              <label className="form-label">{label}</label>
              <input
                type={type}
                required
                value={value}
                onChange={e => setter(e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}

          <button
            type="submit"
            className="btn-orange"
            disabled={loading}
            style={{ marginTop: 8, padding: '11px 18px', fontSize: 14, fontWeight: 600 }}
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#999' }}>
          Já tem uma conta?{' '}
          <Link to="/login" style={{ color: '#F97316', textDecoration: 'none', fontWeight: 500 }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
