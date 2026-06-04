import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';
import SellerRecentActivity from './SellerRecentActivity';
import LoadErrorMessage from '../common/LoadErrorMessage';
import { getApiErrorMessage, isNetworkError } from '../../utils/apiErrors';

export default function SellerRecentActivityModal({ open, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [networkError, setNetworkError] = useState(false);

  const fetchAllActivities = async () => {
    setLoading(true);
    setError('');
    setNetworkError(false);
    try {
      const { data } = await api.get('/seller/recent-activity?limit=200');
      setActivities(data?.activities || []);
    } catch (err) {
      console.error('Failed to fetch overall recent activity', err);
      if (isNetworkError(err)) {
        setNetworkError(true);
      }
      setError(getApiErrorMessage(err, 'Could not load recent activity'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAllActivities();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recent-activity-modal-title"
    >
      <div 
        className="relative w-full max-w-2xl rounded-2xl glass-panel shadow-2xl border border-glass-border p-6 flex flex-col max-h-[85vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-white p-1.5 rounded-lg hover:bg-surface/50 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="mb-4 pr-8 border-b border-glass-border pb-3 shrink-0">
          <h2 id="recent-activity-modal-title" className="text-xl font-bold">
            Recent Activity History
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Showing all recorded activities up to 200 events.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 min-h-0 py-2">
          {error ? (
            <div className="py-8">
              <LoadErrorMessage
                error={error}
                isNetwork={networkError}
                onRetry={fetchAllActivities}
                retrying={loading}
              />
            </div>
          ) : (
            <SellerRecentActivity activities={activities} loading={loading} />
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-glass-border flex justify-between items-center text-xs text-text-muted shrink-0">
          <span>
            {!loading && !error && activities.length > 0 ? `Total: ${activities.length} activity entries` : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface/50 border border-glass-border hover:bg-surface/80 hover:text-white text-text transition-colors font-semibold text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
