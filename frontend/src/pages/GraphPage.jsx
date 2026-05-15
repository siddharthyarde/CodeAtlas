import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar } from '../components/Layout';
import Icons from '../components/Icons';
import api from '../services/api';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const NODE_W   = 190;
const NODE_H   = 60;
const NODE_GAP = 28;
const LEVEL_GAP = 115;

const fileColors = {
  Component: '#3B82F6', Route: '#22C55E', Model: '#F59E0B',
  Service: '#A855F7', Middleware: '#EC4899', Controller: '#14B8A6',
  Utils: '#6B7280', Config: '#6B7280',
};
const FOLDER_COLOR = '#6366F1'; // indigo for all folder nodes

function nodeColor(type) {
  if (type === 'folder') return FOLDER_COLOR;
  return fileColors[type] || '#6B7280';
}

const iconBtnStyle = {
  width: 28, height: 28, borderRadius: 6, background: 'transparent',
  border: '1px solid var(--border)', color: 'var(--text-2)',
  display: 'grid', placeItems: 'center', cursor: 'pointer',
};
const zoomBtnStyle = {
  width: 28, height: 28, borderRadius: 6, background: 'transparent', border: 0,
  color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center',
};

// ─── Build folder tree from flat file nodes ───────────────────────────────────
/**
 * Converts flat { nodes, edges } from backend into a folder-hierarchy tree.
 * Each folder becomes a tree node whose children are:
 *   - subfolders (alphabetically sorted) first
 *   - files in that folder (alphabetically sorted) after
 * All original import edges become cross-edges (shown when both endpoints visible).
 */
function buildFolderTree(flatNodes, flatEdges) {
  if (!flatNodes.length) return { tree: null, crossEdges: [] };

  // All import edges become cross-edges in the folder tree
  const crossEdges = flatEdges.map(e => Array.isArray(e) ? e : [e.source, e.target]);

  // Map: folderPath -> { subfolders: Set<string>, files: Node[] }
  const folderContents = {};
  const ensureFolder = (fp) => {
    if (!folderContents[fp]) folderContents[fp] = { subfolders: new Set(), files: [] };
  };
  ensureFolder(''); // root

  flatNodes.forEach(node => {
    const fullPath = node.label || node.id; // e.g. "backend/src/controllers/auth.js"
    const parts = fullPath.split('/').filter(Boolean);

    // Register every ancestor folder
    for (let depth = 0; depth < parts.length - 1; depth++) {
      const folderPath = parts.slice(0, depth + 1).join('/');
      const parentPath = depth === 0 ? '' : parts.slice(0, depth).join('/');
      ensureFolder(folderPath);
      ensureFolder(parentPath);
      folderContents[parentPath].subfolders.add(folderPath);
    }

    // Add file to its immediate parent folder
    const parentPath = parts.slice(0, -1).join('/');
    ensureFolder(parentPath);
    folderContents[parentPath].files.push(node);
  });

  // Recursively build the tree node for a folder path
  function buildFolderNode(folderPath) {
    const name = folderPath ? folderPath.split('/').pop() : 'Project Root';
    const id   = folderPath ? `folder:${folderPath}` : '__root__';
    const { subfolders, files } = folderContents[folderPath] || { subfolders: new Set(), files: [] };

    const subfolderNodes = [...subfolders]
      .sort()
      .map(fp => buildFolderNode(fp));

    const fileNodes = files
      .slice()
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''))
      .map(node => {
        const fileName = (node.label || node.id).split('/').pop();
        return {
          id: node.id,
          label: fileName,
          type: node.type || 'Utils',
          data: node,
          children: [],
        };
      });

    return {
      id,
      label: name,
      type: 'folder',
      data: {
        fullPath: folderPath,
        fileCount: files.length,
        folderCount: subfolders.size,
      },
      children: [...subfolderNodes, ...fileNodes],
    };
  }

  const tree = buildFolderNode('');

  // If root has exactly one child folder and zero direct files, skip the root
  // and use that child as the effective root (avoids a pointless "Project Root" wrapper)
  if (tree.children.length === 1 && tree.children[0].type === 'folder') {
    return { tree: tree.children[0], crossEdges };
  }

  return { tree, crossEdges };
}

