/**
 * Eva Apartman – Gallery Page
 * Handles: section tab navigation + scroll-spy, enhanced lightbox,
 *          keyboard nav (← →, Esc), touch swipe, image error placeholders.
 */

(function () {
  'use strict';

  function init() {
  // Confirm (via HEAD) that an image really is missing before removing its
  // tile. Returns false on transient/network errors so a good photo is kept.
  function confirmMissing(url) {
    if (typeof fetch !== 'function') return Promise.resolve(false);
    return fetch(url, { method: 'HEAD' })
      .then(r => r.status === 404 || r.status === 410) // only a real "gone" removes it
      .catch(() => false); // network error / transient server error → keep the tile
  }

  // ── Image registry ──────────────────────────────────────────────────
  // Built from every .gm-item on the page, in DOM order.
  const images = [];

  document.querySelectorAll('.gm-item').forEach((item, i) => {
    const img = item.querySelector('img');
    if (!img) return;

    // The grid <img> is a downscaled derivative; data-full points at the
    // original so the lightbox opens the full-resolution photo.
    const full = item.dataset.full || img.currentSrc || img.src;
    images.push({ src: full, alt: img.alt, section: item.closest('.gallery-section')?.dataset.section || '' });
    item.dataset.idx = i;

    // A listed image whose file is genuinely gone (e.g. deleted from the folder
    // but the manifest wasn't regenerated yet) is skipped entirely: remove its
    // tile and blank its registry entry so the lightbox steps over it. We only
    // do this once a HEAD request confirms a 404 — a transient load error must
    // not wipe a perfectly good photo.
    const handleBroken = () => {
      confirmMissing(img.src).then(missing => {
        if (!missing) return;
        images[i].src = '';
        item.remove();
        document.dispatchEvent(new CustomEvent('eva:gallery-changed'));
      });
    };
    img.addEventListener('error', handleBroken);

    // Open lightbox
    item.addEventListener('click', () => openAt(i));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAt(i); }
    });
  });

  // ── Lightbox elements ───────────────────────────────────────────────
  const lb        = document.getElementById('gallery-lightbox');
  const lbImgWrap = lb.querySelector('.lb-img-wrap');
  const lbImg     = lb.querySelector('.lb-img');
  const lbClose   = lb.querySelector('.lb-close');
  const lbPrev    = lb.querySelector('.lb-prev');
  const lbNext    = lb.querySelector('.lb-next');
  const lbCount   = lb.querySelector('.lb-counter');
  const lbCaption = lb.querySelector('.lb-caption');

  let currentIdx = 0;

  function openAt(idx) {
    currentIdx = idx;
    render();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Return focus to image for screen readers
    requestAnimationFrame(() => lbImg.focus());
  }

  function closeBox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    // Return focus to the thumbnail that was clicked
    const item = document.querySelector(`.gm-item[data-idx="${currentIdx}"]`);
    if (item) item.focus();
  }

  function render() {
    const { src, alt, section } = images[currentIdx];

    // Fade transition
    lbImg.style.opacity = '0';
    lbImg.style.transform = 'scale(0.97)';

    lbImg.src = src;
    lbImg.alt = alt;

    requestAnimationFrame(() => {
      lbImg.style.opacity = '1';
      lbImg.style.transform = 'scale(1)';
    });

    // Count only live images so removed (missing) ones don't leave gaps.
    const live = images.filter(im => im.src).length;
    const pos  = images.slice(0, currentIdx + 1).filter(im => im.src).length;
    lbCount.textContent  = `${pos} / ${live}`;
    lbCaption.textContent = section && alt ? `${section}  ·  ${alt}` : (alt || section || '');

    lbPrev.disabled = !images.slice(0, currentIdx).some(im => im.src);
    lbNext.disabled = !images.slice(currentIdx + 1).some(im => im.src);
  }

  function prev() { for (let i = currentIdx - 1; i >= 0; i--) if (images[i].src) { currentIdx = i; render(); return; } }
  function next() { for (let i = currentIdx + 1; i < images.length; i++) if (images[i].src) { currentIdx = i; render(); return; } }

  // Button listeners
  lbClose.addEventListener('click', closeBox);
  lbPrev.addEventListener('click', prev);
  lbNext.addEventListener('click', next);

  // Click backdrop to close
  lb.addEventListener('click', e => {
    if (e.target === lb || e.target === lbImgWrap) closeBox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    switch (e.key) {
      case 'Escape':     closeBox(); break;
      case 'ArrowLeft':  prev();     break;
      case 'ArrowRight': next();     break;
    }
  });

  // Touch swipe
  let touchStartX = 0;
  lb.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 45) return; // ignore tiny taps
    dx < 0 ? next() : prev();
  });

  // ── Section tabs + scroll-spy ───────────────────────────────────────
  const tabs     = document.querySelectorAll('.gallery-tab');
  const sections = document.querySelectorAll('.gallery-section');
  const pageNav  = document.querySelector('.gallery-page-nav');
  const navbar   = document.querySelector('.navbar');

  function getOffset() {
    return (navbar  ? navbar.offsetHeight  : 65)
         + (pageNav ? pageNav.offsetHeight : 56);
  }

  // Click a tab → smooth-scroll to its section
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = document.getElementById(tab.dataset.target);
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.pageYOffset - getOffset() - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Scroll-spy: highlight the tab for whichever section is most visible
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tabs.forEach(t => {
            const active = t.dataset.target === id;
            t.classList.toggle('active', active);
            t.setAttribute('aria-selected', active);
          });
        }
      });
    }, { rootMargin: '-30% 0px -55% 0px' });

    sections.forEach(s => spy.observe(s));
  }
  } // ── end init() ──

  // ── Startup ─────────────────────────────────────────────────────────
  // When gallery-loader builds the grids dynamically we wait for its
  // `eva:gallery-ready` signal so the lightbox indexes the real photos.
  let started = false;
  function runInit() { if (started) return; started = true; init(); }

  if (window.__evaGalleryDynamic) {
    document.addEventListener('eva:gallery-ready', runInit, { once: true });
    setTimeout(runInit, 6000); // safety net if the loader never signals
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInit);
  } else {
    runInit();
  }

})();
