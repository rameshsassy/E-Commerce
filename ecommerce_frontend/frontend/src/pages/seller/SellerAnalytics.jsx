import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import AnalyticsCard from '../../components/seller/AnalyticsCard';
import SalesChart from '../../components/seller/SalesChart';
import TopProducts from '../../components/seller/TopProducts';
import { IndianRupee, ShoppingBag, Package, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const SellerAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch analytics once on mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/seller/analytics');
        setData(res.data.data);
      } catch (err) {
        console.error('⚡️ Seller analytics fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Loading state – full screen spinner with gradient background
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error / empty data state
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <p className="text-text-muted">Unable to load analytics – please try again later.</p>
      </div>
    );
  }

  // Main dashboard UI – premium glass‑morphism + subtle animation
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header with Logo */}
        <div className="text-center flex flex-col items-center gap-2">
          <Link to="/" className="font-black text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">
            AASHANSH
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">
            Seller Analytics
          </h1>
          <p className="mt-1 text-base text-gray-200">
            Dive deep into your store's performance and discover growth opportunities.
          </p>
        </div>

        {/* KPI Cards – each wrapped in a glass panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnalyticsCard
            title="Total Revenue"
            value={data.totalRevenue.toLocaleString()}
            prefix="Rs. "
            icon={<IndianRupee className="text-primary" />}
            trend={data.monthlyGrowth}
            className="glass-panel bg-white/5 backdrop-blur-md"
          />
          <AnalyticsCard
            title="Total Orders"
            value={data.totalOrders}
            icon={<ShoppingBag className="text-primary" />}
            className="glass-panel bg-white/5 backdrop-blur-md"
          />
          <AnalyticsCard
            title="Products Sold"
            value={data.productsSold}
            icon={<Package className="text-primary" />}
            className="glass-panel bg-white/5 backdrop-blur-md"
          />
          <AnalyticsCard
            title="Pending Orders"
            value={data.pendingOrders}
            icon={<Clock className="text-primary" />}
            className="glass-panel bg-white/5 backdrop-blur-md"
          />
        </div>

        {/* Charts & Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales chart – occupies two columns on large screens */}
          <div className="lg:col-span-2 glass-panel bg-white/5 backdrop-blur-md p-6 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">Sales Over Time</h2>
            <SalesChart data={data.salesChart} />
          </div>

          {/* Side panel – top products + top locations */}
          <div className="glass-panel bg-white/5 backdrop-blur-md p-6 rounded-2xl flex flex-col space-y-6">
            <TopProducts products={data.topProducts} />
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
                <MapPin className="text-primary" size={20} /> Top Locations
              </h3>
              {data.topLocations.length === 0 ? (
                <p className="text-text-muted">No location data yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.topLocations.map((loc, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between items-center p-3 bg-surface/10 rounded-xl border border-glass-border hover:border-primary/30 transition-colors"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <MapPin size={16} className="text-primary" /> {loc.city}
                      </span>
                      <span className="badge bg-primary/20 text-primary">{loc.count} Orders</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAnalytics;
