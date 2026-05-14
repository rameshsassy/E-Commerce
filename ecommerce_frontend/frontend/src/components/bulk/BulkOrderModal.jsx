import React, { useState, useEffect } from 'react';
import { X, Package, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const escapeHtml = (s) => {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const BulkOrderModal = ({
  open,
  onClose,
  productId,
  productTitle,
  defaultName = '',
  defaultEmail = '',
  defaultPhone = '',
}) => {
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [quantityRequired, setQuantityRequired] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      setName(defaultName || '');
      setEmail(defaultEmail || '');
      setContactNumber(defaultPhone || '');
      setQuantityRequired('');
      setMessage('');
      setError('');
      setSuccess('');
    }
  }, [open, defaultName, defaultEmail, defaultPhone]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const digits = contactNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid contact number (at least 10 digits).');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/products/${productId}/bulk-inquiry`, {
        name: name.trim(),
        contactNumber: contactNumber.trim(),
        email: email.trim(),
        quantityRequired: quantityRequired.trim(),
        message: message.trim(),
      });
      setSuccess(data.message || 'Bulk inquiry submitted successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit bulk inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-order-title"
      onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
    >
      <div
        className="glass-panel w-full max-w-lg rounded-2xl border border-glass-border p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Package size={22} />
            </div>
            <div>
              <h2 id="bulk-order-title" className="text-xl font-bold">
                Bulk order request
              </h2>
              <p className="text-sm text-text-muted line-clamp-2">{escapeHtml(productTitle)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="p-2 rounded-lg hover:bg-surface-hover text-text-muted"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="bg-success/15 border border-success/40 text-success rounded-xl p-4 text-sm leading-relaxed">
              {success}
            </div>
            <button type="button" className="btn btn-primary w-full" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-error/15 border border-error/40 text-error rounded-xl p-3 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Full name</label>
              <input
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact number</label>
              <input
                className="input-field"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity required</label>
              <input
                className="input-field"
                value={quantityRequired}
                onChange={(e) => setQuantityRequired(e.target.value)}
                required
                placeholder="e.g. 500 units, 2 pallets"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message (optional)</label>
              <textarea
                className="input-field min-h-[100px] resize-y"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Delivery timeline, specs, or questions"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn btn-secondary flex-1" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1 inline-flex items-center justify-center gap-2" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin shrink-0" size={18} /> Sending…
                  </>
                ) : (
                  'Submit inquiry'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BulkOrderModal;
