const parser = require('@babel/parser');

/**
 * Depth-aware AST walker — tracks nesting level as it descends.
 * @param {object} node
 * @param {object} visitors  { NodeType: (node, depth) => void }
 * @param {number} depth
 */
function walkDepth(node, visitors, depth = 0) {
  if (!node || typeof node !== 'object') return;

  const visitor = visitors[node.type];
  if (visitor) visitor(node, depth);

  const depthIncreasing = new Set([
    'IfStatement', 'WhileStatement', 'ForStatement', 'ForInStatement',
    'ForOfStatement', 'DoWhileStatement', 'SwitchStatement',
    'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression',
    'ClassDeclaration', 'ClassExpression', 'TryStatement',
  ]);

  const nextDepth = depthIncreasing.has(node.type) ? depth + 1 : depth;

  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'start' || key === 'end' || key === 'loc') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      child.forEach(c => { if (c && typeof c === 'object' && c.type) walkDepth(c, visitors, nextDepth); });
    } else if (child && typeof child === 'object' && child.type) {
      walkDepth(child, visitors, nextDepth);
    }
  }
}

/**
 * Analyse a source file for cyclomatic complexity, max nesting depth, and function count.
 * Uses AST for JS/TS files; falls back to line-count heuristic for others.
 *
 * Cyclomatic complexity = 1 + (count of decision points):
 *   if/else-if, while, for, for-in, for-of, do-while, switch case (non-default),
 *   catch, ternary (?:), logical operators (&&, ||, ??)
 *
 * @param {string} content
 * @param {string} filePath
 * @returns {{ cyclomaticComplexity: number, maxNestingDepth: number, functionCount: number }}
 */
function analyzeFile(content, filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const jsExts = new Set(['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs']);

  if (!jsExts.has(ext)) {
    const lines = content.split('\n').length;
    return { cyclomaticComplexity: Math.max(1, Math.floor(lines / 80)), maxNestingDepth: 0, functionCount: 0 };
  }

  let ast;
  try {
    ast = parser.parse(content, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties', 'dynamicImport', 'optionalChaining', 'nullishCoalescingOperator'],
      errorRecovery: true,
    });
  } catch {
    return { cyclomaticComplexity: 1, maxNestingDepth: 0, functionCount: 0 };
  }

  let cc = 1;
  let maxDepth = 0;
  let functionCount = 0;

  walkDepth(ast, {
    IfStatement(_, d)           { cc++; maxDepth = Math.max(maxDepth, d); },
    WhileStatement(_, d)        { cc++; maxDepth = Math.max(maxDepth, d); },
    ForStatement(_, d)          { cc++; maxDepth = Math.max(maxDepth, d); },
    ForInStatement(_, d)        { cc++; maxDepth = Math.max(maxDepth, d); },
    ForOfStatement(_, d)        { cc++; maxDepth = Math.max(maxDepth, d); },
    DoWhileStatement(_, d)      { cc++; maxDepth = Math.max(maxDepth, d); },
    CatchClause(_, d)           { cc++; maxDepth = Math.max(maxDepth, d); },
    ConditionalExpression(_, d) { cc++; maxDepth = Math.max(maxDepth, d); },
    SwitchCase(node, d) {
      if (node.test !== null) cc++;
      maxDepth = Math.max(maxDepth, d);
    },
    LogicalExpression(node) {
      if (['&&', '||', '??'].includes(node.operator)) cc++;
    },
    FunctionDeclaration(_, d)     { functionCount++; maxDepth = Math.max(maxDepth, d); },
    FunctionExpression(_, d)      { functionCount++; maxDepth = Math.max(maxDepth, d); },
    ArrowFunctionExpression(_, d) { functionCount++; maxDepth = Math.max(maxDepth, d); },
  });

  return { cyclomaticComplexity: cc, maxNestingDepth: maxDepth, functionCount };
}

/**
 * Compute a 0–100 risk score and categorical risk level.
 * CC is the dominant signal; nesting depth and function count are secondary.
 * @param {number} cc    cyclomatic complexity
 * @param {number} depth max nesting depth
 * @param {number} fns   function count
 * @returns {{ riskScore: number, riskLevel: 'low'|'medium'|'high'|'critical' }}
 */
function computeRisk(cc, depth, fns) {
  const raw = (cc / 30) * 60 + (depth / 10) * 30 + (fns / 60) * 10;
  const riskScore = Math.min(100, Math.round(raw));

  let riskLevel;
  if (cc >= 21 || depth >= 8) riskLevel = 'critical';
  else if (cc >= 11 || depth >= 6) riskLevel = 'high';
  else if (cc >= 6 || depth >= 4) riskLevel = 'medium';
  else riskLevel = 'low';

  return { riskScore, riskLevel };
}

module.exports = { analyzeFile, computeRisk };
