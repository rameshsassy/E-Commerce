import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { Mail, Lock, User, UserPlus, Phone, Shield } from 'lucide-react';

const AdminRegister = () => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', mobile: '', email: '', password: '', confirmPassword: '', secretKey: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (formData.mobile.replace(/\D/g, '').length !== 10) {
        setLoading(false);
        setError("If I need to contact you, you need to give your correct mobile number right? Give me the mobile number correctly!");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setLoading(false);
        setError("Passwords do not match!");
        return;
      }

      const isStrong = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(formData.password);
      if (!isStrong) {
        setLoading(false);
        setError("Is that a password or your pet's name? Toughen it up! We need at least 8 characters, 1 uppercase, 1 number, and 1 special character.");
        return;
      }

      await api.post('/auth/admin/register', formData);
      setSuccess('Admin account created successfully! Please login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Admin registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background glow for admin page */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-error/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 animate-fade-in relative z-10 border-t-4 border-error">
        <div className="text-center mb-8">
          <div className="mx-auto bg-error/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Shield size={32} className="text-error" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Admin Setup</h1>
          <p className="text-text-muted">Create a secure system administrator account</p>
        </div>

        {error && <div className="bg-error/20 border border-error text-error p-3 rounded-md mb-6 text-sm text-center">{error}</div>}
        {success && <div className="bg-success/20 border border-success text-success p-3 rounded-md mb-6 text-sm text-center">{success}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-text-muted" size={18} />
                <input type="text" name="firstName" required className="input-field pl-10" placeholder="Admin" value={formData.firstName} onChange={handleChange} />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-text-muted" size={18} />
                <input type="text" name="lastName" required className="input-field pl-10" placeholder="User" value={formData.lastName} onChange={handleChange} />
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
              <input type="email" name="email" required className="input-field pl-10" placeholder="admin@example.com" value={formData.email} onChange={handleChange} />
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

          <div className="pt-2 border-t border-glass-border mt-2">
            <label className="block text-sm font-bold text-error mb-1">Admin Secret Key</label>
            <div className="relative">
              <Shield className="absolute left-3 top-3 text-error/70" size={18} />
              <input type="password" name="secretKey" required className="input-field pl-10 border-error/50 focus:border-error" placeholder="Enter System Secret Key" value={formData.secretKey} onChange={handleChange} />
            </div>
            <p className="text-xs text-text-muted mt-1">Required to authorize administrative privileges.</p>
          </div>

          <button type="submit" className="btn mt-4 w-full bg-error hover:bg-error/90 text-white border-none" disabled={loading}>
            {loading ? 'Creating Admin...' : <><Shield size={18} className="mr-2 inline" /> Initialize Admin</>}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-text-muted">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminRegister;
