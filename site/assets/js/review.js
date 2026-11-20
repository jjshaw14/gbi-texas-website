// Client review layer: markers on questionable content, a popup to confirm or correct each
// one, and a panel that collects the answers and sends them. Answers are kept in the
// visitor's browser (localStorage) until they press Send. Remove the layer at launch by
// building with --production.
(function () {
  'use strict';
  const CFG = window.GBI_REVIEW;
  if (!CFG || !CFG.items || !CFG.items.length) return;

  const KEY = 'gbi-review-v1';
  const items = CFG.items;
  const byId = {};
  items.forEach((i) => { byId[i.id] = i; });

  const scriptEl = document.querySelector('script[src*="review.js"]');
  const root = new URL('../../', scriptEl ? scriptEl.src : location.href);
  const ext = /\.php$/.test(location.pathname) ? '.php' : '.html';
  const pageKey = (() => {
    const p = location.pathname.slice(root.pathname.length).replace(/\.(html|php)$/, '').replace(/\/$/, '');
    return p === '' ? 'index' : p;
  })();

  const blank = () => ({ answers: {}, general: {}, reviewer: { name: '', email: '' }, visible: true, welcomed: false, sentAt: '' });
  let state = blank();
  try { state = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* private mode: keep in memory */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ICON = {
    pending: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M12 9v3M12 14.6v.1"/></svg>',
    ok: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    change: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16l-1 4z"/></svg>',
    skip: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>'
  };
  const STATUS_LABEL = { ok: 'Looks right', change: 'Needs a change', skip: 'Not sure' };

  const status = (id) => (state.answers[id] ? state.answers[id].status : 'pending');
  const doneCount = () => items.filter((i) => state.answers[i.id]).length;

  // ---- Markers ----
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
  const paintAll = () => { flags().forEach(paintFlag); renderBar(); renderPanel(); };

  function setVisible(on) {
    state.visible = on;
    document.body.classList.toggle('rv-visible', on);
    save();
    renderBar();
    renderPanel();
  }

  // ---- Popup for one item ----
  let pop = null;
  let popBtn = null;
  let popReturn = null;

  function placePop() {
    if (!pop || !popBtn) return;
    if (window.innerWidth <= 560) { pop.style.top = pop.style.left = ''; return; }
    const r = popBtn.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight, m = 12;
    let left = Math.min(Math.max(m, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - m);
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

  function openPop(btn) {
    closePop(false);
    closePanel(false);
    const it = byId[btn.dataset.rv];
    if (!it) return;
    const prev = state.answers[it.id] || {};
    let choice = prev.status || '';
    popBtn = btn;
    popReturn = btn;

    pop = el('div', 'rv-pop');
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'false');
    pop.setAttribute('aria-label', 'Review: ' + it.label);
    pop.innerHTML =
      '<button type="button" class="rv-x" data-rv-close aria-label="Close">' + '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
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
    document.body.appendChild(pop);

    const noteWrap = pop.querySelector('.rv-note');
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
      pop.querySelectorAll('.rv-choice').forEach((b) => {
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
    pop.querySelectorAll('.rv-choice').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    if (choice) { setChoice(choice); noteInput.value = prev.value || prev.note || ''; }

    pop.addEventListener('click', (e) => {
      const c = e.target.closest('.rv-choice');
      if (c) { setChoice(c.dataset.v); if (c.dataset.v === 'change') noteInput.focus(); return; }
      if (e.target.closest('[data-rv-close]')) { closePop(true); return; }
      if (e.target.closest('.rv-save')) {
        if (!choice) { pop.querySelector('.rv-choices').classList.add('rv-shake'); setTimeout(() => pop && pop.querySelector('.rv-choices').classList.remove('rv-shake'), 400); return; }
        const text = noteInput.value.trim();
        if (choice === 'change' && !text) { err.hidden = false; noteInput.focus(); return; }
        state.answers[it.id] = { status: choice, value: choice === 'change' ? text : '', note: choice === 'change' ? '' : text, at: new Date().toISOString() };
        state.sentAt = '';
        save();
        paintAll();
        closePop(true);
        toast('Saved. ' + doneCount() + ' of ' + items.length + ' reviewed.');
      }
    });

    requestAnimationFrame(() => {
      placePop();
      pop.classList.add('is-open');
      if (window.innerWidth <= 560) document.body.classList.add('rv-sheet-open');
      const first = pop.querySelector('.rv-choice.is-on') || pop.querySelector('.rv-choice');
      if (first) first.focus({ preventScroll: true });
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

  // ---- Bar + panel ----
  const bar = el('div', 'rv-bar');
  const panel = el('div', 'rv-panel');
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Review this site');
  document.body.append(bar, panel);
  let panelView = 'list'; // list | summary | sent

  function renderBar() {
    const n = doneCount();
    const total = items.length;
    bar.innerHTML =
      '<button type="button" class="rv-bar-btn" aria-expanded="' + (!panel.hidden) + '" aria-controls="rv-panel-body">' +
        '<span class="rv-bar-ico">' + ICON.pending + '</span>' +
        '<span class="rv-bar-label">Review</span>' +
        '<span class="rv-bar-count">' + n + ' / ' + total + '</span>' +
      '</button>';
    bar.classList.toggle('is-complete', n === total);
  }

  function pageHref(page) {
    return new URL(page + ext, root).pathname;
  }

  function renderPanel() {
    if (panel.hidden) return;
    const n = doneCount();
    const total = items.length;
    const pct = Math.round((n / total) * 100);
    let html = '<div id="rv-panel-body" class="rv-panel-body">' +
      '<button type="button" class="rv-x" data-rvp-close aria-label="Close review panel"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg></button>';

    if (panelView === 'list') {
      html += '<h2 class="rv-panel-title">Review this site</h2>' +
        '<p class="rv-panel-sub">Items we need you to confirm are marked with this icon on each page. Answers are saved in this browser as you go.</p>' +
        '<div class="rv-progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + n + '"><span style="width:' + pct + '%"></span></div>' +
        '<p class="rv-progress-text">' + n + ' of ' + total + ' reviewed</p>' +
        '<ul class="rv-list">' + items.map((i) => {
          const st = status(i.id);
          return '<li><a class="rv-item" href="' + esc(pageHref(i.page)) + '#rv-' + esc(i.id) + '">' +
            '<span class="rv-dot rv-' + st + '">' + ICON[st] + '</span>' +
            '<span class="rv-item-main"><strong>' + esc(i.label) + '</strong><small>' + esc(i.where) + (st !== 'pending' ? ' · ' + STATUS_LABEL[st] : '') + '</small></span>' +
          '</a></li>';
        }).join('') + '</ul>' +
        '<div class="rv-general"><label for="rv-general-input">Anything else about this page?</label>' +
          '<textarea id="rv-general-input" rows="3" placeholder="Wording, photos, missing information, anything."></textarea></div>' +
        '<div class="rv-reviewer"><div><label for="rv-name">Your name</label><input id="rv-name" type="text" autocomplete="name" value="' + esc(state.reviewer.name) + '"></div>' +
          '<div><label for="rv-email">Email</label><input id="rv-email" type="email" autocomplete="email" value="' + esc(state.reviewer.email) + '"></div></div>' +
        '<div class="rv-panel-actions"><button type="button" class="btn btn-primary" data-rv-send>Send feedback <span class="arr">&rarr;</span></button>' +
          '<label class="rv-toggle"><input type="checkbox" data-rv-toggle ' + (state.visible ? 'checked' : '') + '> Show markers</label></div>' +
        (state.sentAt ? '<p class="rv-sent-note">Last sent ' + esc(new Date(state.sentAt).toLocaleString()) + '. Changing an answer lets you send again.</p>' : '');
    } else if (panelView === 'summary') {
      html += '<h2 class="rv-panel-title">' + (panel.dataset.reason === 'failed' ? 'That did not send' : 'Copy or download your feedback') + '</h2>' +
        '<p class="rv-panel-sub">' + (panel.dataset.reason === 'failed'
          ? 'We could not reach the server. Your answers are still saved here. Copy or download them and send them to the person who shared this link.'
          : 'Sending is not connected yet. Copy or download this summary and send it to the person who shared this link.') + '</p>' +
        '<textarea class="rv-summary" readonly rows="12">' + esc(panel.dataset.summary || '') + '</textarea>' +
        '<div class="rv-panel-actions"><button type="button" class="btn btn-primary" data-rv-copy>Copy</button><button type="button" class="btn btn-outline" data-rv-download>Download .txt</button><button type="button" class="rv-link" data-rv-back>Back</button></div>';
    } else {
      html += '<div class="rv-sent"><div class="form-done-icon" aria-hidden="true">' + ICON.ok.replace('width="14" height="14"', 'width="28" height="28"') + '</div>' +
        '<h2 class="rv-panel-title">Thank you.</h2><p class="rv-panel-sub">Your feedback was sent. You can keep editing answers and send again any time.</p>' +
        '<button type="button" class="btn btn-outline" data-rv-back>Back to the list</button></div>';
    }
    html += '</div>';
    const keepGeneral = panel.querySelector('#rv-general-input');
    const gv = keepGeneral ? keepGeneral.value : null;
    panel.innerHTML = html;
    const g = panel.querySelector('#rv-general-input');
    if (g) g.value = gv != null ? gv : (state.general[pageKey] || '');
  }

  function openPanel() {
    closePop(false);
    panelView = 'list';
    panel.hidden = false;
    renderPanel();
    void panel.offsetWidth;
    panel.classList.add('is-open');
    renderBar();
    const f = panel.querySelector('.rv-item, button');
    if (f) f.focus({ preventScroll: true });
  }
  function closePanel(restore) {
    if (panel.hidden) return;
    panel.classList.remove('is-open');
    panel.hidden = true;
    renderBar();
    if (restore) { const b = bar.querySelector('button'); if (b) b.focus({ preventScroll: true }); }
  }

  // ---- Payload + send ----
  function buildPayload() {
    return {
      submittedAt: new Date().toISOString(),
      site: location.origin + root.pathname,
      page: pageKey,
      reviewer: { name: state.reviewer.name.trim(), email: state.reviewer.email.trim() },
      answers: items.map((i) => {
        const a = state.answers[i.id];
        return { id: i.id, label: i.label, where: i.where, current: i.current, status: a ? a.status : 'not reviewed', change: a ? a.value : '', note: a ? a.note : '' };
      }),
      general: Object.keys(state.general).filter((k) => state.general[k].trim()).map((k) => ({ page: k, text: state.general[k].trim() }))
    };
  }

  function summaryText(p) {
    const lines = ['GBI Austin website review', 'Date: ' + new Date(p.submittedAt).toLocaleString(), 'From: ' + (p.reviewer.name || '(no name)') + (p.reviewer.email ? ' <' + p.reviewer.email + '>' : ''), ''];
    p.answers.forEach((a) => {
      const tag = a.status === 'ok' ? 'CONFIRMED' : a.status === 'change' ? 'CHANGE' : a.status === 'skip' ? 'NOT SURE' : 'NOT REVIEWED';
      lines.push('[' + tag + '] ' + a.label + ' (' + a.where + ')');
      lines.push('   Site says: ' + a.current);
      if (a.change) lines.push('   Should say: ' + a.change);
      if (a.note) lines.push('   Note: ' + a.note);
      lines.push('');
    });
    if (p.general.length) { lines.push('Other comments'); p.general.forEach((g) => lines.push('   ' + g.page + ': ' + g.text)); }
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
    const hasContent = payload.answers.some((a) => a.status !== 'not reviewed') || payload.general.length;
    if (!hasContent) { toast('Answer at least one item, or add a comment, first.'); return; }
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

  // ---- Events ----
  document.addEventListener('click', (e) => {
    const flag = e.target.closest('.rv-flag[data-rv]');
    if (flag) { e.preventDefault(); e.stopPropagation(); (pop && popBtn === flag) ? closePop(true) : openPop(flag); return; }
    if (e.target.closest('.rv-bar-btn')) { panel.hidden ? openPanel() : closePanel(false); return; }
    if (e.target.closest('[data-rvp-close]')) { closePanel(true); return; }
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
    // outside click closes the item popup
    if (pop && !e.target.closest('.rv-pop')) closePop(false);
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

  // ---- Init ----
  function openFromHash() {
    const m = /^#rv-(.+)$/.exec(location.hash);
    if (!m) return;
    const btn = flags().find((b) => b.dataset.rv === decodeURIComponent(m[1]));
    if (!btn) return;
    if (!state.visible) setVisible(true);
    btn.scrollIntoView({ block: 'center', behavior: 'auto' });
    setTimeout(() => openPop(btn), 250);
  }

  document.body.classList.toggle('rv-visible', state.visible);
  paintAll();
  if (!state.welcomed) {
    const w = el('div', 'rv-welcome', '<p><strong>We need your help with a few details.</strong> Anything we’re unsure about is marked with this icon <span class="rv-welcome-ico">' + ICON.pending + '</span>. Click one to confirm it or tell us what to change.</p><button type="button" class="btn btn-lime rv-welcome-ok">Got it</button>');
    document.body.appendChild(w);
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
})();
