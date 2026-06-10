import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react';

export default function ContactInformation() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <Mail className="text-primary shrink-0" size={28} />
        Contact Information
      </h1>
      <p className="text-text-muted text-sm mb-8">We are here to help. Reach out to us through any of the channels below.</p>

      <div className="glass-panel p-6 md:p-8 space-y-6 text-sm text-text-muted leading-relaxed">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
              <Mail size={18} className="text-secondary" /> Email Support
            </h2>
            <p>
              Drop us an email at:<br />
              <a href="mailto:support@aashansh.org" className="text-primary hover:underline font-medium">
                support@aashansh.org
              </a><br />
              We respond to all inquiries within 24 hours.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
              <Phone size={18} className="text-primary" /> Phone Support
            </h2>
            <p>
              Call us at:<br />
              <span className="text-text font-medium">+91 98765 43210</span><br />
              Monday to Saturday: 9:00 AM - 6:00 PM IST.
            </p>
          </div>
        </section>

        <section className="border-t border-glass-border pt-6">
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <MapPin size={18} className="text-warning" /> Registered Office
          </h2>
          <p>
            Aashansh Marketplace Private Limited,<br />
            123, Creative Spaces Building,<br />
            Indiranagar, Bengaluru,<br />
            Karnataka - 560038, India.
          </p>
        </section>

        <section className="border-t border-glass-border pt-6">
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <MessageSquare size={18} className="text-emerald-400" /> Digital Support Tickets
          </h2>
          <p>
            You can raise an interactive ticket on our{' '}
            <Link to="/support" className="text-primary hover:underline">
              Support Page
            </Link>{' '}
            for quicker tracking and instant response from our operations team.
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
