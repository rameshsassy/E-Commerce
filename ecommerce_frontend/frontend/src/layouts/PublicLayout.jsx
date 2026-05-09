import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PublicLayout = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Banner */}
      <div className="bg-primary text-white text-center py-2 text-sm font-medium tracking-wide">
        Empowering Women Artisans | Free Shipping on Orders Over Rs. 999 🌿
      </div>

      <header className="glass-panel sticky top-0 z-50 m-4 mb-0 flex flex-col gap-4 py-4 px-8 shadow-md">
        {/* Main Navbar */}
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="font-extrabold text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            AASHANSH
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
            <input 
              type="text" 
              placeholder="Search handcrafted products, brands, categories..." 
              className="input-field rounded-full pl-12 bg-surface border-glass-border focus:border-primary transition-all w-full"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
          </div>

          {/* User Actions */}
          <nav className="flex items-center gap-6">
            {user ? (
              <Link to="/profile" className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors font-medium">
                <User size={20} className="text-primary" />
                <span className="hidden md:inline text-primary">Hi, {user.firstName}</span>
              </Link>
            ) : (
              <Link to="/login" className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors font-medium">
                <User size={20} />
                <span className="hidden md:inline">Login / Register</span>
              </Link>
            )}
            <Link to="/wishlist" className="text-text-muted hover:text-secondary transition-colors relative">
              <Heart size={24} />
              <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">0</span>
            </Link>
            <Link to="/cart" className="text-text-muted hover:text-primary transition-colors relative">
              <ShoppingBag size={24} />
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">0</span>
            </Link>
          </nav>
        </div>

        {/* Categories Bar */}
        <div className="hidden md:flex justify-center gap-8 text-sm font-medium text-text-muted">
          <Link to="/products?category=Bags" className="hover:text-primary transition-colors">Bags</Link>
          <Link to="/products?category=Jewellery" className="hover:text-primary transition-colors">Jewellery</Link>
          <Link to="/products?category=Snacks" className="hover:text-primary transition-colors">Snacks</Link>
          <Link to="/products?category=Women Hygiene" className="hover:text-primary transition-colors">Women Hygiene</Link>
          <Link to="/products?category=Books" className="hover:text-primary transition-colors">Books</Link>
          <Link to="/products?category=Lifestyle" className="hover:text-primary transition-colors">Lifestyle</Link>
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
              <li><Link to="/contact" className="hover:text-primary">Contact Us</Link></li>
              <li><Link to="/returns" className="hover:text-primary">Returns & Refunds</Link></li>
              <li><Link to="/track" className="hover:text-primary">Track Order</Link></li>
              <li><Link to="/faq" className="hover:text-primary">FAQs</Link></li>
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
