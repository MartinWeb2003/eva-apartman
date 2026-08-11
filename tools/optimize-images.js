/**
 * Eva Apartman – Image optimiser
 * ---------------------------------------------------------------------------
 * Reads every photo in images/ and writes responsive derivatives into
 * images/opt/, then records each source image's intrinsic size in
 * images/image-data.json.
 *
 * Why it exists:
 *   - The originals are 2000×1500 JPEGs (200–700 KB) served into slots a few
 *     hundred pixels wide. That was ~2.4 MB on the homepage alone.
 *   - Every <img> needs width/height to stop layout shift, and the build
 *     script reads those numbers from image-data.json.
 *
 * Output per source image (widths larger than the original are skipped):
 *     images/opt/<dir>/<name>-240.webp
 *     images/opt/<dir>/<name>-480.webp
 *     images/opt/<dir>/<name>-960.webp
 *     images/opt/<dir>/<name>-1440.webp
 *     images/opt/<dir>/<name>-960.jpg     ← <picture> fallback
 *                                           (.png when the source is a PNG, so
 *                                            transparency survives)
 *
 * Plus a purpose-built hero crop (wide, not the 2048×2048 square) at
 *     images/opt/hero/hero-{1280,1920}.{webp,jpg}
 *
 * Usage:  node tools/optimize-images.js [--force]
 * Existing derivatives are reused unless --force is passed or the source is
 * newer, so re-runs are cheap.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT    = path.resolve(__dirname, '..');
const IMAGES  = path.join(ROOT, 'images');
const OPT     = path.join(IMAGES, 'opt');
const DATA    = path.join(IMAGES, 'image-data.json');
const FORCE   = process.argv.includes('--force');

const WIDTHS        = [240, 480, 960, 1440];
const FALLBACK_W    = 960;
const WEBP_QUALITY  = 78;
const JPEG_QUALITY  = 80;
const WEBP_EFFORT   = 6;   // slower build, ~7% smaller files, no quality cost

/* The hero is a decorative background at 35% opacity behind a dark gradient,
   so it can take far heavier compression than a photo the guest actually
   studies — q45 at 1280px is visually identical here and 10× lighter than the
   2048×2048 original that used to be the LCP element. */
const HERO_SOURCE  = 'images/terrace/terrace1.jpeg';
const HERO_WIDTHS  = [1280, 1920];
const HERO_QUALITY = 45;
const HERO_RATIO   = 16 / 9;
/* Matches the existing `background-position: center` so the pre-crop shows the
   same part of the photo the CSS used to crop to at runtime. */
const HERO_CROP    = 'center';

const SKIP_DIRS = new Set(['opt']);
const IMAGE_RE  = /\.(jpe?g|png)$/i;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : walk(full);
    return IMAGE_RE.test(entry.name) ? [full] : [];
  });
}

function posix(p) {
  return p.split(path.sep).join('/');
}

/** Skip work when the derivative already exists and is newer than the source. */
function isFresh(out, srcStat) {
  if (FORCE || !fs.existsSync(out)) return false;
  return fs.statSync(out).mtimeMs >= srcStat.mtimeMs;
}

async function buildDerivatives(srcAbs, stats) {
  const rel     = posix(path.relative(ROOT, srcAbs));          // images/indoor/indoor1.jpeg
  const relImg  = posix(path.relative(IMAGES, srcAbs));        // indoor/indoor1.jpeg
  const dir     = path.dirname(relImg);
  const name    = path.basename(relImg, path.extname(relImg));
  const outDir  = path.join(OPT, dir);
  fs.mkdirSync(outDir, { recursive: true });

  const meta = await sharp(srcAbs).metadata();
  const entry = {
    width:  meta.width,
    height: meta.height,
    webp:   [],
    fallback: null
  };

  const prefix = posix(path.join('images/opt', dir, name));

  for (const w of WIDTHS) {
    // Never upscale — a 480px-wide source gains nothing from a 1440 variant.
    if (w > meta.width) continue;
    const out = path.join(outDir, `${name}-${w}.webp`);
    if (!isFresh(out, stats)) {
      await sharp(srcAbs).resize({ width: w, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT, smartSubsample: true }).toFile(out);
    }
    entry.webp.push({ w, src: `${prefix}-${w}.webp` });
  }

  // Always emit at least one WebP, even for images narrower than 480px.
  if (!entry.webp.length) {
    const out = path.join(outDir, `${name}-${meta.width}.webp`);
    if (!isFresh(out, stats)) {
      await sharp(srcAbs).webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT, smartSubsample: true }).toFile(out);
    }
    entry.webp.push({ w: meta.width, src: `${prefix}-${meta.width}.webp` });
  }

  /* The fallback keeps the source's format: re-encoding a transparent PNG (the
     logo) as JPEG would flatten its alpha onto a solid box for every browser
     that can't do WebP. */
  const isPng   = path.extname(srcAbs).toLowerCase() === '.png';
  const fbExt   = isPng ? 'png' : 'jpg';
  const fbW     = Math.min(FALLBACK_W, meta.width);
  const fbOut   = path.join(outDir, `${name}-${fbW}.${fbExt}`);
  if (!isFresh(fbOut, stats)) {
    const pipeline = sharp(srcAbs).resize({ width: fbW, withoutEnlargement: true });
    await (isPng
      ? pipeline.png({ compressionLevel: 9, palette: true })
      : pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    ).toFile(fbOut);
  }
  entry.fallback = `${prefix}-${fbW}.${fbExt}`;

  return [rel, entry];
}

