function FilesPage({ navigate, toast }) {
  const [selected, setSelected] = useState(MockData.files[4]); // auth.controller.js
  const [filter, setFilter] = useState('');
  const [semantic, setSemantic] = useState('');
  const [semResults, setSemResults] = useState(null);
  const [analysis, setAnalysis] = useState('result'); // empty | loading | result
  const [collapsed, setCollapsed] = useState({});

  const runSemantic = (e) => {
    e.preventDefault();
    if (!semantic.trim()) return;
    setSemResults([
      { file: 'src/controllers/auth.controller.js', purpose: 'Handles JWT signup, login, and token refresh', sim: 94 },
      { file: 'src/middleware/rateLimit.js', purpose: 'Token bucket rate limiting per user via Redis', sim: 88 },
      { file: 'src/utils/jwt.util.js', purpose: 'Sign and verify JWT tokens with the app secret', sim: 81 },
      { file: 'src/models/User.js', purpose: 'Mongoose schema for application users', sim: 76 },
      { file: 'src/routes/auth.routes.js', purpose: 'HTTP routes mapping auth endpoints', sim: 71 },
    ]);
  };

  const grouped = useMemo(() => {
    const g = {};
    MockData.files.filter(f => f.path.toLowerCase().includes(filter.toLowerCase())).forEach(f => {
      g[f.cat] = g[f.cat] || [];
      g[f.cat].push(f);
    });
    return g;
  }, [filter]);

  const riskDot = { low: '#22C55E', medium: '#F59E0B', high: '#F97316', critical: '#EF4444' };

  const runAnalysis = () => {
    setAnalysis('loading');
    setTimeout(() => setAnalysis('result'), 1100);
  };

  const codeLines = MockData.sampleCode.split('\n');

  return (
    <div data-screen-label="07 Files" style={{ position: 'fixed', left: 240, right: 0, top: 0, bottom: 0, display: 'flex', background: 'var(--bg)' }}>
      {/* Left panel */}
      <div style={{ width: '30%', minWidth: 300, maxWidth: 420, borderRight: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', background: 'var(--card)' }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => navigate('repositories')} style={{ alignSelf: 'flex-start', background: 'transparent', border: 0, color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icons.ChevronLeft size={12} /> Back to repos
          </button>
          <div className="mono" style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>shopify/polaris-react</div>

          <div style={{ position: 'relative' }}>
            <Icons.Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ padding: '8px 10px 8px 32px', fontSize: 13 }}
              placeholder="Filter files..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>

          <form onSubmit={runSemantic} style={{ position: 'relative' }}>
            <Icons.Sparkles size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#C4B5FD' }} />
            <input className="input" style={{ padding: '8px 36px 8px 32px', fontSize: 13, background: 'rgba(124,58,237,.06)', borderColor: 'rgba(124,58,237,.25)' }}
              placeholder="Search codebase in plain English..." value={semantic} onChange={(e) => setSemantic(e.target.value)} />
            <button type="submit" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'var(--purple)', border: 0, color: 'white', borderRadius: 5, padding: '4px 6px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <Icons.ArrowRight size={12} />
            </button>
          </form>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 16px' }}>
          {semResults && (
            <div style={{ padding: '8px 8px 16px', borderBottom: '1px solid var(--border-soft)', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 8px' }}>
                <span style={{ fontSize: 11, color: '#C4B5FD', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Semantic results</span>
                <button onClick={() => setSemResults(null)} style={{ background: 'transparent', border: 0, color: 'var(--text-3)', cursor: 'pointer' }}><Icons.X size={12} /></button>
              </div>
              {semResults.map((r, i) => (
                <div key={i} onClick={() => { const f = MockData.files.find(f => f.path === r.file); if (f) setSelected(f); }}
                  className="card-hover" style={{ padding: 10, borderRadius: 8, cursor: 'pointer', marginBottom: 6, border: '1px solid var(--border-soft)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span className="mono" style={{ fontSize: 11.5, color: 'white' }}>{r.file.split('/').slice(-1)[0]}</span>
                    <span className="pill badge-purple" style={{ fontSize: 10 }}>{r.sim}%</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.45 }}>{r.purpose}</div>
                </div>
              ))}
            </div>
          )}

          {Object.entries(grouped).map(([cat, files]) => (
            <div key={cat} style={{ marginBottom: 4 }}>
              <button onClick={() => setCollapsed(c => ({ ...c, [cat]: !c[cat] }))}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 6px', background: 'transparent', border: 0, color: 'var(--text-2)', cursor: 'pointer', textAlign: 'left' }}>
                {collapsed[cat] ? <Icons.Folder size={14} style={{ color: MockData.nodeColors[cat] }} /> : <Icons.FolderOpen size={14} style={{ color: MockData.nodeColors[cat] }} />}
                <span style={{ fontSize: 12, fontWeight: 600, color: '#E5E7EB' }}>{cat}</span>
                <span className="pill" style={{ background: 'rgba(255,255,255,.05)', color: 'var(--text-3)', fontSize: 10 }}>{files.length}</span>
              </button>
              {!collapsed[cat] && (
                <div>
                  {files.map(f => {
                    const isSel = selected.path === f.path;
                    return (
                      <div key={f.path} onClick={() => setSelected(f)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 28px', cursor: 'pointer', borderRadius: 6, background: isSel ? 'var(--purple-soft)' : 'transparent', borderLeft: isSel ? '2px solid var(--purple)' : '2px solid transparent' }}>
                        <Icons.FileCode size={11} style={{ color: '#6B7280' }} />
                        <span className="mono" style={{ fontSize: 11.5, color: isSel ? 'white' : '#D1D5DB', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.path.split('/').slice(-1)[0]}</span>
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: riskDot[f.risk] }} title={f.risk} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Breadcrumb */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)', background: 'var(--card)' }}>
          {selected.path.split('/').map((p, i, arr) => (
            <React.Fragment key={i}>
              <span className="mono" style={{ color: i === arr.length - 1 ? 'white' : 'inherit', fontWeight: i === arr.length - 1 ? 600 : 400 }}>{p}</span>
              {i < arr.length - 1 && <Icons.ChevronRight size={11} style={{ color: 'var(--text-3)' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Mock Monaco */}
        <div style={{ flex: '0 0 45%', overflow: 'auto', background: '#0a0a16', fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, lineHeight: 1.65 }}>
          <div style={{ display: 'flex' }}>
            <div style={{ padding: '14px 12px 14px 18px', color: '#3a3460', textAlign: 'right', userSelect: 'none', flexShrink: 0, borderRight: '1px solid var(--border-soft)' }}>
              {codeLines.map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <div style={{ padding: '14px 18px', flex: 1 }}>
              {codeLines.map((line, i) => <div key={i} style={{ whiteSpace: 'pre' }} dangerouslySetInnerHTML={{ __html: highlightLine(line) }} />)}
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div style={{ flex: 1, padding: 18, overflowY: 'auto', background: 'var(--bg)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icons.Brain size={16} style={{ color: '#A78BFA' }} /> AI Analysis
            </h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {analysis === 'result' && <span className="pill badge-complete">Cached</span>}
              <span className={`pill risk-${selected.risk}`} style={{ border: '1px solid' }}>{selected.risk.toUpperCase()} · CC {selected.cc}</span>
            </div>
          </div>

          {analysis === 'empty' && (
            <EmptyState icon={Icons.Sparkles} title="Select a file and click Analyze to get an AI breakdown" ctaLabel="Analyze with AI" onCta={runAnalysis} />
          )}
          {analysis === 'loading' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ height: 120, borderRadius: 10, background: 'linear-gradient(90deg, rgba(124,58,237,.04) 0%, rgba(124,58,237,.12) 50%, rgba(124,58,237,.04) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite' }} />
              ))}
            </div>
          )}
          {analysis === 'result' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <AnalysisCard color="#3B82F6" title="Purpose" body="Handles user authentication: signup, login, JWT issuance, and token refresh. The entry-point for all credential-related flows." />
              <AnalysisCard color="#A855F7" title="Architecture" body="Express controller. Calls into the User model (Mongoose) and the jwt.util helper. Uses bcryptjs for password hashing with a cost factor of 12." />
              <AnalysisCard color="#EF4444" title="Issues" bullets={[
                'JWT_SECRET fallback removed in prod — no validation on startup',
                'No password complexity validation',
                'Refresh route doesn\'t rotate tokens',
              ]} />
              <AnalysisCard color="#22C55E" title="Tips" bullets={[
                'Extract validation into a Zod schema',
                'Add rate limiter at the route level',
                'Return user object without `password` field explicitly',
              ]} />
            </div>
          )}

          <button onClick={runAnalysis}
            style={{ position: 'absolute', bottom: 18, right: 18, padding: '10px 16px', borderRadius: 8, background: 'var(--purple)', color: 'white', border: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, boxShadow: '0 6px 20px rgba(124,58,237,.4)' }}>
            <Icons.Sparkles size={14} /> {analysis === 'result' ? 'Re-analyze' : 'Analyze with AI'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalysisCard({ color, title, body, bullets }) {
  return (
    <div className="card" style={{ padding: 14, borderLeft: `3px solid ${color}`, background: `linear-gradient(135deg, ${color}10 0%, var(--card) 30%)` }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>{title}</div>
      {body && <div style={{ fontSize: 13, color: '#E5E7EB', lineHeight: 1.55 }}>{body}</div>}
      {bullets && (
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: '#E5E7EB', lineHeight: 1.6 }}>
          {bullets.map((b, i) => <li key={i} style={{ marginBottom: 3 }}>{b}</li>)}
        </ul>
      )}
    </div>
  );
}

/* Simple syntax highlighter — tokenizes via placeholders so later
   passes can't match HTML emitted by earlier passes. */
function highlightLine(line) {
  if (!line.trim()) return '&nbsp;';
  const tokens = [];
  const stash = (html) => { tokens.push(html); return `\u0000${tokens.length - 1}\u0000`; };

  let s = line;
  // 1. comment (rest-of-line wins outright)
  s = s.replace(/\/\/.*$/, m => stash(`<span style="color:#6B7280;">${m}</span>`));
  // 2. strings
  s = s.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, m => stash(`<span style="color:#FBBF24;">${m}</span>`));
  // 3. keywords
  s = s.replace(/\b(import|from|export|const|let|var|async|await|return|if|else|throw|new|try|catch|class|function)\b/g,
    m => stash(`<span style="color:#A78BFA;">${m}</span>`));
  // 4. numbers
  s = s.replace(/\b\d+\b/g, m => stash(`<span style="color:#22D3EE;">${m}</span>`));

  // Now escape whatever raw text remains, then re-insert stashed spans.
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[+i]);
  return s || '&nbsp;';
}

window.FilesPage = FilesPage;
