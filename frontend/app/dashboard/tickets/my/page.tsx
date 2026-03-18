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
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', priority: 'medium', type: 'incident' });

  async function handleCreate() {
    setCreating(true);
    try {
      await ticketsApi.create(createForm);
      setShowCreate(false);
      setCreateForm({ title: '', description: '', priority: 'medium', type: 'incident' });
      loadTickets();
      setTab('created'); // Switch to created tab to see the new ticket
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

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
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Novo Chamado
        </button>
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
