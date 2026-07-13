/**
 * Eva Apartman – Gallery manifest builder
 * ---------------------------------------------------------------------------
 * Scans each gallery image folder and writes images/gallery-manifest.json,
 * which the site reads to render the photo grids WITHOUT probing the server
 * (so no 404 console errors, one request instead of dozens).
 *
 * Run it whenever you add or remove photos:
 *     node tools/build-manifest.js
 * or just double-click  update-gallery.bat  in the project root.
 *
 * The folders to scan are read straight from gallery.html
 * (every  data-gallery-folder="..."  on a .gallery-masonry), so this stays in
 * sync automatically if a new section is added there.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const GALLERY  = path.join(ROOT, 'gallery.html');
const OUT_FILE = path.join(ROOT, 'images', 'gallery-manifest.json');
const IMG_RE   = /\.(jpe?g|png|webp)$/i;

// Pull every folder referenced by the gallery grids out of gallery.html.
function readFolders() {
  const html = fs.readFileSync(GALLERY, 'utf8');
  const re = /data-gallery-folder="([^"]+)"/g;
  const folders = [];
  let m;
  while ((m = re.exec(html)) !== null) folders.push(m[1]);
  return folders;
}

// Numeric part before the extension, so indoor2 sorts before indoor10.
function trailingNumber(name) {
  const m = name.match(/(\d+)(?=\.[^.]+$)/);
  return m ? parseInt(m[1], 10) : 0;
}

function main() {
  const folders = readFolders();
  if (!folders.length) {
    console.error('No data-gallery-folder entries found in gallery.html — nothing to do.');
    process.exit(1);
  }

  const manifest = {};
  let grandTotal = 0;

  folders.forEach(function (folder) {
    const dir = path.join(ROOT, folder);
    let files = [];
    try {
      files = fs.readdirSync(dir)
        .filter(function (f) { return IMG_RE.test(f); })
        .sort(function (a, b) { return trailingNumber(a) - trailingNumber(b) || a.localeCompare(b); });
    } catch (e) {
      console.warn('  ! could not read folder: ' + folder + ' (' + e.code + ')');
    }
    manifest[folder] = files;
    grandTotal += files.length;
    console.log('  ' + folder.padEnd(20) + files.length + ' photos');
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('\n✓ Wrote ' + path.relative(ROOT, OUT_FILE) + '  (' + grandTotal + ' photos total)');
}

main();
