import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

export default function ReplacementPolicy() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <RefreshCw className="text-primary shrink-0" size={28} />
        Replacement Policy
      </h1>
      <p className="text-text-muted text-sm mb-8">Last updated: May 2026</p>

      <div className="glass-panel p-6 md:p-8 space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <CheckCircle size={18} className="text-secondary" /> Damaged or Defective Items
          </h2>
          <p>
            If you receive an item that is damaged, defective, or incorrect, you are eligible for a free replacement. Please report any issues within 48 hours of delivery by providing photos or videos of the issue through our Support channel.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <RefreshCw size={18} className="text-primary" /> Exchange Process
          </h2>
          <p>
            Once the replacement request is approved by the seller, a replacement order will be generated. The courier will deliver the new product and collect the old product simultaneously (hand-to-hand exchange) or pick up the old product first before shipping the new one.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <AlertCircle size={18} className="text-warning" /> Conditions for Replacement
          </h2>
          <p>
            Replacement depends on product stock availability. In case the item is out of stock, we will issue a full refund to your original payment method. The product must be returned with all original tags, accessories, and manuals.
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
