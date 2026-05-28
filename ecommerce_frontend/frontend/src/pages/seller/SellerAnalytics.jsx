import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../utils/api';
import AnalyticsCard from '../../components/seller/AnalyticsCard';
import SalesChart from '../../components/seller/SalesChart';
import TopProducts from '../../components/seller/TopProducts';
import { IndianRupee, ShoppingBag, Package, Clock, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PerformanceOverviewCard from '../../components/seller/PerformanceOverviewCard';

const PRESETS = [
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last15', label: 'Last 15 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom' },
];

const formatDdMmYyyy = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = String(ymd).split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
};

const SellerAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rangePreset, setRangePreset] = useState('last7');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [rangeError, setRangeError] = useState('');

  const cacheRef = useRef(new Map());
  const inFlightRef = useRef(null);

  const makeCacheKey = (params) => JSON.stringify(params || {});

  const fetchAnalytics = async (params = {}, { initial = false } = {}) => {
    const key = makeCacheKey(params);
    const cached = cacheRef.current.get(key);
    if (cached) {
      setData(cached);
      if (initial) setLoading(false);
      return;
    }

    if (initial) setLoading(true);
    else setRefreshing(true);

    // Cancel any previous in-flight request (user toggling quickly)
    if (inFlightRef.current) {
      inFlightRef.current.abort();
    }
    const controller = new AbortController();
    inFlightRef.current = controller;

    try {
      const res = await api.get('/seller/analytics', { params, signal: controller.signal });
      const next = res.data.data;
      cacheRef.current.set(key, next);
      setData(next);
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      console.error('⚡️ Seller analytics fetch failed', err);
    } finally {
      if (initial) setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAnalytics({ preset: 'last7' }, { initial: true });
  }, []);

  // Auto-fetch on preset change (except custom)
  useEffect(() => {
    setRangeError('');
    if (rangePreset === 'custom') return;
    fetchAnalytics({ preset: rangePreset }, { initial: false });
  }, [rangePreset]);

  const onApplyCustom = () => {
    setRangeError('');
    if (!customFrom || !customTo) {
      setRangeError('Please select both start and end dates.');
      return;
    }
    if (customTo < customFrom) {
      setRangeError('End date must be after start date.');
      return;
    }
    fetchAnalytics({ preset: 'custom', from: customFrom, to: customTo }, { initial: false });
  };

  // Loading state – full screen spinner only on first load
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
        <div className="flex flex-col gap-6">
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

          {/* Date range controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-panel bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-glass-border">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-xl bg-white/10 border border-glass-border">
                <span className="inline-block w-5 h-5">📅</span>
              </div>
              <div className="font-semibold">
                {(data?.range?.from && data?.range?.to)
                  ? `${formatDdMmYyyy(data.range.from)} - ${formatDdMmYyyy(data.range.to)}`
                  : 'All time'}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <select
                value={rangePreset}
                onChange={(e) => setRangePreset(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white border border-glass-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {PRESETS.map((p) => (
                  <option key={p.value} value={p.value} className="text-black">
                    {p.label}
                  </option>
                ))}
              </select>

              {refreshing && (
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                  Refreshing…
                </div>
              )}

              {rangePreset === 'custom' && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white border border-glass-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <span className="text-white/70 hidden sm:block">to</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white border border-glass-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    onClick={onApplyCustom}
                    className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>

          {rangeError && (
            <div className="text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              {rangeError}
            </div>
          )}
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

        {/* Performance Overview */}
        <div className="flex items-center justify-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Performance Overview
          </h2>
        </div>

        {/* Performance Overview Cards (tables) */}
        <div className="space-y-6">
          <PerformanceOverviewCard
            icon={<Package size={18} />}
            title="Total Products Listed"
            total={data.performanceOverview?.productsListed?.total ?? 0}
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'inventory', label: 'Inventory/SKUs', align: 'right' },
            ]}
            rows={data.performanceOverview?.productsListed?.rows || []}
            onViewAll={() => navigate('/seller/products')}
          />

          <PerformanceOverviewCard
            icon={<IndianRupee size={18} />}
            title="Total Sale"
            total={`₹ ${(data.performanceOverview?.totalSales?.total ?? 0).toLocaleString()}/-`}
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'unitPrice', label: 'Cost per unit', align: 'right', render: (r) => `₹ ${Number(r.unitPrice || 0).toLocaleString()}/-` },
              { key: 'unitsSold', label: 'Units Sold', align: 'right' },
              { key: 'totalCost', label: 'Total Cost', align: 'right', render: (r) => `₹ ${Number(r.totalCost || 0).toLocaleString()}/-` },
            ]}
            rows={data.performanceOverview?.totalSales?.rows || []}
          />

          <PerformanceOverviewCard
            icon={<ShoppingBag size={18} />}
            title="Total individual orders"
            total={data.performanceOverview?.individualOrders?.total ?? 0}
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'unitPrice', label: 'Cost per unit', align: 'right', render: (r) => `₹ ${Number(r.unitPrice || 0).toLocaleString()}/-` },
              { key: 'unitsPurchased', label: 'Units purchased', align: 'right' },
              { key: 'customerName', label: 'Customer name' },
              { key: 'status', label: 'Status', align: 'right' },
            ]}
            rows={data.performanceOverview?.individualOrders?.rows || []}
          />

          <PerformanceOverviewCard
            icon={<ShoppingBag size={18} />}
            title="Total bulk orders"
            total={data.performanceOverview?.bulkOrders?.total ?? 0}
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'unitPrice', label: 'Cost per unit', align: 'right', render: (r) => `₹ ${Number(r.unitPrice || 0).toLocaleString()}/-` },
              { key: 'unitsPurchased', label: 'Units purchased', align: 'right' },
              { key: 'customerName', label: 'Customer name' },
              { key: 'status', label: 'Status', align: 'right' },
            ]}
            rows={data.performanceOverview?.bulkOrders?.rows || []}
            onViewAll={() => navigate('/seller/orders-enquiries')}
          />

          <PerformanceOverviewCard
            icon={<MapPin size={18} />}
            title="Store views"
            total={data.performanceOverview?.storeViews?.total ?? 0}
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'views', label: 'Views/sessions', align: 'right' },
            ]}
            rows={data.performanceOverview?.storeViews?.rows || []}
          />

          <PerformanceOverviewCard
            icon={<ShoppingBag size={18} />}
            title="Products that were added to the cart"
            total={data.performanceOverview?.addedToCart?.total ?? 0}
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'customers', label: '# Customers', align: 'right' },
            ]}
            rows={data.performanceOverview?.addedToCart?.rows || []}
          />

          <PerformanceOverviewCard
            icon={<Package size={18} />}
            title="Total Returns"
            total={data.performanceOverview?.returns?.total ?? 0}
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'customersCount', label: '# Customers', align: 'right' },
              { key: 'status', label: 'Status', align: 'right' },
            ]}
            rows={data.performanceOverview?.returns?.rows || []}
          />

          <PerformanceOverviewCard
            icon={<IndianRupee size={18} />}
            title="Total Refunds"
            total={data.performanceOverview?.refunds?.total ?? 0}
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'customersCount', label: '# Customers', align: 'right' },
              { key: 'refundStatus', label: 'Status', align: 'right' },
            ]}
            rows={data.performanceOverview?.refunds?.rows || []}
          />

          <PerformanceOverviewCard
            icon={<Package size={18} />}
            title="Total Replacements"
            total={data.performanceOverview?.replacements?.total ?? 0}
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'customersCount', label: '# Customers', align: 'right' },
            ]}
            rows={data.performanceOverview?.replacements?.rows || []}
          />

          <PerformanceOverviewCard
            icon={<Package size={18} />}
            title="Total Reviews"
            total={data.performanceOverview?.reviews?.total ?? 0}
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'averageReviews', label: 'Average Reviews', align: 'right', render: (r) => `${r.averageReviews} • ${r.customersCount} Customers` },
            ]}
            rows={data.performanceOverview?.reviews?.rows || []}
          />

          <PerformanceOverviewCard
            icon={<IndianRupee size={18} />}
            title="Average Sale Value (Individual)"
            total={`₹ ${Number(data.performanceOverview?.averageSaleValueIndividual?.total ?? 0).toLocaleString()}/-`}
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'unitPrice', label: 'Price per unit', align: 'right', render: (r) => `₹ ${Number(r.unitPrice || 0).toLocaleString()}/-` },
              { key: 'unitsSold', label: 'Unit sold', align: 'right' },
              { key: 'totalCost', label: 'Total Cost', align: 'right', render: (r) => `₹ ${Number(r.totalCost || 0).toLocaleString()}/-` },
            ]}
            rows={data.performanceOverview?.averageSaleValueIndividual?.rows || []}
          />

          <PerformanceOverviewCard
            icon={<Package size={18} />}
            title={`Active Products`}
            total={
              <span className="flex flex-col md:flex-row md:items-center md:gap-4">
                <span>{data.performanceOverview?.activeProducts?.total ?? 0}</span>
                <span className="text-[12px] md:text-[14px] font-medium text-[#6D7175]">
                  Total Inventory Value: ₹ {Number(data.performanceOverview?.activeProducts?.inventoryValue ?? 0).toLocaleString()}/-
                </span>
              </span>
            }
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'pricePerUnit', label: 'Price per unit', align: 'right', render: (r) => `₹ ${Number(r.pricePerUnit || 0).toLocaleString()}/-` },
              { key: 'skuUnits', label: 'SKU/Units', align: 'right' },
              { key: 'totalCost', label: 'Total Cost', align: 'right', render: (r) => `₹ ${Number(r.totalCost || 0).toLocaleString()}/-` },
            ]}
            rows={data.performanceOverview?.activeProducts?.rows || []}
          />

          <PerformanceOverviewCard
            icon={<Package size={18} />}
            title={`Inactive/Under Approval Products`}
            total={
              <span className="flex flex-col md:flex-row md:items-center md:gap-4">
                <span>{data.performanceOverview?.inactiveProducts?.total ?? 0}</span>
                <span className="text-[12px] md:text-[14px] font-medium text-[#6D7175]">
                  Total Inventory Value: ₹ {Number(data.performanceOverview?.inactiveProducts?.inventoryValue ?? 0).toLocaleString()}/-
                </span>
              </span>
            }
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'pricePerUnit', label: 'Price per unit', align: 'right', render: (r) => `₹ ${Number(r.pricePerUnit || 0).toLocaleString()}/-` },
              { key: 'skuUnits', label: 'SKU/Units', align: 'right' },
              { key: 'status', label: 'Status', align: 'right' },
            ]}
            rows={data.performanceOverview?.inactiveProducts?.rows || []}
          />

          <PerformanceOverviewCard
            icon={<Package size={18} />}
            title="Low Stock products"
            total={data.performanceOverview?.lowStockProducts?.total ?? 0}
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'sku', label: 'SKU', align: 'right' },
            ]}
            rows={data.performanceOverview?.lowStockProducts?.rows || []}
            onViewAll={() => navigate('/seller/products')}
          />

          <PerformanceOverviewCard
            icon={<ShoppingBag size={18} />}
            title="Total Customers"
            total={data.performanceOverview?.totalCustomersTable?.total ?? 0}
            columns={[
              { key: 'title', label: 'Product title' },
              { key: 'unitPrice', label: 'Price per unit', align: 'right', render: (r) => `₹ ${Number(r.unitPrice || 0).toLocaleString()}/-` },
              { key: 'unitsSold', label: 'Unit sold', align: 'right' },
              { key: 'totalCost', label: 'Total Cost', align: 'right', render: (r) => `₹ ${Number(r.totalCost || 0).toLocaleString()}/-` },
            ]}
            rows={data.performanceOverview?.totalCustomersTable?.rows || []}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Customers', value: data.performanceOverview?.customers?.totalCustomers ?? 0 },
              { label: 'New Customers', value: data.performanceOverview?.customers?.newCustomers ?? 0 },
              { label: 'Repeat Customers', value: data.performanceOverview?.customers?.repeatCustomers ?? 0 },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-2xl border border-[#E1E3E5] shadow-sm px-6 py-6 flex items-center justify-between">
                <div className="text-[13px] text-[#6D7175] font-medium">{c.label}</div>
                <div className="text-[28px] font-bold text-[#202223]">{c.value}</div>
              </div>
            ))}
          </div>
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
