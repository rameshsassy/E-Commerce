import React, { useMemo, useState, useEffect } from 'react';
import api from '../../utils/api';
import { Package, TrendingUp, DollarSign, Gift, ArrowRight, AlertCircle } from 'lucide-react';
import BulkInquiriesPanel from '../../components/bulk/BulkInquiriesPanel';
import SellerRecentActivity from '../../components/seller/SellerRecentActivity';
import SellerRecentActivityModal from '../../components/seller/SellerRecentActivityModal';
import LoadErrorMessage from '../../components/common/LoadErrorMessage';
import { getApiErrorMessage, isNetworkError } from '../../utils/apiErrors';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SellerDashboard = () => {
  const { user, mergeUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    products: 0,
    pending: 0,
    sales: 0,
    referralCreditsEarned: 0,
    successfulReferrals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityError, setActivityError] = useState('');
  const [activityNetworkError, setActivityNetworkError] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const sellerName = profile?.firstName || user?.firstName || user?.name || 'Seller';
  
  const planLabel = useMemo(() => {
    const activePlan = user?.subscriptionPlan || profile?.subscriptionPlan || 'free';
    if (activePlan === 'premium') return 'Premium';
    if (activePlan === 'pro') return 'Pro';
    return 'Free';
  }, [user?.subscriptionPlan, profile?.subscriptionPlan]);

  const isFree = planLabel === 'Free';

  const daysLeft = useMemo(() => {
    const validUntil = user?.subscriptionValidUntil || profile?.subscriptionValidUntil;
    if (!validUntil) return 0;
    const diffTime = new Date(validUntil) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [user?.subscriptionValidUntil, profile?.subscriptionValidUntil]);

  const showExpiryAlert = useMemo(() => {
    const isPremium = (user?.sellerType === 'premium' && user?.subscriptionActive) || 
                      (profile?.sellerType === 'premium' && profile?.subscriptionActive);
    return isPremium && daysLeft > 0 && daysLeft <= 30;
  }, [user?.sellerType, user?.subscriptionActive, profile?.sellerType, profile?.subscriptionActive, daysLeft]);

  const formattedExpiryDate = useMemo(() => {
    const validUntil = user?.subscriptionValidUntil || profile?.subscriptionValidUntil;
    if (!validUntil) return '';
    return new Date(validUntil).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, [user?.subscriptionValidUntil, profile?.subscriptionValidUntil]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Fetch real stats from the backend dashboard endpoint and profile
        const [dashboardRes, profileRes, activityRes] = await Promise.all([
          api.get('/seller/dashboard').catch(() => ({ data: { data: { totalProducts: 0, totalValue: 0, referralCreditsEarned: 0, successfulReferrals: 0 } } })),
          api.get('/seller/profile'),
          api.get('/seller/recent-activity?limit=5'),
        ]);
        
        const dashboardData = dashboardRes.data?.data || { totalProducts: 0, totalValue: 0, referralCreditsEarned: 0, successfulReferrals: 0 };
        const profileData = profileRes.data;
        setProfile(profileData);
        // Keep auth user in sync with plan fields (so sidebar and other pages update).
        mergeUser({
          sellerType: profileData.sellerType,
          subscriptionActive: profileData.subscriptionActive,
          subscriptionPlan: profileData.subscriptionPlan,
          subscriptionValidUntil: profileData.subscriptionValidUntil,
        });

        setStats({
          products: dashboardData.totalProducts || 0,
          pending: profileData.kycStatus === 'pending' ? 1 : 0,
          sales: dashboardData.totalValue || 0,
          referralCreditsEarned: dashboardData.referralCreditsEarned || 0,
          successfulReferrals: dashboardData.successfulReferrals || 0,
        });
        setActivities(activityRes.data?.activities || []);
        setActivityError('');
        setActivityNetworkError(false);
      } catch (err) {
        console.error('Failed to fetch dashboard', err);
        if (isNetworkError(err)) {
          setActivityNetworkError(true);
          setActivityError(getApiErrorMessage(err, 'Could not load recent activity'));
          setActivities([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [mergeUser]);

  useEffect(() => {
    if (!loading && window.location.hash === '#bulk-inquiries') {
      document.getElementById('bulk-inquiries')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  return (
    <div className="animate-fade-in w-full">
      <div className="bg-white border border-[#E1E3E5] rounded-2xl shadow-sm px-4 sm:px-6 py-4 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[#202223] truncate">
          <span className="text-lg sm:text-[22px] font-semibold">{greeting} {sellerName}</span>
          <span className="hidden sm:inline text-[#E1E3E5]">|</span>
          <span className="text-sm sm:text-[18px] font-medium text-[#6D7175]">
            Reward Earned: <span className="font-semibold text-[#202223]">₹ {stats.referralCreditsEarned || 0}/-</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          <div className="text-sm sm:text-[20px] font-medium text-[#202223]">
            Plan: {planLabel}
          </div>
          {isFree && (
            <button
              type="button"
              onClick={() => navigate('/seller/premium')}
              className="px-4 py-2 rounded-full bg-[#FFD700] hover:bg-[#F2C400] text-[#202223] font-semibold text-[13px] md:text-[14px] shadow-sm"
            >
              Upgrade
            </button>
          )}
        </div>
      </div>

      {showExpiryAlert && (
        <div className="mb-6 sm:mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle size={22} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm sm:text-base mb-0.5">Premium Subscription Expiring Soon</h3>
              <p className="text-amber-800 text-xs sm:text-sm leading-relaxed font-medium">
                Your Aashansh Premium subscription expires in <span className="font-extrabold text-amber-900">{daysLeft} days</span> (on {formattedExpiryDate}). Please renew now to maintain uninterrupted access to B2B bulk orders, advanced insights, and multiple store locations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/seller/premium')}
            className="w-full md:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all active:scale-95 shrink-0"
          >
            Renew Subscription Now
          </button>
        </div>
      )}

      <div className="glass-panel p-6 mb-8 rounded-2xl border border-glass-border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4 flex-1">
          <div className="h-12 w-12 rounded-xl bg-[#ffd401]/10 text-[#ffd401] flex items-center justify-center shrink-0">
            <Gift size={26} className="text-[#ffd401] fill-[#ffd401]/20" />
          </div>
          <div>
            <h2 className="text-lg font-bold mb-1 text-white">Refer and Earn</h2>
            <p className="text-sm text-text-muted max-w-md">
              Invite fellow sellers and earn exciting rewards on the go.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center px-4 shrink-0">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Successful Referrals
          </span>
          <div className="px-6 py-1 bg-[#ffd401] text-black font-bold rounded-lg shadow-sm">
            {stats.successfulReferrals || 0}
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/seller/refer-and-earn')}
          className="h-11 px-6 rounded-xl bg-[#ffd401] hover:bg-[#e6be00] text-black font-bold text-sm border-0 flex items-center gap-2 shrink-0 transition-transform active:scale-95 shadow-sm"
        >
          Start Referring Now <ArrowRight size={16} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              <Package size={24} />
            </div>
            <div>
              <p className="text-text-muted text-sm font-medium">Total Products</p>
              <h3 className="text-2xl font-bold">{stats.products}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/seller/products')}
            className="px-3 py-1.5 rounded-lg bg-[#ffd401] hover:bg-[#e6be00] text-black font-semibold text-xs transition-transform active:scale-95 shadow-sm"
          >
            View All
          </button>
        </div>
        
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-warning/20 text-warning flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Pending Actions</p>
            <h3 className="text-2xl font-bold">{stats.pending}</h3>
          </div>
        </div>
        
        <div className="glass-panel p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-text-muted text-sm font-medium">Total Sales</p>
              <h3 className="text-2xl font-bold">${stats.sales}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/seller/orders-enquiries')}
            className="px-3 py-1.5 rounded-lg bg-[#ffd401] hover:bg-[#e6be00] text-black font-semibold text-xs transition-transform active:scale-95 shadow-sm"
          >
            View All
          </button>
        </div>
      </div>

      <div className="glass-panel p-8 min-h-[200px] mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl font-bold text-white cursor-pointer hover:text-[#ffd401] transition-colors"
            onClick={() => setShowActivityModal(true)}
          >
            Recent Activity
          </h2>
          <button
            type="button"
            onClick={() => setShowActivityModal(true)}
            className="text-sm font-semibold text-[#ffd401] hover:text-[#e6be00] transition-colors"
          >
            View All
          </button>
        </div>
        <LoadErrorMessage
          error={activityError}
          isNetwork={activityNetworkError}
          onRetry={
            activityNetworkError
              ? async () => {
                  setLoading(true);
                  try {
                    const { data } = await api.get('/seller/recent-activity?limit=5');
                    setActivities(data?.activities || []);
                    setActivityError('');
                    setActivityNetworkError(false);
                  } catch (e) {
                    if (isNetworkError(e)) {
                      setActivityNetworkError(true);
                      setActivityError(getApiErrorMessage(e, 'Could not load recent activity'));
                    }
                  } finally {
                    setLoading(false);
                  }
                }
              : undefined
          }
          retrying={loading}
        />
        {!activityNetworkError && (
          <SellerRecentActivity activities={activities} loading={loading} />
        )}
      </div>

      <BulkInquiriesPanel isAdmin={false} title="Bulk order inquiries" />

      <SellerRecentActivityModal
        open={showActivityModal}
        onClose={() => setShowActivityModal(false)}
      />
    </div>
  );
};

export default SellerDashboard;
