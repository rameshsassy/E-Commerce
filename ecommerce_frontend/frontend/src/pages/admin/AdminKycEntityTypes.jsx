import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Plus, Pencil, Trash2, ArrowLeft, Loader2 } from 'lucide-react';

const AdminKycEntityTypes = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ label: '', requiresOtherText: false });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ label: '', requiresOtherText: false, isActive: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/admin/kyc-entity-types');
      setTypes(data.entityTypes || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load entity types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.label.trim()) return;
    setSaving(true);
    try {
      await api.post('/admin/kyc-entity-types', {
        label: form.label.trim(),
        requiresOtherText: form.requiresOtherText,
      });
      setForm({ label: '', requiresOtherText: false });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row._id);
    setEditForm({
      label: row.label,
      requiresOtherText: row.requiresOtherText,
      isActive: row.isActive,
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/kyc-entity-types/${editingId}`, editForm);
      setEditingId(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const msg = row.isSystem
      ? 'This will deactivate the system type. Sellers will no longer see it. Continue?'
      : 'Delete this entity type permanently?';
    if (!window.confirm(msg)) return;
    try {
      await api.delete(`/admin/kyc-entity-types/${row._id}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <Link to="/admin/kyc" className="btn btn-secondary inline-flex items-center gap-2">
          <ArrowLeft size={18} /> KYC Approvals
        </Link>
        <h1 className="text-3xl font-bold flex-1">KYC Entity Types</h1>
      </div>

      <p className="text-text-muted mb-6 text-sm">
        Manage the entity types sellers choose during KYC. Default types are seeded on first server start; you can add more or deactivate types sellers should not see.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm">{error}</div>
      )}

      <div className="glass-panel p-6 rounded-2xl mb-8">
        <h2 className="text-lg font-bold mb-4">Add entity type</h2>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Label</label>
            <input
              className="input-field w-full"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. Producer Company"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm pb-2 sm:pb-3 whitespace-nowrap">
            <input
              type="checkbox"
              checked={form.requiresOtherText}
              onChange={(e) => setForm({ ...form, requiresOtherText: e.target.checked })}
            />
            Requires &quot;Other&quot; text
          </label>
          <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={saving}>
            <Plus size={18} /> Add
          </button>
        </form>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-lg font-bold mb-4">All entity types</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-glass-border text-text-muted">
                  <th className="p-3 font-medium">Order</th>
                  <th className="p-3 font-medium">Label</th>
                  <th className="p-3 font-medium">Code</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {types.map((row) => (
                  <tr key={row._id} className="border-b border-glass-border/60">
                    <td className="p-3">{row.sortOrder}</td>
                    <td className="p-3">
                      {editingId === row._id ? (
                        <input
                          className="input-field w-full"
                          value={editForm.label}
                          onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        />
                      ) : (
                        <span className="font-medium">{row.label}</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs text-text-muted">{row.code}</td>
                    <td className="p-3">
                      {editingId === row._id ? (
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                          />
                          Active
                        </label>
                      ) : (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            row.isActive ? 'bg-success/15 text-success' : 'bg-error/15 text-error'
                          }`}
                        >
                          {row.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {editingId === row._id ? (
                        <div className="flex justify-end gap-2">
                          <button type="button" className="btn btn-primary text-xs" onClick={saveEdit} disabled={saving}>
                            Save
                          </button>
                          <button type="button" className="btn btn-secondary text-xs" onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button type="button" className="p-2 rounded-lg hover:bg-surface-hover" onClick={() => startEdit(row)} title="Edit">
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="p-2 rounded-lg hover:bg-error/10 text-error"
                            onClick={() => handleDelete(row)}
                            title={row.isSystem ? 'Deactivate' : 'Delete'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminKycEntityTypes;
