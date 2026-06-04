import React, { useEffect, useRef, useState } from 'react';
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
  UserPlus,
  UserCheck,
  TrendingUp,
  CreditCard,
  Building2,
  User,
  Handshake,
  Crown,
  Star,
  Minus,
  Send,
  X,
  Zap,
} from 'lucide-react';
import api from '../../utils/api';
import { getApiErrorMessage } from '../../utils/apiErrors';
import ResponsiveDataList from '../../components/common/ResponsiveDataList';

const INVITE_TYPES = ['Artisan', 'Business'];

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

  const openInviteForm = () => {
    setShowInviteForm(true);
    setTimeout(() => {
      inviteFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const {
      inviteeFirstName,
      inviteeLastName,
      inviteeType,
      inviteeContact,
      inviteeEmail,
      inviteeDesignation,
      inviteeVenture,
    } = inviteForm;

    if (
      !inviteeFirstName ||
      !inviteeLastName ||
      !inviteeType ||
      !inviteeContact ||
      !inviteeEmail ||
      !inviteeDesignation ||
      !inviteeVenture
    ) {
      setError('Please fill in all fields');
      return;
    }

    setSendingInvite(true);
    try {
      const res = await api.post('/seller/refer-and-earn/invite', inviteForm);
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
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send invitation'));
    } finally {
      setSendingInvite(false);
    }
  };

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

  const {
    program,
    planRows = [],
    referralCode,
    referralLink,
    currentPlan = 'Free',
    stats = {},
  } = data || {};

  const isPremium = currentPlan === 'Premium';
  const shareMessage = `Join me on Aashansh — India's marketplace for sellers! Use my referral link to register: ${referralLink}`;

  const shareOptions = [
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
      link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Sell on Aashansh! Use my referral code ${referralCode} or sign up: ${referralLink}`
      )}`,
    },
    {
      name: 'Email',
      icon: <Mail size={18} />,
      color: 'bg-slate-700 hover:bg-slate-900',
      onClick: openInviteForm,
    },
  ];

  const statCards = [
    {
      label: 'Total Invites',
      value: stats.totalInvites ?? 0,
      icon: <UserPlus size={16} />,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Approved Sellers',
      value: stats.totalApproved ?? 0,
      icon: <UserCheck size={16} />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: 'Pending KYC',
      value: stats.totalPending ?? 0,
      icon: <Handshake size={16} />,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Premium Referrals',
      value: stats.totalPremium ?? 0,
      icon: <Crown size={16} />,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
    {
      label: 'Credits Earned',
      value: formatCurrency(stats.creditsEarned),
      icon: <TrendingUp size={16} />,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      label: 'Pending Credits',
      value: formatCurrency(stats.pendingCredits),
      icon: <CreditCard size={16} />,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      label: 'Your Plan',
      value: currentPlan,
      icon: <Zap size={16} />,
      color: isPremium ? 'text-amber-400' : 'text-slate-400',
      bg: isPremium ? 'bg-amber-400/10' : 'bg-slate-400/10',
    },
    {
      label: 'Per Approval',
      value: formatCurrency(stats.rewardRates?.approvedCredit),
      icon: <Award size={16} />,
      color: 'text-[#ff7a1f]',
      bg: 'bg-[#ff7a1f]/10',
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
                <span className="text-sm font-semibold truncate block">{referralLink}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Invite Link</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0 h-12 px-4 rounded-xl bg-white/5 border border-glass-border flex items-center text-xs sm:text-sm font-medium overflow-x-auto">
                  <span className="truncate">{referralLink}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText('link', referralLink)}
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
            <h3 className="text-xs font-black uppercase tracking-widest mb-4 text-center">
              Referral Statistics
            </h3>
            <div className="responsive-stat-grid">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="border border-glass-border rounded-xl p-3 text-center flex flex-col items-center justify-center min-h-[88px] hover:border-[#ff7a1f]/30 transition-colors"
                >
                  <div
                    className={`h-7 w-7 rounded-lg ${card.bg} ${card.color} flex items-center justify-center mb-2`}
                  >
                    {card.icon}
                  </div>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block mb-0.5">
                    {card.label}
                  </span>
                  <span className="text-sm font-black">{card.value}</span>
                  {(card.label === 'Credits Earned' || card.label === 'Pending Credits' || card.label === 'Per Approval') && (
                    <span className="text-[8px] text-error font-medium mt-0.5">Non-refundable</span>
                  )}
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
            <h2 className="text-2xl font-black mb-2">Free vs Premium Referrer</h2>
            <p className="text-text-muted text-sm max-w-lg mx-auto">
              Premium sellers earn higher credits per referral. Upgrade to unlock better rewards.
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
                    <span className="font-black">Free Seller</span>
                    {!isPremium && (
                      <span className="block text-[10px] font-bold text-text-muted uppercase mt-1">
                        Current Plan
                      </span>
                    )}
                  </th>
                  <th className="py-4 px-5 text-center bg-[#ff7a1f]/5 relative">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ff9a44] to-[#ff6200]" />
                    <span className="font-black text-[#ff7a1f]">Premium Seller</span>
                    {isPremium ? (
                      <span className="block text-[10px] font-bold text-[#ff7a1f] uppercase mt-1">
                        Current Plan
                      </span>
                    ) : (
                      <span className="block text-[10px] font-bold text-[#ff7a1f] uppercase mt-1">
                        Best Value
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
                    {[row.free, row.premium].map((val, ci) => (
                      <td
                        key={ci}
                        className={`py-3 px-5 text-center text-sm font-semibold ${ci === 1 ? 'bg-[#ff7a1f]/5' : ''} ${
                          val === 'NA' ? 'text-text-muted/40' : val === 'Unlimited' || val === 'Yes' ? 'text-emerald-400' : ''
                        }`}
                      >
                        {val === 'NA' ? <Minus size={14} className="mx-auto opacity-40" /> : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="grid grid-cols-3 border-t border-glass-border bg-white/5">
              <div className="py-4 px-6" />
              <div className="py-4 px-5 flex justify-center">
                <span className="text-xs font-bold text-text-muted uppercase">Your current plan</span>
              </div>
              <div className="py-4 px-5 flex justify-center bg-[#ff7a1f]/5">
                {!isPremium ? (
                  <Link
                    to="/seller/subscription"
                    className="h-10 px-6 rounded-full text-xs font-black uppercase bg-gradient-to-r from-[#ff9a44] to-[#ff6200] text-white flex items-center hover:opacity-90 transition-opacity"
                  >
                    Upgrade to Premium
                  </Link>
                ) : (
                  <span className="text-xs font-bold text-[#ff7a1f] uppercase">Active</span>
                )}
              </div>
            </div>
          </div>

          {/* Mobile & tablet plan cards */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                name: 'Free Seller',
                badge: !isPremium ? 'Current Plan' : null,
                highlight: false,
                values: planRows.map((r) => r.free),
              },
              {
                name: 'Premium Seller',
                badge: isPremium ? 'Current Plan' : 'Best Value',
                highlight: true,
                values: planRows.map((r) => r.premium),
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
                  {plan.highlight && !isPremium && (
                    <Link
                      to="/seller/subscription"
                      className="btn w-full h-11 rounded-xl bg-gradient-to-r from-[#ff9a44] to-[#ff6200] text-white font-bold text-sm border-0 flex items-center justify-center"
                    >
                      Upgrade to Premium
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards list */}
      <div className="glass-panel rounded-3xl p-6 md:p-8">
        <h2 className="text-lg font-black mb-4">Rewards</h2>
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

      {/* Email invite form */}
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
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-text-muted flex items-center justify-center"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <form onSubmit={handleSendInvite} className="space-y-4">
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
                    className="input-field w-full"
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
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                  Seller Type *
                </label>
                <div className="flex gap-3">
                  {INVITE_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleInviteChange('inviteeType', t)}
                      className={`h-11 px-5 rounded-xl text-sm font-bold transition-all ${
                        inviteForm.inviteeType === t
                          ? 'bg-[#ff7a1f] text-white'
                          : 'bg-white/5 border border-glass-border text-text-muted hover:border-[#ff7a1f]/50'
                      }`}
                    >
                      {t === 'Artisan' ? (
                        <span className="flex items-center gap-2">
                          <User size={14} /> Artisan
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Building2 size={14} /> Business
                        </span>
                      )}
                    </button>
                  ))}
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
                    className="input-field w-full"
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
                    className="input-field w-full"
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
                  className="input-field w-full"
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
                  className="input-field w-full"
                />
              </div>

              <button
                type="submit"
                disabled={sendingInvite}
                className="w-full h-12 rounded-xl bg-[#ff7a1f] hover:bg-[#e66d1a] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 border-0"
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
    </div>
  );
}
