import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { getOtherPortalRegisterUrl, getCustomerPortalOrigin } from '../../utils/portalHost';

const InstagramIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const LinkedinIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function Footer() {
  const customerPortalOrigin = getCustomerPortalOrigin();
  const sellerRegisterUrl = getOtherPortalRegisterUrl();

  return (
    <footer className="bg-slate-950 border-t border-glass-border pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-auto w-full text-white">
      {/* Top Section: Contact & Social Info */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-glass-border">
        {/* Find Us */}
        <div className="flex items-start gap-3">
          <MapPin className="text-primary shrink-0 mt-0.5" size={24} />
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">Find Us</h4>
            <p className="text-text-muted text-sm mt-2 leading-relaxed">Borivali, Mumbai - 400092</p>
          </div>
        </div>

        {/* Call Us */}
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white text-white shrink-0 mt-0.5">
            <Phone size={16} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">Call Us</h4>
            <p className="text-text-muted text-sm mt-2 leading-relaxed">+91 9867443283</p>
          </div>
        </div>

        {/* Mail Us */}
        <div className="flex items-start gap-3">
          <Mail className="text-primary shrink-0 mt-0.5" size={24} />
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">Mail Us</h4>
            <p className="text-text-muted text-sm mt-2 leading-relaxed">
              <a href="mailto:info@aashansh.org" className="hover:text-white transition-colors">
                info@aashansh.org
              </a>
            </p>
          </div>
        </div>

        {/* Follow Us */}
        <div>
          <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-2">Follow Us</h4>
          <div className="flex items-center gap-4 mt-2">
            <a
              href="https://www.instagram.com/aashansh/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <InstagramIcon size={22} />
            </a>
            <a
              href="https://www.facebook.com/Aashansh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <FacebookIcon size={22} />
            </a>
            <a
              href="https://www.linkedin.com/company/aashansh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-white transition-colors"
              aria-label="LinkedIn"
            >
              <LinkedinIcon size={22} />
            </a>
          </div>
        </div>
      </div>

      {/* Middle Section: Description & Links */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 py-12">
        {/* Brand Description */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <p className="text-text-muted text-sm leading-relaxed max-w-xl">
            Aashansh is a purpose-driven e-commerce platform connecting awesome brands like you B2C
            and B2B customers to amplify business growth. Sell with Aashansh and be a part of
            India’s movement toward conscious, inclusive, and impactful consumption.
          </p>
        </div>

        {/* Useful Links */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <h4 className="font-bold text-sm text-white uppercase tracking-wider">Useful Links</h4>
          <ul className="space-y-2.5 text-sm text-text-muted font-medium list-disc pl-4">
            <li>
              <a href={customerPortalOrigin} className="hover:text-white transition-colors">Home</a>
            </li>
            <li>
              <a href="https://seller.aashansh.org/register" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Sell with Aashansh</a>
            </li>
            <li>
              <Link to="/contact-info" className="hover:text-white transition-colors">Contact information</Link>
            </li>
            <li>
              <Link to="/seller/refer-and-earn" className="hover:text-white transition-colors">Refer & Earn</Link>
            </li>
            <li>
              <a href="/faq" className="hover:text-white transition-colors">FAQs</a>
            </li>
            <li>
              <Link to="/seller/orders-enquiries" className="hover:text-white transition-colors">Track orders</Link>
            </li>
          </ul>
        </div>

        {/* Policy Links */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <h4 className="font-bold text-sm text-white uppercase tracking-wider">Policy</h4>
          <ul className="space-y-2.5 text-sm text-text-muted font-medium list-disc pl-4">
            <li>
              <Link to="/policies/refund-policy" className="hover:text-white transition-colors">Refund policy</Link>
            </li>
            <li>
              <Link to="/policies/return-policy" className="hover:text-white transition-colors">Return Policy</Link>
            </li>
            <li>
              <Link to="/policies/replacement-policy" className="hover:text-white transition-colors">Replacement Policy</Link>
            </li>
            <li>
              <Link to="/policies/terms-of-use" className="hover:text-white transition-colors">Terms of Use</Link>
            </li>
            <li>
              <Link to="/policies/shipping-policy" className="hover:text-white transition-colors">Shipping Policy</Link>
            </li>
            <li>
              <Link to="/policies/seller-agreement" className="hover:text-white transition-colors">Seller Agreement</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Section: Copyright */}
      <div className="max-w-7xl mx-auto border-t border-glass-border pt-6 text-center">
        <p className="text-xs text-text-muted font-medium tracking-wide">
          &copy; 2026 | Funds And Toil Private Limited (Aashansh) | All Right Reserved | Made with love in India
        </p>
      </div>
    </footer>
  );
}
