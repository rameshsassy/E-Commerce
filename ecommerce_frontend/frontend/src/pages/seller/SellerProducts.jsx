import React, { useState, useEffect, useRef } from 'react';
import api, { BASE_URL } from '../../utils/api';
import { Plus, Upload, FileSpreadsheet, Image as ImageIcon, List, CheckCircle, Clock, XCircle, Edit2, Trash2, X, Store } from 'lucide-react';
import StoreFormFields, { isStoreFormValid } from '../../components/seller/StoreFormFields';
import DeliveryByFields from '../../components/seller/DeliveryByFields';

const RichTextEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleCommand = (command, arg = null) => {
    document.execCommand(command, false, arg);
    editorRef.current.focus();
    onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="flex gap-2 p-2 border-b border-[#E1E3E5] bg-[#F6F6F7] items-center">
        <button type="button" onClick={() => handleCommand('bold')} className="w-8 h-8 flex items-center justify-center hover:bg-[#E1E3E5] rounded font-bold text-[#202223]" title="Bold">B</button>
        <button type="button" onClick={() => handleCommand('italic')} className="w-8 h-8 flex items-center justify-center hover:bg-[#E1E3E5] rounded italic text-[#202223]" title="Italic">I</button>
        <button type="button" onClick={() => handleCommand('underline')} className="w-8 h-8 flex items-center justify-center hover:bg-[#E1E3E5] rounded underline text-[#202223]" title="Underline">U</button>
        
        <select onChange={(e) => { if(e.target.value) handleCommand(e.target.value); e.target.value=''; }} className="bg-white border border-[#C9CCCF] rounded text-[13px] p-1.5 ml-2 text-[#202223] outline-none">
          <option value="">Alignment</option>
          <option value="justifyLeft">Align Left</option>
          <option value="justifyCenter">Align Center</option>
          <option value="justifyRight">Align Right</option>
        </select>
      </div>
      <div 
        ref={editorRef}
        className="p-3 min-h-[150px] outline-none text-[#202223] text-[14px] bg-white flex-1"
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
      />
    </div>
  );
};

const defaultProductData = {
  title: '', description: '', price: '', compareAtPrice: '', unitPrice: '', chargeTax: false, category: '', stock: 0,
  locations: [{ address: 'Main Shop Location', stock: 0 }], keywords: '',
  inventoryTracked: true, sku: '', purchaseType: 'one_time', shipFromStoreAddresses: [],
  barcode: '', continueSellingWhenOutOfStock: false,
  isPhysicalProduct: true, packageType: 'Store default - Sample box - 22 x 13.7 x 4.2 cm, 0 kg',
  packageLength: '', packageWidth: '', packageHeight: '', packageDimensionsUnit: 'cm',
  productWeight: 0, productWeightUnit: 'g',
  deliveryBy: '', deliveryInput: '', deliveryValues: [],
  pageTitle: '', metaDescription: '', urlHandle: '',
};

