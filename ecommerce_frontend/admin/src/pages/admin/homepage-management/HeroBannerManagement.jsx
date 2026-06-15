import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import ImageUploadPreview from './ImageUploadPreview';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const HeroBannerManagement = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState({
    enabled: true,
    image: '',
    headlineEnabled: true,
    headline: 'Discover Products Made for You',
    headlineAlignment: 'center',
    subtitleEnabled: true,
    subtitle: 'Shop from trusted sellers across Aashansh.',
    ctaEnabled: true,
    ctaText: 'Shop Now',
    ctaLink: '/products',
    ctaColor: '#ffd401',
  });

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (settings && settings.heroBanner) {
      setFormData({
        enabled: settings.heroBanner.enabled ?? true,
        image: settings.heroBanner.image || '',
        headlineEnabled: settings.heroBanner.headlineEnabled ?? true,
        headline: settings.heroBanner.headline || '',
        headlineAlignment: settings.heroBanner.headlineAlignment || 'center',
        subtitleEnabled: settings.heroBanner.subtitleEnabled ?? true,
        subtitle: settings.heroBanner.subtitle || '',
        ctaEnabled: settings.heroBanner.ctaEnabled ?? true,
        ctaText: settings.heroBanner.ctaText || 'Shop Now',
        ctaLink: settings.heroBanner.ctaLink || '/products',
        ctaColor: settings.heroBanner.ctaColor || '#ffd401',
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

  const handleFileSelect = async (file) => {
    setUploadingImage(true);
    setError('');
    setMessage('');

    const uploadData = new FormData();
    uploadData.append('heroImage', file);

    try {
      const { data } = await api.post('/homepage-settings/hero-image', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormData(prev => ({ ...prev, image: data.imageUrl }));
      onUpdate(data.settings);
      setMessage('Hero banner image uploaded successfully.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload hero image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    setFormData(prev => ({ ...prev, image: '' }));
    try {
      const { data } = await api.put('/homepage-settings', {
        heroBanner: {
          ...formData,
          image: '',
        },
      });
      onUpdate(data.settings);
    } catch (err) {
      console.error(err);
      setError('Failed to remove hero image settings.');
    }
  };

  const validate = () => {
    const errors = {};
    if (formData.enabled) {
      if (formData.headlineEnabled && !formData.headline.trim()) {
        errors.headline = 'Headline text is required when headline is enabled.';
      }
      if (formData.subtitleEnabled && !formData.subtitle.trim()) {
        errors.subtitle = 'Subtitle text is required when subtitle is enabled.';
      }
      if (formData.ctaEnabled) {
        if (!formData.ctaText.trim()) {
          errors.ctaText = 'Button text is required when button is enabled.';
        }
        if (!formData.ctaLink.trim()) {
          errors.ctaLink = 'Button link is required when button is enabled.';
        }
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
        heroBanner: {
          ...formData,
          enabled: newEnabled,
        },
      });
      onUpdate(data.settings);
      setMessage(`Hero Banner has been ${newEnabled ? 'enabled' : 'disabled'}.`);
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
        heroBanner: formData,
      });
      onUpdate(data.settings);
      setMessage('Hero Banner settings saved successfully.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // Helper to resolve absolute upload path for preview matching
  const getPreviewImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const clean = path.startsWith('/') ? path : '/' + path;
    return clean;
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-glass-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold">Hero Banner Management</h3>
          <p className="text-text-muted text-sm mt-0.5">
            Configure the main visual header banner on the customer landing page.
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Banner Image */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">Banner Image (4:1 Ratio)</label>
            <ImageUploadPreview
              imageUrl={formData.image}
              onFileSelect={handleFileSelect}
              onRemove={handleRemoveImage}
              uploading={uploadingImage}
            />
          </div>

          {/* Headline Settings */}
          <div className="border border-glass-border p-4 rounded-xl flex flex-col gap-4 bg-zinc-900/25">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Banner Headline</span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="headlineEnabled"
                  checked={formData.headlineEnabled}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {formData.headlineEnabled && (
              <div className="flex flex-col gap-3 animate-fade-in">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-muted">Headline Text</label>
                  <input
                    type="text"
                    name="headline"
                    value={formData.headline}
                    onChange={handleInputChange}
                    placeholder="Enter headline..."
                    className={`input-field py-2 px-3 rounded-lg text-sm ${
                      validationErrors.headline ? 'border-error/50' : ''
                    }`}
                  />
                  {validationErrors.headline && (
                    <span className="text-xs text-error mt-0.5">{validationErrors.headline}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-muted">Alignment</label>
                  <select
                    name="headlineAlignment"
                    value={formData.headlineAlignment}
                    onChange={handleInputChange}
                    className="input-field py-2 px-3 rounded-lg text-sm"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Subtitle Settings */}
          <div className="border border-glass-border p-4 rounded-xl flex flex-col gap-4 bg-zinc-900/25">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Banner Subtitle</span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="subtitleEnabled"
                  checked={formData.subtitleEnabled}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {formData.subtitleEnabled && (
              <div className="flex flex-col gap-1 animate-fade-in">
                <label className="text-xs font-semibold text-text-muted">Subtitle Text</label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  placeholder="Enter subtitle..."
                  className={`input-field py-2 px-3 rounded-lg text-sm ${
                    validationErrors.subtitle ? 'border-error/50' : ''
                  }`}
                />
                {validationErrors.subtitle && (
                  <span className="text-xs text-error mt-0.5">{validationErrors.subtitle}</span>
                )}
              </div>
            )}
          </div>

          {/* CTA Button Settings */}
          <div className="border border-glass-border p-4 rounded-xl flex flex-col gap-4 bg-zinc-900/25">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Call to Action (CTA) Button</span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="ctaEnabled"
                  checked={formData.ctaEnabled}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {formData.ctaEnabled && (
              <div className="flex flex-col gap-3 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-text-muted">Button Text</label>
                    <input
                      type="text"
                      name="ctaText"
                      value={formData.ctaText}
                      onChange={handleInputChange}
                      placeholder="Shop Now"
                      className={`input-field py-2 px-3 rounded-lg text-sm ${
                        validationErrors.ctaText ? 'border-error/50' : ''
                      }`}
                    />
                    {validationErrors.ctaText && (
                      <span className="text-xs text-error mt-0.5">{validationErrors.ctaText}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-text-muted">Button Color</label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg border border-glass-border shrink-0"
                        style={{ backgroundColor: formData.ctaColor }}
                      />
                      <input
                        type="text"
                        name="ctaColor"
                        value={formData.ctaColor}
                        disabled
                        className="input-field py-2 px-3 rounded-lg text-sm flex-1 font-mono uppercase bg-zinc-950 text-text-muted cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-muted">Redirect Link (URL or relative path)</label>
                  <input
                    type="text"
                    name="ctaLink"
                    value={formData.ctaLink}
                    onChange={handleInputChange}
                    placeholder="/products"
                    className={`input-field py-2 px-3 rounded-lg text-sm font-mono ${
                      validationErrors.ctaLink ? 'border-error/50' : ''
                    }`}
                  />
                  {validationErrors.ctaLink && (
                    <span className="text-xs text-error mt-0.5">{validationErrors.ctaLink}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary px-5 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-1.5"
            >
              {saving && <Loader2 className="animate-spin" size={14} />}
              Save Configuration
            </button>
          </div>
        </form>

        {/* Live Preview */}
        <div className="flex flex-col gap-4 sticky top-6">
          <label className="text-sm font-semibold">Live Preview</label>
          {formData.enabled ? (
            <div className="w-full aspect-[4/1] rounded-2xl border border-glass-border overflow-hidden bg-zinc-950 relative shadow-elegant">
              {formData.image ? (
                <img
                  src={getPreviewImageUrl(formData.image)}
                  alt="Banner Preview"
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary-glow/20 flex items-center justify-center border-b border-glass-border">
                  <span className="text-[10px] text-text-muted">(Placeholder gradient - no image uploaded)</span>
                </div>
              )}

              {/* Text overlay based on alignment */}
              <div
                className={`absolute inset-0 p-4 md:p-6 flex flex-col justify-center text-white z-10 ${
                  formData.headlineAlignment === 'left' ? 'items-start text-left' :
                  formData.headlineAlignment === 'right' ? 'items-end text-right' :
                  'items-center text-center'
                }`}
              >
                {formData.headlineEnabled && (
                  <h4 className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight max-w-[90%] truncate">
                    {formData.headline || 'Enter banner headline...'}
                  </h4>
                )}
                {formData.subtitleEnabled && (
                  <p className="text-[8px] sm:text-[10px] text-zinc-300 mt-0.5 max-w-[85%] truncate">
                    {formData.subtitle || 'Enter subtitle text...'}
                  </p>
                )}
                {formData.ctaEnabled && (
                  <button
                    type="button"
                    style={{ backgroundColor: formData.ctaColor, color: '#000000' }}
                    className="px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-extrabold uppercase mt-2 shadow-soft hover:opacity-90 transition-opacity"
                  >
                    {formData.ctaText || 'Shop Now'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-text-muted border border-dashed border-glass-border rounded-2xl min-h-[120px] flex items-center justify-center bg-zinc-950/40">
              Hero Banner is currently disabled.
            </div>
          )}
          <span className="text-[10px] text-text-muted text-center">
            (The preview mimics the dynamic desktop 4:1 aspect ratio sizing)
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeroBannerManagement;
