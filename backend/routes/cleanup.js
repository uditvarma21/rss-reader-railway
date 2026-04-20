const express = require('express');
const router  = express.Router();
const { deleteOldReadUnsavedItems } = require('../services/dbService');
const { fetchAllFeeds }             = require('../services/rssService');
const Feed                          = require('../models/Feed');
const Item                          = require('../models/Item');

function requireToken(req, res, next) {
  const secret = process.env.SYSTEM_SECRET;
  if (!secret) return next();
  const auth = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (auth === secret) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

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

router.post('/cleanup', requireToken, async (req, res) => {
  try {
    // Get all pinned feed IDs
    const pinnedFeeds = await Feed.find({ isPinned: true }).select('_id');
    const pinnedFeedIds = pinnedFeeds.map(f => String(f._id));

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Item.deleteMany({
      isRead:  true,
      isSaved: false,
      readAt:  { $lt: cutoff },
      feedId:  { $nin: pinnedFeedIds },
    });

    console.log(`cleanup: deleted ${result.deletedCount} items`);
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

module.exports = router;
