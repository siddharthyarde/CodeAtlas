import { useState, useMemo, useEffect } from 'react';
import { PageWrapper } from '../components/Layout';
import { PageHeader } from '../components/Shared';
import Icons from '../components/Icons';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function SettingsCard({ title, children }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>{title}</h3>
      {children}
    </div>
  );
}

function DeleteModal({ text, onText, onCancel, onConfirm }) {
  const enabled = text === 'DELETE';
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: 20 }} onClick={onCancel}>
      <div className="card fade-up" style={{ padding: 28, maxWidth: 460, width: '100%', borderColor: 'rgba(239,68,68,.4)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,.18)', color: '#FCA5A5', display: 'grid', placeItems: 'center' }}>
            <Icons.AlertTriangle size={20} />
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'white' }}>Delete account?</h3>
        </div>
        <p style={{ margin: '0 0 18px', color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.55 }}>
          This will permanently delete your account and all associated data. Type <b className="mono" style={{ color: '#FCA5A5' }}>DELETE</b> to confirm.
        </p>
        <input className="input" placeholder="Type DELETE to confirm" value={text} onChange={(e) => onText(e.target.value)} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" disabled={!enabled} onClick={onConfirm}
            style={{ opacity: enabled ? 1 : .4, cursor: enabled ? 'pointer' : 'not-allowed' }}>Delete Account</button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  // Anthropic API key
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [removingKey, setRemovingKey] = useState(false);

  useEffect(() => { if (user?.name) setName(user.name); }, [user]);

  const strength = useMemo(() => {
    let s = 0;
    if (pw.next.length >= 8) s++;
    if (/[A-Z]/.test(pw.next)) s++;
    if (/[0-9]/.test(pw.next)) s++;
    if (/[^A-Za-z0-9]/.test(pw.next)) s++;
    return s;
  }, [pw.next]);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#3a3460', '#EF4444', '#F97316', '#F59E0B', '#22C55E'];

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await api.patch('/auth/profile', { name });
      updateUser({ name: res.data.data?.name || name });
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePassword = async () => {
    if (!pw.current || !pw.next) { toast.error('Fill in all password fields'); return; }
    if (pw.next !== pw.confirm) { toast.error('Passwords do not match'); return; }
    setSavingPw(true);
    try {
      await api.patch('/auth/password', { currentPassword: pw.current, newPassword: pw.next });
      toast.success('Password updated');
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setSavingPw(false);
    }
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/auth/account');
      toast.success('Account deleted');
      logout();
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account');
    }
  };

  const saveApiKey = async () => {
    if (!apiKeyInput.trim()) { toast.error('Enter your Anthropic API key'); return; }
    setSavingKey(true);
    try {
      await api.patch('/auth/api-key', { apiKey: apiKeyInput.trim() });
      updateUser({ hasAnthropicKey: true, anthropicKeyHint: `sk-ant-••••••••••••${apiKeyInput.trim().slice(-6)}` });
      setApiKeyInput('');
      toast.success('API key saved — you can now use AI features');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save API key');
    } finally {
      setSavingKey(false);
    }
  };

  const removeApiKey = async () => {
    setRemovingKey(true);
    try {
      await api.delete('/auth/api-key');
      updateUser({ hasAnthropicKey: false, anthropicKeyHint: null });
      toast.success('API key removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove key');
    } finally {
      setRemovingKey(false);
    }
  };

  return (
    <PageWrapper>
      <div className="fade-up">
        <PageHeader title="Settings" subtitle="Manage your profile, security and integrations" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 760 }}>
          {/* Profile */}
          <SettingsCard title="Profile">
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
              <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 999, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: 28, cursor: 'pointer', flexShrink: 0 }}>
                {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: 'white' }}>{name || user?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{user?.email}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <label className="label">Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" value={user?.email || ''} readOnly style={{ paddingRight: 36, color: 'var(--text-2)' }} />
                  <Icons.Lock size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                </div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </SettingsCard>

          {/* Password */}
          <SettingsCard title="Change Password">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="label">Current password</label>
                <input className="input" type="password" value={pw.current}
                  onChange={(e) => setPw(p => ({ ...p, current: e.target.value }))} />
              </div>
              <div />
              <div>
                <label className="label">New password</label>
                <input className="input" type="password" value={pw.next}
                  onChange={(e) => setPw(p => ({ ...p, next: e.target.value }))} />
                {pw.next && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? strengthColors[strength] : '#1c1937' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: strengthColors[strength], marginTop: 4, fontWeight: 600 }}>{strengthLabels[strength]}</div>
                  </div>
                )}
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input className="input" type="password" value={pw.confirm}
                  onChange={(e) => setPw(p => ({ ...p, confirm: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={updatePassword} disabled={savingPw}>
              {savingPw ? 'Updating...' : 'Update Password'}
            </button>
          </SettingsCard>

          {/* API & Integrations */}
          <SettingsCard title="API & Integrations">
            {/* Anthropic API key — user-managed, they pay for their own usage */}
            <div style={{ padding: '0 0 18px', borderBottom: '1px solid var(--border-soft)', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icons.Sparkles size={14} style={{ color: '#A78BFA' }} />
                    Anthropic API Key
                    {user?.hasAnthropicKey && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(34,197,94,.15)', color: '#86EFAC', border: '1px solid rgba(34,197,94,.25)', fontWeight: 700 }}>
                        ✓ Configured
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                    Your key is used for AI explanations — you pay only for what you use.{' '}
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
                      style={{ color: '#A78BFA', textDecoration: 'none' }}>
                      Get a key →
                    </a>
                  </div>
                </div>
                {user?.hasAnthropicKey && (
                  <button className="btn btn-ghost" style={{ fontSize: 12, color: '#FCA5A5', borderColor: 'rgba(239,68,68,.3)' }}
                    onClick={removeApiKey} disabled={removingKey}>
                    {removingKey ? 'Removing…' : 'Remove key'}
                  </button>
                )}
              </div>

              {/* Current key hint */}
              {user?.hasAnthropicKey && user?.anthropicKeyHint && (
                <div className="mono" style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10, padding: '8px 12px', background: 'rgba(255,255,255,.04)', borderRadius: 6, border: '1px solid var(--border-soft)' }}>
                  {user.anthropicKeyHint}
                </div>
              )}

              {/* Input to add / replace key */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    className="input mono"
                    type={showKey ? 'text' : 'password'}
                    placeholder="sk-ant-api03-…"
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    style={{ paddingRight: 40, fontSize: 13 }}
                  />
                  <button onClick={() => setShowKey(v => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'grid', placeItems: 'center' }}>
                    {showKey ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
                  </button>
                </div>
                <button className="btn btn-primary" onClick={saveApiKey} disabled={savingKey || !apiKeyInput.trim()}>
                  {savingKey ? 'Saving…' : user?.hasAnthropicKey ? 'Update' : 'Save Key'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
              <div>
                <div style={{ fontSize: 14, color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {user?.githubId ? (
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                  ) : (
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: '#6B7280' }} />
                  )}
                  GitHub Connection
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {user?.githubId ? `Connected as @${user.githubUsername || user.name}` : 'Not connected'}
                </div>
              </div>
              <a href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/auth/github`}>
                <button className="btn btn-dark"><Icons.Github size={14} /> {user?.githubId ? 'Reconnect' : 'Connect'}</button>
              </a>
            </div>
          </SettingsCard>

          {/* Danger Zone */}
          <div className="card" style={{ padding: 20, borderColor: 'rgba(239,68,68,.35)', background: 'rgba(239,68,68,.04)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icons.AlertTriangle size={16} /> Danger Zone
            </h3>
            <p style={{ margin: '0 0 14px', color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.55 }}>
              Permanently delete your account, all repositories, and all AI analysis data. This action cannot be undone.
            </p>
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Delete Account</button>
          </div>
        </div>

        {confirmDelete && (
          <DeleteModal
            text={deleteText}
            onText={setDeleteText}
            onCancel={() => { setConfirmDelete(false); setDeleteText(''); }}
            onConfirm={() => { setConfirmDelete(false); setDeleteText(''); deleteAccount(); }}
          />
        )}
      </div>
    </PageWrapper>
  );
}
