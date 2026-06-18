import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { CheckCircle, Zap, ShieldCheck } from 'lucide-react';

const SellerSubscription = () => {
  const { user, mergeUser } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [banner, setBanner] = useState(null);
  const [bannerTone, setBannerTone] = useState('success');

  const [proVoucher, setProVoucher] = useState("");
  const [proVoucherInfo, setProVoucherInfo] = useState(null);
  const [premiumVoucher, setPremiumVoucher] = useState("");
  const [premiumVoucherInfo, setPremiumVoucherInfo] = useState(null);

  const activePlan = user?.subscriptionPlan || 'free';
  const isPremiumActive = user?.subscriptionActive && activePlan === 'premium';
  const isProActive = user?.subscriptionActive && activePlan === 'pro';
  const isFree = !user?.subscriptionActive || activePlan === 'free';

  const navigate = useNavigate();

  const applyPremiumResponse = (data) => {
    mergeUser({
      sellerType: data.sellerType,
      subscriptionActive: data.subscriptionActive,
      subscriptionPlan: data.subscriptionPlan,
      subscriptionValidUntil: data.subscriptionValidUntil,
      bulkPurchaseEnabled: data.bulkPurchaseEnabled,
    });
  };

  const handleApplyVoucher = async (planCode) => {
    const code = planCode === 'pro' ? proVoucher : premiumVoucher;
    if (!code) return;
    try {
      const { data } = await api.post('/seller/vouchers/validate-upgrade', {
        voucherCode: code,
        plan: planCode,
      });
      if (planCode === 'pro') {
        setProVoucherInfo(data);
      } else {
        setPremiumVoucherInfo(data);
      }
      setBannerTone('success');
      setBanner(`Voucher applied successfully! Discount of ₹${data.discountAmount.toLocaleString('en-IN')} applied.`);
    } catch (err) {
      setBannerTone('error');
      setBanner(err.response?.data?.message || 'Invalid voucher code');
      if (planCode === 'pro') {
        setProVoucherInfo(null);
      } else {
        setPremiumVoucherInfo(null);
      }
    }
  };

  const handleUpgrade = async (planCode) => {
    alert("Pro and Premium versions are coming soon.");
    return;

    const voucherInfo = planCode === 'pro' ? proVoucherInfo : premiumVoucherInfo;
    const voucherCode = voucherInfo?.voucherCode || null;

    setBanner(null);
    setProcessing(true);
    try {
      const { data } = await api.post('/seller/upgrade', { plan: planCode, voucherCode });
      applyPremiumResponse(data);
      setBannerTone('success');
      setBanner(
        voucherCode && voucherInfo?.finalAmount === 0
          ? 'Voucher Applied Successfully. No Payment Required. Plan upgraded.'
          : data.message || `${planCode.toUpperCase()} Plan Activated Successfully`
      );
    } catch (err) {
      console.error('Upgrade failed', err);
      setBannerTone('error');
      setBanner(
        err.response?.data?.message || `Failed to upgrade to ${planCode}.`
      );
    }
    setProcessing(false);
  };

  return (
    <div className="p-0 sm:p-2 md:p-4 animate-fade-in w-full max-w-6xl mx-auto space-y-8">
      <h1 className="seller-page-title flex flex-wrap items-center gap-2 sm:gap-3">
        <Zap className="text-warning fill-warning/20 shrink-0" size={28} />
        Seller Subscription Plans
      </h1>

      {banner && (
        <div
          className={`p-4 rounded-xl border text-center text-sm font-medium ${
            bannerTone === 'success'
              ? 'bg-success/15 border-success text-success'
              : 'bg-error/15 border-error text-error'
          }`}
        >
          {banner}
          {bannerTone === 'success' && (
            <div className="mt-3 flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                className="btn btn-secondary text-sm py-2 px-4"
                onClick={() => {
                  if (activePlan === 'premium') {
                    navigate('/seller/premium');
                  } else {
                    navigate('/seller/dashboard');
                  }
                }}
              >
                View Plan Overview
              </button>
              <button
                type="button"
                className="text-sm text-primary underline"
                onClick={() => setBanner(null)}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Plan Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Card 1: Standard Free Plan */}
        <div className={`glass-panel seller-panel rounded-3xl border flex flex-col transition-all ${
          isFree 
            ? 'border-indigo-400/40 bg-indigo-50/5 shadow-inner' 
            : 'border-glass-border opacity-75'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-bold">Standard Seller</h2>
            {isFree && (
              <span className="badge bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold py-1 px-2.5 rounded-full text-xs">
                Active Plan
              </span>
            )}
          </div>
          <div className="text-3xl font-black mb-6">Free</div>

          <div className="flex-1 flex flex-col gap-4 text-text-muted text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-success" /> Brand Store/s: 1
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-success" /> Unlimited standard product listing
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-success" /> Category Selection: 1
            </div>
            <div className="flex items-center gap-2 opacity-50">
              <CheckCircle size={16} className="text-error text-red-500" /> Digital ads: NA
            </div>
            <div className="flex items-center gap-2 opacity-50">
              <CheckCircle size={16} className="text-error text-red-500" /> Digital Media Promotion: NA
            </div>
            <div className="flex items-center gap-2 opacity-50">
              <CheckCircle size={16} className="text-error text-red-500" /> B2B Listing: NA
            </div>
            <div className="flex items-center gap-2 opacity-50">
              <CheckCircle size={16} className="text-error text-red-500" /> Fundraising: NA
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-success" /> Refer and Earn: Basic Program
            </div>
          </div>

          <button
            type="button"
            className="w-full mt-8 py-3 bg-surface text-text-muted cursor-not-allowed font-medium rounded-xl border border-glass-border"
            disabled
          >
            {isFree ? 'Current Plan' : 'Free Tier'}
          </button>
        </div>

        {/* Card 2: Pro Plan */}
        <div className={`glass-panel seller-panel rounded-3xl border flex flex-col transition-all relative overflow-hidden ${
          isProActive 
            ? 'border-2 border-indigo-500 shadow-glow bg-indigo-950/20' 
            : 'border-glass-border'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-bold pr-8 text-indigo-400">Pro Seller</h2>
            {isProActive && (
              <span className="badge bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold py-1 px-2.5 rounded-full text-xs">
                Active Plan
              </span>
            )}
          </div>
          <div className="flex flex-col mb-1">
            <div className="text-3xl font-black">₹9,125</div>
            <div className="text-text-muted text-xs">/ year (+ 18% GST)</div>
          </div>
          <div className="text-xs text-error font-semibold mb-6">
            (Non-refundable)
          </div>

          <div className="flex-1 flex flex-col gap-4 text-sm mb-6">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-indigo-400" /> Brand Store/s: 5
            </div>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-indigo-400" /> Unlimited product listing
            </div>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-indigo-400" /> Category Selection: Multiple
            </div>
            <div className="flex items-center gap-2 font-medium opacity-50">
              <CheckCircle size={16} className="text-error text-red-500" /> Digital ads: NA
            </div>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-indigo-400" /> Digital Media Promotion: Yes (Limited)
            </div>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-indigo-400" /> B2B Listing: Yes
            </div>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-indigo-400" /> Fundraising*: Yes
            </div>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-indigo-400" /> Refer and Earn: Pro Program
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-muted mb-1.5 text-left">Apply Upgrade Voucher</label>
            {proVoucherInfo ? (
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs">
                <span className="text-emerald-400 font-medium">
                  ✓ {proVoucherInfo.voucherCode} applied
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setProVoucherInfo(null);
                    setProVoucher("");
                  }}
                  className="text-text-muted hover:text-white text-[11px] font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER VOUCHER"
                  value={proVoucher}
                  onChange={(e) => setProVoucher(e.target.value.toUpperCase())}
                  className="flex-1 bg-white/5 border border-glass-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 uppercase"
                />
                <button
                  type="button"
                  onClick={() => handleApplyVoucher('pro')}
                  className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <div className="bg-surface/50 p-4 rounded-xl border border-indigo-500/20 mb-6 flex flex-col gap-2 text-xs">
            <div className="flex justify-between text-text-muted">
              <span>Base Price</span>
              <span>₹9,125.00</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>GST (18%)</span>
              <span>₹1,642.50</span>
            </div>
            {proVoucherInfo ? (
              <>
                <div className="flex justify-between text-text-muted pt-2 border-t border-indigo-500/20">
                  <span>Total Payable</span>
                  <span>₹10,767.50</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Voucher Discount ({proVoucherInfo.voucherCode})</span>
                  <span>-₹{proVoucherInfo.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-indigo-500/20 mt-1">
                  <span>Final Amount</span>
                  <span className="text-indigo-400">₹{proVoucherInfo.finalAmount.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-indigo-500/20 mt-1">
                <span>Total Payable</span>
                <span className="text-indigo-400">₹10,767.50</span>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={processing || isProActive || isPremiumActive}
            onClick={() => handleUpgrade('pro')}
            className={`w-full py-3 font-bold rounded-xl shadow-lg transition-all ${
              isProActive 
                ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 cursor-default' 
                : isPremiumActive
                ? 'bg-slate-100/10 text-slate-500 cursor-not-allowed border border-glass-border'
                : 'btn-primary bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {processing ? 'Processing...' : isProActive ? 'Active Plan' : isPremiumActive ? 'Downgrade NA' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* Card 3: Premium Plan */}
        <div className={`glass-panel seller-panel rounded-3xl border flex flex-col transition-all relative overflow-hidden ${
          isPremiumActive 
            ? 'border-2 border-amber-500 shadow-glow bg-amber-950/20' 
            : 'border-glass-border'
        }`}>
          <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider py-1 px-8 rotate-45 translate-x-5 translate-y-3 shadow-md">
            Best Value
          </div>

          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-bold pr-8 text-amber-500">Premium Seller</h2>
            {isPremiumActive && (
              <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold py-1 px-2.5 rounded-full text-xs">
                Active Plan
              </span>
            )}
          </div>
          <div className="flex flex-col mb-1">
            <div className="text-3xl font-black">₹1,98,000</div>
            <div className="text-text-muted text-xs">/ year (+ 18% GST)</div>
          </div>
          <div className="text-xs text-error font-semibold mb-6">
            (Non-refundable)
          </div>

          <div className="flex-1 flex flex-col gap-4 text-sm mb-6">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-amber-500" /> Brand Store/s: Unlimited
            </div>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-amber-500" /> Unlimited product listing
            </div>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-amber-500" /> Category Selection: Multiple
            </div>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-amber-500" /> Digital ads: Yes
            </div>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-amber-500" /> Digital Media Promotion: Yes
            </div>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-amber-500" /> B2B Listing: Yes (Premium)
            </div>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-amber-500" /> Fundraising*: Yes
            </div>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={16} className="text-amber-500" /> Refer and Earn: Premium Program
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-muted mb-1.5 text-left">Apply Upgrade Voucher</label>
            {premiumVoucherInfo ? (
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs">
                <span className="text-emerald-400 font-medium">
                  ✓ {premiumVoucherInfo.voucherCode} applied
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPremiumVoucherInfo(null);
                    setPremiumVoucher("");
                  }}
                  className="text-text-muted hover:text-white text-[11px] font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER VOUCHER"
                  value={premiumVoucher}
                  onChange={(e) => setPremiumVoucher(e.target.value.toUpperCase())}
                  className="flex-1 bg-white/5 border border-glass-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 uppercase"
                />
                <button
                  type="button"
                  onClick={() => handleApplyVoucher('premium')}
                  className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black rounded-xl transition-all"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <div className="bg-surface/50 p-4 rounded-xl border border-amber-500/20 mb-6 flex flex-col gap-2 text-xs">
            <div className="flex justify-between text-text-muted">
              <span>Base Price</span>
              <span>₹1,98,000.00</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>GST (18%)</span>
              <span>₹35,640.00</span>
            </div>
            {premiumVoucherInfo ? (
              <>
                <div className="flex justify-between text-text-muted pt-2 border-t border-amber-500/20">
                  <span>Total Payable</span>
                  <span>₹2,33,640.00</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Voucher Discount ({premiumVoucherInfo.voucherCode})</span>
                  <span>-₹{premiumVoucherInfo.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-amber-500/20 mt-1">
                  <span>Final Amount</span>
                  <span className="text-amber-500">₹{premiumVoucherInfo.finalAmount.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-amber-500/20 mt-1">
                <span>Total Payable</span>
                <span className="text-amber-500">₹2,33,640.00</span>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={processing || isPremiumActive}
            onClick={() => handleUpgrade('premium')}
            className={`w-full py-3 font-bold rounded-xl shadow-lg transition-all ${
              isPremiumActive 
                ? 'bg-amber-600/30 text-amber-500 border border-amber-500/30 cursor-default' 
                : 'btn-primary bg-amber-500 hover:bg-amber-600 text-black hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {processing ? 'Processing...' : isPremiumActive ? 'Active Plan' : 'Upgrade to Premium'}
          </button>
        </div>

      </div>

      <div className="text-center text-xs text-text-muted flex items-center justify-center gap-1.5 pt-4">
        <ShieldCheck size={16} className="text-emerald-500" />
        <span>Subscribed plans activate instantly. Management by Super Admin dashboard.</span>
      </div>
    </div>
  );
};

export default SellerSubscription;
