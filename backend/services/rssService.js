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
      ['media:group',     'mediaGroup',     { keepArray: false }],
      ['enclosure',       'enclosure'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
  timeout: 10000,
});

function extractYoutubeId(url) {
  if (!url) return null;
  // Standard: youtube.com/watch?v=ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  // Shorts: youtube.com/shorts/ID
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];
  // Short URL: youtu.be/ID
  const shortUrlMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortUrlMatch) return shortUrlMatch[1];
  return null;
}
// ── Image extraction (4-step priority) ───────────────────────────────────
function extractImage(item) {
  // 1. media:content direct
  if (item.mediaContent?.['$']?.url) return item.mediaContent['$'].url;

  // 2. media:thumbnail direct
  if (item.mediaThumbnail?.['$']?.url) return item.mediaThumbnail['$'].url;

  // 3. YouTube wraps inside media:group
  if (item.mediaGroup) {
    const group = item.mediaGroup;
    if (group['media:thumbnail']?.[0]?.['$']?.url)
      return group['media:thumbnail'][0]['$'].url;
    if (group['media:content']?.[0]?.['$']?.url)
      return group['media:content'][0]['$'].url;
  }

  // 4. enclosure
  if (item.enclosure?.url) {
    const type = item.enclosure.type || '';
    if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)/i.test(item.enclosure.url))
      return item.enclosure.url;
  }

  // 5. first <img> in content HTML
  const html = item.contentEncoded || item.content || '';
  if (html) {
    const $ = cheerio.load(html);
    const src = $('img').first().attr('src');
    if (src && src.startsWith('http')) return src;
  }

  // 6. YouTube video ID fallback
  const ytMatch = (item.link || item.guid || '').match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;

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
youtubeId: extractYoutubeId(entry.link || entry.guid || ''),
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
