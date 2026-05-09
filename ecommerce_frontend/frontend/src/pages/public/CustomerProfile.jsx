import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { User, MapPin, Package, Settings, LogOut, ChevronRight, Star } from 'lucide-react';
import api from '../../utils/api';

const CustomerProfile = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, addressRes] = await Promise.all([
          api.get('/customer/orders'),
          api.get('/customer/address')
        ]);
        setOrders(ordersRes.data || []);
        setAddresses(addressRes.data || []);
      } catch (error) {
        console.error("Failed to fetch profile data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const TABS = [
    { id: 'personal', label: 'Personal Information', icon: <User size={20} /> },
    { id: 'addresses', label: 'Address Management', icon: <MapPin size={20} /> },
    { id: 'orders', label: 'My Orders & Tracking', icon: <Package size={20} /> },
    { id: 'settings', label: 'Account Settings', icon: <Settings size={20} /> },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full md:w-80 shrink-0">
        <div className="glass-panel p-6 rounded-2xl mb-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-3xl mb-4 shadow-glow">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
          <p className="text-text-muted text-sm">{user?.email}</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex flex-col gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all font-medium text-left ${activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'hover:bg-surface text-text-muted hover:text-text'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
              <ChevronRight size={18} className="ml-auto opacity-50" />
            </button>
          ))}
          <button
            className="flex items-center gap-3 p-4 rounded-xl transition-all font-medium text-left text-error hover:bg-error/10 mt-4 border-t border-glass-border pt-6"
            onClick={logout}
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 glass-panel p-8 rounded-2xl">
        {activeTab === 'personal' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 pb-4 border-b border-glass-border">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-text-muted mb-1">First Name</label>
                <div className="p-3 bg-surface rounded-lg border border-glass-border">{user?.firstName}</div>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Last Name</label>
                <div className="p-3 bg-surface rounded-lg border border-glass-border">{user?.lastName}</div>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Email</label>
                <div className="p-3 bg-surface rounded-lg border border-glass-border">{user?.email}</div>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Mobile Number</label>
                <div className="p-3 bg-surface rounded-lg border border-glass-border">{user?.mobile || 'Not provided'}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-glass-border">
              <h2 className="text-2xl font-bold">Manage Addresses</h2>
              <button className="btn btn-primary text-sm px-4 py-2">Add New Address</button>
            </div>
            
            {addresses.length === 0 ? (
              <div className="text-center py-12 text-text-muted bg-surface/50 rounded-xl">
                <MapPin size={48} className="mx-auto mb-4 opacity-30" />
                <p>No addresses saved yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {addresses.map((addr) => (
                  <div key={addr._id} className="p-6 bg-surface border border-glass-border rounded-xl relative">
                    {addr.isDefault && <span className="absolute top-4 right-4 badge bg-primary/20 text-primary text-xs">Default</span>}
                    <h3 className="font-bold text-lg mb-2">{addr.fullName}</h3>
                    <p className="text-text-muted text-sm mb-1">{addr.addressLine1}</p>
                    <p className="text-text-muted text-sm mb-1">{addr.city}, {addr.state} - {addr.pinCode}</p>
                    <p className="text-text-muted text-sm mb-4">Phone: {addr.phone}</p>
                    <div className="flex gap-4">
                      <button className="text-primary hover:underline text-sm font-medium">Edit</button>
                      <button className="text-error hover:underline text-sm font-medium">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 pb-4 border-b border-glass-border">My Orders & Tracking</h2>
            
            {orders.length === 0 ? (
              <div className="text-center py-12 text-text-muted bg-surface/50 rounded-xl">
                <Package size={48} className="mx-auto mb-4 opacity-30" />
                <p>You haven't placed any orders yet.</p>
                <Link to="/products" className="btn btn-primary mt-4">Start Shopping</Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order._id} className="bg-surface border border-glass-border rounded-xl overflow-hidden">
                    <div className="bg-surface-hover p-4 flex flex-wrap justify-between items-center gap-4 text-sm border-b border-glass-border">
                      <div>
                        <span className="text-text-muted block mb-1">Order Placed</span>
                        <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block mb-1">Total Amount</span>
                        <span className="font-bold text-success">Rs. {order.totalAmount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block mb-1">Order ID</span>
                        <span className="font-mono">{order._id.substring(order._id.length - 8)}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block mb-1">Status</span>
                        <span className="badge bg-primary/20 text-primary">{order.orderStatus}</span>
                      </div>
                    </div>
                    
                    <div className="p-4 flex flex-col gap-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-4 py-4 border-b border-glass-border last:border-0">
                          <div className="flex-1">
                            <h3 className="font-bold mb-1 hover:text-primary transition-colors cursor-pointer">{item.title}</h3>
                            <p className="text-text-muted text-sm mb-2">Sold by: {item.seller?.businessName || 'Verified Seller'}</p>
                            <p className="font-bold">Rs. {item.price.toFixed(2)} <span className="text-text-muted font-normal text-sm">x {item.quantity}</span></p>
                          </div>
                          
                          <div className="flex flex-col gap-2 shrink-0 sm:w-48 justify-center">
                            <button className="btn btn-primary w-full py-2 text-sm shadow-md">Track Package</button>
                            {order.orderStatus === 'Delivered' ? (
                              <>
                                <button className="btn btn-secondary w-full py-2 text-sm flex items-center justify-center gap-2 text-warning hover:border-warning">
                                  <Star size={16}/> Write Review
                                </button>
                                <button className="btn bg-surface hover:bg-surface-hover text-text w-full py-2 text-sm text-text-muted">Return/Replace</button>
                              </>
                            ) : (
                              <button className="btn bg-surface text-error border border-error/20 hover:bg-error/10 w-full py-2 text-sm">Cancel Order</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 pb-4 border-b border-glass-border">Account Settings</h2>
            <div className="max-w-md space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4">Change Password</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Current Password</label>
                    <input type="password" placeholder="••••••••" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">New Password</label>
                    <input type="password" placeholder="••••••••" className="input-field" />
                  </div>
                  <button className="btn btn-primary">Update Password</button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerProfile;
