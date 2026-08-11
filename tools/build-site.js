/**
 * Eva Apartman – Site builder
 * ---------------------------------------------------------------------------
 * Turns the four templates in src/ into the 16 pages that actually ship:
 *
 *     src/index.html    →  /index.html   /hr/index.html   /pl/…   /de/…
 *     src/gallery.html  →  /gallery.html /hr/gallery.html …
 *     src/location.html →  …
 *     src/contact.html  →  …
 *
 * WHY: the translations used to be applied in the browser from localStorage,
 * on a single URL. Googlebot has no localStorage, so it only ever saw English —
 * the Croatian, Polish and German copy was invisible to search. Each language
 * now has its own crawlable URL, its own <html lang>, its own <title>/<meta
 * description>, and a reciprocal hreflang cluster.
 *
 * It also, in the same pass:
 *   - rewrites every <img> to a <picture> with WebP srcset, intrinsic
 *     width/height (no layout shift) and lazy loading below the fold;
 *   - pre-renders the gallery grids so all photos are real HTML with real alt
 *     text instead of being injected by JS;
 *   - injects per-page JSON-LD from tools/structured-data.js;
 *   - writes sitemap.xml with every language URL, hreflang alternates and
 *     image entries.
 *
 * Run:  npm run build      (chains manifest → images → site)
 *       node tools/build-site.js
 *
 * Edit the templates in src/. Never edit the generated files at the repo root
 * or in hr/ pl/ de/ — the next build overwrites them.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cheerio = require('cheerio');

const SD = require('./structured-data');
const T = require('../js/translations.js');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const SITE = SD.SITE;
const LANGS = ['en', 'hr', 'pl', 'de'];
const DEFAULT_LANG = 'en';
const PAGES = ['index', 'gallery', 'location', 'contact'];

const OG_LOCALE = { en: 'en_US', hr: 'hr_HR', pl: 'pl_PL', de: 'de_DE' };

/* Social preview image per page, mirroring what the templates used. */
const OG_IMAGE = {
  index: 'images/indoor/indoor1.jpeg',
  gallery: 'images/indoor/indoor1.jpeg',
  location: 'images/perna-beach.jpg',
  contact: 'images/terrace/terrace1.jpeg'
};

/* Breadcrumb labels reuse keys the templates already translate. */
const CRUMB_KEY = {
  gallery: 'gallery.breadcrumb',
  location: 'location.breadcrumb',
  contact: 'contact.breadcrumb'
};

/* `sizes` per layout context, matched against the nearest ancestor class.
   Wrong values here mean the browser downloads the wrong srcset candidate, so
   they track the CSS grid definitions in css/style.css and css/gallery.css. */
const SIZES_BY_CONTEXT = [
  ['.gm-item', '(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw'],
  ['.gallery-item', '(max-width: 768px) 100vw, (max-width: 1100px) 50vw, 33vw'],
  ['.about-image', '(max-width: 900px) 100vw, 50vw'],
  ['.poi-image', '(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw']
];
const DEFAULT_SIZES = '(max-width: 768px) 100vw, 50vw';

/* Small fixed-size images: no srcset, just the smallest WebP derivative. */
const FIXED_WIDTH_IMAGES = {
  // Rendered heights from css/style.css (.navbar-logo 52px, .footer-logo 72px);
  // both logos are square, so the height doubles as the width.
  'images/Ap_Eva_logo_800x800px-transparent.png': 52,
  'images/Ap_Eva_logo_800x800px_siva.jpg': 72
};

