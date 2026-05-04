import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';

// ── Types ──────────────────────────────────────────────────────────
interface DashboardSummary {
  forecast: number;
  insights: string[];
  currentBalance: number;
  chartData: { month: string; total: number }[];
}

interface Transaction {
  id?: number;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
}

interface Goal {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

// ── Palette ────────────────────────────────────────────────────────
const DONUT_COLORS = ['#F97316', '#FED7AA', '#FDBA74', '#E5E5E5', '#FB923C'];

// ── Currency formatter ─────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtShort = (v: number) => {
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return `R$ ${v.toFixed(0)}`;
};

const parseTransactionDate = (value: string) => {
  if (!value) return new Date(0);

  const isoDate = new Date(value);
  if (!Number.isNaN(isoDate.getTime())) return isoDate;

  const brMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(0);
};

// ── Custom bar chart tooltip ───────────────────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: '#fff', border: '0.5px solid #EDEDED', borderRadius: 8,
        padding: '8px 12px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <p style={{ color: '#999', marginBottom: 4 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color, fontWeight: 500 }}>
            {p.dataKey === 'income' ? 'Receitas' : 'Despesas'}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// (percentages shown in the legend, not inside the pie slices)

// ── Dashboard ──────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [summaryRes, txRes, goalsRes] = await Promise.all([
        api.get('/api/dashboard/summary'),
        api.get('/api/transactions'),
        api.get('/api/goals'),
      ]);
      setSummary(summaryRes.data);
      setTransactions(txRes.data);
      setGoals(goalsRes.data);
      setError('');
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Não foi possível carregar o dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Derived metrics ─────────────────────────────────────────────
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthTxs = transactions.filter(tx => {
    const d = parseTransactionDate(tx.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const incomeThisMonth = thisMonthTxs
    .filter(tx => tx.type === 'INCOME')
    .reduce((s, tx) => s + tx.amount, 0);

  const expenseThisMonth = thisMonthTxs
    .filter(tx => tx.type === 'EXPENSE')
    .reduce((s, tx) => s + tx.amount, 0);

  const savings = incomeThisMonth - expenseThisMonth;

  // ── Bar chart data — last 6 months, income + expense from transactions ──
  // Build both bars directly from the transactions list using YYYY-MM keys
  // so month matching is always consistent regardless of API format.
  const buildBarData = () => {
    // Generate last 6 months as YYYY-MM strings (oldest → newest)
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('pt-BR', { month: 'short' });
      months.push({ key, label });
    }

    // Aggregate income and expense per YYYY-MM from transactions
    const incMap: Record<string, number> = {};
    const expMap: Record<string, number> = {};
    transactions.forEach(tx => {
      const d = parseTransactionDate(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (tx.type === 'INCOME') {
        incMap[key] = (incMap[key] || 0) + tx.amount;
      } else {
        expMap[key] = (expMap[key] || 0) + tx.amount;
      }
    });

    return months.map(({ key, label }) => ({
      month: label,
      income: incMap[key] || 0,
      expense: expMap[key] || 0,
    }));
  };

  const barData = buildBarData();

  // ── Donut chart — top expense categories ───────────────────────
  const buildDonutData = () => {
    const catMap: Record<string, number> = {};
    transactions
      .filter(tx => tx.type === 'EXPENSE')
      .forEach(tx => { catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount; });
    const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return [];
    const top = entries.slice(0, 4);
    const othersTotal = entries.slice(4).reduce((s, [, v]) => s + v, 0);
    if (othersTotal > 0) top.push(['Outros', othersTotal]);
    const total = top.reduce((s, [, v]) => s + v, 0);
    return top.map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }));
  };

  const donutData = buildDonutData();

  // ── Recent transactions (last 5) ────────────────────────────────
  const recentTxs = [...transactions]
    .sort((a, b) => {
      const dateDiff = parseTransactionDate(b.date).getTime() - parseTransactionDate(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.id ?? 0) - (a.id ?? 0);
    })
    .slice(0, 5);

  // ── Current date subtitle ───────────────────────────────────────
  const dateStr = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // ── Goals overall progress ──────────────────────────────────────
  const overallGoalProgress = goals.length
    ? Math.round(goals.reduce((s, g) => s + Math.min(g.currentAmount / g.targetAmount, 1), 0) / goals.length * 100)
    : 0;

  // ── Loading / error states ──────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-center">
        <svg style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="#EDEDED" strokeWidth="2.5"/>
          <path d="M10 2a8 8 0 018 8" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        Carregando seus dados financeiros...
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error animate-fade-in">{error}</div>;
  }

  return (
    <div className="animate-fade-in">

      {/* ── Topbar ──────────────────────────────────────────────── */}
      <div className="topbar">
        <div>
          <div className="topbar-title">Visão geral</div>
          <div className="topbar-sub">{dateStr} · atualizado agora</div>
        </div>
        <button className="btn-orange dashboard-topbar-btn" onClick={() => navigate('/transacoes')}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Nova transação
        </button>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────── */}
      <div className="dashboard-metrics-grid">
        {/* Saldo */}
        <div className="card card-accent-top metric-card-saldo">
          <div className="metric-label">Saldo total</div>
          <div className="metric-value">{fmt(summary?.currentBalance ?? 0)}</div>
          <div className="metric-delta">Saldo acumulado</div>
        </div>

        {/* Receitas */}
        <div className="card metric-card-receitas">
          <div className="metric-label">Receitas</div>
          <div className="metric-value orange">{fmt(incomeThisMonth)}</div>
          <div className="metric-delta up" style={{ display: 'flex', gap: 4 }}>
            <span>↑</span> este mês
          </div>
        </div>

        {/* Despesas */}
        <div className="card metric-card-despesas">
          <div className="metric-label">Despesas</div>
          <div className="metric-value red">{fmt(expenseThisMonth)}</div>
          <div className="metric-delta down" style={{ display: 'flex', gap: 4 }}>
            <span>↑</span> vs mês anterior
          </div>
        </div>

        {/* Economias */}
        <div className="card metric-card-economias">
          <div className="metric-label">Economias</div>
          <div className="metric-value" style={{ color: savings >= 0 ? '#1a1a1a' : '#dc2626' }}>
            {fmt(savings)}
          </div>
          <div className="metric-delta" style={{ color: '#888' }}>
            Previsão: {fmt(summary?.forecast ?? 0)}
          </div>
        </div>
      </div>

      {/* ── Charts Row ──────────────────────────────────────────── */}
      <div className="dashboard-charts-grid">

        {/* Bar chart */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Receitas vs Despesas</span>
            <span style={{ fontSize: 11, color: '#F97316', fontWeight: 500 }}>6 meses</span>
          </div>

          {barData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={barData} barCategoryGap="30%" barGap={2} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fill: '#bbb', fontSize: 10 }} axisLine={false} tickLine={false}/>
                  <YAxis
                    width={62}
                    tickMargin={8}
                    tick={{ fill: '#bbb', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={fmtShort}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(249,115,22,0.04)' }}/>
                  <Bar dataKey="income" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={14}/>
                  <Bar dataKey="expense" fill="#FED7AA" radius={[4, 4, 0, 0]} maxBarSize={14}/>
                </BarChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#F97316' }}/>
                  Receitas
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#FED7AA' }}/>
                  Despesas
                </div>
              </div>
            </>
          ) : (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 13 }}>
              Nenhum dado de histórico disponível
            </div>
          )}
        </div>

        {/* Donut chart */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Categorias</span>
            <Link to="/transacoes" className="panel-link">ver tudo</Link>
          </div>

          {donutData.length > 0 ? (
            <div className="donut-wrap">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={46}
                    dataKey="value"
                    labelLine={false}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]}/>
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-labels">
                {donutData.map((d, i) => (
                  <div key={d.name} className="donut-label">
                    <div className="donut-label-dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}/>
                    {d.name}
                    <span className="donut-label-pct">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 13 }}>
              Adicione transações para ver categorias
            </div>
          )}
        </div>
      </div>

      {/* ── Transactions + Goals Row ─────────────────────────────── */}
      <div className="dashboard-bottom-grid">

        {/* Recent transactions */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Transações recentes</span>
            <Link to="/transacoes" className="panel-link">ver todas</Link>
          </div>

          {recentTxs.length === 0 ? (
            <p style={{ fontSize: 13, color: '#bbb' }}>Nenhuma transação registrada.</p>
          ) : (
            <table className="tx-table tx-table-dashboard">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {recentTxs.map(tx => (
                  <tr key={tx.id ?? `${tx.description}-${tx.date}`}>
                    <td data-label="Descrição">
                      <div className="tx-name">{tx.description}</div>
                      <div className="tx-cat">{tx.category}</div>
                    </td>
                    <td data-label="Data">{parseTransactionDate(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</td>
                    <td data-label="Status">
                      <span className={`badge ${tx.type === 'INCOME' ? 'badge-green' : 'badge-red'}`}>
                        {tx.type === 'INCOME' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td data-label="Valor" className={tx.type === 'INCOME' ? 'tx-amount-income' : 'tx-amount-expense'}>
                      {tx.type === 'INCOME' ? '+' : '−'}{fmt(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Goals / progress */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Metas do mês</span>
            <Link to="/metas" className="panel-link">editar</Link>
          </div>

          {goals.length === 0 ? (
            <p style={{ fontSize: 13, color: '#bbb' }}>Nenhuma meta criada.</p>
          ) : (
            <>
              {goals.slice(0, 4).map((g, i) => {
                const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
                return (
                  <div key={g.id ?? i} className="progress-row">
                    <div className="progress-meta">
                      <span className="progress-name">{g.name}</span>
                      <span className="progress-vals">
                        {fmt(g.currentAmount)} / {fmt(g.targetAmount)}
                      </span>
                    </div>
                    <div className="progress-bg">
                      <div className={`progress-fill${i % 2 !== 0 ? ' alt' : ''}`} style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                );
              })}

              <div style={{
                marginTop: 14, paddingTop: 14,
                borderTop: '0.5px solid #F5F5F5',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: '#999' }}>Progresso geral</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#F97316' }}>{overallGoalProgress}%</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Insights (if any) */}
      {summary?.insights && summary.insights.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {summary.insights.map((insight, i) => (
            <div key={i} className="alert alert-info">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="7" cy="7" r="6" stroke="#EA580C" strokeWidth="1.4"/>
                <path d="M7 6v4M7 4.5v.5" stroke="#EA580C" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {insight}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
