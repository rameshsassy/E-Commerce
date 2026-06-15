import React, { useState } from 'react';
import api, { getImageUrl } from '../../../utils/api';
import { Upload, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';

const LogoManagement = ({ settings, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewBg, setPreviewBg] = useState('light'); // 'light' or 'dark' to test logo rendering

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image format (JPG, JPEG, PNG, or WEBP).');
      return;
    }

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const { data } = await api.post('/homepage-settings/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onUpdate(data.settings);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload logo.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove the logo?')) return;
    try {
      const { data } = await api.put('/homepage-settings', {
        logo: {
          url: '',
          enabled: false,
        },
      });
      onUpdate(data.settings);
    } catch (err) {
      console.error(err);
      setError('Failed to remove logo.');
    }
  };

  const handleToggleLogo = async () => {
    try {
      const { data } = await api.put('/homepage-settings', {
        logo: {
          enabled: !settings.logo?.enabled,
        },
      });
      onUpdate(data.settings);
    } catch (err) {
      console.error(err);
      setError('Failed to update logo status.');
    }
  };

  const currentLogoUrl = settings?.logo?.url;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-glass-border">
      <h3 className="text-lg font-bold mb-2">Logo Management</h3>
      <p className="text-text-muted text-sm mb-6">
        Configure and upload the primary brand logo displayed in the top-left of the customer portal.
      </p>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Upload Column */}
        <div className="flex flex-col gap-4">
          <label className="text-sm font-semibold">Upload Header Logo</label>
          <div className="relative border-2 border-dashed border-glass-border hover:border-primary/50 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px]">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-primary" size={32} />
                <span className="text-sm font-medium text-text-muted">Uploading logo...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="text-text-muted" size={32} />
                <span className="text-sm font-medium">Click or drag image here</span>
                <span className="text-xs text-text-muted">Supports JPG, JPEG, PNG, WEBP (Max 5MB)</span>
              </div>
            )}
          </div>

          {currentLogoUrl && (
            <div className="flex flex-wrap gap-3 mt-2">
              <button
                type="button"
                onClick={handleToggleLogo}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  settings.logo?.enabled
                    ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
                    : 'bg-surface border-glass-border text-text-muted hover:bg-surface-hover'
                }`}
              >
                {settings.logo?.enabled ? (
                  <>
                    <Eye size={14} /> Enabled
                  </>
                ) : (
                  <>
                    <EyeOff size={14} /> Disabled
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error/20 transition-all"
              >
                <Trash2 size={14} /> Remove Logo
              </button>
            </div>
          )}
        </div>

        {/* Preview Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">Logo Preview</label>
            {currentLogoUrl && (
              <div className="flex gap-1.5 p-1 bg-surface rounded-lg border border-glass-border">
                <button
                  type="button"
                  onClick={() => setPreviewBg('light')}
                  className={`px-2 py-1 text-[10px] font-bold rounded ${
                    previewBg === 'light' ? 'bg-primary text-primary-foreground' : 'text-text-muted hover:bg-surface-hover'
                  }`}
                >
                  Light Bg
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('dark')}
                  className={`px-2 py-1 text-[10px] font-bold rounded ${
                    previewBg === 'dark' ? 'bg-primary text-primary-foreground' : 'text-text-muted hover:bg-surface-hover'
                  }`}
                >
                  Dark Bg
                </button>
              </div>
            )}
          </div>

          <div
            className={`border border-glass-border rounded-2xl p-8 flex items-center justify-center min-h-[160px] transition-colors relative overflow-hidden ${
              previewBg === 'dark' ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'
            }`}
          >
            {currentLogoUrl ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={getImageUrl(currentLogoUrl)}
                  alt="Header Logo Preview"
                  className="max-h-12 w-auto object-contain max-w-full"
                />
                {!settings.logo?.enabled && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-extrabold uppercase bg-error/15 text-error rounded-md border border-error/20">
                    Inactive
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <span className="font-extrabold tracking-tight text-xl text-primary" style={{ color: previewBg === 'dark' ? 'white' : 'var(--color-primary)' }}>
                  AASHANSH
                </span>
                <span className="text-[10px] text-text-muted mt-1">(Default Text Fallback)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoManagement;
