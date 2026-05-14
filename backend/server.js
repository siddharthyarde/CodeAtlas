// CodeAtlas AI — Express server entry point
// Phase 1 will implement: MongoDB connection, middleware, routes, Socket.io
require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CodeAtlas AI backend running', phase: 0 });
});

app.listen(PORT, () => {
  console.log(`CodeAtlas AI backend running on port ${PORT}`);
});
