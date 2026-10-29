/**
 * Eva Apartman – local test server for the admin panel
 * ---------------------------------------------------------------------------
 * Runs the real netlify/functions/admin.mjs behind a tiny static server, so
 * /admin can be tried on this computer without Netlify:
 *
 *     node tools/admin-dev.js            → http://localhost:8766/admin
 *
 * Nothing here touches the live calendar. JSONBin is replaced by an in-memory
 * copy, seeded by *reading* the live bin once (reads are public); every save
 * stays in memory and is gone when the server stops. The password is
 * "test password local" unless you pass ADMIN_DEV_PASSWORD.
 *
 * Use http://localhost (not 127.0.0.1): browsers only accept the Secure,
 * __Host- session cookie over HTTPS or on localhost.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8766;
const PASSWORD = process.env.ADMIN_DEV_PASSWORD || 'test password local';
const LIVE_BIN = '69bd6aa7c3097a1dd542e037';

/* Test-only secrets, generated fresh on every start. */
const salt = crypto.randomBytes(16);
const N = 2 ** 15, r = 8, p = 1;
const hash = crypto.scryptSync(PASSWORD, salt, 32, { N, r, p, maxmem: 256 * 1024 * 1024 });
process.env.ADMIN_PASSWORD_HASH = `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${hash.toString('base64')}`;
process.env.SESSION_SECRET = crypto.randomBytes(32).toString('base64url');
process.env.JSONBIN_BIN_ID_OVERRIDE = 'local-test-bin';
process.env.JSONBIN_MASTER_KEY = 'local-test-key';

/* In-memory stand-in for JSONBin. */
let store = { seasons: [], booked: [] };
let writes = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts = {}) => {
  if (String(url).startsWith('https://api.jsonbin.io/v3/b/local-test-bin')) {
    if (opts.headers?.['X-Master-Key'] !== 'local-test-key') return new Response('{}', { status: 401 });
    if ((opts.method || 'GET') === 'PUT') {
      store = JSON.parse(opts.body);
      writes++;
      return new Response('{}', { status: 200 });
    }
    return new Response(JSON.stringify(store), { status: 200 });
  }
  return realFetch(url, opts);
};

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.xml': 'application/xml'
};

(async () => {
  try {
    const res = await realFetch(`https://api.jsonbin.io/v3/b/${LIVE_BIN}/latest`, { headers: { 'X-Bin-Meta': 'false' } });
    if (res.ok) store = await res.json();
    console.log(`Seeded with a copy of the live calendar (${store.booked.length} bookings). Saves stay in memory.`);
  } catch {
    console.log('Could not read the live calendar; starting empty.');
  }

  const { default: handler } = await import(pathToFileURL(path.join(ROOT, 'netlify/functions/admin.mjs')).href);

  http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname.startsWith('/api/admin/')) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks)
      });
      const response = await handler(request);
      const headers = {};
      response.headers.forEach((v, k) => { headers[k] = v; });
      res.writeHead(response.status, headers);
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    if (url.pathname === '/__test/store') {           // for automated tests
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ...store, writes }));
      return;
    }

    let file = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    if (url.pathname === '/admin') { res.writeHead(301, { Location: '/admin/' }); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  }).listen(PORT, () => {
    console.log(`Admin test server: http://localhost:${PORT}/admin   (password: "${PASSWORD}")`);
  });
})();
