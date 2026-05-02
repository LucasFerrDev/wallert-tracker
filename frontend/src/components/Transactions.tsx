import React, { useState, useEffect } from 'react';
import CurrencyInput from './CurrencyInput';
import api from '../services/api';

interface Transaction {
  id?: number;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<'INCOME'|'EXPENSE'>('EXPENSE');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = () => {
    setLoading(true);
    api.get('/api/transactions')
      .then(res => {
        setTransactions(res.data);
        setError('');
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching transactions:', err);
        setError('Não foi possível carregar suas transações.');
        setLoading(false);
      });
  };

  const resetForm = () => {
    setDescription('');
    setAmount(0);
    setType('EXPENSE');
    setCategory('');
    setDate(new Date().toISOString().split('T')[0]);
    setEditingId(null);
  };

  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Transaction = {
      description,
      amount,
      type,
      category,
      date
    };

    const request = editingId
      ? api.put(`/api/transactions/${editingId}`, payload)
      : api.post('/api/transactions', payload);

    request
      .then(() => {
        fetchTransactions();
        resetForm();
        setError('');
      })
      .catch(err => {
        console.error('Error saving transaction', err);
        setError('Não foi possível salvar a transação. Verifique sua sessão e tente novamente.');
      });
  };

  const handleEditTransaction = (tx: Transaction) => {
    if (!tx.id) {
      setError('Não foi possível editar essa transação.');
      return;
    }
    setDescription(tx.description);
    setAmount(tx.amount);
    setType(tx.type);
    setCategory(tx.category);
    setDate(tx.date);
    setEditingId(tx.id);
    setError('');
  };

  const handleDeleteTransaction = (id?: number) => {
    if (!id) {
      setError('Não foi possível excluir essa transação.');
      return;
    }
    if (!window.confirm('Deseja realmente excluir esta transação?')) {
      return;
    }

    api.delete(`/api/transactions/${id}`)
      .then(() => {
        if (editingId === id) {
          resetForm();
        }
        fetchTransactions();
        setError('');
      })
      .catch(err => {
        console.error('Error deleting transaction', err);
        setError('Não foi possível excluir a transação.');
      });
  };

  if (loading) return <div className="animate-fade-in">Carregando transações...</div>;

  return (
    <div className="animate-fade-in">
      <h1>Transações</h1>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      
      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>{editingId ? 'Editar Transação' : 'Nova Transação'}</h2>
        <form onSubmit={handleSubmitTransaction} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Descrição</label>
            <input 
              type="text" 
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Valor (R$)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 1 }}>R$</span>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                required
                style={{ padding: '0.75rem 0.75rem 0.75rem 2.25rem', fontSize: '1rem' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Tipo</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value as 'INCOME'|'EXPENSE')}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            >
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Categoria</label>
            <input 
              type="text" 
              required
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Data</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
            <button type="submit" className="btn" style={{ width: '100%' }}>
              {editingId ? 'Salvar' : 'Adicionar'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'var(--text-secondary)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="glass" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Histórico</h2>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Nenhuma transação registrada.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Data</th>
                <th style={{ padding: '1rem' }}>Descrição</th>
                <th style={{ padding: '1rem' }}>Categoria</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Valor</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id ?? `${tx.description}-${tx.date}-${tx.amount}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '1rem' }}>{tx.description}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem' }}>
                      {tx.category}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: tx.type === 'INCOME' ? 'var(--success-color)' : 'white' }}>
                    {tx.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleEditTransaction(tx)}
                        style={{
                          background: 'rgba(59,130,246,0.2)',
                          color: 'var(--accent-color)',
                          border: '1px solid rgba(59,130,246,0.4)',
                          borderRadius: '8px',
                          padding: '0.4rem 0.7rem',
                          cursor: 'pointer'
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(tx.id)}
                        style={{
                          background: 'rgba(239,68,68,0.2)',
                          color: 'var(--danger-color)',
                          border: '1px solid rgba(239,68,68,0.4)',
                          borderRadius: '8px',
                          padding: '0.4rem 0.7rem',
                          cursor: 'pointer'
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Transactions;
