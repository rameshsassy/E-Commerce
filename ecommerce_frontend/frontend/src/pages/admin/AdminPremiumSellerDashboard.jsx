import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function PremiumSellerDashboard() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const premiumFeatures = [
    {
      title: 'Bulk Purchase Inquiries',
      description: 'Receive high-volume business orders directly from companies and wholesalers.',
      status: 'Active',
    },
    {
      title: 'Premium Seller Badge',
      description: 'Build trust with customers using the verified premium seller identity.',
      status: 'Enabled',
    },
    {
      title: 'Advanced Analytics',
      description: 'Track revenue, conversion rate, top products, and customer locations.',
      status: 'Live',
    },
    {
      title: 'Priority Support',
      description: 'Get faster support response for operational issues and payouts.',
      status: 'Available',
    },
  ];

  const bulkInquiries = [
    {
      company: 'TCS Corporate Gifts',
      product: 'Handmade Eco Bags',
      quantity: '2,000 Units',
      status: 'Negotiation Pending',
    },
    {
      company: 'Women Wellness NGO',
      product: 'Organic Snacks Combo',
      quantity: '5,500 Units',
      status: 'Meeting Scheduled',
    },
  ];

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/admin/analytics');
        const data = res.data || {};
        // Map to structure used in UI
        const mapped = [
          { title: 'Total Revenue', value: `₹${data.totalRevenue || 0}` },
          { title: 'Bulk Leads', value: data.bulkLeads || data.totalOrders || 0 },
          { title: 'Products Sold', value: data.totalProducts || 0 },
          { title: 'Premium Orders', value: data.premiumOrders || data.pendingOrders || 0 },
        ];
        setMetrics(mapped);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError('Failed to load dashboard metrics');
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold mb-4">
                ⭐ Premium Seller
              </div>
              <h1 className="text-4xl font-bold">Welcome Back, Artisan Hub</h1>
              <div className="text-slate-300 mt-2 max-w-2xl flex items-center gap-2 flex-wrap">
                <span>Manage bulk inquiries, monitor premium analytics, and grow your business with</span>
                <span className="inline-flex items-center gap-2">
                  <img src="/brand/aashansh-logo.png" alt="Brand logo" className="h-5 w-auto object-contain" />
                  <span className="font-semibold text-white">Premium</span>
                </span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 min-w-[260px]">
              <h2 className="text-lg font-semibold">Subscription Status</h2>
              <p className="text-3xl font-bold mt-2">ACTIVE</p>
              <p className="text-sm text-slate-300 mt-1">Renewal Date: 24 June 2026</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading ? (
            <p className="text-slate-600 col-span-full">Loading...</p>
          ) : error ? (
            <p className="text-red-600 col-span-full font-medium">{error}</p>
          ) : (
            metrics.map((metric) => (
              <div
                key={metric.title}
                className="bg-white rounded-3xl shadow-md p-6 border border-slate-200 text-slate-900"
              >
                <p className="text-slate-600 text-sm font-medium">{metric.title}</p>
                <h2 className="text-3xl font-bold mt-2 text-slate-900 tabular-nums">{metric.value}</h2>
              </div>
            ))
          )}
        </div>

        {/* Features */}
        <div className="bg-white rounded-3xl shadow-md p-6 border border-slate-200 text-slate-900">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-2xl font-bold text-slate-900">Premium Features</h2>
            <button
              type="button"
              className="bg-slate-900 text-white px-5 py-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Manage Subscription
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {premiumFeatures.map((feature) => (
              <div
                key={feature.title}
                className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition bg-slate-50/80"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <span className="shrink-0 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                    {feature.status}
                  </span>
                </div>
                <p className="text-slate-600 mt-3 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bulk Inquiry Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-md p-6 border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-slate-900">Bulk Purchase Inquiries</h2>
              <button
                type="button"
                className="bg-amber-400 text-slate-900 px-4 py-2 rounded-xl font-semibold hover:bg-amber-300 transition-colors"
              >
                View All
              </button>
            </div>

            <div className="space-y-4">
              {bulkInquiries.map((inquiry, index) => (
                <div
                  key={index}
                  className="border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{inquiry.company}</h3>
                    <p className="text-slate-600 text-sm mt-1">Product: {inquiry.product}</p>
                    <p className="text-slate-600 text-sm">Quantity Required: {inquiry.quantity}</p>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className="bg-sky-100 text-sky-900 px-3 py-1 rounded-full text-sm font-medium">
                      {inquiry.status}
                    </span>
                    <button
                      type="button"
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm hover:bg-slate-800 transition-colors"
                    >
                      Open Discussion
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="bg-white rounded-3xl shadow-md p-6 space-y-5 border border-slate-200 text-slate-900">
            <h2 className="text-2xl font-bold text-slate-900">Premium Benefits</h2>

            <div className="space-y-4">
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/80">
                <h3 className="font-semibold text-slate-900">Bulk Orders Access</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Receive direct B2B inquiries from organizations and enterprises.
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/80">
                <h3 className="font-semibold text-slate-900">Higher Visibility</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Premium products get more homepage visibility and trust badges.
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/80">
                <h3 className="font-semibold text-slate-900">Advanced Reports</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Understand customer locations, sales growth, and top categories.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Explanation */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-700">
          <h2 className="text-3xl font-bold mb-6 text-white">How Premium Seller Workflow Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              'Seller purchases Premium Plan via Razorpay.',
              'Bulk Purchase button becomes visible on product pages.',
              'Business buyers submit bulk inquiries with quantity requirements.',
              'Seller, buyer, and platform team coordinate pricing & fulfillment.',
            ].map((step, index) => (
              <div key={index} className="bg-slate-800/90 rounded-2xl p-5 border border-slate-600">
                <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-bold mb-4">
                  {index + 1}
                </div>
                <p className="text-slate-100 text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
