import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

export default function ReturnPolicy() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <ArrowLeftRight className="text-primary shrink-0" size={28} />
        Return Policy
      </h1>
      <p className="text-text-muted text-sm mb-8">Last updated: May 2026</p>

      <div className="glass-panel p-6 md:p-8 space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <CheckCircle size={18} className="text-secondary" /> Easy 7-Day Returns
          </h2>
          <p>
            We want you to be completely satisfied with your purchase. You can return eligible items within 7 days from the date of delivery. To be eligible for a return, your item must be unused, in the same condition that you received it, and in its original packaging.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-primary" /> Return Process
          </h2>
          <p>
            To initiate a return, go to your profile, navigate to the Order History tab, select the order, and click "Request Return". Alternatively, you can contact our support team. Once approved, we will arrange a reverse pickup from your registered address.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <AlertCircle size={18} className="text-warning" /> Non-Returnable Items
          </h2>
          <p>
            Please note that certain items cannot be returned, including custom-made products, innerwear and personal hygiene items, and clearance sale items. If you receive a damaged or defective item, please report it immediately within 24 hours of delivery.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <HelpCircle size={18} className="text-primary" /> Need Help?
          </h2>
          <p>
            Have questions about returns or reverse pick-ups? Visit our support section or email us at <a href="mailto:info@aashansh.org" className="text-primary hover:underline">info@aashansh.org</a>.
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
