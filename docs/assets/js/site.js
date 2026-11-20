// GBI prototype — minimal interactions

// Video modal — smooth fade+scale lightbox triggered by any .video-trigger
// element. Reads data-video-src for the iframe URL; if empty, shows a
// "video coming soon" placeholder so the modal mechanism still demos.
(function () {
  const modal = document.querySelector('[data-video-modal]');
  if (!modal) return;
  const frame = modal.querySelector('[data-video-frame]');

  function autoplayUrl(src) {
    // Append autoplay params for Vimeo / YouTube so the video starts on open.
    if (!src) return '';
    const join = src.includes('?') ? '&' : '?';
    if (/vimeo\.com|player\.vimeo\.com/i.test(src)) {
      return src + join + 'autoplay=1&dnt=1';
    }
    if (/youtube\.com|youtu\.be/i.test(src)) {
      return src + join + 'autoplay=1&rel=0';
    }
    return src;
  }

  function open(src) {
    if (!src) return;
    frame.innerHTML = `<iframe src="${autoplayUrl(src)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    modal.hidden = false;
    document.body.classList.add('video-modal-open');
    // Force a reflow so the transition runs (otherwise opacity goes 0→1 instantly).
    void modal.offsetWidth;
    modal.setAttribute('data-open', '');
    modal.setAttribute('aria-hidden', 'false');
  }

  function close() {
    modal.removeAttribute('data-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('video-modal-open');
    // Wait for the fade-out to finish before hiding + clearing the iframe.
    setTimeout(() => {
      modal.hidden = true;
      frame.innerHTML = '';
    }, 320);
  }

  // Open on click of any .video-trigger
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.video-trigger');
    if (trigger) {
      e.preventDefault();
      open(trigger.getAttribute('data-video-src') || '');
      return;
    }
    if (e.target.closest('[data-video-close]')) {
      close();
    }
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.hasAttribute('data-open')) close();
  });
})();


// Animate stats counters on scroll into view
(function () {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length || !('IntersectionObserver' in window)) {
    els.forEach(el => el.textContent = el.dataset.count);
    return;
  }
  const fmt = (n, decimals) => decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString();
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const decimals = (el.dataset.count.split('.')[1] || '').length;
      const dur = 1400;
      const start = performance.now();
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        el.textContent = fmt(target * ease(t), decimals);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = fmt(target, decimals);
      };
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.4 });
  els.forEach(el => obs.observe(el));
})();

// Projects filter UI — dropdowns + multi-select + active-pill chips.
// Multi-select within a category (OR), AND across categories.
(function () {
  const filterPanel = document.querySelector('[data-project-filters]');
  const grid = document.querySelector('[data-gallery-grid], [data-project-grid]');
  if (!filterPanel) return;

  const CATEGORY_LABEL = {
    service: 'Service',
    industry: 'Industry',
    product: 'Product',
    state: 'State',
  };

  function gatherSelections() {
    // Returns {category: [values...]}
    const sel = {};
    filterPanel.querySelectorAll('.filter-dropdown').forEach(dd => {
      const cat = dd.dataset.filter;
      sel[cat] = Array.from(dd.querySelectorAll('input[type="checkbox"]:checked'))
        .map(input => ({
          value: input.dataset.value,
          label: input.parentElement.querySelector('.label').textContent,
        }));
    });
    return sel;
  }

  // Map category key → data-attribute name (data-services is plural, others match)
  const CAT_ATTR = { service: 'services', industry: 'industry', product: 'product', state: 'state' };

  // Does a card satisfy filters in category `cat`? (multi-value dataset supported for service/industry/product)
  function cardMatchesCat(card, cat, selections) {
    const chosen = selections[cat];
    if (!chosen || chosen.length === 0) return true;
    if (cat === 'state') {
      const v = card.dataset.state || '';
      return chosen.some(s => s.value === v);
    }
    const raw = (card.dataset[CAT_ATTR[cat]] || '').split(/\s+/).filter(Boolean);
    return chosen.some(s => raw.includes(s.value));
  }

  // Pagination for gallery: show first BATCH_SIZE tiles initially,
  // reveal BATCH_SIZE more per "Load More" click. Filters bypass pagination
  // (when any filter is active, all matches are shown).
  const BATCH_SIZE = 20;
  let visibleBatch = BATCH_SIZE;

  function applyFilters() {
    const sel = gatherSelections();
    const cards = grid ? Array.from(grid.querySelectorAll('.project-card, .gallery-tile')) : [];
    const anyFilter = Object.values(sel).some(arr => arr && arr.length > 0);

    let totalMatches = 0;
    let shownMatches = 0;
    if (grid) {
      cards.forEach(card => {
        const matches =
          cardMatchesCat(card, 'service', sel) &&
          cardMatchesCat(card, 'industry', sel) &&
          cardMatchesCat(card, 'product', sel) &&
          cardMatchesCat(card, 'state', sel);
        if (!matches) { card.style.display = 'none'; return; }
        totalMatches++;
        // Show all when filtered; otherwise only first N
        if (anyFilter || shownMatches < visibleBatch) {
          card.style.display = '';
          shownMatches++;
        } else {
          card.style.display = 'none';
        }
      });

      const countEl = document.querySelector('.js-count');
      if (countEl) countEl.textContent = totalMatches;
      const noResults = document.querySelector('.js-no-results');
      if (noResults) noResults.style.display = totalMatches === 0 ? 'block' : 'none';
      grid.style.display = totalMatches === 0 ? 'none' : '';

      // Update Load More button
      const loadMoreWrap = document.querySelector('.gallery-load-more-wrap');
      const loadMoreBtn = document.querySelector('[data-load-more]');
      if (loadMoreWrap && loadMoreBtn) {
        const remaining = totalMatches - shownMatches;
        if (anyFilter || remaining <= 0) {
          loadMoreWrap.style.display = 'none';
        } else {
          loadMoreWrap.style.display = '';
          loadMoreBtn.textContent = 'Load More Images (' + remaining + ' remaining)';
        }
      }
    }

    // Faceted counts + hide-zero: for each dropdown, count cards that would remain visible
    // if this dropdown's own filter were removed, then update each option label.
    filterPanel.querySelectorAll('.filter-dropdown').forEach(dd => {
      const cat = dd.dataset.filter;
      const attr = CAT_ATTR[cat];

      // Recompute against "other" filters only
      const optionCounts = {};
      cards.forEach(card => {
        const passesOthers =
          (cat === 'service'  || cardMatchesCat(card, 'service',  sel)) &&
          (cat === 'industry' || cardMatchesCat(card, 'industry', sel)) &&
          (cat === 'product'  || cardMatchesCat(card, 'product',  sel)) &&
          (cat === 'state'    || cardMatchesCat(card, 'state',    sel));
        if (!passesOthers) return;
        const values = cat === 'state'
          ? [card.dataset.state || '']
          : (card.dataset[attr] || '').split(/\s+/).filter(Boolean);
        values.forEach(v => { if (v) optionCounts[v] = (optionCounts[v] || 0) + 1; });
      });

      dd.querySelectorAll('.filter-option').forEach(opt => {
        const val = opt.dataset.value;
        const count = optionCounts[val] || 0;
        const labelEl = opt.querySelector('.label');
        // append/update count badge
        let countEl = labelEl.querySelector('.option-count');
        if (!countEl) {
          countEl = document.createElement('span');
          countEl.className = 'option-count';
          labelEl.appendChild(countEl);
        }
        countEl.textContent = count > 0 ? ' (' + count + ')' : '';
        // hide zero-count options unless currently selected
        const isChecked = opt.querySelector('input[type="checkbox"]').checked;
        opt.style.display = (count === 0 && !isChecked) ? 'none' : '';
      });

      // Existing "N selected" badge on the dropdown button
      const selCount = sel[cat].length;
      dd.classList.toggle('is-active', selCount > 0);
      const countBadge = dd.querySelector('.filter-count');
      if (countBadge) countBadge.textContent = selCount > 0 ? '(' + selCount + ')' : '';
    });

    // Render active pills
    const pillsContainer = filterPanel.querySelector('[data-active-pills]');
    const clearAllBtn = filterPanel.querySelector('[data-clear-all]');
    const totalSelected = Object.values(sel).reduce((sum, arr) => sum + arr.length, 0);
    if (pillsContainer) {
      pillsContainer.innerHTML = '';
      Object.entries(sel).forEach(([cat, items]) => {
        items.forEach(item => {
          const pill = document.createElement('span');
          pill.className = 'filter-pill';
          pill.innerHTML =
            `<span class="filter-pill-cat">${CATEGORY_LABEL[cat]}</span>` +
            `<span>${item.label}</span>` +
            `<button type="button" class="filter-pill-x" aria-label="Remove ${item.label} filter" ` +
            `data-cat="${cat}" data-value="${item.value}">×</button>`;
          pillsContainer.appendChild(pill);
        });
      });
      pillsContainer.hidden = totalSelected === 0;
    }
    if (clearAllBtn) clearAllBtn.hidden = totalSelected === 0;
  }

  // Open/close dropdowns
  filterPanel.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-dropdown-btn');
    if (btn) {
      const dd = btn.closest('.filter-dropdown');
      const wasOpen = dd.classList.contains('is-open');
      // Close all others
      filterPanel.querySelectorAll('.filter-dropdown.is-open').forEach(d => {
        d.classList.remove('is-open');
        d.querySelector('.filter-dropdown-btn')?.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        dd.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
      return;
    }
    // Click on a filter-option toggles its checkbox
    const opt = e.target.closest('.filter-option');
    if (opt) {
      const cb = opt.querySelector('input[type="checkbox"]');
      // Native checkbox toggling handles itself if user clicks the input directly;
      // if they clicked the label area, the browser also toggles via the label semantic.
      // We only need to recompute filters after change.
      // Defer so the checked state is updated by the browser first.
      setTimeout(applyFilters, 0);
      return;
    }
    // Pill × button
    const x = e.target.closest('.filter-pill-x');
    if (x) {
      const { cat, value } = x.dataset;
      const cb = filterPanel.querySelector(`.filter-dropdown[data-filter="${cat}"] input[data-value="${value}"]`);
      if (cb) {
        cb.checked = false;
        applyFilters();
      }
      return;
    }
    // Clear all
    if (e.target.closest('[data-clear-all]')) {
      filterPanel.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      filterPanel.querySelectorAll('.filter-dropdown.is-open').forEach(d => d.classList.remove('is-open'));
      applyFilters();
      return;
    }
  });

  // Close any open dropdown when click isn't on the dropdown itself (its button or menu).
  // This means clicking on project cards, the pill row, whitespace, or anywhere else
  // closes any open dropdown.
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.filter-dropdown')) {
      filterPanel.querySelectorAll('.filter-dropdown.is-open').forEach(d => {
        d.classList.remove('is-open');
        d.querySelector('.filter-dropdown-btn')?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Escape closes any open dropdown
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      filterPanel.querySelectorAll('.filter-dropdown.is-open').forEach(d => {
        d.classList.remove('is-open');
        d.querySelector('.filter-dropdown-btn')?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Reset button inside no-results state
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-reset-filters]')) {
      filterPanel.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      visibleBatch = BATCH_SIZE;
      applyFilters();
    }
  });

  // Load More button — reveals next batch of gallery tiles
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-load-more]')) {
      visibleBatch += BATCH_SIZE;
      applyFilters();
    }
  });

  // Initial state
  applyFilters();
})();

// Header: compact once the page has scrolled
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  update();
  window.addEventListener('scroll', update, { passive: true });
})();

// Mobile menu — a slide-in sheet built from the desktop nav so the two never drift apart.
(function () {
  const btn = document.querySelector('.nav-mobile');
  const nav = document.querySelector('.primary-nav');
  if (!btn || !nav) return;

  const sheet = document.createElement('div');
  sheet.className = 'm-nav';
  sheet.id = 'm-nav';
  sheet.hidden = true;

  const panel = document.createElement('nav');
  panel.className = 'm-nav-panel';
  panel.setAttribute('aria-label', 'Mobile');

  Array.from(nav.children).forEach((el) => {
    if (el.classList.contains('nav-item')) {
      const parent = el.querySelector('.nav-parent');
      const label = (parent.childNodes[0] ? parent.childNodes[0].textContent : parent.textContent).trim();
      const group = document.createElement('div');
      group.className = 'm-group';
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'm-group-btn';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span></span><i class="m-caret" aria-hidden="true"></i>';
      toggle.firstChild.textContent = label;
      const sub = document.createElement('div');
      sub.className = 'm-sub';
      sub.hidden = true;
      el.querySelectorAll('.nav-dropdown a').forEach((a) => {
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        const strong = a.querySelector('strong');
        link.textContent = (strong ? strong.textContent : a.textContent).trim();
        sub.appendChild(link);
      });
      toggle.addEventListener('click', () => {
        const open = sub.hidden;
        sub.hidden = !open;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        group.classList.toggle('is-open', open);
      });
      group.append(toggle, sub);
      panel.appendChild(group);
    } else if (el.tagName === 'A') {
      const link = document.createElement('a');
      link.className = 'm-link';
      link.href = el.getAttribute('href');
      link.textContent = el.textContent.trim();
      if (el.classList.contains('is-active')) link.setAttribute('aria-current', 'page');
      panel.appendChild(link);
    }
  });

  const foot = document.createElement('div');
  foot.className = 'm-foot';
  foot.innerHTML =
    '<button type="button" class="btn btn-lime" data-drawer-open="project">Start a Project <span class="arr">&rarr;</span></button>' +
    '<a class="m-phone" href="tel:5126432015">(512) 643-2015</a>';
  panel.appendChild(foot);

  const backdrop = document.createElement('div');
  backdrop.className = 'm-nav-backdrop';
  sheet.append(backdrop, panel);
  document.body.appendChild(sheet);

  btn.setAttribute('aria-controls', 'm-nav');
  btn.setAttribute('aria-expanded', 'false');
  if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', 'Menu');

  function open() {
    sheet.hidden = false;
    void sheet.offsetWidth;
    sheet.setAttribute('data-open', '');
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('m-nav-open');
  }
  function close(returnFocus) {
    sheet.removeAttribute('data-open');
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('m-nav-open');
    setTimeout(() => { if (!sheet.hasAttribute('data-open')) sheet.hidden = true; }, 360);
    if (returnFocus) btn.focus();
  }

  btn.addEventListener('click', () => (sheet.hasAttribute('data-open') ? close(false) : open()));
  backdrop.addEventListener('click', () => close(false));
  panel.addEventListener('click', (e) => {
    if (e.target.closest('a, [data-drawer-open]')) close(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet.hasAttribute('data-open')) close(true);
  });
  window.matchMedia('(min-width: 981px)').addEventListener('change', (m) => {
    if (m.matches && sheet.hasAttribute('data-open')) close(false);
  });
})();

// Nav dropdowns (Services / Industries)
// Desktop: hover handles it (CSS-only). This JS adds:
//   - touch-device support (tap parent to open instead of navigating)
//   - keyboard support (Enter on parent toggles)
//   - outside-click and Escape to close
(function () {
  const items = document.querySelectorAll('.nav-item.has-dropdown');
  if (!items.length) return;

  const isTouchOnly = window.matchMedia('(hover: none)').matches;

  function closeAll(except) {
    items.forEach(item => {
      if (item === except) return;
      item.classList.remove('is-open');
      const p = item.querySelector('.nav-parent');
      if (p) p.setAttribute('aria-expanded', 'false');
    });
  }

  items.forEach(item => {
    const parent = item.querySelector('.nav-parent');
    if (!parent) return;
    parent.addEventListener('click', (e) => {
      // If the parent is a button (no href), always toggle.
      // If the parent is a link, on touch-only devices we toggle first
      // and require a second tap to follow the link. On hover-capable
      // devices we let the link navigate normally.
      const isLink = parent.tagName === 'A';
      const shouldToggle = !isLink || isTouchOnly;
      if (shouldToggle) {
        if (!item.classList.contains('is-open')) {
          e.preventDefault();
          closeAll(item);
          item.classList.add('is-open');
          parent.setAttribute('aria-expanded', 'true');
        }
        // Second tap: let it through (navigate)
      }
    });
    parent.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const open = item.classList.toggle('is-open');
        parent.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) closeAll(item);
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item.has-dropdown')) closeAll();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
})();

// Leadership bio expand/collapse
//   Each row of 3 cards shares one bio panel. Clicking + on a card:
//   - fills its name/role/bio into the row's panel
//   - opens the panel
//   - marks that card as active (lime accent)
//   Clicking again on the same card OR the panel's × closes it.
//   Clicking a different card in the same row swaps the content.
//   Clicking a card in a different row closes the previous panel + opens new one.
(function () {
  const cards = document.querySelectorAll('.bio-card');
  if (!cards.length) return;

  function closePanel(panel) {
    if (!panel) return;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    // Reset all cards' open state for cards belonging to this panel's row
    const row = panel.dataset.row;
    document.querySelectorAll(`.bio-card`).forEach((c, idx) => {
      if (Math.floor(idx / 3) === Number(row)) {
        c.classList.remove('is-open');
        const t = c.querySelector('.bio-toggle');
        if (t) t.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function openCard(card) {
    // Locate the panel for this card's row
    const cardList = Array.from(document.querySelectorAll('.bio-card'));
    const idx = cardList.indexOf(card);
    const row = Math.floor(idx / 3);
    const panel = document.querySelector(`.bio-panel[data-row="${row}"]`);
    if (!panel) return;

    // Close any other open panels (in other rows)
    document.querySelectorAll('.bio-panel.is-open').forEach(p => {
      if (p !== panel) closePanel(p);
    });

    // Mark this card as the active one in its row
    cardList.forEach((c, i) => {
      if (Math.floor(i / 3) === row) {
        c.classList.toggle('is-open', c === card);
        const t = c.querySelector('.bio-toggle');
        if (t) t.setAttribute('aria-expanded', c === card ? 'true' : 'false');
      }
    });

    // Populate panel content from data attributes
    panel.querySelector('.js-bio-name').textContent = card.dataset.name || '';
    panel.querySelector('.js-bio-role').textContent = card.dataset.role || '';
    panel.querySelector('.js-bio-text').innerHTML = `<p>${card.dataset.bio || ''}</p>`;

    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
  }

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.bio-toggle');
    if (toggle) {
      const card = toggle.closest('.bio-card');
      if (!card) return;
      if (card.classList.contains('is-open')) {
        // Toggle off
        const cardList = Array.from(document.querySelectorAll('.bio-card'));
        const idx = cardList.indexOf(card);
        const row = Math.floor(idx / 3);
        const panel = document.querySelector(`.bio-panel[data-row="${row}"]`);
        closePanel(panel);
      } else {
        openCard(card);
      }
      return;
    }
    const close = e.target.closest('.bio-panel-close');
    if (close) {
      closePanel(close.closest('.bio-panel'));
    }
  });

  // Escape closes any open panel
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.bio-panel.is-open').forEach(closePanel);
  });
})();

// Photo specs toggle — hides/shows the lime photo-direction chips site-wide.
// Footer button writes localStorage so the choice persists across pages.
(function () {
  const KEY = 'gbi-hide-photo-specs';

  function apply(hidden) {
    document.body.classList.toggle('hide-photo-specs', hidden);
    document.querySelectorAll('.photo-specs-toggle').forEach(btn => {
      btn.textContent = hidden ? 'Photo specs: off' : 'Photo specs: on';
      btn.setAttribute('aria-pressed', hidden ? 'false' : 'true');
    });
  }

  // Apply saved state on load
  const saved = localStorage.getItem(KEY) === '1';
  apply(saved);

  // Wire up clicks
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.photo-specs-toggle');
    if (!btn) return;
    const willHide = !document.body.classList.contains('hide-photo-specs');
    localStorage.setItem(KEY, willHide ? '1' : '0');
    apply(willHide);
  });
})();

// Photo lightbox — click any .cs-gallery image to enlarge; arrows / swipe-free
// prev-next buttons, Esc or backdrop click to close. Built on demand so pages
// without galleries pay nothing.
(function () {
  const imgs = Array.from(document.querySelectorAll('.cs-gallery img'));
  if (!imgs.length) return;
  let box, view, count, idx = 0, lastFocus = null;

  function build() {
    box = document.createElement('div');
    box.className = 'lightbox';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Photo viewer');
    box.innerHTML =
      '<div class="lightbox-backdrop" data-lb-close></div>' +
      '<button type="button" class="lightbox-btn lightbox-close" data-lb-close aria-label="Close photo">&times;</button>' +
      '<button type="button" class="lightbox-btn lightbox-prev" data-lb-prev aria-label="Previous photo">&#8249;</button>' +
      '<figure class="lightbox-fig"><img alt="" /><figcaption></figcaption></figure>' +
      '<button type="button" class="lightbox-btn lightbox-next" data-lb-next aria-label="Next photo">&#8250;</button>';
    document.body.appendChild(box);
    view = box.querySelector('img');
    count = box.querySelector('figcaption');
    box.addEventListener('click', (e) => {
      if (e.target.closest('[data-lb-close]')) close();
      else if (e.target.closest('[data-lb-prev]')) show(idx - 1);
      else if (e.target.closest('[data-lb-next]')) show(idx + 1);
    });
  }

  function show(i) {
    idx = (i + imgs.length) % imgs.length;
    view.src = imgs[idx].currentSrc || imgs[idx].src;
    view.alt = imgs[idx].alt;
    count.textContent = (idx + 1) + ' / ' + imgs.length;
  }

  function open(i) {
    if (!box) build();
    lastFocus = document.activeElement;
    show(i);
    box.hidden = false;
    document.body.classList.add('lightbox-open');
    void box.offsetWidth;
    box.setAttribute('data-open', '');
    box.querySelector('.lightbox-close').focus();
  }

  function close() {
    box.removeAttribute('data-open');
    document.body.classList.remove('lightbox-open');
    setTimeout(() => { box.hidden = true; view.removeAttribute('src'); }, 220);
    if (lastFocus) lastFocus.focus();
  }

  imgs.forEach((img, i) => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Enlarge photo: ' + img.alt);
    img.addEventListener('click', () => open(i));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (!box || box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
})();


// Slide-out drawer: Start a Project + Contact forms.
// Triggers: any [data-drawer-open="project|contact"], or load a page with #start-a-project / #contact-us.
// Submission: with no data-endpoint on the drawer, forms run in preview mode (validate, show a
// confirmation that says nothing was sent). Set data-endpoint in partials/footer.php at go-live.
(function () {
  const root = document.querySelector('[data-drawer-root]');
  if (!root) return;
  const panel = root.querySelector('.drawer-panel');
  const tabs = Array.from(root.querySelectorAll('[data-drawer-tab]'));
  const forms = { project: root.querySelector('#panel-project'), contact: root.querySelector('#panel-contact') };
  const done = root.querySelector('[data-form-done]');
  const title = root.querySelector('#drawer-title');
  const sub = root.querySelector('[data-drawer-sub]');
  const endpoint = root.getAttribute('data-endpoint') || '';
  const preview = !endpoint;
  const copy = {
    project: { t: 'Start a Project', s: 'Tell us about your project. We’ll tell you how we’d build it.' },
    contact: { t: 'Contact Us', s: 'Questions, bids, or careers — send us a note.' },
  };
  root.querySelector('[data-drawer-preview]').hidden = !preview;

  let lastFocus = null;
  let closeTimer = null;

  function select(name, focusField) {
    tabs.forEach((t) => {
      const on = t.dataset.drawerTab === name;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    forms.project.hidden = name !== 'project';
    forms.contact.hidden = name !== 'contact';
    done.hidden = true;
    root.querySelector('[data-drawer-preview]').hidden = !preview;
    title.textContent = copy[name].t;
    sub.textContent = copy[name].s;
    root.querySelector('.drawer-body').scrollTop = 0;
    if (focusField) forms[name].querySelector('input, select, textarea').focus({ preventScroll: true });
  }

  function open(name, trigger) {
    clearTimeout(closeTimer);
    lastFocus = trigger || document.activeElement;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    if (gap > 0) document.body.style.paddingRight = gap + 'px';
    select(name, false);
    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open');
    void root.offsetWidth; // let the slide transition run from its closed state
    root.setAttribute('data-open', '');
    setTimeout(() => {
      const first = forms[name].querySelector('input, select, textarea');
      (first || panel).focus({ preventScroll: true });
    }, 120);
  }

  function close() {
    root.removeAttribute('data-open');
    root.setAttribute('aria-hidden', 'true');
    closeTimer = setTimeout(() => {
      root.hidden = true;
      document.body.classList.remove('drawer-open');
      document.body.style.paddingRight = '';
      forms.project.reset();
      forms.contact.reset();
      select('project', false);
    }, 420);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-drawer-open]');
    if (trigger) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let the href work in a new tab
      e.preventDefault();
      open(trigger.getAttribute('data-drawer-open') === 'contact' ? 'contact' : 'project', trigger);
      return;
    }
    if (e.target.closest('[data-drawer-close]') && root.contains(e.target)) close();
  });

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t.dataset.drawerTab, true));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      select(next.dataset.drawerTab, false);
      next.focus();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (root.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    const f = Array.from(panel.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter((el) => !el.disabled && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  const hash = window.location.hash;
  if (hash === '#start-a-project') open('project', null);
  else if (hash === '#contact-us') open('contact', null);

  // ---- Submission (drawer forms and the forms on the Contact page) ----
  function firstName(data) {
    const n = (data.get('name') || data.get('first_name') || '').toString().trim();
    return n.split(/\s+/)[0] || '';
  }

  function showDone(form, data, wasPreview) {
    const who = firstName(data);
    const heading = who ? 'Thanks, ' + who + '.' : 'Thanks.';
    const text = wasPreview
      ? 'This is a preview, so nothing was actually sent.'
      : 'We’ve received your message and will be in touch.';
    if (form.closest('[data-drawer-root]')) {
      forms.project.hidden = true;
      forms.contact.hidden = true;
      done.querySelector('[data-form-done-title]').textContent = heading;
      done.querySelector('[data-form-done-text]').textContent = text;
      root.querySelector('[data-drawer-preview]').hidden = true;
      done.hidden = false;
      done.focus({ preventScroll: true });
      return;
    }
    const note = document.createElement('div');
    note.className = 'form-done form-done--inline';
    note.tabIndex = -1;
    note.innerHTML = '<div class="form-done-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h3></h3><p></p>';
    note.querySelector('h3').textContent = heading;
    note.querySelector('p').textContent = text;
    form.hidden = true;
    form.parentNode.insertBefore(note, form.nextSibling);
    note.focus({ preventScroll: true });
  }

  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = new FormData(form);
    const url = form.closest('[data-drawer-root]') ? endpoint : (form.getAttribute('data-endpoint') || '');
    const btn = form.querySelector('[type="submit"]');
    if (!url) { showDone(form, data, true); return; }
    if (btn) btn.disabled = true;
    try {
      const res = await fetch(url, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('bad status');
      showDone(form, data, false);
    } catch (err) {
      if (btn) btn.disabled = false;
      let msg = form.querySelector('.form-error');
      if (!msg) {
        msg = document.createElement('p');
        msg.className = 'form-error full';
        msg.setAttribute('role', 'alert');
        form.appendChild(msg);
      }
      msg.textContent = 'Something went wrong sending that. Please call (512) 643-2015 or try again.';
    }
  });

  // Page forms (Contact page) get the same preview notice the drawer shows.
  if (preview) {
    document.querySelectorAll('form[data-form]:not(.drawer-form)').forEach((f) => {
      const note = document.createElement('p');
      note.className = 'drawer-preview full';
      note.innerHTML = '<strong>Preview.</strong> This form isn’t connected yet, so nothing is sent.';
      f.insertBefore(note, f.firstChild);
    });
  }
})();

// CTA band: a pulse of current runs along the circuit trace. Decorative; skipped for reduced motion.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const panels = document.querySelectorAll('.cta-split-text');
  if (!panels.length) return;
  const NS = 'http://www.w3.org/2000/svg';
  const TILE = 120; // matches the background texture tile

  function route(width, y) {
    let d = 'M0 ' + y;
    for (let x = 0; x < width + TILE; x += TILE) {
      d += ' H' + (x + 40) + ' V' + (y - 40) + ' H' + (x + 90) + ' V' + (y + 30) + ' H' + (x + TILE) + ' V' + y;
    }
    return d;
  }

  function build(panel) {
    const old = panel.querySelector('.cta-pulse');
    if (old) old.remove();
    const w = panel.clientWidth, h = panel.clientHeight;
    const rows = [120, Math.max(240, Math.floor((h - TILE) / TILE) * TILE)];
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'cta-pulse');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('aria-hidden', 'true');
    rows.forEach((top, i) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', route(w, top + 60));
      p.setAttribute('pathLength', '1000');
      p.setAttribute('class', 'cta-pulse-spark');
      p.style.animationDelay = (i * 3.2) + 's';
      svg.appendChild(p);
    });
    panel.insertBefore(svg, panel.firstChild);
  }

  panels.forEach((panel) => {
    build(panel);
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => build(panel), 200); });
  });
})();
