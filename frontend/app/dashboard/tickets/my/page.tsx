'use client';
import { useState, useEffect } from 'react';
import { ticketsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

const statusLabels: Record<string, string> = {
  open: 'Aberto', in_progress: 'Em Andamento', waiting_client: 'Aguard. Cliente',
  resolved: 'Resolvido', closed: 'Fechado', cancelled: 'Cancelado',
};
const priorityLabels: Record<string, string> = { critical: 'Crítico', high: 'Alto', medium: 'Médio', low: 'Baixo' };

export default function MyTicketsPage() {
  const { user } = useAuth();
  const [myTickets, setMyTickets] = useState<any>({ data: [], total: 0 });
  const [createdTickets, setCreatedTickets] = useState<any>({ data: [], total: 0 });
  const [tab, setTab] = useState<'assigned' | 'created'>('assigned');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const [my, created] = await Promise.all([
        ticketsApi.getMy('limit=20'),
        ticketsApi.getCreatedByMe('limit=20'),
      ]);
      setMyTickets(my);
      setCreatedTickets(created);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const tickets = tab === 'assigned' ? myTickets : createdTickets;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Meus Chamados</h2>
          <p className="page-subtitle">Chamados atribuídos a você ou criados por você</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn ${tab === 'assigned' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('assigned')}>
          Atribuídos a mim ({myTickets.total})
        </button>
        <button className={`btn ${tab === 'created' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('created')}>
          Criados por mim ({createdTickets.total})
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : tickets.data.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">Nenhum chamado encontrado</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tickets.data.map((t: any) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.title}</td>
                  <td><span className={`badge badge-status-${t.status}`}>{statusLabels[t.status] || t.status}</span></td>
                  <td><span className={`badge badge-priority-${t.priority}`}>{priorityLabels[t.priority] || t.priority}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(t.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td><Link href={`/dashboard/tickets/${t.id}`} className="btn btn-secondary btn-sm">Ver</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
