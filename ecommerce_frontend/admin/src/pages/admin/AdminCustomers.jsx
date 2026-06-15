import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Search } from 'lucide-react';
import ResponsiveTable from '../../components/common/ResponsiveTable';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-text-muted">Loading customers...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-text-muted">No customers found.</td></tr>
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
