const Feed = require('../models/Feed');
const Item = require('../models/Item');

// ── Feeds ──────────────────────────────────────────────────────────────────

async function getAllFeeds() {
  return Feed.find({}).sort({ addedAt: 1 }).lean();
}

async function getFeedById(id) {
  return Feed.findById(id).lean();
}

async function addFeed(feedData) {
  const feed = await Feed.create(feedData);
  return feed.toObject();
}

async function updateFeedLastFetched(id) {
  await Feed.findByIdAndUpdate(id, { lastFetched: new Date() });
}

async function deleteFeed(id) {
  await Feed.findByIdAndDelete(id);
  await Item.deleteMany({ feedId: String(id) });
}

async function toggleFeedPin(id, isPinned) {
  await Feed.findByIdAndUpdate(id, { isPinned });
}

// ── Items ──────────────────────────────────────────────────────────────────

async function itemExistsByUrl(originalUrl) {
  const count = await Item.countDocuments({ originalUrl });
  return count > 0;
}

async function addItem(itemData) {
  const item = await Item.create(itemData);
  return String(item._id);
}

async function getAllItemsShuffled() {
  await Item.updateMany(
    { isRead: false },
    [{ $set: { displayOrder: { $rand: {} } } }]
  );

  const pinnedFeeds = await Feed.find({ isPinned: true }).select('_id');
  const pinnedFeedIds = pinnedFeeds.map(f => String(f._id));

  const items = await Item.find({
    $or: [
      { isRead: false },
      { feedId: { $in: pinnedFeedIds } },
    ]
  }).lean();

  items.forEach(item => {
    item.id = String(item._id);
    delete item._id;
  });

  items.sort((a, b) => {
    const getGroup = (item) => {
      if (!item.isRead) return 0;
      if (pinnedFeedIds.includes(item.feedId)) return 1;
      return 2;
    };
    const ag = getGroup(a);
    const bg = getGroup(b);
    if (ag !== bg) return ag - bg;
    return a.displayOrder - b.displayOrder;
  });

  return items;
}

async function getItemById(id) {
  const item = await Item.findById(id).lean();
  if (!item) return null;
  item.id = String(item._id);
  delete item._id;
  return item;
}

async function markItemRead(id) {
  await Item.findByIdAndUpdate(id, { isRead: true, readAt: new Date() });
}

async function toggleItemSaved(id) {
  const item = await Item.findById(id);
  if (!item) throw new Error('Item not found');
  item.isSaved = !item.isSaved;
  await item.save();
  return item.isSaved;
}

async function deleteItem(id) {
  await Item.findByIdAndDelete(id);
}

async function deleteOldReadUnsavedItems() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await Item.deleteMany({
    isRead:  true,
    isSaved: false,
    readAt:  { $lt: cutoff },
  });
  return result.deletedCount;
}

module.exports = {
  getAllFeeds, getFeedById, addFeed, updateFeedLastFetched, deleteFeed,
  toggleFeedPin, itemExistsByUrl, addItem, getAllItemsShuffled, getItemById,
  markItemRead, toggleItemSaved, deleteItem, deleteOldReadUnsavedItems,
};
