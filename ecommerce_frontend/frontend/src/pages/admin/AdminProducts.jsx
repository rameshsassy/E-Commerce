import React, { useState, useEffect } from 'react';
import api, { BASE_URL } from '../../utils/api';
import { Check, X, Package } from 'lucide-react';

const AdminProducts = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/admin/pending-products');
      setPending(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/admin/product/${action}/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Product Approvals</h1>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="glass-panel p-8 text-center text-text-muted">Loading pending products...</div>
        ) : pending.length === 0 ? (
          <div className="glass-panel p-8 text-center text-text-muted flex flex-col items-center justify-center">
            <Package size={48} className="opacity-50 mb-4" />
            <p>No products waiting for approval.</p>
          </div>
        ) : (
          pending.map(product => (
            <div key={product._id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:bg-surface/50 transition-colors">
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 bg-surface rounded-lg overflow-hidden shrink-0">
                  <img 
                    src={product.images?.[0] ? `${BASE_URL}/${product.images[0].replace(/\\/g, '/')}` : 'https://placehold.co/100x100/1e293b/f8fafc?text=Img'} 
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{product.title}</h3>
                  <p className="text-sm text-text-muted mb-2 line-clamp-1">{product.description?.replace(/<[^>]+>/g, '')}</p>
                  
                  <div className="flex gap-3 text-sm">
                    <span className="font-bold text-success">${product.price}</span>
                    <span className="text-text-muted">• Stock: {product.stock}</span>
                    <span className="text-text-muted">• Seller: {product.sellerId?.firstName || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto shrink-0">
                <button onClick={() => handleAction(product._id, 'approve')} className="btn btn-primary flex-1 md:flex-none">
                  <Check size={18} /> Approve
                </button>
                <button onClick={() => handleAction(product._id, 'reject')} className="btn btn-danger flex-1 md:flex-none">
                  <X size={18} /> Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
