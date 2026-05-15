const jwt = require('jsonwebtoken');

let ioInstance;

/**
 * Initialise Socket.io with JWT authentication.
 * Call this once from server.js, passing the io instance.
 * @param {import('socket.io').Server} io
 */
function initSocket(io) {
  ioInstance = io;

  // Authenticate every socket connection via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join a private room keyed by userId so we can target this user precisely
    socket.join(`user:${socket.userId}`);
    console.log(`🔌 Socket connected: ${socket.id} (user ${socket.userId})`);
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
}

/**
 * Emit repo processing progress to a specific user.
 * @param {string} userId
 * @param {object} payload - { step, message, status, repo? }
 */
function emitProgress(userId, payload) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit('repo:progress', payload);
}

module.exports = { initSocket, emitProgress };
