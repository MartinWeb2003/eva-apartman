/**
 * Eva Apartman - Calendar Component
 *
 * Renders a colour-coded calendar inside #calendar-container.
 * Allows selecting a check-in / check-out date range.
 * Depends on: availability.js
 *
 * Public API (attached to window.Calendar):
 *   Calendar.init()           – render the calendar for the current month
 *   Calendar.getStartDate()   – returns Date | null
 *   Calendar.getEndDate()     – returns Date | null
 *   Calendar.reset()          – clear selection
 */

const Calendar = (() => {

  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  const WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  let currentYear  = new Date().getFullYear();
  let currentMonth = new Date().getMonth();

  let selectedStart = null;
  let selectedEnd   = null;
  let hoverDate     = null;

  // ── DOM references ──────────────────────────────────────────────
  let container, daysGrid, monthYearLabel, errorBox,
      startDisplay, endDisplay;

  function init() {
    container       = document.getElementById('calendar-container');
    errorBox        = document.getElementById('calendar-error');
    startDisplay    = document.getElementById('sel-start-date');
    endDisplay      = document.getElementById('sel-end-date');

    if (!container) return;

    container.innerHTML = buildShell();

    daysGrid       = container.querySelector('.calendar-days');
    monthYearLabel = container.querySelector('.cal-month-year');

    container.querySelector('.cal-prev').addEventListener('click', prevMonth);
    container.querySelector('.cal-next').addEventListener('click', nextMonth);

    renderDays();
  }

  // ── HTML shell (header + weekday row) ──────────────────────────
  function buildShell() {
    const wdCells = WEEKDAYS.map(d => `<span>${d}</span>`).join('');
    return `
      <div class="calendar-header">
        <button type="button" class="cal-nav-btn cal-prev" aria-label="Previous month">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span class="cal-month-year"></span>
        <button type="button" class="cal-nav-btn cal-next" aria-label="Next month">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
      <div class="calendar-weekdays">${wdCells}</div>
      <div class="calendar-days"></div>
    `;
  }

  // ── Render days grid ────────────────────────────────────────────
  function renderDays() {
    monthYearLabel.textContent = `${MONTHS[currentMonth]} ${currentYear}`;
    daysGrid.innerHTML = '';

    // First day of month (0=Sun … 6=Sat) → convert to Mon-based (0=Mon)
    const firstDow = new Date(currentYear, currentMonth, 1).getDay();
    const offset   = (firstDow + 6) % 7; // Monday = 0

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Empty cells before day 1
    for (let i = 0; i < offset; i++) {
      daysGrid.insertAdjacentHTML('beforeend', '<div class="cal-day empty"></div>');
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date   = new Date(currentYear, currentMonth, d);
      const status = Availability.getStatus(date);
      const cell   = document.createElement('div');

      cell.className = `cal-day ${status}`;
      cell.textContent = d;
      cell.dataset.date = formatDate(date);

      applyRangeClasses(cell, date, status);

      if (status === 'available') {
        cell.addEventListener('click',      () => handleClick(date));
        cell.addEventListener('mouseenter', () => handleHover(date));
        cell.addEventListener('mouseleave', () => handleHoverLeave(date));
      }

      daysGrid.appendChild(cell);
    }
  }

  // ── Range CSS classes ───────────────────────────────────────────
  function applyRangeClasses(cell, date, status) {
    if (status !== 'available') return;

    const d = toDay(date);

    const start = selectedStart ? toDay(selectedStart) : null;
    const end   = selectedEnd   ? toDay(selectedEnd)   : null;
    const hover = hoverDate     ? toDay(hoverDate)      : null;

    // Determine the effective end for highlighting (hover before confirm)
    let effectiveEnd = end;
    if (start && !end && hover && hover > start) {
      effectiveEnd = hover;
    }

    const isStart = start && d.getTime() === start.getTime();
    const isEnd   = effectiveEnd && d.getTime() === effectiveEnd.getTime();
    const inRange = start && effectiveEnd && d > start && d < effectiveEnd;

    if (isStart) cell.classList.add('selected-start');
    if (isEnd)   cell.classList.add('selected-end');
    if (inRange) cell.classList.add('in-range');
  }

  // ── Click handler ───────────────────────────────────────────────
  function handleClick(date) {
    clearError();

    const clickedTs = date.getTime();
    const startTs   = selectedStart ? selectedStart.getTime() : null;

    // Case 1: no start yet, or both already selected → begin new selection
    if (!selectedStart || selectedEnd) {
      selectedStart = new Date(date);
      selectedEnd   = null;
      updateDisplay();
      renderDays();
      return;
    }

    // Case 2: start set, no end — clicked same day or earlier → restart
    if (clickedTs <= startTs) {
      selectedStart = new Date(date);
      selectedEnd   = null;
      updateDisplay();
      renderDays();
      return;
    }

    // Case 3: start set, clicked a later date → try to set end
    const invalid = Availability.firstInvalidInRange(selectedStart, date);
    if (invalid) {
      showError(
        `Your selection contains a date that is not available (${formatDisplay(invalid)}). ` +
        `Please choose dates within a continuous green window.`
      );
      selectedEnd = null;
      updateDisplay();
      renderDays();
      return;
    }

    selectedEnd = new Date(date);
    updateDisplay();
    renderDays();
  }

  // ── Hover handler ───────────────────────────────────────────────
  // Never rebuilds the DOM — only patches CSS classes on existing cells.
  function handleHover(date) {
    if (!selectedStart || selectedEnd) return;
    hoverDate = date;
    updateRangeClasses();
  }

  function handleHoverLeave(date) {
    if (!selectedStart || selectedEnd) return;
    if (hoverDate && hoverDate.getTime() === date.getTime()) {
      hoverDate = null;
      updateRangeClasses();
    }
  }

  // Patch range CSS classes on existing cells without touching the DOM structure.
  function updateRangeClasses() {
    daysGrid.querySelectorAll('.cal-day.available').forEach(cell => {
      const ds = cell.dataset.date;
      if (!ds) return;
      const [y, m, d] = ds.split('-').map(Number);
      cell.classList.remove('selected-start', 'selected-end', 'in-range');
      applyRangeClasses(cell, new Date(y, m - 1, d), 'available');
    });
  }

  // ── Navigation ──────────────────────────────────────────────────
  function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderDays();
  }

  function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderDays();
  }

  // ── Display updates ─────────────────────────────────────────────
  function updateDisplay() {
    if (!startDisplay || !endDisplay) return;

    if (selectedStart) {
      startDisplay.textContent = formatDisplay(selectedStart);
      startDisplay.classList.remove('empty');
    } else {
      startDisplay.textContent = 'Not selected';
      startDisplay.classList.add('empty');
    }

    if (selectedEnd) {
      endDisplay.textContent = formatDisplay(selectedEnd);
      endDisplay.classList.remove('empty');
    } else {
      endDisplay.textContent = 'Not selected';
      endDisplay.classList.add('empty');
    }
  }

  // ── Error box ───────────────────────────────────────────────────
  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.add('show');
  }

  function clearError() {
    if (!errorBox) return;
    errorBox.textContent = '';
    errorBox.classList.remove('show');
  }

  // ── Helpers ─────────────────────────────────────────────────────
  function toDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDisplay(date) {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function reset() {
    selectedStart = null;
    selectedEnd   = null;
    hoverDate     = null;
    clearError();
    updateDisplay();
    renderDays();
  }

  function getStartDate() { return selectedStart; }
  function getEndDate()   { return selectedEnd;   }

  // ── Public API ──────────────────────────────────────────────────
  return { init, reset, getStartDate, getEndDate };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('calendar-container')) {
    Calendar.init();
  }
});
