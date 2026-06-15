import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import ColorPickerField from './ColorPickerField';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const AnnouncementBarManagement = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState({
    enabled: true,
    text: '',
    backgroundColor: '#000000',
    textColor: '#ffffff',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (settings && settings.announcementBar) {
      setFormData({
        enabled: settings.announcementBar.enabled ?? true,
        text: settings.announcementBar.text || '',
        backgroundColor: settings.announcementBar.backgroundColor || '#000000',
        textColor: settings.announcementBar.textColor || '#ffffff',
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

  const handleColorChange = (name, hex) => {
    setFormData(prev => ({
      ...prev,
      [name]: hex,
    }));
  };

  const validate = () => {
    const errors = {};
    if (formData.enabled) {
      if (!formData.text.trim()) {
        errors.text = 'Announcement text is required when enabled.';
      }
      if (!/^#[0-9A-F]{6}$/i.test(formData.backgroundColor)) {
        errors.backgroundColor = 'Must be a valid 6-character HEX color (e.g. #000000).';
      }
      if (!/^#[0-9A-F]{6}$/i.test(formData.textColor)) {
        errors.textColor = 'Must be a valid 6-character HEX color (e.g. #FFFFFF).';
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleToggle = async () => {
    const newEnabled = !formData.enabled;
    setFormData(prev => ({ ...prev, enabled: newEnabled }));
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const { data } = await api.put('/homepage-settings', {
        announcementBar: {
          ...formData,
          enabled: newEnabled,
        },
      });
      onUpdate(data.settings);
      setMessage(`Announcement bar has been ${newEnabled ? 'enabled' : 'disabled'}.`);
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
    if (!validate()) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const { data } = await api.put('/homepage-settings', {
        announcementBar: formData,
      });
      onUpdate(data.settings);
      setMessage('Announcement bar settings saved successfully.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const isTextLong = formData.text.length > 55;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-glass-border">
      <style>{`
        @keyframes adminMarquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .admin-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: adminMarquee 15s linear infinite;
        }
        .admin-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold">Announcement Bar Management</h3>
          <p className="text-text-muted text-sm mt-0.5">
            Display important notifications or promo banners at the very top of the customer website.
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={saving}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">Announcement Text</label>
            <textarea
              name="text"
              value={formData.text}
              onChange={handleInputChange}
              rows={3}
              placeholder="e.g. Welcome to Aashansh! Discover amazing products and offers."
              className={`input-field py-2.5 px-4 rounded-xl text-sm ${
                validationErrors.text ? 'border-error/50 focus:border-error' : ''
              }`}
            />
            {validationErrors.text && (
              <span className="text-xs text-error mt-0.5">{validationErrors.text}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ColorPickerField
              label="Background Color"
              value={formData.backgroundColor}
              onChange={(hex) => handleColorChange('backgroundColor', hex)}
              error={validationErrors.backgroundColor}
            />

            <ColorPickerField
              label="Text Color"
              value={formData.textColor}
              onChange={(hex) => handleColorChange('textColor', hex)}
              error={validationErrors.textColor}
            />
          </div>

          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary px-5 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-1.5"
            >
              {saving && <Loader2 className="animate-spin" size={14} />}
              Save Settings
            </button>
          </div>
        </form>

        {/* Live Preview */}
        <div className="flex flex-col gap-4">
          <label className="text-sm font-semibold">Live Preview</label>
          <div className="border border-glass-border rounded-2xl p-6 bg-zinc-950 flex flex-col gap-4 min-h-[150px] justify-center">
            {formData.enabled ? (
              <div
                style={{
                  backgroundColor: formData.backgroundColor,
                  color: formData.textColor,
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold overflow-hidden relative"
              >
                <div className={isTextLong ? 'admin-marquee cursor-pointer' : 'text-center'}>
                  {formData.text || 'Enter announcement text...'}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-text-muted border border-dashed border-glass-border rounded-xl py-6">
                Announcement Bar is currently disabled.
              </div>
            )}
            <span className="text-[10px] text-text-muted text-center mt-1">
              (Preview pauses when hover state is active on long scrolling text)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBarManagement;
