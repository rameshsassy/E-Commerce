import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { User, MapPin, Package, Settings, LogOut, ChevronRight, Star, MessageSquare } from 'lucide-react';
import api from '../../utils/api';
import CustomerChat from '../../components/chat/CustomerChat';
import useFormAutosave from '../../hooks/useFormAutosave';
import FormAutosaveStatus from '../../components/common/FormAutosaveStatus';

const CustomerProfile = () => {
  const { user, logout, mergeUser } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailNewProductAlerts, setEmailNewProductAlerts] = useState(false);
  const [marketingEmailsEnabled, setMarketingEmailsEnabled] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', pinCode: '', landmark: '', isDefault: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, addressRes, profileRes] = await Promise.all([
          api.get('/customer/orders'),
          api.get('/customer/address'),
          api.get('/customer/profile').catch(() => ({ data: {} })),
        ]);
        setOrders(ordersRes.data || []);
        setAddresses(addressRes.data || []);
        const u = profileRes.data?.user;
        if (u) {
          mergeUser({
            emailNewProductAlerts: !!u.emailNewProductAlerts,
            marketingEmailsEnabled: u.marketingEmailsEnabled !== false,
          });
          setEmailNewProductAlerts(!!u.emailNewProductAlerts);
          setMarketingEmailsEnabled(u.marketingEmailsEnabled !== false);
        }
      } catch (error) {
        console.error("Failed to fetch profile data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mergeUser]);

  useEffect(() => {
    if (!user) return;
    setEmailNewProductAlerts(!!user.emailNewProductAlerts);
    setMarketingEmailsEnabled(user.marketingEmailsEnabled !== false);
  }, [user]);

  const TABS = [
    { id: 'personal', label: 'Personal Information', icon: <User size={20} /> },
    { id: 'addresses', label: 'Address Management', icon: <MapPin size={20} /> },
    { id: 'orders', label: 'My Orders & Tracking', icon: <Package size={20} /> },
    { id: 'settings', label: 'Account Settings', icon: <Settings size={20} /> },
    { id: 'chat', label: 'Chat Support', icon: <MessageSquare size={20} /> },
  ];

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await api.put(`/customer/address/${editingAddress._id}`, addressForm);
      } else {
        await api.post('/customer/address', addressForm);
      }
      setShowAddressModal(false);
      setEditingAddress(null);
      setAddressForm({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pinCode: '', landmark: '', isDefault: false });
      await clearAddressDraft();

      const res = await api.get('/customer/address');
      setAddresses(res.data);
    } catch (error) {
      console.error("Error saving address", error);
      alert(error.response?.data?.message || "Failed to save address");
    }
  };

  const deleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await api.delete(`/customer/address/${id}`);
      setAddresses(addresses.filter(a => a._id !== id));
    } catch (error) {
      console.error("Error deleting address", error);
      alert("Failed to delete address");
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      await api.put(`/customer/address/${id}`, { isDefault: true });
      const res = await api.get('/customer/address');
      setAddresses(res.data);
    } catch (error) {
      console.error("Error setting default address", error);
    }
  };

  const addressDraftKey = editingAddress
    ? `customer.address.edit.${editingAddress._id}`
    : 'customer.address.new';

  const { status: addressAutosaveStatus, message: addressAutosaveMessage, clearDraft: clearAddressDraft } =
    useFormAutosave({
      formKey: addressDraftKey,
      value: addressForm,
      enabled: showAddressModal,
      onRestore: (data) => setAddressForm((prev) => ({ ...prev, ...data })),
      isEmpty: (v) => !String(v.fullName || '').trim() && !String(v.addressLine1 || '').trim(),
    });

  const openAddAddressModal = () => {
    setEditingAddress(null);
    setAddressForm({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pinCode: '', landmark: '', isDefault: false });
    setShowAddressModal(true);
  };

  const saveEmailPreferences = async () => {
    setPrefsSaving(true);
    try {
      await api.put('/customer/email-preferences', {
        emailNewProductAlerts,
        marketingEmailsEnabled,
      });
      mergeUser({ emailNewProductAlerts, marketingEmailsEnabled });
    } catch (error) {
      console.error('Failed to save email preferences', error);
      alert(error.response?.data?.message || 'Could not save email preferences');
    } finally {
      setPrefsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in all fields.');
      return;
    }

    const isStrong = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(newPassword);
    if (!isStrong) {
      setPasswordError(
        'Password must be at least 8 characters and include an uppercase letter, a number, and a special character (@$!%*?&#).'
      );
      return;
    }

    setUpdatingPassword(true);
    try {
      const response = await api.put('/user/update-password', {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(response.data.message || 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      console.error('Password update error:', error);
      setPasswordError(error.response?.data?.message || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const openEditAddressModal = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      fullName: addr.fullName, phone: addr.phone, addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '', city: addr.city, state: addr.state,
      pinCode: addr.pinCode, landmark: addr.landmark || '', isDefault: addr.isDefault || false
    });
    setShowAddressModal(true);
  };

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
      <div className="flex-1 glass-panel p-8 rounded-2xl relative">
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
              <button className="btn btn-primary text-sm px-4 py-2" onClick={openAddAddressModal}>Add New Address</button>
            </div>
            
            {addresses.length === 0 ? (
              <div className="text-center py-12 text-text-muted bg-surface/50 rounded-xl">
                <MapPin size={48} className="mx-auto mb-4 opacity-30" />
                <p>No addresses saved yet.</p>
                <button className="btn btn-secondary mt-4" onClick={openAddAddressModal}>Add One Now</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {addresses.map((addr) => (
                  <div key={addr._id} className={`p-6 bg-surface border rounded-xl relative ${addr.isDefault ? 'border-primary bg-primary/5' : 'border-glass-border'}`}>
                    {addr.isDefault && <span className="absolute top-4 right-4 badge bg-primary text-white text-xs">Default</span>}
                    {!addr.isDefault && (
                      <button onClick={() => setDefaultAddress(addr._id)} className="absolute top-4 right-4 text-xs text-text-muted hover:text-primary underline">Set Default</button>
                    )}
                    <h3 className="font-bold text-lg mb-2">{addr.fullName}</h3>
                    <p className="text-text-muted text-sm mb-1">{addr.addressLine1}</p>
                    {addr.addressLine2 && <p className="text-text-muted text-sm mb-1">{addr.addressLine2}</p>}
                    <p className="text-text-muted text-sm mb-1">{addr.city}, {addr.state} - {addr.pinCode}</p>
                    {addr.landmark && <p className="text-text-muted text-sm mb-1">Landmark: {addr.landmark}</p>}
                    <p className="text-text-muted text-sm mb-4">Phone: {addr.phone}</p>
                    <div className="flex gap-4">
                      <button className="text-primary hover:underline text-sm font-medium" onClick={() => openEditAddressModal(addr)}>Edit</button>
                      <button className="text-error hover:underline text-sm font-medium" onClick={() => deleteAddress(addr._id)}>Delete</button>
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
              <div className="glass-panel p-5 rounded-2xl border border-glass-border">
                <h3 className="font-bold text-lg mb-2">Email notifications</h3>
                <p className="text-sm text-text-muted mb-4">
                  Control transactional and marketing messages sent from the store.
                </p>
                <label className="flex items-start gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-glass-border"
                    checked={emailNewProductAlerts}
                    onChange={(e) => setEmailNewProductAlerts(e.target.checked)}
                  />
                  <span>
                    <span className="font-medium block">New product alerts</span>
                    <span className="text-sm text-text-muted">
                      When we approve products you may care about, we can email you a short heads-up.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-glass-border"
                    checked={marketingEmailsEnabled}
                    onChange={(e) => setMarketingEmailsEnabled(e.target.checked)}
                  />
                  <span>
                    <span className="font-medium block">Marketing &amp; offers</span>
                    <span className="text-sm text-text-muted">
                      Seasonal campaigns and promotions. Order updates still go out when needed.
                    </span>
                  </span>
                </label>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={prefsSaving}
                  onClick={saveEmailPreferences}
                >
                  {prefsSaving ? 'Saving…' : 'Save email preferences'}
                </button>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4">Change Password</h3>
                {passwordError && (
                  <div className="p-3 mb-4 text-sm text-error bg-error/10 border border-error/20 rounded-xl animate-fade-in">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 mb-4 text-sm text-success bg-success/10 border border-success/20 rounded-xl animate-fade-in">
                    {passwordSuccess}
                  </div>
                )}
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="input-field"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="input-field"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updatingPassword}
                  >
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <CustomerChat />
        )}
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface border border-glass-border p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-xl font-bold">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <FormAutosaveStatus status={addressAutosaveStatus} message={addressAutosaveMessage} />
            </div>
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1">Full Name</label>
                  <input required type="text" className="input-field" value={addressForm.fullName} onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Phone Number</label>
                  <input required type="tel" className="input-field" value={addressForm.phone} onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-text-muted mb-1">Address Line 1</label>
                <input required type="text" placeholder="House/Flat No., Building Name, Street" className="input-field" value={addressForm.addressLine1} onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm text-text-muted mb-1">Address Line 2 (Optional)</label>
                <input type="text" placeholder="Locality, Area, Sector" className="input-field" value={addressForm.addressLine2} onChange={(e) => setAddressForm({...addressForm, addressLine2: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1">City</label>
                  <input required type="text" className="input-field" value={addressForm.city} onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">State</label>
                  <input required type="text" className="input-field" value={addressForm.state} onChange={(e) => setAddressForm({...addressForm, state: e.target.value})} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1">PIN Code</label>
                  <input required type="text" className="input-field" value={addressForm.pinCode} onChange={(e) => setAddressForm({...addressForm, pinCode: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Landmark (Optional)</label>
                  <input type="text" className="input-field" value={addressForm.landmark} onChange={(e) => setAddressForm({...addressForm, landmark: e.target.value})} />
                </div>
              </div>
              
              <label className="flex items-center gap-2 mt-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={addressForm.isDefault} 
                  onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})} 
                  className="rounded bg-background border-glass-border text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-sm font-medium">Set as Default Address</span>
              </label>
              
              <div className="flex gap-4 mt-8">
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowAddressModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">{editingAddress ? 'Update Address' : 'Save Address'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerProfile;
