'use client';
import { useState, useEffect, use } from 'react';
import { ticketsApi, slaApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

const statusLabels: Record<string, string> = {
  open: 'Aberto', in_progress: 'Em Andamento', waiting_client: 'Aguard. Cliente',
  waiting_third_party: 'Aguard. Terceiro', resolved: 'Resolvido', closed: 'Fechado', cancelled: 'Cancelado',
};
const priorityLabels: Record<string, string> = { critical: 'Crítico', high: 'Alto', medium: 'Médio', low: 'Baixo' };
const typeLabels: Record<string, string> = { incident: 'Incidente', request: 'Requisição', problem: 'Problema', change: 'Mudança' };

const validTransitions: Record<string, string[]> = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['waiting_client', 'waiting_third_party', 'resolved', 'cancelled'],
  waiting_client: ['in_progress', 'cancelled'],
  waiting_third_party: ['in_progress', 'cancelled'],
  resolved: ['in_progress', 'closed'],
};

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [sla, setSla] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  useEffect(() => { loadTicket(true); }, [id]);

  async function loadTicket(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      const [ticketData, commentsData] = await Promise.all([
        ticketsApi.getById(id),
        ticketsApi.getComments(id),
      ]);
      setTicket(ticketData);
      setComments(Array.isArray(commentsData) ? commentsData : []);
      try { const slaData = await slaApi.getTicketSla(id); setSla(slaData); } catch {}
    } catch (err) {
      console.error(err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    const oldStatus = ticket.status;
    setTicket({ ...ticket, status: newStatus }); // Optimistic update
    try {
      await ticketsApi.changeStatus(id, newStatus);
      loadTicket(false);
    } catch (err: any) {
      setTicket({ ...ticket, status: oldStatus }); // Revert if failed
      alert(err.message);
    }
  }

  async function handleDeleteTicket() {
    if (!confirm('TEM CERTEZA? Esta ação apagará permanentemente o chamado e o histórico de conversas!')) return;
    try {
      await ticketsApi.delete(id);
      // Volta para a listagem
      router.push('/dashboard/tickets');
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    
    const inputContent = newComment;
    const inputInternal = isInternal;
    
    // Optimistic UI update
    const tempComment = {
      id: Math.random().toString(),
      content: inputContent,
      isInternal: inputInternal,
      author: { name: user?.name || 'Eu' },
      createdAt: new Date().toISOString()
    };
    setComments(prev => [tempComment, ...prev]);
    setNewComment('');
    setIsInternal(false);
    
    try {
      await ticketsApi.addComment(id, { content: inputContent, isInternal: inputInternal });
      loadTicket(false);
    } catch (err: any) {
      alert(err.message);
      loadTicket(false);
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!ticket) return <div className="empty-state"><p>Chamado não encontrado</p></div>;

  const transitions = validTransitions[ticket.status] || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => router.back()} style={{ marginBottom: 12 }}>
            ← Voltar
          </button>
          <h2>{ticket.title}</h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className={`badge badge-status-${ticket.status}`}>{statusLabels[ticket.status] || ticket.status}</span>
            <span className={`badge badge-priority-${ticket.priority}`}>{priorityLabels[ticket.priority] || ticket.priority}</span>
            {ticket.type && <span className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>{typeLabels[ticket.type] || ticket.type}</span>}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Main */}
        <div className="detail-main">
          {/* Description */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 12 }}>Descrição</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {ticket.description}
            </p>
          </div>

          {/* Status Actions */}
          {transitions.length > 0 && (user?.roles?.includes('admin') || user?.roles?.includes('technician')) && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 12 }}>Ações</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {transitions.map((s) => (
                  <button
                    key={s}
                    className={`btn ${s === 'resolved' ? 'btn-primary' : s === 'cancelled' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => handleStatusChange(s)}
                  >
                    {statusLabels[s]}
                  </button>
                ))}
                
                {/* Delete Ticket (Admin Only) */}
                {user?.roles?.includes('admin') && (
                  <button
                    onClick={handleDeleteTicket}
                    style={{ marginLeft: 'auto', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                  >
                    🗑️ Apagar Chamado
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>Comentários ({comments.length})</h3>

            {comments.length > 0 ? (
              <div className="comment-list">
                {comments.map((c: any) => (
                  <div key={c.id} className={`comment-item ${c.isInternal ? 'internal' : ''}`}>
                    <div className="comment-header">
                      <span className="comment-author">
                        {c.authorId === user?.id ? 'Você' : c.authorId}
                        {c.isInternal && <span style={{ fontSize: 11, color: 'var(--accent-primary)', marginLeft: 8 }}>(Nota interna)</span>}
                      </span>
                      <span className="comment-date">{new Date(c.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="comment-body">{c.content}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhum comentário ainda</p>
            )}

            {/* Add Comment */}
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
              <textarea
                className="form-textarea"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicionar comentário..."
                style={{ minHeight: 80 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                {(user?.roles?.includes('admin') || user?.roles?.includes('technician')) && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                    Nota interna (invisível para o solicitante)
                  </label>
                )}
                <button className="btn btn-primary btn-sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          <div className="card">
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Detalhes</h4>
            <div className="detail-field">
              <div className="detail-field-label">ID</div>
              <div className="detail-field-value" style={{ fontSize: 12, fontFamily: 'monospace' }}>{ticket.id}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Criado em</div>
              <div className="detail-field-value">{new Date(ticket.createdAt).toLocaleString('pt-BR')}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Atualizado</div>
              <div className="detail-field-value">{new Date(ticket.updatedAt).toLocaleString('pt-BR')}</div>
            </div>
            {ticket.resolvedAt && (
              <div className="detail-field">
                <div className="detail-field-label">Resolvido em</div>
                <div className="detail-field-value">{new Date(ticket.resolvedAt).toLocaleString('pt-BR')}</div>
              </div>
            )}
            {ticket.tags && ticket.tags.length > 0 && (
              <div className="detail-field">
                <div className="detail-field-label">Tags</div>
                <div className="tags-container">{ticket.tags.map((t: string) => <span key={t} className="tag">{t}</span>)}</div>
              </div>
            )}
          </div>

          {/* SLA */}
          {sla && (
            <div className="card">
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>SLA</h4>
              <div className="detail-field">
                <div className="detail-field-label">Status</div>
                <div className="detail-field-value">
                  <span className={`badge ${sla.status === 'breached' ? 'badge-priority-critical' : sla.status === 'completed' ? 'badge-status-resolved' : 'badge-status-in_progress'}`}>
                    {sla.status}
                  </span>
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Prazo Resposta</div>
                <div className="detail-field-value">{sla.responseDeadline ? new Date(sla.responseDeadline).toLocaleString('pt-BR') : '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Prazo Resolução</div>
                <div className="detail-field-value">{sla.resolutionDeadline ? new Date(sla.resolutionDeadline).toLocaleString('pt-BR') : '—'}</div>
              </div>
              {sla.responseBreach && (
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 6, fontSize: 12, color: 'var(--priority-critical)', marginTop: 8 }}>
                  ⚠️ SLA de resposta violado
                </div>
              )}
              {sla.resolutionBreach && (
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 6, fontSize: 12, color: 'var(--priority-critical)', marginTop: 8 }}>
                  ⚠️ SLA de resolução violado
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
