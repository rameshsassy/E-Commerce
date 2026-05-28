import React from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  Package,
  Users,
  FileCheck,
  ShoppingCart,
  ArrowLeftRight,
  Tag,
  Zap,
  Shield,
  Star,
  Boxes,
  Mail,
  Home,
  ClipboardList,
  Receipt,
  HandCoins,
} from 'lucide-react';

const ADMIN_PATH_SECTIONS = [
  [/^\/admin\/dashboard/, 'dashboard'],
  [/^\/admin\/sellers/, 'sellers'],
  [/^\/admin\/kyc/, 'kyc'],
  [/^\/admin\/products/, 'products'],
  [/^\/admin\/orders/, 'orders'],
  [/^\/admin\/returns/, 'returns'],
  [/^\/admin\/coupons/, 'coupons'],
  [/^\/admin\/categories/, 'categories'],
  [/^\/admin\/premium-sellers/, 'sellers'],
  [/^\/admin\/premium-seller-dashboard/, 'dashboard'],
  [/^\/admin\/email-logs/, 'dashboard'],
];

function adminSectionForPath(pathname) {
  for (const [re, section] of ADMIN_PATH_SECTIONS) {
    if (re.test(pathname)) return section;
  }
  return null;
}

function canSeeAdminSection(user, sectionKey) {
  if (!sectionKey) return true;
  if (user.role === 'admin') return true;
  if (user.role !== 'admin_staff') return false;
  const level = user.adminAccessLevel ?? 'full';
  if (level === 'full') return true;
  const allowed = user.adminAllowedSections || [];
  return allowed.includes(sectionKey);
}

