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

  const isPremium = user?.sellerType === 'premium' && user?.subscriptionActive;

  const navigate = useNavigate();

  const applyPremiumResponse = (data) => {
    mergeUser({
      sellerType: data.sellerType,
      subscriptionActive: data.subscriptionActive,
      bulkPurchaseEnabled: data.bulkPurchaseEnabled,
    });
  };

  const handleUpgrade = async () => {
    setBanner(null);
    setProcessing(true);
    try {
      const { data } = await api.post('/seller/upgrade');
      applyPremiumResponse(data);
      setBannerTone('success');
      setBanner(data.message || 'Premium Activated Successfully');
    } catch (err) {
      console.error('Upgrade failed', err);
      setBannerTone('error');
      setBanner(
        err.response?.data?.message || 'Failed to upgrade to premium.'
      );
    }
    setProcessing(false);
  };

  return (
    <div className="p-0 sm:p-2 md:p-4 animate-fade-in w-full max-w-5xl mx-auto">
      <h1 className="seller-page-title flex flex-wrap items-center gap-2 sm:gap-3">
        <Zap className="text-warning fill-warning/20 shrink-0" size={28} />
        Seller Subscription Plans
      </h1>

      {banner && (
        <div
          className={`mb-6 p-4 rounded-xl border text-center text-sm font-medium ${
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
                onClick={() => navigate('/seller/premium')}
              >
                View premium overview
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

      {isPremium ? (
        <div className="glass-panel seller-panel rounded-3xl border border-success/30 bg-success/5 flex flex-col items-center justify-center text-center">
          <ShieldCheck size={48} className="sm:hidden text-success mb-4" />
          <ShieldCheck size={64} className="hidden sm:block text-success mb-4" />
          <h2 className="text-2xl font-bold text-success mb-2">
            You are a Premium Seller!
          </h2>
          <p className="text-text-muted mb-6">
            Your bulk purchase feature is enabled and your account is active.
          </p>
          <div className="flex flex-col gap-2 max-w-md w-full bg-surface p-4 rounded-xl text-left border border-glass-border">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-primary" /> Bulk Purchase
              Option Enabled
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-primary" /> Priority
              Customer Support
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-primary" /> Reduced
              Commission Rates
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="glass-panel seller-panel rounded-3xl border border-glass-border flex flex-col opacity-80">
            <h2 className="text-xl font-bold mb-2">Standard Seller</h2>
            <div className="text-3xl font-black mb-6">Free</div>

            <div className="flex-1 flex flex-col gap-4 text-text-muted text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-success" /> Unlimited
                standard product uploads
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-success" /> Standard
                seller dashboard
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-success" /> Basic
                analytics
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <CheckCircle size={16} className="text-error" /> No bulk
                purchase inquiries
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <CheckCircle size={16} className="text-error" /> No B2B lead
                generation
              </div>
            </div>

            <button
              type="button"
              className="btn w-full mt-8 py-3 bg-surface text-text-muted cursor-not-allowed font-medium rounded-xl border border-glass-border"
              disabled
            >
              Current Plan
            </button>
          </div>

          <div className="glass-panel seller-panel rounded-3xl border-2 border-primary relative overflow-hidden flex flex-col shadow-glow">
            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] sm:text-xs font-black uppercase tracking-wider py-1 px-6 sm:px-8 rotate-45 translate-x-4 sm:translate-x-6 translate-y-3 sm:translate-y-4 shadow-lg">
              Recommended
            </div>

            <h2 className="text-lg sm:text-xl font-bold mb-2 text-primary pr-8">
              Premium Seller
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-2 mb-1">
              <div className="text-3xl sm:text-4xl font-black">₹9,125</div>
              <div className="text-text-muted text-sm pb-0 sm:pb-1">
                / year (+ 18% GST)
              </div>
            </div>
            <div className="text-xs text-error font-semibold mb-5 text-left">
              (Non-refundable)
            </div>

            <div className="flex-1 flex flex-col gap-4 text-sm mb-8">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle size={16} className="text-primary" /> Enable
                &quot;Bulk Purchase&quot; option on products
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle size={16} className="text-primary" /> Receive
                direct B2B wholesale inquiries
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle size={16} className="text-primary" /> Private
                price negotiation chat
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle size={16} className="text-primary" /> Custom
                quantity and shipping terms
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle size={16} className="text-primary" /> Dedicated
                account manager
              </div>
            </div>

            <div className="bg-surface/50 p-4 rounded-xl border border-primary/20 mb-6 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Base Price</span>
                <span>₹9,125.00</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>GST (18%)</span>
                <span>₹1,642.50</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-primary/20 mt-2">
                <span>Total</span>
                <span>₹10,767.50</span>
              </div>
              <div className="text-[11px] text-right text-text-muted italic mt-1">
                * Amount is non-refundable
              </div>
            </div>

            <button
              type="button"
              disabled={processing}
              onClick={handleUpgrade}
              className="btn-primary w-full py-3 font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {processing ? 'Processing...' : 'Upgrade to Premium'}
            </button>

            <p className="text-xs text-center text-text-muted mt-4 flex items-center justify-center gap-1">
              <ShieldCheck size={14} /> Premium activates instantly
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerSubscription;
