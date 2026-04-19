const FeedPage = (() => {
  const container = document.getElementById('page-feed');
  let scrollListener = null;

  function buildCard(item) {
    const hasImage = !!item.imageUrl;
    const isSaved  = item.isSaved ? 'is-saved' : '';
    const isRead   = item.isRead  ? 'is-read'  : '';
    const saveCls  = item.isSaved ? 'btn-save saved' : 'btn-save';

    const saveIcon = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" fill="${item.isSaved ? 'var(--saved-color)' : 'none'}">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>`;

    if (hasImage) {
      return `
        <article class="feed-card has-image ${isSaved} ${isRead}" data-id="${item.id}">
          <div class="card-badge-saved">Saved</div>
          <div class="card-image-wrap">
            <img src="${escapeAttr(item.imageUrl)}" alt="${escapeAttr(item.title)}" loading="lazy"
              onerror="this.closest('.feed-card').classList.remove('has-image'); this.closest('.feed-card').classList.add('no-image'); this.closest('.card-image-wrap').remove();" />
            <div class="card-source-over">${escapeHtml(item.feedTitle)}</div>
          </div>
          <div class="card-body">
            <div class="card-title">${escapeHtml(item.title)}</div>
            <div class="card-desc">${escapeHtml(item.description || '')}</div>
          </div>
          <div class="card-actions">
            <button class="btn-read-more" data-id="${item.id}" data-action="read-more">Read More →</button>
            <button class="${saveCls}" data-id="${item.id}" data-action="save">${saveIcon}${item.isSaved ? 'Saved' : 'Save'}</button>
          </div>
        </article>`;
    } else {
      return `
        <article class="feed-card no-image ${isSaved} ${isRead}" data-id="${item.id}">
          <div class="card-badge-saved">Saved</div>
          <div class="card-body">
            <div class="card-source">${escapeHtml(item.feedTitle)}</div>
            <div class="card-title">${escapeHtml(item.title)}</div>
            <div class="card-desc">${escapeHtml(item.description || '')}</div>
          </div>
          <div class="card-actions">
            <button class="btn-read-more" data-id="${item.id}" data-action="read-more">Read More →</button>
            <button class="${saveCls}" data-id="${item.id}" data-action="save">${saveIcon}${item.isSaved ? 'Saved' : 'Save'}</button>
          </div>
        </article>`;
    }
  }

  function renderFeed(items) {
    container.innerHTML = `
      <div id="feed-header"><h1>For You</h1></div>
      <div id="feed-container"></div>
      <button id="btn-refresh">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Shuffle feed
      </button>`;

    const feedContainer = container.querySelector('#feed-container');

    if (!items || items.length === 0) {
      feedContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/>
            <circle cx="5" cy="19" r="1"/>
          </svg>
          <h2>No feed items yet</h2>
          <p>Add an RSS feed URL from the + tab to start reading.</p>
        </div>`;
      return;
    }

    feedContainer.innerHTML = items.map(buildCard).join('');

    ScrollTracker.init();
    feedContainer.querySelectorAll('.feed-card').forEach(card => {
      ScrollTracker.observe(card, card.dataset.id);
    });

    const savedY = State.loadScroll();
    if (savedY > 0) requestAnimationFrame(() => window.scrollTo({ top: savedY, behavior: 'instant' }));
  }

  function onContainerClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id     = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === 'read-more') { State.saveScroll(); Router.go('article', id); }
    else if (action === 'save') handleSave(id, btn);
  }

  async function handleSave(id, btn) {
    try {
      const { isSaved } = await API.toggleSave(id);
      State.updateItem(id, { isSaved });
      const card = container.querySelector(`.feed-card[data-id="${id}"]`);
      if (card) {
        card.classList.toggle('is-saved', isSaved);
        btn.classList.toggle('saved', isSaved);
        btn.querySelector('svg').setAttribute('fill', isSaved ? 'var(--saved-color)' : 'none');
        btn.lastChild.textContent = isSaved ? 'Saved' : 'Save';
      }
      showToast(isSaved ? '🔖 Saved!' : 'Removed from saved');
    } catch (err) { showToast('Could not save item'); }
  }

  async function mount(forceRefresh = false) {
    container.classList.remove('hidden');
    container.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';

    try {
      const { items } = await API.getItems();
      State.setItems(items);
      renderFeed(items);

      const feedContainer = container.querySelector('#feed-container');
      if (feedContainer) feedContainer.addEventListener('click', onContainerClick);

      const refreshBtn = container.querySelector('#btn-refresh');
      if (refreshBtn) refreshBtn.addEventListener('click', async () => { State.clearScroll(); await mount(true); });

      if (scrollListener) window.removeEventListener('scroll', scrollListener);
      scrollListener = () => State.saveScroll();
      window.addEventListener('scroll', scrollListener, { passive: true });
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><h2>Failed to load feed</h2><p>${err.message}</p></div>`;
    }
  }

  function unmount() {
    container.classList.add('hidden');
    if (scrollListener) { window.removeEventListener('scroll', scrollListener); scrollListener = null; }
  }

  return { mount, unmount };
})();

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escapeAttr(str) { return escapeHtml(str || ''); }
function showToast(msg, duration = 2200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}
