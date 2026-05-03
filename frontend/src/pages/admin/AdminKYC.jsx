import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Check, X, Eye } from 'lucide-react';

const AdminKYC = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchKYC = async () => {
    try {
      const { data } = await api.get('/admin/kyc');
      setPending(data.sellers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYC();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/admin/kyc/${action}/${id}`);
      fetchKYC();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">KYC Approvals</h1>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="glass-panel p-8 text-center text-text-muted">Loading KYC requests...</div>
        ) : pending.length === 0 ? (
          <div className="glass-panel p-8 text-center text-text-muted">No pending KYC requests at the moment.</div>
        ) : (
          pending.map(seller => (
            <div key={seller._id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">{seller.firstName} {seller.lastName}</h3>
                <p className="text-text-muted mb-4">{seller.email}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-surface p-4 rounded-lg border border-glass-border">
                  <div>
                    <span className="text-text-muted block text-xs uppercase tracking-wider">PAN Number</span>
                    <span className="font-bold font-mono">{seller.panNumber || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-xs uppercase tracking-wider">Aadhaar Number</span>
                    <span className="font-bold font-mono">{seller.aadhaarNumber || 'Not provided'}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  {seller.panImage && (
                    <a href={`http://localhost:5000/${seller.panImage}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-md">
                      <Eye size={16} /> View PAN Image
                    </a>
                  )}
                  {seller.aadhaarImage && (
                    <a href={`http://localhost:5000/${seller.aadhaarImage}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-md">
                      <Eye size={16} /> View Aadhaar Image
                    </a>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                <button onClick={() => handleAction(seller._id, 'approve')} className="btn btn-primary flex-1 md:flex-none">
                  <Check size={18} /> Approve
                </button>
                <button onClick={() => handleAction(seller._id, 'reject')} className="btn btn-danger flex-1 md:flex-none">
                  <X size={18} /> Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminKYC;
