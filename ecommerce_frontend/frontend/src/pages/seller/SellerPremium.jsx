import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, BadgeCheck, BarChart2, Gift, ArrowRight } from 'lucide-react';

const SellerPremium = () => {
  return (
    <div className="animate-fade-in w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 p-0 sm:p-2">
        {/* Header */}
        <div className="text-center px-1">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-2">
            Become a Premium Seller
          </h1>
          <p className="text-base sm:text-lg text-gray-200">
            Unlock powerful tools to grow your business and reach B2B buyers.
          </p>
        </div>

        {/* Premium Badge Preview */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/30 shadow-glow">
            <BadgeCheck size={20} />
            <span className="font-bold">Premium Seller</span>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="glass-panel seller-panel rounded-2xl flex flex-col gap-3">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <CheckCircle className="text-primary" size={20} /> Features
            </h2>
            <ul className="space-y-2 text-text-muted">
              <li className="flex items-center gap-2">
                <CheckCircle className="text-success" size={16} /> Bulk purchase requests
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="text-success" size={16} /> Direct B2B inquiries
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="text-success" size={16} /> Private price negotiation chat
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="text-success" size={16} /> Dedicated account manager
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="text-success" size={16} /> Multiple storefronts
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="text-success" size={16} /> Multiple store pickup addresses
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="text-success" size={16} /> Multiple categories, sub-categories & product types
              </li>
            </ul>
          </div>

          {/* Demo Analytics */}
          <div className="glass-panel seller-panel rounded-2xl flex flex-col gap-3">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <BarChart2 className="text-primary" size={20} /> Demo Analytics
            </h2>
            <p className="text-text-muted mb-2">
              See how your performance metrics will look once you upgrade.
            </p>
            {/* Placeholder chart */}
            <div className="h-48 bg-surface/10 rounded-xl flex items-center justify-center text-text-muted">
              [Chart Placeholder]
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center">
          <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-xl mb-2">
            <span className="text-2xl sm:text-3xl font-bold">₹9,125</span>
            <span className="text-sm text-primary/70"> / year (+18% GST)</span>
          </div>
          <div className="text-xs text-error font-semibold mb-4">
            (Non-refundable)
          </div>
          <p className="text-text-muted mb-6">
            One-time annual subscription – includes all premium features.
          </p>
        </div>

        {/* Call to Action */}
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            to="/seller/subscription"
            className="btn btn-primary px-8 py-3 font-bold rounded-xl shadow-glow"
          >
            Upgrade to Premium
          </Link>
          <Link to="/contact" className="btn btn-secondary px-8 py-3 font-bold rounded-xl shadow-glow">
            Apply Now
          </Link>
        </div>

        {/* Refer and Earn */}
        <div className="glass-panel seller-panel rounded-2xl border border-[#ff7a1f]/30 bg-gradient-to-br from-[#ff7a1f]/10 to-transparent">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-[#ff7a1f]/20 text-[#ff7a1f] flex items-center justify-center shrink-0">
                <Gift size={24} className="sm:hidden" />
                <Gift size={28} className="hidden sm:block" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Refer and Earn More</h2>
                <p className="text-text-muted max-w-xl">
                  Premium sellers earn ₹750 per approved referral plus ₹1,500 when their referral upgrades.
                  Share your link or send branded email invites from your referral hub.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-text-muted">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-success shrink-0" size={16} /> Unlimited seller invitations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-success shrink-0" size={16} /> WhatsApp, Twitter &amp; email sharing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-success shrink-0" size={16} /> Full referral stats dashboard
                  </li>
                </ul>
              </div>
            </div>
            <Link
              to="/seller/refer-and-earn"
              className="btn w-full sm:w-auto h-12 px-6 sm:px-8 rounded-xl bg-[#ff7a1f] hover:bg-[#e66d1a] text-white font-bold border-0 flex items-center justify-center gap-2 shrink-0"
            >
              Go to Referral Hub <ArrowRight size={18} />
            </Link>
          </div>
        </div>
    </div>
  );
};

export default SellerPremium;
