const State = (() => {
  const SCROLL_KEY = 'feedScrollY';
  let _items = [];

  return {
    setItems(items)       { _items = items; },
    getItems()            { return _items; },
    getItem(id)           { return _items.find(i => i.id === id) || null; },
    updateItem(id, patch) {
      const idx = _items.findIndex(i => i.id === id);
      if (idx !== -1) Object.assign(_items[idx], patch);
    },
    saveScroll()  { sessionStorage.setItem(SCROLL_KEY, String(window.scrollY)); },
    loadScroll()  { return parseFloat(sessionStorage.getItem(SCROLL_KEY) || '0'); },
    clearScroll() { sessionStorage.removeItem(SCROLL_KEY); },
  };
})();