const imageData = JSON.parse(fs.readFileSync(path.join(ROOT, 'images/image-data.json'), 'utf8'));
const altText = JSON.parse(fs.readFileSync(path.join(ROOT, 'images/alt-text.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'images/gallery-manifest.json'), 'utf8'));

/* ── URL helpers ─────────────────────────────────────────────────────── */

/** Root-relative URL for a page in a language. */
function pagePath(page, lang) {
  const base = lang === DEFAULT_LANG ? '/' : `/${lang}/`;
  return page === 'index' ? base : `${base}${page}.html`;
}

function pageUrl(page, lang) {
  return SITE + pagePath(page, lang);
}

/** Where the generated file lands on disk. */
function outFile(page, lang) {
  return lang === DEFAULT_LANG
    ? path.join(ROOT, `${page}.html`)
    : path.join(ROOT, lang, `${page}.html`);
}

function t(lang, key, fallback) {
  const dict = T[lang] || T[DEFAULT_LANG];
  if (dict[key] !== undefined) return dict[key];
  if (T[DEFAULT_LANG][key] !== undefined) return T[DEFAULT_LANG][key];
  return fallback !== undefined ? fallback : '';
}

/* ── Translation pass ────────────────────────────────────────────────── */

function withCount(el, str, $) {
  const n = $(el).attr('data-n');
  return n === undefined ? str : String(str).replace('{n}', n);
}

function translate($, lang) {
  $('[data-i18n]').each((_, el) => {
    const key = $(el).attr('data-i18n');
    const val = t(lang, key, null);
    if (val !== null && val !== '') $(el).text(withCount(el, val, $));
  });
  $('[data-i18n-html]').each((_, el) => {
    const key = $(el).attr('data-i18n-html');
    const val = t(lang, key, null);
    if (val !== null && val !== '') $(el).html(withCount(el, val, $));
  });
  $('[data-i18n-placeholder]').each((_, el) => {
    const key = $(el).attr('data-i18n-placeholder');
    const val = t(lang, key, null);
    if (val !== null && val !== '') $(el).attr('placeholder', val);
  });
  $('[data-i18n-alt]').each((_, el) => {
    const key = $(el).attr('data-i18n-alt');
    const val = t(lang, key, null);
    if (val !== null && val !== '') $(el).attr('alt', val);
  });
}

/* ── Link + asset rewriting ──────────────────────────────────────────── */

/* Everything becomes root-absolute so a page at /hr/ resolves assets the same
   way a page at / does. */
function rewriteAssetPaths($) {
  const attrFor = { link: 'href', script: 'src', img: 'src' };
  $('link[href], script[src], img[src]').each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const attr = attrFor[tag];
    const val = $(el).attr(attr);
    if (!val) return;
    if (/^(https?:)?\/\//.test(val) || val.startsWith('/') || val.startsWith('#') || val.startsWith('data:')) return;
    $(el).attr(attr, '/' + val.replace(/^\.\//, ''));
  });
}

/* ── Cache busting for css/js ────────────────────────────────────────────
   netlify.toml serves /css/* and /js/* with a one-year immutable cache. That
   is only safe because every reference carries a content hash: change the
   file, the URL changes, browsers fetch the new one immediately. Without this
   an edit to style.css could take a year to reach a returning visitor. */
const hashCache = new Map();

function assetHash(rootRelative) {
  if (hashCache.has(rootRelative)) return hashCache.get(rootRelative);
  const abs = path.join(ROOT, rootRelative.replace(/^\//, ''));
  let hash = '';
  try {
    hash = crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex').slice(0, 8);
  } catch (e) {
    console.warn(`  ! cannot hash ${rootRelative}: ${e.code}`);
  }
  hashCache.set(rootRelative, hash);
  return hash;
}

function fingerprintAssets($) {
  $('link[rel="stylesheet"][href^="/css/"], script[src^="/js/"]').each((_, el) => {
    const isLink = el.tagName.toLowerCase() === 'link';
    const attr = isLink ? 'href' : 'src';
    const val = $(el).attr(attr);
    if (!val || val.includes('?')) return;
    const hash = assetHash(val);
    if (hash) $(el).attr(attr, `${val}?v=${hash}`);
  });
}

function rewriteInternalLinks($, lang) {
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    if (/^(https?:|mailto:|tel:|#|\/)/.test(href)) return;

    const [file, hash] = href.split('#');
    const page = path.basename(file || '', '.html');
    if (!PAGES.includes(page)) return;

    $(el).attr('href', pagePath(page, lang) + (hash ? '#' + hash : ''));
  });
}

/* ── <img> → <picture> ───────────────────────────────────────────────── */

function sizesFor($, el) {
  const explicit = $(el).attr('data-sizes');
  if (explicit) return explicit;
  for (const [selector, sizes] of SIZES_BY_CONTEXT) {
    if ($(el).closest(selector).length) return sizes;
  }
  return DEFAULT_SIZES;
}

/**
 * Replace an <img src="images/…"> with a <picture> that serves WebP first and
 * keeps the original JPEG/PNG as the fallback. Adds intrinsic width/height so
 * the browser reserves the right box before the bytes arrive.
 *
 * @param {boolean} eager  true for the single above-the-fold image on a page
 */
function toPicture($, el, { eager = false } = {}) {
  const $img = $(el);
  const raw = ($img.attr('src') || '').replace(/^\//, '');
  const data = imageData.images[raw];
  if (!data) return false; // unknown file — leave the plain <img> alone

  const fixedWidth = FIXED_WIDTH_IMAGES[raw];
  const ratio = data.height / data.width;

  // Attribute dimensions: the rendered box for fixed-size images, otherwise
  // the intrinsic size. Either way the aspect ratio is right, which is what
  // stops the layout shift.
  const attrW = fixedWidth || data.width;
  const attrH = Math.round(attrW * ratio);

  $img.attr('width', String(attrW));
  $img.attr('height', String(attrH));
  $img.attr('decoding', 'async');
  if (eager) {
    $img.attr('loading', 'eager');
    $img.attr('fetchpriority', 'high');
  } else {
    $img.attr('loading', 'lazy');
  }

  let webpSrcset;
  let sizes = null;
  if (fixedWidth) {
    // A 96px logo needs one derivative, not three. Pick a 2× variant for
    // retina and stop there.
    const pick = data.webp.find(v => v.w >= fixedWidth * 2) || data.webp[data.webp.length - 1];
    webpSrcset = '/' + pick.src;
  } else {
    webpSrcset = data.webp.map(v => `/${v.src} ${v.w}w`).join(', ');
    sizes = sizesFor($, el);
  }

  // Point the <img> at the downscaled fallback rather than the multi-megabyte
  // original. It carries no srcset of its own — it is only reached by browsers
  // that can't do WebP, and one sensible size is enough for them.
  $img.attr('src', '/' + data.fallback);

  const $source = $('<source>')
    .attr('type', 'image/webp')
    .attr('srcset', webpSrcset);
  if (sizes) $source.attr('sizes', sizes);

  const $picture = $('<picture></picture>');
  $picture.append($source);
  $img.replaceWith($picture);
  $picture.append($img);

  // Lightboxes need the full-resolution original, not the derivative now in
  // src. js/main.js reads this off the tile.
  const $tile = $picture.closest('.gallery-item');
  if ($tile.length) $tile.attr('data-full', '/' + raw);

  return true;
}

function convertImages($) {
  let first = true;
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (!src.replace(/^\//, '').startsWith('images/')) return;
    const converted = toPicture($, el, { eager: first });
    if (converted) first = false;
  });
}

/* location.html's poi photos carry an onerror placeholder that replaces
   this.parentElement's HTML. Wrapping the img in <picture> changes what
   parentElement means, so retarget it at the tile it was always meant to
   replace. */
function fixOnErrorTargets($) {
  $('[onerror]').each((_, el) => {
    const handler = $(el).attr('onerror');
    if (handler && handler.includes('this.parentElement')) {
      $(el).attr('onerror', handler.replace(/this\.parentElement/g, "this.closest('.poi-image')"));
    }
  });
}

/* ── Head: canonical, hreflang, Open Graph ───────────────────────────── */

function buildHead($, page, lang) {
  const url = pageUrl(page, lang);
  const title = t(lang, `${page}.title`);
  const desc = t(lang, `${page}.metadesc`);
  const ogAlt = t(lang, `${page}.ogalt`);
  const ogImageRel = OG_IMAGE[page];
  const ogImage = `${SITE}/${ogImageRel}`;
  const ogData = imageData.images[ogImageRel];

  $('title').remove();
  $('link[rel="canonical"]').remove();
  $('link[rel="alternate"]').remove();
  $('meta[name="description"]').remove();
  $('meta[property^="og:"]').remove();
  $('meta[name^="twitter:"]').remove();

  // The templates label these blocks with HTML comments. We regenerate the
  // blocks (and their labels), so drop the originals or every page ends up with
  // an orphaned "<!-- Twitter Card -->" pointing at nothing.
  $('head').contents().filter((_, node) => node.type === 'comment').remove();

  const parts = [];
  parts.push(`<title>${escapeHtml(title)}</title>`);
  parts.push(`<meta name="description" content="${escapeAttr(desc)}" />`);
  parts.push(`<link rel="canonical" href="${url}" />`);

  parts.push('');
  parts.push('<!-- hreflang cluster: every language of this page, plus x-default -->');
  for (const l of LANGS) {
    parts.push(`<link rel="alternate" hreflang="${l}" href="${pageUrl(page, l)}" />`);
  }
  parts.push(`<link rel="alternate" hreflang="x-default" href="${pageUrl(page, DEFAULT_LANG)}" />`);

  parts.push('');
  parts.push('<!-- Open Graph / Facebook -->');
  parts.push('<meta property="og:type" content="website" />');
  parts.push('<meta property="og:site_name" content="Eva Apartman" />');
  parts.push(`<meta property="og:locale" content="${OG_LOCALE[lang]}" />`);
  for (const l of LANGS) {
    if (l !== lang) parts.push(`<meta property="og:locale:alternate" content="${OG_LOCALE[l]}" />`);
  }
  parts.push(`<meta property="og:url" content="${url}" />`);
  parts.push(`<meta property="og:title" content="${escapeAttr(title)}" />`);
  parts.push(`<meta property="og:description" content="${escapeAttr(desc)}" />`);
  parts.push(`<meta property="og:image" content="${ogImage}" />`);
  if (ogData) {
    parts.push(`<meta property="og:image:width" content="${ogData.width}" />`);
    parts.push(`<meta property="og:image:height" content="${ogData.height}" />`);
  }
  parts.push(`<meta property="og:image:alt" content="${escapeAttr(ogAlt)}" />`);

  parts.push('');
  parts.push('<!-- Twitter Card -->');
  parts.push('<meta name="twitter:card" content="summary_large_image" />');
  parts.push(`<meta name="twitter:title" content="${escapeAttr(title)}" />`);
  parts.push(`<meta name="twitter:description" content="${escapeAttr(desc)}" />`);
  parts.push(`<meta name="twitter:image" content="${ogImage}" />`);
  parts.push(`<meta name="twitter:image:alt" content="${escapeAttr(ogAlt)}" />`);

  $('head').prepend('\n  ' + parts.join('\n  ') + '\n');

  // charset/viewport must stay first in the head.
  const $charset = $('head meta[charset]');
  const $viewport = $('head meta[name="viewport"]');
  if ($viewport.length) $('head').prepend($viewport);
  if ($charset.length) $('head').prepend($charset);
}

/* The hero background is the homepage LCP element; preloading it starts the
   download with the HTML instead of after css/style.css parses. */
function preloadHero($, page) {
  if (page !== 'index') return;
  const hero = imageData.hero;
  if (!hero) return;
  const small = hero.webp[0];
  $('head').append(
    `\n  <!-- LCP: hero backdrop used by .hero-bg in css/style.css -->\n` +
    `  <link rel="preload" as="image" type="image/webp" href="/${small.src}" fetchpriority="high" />\n`
  );
}

/* ── Language switcher: buttons → real links ─────────────────────────── */

function localiseSwitcher($, page, lang) {
  $('.lang-option').each((_, el) => {
    const $el = $(el);
    const optLang = $el.attr('data-lang');
    if (!LANGS.includes(optLang)) return;

    // A real <a href> means the alternate URLs are crawlable from every page
    // and open-in-new-tab works.
    const $a = $('<a></a>');
    $a.attr('class', $el.attr('class'));
    $a.attr('data-lang', optLang);
    $a.attr('href', pagePath(page, optLang));
    $a.attr('hreflang', optLang);
    $a.attr('lang', optLang);
    if (optLang === lang) {
      $a.addClass('active');
      $a.attr('aria-current', 'true');
    }
    $a.html($el.html());
    $el.replaceWith($a);
  });

  $('.lang-current').text(lang.toUpperCase());
}

/* ── Gallery pre-render ──────────────────────────────────────────────── */

function altFor(src, lang, fallback) {
  const entry = altText[src];
  if (entry && entry[lang]) return entry[lang];
  if (entry && entry.en) return entry.en;
  return fallback;
}

/* Appended to every gallery alt so each one carries the location without
   having to repeat it in alt-text.json. */
const ALT_SUFFIX = {
  en: 'Eva Apartman, Kućište',
  hr: 'Eva Apartman, Kućište',
  pl: 'Eva Apartman, Kućište',
  de: 'Eva Apartman, Kućište'
};

function renderGallery($, lang) {
  const photos = [];
  const openLabel = t(lang, 'gallery.openphoto', 'Open photo');

  $('.gallery-masonry').each((_, grid) => {
    const $grid = $(grid);
    const folder = $grid.attr('data-gallery-folder');
    const genericAlt = $grid.attr('data-gallery-alt') || '';
    const label = $grid.attr('data-gallery-label') || '';
    const files = manifest[folder] || [];

    $grid.empty();

    files.forEach((file, i) => {
      const src = folder + file;
      const data = imageData.images[src];
      if (!data) {
        console.warn(`  ! no derivatives for ${src}, run tools/optimize-images.js`);
        return;
      }

      const alt = `${altFor(src, lang, genericAlt)}, ${ALT_SUFFIX[lang]}`;
      const srcset = data.webp.map(v => `/${v.src} ${v.w}w`).join(', ');
      const sizes = '(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw';
      const ratioH = Math.round(1200 * (data.height / data.width));

      // The first two tiles of the first grid are plausibly above the fold on a
      // desktop viewport; everything else defers.
      const lazy = !(i < 2 && folder === Object.keys(manifest)[0]);

      const html =
        `<div class="gm-item animate-on-scroll" tabindex="0" role="button"` +
        ` aria-label="${escapeAttr(openLabel)}: ${escapeAttr(alt)}" data-full="/${src}">` +
        `<picture>` +
        `<source type="image/webp" srcset="${srcset}" sizes="${sizes}" />` +
        `<img src="/${data.fallback}" alt="${escapeAttr(alt)}" width="1200" height="${ratioH}"` +
        ` loading="${lazy ? 'lazy' : 'eager'}" decoding="async" />` +
        `</picture>` +
        `<div class="gm-overlay" aria-hidden="true">` +
        `<svg class="gm-zoom-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
        `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>` +
        `<line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div>` +
        `</div>`;

      $grid.append(html);
      photos.push({ src, alt, thumb: data.fallback, label });
    });

    // Counts shown next to each section heading.
    const $section = $grid.closest('.gallery-section');
    const $count = $section.find('.gallery-photo-count');
    if ($count.length) {
      $count.attr('data-n', String(files.length));
      $count.attr('aria-label', `${files.length} photos`);
      const key = $count.attr('data-i18n');
      if (key) $count.text(String(t(lang, key, '{n} photos')).replace('{n}', files.length));
    }
    const sectionId = $section.attr('id');
    if (sectionId) {
      $(`.gallery-tab[data-target="${sectionId}"] .gallery-tab-count`).text(String(files.length));
    }
  });

  // Header total.
  const $header = $('[data-i18n="gallery.header.p"]');
  if ($header.length) {
    $header.attr('data-n', String(photos.length));
    const key = $header.attr('data-i18n');
    $header.text(String(t(lang, key, '')).replace('{n}', photos.length));
  }

  return photos;
}

/* ── Structured data ─────────────────────────────────────────────────── */

/** Read the reviews back out of the rendered page so markup can never drift
    from what a visitor actually sees. */
function scrapeReviews($) {
  const reviews = [];
  $('.review-card').each((_, el) => {
    const $card = $(el);
    if ($card.attr('aria-hidden') === 'true') return; // duplicated marquee copy
    const author = $card.find('.review-author strong').first().text().trim();
    const body = $card.find('.review-text').first().text().trim();
    if (author) reviews.push({ author, body });
  });
  return reviews;
}

/** Same idea for the location page's point-of-interest cards. */
function scrapeAttractions($) {
  const TYPE_BY_TAG = {
    Beach: 'Beach',
    Dining: 'Restaurant',
    Activity: 'TouristAttraction'
  };
  const out = [];
  $('.poi-card').each((_, el) => {
    const $card = $(el);
    const name = $card.find('.poi-body h4').first().text().trim();
    const description = $card.find('.poi-body p').first().text().trim();
    const tag = $card.find('.poi-tag').first().text().trim();
    const image = ($card.find('img').first().attr('src') || '').replace(/^\//, '');
    if (!name) return;
    out.push({ name, description, image, type: TYPE_BY_TAG[tag] || 'TouristAttraction' });
  });
  return out;
}

function injectStructuredData($, page, lang, extras) {
  const url = pageUrl(page, lang);
  const home = { name: t(lang, 'footer.home', 'Home'), url: pagePath('index', lang) };

  let nodes;
  if (page === 'index') {
    nodes = SD.indexGraph({
      lang,
      url,
      reviews: extras.reviews,
      images: [
        `${SITE}/images/indoor/indoor1.jpeg`,
        `${SITE}/images/terrace/terrace1.jpeg`,
        `${SITE}/images/beach/beach1.jpeg`
      ]
    });
  } else if (page === 'gallery') {
    nodes = SD.galleryGraph({
      lang,
      url,
      crumbs: [home, { name: t(lang, CRUMB_KEY.gallery, 'Gallery') }],
      photos: extras.photos,
      headline: t(lang, 'gallery.title')
    });
  } else if (page === 'location') {
    nodes = SD.locationGraph({
      lang,
      url,
      crumbs: [home, { name: t(lang, CRUMB_KEY.location, 'Location') }],
      attractions: extras.attractions
    });
  } else {
    nodes = SD.contactGraph({
      lang,
      url,
      crumbs: [home, { name: t(lang, CRUMB_KEY.contact, 'Book') }],
      name: t(lang, 'contact.title')
    });
  }

  const json = JSON.stringify(SD.graph(nodes), null, 2);
  $('script[type="application/ld+json"]').remove();
  $('head').append(
    `\n  <!-- Structured data, generated by tools/structured-data.js -->\n` +
    `  <script type="application/ld+json">\n${json}\n  </script>\n`
  );
}

/* ── Misc head/body touches ──────────────────────────────────────────── */

function addTranslationsScript($) {
  const $i18n = $('script[src$="i18n.js"]').first();
  if (!$i18n.length) return;
  if ($('script[src$="translations.js"]').length) return;
  $i18n.before('<script src="/js/translations.js"></script>\n  ');
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

/* ── Per-page build ──────────────────────────────────────────────────── */

function buildPage(page, lang) {
  const html = fs.readFileSync(path.join(SRC, `${page}.html`), 'utf8');
  const $ = cheerio.load(html);

  $('html').attr('lang', lang).attr('data-page', page).attr('class', `lang-${lang}`);

  // Order matters: translate first so scraped text is in the page's language,
  // then rewrite paths, then swap images, then derive structured data.
  translate($, lang);

  const extras = {};
  if (page === 'gallery') extras.photos = renderGallery($, lang);

  rewriteAssetPaths($);
  rewriteInternalLinks($, lang);
  fixOnErrorTargets($);
  convertImages($);

  if (page === 'index') extras.reviews = scrapeReviews($);
  if (page === 'location') extras.attractions = scrapeAttractions($);

  buildHead($, page, lang);
  preloadHero($, page);
  localiseSwitcher($, page, lang);
  addTranslationsScript($);
  injectStructuredData($, page, lang, extras);
  fingerprintAssets($); // last, so it also stamps the script tag added above

  const out = outFile(page, lang);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  // $.html() already emits the doctype from the template. Collapse the blank
  // runs left behind by the tags we removed so the output stays readable.
  const rendered = $.html().replace(/(?:\n[ \t]*){3,}/g, '\n\n');
  fs.writeFileSync(out, rendered + '\n', 'utf8');
  return { out, extras };
}

/* ── sitemap.xml ─────────────────────────────────────────────────────── */

function buildSitemap(galleryPhotos) {
  const today = new Date().toISOString().slice(0, 10);
  const priority = { index: '1.0', contact: '0.9', gallery: '0.7', location: '0.7' };
  const changefreq = { index: 'weekly', contact: 'weekly', gallery: 'monthly', location: 'monthly' };

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
  ];

  for (const page of PAGES) {
    for (const lang of LANGS) {
      lines.push('  <url>');
      lines.push(`    <loc>${pageUrl(page, lang)}</loc>`);
      // Every URL in a cluster must list the whole cluster, itself included.
      for (const alt of LANGS) {
        lines.push(`    <xhtml:link rel="alternate" hreflang="${alt}" href="${pageUrl(page, alt)}"/>`);
      }
      lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(page, DEFAULT_LANG)}"/>`);
      lines.push(`    <lastmod>${today}</lastmod>`);
      lines.push(`    <changefreq>${changefreq[page]}</changefreq>`);
      lines.push(`    <priority>${priority[page]}</priority>`);

      // Image entries make the photos discoverable in Google Images.
      if (page === 'gallery') {
        for (const photo of galleryPhotos[lang] || []) {
          lines.push('    <image:image>');
          lines.push(`      <image:loc>${SITE}/${photo.src}</image:loc>`);
          lines.push(`      <image:title>${escapeHtml(photo.alt)}</image:title>`);
          lines.push('    </image:image>');
        }
      }
      lines.push('  </url>');
    }
  }

  lines.push('</urlset>');
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), lines.join('\n') + '\n', 'utf8');
  return PAGES.length * LANGS.length;
}

/* ── Main ────────────────────────────────────────────────────────────── */

function main() {
  console.log('Building site…\n');
  const galleryPhotos = {};
  let count = 0;

  for (const page of PAGES) {
    for (const lang of LANGS) {
      const { out, extras } = buildPage(page, lang);
      if (page === 'gallery') galleryPhotos[lang] = extras.photos;
      console.log('  ' + path.relative(ROOT, out).replace(/\\/g, '/'));
      count++;
    }
  }

  const urls = buildSitemap(galleryPhotos);
  console.log(`\n✓ ${count} pages · sitemap.xml with ${urls} URLs`);
  console.log(`✓ gallery pre-rendered with ${(galleryPhotos.en || []).length} photos per language`);
}

main();
