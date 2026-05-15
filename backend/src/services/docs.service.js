/**
 * Convert a camelCase handler name into a readable sentence.
 * e.g. "getUserById" → "Get user by id"
 * @param {string} name
 * @returns {string}
 */
function handlerToDesc(name) {
  const words = name
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .trim()
    .split(/\s+/);
  return words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ');
}

/**
 * Generate a human-readable description from an HTTP method + route path
 * when no named handler is available.
 * @param {string} method  e.g. "GET"
 * @param {string} routePath  e.g. "/users/:id"
 * @returns {string}
 */
function pathToDesc(method, routePath) {
  const parts = routePath.split('/').filter(p => p && p !== 'api');
  const resource = parts.find(p => !p.startsWith(':')) || parts[parts.length - 1] || 'resource';
  const hasParam = routePath.includes(':');

  const map = {
    GET:    hasParam ? `Get ${resource} by ID` : `List all ${resource}s`,
    POST:   `Create a new ${resource}`,
    PUT:    `Replace ${resource}`,
    PATCH:  `Update ${resource}`,
    DELETE: `Delete ${resource}`,
    USE:    `${resource} middleware`,
    ALL:    `Handle all methods on ${resource}`,
  };
  return map[method] || `${method} ${routePath}`;
}

/**
 * Group a flat list of route objects by the first non-param URL segment.
 * Sorts groups alphabetically; within each group, orders by HTTP method weight.
 *
 * @param {Array<{ method: string, path: string, src: string, handler?: string }>} routes
 * @returns {Array<{ group: string, endpoints: object[] }>}
 */
function groupRoutes(routes) {
  const methodOrder = { GET: 0, POST: 1, PUT: 2, PATCH: 3, DELETE: 4, USE: 5, ALL: 6 };
  const groups = {};

  for (const r of routes) {
    const parts = (r.path || '').split('/').filter(p => p && p !== 'api' && !p.startsWith(':'));
    const groupKey = parts[0] || 'root';

    if (!groups[groupKey]) groups[groupKey] = { group: groupKey, endpoints: [] };

    groups[groupKey].endpoints.push({
      method:  r.method,
      path:    r.path,
      desc:    r.handler ? handlerToDesc(r.handler) : pathToDesc(r.method, r.path),
      src:     r.src,
      middleware: r.middleware || [],
    });
  }

  return Object.values(groups)
    .sort((a, b) => a.group.localeCompare(b.group))
    .map(g => ({
      ...g,
      endpoints: g.endpoints.sort(
        (a, b) => (methodOrder[a.method] ?? 9) - (methodOrder[b.method] ?? 9)
      ),
    }));
}

module.exports = { groupRoutes, handlerToDesc, pathToDesc };
