import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BadgeCheck,
} from 'lucide-react';

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
  if (!msg) return null;
  const isSuccess = type === 'success';
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-fade-in ${
        isSuccess
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-red-500/10 border-red-500/30 text-red-400'
      }`}
    >
      {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
};

// ─── Avatar initials ─────────────────────────────────────────────────────────
const Avatar = ({ firstName, lastName }) => {
  const initials = `${(firstName || '?')[0]}${(lastName || '')[0] || ''}`.toUpperCase();
  return (
    <div
      className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0"
      style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
        boxShadow: '0 0 24px rgba(99,102,241,0.4)',
      }}
    >
      {initials}
    </div>
  );
};

// ─── Role badge ──────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const map = {
    admin:       { label: '👑 Superadmin', cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
    admin_staff: { label: '🛡️ Admin Staff', cls: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  };
  const { label, cls } = map[role] || { label: role, cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cls}`}>{label}</span>
  );
};

// ─── Section heading ─────────────────────────────────────────────────────────
const SectionTitle = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 mb-5">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/15 flex-shrink-0">
      <Icon size={16} className="text-indigo-400" />
    </div>
    <h2 className="text-lg font-bold">{children}</h2>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
const AdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ firstName: '', lastName: '', email: '', mobile: '' });
  const [saving, setSaving]   = useState(false);
  const [profileToast, setProfileToast] = useState({ msg: '', type: '' });

  // Change password state
  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwToast, setPwToast] = useState({ msg: '', type: '' });

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/profile');
      setProfile(data);
      setForm({
        firstName: data.firstName || '',
        lastName:  data.lastName  || '',
        email:     data.email     || '',
        mobile:    data.mobile    || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Helpers ──
  const toast = (setter, msg, type, ms = 4000) => {
    setter({ msg, type });
    setTimeout(() => setter({ msg: '', type: '' }), ms);
  };

  // ── Validate email ──
  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // ── Handle profile save ──
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim()) {
      toast(setProfileToast, 'First name is required.', 'error');
      return;
    }
    if (form.email && !validateEmail(form.email.trim())) {
      toast(setProfileToast, 'Please enter a valid email address.', 'error');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/admin/profile', {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim(),
        mobile:    form.mobile.trim(),
      });
      setProfile(data.user || { ...profile, ...form });
      setEditing(false);
      await fetchProfile();
      toast(setProfileToast, 'Profile updated successfully!', 'success');
    } catch (err) {
      toast(setProfileToast, err?.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Handle password change ──
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast(setPwToast, 'Both fields are required.', 'error');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast(setPwToast, 'New password must be at least 6 characters.', 'error');
      return;
    }
    setPwSaving(true);
    try {
      await api.post('/admin/profile/change-password', pwForm);
      setPwForm({ currentPassword: '', newPassword: '' });
      toast(setPwToast, 'Password updated successfully!', 'success');
    } catch (err) {
      toast(setPwToast, err?.response?.data?.message || 'Failed to update password.', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-text-muted animate-fade-in">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
        <p className="text-sm">Loading profile…</p>
      </div>
    );
  }

  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Admin';

  return (
    <div className="animate-fade-in" style={{ maxWidth: '80rem', margin: '0 auto' }}>
      {/* ─── Page header ─── */}
      <div
        className="flex items-center gap-3 font-bold mb-6"
        style={{ fontSize: 'clamp(1.35rem, 4vw, 1.875rem)' }}
      >
        <User size={28} className="text-indigo-400" />
        My Profile
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ══════════════════════════════════════════
            LEFT — Identity card
        ══════════════════════════════════════════ */}
        <div className="lg:col-span-1 flex flex-col gap-6">

          {/* Profile card */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <Avatar firstName={profile?.firstName} lastName={profile?.lastName} />
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg truncate">{displayName}</h3>
                <p className="text-sm text-text-muted truncate">{profile?.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <RoleBadge role={profile?.role} />
                </div>
              </div>
            </div>

            {/* Quick details */}
            <div className="grid grid-cols-1 gap-3 pt-2 border-t border-glass-border">
              <div className="bg-white/4 rounded-xl p-3 border border-glass-border flex items-center gap-3">
                <Mail size={14} className="text-text-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Email</p>
                  <p className="text-sm font-medium truncate">{profile?.email || '—'}</p>
                </div>
              </div>
              <div className="bg-white/4 rounded-xl p-3 border border-glass-border flex items-center gap-3">
                <Phone size={14} className="text-text-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Mobile</p>
                  <p className="text-sm font-medium truncate">{profile?.mobile || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT — Edit profile + Change password
        ══════════════════════════════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* ── Edit Profile ── */}
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <SectionTitle icon={Pencil}>Edit Profile</SectionTitle>
              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="btn btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                  style={{ marginTop: '-1rem' }}
                >
                  <Pencil size={14} /> Edit
                </button>
              )}
            </div>

            {profileToast.msg && (
              <div className="mb-4">
                <Toast msg={profileToast.msg} type={profileToast.type} onClose={() => setProfileToast({ msg: '', type: '' })} />
              </div>
            )}

            {editing ? (
              <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label htmlFor="adm-firstName" className="block text-sm font-medium mb-1.5">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      <input
                        id="adm-firstName"
                        className="input-field"
                        style={{ paddingLeft: '2.25rem' }}
                        value={form.firstName}
                        onChange={e => setForm({ ...form, firstName: e.target.value })}
                        placeholder="First name"
                        required
                      />
                    </div>
                  </div>
                  {/* Last Name */}
                  <div>
                    <label htmlFor="adm-lastName" className="block text-sm font-medium mb-1.5">Last Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      <input
                        id="adm-lastName"
                        className="input-field"
                        style={{ paddingLeft: '2.25rem' }}
                        value={form.lastName}
                        onChange={e => setForm({ ...form, lastName: e.target.value })}
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                </div>
                {/* Email */}
                <div>
                  <label htmlFor="adm-email" className="block text-sm font-medium mb-1.5">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                      id="adm-email"
                      type="email"
                      className="input-field"
                      style={{ paddingLeft: '2.25rem' }}
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>
                {/* Mobile */}
                <div>
                  <label htmlFor="adm-mobile" className="block text-sm font-medium mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                      id="adm-mobile"
                      className="input-field"
                      style={{ paddingLeft: '2.25rem' }}
                      value={form.mobile}
                      onChange={e => setForm({ ...form, mobile: e.target.value })}
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        firstName: profile?.firstName || '',
                        lastName:  profile?.lastName  || '',
                        email:     profile?.email     || '',
                        mobile:    profile?.mobile    || '',
                      });
                    }}
                    className="btn btn-secondary px-6"
                  >
                    <X size={16} /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              /* View mode */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'First Name',    value: profile?.firstName },
                  { label: 'Last Name',     value: profile?.lastName  },
                  { label: 'Email Address', value: profile?.email     },
                  { label: 'Mobile Number', value: profile?.mobile    },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-medium bg-white/4 border border-glass-border rounded-xl px-4 py-3 truncate">
                      {value || '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Change Password ── */}
          <div className="glass-panel p-6 rounded-2xl">
            <SectionTitle icon={Lock}>Change Password</SectionTitle>

            {pwToast.msg && (
              <div className="mb-4">
                <Toast msg={pwToast.msg} type={pwToast.type} onClose={() => setPwToast({ msg: '', type: '' })} />
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
              {/* Current password */}
              <div>
                <label htmlFor="adm-currentPassword" className="block text-sm font-medium mb-1.5">
                  Current Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    id="adm-currentPassword"
                    type={showCurrent ? 'text' : 'password'}
                    className="input-field"
                    style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label htmlFor="adm-newPassword" className="block text-sm font-medium mb-1.5">
                  New Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <ShieldCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    id="adm-newPassword"
                    type={showNew ? 'text' : 'password'}
                    className="input-field"
                    style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                    value={pwForm.newPassword}
                    onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwForm.newPassword && pwForm.newPassword.length < 6 && (
                  <p className="text-xs text-red-400 mt-1">Password must be at least 6 characters</p>
                )}
              </div>

              <button
                type="submit"
                disabled={pwSaving}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
                style={{ marginTop: '0.25rem' }}
              >
                {pwSaving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminProfile;
