/**
 * Eva Apartman - Availability Configuration
 *
 * Edit this file to update the apartment's availability:
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
 */

const Availability = (() => {

  // ─── DEFAULT SCHEDULE ────────────────────────────────────────────────────────
  // These values are used when no admin overrides are stored in localStorage.
  // To update via the admin panel, visit /tripuneva1

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

  // ─── LOAD FROM ADMIN OVERRIDES (localStorage) ────────────────────────────────

  function loadFromStorage(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      if (v) return JSON.parse(v);
    } catch (e) { /* ignore */ }
    return fallback;
  }

  const seasons = loadFromStorage('eva-admin-seasons', _defaultSeasons);
  const booked  = loadFromStorage('eva-admin-booked',  _defaultBooked);

  // ─── INTERNALS ───────────────────────────────────────────────────────────────

  function parseDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function toDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  const _seasons = seasons.map(s => ({
    start: parseDate(s.start),
    end:   parseDate(s.end),
  }));

  const _booked = booked.map(b => ({
    start: parseDate(b.start),
    end:   parseDate(b.end),
  }));

  /**
   * Returns the status of a given date:
   *   'past'       – before today
   *   'offseason'  – not within any season window
   *   'booked'     – fully occupied interior day
   *   'transition' – checkout AND checkin on same day (back-to-back bookings) — not selectable
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

  return { getStatus, isRangeValid, firstInvalidInRange, parseDate, isStartable, isEndable };
})();
