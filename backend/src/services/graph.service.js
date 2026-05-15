const path = require('path');
const { parseFile } = require('./ast.service');
const { getFileFromS3 } = require('../config/s3');

// Category → display type mapping (capitalised, matches frontend nodeColors keys)
const CAT_TYPE = {
  component: 'Component',
  route: 'Route',
  model: 'Model',
  service: 'Service',
  middleware: 'Middleware',
  controller: 'Controller',
  util: 'Utils',
  config: 'Config',
  test: 'Utils',
  style: 'Utils',
  doc: 'Utils',
  other: 'Utils',
};

const NODE_W     = 200;
const H_GAP      = 50;   // horizontal gap between sibling nodes
const LEVEL_H    = 140;  // vertical distance between levels
const MAX_PER_ROW = 10;  // wrap to next sub-row after this many nodes
const CANVAS_CX  = 3000; // logical canvas width used for centering

/**
 * Lay out nodes in a top-down hierarchy based on import depth (BFS from entry-point files).
 * Files that nothing else imports sit at level 0 (top); their dependencies cascade downward.
 * @param {object[]} nodes
 * @param {Array<[string,string]>} edges  [fromId, toId] pairs
 * @returns {object[]} nodes with x, y set
 */
function applyLayout(nodes, edges) {
  if (nodes.length === 0) return nodes;

  // Build in-degree and children maps
  const inDegree = {};
  const children = {};
  for (const n of nodes) { inDegree[n.id] = 0; children[n.id] = []; }
  for (const [from, to] of edges) {
    if (inDegree[to] !== undefined) inDegree[to]++;
    if (children[from]) children[from].push(to);
  }

  // BFS: assign the deepest level reached (longest path from any root)
  const level = {};
  const queue = [];
  for (const n of nodes) {
    if (inDegree[n.id] === 0) { level[n.id] = 0; queue.push(n.id); }
  }
  // Isolated / cycle nodes default to level 0
  for (const n of nodes) {
    if (level[n.id] === undefined) { level[n.id] = 0; queue.push(n.id); }
  }

  let qi = 0;
  while (qi < queue.length) {
    const id = queue[qi++];
    for (const childId of children[id]) {
      const nl = (level[id] || 0) + 1;
      if (level[childId] === undefined || level[childId] < nl) {
        level[childId] = nl;
        queue.push(childId);
      }
    }
  }

  // Group by level
  const levelGroups = {};
  let maxLevel = 0;
  for (const n of nodes) {
    const l = level[n.id] || 0;
    if (!levelGroups[l]) levelGroups[l] = [];
    levelGroups[l].push(n);
    if (l > maxLevel) maxLevel = l;
  }

  const positioned = [];
  let curY = 60;

  for (let l = 0; l <= maxLevel; l++) {
    const group = levelGroups[l] || [];
    const rows = Math.ceil(group.length / MAX_PER_ROW);
    for (let r = 0; r < rows; r++) {
      const rowNodes = group.slice(r * MAX_PER_ROW, (r + 1) * MAX_PER_ROW);
      const rowW = rowNodes.length * NODE_W + (rowNodes.length - 1) * H_GAP;
      const startX = Math.max(40, (CANVAS_CX - rowW) / 2);
      for (let j = 0; j < rowNodes.length; j++) {
        positioned.push({ ...rowNodes[j], x: startX + j * (NODE_W + H_GAP), y: curY });
      }
      if (rows > 1) curY += 90; // tighter rows within the same level
    }
    curY += LEVEL_H;
  }

  return positioned;
}

/**
 * Fetch all files from S3, parse them, and build a dependency graph.
 * @param {{ repoId: string, s3Prefix: string, name: string }} repo
 * @param {import('../models/File')[]} fileDocs
 * @returns {Promise<{ nodes: object[], edges: object[], stats: object }>}
 */
async function buildGraph(repo, fileDocs) {
  const parsedMap = {}; // filePath → parsed AST data
  const MAX_FILES = 150; // cap to keep response fast

  const docsToProcess = fileDocs.slice(0, MAX_FILES);

  // Parse each file
  await Promise.all(docsToProcess.map(async (doc) => {
    const s3Key = `${repo.s3Prefix}/${doc.filePath}`;
    try {
      const content = await getFileFromS3(s3Key);
      const parsed = parseFile(content, doc.filePath);
      parsedMap[doc.filePath] = { ...parsed, lineCount: doc.lineCount, category: doc.category };
    } catch {
      parsedMap[doc.filePath] = { imports: [], exports: [], functions: [], routes: [], classes: [], lineCount: doc.lineCount, category: doc.category };
    }
  }));

  // Build file path → node id map
  const pathToId = {};
  docsToProcess.forEach((doc, i) => {
    pathToId[doc.filePath] = `node-${i}`;
  });

  // Build nodes
  const rawNodes = docsToProcess.map((doc, i) => {
    const parsed = parsedMap[doc.filePath] || {};
    const type = CAT_TYPE[doc.category] || 'Utils';
    return {
      id: `node-${i}`,
      label: doc.filePath,
      type,
      lines: doc.lineCount,
      imports: (parsed.imports || []).slice(0, 10),
      exports: parsed.exports || [],
      functions: (parsed.functions || []).slice(0, 10),
      routes: (parsed.routes || []).slice(0, 10),
      classes: parsed.classes || [],
      x: 0,
      y: 0,
    };
  });

  // Build edges from relative imports
  const edgeSet = new Set();
  const edges = [];

  for (const doc of docsToProcess) {
    const parsed = parsedMap[doc.filePath];
    if (!parsed?.imports) continue;
    const fromId = pathToId[doc.filePath];

    for (const imp of parsed.imports) {
      if (!imp.startsWith('.')) continue;
      const dir = path.dirname(doc.filePath);
      let resolved = path.posix.join(dir, imp);

      // Try to match against known files (with/without extensions)
      const exts = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.ts', '/index.jsx', '/index.tsx'];
      let toId = null;
      for (const ext of exts) {
        const candidate = (resolved + ext).replace(/^\//, '');
        if (pathToId[candidate]) {
          toId = pathToId[candidate];
          break;
        }
      }

      if (toId && toId !== fromId) {
        const key = `${fromId}→${toId}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push([fromId, toId]);
        }
      }
    }
  }

  const nodes = applyLayout(rawNodes, edges);

  // Stats
  const typeCounts = {};
  for (const n of nodes) typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;

  return {
    nodes,
    edges,
    repoName: `${repo.owner}/${repo.name}`,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      byType: typeCounts,
    },
  };
}

module.exports = { buildGraph };
