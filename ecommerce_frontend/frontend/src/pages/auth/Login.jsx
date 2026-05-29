import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, LogIn } from 'lucide-react';
import {
  getCustomerPortalOrigin,
  getOtherPortalRegisterUrl,
  getPortalLabelForUi,
  getSellerPortalOrigin,
  handleWrongPortalError,
  isSellerPortal,
} from '../../utils/portalHost';
import { getApiErrorMessage, isNetworkError } from '../../utils/apiErrors';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;
  const customerLabel = getPortalLabelForUi(getCustomerPortalOrigin(), { seller: false });
  const sellerLabel = getPortalLabelForUi(getSellerPortalOrigin(), { seller: true });

  const [loginAs, setLoginAs] = useState(() =>
    isSellerPortal() ? 'seller' : 'customer'
  );

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('portal');
    if (q === 'seller') setLoginAs('seller');
    else if (q === 'customer') setLoginAs('customer');
    else if (isSellerPortal()) setLoginAs('seller');
  }, [location.search]);

  const setPortalMode = (mode) => {
    setLoginAs(mode);
    const params = new URLSearchParams(location.search);
    if (mode === 'seller') params.set('portal', 'seller');
    else params.delete('portal');
    const qs = params.toString();
    navigate({ pathname: '/login', search: qs ? `?${qs}` : '' }, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password, loginAs);
      // Redirect based on role
      // Redirect based on role – give priority to role-specific dashboard
      if (user.role === 'admin' || user.role === 'admin_staff') {
        if (user.role === 'admin_staff' && (user.adminAccessLevel ?? 'full') === 'limited') {
          const a = user.adminAllowedSections || [];
          const order = [
            ['dashboard', '/admin/dashboard'],
            ['sellers', '/admin/sellers'],
            ['kyc', '/admin/kyc'],
            ['products', '/admin/products'],
            ['orders', '/admin/orders'],
            ['returns', '/admin/returns'],
            ['coupons', '/admin/coupons'],
            ['categories', '/admin/categories'],
          ];
          const hit = order.find(([key]) => a.includes(key));
          navigate(hit ? hit[1] : '/admin/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else if (user.role === 'seller') {
        navigate('/seller/dashboard');
      } else if (from) {
        navigate(from);
      } else {
        navigate('/products');
      }
    } catch (err) {
      if (handleWrongPortalError(err)) return;
      const msg = isNetworkError(err)
        ? 'Cannot reach the server. Check that the API is deployed and BACKEND_URL is set on Vercel.'
        : getApiErrorMessage(err, 'Login failed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2" style={{ color: 'var(--color-primary)' }}>
            Sign in
          </h1>
          <p className="text-text-muted text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Choose how you want to sign in, then enter your details.
          </p>
        </div>

        <div
          className="flex rounded-lg p-1 mb-6 border border-white/10"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          role="tablist"
          aria-label="Login type"
        >
          <button
            type="button"
            role="tab"
            aria-selected={loginAs === 'customer'}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
              loginAs === 'customer' ? 'btn btn-primary' : 'text-text-muted hover:text-white'
            }`}
            onClick={() => setPortalMode('customer')}
          >
            Customer
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={loginAs === 'seller'}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
              loginAs === 'seller' ? 'btn btn-primary' : 'text-text-muted hover:text-white'
            }`}
            onClick={() => setPortalMode('seller')}
          >
            Seller
          </button>
        </div>

        <p className="text-center text-xs text-text-muted mb-6 -mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {loginAs === 'seller'
            ? `Seller account · ${sellerLabel}`
            : `Shopping · ${customerLabel}`}
        </p>

        {error && (
          <div className="bg-error/20 border border-error text-error p-3 rounded-md mb-6 text-sm text-center" style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-text-muted" size={18} style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="email"
                required
                className="input-field pl-10"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-text-muted" size={18} style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="password"
                required
                className="input-field pl-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline" style={{ color: 'var(--color-primary)' }}>Forgot Password?</Link>
          </div>

          <button type="submit" className="btn btn-primary mt-4 w-full" disabled={loading}>
            {loading ? 'Signing in...' : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-text-muted" style={{ color: 'var(--color-text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link
            to={loginAs === 'seller' ? '/register?portal=seller' : '/register'}
            className="text-primary font-medium hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            {loginAs === 'seller' ? 'Create seller account' : 'Sign up'}
          </Link>
        </p>
        {loginAs === 'seller' && (
          <p className="text-center mt-3 text-xs text-text-muted">
            Shopping as a customer?{' '}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setPortalMode('customer')}
            >
              Switch to customer sign in
            </button>
          </p>
        )}
        {loginAs === 'customer' && (
          <p className="text-center mt-3 text-xs text-text-muted">
            Selling on Aashansh?{' '}
            <a href={getOtherPortalRegisterUrl()} className="text-primary hover:underline">
              Seller sign up
            </a>
            {' · '}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setPortalMode('seller')}
            >
              Seller sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
