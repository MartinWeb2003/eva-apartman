/**
 * Eva Apartman - Availability Configuration
 *
 * Edit this file to update the apartment's availability:
 *
 *  - seasons:  Date ranges when the apartment IS available for rent.
 *              Any day outside these ranges is shown as GREY (off-season).
 *
 *  - booked:   Date ranges (within a season) that are already taken.
 *              These are shown as RED. All other in-season days are GREEN.
 *
 * Date format: "YYYY-MM-DD"  (e.g. "2026-06-15")
 * Both start and end dates are INCLUSIVE.
 */

const Availability = (() => {

  // ─── DEFAULT SCHEDULE ────────────────────────────────────────────────────────
  // These values are used when no admin overrides are stored in localStorage.
  // To update via the admin panel, visit /tripuneva1

  const _defaultSeasons = [
    { start: '2026-05-01', end: '2026-10-31' },
    // Add more years here if needed:
    // { start: '2027-05-01', end: '2027-10-31' },
  ];

  const _defaultBooked = [
    { start: '2026-06-20', end: '2026-06-28' },
    { start: '2026-07-10', end: '2026-07-25' },
    { start: '2026-08-01', end: '2026-08-14' },
    { start: '2026-08-20', end: '2026-08-31' },
    { start: '2026-09-05', end: '2026-09-12' },
  ];

  // ─── LOAD FROM ADMIN OVERRIDES (localStorage) ────────────────────────────────
  // If an admin has saved custom ranges via /tripuneva1, use those instead.

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

  /**
   * Parse a "YYYY-MM-DD" string into a Date object at local midnight.
   */
  function parseDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  /**
   * Normalise any Date to local midnight (strips time component).
   */
  function toDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  /** Pre-parsed season ranges */
  const _seasons = seasons.map(s => ({
    start: parseDate(s.start),
    end:   parseDate(s.end),
  }));

  /** Pre-parsed booked ranges */
  const _booked = booked.map(b => ({
    start: parseDate(b.start),
    end:   parseDate(b.end),
  }));

  /**
   * Returns the status of a given date:
   *   'past'      – before today
   *   'offseason' – not within any season window
   *   'booked'    – within a season but reserved
   *   'available' – within a season and free
   */
  function getStatus(date) {
    const day = toDay(date);
    const today = toDay(new Date());

    if (day < today) return 'past';

    const inSeason = _seasons.some(s => day >= s.start && day <= s.end);
    if (!inSeason) return 'offseason';

    const isBooked = _booked.some(b => day >= b.start && day <= b.end);
    return isBooked ? 'booked' : 'available';
  }

  /**
   * Returns true if a date range [start, end] is valid for booking:
   *   - Both endpoints must be 'available'
   *   - No 'booked' or 'offseason' day may lie between them
   */
  function isRangeValid(startDate, endDate) {
    if (!startDate || !endDate) return false;
    if (startDate > endDate) return false;

    let current = toDay(startDate);
    const end = toDay(endDate);

    while (current <= end) {
      const status = getStatus(current);
      if (status !== 'available') return false;
      current.setDate(current.getDate() + 1);
    }
    return true;
  }

  /**
   * Returns first invalid date found in range, or null if range is clean.
   */
  function firstInvalidInRange(startDate, endDate) {
    let current = toDay(startDate);
    const end = toDay(endDate);

    while (current <= end) {
      const status = getStatus(current);
      if (status !== 'available') return new Date(current);
      current.setDate(current.getDate() + 1);
    }
    return null;
  }

  return { getStatus, isRangeValid, firstInvalidInRange, parseDate };
})();
