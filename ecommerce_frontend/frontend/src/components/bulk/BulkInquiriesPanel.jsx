import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { Boxes, Loader2, RefreshCw } from 'lucide-react';

const STATUSES = [
  'Negotiation Pending',
  'Meeting Scheduled',
  'Completed',
  'Cancelled',
];

const stripHtml = (s) => {
  if (!s) return '';
  return String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
};

const BulkInquiriesPanel = ({ isAdmin = false, title = 'Bulk order inquiries' }) => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const listUrl = isAdmin ? '/admin/bulk-inquiries' : '/seller/bulk-inquiries';

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get(listUrl);
      setInquiries(data.inquiries || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load inquiries');
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [listUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const patchUrl = isAdmin ? `/admin/bulk-inquiries/${id}` : `/seller/bulk-inquiries/${id}`;
      await api.patch(patchUrl, { status });
      await load();
    } catch (e) {
      alert(e.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div id="bulk-inquiries" className="glass-panel p-6 md:p-8 rounded-2xl border border-glass-border scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center">
            <Boxes size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm text-text-muted">
              {isAdmin
                ? 'Coordinate between buyers and premium sellers until the deal is finalized.'
                : 'Respond to wholesale requests for your premium listings.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            setLoading(true);
            await load();
          }}
          className="btn btn-secondary inline-flex items-center gap-2 self-start sm:self-auto"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm">{error}</div>
      )}

      {loading && inquiries.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : inquiries.length === 0 ? (
        <p className="text-text-muted text-center py-12 border border-dashed border-glass-border rounded-xl">
          No bulk inquiries yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-glass-border">
          <table className="w-full text-sm text-left min-w-[720px]">
            <thead>
              <tr className="bg-surface/80 text-text-muted border-b border-glass-border">
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Product</th>
                {isAdmin && <th className="p-3 font-medium">Seller</th>}
                <th className="p-3 font-medium">Buyer</th>
                <th className="p-3 font-medium">Contact</th>
                <th className="p-3 font-medium">Qty</th>
                <th className="p-3 font-medium">Note</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((row) => (
                <tr key={row._id} className="border-b border-glass-border/60 hover:bg-surface/40">
                  <td className="p-3 whitespace-nowrap text-text-muted">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="p-3 max-w-[180px]">
                    <span className="font-medium line-clamp-2">{row.productTitle || '—'}</span>
                  </td>
                  {isAdmin && (
                    <td className="p-3 max-w-[160px]">
                      <div className="font-medium line-clamp-1">{row.sellerLabel || '—'}</div>
                      {row.sellerEmail && (
                        <div className="text-xs text-text-muted truncate">{row.sellerEmail}</div>
                      )}
                    </td>
                  )}
                  <td className="p-3">
                    <div className="font-medium">{row.buyerName}</div>
                    <div className="text-xs text-text-muted truncate max-w-[140px]">{row.buyerEmail}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">{row.buyerPhone}</td>
                  <td className="p-3 max-w-[120px]">{row.quantityRequired}</td>
                  <td className="p-3 max-w-[140px] truncate text-text-muted" title={row.message || ''}>
                    {stripHtml(row.message) || '—'}
                  </td>
                  <td className="p-3">
                    <select
                      className="input-field py-2 text-xs max-w-[200px]"
                      value={row.status}
                      disabled={updatingId === row._id}
                      onChange={(e) => updateStatus(row._id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BulkInquiriesPanel;
