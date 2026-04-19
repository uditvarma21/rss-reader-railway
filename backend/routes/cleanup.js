const express = require('express');
const router  = express.Router();
const { deleteOldReadUnsavedItems } = require('../services/dbService');
const { fetchAllFeeds }             = require('../services/rssService');

function requireToken(req, res, next) {
  const secret = process.env.SYSTEM_SECRET;
  if (!secret) return next(); // no secret set → open (local dev)
  const auth = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (auth === secret) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Protected — called by cron-job.org with Authorization header
router.post('/fetch-all', requireToken, async (req, res) => {
  try {
    const count = await fetchAllFeeds();
    console.log(`fetch-all: +${count} new items`);
    res.json({ success: true, added: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// Unprotected — called by the browser Refresh nav button
router.post('/refresh', async (req, res) => {
  try {
    const count = await fetchAllFeeds();
    console.log(`refresh: +${count} new items`);
    res.json({ success: true, added: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Refresh failed' });
  }
});

// Protected — called by cron-job.org daily
router.post('/cleanup', requireToken, async (req, res) => {
  try {
    const count = await deleteOldReadUnsavedItems();
    console.log(`cleanup: deleted ${count} items`);
    res.json({ success: true, deleted: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

module.exports = router;
