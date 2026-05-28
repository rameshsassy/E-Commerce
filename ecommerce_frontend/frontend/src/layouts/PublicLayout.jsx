import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShoppingBag, Heart, User, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/search/SearchBar';
import NotificationBell from '../components/notifications/NotificationBell';

const PublicLayout = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">


      <header className="glass-panel sticky top-0 z-50 m-4 mb-0 flex flex-col gap-4 py-4 px-8 shadow-md">
        {/* Main Navbar */}
        <div className="flex justify-between items-center gap-8">
          {/* Logo */}
          <Link to="/" className="font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary shrink-0">
            AASHANSH
          </Link>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-2xl relative">
            <SearchBar />
          </div>

          {/* User Actions */}
          <nav className="flex items-center gap-5">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to={user.role === 'customer' ? '/profile' : `/${user.role}/dashboard`} className="flex items-center gap-2 text-text hover:text-primary transition-all font-bold bg-white/5 px-4 py-2 rounded-full border border-glass-border">
                  <User size={18} className="text-primary" />
                  <span className="hidden sm:inline">Hi, {user.firstName}</span>
                </Link>
                {user && <NotificationBell />}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="btn btn-secondary py-2 px-5 text-sm font-bold rounded-full">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary py-2 px-5 text-sm font-bold rounded-full shadow-glow">
                  Join Free
                </Link>
              </div>
            )}
            
            <div className="h-8 w-[1px] bg-glass-border mx-2"></div>

            <div className="flex items-center gap-4">
              <Link to="/wishlist" className="text-text-muted hover:text-secondary transition-all relative p-2 hover:bg-white/5 rounded-full">
                <Heart size={22} />
                <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-surface">0</span>
              </Link>
              <Link to="/cart" className="text-text-muted hover:text-primary transition-all relative p-2 hover:bg-white/5 rounded-full">
                <ShoppingBag size={22} />
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-surface">0</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* Categories Bar */}
        <div className="flex justify-center gap-4 sm:gap-6 md:gap-10 text-[13px] font-bold text-text-muted border-t border-glass-border pt-4">
          {['Bags', 'Jewellery', 'Snacks', 'Women Hygiene', 'Books', 'Lifestyle'].map((cat) => (
            <Link 
              key={cat}
              to={`/products?category=${encodeURIComponent(cat)}`} 
              className="hover:text-primary transition-colors hover:scale-105 transform duration-200"
            >
              {cat}
            </Link>
          ))}
        </div>
      </header>
      
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-surface py-12 px-8 mt-20 border-t border-glass-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">AASHANSH</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Empowering women and promoting handcrafted, eco-friendly products. Every purchase makes a difference.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Shop</h4>
            <ul className="space-y-2 text-text-muted text-sm">
              <li><Link to="/products" className="hover:text-primary">All Products</Link></li>
              <li><Link to="/products?category=Bags" className="hover:text-primary">Bags</Link></li>
              <li><Link to="/products?category=Jewellery" className="hover:text-primary">Jewellery</Link></li>
              <li><Link to="/products?category=Snacks" className="hover:text-primary">Snacks</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-text-muted text-sm">
              <li><Link to="/support" className="hover:text-primary">Contact Us</Link></li>
              <li><Link to="/returns" className="hover:text-primary">Returns & Refunds</Link></li>
              <li><Link to="/track" className="hover:text-primary">Track Order</Link></li>
              <li><Link to="/faq" className="hover:text-primary">FAQs</Link></li>
              <li className="pt-2 border-t border-glass-border mt-2">
                <Link to="/register?role=seller" className="text-secondary font-bold hover:text-primary flex items-center gap-2">
                  <Store size={14} /> Sell on Aashansh
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Newsletter</h4>
            <p className="text-text-muted text-sm mb-4">Get updates on new collections and special offers.</p>
            <div className="flex">
              <input type="email" placeholder="Your email" className="input-field rounded-r-none border-r-0" />
              <button className="btn btn-primary rounded-l-none">Subscribe</button>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-glass-border text-center text-text-muted text-sm">
          &copy; {new Date().getFullYear()} Aashansh Marketplace. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
