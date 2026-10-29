/**
 * Eva Apartman — admin API (Netlify Function, no dependencies)
 * ---------------------------------------------------------------------------
 * Everything the /admin page can do goes through here, and every request is
 * checked on the server:
 *
 *   POST /api/admin/login    { password }            → sets a 30-day session cookie
 *   POST /api/admin/logout                           → clears it
 *   GET  /api/admin/data                             → { seasons, booked }
 *   POST /api/admin/data     { op, ... }             → applies one change, returns new data
 *
 * Secrets live only in Netlify environment variables, never in the browser:
 *
 *   ADMIN_PASSWORD_HASH   scrypt verifier, from `node tools/admin-password.js`
 *   SESSION_SECRET        random string (≥ 32 chars), signs the session cookie.
 *                         Changing it signs everyone out on every device.
 *   JSONBIN_MASTER_KEY    JSONBin write key
 *
 * The bin ID is NOT a secret — the public site reads the calendar with it
 * (js/availability.js) — so it lives in code below, not in an environment
 * variable. Netlify's secrets scanner fails the deploy if an environment
 * variable's value also appears in the repo, so don't add JSONBIN_BIN_ID there.
 *
 * Changes are sent as single operations ("add this booking"), not as a whole
 * new calendar. The server applies each one to the latest stored data, so two
 * phones editing at once can't silently overwrite each other.
 *
 * The bin is publicly readable (the website reads it), so it must only ever
 * hold dates — never guest names or contact details.
 */
import crypto from 'node:crypto';
import { promisify } from 'node:util';

export const config = { path: '/api/admin/*' };

const scrypt = promisify(crypto.scrypt);

/* Same public bin as js/availability.js (JSONBIN_BIN_ID). */
const BIN_ID = '69bd6aa7c3097a1dd542e037';

const COOKIE = '__Host-eva_admin';
const SESSION_DAYS = 30;
const JSONBIN = 'https://api.jsonbin.io/v3/b/';
const MAX_ENTRIES = 500;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const env = key => process.env[key] || '';

/* ── HTTP helpers ──────────────────────────────────────────────────────── */

function json(status, body, headers = {}) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      ...headers
    }
  });
}

class ApiError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

