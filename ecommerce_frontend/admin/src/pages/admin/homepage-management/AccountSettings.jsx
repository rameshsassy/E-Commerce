import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const AccountSettings = ({ settings, onUpdate }) => {
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings && settings.accountMenu) {
      setEnabled(settings.accountMenu.enabled ?? true);
    }
  }, [settings]);

  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const { data } = await api.put('/homepage-settings', {
        accountMenu: {
          enabled: newEnabled,
        },
      });
      onUpdate(data.settings);
      setMessage(`Account menu icon has been ${newEnabled ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      console.error(err);
      setError('Failed to update status.');
      setEnabled(!newEnabled);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-glass-border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Account Menu Settings</h3>
          <p className="text-text-muted text-sm mt-0.5">
            Toggle visibility of the user profile drop-down menu icon.
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={saving}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
            enabled
              ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
              : 'bg-surface border-glass-border text-text-muted hover:bg-surface-hover'
          }`}
        >
          {saving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : enabled ? (
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
        <div className="p-3 mt-4 rounded-xl bg-success/10 border border-success/20 text-success-foreground text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 mt-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
