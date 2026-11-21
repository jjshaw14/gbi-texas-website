// Client review layer.
//   1. Questions: markers on specific items we need confirmed, with a popup to answer.
//   2. Wording: every section of every page gets "Approve wording" and "Edit text".
//   3. A panel that collects both and sends them to the feedback endpoint.
// Answers live in the visitor's browser (localStorage) until they press Send.
// A wording approval stores a fingerprint of the text, so if the copy changes later the
// section flips back to "text changed" instead of silently staying approved.
// Remove the layer at launch by building with --production.
(function () {
  'use strict';
  const CFG = window.GBI_REVIEW;
  if (!CFG || !CFG.items || !CFG.items.length) return;

  const KEY = 'gbi-review-v1';
  const items = CFG.items;
  const pages = CFG.pages || [];
  const byId = {};
  items.forEach((i) => { byId[i.id] = i; });

  const scriptEl = document.querySelector('script[src*="review.js"]');
  const root = new URL('../../', scriptEl ? scriptEl.src : location.href);
  const ext = /\.php$/.test(location.pathname) ? '.php' : '.html';
  const pageKey = (() => {
    const p = location.pathname.slice(root.pathname.length).replace(/\.(html|php)$/, '').replace(/\/$/, '');
    return p === '' ? 'index' : p;
  })();

  const blank = () => ({
    answers: {}, general: {}, reviewer: { name: '', email: '' },
    sec: {}, seen: {}, visible: true, welcomed: false, sentAt: ''
  });
  let state = blank();
  try { state = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* private mode: keep in memory */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const norm = (s) => s.replace(/\s+/g, ' ').trim();

  const ICON = {
    pending: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M12 9v3M12 14.6v.1"/></svg>',
    ok: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    change: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16l-1 4z"/></svg>',
    skip: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>'
  };
  const X_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  const STATUS_LABEL = { ok: 'Looks right', change: 'Needs a change', skip: 'Not sure' };

  const status = (id) => (state.answers[id] ? state.answers[id].status : 'pending');
  const doneCount = () => items.filter((i) => state.answers[i.id]).length;

  // =====================================================================
  // Wording sections
  // =====================================================================
  const BLOCK = 'h1,h2,h3,h4,h5,p,li,blockquote,figcaption,dt,dd,.eyebrow,.lead,.pc-meta,.lbl,.num,.stat-label,.stat-num,.name,.sub,.proj-meta,.proj-scope,.cs-client,.cs-location,.cs-service-chip,.word';
  const SKIP = 'script,style,button,.btn,form,nav,svg,iframe,.crumbs,.rv-sec,.rv-flag,.cta-pulse,.video-modal,.drawer,.bio-panel,.nav-dropdown,noscript';

  function textOf(node) {
    const c = node.cloneNode(true);
    c.querySelectorAll(SKIP).forEach((n) => n.remove());
    c.querySelectorAll('[data-count]').forEach((n) => { n.textContent = n.getAttribute('data-count'); });
    c.querySelectorAll('br').forEach((b) => b.replaceWith(' '));
    return norm(c.textContent);
  }

  function blocksOf(sec) {
    const out = [];
    sec.querySelectorAll(BLOCK + ',.bio-card').forEach((e) => {
      if (e.closest(SKIP)) return;
      if (e.parentElement && e.parentElement.closest('.bio-card') && !e.matches('.bio-card')) return;
      for (let a = e.parentElement; a && a !== sec; a = a.parentElement) {
        if (a.matches(BLOCK) || a.matches('.bio-card')) return; // keep only the outermost block
      }
      if (e.matches('.bio-card')) {
        const who = norm((e.getAttribute('data-name') || '') + (e.getAttribute('data-role') ? ', ' + e.getAttribute('data-role') : ''));
        if (who) out.push(who);
        const bio = norm(e.getAttribute('data-bio') || '');
        if (bio) out.push(bio);
        return;
      }
      const t = textOf(e);
      if (t) out.push(t);
    });
    return out;
  }

  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'section';
  const sections = []; // {el, page, id, heading, text, hash}

  function scanSections() {
    const used = {};
    const list = Array.from(document.querySelectorAll('body > section, body > footer.site-footer'));
    list.forEach((sec, i) => {
      const blocks = blocksOf(sec);
      if (!blocks.length) return;
      let page = pageKey;
      let id;
      let heading;
      if (sec.matches('footer.site-footer')) { page = 'shared'; id = 'footer'; heading = 'Footer (shown on every page)'; }
      else if (sec.matches('.cta-split')) { page = 'shared'; id = 'closing-banner'; heading = 'Closing banner: Ready to Build Something? (shown on every page)'; }
      else {
        const h = sec.querySelector('h1,h2');
        heading = sec.getAttribute('data-rv-title') || (h ? textOf(h) : '') || (sec.querySelector('.eyebrow') ? textOf(sec.querySelector('.eyebrow')) : '') || ('Section ' + (i + 1) + ': ' + blocks.join(' ').slice(0, 40).trim() + '\u2026');
        id = slug(heading);
        const k = page + '/' + id;
        used[k] = (used[k] || 0) + 1;
        if (used[k] > 1) id += '-' + used[k];
      }
      const text = blocks.join('\n\n');
      sections.push({ el: sec, page, id, heading, text, hash: hash(norm(text)) });
    });
    // remember what exists on this page so the panel can count it
    state.seen[pageKey] = sections.filter((s) => s.page === pageKey).map((s) => ({ id: s.id, heading: s.heading, hash: s.hash }));
    const sharedNow = sections.filter((s) => s.page === 'shared');
    if (sharedNow.length) {
      const merged = {};
      (state.seen.shared || []).forEach((r) => { merged[r.id] = r; });
      sharedNow.forEach((r) => { merged[r.id] = { id: r.id, heading: r.heading, hash: r.hash }; });
      state.seen.shared = Object.keys(merged).map((k) => merged[k]);
    }
    save();
  }

  const secRec = (page, id) => (state.sec[page] || {})[id];
  function secStatus(page, id, h) {
    const r = secRec(page, id);
    if (!r) return 'pending';
    if (r.hash !== h) return 'outdated';
    return r.status === 'edited' ? 'edited' : 'approved';
  }
  const secLabel = {
    pending: 'Approve wording', approved: 'Wording approved', edited: 'Edited', outdated: 'Text changed: review again'
  };

  function setSec(s, rec) {
    state.sec[s.page] = state.sec[s.page] || {};
    if (rec) state.sec[s.page][s.id] = Object.assign({ heading: s.heading, hash: s.hash, at: new Date().toISOString() }, rec);
    else delete state.sec[s.page][s.id];
    state.sentAt = '';
    save();
    paintAll();
  }

  function paintSection(s) {
    const st = secStatus(s.page, s.id, s.hash);
    const bar = s.bar;
    bar.className = 'rv-sec rv-sec--' + st;
    const input = bar.querySelector('input');
    const text = bar.querySelector('.rv-sec-text');
    const check = bar.querySelector('.rv-sec-check');
    input.checked = st === 'approved';
    input.disabled = st === 'edited';
    check.classList.toggle('is-static', st === 'edited');
    text.textContent = secLabel[st];
    bar.querySelector('.rv-sec-edit').textContent = st === 'edited' ? 'Edit again' : 'Edit text';
    bar.setAttribute('aria-label', 'Review wording: ' + s.heading);
  }

  function buildSectionBars() {
    sections.forEach((s) => {
      if (getComputedStyle(s.el).position === 'static') s.el.classList.add('rv-sec-host');
      const bar = el('div', 'rv-sec');
      bar.setAttribute('role', 'group');
      bar.innerHTML =
        '<label class="rv-sec-check"><input type="checkbox"><span class="rv-sec-box" aria-hidden="true"></span><span class="rv-sec-text"></span></label>' +
        '<button type="button" class="rv-sec-edit">Edit text</button>';
      s.el.appendChild(bar);
      s.bar = bar;
      bar.querySelector('input').addEventListener('change', (e) => {
        if (e.target.checked) setSec(s, { status: 'approved' });
        else setSec(s, null);
      });
      bar.querySelector('.rv-sec-edit').addEventListener('click', (e) => { e.stopPropagation(); openEdit(s, e.currentTarget); });
    });
  }

  // =====================================================================
  // Markers
  // =====================================================================
  function paintFlag(btn) {
    const it = byId[btn.dataset.rv];
    if (!it) { btn.hidden = true; return; }
    const st = status(it.id);
    btn.className = 'rv-flag rv-' + st;
    btn.innerHTML = ICON[st];
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-label', (st === 'pending' ? 'Please review: ' : 'Reviewed (' + STATUS_LABEL[st] + '): ') + it.label);
    btn.title = it.label;
  }
  const flags = () => Array.from(document.querySelectorAll('.rv-flag[data-rv]'));
  const paintAll = () => { flags().forEach(paintFlag); sections.forEach(paintSection); renderBar(); renderPanel(); };

  function setVisible(on) {
    state.visible = on;
    document.body.classList.toggle('rv-visible', on);
    save();
    renderBar();
    renderPanel();
  }

  // =====================================================================
  // Popups (question + wording edit share one container)
  // =====================================================================
  let pop = null;
  let popBtn = null;
  let popReturn = null;

  function placePop() {
    if (!pop || !popBtn) return;
    if (window.innerWidth <= 560) { pop.style.top = pop.style.left = ''; return; }
    const r = popBtn.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight, m = 12;
    const left = Math.min(Math.max(m, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - m);
    let top = r.bottom + 10;
    if (top + ph > window.innerHeight - m) top = Math.max(m, r.top - ph - 10);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }

  function closePop(restore) {
    if (!pop) return;
    const p = pop;
    pop = null;
    p.classList.remove('is-open');
    setTimeout(() => p.remove(), reducedMotion ? 0 : 200);
    document.body.classList.remove('rv-sheet-open');
    if (restore && popReturn && popReturn.focus) popReturn.focus({ preventScroll: true });
    popBtn = null;
  }

  function showPop(node, anchor, focusSel) {
    closePop(false);
    closePanel(false);
    pop = node;
    popBtn = anchor;
    popReturn = anchor;
    document.body.appendChild(pop);
    requestAnimationFrame(() => {
      placePop();
      pop.classList.add('is-open');
      if (window.innerWidth <= 560) document.body.classList.add('rv-sheet-open');
      const f = pop.querySelector(focusSel);
      if (f) f.focus({ preventScroll: true });
    });
  }

  // ---- Question popup ----
  function openPop(btn) {
    const it = byId[btn.dataset.rv];
    if (!it) return;
    const prev = state.answers[it.id] || {};
    let choice = prev.status || '';

    const node = el('div', 'rv-pop');
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-label', 'Review: ' + it.label);
    node.innerHTML =
      '<button type="button" class="rv-x" data-rv-close aria-label="Close">' + X_ICON + '</button>' +
      '<h3 class="rv-pop-title">' + esc(it.label) + '</h3>' +
      '<div class="rv-current"><span>What the site says now</span><p>' + esc(it.current) + '</p></div>' +
      '<p class="rv-q">' + esc(it.q) + '</p>' +
      '<div class="rv-choices" role="group" aria-label="Your answer">' +
        '<button type="button" class="rv-choice" data-v="ok">Looks right</button>' +
        '<button type="button" class="rv-choice" data-v="change">Needs a change</button>' +
        '<button type="button" class="rv-choice" data-v="skip">Not sure</button>' +
      '</div>' +
      '<div class="rv-note" hidden><label for="rv-note-input"></label><textarea id="rv-note-input" rows="3"></textarea><p class="rv-err" role="alert" hidden>Please tell us what it should say.</p></div>' +
      '<div class="rv-actions"><button type="button" class="btn btn-primary rv-save">Save answer</button><button type="button" class="rv-link" data-rv-close>Cancel</button></div>';
    showPop(node, btn, '.rv-choice');

    const noteWrap = node.querySelector('.rv-note');
    const noteLabel = noteWrap.querySelector('label');
    const noteInput = noteWrap.querySelector('textarea');
    const err = noteWrap.querySelector('.rv-err');
    const labels = {
      ok: ['Anything to add? (optional)', 'Optional'],
      change: ['What should it say?', 'Type the corrected wording or details'],
      skip: ['Who would know, or what do you need? (optional)', 'Optional']
    };
    function setChoice(v) {
      choice = v;
      node.querySelectorAll('.rv-choice').forEach((b) => {
        const on = b.dataset.v === v;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      noteWrap.hidden = false;
      noteLabel.textContent = labels[v][0];
      noteInput.placeholder = labels[v][1];
      err.hidden = true;
      placePop();
    }
    node.querySelectorAll('.rv-choice').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    if (choice) { setChoice(choice); noteInput.value = prev.value || prev.note || ''; }

    node.addEventListener('click', (e) => {
      const c = e.target.closest('.rv-choice');
      if (c) { setChoice(c.dataset.v); if (c.dataset.v === 'change') noteInput.focus(); return; }
      if (e.target.closest('[data-rv-close]')) { closePop(true); return; }
      if (e.target.closest('.rv-save')) {
        if (!choice) { const g = node.querySelector('.rv-choices'); g.classList.add('rv-shake'); setTimeout(() => g.classList.remove('rv-shake'), 400); return; }
        const text = noteInput.value.trim();
        if (choice === 'change' && !text) { err.hidden = false; noteInput.focus(); return; }
        state.answers[it.id] = { status: choice, value: choice === 'change' ? text : '', note: choice === 'change' ? '' : text, at: new Date().toISOString() };
        state.sentAt = '';
        save();
        paintAll();
        closePop(true);
        toast('Saved. ' + doneCount() + ' of ' + items.length + ' questions answered.');
      }
    });
  }

  // ---- Wording edit popup ----
  function openEdit(s, anchor) {
    const rec = secRec(s.page, s.id);
    const draft = rec && rec.edited && rec.hash === s.hash ? rec.edited : s.text;
    const node = el('div', 'rv-pop rv-pop--wide');
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-label', 'Edit wording: ' + s.heading);
    node.innerHTML =
      '<button type="button" class="rv-x" data-rv-close aria-label="Close">' + X_ICON + '</button>' +
      '<h3 class="rv-pop-title">Edit wording</h3>' +
      '<p class="rv-edit-where">' + esc(s.heading) + '</p>' +
      '<label class="rv-edit-label" for="rv-edit-input">Change anything below</label>' +
      '<textarea id="rv-edit-input" rows="12"></textarea>' +
      '<p class="rv-edit-hint">Each paragraph, heading, or list item is separated by a blank line. Keep that structure where you can, and put notes to us in [brackets].</p>' +
      '<div class="rv-actions"><button type="button" class="btn btn-primary rv-save">Save changes</button>' +
        '<button type="button" class="btn btn-outline rv-approve">Approve as written</button>' +
        '<button type="button" class="rv-link rv-reset">Reset</button></div>';
    showPop(node, anchor, '#rv-edit-input');
    const ta = node.querySelector('textarea');
    ta.value = draft;
    const save$ = node.querySelector('.rv-save');
    const sync = () => { save$.disabled = norm(ta.value) === norm(s.text); };
    ta.addEventListener('input', sync);
    sync();
    node.addEventListener('click', (e) => {
      if (e.target.closest('[data-rv-close]')) { closePop(true); return; }
      if (e.target.closest('.rv-reset')) { ta.value = s.text; sync(); ta.focus(); return; }
      if (e.target.closest('.rv-approve')) { setSec(s, { status: 'approved' }); closePop(true); toast('Approved as written.'); return; }
      if (e.target.closest('.rv-save') && !save$.disabled) {
        setSec(s, { status: 'edited', original: s.text, edited: ta.value.trim() });
        closePop(true);
        toast('Your changes are saved.');
      }
    });
  }

  // ---- Toast ----
  let toastEl = null;
  let toastTimer = null;
  function toast(msg) {
    if (!toastEl) { toastEl = el('div', 'rv-toast'); toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  }

  // =====================================================================
  // Bar + panel
  // =====================================================================
  const bar = el('div', 'rv-bar');
  const panel = el('div', 'rv-panel');
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Review this site');
  document.body.append(bar, panel);
  let panelView = 'list'; // list | summary | sent
  let panelTab = 'page'; // page | all | notes

  function pageCounts(key) {
    const seen = state.seen[key] || [];
    let resolved = 0, edited = 0;
    seen.forEach((s) => {
      const st = secStatus(key, s.id, s.hash);
      if (st === 'approved') resolved++;
      else if (st === 'edited') { resolved++; edited++; }
    });
    return { total: seen.length, resolved, edited, opened: !!state.seen[key] };
  }
  function wordingTotals() {
    let resolved = 0, edited = 0;
    Object.keys(state.seen).forEach((k) => { const c = pageCounts(k); resolved += c.resolved; edited += c.edited; });
    return { resolved, edited };
  }

  const pageLabel = (key) => { const p = pages.find((x) => x.key === key); return p ? p.label : 'this page'; };
  const pageHref = (page) => new URL(page + ext, root).pathname;

  // Open = still waiting on the client: unanswered questions, wording not yet approved or edited,
  // and wording whose text changed after it was approved.
  function openHere() {
    const rows = [];
    const seen = {};
    flags().forEach((b) => {
      const it = byId[b.dataset.rv];
      if (!it || seen[it.id] || state.answers[it.id]) return;
      seen[it.id] = 1;
      rows.push({ kind: 'q', id: it.id, label: it.label, meta: 'Question' });
    });
    sections.forEach((s) => {
      const st = secStatus(s.page, s.id, s.hash);
      if (st === 'pending' || st === 'outdated') {
        rows.push({ kind: 's', page: s.page, id: s.id, label: s.heading, meta: st === 'outdated' ? 'Text changed: review again' : 'Wording' });
      }
    });
    return rows;
  }
  function openSitewide() {
    const qs = items.filter((i) => !state.answers[i.id]);
    const pg = [];
    let unopened = false;
    let secs = 0;
    pages.concat([{ key: 'shared', label: 'Footer and closing banner (on every page)' }]).forEach((p) => {
      const c = pageCounts(p.key);
      if (!c.opened) { if (p.key !== 'shared') { unopened = true; pg.push({ key: p.key, label: p.label, opened: false, open: 0 }); } return; }
      const open = c.total - c.resolved;
      secs += open;
      if (open > 0) pg.push({ key: p.key, label: p.label, opened: true, open });
    });
    return { qs, pg, count: qs.length + secs, unopened };
  }

  function renderBar() {
    const here = openHere().length;
    bar.innerHTML =
      '<button type="button" class="rv-bar-btn" aria-expanded="' + (!panel.hidden) + '" aria-controls="rv-panel-body">' +
        '<span class="rv-bar-ico">' + ICON.pending + '</span>' +
        '<span class="rv-bar-label">Review</span>' +
        '<span class="rv-bar-count" title="Open reviews on this page">' + (here ? here + ' open' : 'All done') + '</span>' +
      '</button>';
    bar.classList.toggle('is-complete', here === 0);
  }

  function rowHtml(r) {
    const dot = '<span class="rv-dot rv-pending">' + ICON.pending + '</span>';
    const main = '<span class="rv-item-main"><strong>' + esc(r.label) + '</strong><small>' + esc(r.meta) + '</small></span>';
    if (r.href) return '<li><a class="rv-item" href="' + esc(r.href) + '">' + dot + main + '</a></li>';
    const attr = r.kind === 'q' ? 'data-rv-go-q="' + esc(r.id) + '"' : 'data-rv-go-s="' + esc(r.page + '|' + r.id) + '"';
    return '<li><button type="button" class="rv-item" ' + attr + '>' + dot + main + '</button></li>';
  }

  function renderPanel() {
    if (panel.hidden) return;
    let html = '<div id="rv-panel-body" class="rv-panel-body">';
    const close = '<button type="button" class="rv-x" data-rvp-close aria-label="Close review panel">' + X_ICON + '</button>';

    if (panelView === 'list') {
      const here = openHere();
      const all = openSitewide();
      const hereDone = sections.filter((s) => { const st = secStatus(s.page, s.id, s.hash); return st === 'approved' || st === 'edited'; }).length;
      const note = state.general[pageKey] || '';
      html += '<div class="rv-panel-head">' + close + '<h2 class="rv-panel-title">Review this site</h2>' +
        '<div class="rv-tabs" role="tablist">' +
          '<button type="button" role="tab" class="rv-tab" data-rv-tab="page" aria-selected="' + (panelTab === 'page') + '">This page <span>' + here.length + '</span></button>' +
          '<button type="button" role="tab" class="rv-tab" data-rv-tab="all" aria-selected="' + (panelTab === 'all') + '">All open <span>' + all.count + (all.unopened ? '+' : '') + '</span></button>' +
          '<button type="button" role="tab" class="rv-tab" data-rv-tab="notes" aria-selected="' + (panelTab === 'notes') + '">Page notes' + (note.trim() ? ' <span>1</span>' : '') + '</button>' +
        '</div></div><div class="rv-panel-scroll">';

      if (panelTab === 'page') {
        html += '<p class="rv-panel-sub">Open reviews on <strong>' + esc(pageLabel(pageKey)) + '</strong>. Pick one to jump to it.</p>';
        if (here.length) html += '<ul class="rv-list">' + here.map(rowHtml).join('') + '</ul>';
        else html += '<div class="rv-empty"><div class="rv-dot rv-ok">' + ICON.ok + '</div><p><strong>Nothing left to review on this page.</strong><br>' + (hereDone ? hereDone + ' section' + (hereDone > 1 ? 's' : '') + ' of wording done.' : 'Use the Page notes tab for anything else.') + '</p></div>';
      } else if (panelTab === 'all') {
        html += '<p class="rv-panel-sub">Everything still waiting on you across the site.</p>';
        if (all.qs.length) {
          html += '<h3 class="rv-sub-h">Questions <span>' + all.qs.length + '</span></h3><ul class="rv-list">' + all.qs.map((i) => rowHtml({ kind: 'q', id: i.id, label: i.label, meta: i.where, href: pageHref(i.page) + '#rv-' + i.id })).join('') + '</ul>';
        }
        if (all.pg.length) {
          html += '<h3 class="rv-sub-h">Wording by page</h3><ul class="rv-list">' + all.pg.map((p) => {
            const open = p.opened ? (state.seen[p.key] || []).find((s) => { const st = secStatus(p.key, s.id, s.hash); return st === 'pending' || st === 'outdated'; }) : null;
            const href = pageHref(p.key === 'shared' ? 'index' : p.key) + (open ? '#rv-s:' + encodeURIComponent(p.key + '|' + open.id) : '');
            return rowHtml({ kind: 'p', label: p.label, meta: p.opened ? p.open + ' section' + (p.open > 1 ? 's' : '') + ' open' : 'Not opened yet', href });
          }).join('') + '</ul>';
        }
        if (!all.qs.length && !all.pg.length) html += '<div class="rv-empty"><div class="rv-dot rv-ok">' + ICON.ok + '</div><p><strong>Everything you have opened is reviewed.</strong></p></div>';
      } else {
        const others = Object.keys(state.general).filter((k) => k !== pageKey && state.general[k].trim());
        html += '<p class="rv-panel-sub">A note about <strong>' + esc(pageLabel(pageKey)) + '</strong>: photos, tone, missing information, anything that does not fit a single section. It’s saved with this page.</p>' +
          '<label class="rv-note-label" for="rv-general-input">Your note for this page</label>' +
          '<textarea id="rv-general-input" rows="7" placeholder="What would you change, add, or remove on this page?"></textarea>';
        if (others.length) {
          html += '<h3 class="rv-sub-h">Notes on other pages <span>' + others.length + '</span></h3><ul class="rv-list">' + others.map((k) =>
            '<li><a class="rv-item" href="' + esc(pageHref(k)) + '"><span class="rv-dot rv-change">' + ICON.change + '</span><span class="rv-item-main"><strong>' + esc(pageLabel(k)) + '</strong><small>' + esc(state.general[k].trim().slice(0, 70)) + (state.general[k].trim().length > 70 ? '…' : '') + '</small></span></a></li>').join('') + '</ul>';
        }
      }
      html += '</div><div class="rv-panel-foot">' +
        '<div class="rv-reviewer"><div><label for="rv-name">Your name</label><input id="rv-name" type="text" autocomplete="name" value="' + esc(state.reviewer.name) + '"></div>' +
          '<div><label for="rv-email">Email</label><input id="rv-email" type="email" autocomplete="email" value="' + esc(state.reviewer.email) + '"></div></div>' +
        '<div class="rv-panel-actions"><button type="button" class="btn btn-primary" data-rv-send>Send feedback <span class="arr">&rarr;</span></button>' +
          '<label class="rv-toggle"><input type="checkbox" data-rv-toggle ' + (state.visible ? 'checked' : '') + '> Show markers</label></div>' +
        (state.sentAt ? '<p class="rv-sent-note">Last sent ' + esc(new Date(state.sentAt).toLocaleString()) + '. Changing an answer lets you send again.</p>' : '') +
        '</div>';
    } else if (panelView === 'summary') {
      html += '<div class="rv-panel-scroll rv-panel-scroll--pad">' + close + '<h2 class="rv-panel-title">' + (panel.dataset.reason === 'failed' ? 'That did not send' : 'Copy or download your feedback') + '</h2>' +
        '<p class="rv-panel-sub">' + (panel.dataset.reason === 'failed'
          ? 'We could not reach the server. Your answers are still saved here. Copy or download them and send them to the person who shared this link.'
          : 'Sending is not connected yet. Copy or download this summary and send it to the person who shared this link.') + '</p>' +
        '<textarea class="rv-summary" readonly rows="12">' + esc(panel.dataset.summary || '') + '</textarea>' +
        '<div class="rv-panel-actions"><button type="button" class="btn btn-primary" data-rv-copy>Copy</button><button type="button" class="btn btn-outline" data-rv-download>Download .txt</button><button type="button" class="rv-link" data-rv-back>Back</button></div></div>';
    } else {
      html += '<div class="rv-panel-scroll rv-panel-scroll--pad">' + close + '<div class="rv-sent"><div class="form-done-icon" aria-hidden="true">' + ICON.ok.replace('width="14" height="14"', 'width="28" height="28"') + '</div>' +
        '<h2 class="rv-panel-title">Thank you.</h2><p class="rv-panel-sub">Your feedback was sent. You can keep editing answers and send again any time.</p>' +
        '<button type="button" class="btn btn-outline" data-rv-back>Back to the list</button></div></div>';
    }
    html += '</div>';
    const keepGeneral = panel.querySelector('#rv-general-input');
    const gv = keepGeneral ? keepGeneral.value : null;
    const sc = panel.querySelector('.rv-panel-scroll');
    const scroll = sc ? sc.scrollTop : 0;
    panel.innerHTML = html;
    const sc2 = panel.querySelector('.rv-panel-scroll');
    if (sc2) sc2.scrollTop = scroll;
    const g = panel.querySelector('#rv-general-input');
    if (g) g.value = gv != null ? gv : (state.general[pageKey] || '');
  }

  // ---- Jump to an item on this page ----
  function goToQuestion(id) {
    const btn = flags().find((b) => b.dataset.rv === id);
    if (!btn) return;
    btn.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
    setTimeout(() => openPop(btn), reducedMotion ? 50 : 450);
  }
  function goToSection(page, id) {
    const s = sections.find((x) => x.page === page && x.id === id);
    if (!s) return;
    const top = s.el.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' });
    s.bar.classList.remove('rv-pulse');
    void s.bar.offsetWidth;
    s.bar.classList.add('rv-pulse');
    setTimeout(() => { s.bar.classList.remove('rv-pulse'); const i = s.bar.querySelector('input:not(:disabled)') || s.bar.querySelector('button'); if (i) i.focus({ preventScroll: true }); }, reducedMotion ? 50 : 900);
  }

  function openPanel() {
    closePop(false);
    panelView = 'list';
    panel.hidden = false;
    renderPanel();
    void panel.offsetWidth;
    panel.classList.add('is-open');
    renderBar();
    const f = panel.querySelector('.rv-tab[aria-selected="true"]') || panel.querySelector('button');
    if (f) f.focus({ preventScroll: true });
  }
  function closePanel(restore) {
    if (panel.hidden) return;
    panel.classList.remove('is-open');
    panel.hidden = true;
    renderBar();
    if (restore) { const b = bar.querySelector('button'); if (b) b.focus({ preventScroll: true }); }
  }

  // =====================================================================
  // Payload + send
  // =====================================================================
  function buildPayload() {
    const sectionRows = [];
    Object.keys(state.seen).forEach((pg) => {
      state.seen[pg].forEach((s) => {
        const st = secStatus(pg, s.id, s.hash);
        const rec = secRec(pg, s.id);
        sectionRows.push({
          page: pg, id: s.id, heading: s.heading, hash: s.hash,
          status: st === 'pending' ? 'not reviewed' : st,
          original: st === 'edited' ? rec.original || '' : '',
          edited: st === 'edited' ? rec.edited || '' : ''
        });
      });
    });
    return {
      submittedAt: new Date().toISOString(),
      site: location.origin + root.pathname,
      page: pageKey,
      reviewer: { name: state.reviewer.name.trim(), email: state.reviewer.email.trim() },
      answers: items.map((i) => {
        const a = state.answers[i.id];
        return { id: i.id, label: i.label, where: i.where, current: i.current, status: a ? a.status : 'not reviewed', change: a ? a.value : '', note: a ? a.note : '' };
      }),
      sections: sectionRows,
      general: Object.keys(state.general).filter((k) => state.general[k].trim()).map((k) => ({ page: k, text: state.general[k].trim() }))
    };
  }

  function summaryText(p) {
    const lines = ['GBI Austin website review', 'Date: ' + new Date(p.submittedAt).toLocaleString(), 'From: ' + (p.reviewer.name || '(no name)') + (p.reviewer.email ? ' <' + p.reviewer.email + '>' : ''), '', 'QUESTIONS', ''];
    p.answers.forEach((a) => {
      const tag = a.status === 'ok' ? 'CONFIRMED' : a.status === 'change' ? 'CHANGE' : a.status === 'skip' ? 'NOT SURE' : 'NOT REVIEWED';
      lines.push('[' + tag + '] ' + a.label + ' (' + a.where + ')');
      lines.push('   Site says: ' + a.current);
      if (a.change) lines.push('   Should say: ' + a.change);
      if (a.note) lines.push('   Note: ' + a.note);
      lines.push('');
    });
    const sec = p.sections || [];
    if (sec.length) {
      lines.push('WORDING', '');
      const label = {};
      pages.forEach((pg) => { label[pg.key] = pg.label; });
      label.shared = 'Footer and closing banner';
      const byPage = {};
      sec.forEach((s) => { (byPage[s.page] = byPage[s.page] || []).push(s); });
      Object.keys(byPage).forEach((pg) => {
        const rows = byPage[pg];
        const c = (st) => rows.filter((r) => r.status === st).length;
        lines.push((label[pg] || pg) + ': ' + c('approved') + ' approved, ' + c('edited') + ' edited, ' + (c('not reviewed') + c('outdated')) + ' not reviewed');
      });
      lines.push('');
      sec.filter((s) => s.status === 'edited').forEach((s) => {
        lines.push('[EDITED] ' + (label[s.page] || s.page) + ' > ' + s.heading);
        lines.push('   Original:', '   ' + s.original.replace(/\n/g, '\n   '), '   New:', '   ' + s.edited.replace(/\n/g, '\n   '), '');
      });
    }
    if (p.general.length) { lines.push('OTHER COMMENTS', ''); p.general.forEach((g) => lines.push('   ' + g.page + ': ' + g.text)); }
    return lines.join('\n');
  }

  async function send() {
    const general = panel.querySelector('#rv-general-input');
    if (general) state.general[pageKey] = general.value;
    const nm = panel.querySelector('#rv-name'), em = panel.querySelector('#rv-email');
    if (nm) state.reviewer.name = nm.value;
    if (em) state.reviewer.email = em.value;
    save();
    const payload = buildPayload();
    const hasContent = payload.answers.some((a) => a.status !== 'not reviewed') || payload.sections.some((s) => s.status === 'approved' || s.status === 'edited') || payload.general.length;
    if (!hasContent) { toast('Answer a question, approve some wording, or add a comment first.'); return; }
    panel.dataset.summary = summaryText(payload);
    if (!CFG.endpoint) { panel.dataset.reason = 'noendpoint'; panelView = 'summary'; renderPanel(); return; }
    const btn = panel.querySelector('[data-rv-send]');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    try {
      const fd = new FormData();
      fd.append('payload', JSON.stringify(payload));
      fd.append('website', ''); // honeypot
      const res = await fetch(CFG.endpoint, { method: 'POST', body: fd });
      const out = await res.json();
      if (!res.ok || !out.ok) throw new Error('rejected');
      state.sentAt = new Date().toISOString();
      save();
      panelView = 'sent';
      renderPanel();
    } catch (e) {
      panel.dataset.reason = 'failed';
      panelView = 'summary';
      renderPanel();
    }
  }

  // =====================================================================
  // Events
  // =====================================================================
  document.addEventListener('click', (e) => {
    const flag = e.target.closest('.rv-flag[data-rv]');
    if (flag) { e.preventDefault(); e.stopPropagation(); (pop && popBtn === flag) ? closePop(true) : openPop(flag); return; }
    if (e.target.closest('.rv-bar-btn')) { panel.hidden ? openPanel() : closePanel(false); return; }
    if (e.target.closest('[data-rvp-close]')) { closePanel(true); return; }
    const gq = e.target.closest('[data-rv-go-q]');
    if (gq) { closePanel(false); goToQuestion(gq.dataset.rvGoQ); return; }
    const gs = e.target.closest('[data-rv-go-s]');
    if (gs) { const [pg, id] = gs.dataset.rvGoS.split('|'); closePanel(false); goToSection(pg, id); return; }
    const tab = e.target.closest('[data-rv-tab]');
    if (tab) { panelTab = tab.dataset.rvTab; renderPanel(); return; }
    if (e.target.closest('[data-rv-send]')) { send(); return; }
    if (e.target.closest('[data-rv-back]')) { panelView = 'list'; renderPanel(); return; }
    if (e.target.closest('[data-rv-copy]')) {
      const ta = panel.querySelector('.rv-summary');
      ta.select();
      (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).catch(() => document.execCommand('copy')).then(() => toast('Copied.'), () => toast('Copied.'));
      return;
    }
    if (e.target.closest('[data-rv-download]')) {
      const blob = new Blob([panel.dataset.summary || ''], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'gbi-austin-website-feedback.txt';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      return;
    }
    if (e.target.closest('.rv-welcome-ok')) { state.welcomed = true; save(); const w = document.querySelector('.rv-welcome'); if (w) w.remove(); return; }
    // outside click closes the open popup / panel
    if (pop && !e.target.closest('.rv-pop, .rv-sec-edit')) closePop(false);
    if (!panel.hidden && !e.target.closest('.rv-panel, .rv-bar')) closePanel(false);
  });

  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-rv-toggle]')) setVisible(e.target.checked);
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'rv-general-input') { state.general[pageKey] = e.target.value; save(); }
    if (e.target.id === 'rv-name') { state.reviewer.name = e.target.value; save(); }
    if (e.target.id === 'rv-email') { state.reviewer.email = e.target.value; save(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (pop) { closePop(true); }
    else if (!panel.hidden) { closePanel(true); }
  });
  window.addEventListener('resize', placePop);
  window.addEventListener('scroll', () => { if (pop) requestAnimationFrame(placePop); }, { passive: true });

  // =====================================================================
  // Init
  // =====================================================================
  function openFromHash() {
    const sm = /^#rv-s:(.+)$/.exec(location.hash);
    if (sm) {
      const [pg, id] = decodeURIComponent(sm[1]).split('|');
      if (!state.visible) setVisible(true);
      setTimeout(() => goToSection(pg, id), 200);
      return;
    }
    const m = /^#rv-(.+)$/.exec(location.hash);
    if (!m) return;
    const btn = flags().find((b) => b.dataset.rv === decodeURIComponent(m[1]));
    if (!btn) return;
    if (!state.visible) setVisible(true);
    btn.scrollIntoView({ block: 'center', behavior: 'auto' });
    setTimeout(() => openPop(btn), 250);
  }

  scanSections();
  buildSectionBars();
  document.body.classList.toggle('rv-visible', state.visible);
  paintAll();
  if (!state.welcomed) {
    const w = el('div', 'rv-welcome', '<p><strong>Help us get the details right.</strong> Anything we’re unsure about is marked with this icon <span class="rv-welcome-ico">' + ICON.pending + '</span>. Every section also has an <strong>Approve wording</strong> box and an <strong>Edit text</strong> button in its top corner.</p><button type="button" class="btn btn-lime rv-welcome-ok">Got it</button>');
    document.body.appendChild(w);
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
})();
