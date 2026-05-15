function DocsPage({ navigate, toast }) {
  const [filter, setFilter] = useState('');
  const [copied, setCopied] = useState(null);
  const scrollRef = useRef(null);

  const filtered = useMemo(() =>
    MockData.routes.map(g => ({
      ...g,
      endpoints: g.endpoints.filter(e => (e.path + ' ' + e.desc).toLowerCase().includes(filter.toLowerCase())),
    })).filter(g => g.endpoints.length),
    [filter]);

  const totalEndpoints = MockData.routes.reduce((s, g) => s + g.endpoints.length, 0);

  const copyCurl = (ep) => {
    const curl = `curl -X ${ep.method} https://api.codeatlas.ai${ep.path}`;
    navigator.clipboard?.writeText(curl);
    setCopied(ep.path);
    toast('Copied to clipboard', 'success');
    setTimeout(() => setCopied(null), 1500);
  };

  const scrollTo = (gid) => {
    const el = scrollRef.current?.querySelector(`#group-${gid}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div data-screen-label="09 API Docs" style={{ position: 'fixed', left: 240, right: 0, top: 0, bottom: 0, display: 'flex', background: 'var(--bg)' }}>
      {/* Left sidebar */}
      <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--border-soft)', background: 'var(--card)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 18, borderBottom: '1px solid var(--border-soft)' }}>
          <button onClick={() => navigate('repositories')} style={{ background: 'transparent', border: 0, color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icons.ChevronLeft size={12} /> Back
          </button>
          <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>API Documentation</h2>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14 }}>{totalEndpoints} endpoints in this repo</div>
          <div style={{ position: 'relative' }}>
            <Icons.Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ padding: '8px 10px 8px 30px', fontSize: 13 }}
              placeholder="Filter endpoints..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
          {MockData.routes.map(g => (
            <button key={g.group} onClick={() => scrollTo(g.group)}
              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 0, color: 'var(--text-2)', cursor: 'pointer', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit', marginBottom: 2 }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(124,58,237,.06)'; e.currentTarget.style.color='white';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-2)';}}>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>/{g.group}</span>
              <span className="pill" style={{ background: 'rgba(255,255,255,.05)', color: 'var(--text-3)', fontSize: 10 }}>{g.endpoints.length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon={Icons.BookOpen} title="No API routes match your filter" />
        ) : filtered.map(g => (
          <section key={g.group} id={`group-${g.group}`} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 6 }}>
              <h2 className="mono" style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'white' }}>/{g.group}</h2>
              <span style={{ color: 'var(--text-3)', fontSize: 13 }}>{g.endpoints.length} endpoint{g.endpoints.length !== 1 ? 's' : ''}</span>
            </div>
            <hr className="divider" style={{ marginBottom: 18 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {g.endpoints.map(ep => (
                <div key={ep.method + ep.path} className="card card-hover" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className={`pill http-${ep.method}`} style={{ minWidth: 56, justifyContent: 'center', padding: '4px 10px', fontWeight: 700 }}>{ep.method}</span>
                    <span className="mono" style={{ fontSize: 14, color: 'white', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ep.path}</span>
                    <button onClick={() => copyCurl(ep)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {copied === ep.path ? <><Icons.Check size={12} /> Copied</> : <><Icons.Copy size={12} /> Copy curl</>}
                    </button>
                  </div>
                  <div style={{ fontSize: 13.5, color: '#D1D5DB', marginBottom: 10 }}>{ep.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{ep.src}</span>
                    {ep.mw.length > 0 && (
                      <>
                        <span style={{ color: 'var(--text-3)', fontSize: 12 }}>·</span>
                        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>middleware:</span>
                        {ep.mw.map(m => <span key={m} className="pill" style={{ background: 'rgba(255,255,255,.04)', color: '#D1D5DB', fontSize: 10 }}>{m}</span>)}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

window.DocsPage = DocsPage;
