import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  Tag, 
  IndianRupee, 
  AlertCircle, 
  Loader2, 
  Info 
} from 'lucide-react';

export default function SellerInvoices() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data lists from backend
  const [subYears, setSubYears] = useState([]);
  const [salesProducts, setSalesProducts] = useState([]);
  const [referralPayouts, setReferralPayouts] = useState([]);

  // Selections
  const [selectedSubYear, setSelectedSubYear] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedPayout, setSelectedPayout] = useState('');

  // Date ranges
  const [salesStart, setSalesStart] = useState('');
  const [salesEnd, setSalesEnd] = useState('');
  const [referralStart, setReferralStart] = useState('');
  const [referralEnd, setReferralEnd] = useState('');

  // Toast / Banner feedback state
  const [banner, setBanner] = useState(null);
  const [bannerTone, setBannerTone] = useState('success');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [yearsRes, productsRes, payoutsRes] = await Promise.all([
        api.get('/seller/invoices/subscription/years'),
        api.get('/seller/invoices/sales/products'),
        api.get('/seller/invoices/referrals/payouts')
      ]);

      if (yearsRes.data?.success) setSubYears(yearsRes.data.years);
      if (productsRes.data?.success) setSalesProducts(productsRes.data.products);
      if (payoutsRes.data?.success) setReferralPayouts(payoutsRes.data.payouts);

    } catch (err) {
      console.error('Error fetching invoices data:', err);
      setError(err.response?.data?.message || 'Failed to fetch invoice details from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async ({ endpoint, params, filename, action, validationValue, validationMsg }) => {
    if (validationValue !== undefined && !validationValue) {
      setBannerTone('error');
      setBanner(validationMsg || 'Please make a selection first.');
      return;
    }

    try {
      setActionLoading(true);
      setBanner(null);

      // Fetch the PDF stream as a Blob (includes Authorization header automatically)
      const response = await api.get(endpoint, {
        params: { ...params, action },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      if (action === 'view') {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      let errorMsg = 'Failed to generate PDF document. Please try again.';
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const parsed = JSON.parse(text);
          if (parsed.message) errorMsg = parsed.message;
        } catch (e) {
          // Response is not JSON
        }
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setBannerTone('error');
      setBanner(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-fade-in">
        <Loader2 className="animate-spin text-amber-500" size={48} />
        <p className="text-text-muted text-sm font-medium">Fetching your invoices and payout data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-4 animate-fade-in max-w-md mx-auto">
        <AlertCircle className="text-error" size={48} />
        <h2 className="text-lg font-bold text-white">Failed to Load Invoices</h2>
        <p className="text-text-muted text-sm">{error}</p>
        <button 
          onClick={fetchData}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-6 rounded-xl transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-2 md:p-4 animate-fade-in w-full max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <FileText className="text-amber-500 fill-amber-500/10" size={32} />
        <h1 className="seller-page-title text-3xl font-black text-white m-0">Invoices</h1>
      </div>

      {/* Global Notification Banner */}
      {banner && (
        <div className={`p-4 rounded-xl border text-center text-sm font-medium animate-slide-in ${
          bannerTone === 'success'
            ? 'bg-success/15 border-success text-success'
            : 'bg-error/15 border-error text-error'
        }`}>
          {banner}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1. Subscription Invoice Section                      */}
      {/* ---------------------------------------------------- */}
      <div className="glass-panel seller-panel rounded-3xl border border-glass-border p-6 md:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Download your subscription invoice
        </h2>
        <p className="text-text-muted text-sm max-w-2xl leading-relaxed">
          A new improved version of reports now available for you to download. You can now select the specific year for which you would like to see the invoice.
        </p>

        {subYears.length === 0 ? (
          <div className="flex items-center gap-2 bg-white/5 border border-glass-border p-4 rounded-2xl text-text-muted text-sm">
            <Info size={16} className="text-amber-500" />
            <span>No subscription invoices found. (Only premium/pro plans generate invoices).</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-w-md">
              <label className="block text-xs font-semibold text-text-muted mb-2">Select subscription year range</label>
              <select
                value={selectedSubYear}
                onChange={(e) => setSelectedSubYear(e.target.value)}
                className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="" className="bg-slate-900">-- Select Year --</option>
                {subYears.map((year) => (
                  <option key={year} value={year} className="bg-slate-900">{year}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => handleAction({
                  endpoint: '/seller/invoices/subscription/download',
                  params: { yearRange: selectedSubYear },
                  filename: `subscription_invoice_${selectedSubYear.replace(/\s+/g, '_')}.pdf`,
                  action: 'download',
                  validationValue: selectedSubYear,
                  validationMsg: 'Please select a subscription year range before downloading.'
                })}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-2.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm flex items-center gap-2"
              >
                <Download size={16} /> Download
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction({
                  endpoint: '/seller/invoices/subscription/download',
                  params: { yearRange: selectedSubYear },
                  filename: `subscription_invoice_${selectedSubYear.replace(/\s+/g, '_')}.pdf`,
                  action: 'view',
                  validationValue: selectedSubYear,
                  validationMsg: 'Please select a subscription year range before viewing.'
                })}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-2.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm flex items-center gap-2"
              >
                <Eye size={16} /> View
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. Sales Invoice Section                             */}
      {/* ---------------------------------------------------- */}
      <div className="glass-panel seller-panel rounded-3xl border border-glass-border p-6 md:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white">
          Download your sales invoice
        </h2>
        <p className="text-text-muted text-sm leading-relaxed">
          This is a detailed list of product sale invoices. You can now select the specific product or date range for which you would like to see and download the invoice.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
          {/* Left Side: Single Product Selector */}
          <div className="space-y-4 border-b lg:border-b-0 lg:border-r border-glass-border pb-6 lg:pb-0 lg:pr-8">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag size={16} className="text-amber-500" />
              Single Product Invoice
            </h3>

            {salesProducts.length === 0 ? (
              <div className="flex items-center gap-2 bg-white/5 border border-glass-border p-4 rounded-2xl text-text-muted text-sm">
                <Info size={16} className="text-amber-500" />
                <span>No product sales found.</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-2">Select a product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option value="" className="bg-slate-900">-- Select Purchased Product --</option>
                    {salesProducts.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900">{p.label}</option>
                    ))}
                  </select>
                </div>

                <ul className="list-disc list-inside text-xs text-text-muted space-y-1 bg-white/5 p-4 rounded-xl border border-glass-border">
                  <li>Download invoices for single products</li>
                  <li>If you are looking for a GST invoice, please update GST on from ‘Profile & KYC’ section from dashboard</li>
                </ul>

                <div className="flex gap-3">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleAction({
                      endpoint: '/seller/invoices/sales/download',
                      params: { productId: selectedProduct },
                      filename: `sales_invoice_${selectedProduct.split('_')[0]}.pdf`,
                      action: 'download',
                      validationValue: selectedProduct,
                      validationMsg: 'Please select a product purchase invoice to download.'
                    })}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-2.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm flex items-center gap-2"
                  >
                    <Download size={16} /> Download
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleAction({
                      endpoint: '/seller/invoices/sales/download',
                      params: { productId: selectedProduct },
                      filename: `sales_invoice_${selectedProduct.split('_')[0]}.pdf`,
                      action: 'view',
                      validationValue: selectedProduct,
                      validationMsg: 'Please select a product purchase invoice to view.'
                    })}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-2.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm flex items-center gap-2"
                  >
                    <Eye size={16} /> View
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Collective Date Selector */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar size={16} className="text-amber-500" />
              Collective Sales Invoice
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2">Start Date</label>
                <input
                  type="date"
                  value={salesStart}
                  onChange={(e) => setSalesStart(e.target.value)}
                  className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2">End Date</label>
                <input
                  type="date"
                  value={salesEnd}
                  onChange={(e) => setSalesEnd(e.target.value)}
                  className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            <ul className="list-disc list-inside text-xs text-text-muted space-y-1 bg-white/5 p-4 rounded-xl border border-glass-border">
              <li>Download a collective invoice for a range of date and year of your choice</li>
              <li>If you are looking for a GST invoice, please update GST on from ‘Profile & KYC’ section from dashboard</li>
            </ul>

            <div className="flex gap-3">
              <button
                disabled={actionLoading}
                onClick={() => handleAction({
                  endpoint: '/seller/invoices/sales/range/download',
                  params: { startDate: salesStart, endDate: salesEnd },
                  filename: `collective_sales_invoice_${salesStart}_${salesEnd}.pdf`,
                  action: 'download',
                  validationValue: salesStart && salesEnd,
                  validationMsg: 'Please select both start and end dates for collective sales invoice.'
                })}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-2.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm flex items-center gap-2"
              >
                <Download size={16} /> Download
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction({
                  endpoint: '/seller/invoices/sales/range/download',
                  params: { startDate: salesStart, endDate: salesEnd },
                  filename: `collective_sales_invoice_${salesStart}_${salesEnd}.pdf`,
                  action: 'view',
                  validationValue: salesStart && salesEnd,
                  validationMsg: 'Please select both start and end dates for collective sales invoice.'
                })}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-2.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm flex items-center gap-2"
              >
                <Eye size={16} /> View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. Refer and Earn Receipt Section                    */}
      {/* ---------------------------------------------------- */}
      <div className="glass-panel seller-panel rounded-3xl border border-glass-border p-6 md:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white">
          Download your refer and earn receipts
        </h2>
        <p className="text-text-muted text-sm leading-relaxed">
          This is a detailed list of receipts for your earning from Aashansh. You can now select the specific date range or payout amount for which you would like to see or download the receipt.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
          {/* Left Side: Single Payout Selector */}
          <div className="space-y-4 border-b lg:border-b-0 lg:border-r border-glass-border pb-6 lg:pb-0 lg:pr-8">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <IndianRupee size={16} className="text-amber-500" />
              Individual Payout Receipt
            </h3>

            {referralPayouts.length === 0 ? (
              <div className="flex items-center gap-2 bg-white/5 border border-glass-border p-4 rounded-2xl text-text-muted text-sm">
                <Info size={16} className="text-amber-500" />
                <span>No referral payouts found.</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-2">Select a payout amount</label>
                  <select
                    value={selectedPayout}
                    onChange={(e) => setSelectedPayout(e.target.value)}
                    className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option value="" className="bg-slate-900">-- Select Payout Reward --</option>
                    {referralPayouts.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900">{p.label}</option>
                    ))}
                  </select>
                </div>

                <ul className="list-disc list-inside text-xs text-text-muted space-y-1 bg-white/5 p-4 rounded-xl border border-glass-border">
                  <li>Download receipt for individual payout</li>
                  <li>Make sure you have updated your PAN</li>
                </ul>

                <div className="flex gap-3">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleAction({
                      endpoint: '/seller/invoices/referrals/download',
                      params: { payoutId: selectedPayout },
                      filename: `referral_receipt_${selectedPayout.split('_')[1]}.pdf`,
                      action: 'download',
                      validationValue: selectedPayout,
                      validationMsg: 'Please select a referral payout reward to download.'
                    })}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-2.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm flex items-center gap-2"
                  >
                    <Download size={16} /> Download
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleAction({
                      endpoint: '/seller/invoices/referrals/download',
                      params: { payoutId: selectedPayout },
                      filename: `referral_receipt_${selectedPayout.split('_')[1]}.pdf`,
                      action: 'view',
                      validationValue: selectedPayout,
                      validationMsg: 'Please select a referral payout reward to view.'
                    })}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-2.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm flex items-center gap-2"
                  >
                    <Eye size={16} /> View
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Collective Referral Date Selector */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar size={16} className="text-amber-500" />
              Collective Earnings Receipt
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2">Start Date</label>
                <input
                  type="date"
                  value={referralStart}
                  onChange={(e) => setReferralStart(e.target.value)}
                  className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2">End Date</label>
                <input
                  type="date"
                  value={referralEnd}
                  onChange={(e) => setReferralEnd(e.target.value)}
                  className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            <ul className="list-disc list-inside text-xs text-text-muted space-y-1 bg-white/5 p-4 rounded-xl border border-glass-border">
              <li>Download a collective receipt for a range of date and years of your choice</li>
              <li>Make sure you have updated your PAN</li>
            </ul>

            <div className="flex gap-3">
              <button
                disabled={actionLoading}
                onClick={() => handleAction({
                  endpoint: '/seller/invoices/referrals/range/download',
                  params: { startDate: referralStart, endDate: referralEnd },
                  filename: `collective_referrals_receipt_${referralStart}_${referralEnd}.pdf`,
                  action: 'download',
                  validationValue: referralStart && referralEnd,
                  validationMsg: 'Please select both start and end dates for collective referral earnings.'
                })}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-2.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm flex items-center gap-2"
              >
                <Download size={16} /> Download
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction({
                  endpoint: '/seller/invoices/referrals/range/download',
                  params: { startDate: referralStart, endDate: referralEnd },
                  filename: `collective_referrals_receipt_${referralStart}_${referralEnd}.pdf`,
                  action: 'view',
                  validationValue: referralStart && referralEnd,
                  validationMsg: 'Please select both start and end dates for collective referral earnings.'
                })}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-2.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm flex items-center gap-2"
              >
                <Eye size={16} /> View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
