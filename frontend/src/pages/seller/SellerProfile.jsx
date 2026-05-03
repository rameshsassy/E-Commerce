import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Upload, CheckCircle, AlertTriangle, FileText, User, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SellerProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  
  // Profile update state
  const [profileData, setProfileData] = useState({ businessName: '', address: '', city: '', state: '', pincode: '' });
  const [profileMsg, setProfileMsg] = useState('');
  
  // KYC State
  const [kycData, setKycData] = useState({ panNumber: '', aadhaarNumber: '' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/seller/profile');
      setProfile(data);
      setProfileData({
        businessName: data.businessName || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      await api.put('/user/profile', profileData);
      setProfileMsg('Profile updated successfully');
      fetchProfile();
    } catch (err) {
      setProfileMsg('Failed to update profile');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 2) {
      alert('You can only upload up to 2 documents (PAN & Aadhaar)');
      return;
    }
    setFiles(e.target.files);
  };

  const handleKYCUpload = async (e) => {
    e.preventDefault();
    if (files.length < 2) {
      setMessage('Please upload both PAN and Aadhaar images.');
      return;
    }

    const formData = new FormData();
    formData.append('panNumber', kycData.panNumber);
    formData.append('aadhaarNumber', kycData.aadhaarNumber);
    for (let i = 0; i < files.length; i++) {
      formData.append('documents', files[i]);
    }

    setUploading(true);
    setMessage('');
    try {
      await api.post('/seller/kyc', formData);
      setMessage('KYC documents submitted successfully. Pending admin approval.');
      fetchProfile();
      setFiles([]);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
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
          ) : (
            <form onSubmit={handleKYCUpload} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">PAN Number</label>
                  <input required type="text" className="input-field" placeholder="ABCDE1234F" value={kycData.panNumber} onChange={e => setKycData({...kycData, panNumber: e.target.value.toUpperCase()})} disabled={profile?.kycStatus === 'pending'} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Aadhaar Number</label>
                  <input required type="text" className="input-field" placeholder="1234 5678 9012" value={kycData.aadhaarNumber} onChange={e => setKycData({...kycData, aadhaarNumber: e.target.value})} disabled={profile?.kycStatus === 'pending'} />
                </div>
              </div>
              
              <div className="border-2 border-dashed border-glass-border rounded-xl p-8 text-center hover:bg-surface/50 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*,.pdf"
                  disabled={profile?.kycStatus === 'pending'}
                />
                <Upload size={32} className="text-text-muted mx-auto mb-3" />
                <p className="font-medium mb-1">Upload PAN & Aadhaar Images</p>
                <p className="text-xs text-text-muted">PDF, JPG, PNG (Max 5MB each)</p>
              </div>

              {files.length > 0 && (
                <div className="bg-surface rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium">Selected Files:</h4>
                  {Array.from(files).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-text-muted">
                      <FileText size={16} /> {f.name}
                    </div>
                  ))}
                </div>
              )}

              {message && (
                <div className={`p-3 rounded-md text-sm ${message.includes('success') ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                  {message}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={files.length === 0 || uploading || profile?.kycStatus === 'pending'}
              >
                {uploading ? 'Uploading...' : 'Submit Documents'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
