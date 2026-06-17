import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import RichTextEditor from '../../components/admin/RichTextEditor';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle
} from 'lucide-react';

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const POLICY_TYPES = {
  refund_policy: "Refund Policy",
  return_policy: "Return Policy",
  replacement_policy: "Replacement Policy",
  terms_of_use: "Terms of Use",
  shipping_policy: "Shipping Policy",
  seller_agreement: "Seller Agreement",
};

const StatusBadge = ({ status }) => {
  const isActive = status === 'active';
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success/15 text-success border border-success/25">
      <span className="w-1.5 h-1.5 rounded-full bg-success" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-text-muted/15 text-text-muted border border-text-muted/25">
      <span className="w-1.5 h-1.5 rounded-full bg-text-muted" /> Inactive
    </span>
  );
};

const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-glass-border hover:bg-surface-hover disabled:opacity-30 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-medium text-text-muted px-3">
        Page {page} of {pages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-glass-border hover:bg-surface-hover disabled:opacity-30 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

const Modal = ({ open, onClose, title, children, size = 'default' }) => {
  if (!open) return null;
  const maxWidth = size === 'large' ? 'max-w-3xl' : 'max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className={`glass-panel border border-glass-border rounded-3xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-6 shadow-xl relative`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover transition-colors"
        >
          <X size={18} />
        </button>
        <h3 className="text-xl font-bold mb-5 pr-8">{title}</h3>
        {children}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPolicies() {
  const [policies, setPolicies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form state
  const [form, setForm] = useState({
    title: '',
    type: '',
    content: '',
    status: 'inactive'
  });
  const [saving, setSaving] = useState(false);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      
      const res = await api.get(`/admin/policies?${params}`);
      setPolicies(res.data.policies || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error("fetchPolicies error:", err);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Open creation modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      title: '',
      type: '',
      content: '',
      status: 'inactive'
    });
    setFormOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (policy) => {
    setEditingItem(policy);
    setForm({
      title: policy.title,
      type: policy.type,
      content: policy.content,
      status: policy.status
    });
    setFormOpen(true);
  };

  // Open view details modal
  const handleOpenView = (policy) => {
    setViewItem(policy);
    setViewOpen(true);
  };

  // Save (Create / Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Policy Title is required");
      return;
    }
    if (!form.type) {
      alert("Policy Type is required");
      return;
    }
    if (!form.content.trim()) {
      alert("Policy Content is required");
      return;
    }
    
    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/admin/policies/${editingItem._id}`, form);
      } else {
        await api.post('/admin/policies', form);
      }
      setFormOpen(false);
      fetchPolicies();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error saving policy');
    } finally {
      setSaving(false);
    }
  };

  // Status Change (PATCH) with optional deactivate confirmation
  const handleToggleStatus = async (policy) => {
    const nextStatus = policy.status === 'active' ? 'inactive' : 'active';
    
    if (nextStatus === 'inactive') {
      const confirmDeactivate = window.confirm(
        `Are you sure you want to deactivate this policy? It will no longer be visible to Customers and Sellers.`
      );
      if (!confirmDeactivate) return;
    }

    try {
      await api.patch(`/admin/policies/${policy._id}/status`, { status: nextStatus });
      fetchPolicies();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error changing status');
    }
  };

  // Delete Policy
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to permanently delete this policy? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/admin/policies/${id}`);
      fetchPolicies();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error deleting policy');
    }
  };

  const getUserDisplayName = (u) => {
    if (!u) return '—';
    return u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Admin';
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3">
            <FileText size={28} className="text-primary" /> Policies Management
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Create, edit, and publish platform terms and agreements dynamically.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn btn-primary flex items-center gap-2 px-4 py-2.5 text-sm shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} /> Add Policy
        </button>
      </div>

      {/* Toolbar (Search & Filters) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search by title or content..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white/5 border border-glass-border pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-primary transition-all"
          />
        </div>
        
        <div className="grid grid-cols-2 md:flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-[#1e293b] text-white border border-glass-border px-3 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-primary transition-all"
          >
            <option value="">All Types</option>
            {Object.entries(POLICY_TYPES).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#1e293b] text-white border border-glass-border px-3 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-primary transition-all"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel border border-glass-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-glass-border text-text-muted text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3 font-bold">Policy Name</th>
                <th className="px-4 py-3 font-bold">Policy Type</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold hidden md:table-cell">Last Updated</th>
                <th className="px-4 py-3 font-bold hidden lg:table-cell">Updated By</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : policies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-text-muted">
                    No policies found. Create a new policy to get started.
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr key={policy._id} className="border-b border-glass-border/50 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white max-w-[200px] truncate">{policy.title}</td>
                    <td className="px-4 py-3 text-text-muted font-medium">
                      {POLICY_TYPES[policy.type] || policy.type}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={policy.status} />
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden md:table-cell">
                      {new Date(policy.updatedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell">
                      {getUserDisplayName(policy.updatedBy || policy.createdBy)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(policy)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${policy.status === 'active' ? 'hover:bg-warning/15 text-warning' : 'hover:bg-success/15 text-success'}`}
                          title={policy.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {policy.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button
                          onClick={() => handleOpenView(policy)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(policy)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/15 text-primary transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(policy._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error/15 text-error transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {total > 0 && (
        <p className="text-xs text-text-muted mt-3 text-center">Showing {policies.length} of {total} policies</p>
      )}
      
      <Pagination page={page} pages={pages} onPageChange={setPage} />

      {/* ─── Create/Edit Modal ────────────────────────────────────────────────── */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingItem ? 'Edit Policy' : 'Add Policy'}
        size="large"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-white">Policy Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Refund Policy"
              className="w-full bg-[#0f172a] border border-glass-border px-4 py-2.5 rounded-xl focus:border-primary transition-all outline-none text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1.5 text-white">Policy Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-[#0f172a] border border-glass-border px-4 py-2.5 rounded-xl focus:border-primary transition-all outline-none text-white font-medium"
              >
                <option value="">Select one</option>
                {Object.entries(POLICY_TYPES).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-white">Status *</label>
              <select
                value={form.status}
                onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full bg-[#0f172a] border border-glass-border px-4 py-2.5 rounded-xl focus:border-primary transition-all outline-none text-white font-medium"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-white">Policy Content *</label>
            <RichTextEditor
              value={form.content}
              onChange={(val) => setForm(p => ({ ...p, content: val }))}
              placeholder="Compose your rich formatted policy content here..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex items-center gap-2 px-6"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Save
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="btn btn-secondary px-6"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── View Detail Modal ────────────────────────────────────────────────── */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Policy Details"
        size="large"
      >
        {viewItem && (
          <div className="space-y-4 text-sm text-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-glass-border">
              <div>
                <p className="text-text-muted text-[10px] font-bold uppercase mb-1">Title</p>
                <p className="font-semibold text-white">{viewItem.title}</p>
              </div>
              <div>
                <p className="text-text-muted text-[10px] font-bold uppercase mb-1">Type</p>
                <p className="font-semibold text-white">{POLICY_TYPES[viewItem.type] || viewItem.type}</p>
              </div>
              <div>
                <p className="text-text-muted text-[10px] font-bold uppercase mb-1">Status</p>
                <StatusBadge status={viewItem.status} />
              </div>
              <div>
                <p className="text-text-muted text-[10px] font-bold uppercase mb-1">Last Updated</p>
                <p className="font-semibold text-white">
                  {new Date(viewItem.updatedAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>

            <div>
              <p className="text-text-muted text-[10px] font-bold uppercase mb-2">Policy Content</p>
              <div 
                className="bg-[#0f172a] border border-glass-border rounded-xl p-6 leading-relaxed max-h-[40vh] overflow-y-auto policy-rich-editor select-text"
                dangerouslySetInnerHTML={{ __html: viewItem.content }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-text-muted">
              <div>
                <span className="font-bold uppercase">Created By:</span> {getUserDisplayName(viewItem.createdBy)}
              </div>
              <div>
                <span className="font-bold uppercase">Updated By:</span> {getUserDisplayName(viewItem.updatedBy)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