const DashboardLayout = ({ variant }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSeller = variant === 'seller';
  const isAdmin = variant === 'admin';

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isSeller && user.role !== 'seller') {
    return <Navigate to="/" replace />;
  }

  if (isAdmin && user.role !== 'admin' && user.role !== 'admin_staff') {
    return <Navigate to="/" replace />;
  }

  if (isAdmin) {
    if (user.role === 'admin_staff' && location.pathname.startsWith('/admin/roles')) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    const required = adminSectionForPath(location.pathname);
    if (
      required &&
      user.role === 'admin_staff' &&
      (user.adminAccessLevel ?? 'full') === 'limited' &&
      !canSeeAdminSection(user, required)
    ) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
          <div className="glass-panel p-8 max-w-md text-center rounded-2xl border border-glass-border">
            <h2 className="text-xl font-bold mb-2">Access restricted</h2>
            <p className="text-text-muted mb-6 text-sm">
              Your account does not include permission for this area. Ask the primary administrator to update your access.
            </p>
            <Link to="/admin/dashboard" className="btn btn-primary inline-block">
              Go to dashboard
            </Link>
          </div>
        </div>
      );
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showAdminLink = (section) => isAdmin && canSeeAdminSection(user, section);

  return (
    <div className="min-h-screen flex bg-gray-900" style={{ backgroundColor: 'var(--color-bg)' }}>
      <aside className="w-64 glass-panel m-4 flex flex-col">
        <div className="p-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <h2 className="text-xl font-bold text-primary" style={{ color: 'var(--color-primary)' }}>
            {isAdmin ? 'Admin Panel' : 'Seller Hub'}
          </h2>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          {isAdmin && showAdminLink('dashboard') && (
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors"
              style={{ transition: 'background-color 0.2s' }}
            >
              <LayoutDashboard size={20} /> Dashboard
            </Link>
          )}

          {isAdmin && showAdminLink('dashboard') && (
            <Link
              to="/admin/dashboard#bulk-inquiries"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors border border-glass-border/60"
              style={{ transition: 'background-color 0.2s' }}
            >
              <Boxes size={20} className="text-warning" /> Bulk inquiries
            </Link>
          )}

          {isAdmin && showAdminLink('dashboard') && (
            <Link
              to="/admin/email-logs"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors border border-glass-border/60"
              style={{ transition: 'background-color 0.2s' }}
            >
              <Mail size={20} className="text-primary" /> Email logs
            </Link>
          )}

          {isSeller && (
            <>
              <Link to="/seller/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors" style={{ transition: 'background-color 0.2s' }}>
                <Home size={20} /> Home
              </Link>
              <Link to="/seller/orders-enquiries" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors border border-glass-border/60">
                <ClipboardList size={20} className="text-warning" /> Order &amp; Enquiries
              </Link>
              <Link to="/seller/analytics" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> Analytics
              </Link>
              <Link to="/seller/products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                <Package size={20} /> My products
              </Link>
              <Link to="/seller/kyc" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                <FileCheck size={20} /> Profile &amp; KYC
              </Link>
              <Link to="/seller/invoices" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                <Receipt size={20} /> Invoices
              </Link>
              <Link to="/seller/raise-funds" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                <HandCoins size={20} /> Raise funds
              </Link>
              <Link to="/seller/premium" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                <Zap size={20} className="text-warning fill-warning/20" /> Premium
              </Link>
            </>
          )}

          {isAdmin && (
            <div className="space-y-1">
              {showAdminLink('sellers') && (
                <Link to="/admin/sellers" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all hover:translate-x-1 group">
                  <Users size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                  <span className="font-medium text-sm">Manage Sellers</span>
                </Link>
              )}
              {showAdminLink('kyc') && (
                <Link to="/admin/kyc" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all hover:translate-x-1 group">
                  <FileCheck size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                  <span className="font-medium text-sm">KYC Approvals</span>
                </Link>
              )}
              {showAdminLink('products') && (
                <Link to="/admin/products" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all hover:translate-x-1 group">
                  <Package size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                  <span className="font-medium text-sm">Product Approvals</span>
                </Link>
              )}
              {showAdminLink('orders') && (
                <Link to="/admin/orders" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all hover:translate-x-1 group">
                  <ShoppingCart size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                  <span className="font-medium text-sm">Orders</span>
                </Link>
              )}
              {showAdminLink('returns') && (
                <Link to="/admin/returns" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all hover:translate-x-1 group">
                  <ArrowLeftRight size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                  <span className="font-medium text-sm">Returns & Refunds</span>
                </Link>
              )}
              {showAdminLink('coupons') && (
                <Link to="/admin/coupons" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all hover:translate-x-1 group">
                  <Tag size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                  <span className="font-medium text-sm">Promo Codes</span>
                </Link>
              )}
              {showAdminLink('categories') && (
                <Link to="/admin/categories" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all hover:translate-x-1 group">
                  <LayoutDashboard size={18} className="text-primary" />
                  <span className="font-medium text-sm">Category Engine</span>
                </Link>
              )}
              {showAdminLink('sellers') && (
                <Link to="/admin/premium-sellers" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all hover:translate-x-1 group">
                  <Star size={18} className="text-warning group-hover:text-primary transition-colors" />
                  <span className="font-medium text-sm">Premium Sellers</span>
                </Link>
              )}
              {showAdminLink('dashboard') && (
                <Link to="/admin/premium-seller-dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all hover:translate-x-1 group">
                  <Star size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                  <span className="font-medium text-sm">Premium Overview</span>
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin/roles" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all hover:translate-x-1 group border border-primary/20 mt-2">
                  <Shield size={18} className="text-primary" />
                  <span className="font-medium text-sm">Roles</span>
                </Link>
              )}
            </div>
          )}

          <div className="mt-auto border-t border-glass-border pt-4">
            <Link to="/products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors text-text-muted">
              <LayoutDashboard size={20} /> Back to Website
            </Link>
          </div>
        </nav>

        <div className="p-4 mt-auto border-t border-glass-border">
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-glass-border">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{user.name || user.firstName}</p>
              <p className="text-[10px] text-text-muted truncate uppercase tracking-wider">
                {user.role === 'admin_staff' ? 'admin (staff)' : user.role}
              </p>
            </div>
            <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center text-error hover:bg-error/10 rounded-lg transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
