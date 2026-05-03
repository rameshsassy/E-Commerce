import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Mail, ArrowRight } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMsg(data.message || 'Reset link sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 animate-fade-in text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">Forgot Password</h1>
        <p className="text-text-muted mb-6">Enter your email to receive a reset link.</p>

        {error && <div className="bg-error/20 border border-error text-error p-3 rounded-md mb-4 text-sm">{error}</div>}
        {msg && <div className="bg-success/20 border border-success text-success p-3 rounded-md mb-4 text-sm">{msg}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-text-muted" size={18} />
              <input type="email" required className="input-field pl-10" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Sending...' : <>Send Reset Link <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="mt-6 text-sm text-text-muted">
          Remember your password? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
