function SettingsPage({ toast }) {
  const [name, setName] = useState(MockData.user.name);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  // Password strength: 0-4
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

  return (
    <div className="fade-up">
      <PageHeader title="Settings" subtitle="Manage your profile, security and integrations" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 760 }}>
        {/* Profile */}
        <SettingsCard title="Profile">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
            <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 999, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: 28, cursor: 'pointer' }}>
              {MockData.user.avatar}
              <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'rgba(0,0,0,.55)', display: 'grid', placeItems: 'center', opacity: 0, transition: 'opacity .15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>Change</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'white' }}>{name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{MockData.user.email}</div>
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
                <input className="input" value={MockData.user.email} readOnly style={{ paddingRight: 36, color: 'var(--text-2)' }} />
                <Icons.Lock size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => toast('Profile saved', 'success')}>Save Changes</button>
        </SettingsCard>

        {/* Password */}
        <SettingsCard title="Change Password">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">Current password</label>
              <input className="input" type="password" value={pw.current} onChange={(e) => setPw(p => ({ ...p, current: e.target.value }))} />
            </div>
            <div />
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" value={pw.next} onChange={(e) => setPw(p => ({ ...p, next: e.target.value }))} />
              {pw.next && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? strengthColors[strength] : '#1c1937' }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: strengthColors[strength], marginTop: 4, fontWeight: 600 }}>{strengthLabels[strength]}</div>
                </div>
              )}
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input className="input" type="password" value={pw.confirm} onChange={(e) => setPw(p => ({ ...p, confirm: e.target.value }))} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => toast('Password updated', 'success')}>Update Password</button>
        </SettingsCard>

        {/* API & Integrations */}
        <SettingsCard title="API & Integrations">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <div>
              <div style={{ fontSize: 14, color: 'white', fontWeight: 500 }}>Anthropic API Key</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Managed server-side</div>
            </div>
            <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-2)' }}>sk-ant-•••••••••••••••XXXX</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
            <div>
              <div style={{ fontSize: 14, color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                GitHub Connection
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Connected as <span className="mono">@alex-morgan</span></div>
            </div>
            <button className="btn btn-dark" onClick={() => toast('Reconnected to GitHub', 'success')}><Icons.Github size={14} /> Reconnect</button>
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
        <DeleteModal text={deleteText} onText={setDeleteText} onCancel={() => { setConfirmDelete(false); setDeleteText(''); }} onConfirm={() => { setConfirmDelete(false); setDeleteText(''); toast('Account deletion scheduled', 'error'); }} />
      )}
    </div>
  );
}

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
          This will permanently delete your account, all 12 repositories, and all AI analysis data. Type <b className="mono" style={{ color: '#FCA5A5' }}>DELETE</b> to confirm.
        </p>
        <input className="input" placeholder="Type DELETE to confirm" value={text} onChange={(e) => onText(e.target.value)} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" disabled={!enabled} onClick={onConfirm} style={{ opacity: enabled ? 1 : .4, cursor: enabled ? 'pointer' : 'not-allowed' }}>Delete Account</button>
        </div>
      </div>
    </div>
  );
}

window.SettingsPage = SettingsPage;
