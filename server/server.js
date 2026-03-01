const express = require('express');
const path = require('path');
const { initDb } = require('./database');

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;

// CORS only in dev (in prod, React is served from the same origin)
if (!isProd) {
  const cors = require('cors');
  app.use(cors({ origin: 'http://localhost:5173' }));
}

app.use(express.json());

// Serve React build in production
if (isProd) {
  app.use(express.static(path.join(__dirname, 'public')));
}

// API routes
app.use('/api/monthly', require('./routes/monthly'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/emis', require('./routes/emis'));
app.use('/api/receivables', require('./routes/receivables'));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// SPA fallback in production (must come after API routes)
if (isProd) {
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
}

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Finance Tracker API running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialise database:', err);
    process.exit(1);
  });
