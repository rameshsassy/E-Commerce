import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Lock, Globe } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <Shield className="text-primary shrink-0" size={28} />
        Privacy Policy
      </h1>
      <p className="text-text-muted text-sm mb-8">Last updated: May 2026</p>

      <div className="glass-panel p-6 md:p-8 space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <Eye size={18} className="text-secondary" /> Data Collection
          </h2>
          <p>
            We collect personal information that you provide to us, such as your name, email address, mailing address, payment details, and telephone number, when you register, make a purchase, or subscribe to our newsletter.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <Lock size={18} className="text-primary" /> Information Security
          </h2>
          <p>
            Your data safety is our priority. We implement appropriate technical and organisational measures to secure your personal data against accidental loss, unauthorized access, alteration, and disclosure. Payment data is processed securely via integrated Razorpay gateways.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <Globe size={18} className="text-warning" /> Cookies & Tracking
          </h2>
          <p>
            Aashansh uses cookies and session identifiers to enhance your browsing experience, analyze site traffic, and track your shopping cart status. You can manage or disable cookies via your browser settings.
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
