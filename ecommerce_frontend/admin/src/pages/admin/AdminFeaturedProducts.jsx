import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import {
  Sparkles,
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
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Sliders,
  Check,
  EyeOff
} from 'lucide-react';

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const LAYOUT_TYPES = {
  grid: "Grid Layout",
  carousel: "Carousel Layout",
  horizontal_scroll: "Horizontal Scroll Layout",
  banner_products: "Banner + Products Layout",
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
  const maxWidth = size === 'large' ? 'max-w-6xl' : 'max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className={`glass-panel border border-glass-border rounded-3xl w-full ${maxWidth} my-8 p-6 shadow-xl relative`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover transition-colors text-text-muted hover:text-white"
        >
          <X size={18} />
        </button>
        <h3 className="text-xl font-bold mb-5 pr-8 text-white">{title}</h3>
        {children}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminFeaturedProducts() {
  const [layouts, setLayouts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal States
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    layoutType: 'grid',
    selectedProducts: [],
    settings: {
      productsPerRow: 4,
      maxProducts: 8,
      showTitle: true,
      showSubtitle: true,
      showPrice: true,
      showSellerName: true,
      showRating: true,
      showAddToCart: true,
      showOrderNow: true
    },
    status: 'inactive',
    displayOrder: 0
  });

  // Product Selection Search
  const [prodQuery, setProdQuery] = useState('');
  const [prodResults, setProdResults] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchLayouts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (typeFilter) params.set('layoutType', typeFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(`/admin/featured-products?${params}`);
      setLayouts(res.data.layouts || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error("fetchLayouts error:", err);
      setLayouts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchLayouts();
  }, [fetchLayouts]);

  // Product searching inside modal
  const handleProductSearch = async () => {
    if (!prodQuery.trim()) return;
    setProdLoading(true);
    try {
      const res = await api.get(`/admin/products/search?query=${encodeURIComponent(prodQuery)}`);
      setProdResults(res.data || []);
    } catch (err) {
      console.error("handleProductSearch error:", err);
      setProdResults([]);
    } finally {
      setProdLoading(false);
    }
  };

  // Add Product to Selected List
  const handleAddProduct = (prod) => {
    const isSelected = form.selectedProducts.some(p => p.productId === prod.productId || p.productId?._id === prod.productId);
    if (isSelected) {
      alert("This product is already selected.");
      return;
    }

    const nextOrder = form.selectedProducts.length + 1;
    const item = {
      productId: {
        _id: prod.productId,
        title: prod.productName,
        images: prod.productImage ? [prod.productImage] : [],
        price: prod.price,
        stock: prod.stock,
        category: prod.category,
        sellerId: {
          businessName: prod.sellerName
        }
      },
      displayOrder: nextOrder
    };

    setForm(p => ({
      ...p,
      selectedProducts: [...p.selectedProducts, item]
    }));
  };

  // Remove Product from Selection
  const handleRemoveProduct = (prodId) => {
    const filtered = form.selectedProducts.filter(p => {
      const id = p.productId?._id || p.productId;
      return id !== prodId;
    });
    
    // Normalize display orders
    const normalized = filtered.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1
    }));

    setForm(p => ({
      ...p,
      selectedProducts: normalized
    }));
  };

  // Move Product Up
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const list = [...form.selectedProducts];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;

    // Recalculate display orders
    const normalized = list.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1
    }));

    setForm(p => ({ ...p, selectedProducts: normalized }));
  };

  // Move Product Down
  const handleMoveDown = (index) => {
    if (index === form.selectedProducts.length - 1) return;
    const list = [...form.selectedProducts];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;

    // Recalculate display orders
    const normalized = list.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1
    }));

    setForm(p => ({ ...p, selectedProducts: normalized }));
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      title: '',
      subtitle: '',
      layoutType: 'grid',
      selectedProducts: [],
      settings: {
        productsPerRow: 4,
        maxProducts: 8,
        showTitle: true,
        showSubtitle: true,
        showPrice: true,
        showSellerName: true,
        showRating: true,
        showAddToCart: true,
        showOrderNow: true
      },
      status: 'inactive',
      displayOrder: 0
    });
    setProdQuery('');
    setProdResults([]);
    setFormOpen(true);
  };

  const handleOpenEdit = (layout) => {
    setEditingItem(layout);
    // Deep clone/assign form data
    setForm({
      title: layout.title,
      subtitle: layout.subtitle || '',
      layoutType: layout.layoutType,
      selectedProducts: layout.selectedProducts.map(item => ({
        productId: item.productId,
        displayOrder: item.displayOrder
      })),
      settings: {
        productsPerRow: layout.settings?.productsPerRow ?? 4,
        maxProducts: layout.settings?.maxProducts ?? 8,
        showTitle: layout.settings?.showTitle ?? true,
        showSubtitle: layout.settings?.showSubtitle ?? true,
        showPrice: layout.settings?.showPrice ?? true,
        showSellerName: layout.settings?.showSellerName ?? true,
        showRating: layout.settings?.showRating ?? true,
        showAddToCart: layout.settings?.showAddToCart ?? true,
        showOrderNow: layout.settings?.showOrderNow ?? true
      },
      status: layout.status,
      displayOrder: layout.displayOrder ?? 0
    });
    setProdQuery('');
    setProdResults([]);
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Layout Title is required");
      return;
    }
    if (!form.selectedProducts || form.selectedProducts.length === 0) {
      alert("Please select at least one product for this layout");
      return;
    }

    // Map selectedProducts back to DB sub-document payload (raw IDs only)
    const payloadProducts = form.selectedProducts.map((item, idx) => ({
      productId: item.productId?._id || item.productId,
      displayOrder: idx + 1
    }));

    const payload = {
      ...form,
      selectedProducts: payloadProducts
    };

    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/admin/featured-products/${editingItem._id}`, payload);
      } else {
        await api.post('/admin/featured-products', payload);
      }
      setFormOpen(false);
      fetchLayouts();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to save layout configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (layout) => {
    const nextStatus = layout.status === 'active' ? 'inactive' : 'active';
    if (nextStatus === 'inactive') {
      const confirmDeactivate = window.confirm(
        'Deactivate this featured layout? It will immediately stop appearing on the customer side.'
      );
      if (!confirmDeactivate) return;
    }

    try {
      await api.patch(`/admin/featured-products/${layout._id}/status`, { status: nextStatus });
      fetchLayouts();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error updating status');
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this featured layout? This cannot be undone.'
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/admin/featured-products/${id}`);
      fetchLayouts();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error deleting layout');
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3">
            <Sparkles size={28} className="text-primary" /> Featured Products Layouts
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Build custom layouts (grids, carousels, lists) of selected products to showcase on the landing storefront.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn btn-primary flex items-center gap-2 px-4 py-2.5 text-sm shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} /> Create Layout
        </button>
      </div>

      {/* Toolbar (Search & Filters) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search by title or subtitle..."
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
            <option value="">All Layout Types</option>
            {Object.entries(LAYOUT_TYPES).map(([val, label]) => (
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
                <th className="px-4 py-3 font-bold">Layout Title</th>
                <th className="px-4 py-3 font-bold">Layout Type</th>
                <th className="px-4 py-3 font-bold">Linked Products</th>
                <th className="px-4 py-3 font-bold">Display Order</th>
                <th className="px-4 py-3 font-bold">Status</th>
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
              ) : layouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-text-muted">
                    No featured layouts created yet. Create a layout to highlight items.
                  </td>
                </tr>
              ) : (
                layouts.map((item) => (
                  <tr key={item._id} className="border-b border-glass-border/50 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{item.title}</div>
                      {item.subtitle && <div className="text-xs text-text-muted mt-0.5 truncate max-w-[200px]">{item.subtitle}</div>}
                    </td>
                    <td className="px-4 py-3 text-text-muted font-medium">
                      {LAYOUT_TYPES[item.layoutType] || item.layoutType}
                    </td>
                    <td className="px-4 py-3 text-white font-mono text-xs">
                      {item.selectedProducts?.length || 0} items
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white">
                      {item.displayOrder}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${item.status === 'active' ? 'hover:bg-warning/15 text-warning' : 'hover:bg-success/15 text-success'}`}
                          title={item.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {item.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/15 text-primary transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
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
        <p className="text-xs text-text-muted mt-3 text-center">Showing {layouts.length} of {total} layouts</p>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />

      {/* ─── Create/Edit Modal (Large Dual Columns) ────────────────────────────── */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingItem ? 'Edit Featured Layout' : 'Create Featured Layout'}
        size="large"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-white text-sm">
          {/* LEFT: Layout Form fields & Product Selector (Col 7) */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-text-muted">Layout Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Deals of the Week"
                  className="w-full bg-[#0f172a] border border-glass-border px-4 py-2.5 rounded-xl focus:border-primary transition-all outline-none text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-text-muted">Layout Subtitle</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm(p => ({ ...p, subtitle: e.target.value }))}
                  placeholder="e.g. Curated handcrafted items"
                  className="w-full bg-[#0f172a] border border-glass-border px-4 py-2.5 rounded-xl focus:border-primary transition-all outline-none text-white font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-text-muted">Layout Type *</label>
                <select
                  value={form.layoutType}
                  onChange={(e) => setForm(p => ({ ...p, layoutType: e.target.value }))}
                  className="w-full bg-[#0f172a] border border-glass-border px-3 py-2.5 rounded-xl focus:border-primary transition-all outline-none text-white font-medium"
                >
                  <option value="grid">Grid Layout</option>
                  <option value="carousel">Carousel Layout</option>
                  <option value="horizontal_scroll">Horizontal Scroll Layout</option>
                  <option value="banner_products">Banner + Products Layout</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-text-muted">Status *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full bg-[#0f172a] border border-glass-border px-3 py-2.5 rounded-xl focus:border-primary transition-all outline-none text-white font-medium"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-text-muted">Display Order *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={form.displayOrder}
                  onChange={(e) => setForm(p => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-[#0f172a] border border-glass-border px-4 py-2.5 rounded-xl focus:border-primary transition-all outline-none text-white font-medium"
                />
              </div>
            </div>

            {/* Display Settings Switches */}
            <div className="border border-glass-border rounded-2xl p-4 bg-white/5 space-y-3">
              <h4 className="text-xs font-bold uppercase text-text-muted mb-2 tracking-wider">Display Settings</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings.showTitle}
                    onChange={(e) => setForm(p => ({ ...p, settings: { ...p.settings, showTitle: e.target.checked } }))}
                    className="w-4 h-4 rounded accent-primary bg-[#0f172a] border-glass-border"
                  />
                  <span className="text-xs font-semibold">Show Title</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings.showSubtitle}
                    onChange={(e) => setForm(p => ({ ...p, settings: { ...p.settings, showSubtitle: e.target.checked } }))}
                    className="w-4 h-4 rounded accent-primary bg-[#0f172a] border-glass-border"
                  />
                  <span className="text-xs font-semibold">Show Subtitle</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings.showPrice}
                    onChange={(e) => setForm(p => ({ ...p, settings: { ...p.settings, showPrice: e.target.checked } }))}
                    className="w-4 h-4 rounded accent-primary bg-[#0f172a] border-glass-border"
                  />
                  <span className="text-xs font-semibold">Show Price</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings.showSellerName}
                    onChange={(e) => setForm(p => ({ ...p, settings: { ...p.settings, showSellerName: e.target.checked } }))}
                    className="w-4 h-4 rounded accent-primary bg-[#0f172a] border-glass-border"
                  />
                  <span className="text-xs font-semibold">Show Seller Name</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings.showRating}
                    onChange={(e) => setForm(p => ({ ...p, settings: { ...p.settings, showRating: e.target.checked } }))}
                    className="w-4 h-4 rounded accent-primary bg-[#0f172a] border-glass-border"
                  />
                  <span className="text-xs font-semibold">Show Rating</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings.showAddToCart}
                    onChange={(e) => setForm(p => ({ ...p, settings: { ...p.settings, showAddToCart: e.target.checked } }))}
                    className="w-4 h-4 rounded accent-primary bg-[#0f172a] border-glass-border"
                  />
                  <span className="text-xs font-semibold">Show Add to Cart</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings.showOrderNow}
                    onChange={(e) => setForm(p => ({ ...p, settings: { ...p.settings, showOrderNow: e.target.checked } }))}
                    className="w-4 h-4 rounded accent-primary bg-[#0f172a] border-glass-border"
                  />
                  <span className="text-xs font-semibold">Show Order Now</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-glass-border/30 mt-2">
                <div>
                  <label className="block text-[11px] font-bold text-text-muted mb-1">Max products to show</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.settings.maxProducts}
                    onChange={(e) => setForm(p => ({ ...p, settings: { ...p.settings, maxProducts: parseInt(e.target.value) || 8 } }))}
                    className="w-full bg-[#0f172a] border border-glass-border px-3 py-1.5 rounded-lg focus:border-primary transition-all outline-none text-white text-xs font-medium"
                  />
                </div>

                {form.layoutType === 'grid' && (
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted mb-1">Products per row</label>
                    <select
                      value={form.settings.productsPerRow}
                      onChange={(e) => setForm(p => ({ ...p, settings: { ...p.settings, productsPerRow: parseInt(e.target.value) || 4 } }))}
                      className="w-full bg-[#0f172a] border border-glass-border px-2 py-1.5 rounded-lg focus:border-primary transition-all outline-none text-white text-xs font-medium"
                    >
                      <option value="2">2 Columns</option>
                      <option value="3">3 Columns</option>
                      <option value="4">4 Columns</option>
                      <option value="5">5 Columns</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Product Database Search & Add */}
            <div className="border border-glass-border rounded-2xl p-4 bg-white/5 space-y-3">
              <h4 className="text-xs font-bold uppercase text-text-muted tracking-wider">Search & Add Products</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search active products by name..."
                  value={prodQuery}
                  onChange={(e) => setProdQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleProductSearch(); } }}
                  className="flex-1 bg-[#0f172a] border border-glass-border px-3 py-1.5 rounded-lg text-xs outline-none focus:border-primary transition-all text-white"
                />
                <button
                  type="button"
                  onClick={handleProductSearch}
                  disabled={prodLoading}
                  className="btn btn-secondary px-3 py-1.5 text-xs h-auto flex items-center justify-center font-bold"
                >
                  {prodLoading ? <Loader2 size={12} className="animate-spin" /> : "Search"}
                </button>
              </div>

              {prodResults.length > 0 && (
                <div className="border border-glass-border rounded-xl bg-black/20 p-2 divide-y divide-glass-border/30">
                  {prodResults.map((p) => {
                    const isSelected = form.selectedProducts.some(sel => (sel.productId?._id || sel.productId) === p.productId);
                    return (
                      <div key={p.productId} className="flex items-center justify-between gap-3 py-2 text-xs first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {p.productImage ? (
                            <img src={p.productImage} className="w-8 h-8 rounded object-cover bg-slate-800" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-[10px] text-text-muted font-bold">N/A</div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold truncate text-white max-w-[150px] sm:max-w-[250px]">{p.productName}</p>
                            <p className="text-[10px] text-text-muted mt-0.5 truncate">{p.sellerName} • ₹{p.price}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddProduct(p)}
                          disabled={isSelected}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all border ${
                            isSelected
                              ? 'bg-success/10 border-success/20 text-success'
                              : 'bg-primary border-primary text-white hover:bg-primary-hover'
                          }`}
                        >
                          {isSelected ? <Check size={10} className="inline mr-1" /> : "+"} Add
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* List of Selected Products with Reordering */}
            <div className="border border-glass-border rounded-2xl p-4 bg-white/5 space-y-3">
              <h4 className="text-xs font-bold uppercase text-text-muted tracking-wider flex justify-between">
                <span>Selected Products ({form.selectedProducts.length})</span>
                <span className="text-[10px] font-normal text-text-muted normal-case italic">Drag or click arrows to reorder</span>
              </h4>

              {form.selectedProducts.length === 0 ? (
                <div className="text-center py-6 text-xs text-text-muted border border-dashed border-glass-border rounded-xl">
                  No products selected. Search and add products from database above.
                </div>
              ) : (
                <div className="border border-glass-border rounded-xl bg-black/10 divide-y divide-glass-border/30">
                  {form.selectedProducts.map((item, idx) => {
                    const p = item.productId || {};
                    const id = p._id || p;
                    const fallbackImg = "https://placehold.co/100x100/f3f4f6/94a3b8?text=Product";
                    const img = p.images?.[0] || fallbackImg;
                    const seller = p.sellerId?.businessName || p.sellerId || "Seller";

                    return (
                      <div key={id} className="flex items-center justify-between gap-3 p-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={img} className="w-10 h-10 rounded-lg object-cover bg-slate-800" alt="" />
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate max-w-[150px] sm:max-w-[200px]">{p.title || "Selected Item"}</p>
                            <p className="text-[10px] text-text-muted mt-0.5">₹{p.price || 0} • Stock: {p.stock !== undefined ? p.stock : 'Yes'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="w-7 h-7 flex items-center justify-center border border-glass-border rounded hover:bg-white/10 disabled:opacity-20 transition-all text-white"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === form.selectedProducts.length - 1}
                            className="w-7 h-7 flex items-center justify-center border border-glass-border rounded hover:bg-white/10 disabled:opacity-20 transition-all text-white"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(id)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-error/15 text-error transition-all"
                            title="Remove product"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex items-center gap-2 px-6"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Publish Layout
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

          {/* RIGHT: Live Layout Preview (Col 5) */}
          <div className="lg:col-span-5 border border-glass-border rounded-3xl p-5 bg-black/45 h-fit sticky top-4 self-start">
            <h3 className="text-xs font-bold uppercase text-text-muted mb-4 tracking-wider flex items-center gap-2 border-b border-glass-border/30 pb-2">
              <Eye size={14} className="text-primary" /> Live Publishing Preview
            </h3>

            {form.settings.showTitle && form.title ? (
              <h2 className="text-base font-bold text-white tracking-tight leading-none">
                {form.title}
              </h2>
            ) : (
              <div className="h-4 w-40 bg-white/5 rounded italic text-[10px] text-text-muted flex items-center px-1">Layout Title hidden</div>
            )}
            
            {form.settings.showSubtitle && form.subtitle ? (
              <p className="text-[11px] text-text-muted mt-1 leading-normal">
                {form.subtitle}
              </p>
            ) : null}

            {/* Simulated Layout Area */}
            <div className="mt-6 border-t border-glass-border/30 pt-4">
              {form.selectedProducts.length === 0 ? (
                <div className="text-center py-12 text-xs text-text-muted italic border border-dashed border-glass-border rounded-xl bg-black/10">
                  Select products to preview layout.
                </div>
              ) : form.layoutType === 'grid' ? (
                /* Grid Preview */
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-2">Grid Layout ({form.settings.productsPerRow} Columns)</div>
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${form.settings.productsPerRow}, minmax(0, 1fr))` }}>
                    {form.selectedProducts.slice(0, form.settings.maxProducts).map((item) => {
                      const p = item.productId || {};
                      const img = p.images?.[0] || "https://placehold.co/100x100/f3f4f6/94a3b8?text=Product";
                      return (
                        <div key={p._id || Math.random()} className="border border-glass-border rounded-xl overflow-hidden bg-white/5 p-2 flex flex-col justify-between">
                          <img src={img} className="w-full aspect-square rounded-lg object-cover bg-slate-800" alt="" />
                          <div className="mt-1.5 space-y-1 min-w-0">
                            <p className="text-[10px] font-bold truncate text-white">{p.title || "Product Title"}</p>
                            {form.settings.showSellerName && (
                              <p className="text-[8px] text-text-muted truncate">By {p.sellerId?.businessName || "Seller"}</p>
                            )}
                            {form.settings.showPrice && (
                              <p className="text-[10px] font-bold text-white">₹{p.price || 0}</p>
                            )}
                            {form.settings.showRating && (
                              <div className="text-[8px] text-yellow-400">★★★★★ (4.8)</div>
                            )}
                            <div className="flex flex-col gap-1 pt-1.5 border-t border-glass-border/30">
                              {form.settings.showAddToCart && (
                                <button type="button" className="bg-yellow-400 text-slate-950 font-bold py-0.5 rounded text-[8px] cursor-default pointer-events-none">Add</button>
                              )}
                              {form.settings.showOrderNow && (
                                <button type="button" className="bg-indigo-950 text-white font-bold py-0.5 rounded text-[8px] cursor-default pointer-events-none">Order Now</button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : form.layoutType === 'carousel' || form.layoutType === 'horizontal_scroll' ? (
                /* Scroll/Carousel Preview */
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-2">
                    {form.layoutType === 'carousel' ? "Carousel Layout (Swiper)" : "Horizontal Scroll Layout"}
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                    {form.selectedProducts.slice(0, form.settings.maxProducts).map((item) => {
                      const p = item.productId || {};
                      const img = p.images?.[0] || "https://placehold.co/100x100/f3f4f6/94a3b8?text=Product";
                      return (
                        <div key={p._id || Math.random()} className="border border-glass-border rounded-xl bg-white/5 p-2 flex flex-col justify-between shrink-0 w-[110px]">
                          <img src={img} className="w-full aspect-square rounded-lg object-cover bg-slate-800" alt="" />
                          <div className="mt-1.5 space-y-1 min-w-0">
                            <p className="text-[10px] font-bold truncate text-white">{p.title || "Product Title"}</p>
                            {form.settings.showSellerName && (
                              <p className="text-[8px] text-text-muted truncate">By {p.sellerId?.businessName || "Seller"}</p>
                            )}
                            {form.settings.showPrice && (
                              <p className="text-[10px] font-bold text-white">₹{p.price || 0}</p>
                            )}
                            {form.settings.showRating && (
                              <div className="text-[8px] text-yellow-400">★★★★★</div>
                            )}
                            <div className="flex flex-col gap-1 pt-1 border-t border-glass-border/30">
                              {form.settings.showAddToCart && (
                                <button type="button" className="bg-yellow-400 text-slate-950 font-bold py-0.5 rounded text-[8px] cursor-default pointer-events-none">Add</button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Banner + Products Preview */
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-2">Banner + Products Layout</div>
                  <div className="grid grid-cols-12 gap-3">
                    {/* Mock Banner */}
                    <div className="col-span-4 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 border border-glass-border p-3 flex flex-col justify-end min-h-[140px]">
                      <div className="text-[10px] font-bold uppercase text-white leading-tight">Collection Highlight</div>
                      <div className="text-[7px] text-text-muted mt-1 leading-normal">Interactive Banner graphic</div>
                    </div>
                    {/* Products Row */}
                    <div className="col-span-8 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {form.selectedProducts.slice(0, form.settings.maxProducts).map((item) => {
                        const p = item.productId || {};
                        const img = p.images?.[0] || "https://placehold.co/100x100/f3f4f6/94a3b8?text=Product";
                        return (
                          <div key={p._id || Math.random()} className="border border-glass-border rounded-xl bg-white/5 p-1.5 flex flex-col justify-between shrink-0 w-[95px] h-full">
                            <img src={img} className="w-full aspect-square rounded-lg object-cover bg-slate-800" alt="" />
                            <div className="mt-1 space-y-0.5 min-w-0">
                              <p className="text-[9px] font-bold truncate text-white">{p.title || "Product Title"}</p>
                              {form.settings.showPrice && (
                                <p className="text-[9px] font-bold text-white">₹{p.price || 0}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
