require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const compression = require('compression');
const connectDB = require('./src/config/db');
const errorMiddleware = require('./src/middleware/error.middleware');
const { generalLimiter } = require('./src/middleware/rateLimit.middleware');
const { initSocket } = require('./src/sockets/repoProgress.socket');

// Route imports
const authRoutes = require('./src/routes/auth.routes');
const repoRoutes = require('./src/routes/repo.routes');
const usageRoutes = require('./src/routes/usage.routes');
const teamRoutes = require('./src/routes/team.routes');
const aiRoutes = require('./src/routes/ai.routes');
const complexityRoutes = require('./src/routes/complexity.routes');
const docsRoutes = require('./src/routes/docs.routes');
const prRoutes = require('./src/routes/pr.routes');

// Start the BullMQ worker (registers itself on import)
require('./src/queues/repoProcessor');

const app = express();
const server = http.createServer(app);

// ─── Security & Logging ────────────────────────────────────────────────────────
app.use(compression());
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// 30-second hard timeout on all requests
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(503).json({ success: false, error: 'Request timeout' });
  });
  next();
});

// ─── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

// ─── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
app.use(generalLimiter);

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/repo', repoRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/complexity', complexityRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/pr', prRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV },
  });
});

// 404 for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorMiddleware);

// ─── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});
initSocket(io);
app.set('io', io);

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 CodeAtlas AI backend running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}

start();
