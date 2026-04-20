const AddFeedPage = (() => {
  const page = document.getElementById('page-add');

  async function loadFeedsList() {
    const section = page.querySelector('.feeds-list-section');
    if (!section) return;
    try {
      const { feeds } = await API.getFeeds();
      if (!feeds || feeds.length === 0) { section.innerHTML = ''; return; }
      section.innerHTML = `
        <div class="feeds-list-title">Subscribed feeds</div>
        <div class="feeds-list">
          ${feeds.map(f => `
            <div class="feed-list-item" data-id="${f.id}">
              <div class="feed-list-item-info">
                <span class="feed-list-item-title">${escapeHtml(f.title || 'Untitled')}</span>
                <span class="feed-list-item-url">${escapeHtml(f.url)}</span>
              </div>
              <div class="feed-list-item-actions">
                <button class="btn-pin-feed ${f.isPinned ? 'pinned' : ''}"
                  data-id="${f.id}" data-action="pin-feed"
                  title="${f.isPinned ? 'Unpin feed' : 'Pin feed'}">
                  📌
                </button>
                <button class="btn-delete-feed" data-id="${f.id}" data-action="delete-feed">Remove</button>
              </div>
            </div>`).join('')}
        </div>`;

      section.querySelectorAll('[data-action="delete-feed"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Remove this feed and all its items?')) return;
          try {
            await API.deleteFeed(btn.dataset.id);
            showToast('Feed removed');
            loadFeedsList();
          } catch (_) { showToast('Could not remove feed'); }
        });
      });

      section.querySelectorAll('[data-action="pin-feed"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            const res = await fetch(`/api/feeds/${btn.dataset.id}/pin`, { method: 'PATCH' });
            const data = await res.json();
            btn.classList.toggle('pinned', data.isPinned);
            btn.title = data.isPinned ? 'Unpin feed' : 'Pin feed';
            showToast(data.isPinned ? '📌 Feed pinned — items won\'t be deleted' : 'Feed unpinned');
          } catch (_) { showToast('Could not pin feed'); }
        });
      });

    } catch (err) { console.warn('Could not load feeds list', err); }
  }

  function render() {
    page.innerHTML = `
      <div class="add-feed-card">
        <div class="add-feed-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/>
            <circle cx="5" cy="19" r="1"/>
          </svg>
        </div>
        <div class="add-feed-copy">
          <h2>Add RSS Feed</h2>
          <p>Paste any RSS or Atom feed URL to subscribe.</p>
        </div>
        <form class="add-feed-form" id="add-feed-form" novalidate>
          <input type="url" id="feed-url-input"
            placeholder="https://example.com/feed.xml"
            autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" required />
          <div class="add-feed-error" id="add-feed-error"></div>
          <button type="submit" id="btn-add-feed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Feed
          </button>
        </form>
      </div>
      <div class="feeds-list-section"></div>`;

    const form   = page.querySelector('#add-feed-form');
    const input  = page.querySelector('#feed-url-input');
    const errEl  = page.querySelector('#add-feed-error');
    const addBtn = page.querySelector('#btn-add-feed');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.classList.remove('visible');
      const url = input.value.trim();
      if (!url) { showError('Please enter a URL.'); return; }
      if (!/^https?:\/\//i.test(url)) { showError('URL must start with http:// or https://'); return; }

      addBtn.disabled = true;
      addBtn.textContent = 'Adding…';

      try {
        await API.addFeed(url);
        input.value = '';
        showToast('✅ Feed added! Loading content…');
        loadFeedsList();
      } catch (err) {
        showError(err.message || 'Failed to add feed.');
      } finally {
        addBtn.disabled = false;
        addBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>Add Feed`;
      }
    });

    function showError(msg) { errEl.textContent = msg; errEl.classList.add('visible'); }
    loadFeedsList();
  }

  function mount()   { page.classList.remove('hidden'); render(); }
  function unmount() { page.classList.add('hidden'); }

  return { mount, unmount };
})();        });
      });

      section.querySelectorAll('[data-action="pin-feed"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            const res = await fetch(`/api/feeds/${btn.dataset.id}/pin`, { method: 'PATCH' });
            const data = await res.json();
            btn.classList.toggle('pinned', data.isPinned);
            btn.title = data.isPinned ? 'Unpin feed' : 'Pin feed';
            showToast(data.isPinned ? '📌 Feed pinned — items won\'t be deleted' : 'Feed unpinned');
          } catch (_) { showToast('Could not pin feed'); }
        });
      });
    } catch (err) { console.warn('Could not load feeds list', err); }
  }

  function render() {
    page.innerHTML = `
      <div class="add-feed-card">
        <div class="add-feed-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/>
            <circle cx="5" cy="19" r="1"/>
          </svg>
        </div>
        <div class="add-feed-copy">
          <h2>Add RSS Feed</h2>
          <p>Paste any RSS or Atom feed URL to subscribe.</p>
        </div>
        <form class="add-feed-form" id="add-feed-form" novalidate>
          <input type="url" id="feed-url-input"
            placeholder="https://example.com/feed.xml"
            autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" required />
          <div class="add-feed-error" id="add-feed-error"></div>
          <button type="submit" id="btn-add-feed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Feed
          </button>
        </form>
      </div>
      <div class="feeds-list-section"></div>`;

    const form   = page.querySelector('#add-feed-form');
    const input  = page.querySelector('#feed-url-input');
    const errEl  = page.querySelector('#add-feed-error');
    const addBtn = page.querySelector('#btn-add-feed');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.classList.remove('visible');
      const url = input.value.trim();
      if (!url) { showError('Please enter a URL.'); return; }
      if (!/^https?:\/\//i.test(url)) { showError('URL must start with http:// or https://'); return; }

      addBtn.disabled = true;
      addBtn.textContent = 'Adding…';

      try {
        await API.addFeed(url);
        input.value = '';
        showToast('✅ Feed added! Loading content…');
        loadFeedsList();
      } catch (err) {
        showError(err.message || 'Failed to add feed.');
      } finally {
        addBtn.disabled = false;
        addBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>Add Feed`;
      }
    });

    function showError(msg) { errEl.textContent = msg; errEl.classList.add('visible'); }
    loadFeedsList();
  }

  function mount()   { page.classList.remove('hidden'); render(); }
  function unmount() { page.classList.add('hidden'); }

  return { mount, unmount };
})();
