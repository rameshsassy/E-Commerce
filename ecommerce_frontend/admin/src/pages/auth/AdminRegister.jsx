import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Phone, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';

const AdminRegister = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      secretKey: '',
    }
  });

  const onSubmit = async (data) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await api.post('/admin/signup', data);
      setSuccess(response.data.message || 'Admin account created successfully.');
      
      const { token, user } = response.data;
      setSession(token, user);
      
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Admin signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background glow for admin page */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-error/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 animate-fade-in relative z-10 border-t-4 border-error shadow-lg">
        <div className="text-center mb-8">
          <div className="mx-auto bg-error/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Shield size={32} className="text-error animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Admin Signup</h1>
          <p className="text-text-muted">Create a secure system administrator account</p>
        </div>

        {error && (
          <div className="bg-error/20 border border-error text-error p-3 rounded-md mb-6 text-sm text-center font-medium animate-shake">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-success/20 border border-success text-success p-3 rounded-md mb-6 text-sm text-center font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-text-muted" size={18} />
              <input
                type="text"
                {...register('fullName', { required: 'Full Name is mandatory' })}
                className={`input-field pl-10 ${errors.fullName ? 'border-error focus:border-error focus:ring-1 focus:ring-error' : ''}`}
                placeholder="John Doe"
              />
            </div>
            {errors.fullName && <p className="text-xs text-error mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-text-muted" size={18} />
              <input
                type="email"
                {...register('email', {
                  required: 'Email Address is mandatory',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email format'
                  }
                })}
                className={`input-field pl-10 ${errors.email ? 'border-error focus:border-error focus:ring-1 focus:ring-error' : ''}`}
                placeholder="admin@example.com"
              />
            </div>
            {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-text-muted" size={18} />
              <input
                type="text"
                {...register('phone', {
                  required: 'Phone Number is mandatory',
                  validate: (v) => {
                    const clean = v.replace(/[\s\-()]/g, '');
                    return /^\+?[1-9]\d{9,14}$/.test(clean) || 'Invalid phone number format';
                  }
                })}
                className={`input-field pl-10 ${errors.phone ? 'border-error focus:border-error focus:ring-1 focus:ring-error' : ''}`}
                placeholder="+1234567890"
              />
            </div>
            {errors.phone && <p className="text-xs text-error mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-text-muted" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Password is mandatory',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  validate: {
                    hasUpper: (v) => /[A-Z]/.test(v) || 'Must include an uppercase letter',
                    hasLower: (v) => /[a-z]/.test(v) || 'Must include a lowercase letter',
                    hasDigit: (v) => /\d/.test(v) || 'Must include a number',
                    hasSpecial: (v) => /[@$!%*?&#\-_+=\[\]{}|;:',.<>/?~`]/.test(v) || 'Must include a special character',
                  }
                })}
                className={`input-field pl-10 pr-10 ${errors.password ? 'border-error focus:border-error' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-text-muted hover:text-text focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-error mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-text-muted" size={18} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: 'Confirm Password is mandatory',
                  validate: (v) => v === watch('password') || 'Passwords do not match'
                })}
                className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'border-error focus:border-error' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-text-muted hover:text-text focus:outline-none"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-error mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <div className="pt-2 border-t border-glass-border mt-2">
            <label className="block text-sm font-bold text-error mb-1">Admin Secret Key</label>
            <div className="relative">
              <Shield className="absolute left-3 top-3 text-error/70" size={18} />
              <input
                type="password"
                {...register('secretKey', { required: 'Admin Secret Key is mandatory' })}
                className={`input-field pl-10 border-error/50 focus:border-error ${errors.secretKey ? 'border-error focus:ring-error' : ''}`}
                placeholder="Enter System Secret Key"
              />
            </div>
            {errors.secretKey && <p className="text-xs text-error mt-1">{errors.secretKey.message}</p>}
            <p className="text-xs text-text-muted mt-1">Required to authorize administrative privileges.</p>
          </div>

          <button
            type="submit"
            className="btn mt-4 w-full bg-error hover:bg-error/90 text-white border-none transition-all flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating Admin...
              </>
            ) : (
              <>
                <Shield size={18} />
                Initialize Admin
              </>
            )}
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
