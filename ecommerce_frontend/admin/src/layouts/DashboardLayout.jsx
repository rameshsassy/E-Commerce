import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/common/Footer';
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
  Gift,
  Info,
  Menu,
  X,
  MessageSquare,
  Globe,
  Sliders,
  Database,
  User,
  HelpCircle,
  FileText,
  Sparkles,
} from 'lucide-react';

const SELLER_NAV = [
  { to: '/seller/dashboard', label: 'Home', icon: Home },
  { to: '/seller/orders-enquiries', label: 'Orders & Enquiries', icon: ClipboardList, iconAccent: true },
  { to: '/seller/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/seller/products', label: 'My products', icon: Package },
  { to: '/seller/buy-products', label: 'Bulk Purchase', icon: ShoppingCart },
  { to: '/seller/kyc', label: 'Profile & KYC', icon: FileCheck },
  { to: '/seller/invoices', label: 'Invoices', icon: Receipt },
  { to: '/seller/raise-funds', label: 'Raise funds', icon: HandCoins },
  { to: '/seller/premium', label: 'Premium', icon: Zap, premium: true },
  { to: '/seller/refer-and-earn', label: 'Refer and Earn', icon: Gift },
  { to: '/seller/chat', label: 'Chat', icon: MessageSquare },
  { to: '/seller/request-website', label: 'Request Brand Website', icon: Globe },
  { to: '/seller/about-us', label: 'About Us', icon: Info },
];