async function buildHero() {
  const srcAbs = path.join(ROOT, HERO_SOURCE);
  if (!fs.existsSync(srcAbs)) {
    console.warn(`  ! hero source missing: ${HERO_SOURCE}`);
    return null;
  }
  const outDir = path.join(OPT, 'hero');
  fs.mkdirSync(outDir, { recursive: true });
  const stats = fs.statSync(srcAbs);
  const out = { webp: [], jpg: [] };

  for (const w of HERO_WIDTHS) {
    const h = Math.round(w / HERO_RATIO);
    const webp = path.join(outDir, `hero-${w}.webp`);
    const jpg  = path.join(outDir, `hero-${w}.jpg`);
    if (!isFresh(webp, stats)) {
      await sharp(srcAbs).resize({ width: w, height: h, fit: 'cover', position: HERO_CROP })
        .webp({ quality: HERO_QUALITY, effort: WEBP_EFFORT, smartSubsample: true }).toFile(webp);
    }
    if (!isFresh(jpg, stats)) {
      await sharp(srcAbs).resize({ width: w, height: h, fit: 'cover', position: HERO_CROP })
        .jpeg({ quality: HERO_QUALITY + 15, mozjpeg: true }).toFile(jpg);
    }
    out.webp.push({ w, src: `images/opt/hero/hero-${w}.webp` });
    out.jpg.push({ w, src: `images/opt/hero/hero-${w}.jpg` });
  }
  return out;
}

(async function main() {
  const sources = walk(IMAGES);
  console.log(`Optimising ${sources.length} images${FORCE ? ' (forced)' : ''}…`);

  const data = { images: {}, hero: null };
  let done = 0;

  for (const srcAbs of sources) {
    const stats = fs.statSync(srcAbs);
    try {
      const [rel, entry] = await buildDerivatives(srcAbs, stats);
      data.images[rel] = entry;
    } catch (err) {
      console.warn(`  ! skipped ${posix(path.relative(ROOT, srcAbs))}: ${err.message}`);
    }
    if (++done % 20 === 0) console.log(`  …${done}/${sources.length}`);
  }

  data.hero = await buildHero();

  fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n', 'utf8');

  // Report the totals so regressions are obvious on the next run. walk() filters
  // on IMAGE_RE, which deliberately excludes .webp (they are outputs, never
  // inputs) — so count the derivative directory directly instead.
  const allFiles = dir => fs.readdirSync(dir, { withFileTypes: true })
    .flatMap(e => e.isDirectory() ? allFiles(path.join(dir, e.name)) : [path.join(dir, e.name)]);
  const before = sources.reduce((n, f) => n + fs.statSync(f).size, 0);
  const derivatives = allFiles(OPT);
  const after = derivatives.reduce((n, f) => n + fs.statSync(f).size, 0);

  console.log(`\nWrote images/image-data.json (${Object.keys(data.images).length} images)`);
  console.log(`Originals: ${(before / 1048576).toFixed(1)} MB`);
  console.log(`Derivatives: ${derivatives.length} files, ${(after / 1048576).toFixed(1)} MB ` +
              `(committed to the repo — Netlify publishes them as-is)`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
