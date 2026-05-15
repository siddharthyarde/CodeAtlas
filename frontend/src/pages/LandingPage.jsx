import { useNavigate } from 'react-router-dom';
import Icons from '../components/Icons';
import { Logo } from '../components/Layout';

function HeroGraphPreview() {
  const nodes = [
    { x: 60,  y: 130, label: 'App.jsx',          color: '#3B82F6' },
    { x: 240, y: 70,  label: 'Router.jsx',        color: '#3B82F6' },
    { x: 240, y: 200, label: 'HomePage.jsx',       color: '#3B82F6' },
    { x: 440, y: 70,  label: 'auth.controller',   color: '#14B8A6' },
    { x: 440, y: 200, label: 'aiAnalyzer.js',     color: '#A855F7' },
    { x: 640, y: 70,  label: 'auth.routes',       color: '#22C55E' },
    { x: 640, y: 200, label: 'User.js',           color: '#F59E0B' },
    { x: 820, y: 130, label: 'jwt.util.js',       color: '#6B7280' },
  ];
  const edges = [[0,1],[0,2],[1,3],[2,4],[3,5],[3,6],[5,7],[4,7]];
  return (
    <svg viewBox="0 0 900 320" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#7C3AED" opacity=".7" />
        </marker>
      </defs>
      {edges.map(([a,b], i) => (
        <line key={i} x1={nodes[a].x + 70} y1={nodes[a].y + 18} x2={nodes[b].x} y2={nodes[b].y + 18}
          stroke="#7C3AED" strokeOpacity=".55" strokeWidth="1.5" className="edge-dash" markerEnd="url(#arr)" />
      ))}
      {nodes.map((n, i) => (
        <g key={i} transform={`translate(${n.x}, ${n.y})`}>
          <rect width="140" height="36" rx="8" fill="#0F0F1A" stroke={n.color} strokeOpacity=".7" />
          <rect width="3" height="36" fill={n.color} />
          <text x="14" y="22" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#F9FAFB">{n.label}</text>
        </g>
      ))}
    </svg>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    { Ic: Icons.Network,       color: '#3B82F6', title: 'Dependency Graph',   desc: 'Interactive React Flow graph showing every import and export relationship across your repo.' },
    { Ic: Icons.Brain,         color: '#A855F7', title: 'AI Explanations',    desc: "Claude AI explains every file's purpose, role, and improvement opportunities in plain English." },
    { Ic: Icons.Activity,      color: '#F97316', title: 'Complexity Analysis', desc: 'AST-accurate cyclomatic complexity with risk scoring and visual heatmaps across your code.' },
    { Ic: Icons.BookOpen,      color: '#22C55E', title: 'Auto API Docs',       desc: 'Extract every Express route and generate Swagger-style documentation automatically.' },
    { Ic: Icons.GitPullRequest,color: '#EC4899', title: 'PR Code Review',      desc: 'Paste a GitHub PR URL and get an AI-powered code review with security and bug analysis.' },
    { Ic: Icons.Search,        color: '#06B6D4', title: 'Semantic Search',     desc: 'Search your codebase in plain English using vector embeddings — find what you mean.' },
  ];
  const steps = [
    { Ic: Icons.Upload, title: 'Paste GitHub URL',    desc: 'Paste any public GitHub repository URL into CodeAtlas AI.' },
    { Ic: Icons.Cpu,    title: 'AI Analyzes',         desc: 'We clone, parse ASTs, build the graph, and run Claude on every file.' },
    { Ic: Icons.Eye,    title: 'Explore & Understand',desc: 'Navigate the graph, read AI explanations, find complexity hotspots.' },
  ];

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(7,7,20,0.78)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo size={20} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <a href="#features" style={{ color: 'var(--text-2)', fontSize: 14, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>Features</a>
            <a href="#how" style={{ color: 'var(--text-2)', fontSize: 14, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>How It Works</a>
            <button className="btn btn-ghost" onClick={() => navigate('/login')}>Log In</button>
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>Get Started <Icons.ArrowRight size={14} /></button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', padding: '110px 24px 80px', overflow: 'hidden' }}>
        <div className="hero-grid" style={{ position: 'absolute', inset: 0, opacity: .35 }} />
        <div className="purple-radial" style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', width: 800, height: 400, opacity: .5 }} />
        <div style={{ position: 'relative', maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
          <span className="pill" style={{ background: 'rgba(124,58,237,.15)', color: '#C4B5FD', border: '1px solid rgba(124,58,237,.3)', textTransform: 'uppercase', padding: '5px 14px', fontSize: 11 }}>
            <Icons.Sparkles size={12} /> AI-Powered Codebase Intelligence
          </span>
          <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.035em', margin: '22px 0 18px', color: 'white' }}>
            Understand <span className="grad-text">Any Codebase</span><br/> in Minutes
          </h1>
          <p style={{ fontSize: 20, color: 'var(--text-2)', maxWidth: 660, margin: '0 auto 32px', lineHeight: 1.55 }}>
            Paste a GitHub URL. CodeAtlas AI clones it, maps every dependency, explains every file, and surfaces hidden complexity — instantly.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            <button className="btn btn-primary" style={{ padding: '14px 22px', fontSize: 15 }} onClick={() => navigate('/signup')}>
              Get Started Free <Icons.ArrowRight size={16} />
            </button>
            <button className="btn btn-ghost" style={{ padding: '14px 22px', fontSize: 15 }}>
              <Icons.Play size={14} /> Watch Demo
            </button>
          </div>
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', color: 'var(--text-3)', fontSize: 13, flexWrap: 'wrap' }}>
            <span>Works with any GitHub repo</span>
            <span>·</span>
            <span>Free to start</span>
            <span>·</span>
            <span>No setup required</span>
          </div>
        </div>

        {/* Floating mock graph preview */}
        <div style={{ position: 'relative', maxWidth: 1040, margin: '70px auto 0', padding: '0 24px' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 30px 80px rgba(124,58,237,.18), 0 0 0 1px rgba(124,58,237,.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border-soft)', background: '#0c0c1a' }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: '#EF4444' }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: '#F59E0B' }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: '#22C55E' }} />
              <span className="mono" style={{ marginLeft: 16, color: 'var(--text-3)', fontSize: 12 }}>codeatlas.ai/graph/shopify-polaris</span>
            </div>
            <div style={{ position: 'relative', height: 320, background: 'radial-gradient(ellipse at center, #0e0d22 0%, #070714 70%)', backgroundImage: 'radial-gradient(rgba(124,58,237,.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
              <HeroGraphPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '90px 24px', maxWidth: 1160, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 14px' }}>
          Everything you need to <span className="grad-text">understand code</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 17, margin: '0 0 56px' }}>Six tools, one workspace. From first clone to deep code review.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
          {features.map((f, i) => (
            <div key={i} className="card card-hover fade-up" style={{ padding: 24, animationDelay: `${i * 0.05}s` }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: `${f.color}22`, color: f.color, display: 'grid', placeItems: 'center', marginBottom: 16 }}>
                <f.Ic size={20} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600, color: 'white' }}>{f.title}</h3>
              <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: '60px 24px 100px', maxWidth: 1160, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 56px' }}>
          How it works
        </h2>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: '1 1 240px', maxWidth: 280, textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: 999, background: 'linear-gradient(135deg, rgba(124,58,237,.3), rgba(79,70,229,.2))', border: '1px solid rgba(124,58,237,.4)', display: 'grid', placeItems: 'center', color: '#C4B5FD', margin: '0 auto 18px' }}>
                  <s.Ic size={28} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Step {i + 1}</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: 'white' }}>{s.title}</h3>
                <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div style={{ display: 'grid', placeItems: 'center', height: 72, color: 'var(--text-3)', marginTop: 0 }}>
                  <Icons.ArrowRight size={20} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '64px 40px', borderRadius: 20, background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: .25, backgroundImage: 'radial-gradient(rgba(255,255,255,.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: 'white', margin: '0 0 12px', letterSpacing: '-0.025em' }}>Start Understanding Code Today</h2>
            <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 17, margin: '0 0 28px' }}>Free to start · No setup required · Works with any GitHub repo</p>
            <button onClick={() => navigate('/signup')}
              style={{ padding: '14px 28px', borderRadius: 10, background: 'white', color: '#5B21B6', fontWeight: 700, fontSize: 15, border: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Start for Free <Icons.ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-soft)', padding: '24px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <Logo size={18} />
          <span style={{ color: 'var(--text-3)', fontSize: 13 }}>© 2025 CodeAtlas AI · All rights reserved</span>
          <div style={{ display: 'flex', gap: 12, color: 'var(--text-2)' }}>
            <a href="#" style={{ color: 'inherit' }}><Icons.Github size={18} /></a>
            <a href="#" style={{ color: 'inherit' }}><Icons.Twitter size={18} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
