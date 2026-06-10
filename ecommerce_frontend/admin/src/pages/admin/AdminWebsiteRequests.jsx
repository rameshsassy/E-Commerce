import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Search, Eye, CheckCircle2, PhoneCall, Trash2, X, Globe, Calendar, Mail, Phone, Award, Layers, FileText } from 'lucide-react';
import ResponsiveTable from '../../components/common/ResponsiveTable';

export default function AdminWebsiteRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setError('');
      const { data } = await api.get('/admin/website-requests');
      setRequests(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load website requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    setActionLoading(true);
    setSuccess('');
    setError('');
    try {
      const { data } = await api.put(`/admin/website-requests/${id}/status`, { status: newStatus });
      setSuccess(data.message || `Request updated to ${newStatus}.`);
      
      // Update local state
      setRequests(prev => prev.map(req => req._id === id ? { ...req, status: newStatus } : req));
      
      if (selectedRequest && selectedRequest._id === id) {
        setSelectedRequest(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update request status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRequest = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this website request? This action cannot be undone.');
    if (!confirmed) return;

    setActionLoading(true);
    setSuccess('');
    setError('');
    try {
      const { data } = await api.delete(`/admin/website-requests/${id}`);
      setSuccess(data.message || 'Website request deleted successfully.');
      
      // Update local state
      setRequests(prev => prev.filter(req => req._id !== id));
      setSelectedRequest(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter requests based on search and status dropdown
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      (req.sellerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.brandName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'badge-warning';
      case 'Contacted':
        return 'bg-primary/20 text-primary border border-primary/30';
      case 'Completed':
        return 'badge-success';
      default:
        return 'bg-surface-hover text-text-muted';
    }
  };

  return (
    <div className="animate-fade-in w-full min-w-0 space-y-6">
      <div className="responsive-page-header">
        <div>
          <h1 className="font-bold flex items-center gap-2">
            <Globe className="text-primary" size={28} />
            Website Requests
          </h1>
          <p className="text-sm text-text-muted mt-1">Review and manage brand website inquiries from sellers.</p>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search by brand, name, category..." 
              className="input-field pl-10 py-2 text-sm" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>

          <select 
            className="input-field py-2 px-3 text-sm max-sm:w-full sm:w-40 appearance-none bg-surface"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Contacted">Contacted</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {success && (
        <div className="p-4 rounded-xl border border-success/30 bg-success/5 text-success text-sm font-medium animate-fade-in">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl border border-error/30 bg-error/5 text-error text-sm font-medium animate-fade-in">
          {error}
        </div>
      )}

      {/* TABLE DATA */}
      <div className="glass-panel overflow-hidden rounded-2xl">
        <ResponsiveTable minWidth="900px">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-glass-border">
                <th className="p-4 font-medium text-sm">Seller Name</th>
                <th className="p-4 font-medium text-sm">Brand & Category</th>
                <th className="p-4 font-medium text-sm">Contact Details</th>
                <th className="p-4 font-medium text-sm">Status</th>
                <th className="p-4 font-medium text-sm">Submitted Date</th>
                <th className="p-4 font-medium text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-text-muted">
                    Loading brand website requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-text-muted">
                    No website requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req._id} className="border-b border-glass-border hover:bg-surface/30 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-sm">{req.sellerName}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-sm">{req.brandName}</div>
                      <div className="text-xs text-text-muted mt-0.5">{req.category}</div>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <Mail size={12} /> {req.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-text-muted mt-1">
                        <Phone size={12} /> {req.phone}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${getStatusBadgeClass(req.status)} text-xs`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setSelectedRequest(req)} 
                          className="btn bg-surface hover:bg-surface-hover border border-glass-border p-2 rounded-md transition-colors"
                          title="View Details"
                          disabled={actionLoading}
                        >
                          <Eye size={16} />
                        </button>
                        
                        {req.status === 'Pending' && (
                          <button 
                            onClick={() => handleUpdateStatus(req._id, 'Contacted')}
                            className="btn bg-primary/10 text-primary hover:bg-primary hover:text-white p-2 rounded-md transition-colors"
                            title="Mark as Contacted"
                            disabled={actionLoading}
                          >
                            <PhoneCall size={16} />
                          </button>
                        )}
                        
                        {req.status !== 'Completed' && (
                          <button 
                            onClick={() => handleUpdateStatus(req._id, 'Completed')}
                            className="btn bg-success/10 text-success hover:bg-success hover:text-white p-2 rounded-md transition-colors"
                            title="Mark as Completed"
                            disabled={actionLoading}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}

                        <button 
                          onClick={() => handleDeleteRequest(req._id)}
                          className="btn bg-error/10 text-error hover:bg-error hover:text-white p-2 rounded-md transition-colors"
                          title="Delete Request"
                          disabled={actionLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ResponsiveTable>
      </div>

      {/* DETAIL MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-2xl bg-surface border border-glass-border max-h-[90vh] overflow-y-auto rounded-2xl flex flex-col p-6 sm:p-8 space-y-6 text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-glass-border pb-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Globe className="text-primary" size={22} />
                  Brand Website Request
                </h3>
                <p className="text-xs text-text-muted mt-0.5">Submitted on {new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="btn btn-secondary p-2 rounded-lg"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="bg-surface-hover/30 p-3 rounded-lg border border-glass-border flex items-center gap-3">
                  <User size={16} className="text-primary" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Seller Name</p>
                    <p className="font-semibold text-white">{selectedRequest.sellerName}</p>
                  </div>
                </div>

                <div className="bg-surface-hover/30 p-3 rounded-lg border border-glass-border flex items-center gap-3">
                  <Award size={16} className="text-primary" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Brand Name</p>
                    <p className="font-semibold text-white">{selectedRequest.brandName}</p>
                  </div>
                </div>

                <div className="bg-surface-hover/30 p-3 rounded-lg border border-glass-border flex items-center gap-3">
                  <Mail size={16} className="text-primary" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Email Address</p>
                    <a href={`mailto:${selectedRequest.email}`} className="font-semibold text-white hover:underline block truncate">
                      {selectedRequest.email}
                    </a>
                  </div>
                </div>

                <div className="bg-surface-hover/30 p-3 rounded-lg border border-glass-border flex items-center gap-3">
                  <Phone size={16} className="text-primary" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Phone Number</p>
                    <a href={`tel:${selectedRequest.phone}`} className="font-semibold text-white hover:underline block">
                      {selectedRequest.phone}
                    </a>
                  </div>
                </div>

                <div className="bg-surface-hover/30 p-3 rounded-lg border border-glass-border flex items-center gap-3">
                  <Layers size={16} className="text-primary" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Category</p>
                    <p className="font-semibold text-white">{selectedRequest.category}</p>
                  </div>
                </div>

                <div className="bg-surface-hover/30 p-3 rounded-lg border border-glass-border flex items-center gap-3">
                  <Calendar size={16} className="text-primary" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Status</p>
                    <span className={`badge ${getStatusBadgeClass(selectedRequest.status)} text-[11px] font-semibold inline-block mt-0.5`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                </div>

              </div>

              {/* Message / Requirements Block */}
              <div className="bg-surface-hover/20 p-4 rounded-xl border border-glass-border space-y-2">
                <p className="text-xs font-bold text-text-muted flex items-center gap-1.5 border-b border-glass-border pb-2">
                  <FileText size={14} /> MESSAGE / REQUIREMENTS
                </p>
                <p className="text-white leading-relaxed whitespace-pre-wrap pt-1 font-medium">{selectedRequest.message}</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-glass-border justify-end">
              
              {selectedRequest.status === 'Pending' && (
                <button
                  onClick={() => handleUpdateStatus(selectedRequest._id, 'Contacted')}
                  className="btn bg-primary text-white hover:bg-primary-hover flex items-center gap-1.5 text-sm"
                  disabled={actionLoading}
                >
                  <PhoneCall size={16} /> Mark as Contacted
                </button>
              )}
              
              {selectedRequest.status !== 'Completed' && (
                <button
                  onClick={() => handleUpdateStatus(selectedRequest._id, 'Completed')}
                  className="btn bg-success text-white hover:bg-success/90 flex items-center gap-1.5 text-sm"
                  disabled={actionLoading}
                >
                  <CheckCircle2 size={16} /> Mark as Completed
                </button>
              )}

              <button
                onClick={() => handleDeleteRequest(selectedRequest._id)}
                className="btn bg-error text-white hover:bg-error/90 flex items-center gap-1.5 text-sm"
                disabled={actionLoading}
              >
                <Trash2 size={16} /> Delete Request
              </button>

              <button
                onClick={() => setSelectedRequest(null)}
                className="btn btn-secondary text-sm"
                disabled={actionLoading}
              >
                Close Details
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
