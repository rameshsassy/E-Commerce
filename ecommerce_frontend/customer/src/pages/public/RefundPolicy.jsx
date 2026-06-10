import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCcw, CheckCircle, AlertCircle } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <RefreshCcw className="text-primary shrink-0" size={28} />
        Refund Policy
      </h1>
      <p className="text-text-muted text-sm mb-8">Last updated: May 2026</p>

      <div className="glass-panel p-6 md:p-8 space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <CheckCircle size={18} className="text-secondary" /> 7-Day Return Window
          </h2>
          <p>
            We offer a hassle-free 7-day return policy. Most items purchased from Aashansh can be returned within 7 days of delivery for a full refund or exchange. Items must be unused, unwashed, and in their original packaging with all tags intact.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <RefreshCcw size={18} className="text-primary" /> Refund Processing
          </h2>
          <p>
            Once the seller receives and inspects the returned product, your refund will be initiated. The refund amount will be credited back to your original payment method (Credit/Debit Card, UPI, or Net Banking) within 5-7 business days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <AlertCircle size={18} className="text-warning" /> Exceptions & Exclusions
          </h2>
          <p>
            Certain categories of products such as personalized items, custom orders, items bought during specific clearance sales, and intimate hygiene products are not eligible for returns unless they arrive damaged or defective.
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
