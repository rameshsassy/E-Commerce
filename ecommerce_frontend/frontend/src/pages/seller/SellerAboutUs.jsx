import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, ExternalLink } from 'lucide-react';
import api from '../../utils/api';

export default function SellerAboutUs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/seller/about-us');
        if (!cancelled) setContent(res.data?.data ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load About Us');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold mb-8">About Us</h1>
        <div className="glass-panel p-8 rounded-2xl text-text-muted">Loading…</div>
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold mb-8">About Us</h1>
        <div className="glass-panel p-8 rounded-2xl text-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Info className="text-primary" size={32} />
          {content?.title || 'About Us'}
        </h1>
        <p className="text-lg text-text-muted">{content?.tagline}</p>
      </div>

      <div className="space-y-6">
        {(content?.sections || []).map((section) => (
          <div key={section.heading} className="glass-panel p-8 rounded-2xl">
            <h2 className="text-xl font-bold mb-3">{section.heading}</h2>
            <p className="text-text-muted leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>

      {(content?.links?.length ?? 0) > 0 && (
        <div className="glass-panel p-6 rounded-2xl flex flex-wrap gap-4">
          {content.links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              {link.label}
              <ExternalLink size={16} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
