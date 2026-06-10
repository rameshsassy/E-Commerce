import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, User, Store, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/search/SearchBar';
import NotificationBell from '../components/notifications/NotificationBell';
import { getSellerPortalOrigin } from '../utils/portalHost';
import Footer from '../components/common/Footer';

const CATEGORIES = ['Bags', 'Jewellery', 'Snacks', 'Women Hygiene', 'Books', 'Lifestyle'];

const PublicLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-panel sticky top-0 z-50 mx-2 sm:mx-4 mt-2 sm:mt-4 mb-0 flex flex-col gap-3 sm:gap-4 py-3 sm:py-4 px-3 sm:px-6 lg:px-8 shadow-md safe-area-top">
        <div className="flex justify-between items-center gap-2 sm:gap-4">
          <Link to="/" className="shrink-0 flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src="/brand/aashansh-logo.png"
              alt="Aashansh"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </Link>

          <div className="hidden lg:flex flex-1 max-w-2xl relative min-w-0">
            <SearchBar />
          </div>

          <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              type="button"
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full border border-glass-border hover:bg-white/5 text-text-muted"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label={mobileSearchOpen ? 'Hide search' : 'Show search'}
              aria-expanded={mobileSearchOpen}
            >
              <Search size={20} />
            </button>

            <div className="hidden md:flex items-center gap-3 lg:gap-5">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={user.role === 'customer' ? '/profile' : `/${user.role}/dashboard`}
                    className="flex items-center gap-2 text-text hover:text-primary transition-all font-bold bg-white/5 px-3 lg:px-4 py-2 rounded-full border border-glass-border"
                  >
                    <User size={18} className="text-primary shrink-0" />
                    <span className="hidden lg:inline truncate max-w-[120px]">Hi, {user.firstName}</span>
                  </Link>
                  <NotificationBell />
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link to="/login" className="btn btn-secondary py-2 px-3 sm:px-5 text-xs sm:text-sm font-bold rounded-full">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-primary py-2 px-3 sm:px-5 text-xs sm:text-sm font-bold rounded-full shadow-glow">
                    Join Free
                  </Link>
                </div>
              )}

              <div className="hidden sm:block h-8 w-px bg-glass-border" />

              <div className="flex items-center gap-2 sm:gap-4">
                <Link to="/wishlist" className="text-text-muted hover:text-secondary transition-all relative p-2 hover:bg-white/5 rounded-full" aria-label="Wishlist">
                  <Heart size={20} className="sm:w-[22px] sm:h-[22px]" />
                  <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-surface">0</span>
                </Link>
                <Link to="/cart" className="text-text-muted hover:text-primary transition-all relative p-2 hover:bg-white/5 rounded-full" aria-label="Cart">
                  <ShoppingBag size={20} className="sm:w-[22px] sm:h-[22px]" />
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-surface">0</span>
                </Link>
              </div>
            </div>

            <button
              type="button"
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full border border-glass-border hover:bg-white/5"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </nav>
        </div>

        {mobileSearchOpen && (
          <div className="lg:hidden w-full min-w-0 pb-1">
            <SearchBar />
          </div>
        )}

        <div className="category-scroll border-t border-glass-border pt-3 -mx-1 px-1">
          <div className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-1 text-[12px] sm:text-[13px] font-bold text-text-muted whitespace-nowrap scrollbar-thin">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/products?category=${encodeURIComponent(cat)}`}
                className="hover:text-primary transition-colors shrink-0"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed top-[4.5rem] left-2 right-2 z-50 glass-panel p-4 rounded-2xl shadow-lg animate-fade-in max-h-[70vh] overflow-y-auto">
            {user ? (
              <div className="flex flex-col gap-3">
                <Link
                  to={user.role === 'customer' ? '/profile' : `/${user.role}/dashboard`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-glass-border font-bold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={20} className="text-primary" />
                  Hi, {user.firstName}
                </Link>
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm text-text-muted">Notifications</span>
                  <NotificationBell />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" className="btn btn-secondary w-full" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary w-full" onClick={() => setMobileMenuOpen(false)}>
                  Join Free
                </Link>
              </div>
            )}
            <div className="flex gap-4 mt-4 pt-4 border-t border-glass-border">
              <Link to="/wishlist" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-glass-border" onClick={() => setMobileMenuOpen(false)}>
                <Heart size={18} /> Wishlist
              </Link>
              <Link to="/cart" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-glass-border" onClick={() => setMobileMenuOpen(false)}>
                <ShoppingBag size={18} /> Cart
              </Link>
            </div>
          </div>
        </>
      )}

      <main className="flex-grow flex flex-col min-w-0">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default PublicLayout;
