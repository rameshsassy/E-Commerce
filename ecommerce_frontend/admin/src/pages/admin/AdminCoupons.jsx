import React, { useState, useEffect } from 'react';
import { Tag, Plus, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';
import useFormAutosave from '../../hooks/useFormAutosave';
import FormAutosaveStatus from '../../components/common/FormAutosaveStatus';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: '',
    maxDiscountAmount: '',
    minOrderAmount: 0,
    expiryDate: '',
    usageLimit: ''
  });

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/admin/coupons');
      setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const { status: couponAutosaveStatus, message: couponAutosaveMessage, clearDraft: clearCouponDraft } =
    useFormAutosave({
      formKey: 'admin.coupons.new',
      value: formData,
      enabled: showModal,
      isEmpty: (v) => !String(v.code || '').trim(),
      onRestore: (data) => setFormData((prev) => ({ ...prev, ...data })),
    });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.maxDiscountAmount === '') delete payload.maxDiscountAmount;
      if (payload.usageLimit === '') delete payload.usageLimit;

      await api.post('/coupons/admin', payload);
      setShowModal(false);
      setFormData({
        code: '',
        discountPercentage: '',
        maxDiscountAmount: '',
        minOrderAmount: 0,
        expiryDate: '',
        usageLimit: ''
      });
      await clearCouponDraft();
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create coupon");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading coupons...</div>;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Tag className="text-primary"/> Promo Codes</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => {
          const isExpired = new Date() > new Date(coupon.expiryDate);
          return (
            <div key={coupon._id} className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all">
              <div className="absolute -right-4 -top-4 text-primary/10">
                <Tag size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-mono text-xl font-black tracking-widest text-primary border-2 border-primary/30 bg-primary/10 px-3 py-1 rounded-lg uppercase">
                    {coupon.code}
                  </span>
                  {isExpired || !coupon.isActive ? (
                    <XCircle className="text-error" size={24} />
                  ) : (
                    <CheckCircle className="text-success" size={24} />
                  )}
                </div>
                
                <h3 className="text-3xl font-bold mb-1">{coupon.discountPercentage}% OFF</h3>
                <div className="space-y-1 mb-4">
                  <p className="text-text-muted text-sm">
                    Min. Order: ₹{coupon.minOrderAmount}
                    {coupon.maxDiscountAmount ? ` | Max Disc: ₹${coupon.maxDiscountAmount}` : ''}
                  </p>
                  <p className="text-text-muted text-xs">
                    Limit: {coupon.usageLimit !== null && coupon.usageLimit !== undefined ? `${coupon.usageLimit} uses` : 'Unlimited'}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-glass-border flex justify-between text-xs text-text-muted font-medium">
                  <span>Used: {coupon.usedCount} times</span>
                  <span className={isExpired ? "text-error" : ""}>Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
        {coupons.length === 0 && (
          <div className="col-span-full p-12 text-center text-text-muted glass-panel rounded-2xl border border-dashed border-glass-border">
            No coupons generated yet.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface border border-glass-border rounded-2xl p-6 w-full max-w-md animate-fade-in shadow-2xl my-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <h2 className="text-2xl font-bold">Create New Promo Code</h2>
              <FormAutosaveStatus status={couponAutosaveStatus} message={couponAutosaveMessage} />
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input required type="text" className="input-field uppercase font-mono" placeholder="SUMMER20" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Percentage (%)</label>
                  <input required type="number" min="1" max="100" className="input-field" placeholder="20" value={formData.discountPercentage} onChange={e => setFormData({...formData, discountPercentage: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Discount Amount (₹)</label>
                  <input type="number" min="1" className="input-field" placeholder="e.g. 500" value={formData.maxDiscountAmount} onChange={e => setFormData({...formData, maxDiscountAmount: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min. Order Amount (₹)</label>
                  <input required type="number" min="0" className="input-field" placeholder="1000" value={formData.minOrderAmount} onChange={e => setFormData({...formData, minOrderAmount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date</label>
                  <input required type="date" className="input-field" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Usage Limit</label>
                <input type="number" min="1" className="input-field" placeholder="Unlimited (or enter a number)" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: e.target.value})} />
              </div>

              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => { setShowModal(false); setFormData({ code: '', discountPercentage: '', maxDiscountAmount: '', minOrderAmount: 0, expiryDate: '', usageLimit: '' }); }} className="btn bg-surface-hover flex-1 text-text hover:text-white">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
