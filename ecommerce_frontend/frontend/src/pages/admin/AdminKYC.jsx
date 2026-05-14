import React, { useState, useEffect } from 'react';
import api, { BASE_URL } from '../../utils/api';
import { Check, X, Eye, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const AdminKYC = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

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
            <div key={seller._id} className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex items-center gap-4">
                  {seller.organizationLogo ? (
                    <img src={`${BASE_URL}/${seller.organizationLogo.replace(/\\/g, '/')}`} alt="Logo" className="w-16 h-16 rounded-full object-cover border border-[#E1E3E5]" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl border border-[#E1E3E5]">
                      {seller.firstName?.[0]}{seller.lastName?.[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold mb-1">{seller.officialName || seller.businessName || `${seller.firstName} ${seller.lastName}`}</h3>
                    <p className="text-text-muted">{seller.email}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                  <button onClick={() => setExpandedId(expandedId === seller._id ? null : seller._id)} className="btn btn-secondary flex-1 md:flex-none flex items-center gap-2">
                    {expandedId === seller._id ? <><ChevronUp size={18} /> Hide Details</> : <><ChevronDown size={18} /> View Details</>}
                  </button>
                  <button onClick={() => handleAction(seller._id, 'approve')} className="btn btn-primary flex-1 md:flex-none">
                    <Check size={18} /> Approve
                  </button>
                  <button onClick={() => handleAction(seller._id, 'reject')} className="btn btn-danger flex-1 md:flex-none">
                    <X size={18} /> Reject
                  </button>
                </div>
              </div>

              {/* EXPANDED DETAILS */}
              {expandedId === seller._id && (
                <div className="mt-4 pt-6 border-t border-glass-border animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Organization Details */}
                  <div>
                    <h4 className="font-semibold text-lg mb-4 text-[#202223] border-b pb-2">Organization Details</h4>
                    <div className="space-y-3 text-[14px]">
                      <div className="flex justify-between"><span className="text-text-muted">Entity Type</span><span className="font-medium">{seller.entityType || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted">Date of Registration</span><span className="font-medium">{seller.dateOfRegistration ? new Date(seller.dateOfRegistration).toLocaleDateString() : 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted">Admin Cost %</span><span className="font-medium">{seller.adminCostPercentage ? `${seller.adminCostPercentage}%` : 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted">Contact Number</span><span className="font-medium">{seller.mobile || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted">Personal PAN</span><span className="font-medium font-mono">{seller.panNumber || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted">Aadhaar Number</span><span className="font-medium font-mono">{seller.aadhaarNumber || 'N/A'}</span></div>
                      
                      {seller.storeAddresses && seller.storeAddresses.length > 0 && (
                        <div className="pt-2">
                          <span className="text-text-muted block mb-1">Store Addresses:</span>
                          <ul className="list-disc pl-5 text-[#202223]">
                            {seller.storeAddresses.map((addr, idx) => (
                              <li key={idx}>{addr}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {seller.elevatorPitch && (
                        <div className="pt-2">
                          <span className="text-text-muted block mb-1">Elevator Pitch:</span>
                          <p className="text-[#202223] italic border-l-2 border-primary pl-3">{seller.elevatorPitch}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Business Documents */}
                  <div>
                    <h4 className="font-semibold text-lg mb-4 text-[#202223] border-b pb-2">Business Documents</h4>
                    <div className="space-y-4 text-[14px]">
                      <div className="bg-surface p-3 rounded-lg border border-glass-border flex justify-between items-center">
                        <div>
                          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Registration No.</p>
                          <p className="font-bold font-mono">{seller.registrationNumber || 'N/A'}</p>
                        </div>
                        {seller.registrationCertificate && (
                          <a href={`${BASE_URL}/${seller.registrationCertificate}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline bg-primary/10 px-2 py-1 rounded">
                            <ExternalLink size={14} /> View
                          </a>
                        )}
                      </div>

                      <div className="bg-surface p-3 rounded-lg border border-glass-border flex justify-between items-center">
                        <div>
                          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Organization PAN</p>
                          <p className="font-bold font-mono">{seller.orgPanNumber || 'N/A'}</p>
                        </div>
                        {seller.orgPanImage && (
                          <a href={`${BASE_URL}/${seller.orgPanImage}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline bg-primary/10 px-2 py-1 rounded">
                            <ExternalLink size={14} /> View
                          </a>
                        )}
                      </div>

                      <div className="bg-surface p-3 rounded-lg border border-glass-border flex justify-between items-center">
                        <div>
                          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">GST Number</p>
                          <p className="font-bold font-mono">{seller.gstNumber || 'N/A'}</p>
                        </div>
                        {seller.gstImage && (
                          <a href={`${BASE_URL}/${seller.gstImage}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline bg-primary/10 px-2 py-1 rounded">
                            <ExternalLink size={14} /> View
                          </a>
                        )}
                      </div>

                      {seller.cancelledCheckImage && (
                        <div className="bg-surface p-3 rounded-lg border border-glass-border flex justify-between items-center">
                          <div>
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Bank Proof</p>
                            <p className="font-medium text-[#202223]">Cancelled Check</p>
                          </div>
                          <a href={`${BASE_URL}/${seller.cancelledCheckImage}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline bg-primary/10 px-2 py-1 rounded">
                            <ExternalLink size={14} /> View
                          </a>
                        </div>
                      )}
                      
                      {/* Legacy Images Fallback */}
                      {(seller.panImage || seller.aadhaarImage) && (
                        <div className="flex gap-4 pt-2">
                          {seller.panImage && (
                            <a href={`${BASE_URL}/${seller.panImage}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-md">
                              <Eye size={16} /> Personal PAN Image
                            </a>
                          )}
                          {seller.aadhaarImage && (
                            <a href={`${BASE_URL}/${seller.aadhaarImage}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-md">
                              <Eye size={16} /> Aadhaar Image
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminKYC;
