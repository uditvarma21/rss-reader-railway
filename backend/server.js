require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const mongoose = require('mongoose');

const feedsRouter   = require('./routes/feeds');
const itemsRouter   = require('./routes/items');
const cleanupRouter = require('./routes/cleanup');

const app  = express();
const PORT = process.env.PORT;

// ── MongoDB ───────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('❌  MONGODB_URI not set.');
  process.exit(1);
}
mongoose
  .connect(MONGO_URI, { dbName: 'rss-reader', serverSelectionTimeoutMS: 10000 })
  .then(() => console.log('✅  MongoDB connected'))
  .catch(err => { console.error('❌  MongoDB failed:', err.message); process.exit(1); });

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Static files — multiple path fallbacks ────────────────────────────────
const possibleStatic = [
  path.join(__dirname, 'public'),
  path.join(__dirname, '../frontend'),
  path.join(__dirname, '../public'),
];
const staticDir = possibleStatic.find(p => fs.existsSync(p));
if (staticDir) {
  app.use(express.static(staticDir));
  console.log(`📁  Serving static from: ${staticDir}`);
} else {
  console.warn('⚠️  No static directory found — frontend will not be served');
}

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/feeds', feedsRouter);
app.use('/api/items', itemsRouter);
app.use('/api',       cleanupRouter);

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── SPA fallback — same path fallbacks ───────────────────────────────────
app.get('*', (_req, res) => {
  const indexFile = possibleStatic
    .map(p => path.join(p, 'index.html'))
    .find(p => fs.existsSync(p));
  if (indexFile) return res.sendFile(indexFile);
  res.status(404).send('Frontend not found. Ensure backend/public/ exists.');
});

app.listen(PORT, () => console.log(`🚀  RSS Reader on port ${PORT}`));
