import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const SearchSettings = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState({
    enabled: true,
    placeholder: 'Search products, brands, categories...',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings && settings.searchBar) {
      setFormData({
        enabled: settings.searchBar.enabled ?? true,
        placeholder: settings.searchBar.placeholder || 'Search products, brands, categories...',
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
        searchBar: {
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
        searchBar: formData,
      });
      onUpdate(data.settings);
      setMessage('Search bar settings saved successfully.');
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
          <h3 className="text-lg font-bold">Search Bar Settings</h3>
          <p className="text-text-muted text-sm mt-0.5">
            Configure placeholder and active status for customer search utility.
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
          <label className="text-sm font-semibold">Search Placeholder Text</label>
          <input
            type="text"
            name="placeholder"
            value={formData.placeholder}
            onChange={handleInputChange}
            placeholder="Search products, brands, categories..."
            required
            className="input-field py-2.5 px-4 rounded-xl text-sm"
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

export default SearchSettings;
