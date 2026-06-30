import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Plus, GripVertical, Edit2, Trash2, Eye, EyeOff, Loader2, X } from 'lucide-react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Modal / Form States
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    isActive: true,
  });

  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableCollections, setAvailableCollections] = useState([]);
  const [linkType, setLinkType] = useState('default');
  const [linkValue, setLinkValue] = useState('');

  const PREDEFINED_PAGES = [
    { label: 'Shop All Products (/products)', value: '/products' },
    { label: 'Bulk Purchase (/bulk-purchase)', value: '/bulk-purchase' },
    { label: 'My Rewards (/rewards)', value: '/rewards' },
    { label: 'FAQs (/faqs)', value: '/faqs' },
    { label: 'Support (/support)', value: '/support' },
    { label: 'Wishlist (/wishlist)', value: '/wishlist' },
    { label: 'Live Chat (/chat)', value: '/chat' },
  ];

  const parseProductLink = (link) => {
    if (!link) {
      return { type: 'default', value: '' };
    }
    if (link.startsWith('/products?category=')) {
      return { type: 'category', value: link.substring('/products?category='.length) };
    }
    if (link.startsWith('/products?collection=')) {
      return { type: 'collection', value: link.substring('/products?collection='.length) };
    }
    const predefinedPages = ['/products', '/bulk-purchase', '/rewards', '/faqs', '/support', '/wishlist', '/chat'];
    if (predefinedPages.includes(link)) {
      return { type: 'predefined', value: link };
    }
    return { type: 'custom', value: link };
  };

  useEffect(() => {
    if (showModal) {
      api.get('/categories')
        .then(res => setAvailableCategories(res.data || []))
        .catch(err => console.error("Error fetching categories:", err));

      api.get('/admin/featured-products')
        .then(res => setAvailableCollections(res.data || []))
        .catch(err => console.error("Error fetching collections:", err));
    }
  }, [showModal]);

  // Drag states
  const [draggedIndex, setDraggedIndex] = useState(null);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/homepage-settings/categories/all');
      setCategories(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch header categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      icon: '',
      isActive: true,
    });
    setLinkType('default');
    setLinkValue('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || '',
      isActive: cat.isActive,
    });
    const parsed = parseProductLink(cat.productLink || '');
    setLinkType(parsed.type);
    setLinkValue(parsed.value);
    setError('');
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    // Auto-generate slug from name if modifying name on a new item
    if (name === 'name' && !editingCategory) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData(prev => ({
        ...prev,
        name: value,
        slug: autoSlug,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: val,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      setError('Name and Slug are required fields.');
      return;
    }

    let finalProductLink = '';
    if (linkType === 'category') {
      if (!linkValue) {
        setError('Please select a product category.');
        return;
      }
      finalProductLink = `/products?category=${linkValue}`;
    } else if (linkType === 'collection') {
      if (!linkValue) {
        setError('Please select a product collection.');
        return;
      }
      finalProductLink = `/products?collection=${linkValue}`;
    } else if (linkType === 'predefined') {
      if (!linkValue) {
        setError('Please select a predefined page.');
        return;
      }
      finalProductLink = linkValue;
    } else if (linkType === 'custom') {
      if (!linkValue.trim()) {
        setError('Custom URL is required.');
        return;
      }
      if (!linkValue.startsWith('/')) {
        setError('Custom URL must start with a "/" for internal routing.');
        return;
      }
      finalProductLink = linkValue.trim();
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        productLink: finalProductLink,
      };

      if (editingCategory) {
        // Update
        const { data } = await api.put(`/homepage-settings/categories/${editingCategory._id}`, payload);
        setCategories(prev => prev.map(c => c._id === editingCategory._id ? data.category : c));
      } else {
        // Create
        const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.displayOrder || 0)) + 1 : 0;
        const { data } = await api.post('/homepage-settings/categories', {
          ...payload,
          displayOrder: nextOrder,
        });
        setCategories(prev => [...prev, data.category]);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this header category?')) return;
    try {
      await api.delete(`/homepage-settings/categories/${id}`);
      setCategories(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete category.');
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      const { data } = await api.put(`/homepage-settings/categories/${cat._id}`, {
        isActive: !cat.isActive,
      });
      setCategories(prev => prev.map(c => c._id === cat._id ? data.category : c));
    } catch (err) {
      console.error(err);
      setError('Failed to toggle active status.');
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Make transparent drag preview if desired or let browser handle default
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Swap items locally in array
    const updated = [...categories];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setCategories(updated);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    setSaving(true);
    
    // Map displayOrder back onto the list in current order
    const ordered = categories.map((cat, index) => ({
      id: cat._id,
      displayOrder: index,
    }));

    try {
      await api.put('/homepage-settings/categories/reorder', { categories: ordered });
      // Update local states order value to be correct
      setCategories(prev => prev.map((c, idx) => ({ ...c, displayOrder: idx })));
    } catch (err) {
      console.error(err);
      setError('Failed to save category order.');
      fetchCategories(); // Revert back
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-glass-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">Header Categories Management</h3>
          <p className="text-text-muted text-sm mt-0.5">
            Categories displaying in top header. Drag items to reorder.
            The first 3 active appear directly, the rest move to the "More" dropdown.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="btn btn-primary flex items-center gap-1.5 py-2 px-4 text-sm font-semibold rounded-xl"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center p-12 text-text-muted border border-dashed border-glass-border rounded-2xl">
          No categories configured for the header yet. Click "Add Category" to create one.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-glass-border text-xs uppercase text-text-muted font-semibold">
                <th className="p-3 w-10"></th>
                <th className="p-3">Category Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Icon Name</th>
                <th className="p-3">Product Link</th>
                <th className="p-3 w-32">Status</th>
                <th className="p-3 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, index) => (
                <tr
                  key={cat._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`border-b border-glass-border hover:bg-surface/30 transition-colors cursor-move ${
                    draggedIndex === index ? 'opacity-40 bg-surface/50' : ''
                  }`}
                >
                  <td className="p-3 text-text-muted align-middle">
                    <GripVertical size={16} className="cursor-grab active:cursor-grabbing" />
                  </td>
                  <td className="p-3 font-semibold align-middle">
                    <div className="flex items-center gap-2">
                      <span>{cat.name}</span>
                      {cat.isActive && index < 3 ? (
                        <span className="px-1.5 py-0.5 text-[9px] bg-primary/20 text-primary rounded-md font-extrabold uppercase border border-primary/20">
                          Direct Header
                        </span>
                      ) : cat.isActive ? (
                        <span className="px-1.5 py-0.5 text-[9px] bg-warning/20 text-warning-foreground rounded-md font-extrabold uppercase border border-warning/20">
                          More Dropdown
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-xs text-text-muted align-middle">{cat.slug}</td>
                  <td className="p-3 font-mono text-xs text-text-muted align-middle">
                    {cat.icon || <span className="text-gray-600">-</span>}
                  </td>
                  <td className="p-3 font-mono text-xs text-text-muted align-middle">
                    {cat.productLink ? (
                      <span className="text-primary truncate max-w-[150px] inline-block font-semibold" title={cat.productLink}>
                        {cat.productLink}
                      </span>
                    ) : (
                      <span className="text-zinc-600 italic">Default Slug</span>
                    )}
                  </td>
                  <td className="p-3 align-middle">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(cat)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                        cat.isActive
                          ? 'bg-success/10 border-success/20 text-success-foreground hover:bg-success/20'
                          : 'bg-zinc-800 border-zinc-700 text-text-muted hover:bg-zinc-700'
                      }`}
                    >
                      {cat.isActive ? (
                        <>
                          <Eye size={12} /> Active
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} /> Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="p-3 text-right align-middle">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        className="p-2 bg-white/5 border border-glass-border hover:bg-surface-hover rounded-lg transition-colors text-text-muted hover:text-white"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat._id)}
                        className="p-2 bg-error/10 border border-error/20 hover:bg-error/20 rounded-lg transition-colors text-error"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Save status loader */}
      {saving && (
        <div className="flex items-center gap-2 mt-4 text-xs text-text-muted justify-end">
          <Loader2 className="animate-spin text-primary" size={14} />
          Saving order...
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-glass-border shadow-elegant overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-glass-border flex items-center justify-between">
              <h4 className="font-bold text-lg">{editingCategory ? 'Edit Category' : 'Add Header Category'}</h4>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors text-text-muted hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Category Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Mens Wear"
                  required
                  className="input-field py-2.5 px-4 rounded-xl text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Category Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="e.g. mens-wear"
                  required
                  className="input-field py-2.5 px-4 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold flex items-center gap-1">
                  Category Icon <span className="text-xs text-text-muted">(optional)</span>
                </label>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  placeholder="e.g. Shirt, ShirtIcon, LucideName"
                  className="input-field py-2.5 px-4 rounded-xl text-sm font-mono"
                />
                <span className="text-[10px] text-text-muted">Enter a Lucide icon identifier.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Link Type</label>
                <select
                  value={linkType}
                  onChange={(e) => {
                    setLinkType(e.target.value);
                    setLinkValue('');
                  }}
                  className="input-field py-2.5 px-4 rounded-xl text-sm bg-zinc-900 border-zinc-700 text-white"
                >
                  <option value="default">None (Default Slug Route)</option>
                  <option value="category">Product Category</option>
                  <option value="collection">Product Collection</option>
                  <option value="predefined">Predefined Page</option>
                  <option value="custom">Custom URL</option>
                </select>
              </div>

              {linkType === 'category' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold">Select Category</label>
                  <select
                    value={linkValue}
                    onChange={(e) => setLinkValue(e.target.value)}
                    className="input-field py-2.5 px-4 rounded-xl text-sm bg-zinc-900 border-zinc-700 text-white"
                  >
                    <option value="">-- Choose Category --</option>
                    {availableCategories.map((c) => (
                      <option key={c._id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {linkType === 'collection' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold">Select Collection (Layout)</label>
                  <select
                    value={linkValue}
                    onChange={(e) => setLinkValue(e.target.value)}
                    className="input-field py-2.5 px-4 rounded-xl text-sm bg-zinc-900 border-zinc-700 text-white"
                  >
                    <option value="">-- Choose Collection --</option>
                    {availableCollections.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title} ({c.layoutType})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {linkType === 'predefined' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold">Select Predefined Page</label>
                  <select
                    value={linkValue}
                    onChange={(e) => setLinkValue(e.target.value)}
                    className="input-field py-2.5 px-4 rounded-xl text-sm bg-zinc-900 border-zinc-700 text-white"
                  >
                    <option value="">-- Choose Predefined Page --</option>
                    {PREDEFINED_PAGES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {linkType === 'custom' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold">Custom Internal URL</label>
                  <input
                    type="text"
                    value={linkValue}
                    onChange={(e) => setLinkValue(e.target.value)}
                    placeholder="e.g. /products?search=shirt"
                    className="input-field py-2.5 px-4 rounded-xl text-sm font-mono"
                  />
                  <span className="text-[10px] text-text-muted">Must be relative and start with a "/".</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 mt-2">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActiveField"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="rounded border-glass-border bg-white/5 w-4 h-4 text-primary focus:ring-primary"
                />
                <label htmlFor="isActiveField" className="text-sm font-semibold cursor-pointer select-none">
                  Set status as Active
                </label>
              </div>

              {error && (
                <p className="text-xs text-error mt-1">{error}</p>
              )}

              <div className="flex gap-3 mt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-glass-border hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary px-5 py-2 text-sm font-semibold rounded-xl flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="animate-spin" size={14} />}
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
