function Logo({ size = 22 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: size + 6, height: size + 6, borderRadius: 7, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'grid', placeItems: 'center', color: 'white', boxShadow: '0 0 18px rgba(124,58,237,.4)' }}>
        <Icons.Bolt size={size - 6} />
      </div>
      <div style={{ fontSize: size - 4, fontWeight: 700, letterSpacing: '-0.02em' }}>
        <span style={{ color: 'white' }}>CodeAtlas </span>
        <span className="grad-text">AI</span>
      </div>
    </div>
  );
}

function Sidebar({ route, navigate, onLogout }) {
  const items = [
    { id: 'dashboard',    label: 'Dashboard',    Ic: Icons.LayoutDashboard },
    { id: 'repositories', label: 'Repositories', Ic: Icons.GitBranch },
    { id: 'graph',        label: 'Graph',        Ic: Icons.Network },
    { id: 'files',        label: 'Files',        Ic: Icons.FileCode },
    { id: 'complexity',   label: 'Complexity',   Ic: Icons.Activity },
    { id: 'docs',         label: 'API Docs',     Ic: Icons.BookOpen },
    { id: 'pr',           label: 'PR Review',    Ic: Icons.GitPullRequest },
    { id: 'team',         label: 'Team',         Ic: Icons.Users },
    { id: 'usage',        label: 'Usage',        Ic: Icons.BarChart2 },
    { id: 'settings',     label: 'Settings',     Ic: Icons.Settings },
  ];
  const u = MockData.user;
  return (
    <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 240, background: 'var(--sidebar)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--border-soft)' }}>
        <Logo size={20} />
      </div>
      <nav style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
        {items.map(it => (
          <div key={it.id}
               className={`sidenav-item ${route === it.id ? 'active' : ''}`}
               onClick={() => navigate(it.id)}>
            <it.Ic size={17} />
            <span>{it.label}</span>
          </div>
        ))}
      </nav>
      <div style={{ padding: 12, borderTop: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 13 }}>{u.avatar}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'white', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
        </div>
        <button onClick={onLogout} title="Sign out"
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 6, padding: 6, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.borderColor = 'rgba(239,68,68,.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
          <Icons.LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}

function PageWrapper({ children, route, navigate, onLogout }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar route={route} navigate={navigate} onLogout={onLogout} />
      <main data-screen-label={route} style={{ marginLeft: 240, padding: 32, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}

Object.assign(window, { Logo, Sidebar, PageWrapper });
