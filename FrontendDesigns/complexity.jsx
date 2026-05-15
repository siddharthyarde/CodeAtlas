function ComplexityPage({ navigate }) {
  const [sort, setSort] = useState('risk');
  const [expanded, setExpanded] = useState({});

  const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  // Build complexity items with synthetic scores
  const items = useMemo(() => {
    const base = MockData.files.map((f, i) => ({
      ...f,
      score: { critical: 88 + (i % 5), high: 65 + (i % 10), medium: 45 + (i % 8), low: 20 + (i % 15) }[f.risk],
      depth: 2 + (f.cc % 7),
      fns: 4 + (f.cc % 12),
    }));
    const sorted = [...base];
    if (sort === 'risk') sorted.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk] || b.score - a.score);
    if (sort === 'alpha') sorted.sort((a, b) => a.path.localeCompare(b.path));
    if (sort === 'fns') sorted.sort((a, b) => b.fns - a.fns);
    return sorted;
  }, [sort]);

  const counts = {
    critical: items.filter(i => i.risk === 'critical').length,
    high: items.filter(i => i.risk === 'high').length,
    medium: items.filter(i => i.risk === 'medium').length,
    low: items.filter(i => i.risk === 'low').length,
  };

  const chips = [
    { key: 'critical', label: 'Critical', count: counts.critical, color: '#EF4444' },
    { key: 'high',     label: 'High',     count: counts.high,     color: '#F97316' },
    { key: 'medium',   label: 'Medium',   count: counts.medium,   color: '#F59E0B' },
    { key: 'low',      label: 'Low',      count: counts.low,      color: '#22C55E' },
  ];

  return (
    <div className="fade-up">
      <PageHeader
        title="Complexity Analysis"
        subtitle="AST-accurate cyclomatic complexity across every file in this repo"
        actions={
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            style={{ padding: '8px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            <option value="risk">Highest risk</option>
            <option value="alpha">Alphabetical</option>
            <option value="fns">Most functions</option>
          </select>
        }
      />

      {/* Counter chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {chips.map(c => (
          <div key={c.key} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, borderLeft: `3px solid ${c.color}` }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, background: c.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'white', lineHeight: 1 }}>{c.count}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{c.label} risk</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        {items.map((it, i) => (
          <ComplexityCard key={it.path} item={it} index={i}
            expanded={!!expanded[it.path]}
            onToggle={() => setExpanded(e => ({ ...e, [it.path]: !e[it.path] }))}
            onView={() => navigate('files')} />
        ))}
      </div>
    </div>
  );
}

function ComplexityCard({ item, index, expanded, onToggle, onView }) {
  const colors = { critical: '#EF4444', high: '#F97316', medium: '#F59E0B', low: '#22C55E' };
  const bgs = { critical: 'rgba(239,68,68,.05)', high: 'rgba(249,115,22,.05)', medium: 'rgba(245,158,11,.05)', low: 'rgba(34,197,94,.05)' };
  const color = colors[item.risk];
  const filename = item.path.split('/').slice(-1)[0];
  const ringPct = item.score;
  const ringCirc = 2 * Math.PI * 30;

  return (
    <div className="card card-hover fade-up" style={{ padding: 16, background: bgs[item.risk], borderColor: `${color}33`, animationDelay: `${index * 0.04}s` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
        <div className="mono" style={{ fontSize: 12.5, color: 'white', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={item.path}>
          {filename}
        </div>
        <span className={`pill risk-${item.risk}`} style={{ border: '1px solid', flexShrink: 0 }}>{item.risk.toUpperCase()}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 14px' }}>
        <div style={{ position: 'relative', width: 92, height: 92 }}>
          <svg width="92" height="92" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="30" stroke="rgba(255,255,255,.06)" strokeWidth="6" fill="none" />
            <circle cx="40" cy="40" r="30" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round"
              strokeDasharray={`${(ringPct / 100) * ringCirc} ${ringCirc}`} transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dasharray .8s ease-out' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'white', textAlign: 'center', lineHeight: 1 }}>{item.score}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginTop: 2 }}>risk</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <span className="pill" style={{ background: 'rgba(255,255,255,.05)', color: '#D1D5DB' }}>CC: {item.cc}</span>
        <span className="pill" style={{ background: 'rgba(255,255,255,.05)', color: '#D1D5DB' }}>Depth: {item.depth}</span>
        <span className="pill" style={{ background: 'rgba(255,255,255,.05)', color: '#D1D5DB' }}>Fns: {item.fns}</span>
      </div>

      {expanded && (
        <div className="fade-up" style={{ marginTop: 10, padding: 12, background: 'rgba(0,0,0,.18)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
          <div><b style={{ color: 'white' }}>Cyclomatic ({item.cc})</b> — independent paths through the code. {item.cc > 15 ? 'Above the recommended threshold of 15.' : 'Within acceptable bounds.'}</div>
          <div style={{ marginTop: 8 }}><b style={{ color: 'white' }}>Max nesting depth ({item.depth})</b> — deepest level of nested control flow.</div>
          <div style={{ marginTop: 8 }}><b style={{ color: 'white' }}>Function count ({item.fns})</b> — discrete units of behavior in this file.</div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <button onClick={onToggle} style={{ background: 'transparent', border: 0, color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'inherit', padding: 0 }}>
          {expanded ? 'Hide details' : 'Show details'} <Icons.ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
        </button>
        <a href="#" onClick={(e) => { e.preventDefault(); onView(); }} style={{ color: '#C4B5FD', fontSize: 12, textDecoration: 'none' }}>View in Files →</a>
      </div>
    </div>
  );
}

window.ComplexityPage = ComplexityPage;
