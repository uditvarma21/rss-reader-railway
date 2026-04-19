const Parser  = require('rss-parser');
const cheerio = require('cheerio');
const {
  getAllFeeds,
  updateFeedLastFetched,
  itemExistsByUrl,
  addItem,
} = require('./dbService');

const parser = new Parser({
  customFields: {
    item: [
      ['media:content',   'mediaContent',   { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure',       'enclosure'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
  timeout: 10000,
});

// ── Image extraction (4-step priority) ───────────────────────────────────
function extractImage(item) {
  if (item.mediaContent?.['$']?.url)   return item.mediaContent['$'].url;
  if (item.mediaThumbnail?.['$']?.url) return item.mediaThumbnail['$'].url;
  if (item.enclosure?.url) {
    const type = item.enclosure.type || '';
    if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)/i.test(item.enclosure.url))
      return item.enclosure.url;
  }
  const html = item.contentEncoded || item.content || '';
  if (html) {
    const $   = cheerio.load(html);
    const src = $('img').first().attr('src');
    if (src && src.startsWith('http')) return src;
  }
  return null;
}

function extractDescription(item) {
  const raw = item.contentSnippet || item.summary || item.content || '';
  return raw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 300);
}

function extractFullContent(item) {
  return item.contentEncoded || item.content || item.summary || '';
}

// ── Main fetch ────────────────────────────────────────────────────────────
async function fetchAllFeeds() {
  const feeds = await getAllFeeds();
  let totalAdded = 0;

  for (const feed of feeds) {
    try {
      console.log(`Fetching: ${feed.url}`);
      const parsed = await parser.parseURL(feed.url);

      for (const entry of parsed.items) {
        const originalUrl = entry.link || entry.guid;
        if (!originalUrl) continue;
        if (await itemExistsByUrl(originalUrl)) continue;

        await addItem({
          feedId:      String(feed._id),   // use raw _id — your fix preserved
          feedTitle:   feed.title || parsed.title || 'Unknown Feed',
          title:       entry.title || 'Untitled',
          description: extractDescription(entry),
          fullContent: extractFullContent(entry),
          imageUrl:    extractImage(entry),
          originalUrl,
          publishedAt: entry.pubDate ? new Date(entry.pubDate) : new Date(),
        });
        totalAdded++;
      }

      await updateFeedLastFetched(feed._id);
    } catch (err) {
      console.error(`Failed fetching ${feed.url}:`, err.message);
    }
  }

  return totalAdded;
}

module.exports = { fetchAllFeeds };
