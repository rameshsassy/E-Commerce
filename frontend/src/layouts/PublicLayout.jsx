import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-panel py-4 px-8 flex justify-between items-center m-4 mb-0">
        <Link to="/products" className="font-bold text-xl text-primary" style={{ color: 'var(--color-primary)' }}>E-commerce website</Link>
        <nav className="flex gap-4">
          <Link to="/products" className="hover:text-primary transition-colors" style={{ transition: 'color 0.2s' }}>Products</Link>
          <Link to="/login" className="hover:text-primary transition-colors" style={{ transition: 'color 0.2s' }}>Login</Link>
        </nav>
      </header>
      
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
