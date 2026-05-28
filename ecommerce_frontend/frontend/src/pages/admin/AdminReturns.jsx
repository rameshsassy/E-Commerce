import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';

const AdminReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const { data } = await api.get('/admin/returns');
        setReturns(data);
      } catch (err) {
        console.error("Failed to load returns", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, []);

  const handleAction = async (id, status) => {
    if(!window.confirm(`Are you sure you want to mark this as ${status}?`)) return;
    try {
      await api.put(`/returns/${id}/status`, { status });
      setReturns(returns.map(r => r._id === id ? { ...r, status } : r));
    } catch (_err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading return requests...</div>;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-8"><ArrowLeftRight className="text-primary"/> Return & Refund Requests</h1>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-glass-border bg-surface">
              <th className="p-4 text-text-muted font-medium">Order ID</th>
              <th className="p-4 text-text-muted font-medium">Customer</th>
              <th className="p-4 text-text-muted font-medium">Reason</th>
              <th className="p-4 text-text-muted font-medium">Status</th>
              <th className="p-4 text-text-muted font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((req) => (
              <tr key={req._id} className="border-b border-glass-border/50 hover:bg-white/5 transition-colors">
                <td className="p-4 font-mono text-sm">#{req.order?._id.slice(-8) || 'N/A'}</td>
                <td className="p-4 font-medium">{req.user?.firstName || 'Unknown'}</td>
                <td className="p-4 text-sm text-text-muted max-w-[200px] truncate">{req.reason}</td>
                <td className="p-4">
                  <span className={`badge ${req.status === 'Completed' ? 'bg-success/20 text-success' : req.status === 'Rejected' ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'} capitalize`}>
                    {req.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {req.status === 'Pending Approval' || req.status === 'Quality Check' ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleAction(req._id, 'Completed')} className="p-2 bg-success/10 text-success hover:bg-success hover:text-white transition-colors rounded-lg" title="Approve & Refund">
                        <CheckCircle size={18} />
                      </button>
                      <button onClick={() => handleAction(req._id, 'Rejected')} className="p-2 bg-error/10 text-error hover:bg-error hover:text-white transition-colors rounded-lg" title="Reject">
                        <XCircle size={18} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted">Processed</span>
                  )}
                </td>
              </tr>
            ))}
            {returns.length === 0 && (
              <tr><td colSpan="5" className="p-8 text-center text-text-muted">No return requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReturns;
