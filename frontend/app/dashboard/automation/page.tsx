'use client';
import { useState, useEffect } from 'react';
import { automationApi } from '@/lib/api';

const triggerLabels: Record<string, string> = {
  ticket_created: 'Chamado Criado', ticket_updated: 'Chamado Atualizado',
  ticket_assigned: 'Chamado Atribuído', ticket_status_changed: 'Status Alterado',
  sla_warning: 'Aviso SLA', sla_breached: 'SLA Violado',
  comment_added: 'Comentário Adicionado', scheduled: 'Agendado',
};

export default function AutomationPage() {
  const [rules, setRules] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRules(); }, []);

  async function loadRules() {
    setLoading(true);
    try {
      const data = await automationApi.getAll();
      setRules(data);
    } catch { setRules({ data: [], total: 0 }); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta regra?')) return;
    try { await automationApi.delete(id); loadRules(); }
    catch (err: any) { alert(err.message); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Automação</h2>
          <p className="page-subtitle">Regras automatizadas de processamento</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (rules.data || []).length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚡</div>
            <p className="empty-state-text">Nenhuma regra de automação</p>
            <p className="empty-state-sub">Crie regras para automatizar o processamento de chamados</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(rules.data || []).map((rule: any) => (
            <div key={rule.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{rule.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{rule.description}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <span className="badge badge-status-in_progress">{triggerLabels[rule.trigger] || rule.trigger}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {rule.conditions?.length || 0} condições • {rule.actions?.length || 0} ações • {rule.executionCount || 0} execuções
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${rule.isActive ? 'badge-status-resolved' : 'badge-status-closed'}`}>
                  {rule.isActive ? 'Ativo' : 'Inativo'}
                </span>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(rule.id)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
