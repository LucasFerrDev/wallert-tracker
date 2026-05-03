import React, { useState, useEffect } from 'react';
import CurrencyInput from './CurrencyInput';
import api from '../services/api';

interface Goal {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [deadline, setDeadline] = useState('');

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = () => {
    setLoading(true);
    api.get('/api/goals')
      .then(res => { setGoals(res.data); setError(''); setLoading(false); })
      .catch(() => { setError('Não foi possível carregar suas metas.'); setLoading(false); });
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    api.post('/api/goals', { name, targetAmount, currentAmount, deadline })
      .then(() => { fetchGoals(); setName(''); setTargetAmount(0); setCurrentAmount(0); setDeadline(''); setError(''); })
      .catch(() => setError('Não foi possível salvar a meta.'));
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (loading) return (
    <div className="loading-center">
      <svg style={{ animation: 'spin 1s linear infinite' }} width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="#EDEDED" strokeWidth="2.5"/>
        <path d="M10 2a8 8 0 018 8" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      Carregando metas...
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <div className="topbar-title">Metas Financeiras</div>
          <div className="topbar-sub">Acompanhe seu progresso rumo aos seus objetivos</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Goals grid */}
      {goals.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 16 }}>
          {goals.map(goal => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            return (
              <div key={goal.id} className="card">
                {/* Goal header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{goal.name}</h3>
                  <span style={{ fontSize: 11, color: '#bbb' }}>
                    até {new Date(goal.deadline).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Amounts */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
                    {fmt(goal.currentAmount)}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                    de {fmt(goal.targetAmount)}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-bg" style={{ marginBottom: 8 }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%`, background: progress >= 100 ? '#16a34a' : '#F97316' }}
                  />
                </div>

                {/* Percentage */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999' }}>
                  <span>{progress.toFixed(1)}% concluído</span>
                  <span style={{ color: progress >= 100 ? '#16a34a' : '#F97316', fontWeight: 500 }}>
                    {progress >= 100 ? '🎉 Concluído!' : `Faltam ${fmt(goal.targetAmount - goal.currentAmount)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create goal form */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Criar Nova Meta</span>
        </div>

        <form onSubmit={handleAddGoal}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>

          <div className="form-group">
            <label className="form-label">Nome da Meta</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Viagem"/>
          </div>

          <div className="form-group">
            <label className="form-label">Valor Alvo (R$)</label>
            <div className="input-wrap">
              <span className="input-prefix">R$</span>
              <CurrencyInput value={targetAmount} onChange={setTargetAmount} required/>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Valor Inicial (Opcional)</label>
            <div className="input-wrap">
              <span className="input-prefix">R$</span>
              <CurrencyInput value={currentAmount} onChange={setCurrentAmount}/>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Prazo</label>
            <input type="date" required value={deadline} onChange={e => setDeadline(e.target.value)}/>
          </div>

          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-orange" style={{ width: '100%', marginTop: 'auto' }}>
              Criar Meta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Goals;