const ADMIN_PATH_SECTIONS = [
  [/^\/admin\/dashboard/, 'dashboard'],
  [/^\/admin\/sellers/, 'sellers'],
  [/^\/admin\/customers/, 'sellers'],
  [/^\/admin\/website-requests/, 'sellers'],
  [/^\/admin\/kyc/, 'kyc'],
  [/^\/admin\/products/, 'products'],
  [/^\/admin\/orders/, 'orders'],
  [/^\/admin\/returns/, 'returns'],
  [/^\/admin\/coupons/, 'coupons'],
  [/^\/admin\/vouchers/, 'coupons'],
  [/^\/admin\/categories/, 'categories'],
  [/^\/admin\/menu/, 'categories'],
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

const ADMIN_NAV_LINK =
  'flex items-center gap-3 p-3 rounded-xl border border-white/25 font-medium text-sm transition-colors hover:bg-surface-hover hover:border-white/40';

function adminNavLinkClass(pathname, currentHash, to, { exact } = {}) {
  const [path, linkHash] = to.split('#');
  const hashMatch = linkHash ? currentHash === `#${linkHash}` : !currentHash || currentHash === '';
  const pathMatch = exact
    ? pathname === path
    : pathname === path || (path !== '/admin/dashboard' && pathname.startsWith(path));
  const active = pathMatch && hashMatch;
  return [ADMIN_NAV_LINK, active ? 'bg-surface-hover border-white/50' : ''].filter(Boolean).join(' ');
}

const DashboardLayout = ({ variant }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.hash]);

  const isSeller = variant === 'seller';
  const isAdmin = variant === 'admin';

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isSeller && user.role !== 'seller') {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin && user.role !== 'admin' && user.role !== 'admin_staff') {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    if (user.role === 'admin_staff' && (location.pathname.startsWith('/admin/roles') || location.pathname.startsWith('/admin/homepage-management'))) {
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

  const panelTitle = isAdmin ? 'Admin Panel' : 'Seller Hub';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: 'var(--color-bg)' }}>
      <header className="lg:hidden sticky top-0 z-30 glass-panel mx-2 mt-2 mb-0 px-4 py-3 flex items-center justify-between gap-3 safe-area-top">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-glass-border hover:bg-surface-hover"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        {isSeller ? (
          <Link to="/seller/dashboard" className="flex-1 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <img src="/brand/aashansh-logo.png" alt="Aashansh Logo" className="h-6 w-auto object-contain" />
            <h2 className="text-base font-bold text-white truncate">
              {panelTitle}
            </h2>
          </Link>
        ) : (
          <h2 className="text-base font-bold text-primary truncate flex-1 text-center" style={{ color: 'var(--color-primary)' }}>
            {panelTitle}
          </h2>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-10 h-10 flex items-center justify-center text-error hover:bg-error/10 rounded-xl"
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>
      </header>

      {mobileNavOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed lg:static inset-y-0 left-0 z-50',
          'w-[min(18rem,88vw)] lg:w-64',
          'glass-panel flex flex-col min-h-0',
          'h-screen lg:h-[calc(100vh-2rem)]',
          'lg:sticky lg:top-4',
          'm-0 lg:m-4',
          'transition-transform duration-300 ease-out',
          'max-lg:top-0 max-lg:bottom-0 max-lg:rounded-none max-lg:border-y-0',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div className="p-4 lg:p-6 border-b flex items-center justify-between gap-2" style={{ borderColor: 'var(--glass-border)' }}>
          {isSeller ? (
            <Link to="/seller/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/brand/aashansh-logo.png" alt="Aashansh Logo" className="h-8 w-auto object-contain" />
              <h2 className="text-lg lg:text-xl font-bold text-white">
                {panelTitle}
              </h2>
            </Link>
          ) : (
            <h2 className="text-lg lg:text-xl font-bold text-primary" style={{ color: 'var(--color-primary)' }}>
              {panelTitle}
            </h2>
          )}
          <button
            type="button"
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-hover"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 min-h-0 p-3 sm:p-4 flex flex-col gap-2.5 overflow-y-auto overscroll-contain">
          {isAdmin && (
            <div className="flex flex-col gap-2.5">
              {showAdminLink('dashboard') && (
                <Link
                  to="/admin/dashboard"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/dashboard', { exact: true })}
                >
                  <LayoutDashboard size={20} /> Dashboard
                </Link>
              )}

              {showAdminLink('dashboard') && (
                <Link
                  to="/admin/dashboard#bulk-inquiries"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/dashboard#bulk-inquiries')}
                >
                  <Boxes size={20} className="text-warning" /> Bulk inquiries
                </Link>
              )}

              {showAdminLink('dashboard') && (
                <Link
                  to="/admin/email-logs"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/email-logs')}
                >
                  <Mail size={20} className="text-primary" /> Email logs
                </Link>
              )}

              {showAdminLink('sellers') && (
                <Link
                  to="/admin/sellers"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/sellers')}
                >
                  <Users size={20} className="text-text-muted" />
                  Manage Sellers
                </Link>
              )}

              {showAdminLink('sellers') && (
                <Link
                  to="/admin/customers"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/customers')}
                >
                  <Users size={20} className="text-text-muted" />
                  Manage Customers
                </Link>
              )}

              {showAdminLink('sellers') && (
                <Link
                  to="/admin/website-requests"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/website-requests')}
                >
                  <Globe size={20} className="text-text-muted" />
                  Website Requests
                </Link>
              )}

              {showAdminLink('kyc') && (
                <Link
                  to="/admin/kyc"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/kyc')}
                >
                  <FileCheck size={20} className="text-text-muted" />
                  KYC Approvals
                </Link>
              )}

              {showAdminLink('products') && (
                <Link
                  to="/admin/products"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/products')}
                >
                  <Package size={20} className="text-text-muted" />
                  Product Approvals
                </Link>
              )}

              {showAdminLink('orders') && (
                <Link
                  to="/admin/orders"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/orders')}
                >
                  <ShoppingCart size={20} className="text-text-muted" />
                  Orders
                </Link>
              )}

              {showAdminLink('returns') && (
                <Link
                  to="/admin/returns"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/returns')}
                >
                  <ArrowLeftRight size={20} className="text-text-muted" />
                  Returns & Refunds
                </Link>
              )}

              {showAdminLink('coupons') && (
                <Link
                  to="/admin/coupons"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/coupons')}
                >
                  <Tag size={20} className="text-text-muted" />
                  Promo Codes
                </Link>
              )}

              {showAdminLink('coupons') && (
                <Link
                  to="/admin/vouchers"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/vouchers')}
                >
                  <Tag size={20} className="text-text-muted" />
                  Vouchers
                </Link>
              )}

              {showAdminLink('categories') && (
                <Link
                  to="/admin/categories"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/categories')}
                >
                  <LayoutDashboard size={20} className="text-primary" />
                  Category Engine
                </Link>
              )}

              {showAdminLink('categories') && (
                <Link
                  to="/admin/menu"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/menu')}
                >
                  <Menu size={20} className="text-primary" />
                  Menu Manager
                </Link>
              )}



              {showAdminLink('sellers') && (
                <Link
                  to="/admin/premium-sellers"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/premium-sellers')}
                >
                  <Star size={20} className="text-warning" />
                  Premium Sellers
                </Link>
              )}

              {showAdminLink('dashboard') && (
                <Link
                  to="/admin/premium-seller-dashboard"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/premium-seller-dashboard')}
                >
                  <Star size={20} className="text-text-muted" />
                  Premium Overview
                </Link>
              )}

              {user.role === 'admin' && (
                <Link
                  to="/admin/roles"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/roles')}
                >
                  <Shield size={20} className="text-primary" />
                  Roles
                </Link>
              )}

              {user.role === 'admin' && (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider mt-2 border-t border-white/10 pt-3">
                    Website Settings
                  </div>
                  <Link
                    to="/admin/homepage-management"
                    className={adminNavLinkClass(location.pathname, location.hash, '/admin/homepage-management')}
                  >
                    <Sliders size={20} className="text-primary" />
                    Homepage Management
                  </Link>
                  <Link
                    to="/admin/faqs"
                    className={adminNavLinkClass(location.pathname, location.hash, '/admin/faqs')}
                  >
                    <HelpCircle size={20} className="text-primary" />
                    FAQs
                  </Link>
                  <Link
                    to="/admin/policies"
                    className={adminNavLinkClass(location.pathname, location.hash, '/admin/policies')}
                  >
                    <FileText size={20} className="text-primary" />
                    Policies
                  </Link>
                  <Link
                    to="/admin/featured-products"
                    className={adminNavLinkClass(location.pathname, location.hash, '/admin/featured-products')}
                  >
                    <Sparkles size={20} className="text-primary" />
                    Featured Products
                  </Link>
                </>
              )}

              {(user.role === 'admin' || user.role === 'admin_staff') && (
                <Link
                  to="/admin/chats"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/chats')}
                >
                  <MessageSquare size={20} className="text-primary" />
                  Chats
                </Link>
              )}

              {(user.role === 'admin' || user.role === 'admin_staff') && (
                <Link
                  to="/admin/profile"
                  className={adminNavLinkClass(location.pathname, location.hash, '/admin/profile')}
                >
                  <User size={20} className="text-text-muted" />
                  My Profile
                </Link>
              )}

              {user.role === 'admin' && (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider mt-2 border-t border-white/10 pt-3">
                    Migration Tools
                  </div>
                  <Link
                    to="/admin/data-migration"
                    className={adminNavLinkClass(location.pathname, location.hash, '/admin/data-migration')}
                    style={location.pathname.startsWith('/admin/data-migration') ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.2))', borderColor: 'rgba(99,102,241,0.5)' } : {}}
                  >
                    <Database size={20} style={{ color: location.pathname.startsWith('/admin/data-migration') ? '#6366f1' : '' }} /> Data Migration
                  </Link>
                  <Link
                    to="/admin/rewards"
                    className={adminNavLinkClass(location.pathname, location.hash, '/admin/rewards')}
                    style={location.pathname.startsWith('/admin/rewards') ? { background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(139,92,246,0.2))', borderColor: 'rgba(251,191,36,0.5)' } : {}}
                  >
                    <Gift size={20} style={{ color: location.pathname.startsWith('/admin/rewards') ? '#fbbf24' : '' }} /> Rewards Management
                  </Link>
                </>
              )}
            </div>
          )}

          {isSeller &&
            SELLER_NAV.map((item) => {
              const active =
                location.pathname === item.to ||
                (item.to !== '/seller/dashboard' && location.pathname.startsWith(item.to));
              const Icon = item.icon;
              const activeClass = active
                ? 'text-[#ffd401] border-[#ffd401] bg-[#ffd401]/10 font-bold'
                : 'border-white/25 hover:bg-surface-hover hover:border-white/40 text-white';
              const baseClass = [
                'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                activeClass,
              ].join(' ');

              return (
                <Link key={item.to} to={item.to} className={baseClass} style={{ transition: 'background-color 0.2s, border-color 0.2s' }}>
                  {item.icon === 'chart' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-[#ffd401]' : ''}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  ) : item.premium ? (
                    <Icon size={20} className={active ? 'text-[#ffd401] fill-[#ffd401]/20' : 'text-warning fill-warning/20'} />
                  ) : item.iconAccent ? (
                    <Icon size={20} className={active ? 'text-[#ffd401]' : 'text-warning'} />
                  ) : (
                    <Icon size={20} className={active ? 'text-[#ffd401]' : ''} />
                  )}
                  {item.label}
                </Link>
              );
            })}

          <div className="mt-auto border-t border-glass-border pt-4">
            <Link
              to="/products"
              className={`${ADMIN_NAV_LINK} text-text-muted`}
            >
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

      <main className="flex-1 w-full min-w-0 p-3 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden safe-area-bottom flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
        {isSeller && <Footer />}
      </main>
    </div>
  );
};

export default DashboardLayout;
