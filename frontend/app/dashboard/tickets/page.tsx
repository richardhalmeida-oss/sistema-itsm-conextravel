'use client';
import { useState, useEffect, useCallback } from 'react';
import { ticketsApi } from '@/lib/api';
import Link from 'next/link';

const statusLabels: Record<string, string> = {
  open: 'Aberto', in_progress: 'Em Andamento', waiting_client: 'Aguard. Cliente',
  waiting_third_party: 'Aguard. Terceiro', resolved: 'Resolvido', closed: 'Fechado', cancelled: 'Cancelado',
};
const priorityLabels: Record<string, string> = {
  critical: 'Crítico', high: 'Alto', medium: 'Médio', low: 'Baixo',
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any>({ data: [], total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', priority: 'medium', type: 'incident' });
  const [creating, setCreating] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '15');
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      const data = await ticketsApi.getAll(params.toString());
      setTickets(data);
    } catch (err) {
      console.error(err);
      setTickets({ data: [], total: 0, page: 1, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, search, status, priority]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  async function handleCreate() {
    setCreating(true);
    try {
      await ticketsApi.create(createForm);
      setShowCreate(false);
      setCreateForm({ title: '', description: '', priority: 'medium', type: 'incident' });
      loadTickets();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Chamados</h2>
          <p className="page-subtitle">{tickets.total} chamado(s) encontrado(s)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Novo Chamado
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input">
          <span className="icon">🔍</span>
          <input
            placeholder="Buscar chamados..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ width: 180 }}>
          <option value="">Todos os Status</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="form-select" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">Todas Prioridades</option>
          {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : tickets.data.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🎫</div>
            <p className="empty-state-text">Nenhum chamado encontrado</p>
            <p className="empty-state-sub">Crie um novo chamado para começar</p>
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
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tickets.data.map((t: any) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {t.description?.substring(0, 60)}{t.description?.length > 60 ? '...' : ''}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-status-${t.status}`}>
                      {statusLabels[t.status] || t.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-priority-${t.priority}`}>
                      {priorityLabels[t.priority] || t.priority}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <Link href={`/dashboard/tickets/${t.id}`} className="btn btn-secondary btn-sm">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {tickets.totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>‹</button>
          {Array.from({ length: Math.min(tickets.totalPages, 5) }, (_, i) => {
            const p = i + 1;
            return (
              <button key={p} onClick={() => setPage(p)} className={page === p ? 'active' : ''}>
                {p}
              </button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(tickets.totalPages, p + 1))} disabled={page >= tickets.totalPages}>›</button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Novo Chamado</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input className="form-input" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} placeholder="Descreva o problema" />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição *</label>
                <textarea className="form-textarea" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Detalhes do chamado..." />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Prioridade</label>
                  <select className="form-select" value={createForm.priority} onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}>
                    {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-select" value={createForm.type} onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}>
                    <option value="incident">Incidente</option>
                    <option value="request">Requisição</option>
                    <option value="problem">Problema</option>
                    <option value="change">Mudança</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !createForm.title || !createForm.description}>
                {creating ? 'Criando...' : 'Criar Chamado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
