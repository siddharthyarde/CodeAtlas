function UsagePage({ navigate }) {
  const data = MockData.usage30;
  const max = Math.max(...data);
  const total = data.reduce((s, n) => s + n, 0);
  const aiUsed = 38, aiCap = 50;
  const pct = (aiUsed / aiCap) * 100;

  const topRepos = [
    { name: 'shopify/polaris-react', calls: 142 },
    { name: 'vercel/next.js', calls: 98 },
    { name: 'mongodb/mongoose', calls: 73 },
    { name: 'prisma/prisma', calls: 51 },
    { name: 'expressjs/express', calls: 22 },
  ];
  const maxCalls = topRepos[0].calls;

  return (
    <div className="fade-up">
      <PageHeader title="Usage" subtitle="Track your AI calls, files analyzed, and plan limits" />

      {/* Plan card */}
      <div className="card" style={{ padding: 22, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span className="pill" style={{ background: 'rgba(107,114,128,.18)', color: '#D1D5DB', marginBottom: 8 }}>Free Plan</span>
          <h3 style={{ margin: '8px 0 4px', fontSize: 17, fontWeight: 600 }}>You're on the free tier</h3>
          <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 13 }}>50 AI calls per month · 3 repositories · single user</p>
        </div>
        <button className="btn btn-primary"><Icons.Zap size={14} /> Upgrade to Pro</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(168,85,247,.18)', color: '#C4B5FD', display: 'grid', placeItems: 'center' }}><Icons.Brain size={16} /></div>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>AI Calls This Month</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: 8 }}>{aiUsed} <span style={{ color: 'var(--text-3)', fontSize: 16, fontWeight: 500 }}>/ {aiCap}</span></div>
          <div style={{ height: 6, background: 'rgba(124,58,237,.10)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #7C3AED, #4F46E5)', borderRadius: 999 }} />
          </div>
        </div>
        <StatCard icon={Icons.FileCode} color="#3B82F6" value="4,892" label="Files Analyzed" accent="+312 this week" />
        <StatCard icon={Icons.GitBranch} color="#22C55E" value="12" label="Repositories" />
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>AI Calls — Last 30 Days</h3>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4 }}>{total} total calls · daily breakdown</div>
          </div>
          <span style={{ fontSize: 12, color: '#86EFAC', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icons.TrendingUp size={12} /> +47% vs last 30 days
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 180, padding: '0 4px' }}>
          {data.map((v, i) => (
            <div key={i} title={`Day ${i + 1}: ${v} calls`} style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{
                height: `${(v / max) * 100}%`,
                background: 'linear-gradient(180deg, #A78BFA 0%, #7C3AED 100%)',
                borderRadius: '4px 4px 0 0',
                minHeight: 2,
                transition: 'opacity .15s',
              }} onMouseEnter={e => e.currentTarget.style.opacity = 0.7} onMouseLeave={e => e.currentTarget.style.opacity = 1} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-3)' }}>
          <span>30 days ago</span><span>15 days ago</span><span>Today</span>
        </div>
      </div>

      {/* Top repos */}
      <div className="card" style={{ padding: 0, marginBottom: 18 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Top Repos by Usage</h3>
        </div>
        {topRepos.map((r, i) => (
          <div key={i} style={{ padding: '14px 20px', borderTop: i ? '1px solid var(--border-soft)' : 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr 60px', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <Icons.Github size={14} style={{ color: 'var(--text-2)' }} />
              <span className="mono" style={{ fontSize: 13, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(124,58,237,.10)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${(r.calls / maxCalls) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #7C3AED, #4F46E5)' }} />
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, color: '#D1D5DB', fontWeight: 600 }}>{r.calls}</div>
          </div>
        ))}
      </div>

      {/* Upgrade CTA */}
      <div style={{ padding: 32, borderRadius: 16, background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: .2, backgroundImage: 'radial-gradient(rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div style={{ position: 'relative' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: 'white' }}>Upgrade to Pro</h3>
          <p style={{ margin: '0 0 18px', color: 'rgba(255,255,255,.85)', fontSize: 14 }}>Unlimited AI calls · Team features · Priority support · $29/month</p>
          <button style={{ padding: '11px 24px', borderRadius: 8, background: 'white', color: '#5B21B6', border: 0, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Upgrade Now</button>
        </div>
      </div>
    </div>
  );
}

window.UsagePage = UsagePage;
