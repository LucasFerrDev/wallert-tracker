import { useEffect, useState } from 'react';
import { Bell, TrendingUp, Wallet, ArrowDown } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import api from '../services/api';

interface DashboardSummary {
  forecast: number;
  insights: string[];
  currentBalance: number;
  chartData: { month: string; total: number }[];
}

// Empty state used when user has no transactions yet
const EMPTY_CHART: { month: string; total: number }[] = [];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass" style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</p>
        <p style={{ fontWeight: 600 }}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/dashboard/summary')
      .then(r => {
        setSummary(r.data);
        setError('');
        setLoading(false);
      })
      .catch(err => {
        console.error('Dashboard fetch error:', err);
        setError('Não foi possível carregar o dashboard. Faça login novamente e tente atualizar a página.');
        setLoading(false);
      });
  }, []);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        Carregando seus dados financeiros...
      </div>
    );
  }

  if (error) {
    return <div className="animate-fade-in" style={{ color: 'var(--danger-color)' }}>{error}</div>;
  }

  return (
    <div className="animate-fade-in">
      <h1>Visão Geral</h1>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Balance */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saldo Atual</p>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                {fmt(summary?.currentBalance ?? 0)}
              </div>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.15)', padding: '0.625rem', borderRadius: '10px' }}>
              <Wallet size={20} color="var(--success-color)" />
            </div>
          </div>
        </div>

        {/* Forecast */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Previsão Próximo Mês</p>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                {fmt(summary?.forecast ?? 0)}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.375rem' }}>
                Suavização Exponencial (α = 0.5)
              </p>
            </div>
            <div style={{ background: 'rgba(59,130,246,0.15)', padding: '0.625rem', borderRadius: '10px' }}>
              <TrendingUp size={20} color="var(--accent-color)" />
            </div>
          </div>
        </div>

        {/* Insights */}
        {summary?.insights.map((insight, i) => (
          <div key={i} className="glass" style={{ padding: '1.5rem', borderLeft: '3px solid var(--warning-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div>
                <p style={{ color: 'var(--warning-color)', fontSize: '0.8125rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insight</p>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{insight}</p>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.15)', padding: '0.625rem', borderRadius: '10px', flexShrink: 0 }}>
                <Bell size={20} color="var(--warning-color)" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recharts — expense history + forecast */}
      <div className="glass" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>Histórico de Gastos</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Últimos 6 meses — despesas mensais</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <ArrowDown size={14} color="var(--danger-color)" />
            <span>Linha de previsão</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={summary?.chartData ?? EMPTY_CHART} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false}
              tickFormatter={v => `R$ ${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={summary?.forecast ?? 0}
              stroke="var(--danger-color)"
              strokeDasharray="6 4"
              label={{ value: 'Previsão', fill: '#ef4444', fontSize: 11, position: 'right' }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#expGrad)"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
