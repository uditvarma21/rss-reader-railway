const express = require('express');
const router  = express.Router();
const { getAllFeeds, addFeed, deleteFeed, getFeedById, toggleFeedPin } = require('../services/dbService');
const { fetchAllFeeds } = require('../services/rssService');

// GET /api/feeds
router.get('/', async (req, res) => {
  try {
    const rawFeeds = await getAllFeeds();
    // Normalise _id → id for the frontend
    const feeds = rawFeeds.map(f => ({
      ...f,
      id:  String(f._id),
      _id: undefined,
    }));
    res.json({ feeds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get feeds' });
  }
});

// POST /api/feeds
router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url || !/^https?:\/\//i.test(url))
    return res.status(400).json({ error: 'Invalid URL — must start with http:// or https://' });

  try {
    const Parser = require('rss-parser');
    const parser = new Parser({ timeout: 10000 });
    let feedTitle = 'Unknown Feed';
    try {
      const parsed = await parser.parseURL(url);
      feedTitle = parsed.title || feedTitle;
    } catch (_) { /* not a showstopper */ }

    const feed = await addFeed({ url, title: feedTitle });
    // Kick off initial fetch in background — don't block the response
    fetchAllFeeds().catch(err => console.warn('Initial fetch failed:', err.message));

    res.status(201).json({
      feed: { ...feed, id: String(feed._id), _id: undefined },
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ error: 'This feed URL is already subscribed.' });
    console.error(err);
    res.status(500).json({ error: 'Failed to add feed' });
  }
});

// DELETE /api/feeds/:id — your ID validation preserved
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // Guard: reject obviously bad IDs before hitting MongoDB
  if (!id || id === 'undefined' || id === 'null' || id.length < 10) {
    return res.status(400).json({ error: 'Invalid feed ID' });
  }

  try {
    await deleteFeed(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete feed' });
  }
});

router.patch('/:id/pin', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'Invalid feed ID' });
    }
    const feed = await getFeedById(id);
    if (!feed) return res.status(404).json({ error: 'Feed not found' });
    await toggleFeedPin(id, !feed.isPinned);
    res.json({ success: true, isPinned: !feed.isPinned });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle pin' });
  }
});

module.exports = router;
