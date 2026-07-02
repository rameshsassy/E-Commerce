import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  BadgeCheck, 
  Download, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Package, 
  Users, 
  ShoppingBag, 
  AlertCircle 
} from 'lucide-react';

const SellerPremium = () => {
  const { user, mergeUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(null);
  const [toast, setToast] = useState(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherInfo, setVoucherInfo] = useState(null);

  // Fetch stats and subscription details from backend
  const fetchDetails = async () => {
    try {
      const res = await api.get('/seller/premium/details');
      if (res.data?.success) {
        setStatsData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load premium details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Format currency helpers
  const formatRupees = (amount) => {
    return `₹ ${Number(amount || 0).toLocaleString('en-IN')}/-`;
  };

  // Calculate days remaining helper
  const calculateDaysLeft = (validUntilDate) => {
    if (!validUntilDate) return 0;
    const diffTime = new Date(validUntilDate) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatValidUntil = (validUntilDate) => {
    if (!validUntilDate) return 'N/A';
    const dateObj = new Date(validUntilDate);
    return dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Generate and download subscription invoice
  const handleDownloadInvoice = () => {
    if (!statsData || statsData.subscriptionPlan === 'free') {
      triggerToast('No active invoice found for the Free plan.', 'error');
      return;
    }

    const planName = statsData.subscriptionPlan === 'premium' ? 'Premium' : 'Pro';
    const basePrice = statsData.subscriptionPlan === 'premium' ? '1,98,000.00' : '9,125.00';
    const gstPrice = statsData.subscriptionPlan === 'premium' ? '35,640.00' : '1,642.50';
    const totalPrice = statsData.subscriptionPlan === 'premium' ? '2,33,640.00' : '10,767.50';
    
    const invoiceContent = `==================================================
                 AASHANSH MARKETPLACE
               PREMIUM SELLER INVOICE
==================================================
Invoice ID: INV-SUB-${(user?.sellerId || user?._id?.toString().slice(-6)).toUpperCase()}-${Date.now()}
Date: ${new Date().toLocaleDateString('en-IN')}
Plan Duration: 1 Year (365 Days)
Valid Until: ${formatValidUntil(statsData.subscriptionValidUntil)}
--------------------------------------------------
BILL TO:
Seller ID: ${user?.sellerId || 'N/A'}
Seller Name: ${user?.firstName || ''} ${user?.lastName || ''}
Business Name: ${user?.businessName || 'N/A'}
Email: ${user?.email || 'N/A'}
--------------------------------------------------
ITEM DETAILS:
Description: Premium Seller Subscription - ${planName} Plan
Base Price: ₹ ${basePrice}
GST (18%): ₹ ${gstPrice}
--------------------------------------------------
TOTAL PAID: ₹ ${totalPrice}
Payment Status: Successful
Payment Mode: Razorpay Online Secure Checkout
Transaction ID: tx_${Math.random().toString(36).substring(2, 12)}
--------------------------------------------------
Thank you for partnering with Aashansh!
Unlock your seller superpowers and grow your B2B business.
==================================================`;

    const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Aashansh_Subscription_Invoice_${planName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Invoice downloaded successfully.');
  };

  // Trigger payment flow
  const handleSubscribeClick = (planCode) => {
    if (planCode === 'free') {
      triggerToast('You are already on the Free plan.', 'info');
      return;
    }

    alert("Pro and Premium versions are coming soon.");
    return;

    const currentPlan = statsData?.subscriptionPlan || 'free';
    if (currentPlan === 'premium' && planCode === 'pro') {
      triggerToast('You are already on the Premium plan. You cannot downgrade to Pro.', 'error');
      return;
    }
    if (currentPlan === planCode && statsData?.subscriptionActive) {
      triggerToast(`You are already subscribed to the ${planCode.toUpperCase()} plan.`, 'info');
      return;
    }

    setSelectedPlan(planCode);
    setVoucherCode("");
    setVoucherInfo(null);
    setShowModal(true);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    try {
      const { data } = await api.post('/seller/vouchers/validate-upgrade', {
        voucherCode: voucherCode.trim().toUpperCase(),
        plan: selectedPlan,
      });
      setVoucherInfo(data);
      triggerToast('Voucher applied successfully!');
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Invalid voucher code', 'error');
      setVoucherInfo(null);
    }
  };

  const confirmSubscription = async () => {
    setPaymentProcessing(true);
    try {
      const verifyRes = await api.post('/seller/upgrade', {
        plan: selectedPlan,
        voucherCode: voucherInfo?.voucherCode || null,
      });
      mergeUser({
        sellerType: verifyRes.data.sellerType,
        subscriptionActive: verifyRes.data.subscriptionActive,
        subscriptionPlan: verifyRes.data.subscriptionPlan,
        subscriptionValidUntil: verifyRes.data.subscriptionValidUntil,
      });

      triggerToast(
        voucherInfo?.finalAmount === 0
          ? 'Voucher Applied Successfully. No Payment Required. Plan upgraded.'
          : `Successfully subscribed to ${selectedPlan.toUpperCase()} Plan!`
      );
      setShowModal(false);
      setVoucherCode("");
      setVoucherInfo(null);
      fetchDetails();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to activate plan.', 'error');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Plan features details matching Image 3
  const getPlanDetails = (plan) => {
    if (plan === 'premium') {
      return {
        name: 'Premium',
        priceLabel: '₹ 2,33,640.00 (₹ 1,98,000/- + 18% GST)',
        brandStores: 'Unlimited',
        productListing: 'Unlimited',
        categorySelection: 'Multiple',
        digitalAds: 'Yes',
        digitalMedia: 'Yes',
        b2bListing: 'Yes (Premium)',
        fundraising: 'Yes',
        commission: '5% + 18% GST',
        referProgram: 'Premium'
      };
    }
    return {
      name: 'Pro',
      priceLabel: '₹ 10,767.50 (₹ 9,125/- + 18% GST)',
      brandStores: '5',
      productListing: 'Unlimited',
      categorySelection: 'Multiple',
      digitalAds: 'NA',
      digitalMedia: 'Yes (Limited)',
      b2bListing: 'Yes',
      fundraising: 'Yes',
      commission: '8% + 18% GST',
      referProgram: 'Pro'
    };
  };

  const learnMoreDetails = {
    basic: {
      title: 'Basic Refer and Earn Program',
      body: 'Get ₹500 credits for every referred seller who gets approved on the marketplace. Earn another ₹500 when they upgrade to Pro/Premium.'
    },
    pro: {
      title: 'Pro Refer and Earn Program',
      body: 'Get ₹750 credits for every referred seller who gets approved on the marketplace. Earn ₹1,000 bonus when they upgrade.'
    },
    premium: {
      title: 'Premium Refer and Earn Program',
      body: 'Get ₹750 credits for every referred seller who gets approved on the marketplace. Earn ₹1,500 bonus when they upgrade.'
    }
  };

  const activePlanName = statsData?.subscriptionPlan || 'free';
  const isCurrentlyPremium = statsData?.sellerType === 'premium' && statsData?.subscriptionActive;
  const currentPlan = isCurrentlyPremium ? activePlanName : 'free';
  const daysLeft = statsData?.subscriptionValidUntil ? calculateDaysLeft(statsData.subscriptionValidUntil) : 0;
  const showExpiryWarning = isCurrentlyPremium && daysLeft > 0 && daysLeft <= 30;

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-2 md:p-4 animate-fade-in w-full max-w-6xl mx-auto space-y-8 text-slate-800">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 animate-slide-in ${
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 
          toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
          'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <ShieldCheck size={20} />}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

      {/* 1. Become a Premium Seller Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#310f64] via-[#1a0b47] to-[#310f64] py-10 px-6 sm:px-12 text-center text-white shadow-xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent)]"></div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3 drop-shadow-md">
          Become a Premium Seller
        </h1>
        <p className="text-base sm:text-xl text-slate-200 max-w-2xl mx-auto font-light leading-relaxed">
          Unlock powerful tools to grow your business and reach B2B buyers.
        </p>
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2 border border-violet-400/40 bg-violet-400/10 text-violet-200 px-5 py-2.5 rounded-full text-sm font-semibold shadow-glow">
            <BadgeCheck size={18} className="text-violet-300" />
            <span>Premium Seller</span>
          </div>
        </div>
      </div>

      {showExpiryWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-amber-900 text-base mb-1">Your Premium Subscription is Expiring</h3>
              <p className="text-amber-800 text-sm leading-relaxed font-medium">
                Your current plan expires in <span className="font-extrabold text-amber-900">{daysLeft} days</span> (on {formatValidUntil(statsData.subscriptionValidUntil)}). Renew your subscription today to ensure uninterrupted B2B/B2C sales tools, multiple addresses, and dedicated support.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('pricing-matrix');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full md:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-2xl text-sm shadow-sm transition-all active:scale-98 shrink-0 text-center"
          >
            Renew Now
          </button>
        </div>
      )}

      {/* 2. Billing Status Cards */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* Box 1: Plan Details */}
          <div className="flex flex-col items-center justify-center pb-6 md:pb-0">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-400 uppercase mb-3">
              YOUR EXISTING PLAN
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 uppercase mb-4">
              {activePlanName === 'free' ? 'Basic Free' : activePlanName === 'pro' ? 'Pro Plan' : 'Premium Plan'}
            </span>
            <button
              onClick={handleDownloadInvoice}
              disabled={activePlanName === 'free'}
              className={`w-full max-w-[200px] flex items-center justify-center gap-2 font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm border ${
                activePlanName === 'free'
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#f07c22] border-[#f07c22] text-white hover:bg-[#d86815] active:scale-95'
              }`}
            >
              <Download size={16} /> Download Invoice
            </button>
          </div>

          {/* Box 2: Actions */}
          <div className="flex flex-col items-center justify-center py-6 md:py-0 md:px-4">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-400 uppercase mb-3">
              PREMIUM
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 mb-4 uppercase">
              {isCurrentlyPremium ? 'Active' : 'Inactive'}
            </span>
            {activePlanName !== 'premium' ? (
              <button
                onClick={() => {
                  const el = document.getElementById('pricing-matrix');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ backgroundColor: '#ffd401', color: '#0f172a' }}
                className="w-full max-w-[220px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm"
              >
                Upgrade Now
              </button>
            ) : (
              <button
                disabled
                style={{ backgroundColor: '#ffd401', color: '#0f172a' }}
                className="w-full max-w-[280px] flex items-center justify-center gap-2 font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm cursor-default"
              >
                Congrats, you are a premium Seller
              </button>
            )}
          </div>

          {/* Box 3: Expiry Days */}
          <div className="flex flex-col items-center justify-center pt-6 md:pt-0">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-400 uppercase mb-3">
              VALID UNTIL {statsData?.subscriptionValidUntil ? formatValidUntil(statsData.subscriptionValidUntil) : '—'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 mb-4">
              {statsData?.subscriptionValidUntil ? `${calculateDaysLeft(statsData.subscriptionValidUntil)} Days` : 'N/A'}
            </span>
            <button
              disabled
              className={`w-full max-w-[200px] flex items-center justify-center gap-2 font-bold px-4 py-2.5 rounded-xl border text-sm ${
                isCurrentlyPremium 
                  ? 'bg-orange-50 border-orange-100 text-[#f07c22]' 
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              {isCurrentlyPremium ? `${calculateDaysLeft(statsData.subscriptionValidUntil)} Days Left` : '0 Days Left'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Metrics Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        
        {/* Stat 1: Products Listed */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 text-center hover:scale-[1.01] hover:shadow-md transition-all">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              <Package size={22} />
            </div>
          </div>
          <p className="text-slate-500 font-medium text-base mb-1">Products Listed</p>
          <p className="text-[#0d1e3d] font-extrabold text-3xl">
            {statsData?.stats?.productsListed ?? 0}
          </p>
        </div>

        {/* Stat 2: Individual Customers */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 text-center hover:scale-[1.01] hover:shadow-md transition-all">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-sky-50 border border-sky-100 text-sky-600 rounded-xl">
              <Users size={22} />
            </div>
          </div>
          <p className="text-slate-500 font-medium text-base mb-1">Individual Customers</p>
          <p className="text-[#0d1e3d] font-extrabold text-3xl">
            {statsData?.stats?.individualCustomers ?? 0}
          </p>
        </div>

        {/* Stat 3: Bulk Orders */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 text-center hover:scale-[1.01] hover:shadow-md transition-all">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl">
              <ShoppingBag size={22} />
            </div>
          </div>
          <p className="text-slate-500 font-medium text-base mb-1">Bulk Orders</p>
          <p className="text-[#0d1e3d] font-extrabold text-3xl">
            {statsData?.stats?.bulkOrders ?? 0}
          </p>
        </div>

        {/* Stat 4: Total Referrals */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 text-center hover:scale-[1.01] hover:shadow-md transition-all">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-teal-50 border border-teal-100 text-teal-600 rounded-xl">
              <Sparkles size={22} />
            </div>
          </div>
          <p className="text-slate-500 font-medium text-base mb-1">Total Referrals</p>
          <p className="text-[#0d1e3d] font-extrabold text-3xl">
            {statsData?.stats?.totalReferrals ?? 0}
          </p>
        </div>

        {/* Stat 5: Total Sales */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 text-center hover:scale-[1.01] hover:shadow-md transition-all">
          <div className="flex justify-center mb-3 text-emerald-600">
            <span className="text-2xl font-black">₹</span>
          </div>
          <p className="text-slate-500 font-medium text-base mb-1">Total Sales</p>
          <p className="text-[#0d1e3d] font-extrabold text-2xl sm:text-3xl">
            {formatRupees(statsData?.stats?.totalSales)}
          </p>
        </div>

        {/* Stat 6: Total Referral Rewards */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 text-center hover:scale-[1.01] hover:shadow-md transition-all">
          <div className="flex justify-center mb-3 text-purple-600">
            <span className="text-2xl font-black">⭐</span>
          </div>
          <p className="text-slate-500 font-medium text-base mb-1">Total Referral Rewards</p>
          <p className="text-[#0d1e3d] font-extrabold text-2xl sm:text-3xl">
            {formatRupees(statsData?.stats?.totalReferralRewards)}
          </p>
        </div>

      </div>

      {/* 4. Plan Comparison Matrix */}
      <div id="pricing-matrix" className="pt-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase mb-1">
            CHOOSE THE ANNUAL PLAN THAT'S RIGHT FOR YOU
          </h2>
          <div className="w-20 h-1 bg-[#f07c22] mx-auto rounded-full mt-3"></div>
        </div>

        <div className="rounded-3xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          
          {/* Orange Header Pills Layout */}
          <div className="bg-[#f07c22] p-6 text-white grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 md:col-span-3 lg:col-span-4 text-lg sm:text-xl font-bold text-center md:text-left mb-4 md:mb-0">
              Pricing Options
            </div>
            
            <div className="col-span-12 md:col-span-9 lg:col-span-8 grid grid-cols-3 gap-3 sm:gap-4 text-center">
              
              {/* Basic Column Header */}
              <div className="flex flex-col items-center">
                <div className="bg-white text-slate-800 font-bold px-3 sm:px-6 py-2 rounded-full text-xs sm:text-sm w-full max-w-[150px] shadow-sm">
                  Basic &nbsp;&nbsp;&nbsp; Free
                </div>
                <span className="text-[10px] text-orange-100 mt-2 block">Standard Seller</span>
              </div>

              {/* Pro Column Header */}
              <div className="flex flex-col items-center">
                <div className="bg-white text-slate-800 font-bold px-2 sm:px-4 py-1.5 rounded-2xl text-[10px] sm:text-xs w-full max-w-[170px] shadow-sm flex flex-col justify-center min-h-[50px]">
                  <span className="font-extrabold text-sm text-[#f07c22]">Pro</span>
                  <span className="font-semibold">₹ 9125/- +18% GST</span>
                  <span className="text-[8px] text-slate-400">Non-Refundable</span>
                </div>
                <button
                  onClick={() => handleSubscribeClick('pro')}
                  disabled={currentPlan === 'pro' || currentPlan === 'premium'}
                  className={`mt-3 font-black text-xs px-4 py-1.5 rounded-full transition-all shadow-sm ${
                    currentPlan === 'pro'
                      ? 'bg-orange-100 text-orange-400 cursor-not-allowed shadow-inner'
                      : currentPlan === 'premium'
                      ? 'bg-orange-100/50 text-orange-300 cursor-not-allowed'
                      : 'bg-white text-[#f07c22] hover:bg-orange-50 active:scale-95'
                  }`}
                >
                  {currentPlan === 'pro' ? 'Current' : 'Upgrade'}
                </button>
              </div>

              {/* Premium Column Header */}
              <div className="flex flex-col items-center">
                <div className="bg-white text-slate-800 font-bold px-2 sm:px-4 py-1.5 rounded-2xl text-[10px] sm:text-xs w-full max-w-[170px] shadow-sm flex flex-col justify-center min-h-[50px]">
                  <span className="font-extrabold text-sm text-[#f07c22]">Premium</span>
                  <span className="font-semibold">₹ 198000/- +18% GST</span>
                  <span className="text-[8px] text-slate-400">Non-Refundable</span>
                </div>
                <button
                  onClick={() => handleSubscribeClick('premium')}
                  disabled={currentPlan === 'premium'}
                  className={`mt-3 font-black text-xs px-4 py-1.5 rounded-full transition-all shadow-sm ${
                    currentPlan === 'premium'
                      ? 'bg-orange-100 text-orange-400 cursor-not-allowed shadow-inner'
                      : 'bg-white text-[#f07c22] hover:bg-orange-50 active:scale-95'
                  }`}
                >
                  {currentPlan === 'premium' ? 'Current' : 'Upgrade'}
                </button>
              </div>

            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <tbody>
                
                {/* Brand Store */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700 w-1/4 min-w-[160px]">
                    • Brand Store/s
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-medium w-1/4">1</td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-medium w-1/4">5</td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-medium w-1/4">unlimited</td>
                </tr>

                {/* Product Listing */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">
                    • Product Listing
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-medium">Unlimited</td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-medium">Unlimited</td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-medium">unlimited</td>
                </tr>

                {/* Category Selection */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">
                    • Category Selection
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-medium">1</td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-medium">Multiple</td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-medium">Multiple</td>
                </tr>

                {/* Digital Ads */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">
                    • Digital ads
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-400 font-bold">NA</td>
                  <td className="p-4 sm:p-5 text-center text-slate-400 font-bold">NA</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-600 font-bold">Yes</td>
                </tr>

                {/* Digital Media Promotion */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">
                    • Digital Media Promotion
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-400 font-bold">NA</td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-medium">Yes (Limited)</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-600 font-bold">Yes</td>
                </tr>

                {/* B2B Listing */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">
                    • B2B Listing
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-400 font-bold">NA</td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-semibold">Yes</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-600 font-bold">Yes (Premium)</td>
                </tr>

                {/* Fundraising */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">
                    • Fundraising*
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-400 font-bold">NA</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-600 font-bold">Yes</td>
                </tr>

                {/* Commission */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">
                    • Commission
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-medium">
                    <span className="font-bold">10.5%</span> + 18% GST
                  </td>
                  <td className="p-4 sm:p-5 text-center text-emerald-600 font-medium">
                    <span className="font-bold">8%</span> + 18% GST
                  </td>
                  <td className="p-4 sm:p-5 text-center text-emerald-600 font-medium">
                    <span className="font-bold">5%</span> + 18% GST
                  </td>
                </tr>

                {/* Refer and Earn Plan */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">
                    • Refer and earn plan
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-medium">
                    <div className="flex flex-col items-center gap-1.5">
                      <span>Basic</span>
                      <button 
                        onClick={() => setShowLearnMore('basic')}
                        className="text-[11px] text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-full font-bold transition-all"
                      >
                        Learn more
                      </button>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-medium">
                    <div className="flex flex-col items-center gap-1.5">
                      <span>Pro</span>
                      <button 
                        onClick={() => setShowLearnMore('pro')}
                        className="text-[11px] text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-full font-bold transition-all"
                      >
                        Learn more
                      </button>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-600 font-medium">
                    <div className="flex flex-col items-center gap-1.5">
                      <span>Premium</span>
                      <button 
                        onClick={() => setShowLearnMore('premium')}
                        className="text-[11px] text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-full font-bold transition-all"
                      >
                        Learn more
                      </button>
                    </div>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* Pricing Row Footer Actions */}
          <div className="bg-slate-50/70 border-t border-slate-100 p-6 grid grid-cols-12 gap-4 items-center">
            <div className="hidden md:block col-span-3 lg:col-span-4 text-xs text-slate-400 font-semibold italic">
              * Rates are non-refundable
            </div>
            
            <div className="col-span-12 md:col-span-9 lg:col-span-8 grid grid-cols-3 gap-3 sm:gap-4 text-center">
              
              {/* Subscribe button Free */}
              <div>
                <button
                  type="button"
                  disabled
                  className={`w-full font-extrabold py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm uppercase transition-all ${
                    currentPlan === 'free'
                      ? 'bg-white text-slate-500 border border-slate-300 cursor-not-allowed shadow-sm'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {currentPlan === 'free' ? 'Current Plan' : 'Free Plan'}
                </button>
              </div>

              {/* Subscribe button Pro */}
              <div>
                <button
                  onClick={() => handleSubscribeClick('pro')}
                  disabled={currentPlan === 'pro' || currentPlan === 'premium'}
                  className={`w-full font-extrabold py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm uppercase shadow-sm transition-all ${
                    currentPlan === 'pro'
                      ? 'bg-white text-slate-500 border border-slate-300 cursor-default'
                      : currentPlan === 'premium'
                      ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#f07c22] text-white hover:bg-[#d86815] border border-[#f07c22] active:scale-95'
                  }`}
                >
                  {currentPlan === 'pro' ? 'Current Plan' : 'Subscribe Now'}
                </button>
              </div>

              {/* Subscribe button Premium */}
              <div>
                <button
                  onClick={() => handleSubscribeClick('premium')}
                  disabled={currentPlan === 'premium'}
                  className={`w-full font-extrabold py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm uppercase shadow-sm transition-all ${
                    currentPlan === 'premium'
                      ? 'bg-white text-slate-500 border border-slate-300 cursor-default'
                      : 'bg-[#f07c22] text-white hover:bg-[#d86815] border border-[#f07c22] active:scale-95'
                  }`}
                >
                  {currentPlan === 'premium' ? 'Current Plan' : 'Subscribe Now'}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 5. Pricing Details Confirmation Modal */}
      {/* 5. Pricing Details Confirmation Modal */}
      {showModal && selectedPlan && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl animate-scale-up border border-slate-100 overflow-hidden text-slate-800">
            
            {/* Modal Close */}
            <button
              onClick={() => {
                setShowModal(false);
                setVoucherCode("");
                setVoucherInfo(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X size={20} />
            </button>

            {/* Modal Heading */}
            <div className="text-center pb-5 border-b border-slate-100">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1">
                Ready to unlock more powerful features through {getPlanDetails(selectedPlan).name}?
              </h3>
              <p className="text-[#f07c22] font-black text-sm uppercase tracking-wide">
                {user?.firstName || 'Valued'} {user?.lastName || 'Seller'}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 mt-3 max-w-lg mx-auto font-medium">
                You’re about to level up your Aashansh game! Confirm your plan and get access to bulk buyer leads, advanced analytics, support, and more seller superpowers.
              </p>
            </div>

            {/* Plan Info Bar */}
            <div className="bg-[#f07c22] rounded-2xl p-4 my-6 text-white grid grid-cols-12 gap-3 items-center">
              <div className="col-span-12 sm:col-span-9 bg-white text-slate-800 rounded-xl p-3 shadow-inner flex flex-col justify-center min-h-[60px]">
                <div className="flex justify-between text-xs sm:text-sm font-semibold mb-1 text-slate-500">
                  <span>Plan Name</span>
                  <span className="text-[#f07c22] font-black">{getPlanDetails(selectedPlan).name}</span>
                </div>
                {voucherInfo ? (
                  <div className="space-y-1 text-xs text-left">
                    <div className="flex justify-between text-slate-500">
                      <span>Original Price:</span>
                      <span className="font-semibold">₹ {voucherInfo.originalAmount.toLocaleString('en-IN')}/-</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount ({voucherInfo.voucherCode}):</span>
                      <span>-₹ {voucherInfo.discountAmount.toLocaleString('en-IN')}/-</span>
                    </div>
                    <div className="flex justify-between text-slate-800 font-extrabold text-sm pt-1 border-t border-slate-100">
                      <span>Final Amount:</span>
                      <span>₹ {voucherInfo.finalAmount.toLocaleString('en-IN')}/-</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-800">
                    <span>Amount</span>
                    <span>{getPlanDetails(selectedPlan).priceLabel}</span>
                  </div>
                )}
              </div>
              <div className="col-span-12 sm:col-span-3 text-center text-[10px] text-orange-100 italic leading-tight">
                * Amount is non-refundable
              </div>
            </div>

            {/* Voucher Code field */}
            <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-left">Apply Voucher Code</label>
              {voucherInfo ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm">
                  <span className="text-emerald-700 font-bold">
                    ✓ {voucherInfo.voucherCode} applied successfully
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVoucherInfo(null);
                      setVoucherCode("");
                    }}
                    className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ENTER UPGRADE VOUCHER"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-slate-400 uppercase tracking-wide text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Features list */}
            <div className="space-y-3.5 mb-8 max-h-[200px] overflow-y-auto pr-1">
              <div className="flex justify-between text-xs sm:text-sm pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">• Brand Store/s</span>
                <span className="text-slate-800 font-extrabold">{getPlanDetails(selectedPlan).brandStores}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">• Product Listing</span>
                <span className="text-slate-800 font-extrabold">{getPlanDetails(selectedPlan).productListing}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">• Category Selection</span>
                <span className="text-slate-800 font-extrabold">{getPlanDetails(selectedPlan).categorySelection}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">• Digital ads</span>
                <span className={`font-extrabold ${getPlanDetails(selectedPlan).digitalAds === 'Yes' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {getPlanDetails(selectedPlan).digitalAds}
                </span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">• Digital Media Promotion</span>
                <span className="text-slate-800 font-extrabold">{getPlanDetails(selectedPlan).digitalMedia}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">• B2B Listing</span>
                <span className="text-slate-800 font-extrabold">{getPlanDetails(selectedPlan).b2bListing}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">• Fundraising*</span>
                <span className="text-emerald-600 font-extrabold">{getPlanDetails(selectedPlan).fundraising}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">• Commission</span>
                <span className="text-emerald-600 font-extrabold">{getPlanDetails(selectedPlan).commission}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm pb-2">
                <span className="text-slate-500 font-semibold">• Refer and earn plan</span>
                <span className="text-slate-800 font-extrabold">{getPlanDetails(selectedPlan).referProgram}</span>
              </div>
            </div>

            {/* Confirm Actions */}
            <button
              onClick={confirmSubscription}
              disabled={paymentProcessing}
              className="w-full bg-[#f07c22] hover:bg-[#d86815] text-white font-extrabold py-4 px-6 rounded-2xl shadow-md transition-all active:scale-98 text-center text-sm sm:text-base tracking-wide flex items-center justify-center gap-2"
            >
              {paymentProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Initiating Upgrade...</span>
                </>
              ) : (
                'Confirm and Subscribe Now'
              )}
            </button>
            <div className="text-center mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Secure Payments by Razorpay Checkout</span>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* 6. Learn More Program Info Modal */}
      {showLearnMore && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative border border-slate-100 shadow-xl">
            <button
              onClick={() => setShowLearnMore(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X size={18} />
            </button>
            <h4 className="text-base font-extrabold text-slate-900 mb-3 pr-6">
              {learnMoreDetails[showLearnMore].title}
            </h4>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              {learnMoreDetails[showLearnMore].body}
            </p>
            <button
              onClick={() => setShowLearnMore(null)}
              className="mt-5 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default SellerPremium;
