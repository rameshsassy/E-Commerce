import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Search } from 'lucide-react';
import ResponsiveTable from '../../components/common/ResponsiveTable';

const AdminPremiumSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSellers = async () => {
    try {
      const { data } = await api.get('/admin/sellers');
      // Filter premium sellers only
      const premium = data.sellers?.filter(s => s.sellerType === 'premium') || [];
      setSellers(premium);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const filtered = sellers.filter(s =>
    ((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in w-full min-w-0">
      <div className="responsive-page-header">
        <h1 className="font-bold flex items-center gap-3">Premium Sellers</h1>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Search sellers..."
            className="input-field pl-10 py-2 text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading premium sellers...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No premium sellers found.</div>
        ) : (
          <ResponsiveTable minWidth="720px">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface/10 border-b border-glass-border">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium text-center">Plan</th>
                <th className="p-4 font-medium text-center">Bulk Purchase</th>
                <th className="p-4 font-medium text-center">Subscription Status</th>
                <th className="p-4 font-medium text-center">KYC Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(seller => {
                const plan = seller.subscriptionPlan || (seller.sellerType === 'premium' && seller.subscriptionActive ? 'premium' : 'free');
                return (
                  <tr key={seller._id} className="border-b border-glass-border hover:bg-surface/30 transition-colors">
                    <td className="p-4 font-medium">{seller.firstName} {seller.lastName}</td>
                    <td className="p-4 text-text-muted">{seller.email}</td>
                    <td className="p-4 text-center">
                      {plan === 'premium' ? (
                        <span className="badge bg-warning/20 text-warning border border-warning/30 font-bold">Premium</span>
                      ) : plan === 'pro' ? (
                        <span className="badge bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold">Pro</span>
                      ) : (
                        <span className="badge badge-secondary">Free</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {seller.bulkPurchaseEnabled ? (
                        <span className="badge badge-success">Enabled</span>
                      ) : (
                        <span className="badge badge-warning">Disabled</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {seller.subscriptionActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-warning">Inactive</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {seller.status === 'approved' ? (
                        <span className="badge badge-success">Approved</span>
                      ) : (
                        <span className="badge badge-warning capitalize">{seller.status}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </ResponsiveTable>
        )}
      </div>
    </div>
  );
};

export default AdminPremiumSellers;
