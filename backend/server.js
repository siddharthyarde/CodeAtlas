require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const errorMiddleware = require('./src/middleware/error.middleware');
const { generalLimiter } = require('./src/middleware/rateLimit.middleware');

// Route imports
const authRoutes = require('./src/routes/auth.routes');
// Phase 3+ routes imported here as they are built
// const repoRoutes = require('./src/routes/repo.routes');
// const aiRoutes   = require('./src/routes/ai.routes');

const app = express();
const server = http.createServer(app);

// ─── Security & Logging ───────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting (global) ───────────────────────────────────────────────────
app.use(generalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
  });
});

// 404 for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorMiddleware);

// ─── Socket.io (stub — Phase 3 wires up repoProgress.socket.js) ──────────────
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`🔌 Socket disconnected: ${socket.id}`));
});
// Make io accessible to other modules in Phase 3
app.set('io', io);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 CodeAtlas AI backend running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}

start();
