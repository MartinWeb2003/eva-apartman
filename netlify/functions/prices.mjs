/**
 * Eva Apartman — public "from €X" price (Netlify Function, no dependencies)
 * ---------------------------------------------------------------------------
 *   GET /api/prices  →  { from: 75 }   (lowest nightly price still to come, or null)
 *
 * js/main.js uses it to keep every "from €75" on the site in step with the
 * prices set in /admin. Netlify's CDN caches the answer for 10 minutes (and
 * keeps serving the last good one while it refreshes), so however many
 * visitors arrive, JSONBin sees only a handful of requests an hour — its free
 * plan limits requests, which is why pages don't each read the bin themselves.
 *
 * Reads only the public bin; no secrets involved.
 */
export const config = { path: '/api/prices' };

/* Same public bin as js/availability.js. */
const BIN_ID = '69bd6aa7c3097a1dd542e037';

export default async function handler() {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'Netlify-CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
    'X-Robots-Tag': 'noindex'
  };
  try {
    // The override only exists in tools/admin-dev.js (in-memory test bin).
    const bin = process.env.JSONBIN_BIN_ID_OVERRIDE || BIN_ID;
    const res = await fetch(`https://api.jsonbin.io/v3/b/${bin}/latest`, { headers: { 'X-Bin-Meta': 'false' } });
    if (!res.ok) throw new Error('bin ' + res.status);
    const data = await res.json();
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = (Array.isArray(data.prices) ? data.prices : [])
      .filter(p => p && p.end >= today && Number.isFinite(Number(p.price)))
      .map(p => Number(p.price));
    return new Response(JSON.stringify({ from: upcoming.length ? Math.min(...upcoming) : null }), { headers });
  } catch (err) {
    console.error(err);
    // Don't let the CDN hold on to a failure.
    return new Response(JSON.stringify({ from: null }), {
      status: 502,
      headers: { ...headers, 'Cache-Control': 'no-store', 'Netlify-CDN-Cache-Control': 'no-store' }
    });
  }
}
