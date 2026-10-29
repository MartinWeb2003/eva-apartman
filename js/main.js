/**
 * Eva Apartman - Main Site JavaScript
 * Navbar scroll effect, mobile menu, scroll animations, lightbox
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Navbar ──────────────────────────────────────────────────────
  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.navbar-toggle');
  const navMenu   = document.querySelector('.navbar-menu');

  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const open = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';

      // Animate hamburger to X
      const spans = navToggle.querySelectorAll('span');
      if (open) {
        spans[0].style.transform = 'translateY(7px) rotate(45deg)';
        spans[1].style.opacity   = '0';
        spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity   = '';
        spans[2].style.transform = '';
      }
    });

    // Close on nav link click
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        document.body.style.overflow = '';
        const spans = navToggle.querySelectorAll('span');
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }

  // Mark active nav link based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ── Scroll-reveal animations ────────────────────────────────────
  const animEls = document.querySelectorAll('.animate-on-scroll');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger siblings within the same parent
          const siblings = Array.from(entry.target.parentElement.children)
            .filter(el => el.classList.contains('animate-on-scroll'));
          const idx = siblings.indexOf(entry.target);
          entry.target.style.transitionDelay = `${idx * 80}ms`;
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    animEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: show all
    animEls.forEach(el => el.classList.add('visible'));
  }

  // ── Lightbox ─────────────────────────────────────────────────────
  const lightbox    = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  if (lightbox && lightboxImg) {
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if (!img) return;
        // The grid <img> is a downscaled derivative; data-full (set by the
        // build) points at the original so the lightbox opens full resolution.
        lightboxImg.src = item.dataset.full || img.currentSrc || img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
      // Tiles are focusable (tabindex="0"), so let Enter/Space open them too.
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
      });
    });

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  // ── "from €75" → lowest upcoming price set in /admin ────────────
  // /api/prices (netlify/functions/prices.mjs) is CDN-cached, so this costs
  // almost nothing. If it can't be reached, the price built into the page stays.
  const fromEls = document.querySelectorAll('[data-price-from]');
  if (fromEls.length && window.fetch) {
    fetch('/api/prices')
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (!json || typeof json.from !== 'number') return;
        const n = json.from;
        const text = new Intl.NumberFormat(document.documentElement.lang || 'en', {
          style: 'currency', currency: 'EUR',
          minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: n % 1 ? 2 : 0
        }).format(n);
        fromEls.forEach(el => {
          el.textContent = text;
          const labelled = el.closest('[aria-label]');
          if (labelled) labelled.setAttribute('aria-label', labelled.getAttribute('aria-label').replace(/€\s?\d+([.,]\d+)?/, text));
        });
      })
      .catch(() => {});
  }

  // ── Sticky booking bar + WhatsApp button ────────────────────────
  // Appear once the visitor has scrolled past the first screen (the hero
  // already carries the booking bar), and step aside over the footer so
  // they never cover the contact details.
  const stickies = document.querySelectorAll('[data-sticky]');
  const footer = document.querySelector('.footer');
  if (stickies.length) {
    let footerVisible = false;
    const sync = () => {
      const show = window.scrollY > window.innerHeight * 0.7 && !footerVisible;
      stickies.forEach(el => el.classList.toggle('is-visible', show));
    };
    if (footer && 'IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        footerVisible = entries[0].isIntersecting;
        sync();
      }).observe(footer);
    }
    window.addEventListener('scroll', sync, { passive: true });
    sync();
  }

  // ── Reviews row: prev/next step one card at a time ──────────────
  const reviewsRow = document.querySelector('.reviews-track-wrapper');
  const reviewsBtns = document.querySelectorAll('.reviews-nav-btn');
  if (reviewsRow && reviewsBtns.length) {
    const update = () => {
      const max = reviewsRow.scrollWidth - reviewsRow.clientWidth - 2;
      reviewsBtns[0].disabled = reviewsRow.scrollLeft <= 2;
      reviewsBtns[1].disabled = reviewsRow.scrollLeft >= max;
    };
    reviewsBtns.forEach(btn => btn.addEventListener('click', () => {
      const card = reviewsRow.querySelector('.review-card');
      const step = card ? card.getBoundingClientRect().width + 16 : reviewsRow.clientWidth * 0.8;
      reviewsRow.scrollBy({ left: step * Number(btn.dataset.dir), behavior: 'smooth' });
    }));
    reviewsRow.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ── Smooth scroll for anchor links ──────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80; // navbar height
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});
