import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Plus, X, ChevronRight, ArrowLeft } from 'lucide-react';
import CurrencyInput from '../components/CurrencyInput';
import api from '../services/api';

const LogoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
    <path d="M3 12 L8 4 L13 12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="4" r="1.2" fill="#fff"/>
  </svg>
);

const Settings = () => {
  const { setConfigured } = useAuth();
  const navigate = useNavigate();

  const [salary, setSalary] = useState(0);
  const [initialBalance, setInitialBalance] = useState(0);
  const [autoAddSalary, setAutoAddSalary] = useState(false);
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');

  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => {
        const data = res.data;
        setSalary(Number(data.salary) || 0);
        setInitialBalance(Number(data.initialBalance) || 0);
        setAutoAddSalary(Boolean(data.autoAddSalary));
        setExtraCategories(data.extraCategories || []);
        setIsFirstAccess(!data.isConfigured);
      })
      .catch(() => setIsFirstAccess(true))
      .finally(() => setPageLoading(false));
  }, []);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    if (!salary || salary <= 0) { setError('Por favor, informe um salário válido.'); return; }
    setSaving(true);
    try {
      await api.put('/api/auth/configure', { salary, initialBalance, extraCategories, autoAddSalary });
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

  if (pageLoading) {
    return (
      <div className="loading-center" style={{ minHeight: '100vh' }}>
        <svg style={{ animation: 'spin 1s linear infinite' }} width="24" height="24" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="#EDEDED" strokeWidth="2.5"/>
          <path d="M10 2a8 8 0 018 8" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        Carregando configurações...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      minHeight: '100vh', padding: '2rem 1rem', background: '#FAFAF9', overflowY: 'auto',
    }}>
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: 600 }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{ marginBottom: '2.5rem' }}>
          {!isFirstAccess && (
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#999', fontSize: 13, padding: '6px 0', marginBottom: '1.25rem',
                fontFamily: 'inherit', transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1a1a1a')}
              onMouseLeave={e => (e.currentTarget.style.color = '#999')}
            >
              <ArrowLeft size={16}/>
              Voltar ao Dashboard
            </button>
          )}

          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: 56, height: 56, background: '#F97316', borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LogoIcon />
              </div>
            </div>

            {isFirstAccess ? (
              <>
                <h1 style={{ fontSize: 22, marginBottom: 6, color: '#1a1a1a' }}>Bem-vindo ao Money Mind!</h1>
                <p style={{ color: '#999', fontSize: 14 }}>
                  Vamos configurar seu perfil financeiro para começar.
                </p>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: 22, marginBottom: 6, color: '#1a1a1a' }}>Configurações da Conta</h1>
                <p style={{ color: '#999', fontSize: 14 }}>
                  Edite suas informações financeiras a qualquer momento.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Feedback ─────────────────────────────────────────── */}
        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && (
          <div className="alert alert-success">
            <CheckCircle size={15} style={{ flexShrink: 0 }}/>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Salary ─────────────────────────────────────────── */}
          <div className="panel">
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#1a1a1a' }}>Salário mensal</h2>
            <p style={{ color: '#999', fontSize: 13, marginBottom: 14 }}>
              Informe a sua renda principal mensal.
            </p>
            <div className="input-wrap">
              <span className="input-prefix">R$</span>
              <CurrencyInput value={salary} onChange={setSalary} required/>
            </div>
          </div>

          {/* ── Initial Balance ───────────────────────────────── */}
          <div className="panel">
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#1a1a1a' }}>Saldo inicial</h2>
            <p style={{ color: '#999', fontSize: 13, marginBottom: 14 }}>
              Quanto você já tem guardado hoje? Será o ponto de partida do seu saldo. Pode deixar em zero.
            </p>
            <div className="input-wrap">
              <span className="input-prefix">R$</span>
              <CurrencyInput value={initialBalance} onChange={setInitialBalance}/>
            </div>
          </div>

          {/* ── Extra Categories ──────────────────────────────── */}
          <div className="panel">
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#1a1a1a' }}>Categorias extras de receita</h2>
            <p style={{ color: '#999', fontSize: 13, marginBottom: 14 }}>
              Adicione outras fontes de renda além do salário (ex: Freelancer, Dividendos, Aluguel).
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                value={categoryInput}
                onChange={e => setCategoryInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Freelancer"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={handleAddCategory} className="btn-orange"
                style={{ padding: '9px 14px', flexShrink: 0 }}>
                <Plus size={16}/>
              </button>
            </div>

            {extraCategories.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {extraCategories.map(cat => (
                  <span key={cat} className="tag">
                    {cat}
                    <button type="button" onClick={() => handleRemoveCategory(cat)} className="tag-remove">
                      <X size={13}/>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Auto salary toggle ────────────────────────────── */}
          <div className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#1a1a1a' }}>Receita automática mensal</h2>
                <p style={{ color: '#999', fontSize: 13 }}>
                  Ao selecionar esta opção, o seu salário será adicionado todo dia 1 do mês em suas receitas de forma automática.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoAddSalary(prev => !prev)}
                className={`toggle-track ${autoAddSalary ? 'on' : 'off'}`}
                aria-label="Toggle receita automática"
              >
                <span className="toggle-thumb"/>
              </button>
            </div>

            {autoAddSalary && (
              <div className="alert alert-info" style={{ marginTop: 12, marginBottom: 0 }}>
                <CheckCircle size={14} style={{ flexShrink: 0 }}/>
                <span>
                  Ativado!{' '}
                  <strong>R$ {salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  {' '}será lançado automaticamente no dia 1 de cada mês.
                </span>
              </div>
            )}
          </div>

          {/* ── Actions ───────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, flexDirection: isFirstAccess ? 'column' : 'row' }}>
            {!isFirstAccess && (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-ghost"
                style={{ flex: 1, padding: '11px 18px', fontSize: 14 }}
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="btn-orange"
              style={{ flex: 2, padding: '11px 18px', fontSize: 14 }}
            >
              {saving ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"/>
                    <path d="M10 2a8 8 0 018 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  Salvando...
                </>
              ) : isFirstAccess ? (
                <>Salvar Informações <ChevronRight size={18}/></>
              ) : (
                <>Salvar alterações <CheckCircle size={16}/></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
