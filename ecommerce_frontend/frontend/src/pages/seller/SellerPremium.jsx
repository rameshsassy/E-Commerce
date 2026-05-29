import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, BadgeCheck, BarChart2 } from 'lucide-react';

const SellerPremium = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-2">
            Become a Premium Seller
          </h1>
          <p className="text-lg text-gray-200">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3">
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
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3">
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
          <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-xl mb-4">
            <span className="text-3xl font-bold">₹9,125</span>
            <span className="text-sm text-primary/70"> / year (+18% GST)</span>
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
      </div>
    </div>
  );
};

export default SellerPremium;
