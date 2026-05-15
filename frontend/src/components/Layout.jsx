import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Icons from './Icons';
import { useAuth } from '../context/AuthContext';

export function Logo({ size = 22, collapsed = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: size + 6, height: size + 6, borderRadius: 7, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'grid', placeItems: 'center', color: 'white', boxShadow: '0 0 18px rgba(124,58,237,.4)', flexShrink: 0 }}>
        <Icons.Bolt size={size - 6} />
      </div>
      {!collapsed && (
        <div className="logo-text" style={{ fontSize: size - 4, fontWeight: 700, letterSpacing: '-0.02em' }}>
          <span style={{ color: 'white' }}>CodeAtlas </span>
          <span className="grad-text">AI</span>
        </div>
      )}
    </div>
  );
}

const navItems = [
  { id: 'dashboard',    label: 'Dashboard',    path: '/dashboard',    Ic: Icons.LayoutDashboard },
  { id: 'repositories', label: 'Repositories', path: '/repositories', Ic: Icons.GitBranch },
  { id: 'graph',        label: 'Graph',        path: '/graph',        Ic: Icons.Network },
  { id: 'files',        label: 'Files',        path: '/files',        Ic: Icons.FileCode },
  { id: 'complexity',   label: 'Complexity',   path: '/complexity',   Ic: Icons.Activity },
  { id: 'docs',         label: 'API Docs',     path: '/docs',         Ic: Icons.BookOpen },
  { id: 'pr',           label: 'PR Review',    path: '/pr',           Ic: Icons.GitPullRequest },
  { id: 'team',         label: 'Team',         path: '/team',         Ic: Icons.Users },
  { id: 'usage',        label: 'Usage',        path: '/usage',        Ic: Icons.BarChart2 },
  { id: 'settings',     label: 'Settings',     path: '/settings',     Ic: Icons.Settings },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const avatar = user ? (user.name || 'U').slice(0, 2).toUpperCase() : 'U';
  const w = collapsed ? 56 : 240;

  return (
    <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: w, background: 'var(--sidebar)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 50, transition: 'width 0.2s ease' }}>
      <div style={{ padding: collapsed ? '18px 12px 14px' : '18px 18px 14px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <Logo size={20} collapsed={collapsed} />
      </div>
      <nav style={{ padding: collapsed ? 8 : 12, display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
        {navItems.map(it => {
          const active = location.pathname === it.path || location.pathname.startsWith(it.path + '/');
          return (
            <div key={it.id}
              className={`sidenav-item ${active ? 'active' : ''}`}
              title={collapsed ? it.label : undefined}
              onClick={() => navigate(it.path)}
              style={collapsed ? { justifyContent: 'center', padding: '10px' } : {}}>
              <it.Ic size={17} />
              {!collapsed && <span className="sidenav-label">{it.label}</span>}
            </div>
          );
        })}
      </nav>
      <div style={{ padding: collapsed ? 8 : 12, borderTop: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div title={collapsed ? `${user?.name} · ${user?.email}` : undefined} style={{ width: 34, height: 34, borderRadius: 999, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{avatar}</div>
        {!collapsed && (
          <>
            <div className="sidenav-user-info" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'white', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</div>
            </div>
            <button onClick={handleLogout} title="Sign out"
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 6, padding: 6, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.borderColor = 'rgba(239,68,68,.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <Icons.LogOut size={14} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

export function PageWrapper({ children }) {
  const [collapsed, setCollapsed] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: collapsed ? 56 : 240, padding: 32, minHeight: '100vh', transition: 'margin-left 0.2s ease' }}>
        {children}
      </main>
    </div>
  );
}
