import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { User, MapPin, Phone, Mail, Building, Globe, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SellerProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  
  // Profile update state
  const [profileData, setProfileData] = useState({ 
    businessName: '', address: '', city: '', state: '', pincode: '',
    isHyperlocal: false, deliverablePincodes: ''
  });
  const [profileMsg, setProfileMsg] = useState('');
  
  // KYC State
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/seller/profile');
      setProfile(data);
      setProfileData({
        businessName: data.businessName || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        isHyperlocal: data.isHyperlocal || false,
        deliverablePincodes: Array.isArray(data.deliverablePincodes) ? data.deliverablePincodes.join(', ') : (data.deliverablePincodes || '')
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      await api.put('/seller/profile', profileData);
      setProfileMsg('Profile updated successfully');
      fetchProfile();
    } catch (err) {
      setProfileMsg('Failed to update profile');
    }
  };




  if (loading) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="animate-fade-in max-w-4xl space-y-8">
      <h1 className="text-3xl font-bold">Profile & KYC</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Info Form */}
        <div className="glass-panel p-8 rounded-2xl">
          <h2 className="text-xl font-bold mb-6 border-b border-glass-border pb-4">Seller Information</h2>
          
          <div className="flex gap-4 mb-6 text-sm">
            <div>
              <p className="text-text-muted">Status</p>
              {profile?.status === 'approved' ? <span className="text-success font-bold flex items-center"><CheckCircle size={14} className="mr-1"/> Approved</span> : <span className="text-warning font-bold">Pending</span>}
            </div>
            <div>
              <p className="text-text-muted">KYC Status</p>
              <span className="font-bold capitalize">{profile?.kycStatus || 'Not Submitted'}</span>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Business Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-text-muted" size={18} />
                <input type="text" className="input-field pl-10" value={profileData.businessName} onChange={e => setProfileData({...profileData, businessName: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-text-muted" size={18} />
                <input type="text" className="input-field pl-10" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input type="text" className="input-field" value={profileData.city} onChange={e => setProfileData({...profileData, city: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input type="text" className="input-field" value={profileData.state} onChange={e => setProfileData({...profileData, state: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pincode</label>
              <input type="text" className="input-field" value={profileData.pincode} onChange={e => setProfileData({...profileData, pincode: e.target.value})} />
            </div>

            <div className="pt-4 border-t border-glass-border">
              <h3 className="text-md font-bold mb-3 flex items-center gap-2"><MapPin size={16} className="text-primary"/> Delivery Settings</h3>
              
              <div className="flex items-center gap-3 mb-4 bg-surface/50 p-3 rounded-lg border border-glass-border">
                <input 
                  type="checkbox" 
                  id="isHyperlocal"
                  className="w-5 h-5 accent-primary"
                  checked={profileData.isHyperlocal}
                  onChange={(e) => setProfileData({...profileData, isHyperlocal: e.target.checked})}
                />
                <label htmlFor="isHyperlocal" className="text-sm font-medium cursor-pointer">
                  Enable Hyperlocal Delivery (Restrict to specific pincodes)
                </label>
              </div>

              {profileData.isHyperlocal && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium mb-1">Deliverable Pincodes (comma separated)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. 400092, 400091, 400103"
                    value={profileData.deliverablePincodes} 
                    onChange={e => setProfileData({...profileData, deliverablePincodes: e.target.value})} 
                  />
                  <p className="text-xs text-text-muted mt-1">Leave empty if you don't want to deliver anywhere.</p>
                </div>
              )}
            </div>

            {profileMsg && <div className="text-success text-sm bg-success/20 p-2 rounded">{profileMsg}</div>}

            <button type="submit" className="btn btn-secondary w-full">Update Profile</button>
          </form>
        </div>

        {/* KYC Upload */}
        <div className="glass-panel p-8 rounded-2xl h-fit">
          <h2 className="text-xl font-bold mb-6 border-b border-glass-border pb-4">Submit KYC Documents</h2>
          
          {profile?.kycStatus === 'approved' ? (
            <div className="bg-success/10 border border-success/30 rounded-lg p-6 text-center">
              <CheckCircle size={40} className="text-success mx-auto mb-3" />
              <h3 className="text-lg font-bold text-success mb-1">KYC Verified</h3>
              <p className="text-sm text-text-muted">Your documents have been approved. You can now sell products.</p>
            </div>
          ) : profile?.kycStatus === 'pending' ? (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-6 text-center">
              <AlertTriangle size={40} className="text-warning mx-auto mb-3" />
              <h3 className="text-lg font-bold text-warning mb-1">KYC Pending</h3>
              <p className="text-sm text-text-muted">Your application is under review by the administrator.</p>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <p className="text-text-muted">You have not completed your full KYC verification. Please click the button below to start the multi-step verification process.</p>
              <button 
                onClick={() => navigate('/seller/kyc')} 
                className="btn btn-primary w-full"
              >
                Start KYC Application
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
