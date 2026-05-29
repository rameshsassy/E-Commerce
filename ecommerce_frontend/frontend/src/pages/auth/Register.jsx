import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Mail, Lock, User, UserPlus, Phone } from 'lucide-react';
import {
  getOtherPortalRegisterUrl,
  getSellerPortalOrigin,
  handleWrongPortalError,
  isCustomerPortal,
  isSellerPortal,
} from '../../utils/portalHost';

const Register = () => {
  const searchParams = new URLSearchParams(useLocation().search);
  const referralFromUrl = searchParams.get('ref') || searchParams.get('referralCode') || '';
  const sellerPortal = isSellerPortal();
  const role = sellerPortal ? 'seller' : 'customer';
  const [formData, setFormData] = useState({ firstName: '', lastName: '', mobile: '', email: '', password: '', confirmPassword: '', secretKey: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;
  const { setSession } = useAuth();

  useEffect(() => {
    if (isCustomerPortal() && searchParams.get('role') === 'seller') {
      const url = new URL('/register', getSellerPortalOrigin());
      if (referralFromUrl) url.searchParams.set('ref', referralFromUrl);
      window.location.replace(url.toString());
    }
  }, [searchParams, referralFromUrl]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (formData.mobile.replace(/\D/g, '').length !== 10) {
        setError("If I need to contact you, you need to give your correct mobile number right? Give me the mobile number correctly!");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match!");
        return;
      }

      const isStrong = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(formData.password);
      if (!isStrong) {
        setError("Come on, my cat could guess that password! Make it stronger with at least 8 characters, 1 uppercase letter, 1 number, and 1 special character (like @).");
        return;
      }

      let endpoint = '/auth/customer/register';
      if (role === 'seller') endpoint = '/auth/seller/register';
      if (role === 'admin') endpoint = '/auth/admin/register';

      const payload =
        role === 'admin'
          ? {
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              email: formData.email.trim(),
              mobile: formData.mobile.trim(),
              password: formData.password,
              secretKey: formData.secretKey,
            }
          : {
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              email: formData.email.trim(),
              mobile: formData.mobile.trim(),
              password: formData.password,
              ...(role === 'seller' && referralFromUrl
                ? { referralCode: referralFromUrl.trim() }
                : {}),
            };

      const { data } = await api.post(endpoint, payload);

      if ((role === 'customer' || role === 'seller') && data.token && data.user) {
        setSession(data.token, data.user);
      }

      const defaultMsg =
        role === 'customer'
          ? 'Customer Registered Successfully'
          : role === 'seller'
            ? 'Seller Registered Successfully'
            : 'Registration successful';

      setSuccess(data.message || defaultMsg);

      setTimeout(() => {
        if (role === 'admin') {
          navigate('/login');
          return;
        }
        if (from) navigate(from);
        else if (role === 'seller') navigate('/seller/dashboard');
        else navigate('/products');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      if (handleWrongPortalError(err)) return;
      const raw = err.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(' ') : raw || err.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="glass-panel w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-primary">
            {sellerPortal ? 'Create seller account' : 'Create account'}
          </h1>
          <p className="text-text-muted">
            {sellerPortal
              ? 'Register to sell on Aashansh at seller.aashansh.org'
              : 'Join Aashansh to shop online'}
          </p>
        </div>

        {role === 'seller' && referralFromUrl && (
          <div className="bg-primary/10 border border-primary/30 text-primary p-3 rounded-md mb-6 text-sm text-center">
            Referred by code: <strong>{referralFromUrl.toUpperCase()}</strong>
          </div>
        )}

        {error && <div className="bg-error/20 border border-error text-error p-3 rounded-md mb-6 text-sm text-center">{error}</div>}
        {success && <div className="bg-success/20 border border-success text-success p-3 rounded-md mb-6 text-sm text-center">{success}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-text-muted" size={18} />
                <input type="text" name="firstName" required className="input-field pl-10" placeholder="John" value={formData.firstName} onChange={handleChange} />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-text-muted" size={18} />
                <input type="text" name="lastName" required className="input-field pl-10" placeholder="Doe" value={formData.lastName} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-text-muted" size={18} />
              <input type="text" name="mobile" required className="input-field pl-10" placeholder="+1234567890" value={formData.mobile} onChange={handleChange} />
            </div>
            {formData.mobile.length > 0 && formData.mobile.replace(/\D/g, '').length !== 10 && (
              <p className="text-xs text-error mt-1">If I need to contact you, you need to give your correct mobile number right? Give me the mobile number correctly!</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-text-muted" size={18} />
              <input type="email" name="email" required className="input-field pl-10" placeholder="you@example.com" value={formData.email} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-text-muted" size={18} />
              <input type="password" name="password" required className="input-field pl-10" placeholder="••••••••" minLength={6} value={formData.password} onChange={handleChange} />
            </div>
            {formData.password.length > 0 && !/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(formData.password) && (
              <p className="text-xs text-error mt-1">Come on, my cat could guess that password! Make it stronger with at least 8 characters, 1 uppercase letter, 1 number, and 1 special character (like @).</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-text-muted" size={18} />
              <input type="password" name="confirmPassword" required className="input-field pl-10" placeholder="••••••••" minLength={6} value={formData.confirmPassword} onChange={handleChange} />
            </div>
            {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-error mt-1">Oops, those passwords match about as well as socks and sandals! Try again.</p>
            )}
          </div>

          {/* Admin secret key removed */}

          <button type="submit" className="btn btn-primary mt-4 w-full" disabled={loading}>
            {loading ? 'Creating Account...' : (
              <>
                <UserPlus size={18} className="mr-2 inline" />
                {sellerPortal ? 'Create seller account' : 'Create account'}
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-text-muted">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
        <p className="text-center mt-3 text-xs text-text-muted">
          {sellerPortal ? (
            <>
              Shopping as a customer?{' '}
              <a href={getOtherPortalRegisterUrl()} className="text-primary hover:underline">
                Register at aashansh.org
              </a>
            </>
          ) : (
            <>
              Want to sell?{' '}
              <a href={getOtherPortalRegisterUrl()} className="text-primary hover:underline">
                Seller registration at seller.aashansh.org
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Register;
