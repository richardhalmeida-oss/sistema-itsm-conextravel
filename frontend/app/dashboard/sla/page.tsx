'use client';
import { useState, useEffect } from 'react';
import { slaApi } from '@/lib/api';

const priorityLabels: Record<string, string> = { critical: 'Crítico', high: 'Alto', medium: 'Médio', low: 'Baixo' };

export default function SlaPage() {
  const [configs, setConfigs] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    priority: '',
    responseTimeMinutes: 60,
    resolutionTimeMinutes: 480,
    isActive: true,
    isDefault: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadConfigs(); }, []);

  async function loadConfigs() {
    setLoading(true);
    try {
      const data = await slaApi.getConfigs();
      setConfigs(data);
    } catch { setConfigs({ data: [], total: 0 }); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditingConfig(null);
    setForm({
      name: '',
      description: '',
      priority: '',
      responseTimeMinutes: 60,
      resolutionTimeMinutes: 480,
      isActive: true,
      isDefault: false,
    });
    setShowModal(true);
  }

  function openEdit(config: any) {
    setEditingConfig(config);
    setForm({
      name: config.name,
      description: config.description,
      priority: config.priority || '',
      responseTimeMinutes: config.responseTimeMinutes,
      resolutionTimeMinutes: config.resolutionTimeMinutes,
      isActive: config.isActive,
      isDefault: config.isDefault,
    });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingConfig) {
        await slaApi.updateConfig(editingConfig.id, form);
      } else {
        await slaApi.createConfig(form);
      }
      setShowModal(false);
      loadConfigs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Configurações SLA</h2>
          <p className="page-subtitle">Gerenciar acordos de nível de serviço</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Nova Configuração
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (configs.data || []).length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⏱️</div>
            <p className="empty-state-text">Nenhuma configuração SLA</p>
            <p className="empty-state-sub">Crie um acordo de nível de serviço para começar</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {(configs.data || []).map((config: any) => (
            <div key={config.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>{config.name}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className={`badge ${config.isActive ? 'badge-status-resolved' : 'badge-status-closed'}`}>
                    {config.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(config)} style={{ padding: '2px 8px' }}>
                    Editar
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, height: 40, overflow: 'hidden' }}>
                {config.description}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Resposta</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-primary-hover)' }}>{config.responseTimeMinutes}min</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Resolução</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-primary-hover)' }}>{config.resolutionTimeMinutes}min</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <div>
                  {config.priority ? (
                    <span className={`badge badge-priority-${config.priority}`}>{priorityLabels[config.priority] || config.priority}</span>
                  ) : (
                    <span className="badge">Geral</span>
                  )}
                </div>
                {config.isDefault && (
                  <div style={{ fontSize: 12, color: 'var(--accent-primary)' }}>⭐ Padrão</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingConfig ? 'Editar SLA' : 'Novo SLA'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: SLA Crítico" />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva este SLA..." />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Prioridade Requerida</label>
                  <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="">Geral (Qualquer prioridade)</option>
                    {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Padrão do Sistema</label>
                  <div style={{ marginTop: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                      <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                      Usar se nada mais combinar
                    </label>
                  </div>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tempo Resposta (minutos)</label>
                  <input type="number" className="form-input" value={form.responseTimeMinutes} onChange={(e) => setForm({ ...form, responseTimeMinutes: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tempo Resolução (minutos)</label>
                  <input type="number" className="form-input" value={form.resolutionTimeMinutes} onChange={(e) => setForm({ ...form, resolutionTimeMinutes: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Configuração Ativa
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
