import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Upload, FileSpreadsheet, Image as ImageIcon, List, CheckCircle, Clock, XCircle, Edit2, Trash2, X } from 'lucide-react';

const SellerProducts = () => {
  const [activeTab, setActiveTab] = useState('list');
  
  // My Products State
  const [myProducts, setMyProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Edit State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  useEffect(() => {
    if (activeTab === 'list') {
      fetchMyProducts();
    }
  }, [activeTab]);

  const fetchMyProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data } = await api.get('/seller/products');
      setMyProducts(data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoadingProducts(false);
    }
  };
  
  // Single Product State
  const [productData, setProductData] = useState({ title: '', description: '', price: '', category: '', stock: '', keywords: '' });
  const [images, setImages] = useState([]);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleMsg, setSingleMsg] = useState('');

  // Bulk Product State
  const [csvFile, setCsvFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('');

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchMyProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleEditInit = (product) => {
    setEditingProduct(product);
    setProductData({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      keywords: product.keywords ? product.keywords.join(', ') : ''
    });
    setImages([]); // Reset images, allowing them to upload new ones if desired
    setActiveTab('single'); // Switch to the form view
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setSingleLoading(true);
    setSingleMsg('');

    const formData = new FormData();
    Object.keys(productData).forEach(key => formData.append(key, productData[key]));
    for (let i = 0; i < images.length; i++) {
      formData.append('images', images[i]);
    }

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formData);
        setSingleMsg('Product updated successfully!');
        setEditingProduct(null);
      } else {
        await api.post('/products', formData);
        setSingleMsg('Product added successfully. Pending admin approval!');
      }
      setProductData({ title: '', description: '', price: '', category: '', stock: '', keywords: '' });
      setImages([]);
      fetchMyProducts(); // Refresh list just in case
    } catch (err) {
      setSingleMsg(err.response?.data?.message || (editingProduct ? 'Failed to update product' : 'Failed to add product'));
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setBulkLoading(true);
    setBulkMsg('');

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      await api.post('/products/bulk', formData);
      setBulkMsg('Bulk upload successful! Products pending approval.');
      setCsvFile(null);
    } catch (err) {
      setBulkMsg(err.response?.data?.message || 'Bulk upload failed');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Manage Products</h1>

      <div className="flex gap-4 mb-8 border-b border-glass-border pb-2">
        <button 
          className={`pb-2 px-4 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-white'}`}
          onClick={() => {
            setActiveTab('list');
            setEditingProduct(null);
            setSingleMsg('');
          }}
        >
          <List size={18} /> My Products
        </button>
        <button 
          className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'single' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-white'}`}
          onClick={() => {
            setActiveTab('single');
            setEditingProduct(null);
            setProductData({ title: '', description: '', price: '', category: '', stock: '', keywords: '' });
            setSingleMsg('');
          }}
        >
          {editingProduct ? 'Edit Product' : 'Add Single Product'}
        </button>
        <button 
          className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'bulk' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-white'}`}
          onClick={() => setActiveTab('bulk')}
        >
          Bulk Upload (CSV)
        </button>
      </div>

      <div className="glass-panel p-8 rounded-2xl">
        {activeTab === 'list' ? (
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><List size={20} /> Your Uploaded Products</h2>
            {loadingProducts ? (
              <div className="p-8 text-center text-text-muted">Loading products...</div>
            ) : myProducts.length === 0 ? (
              <div className="p-8 text-center text-text-muted">You haven't uploaded any products yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border">
                      <th className="p-4 text-text-muted font-medium">Image</th>
                      <th className="p-4 text-text-muted font-medium">Title</th>
                      <th className="p-4 text-text-muted font-medium">Price</th>
                      <th className="p-4 text-text-muted font-medium">Stock</th>
                      <th className="p-4 text-text-muted font-medium">Status</th>
                      <th className="p-4 text-text-muted font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myProducts.map((product) => (
                      <tr key={product._id} className="border-b border-glass-border/50 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                              <img src={`http://localhost:5000/${product.images[0].replace(/\\/g, '/')}`} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} className="text-text-muted" />
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-medium">{product.title}</td>
                        <td className="p-4">${product.price.toFixed(2)}</td>
                        <td className="p-4">{product.stock}</td>
                        <td className="p-4">
                          {product.approvalStatus === 'approved' && <span className="inline-flex items-center gap-1 text-xs font-bold bg-success/20 text-success px-2 py-1 rounded-full"><CheckCircle size={12}/> Approved</span>}
                          {product.approvalStatus === 'pending' && <span className="inline-flex items-center gap-1 text-xs font-bold bg-warning/20 text-warning px-2 py-1 rounded-full"><Clock size={12}/> Pending</span>}
                          {product.approvalStatus === 'rejected' && <span className="inline-flex items-center gap-1 text-xs font-bold bg-error/20 text-error px-2 py-1 rounded-full"><XCircle size={12}/> Rejected</span>}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEditInit(product)}
                              className="p-2 bg-surface hover:bg-primary/20 text-primary transition-colors rounded-lg"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product._id)}
                              className="p-2 bg-surface hover:bg-error/20 text-error transition-colors rounded-lg"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {editingProduct ? <Edit2 size={20} /> : <Plus size={20} />} 
                {editingProduct ? 'Edit Product Details' : 'New Product Details'}
              </h2>
              {editingProduct && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingProduct(null);
                    setActiveTab('list');
                  }}
                  className="text-text-muted hover:text-white"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Product Title</label>
                <input required type="text" className="input-field" value={productData.title} onChange={e => setProductData({...productData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input required type="text" className="input-field" value={productData.category} onChange={e => setProductData({...productData, category: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price ($)</label>
                <input required type="number" step="0.01" className="input-field" value={productData.price} onChange={e => setProductData({...productData, price: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                <input required type="number" className="input-field" value={productData.stock} onChange={e => setProductData({...productData, stock: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Keywords (comma separated)</label>
                <input type="text" className="input-field" placeholder="electronics, gadget, new" value={productData.keywords} onChange={e => setProductData({...productData, keywords: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea required className="input-field min-h-[100px]" value={productData.description} onChange={e => setProductData({...productData, description: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Product Images (Unlimited)</label>
                <div className="border-2 border-dashed border-glass-border rounded-xl p-6 text-center relative hover:bg-surface/50">
                  <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setImages(e.target.files)} />
                  <ImageIcon size={32} className="text-text-muted mx-auto mb-2" />
                  <p className="text-sm">Click or drag images here</p>
                </div>
                {images.length > 0 && <p className="text-sm text-text-muted mt-2">{images.length} images selected</p>}
              </div>
            </div>

            {singleMsg && <div className={`p-3 rounded-md text-sm ${singleMsg.includes('success') ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>{singleMsg}</div>}
            
            <button type="submit" className="btn btn-primary" disabled={singleLoading}>
              {singleLoading ? (editingProduct ? 'Updating...' : 'Adding...') : (editingProduct ? 'Update Product' : 'Add Product')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit} className="space-y-6 text-center max-w-md mx-auto py-8">
            <FileSpreadsheet size={64} className="text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold">Upload Products via CSV</h2>
            <p className="text-text-muted text-sm mb-6">Download our CSV template, fill in your product details, and upload it here to add multiple products at once.</p>
            
            <div className="border-2 border-dashed border-glass-border rounded-xl p-8 relative hover:bg-surface/50">
              <input type="file" accept=".csv" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setCsvFile(e.target.files[0])} />
              <Upload size={32} className="text-text-muted mx-auto mb-2" />
              <p className="font-medium">{csvFile ? csvFile.name : 'Select CSV File'}</p>
            </div>

            {bulkMsg && <div className={`p-3 rounded-md text-sm ${bulkMsg.includes('success') ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>{bulkMsg}</div>}

            <button type="submit" className="btn btn-primary w-full" disabled={!csvFile || bulkLoading}>
              {bulkLoading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SellerProducts;