// ─── Tree traversal helpers ───────────────────────────────────────────────────
function findNode(root, id) {
  if (!root) return null;
  if (root.id === id) return root;
  for (const c of root.children) {
    const r = findNode(c, id);
    if (r) return r;
  }
  return null;
}

function findParent(root, id, parent = null) {
  if (!root) return null;
  if (root.id === id) return parent;
  for (const c of root.children) {
    const r = findParent(c, id, root);
    if (r) return r;
  }
  return null;
}

function allDescendants(root, id) {
  const set = new Set();
  const walk = (node) => { set.add(node.id); node.children.forEach(walk); };
  const target = findNode(root, id);
  if (target) walk(target);
  return set;
}

function hasCrossConnection(root, crossEdges, aId, bId) {
  const A = allDescendants(root, aId);
  const B = allDescendants(root, bId);
  return crossEdges.some(([x, y]) => (A.has(x) && B.has(y)) || (A.has(y) && B.has(x)));
}

function countAll(node) {
  if (!node) return 0;
  return 1 + node.children.reduce((s, c) => s + countAll(c), 0);
}

// ─── Layout engine ────────────────────────────────────────────────────────────
function subtreeWidth(node, expanded) {
  const isExp = expanded.has(node.id) && node.children.length;
  if (!isExp) return NODE_W;
  const sum = node.children.reduce((s, c) => s + subtreeWidth(c, expanded), 0)
    + NODE_GAP * (node.children.length - 1);
  return Math.max(NODE_W, sum);
}

function layoutTree(root, expanded) {
  const out = [];
  const place = (node, cx, y) => {
    out.push({ id: node.id, label: node.label, type: node.type, data: node.data, x: cx - NODE_W / 2, y });
    if (!expanded.has(node.id) || !node.children.length) return;
    const widths = node.children.map(c => subtreeWidth(c, expanded));
    const totalW = widths.reduce((s, w) => s + w, 0) + NODE_GAP * (node.children.length - 1);
    let cursor = cx - totalW / 2;
    node.children.forEach((c, i) => {
      place(c, cursor + widths[i] / 2, y + LEVEL_GAP);
      cursor += widths[i] + NODE_GAP;
    });
  };
  if (root) place(root, 0, 0);
  return out;
}

