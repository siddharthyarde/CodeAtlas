import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/Layout';
import { PageHeader, StatusBadge } from '../components/Shared';
import Icons from '../components/Icons';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

const iconBtnStyle = {
  width: 28, height: 28, borderRadius: 6, background: 'transparent', border: '1px solid var(--border)',
  color: 'var(--text-2)', display: 'grid', placeItems: 'center', cursor: 'pointer',
};

function ProgressStepper({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const color = done ? '#22C55E' : active ? '#7C3AED' : '#3a3460';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? '1' : '0 0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', minWidth: 90 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 999,
                background: active ? 'var(--purple-soft)' : done ? 'rgba(34,197,94,.15)' : 'rgba(255,255,255,.04)',
                border: `2px solid ${color}`,
                display: 'grid', placeItems: 'center',
                color, fontWeight: 700, fontSize: 13,
                boxShadow: active ? '0 0 0 4px rgba(124,58,237,.18)' : 'none',
                transition: 'all .2s',
              }}>
                {done ? <Icons.Check size={16} /> : i + 1}
              </div>
              <div style={{ fontSize: 11.5, marginTop: 8, color: active ? 'white' : 'var(--text-2)', fontWeight: active ? 600 : 500, textAlign: 'center' }}>{s}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#22C55E' : 'var(--border)', marginTop: -24, marginLeft: 8, marginRight: 8, opacity: done ? .6 : 1 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RepositoryPage() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [url, setUrl] = useState('');
  const [step, setStep] = useState(-1);
  const [msg, setMsg] = useState('');
  const [importedRepo, setImportedRepo] = useState(null);
  const [search, setSearch] = useState('');
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);

  const stepNames = ['Validating', 'Cloning', 'Uploading', 'Scanning', 'Complete'];
  const stepMsgs = [
    'Validating GitHub URL...',
    'Cloning repository (depth=1)...',
    'Uploading files to storage...',
    'Parsing ASTs and building graph...',
    'Done. Repository ready to explore.',
  ];

  useEffect(() => {
    api.get('/repo').then(res => {
      setRepos(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      if (data.step !== undefined) {
        setStep(data.step);
        setMsg(stepMsgs[data.step] || data.message || '');
      }
      if (data.status === 'complete' && data.repo) {
        setImportedRepo(data.repo);
        setStep(4);
        setMsg(stepMsgs[4]);
        setRepos(prev => [data.repo, ...prev.filter(r => r._id !== data.repo._id)]);
      }
      if (data.status === 'error') {
        toast.error(data.message || 'Import failed');
        setStep(-1);
      }
    };
    socket.on('repo:progress', handler);
    return () => socket.off('repo:progress', handler);
  }, [socket]);

  const startImport = async (e) => {
    e.preventDefault();
    if (!url.match(/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/i)) {
      toast.error('Please paste a valid GitHub repo URL');
      return;
    }
    setStep(0);
    setMsg(stepMsgs[0]);
    try {
      const res = await api.post('/repo/import', { url });
      if (!socket) {
        // Fallback: poll or just show complete after delay
        let s = 0;
        const adv = () => {
          s++;
          if (s <= 4) {
            setStep(s);
            setMsg(stepMsgs[s]);
            if (s < 4) setTimeout(adv, 1100);
            else setImportedRepo(res.data.data?.repo || { name: url.replace('https://github.com/', '') });
          }
        };
        setTimeout(adv, 1000);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
      setStep(-1);
    }
  };

  const reset = () => { setStep(-1); setUrl(''); setMsg(''); setImportedRepo(null); };

  const deleteRepo = async (id) => {
    try {
      await api.delete(`/repo/${id}`);
      toast.success('Repository removed');
      setRepos(prev => prev.filter(r => r._id !== id));
    } catch {
      toast.error('Failed to remove repository');
    }
  };

  const filtered = repos.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageWrapper>
      <div className="fade-up">
        <PageHeader title="Repositories" subtitle="Import a GitHub repo to start mapping it" />

        {/* Import section */}
        {step === -1 && (
          <div className="card" style={{ padding: 22, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>Import Repository</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-2)', fontSize: 13 }}>Paste any public GitHub repository URL to begin analysis.</p>
            <form onSubmit={startImport} style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Icons.Github size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input className="input" style={{ paddingLeft: 38 }}
                  placeholder="https://github.com/owner/repo"
                  value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
                Import Repository <Icons.ArrowRight size={14} />
              </button>
            </form>
          </div>
        )}

        {step >= 0 && step < 4 && (
          <div className="card fade-up" style={{ padding: 26, marginBottom: 24 }}>
            <ProgressStepper steps={stepNames} current={step} />
            <div style={{ marginTop: 26, position: 'relative', height: 6, background: 'rgba(124,58,237,.10)', borderRadius: 999, overflow: 'hidden' }}>
              <div className="shimmer" style={{ position: 'absolute', inset: 0 }} />
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${((step + 1) / 4) * 100}%`, background: 'linear-gradient(90deg, #7C3AED, #4F46E5)', transition: 'width 800ms cubic-bezier(.4,0,.2,1)' }} />
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 14, textAlign: 'center' }}>{msg}</div>
          </div>
        )}

        {step === 4 && importedRepo && (
          <div className="card fade-up" style={{ padding: 30, marginBottom: 24, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 999, background: 'rgba(34,197,94,.18)', color: '#22C55E', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Icons.CheckCircle size={32} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'white' }}>Repository imported</h3>
            <p style={{ color: 'var(--text-2)', margin: '0 0 22px' }}>{importedRepo.name} is ready to explore.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 24, maxWidth: 600, margin: '0 auto 24px' }}>
              {[
                { v: (importedRepo.totalFiles || 0).toString(), l: 'Files' },
                { v: (importedRepo.totalComponents || 0).toString(), l: 'Components' },
                { v: (importedRepo.totalRoutes || 0).toString(), l: 'Routes' },
                { v: (importedRepo.totalModels || 0).toString(), l: 'Models' },
              ].map((c, i) => (
                <div key={i} className="card" style={{ padding: 14 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>{c.v}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => navigate(`/graph?repo=${importedRepo._id}`)}><Icons.Network size={14} /> View Dependency Graph</button>
              <button className="btn btn-ghost" onClick={() => navigate(`/files?repo=${importedRepo._id}`)}><Icons.FileCode size={14} /> Browse Files</button>
              <button className="btn btn-ghost" onClick={reset}>Import Another</button>
            </div>
          </div>
        )}

        {/* All repos */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>All Repositories <span style={{ color: 'var(--text-3)', fontWeight: 500, fontSize: 13 }}>· {repos.length}</span></h3>
            <div style={{ position: 'relative', width: 260 }}>
              <Icons.Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input className="input" style={{ padding: '8px 10px 8px 32px', fontSize: 13 }} placeholder="Search repositories..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(124,58,237,.04)' }}>
                {['', 'Name', 'Owner', 'Status', 'Files', 'Imported', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '10px 20px', color: 'var(--text-3)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', width: i === 0 ? 40 : 'auto' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)' }}>No repositories found</td></tr>
              ) : filtered.map((r) => (
                <tr key={r._id} style={{ borderTop: '1px solid var(--border-soft)', cursor: 'pointer' }} onClick={() => navigate(`/graph?repo=${r._id}`)}>
                  <td style={{ padding: '12px 20px' }}>
                    <input type="checkbox" onClick={(e) => e.stopPropagation()} style={{ accentColor: '#7C3AED' }} />
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icons.Github size={14} style={{ color: 'var(--text-2)' }} />
                      <span className="mono" style={{ color: 'white', fontWeight: 600, fontSize: 12.5 }}>{r.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-2)' }}>{r.owner}</td>
                  <td style={{ padding: '12px 20px' }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-2)' }}>{r.totalFiles ? r.totalFiles.toLocaleString() : '—'}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-3)', fontSize: 12 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/graph?repo=${r._id}`); }} style={iconBtnStyle}><Icons.Network size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/files?repo=${r._id}`); }} style={iconBtnStyle}><Icons.FileCode size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteRepo(r._id); }} style={iconBtnStyle}><Icons.Trash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
