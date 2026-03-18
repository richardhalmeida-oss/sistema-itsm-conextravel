'use client';
import { useState, useEffect } from 'react';
import { dashboardApi, ticketsApi, slaApi } from '@/lib/api';

const statusLabels: Record<string, string> = {
  open: 'Abertos',
  in_progress: 'Em Andamento',
  waiting_client: 'Aguard. Cliente',
  waiting_third_party: 'Aguard. Terceiro',
  resolved: 'Resolvidos',
  closed: 'Fechados',
  cancelled: 'Cancelados',
};

const priorityLabels: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
};

const statusColors: Record<string, string> = {
  open: '#3b82f6',
  in_progress: '#f59e0b',
  waiting_client: '#f97316',
  waiting_third_party: '#f97316',
  resolved: '#22c55e',
  closed: '#6b7280',
  cancelled: '#ef4444',
};

const priorityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
};

interface DashboardStats {
  tickets: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    openCount: number;
    resolvedToday: number;
  };
  sla: {
    breachedCount: number;
    avgResolutionMinutes: number;
    complianceRate: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
      // Set fallback data for demo
      setStats({
        tickets: {
          total: 0,
          byStatus: {},
          byPriority: {},
          openCount: 0,
          resolvedToday: 0,
        },
        sla: {
          breachedCount: 0,
          avgResolutionMinutes: 0,
          complianceRate: 100,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  if (!stats) return null;

  const totalStatuses = Object.values(stats.tickets.byStatus).reduce((a, b) => a + b, 0) || 1;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="page-subtitle">Visão geral do sistema de chamados</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ height: 44, width: 44, borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ width: 16, height: 16, border: '2px solid currentColor', borderRadius: 4 }}></div>
          </div>
          <div className="stat-card-value">{stats.tickets.total}</div>
          <div className="stat-card-label">Total de Chamados</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ height: 44, width: 44, borderRadius: 10, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ width: 16, height: 16, borderBottom: '2px solid currentColor', borderLeft: '2px solid currentColor' }}></div>
          </div>
          <div className="stat-card-value">{stats.tickets.openCount}</div>
          <div className="stat-card-label">Chamados Abertos</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ height: 44, width: 44, borderRadius: 10, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ width: 16, height: 8, borderBottom: '2px solid currentColor', borderLeft: '2px solid currentColor', transform: 'rotate(-45deg)', marginBottom: 4 }}></div>
          </div>
          <div className="stat-card-value">{stats.tickets.resolvedToday}</div>
          <div className="stat-card-label">Resolvidos Hoje</div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{
              height: 44, width: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              background: stats.sla.complianceRate >= 90 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: stats.sla.complianceRate >= 90 ? '#4ade80' : '#f87171',
            }}
          >
            <div style={{ width: 16, height: 16, border: '2px solid currentColor', borderRadius: '50%' }}></div>
          </div>
          <div className="stat-card-value">{stats.sla.complianceRate}%</div>
          <div className="stat-card-label">Compliance SLA</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Distribuição por Status</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(stats.tickets.byStatus).map(([status, count]) => (
              <div key={status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {statusLabels[status] || status}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{count}</span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(count / totalStatuses) * 100}%`,
                      background: statusColors[status] || '#6b7280',
                      borderRadius: 3,
                      transition: 'width 1s ease',
                    }}
                  />
                </div>
              </div>
            ))}
            {Object.keys(stats.tickets.byStatus).length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ fontSize: 32, fontWeight: 800, opacity: 0.1 }}>---</div>
                <p className="empty-state-text">Nenhum dado disponível</p>
                <p className="empty-state-sub">Crie chamados para ver as estatísticas</p>
              </div>
            )}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Distribuição por Prioridade</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(stats.tickets.byPriority).map(([priority, count]) => (
              <div key={priority} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: priorityColors[priority] || '#6b7280',
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, fontSize: 14 }}>{priorityLabels[priority] || priority}</span>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{count}</span>
              </div>
            ))}
            {Object.keys(stats.tickets.byPriority).length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ fontSize: 32, fontWeight: 800, opacity: 0.1 }}>---</div>
                <p className="empty-state-text">Nenhum dado disponível</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SLA Stats */}
      <div className="grid-3">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--priority-critical)' }}>
            {stats.sla.breachedCount}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>SLA Violados</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-primary-hover)' }}>
            {stats.sla.avgResolutionMinutes > 0
              ? `${Math.round(stats.sla.avgResolutionMinutes)}min`
              : '—'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Tempo Médio Resolução</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: stats.sla.complianceRate >= 90 ? 'var(--status-resolved)' : 'var(--priority-critical)',
            }}
          >
            {stats.sla.complianceRate}%
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Taxa de Conformidade</div>
        </div>
      </div>
    </div>
  );
}
