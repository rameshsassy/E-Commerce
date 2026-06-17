import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import {
  HelpCircle,
  Plus,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TAB_FAQS = 'faqs';
const TAB_REQUESTS = 'requests';

const StatusBadge = ({ status, active }) => {
  if (active !== undefined) {
    return active ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success/15 text-success border border-success/25">
        <span className="w-1.5 h-1.5 rounded-full bg-success" /> Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-text-muted/15 text-text-muted border border-text-muted/25">
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted" /> Inactive
      </span>
    );
  }
  const map = {
    Pending: 'bg-warning/15 text-warning border-warning/25',
    Answered: 'bg-success/15 text-success border-success/25',
    Rejected: 'bg-error/15 text-error border-error/25',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${map[status] || ''}`}>
      {status}
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

// ─── Modal ────────────────────────────────────────────────────────────────────

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel border border-glass-border rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-xl relative">
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

export default function AdminFAQs() {
  const [tab, setTab] = useState(TAB_FAQS);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3">
          <HelpCircle size={28} className="text-primary" /> FAQ Management
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Manage published FAQs and user question submissions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab(TAB_FAQS)}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border ${
            tab === TAB_FAQS
              ? 'bg-primary text-white border-primary shadow-md'
              : 'border-glass-border text-text-muted hover:bg-surface-hover'
          }`}
        >
          <HelpCircle size={16} className="inline mr-1.5 -mt-0.5" />
          Published FAQs
        </button>
        <button
          onClick={() => setTab(TAB_REQUESTS)}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border ${
            tab === TAB_REQUESTS
              ? 'bg-primary text-white border-primary shadow-md'
              : 'border-glass-border text-text-muted hover:bg-surface-hover'
          }`}
        >
          <MessageSquare size={16} className="inline mr-1.5 -mt-0.5" />
          User Questions
        </button>
      </div>

      {tab === TAB_FAQS ? <FAQsTab /> : <RequestsTab />}
    </div>
  );
}

// ─── Tab 1: Published FAQs ────────────────────────────────────────────────────

function FAQsTab() {
  const [faqs, setFaqs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ question: '', answer: '', displayOrder: 0, isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchFAQs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/faqs/admin/all?${params}`);
      setFaqs(res.data.faqs || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch {
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchFAQs(); }, [fetchFAQs]);

  const openCreate = () => {
    setEditing(null);
    setForm({ question: '', answer: '', displayOrder: 0, isActive: true });
    setModalOpen(true);
  };

  const openEdit = (faq) => {
    setEditing(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      displayOrder: faq.displayOrder || 0,
      isActive: faq.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/faqs/admin/${editing._id}`, form);
      } else {
        await api.post('/faqs/admin', form);
      }
      setModalOpen(false);
      fetchFAQs();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error saving FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (faq) => {
    try {
      await api.put(`/faqs/admin/${faq._id}`, { isActive: !faq.isActive });
      fetchFAQs();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await api.delete(`/faqs/admin/${id}`);
      fetchFAQs();
    } catch {}
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white/5 border border-glass-border pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-primary transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-glass-border px-3 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-primary transition-all"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2 px-4 py-2.5 text-sm shrink-0">
          <Plus size={16} /> Create FAQ
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel border border-glass-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-glass-border text-text-muted text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3 font-bold">Question</th>
                <th className="px-4 py-3 font-bold hidden md:table-cell">Answer</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Order</th>
                <th className="px-4 py-3 font-bold hidden lg:table-cell">Created</th>
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
              ) : faqs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-text-muted">
                    No FAQs found.
                  </td>
                </tr>
              ) : (
                faqs.map((faq) => (
                  <tr key={faq._id} className="border-b border-glass-border/50 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3 font-semibold max-w-[250px] truncate">{faq.question}</td>
                    <td className="px-4 py-3 text-text-muted max-w-[250px] truncate hidden md:table-cell">{faq.answer}</td>
                    <td className="px-4 py-3">
                      <StatusBadge active={faq.isActive} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{faq.displayOrder}</td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell">
                      {new Date(faq.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggle(faq)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${faq.isActive ? 'hover:bg-warning/15 text-warning' : 'hover:bg-success/15 text-success'}`}
                          title={faq.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {faq.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button onClick={() => openEdit(faq)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/15 text-primary transition-colors" title="Edit">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDelete(faq._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error/15 text-error transition-colors" title="Delete">
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
        <p className="text-xs text-text-muted mt-3 text-center">Showing {faqs.length} of {total} FAQs</p>
      )}
      <Pagination page={page} pages={pages} onPageChange={setPage} />

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit FAQ' : 'Create FAQ'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1.5">Question *</label>
            <input
              type="text"
              value={form.question}
              onChange={(e) => setForm(p => ({ ...p, question: e.target.value }))}
              className="w-full bg-white/5 border-2 border-glass-border px-4 py-3 rounded-xl focus:border-primary transition-all outline-none font-medium"
              placeholder="Enter the question"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5">Answer *</label>
            <textarea
              rows={4}
              value={form.answer}
              onChange={(e) => setForm(p => ({ ...p, answer: e.target.value }))}
              className="w-full bg-white/5 border-2 border-glass-border px-4 py-3 rounded-xl focus:border-primary transition-all outline-none font-medium resize-none"
              placeholder="Enter the answer"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1.5">Display Order</label>
              <input
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(e) => setForm(p => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))}
                className="w-full bg-white/5 border-2 border-glass-border px-4 py-3 rounded-xl focus:border-primary transition-all outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5">Status</label>
              <select
                value={form.isActive ? 'true' : 'false'}
                onChange={(e) => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}
                className="w-full bg-white/5 border-2 border-glass-border px-4 py-3 rounded-xl focus:border-primary transition-all outline-none font-medium"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn btn-primary flex items-center gap-2 px-6">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {editing ? 'Update' : 'Save'}
            </button>
            <button onClick={() => setModalOpen(false)} className="btn btn-secondary px-6">Cancel</button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Tab 2: User Questions ────────────────────────────────────────────────────

