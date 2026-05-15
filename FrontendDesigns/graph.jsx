function GraphPage({ navigate, toast }) {
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  const cats = ['All', 'Component', 'Route', 'Model', 'Service', 'Controller', 'Middleware', 'Utils'];

  const filteredNodes = useMemo(() =>
    filter === 'All' ? MockData.graphNodes : MockData.graphNodes.filter(n => n.type === filter),
    [filter]);
  const visibleIds = new Set(filteredNodes.map(n => n.id));

  const onMouseDown = (e) => {
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const onMouseUp = () => { dragRef.current = null; };
  const onWheel = (e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(2, z + (e.deltaY < 0 ? 0.08 : -0.08))));
  };

  const fitView = () => { setZoom(0.85); setPan({ x: 0, y: 0 }); };

  return (
    <div data-screen-label="06 Graph" style={{ position: 'fixed', left: 240, right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Toolbar */}
      <div style={{ height: 48, borderBottom: '1px solid var(--border-soft)', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button onClick={() => navigate('repositories')} style={{ ...iconBtnStyle, width: 30, height: 30 }}><Icons.ChevronLeft size={14} /></button>
          <Icons.Github size={15} style={{ color: 'var(--text-2)' }} />
          <span className="mono" style={{ fontSize: 13, color: 'white', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>shopify/polaris-react</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>· {filteredNodes.length} nodes · {MockData.graphEdges.length} edges</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              style={{
                padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                border: '1px solid ' + (filter === c ? 'transparent' : 'var(--border)'),
                background: filter === c ? 'var(--purple-soft)' : 'transparent',
                color: filter === c ? 'white' : 'var(--text-2)',
                whiteSpace: 'nowrap',
              }}>{c}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={fitView}><Icons.Maximize size={12} /> Fit</button>
          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => toast('PNG export started', 'success')}><Icons.Download size={12} /> Export</button>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: dragRef.current ? 'grabbing' : 'grab',
                    backgroundImage: 'radial-gradient(rgba(124,58,237,.12) 1px, transparent 1px)', backgroundSize: '24px 24px', backgroundColor: 'var(--bg)' }}
           onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}>
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', transition: dragRef.current ? 'none' : 'transform .15s' }}>
          <svg width="1300" height="500" style={{ overflow: 'visible', position: 'absolute', pointerEvents: 'none' }}>
            <defs>
              <marker id="gArrow" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
                <path d="M0,0 L0,8 L8,4 z" fill="#7C3AED" opacity=".7" />
              </marker>
            </defs>
            {MockData.graphEdges.map(([a, b], i) => {
              if (!visibleIds.has(a) || !visibleIds.has(b)) return null;
              const na = MockData.graphNodes.find(n => n.id === a);
              const nb = MockData.graphNodes.find(n => n.id === b);
              const isSel = selected && (selected === a || selected === b);
              return (
                <line key={i} x1={na.x + 180} y1={na.y + 30} x2={nb.x} y2={nb.y + 30}
                  stroke={isSel ? '#A78BFA' : '#7C3AED'} strokeOpacity={isSel ? .9 : .45} strokeWidth={isSel ? 2 : 1.5}
                  className="edge-dash" markerEnd="url(#gArrow)" />
              );
            })}
          </svg>
          {filteredNodes.map(n => (
            <GraphNode key={n.id} node={n} selected={selected === n.id} onClick={() => setSelected(n.id)} />
          ))}
        </div>

        {/* Zoom controls (bottom-left) */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} style={zoomBtnStyle}><Icons.Plus size={14} /></button>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} style={zoomBtnStyle}><span style={{ display: 'block', width: 14, height: 2, background: 'currentColor' }} /></button>
          <button onClick={fitView} style={zoomBtnStyle}><Icons.Maximize size={12} /></button>
          <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', padding: '4px 0' }}>{Math.round(zoom * 100)}%</div>
        </div>

        {/* MiniMap */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, width: 180, height: 110, background: 'rgba(15,15,26,.92)', border: '1px solid var(--border)', borderRadius: 8, padding: 6 }}>
          <svg viewBox="0 0 1300 460" style={{ width: '100%', height: '100%' }}>
            {MockData.graphEdges.map(([a, b], i) => {
              const na = MockData.graphNodes.find(n => n.id === a);
              const nb = MockData.graphNodes.find(n => n.id === b);
              return <line key={i} x1={na.x + 90} y1={na.y + 30} x2={nb.x} y2={nb.y + 30} stroke="#3a2c75" strokeWidth="2" />;
            })}
            {MockData.graphNodes.map(n => (
              <rect key={n.id} x={n.x} y={n.y + 15} width="180" height="30" fill={MockData.nodeColors[n.type]} opacity=".7" rx="4" />
            ))}
          </svg>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && <NodeDetailPanel node={MockData.graphNodes.find(n => n.id === selected)} onClose={() => setSelected(null)} toast={toast} />}
    </div>
  );
}

