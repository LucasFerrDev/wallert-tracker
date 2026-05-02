import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
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

  // Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = () => {
    setLoading(true);
    api.get('/api/goals')
      .then(res => {
        setGoals(res.data);
        setError('');
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching goals:', err);
        setError('Não foi possível carregar suas metas.');
        setLoading(false);
      });
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal: Goal = {
      name,
      targetAmount,
      currentAmount,
      deadline
    };

    api.post('/api/goals', newGoal)
      .then(() => {
        fetchGoals();
        setName('');
        setTargetAmount(0);
        setCurrentAmount(0);
        setDeadline('');
        setError('');
      })
      .catch(err => {
        console.error('Error adding goal:', err);
        setError('Não foi possível salvar a meta. Verifique sua sessão e tente novamente.');
      });
  };

  if (loading) return <div className="animate-fade-in">Carregando metas...</div>;

  return (
    <div className="animate-fade-in">
      <h1>Metas Financeiras</h1>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {goals.map(goal => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          return (
            <div key={goal.id} className="glass" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem' }}>{goal.name}</h3>
                <Target size={20} color="var(--accent-color)" />
              </div>
              
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.currentAmount)}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.targetAmount)}
              </div>

              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-color)', borderRadius: '999px', transition: 'width 0.5s ease-in-out' }}></div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <span>{progress.toFixed(1)}% concluído</span>
                <span>Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Criar Nova Meta</h2>
        <form onSubmit={handleAddGoal} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nome da Meta</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Valor Alvo (R$)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 1 }}>R$</span>
              <CurrencyInput value={targetAmount} onChange={setTargetAmount} required style={{ padding: '0.75rem 0.75rem 0.75rem 2.25rem', fontSize: '1rem' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Valor Inicial (Opcional R$)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 1 }}>R$</span>
              <CurrencyInput value={currentAmount} onChange={setCurrentAmount} style={{ padding: '0.75rem 0.75rem 0.75rem 2.25rem', fontSize: '1rem' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Prazo Misto</label>
            <input 
              type="date" 
              required
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: '1 / -1' }}>
            <button type="submit" className="btn" style={{ width: 'auto' }}>Criar Meta</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Goals;
