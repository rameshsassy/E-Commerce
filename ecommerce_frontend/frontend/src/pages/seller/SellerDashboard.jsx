import React, { useMemo, useState, useEffect } from 'react';
import api from '../../utils/api';
import { Package, TrendingUp, DollarSign } from 'lucide-react';
import BulkInquiriesPanel from '../../components/bulk/BulkInquiriesPanel';
import SellerRecentActivity from '../../components/seller/SellerRecentActivity';
import LoadErrorMessage from '../../components/common/LoadErrorMessage';
import { getApiErrorMessage, isNetworkError } from '../../utils/apiErrors';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SellerDashboard = () => {
  const { user, mergeUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ products: 0, pending: 0, sales: 0 });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityError, setActivityError] = useState('');
  const [activityNetworkError, setActivityNetworkError] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const sellerName = profile?.firstName || user?.firstName || user?.name || 'Seller';
  const planLabel = profile?.plan || (user?.sellerType === 'premium' && user?.subscriptionActive ? 'Premium' : 'Free');
  const isFree = planLabel === 'Free';

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Fetch real stats from the backend dashboard endpoint and profile
        const [dashboardRes, profileRes, activityRes] = await Promise.all([
          api.get('/seller/dashboard').catch(() => ({ data: { data: { totalProducts: 0, totalValue: 0 } } })),
          api.get('/seller/profile'),
          api.get('/seller/recent-activity'),
        ]);
        
        const dashboardData = dashboardRes.data?.data || { totalProducts: 0, totalValue: 0 };
        const profileData = profileRes.data;
        setProfile(profileData);
        // Keep auth user in sync with plan fields (so sidebar and other pages update).
        mergeUser({
          sellerType: profileData.sellerType,
          subscriptionActive: profileData.subscriptionActive,
        });

        setStats({
          products: dashboardData.totalProducts || 0,
          pending: profileData.kycStatus === 'pending' ? 1 : 0,
          sales: dashboardData.totalValue || 0
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
    <div className="animate-fade-in">
      <div className="bg-white border border-[#E1E3E5] rounded-2xl shadow-sm px-6 py-4 mb-8 flex items-center justify-between gap-4">
        <div className="text-[18px] md:text-[22px] font-semibold text-[#202223] truncate">
          {greeting} {sellerName}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-[16px] md:text-[20px] font-medium text-[#202223]">
            Plan: {planLabel}
          </div>
          {isFree && (
            <button
              type="button"
              onClick={() => navigate('/seller/subscription')}
              className="px-4 py-2 rounded-full bg-[#FFD700] hover:bg-[#F2C400] text-[#202223] font-semibold text-[13px] md:text-[14px] shadow-sm"
            >
              Upgrade
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Total Products</p>
            <h3 className="text-2xl font-bold">{stats.products}</h3>
          </div>
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
        
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Total Sales</p>
            <h3 className="text-2xl font-bold">${stats.sales}</h3>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 min-h-[200px] mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <LoadErrorMessage
          error={activityError}
          isNetwork={activityNetworkError}
          onRetry={
            activityNetworkError
              ? async () => {
                  setLoading(true);
                  try {
                    const { data } = await api.get('/seller/recent-activity');
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
    </div>
  );
};

export default SellerDashboard;
