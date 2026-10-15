import { useState, useEffect } from 'react';
import { PageWrapper } from '../components/Layout';
import { PageHeader } from '../components/Shared';
import Icons from '../components/Icons';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [inviteLink, setInviteLink] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/team').then(res => {
      setMembers(res.data.data?.members || []);
      setPending(res.data.data?.pending || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const sendInvite = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) { toast.error('Enter a valid email'); return; }
    try {
      const res = await api.post('/team/invite', { email, role });
      const link = res.data.data?.inviteLink || '';
      setPending(p => [...p, { email, role }]);
      setInviteLink(link);
      setEmail('');
      toast.success('Invite link generated — copy and share it');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send invite');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/team/${id}`);
      setMembers(m => m.filter(x => x._id !== id));
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const revoke = async (idx) => {
    setPending(p => p.filter((_, j) => j !== idx));
    toast.success('Invite revoked');
  };

  return (
    <PageWrapper>
      <div className="fade-up">
        <PageHeader title="Team" subtitle="Manage members of your workspace" />

        {/* Members */}
        <div className="card" style={{ padding: 0, marginBottom: 22 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Team Members</h3>
            <span className="pill badge-purple">{members.length}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(124,58,237,.04)' }}>
                {['Member', 'Email', 'Role', 'Joined', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '10px 20px', color: 'var(--text-3)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)' }}>Loading...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)' }}>No team members yet</td></tr>
              ) : members.map((m, i) => (
                <tr key={m._id} style={{ borderTop: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 999, background: `hsl(${i * 70}, 50%, 45%)`, color: 'white', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 12 }}>
                        {(m.name || m.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <span style={{ color: 'white', fontWeight: 500 }}>{m.name || m.email}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-2)' }}>{m.email}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span className="pill" style={{
                      background: m.role === 'owner' ? 'rgba(124,58,237,.18)' : m.role === 'editor' ? 'rgba(79,70,229,.18)' : 'rgba(107,114,128,.18)',
                      color: m.role === 'owner' ? '#C4B5FD' : m.role === 'editor' ? '#A5B4FC' : '#9CA3AF',
                    }}>{m.role}</span>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-3)', fontSize: 12 }}>
                    {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    {m.role !== 'owner' && (
                      <button onClick={() => remove(m._id)} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,.3)', color: '#FCA5A5', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invite */}
        <div className="card" style={{ padding: 22, marginBottom: 22 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>Invite Team Member</h3>
          <p style={{ margin: '0 0 16px', color: 'var(--text-2)', fontSize: 13 }}>Generate a one-click join link and share it with your teammate.</p>
          <form onSubmit={sendInvite} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Icons.Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input className="input" style={{ paddingLeft: 36 }} placeholder="teammate@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              style={{ padding: '11px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button type="submit" className="btn btn-primary"><Icons.Send size={14} /> Send Invite</button>
          </form>

          {inviteLink && (
            <div className="fade-up" style={{ marginTop: 16, padding: 14, borderRadius: 8, background: 'rgba(34,197,94,.07)', border: '1px solid rgba(34,197,94,.25)' }}>
              <div style={{ fontSize: 12, color: '#86EFAC', marginBottom: 8, fontWeight: 600 }}>Invite link ready — copy and share with your teammate. Expires in 7 days.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input mono" style={{ fontSize: 12, padding: '8px 10px' }} value={inviteLink} readOnly />
                <button onClick={() => { navigator.clipboard?.writeText(inviteLink); toast.success('Link copied'); }}
                  className="btn btn-ghost" style={{ padding: '8px 12px', flexShrink: 0 }}>
                  <Icons.Copy size={14} /> Copy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pending */}
        {pending.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Pending Invites</h3>
            </div>
            {pending.map((p, i) => (
              <div key={i} style={{ padding: '12px 20px', borderTop: i ? '1px solid var(--border-soft)' : 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icons.Mail size={14} style={{ color: 'var(--text-3)' }} />
                <span style={{ color: '#E5E7EB', fontSize: 13.5, flex: 1 }}>{p.email}</span>
                <span className="pill" style={{ background: 'rgba(107,114,128,.18)', color: '#9CA3AF' }}>{p.role}</span>
                <span className="pill" style={{ background: 'rgba(245,158,11,.18)', color: '#FCD34D' }}>Pending</span>
                <button onClick={() => revoke(i)}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Revoke</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
