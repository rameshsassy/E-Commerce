import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Mail, Lock, LogIn } from 'lucide-react';
import {
  getCustomerPortalOrigin,
  getOtherPortalRegisterUrl,
  getPortalLabelForUi,
  getSellerPortalOrigin,
  handleWrongPortalError,
  isSellerPortal,
} from '../../utils/portalHost';
import { getApiErrorMessage } from '../../utils/apiErrors';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;
  const customerLabel = getPortalLabelForUi(getCustomerPortalOrigin(), { seller: false });
  const sellerLabel = getPortalLabelForUi(getSellerPortalOrigin(), { seller: true });

  const [loginAs] = useState('seller');

  useEffect(() => {
    const checkImpersonation = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const adminToken = params.get('adminToken');
      if (token && adminToken) {
        setError('');
        setLoading(true);
        try {
          localStorage.setItem('token', token);
          const res = await api.get('/user/profile');
          const userData = res.data;
          
          setSession(token, userData);
          localStorage.setItem('adminToken', adminToken);
          
          navigate('/seller/dashboard');
        } catch (err) {
          setError('Impersonation failed: could not load profile');
          localStorage.removeItem('token');
          localStorage.removeItem('adminToken');
        } finally {
          setLoading(false);
        }
      }
    };
    checkImpersonation();
  }, [location.search, setSession, navigate]);

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
      const msg = getApiErrorMessage(err, 'Login failed');
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
            Seller Sign In
          </h1>
          <p className="text-text-muted text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Enter your credentials to access the seller hub.
          </p>
        </div>

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
            to="/register"
            className="text-primary font-medium hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Create seller account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
