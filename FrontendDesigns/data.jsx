/* Mock data for the prototype */
const MockData = {
  user: { name: 'Alex Morgan', email: 'alex@codeatlas.ai', avatar: 'AM', plan: 'free' },
  repos: [
    { id: 'r1', name: 'shopify/polaris-react', owner: 'shopify', status: 'complete', files: 891, components: 48, routes: 23, imported: '2 hours ago' },
    { id: 'r2', name: 'vercel/next.js', owner: 'vercel', status: 'complete', files: 2341, components: 124, routes: 89, imported: 'yesterday' },
    { id: 'r3', name: 'expressjs/express', owner: 'expressjs', status: 'cloning', files: 0, components: 0, routes: 0, imported: 'just now' },
    { id: 'r4', name: 'mongodb/mongoose', owner: 'mongodb', status: 'complete', files: 412, components: 0, routes: 0, imported: '3 days ago' },
    { id: 'r5', name: 'remix-run/remix', owner: 'remix-run', status: 'error', files: 0, components: 0, routes: 0, imported: '4 days ago' },
    { id: 'r6', name: 'prisma/prisma', owner: 'prisma', status: 'complete', files: 1208, components: 0, routes: 0, imported: 'last week' },
  ],
  insights: [
    { file: 'src/auth.controller.js', purpose: 'Handles JWT signup, login, and token refresh flows' },
    { file: 'src/middleware/rateLimit.js', purpose: 'Per-user token bucket rate limiting via Redis' },
    { file: 'src/services/aiAnalyzer.js', purpose: 'Orchestrates Claude calls for file-level analysis' },
    { file: 'src/models/Repository.js', purpose: 'Mongoose schema for tracked repositories' },
    { file: 'src/utils/cloneRepo.js', purpose: 'Git clone with depth=1 and progress streaming' },
  ],
  graphNodes: [
    { id: 'app', label: 'App.jsx', type: 'Component', x: 80, y: 60 },
    { id: 'router', label: 'Router.jsx', type: 'Component', x: 320, y: 60 },
    { id: 'auth', label: 'auth.controller.js', type: 'Controller', x: 560, y: 60 },
    { id: 'repo', label: 'repo.controller.js', type: 'Controller', x: 560, y: 160 },
    { id: 'authRoute', label: 'auth.routes.js', type: 'Route', x: 800, y: 60 },
    { id: 'repoRoute', label: 'repo.routes.js', type: 'Route', x: 800, y: 160 },
    { id: 'userModel', label: 'User.js', type: 'Model', x: 1040, y: 60 },
    { id: 'repoModel', label: 'Repository.js', type: 'Model', x: 1040, y: 160 },
    { id: 'aiService', label: 'aiAnalyzer.js', type: 'Service', x: 320, y: 260 },
    { id: 'jwt', label: 'jwt.util.js', type: 'Utils', x: 80, y: 260 },
    { id: 'rate', label: 'rateLimit.js', type: 'Middleware', x: 320, y: 360 },
    { id: 'cache', label: 'cache.service.js', type: 'Service', x: 560, y: 260 },
    { id: 'clone', label: 'cloneRepo.js', type: 'Utils', x: 800, y: 260 },
    { id: 'parser', label: 'astParser.js', type: 'Service', x: 800, y: 360 },
    { id: 'graph', label: 'graphBuilder.js', type: 'Service', x: 1040, y: 260 },
    { id: 'home', label: 'HomePage.jsx', type: 'Component', x: 80, y: 160 },
  ],
  graphEdges: [
    ['app','router'],['router','auth'],['router','repo'],['auth','authRoute'],['repo','repoRoute'],
    ['authRoute','userModel'],['repoRoute','repoModel'],['auth','jwt'],['auth','rate'],
    ['repo','aiService'],['aiService','cache'],['repo','clone'],['clone','parser'],
    ['parser','graph'],['app','home'],['home','auth'],
  ],
  nodeColors: {
    Component: '#3B82F6', Route: '#22C55E', Model: '#F59E0B',
    Service: '#A855F7', Middleware: '#EC4899', Controller: '#14B8A6', Utils: '#6B7280',
  },
  files: [
    { path: 'src/App.jsx', cat: 'Component', risk: 'low', cc: 4 },
    { path: 'src/Router.jsx', cat: 'Component', risk: 'low', cc: 6 },
    { path: 'src/pages/HomePage.jsx', cat: 'Component', risk: 'medium', cc: 11 },
    { path: 'src/pages/DashboardPage.jsx', cat: 'Component', risk: 'high', cc: 19 },
    { path: 'src/controllers/auth.controller.js', cat: 'Controller', risk: 'high', cc: 22 },
    { path: 'src/controllers/repo.controller.js', cat: 'Controller', risk: 'critical', cc: 31 },
    { path: 'src/routes/auth.routes.js', cat: 'Route', risk: 'low', cc: 3 },
    { path: 'src/routes/repo.routes.js', cat: 'Route', risk: 'low', cc: 4 },
    { path: 'src/models/User.js', cat: 'Model', risk: 'low', cc: 2 },
    { path: 'src/models/Repository.js', cat: 'Model', risk: 'medium', cc: 8 },
    { path: 'src/services/aiAnalyzer.js', cat: 'Service', risk: 'critical', cc: 28 },
    { path: 'src/services/cache.service.js', cat: 'Service', risk: 'medium', cc: 9 },
    { path: 'src/services/graphBuilder.js', cat: 'Service', risk: 'high', cc: 17 },
    { path: 'src/utils/jwt.util.js', cat: 'Utils', risk: 'low', cc: 5 },
    { path: 'src/utils/cloneRepo.js', cat: 'Utils', risk: 'medium', cc: 10 },
    { path: 'src/middleware/rateLimit.js', cat: 'Middleware', risk: 'high', cc: 14 },
  ],
  // Sample code for Monaco-like display
  sampleCode: `import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { AppError } from '../utils/errors.js';

// Sign up a new user, hash password, return JWT
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw new AppError('Missing required fields', 400);
    }

    const existing = await User.findOne({ email });
    if (existing) throw new AppError('Email already in use', 409);

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hash });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
};`,
  routes: [
    { group: 'auth', endpoints: [
      { method: 'POST', path: '/api/auth/signup', desc: 'Create a new user account', src: 'src/routes/auth.routes.js', mw: ['authLimiter'] },
      { method: 'POST', path: '/api/auth/login', desc: 'Authenticate and return JWT token', src: 'src/routes/auth.routes.js', mw: ['authLimiter'] },
      { method: 'POST', path: '/api/auth/refresh', desc: 'Refresh an existing JWT token', src: 'src/routes/auth.routes.js', mw: ['requireAuth'] },
      { method: 'GET',  path: '/api/auth/me', desc: 'Get current authenticated user', src: 'src/routes/auth.routes.js', mw: ['requireAuth'] },
    ]},
    { group: 'repo', endpoints: [
      { method: 'POST',   path: '/api/repo/import', desc: 'Import a new GitHub repository', src: 'src/routes/repo.routes.js', mw: ['requireAuth', 'aiLimiter'] },
      { method: 'GET',    path: '/api/repo/:id', desc: 'Get repository details and stats', src: 'src/routes/repo.routes.js', mw: ['requireAuth'] },
      { method: 'GET',    path: '/api/repo/:id/graph', desc: 'Fetch dependency graph as JSON', src: 'src/routes/repo.routes.js', mw: ['requireAuth'] },
      { method: 'GET',    path: '/api/repo/:id/files', desc: 'List analyzed files in repo', src: 'src/routes/repo.routes.js', mw: ['requireAuth'] },
      { method: 'DELETE', path: '/api/repo/:id', desc: 'Delete repository and all analyses', src: 'src/routes/repo.routes.js', mw: ['requireAuth'] },
    ]},
    { group: 'ai', endpoints: [
      { method: 'POST', path: '/api/ai/explain', desc: 'Generate AI explanation for a file', src: 'src/routes/ai.routes.js', mw: ['requireAuth', 'aiLimiter'] },
      { method: 'POST', path: '/api/ai/search', desc: 'Semantic search via vector embeddings', src: 'src/routes/ai.routes.js', mw: ['requireAuth'] },
      { method: 'POST', path: '/api/ai/pr-review', desc: 'Run AI code review on a PR', src: 'src/routes/ai.routes.js', mw: ['requireAuth', 'aiLimiter'] },
      { method: 'PATCH', path: '/api/ai/cache', desc: 'Invalidate cached AI analysis', src: 'src/routes/ai.routes.js', mw: ['requireAuth'] },
    ]},
  ],
  team: [
    { id: 1, name: 'Alex Morgan', email: 'alex@codeatlas.ai', role: 'owner', avatar: 'AM', joined: '3 months ago' },
    { id: 2, name: 'Priya Shah', email: 'priya@codeatlas.ai', role: 'editor', avatar: 'PS', joined: '2 months ago' },
    { id: 3, name: 'Marcus Lee', email: 'marcus@codeatlas.ai', role: 'editor', avatar: 'ML', joined: '6 weeks ago' },
    { id: 4, name: 'Sasha Volkov', email: 'sasha@codeatlas.ai', role: 'viewer', avatar: 'SV', joined: '2 weeks ago' },
  ],
  pending: [
    { email: 'jordan.kim@example.com', role: 'viewer' },
  ],
  prResult: {
    title: 'feat(auth): add rate-limited refresh-token endpoint',
    author: 'priya-shah',
    repo: 'codeatlas/api',
    verdict: 'Needs Changes',
    score: 78,
    summary: 'Solid implementation overall. The refresh-token flow is correctly scoped, but the rate-limit key collides with the global limiter, and the JWT secret fallback should be removed before merge. Coverage on the new branch is also low.',
    counts: { security: 2, bugs: 3, style: 5, positives: 4 },
  },
  usage30: [3,5,2,8,12,9,14,11,18,22,16,20,15,12,9,11,14,17,21,19,24,28,22,18,25,30,27,33,29,31],
};
window.MockData = MockData;
