/**
 * Global Express error handler — catches errors passed via next(err).
 * Always returns { success: false, error: message }.
 */
function errorMiddleware(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
  });
}

module.exports = errorMiddleware;
