function PRPage({ toast }) {
  const [url, setUrl] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | result
  const [tab, setTab] = useState('security');

  const analyze = (e) => {
    e.preventDefault();
    if (!url.match(/github\.com\/.+\/pull\/\d+/i)) {
      toast('Paste a valid GitHub PR URL', 'error');
      return;
    }
    setState('loading');
    setTimeout(() => setState('result'), 1400);
  };

  const r = MockData.prResult;
  const verdictColor = r.verdict === 'Approved' ? '#22C55E' : r.verdict === 'Needs Changes' ? '#F59E0B' : '#EF4444';
  const verdictBg = r.verdict === 'Approved' ? 'rgba(34,197,94,.16)' : r.verdict === 'Needs Changes' ? 'rgba(245,158,11,.16)' : 'rgba(239,68,68,.16)';

  const tabs = [
    { key: 'security', label: 'Security', count: r.counts.security, Ic: Icons.Shield },
    { key: 'bugs',     label: 'Bugs',     count: r.counts.bugs,     Ic: Icons.Bug },
    { key: 'changes',  label: 'Changes',  count: 4, Ic: Icons.Code },
    { key: 'testing',  label: 'Testing',  count: 1, Ic: Icons.Activity },
    { key: 'positives', label: 'Positives', count: r.counts.positives, Ic: Icons.CheckCircle },
  ];

  const changedFiles = [
    { path: 'src/controllers/auth.controller.js', add: 42, del: 7 },
    { path: 'src/routes/auth.routes.js', add: 8, del: 2 },
    { path: 'src/middleware/rateLimit.js', add: 15, del: 4 },
    { path: 'tests/auth.test.js', add: 12, del: 0 },
  ];

  const history = [
    { repo: 'codeatlas/api', title: 'feat: vector search endpoint', verdict: 'Approved', score: 92, date: '2 days ago' },
    { repo: 'codeatlas/web', title: 'fix: graph hover flicker', verdict: 'Approved', score: 88, date: '4 days ago' },
    { repo: 'codeatlas/api', title: 'refactor: cache layer', verdict: 'Needs Changes', score: 71, date: '1 week ago' },
    { repo: 'codeatlas/api', title: 'chore: bump dependencies', verdict: 'Rejected', score: 54, date: '2 weeks ago' },
    { repo: 'codeatlas/web', title: 'feat: PR analyzer UI', verdict: 'Approved', score: 95, date: '3 weeks ago' },
  ];

  return (
    <div className="fade-up">
      <PageHeader title="PR Diff Analyzer" subtitle="Paste any GitHub PR URL for an AI-powered code review" />

      <form onSubmit={analyze} className="card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Icons.GitPullRequest size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="input" style={{ paddingLeft: 38 }}
            placeholder="https://github.com/owner/repo/pull/123" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={state === 'loading'}>
          {state === 'loading' ? 'Analyzing...' : <>Analyze PR <Icons.ArrowRight size={14} /></>}
        </button>
      </form>

      {state === 'loading' && (
        <div className="card" style={{ padding: 22 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ height: 18, marginBottom: 12, borderRadius: 6, background: 'linear-gradient(90deg, rgba(124,58,237,.04) 0%, rgba(124,58,237,.12) 50%, rgba(124,58,237,.04) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite', width: `${100 - i * 8}%` }} />
          ))}
        </div>
      )}

      {state === 'result' && (
        <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 18, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Header card */}
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>{r.title}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-2)' }}>by <span style={{ color: '#C4B5FD' }}>@{r.author}</span> in <span className="mono" style={{ color: '#C4B5FD' }}>{r.repo}</span></div>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: verdictBg, color: verdictColor, borderRadius: 999, fontWeight: 700, fontSize: 13, border: `1px solid ${verdictColor}55` }}>
                  {r.verdict === 'Approved' ? <Icons.CheckCircle size={14} /> : <Icons.AlertTriangle size={14} />} {r.verdict}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 22, alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 100, height: 100 }}>
                  <svg width="100" height="100" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,.06)" strokeWidth="7" fill="none" />
                    <circle cx="40" cy="40" r="32" stroke={verdictColor} strokeWidth="7" fill="none" strokeLinecap="round"
                      strokeDasharray={`${(r.score / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`} transform="rotate(-90 40 40)" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: 'white', lineHeight: 1 }}>{r.score}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>quality</div>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: '#E5E7EB', lineHeight: 1.6 }}>{r.summary}</div>
              </div>

              {/* Stat chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 18 }}>
                <Chip color="#EF4444" label="Security Issues" count={r.counts.security} />
                <Chip color="#F97316" label="Bugs" count={r.counts.bugs} />
                <Chip color="#F59E0B" label="Style Issues" count={r.counts.style} />
                <Chip color="#22C55E" label="Positives" count={r.counts.positives} />
              </div>
            </div>

            {/* Tabs */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-soft)', overflowX: 'auto' }}>
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    style={{
                      padding: '14px 18px', background: 'transparent', border: 0, color: tab === t.key ? 'white' : 'var(--text-2)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                      borderBottom: tab === t.key ? '2px solid var(--purple)' : '2px solid transparent', whiteSpace: 'nowrap',
                    }}>
                    <t.Ic size={14} /> {t.label}
                    {t.count > 0 && <span className="pill" style={{ background: 'rgba(255,255,255,.06)', color: 'var(--text-2)', fontSize: 10 }}>{t.count}</span>}
                  </button>
                ))}
              </div>
              <div style={{ padding: 20 }}>
                {tab === 'security' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <IssueCard severity="HIGH" path="src/controllers/auth.controller.js:18" text="JWT secret reads from env with a hard-coded fallback. Production deploys would silently sign with the fallback if JWT_SECRET were unset." />
                    <IssueCard severity="MEDIUM" path="src/middleware/rateLimit.js:42" text="Rate limit key derives from req.ip, but trust-proxy is not set — behind a load balancer this collapses all callers to a single limiter." />
                  </div>
                )}
                {tab === 'bugs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <BugCard path="src/controllers/auth.controller.js:54" issue="Refresh route does not invalidate the prior token, allowing replay attacks." fix="Rotate tokens on refresh: invalidate old jti via Redis blacklist before issuing new token." />
                    <BugCard path="src/routes/auth.routes.js:12" issue="`authLimiter` applied after route handler — middleware ordering means limiter never runs." fix="Move `authLimiter` middleware before the handler in router.post() chain." />
                    <BugCard path="src/middleware/rateLimit.js:78" issue="TTL not reset on hit — bucket can never refill once exhausted." fix="Use redis SET ... EX rather than INCR + separate EXPIRE." />
                  </div>
                )}
                {tab === 'changes' && (
                  <ol style={{ paddingLeft: 22, margin: 0, color: '#D1D5DB', fontSize: 13.5, lineHeight: 1.7 }}>
                    <li>Remove the JWT_SECRET fallback string entirely. Fail fast on startup if unset.</li>
                    <li>Reorder middleware so <span className="mono" style={{ color: '#C4B5FD' }}>authLimiter</span> runs before the route handler.</li>
                    <li>Implement token rotation on the refresh endpoint with a Redis-backed JTI blacklist.</li>
                    <li>Add 2 missing test cases: expired-token refresh and concurrent-refresh race.</li>
                  </ol>
                )}
                {tab === 'testing' && (
                  <div style={{ fontSize: 13.5, color: '#D1D5DB', lineHeight: 1.7 }}>
                    Test coverage on the new branch sits at <b style={{ color: 'white' }}>54%</b>, down from <b style={{ color: 'white' }}>72%</b> on main. The new <span className="mono">refresh()</span> handler has no unit tests and the rate limiter path is only exercised by the happy case. Recommended: add at least 3 cases for refresh (valid, expired, replayed) and 2 for the limiter (under-cap, over-cap).
                  </div>
                )}
                {tab === 'positives' && (
                  <ul style={{ paddingLeft: 22, margin: 0, color: '#86EFAC', fontSize: 13.5, lineHeight: 1.7 }}>
                    <li>Bcrypt cost factor (12) is appropriate for the workload.</li>
                    <li>Input validation correctly rejects empty payloads with 400.</li>
                    <li>Error responses do not leak internals — generic 401 on bad credentials.</li>
                    <li>The new Zod schema for signup is well-typed and reusable.</li>
                  </ul>
                )}
              </div>
            </div>

            {/* History */}
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.Clock size={14} style={{ color: 'var(--text-2)' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Recent Analyses</h3>
              </div>
              {history.map((h, i) => {
                const c = h.verdict === 'Approved' ? '#22C55E' : h.verdict === 'Needs Changes' ? '#F59E0B' : '#EF4444';
                return (
                  <div key={i} style={{ padding: '12px 18px', borderTop: i ? '1px solid var(--border-soft)' : 0, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: c, flexShrink: 0 }} />
                    <span className="mono" style={{ color: 'var(--text-2)', minWidth: 120 }}>{h.repo}</span>
                    <span style={{ color: 'white', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</span>
                    <span style={{ color: c, fontWeight: 600, minWidth: 32 }}>{h.score}</span>
                    <span style={{ color: 'var(--text-3)', fontSize: 12, minWidth: 80, textAlign: 'right' }}>{h.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Changed Files sidebar */}
          <div className="card" style={{ padding: 0, position: 'sticky', top: 24 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Changed Files</h3>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{changedFiles.length} files · +{changedFiles.reduce((s,f)=>s+f.add,0)} −{changedFiles.reduce((s,f)=>s+f.del,0)}</div>
            </div>
            {changedFiles.map((f, i) => (
              <div key={i} style={{ padding: '11px 16px', borderTop: i ? '1px solid var(--border-soft)' : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 10 }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(124,58,237,.04)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span className="mono" style={{ fontSize: 11.5, color: '#E5E7EB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.path}</span>
                <span style={{ display: 'flex', gap: 6, flexShrink: 0, fontSize: 11.5, fontWeight: 600 }}>
                  <span style={{ color: '#86EFAC' }}>+{f.add}</span>
                  <span style={{ color: '#FCA5A5' }}>−{f.del}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const c = sevColors[severity];
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

window.PRPage = PRPage;
