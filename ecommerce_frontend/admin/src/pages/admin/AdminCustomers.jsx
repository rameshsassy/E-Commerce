import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Search, Eye } from 'lucide-react';
import ResponsiveTable from '../../components/common/ResponsiveTable';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleImpersonateCustomer = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to view and manage the dashboard for customer ${name || 'this customer'}?`
    );
    if (!confirmed) return;
    try {
      const { data } = await api.post(`/admin/customers/${id}/impersonate`);
      const customerToken = data.token;
      const adminToken = localStorage.getItem('token');

      // Determine the customer portal URL
      const getCustomerPortalUrl = () => {
        const envUrl = import.meta.env.VITE_CUSTOMER_PORTAL_URL;
        if (envUrl) return envUrl.replace(/\/$/, '');

        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return `${protocol}//${hostname}:5173`;
        }
        
        if (hostname.includes('aashansh.org')) {
          return `${protocol}//aashansh.org`;
        }
        
        if (hostname.endsWith('.vercel.app')) {
          const newHost = hostname.replace('-admin', '-customer').replace('-seller', '-customer');
          return `${protocol}//${newHost}`;
        }

        return window.location.origin;
      };

      const customerPortalUrl = getCustomerPortalUrl();
      window.location.href = `${customerPortalUrl}/auth?token=${customerToken}&adminToken=${adminToken}`;
    } catch (err) {
      alert(err.response?.data?.message || 'Impersonation failed');
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/admin/customers');
      setCustomers(data.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c => 
    ((c.firstName || '') + ' ' + (c.lastName || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.customerId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in w-full min-w-0">
      <div className="responsive-page-header">
        <h1 className="font-bold">Manage Customers</h1>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search customers..." 
            className="input-field pl-10 py-2 text-sm" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <ResponsiveTable minWidth="720px">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-glass-border">
                <th className="p-4 font-medium">Customer ID</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-text-muted">Loading customers...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-text-muted">No customers found.</td></tr>
              ) : (
                filtered.map(customer => (
                  <tr key={customer._id} className="border-b border-glass-border hover:bg-surface/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary">{customer.customerId}</td>
                    <td className="p-4 font-medium">{customer.firstName} {customer.lastName}</td>
                    <td className="p-4 text-text-muted">{customer.email}</td>
                    <td className="p-4">
                      {customer.status === 'approved' || customer.status === 'active' ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-warning capitalize">{customer.status}</span>
                      )}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => handleImpersonateCustomer(customer._id, customer.firstName)} className="btn bg-[#ffd401] text-black hover:bg-[#ffd401]/90 p-2 rounded-md" title="Manage Customer Dashboard">
                        <Eye size={18} />
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

export default AdminCustomers;
