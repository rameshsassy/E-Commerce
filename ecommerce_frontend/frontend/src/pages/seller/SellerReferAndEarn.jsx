import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift,
  Copy,
  Check,
  Award,
  ArrowRight,
  MessageSquare,
  Share2,
  Mail,
  HelpCircle,
  Star,
  Minus,
  Send,
  X,
  Zap,
} from 'lucide-react';
import api from '../../utils/api';
import { getApiErrorMessage } from '../../utils/apiErrors';
import ResponsiveDataList from '../../components/common/ResponsiveDataList';
import { useAuth } from '../../context/AuthContext';



function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function statusLabel(status) {
  if (status === 'premium') return 'Premium';
  if (status === 'approved') return 'Approved';
  return 'Pending KYC';
}

function statusClass(status) {
  if (status === 'premium') return 'text-amber-400 bg-amber-400/10';
  if (status === 'approved') return 'text-emerald-400 bg-emerald-400/10';
  return 'text-slate-400 bg-slate-400/10';
}

export default function SellerReferAndEarn() {
  const { mergeUser } = useAuth();
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const inviteFormRef = useRef(null);
  const [inviteForm, setInviteForm] = useState({
    inviteeFirstName: '',
    inviteeLastName: '',
    inviteeType: '',
    inviteeContact: '',
    inviteeEmail: '',
    inviteeDesignation: '',
    inviteeVenture: '',
  });

  const loadProgram = async () => {
    setError('');
    const res = await api.get('/seller/refer-and-earn');
    setData(res.data?.data ?? null);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadProgram();
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Could not load Refer and Earn'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpgradePlan = (plan) => {
    setSelectedUpgradePlan(plan);
    setShowUpgradeModal(true);
  };

  const confirmPlanUpgrade = async () => {
    setError('');
    setSuccess('');
    setUpgrading(true);
    try {
      const res = await api.post('/seller/upgrade', { plan: selectedUpgradePlan });
      mergeUser({
        sellerType: res.data.sellerType,
        subscriptionActive: res.data.subscriptionActive,
        subscriptionPlan: res.data.subscriptionPlan,
        subscriptionValidUntil: res.data.subscriptionValidUntil,
      });
      setSuccess(res.data.message || `Successfully upgraded to ${selectedUpgradePlan === 'premium' ? 'Premium' : 'Pro'} Plan!`);
      setShowUpgradeModal(false);
      await loadProgram();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to upgrade plan'));
    } finally {
      setUpgrading(false);
    }
  };

  const copyText = async (label, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const handleInviteChange = (field, value) => {
    setInviteForm((prev) => ({ ...prev, [field]: value }));
  };

  const openInviteForm = useCallback(() => {
    setShowInviteForm(true);
    setTimeout(() => {
      inviteFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const {
      inviteeFirstName,
      inviteeLastName,
      inviteeContact,
      inviteeEmail,
      inviteeDesignation,
      inviteeVenture,
    } = inviteForm;

    if (
      !inviteeFirstName ||
      !inviteeLastName ||
      !inviteeContact ||
      !inviteeEmail ||
      !inviteeDesignation ||
      !inviteeVenture
    ) {
      setError('Please fill in all fields');
      return;
    }

    // 1. Check for spaces in the email
    if (inviteeEmail.includes(" ") || /\s/.test(inviteeEmail)) {
      setError('Please enter a valid email');
      return;
    }

    // 2. Check for incomplete email address, like .com is not added
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(inviteeEmail)) {
      setError('Please enter a valid email');
      return;
    }

    setSendingInvite(true);
    try {
      const res = await api.post('/seller/refer-and-earn/invite', {
        ...inviteForm,
        inviteeType: 'Artisan',
      });
      setSuccess(res.data?.message || 'Invitation email sent successfully');
      setInviteForm({
        inviteeFirstName: '',
        inviteeLastName: '',
        inviteeType: '',
        inviteeContact: '',
        inviteeEmail: '',
        inviteeDesignation: '',
        inviteeVenture: '',
      });
      setShowInviteForm(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send invitation'));
    } finally {
      setSendingInvite(false);
    }
  };

  const {
    program,
    planRows = [],
    referralCode,
    referralLink,
    currentPlan = 'Free',
    stats = {},
  } = data || {};

  const isFree = currentPlan === 'Free' || !currentPlan;
  const isPro = currentPlan === 'Pro';
  const isPremium = currentPlan === 'Premium';
  const shareTemplate = program?.shareTemplate || "Hey! Join me on Aashansh - sell your products to bulk buyers, individual customers, earn rewards, and more. Click to join: {{Link}} Use my code {{CODE}} and get 25% discount on premium plans. Let’s grow together!";
  
  const getWorkingReferralLink = () => {
    if (!referralLink) return '';
    try {
      const url = new URL(referralLink);
      let targetOrigin = window.location.origin;
      if (window.location.hostname.includes('localhost')) {
        targetOrigin = import.meta.env.VITE_CUSTOMER_PORTAL_URL || 'https://e-commerce-snj1.vercel.app';
      }
      const targetUrl = new URL(targetOrigin);
      url.protocol = targetUrl.protocol;
      url.host = targetUrl.host;
      return url.toString();
    } catch {
      return referralLink;
    }
  };

  const activeReferralLink = getWorkingReferralLink();
  const shareMessage = shareTemplate
    .replace('{{Link}}', activeReferralLink)
    .replace('{{CODE}}', referralCode || '');

  const shareOptions = useMemo(() => [
    {
      name: 'WhatsApp',
      icon: <MessageSquare size={18} />,
      color: 'bg-[#25D366] hover:bg-[#128C7E]',
      link: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
    },
    {
      name: 'X (Twitter)',
      icon: <Share2 size={18} />,
      color: 'bg-[#1DA1F2] hover:bg-[#0c85d0]',
      link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`,
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-linkedin"
        >
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
      color: 'bg-[#0077B5] hover:bg-[#005582]',
      link: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(activeReferralLink)}`,
    },
    {
      name: 'Email',
      icon: <Mail size={18} />,
      color: 'bg-slate-700 hover:bg-slate-900',
      onClick: openInviteForm,
    },
  ], [shareMessage, activeReferralLink, openInviteForm]);

  if (loading) {
    return (
      <div className="seller-page animate-fade-in">
        <h1 className="seller-page-title">Refer and Earn</h1>
        <div className="glass-panel seller-panel rounded-2xl text-text-muted">Loading…</div>
      </div>
    );
  }

  if (error && !data && !success) {
    return (
      <div className="seller-page animate-fade-in">
        <h1 className="seller-page-title">Refer and Earn</h1>
        <div className="glass-panel seller-panel rounded-2xl text-error">{error}</div>
      </div>
    );
  }



  const statCards = [
    {
      label: 'Total Products',
      value: stats.totalProducts ?? 0,
    },
    {
      label: 'Total Subscribed',
      value: stats.totalSubscribed ?? 0,
    },
    {
      label: 'Total Sale',
      value: `₹ ${Number(stats.totalSale ?? 0).toLocaleString('en-IN')}/-`,
    },
    {
      label: 'Total Subscription',
      value: `₹ ${Number(stats.totalSubscription ?? 0).toLocaleString('en-IN')}/-`,
    },
    {
      label: 'Credits Earned',
      value: stats.creditsEarnedCount ?? 0,
    },
    {
      label: 'My Plan',
      value: stats.myPlan ?? 0,
    },
  ];

  return (
    <div className="seller-page animate-fade-in space-y-8 sm:space-y-10 pb-6 sm:pb-8">
      {/* Hero */}
      <div className="text-center px-1">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#ff7a1f]/15 text-[#ff7a1f] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4">
          <Gift size={14} className="animate-pulse" />
          Referral Rewards Program
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 tracking-tight">
          Spread the Word,{' '}
          <span className="text-[#ff7a1f]">Earn Together!</span>
        </h1>
        <p className="text-text-muted text-base max-w-2xl mx-auto">
          {program?.subtitle ||
            'Invite fellow sellers to Aashansh and earn platform credits when they join and get approved.'}
        </p>
      </div>

      {error && (
        <div className="glass-panel p-4 rounded-xl border border-error/30 text-error text-sm">{error}</div>
      )}
      {success && (
        <div className="glass-panel p-4 rounded-xl border border-success/30 text-success text-sm">{success}</div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Referral hub */}
        <div className="lg:col-span-7 glass-panel seller-panel rounded-2xl sm:rounded-3xl border border-[#ff7a1f]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-48 w-48 bg-[#ff7a1f]/5 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />

          <div className="relative space-y-6">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-1">Your Referral Hub</h2>
              <p className="text-sm text-text-muted">
                Copy your unique link and start inviting sellers to Aashansh.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#ff7a1f]/10 border border-[#ff7a1f]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">
                  Your Referral Code
                </span>
                <span className="text-2xl font-black text-[#ff7a1f] tracking-widest">{referralCode}</span>
              </div>
              <div className="hidden sm:block w-px h-10 bg-[#ff7a1f]/20" />
              <div className="text-center sm:text-left flex-1 min-w-0">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">
                  Shareable Link
                </span>
                <span className="text-sm font-semibold truncate block">{activeReferralLink}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Invite Link</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0 h-12 px-4 rounded-xl bg-white/5 border border-glass-border flex items-center text-xs sm:text-sm font-medium overflow-x-auto">
                  <span className="truncate">{activeReferralLink}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText('link', activeReferralLink)}
                  className="btn w-full sm:w-auto h-12 px-6 rounded-xl bg-[#ff7a1f] hover:bg-[#e66d1a] text-white font-bold flex items-center justify-center gap-2 shrink-0 border-0"
                >
                  {copied === 'link' ? <Check size={16} /> : <Copy size={16} />}
                  {copied === 'link' ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                Quick Share via
              </span>
              <div className="responsive-share-row">
                {shareOptions.map((opt) =>
                  opt.onClick ? (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={opt.onClick}
                      className={`h-11 px-4 sm:px-5 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 ${opt.color}`}
                    >
                      {opt.icon}
                      {opt.name}
                    </button>
                  ) : (
                    <a
                      key={opt.name}
                      href={opt.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`h-11 px-4 sm:px-5 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 ${opt.color}`}
                    >
                      {opt.icon}
                      {opt.name}
                    </a>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rewards + stats */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="rounded-3xl p-6 bg-gradient-to-br from-[#ff9a44] to-[#ff6200] text-white shadow-lg relative overflow-hidden">
            <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Award size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                  {isPremium ? 'Premium Referrer' : 'Seller Referrer'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest block">
                Total Credits Earned
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight block mt-1">
                {formatCurrency(stats.creditsEarned)}
              </span>
              <span className="text-[10px] text-white/70 block mt-1">
                (Non-refundable)
              </span>
              <div className="pt-4 mt-4 border-t border-white/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm font-bold text-white/90">
                <span>Pending: {formatCurrency(stats.pendingCredits)}</span>
                {!isPremium && (
                  <Link
                    to="/seller/premium"
                    className="flex items-center gap-1 hover:underline text-white"
                  >
                    Upgrade for more <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel seller-panel rounded-2xl sm:rounded-3xl border border-glass-border">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-center text-[#ff7a1f]">
              Referral Statistics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-[#f8f9fa] border border-[#dee2e6] rounded-[24px] py-6 px-4 text-center flex flex-col items-center justify-center shadow-sm hover:shadow transition-shadow"
                >
                  <span className="text-sm sm:text-base font-medium text-slate-500 mb-2">
                    {card.label}
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {card.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Referred sellers list */}
      {(stats.referredSellers?.length ?? 0) > 0 && (
        <div className="glass-panel seller-panel rounded-2xl sm:rounded-3xl">
          <h2 className="text-lg font-black mb-4">Your Referrals</h2>
          <ResponsiveDataList
            columns={[
              { key: 'name', label: 'Seller' },
              {
                key: 'status',
                label: 'Status',
                render: (seller) => (
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusClass(seller.status)}`}>
                    {statusLabel(seller.status)}
                  </span>
                ),
              },
              {
                key: 'joinedAt',
                label: 'Joined',
                render: (seller) =>
                  seller.joinedAt
                    ? new Date(seller.joinedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—',
              },
            ]}
            rows={stats.referredSellers}
            rowKey={(seller, i) => `${seller.name}-${i}`}
            emptyMessage="No referrals yet."
          />
        </div>
      )}

      {/* How it works */}
      <div className="glass-panel rounded-3xl p-6 md:p-10">
        <h2 className="text-2xl font-black text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(program?.steps || []).map((step, i) => (
            <div key={step.title} className="flex flex-col items-center text-center space-y-3">
              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center text-lg font-black ${
                  i === 2
                    ? 'bg-gradient-to-br from-[#ff9a44] to-[#ff6200] text-white'
                    : 'bg-[#ff7a1f]/15 text-[#ff7a1f]'
                }`}
              >
                {i + 1}
              </div>
              <h3 className="font-black uppercase tracking-tight text-sm">{step.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed max-w-xs">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan comparison */}
      {planRows.length > 0 && (
        <div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff7a1f]/15 text-[#ff7a1f] text-xs font-black uppercase tracking-widest mb-3">
              <Star size={14} /> Referrer Rewards
            </div>
            <h2 className="text-2xl font-black mb-2">Basic vs Pro vs Premium Referrer</h2>
            <p className="text-text-muted text-sm max-w-lg mx-auto">
              Upgrade your seller plan to unlock higher referral commission limits, product sale percentages, and more.
            </p>
          </div>

          <div className="hidden lg:block glass-panel rounded-3xl overflow-hidden border border-glass-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left py-4 px-6 text-xs font-black text-text-muted uppercase w-[220px]">
                    Feature
                  </th>
                  <th className="py-4 px-5 text-center">
                    <span className="font-black">Basic Free</span>
                    {isFree && (
                      <span className="block text-[10px] font-bold text-text-muted uppercase mt-1">
                        Current Plan
                      </span>
                    )}
                  </th>
                  <th className="py-4 px-5 text-center relative">
                    <span className="font-black text-[#ff7a1f]/90">Pro</span>
                    <span className="block text-[10px] text-text-muted font-bold mt-0.5">
                      ₹ 9,125/- + 18% GST
                    </span>
                    {isPro && (
                      <span className="block text-[10px] font-bold text-[#ff7a1f] uppercase mt-1">
                        Current Plan
                      </span>
                    )}
                  </th>
                  <th className="py-4 px-5 text-center bg-[#ff7a1f]/5 relative">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ff9a44] to-[#ff6200]" />
                    <span className="font-black text-[#ff7a1f]">Premium</span>
                    <span className="block text-[10px] text-text-muted font-bold mt-0.5">
                      ₹ 1,98,000/- + 18% GST
                    </span>
                    {isPremium && (
                      <span className="block text-[10px] font-bold text-[#ff7a1f] uppercase mt-1">
                        Current Plan
                      </span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {planRows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-glass-border/50 ${i === planRows.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <td className="py-3 px-6 text-xs font-bold">{row.label}</td>
                    {[row.basic, row.pro, row.premium].map((val, ci) => (
                      <td
                        key={ci}
                        className={`py-3 px-5 text-center text-sm font-semibold ${ci === 2 ? 'bg-[#ff7a1f]/5' : ''} ${
                          val === 'NA' ? 'text-text-muted/40' : val === 'Unlimited' || val === 'Yes' || val?.includes('%') ? 'text-emerald-400' : ''
                        }`}
                      >
                        {val === 'NA' ? <Minus size={14} className="mx-auto opacity-40" /> : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="grid grid-cols-4 border-t border-glass-border bg-white/5">
              <div className="py-4 px-6" />
              <div className="py-4 px-5 flex justify-center items-center">
                {isFree ? (
                  <span className="text-xs font-bold text-text-muted uppercase">Your current plan</span>
                ) : (
                  <span className="text-xs font-bold text-text-muted/40 uppercase">Basic Free</span>
                )}
              </div>
              <div className="py-4 px-5 flex justify-center items-center">
                {isPro ? (
                  <span className="text-xs font-bold text-[#ff7a1f] uppercase">Active Plan</span>
                ) : isFree ? (
                  <button
                    type="button"
                    onClick={() => handleUpgradePlan('pro')}
                    className="h-10 px-6 rounded-full text-xs font-black uppercase bg-gradient-to-r from-[#ff9a44] to-[#ff6200] text-white flex items-center hover:opacity-90 transition-opacity"
                  >
                    Upgrade Now
                  </button>
                ) : (
                  <span className="text-xs font-bold text-text-muted/40 uppercase">—</span>
                )}
              </div>
              <div className="py-4 px-5 flex justify-center items-center bg-[#ff7a1f]/5">
                {isPremium ? (
                  <span className="text-xs font-bold text-[#ff7a1f] uppercase">Active Plan</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpgradePlan('premium')}
                    className="h-10 px-6 rounded-full text-xs font-black uppercase bg-gradient-to-r from-[#ff9a44] to-[#ff6200] text-white flex items-center hover:opacity-90 transition-opacity"
                  >
                    Upgrade Now
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile & tablet plan cards */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                name: 'Basic Free',
                badge: isFree ? 'Current Plan' : null,
                highlight: false,
                values: planRows.map((r) => r.basic),
                code: 'basic',
              },
              {
                name: 'Pro',
                badge: isPro ? 'Current Plan' : null,
                highlight: false,
                values: planRows.map((r) => r.pro),
                code: 'pro',
              },
              {
                name: 'Premium',
                badge: isPremium ? 'Current Plan' : 'Best Value',
                highlight: true,
                values: planRows.map((r) => r.premium),
                code: 'premium',
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`glass-panel rounded-3xl overflow-hidden ${
                  plan.highlight ? 'border border-[#ff7a1f]/40 ring-1 ring-[#ff7a1f]/20' : ''
                }`}
              >
                {plan.highlight && (
                  <div className="h-1 bg-gradient-to-r from-[#ff9a44] to-[#ff6200]" />
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-black ${plan.highlight ? 'text-[#ff7a1f]' : ''}`}>
                      {plan.name}
                    </h3>
                    {plan.badge && (
                      <span className="text-[10px] font-black uppercase bg-[#ff7a1f] text-white px-2 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 mb-4">
                    {planRows.map((row, i) => (
                      <div key={row.label} className="flex justify-between text-xs gap-2">
                        <span className="text-text-muted font-medium">{row.label}</span>
                        <span className="font-bold text-right">{plan.values[i]}</span>
                      </div>
                    ))}
                  </div>
                  {/* Action buttons */}
                  {plan.code !== 'basic' && (
                    <>
                      {plan.code === 'pro' && isFree && (
                        <button
                          type="button"
                          onClick={() => handleUpgradePlan('pro')}
                          className="btn w-full h-11 rounded-xl bg-gradient-to-r from-[#ff9a44] to-[#ff6200] text-white font-bold text-sm border-0 flex items-center justify-center"
                        >
                          Upgrade Now
                        </button>
                      )}
                      {plan.code === 'premium' && !isPremium && (
                        <button
                          type="button"
                          onClick={() => handleUpgradePlan('premium')}
                          className="btn w-full h-11 rounded-xl bg-gradient-to-r from-[#ff9a44] to-[#ff6200] text-white font-bold text-sm border-0 flex items-center justify-center"
                        >
                          Upgrade Now
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards list */}
      <div className="glass-panel rounded-3xl p-6 md:p-8">
        <h2 className="text-lg font-black mb-1">{program?.rewardsTitle || 'Existing Rewards'}</h2>
        {program?.rewardsSubtitle && (
          <p className="text-sm text-text-muted mb-4">{program.rewardsSubtitle}</p>
        )}
        <ul className="space-y-2 mb-4">
          {(program?.rewards || []).map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-text-muted">
              <Check size={16} className="text-success shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
        {program?.termsNote && (
          <p className="text-xs text-text-muted border-t border-glass-border pt-4">{program.termsNote}</p>
        )}
      </div>

      {/* Email invite form inline card */}
      {showInviteForm && (
        <div ref={inviteFormRef} className="scroll-mt-24">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff7a1f]/15 text-[#ff7a1f] text-xs font-black uppercase tracking-widest mb-3">
              <Mail size={14} /> Invite via Email
            </div>
            <h2 className="text-2xl font-black mb-2">Send a Personal Invitation</h2>
            <p className="text-text-muted text-sm max-w-lg mx-auto">
              Fill in the details below and a branded invitation email will be sent on your behalf.
            </p>
          </div>

          <div className="max-w-2xl mx-auto glass-panel rounded-3xl p-6 md:p-8 relative border border-[#ff7a1f]/20">
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-colors border-0"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <form onSubmit={handleSendInvite} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteForm.inviteeFirstName}
                    onChange={(e) => handleInviteChange('inviteeFirstName', e.target.value)}
                    placeholder="Priya"
                    className="input-field w-full bg-white/5 border border-glass-border text-white rounded-xl h-11 px-4"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteForm.inviteeLastName}
                    onChange={(e) => handleInviteChange('inviteeLastName', e.target.value)}
                    placeholder="Sharma"
                    className="input-field w-full bg-white/5 border border-glass-border text-white rounded-xl h-11 px-4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={inviteForm.inviteeContact}
                    onChange={(e) => handleInviteChange('inviteeContact', e.target.value)}
                    placeholder="9876543210"
                    className="input-field w-full bg-white/5 border border-glass-border text-white rounded-xl h-11 px-4"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.inviteeEmail}
                    onChange={(e) => handleInviteChange('inviteeEmail', e.target.value)}
                    placeholder="seller@example.com"
                    className="input-field w-full bg-white/5 border border-glass-border text-white rounded-xl h-11 px-4"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                  Designation *
                </label>
                <input
                  type="text"
                  required
                  value={inviteForm.inviteeDesignation}
                  onChange={(e) => handleInviteChange('inviteeDesignation', e.target.value)}
                  placeholder="Founder & CEO"
                  className="input-field w-full bg-white/5 border border-glass-border text-white rounded-xl h-11 px-4"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                  Venture / Organisation Name *
                </label>
                <input
                  type="text"
                  required
                  value={inviteForm.inviteeVenture}
                  onChange={(e) => handleInviteChange('inviteeVenture', e.target.value)}
                  placeholder="Artisan Crafts Co."
                  className="input-field w-full bg-white/5 border border-glass-border text-white rounded-xl h-11 px-4"
                />
              </div>

              <button
                type="submit"
                disabled={sendingInvite}
                className="w-full h-12 rounded-xl bg-[#ffd401] hover:bg-[#e0b900] text-slate-900 font-bold flex items-center justify-center gap-2 disabled:opacity-50 border-0 mt-4 transition-colors"
              >
                {sendingInvite ? (
                  'Sending…'
                ) : (
                  <>
                    <Send size={16} /> Submit to Send Email
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAQ / contact */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 bg-[#ff7a1f]/15 text-[#ff7a1f] rounded-xl flex items-center justify-center shrink-0">
            <HelpCircle size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider">Questions about rewards?</h4>
            <p className="text-xs text-text-muted">Read our referral policy or contact seller support.</p>
          </div>
        </div>
        <a
          href="mailto:sellers@aashansh.org"
          className="h-11 px-6 rounded-full border-2 border-[#ff7a1f] text-[#ff7a1f] hover:bg-[#ff7a1f] hover:text-white font-bold text-sm flex items-center gap-2 transition-colors shrink-0"
        >
          Contact Support
        </a>
      </div>

      {/* Plan Upgrade Confirmation Modal */}
      {showUpgradeModal && selectedUpgradePlan && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-glass-border rounded-3xl max-w-md w-full p-6 relative shadow-2xl animate-scale-up text-white overflow-hidden">
            
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1"
            >
              <X size={20} />
            </button>

            <div className="text-center pb-5 border-b border-glass-border">
              <h3 className="text-lg sm:text-xl font-extrabold text-white mb-2">
                Upgrade to {selectedUpgradePlan === 'premium' ? 'Premium' : 'Pro'} Plan
              </h3>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Unlock higher estimated referral earnings, subscription commissions, product sale commissions, and more!
              </p>
            </div>

            <div className="bg-gradient-to-r from-[#ff9a44] to-[#ff6200] rounded-2xl p-4 my-6 text-white text-center">
              <div className="text-xs uppercase font-semibold text-orange-100">Annual Subscription Price</div>
              <div className="text-2xl font-black mt-1">
                {selectedUpgradePlan === 'premium' ? '₹ 1,98,000/-' : '₹ 9,125/-'}
              </div>
              <div className="text-[10px] text-orange-200 mt-1">+ 18% GST (Non-refundable)</div>
            </div>

            <div className="space-y-3">
              <button
                onClick={confirmPlanUpgrade}
                disabled={upgrading}
                className="w-full h-12 rounded-xl bg-[#ff7a1f] hover:bg-[#e66d1a] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 border-0 shadow-lg"
              >
                {upgrading ? (
                  'Upgrading...'
                ) : (
                  <>
                    <Zap size={16} /> Confirm Upgrade
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold border-0 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
