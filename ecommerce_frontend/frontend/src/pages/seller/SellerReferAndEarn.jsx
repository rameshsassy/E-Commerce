import React, { useEffect, useState } from 'react';
import { Gift, Copy, Check, Users, Share2 } from 'lucide-react';
import api from '../../utils/api';

export default function SellerReferAndEarn() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/seller/refer-and-earn');
        if (!cancelled) setData(res.data?.data ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load Refer and Earn');
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

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold mb-8">Refer and Earn</h1>
        <div className="glass-panel p-8 rounded-2xl text-text-muted">Loading…</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold mb-8">Refer and Earn</h1>
        <div className="glass-panel p-8 rounded-2xl text-error">{error}</div>
      </div>
    );
  }

  const { program, referralCode, referralLink, stats } = data || {};

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Gift className="text-primary" size={32} />
          {program?.title || 'Refer and Earn'}
        </h1>
        <p className="text-text-muted max-w-2xl">{program?.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-primary/20">
          <p className="text-sm text-text-muted mb-1">Successful referrals</p>
          <p className="text-3xl font-bold flex items-center gap-2">
            <Users size={24} className="text-primary" />
            {stats?.referralSignups ?? 0}
          </p>
        </div>
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div>
            <p className="text-sm text-text-muted mb-2">Your referral code</p>
            <div className="flex flex-wrap items-center gap-3">
              <code className="text-xl font-mono font-bold tracking-wider bg-white/5 px-4 py-2 rounded-lg border border-glass-border">
                {referralCode}
              </code>
              <button
                type="button"
                onClick={() => copyText('code', referralCode)}
                className="btn btn-secondary flex items-center gap-2 text-sm"
              >
                {copied === 'code' ? <Check size={16} /> : <Copy size={16} />}
                {copied === 'code' ? 'Copied' : 'Copy code'}
              </button>
            </div>
          </div>
          <div>
            <p className="text-sm text-text-muted mb-2">Shareable registration link</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                readOnly
                value={referralLink || ''}
                className="flex-1 bg-white/5 border border-glass-border rounded-lg px-3 py-2 text-sm truncate"
              />
              <button
                type="button"
                onClick={() => copyText('link', referralLink)}
                className="btn btn-primary flex items-center justify-center gap-2 text-sm shrink-0"
              >
                {copied === 'link' ? <Check size={16} /> : <Share2 size={16} />}
                {copied === 'link' ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-2xl">
        <h2 className="text-xl font-bold mb-6">How it works</h2>
        <ol className="space-y-6">
          {(program?.steps || []).map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold">{step.title}</p>
                <p className="text-text-muted text-sm mt-1">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="glass-panel p-8 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Rewards</h2>
        <ul className="space-y-2">
          {(program?.rewards || []).map((item) => (
            <li key={item} className="flex items-start gap-2 text-text-muted">
              <Check size={18} className="text-success shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
        {program?.termsNote && (
          <p className="text-xs text-text-muted mt-6 border-t border-glass-border pt-4">{program.termsNote}</p>
        )}
      </div>
    </div>
  );
}
