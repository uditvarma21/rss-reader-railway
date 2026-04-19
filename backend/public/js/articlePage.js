const ArticlePage = (() => {
  const page = document.getElementById('page-article');

  function sanitizeContent(html) {
    if (!html) return '';
    if (!/<[a-z]/i.test(html))
      return html.split(/\n\n+/).map(p => `<p>${escapeHtml(p.trim())}</p>`).join('');
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<iframe(?![^>]*youtube)[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  }

  function render(item) {
    const hasImage = !!item.imageUrl;
    page.classList.toggle('no-hero', !hasImage);

    page.innerHTML = `
      <button id="btn-back" aria-label="Go back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>
      ${hasImage ? `
        <div id="article-hero">
          <img src="${escapeAttr(item.imageUrl)}" alt="${escapeAttr(item.title)}"
            onerror="this.parentElement.style.display='none'; document.getElementById('page-article').classList.add('no-hero');" />
        </div>` : ''}
      <div id="article-body">
        <div id="article-source">${escapeHtml(item.feedTitle)}</div>
        <h1 id="article-title">${escapeHtml(item.title)}</h1>
        ${item.youtubeId ? `
        <div id="youtube-player">
          <iframe
            src="https://www.youtube.com/embed/${item.youtubeId}${item.originalUrl && item.originalUrl.includes('/shorts/') ? '?loop=1' : ''}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        </div>` : ''}
        <div id="article-content">${sanitizeContent(item.fullContent || item.description || '')}</div>
        <div id="article-actions">
          <a id="btn-open-original" href="${escapeAttr(item.originalUrl)}" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Read on site
          </a>
          <button id="btn-article-save" class="${item.isSaved ? 'saved' : ''}" data-id="${item.id}">
            <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round"
                 fill="${item.isSaved ? 'var(--saved-color)' : 'none'}">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            ${item.isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>`;

    document.getElementById('btn-back').addEventListener('click', () => Router.go('home'));

    document.getElementById('btn-article-save').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      try {
        const { isSaved } = await API.toggleSave(item.id);
        State.updateItem(item.id, { isSaved });
        item.isSaved = isSaved;
        btn.classList.toggle('saved', isSaved);
        btn.querySelector('svg').setAttribute('fill', isSaved ? 'var(--saved-color)' : 'none');
        btn.lastChild.textContent = isSaved ? ' Saved' : ' Save';
        showToast(isSaved ? '🔖 Saved!' : 'Removed from saved');
      } catch (_) { showToast('Could not save'); }
    });

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  async function mount(itemId) {
    page.classList.remove('hidden');
    page.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';
    try {
      let item = State.getItem(itemId);
      if (!item) { const data = await API.getItem(itemId); item = data.item; }
      render(item);
    } catch (err) {
      page.innerHTML = `
        <button id="btn-back">← Back</button>
        <div class="empty-state"><h2>Article not found</h2><p>${err.message}</p></div>`;
      document.getElementById('btn-back').addEventListener('click', () => Router.go('home'));
    }
  }

  function unmount() { page.classList.add('hidden'); }

  return { mount, unmount };
})();
