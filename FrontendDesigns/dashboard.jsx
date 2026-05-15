function Dashboard({ navigate, toast }) {
  const u = MockData.user;
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }, []);

  const stats = [
    { Ic: Icons.GitBranch, color: '#3B82F6', value: 12, label: 'Total Repositories' },
    { Ic: Icons.FileCode, color: '#A855F7', value: 4892, label: 'Files Analyzed' },
    { Ic: Icons.Brain, color: '#22C55E', value: 38, label: 'AI Calls This Month' },
    { Ic: Icons.CheckCircle, color: '#14B8A6', value: 9, label: 'Repos Complete' },
  ];
  const [counts, setCounts] = useState(stats.map(() => 0));
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 900);
      const e = 1 - Math.pow(1 - p, 3);
      setCounts(stats.map(s => Math.round(s.value * e)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const aiUsed = 38, aiCap = 50;
  const pct = (aiUsed / aiCap) * 100;
  const usageColor = pct > 95 ? '#EF4444' : pct > 80 ? '#F97316' : '#7C3AED';

  const quickActions = [
    { Ic: Icons.GitBranch, label: 'Import Repository', to: 'repositories' },
    { Ic: Icons.Brain,     label: 'Run AI Analysis',  to: 'files' },
    { Ic: Icons.Activity,  label: 'View Complexity',  to: 'complexity' },
    { Ic: Icons.BookOpen,  label: 'Generate API Docs', to: 'docs' },
  ];

  return (
    <div className="fade-up">
      <PageHeader
        title={`${greeting}, ${u.name.split(' ')[0]}`}
        subtitle="Here's what's happening across your codebases"
        actions={<button className="btn btn-primary" onClick={() => navigate('repositories')}><Icons.Plus size={14} /> Import Repository</button>}
      />

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 }}>
        {stats.map((s, i) => (
          <StatCard key={i} icon={s.Ic} color={s.color} value={counts[i].toLocaleString()} label={s.label} />
        ))}
      </div>

      {/* AI Usage Bar */}
      <div className="card" style={{ padding: 18, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 14, color: 'white', fontWeight: 600 }}>AI Usage — {aiUsed} / {aiCap} calls this month</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Resets in 14 days · Free plan</div>
          </div>
          {pct > 80 && <a href="#" onClick={(e)=>{e.preventDefault(); navigate('usage');}} style={{ color: '#C4B5FD', fontSize: 13 }}>Upgrade to Pro →</a>}
        </div>
        <div style={{ height: 8, background: 'rgba(124,58,237,.10)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: usageColor, borderRadius: 999, transition: 'width 600ms ease-out' }} />
        </div>
      </div>

      {/* 2-column main */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.85fr) minmax(0, 1fr)', gap: 18, alignItems: 'flex-start' }}>
        {/* Recent Repos */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recent Repositories</h3>
            <a href="#" onClick={(e)=>{e.preventDefault(); navigate('repositories');}} style={{ color: '#C4B5FD', fontSize: 13 }}>View all</a>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(124,58,237,.04)' }}>
                {['Name', 'Status', 'Files', 'Analyzed', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '10px 20px', color: 'var(--text-3)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MockData.repos.slice(0, 5).map((r, i) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icons.Github size={14} style={{ color: 'var(--text-2)' }} />
                      <span className="mono" style={{ color: 'white', fontWeight: 600, fontSize: 12.5 }}>{r.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px' }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-2)' }}>{r.files ? r.files.toLocaleString() : '—'}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-3)', fontSize: 12 }}>{r.imported}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button title="Graph" onClick={() => navigate('graph')} className="icon-btn" style={iconBtnStyle}><Icons.Network size={14} /></button>
                      <button title="Files" onClick={() => navigate('files')} className="icon-btn" style={iconBtnStyle}><Icons.FileCode size={14} /></button>
                      <button title="Delete" onClick={() => toast('Repository removed', 'success')} className="icon-btn" style={iconBtnStyle}><Icons.Trash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Insights + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icons.Brain size={15} style={{ color: '#A78BFA' }} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Recent AI Insights</h3>
            </div>
            <div>
              {MockData.insights.map((it, i) => (
                <div key={i} style={{ padding: '12px 18px', borderTop: i ? '1px solid var(--border-soft)' : 0 }}>
                  <div className="mono" style={{ fontSize: 12, color: '#E5E7EB', marginBottom: 4 }}>{it.file}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{it.purpose}</div>
                </div>
              ))}
              <a href="#" onClick={(e)=>{e.preventDefault(); navigate('files');}} style={{ display: 'block', padding: '12px 18px', borderTop: '1px solid var(--border-soft)', color: '#C4B5FD', fontSize: 13, textAlign: 'center', textDecoration: 'none' }}>View all →</a>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => navigate(a.to)} className="card card-hover" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10, color: 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--purple-soft)', display: 'grid', placeItems: 'center', color: '#C4B5FD' }}>
                  <a.Ic size={15} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle = {
  width: 28, height: 28, borderRadius: 6, background: 'transparent', border: '1px solid var(--border)',
  color: 'var(--text-2)', display: 'grid', placeItems: 'center', cursor: 'pointer',
};

window.Dashboard = Dashboard;
