/**
 * Eva Apartman – Gallery runtime
 * ---------------------------------------------------------------------------
 * The photo grids are now PRE-RENDERED into gallery.html by
 * tools/build-site.js, so every photo is a real <img> in the served HTML with
 * its own descriptive alt text. Search engines (and anyone with JS disabled)
 * see all of them without executing anything.
 *
 * This file therefore no longer builds the grids. It only applies the things
 * that genuinely can't be known at build time:
 *
 *   1. photos the admin panel has hidden      (localStorage 'eva-hidden-images')
 *   2. extra photos uploaded via the panel    (localStorage 'eva-custom-images')
 *   3. re-counting the tabs/labels afterwards
 *
 * To add or remove real photos:
 *   1. Drop the file into images/indoor, images/terrace or images/beach.
 *   2. Run:  npm run build     (regenerates the manifest, the derivatives and
 *                               the pre-rendered markup in one go)
 *
 * It still dispatches `eva:gallery-ready` so gallery.js indexes the final set
 * of tiles — including any custom ones — for the lightbox.
 */
(function () {
  'use strict';

  // Tell gallery.js to wait until we've applied the admin overrides.
  window.__evaGalleryDynamic = true;

  var ZOOM_SVG =
    '<div class="gm-overlay" aria-hidden="true">' +
    '<svg class="gm-zoom-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
    '<line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div>';

  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch (e) { return []; }
  }

  /* ── 1. Hidden photos ────────────────────────────────────────────────
     `hidden` holds source paths as the admin panel knows them
     (e.g. "images/indoor/indoor4.jpeg"). The pre-rendered tiles carry that
     same path in data-full, so we match on it rather than on the derivative
     actually shown in the grid. */
  function removeHidden(hidden) {
    if (!hidden.length) return;
    document.querySelectorAll('.gm-item[data-full]').forEach(function (item) {
      var full = item.getAttribute('data-full') || '';
      // Tolerate both "images/x.jpg" and "/images/x.jpg" spellings.
      var bare = full.replace(/^\//, '');
      if (hidden.indexOf(full) !== -1 || hidden.indexOf(bare) !== -1) item.remove();
    });
  }

  /* ── 2. Custom uploads ───────────────────────────────────────────────
     These come from localStorage (usually data: URLs), so there is no build
     step to generate derivatives — they're inserted as plain <img>. */
  function makeItem(src, alt, label) {
    var div = document.createElement('div');
    div.className = 'gm-item animate-on-scroll';
    div.tabIndex = 0;
    div.setAttribute('role', 'button');
    div.setAttribute('aria-label', 'Open photo: ' + label);
    div.setAttribute('data-full', src);
    div.innerHTML =
      '<img src="' + src + '" alt="' + alt + '" loading="lazy" decoding="async" />' + ZOOM_SVG;
    return div;
  }

  function injectCustom(custom) {
    if (!custom.length) return;
    var grids = {
      interior: document.querySelector('#interior .gallery-masonry'),
      terrace:  document.querySelector('#terrace .gallery-masonry'),
      beach:    document.querySelector('#beach .gallery-masonry')
    };
    custom.forEach(function (ci) {
      if (ci.hidden) return;
      var grid = grids[ci.section];
      if (!grid) return;
      grid.appendChild(makeItem(ci.src, ci.name || 'Custom photo', ci.name || 'Custom photo'));
    });
  }

  /* ── 3. Reveal + recount ─────────────────────────────────────────────
     main.js's scroll-reveal observer only watches elements that existed at
     page load, so tiles added above would stay at opacity:0 — we run our own
     observer for anything still unrevealed. */
  function revealTiles() {
    var tiles = document.querySelectorAll('.gm-item.animate-on-scroll:not(.visible)');
    if (!('IntersectionObserver' in window)) {
      tiles.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    // threshold 0 = reveal the instant the top edge enters the viewport; the
    // positive bottom margin starts it a little before, so it never feels like
    // the photos are lagging behind the scroll (noticeable on mobile).
    }, { threshold: 0, rootMargin: '0px 0px 10% 0px' });
    tiles.forEach(function (el) { obs.observe(el); });
  }

  // The build writes the correct counts into the HTML; this only has to run
  // when the admin overrides have actually changed the number of tiles.
  function updateCounts() {
    var total = 0;
    document.querySelectorAll('.gallery-section').forEach(function (section) {
      var grid = section.querySelector('.gallery-masonry');
      if (!grid) return;
      var count = grid.querySelectorAll('.gm-item').length;
      total += count;

      var label = section.querySelector('.gallery-photo-count');
      if (label) { label.setAttribute('data-n', count); label.setAttribute('aria-label', count + ' photos'); }

      var tab = document.querySelector('.gallery-tab[data-target="' + section.id + '"] .gallery-tab-count');
      if (tab) tab.textContent = count;
    });

    var header = document.querySelector('[data-i18n="gallery.header.p"]');
    if (header) header.setAttribute('data-n', total);

    // Re-apply translations so the {n} placeholders pick up the new numbers.
    if (window.evaI18n && typeof window.evaI18n.apply === 'function') {
      window.evaI18n.apply(window.evaI18n.getLang());
    }
  }

  /* ── Orchestration ───────────────────────────────────────────────────
     Synchronous now — no manifest fetch, no filename probing, no 404s. */
  function build() {
    var hidden = readJSON('eva-hidden-images');
    var custom = readJSON('eva-custom-images');

    removeHidden(hidden);
    injectCustom(custom);

    if (hidden.length || custom.length) updateCounts();
    revealTiles();

    document.dispatchEvent(new CustomEvent('eva:gallery-ready'));
  }

  // gallery.js removes tiles for files confirmed missing; keep counts in sync.
  document.addEventListener('eva:gallery-changed', updateCounts);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
