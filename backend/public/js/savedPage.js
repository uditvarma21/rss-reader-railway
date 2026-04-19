const SavedPage = (() => {
  const page = document.getElementById('page-saved');
  let allItems = [];

  // ── Filter ────────────────────────────────────────────────────────────────
  function filterItems(query) {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(item =>
      (item.title       || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      (item.feedTitle   || '').toLowerCase().includes(q)
    );
  }

  // ── Build card (same structure as feedPage, unsave instead of save) ───────
  function buildCard(item) {
    const hasImage = !!item.imageUrl;
    const cls      = hasImage ? 'has-image' : 'no-image';

    const saveIcon = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" fill="var(--saved-color)">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>`;

    const actions = `
      <div class="card-actions">
        <button class="btn-read-more" data-id="${item.id}" data-action="read-more">Read More →</button>
        <button class="btn-unsave" data-id="${item.id}" data-action="unsave">
          ${saveIcon} Saved
        </button>
      </div>`;

    if (hasImage) {
      return `
        <article class="feed-card ${cls} is-saved" data-id="${item.id}">
          <div class="card-image-wrap">
            <img src="${escapeAttr(item.imageUrl)}" alt="${escapeAttr(item.title)}" loading="lazy"
              onerror="this.closest('.feed-card').classList.remove('has-image'); this.closest('.feed-card').classList.add('no-image'); this.closest('.card-image-wrap').remove();" />
            <div class="card-source-over">${escapeHtml(item.feedTitle)}</div>
          </div>
          <div class="card-body">
            <div class="card-title">${escapeHtml(item.title)}</div>
            <div class="card-desc">${escapeHtml(item.description || '')}</div>
          </div>
          ${actions}
        </article>`;
    } else {
      return `
        <article class="feed-card ${cls} is-saved" data-id="${item.id}">
          <div class="card-body">
            <div class="card-source">${escapeHtml(item.feedTitle)}</div>
            <div class="card-title">${escapeHtml(item.title)}</div>
            <div class="card-desc">${escapeHtml(item.description || '')}</div>
          </div>
          ${actions}
        </article>`;
    }
  }

  // ── Render filtered results ───────────────────────────────────────────────
  function renderCards(items) {
    const container  = page.querySelector('#saved-container');
    const countEl    = page.querySelector('#saved-count');
    const noResults  = page.querySelector('#saved-no-results');

    countEl.textContent = `${items.length} saved`;

    if (items.length === 0) {
      container.innerHTML = '';
      noResults.style.display = 'flex';
    } else {
      noResults.style.display = 'none';
      container.innerHTML = items.map(buildCard).join('');
    }
  }

  // ── Event delegation ──────────────────────────────────────────────────────
  function onPageClick(e) {
    const btn    = e.target.closest('[data-action]');
    if (!btn) return;
    const id     = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'read-more') {
      State.saveScroll();
      Router.go('article', id);
    } else if (action === 'unsave') {
      handleUnsave(id, btn);
    }
  }

  async function handleUnsave(id, btn) {
    try {
      await API.toggleSave(id);
      // Remove card with a fade
      const card = page.querySelector(`.feed-card[data-id="${id}"]`);
      if (card) {
        card.style.transition = 'opacity 0.3s ease';
        card.style.opacity    = '0';
        setTimeout(() => {
          allItems = allItems.filter(i => i.id !== id);
          const query = page.querySelector('#saved-search')?.value || '';
          renderCards(filterItems(query));
        }, 300);
      }
      showToast('Removed from saved');
    } catch (_) {
      showToast('Could not unsave item');
    }
  }

  // ── Mount / Unmount ───────────────────────────────────────────────────────
  async function mount() {
    page.classList.remove('hidden');

    page.innerHTML = `
      <div id="saved-header">
        <div id="saved-title-row">
          <h1>Saved</h1>
          <span id="saved-count">…</span>
        </div>
        <div id="saved-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input id="saved-search" type="search" placeholder="Search saved articles…"
                 autocomplete="off" spellcheck="false" />
        </div>
      </div>
      <div id="saved-container">
        <div class="loading-wrap"><div class="spinner"></div></div>
      </div>
      <div id="saved-no-results" style="display:none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <p>No saved articles match your search.</p>
      </div>`;

    try {
      const { items } = await API.getSaved();
      allItems = items;
      renderCards(items);
    } catch (err) {
      page.querySelector('#saved-container').innerHTML =
        `<div class="empty-state"><h2>Could not load saved items</h2><p>${err.message}</p></div>`;
    }

    // Wire up search
    const searchInput = page.querySelector('#saved-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        renderCards(filterItems(searchInput.value));
      });
    }

    // Wire up card clicks
    page.addEventListener('click', onPageClick);
  }

  function unmount() {
    page.classList.add('hidden');
    page.removeEventListener('click', onPageClick);
  }

  return { mount, unmount };
})();
