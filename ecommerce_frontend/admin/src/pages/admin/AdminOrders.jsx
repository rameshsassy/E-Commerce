import React, { useState, useEffect } from 'react';
import { Package, Search } from 'lucide-react';
import api from '../../utils/api';
import ResponsiveTable from '../../components/common/ResponsiveTable';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/admin/orders');
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading orders...</div>;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto w-full min-w-0">
      <div className="responsive-page-header">
        <h1 className="font-bold flex items-center gap-3"><Package className="text-primary shrink-0"/> All Orders</h1>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3 text-text-muted" size={18} />
          <input type="text" placeholder="Search orders..." className="input-field pl-10 w-full" />
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <ResponsiveTable minWidth="800px">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-glass-border bg-surface">
              <th className="p-4 text-text-muted font-medium">Order ID</th>
              <th className="p-4 text-text-muted font-medium">Customer</th>
              <th className="p-4 text-text-muted font-medium">Date</th>
              <th className="p-4 text-text-muted font-medium">Amount</th>
              <th className="p-4 text-text-muted font-medium">Status</th>
              <th className="p-4 text-text-muted font-medium">Payment</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-b border-glass-border/50 hover:bg-white/5 transition-colors cursor-pointer group">
                <td className="p-4 font-mono text-sm">#{order._id.slice(-8)}</td>
                <td className="p-4 font-medium">{order.user?.firstName || 'Unknown'} ({order.user?.customerId || '—'})</td>
                <td className="p-4 text-sm text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-4 font-bold">₹{order.totalAmount.toLocaleString()}</td>
                <td className="p-4">
                  <span className="badge bg-primary/20 text-primary capitalize">{order.status}</span>
                </td>
                <td className="p-4">
                  <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'} capitalize`}>
                    {order.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan="6" className="p-8 text-center text-text-muted">No orders found.</td></tr>
            )}
          </tbody>
        </table>
        </ResponsiveTable>
      </div>
    </div>
  );
};

export default AdminOrders;
