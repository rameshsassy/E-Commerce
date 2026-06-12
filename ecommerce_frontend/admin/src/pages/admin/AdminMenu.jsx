import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Menu, Plus, Edit, Trash2, Save, X, ArrowUpDown, Link2 } from 'lucide-react';
import ResponsiveTable from '../../components/common/ResponsiveTable';

const AdminMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    link: '',
    order: 0,
    isActive: true,
  });

  // Selected Category ID for autocompletion
  const [selectedCatId, setSelectedCatId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, catRes] = await Promise.all([
        api.get('/menu/all'),
        api.get('/categories'),
      ]);
      setMenuItems(menuRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCategorySelectChange = (e) => {
    const catId = e.target.value;
    setSelectedCatId(catId);
    if (!catId) return;

    const selectedCat = categories.find((c) => c._id === catId);
    if (selectedCat) {
      setFormData((prev) => ({
        ...prev,
        name: selectedCat.name,
        link: `/products?category=${encodeURIComponent(selectedCat.name)}`,
      }));
    }
  };

  const resetFormState = () => {
    setShowForm(false);
    setEditingId(null);
    setSelectedCatId('');
    setFormData({
      name: '',
      link: '',
      order: menuItems.length ? Math.max(...menuItems.map(m => m.order || 0)) + 10 : 10,
      isActive: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/menu/${editingId}`, formData);
      } else {
        await api.post('/menu', formData);
      }
      resetFormState();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving menu item');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      link: item.link,
      order: item.order,
      isActive: item.isActive,
    });
    setEditingId(item._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await api.delete(`/menu/${id}`);
        fetchData();
      } catch (err) {
        alert('Failed to delete menu item');
      }
    }
  };

  const startNewItem = () => {
    setSelectedCatId('');
    // Suggest order number: last order + 10
    const nextOrder = menuItems.length
      ? Math.max(...menuItems.map((m) => m.order || 0)) + 10
      : 10;
    setFormData({
      name: '',
      link: '',
      order: nextOrder,
      isActive: true,
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Menu className="text-primary" /> Menu Manager
          </h1>
          <p className="text-text-muted mt-2">
            Configure dynamic header links, categories layout, and navigation hierarchy.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={startNewItem}
            className="btn btn-primary flex items-center gap-2 shadow-glow"
          >
            <Plus size={20} /> New Menu Item
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-panel p-6 rounded-2xl animate-fade-in border border-primary/30">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-6 border-b border-glass-border pb-4">
            <h2 className="text-xl font-bold">
              {editingId ? 'Edit Menu Item' : 'Create New Menu Item'}
            </h2>
            <button
              onClick={resetFormState}
              className="p-2 hover:bg-surface rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!editingId && (
              <div className="md:col-span-2">
                <label className="block text-sm mb-1 font-medium text-text-muted">
                  Quick Fill from Marketplace Category
                </label>
                <select
                  value={selectedCatId}
                  onChange={handleCategorySelectChange}
                  className="input-field w-full bg-surface"
                >
                  <option value="">-- Choose Category (optional) --</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name} {cat.parentCategory ? `(Sub of ${cat.parentCategory.name})` : '(Root)'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-text-muted mt-1">
                  Selecting a category automatically completes the display name and search URL.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm mb-1 font-medium">Display Name *</label>
              <input
                type="text"
                name="name"
                required
                className="input-field w-full"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Bags, Home & Living"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium flex items-center gap-2">
                <Link2 size={14} /> Link / Target URL *
              </label>
              <input
                type="text"
                name="link"
                required
                className="input-field w-full font-mono text-xs"
                value={formData.link}
                onChange={handleInputChange}
                placeholder="e.g. /products?category=Bags, or /pages/deals"
              />
              <p className="text-xs text-text-muted mt-1">
                Internal paths should start with <code>/</code> (e.g. <code>/products?category=Bags</code>).
              </p>
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium flex items-center gap-2">
                <ArrowUpDown size={14} /> Display Order
              </label>
              <input
                type="number"
                name="order"
                required
                className="input-field w-full"
                value={formData.order}
                onChange={handleInputChange}
              />
              <p className="text-xs text-text-muted mt-1">
                Lower numbers display first (left to right in the header).
              </p>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-glass-border rounded-xl hover:bg-surface-hover transition-colors w-full">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-5 h-5 accent-primary"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-success">Active Status</span>
                  <span className="text-xs text-text-muted">
                    Visible to customers in the navbar menu bar.
                  </span>
                </div>
              </label>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-glass-border">
              <button
                type="button"
                onClick={resetFormState}
                className="btn bg-surface hover:bg-surface-hover border border-glass-border text-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-60"
              >
                <Save size={18} /> {saving ? 'Saving...' : editingId ? 'Update Item' : 'Save Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden shadow-lg">
        <ResponsiveTable minWidth="800px">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-glass-border bg-surface/50">
                <th className="p-4 font-semibold text-text-muted uppercase text-xs tracking-wider">
                  Menu Name
                </th>
                <th className="p-4 font-semibold text-text-muted uppercase text-xs tracking-wider">
                  Link Path
                </th>
                <th className="p-4 font-semibold text-text-muted uppercase text-xs tracking-wider text-center">
                  Sort Order
                </th>
                <th className="p-4 font-semibold text-text-muted uppercase text-xs tracking-wider text-center">
                  Status
                </th>
                <th className="p-4 font-semibold text-text-muted uppercase text-xs tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {menuItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-text-muted">
                    <div className="flex flex-col items-center gap-4">
                      <Menu size={48} className="opacity-20" />
                      <p>No custom menu items found. The default navbar values will be shown.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                menuItems.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-glass-border hover:bg-surface-hover/50 transition-colors group"
                  >
                    <td className="p-4">
                      <span className="font-bold text-lg">{item.name}</span>
                    </td>
                    <td className="p-4">
                      <code className="text-xs font-mono bg-surface/40 px-2 py-1 rounded">
                        {item.link}
                      </code>
                    </td>
                    <td className="p-4 text-center font-bold text-primary">
                      {item.order}
                    </td>
                    <td className="p-4 text-center">
                      {item.isActive ? (
                        <span className="badge bg-success/20 text-success border border-success/20">
                          Active
                        </span>
                      ) : (
                        <span className="badge bg-error/20 text-error border border-error/20">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 bg-surface hover:bg-primary hover:text-white rounded-lg transition-colors border border-glass-border shadow-sm"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 bg-surface hover:bg-error hover:text-white rounded-lg transition-colors border border-glass-border shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ResponsiveTable>
      </div>
    </div>
  );
};

export default AdminMenu;
