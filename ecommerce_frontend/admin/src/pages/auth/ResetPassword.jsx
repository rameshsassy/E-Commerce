import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Lock, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    try {
      if (password !== confirmPassword) {
        setLoading(false);
        setError("Passwords do not match!");
        return;
      }

      const isStrong = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
      if (!isStrong) {
        setLoading(false);
        setError("That password is as weak as wet paper! Make it at least 8 characters, with 1 uppercase, 1 number, and 1 special character.");
        return;
      }

      await api.put(`/auth/reset-password/${token}`, { password });
      setMsg('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 animate-fade-in text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">Reset Password</h1>
        <p className="text-text-muted mb-6">Enter your new secure password.</p>

        {error && <div className="bg-error/20 border border-error text-error p-3 rounded-md mb-4 text-sm">{error}</div>}
        {msg && <div className="bg-success/20 border border-success text-success p-3 rounded-md mb-4 text-sm flex items-center justify-center gap-2"><CheckCircle size={18}/> {msg}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-text-muted" size={18} />
              <input type="password" required minLength={6} className="input-field pl-10" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {password.length > 0 && !/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password) && (
              <p className="text-xs text-error mt-1">Come on, my cat could guess that password! Make it stronger with at least 8 characters, 1 uppercase letter, 1 number, and 1 special character (like @).</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-text-muted" size={18} />
              <input type="password" required minLength={6} className="input-field pl-10" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-xs text-error mt-1">Oops, those passwords match about as well as socks and sandals! Try again.</p>
            )}
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