// ─── Tree node component ──────────────────────────────────────────────────────
function TreeNode({ node, hasChildren, isExpanded, isSelected, dim, onClick }) {
  const isFolder = node.type === 'folder';
  const color    = nodeColor(node.type);

  return (
    <div onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: 'absolute',
        left: node.x, top: node.y,
        width: NODE_W, height: NODE_H,
        background: isFolder
          ? `linear-gradient(90deg, ${color}20 0%, var(--card) 40%)`
          : `linear-gradient(90deg, ${color}18 0%, var(--card) 35%)`,
        border: `1px solid ${isSelected ? color : isFolder ? `${color}55` : 'var(--border)'}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 8,
        padding: '8px 10px',
        cursor: hasChildren ? 'pointer' : 'default',
        boxShadow: isSelected ? `0 0 0 3px ${color}33, 0 0 20px ${color}44` : 'none',
        opacity: dim ? 0.2 : 1,
        transition: 'box-shadow .15s, border-color .15s, opacity .2s',
        display: 'flex', alignItems: 'center', gap: 8,
        userSelect: 'none',
      }}>

      {/* Icon */}
      <div style={{ flexShrink: 0, color }}>
        {isFolder
          ? (isExpanded ? <Icons.FolderOpen size={14} /> : <Icons.Folder size={14} />)
          : <Icons.FileCode size={12} />}
      </div>

      {/* Label + type */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono" style={{ fontSize: 11.5, color: 'white', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {node.label}
        </div>
        <div style={{ fontSize: 9, color, textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700, marginTop: 2 }}>
          {isFolder
            ? `${node.data?.folderCount ?? 0}F · ${node.data?.fileCount ?? 0} files`
            : node.type + (node.data?.lines > 0 ? ` · ${node.data.lines}L` : '')}
        </div>
      </div>

      {/* Expand indicator */}
      {hasChildren && (
        <div style={{
          width: 17, height: 17, borderRadius: 999, flexShrink: 0,
          background: isExpanded ? color : 'rgba(255,255,255,.07)',
          color: isExpanded ? 'white' : color,
          display: 'grid', placeItems: 'center',
          transition: 'background .15s, transform .25s',
          transform: isExpanded ? 'rotate(180deg)' : 'none',
        }}>
          <Icons.ChevronDown size={10} />
        </div>
      )}
    </div>
  );
}

// ─── MiniMap ──────────────────────────────────────────────────────────────────
function MiniMap({ layoutNodes, treeEdges, crossEdges, selected, nodeById }) {
  if (!layoutNodes.length) return null;
  const xs = layoutNodes.map(n => n.x);
  const ys = layoutNodes.map(n => n.y);
  const minX = Math.min(...xs) - 10, maxX = Math.max(...xs) + NODE_W + 10;
  const minY = Math.min(...ys) - 10, maxY = Math.max(...ys) + NODE_H + 10;
  const w = maxX - minX || 1, h = maxY - minY || 1;

  return (
    <div style={{ position: 'absolute', bottom: 16, right: 16, width: 200, height: 130, background: 'rgba(10,10,20,.92)', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
      <svg viewBox={`${minX} ${minY} ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
        {treeEdges.map(([a, b], i) => {
          const na = nodeById[a], nb = nodeById[b];
          if (!na || !nb) return null;
          return <line key={i} x1={na.x + NODE_W / 2} y1={na.y + NODE_H} x2={nb.x + NODE_W / 2} y2={nb.y} stroke="#4c3a90" strokeWidth="3" />;
        })}
        {crossEdges.map(([a, b], i) => {
          const na = nodeById[a], nb = nodeById[b];
          if (!na || !nb) return null;
          return <line key={`c${i}`} x1={na.x + NODE_W / 2} y1={na.y + NODE_H / 2} x2={nb.x + NODE_W / 2} y2={nb.y + NODE_H / 2} stroke="#F472B6" strokeWidth="2" strokeDasharray="4 3" />;
        })}
        {layoutNodes.map(n => (
          <rect key={n.id} x={n.x} y={n.y} width={NODE_W} height={NODE_H} rx="4"
            fill={nodeColor(n.type)}
            stroke={selected === n.id ? 'white' : 'none'} strokeWidth="3"
            opacity={selected === n.id ? 1 : 0.6} />
        ))}
      </svg>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
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

function NodeDetailPanel({ node, treeNode, hasChildren, isExpanded, onToggle, onClose, onExplain }) {
  const isFolder = node.type === 'folder';
  const color    = nodeColor(node.type);
  const data     = node.data || {};

  // File-specific fields
  const imports   = isFolder ? [] : (data.imports  || []).filter(Boolean).slice(0, 8);
  const functions = isFolder ? [] : (data.functions || []).slice(0, 8);
  const routes    = isFolder ? [] : (data.routes    || []).slice(0, 8);

  // Folder children
  const childFolders = isFolder && treeNode
    ? treeNode.children.filter(c => c.type === 'folder').slice(0, 8)
    : [];
  const childFiles = isFolder && treeNode
    ? treeNode.children.filter(c => c.type !== 'folder').slice(0, 8)
    : [];

  return (
    <div className="fade-up" style={{ position: 'absolute', right: 0, top: 48, bottom: 0, width: 320, background: 'var(--card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
      {/* Header */}
      <div style={{ padding: 16, borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {isFolder ? <Icons.Folder size={14} style={{ color, flexShrink: 0 }} /> : <Icons.FileCode size={13} style={{ color, flexShrink: 0 }} />}
            <div className="mono" style={{ fontSize: 12.5, color: 'white', fontWeight: 700, wordBreak: 'break-all' }}>{node.label}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="pill" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
              {isFolder ? 'folder' : node.type}
            </span>
            {isFolder && (
              <>
                {data.folderCount > 0 && <span className="pill" style={{ background: 'rgba(255,255,255,.05)', color: 'var(--text-2)' }}>{data.folderCount} subfolder{data.folderCount !== 1 ? 's' : ''}</span>}
                {data.fileCount  > 0 && <span className="pill" style={{ background: 'rgba(255,255,255,.05)', color: 'var(--text-2)' }}>{data.fileCount} file{data.fileCount !== 1 ? 's' : ''}</span>}
              </>
            )}
            {!isFolder && data.lines > 0 && <span className="pill" style={{ background: 'rgba(255,255,255,.05)', color: 'var(--text-2)' }}>{data.lines} lines</span>}
          </div>
        </div>
        <button onClick={onClose} style={iconBtnStyle}><Icons.X size={14} /></button>
      </div>

      {/* Expand/collapse button */}
      {hasChildren && (
        <div style={{ padding: 12, borderBottom: '1px solid var(--border-soft)' }}>
          <button onClick={onToggle} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
            <Icons.ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            {isExpanded ? 'Collapse' : 'Expand'} {isFolder ? 'folder' : 'children'}
          </button>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {isFolder ? (
          <>
            {data.fullPath && (
              <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>Path</div>
                <div className="mono" style={{ fontSize: 11.5, color: '#C4B5FD' }}>{data.fullPath || '/'}</div>
              </div>
            )}
            {childFolders.length > 0 && (
              <DetailSection title="Subfolders" items={childFolders.map(c => ({ Ic: Icons.Folder, text: c.label }))} />
            )}
            {childFiles.length > 0 && (
              <DetailSection title="Files" items={childFiles.map(c => ({ Ic: Icons.FileCode, text: c.label, tag: c.type.toLowerCase() }))} />
            )}
          </>
        ) : (
          <>
            {imports.length   > 0 && <DetailSection title="Imports"   items={imports.map(imp => ({ Ic: Icons.ArrowRight, text: imp }))} />}
            {functions.length > 0 && <DetailSection title="Functions" items={functions.map(fn  => ({ Ic: Icons.Function, text: fn.name || fn, tag: fn.async ? 'async' : undefined }))} />}
            {routes.length    > 0 && <DetailSection title="Routes"    items={routes.map(r    => ({ Ic: Icons.ArrowRight, text: `${r.method} ${r.path}` }))} />}
            {imports.length === 0 && functions.length === 0 && routes.length === 0 && (
              <div style={{ padding: '20px 18px', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>No structural data extracted</div>
            )}
          </>
        )}
      </div>

      {/* Footer — "Explain with AI" only for files */}
      {!isFolder && (
        <div style={{ padding: 14, borderTop: '1px solid var(--border-soft)' }}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onExplain}>
            <Icons.Sparkles size={14} /> Explain with AI
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function GraphPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const repoId = searchParams.get('repo');

  const [filter, setFilter]     = useState('All');
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom]         = useState(1);
  const [pan, setPan]           = useState({ x: 0, y: 0 });
  const [loading, setLoading]   = useState(true);
  const [repoName, setRepoName] = useState('');

  const [tree, setTree]           = useState(null);
  const [crossEdges, setCrossEdges] = useState([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [expanded, setExpanded]   = useState(() => new Set());

  const canvasRef = useRef(null);
  const dragRef   = useRef(null);
  const zoomRef   = useRef(zoom);
  const panRef    = useRef(pan);
  zoomRef.current = zoom;
  panRef.current  = pan;

  const cats = ['All', 'folder', 'Component', 'Route', 'Model', 'Service', 'Controller', 'Middleware', 'Utils'];

  // Fetch graph data and build folder tree
  useEffect(() => {
    if (!repoId) { setLoading(false); return; }
    api.get(`/repo/${repoId}/analyze`).then(res => {
      const d = res.data.data;
      setRepoName(d.repoName || '');
      setTotalFiles((d.nodes || []).length);
      const { tree: t, crossEdges: ce } = buildFolderTree(d.nodes || [], d.edges || []);
      setTree(t);
      setCrossEdges(ce);
    }).catch(() => {
      toast.error('Failed to load graph');
    }).finally(() => setLoading(false));
  }, [repoId]);

  // Center root on load
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !tree) return;
    const rect = el.getBoundingClientRect();
    setPan({ x: rect.width / 2, y: 80 });
  }, [tree]);

  // Cursor-aware zoom (non-passive wheel)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => {
      e.preventDefault();
      const z = zoomRef.current, p = panRef.current;
      const delta   = e.deltaY < 0 ? 0.08 : -0.08;
      const newZoom = Math.max(0.25, Math.min(2.5, z + delta));
      const rect    = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const factor = newZoom / z;
      setZoom(newZoom);
      setPan({ x: mx - factor * (mx - p.x), y: my - factor * (my - p.y) });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // Layout
  const layoutNodes = useMemo(() => tree ? layoutTree(tree, expanded) : [], [tree, expanded]);
  const nodeById    = useMemo(() => Object.fromEntries(layoutNodes.map(n => [n.id, n])), [layoutNodes]);
  const visibleIds  = useMemo(() => new Set(layoutNodes.map(n => n.id)), [layoutNodes]);

  // Tree edges (folder→child for expanded nodes)
  const treeEdges = useMemo(() => {
    if (!tree) return [];
    const edges = [];
    const walk  = (node) => {
      if (!expanded.has(node.id)) return;
      node.children.forEach(c => {
        if (visibleIds.has(c.id)) edges.push([node.id, c.id]);
        walk(c);
      });
    };
    walk(tree);
    return edges;
  }, [tree, expanded, visibleIds]);

  // Cross-edges only visible when both file endpoints are shown
  const visibleCrossEdges = useMemo(() =>
    crossEdges.filter(([a, b]) => visibleIds.has(a) && visibleIds.has(b)),
    [crossEdges, visibleIds]);

  // Click: expand/collapse + sibling auto-close
  const toggleNode = useCallback((id) => {
    setSelected(id);
    if (!tree) return;
    const node = findNode(tree, id);
    if (!node || !node.children.length) return;

    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        allDescendants(tree, id).forEach(d => next.delete(d));
        return next;
      }
      next.add(id);
      const parent = findParent(tree, id);
      if (parent) {
        parent.children.forEach(sib => {
          if (sib.id === id || !next.has(sib.id)) return;
          if (hasCrossConnection(tree, crossEdges, id, sib.id)) return;
          allDescendants(tree, sib.id).forEach(d => next.delete(d));
        });
      }
      return next;
    });
  }, [tree, crossEdges]);

  const collapseAll = () => { setExpanded(new Set()); setSelected(null); };

  // Pan
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const onMouseUp = () => { dragRef.current = null; };

  const fitView = () => {
    const el = canvasRef.current;
    if (!el) return;
    setZoom(1);
    setPan({ x: el.getBoundingClientRect().width / 2, y: 80 });
  };

  const selectedLayout   = selected ? nodeById[selected] : null;
  const selectedTreeNode = selected && tree ? findNode(tree, selected) : null;

  // Category filter: for folders, dim when 'All' is off and a specific file type is chosen
  const isDim = (node) => {
    if (filter === 'All') return false;
    if (filter === 'folder') return node.type !== 'folder';
    return node.type !== 'folder' && node.type !== filter; // always show folders even with a file filter
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex' }}>
      <Sidebar />
      <div style={{ position: 'fixed', left: 240, right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

        {/* Toolbar */}
        <div style={{ height: 48, borderBottom: '1px solid var(--border-soft)', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '0 0 auto' }}>
            <button onClick={() => navigate('/repositories')} style={iconBtnStyle}><Icons.ChevronLeft size={14} /></button>
            <Icons.Github size={14} style={{ color: 'var(--text-2)', flexShrink: 0 }} />
            <span className="mono" style={{ fontSize: 13, color: 'white', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
              {repoName || 'Select a repository'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
              · {totalFiles} files · {visibleCrossEdges.length} import edges visible
            </span>
          </div>

          {/* Category filter pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', flex: 1, justifyContent: 'center' }}>
            {cats.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                style={{
                  padding: '4px 11px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: '1px solid ' + (filter === c ? 'transparent' : 'var(--border)'),
                  background: filter === c ? 'var(--purple-soft)' : 'transparent',
                  color: filter === c ? 'white' : 'var(--text-2)', whiteSpace: 'nowrap',
                }}>{c === 'folder' ? '📁 Folders' : c}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={collapseAll}>Collapse all</button>
            <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={fitView}><Icons.Maximize size={12} /> Reset</button>
            <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => toast.success('Export not yet available')}><Icons.Download size={12} /> Export</button>
          </div>
        </div>

        {/* Hint banner */}
        {!loading && tree && expanded.size === 0 && (
          <div className="fade-up" style={{
            position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.35)',
            color: '#A5B4FC', padding: '7px 16px', borderRadius: 999, fontSize: 12.5,
            display: 'flex', alignItems: 'center', gap: 8, zIndex: 5, pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            <Icons.Folder size={13} />
            Click the root folder to explore its contents
          </div>
        )}

        {/* Cross-edge legend */}
        {visibleCrossEdges.length > 0 && (
          <div style={{
            position: 'absolute', top: 60, right: 16, zIndex: 5,
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-2)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
              folder
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="#F472B6" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
              import
            </span>
          </div>
        )}

        {/* Canvas */}
        <div ref={canvasRef}
          style={{
            flex: 1, position: 'relative', overflow: 'hidden',
            cursor: dragRef.current ? 'grabbing' : 'grab',
            backgroundImage: 'radial-gradient(rgba(99,102,241,.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px', backgroundColor: 'var(--bg)',
          }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}     onMouseLeave={onMouseUp}
          onClick={() => setSelected(null)}>

          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-2)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 999, border: '3px solid rgba(99,102,241,.3)', borderTopColor: '#6366F1', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
                Building folder tree...
              </div>
            </div>
          )}

          {!loading && !tree && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-2)' }}>
                <Icons.Network size={48} style={{ color: 'var(--text-3)', marginBottom: 12 }} />
                <div style={{ marginBottom: 16 }}>
                  {repoId ? 'No graph data — make sure the repo is fully imported' : 'Select a repository to view its folder tree'}
                </div>
                {!repoId && <button className="btn btn-primary" onClick={() => navigate('/repositories')}>Import Repository</button>}
              </div>
            </div>
          )}

          {/* Transformed canvas */}
          <div style={{
            position: 'absolute', left: 0, top: 0,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0', willChange: 'transform',
          }}>
            {/* SVG edges */}
            <svg width="8000" height="6000"
              style={{ position: 'absolute', left: -4000, top: -300, overflow: 'visible', pointerEvents: 'none' }}>
              <defs>
                <marker id="treeArr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#6366F1" opacity=".7" />
                </marker>
                <marker id="crossArr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#F472B6" opacity=".8" />
                </marker>
              </defs>

              {/* Folder → child edges: bottom-center to top-center */}
              {treeEdges.map(([a, b], i) => {
                const na = nodeById[a], nb = nodeById[b];
                if (!na || !nb) return null;
                const x1 = na.x + NODE_W / 2 + 4000, y1 = na.y + NODE_H + 300;
                const x2 = nb.x + NODE_W / 2 + 4000, y2 = nb.y + 300;
                const midY = (y1 + y2) / 2;
                const isSel = selected === a || selected === b;
                return (
                  <path key={`t-${i}`}
                    d={`M ${x1} ${y1} C ${x1} ${midY} ${x2} ${midY} ${x2} ${y2}`}
                    fill="none"
                    stroke={isSel ? '#818CF8' : '#6366F1'}
                    strokeOpacity={isSel ? 1 : 0.45}
                    strokeWidth={isSel ? 2.5 : 1.5}
                    strokeDasharray="5 3"
                    markerEnd="url(#treeArr)" />
                );
              })}

              {/* Import cross-edges: center-to-center arc */}
              {visibleCrossEdges.map(([a, b], i) => {
                const na = nodeById[a], nb = nodeById[b];
                if (!na || !nb) return null;
                const x1 = na.x + NODE_W / 2 + 4000, y1 = na.y + NODE_H / 2 + 300;
                const x2 = nb.x + NODE_W / 2 + 4000, y2 = nb.y + NODE_H / 2 + 300;
                const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                const dx = x2 - x1, dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const off = Math.min(80, len * 0.2);
                const px = (-dy / len) * off, py = (dx / len) * off;
                return (
                  <path key={`c-${i}`}
                    d={`M ${x1} ${y1} Q ${mx + px} ${my + py} ${x2} ${y2}`}
                    fill="none" stroke="#F472B6" strokeOpacity=".6" strokeWidth="1.2"
                    strokeDasharray="3 3" markerEnd="url(#crossArr)" />
                );
              })}
            </svg>

            {/* Nodes */}
            {layoutNodes.map(n => {
              const tNode    = tree ? findNode(tree, n.id) : null;
              const hasKids  = tNode ? tNode.children.length > 0 : false;
              return (
                <TreeNode key={n.id} node={n}
                  hasChildren={hasKids}
                  isExpanded={expanded.has(n.id)}
                  isSelected={selected === n.id}
                  dim={isDim(n)}
                  onClick={() => toggleNode(n.id)} />
              );
            })}
          </div>

          {/* Zoom controls */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
            <button onClick={() => setZoom(z => Math.min(2.5, z + 0.1))} style={zoomBtnStyle}><Icons.Plus size={14} /></button>
            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} style={zoomBtnStyle}>
              <span style={{ display: 'block', width: 14, height: 2, background: 'currentColor' }} />
            </button>
            <button onClick={fitView} style={zoomBtnStyle}><Icons.Maximize size={12} /></button>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', padding: '4px 0' }}>
              {Math.round(zoom * 100)}%
            </div>
          </div>

          {/* MiniMap */}
          {layoutNodes.length > 0 && (
            <MiniMap layoutNodes={layoutNodes} treeEdges={treeEdges}
              crossEdges={visibleCrossEdges} selected={selected} nodeById={nodeById} />
          )}
        </div>

        {/* Detail panel */}
        {selectedLayout && (
          <NodeDetailPanel
            node={selectedLayout}
            treeNode={selectedTreeNode}
            hasChildren={selectedTreeNode?.children?.length > 0}
            isExpanded={expanded.has(selected)}
            onToggle={() => toggleNode(selected)}
            onClose={() => setSelected(null)}
            onExplain={() => {
              const filePath = selectedLayout.data?.label || selectedLayout.label;
              navigate(`/files?repo=${repoId}&file=${encodeURIComponent(filePath)}`);
            }}
          />
        )}
      </div>
    </div>
  );
}
