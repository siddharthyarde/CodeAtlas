const parser = require('@babel/parser');

// ─── Simple recursive AST walker (avoids @babel/traverse ESM issues) ──────────
function walk(node, visitors) {
  if (!node || typeof node !== 'object') return;
  const fn = visitors[node.type];
  if (fn) fn(node);
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'start' || key === 'end' || key === 'loc') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      child.forEach(c => walk(c, visitors));
    } else if (child && typeof child === 'object' && child.type) {
      walk(child, visitors);
    }
  }
}

/**
 * Parse a JS/JSX/TS/TSX file and extract structural info.
 * @param {string} content
 * @param {string} filePath
 * @returns {{ imports: string[], exports: string[], functions: object[], routes: object[], classes: string[] }}
 */
function parseJSFile(content, filePath) {
  const result = { imports: [], exports: [], functions: [], routes: [], classes: [] };

  let ast;
  try {
    ast = parser.parse(content, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties', 'dynamicImport', 'optionalChaining', 'nullishCoalescingOperator'],
      errorRecovery: true,
    });
  } catch {
    return result; // unparseable — return empty
  }

  walk(ast, {
    ImportDeclaration(node) {
      result.imports.push(node.source?.value || '');
    },
    CallExpression(node) {
      // require('...')
      if (node.callee?.name === 'require' && node.arguments?.[0]?.type === 'StringLiteral') {
        result.imports.push(node.arguments[0].value);
        return;
      }
      // Express route: router.get('/path', ...) or app.post('/path', ...)
      const callee = node.callee;
      if (callee?.type === 'MemberExpression') {
        const method = callee.property?.name?.toUpperCase();
        if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'USE', 'ALL'].includes(method)) {
          const firstArg = node.arguments?.[0];
          if (firstArg?.type === 'StringLiteral') {
            result.routes.push({ method: method === 'USE' ? 'USE' : method, path: firstArg.value });
          }
        }
      }
    },
    ExportDefaultDeclaration(node) {
      const decl = node.declaration;
      if (decl?.id?.name) result.exports.push(decl.id.name);
      else if (decl?.type === 'Identifier') result.exports.push(decl.name);
      else result.exports.push('default');
    },
    ExportNamedDeclaration(node) {
      if (node.declaration?.id?.name) {
        result.exports.push(node.declaration.id.name);
      }
      for (const spec of node.specifiers || []) {
        if (spec.exported?.name) result.exports.push(spec.exported.name);
      }
    },
    FunctionDeclaration(node) {
      if (node.id?.name) {
        result.functions.push({ name: node.id.name, async: !!node.async });
      }
    },
    ClassDeclaration(node) {
      if (node.id?.name) result.classes.push(node.id.name);
    },
    VariableDeclarator(node) {
      // const foo = () => {} or const foo = function() {}
      if (node.id?.name && node.init) {
        const t = node.init.type;
        if (t === 'ArrowFunctionExpression' || t === 'FunctionExpression') {
          result.functions.push({ name: node.id.name, async: !!node.init.async });
        }
      }
    },
  });

  return result;
}

/**
 * Parse a Python file (regex-based).
 * @param {string} content
 * @returns {{ imports: string[], functions: object[], classes: string[], exports: string[], routes: object[] }}
 */
function parsePythonFile(content) {
  const imports = [];
  const functions = [];
  const classes = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    // import x, from x import y
    if (/^import\s+/.test(trimmed)) {
      imports.push(trimmed.replace(/^import\s+/, '').split(',')[0].trim().split(' ')[0]);
    } else if (/^from\s+\S+\s+import/.test(trimmed)) {
      imports.push(trimmed.match(/^from\s+(\S+)/)?.[1] || '');
    }
    // def foo(...):
    const fnMatch = trimmed.match(/^(?:async\s+)?def\s+(\w+)\s*\(/);
    if (fnMatch) functions.push({ name: fnMatch[1], async: trimmed.startsWith('async') });
    // class Foo:
    const clsMatch = trimmed.match(/^class\s+(\w+)/);
    if (clsMatch) classes.push(clsMatch[1]);
  }

  return { imports: imports.filter(Boolean), functions, classes, exports: classes, routes: [] };
}

/**
 * Parse a Go file (regex-based).
 * @param {string} content
 * @returns {{ imports: string[], functions: object[], classes: string[], exports: string[], routes: object[] }}
 */
function parseGoFile(content) {
  const imports = [];
  const functions = [];

  // import "pkg" or import ( "pkg1"\n "pkg2" )
  const singleImport = content.match(/^import\s+"([^"]+)"/m);
  if (singleImport) imports.push(singleImport[1]);
  const blockImports = content.match(/import\s*\(([\s\S]*?)\)/);
  if (blockImports) {
    const lines = blockImports[1].split('\n');
    for (const line of lines) {
      const m = line.match(/"([^"]+)"/);
      if (m) imports.push(m[1]);
    }
  }

  // func FunctionName(...)
  const fnMatches = content.matchAll(/^func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(/gm);
  for (const m of fnMatches) {
    functions.push({ name: m[1], async: false });
  }

  return { imports: imports.filter(Boolean), functions, classes: [], exports: [], routes: [] };
}

/**
 * Dispatch to the correct parser based on file extension.
 * @param {string} content
 * @param {string} filePath
 * @returns {object}
 */
function parseFile(content, filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'].includes(ext)) {
    return parseJSFile(content, filePath);
  }
  if (ext === 'py') return parsePythonFile(content);
  if (ext === 'go') return parseGoFile(content);
  return { imports: [], exports: [], functions: [], routes: [], classes: [] };
}

module.exports = { parseFile, parseJSFile, parsePythonFile, parseGoFile };
