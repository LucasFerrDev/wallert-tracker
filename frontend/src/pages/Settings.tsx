import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Plus, X, Wallet, ChevronRight, ArrowLeft, Loader } from 'lucide-react';
import CurrencyInput from '../components/CurrencyInput';

const Settings = () => {
  const { setConfigured } = useAuth();
  const navigate = useNavigate();

  // ─── Form state ─────────────────────────────────────────────────
  const [salary, setSalary] = useState(0);
  const [initialBalance, setInitialBalance] = useState(0);
  const [autoAddSalary, setAutoAddSalary] = useState(false);
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');

  // ─── UI state ───────────────────────────────────────────────────
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ─── Load existing user data on mount ───────────────────────────
  useEffect(() => {
    axios.get('http://localhost:8080/api/auth/me')
      .then(res => {
        const data = res.data;
        setSalary(Number(data.salary) || 0);
        setInitialBalance(Number(data.initialBalance) || 0);
        setAutoAddSalary(Boolean(data.autoAddSalary));
        setExtraCategories(data.extraCategories || []);
        setIsFirstAccess(!data.isConfigured);
      })
      .catch(err => {
        console.error('Error loading user settings:', err);
        setIsFirstAccess(true);
      })
      .finally(() => setPageLoading(false));
  }, []);

  // ─── Category helpers ────────────────────────────────────────────
  const handleAddCategory = () => {
    const trimmed = categoryInput.trim();
    if (trimmed && !extraCategories.includes(trimmed)) {
      setExtraCategories(prev => [...prev, trimmed]);
      setCategoryInput('');
    }
  };

  const handleRemoveCategory = (cat: string) =>
    setExtraCategories(prev => prev.filter(c => c !== cat));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }
  };

  // ─── Save ────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!salary || salary <= 0) {
      setError('Por favor, informe um salário válido.');
      return;
    }

    setSaving(true);
    try {
      await axios.put('http://localhost:8080/api/auth/configure', {
        salary,
        initialBalance,
        extraCategories,
        autoAddSalary,
      });

      setConfigured(true);
      setIsFirstAccess(false);

      if (isFirstAccess) {
        navigate('/');
      } else {
        setSuccessMsg('Configurações salvas com sucesso!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      setError('Erro ao salvar configurações. Verifique se o servidor está rodando.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading skeleton ────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader size={40} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      minHeight: '100vh', padding: '2rem 1rem', overflowY: 'auto',
    }}>
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '600px' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          {/* Back button — only shown in edit mode (user already configured) */}
          {!isFirstAccess && (
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: '0.9rem',
                padding: '0.5rem 0', marginBottom: '1.5rem',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <ArrowLeft size={18} />
              Voltar ao Dashboard
            </button>
          )}

          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--accent-color)', marginBottom: '1rem' }}>
              <Wallet size={48} />
            </div>
            {isFirstAccess ? (
              <>
                <h1 style={{ marginBottom: '0.5rem' }}>Bem-vindo ao MoneyMind!</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                  Vamos configurar seu perfil financeiro para começar.
                </p>
              </>
            ) : (
              <>
                <h1 style={{ marginBottom: '0.5rem' }}>Configurações da Conta</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                  Edite suas informações financeiras a qualquer momento.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Feedback messages */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid var(--danger-color)',
            padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{
            background: 'rgba(16,185,129,0.15)', border: '1px solid var(--success-color)',
            padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <CheckCircle size={16} color="var(--success-color)" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── Salary ─────────────────────────────────────────────── */}
          <div className="glass" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '0.375rem' }}>Salário mensal</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Informe a sua renda principal mensal.
            </p>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-secondary)', fontWeight: 500, zIndex: 1,
              }}>R$</span>
              <CurrencyInput value={salary} onChange={setSalary} required />
            </div>
          </div>

          {/* ── Initial Balance ─────────────────────────────────────── */}
          <div className="glass" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '0.375rem' }}>Saldo inicial</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Quanto você já tem guardado hoje? Será o ponto de partida do seu saldo. Pode deixar em zero.
            </p>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-secondary)', fontWeight: 500, zIndex: 1,
              }}>R$</span>
              <CurrencyInput value={initialBalance} onChange={setInitialBalance} />
            </div>
          </div>

          {/* ── Extra Categories ────────────────────────────────────── */}
          <div className="glass" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '0.375rem' }}>Categorias extras de receita</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Adicione outras fontes de renda além do salário (ex: Freelancer, Dividendos, Aluguel).
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <input
                type="text"
                value={categoryInput}
                onChange={e => setCategoryInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Freelancer"
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.2)', color: 'white',
                }}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="btn"
                style={{ padding: '0.75rem 1rem', flexShrink: 0 }}
              >
                <Plus size={18} />
              </button>
            </div>

            {extraCategories.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {extraCategories.map(cat => (
                  <span
                    key={cat}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                      background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
                      padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem',
                    }}
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', display: 'flex', padding: 0,
                      }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Auto salary toggle ──────────────────────────────────── */}
          <div className="glass" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.125rem', marginBottom: '0.375rem' }}>Receita automática mensal</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Ao selecionar esta opção, o seu salário será adicionado todo dia 1 do mês em suas receitas de forma automática.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoAddSalary(prev => !prev)}
                style={{
                  flexShrink: 0, width: '52px', height: '28px', borderRadius: '999px',
                  border: 'none', cursor: 'pointer',
                  background: autoAddSalary ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.25s',
                }}
                aria-label="Toggle receita automática"
              >
                <span style={{
                  position: 'absolute', top: '4px',
                  left: autoAddSalary ? '26px' : '4px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'white', transition: 'left 0.25s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>

            {autoAddSalary && (
              <div style={{
                marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '8px',
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                fontSize: '0.875rem', color: 'var(--text-secondary)',
                display: 'flex', gap: '0.5rem',
              }}>
                <CheckCircle size={16} color="var(--success-color)" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>
                  Ativado!{' '}
                  <span style={{ color: 'var(--text-primary)' }}>
                    R$ {salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>{' '}
                  será lançado automaticamente no dia 1 de cada mês.
                </span>
              </div>
            )}
          </div>

          {/* ── Actions ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '1rem', flexDirection: isFirstAccess ? 'column' : 'row' }}>
            {!isFirstAccess && (
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  flex: 1, padding: '1rem', fontSize: '1rem', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="btn"
              style={{
                flex: 2, padding: '1rem', fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
              ) : isFirstAccess ? (
                <>Salvar Informações <ChevronRight size={20} /></>
              ) : (
                <>Salvar alterações <CheckCircle size={18} /></>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Settings;