function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState(null);
  const [answerModal, setAnswerModal] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [publishAsFAQ, setPublishAsFAQ] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/faqs/admin/requests?${params}`);
      setRequests(res.data.requests || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAnswer = async () => {
    if (!answerText.trim()) return;
    setSaving(true);
    try {
      await api.put(`/faqs/admin/requests/${answerModal._id}/answer`, {
        answer: answerText,
        publishAsFAQ,
      });
      setAnswerModal(null);
      setAnswerText('');
      setPublishAsFAQ(false);
      fetchRequests();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error answering question');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this question?')) return;
    try {
      await api.put(`/faqs/admin/requests/${id}/reject`);
      fetchRequests();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await api.delete(`/faqs/admin/requests/${id}`);
      fetchRequests();
    } catch {}
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white/5 border border-glass-border pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-primary transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-glass-border px-3 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-primary transition-all"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Answered">Answered</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-panel border border-glass-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-glass-border text-text-muted text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold hidden md:table-cell">Email</th>
                <th className="px-4 py-3 font-bold hidden lg:table-cell">Type</th>
                <th className="px-4 py-3 font-bold">Subject</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-text-muted">
                    No question requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="border-b border-glass-border/50 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3 font-semibold">{req.name}</td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden md:table-cell">{req.email}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${req.userType === 'Seller' ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'}`}>
                        {req.userType}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{req.subject}</td>
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setViewItem(req)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/15 text-primary transition-colors" title="View">
                          <Eye size={16} />
                        </button>
                        {req.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => { setAnswerModal(req); setAnswerText(''); setPublishAsFAQ(false); }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-success/15 text-success transition-colors"
                              title="Answer"
                            >
                              <Send size={16} />
                            </button>
                            <button onClick={() => handleReject(req._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-warning/15 text-warning transition-colors" title="Reject">
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(req._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error/15 text-error transition-colors" title="Delete">
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
        <p className="text-xs text-text-muted mt-3 text-center">Showing {requests.length} of {total} requests</p>
      )}
      <Pagination page={page} pages={pages} onPageChange={setPage} />

      {/* View Detail Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Question Details">
        {viewItem && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-text-muted text-xs font-bold uppercase mb-1">Name</p>
                <p className="font-semibold">{viewItem.name}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs font-bold uppercase mb-1">Email</p>
                <p className="font-semibold">{viewItem.email}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs font-bold uppercase mb-1">User Type</p>
                <p className="font-semibold">{viewItem.userType}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs font-bold uppercase mb-1">Status</p>
                <StatusBadge status={viewItem.status} />
              </div>
            </div>
            <div>
              <p className="text-text-muted text-xs font-bold uppercase mb-1">Subject</p>
              <p className="font-semibold">{viewItem.subject}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs font-bold uppercase mb-1">Question</p>
              <p className="bg-white/5 border border-glass-border rounded-xl p-4 leading-relaxed">{viewItem.question}</p>
            </div>
            {viewItem.answer && (
              <div>
                <p className="text-text-muted text-xs font-bold uppercase mb-1">Answer</p>
                <p className="bg-success/5 border border-success/20 rounded-xl p-4 leading-relaxed">{viewItem.answer}</p>
              </div>
            )}
            <div>
              <p className="text-text-muted text-xs font-bold uppercase mb-1">Submitted</p>
              <p className="font-semibold">{new Date(viewItem.createdAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Answer Modal */}
      <Modal open={!!answerModal} onClose={() => setAnswerModal(null)} title="Answer Question">
        {answerModal && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-glass-border rounded-xl p-4">
              <p className="text-text-muted text-xs font-bold uppercase mb-1">Question</p>
              <p className="font-semibold">{answerModal.question}</p>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5">Your Answer *</label>
              <textarea
                rows={4}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                className="w-full bg-white/5 border-2 border-glass-border px-4 py-3 rounded-xl focus:border-primary transition-all outline-none font-medium resize-none"
                placeholder="Type your answer..."
              />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={publishAsFAQ}
                onChange={(e) => setPublishAsFAQ(e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm font-semibold">Publish this as a FAQ</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={handleAnswer} disabled={saving} className="btn btn-primary flex items-center gap-2 px-6">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Submit Answer
              </button>
              <button onClick={() => setAnswerModal(null)} className="btn btn-secondary px-6">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
