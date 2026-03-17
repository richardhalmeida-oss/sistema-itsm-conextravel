'use client';
import { useState, useEffect } from 'react';
import { auditApi } from '@/lib/api';

const actionLabels: Record<string, string> = {
  CREATE: 'Criação', UPDATE: 'Atualização', DELETE: 'Exclusão',
  LOGIN: 'Login', LOGOUT: 'Logout', LOGIN_FAILED: 'Login Falhou',
  STATUS_CHANGE: 'Mudança Status', ASSIGNMENT: 'Atribuição',
  SLA_BREACH: 'Violação SLA', SLA_PAUSE: 'SLA Pausado', SLA_RESUME: 'SLA Retomado',
  AUTOMATION_TRIGGERED: 'Automação Executada', NOTIFICATION_SENT: 'Notificação Enviada',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => { loadLogs(); }, [page]);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await auditApi.getAll(`page=${page}&limit=20`);
      setLogs(data);
    } catch { setLogs({ data: [], total: 0 }); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Auditoria</h2>
          <p className="page-subtitle">{logs.total} registro(s)</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (logs.data || []).length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p className="empty-state-text">Nenhum registro de auditoria</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Entidade</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {(logs.data || []).map((log: any) => (
                <tr key={log.id}>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ fontWeight: 500 }}>{log.userName}</td>
                  <td>
                    <span className={`badge ${log.action?.includes('DELETE') ? 'badge-priority-critical' : log.action?.includes('CREATE') ? 'badge-status-resolved' : 'badge-status-in_progress'}`}>
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {log.entity}
                    {log.entityId && <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>#{log.entityId.substring(0, 8)}</span>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {logs.totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>‹</button>
          {Array.from({ length: Math.min(logs.totalPages, 5) }, (_, i) => (
            <button key={i + 1} onClick={() => setPage(i + 1)} className={page === i + 1 ? 'active' : ''}>{i + 1}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(logs.totalPages, p + 1))} disabled={page >= logs.totalPages}>›</button>
        </div>
      )}
    </div>
  );
}
