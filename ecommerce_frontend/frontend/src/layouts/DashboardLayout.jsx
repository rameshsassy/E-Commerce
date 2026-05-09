import React from 'react';
import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Package, Users, FileCheck } from 'lucide-react';

const DashboardLayout = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Protect route based on role
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-900" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <aside className="w-64 glass-panel m-4 flex flex-col">
        <div className="p-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <h2 className="text-xl font-bold text-primary" style={{ color: 'var(--color-primary)' }}>
            {role === 'admin' ? 'Admin Panel' : 'Seller Hub'}
          </h2>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link to={`/${role}/dashboard`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors" style={{ transition: 'background-color 0.2s' }}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>

          {role === 'seller' && (
            <>
              <Link to="/seller/products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                <Package size={20} /> My Products
              </Link>
              <Link to="/seller/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                <FileCheck size={20} /> Profile & KYC
              </Link>
            </>
          )}

          {role === 'admin' && (
            <>
              <Link to="/admin/sellers" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                <Users size={20} /> Manage Sellers
              </Link>
              <Link to="/admin/kyc" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                <FileCheck size={20} /> KYC Approvals
              </Link>
              <Link to="/admin/products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                <Package size={20} /> Product Approvals
              </Link>
            </>
          )}

          <div className="mt-auto border-t border-glass-border pt-4">
            <Link to="/products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors text-text-muted">
              <LayoutDashboard size={20} /> Back to Website
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-semibold">{user.name}</p>
              <p className="text-xs text-text-muted" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
            </div>
            <button onClick={handleLogout} className="text-error hover:opacity-80 p-2 rounded-lg" style={{ color: 'var(--color-error)' }} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="glass-panel min-h-full p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
