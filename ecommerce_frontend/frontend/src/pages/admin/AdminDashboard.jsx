import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Users, FileCheck, ShoppingBag } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ sellers: 0, pendingKYC: 0, products: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const sellersRes = await api.get('/admin/sellers');
        const kycRes = await api.get('/admin/kyc');
        const prodRes = await api.get('/products');
        
        setStats({
          sellers: sellersRes.data.sellers?.length || 0,
          pendingKYC: kycRes.data.count || kycRes.data.sellers?.length || 0,
          products: prodRes.data.total || prodRes.data.products?.length || 0,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Admin Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Total Sellers</p>
            <h3 className="text-2xl font-bold">{stats.sellers}</h3>
          </div>
        </div>
        
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-warning/20 text-warning flex items-center justify-center">
            <FileCheck size={24} />
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Pending KYC</p>
            <h3 className="text-2xl font-bold">{stats.pendingKYC}</h3>
          </div>
        </div>
        
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Total Products</p>
            <h3 className="text-2xl font-bold">{stats.products}</h3>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 min-h-[400px]">
        <h2 className="text-xl font-bold mb-4">System Status</h2>
        <p className="text-text-muted">All systems are running smoothly.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
