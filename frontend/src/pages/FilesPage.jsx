import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { PageWrapper } from '../components/Layout';
import Icons from '../components/Icons';
import api from '../services/api';
import toast from 'react-hot-toast';

const catColors = {
  Component: '#3B82F6', Route: '#22C55E', Model: '#F59E0B',
  Service: '#A855F7', Middleware: '#EC4899', Controller: '#14B8A6',
  Utils: '#6B7280', Config: '#6B7280', other: '#6B7280',
};

const complexityColors = {
  low: '#22C55E', medium: '#F59E0B', high: '#F97316', critical: '#EF4444', unknown: '#6B7280',
};

function getLanguage(filePath) {
  const ext = filePath?.split('.').pop()?.toLowerCase();
  const map = {
    js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python', go: 'go', json: 'json', css: 'css',
    md: 'markdown', html: 'html', yaml: 'yaml', yml: 'yaml',
    sh: 'shell', env: 'shell',
  };
  return map[ext] || 'plaintext';
}

function FileTreeItem({ file, selected, onClick }) {
  const color = catColors[file.category] || '#6B7280';
  const isSelected = selected?.path === file.path;
  return (
    <div
      onClick={() => onClick(file)}
      style={{
        padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        background: isSelected ? 'rgba(124,58,237,.18)' : 'transparent',
        borderLeft: `2px solid ${isSelected ? '#7C3AED' : 'transparent'}`,
        transition: 'background .1s',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.03)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
      <Icons.FileCode size={13} style={{ color, flexShrink: 0 }} />
      <span className="mono" style={{ fontSize: 12, color: '#E5E7EB', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {file.path.split('/').pop()}
      </span>
      <span style={{ fontSize: 10, color, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>
        {file.category?.slice(0, 4)}
      </span>
      {file.lines > 0 && (
        <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{file.lines}L</span>
      )}
    </div>
  );
}

function AISkeleton() {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ height: 80, borderRadius: 8, background: 'rgba(255,255,255,.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  );
}

function AICard({ title, content, color, icon: Ic }) {
  if (!content) return null;
  return (
    <div className="card" style={{ padding: 14, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {Ic && <Ic size={12} style={{ color }} />}
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color, fontWeight: 700 }}>{title}</span>
      </div>
      <div style={{ fontSize: 13, color: '#D1D5DB', lineHeight: 1.6 }}>{content}</div>
    </div>
  );
}

function AIListCard({ title, items, color, icon: Ic }) {
  if (!items?.length) return null;
  return (
    <div className="card" style={{ padding: 14, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {Ic && <Ic size={12} style={{ color }} />}
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color, fontWeight: 700 }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#D1D5DB' }}>
            <span style={{ color, marginTop: 3, flexShrink: 0 }}>›</span>
            <span style={{ lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FilesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const repoId = searchParams.get('repo');
  const initialFile = searchParams.get('file');

  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCached, setAiCached] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [semanticQuery, setSemanticQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  // Fetch file list
  useEffect(() => {
    if (!repoId) return;
    setFilesLoading(true);
    api.get(`/repo/${repoId}/files`)
      .then(res => setFiles(res.data.data || []))
      .catch(() => toast.error('Failed to load files'))
      .finally(() => setFilesLoading(false));
  }, [repoId]);

  // Auto-open file from URL param (e.g. coming from graph node click)
  useEffect(() => {
    if (initialFile && files.length > 0) {
      const match = files.find(f => f.path === initialFile);
      if (match) loadFile(match);
    }
  }, [initialFile, files]);

  const loadFile = useCallback(async (file) => {
    setSelectedFile(file);
    setAiResult(null);
    setAiCached(false);
    setFileContent('');
    setContentLoading(true);
    try {
      const res = await api.get(`/repo/${repoId}/file`, { params: { path: file.path } });
      setFileContent(res.data.data?.content || '');
    } catch {
      setFileContent('// Unable to load file content');
    } finally {
      setContentLoading(false);
    }
  }, [repoId]);

  const explainFile = async () => {
    if (!selectedFile || !repoId) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/explain', { repoId, filePath: selectedFile.path });
      setAiResult(res.data.data?.summary);
      setAiCached(res.data.data?.cached || false);
      if (!res.data.data?.cached) toast.success('Analysis complete');
    } catch (err) {
      const msg = err.response?.data?.error || 'AI explanation failed';
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const semanticSearch = async (e) => {
    e.preventDefault();
    if (!semanticQuery.trim()) return;
    if (!repoId) { toast.error('Select a repository first'); return; }
    try {
      const res = await api.post('/ai/search', { repoId, query: semanticQuery });
      const results = res.data.data?.results || [];
      const msg = res.data.data?.message;
      if (msg) { toast(msg); return; }
      if (results.length === 0) { toast('No matching files found'); return; }
      setSearchResults(results);
      toast.success(`Found ${results.length} matching files`);
      // Jump to the best match
      const best = files.find(f => f.path === results[0].filePath);
      if (best) loadFile(best);
    } catch {
      toast.error('Search failed');
    }
  };

  const categories = ['All', ...new Set(files.map(f => f.category).filter(Boolean))];

  const filteredFiles = files.filter(f => {
    const textMatch = f.path.toLowerCase().includes(filterText.toLowerCase());
    const catMatch = catFilter === 'All' || f.category === catFilter;
    return textMatch && catMatch;
  });

  const color = selectedFile ? (catColors[selectedFile.category] || '#6B7280') : '#7C3AED';
  const complexity = aiResult?.complexity || 'unknown';

  return (
    <PageWrapper>
      <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 64px)', margin: '-32px', overflow: 'hidden' }}>

        {/* ── Left panel: file tree ── */}
        <div style={{ width: 280, minWidth: 240, borderRight: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

          {/* Search + filter bar */}
          <div style={{ padding: 12, borderBottom: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Icons.Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
              <input className="input" style={{ paddingLeft: 30, fontSize: 12 }}
                placeholder="Filter files..." value={filterText}
                onChange={e => setFilterText(e.target.value)} />
            </div>
            {/* Semantic search */}
            <form onSubmit={semanticSearch} style={{ display: 'flex', gap: 6 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Icons.Brain size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#A78BFA', pointerEvents: 'none' }} />
                <input className="input" style={{ paddingLeft: 26, fontSize: 12 }}
                  placeholder="AI semantic search…"
                  value={semanticQuery} onChange={e => setSemanticQuery(e.target.value)} />
              </div>
              <button type="submit"
                style={{ padding: '0 10px', borderRadius: 6, background: 'rgba(124,58,237,.2)', border: '1px solid rgba(124,58,237,.35)', color: '#C4B5FD', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                Go
              </button>
            </form>
            {/* Category chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {categories.map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  style={{
                    padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                    background: catFilter === c ? 'rgba(124,58,237,.3)' : 'rgba(255,255,255,.05)',
                    color: catFilter === c ? '#C4B5FD' : 'var(--text-3)',
                  }}>{c}</button>
              ))}
            </div>
          </div>

          {/* File list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!repoId ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                <Icons.FolderOpen size={28} style={{ marginBottom: 8, opacity: .5 }} />
                <div>No repository selected</div>
                <button className="btn btn-primary" style={{ marginTop: 10, fontSize: 11 }} onClick={() => navigate('/repositories')}>
                  Import Repo
                </button>
              </div>
            ) : filesLoading ? (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} style={{ height: 32, borderRadius: 6, background: 'rgba(255,255,255,.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : filteredFiles.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>No files match your filter</div>
            ) : (
              <>
                {/* Search results highlight */}
                {searchResults && (
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-soft)', background: 'rgba(124,58,237,.08)' }}>
                    <div style={{ fontSize: 10, color: '#A78BFA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                      AI Search Results
                    </div>
                    {searchResults.map((r, i) => {
                      const f = files.find(f => f.path === r.filePath);
                      if (!f) return null;
                      return (
                        <div key={i} onClick={() => loadFile(f)}
                          style={{ padding: '5px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 2, background: selectedFile?.path === f.path ? 'rgba(124,58,237,.2)' : 'rgba(255,255,255,.03)' }}>
                          <div className="mono" style={{ fontSize: 11, color: '#E5E7EB', marginBottom: 2 }}>{f.path.split('/').pop()}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.purpose}</div>
                        </div>
                      );
                    })}
                    <button onClick={() => setSearchResults(null)} style={{ marginTop: 4, fontSize: 10, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      Clear results
                    </button>
                  </div>
                )}
                <div style={{ padding: '4px 0' }}>
                  {filteredFiles.map((f, i) => (
                    <FileTreeItem key={i} file={f} selected={selectedFile} onClick={loadFile} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Stats footer */}
          {files.length > 0 && (
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border-soft)', fontSize: 11, color: 'var(--text-3)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{filteredFiles.length} / {files.length} files</span>
              {repoId && <span style={{ color: '#A78BFA', cursor: 'pointer' }} onClick={() => navigate(`/graph?repo=${repoId}`)}>View graph →</span>}
            </div>
          )}
        </div>

        {/* ── Right panel: editor + AI ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {!selectedFile ? (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-2)' }}>
                <Icons.FileCode size={52} style={{ color: 'var(--text-3)', marginBottom: 14 }} />
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No file selected</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Pick a file from the left panel to view its code and AI analysis</div>
              </div>
            </div>
          ) : (
            <>
              {/* File header */}
              <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border-soft)', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                  <Icons.FileCode size={14} style={{ color, flexShrink: 0 }} />
                  <span className="mono" style={{ fontSize: 12.5, color: 'white', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedFile.path}
                  </span>
                  <span className="pill" style={{ background: `${color}22`, color, border: `1px solid ${color}44`, flexShrink: 0 }}>
                    {selectedFile.category}
                  </span>
                  {selectedFile.lines > 0 && (
                    <span className="pill" style={{ background: 'rgba(255,255,255,.05)', color: 'var(--text-2)', flexShrink: 0 }}>
                      {selectedFile.lines}L
                    </span>
                  )}
                  {aiCached && (
                    <span className="pill" style={{ background: 'rgba(34,197,94,.15)', color: '#86EFAC', border: '1px solid rgba(34,197,94,.3)', flexShrink: 0 }}>
                      ✓ Cached
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ padding: '7px 14px', fontSize: 12, flexShrink: 0 }}
                  onClick={explainFile}
                  disabled={aiLoading}>
                  {aiLoading
                    ? <><div style={{ width: 12, height: 12, borderRadius: 999, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', animation: 'spin .7s linear infinite' }} /> Analyzing…</>
                    : <><Icons.Sparkles size={12} /> Explain with AI</>
                  }
                </button>
              </div>

              {/* Monaco editor */}
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 200 }}>
                {contentLoading ? (
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: '#0a0a16' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, border: '3px solid rgba(124,58,237,.3)', borderTopColor: '#7C3AED', animation: 'spin .7s linear infinite' }} />
                  </div>
                ) : (
                  <Editor
                    height="100%"
                    language={getLanguage(selectedFile.path)}
                    value={fileContent}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: true },
                      fontSize: 13,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      wordWrap: 'off',
                      smoothScrolling: true,
                      cursorBlinking: 'smooth',
                      renderLineHighlight: 'line',
                      padding: { top: 12 },
                    }}
                  />
                )}
              </div>

              {/* AI Analysis panel */}
              {(aiLoading || aiResult) && (
                <div style={{ borderTop: '1px solid var(--border-soft)', background: 'var(--card)', maxHeight: '45%', overflowY: 'auto', flexShrink: 0 }}>
                  {/* Panel header */}
                  <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icons.Sparkles size={13} style={{ color: '#A78BFA' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>AI Analysis</span>
                      {aiResult && (
                        <span className="pill" style={{ background: `${complexityColors[complexity]}22`, color: complexityColors[complexity], border: `1px solid ${complexityColors[complexity]}44`, fontSize: 10 }}>
                          {complexity} complexity
                        </span>
                      )}
                    </div>
                    <button onClick={() => { setAiResult(null); setAiCached(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                  </div>

                  {aiLoading ? (
                    <AISkeleton />
                  ) : aiResult && (
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* 2-col row: Purpose + Architecture Role */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <AICard title="Purpose" content={aiResult.purpose} color="#A78BFA" icon={Icons.Sparkles} />
                        <AICard title="Architecture Role" content={aiResult.architectureRole} color="#60A5FA" icon={Icons.Network} />
                      </div>
                      {/* Key responsibilities */}
                      <AIListCard title="Key Responsibilities" items={aiResult.keyResponsibilities} color="#34D399" icon={Icons.CheckCircle} />
                      {/* 2-col: Issues + Tips */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <AIListCard title="Potential Issues" items={aiResult.potentialIssues} color="#F97316" icon={Icons.AlertTriangle} />
                        <AIListCard title="Optimization Tips" items={aiResult.optimizationTips} color="#22C55E" icon={Icons.Zap} />
                      </div>
                      {/* Dependencies */}
                      {aiResult.dependencies?.length > 0 && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,.03)', border: '1px solid var(--border-soft)' }}>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 8 }}>Dependencies</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {aiResult.dependencies.map((d, i) => (
                              <span key={i} className="pill mono" style={{ fontSize: 11, background: 'rgba(255,255,255,.06)', color: '#D1D5DB' }}>{d}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