const SellerProducts = () => {
  const [activeTab, setActiveTab] = useState('list');
  
  // My Products State
  const [myProducts, setMyProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Edit State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  const [productData, setProductData] = useState(defaultProductData);
  const [images, setImages] = useState([]);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleMsg, setSingleMsg] = useState('');
  const [inventoryOptions, setInventoryOptions] = useState(null);

  const fetchMyProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data } = await api.get('/seller/products');
      setMyProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchMyProducts();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'single') {
      api.get('/seller/products/inventory-options')
        .then(({ data }) => setInventoryOptions(data))
        .catch((err) => console.error('Inventory options:', err));
    }
  }, [activeTab]);

  const toggleShipFromStoreAddress = (addr) => {
    const current = productData.shipFromStoreAddresses || [];
    const max = inventoryOptions?.maxStoreAddresses ?? 1;
    if (current.includes(addr)) {
      setProductData({
        ...productData,
        shipFromStoreAddresses: current.filter((a) => a !== addr),
      });
    } else if (max <= 1) {
      setProductData({ ...productData, shipFromStoreAddresses: [addr] });
    } else {
      setProductData({
        ...productData,
        shipFromStoreAddresses: [...current, addr],
      });
    }
  };

  // Bulk Product State
  const [csvFile, setCsvFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('');

  // My Store
  const [myStore, setMyStore] = useState(null);
  const [hasStore, setHasStore] = useState(false);
  const [platformHost, setPlatformHost] = useState('aashansh.org');
  const [storeView, setStoreView] = useState('hub'); // hub | create | edit
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeMsg, setStoreMsg] = useState('');
  const defaultStoreForm = {
    storeName: '',
    keywordsInput: '',
    detailedAddress: '',
    additionalAddresses: [''],
    domainType: 'platform_subdomain',
    customDomain: '',
    subdomain: '',
    isActive: true,
  };
  const [storeForm, setStoreForm] = useState(defaultStoreForm);
  const [storeLogoFile, setStoreLogoFile] = useState(null);
  const [storeLogoPreview, setStoreLogoPreview] = useState(null);

  const fetchMyStore = async () => {
    try {
      const { data } = await api.get('/seller/store');
      setMyStore(data.store);
      setHasStore(data.hasStore);
      if (data.platformHost) setPlatformHost(data.platformHost);
      if (data.store) {
        setStoreForm({
          storeName: data.store.storeName || '',
          keywordsInput: (data.store.keywords || []).join(', '),
          detailedAddress: data.store.detailedAddress || '',
          additionalAddresses:
            data.store.additionalAddresses?.length > 0
              ? data.store.additionalAddresses
              : [''],
          domainType: data.store.domainType || 'platform_subdomain',
          customDomain: data.store.customDomain || '',
          subdomain: data.store.subdomain || '',
          isActive: data.store.isActive !== false,
        });
        setStoreLogoPreview(null);
        setStoreLogoFile(null);
      }
    } catch (err) {
      console.error('Fetch store:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'store') {
      setStoreView('hub');
      fetchMyStore();
    }
  }, [activeTab]);

  const openCreateStore = () => {
    setStoreForm({ ...defaultStoreForm });
    setStoreLogoFile(null);
    setStoreLogoPreview(null);
    setStoreMsg('');
    setStoreView('create');
  };

  const openEditStore = () => {
    if (!hasStore) {
      setStoreMsg('Create your store first.');
      return;
    }
    setStoreMsg('');
    setStoreView('edit');
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    if (!isStoreFormValid(storeForm)) {
      setStoreMsg('Please fix validation errors before saving.');
      return;
    }
    setStoreLoading(true);
    setStoreMsg('');

    const formData = new FormData();
    formData.append('storeName', storeForm.storeName);
    formData.append('keywords', storeForm.keywordsInput);
    formData.append('detailedAddress', storeForm.detailedAddress);
    const extra = (storeForm.additionalAddresses || []).filter((a) => a.trim());
    formData.append('additionalAddresses', JSON.stringify(extra));
    formData.append('domainType', storeForm.domainType);
    if (storeForm.domainType === 'own_domain') {
      formData.append('customDomain', storeForm.customDomain);
    }
    formData.append('isActive', storeForm.isActive);
    if (storeLogoFile) {
      formData.append('logo', storeLogoFile);
    }

    try {
      if (storeView === 'create') {
        const { data } = await api.post('/seller/store', formData);
        setStoreMsg(data.message || 'Store created!');
        setMyStore(data.store);
        setHasStore(true);
        setStoreView('hub');
      } else {
        const { data } = await api.put('/seller/store', formData);
        setStoreMsg(data.message || 'Store updated!');
        setMyStore(data.store);
        setStoreView('hub');
      }
      setStoreLogoFile(null);
      setStoreLogoPreview(null);
      await fetchMyStore();
    } catch (err) {
      setStoreMsg(err.response?.data?.message || 'Failed to save store');
    } finally {
      setStoreLoading(false);
    }
  };

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
      compareAtPrice: product.compareAtPrice || '',
      unitPrice: product.unitPrice || '',
      chargeTax: product.chargeTax || false,
      category: product.category,
      stock: product.stock,
      locations: product.locations && product.locations.length > 0 ? product.locations : [{ address: 'Main Shop Location', stock: product.stock || 0 }],
      inventoryTracked: product.inventoryTracked !== undefined ? product.inventoryTracked : true,
      sku: product.sku || '',
      purchaseType: product.purchaseType || 'one_time',
      shipFromStoreAddresses: product.shipFromStoreAddresses || [],
      barcode: product.barcode || '',
      continueSellingWhenOutOfStock: product.continueSellingWhenOutOfStock || false,
      isPhysicalProduct: product.isPhysicalProduct !== undefined ? product.isPhysicalProduct : true,
      packageType: product.packageType || 'Store default - Sample box - 22 x 13.7 x 4.2 cm, 0 kg',
      packageLength: product.packageLength || '',
      packageWidth: product.packageWidth || '',
      packageHeight: product.packageHeight || '',
      packageDimensionsUnit: product.packageDimensionsUnit || 'cm',
      productWeight: product.productWeight || 0,
      productWeightUnit: product.productWeightUnit || 'g',
      deliveryBy: product.deliveryBy || '',
      deliveryInput: '',
      deliveryValues: product.deliveryValues || [],
      pageTitle: product.pageTitle || '',
      metaDescription: product.metaDescription || '',
      urlHandle: product.urlHandle || '',
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
    Object.keys(productData).forEach(key => {
      if (key === 'locations' || key === 'shipFromStoreAddresses' || key === 'deliveryValues') {
        formData.append(key, JSON.stringify(productData[key]));
      } else if (key === 'deliveryInput') {
        /* UI-only; values sent via deliveryValues */
      } else {
        formData.append(key, productData[key]);
      }
    });
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
      setProductData({ ...defaultProductData });
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

      <div className="flex flex-wrap gap-4 mb-8 border-b border-glass-border pb-2">
        <button
          className={`pb-2 px-4 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'store' ? 'border-primary text-primary' : 'border-transparent text-[#94a3b8] hover:text-white'}`}
          onClick={() => {
            setActiveTab('store');
            setStoreView('hub');
            setStoreMsg('');
          }}
        >
          <Store size={18} /> My Store
        </button>
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
            setProductData({ ...defaultProductData });
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
        {activeTab === 'store' ? (
          <div className="text-[#202223]">
            {storeView === 'hub' ? (
              <div className="bg-white rounded-lg border border-[#E1E3E5] p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-[#202223]">
                  <Store size={20} /> My Store
                </h2>
                {myStore?.storeUrl && (
                  <div className="mb-6 p-4 rounded-xl border border-[#E1E3E5] bg-[#F6F6F7]">
                    <p className="text-sm text-[#6D7175] mb-1">Your store is live at</p>
                    <a
                      href={myStore.storeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#005bd3] font-medium break-all hover:underline"
                    >
                      {myStore.storeUrl}
                    </a>
                  </div>
                )}
                {storeMsg && (
                  <p className={`mb-4 text-sm ${storeMsg.includes('success') || storeMsg.includes('created') || storeMsg.includes('updated') ? 'text-[#008060]' : 'text-[#B98900]'}`}>
                    {storeMsg}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                  <button
                    type="button"
                    onClick={openCreateStore}
                    disabled={hasStore}
                    className="min-h-[120px] rounded-2xl font-bold text-lg text-[#202223] transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
                    style={{ backgroundColor: '#FFD700' }}
                  >
                    Create Store
                  </button>
                  <button
                    type="button"
                    onClick={openEditStore}
                    disabled={!hasStore}
                    className="min-h-[120px] rounded-2xl font-bold text-lg text-[#202223] transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
                    style={{ backgroundColor: '#FFD700' }}
                  >
                    Edit Store
                  </button>
                </div>
                {hasStore && (
                  <p className="mt-6 text-sm text-[#6D7175]">
                    You already have a store. Use <strong className="text-[#202223]">Edit Store</strong> to change your domain or details.
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleStoreSubmit} className="max-w-xl text-[#202223]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#202223]">
                    {storeView === 'create' ? 'Create Store' : 'Edit Store'}
                  </h2>
                  <button
                    type="button"
                    className="text-[#6D7175] hover:text-[#202223] text-sm"
                    onClick={() => {
                      setStoreView('hub');
                      setStoreMsg('');
                      setStoreLogoFile(null);
                      setStoreLogoPreview(null);
                    }}
                  >
                    ← Back
                  </button>
                </div>

                <div className="bg-white rounded-lg border border-[#E1E3E5] p-6 shadow-sm text-[#202223]">
                  <StoreFormFields
                    storeForm={storeForm}
                    setStoreForm={setStoreForm}
                    platformHost={platformHost}
                    storeView={storeView}
                    logoPreview={storeLogoPreview}
                    setLogoPreview={setStoreLogoPreview}
                    setLogoFile={setStoreLogoFile}
                    existingLogoPath={myStore?.logo}
                  />
                </div>

                {storeMsg && (
                  <p className={`mt-4 text-sm ${storeMsg.includes('success') || storeMsg.includes('created') || storeMsg.includes('updated') ? 'text-[#008060]' : 'text-[#D82C0D]'}`}>
                    {storeMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={storeLoading || !isStoreFormValid(storeForm)}
                  className="mt-6 w-full sm:w-auto disabled:opacity-50 bg-[#008060] hover:bg-[#006e52] text-white font-medium py-2 px-6 rounded-md text-[14px]"
                >
                  {storeLoading ? 'Saving...' : storeView === 'create' ? 'Create Store' : 'Save Changes'}
                </button>
              </form>
            )}
          </div>
        ) : activeTab === 'list' ? (
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
                              <img src={`${BASE_URL}/${product.images[0].replace(/\\/g, '/')}`} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} className="text-text-muted" />
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-medium">{product.title}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            {product.compareAtPrice && product.compareAtPrice > product.price && (
                              <span className="text-[10px] text-text-muted line-through">Rs. {product.compareAtPrice.toFixed(2)}</span>
                            )}
                            <span>Rs. {product.price.toFixed(2)}</span>
                          </div>
                        </td>
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              {editingProduct && (
                <button type="button" onClick={() => { setEditingProduct(null); setActiveTab('list'); }} className="text-text-muted hover:text-white">
                  <X size={24} />
                </button>
              )}
            </div>
            
            <div className="space-y-6">
                
                {/* 1. BASIC INFO */}
                <div className="bg-white border border-[#E1E3E5] rounded-lg shadow-sm overflow-hidden">
                  <div className="p-5">
                    <label className="block text-[13px] text-[#202223] mb-1">Title</label>
                    <input required type="text" className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] transition-shadow" placeholder="Short sleeve t-shirt" value={productData.title} onChange={e => {
                      const val = e.target.value;
                      const autoHandle = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                      setProductData({
                        ...productData, title: val,
                        pageTitle: productData.pageTitle === '' || productData.pageTitle === productData.title.substring(0,70) ? val.substring(0,70) : productData.pageTitle,
                        urlHandle: productData.urlHandle === '' || productData.urlHandle === productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') ? autoHandle : productData.urlHandle
                      });
                    }} />
                  </div>
                  <div className="p-5 border-t border-[#E1E3E5]">
                    <label className="block text-[13px] text-[#202223] mb-1">Description</label>
                    <div className="border border-[#8C9196] rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-[#005bd3] focus-within:border-[#005bd3] transition-shadow">
                      <RichTextEditor value={productData.description} onChange={val => {
                        let temp = document.createElement("div"); temp.innerHTML = val;
                        const plainDesc = (temp.textContent || temp.innerText || "").substring(0, 160);
                        setProductData(prev => ({
                          ...prev, description: val,
                          metaDescription: prev.metaDescription === '' || prev.metaDescription === (() => { let t = document.createElement("div"); t.innerHTML = prev.description; return (t.textContent || t.innerText || "").substring(0, 160); })() ? plainDesc : prev.metaDescription
                        }));
                      }} />
                    </div>
                  </div>
                </div>

                {/* 2. MEDIA */}
                <div className="bg-white border border-[#E1E3E5] rounded-lg shadow-sm overflow-hidden">
                  <div className="p-5 flex justify-between items-center">
                    <h3 className="font-semibold text-[15px] text-[#202223]">Media</h3>
                  </div>
                  <div className="p-5 border-t border-[#E1E3E5]">
                    <div className="border border-dashed border-[#8C9196] bg-[#F6F6F7] rounded-lg p-8 text-center relative hover:bg-[#F1F2F4] transition-colors cursor-pointer">
                      <input type="file" multiple accept="image/jpeg, image/png, image/jpg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => {
                        if (e.target.files.length > 5) { alert('You can only upload up to 5 images.'); e.target.value = ''; setImages([]); } else { setImages(e.target.files); }
                      }} />
                      <ImageIcon size={32} className="text-[#6D7175] mx-auto mb-3" />
                      <p className="text-[14px] font-medium text-[#202223]">Add files or drop files to upload</p>
                    </div>
                    {images.length > 0 && <p className="text-[13px] text-[#005bd3] mt-3 font-medium bg-[#EBF5FA] px-3 py-1.5 rounded-md inline-block">{images.length} images selected</p>}
                  </div>
                </div>

                {/* 3. PRICING */}
                <div className="bg-white border border-[#E1E3E5] rounded-lg shadow-sm overflow-hidden">
                  <div className="p-5">
                    <label className="block text-[13px] text-[#202223] mb-1">Price</label>
                    <div className="relative flex items-center max-w-[250px]">
                      <span className="absolute left-3 text-[#6D7175]">₹</span>
                      <input required type="number" step="0.01" className="w-full border border-[#8C9196] rounded-md pl-8 pr-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] transition-shadow" placeholder="0.00" value={productData.price} onChange={e => setProductData({...productData, price: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="p-5 border-t border-[#E1E3E5]">
                    <div className="flex justify-between items-center mb-4 cursor-pointer text-[#202223]">
                      <h3 className="font-semibold text-[14px]">Additional display prices</h3>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[13px] text-[#202223] mb-1">Compare-at price</label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-[#6D7175]">₹</span>
                          <input type="number" step="0.01" className="w-full border border-[#8C9196] rounded-md pl-8 pr-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] transition-shadow" placeholder="0.00" value={productData.compareAtPrice} onChange={e => setProductData({...productData, compareAtPrice: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13px] text-[#202223] mb-1">Unit price</label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-[#6D7175]">₹</span>
                          <input type="number" step="0.01" className="w-full border border-[#8C9196] rounded-md pl-8 pr-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] transition-shadow" placeholder="0.00" value={productData.unitPrice} onChange={e => setProductData({...productData, unitPrice: e.target.value})} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <input type="checkbox" id="chargeTax" className="w-4 h-4 rounded border-[#8C9196] text-[#005bd3] focus:ring-[#005bd3]" checked={productData.chargeTax} onChange={e => setProductData({...productData, chargeTax: e.target.checked})} />
                      <label htmlFor="chargeTax" className="text-[14px] text-[#202223]">Charge tax on this product</label>
                    </div>
                  </div>

                  <div className="p-4 border-t border-[#E1E3E5] bg-[#F6F6F7] flex gap-4">
                    <div className="flex items-center gap-2 bg-white border border-[#E1E3E5] px-3 py-1.5 rounded-md text-[13px] text-[#202223]">
                      <span className="font-medium">Cost</span>
                      <span className="text-[#6D7175] bg-[#F6F6F7] px-2 rounded">--</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-[#E1E3E5] px-3 py-1.5 rounded-md text-[13px] text-[#202223]">
                      <span className="font-medium">Profit</span>
                      <span className="text-[#6D7175] bg-[#F6F6F7] px-2 rounded">--</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-[#E1E3E5] px-3 py-1.5 rounded-md text-[13px] text-[#202223]">
                      <span className="font-medium">Margin</span>
                      <span className="text-[#6D7175] bg-[#F6F6F7] px-2 rounded">--</span>
                    </div>
                  </div>
                </div>

                {/* 4. INVENTORY */}
                <div className="bg-white border border-[#E1E3E5] rounded-lg shadow-sm overflow-hidden">
                  <div className="flex justify-between items-center p-5">
                    <h3 className="font-semibold text-[15px] text-[#202223]">Inventory</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-[#202223]">Track quantity</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={productData.inventoryTracked} onChange={e => setProductData({...productData, inventoryTracked: e.target.checked})} />
                        <div className="w-10 h-5 bg-[#8C9196] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#008060]"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="p-5 border-t border-[#E1E3E5]">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-[14px] text-[#202223]">Locations & Quantity</h4>
                      <button type="button" onClick={() => {
                        const newLocations = [...productData.locations, { address: '', stock: 0 }];
                        setProductData({...productData, locations: newLocations});
                      }} className="text-[#005bd3] text-[13px] hover:underline font-medium">+ Add location</button>
                    </div>
                    {productData.locations.map((loc, index) => (
                      <div key={index} className="flex gap-3 items-center mb-3 bg-white border border-[#E1E3E5] rounded-md p-3">
                        <div className="flex-1">
                          <label className="block text-[12px] text-[#6D7175] mb-1">Shop Address / Location</label>
                          <input type="text" className="w-full border border-[#8C9196] rounded-md px-3 py-1.5 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]" placeholder="e.g. Warehouse 1, Store 2" value={loc.address} onChange={e => {
                            const newLocations = [...productData.locations];
                            newLocations[index].address = e.target.value;
                            setProductData({...productData, locations: newLocations});
                          }} />
                        </div>
                        <div className="w-24">
                          <label className="block text-[12px] text-[#6D7175] mb-1">Quantity</label>
                          <input type="number" min="0" className="w-full border border-[#8C9196] rounded-md px-3 py-1.5 text-center text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]" value={loc.stock} onChange={e => {
                            const newLocations = [...productData.locations];
                            newLocations[index].stock = e.target.value;
                            const totalStock = newLocations.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
                            setProductData({...productData, locations: newLocations, stock: totalStock});
                          }} />
                        </div>
                        {productData.locations.length > 1 && (
                          <div className="flex items-end mt-4">
                            <button type="button" onClick={() => {
                              const newLocations = productData.locations.filter((_, i) => i !== index);
                              const totalStock = newLocations.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
                              setProductData({...productData, locations: newLocations, stock: totalStock});
                            }} className="text-[#D82C0D] hover:text-[#A32009]"><Trash2 size={16} /></button>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-end mt-2">
                      <span className="text-[13px] font-medium text-[#202223]">Total Stock: {productData.stock || 0}</span>
                    </div>
                  </div>

                  <div className="p-5 border-t border-[#E1E3E5]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] text-[#202223] mb-1">SKU (Stock Keeping Unit)</label>
                        <input type="text" className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]" value={productData.sku} onChange={e => setProductData({...productData, sku: e.target.value})} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[13px] text-[#202223] mb-1">Purchase Type</label>
                        <select
                          className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] bg-white"
                          value={productData.purchaseType || 'one_time'}
                          onChange={e => setProductData({ ...productData, purchaseType: e.target.value })}
                          disabled={editingProduct?.approvalStatus === 'approved'}
                        >
                          {(inventoryOptions?.purchaseTypeOptions || [
                            { value: 'one_time', label: 'One-time purchase', available: true },
                            { value: 'subscription', label: 'Subscription', available: false },
                            { value: 'custom_order', label: 'Custom Order', available: false },
                          ]).map((opt) => (
                            <option key={opt.value} value={opt.value} disabled={opt.available === false}>
                              {opt.label}{opt.available === false ? ' (Subscribers only)' : ''}
                            </option>
                          ))}
                        </select>
                        <ul className="mt-2 space-y-1 text-[12px] text-[#6D7175]">
                          {(inventoryOptions?.purchaseTypeOptions || []).map((opt) => (
                            <li key={opt.value} className={opt.note ? 'text-[#D82C0D]' : ''}>
                              • {opt.label}{opt.note ? ` (${opt.note})` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[13px] text-[#202223] mb-1">Store Address</label>
                        <p className="text-[12px] text-[#6D7175] mb-2">
                          {inventoryOptions?.storeAddressHint || 'Select store address(es) to ship this product from.'}
                        </p>
                        {inventoryOptions?.storeAddresses?.length > 0 ? (
                          <div className="border border-[#E1E3E5] rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-[#FAFBFB]">
                            {inventoryOptions.storeAddresses.map((addr) => (
                              <label key={addr} className="flex items-start gap-2 text-[14px] text-[#202223] cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="mt-0.5 w-4 h-4 rounded border-[#8C9196] text-[#005bd3] focus:ring-[#005bd3]"
                                  checked={(productData.shipFromStoreAddresses || []).includes(addr)}
                                  onChange={() => toggleShipFromStoreAddress(addr)}
                                  disabled={editingProduct?.approvalStatus === 'approved'}
                                />
                                <span>{addr}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[13px] text-[#B98900] bg-[#FFF5E6] border border-[#FFEA8A] rounded-md px-3 py-2">
                            No store addresses on your profile. Add them in KYC (Organization details) first.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-[13px] text-[#202223] mb-1">Barcode (ISBN, UPC, GTIN)</label>
                        <input type="text" className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]" value={productData.barcode} onChange={e => setProductData({...productData, barcode: e.target.value})} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <input type="checkbox" id="continueSelling" className="w-4 h-4 rounded border-[#8C9196] text-[#005bd3] focus:ring-[#005bd3]" checked={productData.continueSellingWhenOutOfStock} onChange={e => setProductData({...productData, continueSellingWhenOutOfStock: e.target.checked})} />
                      <label htmlFor="continueSelling" className="text-[14px] text-[#202223]">Continue selling when out of stock</label>
                    </div>
                  </div>
                </div>

                {/* 5. SHIPPING */}
                <div className="bg-white border border-[#E1E3E5] rounded-lg shadow-sm overflow-hidden">
                  <div className="p-5">
                    <h3 className="font-semibold text-[15px] text-[#202223] mb-4">Shipping</h3>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="isPhysical" className="w-4 h-4 rounded border-[#8C9196] text-[#005bd3] focus:ring-[#005bd3]" checked={productData.isPhysicalProduct} onChange={e => setProductData({...productData, isPhysicalProduct: e.target.checked})} />
                      <label htmlFor="isPhysical" className="text-[14px] font-medium text-[#202223]">This is a physical product</label>
                    </div>
                  </div>
                  
                  {productData.isPhysicalProduct && (
                    <div className="p-5 border-t border-[#E1E3E5]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[13px] text-[#202223] mb-1">Package weight along with product</label>
                          <div className="flex gap-2">
                            <input type="number" step="0.1" min="0" className="flex-1 border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]" value={productData.productWeight} onChange={e => setProductData({...productData, productWeight: e.target.value})} />
                            <select className="w-20 border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] bg-white" value={productData.productWeightUnit} onChange={e => setProductData({...productData, productWeightUnit: e.target.value})}>
                              <option value="g">g</option>
                              <option value="kg">kg</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[13px] text-[#202223] mb-1">Package dimensions</label>
                          {productData.packageType === 'custom' ? (
                            <div className="grid grid-cols-3 gap-2">
                              <input type="number" step="0.1" min="0" className="border border-[#8C9196] rounded-md px-2 py-2 text-[14px] text-[#202223]" placeholder="Length" value={productData.packageLength} onChange={e => setProductData({...productData, packageLength: e.target.value})} />
                              <input type="number" step="0.1" min="0" className="border border-[#8C9196] rounded-md px-2 py-2 text-[14px] text-[#202223]" placeholder="Width" value={productData.packageWidth} onChange={e => setProductData({...productData, packageWidth: e.target.value})} />
                              <input type="number" step="0.1" min="0" className="border border-[#8C9196] rounded-md px-2 py-2 text-[14px] text-[#202223]" placeholder="Height" value={productData.packageHeight} onChange={e => setProductData({...productData, packageHeight: e.target.value})} />
                            </div>
                          ) : (
                            <input
                              type="text"
                              readOnly
                              className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#6D7175] bg-[#F6F6F7]"
                              placeholder="Length × Width × Height"
                              value="22 × 13.7 × 4.2 cm (store default)"
                            />
                          )}
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-[13px] text-[#202223] mb-1">Package size</label>
                          <select className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] bg-white mb-3" value={productData.packageType} onChange={e => setProductData({...productData, packageType: e.target.value})}>
                            <option value="Store default - Sample box - 22 x 13.7 x 4.2 cm, 0 kg">Store default • Sample box - 22 × 13.7 × 4.2 cm</option>
                            <option value="custom">Custom dimensions</option>
                          </select>
                          {productData.packageType === 'custom' && (
                            <select className="w-24 border border-[#8C9196] rounded-md px-2 py-1 text-[13px] text-[#202223] bg-white" value={productData.packageDimensionsUnit} onChange={e => setProductData({...productData, packageDimensionsUnit: e.target.value})}>
                              <option value="cm">cm</option>
                              <option value="in">in</option>
                            </select>
                          )}
                        </div>
                        <DeliveryByFields productData={productData} setProductData={setProductData} />
                      </div>
                    </div>
                  )}
                  
                  <div className="p-5 border-t border-[#E1E3E5]">
                    <div className="flex justify-between items-center text-[14px] font-medium cursor-pointer">
                      <span className="text-[#005bd3] hover:underline">Add customs information</span>
                    </div>
                  </div>
                </div>

                {/* 6. SEO (EXACTLY AS IMAGE) */}
                <div className="bg-white border border-[#E1E3E5] rounded-lg shadow-sm overflow-hidden">
                  <div className="p-5">
                    <h3 className="font-semibold text-[15px] text-[#202223] mb-1">Search engine listing</h3>
                    <p className="text-[13px] text-[#6D7175]">Add a title and description to see how this product might appear in a search engine listing</p>
                  </div>
                  
                  <div className="p-5 border-t border-[#E1E3E5] space-y-4">
                    <div>
                      <label className="block text-[13px] text-[#202223] mb-1">Page title</label>
                      <input type="text" maxLength="70" className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] transition-shadow" value={productData.pageTitle} onChange={e => setProductData({...productData, pageTitle: e.target.value})} />
                      <p className="text-[12px] text-[#6D7175] mt-1">{productData.pageTitle?.length || 0} of 70 characters used</p>
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#202223] mb-1">Meta description</label>
                      <textarea maxLength="160" className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] min-h-[80px] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] transition-shadow" value={productData.metaDescription} onChange={e => setProductData({...productData, metaDescription: e.target.value})} />
                      <p className="text-[12px] text-[#6D7175] mt-1">{productData.metaDescription?.length || 0} of 160 characters used</p>
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#202223] mb-1">URL handle</label>
                      <input type="text" className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] transition-shadow" value={productData.urlHandle} onChange={e => setProductData({...productData, urlHandle: e.target.value})} />
                      <p className="text-[12px] text-[#6D7175] mt-1">https://aashansh.org/products/{productData.urlHandle}</p>
                    </div>
                  </div>
                </div>

            </div>

            {/* FORM FOOTER ACTION */}
            <div className="flex justify-end items-center gap-3 mt-8 pt-6 border-t border-[#E1E3E5]">
              {singleMsg && <span className={`text-[14px] font-medium px-4 py-2 rounded-md ${singleMsg.includes('success') ? 'bg-[#D1F2DD] text-[#113C2B]' : 'bg-[#FED3D1] text-[#6E1A17]'}`}>{singleMsg}</span>}
              <button type="button" className="bg-white border border-[#E1E3E5] hover:bg-[#F6F6F7] text-[#202223] font-medium py-2 px-4 rounded-md transition-all text-[14px]" onClick={() => { setEditingProduct(null); setActiveTab('list'); }}>Discard</button>
              <button type="submit" className="bg-[#008060] hover:bg-[#006e52] text-white font-medium py-2 px-6 rounded-md shadow-sm transition-all text-[14px]" disabled={singleLoading}>
                {singleLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
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
