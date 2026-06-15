import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const BulkPurchaseSettings = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState({
    enabled: true,
    text: 'Bulk Purchase',
    link: '/bulk-purchase',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings && settings.bulkPurchase) {
      setFormData({
        enabled: settings.bulkPurchase.enabled ?? true,
        text: settings.bulkPurchase.text || 'Bulk Purchase',
        link: settings.bulkPurchase.link || '/bulk-purchase',
      });
    }
  }, [settings]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleToggle = async () => {
    const newEnabled = !formData.enabled;
    setFormData(prev => ({ ...prev, enabled: newEnabled }));
    setSaving(true);
    setMessage('');
    setError('');
    
    try {
      const { data } = await api.put('/homepage-settings', {
        bulkPurchase: {
          ...formData,
          enabled: newEnabled,
        },
      });
      onUpdate(data.settings);
      setMessage('Status updated successfully.');
    } catch (err) {
      console.error(err);
      setError('Failed to update status.');
      setFormData(prev => ({ ...prev, enabled: !newEnabled }));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const { data } = await api.put('/homepage-settings', {
        bulkPurchase: formData,
      });
      onUpdate(data.settings);
      setMessage('Bulk Purchase settings saved successfully.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-glass-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">Bulk Purchase Button Settings</h3>
          <p className="text-text-muted text-sm mt-0.5">
            Configure button that directs customers to bulk-order products page.
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${
            formData.enabled
              ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
              : 'bg-surface border-glass-border text-text-muted hover:bg-surface-hover'
          }`}
        >
          {formData.enabled ? (
            <>
              <Eye size={16} /> Enabled
            </>
          ) : (
            <>
              <EyeOff size={16} /> Disabled
            </>
          )}
        </button>
      </div>

      {message && (
        <div className="p-3 mb-4 rounded-xl bg-success/10 border border-success/20 text-success-foreground text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold">Button Text</label>
          <input
            type="text"
            name="text"
            value={formData.text}
            onChange={handleInputChange}
            placeholder="Bulk Purchase"
            required
            className="input-field py-2.5 px-4 rounded-xl text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold">Button Redirect Link</label>
          <input
            type="text"
            name="link"
            value={formData.link}
            onChange={handleInputChange}
            placeholder="/bulk-purchase"
            required
            className="input-field py-2.5 px-4 rounded-xl text-sm font-mono"
          />
        </div>

        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary px-5 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-1.5"
          >
            {saving && <Loader2 className="animate-spin" size={14} />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default BulkPurchaseSettings;
