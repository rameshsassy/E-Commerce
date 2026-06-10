import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Shield, Trash2, UserPlus, KeyRound } from 'lucide-react';

const SECTION_OPTIONS = [
  { key: 'dashboard', label: 'Dashboard & analytics' },
  { key: 'sellers', label: 'Sellers' },
  { key: 'kyc', label: 'KYC approvals' },
  { key: 'products', label: 'Product approvals' },
  { key: 'orders', label: 'Orders' },
  { key: 'returns', label: 'Returns & refunds' },
  { key: 'coupons', label: 'Promo codes' },
  { key: 'categories', label: 'Categories' },
];

const AdminRoles = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessLevel, setAccessLevel] = useState('full');
  const [sections, setSections] = useState([]);

  const load = async () => {
    setError('');
    try {
      const { data } = await api.get('/admin/roles/staff');
      setStaff(data.staff || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleSection = (key) => {
    setSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/roles/staff', {
        firstName: firstName.trim(),
        email: email.trim().toLowerCase(),
        password,
        adminAccessLevel: accessLevel,
        adminAllowedSections: accessLevel === 'limited' ? sections : [],
      });
      setFirstName('');
      setEmail('');
      setPassword('');
      setAccessLevel('full');
      setSections([]);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not create role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this admin account? They will no longer be able to sign in.')) return;
    try {
      await api.delete(`/admin/roles/staff/${id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="text-primary" /> Admin roles
        </h1>
        <p className="text-text-muted mt-2">
          Create sub-admin accounts with their own email and password. Full access matches the primary
          admin capabilities except managing roles. Limited access lets you choose specific areas.
        </p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="glass-panel p-8 rounded-2xl border border-glass-border">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <UserPlus size={22} className="text-primary" /> Add admin role
        </h2>
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                className="input-field w-full"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Display name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email (unique login)</label>
              <input
                type="email"
                className="input-field w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="staff@company.com"
              />
            </div>
          </div>
          <div className="max-w-md">
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <KeyRound size={16} /> Password
            </label>
            <input
              type="password"
              className="input-field w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Access level</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="access"
                  checked={accessLevel === 'full'}
                  onChange={() => setAccessLevel('full')}
                />
                <span>Full access (all admin areas except &quot;Roles&quot;)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="access"
                  checked={accessLevel === 'limited'}
                  onChange={() => setAccessLevel('limited')}
                />
                <span>Limited — choose areas below</span>
              </label>
            </div>
          </div>

          {accessLevel === 'limited' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-surface/30 border border-glass-border">
              {SECTION_OPTIONS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={sections.includes(key)}
                    onChange={() => toggleSection(key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create admin role'}
          </button>
        </form>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-glass-border">
        <h2 className="text-xl font-bold mb-4">Existing admin roles</h2>
        {staff.length === 0 ? (
          <p className="text-text-muted text-sm">No sub-admin accounts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-glass-border">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Access</th>
                  <th className="pb-3 pr-4">Areas</th>
                  <th className="pb-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s._id} className="border-b border-glass-border/50">
                    <td className="py-3 pr-4 font-medium">{s.firstName}</td>
                    <td className="py-3 pr-4">{s.email}</td>
                    <td className="py-3 pr-4 capitalize">{s.adminAccessLevel || '—'}</td>
                    <td className="py-3 pr-4 text-text-muted text-xs max-w-xs">
                      {s.adminAccessLevel === 'full'
                        ? 'All sections'
                        : (s.adminAllowedSections || []).join(', ') || '—'}
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(s._id)}
                        className="p-2 text-error hover:bg-error/10 rounded-lg"
                        title="Remove"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRoles;
