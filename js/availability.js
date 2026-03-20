/**
 * Eva Apartman - Availability Configuration
 *
 * Edit the default values below to set the apartment's seasons and booked dates.
 * After initial setup, changes are managed through the admin panel (/tripuneva1)
 * and stored persistently on JSONBin.io so all visitors see live data.
 *
 *  - seasons:  Date ranges when the apartment IS available for rent.
 *              Any day outside these ranges is shown as GREY (off-season).
 *
 *  - booked:   Date ranges that are already taken.
 *              start = check-in day (first occupied night)
 *              end   = check-out day (last occupied night)
 *
 *              Boundary dates are coloured with a split gradient:
 *                checkout day  → left half red, right half green  (selectable as new check-in)
 *                checkin day   → left half green, right half red  (selectable as new check-out)
 *              When two bookings share the same boundary date that day is fully red.
 *
 * Date format: "YYYY-MM-DD"  (e.g. "2026-06-15")
 *
 * ── JSONBin.io setup ──────────────────────────────────────────────────────────
 * JSONBIN_BIN_ID: paste your JSONBin Bin ID here after creating an account.
 * Leave empty ('') to run from localStorage / hardcoded defaults only.
 * The admin panel (/tripuneva1) → Cloud Sync handles all writes.
 */

const Availability = (() => {

  // ── Paste your JSONBin Bin ID here after setup ───────────────────────────
  const JSONBIN_BIN_ID = '69bd6aa7c3097a1dd542e037';

  // ─── DEFAULT SCHEDULE ────────────────────────────────────────────────────────
  // These values are used when JSONBin is not configured or unreachable.

  const _defaultSeasons = [
    { start: '2026-06-01', end: '2026-10-01' },
    // Add more years here if needed:
    // { start: '2027-06-01', end: '2027-10-01' },
  ];

  const _defaultBooked = [
    { start: '2026-06-14', end: '2026-06-20' },
    { start: '2026-07-26', end: '2026-08-15' },
    { start: '2026-08-15', end: '2026-08-22' },
    { start: '2026-08-22', end: '2026-09-04' },
    { start: '2026-09-09', end: '2026-09-21' },
  ];

  // ─── INTERNALS ───────────────────────────────────────────────────────────────

  function parseDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function toDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function loadFromStorage(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      if (v) return JSON.parse(v);
    } catch(e) {}
    return fallback;
  }

  // Mutable internal arrays — initialised from localStorage/defaults immediately,
  // then updated once the async JSONBin fetch completes.
  let _seasons = [];
  let _booked  = [];

  function applyData(seasonsArr, bookedArr) {
    _seasons = seasonsArr.map(s => ({ start: parseDate(s.start), end: parseDate(s.end) }));
    _booked  = bookedArr.map(b  => ({ start: parseDate(b.start), end: parseDate(b.end) }));
  }

  // Synchronous seed so the calendar can paint before the network call returns.
  applyData(
    loadFromStorage('eva-admin-seasons', _defaultSeasons),
    loadFromStorage('eva-admin-booked',  _defaultBooked)
  );

  // ─── READY PROMISE ───────────────────────────────────────────────────────────
  // Resolves once live data has been fetched (or we've given up and are using cache).
  let _resolveReady;
  const ready = new Promise(resolve => { _resolveReady = resolve; });

  // Effective Bin ID: constant (code) takes priority, admin localStorage as fallback.
  const _binId = JSONBIN_BIN_ID || localStorage.getItem('eva-jsonbin-id') || '';

  (async () => {
    if (_binId) {
      try {
        const res = await fetch(
          `https://api.jsonbin.io/v3/b/${_binId}/latest`,
          { headers: { 'X-Bin-Meta': 'false' } }
        );
        if (res.ok) {
          const record = await res.json();
          const s = Array.isArray(record.seasons) ? record.seasons : _defaultSeasons;
          const b = Array.isArray(record.booked)  ? record.booked  : _defaultBooked;
          applyData(s, b);
          // Keep a local cache so the next page load is instant
          localStorage.setItem('eva-admin-seasons', JSON.stringify(s));
          localStorage.setItem('eva-admin-booked',  JSON.stringify(b));
        }
      } catch(e) { /* network error — fall back to the cached data already applied */ }
    }
    _resolveReady();
  })();

  // ─── STATUS LOGIC ────────────────────────────────────────────────────────────

  /**
   * Returns the status of a given date:
   *   'past'       – before today
   *   'offseason'  – not within any season window
   *   'booked'     – fully occupied interior day
   *   'transition' – checkout AND checkin on same day (back-to-back) — not selectable
   *   'checkout'   – last day of a booking; left half red, right half green — selectable as check-in
   *   'checkin'    – first day of a booking; left half green, right half red — selectable as check-out
   *   'available'  – in season and free
   */
  function getStatus(date) {
    const day   = toDay(date);
    const today = toDay(new Date());

    if (day < today) return 'past';

    const inSeason = _seasons.some(s => day >= s.start && day <= s.end);
    if (!inSeason) return 'offseason';

    const dayTs = day.getTime();

    const isCheckin  = _booked.some(b => b.start.getTime() === dayTs);
    const isCheckout = _booked.some(b => b.end.getTime()   === dayTs);
    const isInterior = _booked.some(b => day > b.start && day < b.end);

    if (isInterior)              return 'booked';
    if (isCheckin && isCheckout) return 'transition';  // fully blocked
    if (isCheckin)               return 'checkin';
    if (isCheckout)              return 'checkout';

    return 'available';
  }

  /** Can this date be used as a check-in (range start)? */
  function isStartable(status) {
    return status === 'available' || status === 'checkout';
  }

  /** Can this date be used as a check-out (range end)? */
  function isEndable(status) {
    return status === 'available' || status === 'checkin';
  }

  /**
   * Returns true if the range [startDate, endDate] is valid:
   *   - startDate must be 'available' or 'checkout'
   *   - endDate must be 'available' or 'checkin'
   *   - every day strictly between them must be 'available'
   */
  function isRangeValid(startDate, endDate) {
    if (!startDate || !endDate) return false;
    const start = toDay(startDate);
    const end   = toDay(endDate);
    if (start >= end) return false;

    if (!isStartable(getStatus(start))) return false;
    if (!isEndable(getStatus(end)))     return false;

    let cur = new Date(start);
    cur.setDate(cur.getDate() + 1);
    while (cur < end) {
      if (getStatus(cur) !== 'available') return false;
      cur.setDate(cur.getDate() + 1);
    }
    return true;
  }

  /**
   * Returns first invalid interior date in [startDate, endDate], or null if clean.
   * (Does NOT re-check the endpoints — they are validated separately.)
   */
  function firstInvalidInRange(startDate, endDate) {
    let cur = toDay(startDate);
    cur.setDate(cur.getDate() + 1);           // start from day after check-in
    const end = toDay(endDate);

    while (cur < end) {
      if (getStatus(cur) !== 'available') return new Date(cur);
      cur.setDate(cur.getDate() + 1);
    }
    return null;
  }

  return { ready, getStatus, isRangeValid, firstInvalidInRange, parseDate, isStartable, isEndable };
})();
