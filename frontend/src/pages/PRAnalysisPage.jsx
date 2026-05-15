import { useState, useMemo } from 'react';
import { PageWrapper } from '../components/Layout';
import { PageHeader } from '../components/Shared';
import Icons from '../components/Icons';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

function Chip({ color, label, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: `${color}10`, border: `1px solid ${color}33`, borderRadius: 8 }}>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: color }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{count}</div>
      </div>
    </div>
  );
}

function IssueCard({ severity, path, text }) {
  const sevColors = { CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#F59E0B', LOW: '#22C55E' };
  const c = sevColors[severity] || '#6B7280';
  return (
    <div className="card" style={{ padding: 14, borderLeft: `3px solid ${c}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span className="pill" style={{ background: `${c}22`, color: c, border: `1px solid ${c}44` }}>{severity}</span>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{path}</span>
      </div>
      <div style={{ fontSize: 13.5, color: '#E5E7EB', lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}

function BugCard({ path, issue, fix }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-2)', marginBottom: 6 }}>{path}</div>
      <div style={{ fontSize: 13.5, color: '#E5E7EB', marginBottom: 10, lineHeight: 1.55 }}>{issue}</div>
      <div style={{ padding: 10, background: 'rgba(34,197,94,.07)', borderLeft: '2px solid #22C55E', borderRadius: 6, fontSize: 12.5, color: '#86EFAC' }}>
        <b style={{ color: '#A7F3D0' }}>Suggested fix:</b> {fix}
      </div>
    </div>
  );
}

export default function PRAnalysisPage() {
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState('');
  const [state, setState] = useState('idle');
  const [tab, setTab] = useState('security');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const analyze = async (e) => {
    e.preventDefault();
    if (!url.match(/github\.com\/.+\/pull\/\d+/i)) {
      toast.error('Paste a valid GitHub PR URL');
      return;
    }
    setState('loading');
    try {
      const res = await api.post('/ai/pr-review', { url });
      const data = res.data.data;
      setResult(data);
      setHistory(prev => [{ url, verdict: data.overallVerdict, score: data.score, date: 'just now' }, ...prev.slice(0, 4)]);
      setState('result');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
      setState('idle');
    }
  };

  const verdictColor = result?.overallVerdict === 'Approved' ? '#22C55E'
    : result?.overallVerdict === 'Needs Changes' ? '#F59E0B' : '#EF4444';
  const verdictBg = result?.overallVerdict === 'Approved' ? 'rgba(34,197,94,.16)'
    : result?.overallVerdict === 'Needs Changes' ? 'rgba(245,158,11,.16)' : 'rgba(239,68,68,.16)';

  const tabs = result ? [
    { key: 'security', label: 'Security', count: result.securityIssues?.length || 0, Ic: Icons.Shield },
    { key: 'bugs', label: 'Bugs', count: result.bugs?.length || 0, Ic: Icons.Bug },
    { key: 'changes', label: 'Changes', count: result.recommendedChanges?.length || 0, Ic: Icons.Code },
    { key: 'testing', label: 'Testing', count: 1, Ic: Icons.Activity },
    { key: 'positives', label: 'Positives', count: result.positiveHighlights?.length || 0, Ic: Icons.CheckCircle },
  ] : [];

  return (
    <PageWrapper>
      <div className="fade-up">
        <PageHeader title="PR Diff Analyzer" subtitle="Paste any GitHub PR URL for an AI-powered code review" />

        <form onSubmit={analyze} className="card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Icons.GitPullRequest size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: 38 }}
              placeholder="https://github.com/owner/repo/pull/123"
              value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={state === 'loading'}>
            {state === 'loading' ? 'Analyzing...' : <><span>Analyze PR</span> <Icons.ArrowRight size={14} /></>}
          </button>
        </form>

        {state === 'loading' && (
          <div className="card" style={{ padding: 22 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="shimmer" style={{ height: 18, marginBottom: 12, borderRadius: 6, width: `${100 - i * 8}%` }} />
            ))}
          </div>
        )}

        {state === 'result' && result && (
          <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 18, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Header card */}
              <div className="card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>{result.summary?.slice(0, 60) || 'PR Analysis'}</h3>
                    <div style={{ fontSize: 13, color: 'var(--text-2)' }}>via <span className="mono" style={{ color: '#C4B5FD' }}>{url.replace('https://github.com/', '')}</span></div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: verdictBg, color: verdictColor, borderRadius: 999, fontWeight: 700, fontSize: 13, border: `1px solid ${verdictColor}55` }}>
                    {result.overallVerdict === 'Approved' ? <Icons.CheckCircle size={14} /> : <Icons.AlertTriangle size={14} />}
                    {result.overallVerdict}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 22, alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: 100, height: 100 }}>
                    <svg width="100" height="100" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,.06)" strokeWidth="7" fill="none" />
                      <circle cx="40" cy="40" r="32" stroke={verdictColor} strokeWidth="7" fill="none" strokeLinecap="round"
                        strokeDasharray={`${(result.score / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`} transform="rotate(-90 40 40)" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'white', lineHeight: 1 }}>{result.score}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>quality</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: '#E5E7EB', lineHeight: 1.6 }}>{result.summary}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 18 }}>
                  <Chip color="#EF4444" label="Security Issues" count={result.securityIssues?.length || 0} />
                  <Chip color="#F97316" label="Bugs" count={result.bugs?.length || 0} />
                  <Chip color="#F59E0B" label="Style Issues" count={result.styleIssues?.length || 0} />
                  <Chip color="#22C55E" label="Positives" count={result.positiveHighlights?.length || 0} />
                </div>
              </div>

              {/* Tabs */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-soft)', overflowX: 'auto' }}>
                  {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                      style={{
                        padding: '14px 18px', background: 'transparent', border: 0,
                        color: tab === t.key ? 'white' : 'var(--text-2)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                        borderBottom: tab === t.key ? '2px solid var(--purple)' : '2px solid transparent',
                        whiteSpace: 'nowrap',
                      }}>
                      <t.Ic size={14} /> {t.label}
                      {t.count > 0 && <span className="pill" style={{ background: 'rgba(255,255,255,.06)', color: 'var(--text-2)', fontSize: 10 }}>{t.count}</span>}
                    </button>
                  ))}
                </div>
                <div style={{ padding: 20 }}>
                  {tab === 'security' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {(result.securityIssues || []).length === 0
                        ? <div style={{ color: 'var(--text-2)', fontSize: 13 }}>No security issues found.</div>
                        : (result.securityIssues || []).map((iss, i) => (
                          <IssueCard key={i} severity={iss.severity?.toUpperCase() || 'MEDIUM'} path={iss.location || ''} text={iss.description || iss} />
                        ))}
                    </div>
                  )}
                  {tab === 'bugs' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {(result.bugs || []).length === 0
                        ? <div style={{ color: 'var(--text-2)', fontSize: 13 }}>No bugs found.</div>
                        : (result.bugs || []).map((bug, i) => (
                          <BugCard key={i} path={bug.location || ''} issue={bug.description || bug} fix={bug.fix || 'Review and refactor as needed.'} />
                        ))}
                    </div>
                  )}
                  {tab === 'changes' && (
                    <ol style={{ paddingLeft: 22, margin: 0, color: '#D1D5DB', fontSize: 13.5, lineHeight: 1.7 }}>
                      {(result.recommendedChanges || []).map((c, i) => <li key={i}>{c}</li>)}
                    </ol>
                  )}
                  {tab === 'testing' && (
                    <div style={{ fontSize: 13.5, color: '#D1D5DB', lineHeight: 1.7 }}>
                      {result.testingNotes || 'No testing notes provided.'}
                    </div>
                  )}
                  {tab === 'positives' && (
                    <ul style={{ paddingLeft: 22, margin: 0, color: '#86EFAC', fontSize: 13.5, lineHeight: 1.7 }}>
                      {(result.positiveHighlights || []).map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  )}
                </div>
              </div>

              {/* History */}
              {history.length > 0 && (
                <div className="card" style={{ padding: 0 }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icons.Clock size={14} style={{ color: 'var(--text-2)' }} />
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Recent Analyses</h3>
                  </div>
                  {history.map((h, i) => {
                    const c = h.verdict === 'Approved' ? '#22C55E' : h.verdict === 'Needs Changes' ? '#F59E0B' : '#EF4444';
                    const short = h.url.replace('https://github.com/', '');
                    return (
                      <div key={i} style={{ padding: '12px 18px', borderTop: i ? '1px solid var(--border-soft)' : 0, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: c, flexShrink: 0 }} />
                        <span className="mono" style={{ color: '#E5E7EB', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{short}</span>
                        <span style={{ color: c, fontWeight: 600, minWidth: 32 }}>{h.score}</span>
                        <span style={{ color: 'var(--text-3)', fontSize: 12, minWidth: 70, textAlign: 'right' }}>{h.date}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Changed files sidebar — shown from result.changedFiles if available */}
            <div className="card" style={{ padding: 0, position: 'sticky', top: 24 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Changed Files</h3>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                  {(result.changedFiles || []).length} files
                </div>
              </div>
              {(result.changedFiles || []).length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--text-3)', fontSize: 12 }}>No file breakdown available.</div>
              ) : (result.changedFiles || []).map((f, i) => (
                <div key={i} style={{ padding: '11px 16px', borderTop: i ? '1px solid var(--border-soft)' : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 10 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span className="mono" style={{ fontSize: 11.5, color: '#E5E7EB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.path}</span>
                  <span style={{ display: 'flex', gap: 6, flexShrink: 0, fontSize: 11.5, fontWeight: 600 }}>
                    {f.additions != null && <span style={{ color: '#86EFAC' }}>+{f.additions}</span>}
                    {f.deletions != null && <span style={{ color: '#FCA5A5' }}>−{f.deletions}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
