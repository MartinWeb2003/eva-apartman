/**
 * Eva Apartman – Gallery Loader
 * ---------------------------------------------------------------------------
 * Builds the photo grids from images/gallery-manifest.json — a list of the
 * files in each gallery folder. Reading a manifest means the page makes ONE
 * request and produces ZERO 404 errors (unlike blindly probing filenames).
 *
 * To add or remove photos:
 *   1. Drop the image into images/indoor, images/terrace or images/beach
 *      as the next number (e.g. images/indoor/indoor40.jpg).
 *   2. Double-click update-gallery.bat  (or run: node tools/build-manifest.js)
 *      to refresh the manifest.
 *
 * If the manifest is missing (e.g. you forgot to run the script) the loader
 * falls back to probing filenames so the gallery is never empty — it just
 * logs a reminder and you'll see a few 404s until you regenerate.
 *
 * When the grids are built it dispatches `eva:gallery-ready` so gallery.js can
 * wire up the lightbox over the final set of images.
 */
(function () {
  'use strict';

  // Tell gallery.js to wait until the grids are built before indexing them.
  window.__evaGalleryDynamic = true;

  var MANIFEST_URL = 'images/gallery-manifest.json';

  // Only used by the fallback probe (when the manifest can't be loaded).
  var EXTS = ['jpeg', 'jpg', 'png', 'webp'];
  var GAP  = 5;
  var MAX  = 300;

  var ZOOM_SVG =
    '<div class="gm-overlay" aria-hidden="true">' +
    '<svg class="gm-zoom-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
    '<line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div>';

  // ── DOM building ─────────────────────────────────────────────────────
  function numberIn(name) {
    var m = String(name).match(/(\d+)(?=\.[^.]+$)/);
    return m ? m[1] : '';
  }

  function makeItem(src, alt, label) {
    var div = document.createElement('div');
    div.className = 'gm-item animate-on-scroll';
    div.tabIndex = 0;
    div.setAttribute('role', 'button');
    div.setAttribute('aria-label', 'Open photo: ' + label);
    div.innerHTML =
      '<img src="' + src + '" alt="' + alt + '" loading="lazy" />' + ZOOM_SVG;
    return div;
  }

  function fillGrid(grid, files, hidden) {
    var folder = grid.getAttribute('data-gallery-folder');
    var alt    = grid.getAttribute('data-gallery-alt')   || '';
    var label  = grid.getAttribute('data-gallery-label') || '';
    grid.innerHTML = '';
    files.forEach(function (file) {
      var src = folder + file;
      if (hidden.indexOf(src) !== -1) return; // admin hid this photo
      grid.appendChild(makeItem(src, alt, (label + ' ' + numberIn(file)).trim()));
    });
  }

  // ── Manifest path (normal case) ──────────────────────────────────────
  function loadManifest() {
    return fetch(MANIFEST_URL, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); });
  }

  function buildFromManifest(manifest, hidden) {
    document.querySelectorAll('.gallery-masonry').forEach(function (grid) {
      var folder = grid.getAttribute('data-gallery-folder');
      var files  = (manifest && manifest[folder]) || [];
      fillGrid(grid, files, hidden);
    });
  }

  // ── Fallback probe (only if the manifest can't be loaded) ────────────
  function probeImg(url) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload  = function () { resolve(true); };
      im.onerror = function () { resolve(false); };
      im.src = url;
    });
  }

  function findFile(folder, base) {
    var i = 0;
    return (function tryNext() {
      if (i >= EXTS.length) return Promise.resolve(null);
      var file = base + '.' + EXTS[i++];
      return probeImg(folder + file).then(function (ok) { return ok ? file : tryNext(); });
    })();
  }

  function discover(folder, prefix) {
    var found = [], n = 1, misses = 0;
    return (function step() {
      if (n > MAX || misses > GAP) return Promise.resolve(found);
      var idx = n++;
      return findFile(folder, prefix + idx).then(function (file) {
        if (file) { found.push(file); misses = 0; }
        else      { misses++; }
        return step();
      });
    })();
  }

  function buildByProbing(hidden) {
    var grids = Array.prototype.slice.call(document.querySelectorAll('.gallery-masonry'));
    return Promise.all(grids.map(function (grid) {
      var folder = grid.getAttribute('data-gallery-folder');
      var prefix = grid.getAttribute('data-gallery-prefix');
      return discover(folder, prefix).then(function (files) { fillGrid(grid, files, hidden); });
    }));
  }

  // ── Admin overrides (hidden photos + custom uploads via localStorage) ─
  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch (e) { return []; }
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

  // Reveal the freshly injected tiles. main.js's scroll-reveal observer only
  // watches elements that existed at page load, so tiles we add later would
  // stay stuck at opacity:0 — we run our own observer for them here.
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

  // Keep the photo counts (tabs, section labels, header total) in sync with
  // the number of photos actually rendered.
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
      window.evaI18n.apply(document.documentElement.lang || 'en');
    }
  }

  // ── Orchestration ────────────────────────────────────────────────────
  function build() {
    var hidden = readJSON('eva-hidden-images');
    var custom = readJSON('eva-custom-images');

    loadManifest()
      .then(function (manifest) { buildFromManifest(manifest, hidden); })
      .catch(function (err) {
        console.warn('[gallery] Could not load ' + MANIFEST_URL + ' (' + err.message +
          '). Falling back to probing — run update-gallery.bat to fix this.');
        return buildByProbing(hidden);
      })
      .then(function () { injectCustom(custom); })
      .then(function () {
        updateCounts();
        revealTiles();
        // Signal gallery.js to index the freshly built grids for the lightbox.
        document.dispatchEvent(new CustomEvent('eva:gallery-ready'));
      });
  }

  // gallery.js removes tiles for files confirmed missing (deleted but still in
  // the manifest); keep the counts in sync when that happens.
  document.addEventListener('eva:gallery-changed', updateCounts);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
