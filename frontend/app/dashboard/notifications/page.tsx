'use client';
import { useState, useEffect } from 'react';
import { notificationsApi } from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await notificationsApi.getMy('limit=50');
      setNotifications(data);
    } catch { setNotifications({ data: [], total: 0 }); }
    finally { setLoading(false); }
  }

  async function handleMarkRead(id: string) {
    try { await notificationsApi.markAsRead(id); loadNotifications(); }
    catch (err: any) { console.error(err); }
  }

  async function handleMarkAllRead() {
    try { await notificationsApi.markAllAsRead(); loadNotifications(); }
    catch (err: any) { console.error(err); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Notificações</h2>
          <p className="page-subtitle">{notifications.total} notificação(ões)</p>
        </div>
        {(notifications.data || []).length > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead}>
            Marcar todas como lidas
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (notifications.data || []).length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <p className="empty-state-text">Nenhuma notificação</p>
            <p className="empty-state-sub">Você será notificado quando houver atualizações</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(notifications.data || []).map((n: any) => (
            <div
              key={n.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                opacity: n.status === 'read' ? 0.6 : 1,
                borderLeftWidth: 3,
                borderLeftColor: n.status === 'read' ? 'var(--border-primary)' : 'var(--accent-primary)',
              }}
            >
              <div style={{ fontSize: 24 }}>
                {n.type === 'email' ? '📧' : n.type === 'webhook' ? '🔗' : '🔔'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{n.content}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {new Date(n.createdAt).toLocaleString('pt-BR')}
                </div>
              </div>
              {n.status !== 'read' && (
                <button className="btn btn-secondary btn-sm" onClick={() => handleMarkRead(n.id)}>
                  Marcar lida
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
