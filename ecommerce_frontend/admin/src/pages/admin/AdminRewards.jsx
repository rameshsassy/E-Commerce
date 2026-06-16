import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const api = {
  get: (path, params) => axios.get(`${API}${path}`, { headers: getAuthHeaders(), params }),
  post: (path, data) => axios.post(`${API}${path}`, data, { headers: getAuthHeaders() }),
  put: (path, data) => axios.put(`${API}${path}`, data, { headers: getAuthHeaders() }),
  del: (path) => axios.delete(`${API}${path}`, { headers: getAuthHeaders() }),
};

// ─── TOAST ───
let _toast = null;
function useToast() {
  const [toasts, setToasts] = useState([]);
  _toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts };
}
const toast = (msg, type) => _toast && _toast(msg, type);

function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14,
          background: t.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)',
          color: '#fff', backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'slideInRight 0.3s ease',
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

// ─── COLOR INPUT ───
function ColorInput({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="color" value={value || '#6366f1'} onChange={e => onChange(e.target.value)}
          style={{ width: 40, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 2, background: 'transparent' }} />
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 13 }} />
      </div>
    </div>
  );
}

// ─── STATS CARD ───
function StatCard({ label, value, icon, color = '#6366f1', sub }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6,
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

// ─── STATUS BADGE ───
function StatusBadge({ status }) {
  const map = {
    active: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', label: 'Active' },
    inactive: { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af', label: 'Inactive' },
    scheduled: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', label: 'Scheduled' },
    expired: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Expired' },
    redeemed: { bg: 'rgba(99,102,241,0.15)', color: '#6366f1', label: 'Redeemed' },
    blocked: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Blocked' },
    completed: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', label: 'Completed' },
    credit: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', label: 'Credit' },
    debit: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Debit' },
    manual_credit: { bg: 'rgba(99,102,241,0.15)', color: '#6366f1', label: 'Manual Credit' },
    manual_debit: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', label: 'Manual Debit' },
  };
  const s = map[status] || { bg: 'rgba(156,163,175,0.1)', color: '#9ca3af', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {s.label}
    </span>
  );
}

// ─── TABS ───
const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'campaigns', label: '🏆 Campaigns' },
  { id: 'customers', label: '👥 Customer Rewards' },
  { id: 'transactions', label: '📋 Transactions' },
  { id: 'reports', label: '📈 Reports' },
  { id: 'settings', label: '⚙️ Settings' },
];

// ═══════════════════════════════════════════════════════════
// CAMPAIGN FORM MODAL
// ═══════════════════════════════════════════════════════════
const EMPTY_CAMPAIGN = {
  campaignName: '',
  campaignDescription: '',
  status: 'inactive',
  priority: 1,
  startDate: '',
  endDate: '',
  campaignBanner: '',
  campaignIcon: '',
  rewardRule: {
    rewardType: 'percentage',
    spendAmount: 500,
    rewardValue: 0,
    rewardPercentage: 5,
    freeSellerRewardPercentage: 5,
    proSellerRewardPercentage: 1,
    premiumSellerRewardPercentage: 1,
    maxRewardPerOrder: null,
    maxRewardPerCustomer: null,
    maxActiveVouchers: null,
    voucherExpiryDays: 30,
  },
  productEligibility: { type: 'all', productIds: [], categoryIds: [], sellerIds: [], sellerPlans: [] },
  exclusionRules: { productIds: [], categoryIds: [], sellerIds: [], sellerPlans: [], brands: [] },
  customerEligibility: { type: 'all', customerIds: [] },
  branding: {
    primaryColor: '#6366f1', secondaryColor: '#8b5cf6', buttonColor: '#6366f1',
    bannerColor: '#1e1b4b', cardColor: '#312e81', theme: 'purple',
  },
};

