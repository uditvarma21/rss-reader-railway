const express = require('express');
const router  = express.Router();
const {
  getAllItemsShuffled, getItemById,
  markItemRead, toggleItemSaved, deleteItem,
} = require('../services/dbService');

router.get('/', async (req, res) => {
  try {
    const items = await getAllItemsShuffled();
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get items' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await getItemById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get item' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    await markItemRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

router.patch('/:id/save', async (req, res) => {
  try {
    const isSaved = await toggleItemSaved(req.params.id);
    res.json({ success: true, isSaved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle save' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteItem(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
