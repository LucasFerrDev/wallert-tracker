import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import api from '../services/api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      await api.post('/api/auth/register', { name, email, password });
      setSuccess('Conta criada com sucesso! Redirecionando para o login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      console.error('Register error:', err);
      if (err.response) {
        // Server returned an error response
        setError(err.response.data || `Erro ${err.response.status}: ${err.response.statusText}`);
      } else if (err.request) {
        // Request made but no response — backend not reachable
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:8080');
      } else {
        setError('Erro inesperado. Consulte o console do navegador para detalhes.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="glass animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--accent-color)' }}>
          <Wallet size={48} />
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Criar conta</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Comece a controlar suas finanças hoje
        </p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid var(--success-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[
            { label: 'Nome completo', value: name, setter: setName, type: 'text' },
            { label: 'E-mail', value: email, setter: setEmail, type: 'email' },
            { label: 'Senha', value: password, setter: setPassword, type: 'password' },
            { label: 'Confirmar senha', value: confirmPassword, setter: setConfirmPassword, type: 'password' },
          ].map(({ label, value, setter, type }) => (
            <div key={label}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {label}
              </label>
              <input
                type={type}
                required
                value={value}
                onChange={e => setter(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
              />
            </div>
          ))}
          <button type="submit" className="btn" style={{ marginTop: '0.5rem' }}>
            Criar conta
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Já tem uma conta?{' '}
          <Link to="/login" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
