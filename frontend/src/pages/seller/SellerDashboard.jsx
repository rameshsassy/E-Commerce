import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Package, TrendingUp, DollarSign } from 'lucide-react';

const SellerDashboard = () => {
  const [stats, setStats] = useState({ products: 0, pending: 0, sales: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Fetch real stats from the backend dashboard endpoint and profile
        const [dashboardRes, profileRes] = await Promise.all([
          api.get('/seller/dashboard').catch(() => ({ data: { data: { totalProducts: 0, totalValue: 0 } } })),
          api.get('/seller/profile')
        ]);
        
        const dashboardData = dashboardRes.data?.data || { totalProducts: 0, totalValue: 0 };
        const profileData = profileRes.data;

        setStats({
          products: dashboardData.totalProducts || 0,
          pending: profileData.kycStatus === 'pending' ? 1 : 0,
          sales: dashboardData.totalValue || 0
        });
      } catch (err) {
        console.error('Failed to fetch dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>
      
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

      <div className="glass-panel p-8 min-h-[400px]">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="text-center py-20 text-text-muted">
            <p>No recent activity.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
