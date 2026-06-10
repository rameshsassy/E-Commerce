import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, ShieldAlert } from 'lucide-react';

export default function SellerAgreement() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <FileText className="text-primary shrink-0" size={28} />
        Seller Agreement
      </h1>
      <p className="text-text-muted text-sm mb-8">Last updated: May 2026</p>

      <div className="glass-panel p-6 md:p-8 space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <CheckCircle size={18} className="text-secondary" /> Introduction & Onboarding
          </h2>
          <p>
            This Seller Agreement governs your participation as a merchant on Aashansh. By registering and listing products, you agree to comply with our listing standards, fulfillment guidelines, and ethical trade practices.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <FileText size={18} className="text-primary" /> Listing Fees & Commission
          </h2>
          <p>
            Aashansh charges a flat commission on successful orders, depending on the seller plan (Free, Pro, Premium). Payouts are initiated weekly and credited to your registered bank account after deducting applicable fees and taxes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <ShieldAlert size={18} className="text-warning" /> Order Fulfillment & Quality
          </h2>
          <p>
            Sellers are responsible for packing and preparing items for pickup within 48 hours of order receipt. All products must conform to the details, sizes, and images shown on the product page. Selling counterfeit or sub-standard goods is strictly prohibited and can lead to suspension.
          </p>
        </section>
      </div>

      <p className="mt-8">
        <Link to="/" className="text-primary hover:underline text-sm">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
