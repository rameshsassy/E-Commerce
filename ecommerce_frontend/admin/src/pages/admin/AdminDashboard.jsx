import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Users, FileCheck, ShoppingBag, Package, Star, Clock, AlertTriangle, LifeBuoy, Boxes } from 'lucide-react';
import BulkInquiriesPanel from '../../components/bulk/BulkInquiriesPanel';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalSellers: 0, 
    premiumSellers: 0,
    totalProducts: 0, 
    totalOrders: 0, 
    totalRevenue: 0,
    pendingKYCs: 0,
    refundRequests: 0,
    pendingSupportTickets: 0,
    pendingBulkInquiries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/analytics');
        setStats((prev) => ({
          ...prev,
          ...data,
        }));
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (!loading && window.location.hash === '#bulk-inquiries') {
      document.getElementById('bulk-inquiries')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Platform Overview</h1>
        <p className="text-text-muted mt-2">Monitor marketplace health and operational metrics in real-time.</p>
      </div>
      
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 text-primary/10 transition-transform duration-500 group-hover:scale-110">
            <span className="font-serif italic text-[80px] font-bold">₹</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-glow">
              <span className="text-xl font-bold">₹</span>
            </div>
            <p className="text-text-muted font-medium">Total Revenue</p>
          </div>
          <h3 className="text-3xl font-bold z-10">₹{stats.totalRevenue.toLocaleString()}</h3>
        </div>

        <div className="glass-panel p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 text-secondary/10 transition-transform duration-500 group-hover:scale-110">
            <ShoppingBag size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <p className="text-text-muted font-medium">Total Orders</p>
          </div>
          <h3 className="text-3xl font-bold z-10">{stats.totalOrders.toLocaleString()}</h3>
        </div>

        <div className="glass-panel p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 text-success/10 transition-transform duration-500 group-hover:scale-110">
            <Users size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success/20 text-success flex items-center justify-center">
              <Users size={20} />
            </div>
            <p className="text-text-muted font-medium">Total Customers</p>
          </div>
          <h3 className="text-3xl font-bold z-10">{stats.totalUsers.toLocaleString()}</h3>
        </div>

        <div className="glass-panel p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 text-warning/10 transition-transform duration-500 group-hover:scale-110">
            <Package size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-warning/20 text-warning flex items-center justify-center">
              <Package size={20} />
            </div>
            <p className="text-text-muted font-medium">Products Listed</p>
          </div>
          <h3 className="text-3xl font-bold z-10">{stats.totalProducts.toLocaleString()}</h3>
        </div>
      </div>

      {/* Secondary Actionable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Seller Breakdown */}
        <div className="glass-panel p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-glass-border pb-4">
            <Users size={20} className="text-primary"/> Seller Ecosystem
          </h3>
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-glass-border">
              <span className="text-text-muted">Total Sellers</span>
              <span className="font-bold text-lg">{stats.totalSellers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-warning/30 hover:bg-surface-hover">
              <span className="flex items-center gap-2"><Star size={16} className="text-warning fill-warning/20"/> Premium Sellers</span>
              <span className="font-bold text-lg text-warning">{stats.premiumSellers}</span>
            </div>
          </div>
        </div>

        {/* Action Items (Alerts) */}
        <div className="glass-panel p-6 flex flex-col lg:col-span-2">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-glass-border pb-4">
            <AlertTriangle size={20} className="text-error"/> Needs Attention
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-4 bg-surface rounded-xl border border-glass-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center text-center gap-2 cursor-pointer group">
              <div className="p-3 bg-primary/10 text-primary rounded-full group-hover:scale-110 transition-transform">
                <FileCheck size={24} />
              </div>
              <p className="text-3xl font-bold">{stats.pendingKYCs}</p>
              <p className="text-sm text-text-muted">Pending KYCs</p>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-glass-border hover:border-error/50 transition-colors flex flex-col items-center justify-center text-center gap-2 cursor-pointer group">
              <div className="p-3 bg-error/10 text-error rounded-full group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
              <p className="text-3xl font-bold">{stats.refundRequests}</p>
              <p className="text-sm text-text-muted">Refund Requests</p>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-glass-border hover:border-secondary/50 transition-colors flex flex-col items-center justify-center text-center gap-2 cursor-pointer group">
              <div className="p-3 bg-secondary/10 text-secondary rounded-full group-hover:scale-110 transition-transform">
                <LifeBuoy size={24} />
              </div>
              <p className="text-3xl font-bold">{stats.pendingSupportTickets}</p>
              <p className="text-sm text-text-muted">Open Support Tickets</p>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-glass-border hover:border-warning/50 transition-colors flex flex-col items-center justify-center text-center gap-2 cursor-pointer group">
              <div className="p-3 bg-warning/10 text-warning rounded-full group-hover:scale-110 transition-transform">
                <Boxes size={24} />
              </div>
              <p className="text-3xl font-bold">{stats.pendingBulkInquiries ?? 0}</p>
              <p className="text-sm text-text-muted">Open bulk inquiries</p>
            </div>

          </div>
        </div>

      </div>

      <BulkInquiriesPanel isAdmin title="Bulk order inquiries (platform)" />
    </div>
  );
};

export default AdminDashboard;
