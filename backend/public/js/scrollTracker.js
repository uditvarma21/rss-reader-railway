const ScrollTracker = (() => {
  const markedSet = new Set();
  const timers    = new Map();
  let observer    = null;

  function init() {
    if (observer) { observer.disconnect(); timers.forEach(t => clearTimeout(t)); timers.clear(); }
    observer = new IntersectionObserver(onIntersect, { root: null, rootMargin: '0px', threshold: 0.8 });
  }

  function observe(cardEl, itemId) {
    if (markedSet.has(itemId)) return;
    cardEl.dataset.itemId = itemId;
    observer.observe(cardEl);
  }

  function onIntersect(entries) {
    entries.forEach(entry => {
      const id = entry.target.dataset.itemId;
      if (!id || markedSet.has(id)) return;
      if (entry.isIntersecting) {
        if (!timers.has(id)) {
          const t = setTimeout(() => { timers.delete(id); markAsRead(id, entry.target); }, 1000);
          timers.set(id, t);
        }
      } else {
        const t = timers.get(id);
        if (t) { clearTimeout(t); timers.delete(id); }
      }
    });
  }

  function markAsRead(id, el) {
    if (markedSet.has(id)) return;
    markedSet.add(id);
    el.classList.add('is-read');
    State.updateItem(id, { isRead: true, readAt: new Date().toISOString() });
    API.markRead(id).catch(err => console.warn('markRead failed:', err));
  }

  return { init, observe };
})();
