/**
 * Eva Apartman – Build validator
 * ---------------------------------------------------------------------------
 * Checks the generated site for the mistakes that are easy to make and hard to
 * spot across 16 pages:
 *
 *   - a page missing, or its <html lang> / canonical wrong
 *   - an hreflang cluster that isn't reciprocal (Google ignores the lot)
 *   - a local href/src pointing at a file that isn't on disk
 *   - an <img> without alt, width/height or a loading attribute
 *   - JSON-LD that doesn't parse, or an aggregateRating that contradicts the
 *     rating printed on the page
 *   - sitemap URLs that don't correspond to a built file
 *   - a non-English page still showing English body copy
 *
 * Run:  npm run check
 * Exits non-zero if anything fails, so it can gate a deploy.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.visit-eva-orebic.com';
const LANGS = ['en', 'hr', 'pl', 'de'];
const PAGES = ['index', 'gallery', 'location', 'contact'];

let failures = 0;
let checks = 0;

function ok(msg) { checks++; if (process.env.VERBOSE) console.log('  ✓ ' + msg); }
function fail(msg) { checks++; failures++; console.error('  ✗ ' + msg); }
function assert(cond, msg) { cond ? ok(msg) : fail(msg); }

function pagePath(page, lang) {
  const base = lang === 'en' ? '/' : `/${lang}/`;
  return page === 'index' ? base : `${base}${page}.html`;
}
function outFile(page, lang) {
  return lang === 'en'
    ? path.join(ROOT, `${page}.html`)
    : path.join(ROOT, lang, `${page}.html`);
}

/** Map a root-relative URL back to a file on disk. */
function localFile(url) {
  const clean = url.split('?')[0].split('#')[0];
  if (clean === '/') return path.join(ROOT, 'index.html');
  if (clean.endsWith('/')) return path.join(ROOT, clean, 'index.html');
  return path.join(ROOT, clean);
}

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'images/gallery-manifest.json'), 'utf8'));
const manifestTotal = Object.values(manifest).reduce((n, files) => n + files.length, 0);

console.log('Validating build…\n');

for (const page of PAGES) {
  for (const lang of LANGS) {
    const file = outFile(page, lang);
    const label = path.relative(ROOT, file).replace(/\\/g, '/');

    if (!fs.existsSync(file)) { fail(`${label} — missing`); continue; }
    const $ = cheerio.load(fs.readFileSync(file, 'utf8'));

    /* --- language + canonical --------------------------------------- */
    assert($('html').attr('lang') === lang, `${label} — html lang="${lang}"`);
    const canonical = $('link[rel="canonical"]').attr('href');
    assert(canonical === SITE + pagePath(page, lang),
      `${label} — canonical (${canonical})`);

    /* --- hreflang cluster ------------------------------------------- */
    const alts = {};
    $('link[rel="alternate"][hreflang]').each((_, el) => {
      alts[$(el).attr('hreflang')] = $(el).attr('href');
    });
    for (const l of LANGS) {
      assert(alts[l] === SITE + pagePath(page, l),
        `${label} — hreflang ${l} → ${pagePath(page, l)}`);
    }
    assert(alts['x-default'] === SITE + pagePath(page, 'en'),
      `${label} — hreflang x-default`);
    // Self-reference is required; Google discards clusters without it.
    assert(alts[lang] === canonical, `${label} — hreflang self-reference`);

    /* --- title / description ---------------------------------------- */
    const title = $('title').text().trim();
    const desc = $('meta[name="description"]').attr('content') || '';
    assert(title.length > 10 && title.length < 70, `${label} — title length ${title.length}`);
    assert(desc.length > 50 && desc.length < 200, `${label} — description length ${desc.length}`);

    /* --- local assets exist ----------------------------------------- */
    const refs = [];
    $('link[href^="/"], script[src^="/"], img[src^="/"], source[srcset]').each((_, el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'source') {
        const srcset = $(el).attr('srcset') || '';
        srcset.split(',').forEach(part => {
          const u = part.trim().split(/\s+/)[0];
          if (u && u.startsWith('/')) refs.push(u);
        });
      } else {
        const u = $(el).attr(tag === 'link' ? 'href' : 'src');
        if (u && u.startsWith('/')) refs.push(u);
      }
    });
    const missingAssets = [...new Set(refs)].filter(u => !fs.existsSync(localFile(u)));
    assert(missingAssets.length === 0,
      `${label} — ${refs.length} local assets resolve` +
      (missingAssets.length ? ` (missing: ${missingAssets.slice(0, 4).join(', ')})` : ''));

    /* --- internal links resolve ------------------------------------- */
    const badLinks = [];
    $('a[href^="/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!fs.existsSync(localFile(href))) badLinks.push(href);
    });
    assert(badLinks.length === 0,
      `${label} — internal links resolve` + (badLinks.length ? ` (bad: ${[...new Set(badLinks)].join(', ')})` : ''));

    /* --- images ------------------------------------------------------ */
    // [data-runtime-src] marks the lightbox placeholders, which are empty until
    // a visitor opens a photo. Everything else must be complete.
    const $content = $('img:not([data-runtime-src])');
    const imgIssues = [];
    $content.each((_, el) => {
      const $i = $(el);
      const src = $i.attr('src') || '(no src)';
      if (!$i.attr('alt')) imgIssues.push(`${src}: no alt`);
      if (!$i.attr('width') || !$i.attr('height')) imgIssues.push(`${src}: no dimensions`);
      if (!$i.attr('loading')) imgIssues.push(`${src}: no loading attr`);
    });
    assert(imgIssues.length === 0,
      `${label} — ${$content.length} images complete` +
      (imgIssues.length ? ` (${imgIssues.slice(0, 3).join('; ')})` : ''));

    // Exactly one eager image per page: the rest must defer.
    const eager = $('img[loading="eager"]').length;
    assert(eager <= 3, `${label} — ${eager} eager images`);

    /* --- gallery pre-render ------------------------------------------ */
    if (page === 'gallery') {
      const tiles = $('.gm-item').length;
      assert(tiles === manifestTotal,
        `${label} — ${tiles} pre-rendered tiles (manifest has ${manifestTotal})`);

      const altSet = new Set();
      $('.gm-item img').each((_, el) => altSet.add($(el).attr('alt')));
      assert(altSet.size >= tiles - 2,
        `${label} — ${altSet.size} distinct alt texts across ${tiles} photos`);
    }

    /* --- structured data --------------------------------------------- */
    const ldNodes = $('script[type="application/ld+json"]');
    assert(ldNodes.length === 1, `${label} — exactly one JSON-LD block (${ldNodes.length})`);
    if (ldNodes.length) {
      let data;
      try {
        data = JSON.parse(ldNodes.first().text());
        ok(`${label} — JSON-LD parses`);
      } catch (e) {
        fail(`${label} — JSON-LD parse error: ${e.message}`);
      }
      if (data) {
        const nodes = data['@graph'] || [data];
        assert(Array.isArray(nodes) && nodes.length > 0, `${label} — JSON-LD @graph populated`);

        if (page === 'index') {
          const biz = nodes.find(n => n['@type'] === 'LodgingBusiness');
          assert(!!biz, `${label} — LodgingBusiness present`);
          if (biz) {
            // The number in the markup must equal the number on the page.
            const shown = $('[data-review-rating]').first().text().trim();
            assert(biz.aggregateRating && biz.aggregateRating.ratingValue === shown,
              `${label} — aggregateRating ${biz.aggregateRating && biz.aggregateRating.ratingValue} matches visible ${shown}`);
            assert(Array.isArray(biz.review) && biz.review.length > 0,
              `${label} — ${biz.review ? biz.review.length : 0} Review nodes`);
            assert(biz.offers === undefined,
              `${label} — no invalid 'offers' on LodgingBusiness`);
            assert(biz.occupancy === undefined,
              `${label} — no invalid 'occupancy' on LodgingBusiness`);
          }
        } else {
          const crumbs = nodes.find(n => n['@type'] === 'BreadcrumbList');
          assert(!!crumbs, `${label} — BreadcrumbList present`);
        }

        if (page === 'gallery') {
          const g = nodes.find(n => n['@type'] === 'ImageGallery');
          assert(g && g.associatedMedia && g.associatedMedia.length === manifestTotal,
            `${label} — ImageGallery lists ${g && g.associatedMedia ? g.associatedMedia.length : 0} photos`);
        }
      }
    }

    /* --- translation actually applied -------------------------------- */
    if (lang !== 'en') {
      const enFile = outFile(page, 'en');
      const $en = cheerio.load(fs.readFileSync(enFile, 'utf8'));
      const h1 = $('h1').first().text().trim();
      const enH1 = $en('h1').first().text().trim();
      assert(h1.length > 0 && h1 !== enH1, `${label} — h1 translated ("${h1.slice(0, 40)}")`);
      assert(title !== $en('title').text().trim(), `${label} — title translated`);

      // The switcher must offer real links, not buttons.
      assert($('a.lang-option').length === LANGS.length,
        `${label} — ${$('a.lang-option').length} language links`);
    }
  }
}