function CampaignModal({ campaign, onClose, onSaved }) {
  const [form, setForm] = useState(campaign ? {
    ...EMPTY_CAMPAIGN,
    ...campaign,
    rewardRule: { ...EMPTY_CAMPAIGN.rewardRule, ...campaign.rewardRule },
    productEligibility: { ...EMPTY_CAMPAIGN.productEligibility, ...campaign.productEligibility },
    exclusionRules: { ...EMPTY_CAMPAIGN.exclusionRules, ...campaign.exclusionRules },
    customerEligibility: { ...EMPTY_CAMPAIGN.customerEligibility, ...campaign.customerEligibility },
    branding: { ...EMPTY_CAMPAIGN.branding, ...campaign.branding },
    startDate: campaign.startDate ? campaign.startDate.slice(0, 10) : '',
    endDate: campaign.endDate ? campaign.endDate.slice(0, 10) : '',
  } : { ...EMPTY_CAMPAIGN });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  const setRule = (k, v) => setForm(f => ({ ...f, rewardRule: { ...f.rewardRule, [k]: v } }));
  const setPE = (k, v) => setForm(f => ({ ...f, productEligibility: { ...f.productEligibility, [k]: v } }));
  const setCE = (k, v) => setForm(f => ({ ...f, customerEligibility: { ...f.customerEligibility, [k]: v } }));
  const setEx = (k, v) => setForm(f => ({ ...f, exclusionRules: { ...f.exclusionRules, [k]: v } }));
  const setBrand = (k, v) => setForm(f => ({ ...f, branding: { ...f.branding, [k]: v } }));

  const save = async () => {
    if (!form.campaignName?.trim()) return toast('Campaign name is required', 'error');
    if (!form.startDate || !form.endDate) return toast('Start and end dates are required', 'error');
    setSaving(true);
    try {
      if (campaign?._id) {
        await api.put(`/admin/rewards/campaigns/${campaign._id}`, form);
        toast('Campaign updated successfully!');
      } else {
        await api.post('/admin/rewards/campaigns', form);
        toast('Campaign created successfully!');
      }
      onSaved();
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to save campaign', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'basic', label: '📝 Basic Info' },
    { id: 'rewards', label: '💰 Reward Rules' },
    { id: 'sellers', label: '🏪 Seller Plans' },
    { id: 'eligibility', label: '✅ Eligibility' },
    { id: 'exclusions', label: '🚫 Exclusions' },
    { id: 'branding', label: '🎨 Branding' },
  ];

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.07)',
    color: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' };
  const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 4 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 760, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', border: '1px solid var(--glass-border)', borderRadius: 20 }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{campaign ? '✏️ Edit Campaign' : '🏆 Create Reward Campaign'}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Configure all reward logic — nothing is hardcoded</p>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'inherit', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 24px', borderBottom: '1px solid var(--glass-border)', overflowX: 'auto' }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600,
              background: activeSection === s.id ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
              color: activeSection === s.id ? '#818cf8' : 'var(--text-muted)',
            }}>{s.label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* BASIC INFO */}
          {activeSection === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Campaign Name *</label>
                <input style={inputStyle} value={form.campaignName} onChange={e => setForm(f => ({ ...f, campaignName: e.target.value }))} placeholder="e.g. Diwali Rewards 2026" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Campaign Description</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} value={form.campaignDescription} onChange={e => setForm(f => ({ ...f, campaignDescription: e.target.value }))} placeholder="Describe this reward campaign..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Status</label>
                  <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Priority (lower = higher priority)</label>
                  <input style={inputStyle} type="number" min={1} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Start Date *</label>
                  <input style={inputStyle} type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>End Date *</label>
                  <input style={inputStyle} type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Campaign Banner URL</label>
                <input style={inputStyle} value={form.campaignBanner} onChange={e => setForm(f => ({ ...f, campaignBanner: e.target.value }))} placeholder="https://..." />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Campaign Icon URL</label>
                <input style={inputStyle} value={form.campaignIcon} onChange={e => setForm(f => ({ ...f, campaignIcon: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
          )}

          {/* REWARD RULES */}
          {activeSection === 'rewards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Reward Type</label>
                <select style={inputStyle} value={form.rewardRule.rewardType} onChange={e => setRule('rewardType', e.target.value)}>
                  <option value="percentage">Percentage Reward (% of order value)</option>
                  <option value="fixed_voucher">Fixed Voucher (spend X get ₹Y)</option>
                  <option value="points">Points Based (spend X earn Y points)</option>
                </select>
              </div>

              {form.rewardRule.rewardType === 'percentage' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Default Reward % (if no seller plan match)</label>
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inputStyle, paddingRight: 36 }} type="number" min={0} max={100} step={0.1} value={form.rewardRule.rewardPercentage} onChange={e => setRule('rewardPercentage', Number(e.target.value))} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>%</span>
                    </div>
                  </div>
                </div>
              )}

              {(form.rewardRule.rewardType === 'fixed_voucher' || form.rewardRule.rewardType === 'points') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Spend Amount (₹)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>₹</span>
                      <input style={{ ...inputStyle, paddingLeft: 28 }} type="number" min={0} value={form.rewardRule.spendAmount} onChange={e => setRule('spendAmount', Number(e.target.value))} />
                    </div>
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{form.rewardRule.rewardType === 'points' ? 'Points Earned' : 'Reward Value (₹)'}</label>
                    <div style={{ position: 'relative' }}>
                      {form.rewardRule.rewardType !== 'points' && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>₹</span>}
                      <input style={{ ...inputStyle, paddingLeft: form.rewardRule.rewardType !== 'points' ? 28 : 14 }} type="number" min={0} value={form.rewardRule.rewardValue} onChange={e => setRule('rewardValue', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#818cf8' }}>🔒 Caps & Limits</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Max Reward Per Order (₹, 0=unlimited)</label>
                    <input style={inputStyle} type="number" min={0} value={form.rewardRule.maxRewardPerOrder ?? ''} onChange={e => setRule('maxRewardPerOrder', e.target.value === '' ? null : Number(e.target.value))} />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Max Reward Per Customer (₹, 0=unlimited)</label>
                    <input style={inputStyle} type="number" min={0} value={form.rewardRule.maxRewardPerCustomer ?? ''} onChange={e => setRule('maxRewardPerCustomer', e.target.value === '' ? null : Number(e.target.value))} />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Max Active Vouchers (0=unlimited)</label>
                    <input style={inputStyle} type="number" min={0} value={form.rewardRule.maxActiveVouchers ?? ''} onChange={e => setRule('maxActiveVouchers', e.target.value === '' ? null : Number(e.target.value))} />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Voucher Expiry (days)</label>
                    <input style={inputStyle} type="number" min={1} value={form.rewardRule.voucherExpiryDays} onChange={e => setRule('voucherExpiryDays', Number(e.target.value))} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SELLER PLAN REWARDS */}
          {activeSection === 'sellers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#fbbf24' }}>
                  ⚠️ Seller plan percentages override the default reward % set in Reward Rules tab.
                  Leave blank to use the default reward percentage.
                </p>
              </div>
              {[
                { key: 'freeSellerRewardPercentage', label: '🆓 Free Seller Reward %', color: '#22c55e', desc: 'Applied when customer buys from a Free plan seller' },
                { key: 'proSellerRewardPercentage', label: '⭐ Pro Seller Reward %', color: '#6366f1', desc: 'Applied when customer buys from a Pro plan seller' },
                { key: 'premiumSellerRewardPercentage', label: '👑 Premium Seller Reward %', color: '#fbbf24', desc: 'Applied when customer buys from a Premium plan seller' },
              ].map(({ key, label, color, desc }) => (
                <div key={key} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 16, border: `1px solid ${color}30` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color }}>{label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{desc}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                      <input style={{ ...inputStyle, paddingRight: 36, textAlign: 'right' }} type="number" min={0} max={100} step={0.1}
                        value={form.rewardRule[key] ?? ''} onChange={e => setRule(key, e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="—" />
                      <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>%</span>
                    </div>
                  </div>
                  {form.rewardRule[key] != null && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: `${color}15`, borderRadius: 8, fontSize: 13, color }}>
                      Example: Customer buys ₹1000 from {key.includes('free') ? 'free' : key.includes('pro') ? 'pro' : 'premium'} seller → Earns ₹{((1000 * form.rewardRule[key]) / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ELIGIBILITY */}
          {activeSection === 'eligibility' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>📦 Product Eligibility</h4>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Apply rewards to</label>
                  <select style={inputStyle} value={form.productEligibility.type} onChange={e => setPE('type', e.target.value)}>
                    <option value="all">All Products</option>
                    <option value="selected_products">Selected Products</option>
                    <option value="selected_categories">Selected Categories</option>
                    <option value="selected_sellers">Selected Sellers</option>
                    <option value="selected_seller_plans">Selected Seller Plans</option>
                  </select>
                </div>
                {form.productEligibility.type === 'selected_seller_plans' && (
                  <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Select Seller Plans</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {['free', 'pro', 'premium'].map(plan => (
                        <label key={plan} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '8px 14px', borderRadius: 20, border: '1px solid var(--glass-border)' }}>
                          <input type="checkbox" checked={form.productEligibility.sellerPlans?.includes(plan)}
                            onChange={e => {
                              const plans = form.productEligibility.sellerPlans || [];
                              setPE('sellerPlans', e.target.checked ? [...plans, plan] : plans.filter(p => p !== plan));
                            }} />
                          {plan.charAt(0).toUpperCase() + plan.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {form.productEligibility.type === 'selected_products' && (
                  <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Product IDs (comma-separated, or paste from admin panel)</p>
                    <textarea style={{ ...inputStyle, marginTop: 8, minHeight: 80, resize: 'vertical' }}
                      placeholder="Enter product ObjectIds separated by commas"
                      value={form.productEligibility.productIds?.join(',')}
                      onChange={e => setPE('productIds', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>👤 Customer Eligibility</h4>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Apply rewards to</label>
                  <select style={inputStyle} value={form.customerEligibility.type} onChange={e => setCE('type', e.target.value)}>
                    <option value="all">All Customers</option>
                    <option value="new_customers_only">New Customers Only</option>
                    <option value="existing_customers_only">Existing Customers Only</option>
                    <option value="premium_members_only">Premium Members Only</option>
                    <option value="selected_customers">Selected Customers</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* EXCLUSIONS */}
          {activeSection === 'exclusions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Exclude specific products, categories, sellers, seller plans, or brands from this campaign.</p>
              <div style={fieldStyle}>
                <label style={labelStyle}>Exclude Seller Plans</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['free', 'pro', 'premium'].map(plan => (
                    <label key={plan} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '8px 14px', borderRadius: 20, border: '1px solid var(--glass-border)' }}>
                      <input type="checkbox" checked={form.exclusionRules.sellerPlans?.includes(plan)}
                        onChange={e => {
                          const plans = form.exclusionRules.sellerPlans || [];
                          setEx('sellerPlans', e.target.checked ? [...plans, plan] : plans.filter(p => p !== plan));
                        }} />
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Exclude Brands (comma-separated)</label>
                <input style={inputStyle} placeholder="Brand A, Brand B, ..." value={form.exclusionRules.brands?.join(', ')}
                  onChange={e => setEx('brands', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Exclude Seller IDs (comma-separated ObjectIds)</label>
                <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.exclusionRules.sellerIds?.join(',')}
                  onChange={e => setEx('sellerIds', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
              </div>
            </div>
          )}

          {/* BRANDING */}
          {activeSection === 'branding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>These colors appear on the customer-facing rewards page for this campaign.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <ColorInput label="Primary Color" value={form.branding.primaryColor} onChange={v => setBrand('primaryColor', v)} />
                <ColorInput label="Secondary Color" value={form.branding.secondaryColor} onChange={v => setBrand('secondaryColor', v)} />
                <ColorInput label="Button Color" value={form.branding.buttonColor} onChange={v => setBrand('buttonColor', v)} />
                <ColorInput label="Banner Color" value={form.branding.bannerColor} onChange={v => setBrand('bannerColor', v)} />
                <ColorInput label="Card Color" value={form.branding.cardColor} onChange={v => setBrand('cardColor', v)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Theme Name</label>
                <select style={inputStyle} value={form.branding.theme} onChange={e => setBrand('theme', e.target.value)}>
                  {['purple', 'blue', 'green', 'orange', 'red', 'gold', 'custom'].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              {/* Live preview */}
              <div style={{ borderRadius: 16, padding: 24, background: form.branding.bannerColor || '#1e1b4b', border: `2px solid ${form.branding.primaryColor || '#6366f1'}`, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏆</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: form.branding.primaryColor || '#818cf8' }}>{form.campaignName || 'Campaign Name'}</div>
                <div style={{ fontSize: 13, color: form.branding.secondaryColor || '#a78bfa', marginTop: 4 }}>{form.campaignDescription || 'Campaign description'}</div>
                <button style={{ marginTop: 16, padding: '10px 24px', borderRadius: 20, border: 'none', background: form.branding.buttonColor || '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  View Rewards
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? '⏳ Saving…' : campaign ? '✓ Update Campaign' : '✓ Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function AdminRewards() {
  const { toasts } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [campaigns, setCampaigns] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [reports, setReports] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editCampaign, setEditCampaign] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ action: 'add', amount: '', note: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview' || activeTab === 'campaigns') {
        const r = await api.get('/admin/rewards/campaigns', { status: statusFilter || undefined });
        setCampaigns(r.data.campaigns || []);
      }
      if (activeTab === 'transactions') {
        const r = await api.get('/admin/rewards/transactions');
        setTransactions(r.data.transactions || []);
      }
      if (activeTab === 'customers') {
        const r = await api.get('/admin/rewards/customers', { search: customerSearch || undefined });
        setCustomers(r.data.customers || []);
      }
      if (activeTab === 'reports') {
        const r = await api.get('/admin/rewards/reports');
        setReports(r.data);
      }
      if (activeTab === 'settings') {
        const r = await api.get('/admin/rewards/settings');
        setSettings(r.data.settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, customerSearch]);

  useEffect(() => { load(); }, [load]);

  const deleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
    try {
      await api.del(`/admin/rewards/campaigns/${id}`);
      toast('Campaign deleted');
      load();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      await api.put('/admin/rewards/settings', settings);
      toast('Settings saved!');
    } catch (e) {
      toast('Failed to save settings', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  const submitAdjust = async () => {
    if (!adjustModal) return;
    try {
      await api.put(`/admin/rewards/customers/${adjustModal._id}/adjust`, adjustForm);
      toast(`Reward ${adjustForm.action} successful`);
      setAdjustModal(null);
      load();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed', 'error');
    }
  };

  const boxStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' };
  const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)' };
  const tdStyle = { padding: '13px 16px', fontSize: 14, borderTop: '1px solid rgba(255,255,255,0.05)' };
  const btnPrimary = { padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 };
  const btnDanger = { padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: 12 };
  const btnGhost = { padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontWeight: 600, cursor: 'pointer', fontSize: 12 };

  const activeCount = campaigns.filter(c => c.status === 'active').length;
  const totalIssued = reports?.summary?.totalIssued ?? campaigns.reduce((s, c) => s + (c.totalRewardsIssued || 0), 0);
  const totalRedeemed = reports?.summary?.totalRedeemed ?? campaigns.reduce((s, c) => s + (c.totalRewardsRedeemed || 0), 0);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Toast toasts={toasts} />

      {/* Modals */}
      {showModal && (
        <CampaignModal campaign={editCampaign} onClose={() => { setShowModal(false); setEditCampaign(null); }} onSaved={load} />
      )}

      {adjustModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: 440, background: 'var(--color-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px' }}>Adjust Reward — {adjustModal.customerData?.firstName} {adjustModal.customerData?.lastName}</h3>
            <select style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.07)', color: 'inherit', fontSize: 14, marginBottom: 12 }}
              value={adjustForm.action} onChange={e => setAdjustForm(f => ({ ...f, action: e.target.value }))}>
              <option value="add">Add Reward (Credit)</option>
              <option value="remove">Remove Reward (Debit)</option>
            </select>
            <input type="number" min={1} placeholder="Amount (₹)" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.07)', color: 'inherit', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
              value={adjustForm.amount} onChange={e => setAdjustForm(f => ({ ...f, amount: e.target.value }))} />
            <textarea placeholder="Note (optional)" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.07)', color: 'inherit', fontSize: 14, resize: 'vertical', minHeight: 60, boxSizing: 'border-box' }}
              value={adjustForm.note} onChange={e => setAdjustForm(f => ({ ...f, note: e.target.value }))} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button style={btnGhost} onClick={() => setAdjustModal(null)}>Cancel</button>
              <button style={btnPrimary} onClick={submitAdjust}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🏆 Rewards Management
            </h1>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Configure reward campaigns, eligibility, and branding — all from here</p>
          </div>
          <button id="create-campaign-btn" style={btnPrimary} onClick={() => { setEditCampaign(null); setShowModal(true); }}>
            + Create Campaign
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 700,
            background: activeTab === tab.id ? 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.3))' : 'rgba(255,255,255,0.05)',
            color: activeTab === tab.id ? '#818cf8' : 'var(--text-muted)',
            border: activeTab === tab.id ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* ── OVERVIEW ── */}
      {!loading && activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            <StatCard label="Total Campaigns" value={campaigns.length} icon="🏆" color="#6366f1" />
            <StatCard label="Active Campaigns" value={activeCount} icon="✅" color="#22c55e" />
            <StatCard label="Total Rewards Issued" value={`₹${Number(totalIssued).toFixed(0)}`} icon="💰" color="#fbbf24" />
            <StatCard label="Total Redeemed" value={`₹${Number(totalRedeemed).toFixed(0)}`} icon="🎁" color="#8b5cf6" />
          </div>

          <div style={boxStyle}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Recent Campaigns</h3>
              <button style={btnGhost} onClick={() => setActiveTab('campaigns')}>View All →</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Campaign', 'Status', 'Type', 'Priority', 'Dates', 'Issued'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {campaigns.slice(0, 5).map(c => (
                  <tr key={c._id}>
                    <td style={tdStyle}><div style={{ fontWeight: 700 }}>{c.campaignName}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.campaignDescription?.slice(0, 50)}</div></td>
                    <td style={tdStyle}><StatusBadge status={c.status} /></td>
                    <td style={tdStyle}><span style={{ fontSize: 12, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '3px 8px', borderRadius: 6 }}>{c.rewardRule?.rewardType}</span></td>
                    <td style={tdStyle}>#{c.priority}</td>
                    <td style={tdStyle}><div style={{ fontSize: 12 }}>{new Date(c.startDate).toLocaleDateString()} — {new Date(c.endDate).toLocaleDateString()}</div></td>
                    <td style={tdStyle}><span style={{ fontWeight: 700, color: '#22c55e' }}>₹{c.totalRewardsIssued?.toFixed(0) || 0}</span></td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No campaigns yet. <button style={{ ...btnPrimary, marginLeft: 12 }} onClick={() => setShowModal(true)}>Create First Campaign</button></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CAMPAIGNS ── */}
      {!loading && activeTab === 'campaigns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {['', 'active', 'inactive', 'scheduled', 'expired'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: statusFilter === s ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                color: statusFilter === s ? '#818cf8' : 'var(--text-muted)',
              }}>{s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {campaigns.map(c => (
              <div key={c._id} style={{ ...boxStyle, padding: 0 }}>
                <div style={{ display: 'flex', gap: 16, padding: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${c.branding?.primaryColor || '#6366f1'}, ${c.branding?.secondaryColor || '#8b5cf6'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                    {c.campaignIcon ? <img src={c.campaignIcon} style={{ width: 36, height: 36, objectFit: 'contain' }} alt="" /> : '🏆'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{c.campaignName}</h3>
                      <StatusBadge status={c.status} />
                      <span style={{ fontSize: 12, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                        {c.rewardRule?.rewardType === 'percentage' ? `${c.rewardRule?.rewardPercentage || 0}% Reward` : c.rewardRule?.rewardType === 'fixed_voucher' ? `₹${c.rewardRule?.rewardValue || 0} Fixed` : `${c.rewardRule?.rewardValue || 0} Points`}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Priority #{c.priority}</span>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-muted)' }}>{c.campaignDescription || 'No description'}</p>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
                      <span>📅 {new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}</span>
                      <span style={{ color: '#22c55e', fontWeight: 700 }}>💰 ₹{c.totalRewardsIssued?.toFixed(0) || 0} issued</span>
                      <span style={{ color: '#8b5cf6', fontWeight: 700 }}>🎁 ₹{c.totalRewardsRedeemed?.toFixed(0) || 0} redeemed</span>
                      <span>👥 {c.totalCustomersRewarded || 0} customers</span>
                      <span>📦 {c.productEligibility?.type === 'all' ? 'All products' : c.productEligibility?.type}</span>
                    </div>
                    {/* Seller plan badges */}
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {c.rewardRule?.freeSellerRewardPercentage != null && <span style={{ fontSize: 12, background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>🆓 Free: {c.rewardRule.freeSellerRewardPercentage}%</span>}
                      {c.rewardRule?.proSellerRewardPercentage != null && <span style={{ fontSize: 12, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>⭐ Pro: {c.rewardRule.proSellerRewardPercentage}%</span>}
                      {c.rewardRule?.premiumSellerRewardPercentage != null && <span style={{ fontSize: 12, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>👑 Premium: {c.rewardRule.premiumSellerRewardPercentage}%</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button style={btnGhost} onClick={() => { setEditCampaign(c); setShowModal(true); }}>✏️ Edit</button>
                    <button style={btnDanger} onClick={() => deleteCampaign(c._id)}>🗑️ Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
                <h3>No campaigns yet</h3>
                <p>Create your first reward campaign to start rewarding customers.</p>
                <button style={btnPrimary} onClick={() => setShowModal(true)}>+ Create First Campaign</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CUSTOMER REWARDS ── */}
      {!loading && activeTab === 'customers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input placeholder="Search customers..." style={{ flex: 1, padding: '10px 16px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.07)', color: 'inherit', fontSize: 14 }}
              value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
            <button style={btnGhost} onClick={load}>Search</button>
          </div>
          <div style={boxStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Customer', 'Total Earned', 'Total Redeemed', 'Transactions', 'Last Activity', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700 }}>{c.customerData?.firstName} {c.customerData?.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.customerData?.email}</div>
                    </td>
                    <td style={tdStyle}><span style={{ fontWeight: 700, color: '#22c55e' }}>₹{c.totalEarned?.toFixed(2) || '0.00'}</span></td>
                    <td style={tdStyle}><span style={{ fontWeight: 700, color: '#8b5cf6' }}>₹{c.totalRedeemed?.toFixed(2) || '0.00'}</span></td>
                    <td style={tdStyle}>{c.transactionCount || 0}</td>
                    <td style={tdStyle}><span style={{ fontSize: 12 }}>{c.lastActivity ? new Date(c.lastActivity).toLocaleDateString() : '—'}</span></td>
                    <td style={tdStyle}>
                      <button style={btnGhost} onClick={() => { setAdjustModal(c); setAdjustForm({ action: 'add', amount: '', note: '' }); }}>Adjust</button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No customer reward data yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS ── */}
      {!loading && activeTab === 'transactions' && (
        <div style={boxStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Customer', 'Type', 'Campaign', 'Seller Plan', 'Order Amount', 'Earned', 'Redeemed', 'Date'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t._id}>
                  <td style={tdStyle}><div style={{ fontWeight: 600 }}>{t.customer?.firstName} {t.customer?.lastName}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.customer?.email}</div></td>
                  <td style={tdStyle}><StatusBadge status={t.type} /></td>
                  <td style={tdStyle}><span style={{ fontSize: 13 }}>{t.campaign?.campaignName || '—'}</span></td>
                  <td style={tdStyle}>{t.sellerPlan ? <StatusBadge status={t.sellerPlan === 'free' ? 'active' : t.sellerPlan === 'pro' ? 'scheduled' : 'completed'} /> : '—'}</td>
                  <td style={tdStyle}>₹{t.orderAmount?.toFixed(0) || 0}</td>
                  <td style={tdStyle}><span style={{ color: '#22c55e', fontWeight: 700 }}>+₹{t.rewardEarned?.toFixed(2) || '0.00'}</span></td>
                  <td style={tdStyle}><span style={{ color: '#ef4444', fontWeight: 700 }}>-₹{t.rewardRedeemed?.toFixed(2) || '0.00'}</span></td>
                  <td style={tdStyle}><span style={{ fontSize: 12 }}>{new Date(t.createdAt).toLocaleDateString()}</span></td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No transactions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ── REPORTS ── */}
      {!loading && activeTab === 'reports' && reports && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            <StatCard label="Total Rewards Issued" value={`₹${Number(reports.summary?.totalIssued || 0).toFixed(0)}`} icon="💰" color="#22c55e" sub={`${reports.summary?.totalIssuedCount || 0} transactions`} />
            <StatCard label="Total Redeemed" value={`₹${Number(reports.summary?.totalRedeemed || 0).toFixed(0)}`} icon="🎁" color="#8b5cf6" sub={`${reports.summary?.totalRedeemedCount || 0} orders`} />
            <StatCard label="Active Vouchers" value={reports.summary?.totalActive || 0} icon="🎫" color="#6366f1" />
            <StatCard label="Expired Vouchers" value={reports.summary?.totalExpired || 0} icon="⏰" color="#ef4444" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flexWrap: 'wrap' }}>
            <div style={boxStyle}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <h3 style={{ margin: 0, fontWeight: 700 }}>🏅 Top Customers by Rewards</h3>
              </div>
              <div style={{ padding: 16 }}>
                {(reports.topCustomers || []).slice(0, 10).map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#6366f1', marginRight: 10 }}>#{i + 1}</span>
                      {c.customer?.firstName} {c.customer?.lastName}
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.customer?.email}</div>
                    </div>
                    <span style={{ fontWeight: 800, color: '#22c55e' }}>₹{c.totalEarned?.toFixed(0)}</span>
                  </div>
                ))}
                {!reports.topCustomers?.length && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No data yet</p>}
              </div>
            </div>

            <div style={boxStyle}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <h3 style={{ margin: 0, fontWeight: 700 }}>🏆 Top Campaigns</h3>
              </div>
              <div style={{ padding: 16 }}>
                {(reports.topCampaigns || []).map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#8b5cf6', marginRight: 10 }}>#{i + 1}</span>
                      {c.campaignName}
                      <div style={{ fontSize: 12 }}><StatusBadge status={c.status} /></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#22c55e', fontSize: 14 }}>₹{c.totalRewardsIssued?.toFixed(0) || 0}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.totalCustomersRewarded || 0} customers</div>
                    </div>
                  </div>
                ))}
                {!reports.topCampaigns?.length && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No data yet</p>}
              </div>
            </div>
          </div>
        </div>
      )}
      {!loading && activeTab === 'reports' && !reports && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>📊 Loading reports…</div>
      )}

      {/* ── SETTINGS ── */}
      {!loading && activeTab === 'settings' && settings && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ ...boxStyle, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ margin: '0 0 16px', fontWeight: 800 }}>⚙️ Global Reward Settings</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>These are platform-wide defaults. Individual campaign settings take priority.</p>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <input type="checkbox" checked={settings.rewardsEnabled} onChange={e => setSettings(s => ({ ...s, rewardsEnabled: e.target.checked }))} style={{ width: 18, height: 18 }} />
              <div>
                <div style={{ fontWeight: 700 }}>Rewards System Enabled</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>When disabled, no rewards are issued for any orders</div>
              </div>
            </label>

            {[
              { key: 'defaultVoucherExpiryDays', label: 'Default Voucher Expiry (days)', desc: 'Used when a campaign doesn\'t specify expiry', min: 1 },
              { key: 'maxActiveVouchersPerCustomer', label: 'Max Active Vouchers Per Customer', desc: '0 = unlimited', min: 0 },
              { key: 'maxRewardBalancePerCustomer', label: 'Max Reward Balance Per Customer (₹)', desc: '0 = unlimited', min: 0 },
            ].map(({ key, label, desc, min }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontWeight: 600, fontSize: 14 }}>{label}</label>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{desc}</p>
                <input type="number" min={min} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.07)', color: 'inherit', fontSize: 14, marginTop: 4 }}
                  value={settings[key] ?? 0} onChange={e => setSettings(s => ({ ...s, [key]: Number(e.target.value) }))} />
              </div>
            ))}

            <button style={{ ...btnPrimary, alignSelf: 'flex-start', opacity: settingsSaving ? 0.7 : 1 }} onClick={saveSettings} disabled={settingsSaving}>
              {settingsSaving ? '⏳ Saving…' : '✓ Save Settings'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
