import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { FileText, Loader2, AlertCircle } from 'lucide-react';

export default function SellerPolicyPage() {
  const { type } = useParams();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPolicy = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await api.get(`/policies/${type}`);
        setPolicy(res.data);
      } catch (err) {
        console.error("fetchPolicy error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (type) {
      fetchPolicy();
    }
  }, [type]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-white/5 border border-glass-border flex items-center justify-center mb-4">
          <AlertCircle className="text-text-muted" size={28} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Policy Not Available</h1>
        <p className="text-text-muted text-sm max-w-md mx-auto">
          This policy is currently not available.
        </p>
        <p className="mt-8">
          <Link to="/" className="text-primary hover:underline text-sm">
            ← Back to home
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in text-white select-text">
      <style>{`
        .seller-policy-viewer a {
          color: #6366f1;
          text-decoration: underline;
        }
        .seller-policy-viewer ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .seller-policy-viewer ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .seller-policy-viewer li {
          display: list-item;
          margin: 0.5rem 0;
          color: #94a3b8;
        }
        .seller-policy-viewer h1 {
          font-size: 2rem;
          font-weight: 800;
          margin: 1.5rem 0 0.75rem 0;
          color: white;
        }
        .seller-policy-viewer h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 1.25rem 0 0.5rem 0;
          color: white;
        }
        .seller-policy-viewer h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
          color: white;
        }
        .seller-policy-viewer p {
          margin: 0.75rem 0;
          line-height: 1.7;
          color: #94a3b8;
        }
      `}</style>

      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <FileText className="text-primary shrink-0" size={28} />
        {policy.title}
      </h1>
      <p className="text-text-muted text-sm mb-8">
        Last updated: {new Date(policy.updatedAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </p>

      <div className="glass-panel p-6 md:p-8 seller-policy-viewer text-sm text-text-muted leading-relaxed">
        <div dangerouslySetInnerHTML={{ __html: policy.content }} />
      </div>

      <p className="mt-8">
        <Link to="/" className="text-primary hover:underline text-sm">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
