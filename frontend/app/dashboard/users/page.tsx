'use client';
import { useState, useEffect } from 'react';
import { usersApi } from '@/lib/api';

const statusLabels: Record<string, string> = { active: 'Ativo', inactive: 'Inativo', suspended: 'Suspenso' };
const statusBadges: Record<string, string> = { active: 'badge-status-resolved', inactive: 'badge-status-closed', suspended: 'badge-status-cancelled' };

export default function UsersPage() {
  const [users, setUsers] = useState<any>({ data: [], total: 0 });
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [editForm, setEditForm] = useState({ name: '', status: 'active', roleIds: [] as string[] });
  
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { 
    loadUsers();
    loadRoles();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await usersApi.getAll('limit=50');
      setUsers(data);
    } catch { setUsers({ data: [], total: 0 }); }
    finally { setLoading(false); }
  }

  async function loadRoles() {
    try {
      const data = await usersApi.getRoles();
      setRoles(data.data || data || []);
    } catch { setRoles([]); }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      await usersApi.create(form);
      setShowCreate(false);
      setForm({ email: '', name: '', password: '' });
      loadUsers();
    } catch (err: any) { alert(err.message); }
    finally { setCreating(false); }
  }

  function openEdit(user: any) {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      status: user.status,
      roleIds: user.roleIds || [],
    });
    setShowEdit(true);
  }

  async function handleUpdate() {
    setSaving(true);
    try {
      await usersApi.update(editingUser.id, editForm);
      setShowEdit(false);
      loadUsers();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try { await usersApi.delete(id); loadUsers(); }
    catch (err: any) { alert(err.message); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Usuários</h2>
          <p className="page-subtitle">{users.total} usuário(s) cadastrado(s)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Novo Usuário</button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Criado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.data.map((u: any) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(u.roleIds || []).map((rid: string) => {
                        const role = Array.isArray(roles) ? roles.find(r => r.id === rid) : null;
                        return <span key={rid} className="badge" style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)' }}>{role?.name || rid}</span>
                      })}
                    </div>
                  </td>
                  <td><span className={`badge ${statusBadges[u.status] || ''}`}>{statusLabels[u.status] || u.status}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>Excluir</button>
                    </div>
                  </td>
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
              <h3>Novo Usuário</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ex@empresa.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Senha</label>
                <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Senha segura" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !form.email || !form.name || !form.password}>
                {creating ? 'Criando...' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Usuário</h3>
              <button className="modal-close" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input className="form-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nível de Acesso (Roles)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  {(Array.isArray(roles) ? roles : []).map((role: any) => (
                    <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                      <input 
                        type="checkbox" 
                        checked={editForm.roleIds.includes(role.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked 
                            ? [...editForm.roleIds, role.id]
                            : editForm.roleIds.filter(id => id !== role.id);
                          setEditForm({ ...editForm, roleIds: newIds });
                        }}
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleUpdate} disabled={saving || !editForm.name}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
