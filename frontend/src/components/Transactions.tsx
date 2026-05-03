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

type StatusFilter = 'ALL' | 'INCOME' | 'EXPENSE';
type AmountFilter = 'ALL' | 'GREATER' | 'LESS';

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter state
  const [searchName, setSearchName] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [amountFilter, setAmountFilter] = useState<AmountFilter>('ALL');
  const [amountValue, setAmountValue] = useState('');

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = () => {
    setLoading(true);
    api.get('/api/transactions')
      .then(res => { setTransactions(res.data); setError(''); setLoading(false); })
      .catch(() => { setError('Não foi possível carregar suas transações.'); setLoading(false); });
  };

  const resetForm = () => {
    setDescription(''); setAmount(0); setType('EXPENSE');
    setCategory(''); setDate(new Date().toISOString().split('T')[0]); setEditingId(null);
  };

  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Transaction = { description, amount, type, category, date };
    const request = editingId
      ? api.put(`/api/transactions/${editingId}`, payload)
      : api.post('/api/transactions', payload);
    request
      .then(() => { fetchTransactions(); resetForm(); setError(''); })
      .catch(() => setError('Não foi possível salvar a transação.'));
  };

  const handleEditTransaction = (tx: Transaction) => {
    if (!tx.id) { setError('Não foi possível editar essa transação.'); return; }
    setDescription(tx.description); setAmount(tx.amount); setType(tx.type);
    setCategory(tx.category); setDate(tx.date); setEditingId(tx.id); setError('');
  };

  const handleDeleteTransaction = (id?: number) => {
    if (!id) { setError('Não foi possível excluir essa transação.'); return; }
    if (!window.confirm('Deseja realmente excluir esta transação?')) return;
    api.delete(`/api/transactions/${id}`)
      .then(() => { if (editingId === id) resetForm(); fetchTransactions(); setError(''); })
      .catch(() => setError('Não foi possível excluir a transação.'));
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const normalizedName = searchName.trim().toLowerCase();
  const normalizedCategory = searchCategory.trim().toLowerCase();
  const parsedAmountValue = amountValue.trim() === '' ? NaN : Number(amountValue);
  const shouldFilterAmount = amountFilter !== 'ALL' && !Number.isNaN(parsedAmountValue);

  const filteredTransactions = transactions.filter(tx => {
    const matchesName = normalizedName === ''
      || tx.description.toLowerCase().includes(normalizedName);
    const matchesCategory = normalizedCategory === ''
      || tx.category.toLowerCase().includes(normalizedCategory);
    const matchesStatus = statusFilter === 'ALL' || tx.type === statusFilter;

    let matchesAmount = true;
    if (shouldFilterAmount) {
      if (amountFilter === 'GREATER') {
        matchesAmount = tx.amount > parsedAmountValue;
      } else if (amountFilter === 'LESS') {
        matchesAmount = tx.amount < parsedAmountValue;
      }
    }

    return matchesName && matchesCategory && matchesStatus && matchesAmount;
  });

  const hasActiveFilters = normalizedName !== ''
    || normalizedCategory !== ''
    || statusFilter !== 'ALL'
    || (amountFilter !== 'ALL' && amountValue.trim() !== '');

  const clearFilters = () => {
    setSearchName('');
    setSearchCategory('');
    setStatusFilter('ALL');
    setAmountFilter('ALL');
    setAmountValue('');
  };

  if (loading) return (
    <div className="loading-center">
      <svg style={{ animation: 'spin 1s linear infinite' }} width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="#EDEDED" strokeWidth="2.5"/>
        <path d="M10 2a8 8 0 018 8" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      Carregando transações...
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <div className="topbar-title">Transações</div>
          <div className="topbar-sub">Gerencie suas receitas e despesas</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Form panel */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <span className="panel-title">{editingId ? 'Editar Transação' : 'Nova Transação'}</span>
          {editingId && (
            <button className="btn-ghost" onClick={resetForm} style={{ fontSize: 12, padding: '5px 12px' }}>
              Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmitTransaction}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>

          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input
              type="text" required value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Supermercado"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Valor (R$)</label>
            <div className="input-wrap">
              <span className="input-prefix">R$</span>
              <CurrencyInput value={amount} onChange={setAmount} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select value={type} onChange={e => setType(e.target.value as 'INCOME' | 'EXPENSE')}>
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Categoria</label>
            <input
              type="text" required value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Ex: Alimentação"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Data</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)}/>
          </div>

          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-orange" style={{ width: '100%', marginTop: 'auto' }}>
              {editingId ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>

      {/* Transactions table */}
      <div className="panel">
        <div className="transactions-filters">
          <div className="transactions-filters-grid">
            <div className="form-group">
              <label className="form-label">Buscar por nome</label>
              <input
                type="text"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                placeholder="Ex: Supermercado"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Buscar por categoria</label>
              <input
                type="text"
                value={searchCategory}
                onChange={e => setSearchCategory(e.target.value)}
                placeholder="Ex: Alimentação"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}>
                <option value="ALL">Todos</option>
                <option value="INCOME">Receita</option>
                <option value="EXPENSE">Despesa</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Valor</label>
              <div className="transactions-value-filter">
                <select
                  value={amountFilter}
                  onChange={e => setAmountFilter(e.target.value as AmountFilter)}
                >
                  <option value="ALL">Sem filtro</option>
                  <option value="GREATER">Maior que</option>
                  <option value="LESS">Menor que</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountValue}
                  onChange={e => setAmountValue(e.target.value)}
                  placeholder="0,00"
                  disabled={amountFilter === 'ALL'}
                />
              </div>
            </div>
          </div>

          <div className="transactions-filters-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              Limpar filtros
            </button>
          </div>
        </div>

        <div className="panel-header">
          <span className="panel-title">Histórico</span>
          <span style={{ fontSize: 12, color: '#999' }}>
            {filteredTransactions.length} de {transactions.length} transações
          </span>
        </div>

        {transactions.length === 0 ? (
          <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '2rem 0' }}>
            Nenhuma transação registrada. Adicione sua primeira transação acima!
          </p>
        ) : filteredTransactions.length === 0 ? (
          <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '2rem 0' }}>
            Nenhuma transação encontrada com os filtros informados.
          </p>
        ) : (
          <table className="tx-table tx-table-history">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
              <tbody>
              {filteredTransactions.map(tx => (
                <tr key={tx.id ?? `${tx.description}-${tx.date}-${tx.amount}`}>
                  <td data-label="Data">{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                  <td data-label="Descrição">
                    <div className="tx-name">{tx.description}</div>
                  </td>
                  <td data-label="Categoria">
                    <span className="badge badge-orange">{tx.category}</span>
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${tx.type === 'INCOME' ? 'badge-green' : 'badge-red'}`}>
                      {tx.type === 'INCOME' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td data-label="Valor" style={{ textAlign: 'right' }}
                    className={tx.type === 'INCOME' ? 'tx-amount-income' : 'tx-amount-expense'}>
                    {tx.type === 'INCOME' ? '+' : '−'}{fmt(tx.amount)}
                  </td>
                  <td data-label="Ações" style={{ textAlign: 'right' }}>
                    <div className="tx-actions">
                      <button className="btn-edit" onClick={() => handleEditTransaction(tx)}>Editar</button>
                      <button className="btn-danger" onClick={() => handleDeleteTransaction(tx.id)}>Excluir</button>
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