function cookieHeader(value, maxAge) {
  return `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

function readCookie(req, name) {
  const header = req.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return '';
}

/* Requests that change something must come from this site's own pages. The
   SameSite=Strict cookie already stops cross-site requests from carrying the
   session; checking Origin and a custom header closes the remaining gaps. */
function assertSameOrigin(req) {
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) throw new ApiError(403, 'bad_origin');
  if (req.headers.get('x-eva-admin') !== '1') throw new ApiError(403, 'bad_request');
}

/* ── Password + session ────────────────────────────────────────────────── */

/* ADMIN_PASSWORD_HASH = "scrypt$N$r$p$<salt base64>$<hash base64>" */
async function passwordMatches(password) {
  const stored = env('ADMIN_PASSWORD_HASH');
  const [alg, N, r, p, salt, hash] = stored.split('$');
  if (alg !== 'scrypt' || !salt || !hash) throw new ApiError(503, 'not_configured');
  const expected = Buffer.from(hash, 'base64');
  const actual = await scrypt(String(password).normalize('NFC'), Buffer.from(salt, 'base64'), expected.length,
    { N: Number(N), r: Number(r), p: Number(p), maxmem: 256 * 1024 * 1024 });
  return crypto.timingSafeEqual(actual, expected);
}

function sessionSecret() {
  const secret = env('SESSION_SECRET');
  if (secret.length < 32) throw new ApiError(503, 'not_configured');
  return secret;
}

const mac = body => crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url');

function issueSession() {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ iat: now, exp: now + SESSION_DAYS * 86400 })).toString('base64url');
  return `${body}.${mac(body)}`;
}

function sessionFrom(req) {
  const token = readCookie(req, COOKIE);
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = Buffer.from(mac(body));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch { return null; }
}

function requireSession(req) {
  const session = sessionFrom(req);
  if (!session) throw new ApiError(401, 'signed_out');
  return session;
}

/* ── Storage (JSONBin) ─────────────────────────────────────────────────── */

function binConfig() {
  // JSONBIN_BIN_ID_OVERRIDE only exists for tools/admin-dev.js, which swaps
  // in an in-memory bin; production always uses the public BIN_ID.
  const id = env('JSONBIN_BIN_ID_OVERRIDE') || BIN_ID;
  const key = env('JSONBIN_MASTER_KEY');
  if (!id || !key) throw new ApiError(503, 'not_configured');
  return { id, key };
}

async function loadData() {
  const { id, key } = binConfig();
  const res = await fetch(`${JSONBIN}${id}/latest`, { headers: { 'X-Master-Key': key, 'X-Bin-Meta': 'false' } });
  if (!res.ok) throw new ApiError(502, 'storage_unavailable');
  const data = await res.json();
  return {
    seasons: Array.isArray(data.seasons) ? data.seasons : [],
    booked: Array.isArray(data.booked) ? data.booked : []
  };
}

async function saveData(data) {
  const { id, key } = binConfig();
  const res = await fetch(`${JSONBIN}${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': key, 'X-Bin-Versioning': 'false' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new ApiError(502, 'storage_unavailable');
}

/* ── Calendar rules ────────────────────────────────────────────────────── */

function isRealDate(s) {
  return typeof s === 'string' && DATE_RE.test(s) &&
    new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
}

function range(input) {
  if (!input || !isRealDate(input.start) || !isRealDate(input.end)) throw new ApiError(400, 'invalid_date');
  if (!(input.start < input.end)) throw new ApiError(400, 'end_before_start');
  return { start: input.start, end: input.end };
}

/* Bookings run arrival → departure; the departure day is free for the next
   arrival, so back-to-back stays don't overlap. */
const overlaps = (a, b) => a.start < b.end && b.start < a.end;
/* Season end dates are inclusive (js/availability.js: day <= season.end). */
const seasonsOverlap = (a, b) => a.start <= b.end && b.start <= a.end;
const same = (a, b) => a.start === b.start && a.end === b.end;
const byStart = (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end);

function indexOf(list, target) {
  const i = list.findIndex(x => same(x, target));
  if (i === -1) throw new ApiError(404, 'not_found');
  return i;
}

function shiftYear(r, from, to) {
  const s = to + r.start.slice(4), e = to + r.end.slice(4);
  return r.start.startsWith(from) && isRealDate(s) && isRealDate(e) ? { start: s, end: e } : null;
}

/* Applies one change. Returns { data, result } — result carries extra info
   for the page (e.g. how many entries a year-copy added). */
function apply(data, body) {
  const seasons = data.seasons.map(r => ({ start: r.start, end: r.end }));
  const booked = data.booked.map(r => ({ start: r.start, end: r.end }));
  let result = {};

  switch (body && body.op) {
    case 'addBooking': {
      const r = range(body);
      if (booked.some(b => overlaps(b, r))) throw new ApiError(409, 'booking_overlap');
      booked.push(r);
      break;
    }
    case 'updateBooking': {
      const i = indexOf(booked, range(body.from));
      const r = range(body.to);
      if (booked.some((b, j) => j !== i && overlaps(b, r))) throw new ApiError(409, 'booking_overlap');
      booked[i] = r;
      break;
    }
    case 'removeBooking':
      booked.splice(indexOf(booked, range(body)), 1);
      break;
    case 'addSeason': {
      const r = range(body);
      if (seasons.some(s => seasonsOverlap(s, r))) throw new ApiError(409, 'season_overlap');
      seasons.push(r);
      break;
    }
    case 'updateSeason': {
      const i = indexOf(seasons, range(body.from));
      const r = range(body.to);
      if (seasons.some((s, j) => j !== i && seasonsOverlap(s, r))) throw new ApiError(409, 'season_overlap');
      seasons[i] = r;
      break;
    }
    case 'removeSeason':
      seasons.splice(indexOf(seasons, range(body)), 1);
      break;
    case 'copyYear': {
      const from = String(body.from), to = String(body.to);
      if (!/^\d{4}$/.test(from) || !/^\d{4}$/.test(to) || from === to) throw new ApiError(400, 'invalid_year');
      let addedSeasons = 0, addedBookings = 0, skipped = 0;
      for (const s of data.seasons) {
        const c = shiftYear(s, from, to);
        if (!c) continue;
        if (seasons.some(x => same(x, c))) continue;
        if (seasons.some(x => seasonsOverlap(x, c))) { skipped++; continue; }
        seasons.push(c); addedSeasons++;
      }
      for (const b of data.booked) {
        const c = shiftYear(b, from, to);
        if (!c) continue;
        if (booked.some(x => same(x, c))) continue;
        if (booked.some(x => overlaps(x, c))) { skipped++; continue; }
        booked.push(c); addedBookings++;
      }
      result = { addedSeasons, addedBookings, skipped };
      break;
    }
    default:
      throw new ApiError(400, 'unknown_op');
  }

  if (seasons.length > MAX_ENTRIES || booked.length > MAX_ENTRIES) throw new ApiError(400, 'too_many');
  return { data: { seasons: seasons.sort(byStart), booked: booked.sort(byStart) }, result };
}

/* ── Routes ────────────────────────────────────────────────────────────── */

async function readBody(req) {
  const text = await req.text();
  if (text.length > 10000) throw new ApiError(413, 'too_large');
  try { return JSON.parse(text || '{}'); } catch { throw new ApiError(400, 'bad_json'); }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

export default async function handler(req) {
  const route = new URL(req.url).pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');

  try {
    if (route === 'login' && req.method === 'POST') {
      assertSameOrigin(req);
      const { password } = await readBody(req);
      if (typeof password !== 'string' || !password || password.length > 200) throw new ApiError(400, 'bad_request');
      const ok = await passwordMatches(password);
      if (!ok) {
        // Every wrong guess costs the guesser about a second (on top of the
        // deliberately slow scrypt check).
        await sleep(900 + Math.random() * 400);
        throw new ApiError(401, 'wrong_password');
      }
      return json(200, { ok: true, days: SESSION_DAYS },
        { 'Set-Cookie': cookieHeader(issueSession(), SESSION_DAYS * 86400) });
    }

    if (route === 'logout' && req.method === 'POST') {
      assertSameOrigin(req);
      return json(200, { ok: true }, { 'Set-Cookie': cookieHeader('', 0) });
    }

    if (route === 'data' && req.method === 'GET') {
      const session = requireSession(req);
      const data = await loadData();
      return json(200, { ...data, sessionExpires: session.exp });
    }

    if (route === 'data' && req.method === 'POST') {
      assertSameOrigin(req);
      requireSession(req);
      const body = await readBody(req);
      const { data, result } = apply(await loadData(), body);
      await saveData(data);
      return json(200, { ...data, result });
    }

    throw new ApiError(404, 'not_found');
  } catch (err) {
    if (err instanceof ApiError) {
      const headers = err.status === 401 && err.code === 'signed_out' ? { 'Set-Cookie': cookieHeader('', 0) } : {};
      return json(err.status, { error: err.code }, headers);
    }
    console.error(err);
    return json(500, { error: 'server_error' });
  }
}

/* Exposed for tools/admin-dev.js tests; Netlify ignores named exports. */
export const _test = { apply, overlaps };
