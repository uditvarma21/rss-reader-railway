const API = (() => {
  const base = '/api';

  async function request(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(base + path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  return {
    // Feeds
    getFeeds:   ()    => request('GET',    '/feeds'),
    addFeed:    (url) => request('POST',   '/feeds', { url }),
    deleteFeed: (id)  => request('DELETE', `/feeds/${id}`),

    // Items
    getItems:   ()    => request('GET',    '/items'),
    getItem:    (id)  => request('GET',    `/items/${id}`),
    markRead:   (id)  => request('PATCH',  `/items/${id}/read`),
    toggleSave: (id)  => request('PATCH',  `/items/${id}/save`),
    deleteItem: (id)  => request('DELETE', `/items/${id}`),

    // Saved archive
    getSaved: () => request('GET', '/items/saved'),
    // System
    fetchAll: () => request('POST', '/fetch-all'), // cron-job.org (needs SYSTEM_SECRET header)
    refresh:  () => request('POST', '/refresh'),   // nav button (no auth needed)
  };
})();
