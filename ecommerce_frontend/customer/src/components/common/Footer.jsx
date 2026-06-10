import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import api from '../../utils/api';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusError, setStatusError] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setStatusMsg('');
    try {
      const response = await api.post('/public/newsletter/subscribe', { email });
      setStatusMsg(response.data.message || 'Successfully subscribed!');
      setStatusError(false);
      setEmail('');
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Failed to subscribe. Please try again.');
      setStatusError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-slate-950/40 border-t border-glass-border pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-auto w-full">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Section: Info & Subscribe */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div>
            <h3 className="font-bold text-xl mb-4 text-white uppercase tracking-wider">Aashansh</h3>
            <p className="text-text-muted text-sm leading-relaxed max-w-2xl">
              Aashansh is a purpose-driven e-commerce platform connecting you to authentic,
              handcrafted, and everyday products made by aspiring brands. Every purchase supports real
              people, real stories, and stronger communities. Shop with Aashansh and be a part of India’s
              movement toward conscious, inclusive, and impactful consumption.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">
              Subscribe and be the first to know the new launches
            </h4>
            <form onSubmit={handleSubscribe} className="relative max-w-md w-full">
              <div className="relative flex items-center border border-glass-border focus-within:border-primary/50 rounded-xl overflow-hidden bg-white/5 transition-all">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-text-muted/60 focus:outline-none pr-12 font-medium"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-white transition-colors"
                  aria-label="Subscribe"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
              {statusMsg && (
                <p className={`mt-2 text-xs font-semibold ${statusError ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {statusMsg}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Right Section: Quick Links */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h3 className="font-bold text-xl text-white uppercase tracking-wider">Quick links</h3>
          <ul className="space-y-3 text-sm text-text-muted font-medium">
            <li>
              <Link to="/faq" className="hover:text-white transition-colors">
                Frequently Asked Questions (Seller)
              </Link>
            </li>
            <li>
              <Link to="/about-us" className="hover:text-white transition-colors">
                About Aashansh
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto border-t border-glass-border mt-12 pt-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted font-semibold">
          <span>&copy; 2026, Aashansh</span>
          <span>&middot;</span>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy policy</Link>
          <span>&middot;</span>
          <Link to="/contact-info" className="hover:text-white transition-colors">Contact information</Link>
          <span>&middot;</span>
          <Link to="/refund-policy" className="hover:text-white transition-colors">Refund policy</Link>
          <span>&middot;</span>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of service</Link>
          <span>&middot;</span>
          <Link to="/shipping-policy" className="hover:text-white transition-colors">Shipping policy</Link>
        </div>
      </div>
    </footer>
  );
}
