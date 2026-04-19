const Router = (() => {
  let currentPage = null;
  let currentId   = null;

  // Only page-nav buttons — excludes #btn-nav-refresh
  const navBtns = document.querySelectorAll('.nav-btn[data-page]');

  function go(page, id) {
    window.location.hash = id ? `#${page}/${id}` : `#${page}`;
  }

  function handleHash() {
    const hash = window.location.hash.replace('#', '') || 'home';
    const [page, id] = hash.split('/');
    navigate(page, id);
  }

  function navigate(page, id) {
    if (currentPage === 'home')    FeedPage.unmount();
    if (currentPage === 'article') ArticlePage.unmount();
    if (currentPage === 'add')     AddFeedPage.unmount();

    currentPage = page;
    currentId   = id || null;

    if (page === 'home')         { FeedPage.mount();       setActiveNav('home'); }
    else if (page === 'article') { ArticlePage.mount(id);  setActiveNav(null); }
    else if (page === 'add')     { AddFeedPage.mount();    setActiveNav('add'); }
    else                         { go('home'); }
  }

  function setActiveNav(page) {
    navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.page === page));
  }

  // Page-nav clicks
  navBtns.forEach(btn => btn.addEventListener('click', () => go(btn.dataset.page)));

  // Refresh button
  const refreshBtn = document.getElementById('btn-nav-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      if (refreshBtn.classList.contains('is-refreshing')) return;

      refreshBtn.classList.add('is-refreshing');
      const label = refreshBtn.querySelector('span');
      label.textContent = 'Updating…';

      try {
        const result = await API.refresh();
        const added  = result.added ?? 0;
        showToast(added > 0
          ? `✅ ${added} new item${added === 1 ? '' : 's'} added`
          : '✅ All feeds up to date');
        if (currentPage === 'home') { State.clearScroll(); await FeedPage.mount(true); }
      } catch (err) {
        showToast('⚠️ Could not fetch new items');
        console.error('Refresh failed:', err);
      } finally {
        refreshBtn.classList.remove('is-refreshing');
        label.textContent = 'Refresh';
      }
    });
  }

  window.addEventListener('hashchange', handleHash);
  handleHash();

  return { go };
})();
