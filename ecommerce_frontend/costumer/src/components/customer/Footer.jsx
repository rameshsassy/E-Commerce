import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Instagram, Facebook, Linkedin, Truck, ShieldCheck, Award, Heart } from "lucide-react";

function FeatureItem({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fef9c3] border border-yellow-200/50 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className="text-xs md:text-sm font-bold text-slate-900 truncate">
          {title}
        </h4>
        <p className="text-[10px] md:text-xs text-slate-500 truncate mt-0.5">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <>
      {/* Features Bar — above footer on every page */}
      <section className="container-page py-6">
        <div className="rounded-3xl bg-[#faf8f5] p-6 md:p-8 border border-amber-100/30">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            <FeatureItem
              icon={<Truck className="h-5 w-5 text-slate-800" />}
              title="Fast delivery"
              subtitle="Quick & reliable delivery"
            />
            <FeatureItem
              icon={<ShieldCheck className="h-5 w-5 text-slate-800" />}
              title="Secure payments"
              subtitle="100% secure transactions"
            />
            <FeatureItem
              icon={<Award className="h-5 w-5 text-slate-800" />}
              title="Quality assured"
              subtitle="Handpicked for you"
            />
            <FeatureItem
              icon={<Heart className="h-5 w-5 text-slate-800" />}
              title="Loved locally"
              subtitle="Supporting local businesses"
            />
          </div>
        </div>
      </section>

    <footer className="mt-0 bg-[#060814] text-slate-300 border-t border-slate-900/60 font-sans">
      {/* Top contact row */}
      <div className="container-page py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Find Us */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-wider text-white uppercase font-display">Find Us</h4>
              <p className="mt-1 text-sm text-slate-400">Borivali, Mumbai - 400092</p>
            </div>
          </div>

          {/* Call Us */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-wider text-white uppercase font-display">Call Us</h4>
              <p className="mt-1 text-sm text-slate-400">+91 9867443283</p>
            </div>
          </div>

          {/* Mail Us */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-wider text-white uppercase font-display">Mail Us</h4>
              <p className="mt-1 text-sm text-slate-400">
                <a href="mailto:info@aashansh.org" className="hover:text-blue-400 transition-colors">
                  info@aashansh.org
                </a>
              </p>
            </div>
          </div>

          {/* Follow Us */}
          <div className="flex flex-col justify-start">
            <h4 className="text-sm font-bold tracking-wider text-white uppercase font-display">Follow Us</h4>
            <div className="mt-2.5 flex items-center gap-4">
              <a
                href="https://www.instagram.com/aashansh/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/Aashansh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/aashansh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-900/60" />

      {/* Middle Links & About Section */}
      <div className="container-page py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          {/* About Column */}
          <div className="lg:col-span-6 space-y-4">
            <p className="text-sm leading-relaxed text-slate-400 max-w-xl">
              Aashansh is a purpose-driven e-commerce platform
              connecting you to authentic, handcrafted, and
              everyday products made by aspiring brands. Every
              purchase supports real people, real stories, and
              stronger communities. Shop with Aashansh and be
              a part of India's movement toward conscious,
              inclusive, and impactful consumption.
            </p>
          </div>

          {/* Useful Links Column */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-bold tracking-wider text-white uppercase font-display">Useful Links</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <a href="https://seller.aashansh.org/register" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Sell with Aashansh
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <Link to="/support" className="hover:text-white transition-colors">
                  Contact information
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <Link to="/refer-and-earn" className="hover:text-white transition-colors">
                  Refer & Earn
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <Link to="/faqs" className="hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <Link to="/orders" className="hover:text-white transition-colors">
                  Track orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Policy Column */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-bold tracking-wider text-white uppercase font-display">Policy</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <Link to="/policies/refund-policy" className="hover:text-white transition-colors">
                  Refund policy
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <Link to="/policies/return-policy" className="hover:text-white transition-colors">
                  Return Policy
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <Link to="/policies/replacement-policy" className="hover:text-white transition-colors">
                  Replacement Policy
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <Link to="/policies/terms-of-use" className="hover:text-white transition-colors">
                  Terms of Use
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <Link to="/policies/shipping-policy" className="hover:text-white transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <Link to="/policies/seller-agreement" className="hover:text-white transition-colors">
                  Seller Agreement
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-900/60" />

      {/* Copyright row */}
      <div className="container-page py-6 text-center text-xs text-slate-500">
        © 2026 | Funds And Toil Private Limited (Aashansh) | All Right Reserved | Made with love in India
      </div>
    </footer>
    </>
  );
}
