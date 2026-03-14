/**
 * Eva Apartman – Gallery Page
 * Handles: section tab navigation + scroll-spy, enhanced lightbox,
 *          keyboard nav (← →, Esc), touch swipe, image error placeholders.
 */

(function () {
  'use strict';

  // ── Image registry ──────────────────────────────────────────────────
  // Built from every .gm-item on the page, in DOM order.
  const images = [];

  document.querySelectorAll('.gm-item').forEach((item, i) => {
    const img = item.querySelector('img');
    if (!img) return;

    images.push({ src: img.src, alt: img.alt, section: item.closest('.gallery-section')?.dataset.section || '' });
    item.dataset.idx = i;

    // Replace broken images with a styled placeholder
    img.addEventListener('error', () => {
      const ar   = item.dataset.ar || '4/3';
      const ph   = makePlaceholder(img.alt, ar);
      img.replaceWith(ph);
      // Update registry to empty src so lightbox skips broken images gracefully
      images[i].src = '';
    });

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

    lbCount.textContent  = `${currentIdx + 1} / ${images.length}`;
    lbCaption.textContent = section && alt ? `${section}  ·  ${alt}` : (alt || section || '');

    lbPrev.disabled = currentIdx === 0;
    lbNext.disabled = currentIdx === images.length - 1;
  }

  function prev() { if (currentIdx > 0) { currentIdx--; render(); } }
  function next() { if (currentIdx < images.length - 1) { currentIdx++; render(); } }

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

  // ── Placeholder helper ──────────────────────────────────────────────
  function makePlaceholder(label, ar) {
    const div = document.createElement('div');
    div.className = 'gm-placeholder';
    div.style.aspectRatio = ar;
    div.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <span>${label || 'Photo coming soon'}</span>`;
    return div;
  }

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

})();
