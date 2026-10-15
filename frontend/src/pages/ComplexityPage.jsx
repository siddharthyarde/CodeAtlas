import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageWrapper } from '../components/Layout';
import { PageHeader } from '../components/Shared';
import Icons from '../components/Icons';
import api from '../services/api';

function RepoSelector() {
  const navigate = useNavigate();
  const [repos, setRepos] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/repo').then(res => {
      const d = res.data.data;
      setRepos(Array.isArray(d) ? d : (d?.repos || []));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="card fade-up" style={{ padding: 32, textAlign: 'center', maxWidth: 480, margin: '60px auto' }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(124,58,237,.12)', color: '#A78BFA', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
        <Icons.Activity size={26} />
      </div>
      <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>Select a Repository</h3>
      <p style={{ margin: '0 0 22px', color: 'var(--text-2)', fontSize: 13.5 }}>Choose which repository to run complexity analysis on.</p>
      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading repositories…</div>
      ) : repos.length === 0 ? (
        <div style={{ color: 'var(--text-3)', fontSize: 13 }}>
          No repositories yet. <a href="/repositories" style={{ color: '#A78BFA' }}>Import one first →</a>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            style={{ flex: 1, padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: selected ? 'white' : 'var(--text-3)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value="">Choose a repository…</option>
            {repos.map(r => (
              <option key={r._id} value={r._id}>{r.name || r.url?.split('/').slice(-1)[0]}{r.status !== 'complete' ? ` (${r.status})` : ''}</option>
            ))}
          </select>
          <button className="btn btn-primary" disabled={!selected} onClick={() => navigate(`/complexity?repo=${selected}`)}>
            Analyze
          </button>
        </div>
      )}
    </div>
  );
}

const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
const riskColors = { critical: '#EF4444', high: '#F97316', medium: '#F59E0B', low: '#22C55E' };
const riskBgs = { critical: 'rgba(239,68,68,.05)', high: 'rgba(249,115,22,.05)', medium: 'rgba(245,158,11,.05)', low: 'rgba(34,197,94,.05)' };

function ComplexityCard({ item, index, expanded, onToggle, onView }) {
  const color = riskColors[item.risk] || '#6B7280';
  const filename = (item.path || item.filePath || '').split('/').slice(-1)[0];
  const ringPct = item.score || item.riskScore || 20;
  const ringCirc = 2 * Math.PI * 30;

  return (
    <div className="card card-hover fade-up" style={{ padding: 16, background: riskBgs[item.risk], borderColor: `${color}33`, animationDelay: `${index * 0.04}s` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
        <div className="mono" style={{ fontSize: 12.5, color: 'white', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={item.path || item.filePath}>
          {filename}
        </div>
        <span className={`pill risk-${item.risk}`} style={{ border: '1px solid', flexShrink: 0 }}>{(item.risk || 'low').toUpperCase()}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 14px' }}>
        <div style={{ position: 'relative', width: 92, height: 92 }}>
          <svg width="92" height="92" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="30" stroke="rgba(255,255,255,.06)" strokeWidth="6" fill="none" />
            <circle cx="40" cy="40" r="30" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round"
              strokeDasharray={`${(Math.min(ringPct, 100) / 100) * ringCirc} ${ringCirc}`} transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dasharray .8s ease-out' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'white', textAlign: 'center', lineHeight: 1 }}>{Math.round(ringPct)}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginTop: 2 }}>risk</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <span className="pill" style={{ background: 'rgba(255,255,255,.05)', color: '#D1D5DB' }}>CC: {item.cyclomaticComplexity || item.cc || 0}</span>
        <span className="pill" style={{ background: 'rgba(255,255,255,.05)', color: '#D1D5DB' }}>Depth: {item.maxNestingDepth || item.depth || 0}</span>
        <span className="pill" style={{ background: 'rgba(255,255,255,.05)', color: '#D1D5DB' }}>Fns: {item.functionCount || item.fns || 0}</span>
      </div>

      {expanded && (
        <div className="fade-up" style={{ marginTop: 10, padding: 12, background: 'rgba(0,0,0,.18)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
          <div><b style={{ color: 'white' }}>Cyclomatic ({item.cyclomaticComplexity || item.cc || 0})</b> — independent paths through the code. {(item.cyclomaticComplexity || item.cc || 0) > 15 ? 'Above the recommended threshold of 15.' : 'Within acceptable bounds.'}</div>
          <div style={{ marginTop: 8 }}><b style={{ color: 'white' }}>Max nesting depth ({item.maxNestingDepth || item.depth || 0})</b> — deepest level of nested control flow.</div>
          <div style={{ marginTop: 8 }}><b style={{ color: 'white' }}>Function count ({item.functionCount || item.fns || 0})</b> — discrete units of behavior in this file.</div>
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

export default function ComplexityPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const repoId = searchParams.get('repo');
  const [sort, setSort] = useState('risk');
  const [expanded, setExpanded] = useState({});
  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repoId) { setLoading(false); return; }
    api.get(`/repo/${repoId}/complexity`).then(res => {
      setRawItems(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [repoId]);

  const items = useMemo(() => {
    const sorted = [...rawItems];
    if (sort === 'risk') sorted.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk] || (b.riskScore || 0) - (a.riskScore || 0));
    if (sort === 'alpha') sorted.sort((a, b) => (a.path || a.filePath || '').localeCompare(b.path || b.filePath || ''));
    if (sort === 'fns') sorted.sort((a, b) => (b.functionCount || 0) - (a.functionCount || 0));
    return sorted;
  }, [sort, rawItems]);

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

  if (!repoId) {
    return (
      <PageWrapper>
        <RepoSelector />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-2)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, border: '3px solid rgba(124,58,237,.3)', borderTopColor: '#7C3AED', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
            Analyzing complexity...
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-2)' }}>
            {repoId ? 'No complexity data yet — make sure the repository has been fully processed.' : ''}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {items.map((it, i) => (
              <ComplexityCard key={it.path || it.filePath || i} item={it} index={i}
                expanded={!!expanded[it.path || it.filePath]}
                onToggle={() => setExpanded(e => ({ ...e, [it.path || it.filePath]: !e[it.path || it.filePath] }))}
                onView={() => navigate(`/files?repo=${repoId}&file=${encodeURIComponent(it.path || it.filePath)}`)} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
