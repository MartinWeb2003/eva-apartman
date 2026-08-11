/* =======================================================
   Eva Apartman — i18n runtime (EN / HR / PL / DE)
   -------------------------------------------------------
   Each language is a real, crawlable URL:

     en → /                /gallery.html      /location.html   …
     hr → /hr/             /hr/gallery.html   /hr/location.html …
     pl → /pl/  …          de → /de/  …

   The pages under /hr, /pl and /de are pre-rendered by
   tools/build-site.js, so the translated text is already in the
   HTML when Googlebot arrives — this file no longer *creates*
   the translation, it only:

     1. re-applies the dictionary to content injected after load
        (the gallery grids, the calendar),
     2. drives the language dropdown, which now NAVIGATES to the
        localised URL instead of swapping text in place.

   The dictionary itself lives in js/translations.js so that the
   build script can require() the exact same strings.
   ======================================================= */
(function () {
  'use strict';

  var LANG_KEY = 'eva-lang';
  var LANGS    = ['en', 'hr', 'pl', 'de'];
  var DEFAULT  = 'en';
  var PAGES    = ['index', 'gallery', 'location', 'contact'];

  var T = window.EVA_T;
  if (!T) {
    console.error('[i18n] js/translations.js must be loaded before js/i18n.js');
    return;
  }

  var docEl = document.documentElement;

  /* ── Where are we? ───────────────────────────────────── */

  /* The build stamps lang + page onto <html>; the pathname sniffing
     below is only a fallback for the un-built English pages. */
  function currentLang() {
    var l = docEl.getAttribute('lang');
    if (LANGS.indexOf(l) !== -1) return l;
    var seg = window.location.pathname.split('/').filter(Boolean)[0];
    return LANGS.indexOf(seg) !== -1 ? seg : DEFAULT;
  }

  function currentPage() {
    var p = docEl.getAttribute('data-page');
    if (PAGES.indexOf(p) !== -1) return p;
    var path = window.location.pathname.toLowerCase();
    for (var i = 1; i < PAGES.length; i++) {
      if (path.indexOf(PAGES[i]) !== -1) return PAGES[i];
    }
    return 'index';
  }

  /* Root-relative URL of the current page in another language. */
  function urlFor(lang, page) {
    page = page || currentPage();
    var alt = document.querySelector('link[rel="alternate"][hreflang="' + lang + '"]');
    if (alt) {
      /* Prefer the exact URL the build emitted, but keep it same-origin so
         local previews don't jump to production. */
      try {
        var u = new URL(alt.getAttribute('href'), window.location.href);
        if (u.origin === window.location.origin) return u.pathname + u.search + u.hash;
        return u.pathname + u.search + u.hash;
      } catch (e) { /* fall through to the computed path */ }
    }
    var base = lang === DEFAULT ? '/' : '/' + lang + '/';
    return page === 'index' ? base : base + page + '.html';
  }

  /* ── Applying the dictionary ─────────────────────────── */

  /* Replace a {n} placeholder with the element's data-n value (used for
     dynamic photo counts that stay translated across languages). */
  function withCount(el, str) {
    var n = el.getAttribute('data-n');
    return n === null ? str : str.replace('{n}', n);
  }

  /* Idempotent: on a pre-rendered page this writes back the text that is
     already there, and fills in anything the JS added afterwards. */
  function applyLang(lang, root) {
    var t     = T[lang] || T[DEFAULT];
    var scope = root || document;

    if (!root) {
      docEl.lang = lang;
      docEl.classList.remove('lang-en', 'lang-hr', 'lang-pl', 'lang-de');
      docEl.classList.add('lang-' + lang);

      var titleKey = currentPage() + '.title';
      if (t[titleKey]) document.title = t[titleKey];
    }

    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = withCount(el, t[key]);
    });

    scope.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (t[key] !== undefined) el.innerHTML = withCount(el, t[key]);
    });

    scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (t[key] !== undefined) el.placeholder = t[key];
    });

    scope.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-alt');
      if (t[key] !== undefined) el.alt = t[key];
    });

    if (!root) {
      var menuBtn = document.getElementById('lang-toggle');
      if (menuBtn) {
        var current = menuBtn.querySelector('.lang-current');
        if (current) current.textContent = lang.toUpperCase();
        document.querySelectorAll('.lang-option').forEach(function (opt) {
          opt.classList.toggle('active', opt.dataset.lang === lang);
        });
      }
      document.dispatchEvent(new CustomEvent('eva:langchange', { detail: { lang: lang } }));
    }
  }

  /* ── Language dropdown ───────────────────────────────── */
  function initDropdown() {
    var menuBtn = document.getElementById('lang-toggle');
    if (!menuBtn) return;
    var wrap = menuBtn.closest('.lang-menu-wrap');
    if (!wrap) return;

    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = wrap.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    /* Each option is a real link now, so middle-click / open-in-new-tab and
       crawlers all see a genuine URL. */
    wrap.querySelectorAll('.lang-option').forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        var lang = opt.dataset.lang;
        if (!lang || LANGS.indexOf(lang) === -1) return;
        try { localStorage.setItem(LANG_KEY, lang); } catch (err) { /* private mode */ }
        if (opt.tagName !== 'A') {
          e.stopPropagation();
          window.location.href = urlFor(lang);
        }
      });
    });

    document.addEventListener('click', function () {
      wrap.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        wrap.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Remembered preference ───────────────────────────────
     If the visitor previously *chose* a language and arrives from
     outside the site on a page in a different one, send them to their
     version. Only on external entry, so in-site links never fight the
     user, and never for crawlers (they have no localStorage and never
     click the switcher). */
  function honourStoredPreference(pageLang) {
    var stored;
    try { stored = localStorage.getItem(LANG_KEY); } catch (e) { return false; }
    if (!stored || LANGS.indexOf(stored) === -1 || stored === pageLang) return false;

    var ref = document.referrer;
    if (ref && ref.indexOf(window.location.origin) === 0) return false; // internal navigation

    var target = urlFor(stored);
    if (target === window.location.pathname) return false;
    window.location.replace(target + window.location.hash);
    return true;
  }

  /* ── Public API (gallery-loader re-applies after building grids) ── */
  window.evaI18n = {
    apply:    applyLang,
    getLang:  currentLang,
    getPage:  currentPage,
    urlFor:   urlFor,
    langs:    LANGS.slice()
  };

  /* ── Init ────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var lang = currentLang();
    initDropdown();
    if (honourStoredPreference(lang)) return; // navigating away, don't bother painting
    applyLang(lang);
  });

})();