const zoomBtnStyle = {
  width: 28, height: 28, borderRadius: 6, background: 'transparent', border: 0,
  color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center',
};

function GraphNode({ node, selected, onClick }) {
  const color = MockData.nodeColors[node.type];
  return (
    <div onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: 'absolute', left: node.x, top: node.y, width: 180, height: 60,
        background: `linear-gradient(90deg, ${color}18 0%, var(--card) 30%)`,
        border: `1px solid ${selected ? color : 'var(--border)'}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 8,
        padding: '8px 12px',
        cursor: 'pointer',
        boxShadow: selected ? `0 0 0 3px ${color}33, 0 0 20px ${color}44` : 'none',
        transition: 'box-shadow .15s, border-color .15s',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
      }}>
      <div className="mono" style={{ fontSize: 12, color: 'white', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.label}</div>
      <span style={{ fontSize: 10, color, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{node.type}</span>
    </div>
  );
}

function NodeDetailPanel({ node, onClose, toast }) {
  const color = MockData.nodeColors[node.type];
  return (
    <div className="fade-up" style={{ position: 'absolute', right: 0, top: 48, bottom: 0, width: 340, background: 'var(--card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 18, borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="mono" style={{ fontSize: 14, color: 'white', fontWeight: 700, marginBottom: 6, wordBreak: 'break-word' }}>{node.label}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="pill" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>{node.type}</span>
            <span className="pill" style={{ background: 'rgba(255,255,255,.05)', color: 'var(--text-2)' }}>247 lines</span>
          </div>
        </div>
        <button onClick={onClose} style={{ ...iconBtnStyle, flexShrink: 0 }}><Icons.X size={14} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <DetailSection title="Imports" items={[
          { Ic: Icons.ArrowRight, text: 'jsonwebtoken' },
          { Ic: Icons.ArrowRight, text: 'bcryptjs' },
          { Ic: Icons.ArrowRight, text: '../models/User.js' },
          { Ic: Icons.ArrowRight, text: '../utils/errors.js' },
        ]} />
        <DetailSection title="Functions" items={[
          { Ic: Icons.Function, text: 'signup', tag: 'async' },
          { Ic: Icons.Function, text: 'login', tag: 'async' },
          { Ic: Icons.Function, text: 'refresh', tag: 'async' },
          { Ic: Icons.Function, text: 'logout' },
        ]} />
        <DetailSection title="Routes" items={[
          { Ic: Icons.ArrowRight, text: 'POST /api/auth/signup' },
          { Ic: Icons.ArrowRight, text: 'POST /api/auth/login' },
        ]} />
      </div>

      <div style={{ padding: 14, borderTop: '1px solid var(--border-soft)' }}>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => toast('AI explanation started', 'success')}>
          <Icons.Sparkles size={14} /> Explain with AI
        </button>
      </div>
    </div>
  );
}

function DetailSection({ title, items }) {
  return (
    <div style={{ padding: '12px 18px' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
            <it.Ic size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <span className="mono" style={{ color: '#E5E7EB', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.text}</span>
            {it.tag && <span className="pill" style={{ background: 'rgba(124,58,237,.18)', color: '#C4B5FD', fontSize: 10 }}>{it.tag}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

window.GraphPage = GraphPage;