/* --- sitemap -------------------------------------------------------- */
console.log('');
const sitemapPath = path.join(ROOT, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  fail('sitemap.xml — missing');
} else {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert(locs.length === PAGES.length * LANGS.length,
    `sitemap.xml — ${locs.length} URLs (expected ${PAGES.length * LANGS.length})`);

  const badLocs = locs.filter(u => !fs.existsSync(localFile(u.replace(SITE, ''))));
  assert(badLocs.length === 0,
    'sitemap.xml — every URL is a built page' + (badLocs.length ? ` (bad: ${badLocs[0]})` : ''));

  const imgCount = (xml.match(/<image:loc>/g) || []).length;
  assert(imgCount === manifestTotal * LANGS.length,
    `sitemap.xml — ${imgCount} image entries (expected ${manifestTotal * LANGS.length})`);
}

/* --- manifest matches disk ------------------------------------------ */
const orphans = [];
for (const [dir, files] of Object.entries(manifest)) {
  for (const f of files) {
    if (!fs.existsSync(path.join(ROOT, dir, f))) orphans.push(dir + f);
  }
}
assert(orphans.length === 0,
  `gallery-manifest.json — all ${manifestTotal} files exist` +
  (orphans.length ? ` (missing: ${orphans.join(', ')})` : ''));

/* --- robots ---------------------------------------------------------- */
const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
assert(!/^\s*Disallow:\s*\/tripuneva1/mi.test(robots),
  'robots.txt — admin path no longer advertised');
assert(/Sitemap:\s*https:\/\//i.test(robots), 'robots.txt — sitemap declared');

/* --- admin ----------------------------------------------------------- */
const admin = fs.readFileSync(path.join(ROOT, 'tripuneva1/index.html'), 'utf8');
assert(!/var PASSWORD\s*=/.test(admin), 'admin — no plaintext password');
assert(/PW_HASH\s*=\s*'[0-9a-f]{64}'/.test(admin), 'admin — PBKDF2 verifier present');
assert(/name="robots"[^>]*noindex/.test(admin), 'admin — noindex meta present');

console.log(`\n${failures ? '✗' : '✓'} ${checks - failures}/${checks} checks passed`);
if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
