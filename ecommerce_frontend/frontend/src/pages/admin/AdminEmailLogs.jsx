import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { Mail, Loader2, RefreshCw } from 'lucide-react';

const AdminEmailLogs = () => {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('templateType', filterType);
      if (filterStatus) params.set('status', filterStatus);
      const { data: res } = await api.get(`/admin/email-logs?${params.toString()}`);
      setData({ items: res.items || [], total: res.total || 0 });
    } catch (e) {
      console.error(e);
      setData({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="text-primary" /> Email activity log
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Outbound mail pipeline: template → Nodemailer → status stored here for support and audits.
          </p>
        </div>
        <button type="button" onClick={load} className="btn btn-secondary inline-flex items-center gap-2" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="input-field max-w-xs"
          placeholder="Filter template type…"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        />
        <select
          className="input-field max-w-[200px]"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-glass-border overflow-hidden">
          <div className="px-4 py-3 border-b border-glass-border text-sm text-text-muted">
            Total records: <b className="text-text">{data.total}</b>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead>
                <tr className="bg-surface/80 text-text-muted border-b border-glass-border">
                  <th className="p-3">Time</th>
                  <th className="p-3">Template</th>
                  <th className="p-3">To</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-muted">
                      No email logs yet.
                    </td>
                  </tr>
                ) : (
                  data.items.map((row) => (
                    <tr key={row._id} className="border-b border-glass-border/50 hover:bg-surface/30">
                      <td className="p-3 whitespace-nowrap text-text-muted">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="p-3 font-mono text-xs">{row.templateType}</td>
                      <td className="p-3 max-w-[200px] truncate">{row.to}</td>
                      <td className="p-3 max-w-[280px] truncate">{row.subject}</td>
                      <td className="p-3">
                        <span
                          className={
                            row.status === 'sent'
                              ? 'text-success font-medium'
                              : row.status === 'failed'
                                ? 'text-error font-medium'
                                : 'text-warning'
                          }
                        >
                          {row.status}
                        </span>
                        {row.errorMessage && (
                          <div className="text-xs text-error mt-1 max-w-xs truncate" title={row.errorMessage}>
                            {row.errorMessage}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailLogs;
