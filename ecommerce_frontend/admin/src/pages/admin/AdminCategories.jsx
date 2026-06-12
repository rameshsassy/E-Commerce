import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Tag, Plus, Edit, Trash2, Save, X, Percent } from 'lucide-react';
import ResponsiveTable from '../../components/common/ResponsiveTable';
import useFormAutosave from '../../hooks/useFormAutosave';
import FormAutosaveStatus from '../../components/common/FormAutosaveStatus';
import { getSubcategoriesForMain, getTypesForMainSub } from '../../constants/sellerCategoryTaxonomy';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', commissionRate: 5, isActive: true, isFeatured: false, parentCategory: '', subCategory: '', productType: '', customParentCategory: '', customSubCategory: '', customProductType: ''
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const categoryDraftKey = editingId
    ? `admin.categories.edit.${editingId}`
    : 'admin.categories.new';

  const { status: categoryAutosaveStatus, message: categoryAutosaveMessage, clearDraft: clearCategoryDraft } =
    useFormAutosave({
      formKey: categoryDraftKey,
      value: formData,
      enabled: showForm,
      restore: !editingId,
      onRestore: (data) => setFormData((prev) => ({ ...prev, ...data })),
    });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'parentCategory') {
        if (value !== 'other') {
          next.customParentCategory = '';
        }
        next.subCategory = '';
        next.customSubCategory = '';
        next.productType = '';
        next.customProductType = '';
      } else if (name === 'subCategory') {
        if (value !== 'other') {
          next.customSubCategory = '';
        }
        next.productType = '';
        next.customProductType = '';
      } else if (name === 'productType') {
        if (value !== 'other') {
          next.customProductType = '';
        }
      }
      return next;
    });
  };

  const resetFormState = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', commissionRate: 5, isActive: true, isFeatured: false, parentCategory: '', subCategory: '', productType: '', customParentCategory: '', customSubCategory: '', customProductType: '' });
    clearCategoryDraft();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/categories/${editingId}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      resetFormState();
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat) => {
    setFormData({
      name: cat.name,
      description: cat.description || '',
      commissionRate: cat.commissionRate,
      isActive: cat.isActive,
      isFeatured: cat.isFeatured,
      parentCategory: cat.parentCategory?._id || '',
      subCategory: cat.subCategory || '',
      productType: cat.productType || '',
      customParentCategory: '',
      customSubCategory: '',
      customProductType: '',
    });
    setEditingId(cat._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category? Products might be affected.")) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (_err) {
        alert("Failed to delete category");
      }
    }
  };

  const selectedParent = categories.find(c => c._id === formData.parentCategory);
  const parentName = formData.parentCategory === 'other' ? formData.customParentCategory : (selectedParent ? selectedParent.name : '');
  const subCategoryName = formData.subCategory === 'other' ? formData.customSubCategory : formData.subCategory;
 
  const subCategoryOptions = parentName ? getSubcategoriesForMain(parentName) : [];
  const productTypeOptions = (parentName && subCategoryName) ? getTypesForMainSub(parentName, subCategoryName) : [];

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Tag className="text-primary"/> Category Engine</h1>
          <p className="text-text-muted mt-2">Dynamically control marketplace categories, taxonomy, and commissions.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2 shadow-glow">
            <Plus size={20}/> New Category
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-panel p-6 rounded-2xl animate-fade-in border border-primary/30">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-6 border-b border-glass-border pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Category' : 'Create New Category'}</h2>
              <FormAutosaveStatus status={categoryAutosaveStatus} message={categoryAutosaveMessage} />
            </div>
            <button
              onClick={resetFormState}
              className="p-2 hover:bg-surface rounded-full transition-colors"
            >
              <X size={20}/>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-1 font-medium">Category Name *</label>
              <input type="text" name="name" required className="input-field w-full" value={formData.name} onChange={handleInputChange} placeholder="e.g. Electronics, Clothing" />
            </div>
            
            <div>
              <label className="block text-sm mb-1 font-medium flex items-center gap-2"><Percent size={14}/> Platform Commission (%) *</label>
              <input type="number" name="commissionRate" required min="0" max="100" className="input-field w-full text-primary font-bold" value={formData.commissionRate} onChange={handleInputChange} />
              <p className="text-xs text-text-muted mt-1">Percentage taken from seller sales in this category.</p>
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium">Main Category</label>
              <select name="parentCategory" className="input-field w-full bg-surface" value={formData.parentCategory} onChange={handleInputChange}>
                <option value="">None (Root Category)</option>
                <option value="other">Other (Please mention)</option>
                {categories.filter(c => c._id !== editingId).map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {formData.parentCategory === 'other' && (
              <div>
                <label className="block text-sm mb-1 font-medium">Please mention Main Category *</label>
                <input
                  type="text"
                  name="customParentCategory"
                  required
                  className="input-field w-full"
                  value={formData.customParentCategory || ''}
                  onChange={handleInputChange}
                  placeholder="Type your main category"
                />
              </div>
            )}

            <div>
              <label className="block text-sm mb-1 font-medium">Sub Category</label>
              <select 
                name="subCategory" 
                className="input-field w-full bg-surface disabled:opacity-50 disabled:cursor-not-allowed" 
                value={formData.subCategory} 
                onChange={handleInputChange}
                disabled={!formData.parentCategory}
              >
                <option value="">None (Select Sub Category)</option>
                <option value="other">Other (Please mention)</option>
                {subCategoryOptions.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {formData.subCategory === 'other' && (
              <div>
                <label className="block text-sm mb-1 font-medium">Please mention Sub Category *</label>
                <input
                  type="text"
                  name="customSubCategory"
                  required
                  className="input-field w-full"
                  value={formData.customSubCategory || ''}
                  onChange={handleInputChange}
                  placeholder="Type your sub category"
                />
              </div>
            )}

            <div>
              <label className="block text-sm mb-1 font-medium">Product Type</label>
              <select 
                name="productType" 
                className="input-field w-full bg-surface disabled:opacity-50 disabled:cursor-not-allowed" 
                value={formData.productType} 
                onChange={handleInputChange}
                disabled={!formData.subCategory}
              >
                <option value="">None (Select Product Type)</option>
                <option value="other">Other (Please mention)</option>
                {productTypeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {formData.productType === 'other' && (
              <div>
                <label className="block text-sm mb-1 font-medium">Please mention Product Type *</label>
                <input
                  type="text"
                  name="customProductType"
                  required
                  className="input-field w-full"
                  value={formData.customProductType || ''}
                  onChange={handleInputChange}
                  placeholder="Type your product type"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm mb-1 font-medium">Description</label>
              <textarea name="description" className="input-field w-full h-24 resize-none" value={formData.description} onChange={handleInputChange} placeholder="Short description for SEO and category pages..." />
            </div>

            <div className="flex flex-col gap-3 justify-center md:col-span-2 flex-row md:flex-row">
              <label className="flex-1 flex items-center gap-3 cursor-pointer p-4 border border-glass-border rounded-xl hover:bg-surface-hover transition-colors">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-5 h-5 accent-primary" />
                <div className="flex flex-col">
                  <span className="font-bold text-success">Active Status</span>
                  <span className="text-xs text-text-muted">Visible to customers in the catalog.</span>
                </div>
              </label>
              
              <label className="flex-1 flex items-center gap-3 cursor-pointer p-4 border border-glass-border rounded-xl hover:bg-surface-hover transition-colors">
                <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleInputChange} className="w-5 h-5 accent-warning" />
                <div className="flex flex-col">
                  <span className="font-bold text-warning">Featured Category</span>
                  <span className="text-xs text-text-muted">Pin this category to the Homepage banner.</span>
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
              <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                <Save size={18}/> {saving ? 'Saving...' : (editingId ? 'Update Category' : 'Save Category')}
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
              <th className="p-4 font-semibold text-text-muted uppercase text-xs tracking-wider">Category</th>
              <th className="p-4 font-semibold text-text-muted uppercase text-xs tracking-wider text-center">Commission</th>
              <th className="p-4 font-semibold text-text-muted uppercase text-xs tracking-wider text-center">Visibility</th>
              <th className="p-4 font-semibold text-text-muted uppercase text-xs tracking-wider text-center">Featured</th>
              <th className="p-4 font-semibold text-text-muted uppercase text-xs tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-text-muted">
                  <div className="flex flex-col items-center gap-4">
                    <Tag size={48} className="opacity-20"/>
                    <p>No categories found. Start building your catalog structure.</p>
                  </div>
                </td>
              </tr>
            ) : (
              categories.map(cat => (
                <tr key={cat._id} className="border-b border-glass-border hover:bg-surface-hover/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{cat.name}</span>
                        {cat.parentCategory && (
                          <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                            Sub of {cat.parentCategory.name}
                            {cat.subCategory && ` > ${cat.subCategory}`}
                            {cat.productType && ` > ${cat.productType}`}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted">/{cat.slug}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="badge bg-primary/10 text-primary font-bold text-sm border border-primary/20">{cat.commissionRate}%</span>
                  </td>
                  <td className="p-4 text-center">
                    {cat.isActive 
                      ? <span className="badge bg-success/20 text-success border border-success/20">Active</span> 
                      : <span className="badge bg-error/20 text-error border border-error/20">Hidden</span>}
                  </td>
                  <td className="p-4 text-center">
                    {cat.isFeatured ? <span className="text-warning text-2xl drop-shadow-md">★</span> : <span className="text-glass-border text-2xl group-hover:text-warning/30 transition-colors">☆</span>}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleEdit(cat)} className="p-2 bg-surface hover:bg-primary hover:text-white rounded-lg transition-colors border border-glass-border shadow-sm">
                      <Edit size={16}/>
                    </button>
                    <button onClick={() => handleDelete(cat._id)} className="p-2 bg-surface hover:bg-error hover:text-white rounded-lg transition-colors border border-glass-border shadow-sm">
                      <Trash2 size={16}/>
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

export default AdminCategories;
