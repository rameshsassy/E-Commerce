import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Globe, User, Phone, Mail, Award, Layers, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const CATEGORIES = [
  'Electronics & Gadgets',
  'Fashion & Apparel',
  'Home & Kitchen',
  'Beauty & Personal Care',
  'Health & Wellness',
  'Groceries & Food',
  'Books & Stationery',
  'Sports & Fitness',
  'Toys & Kids',
  'Other'
];

export default function SellerRequestWebsite() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    sellerName: '',
    phone: '',
    email: '',
    brandName: '',
    category: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Pre-fill form details from user profile
  useEffect(() => {
    if (user) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || '';
      setFormData(prev => ({
        ...prev,
        sellerName: name,
        email: user.email || '',
        phone: user.mobile || user.phone || '',
        brandName: user.businessName || ''
      }));
    }
  }, [user]);

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9\s-]{10,15}$/;

    if (!formData.sellerName.trim()) {
      errors.sellerName = 'Seller Name is required';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone Number is required';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number (10-15 digits)';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email ID is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.brandName.trim()) {
      errors.brandName = 'Brand Name is required';
    }

    if (!formData.category) {
      errors.category = 'Business Category is required';
    }

    if (!formData.message.trim()) {
      errors.message = 'Message / Requirements are required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    
    if (!validateForm()) {
      setErrorMsg('Please correct the validation errors below.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/website-requests', formData);
      setSuccessMsg(response.data.message || 'Your website request has been submitted. Our admin team will contact you soon.');
      
      // Reset form but keep the profile details pre-filled
      setFormData(prev => ({
        ...prev,
        category: '',
        message: ''
      }));
      setValidationErrors({});
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-page animate-fade-in max-w-3xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="seller-page-title flex flex-wrap items-center gap-2 sm:gap-3">
          <Globe className="text-primary shrink-0" size={28} />
          Request Brand Website
        </h1>
        <p className="text-base sm:text-lg text-text-muted">
          Ready to launch your online presence? Request a customized, modern brand website tailored specifically to your e-commerce operations.
        </p>
      </div>

      {successMsg ? (
        <div className="glass-panel p-8 rounded-2xl text-center space-y-4 border border-success/30 bg-success/5 animate-fade-in">
          <CheckCircle size={56} className="text-success mx-auto" />
          <h2 className="text-2xl font-bold text-success">Submission Successful</h2>
          <p className="text-text-muted max-w-md mx-auto">{successMsg}</p>
          <button 
            onClick={() => setSuccessMsg('')} 
            className="btn btn-secondary mt-2"
          >
            Submit Another Request
          </button>
        </div>
      ) : (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl">
          <h2 className="text-xl font-bold mb-6 border-b border-glass-border pb-4">Brand Website Request Form</h2>
          
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl border border-error/30 bg-error/5 text-error flex items-start gap-3 animate-fade-in">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Seller Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                  <User size={14} className="text-text-muted" /> Seller Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  className={`input-field ${validationErrors.sellerName ? 'border-error/50' : ''}`}
                  placeholder="Enter your name"
                  value={formData.sellerName}
                  onChange={e => setFormData({ ...formData, sellerName: e.target.value })}
                  disabled={loading}
                />
                {validationErrors.sellerName && (
                  <p className="text-xs text-error mt-1">{validationErrors.sellerName}</p>
                )}
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                  <Award size={14} className="text-text-muted" /> Brand Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  className={`input-field ${validationErrors.brandName ? 'border-error/50' : ''}`}
                  placeholder="Enter your brand name"
                  value={formData.brandName}
                  onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                  disabled={loading}
                />
                {validationErrors.brandName && (
                  <p className="text-xs text-error mt-1">{validationErrors.brandName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Email ID */}
              <div>
                <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                  <Mail size={14} className="text-text-muted" /> Email ID <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  className={`input-field ${validationErrors.email ? 'border-error/50' : ''}`}
                  placeholder="seller@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                />
                {validationErrors.email && (
                  <p className="text-xs text-error mt-1">{validationErrors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} className="text-text-muted" /> Phone Number <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  className={`input-field ${validationErrors.phone ? 'border-error/50' : ''}`}
                  placeholder="e.g. +91 9876543210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  disabled={loading}
                />
                {validationErrors.phone && (
                  <p className="text-xs text-error mt-1">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Business Category */}
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Layers size={14} className="text-text-muted" /> Business Category <span className="text-error">*</span>
              </label>
              <select
                className={`input-field appearance-none ${validationErrors.category ? 'border-error/50' : ''}`}
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                disabled={loading}
                style={{ backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
              >
                <option value="" disabled>Select your business category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-surface">{cat}</option>
                ))}
              </select>
              {validationErrors.category && (
                <p className="text-xs text-error mt-1">{validationErrors.category}</p>
              )}
            </div>

            {/* Message / Requirements */}
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <FileText size={14} className="text-text-muted" /> Message / Requirements <span className="text-error">*</span>
              </label>
              <textarea
                className={`input-field min-h-[120px] resize-y ${validationErrors.message ? 'border-error/50' : ''}`}
                placeholder="Describe your brand and website requirements (e.g. layout preferences, features, pages needed)..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                disabled={loading}
              />
              {validationErrors.message && (
                <p className="text-xs text-error mt-1">{validationErrors.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-white" size={18} />
                  Submitting Request...
                </>
              ) : (
                'Submit Website Request'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
