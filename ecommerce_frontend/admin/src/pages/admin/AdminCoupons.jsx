import React, { useState, useEffect } from 'react';
import { Tag, Plus, CheckCircle, XCircle, Search, Copy, Check, Calendar, Ticket, Users, X } from 'lucide-react';
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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [copiedCode, setCopiedCode] = useState(null);

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

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Calculate statistics
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.isActive && new Date() <= new Date(c.expiryDate)).length;
  const expiredOrInactive = coupons.filter(c => !c.isActive || new Date() > new Date(c.expiryDate)).length;
  const totalRedeemed = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  // Filter & Sort coupons
  const filteredCoupons = coupons
    .filter((coupon) => {
      const isExpired = new Date() > new Date(coupon.expiryDate);
      const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = coupon.isActive && !isExpired;
      } else if (statusFilter === 'expired') {
        matchesStatus = isExpired;
      } else if (statusFilter === 'inactive') {
        matchesStatus = !coupon.isActive && !isExpired;
      }

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'expiry') {
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      }
      if (sortBy === 'discount') {
        return b.discountPercentage - a.discountPercentage;
      }
      if (sortBy === 'usage') {
        return b.usedCount - a.usedCount;
      }
      return 0;
    });

  if (loading) return <div className="p-8 text-center text-text-muted">Loading coupons...</div>;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto px-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 text-text">
            <Tag className="text-primary" size={32} />
            Promo Codes
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Create, monitor, and manage discount promo codes for campaigns.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2 self-stretch sm:self-auto justify-center">
          <Plus size={18} /> Create Coupon
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:scale-[1.02] transition-all">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Ticket size={24} />
          </div>
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Total Coupons</p>
            <h4 className="text-2xl font-bold">{totalCoupons}</h4>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:scale-[1.02] transition-all">
          <div className="p-3 rounded-xl bg-success/10 text-success">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Active</p>
            <h4 className="text-2xl font-bold">{activeCoupons}</h4>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:scale-[1.02] transition-all">
          <div className="p-3 rounded-xl bg-error/10 text-error">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Expired / Inactive</p>
            <h4 className="text-2xl font-bold">{expiredOrInactive}</h4>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:scale-[1.02] transition-all">
          <div className="p-3 rounded-xl bg-warning/10 text-warning">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Total Redeemed</p>
            <h4 className="text-2xl font-bold">{totalRedeemed}</h4>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            className="input-field pl-10 py-2 text-sm bg-bg border border-glass-border rounded-xl w-full"
            placeholder="Search by code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:flex-none">
            <span className="text-xs text-text-muted font-medium whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-bg border border-glass-border text-text rounded-xl px-3 py-2 text-sm outline-none focus:border-primary w-full md:w-36"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 md:flex-none">
            <span className="text-xs text-text-muted font-medium whitespace-nowrap">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-bg border border-glass-border text-text rounded-xl px-3 py-2 text-sm outline-none focus:border-primary w-full md:w-44"
            >
              <option value="newest">Newest Created</option>
              <option value="expiry">Expiry Date</option>
              <option value="discount">Highest Discount</option>
              <option value="usage">Most Used</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoupons.map((coupon) => {
          const isExpired = new Date() > new Date(coupon.expiryDate);
          const isReallyActive = coupon.isActive && !isExpired;
          return (
            <div key={coupon._id} className="relative bg-surface border border-glass-border rounded-2xl p-6 overflow-hidden flex flex-col justify-between h-full group hover:shadow-glow hover:-translate-y-1 transition-all duration-300">
              {/* Left ticket cutout */}
              <div className="absolute top-[65%] -left-3 w-6 h-6 bg-bg border-r border-glass-border rounded-full transform -translate-y-1/2 z-20"></div>
              {/* Right ticket cutout */}
              <div className="absolute top-[65%] -right-3 w-6 h-6 bg-bg border-l border-glass-border rounded-full transform -translate-y-1/2 z-20"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                {/* Upper ticket details */}
                <div className="pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-extrabold tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg uppercase">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(coupon.code)}
                        className="text-text-muted hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-surface-hover"
                        title="Copy Code"
                      >
                        {copiedCode === coupon.code ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div>
                      {isReallyActive ? (
                        <span className="badge badge-success flex items-center gap-1.5 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                          Active
                        </span>
                      ) : isExpired ? (
                        <span className="badge badge-error text-xs">Expired</span>
                      ) : (
                        <span className="badge badge-warning text-xs">Inactive</span>
                      )}
                    </div>
                  </div>

                  <div className="my-4">
                    <span className="text-4xl font-extrabold text-text bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {coupon.discountPercentage}% OFF
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-text-muted">
                    <div className="flex justify-between">
                      <span>Min. Order Amount:</span>
                      <span className="font-medium text-text">₹{coupon.minOrderAmount}</span>
                    </div>
                    {coupon.maxDiscountAmount && (
                      <div className="flex justify-between">
                        <span>Max. Discount:</span>
                        <span className="font-medium text-text">₹{coupon.maxDiscountAmount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dashed line aligned with the side cutouts */}
                <div className="border-t border-dashed border-glass-border/60 my-3 relative"></div>

                {/* Lower ticket details */}
                <div className="pt-2">
                  {/* Usage limit & progress */}
                  {coupon.usageLimit !== null && coupon.usageLimit !== undefined ? (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-text-muted mb-1">
                        <span>Redemptions:</span>
                        <span className="font-medium text-text">
                          {coupon.usedCount} / {coupon.usageLimit}
                        </span>
                      </div>
                      <div className="w-full bg-bg rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between text-xs text-text-muted mb-4">
                      <span>Redemptions:</span>
                      <span className="font-medium text-text">{coupon.usedCount} uses (Unlimited)</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Calendar size={14} className="shrink-0" />
                    <span className={isExpired ? "text-error font-medium" : ""}>
                      Expires: {new Date(coupon.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredCoupons.length === 0 && (
          <div className="col-span-full p-12 text-center text-text-muted glass-panel rounded-2xl border border-dashed border-glass-border flex flex-col items-center justify-center gap-3">
            <Ticket size={48} className="text-text-muted opacity-40" />
            <div>
              <p className="font-bold text-lg text-text">No Coupons Found</p>
              <p className="text-sm">Try adjusting your search query or filters.</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface border border-glass-border rounded-3xl p-6 w-full max-w-lg animate-fade-in shadow-2xl relative my-auto">
            {/* Close Button */}
            <button 
              onClick={() => { setShowModal(false); setFormData({ code: '', discountPercentage: '', maxDiscountAmount: '', minOrderAmount: 0, expiryDate: '', usageLimit: '' }); }}
              className="absolute top-4 right-4 text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-between border-b border-glass-border/60 pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2 text-text">
                  <Ticket size={24} className="text-primary" />
                  Create Promo Code
                </h2>
                <p className="text-xs text-text-muted mt-1">Configure parameters for the new coupon</p>
              </div>
              <div className="mr-8">
                <FormAutosaveStatus status={couponAutosaveStatus} message={couponAutosaveMessage} />
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-text">Code</label>
                <input 
                  required 
                  type="text" 
                  className="input-field uppercase font-mono tracking-wider text-base" 
                  placeholder="SUMMER20" 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                />
                <p className="text-xs text-text-muted mt-1">Unique identifier that customers enter at checkout.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-text">Discount Percentage (%)</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    max="100" 
                    className="input-field" 
                    placeholder="20" 
                    value={formData.discountPercentage} 
                    onChange={e => setFormData({...formData, discountPercentage: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-text">Max Discount Amount (₹)</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="input-field" 
                    placeholder="e.g. 500 (Optional)" 
                    value={formData.maxDiscountAmount} 
                    onChange={e => setFormData({...formData, maxDiscountAmount: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-text">Min. Order Amount (₹)</label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    className="input-field" 
                    placeholder="1000" 
                    value={formData.minOrderAmount} 
                    onChange={e => setFormData({...formData, minOrderAmount: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-text">Expiry Date</label>
                  <input 
                    required 
                    type="date" 
                    className="input-field" 
                    value={formData.expiryDate} 
                    onChange={e => setFormData({...formData, expiryDate: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-text">Usage Limit</label>
                <input 
                  type="number" 
                  min="1" 
                  className="input-field" 
                  placeholder="Unlimited (or enter max use count)" 
                  value={formData.usageLimit} 
                  onChange={e => setFormData({...formData, usageLimit: e.target.value})} 
                />
                <p className="text-xs text-text-muted mt-1">Leave blank for unlimited redemptions.</p>
              </div>

              <div className="flex gap-4 pt-4 border-t border-glass-border/60">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setFormData({ code: '', discountPercentage: '', maxDiscountAmount: '', minOrderAmount: 0, expiryDate: '', usageLimit: '' }); }} 
                  className="btn bg-surface-hover flex-1 text-text hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">Create Promo Code</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
