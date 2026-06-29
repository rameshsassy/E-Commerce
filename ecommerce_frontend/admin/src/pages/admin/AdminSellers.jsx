import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Check, X, Search, Mail, Eye } from 'lucide-react';
import ResponsiveTable from '../../components/common/ResponsiveTable';

const AdminSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSellers = async () => {
    try {
      const { data } = await api.get('/admin/sellers');
      setSellers(data.sellers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleAction = async (id, action) => {
    if (action === 'reject') {
      const confirmed = window.confirm(
        'Are you sure you want to reject this seller?\n\nA rejection email will be sent to the seller with instructions to resubmit.'
      );
      if (!confirmed) return;
    }
    try {
      await api.put(`/admin/${action}/${id}`);
      fetchSellers();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };
  const handleSendWeeklyRecap = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to send the Weekly Recap email to ${name || 'this seller'}?`
    );
    if (!confirmed) return;
    try {
      const { data } = await api.post(`/admin/sellers/${id}/send-weekly-recap`);
      alert(data.message || 'Weekly recap sent successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send weekly recap');
    }
  };

  const handleImpersonateSeller = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to view and manage the dashboard for ${name || 'this seller'}?`
    );
    if (!confirmed) return;
    try {
      const { data } = await api.post(`/admin/sellers/${id}/impersonate`);
      const sellerToken = data.token;
      const adminToken = localStorage.getItem('token');

      // Determine the seller portal URL
      const getSellerPortalUrl = () => {
        const envUrl = import.meta.env.VITE_SELLER_PORTAL_URL;
        if (envUrl) return envUrl.replace(/\/$/, '');

        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return `${protocol}//${hostname}:5174`;
        }
        
        if (hostname.includes('aashansh.org')) {
          return `${protocol}//seller.aashansh.org`;
        }
        
        if (hostname.endsWith('.vercel.app')) {
          const newHost = hostname.replace('-admin', '-seller').replace('-customer', '-seller');
          return `${protocol}//${newHost}`;
        }

        return window.location.origin;
      };

      const sellerPortalUrl = getSellerPortalUrl();
      window.location.href = `${sellerPortalUrl}/login?token=${sellerToken}&adminToken=${adminToken}`;
    } catch (err) {
      alert(err.response?.data?.message || 'Impersonation failed');
    }
  };

  const filtered = sellers.filter(s => 
    ((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.sellerId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in w-full min-w-0">
      <div className="responsive-page-header">
        <h1 className="font-bold">Manage Sellers</h1>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-text-muted" size={18} />
          <input type="text" placeholder="Search sellers..." className="input-field pl-10 py-2 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <ResponsiveTable minWidth="720px">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-glass-border">
                <th className="p-4 font-medium">Seller ID</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-text-muted">Loading sellers...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-text-muted">No sellers found.</td></tr>
              ) : (
                filtered.map(seller => (
                  <tr key={seller._id} className="border-b border-glass-border hover:bg-surface/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary">{seller.sellerId}</td>
                    <td className="p-4 font-medium">{seller.firstName} {seller.lastName}</td>
                    <td className="p-4 text-text-muted">{seller.email}</td>
                    <td className="p-4">
                      {seller.status === 'approved' ? (
                        <span className="badge badge-success">Approved</span>
                      ) : (
                        <span className="badge badge-warning capitalize">{seller.status}</span>
                      )}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => handleImpersonateSeller(seller._id, seller.firstName)} className="btn bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white p-2 rounded-md" title="Manage Seller Dashboard">
                        <Eye size={18} />
                      </button>
                      {seller.status === 'approved' && (
                        <button onClick={() => handleSendWeeklyRecap(seller._id, seller.firstName)} className="btn bg-primary/20 text-primary hover:bg-primary hover:text-white p-2 rounded-md" title="Send Weekly Recap">
                          <Mail size={18} />
                        </button>
                      )}
                      {seller.status !== 'approved' && (
                        <button onClick={() => handleAction(seller._id, 'approve')} className="btn bg-success/20 text-success hover:bg-success hover:text-white p-2 rounded-md" title="Approve">
                          <Check size={18} />
                        </button>
                      )}
                      <button onClick={() => handleAction(seller._id, 'reject')} className="btn bg-error/20 text-error hover:bg-error hover:text-white p-2 rounded-md" title="Reject">
                        <X size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ResponsiveTable>
      </div>
    </div>
  );
};

export default AdminSellers;
