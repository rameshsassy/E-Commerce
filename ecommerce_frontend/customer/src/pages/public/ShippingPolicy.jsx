import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Clock, Compass } from 'lucide-react';

export default function ShippingPolicy() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <Truck className="text-primary shrink-0" size={28} />
        Shipping Policy
      </h1>
      <p className="text-text-muted text-sm mb-8">Last updated: May 2026</p>

      <div className="glass-panel p-6 md:p-8 space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <Clock size={18} className="text-secondary" /> Processing & Delivery Times
          </h2>
          <p>
            Standard orders are processed within 1-2 business days. Estimated delivery times are typically 3-5 business days depending on your delivery location. Pincodes located in remote regions may take up to 7-10 business days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <Truck size={18} className="text-primary" /> Shipping Charges
          </h2>
          <p>
            We offer free standard shipping on all orders valued above Rs. 999. For orders below this threshold, a flat delivery fee of Rs. 50 will be charged during checkout.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <Compass size={18} className="text-warning" /> Order Tracking
          </h2>
          <p>
            As soon as your package has been handed over to our logistics partner, a tracking link will be shared via email and SMS. You can also view real-time tracking updates directly under your profile order dashboard.
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
