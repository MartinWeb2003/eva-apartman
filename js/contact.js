/**
 * Eva Apartman — Contact / Booking Form
 * Sends form data via Web3Forms (no backend, works on any domain).
 *
 * ─── ONE-TIME SETUP (takes ~2 minutes, free) ────────────────────────────────
 *
 *  1. Open https://web3forms.com in your browser.
 *  2. Enter  info@visit-eva-orebic.com  and click "Create Access Key".
 *  3. Check that inbox — you'll receive your Access Key by email.
 *  4. Paste it into the constant below (replace YOUR_ACCESS_KEY).
 *  5. Done — works on localhost and any custom domain.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const WEB3FORMS_KEY = '782273a6-6b47-4c87-b29e-d1d0c0452ff6';

// ── Utility ───────────────────────────────────────────────────────────────────

const LANG_NAMES = { en: 'English', hr: 'Croatian', pl: 'Polish', de: 'German' };

/** The page's language (/hr/ → hr), as stamped on <html lang> by the build. */
function pageLang() {
  const l = document.documentElement.lang;
  return LANG_NAMES[l] ? l : 'en';
}

/** Message from js/translations.js in the page language, English fallback. */
function tr(key, fallback, vars) {
  const dict = (window.EVA_T && (window.EVA_T[pageLang()] || window.EVA_T.en)) || {};
  let msg = dict[key] || fallback;
  Object.keys(vars || {}).forEach(k => { msg = msg.replace('{' + k + '}', vars[k]); });
  return msg;
}

/** The field's visible (already translated) label, e.g. "Ime" on /hr/. */
function fieldLabel(id, fallback) {
  const el = document.querySelector(`label[for="${id}"] span`);
  return (el && el.textContent.trim()) || fallback;
}

// Dates in the enquiry email stay in English: that email is for the host.
function formatDateReadable(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function estimateForEmail(start, end) {
  const q = Availability.quote(start, end);
  if (!q.priced) return 'not shown (no prices set for these dates)';
  if (!q.complete) return 'not shown (some nights have no price set)';
  return `€${q.total.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;
}

function nightsBetween(start, end) {
  if (!start || !end) return 0;
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function setFieldState(field, isValid, message = '') {
  const group = field.closest('.form-group');
  if (!group) return;
  group.classList.toggle('has-error', !isValid);
  field.classList.toggle('error', !isValid);
  field.classList.toggle('success', isValid);
  const errEl = group.querySelector('.form-error-msg');
  if (errEl) errEl.textContent = message;
}

// ── Validators ────────────────────────────────────────────────────────────────

function validateName(value, label) {
  if (!value.trim()) return tr('form.err.required', '{label} is required.', { label });
  if (value.trim().length < 2) return tr('form.err.short', '{label} must be at least 2 characters.', { label });
  // Any letter in any alphabet: Šimić, Đurić, Łukasz and Müller must all pass.
  if (!/^[\p{L}\p{M}\s'.-]+$/u.test(value.trim()))
    return tr('form.err.chars', '{label} contains invalid characters.', { label });
  return null;
}

function validateEmail(value) {
  if (!value.trim()) return null; // optional
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return tr('form.err.email', 'Please enter a valid email address.');
  return null;
}

function validatePhone(value) {
  if (!value.trim()) return tr('form.err.phone.req', 'Phone number is required.');
  const stripped = value.replace(/[\s\-().+]/g, '');
  if (!/^\d{7,15}$/.test(stripped))
    return tr('form.err.phone', 'Please enter a valid phone number (min. 7 digits).');
  return null;
}

function validateGuests(value) {
  if (!value) return tr('form.err.guests.req', 'Please select the number of guests.');
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1 || n > 5) return tr('form.err.guests.range', 'Number of guests must be between 1 and 5.');
  return null;
}

// ── Main form logic ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const form        = document.getElementById('contact-form');
  const successCard = document.getElementById('form-success');
  if (!form) return;

  // Live validation: validate on blur, re-validate on input once an error is showing
  ['first-name', 'last-name', 'email', 'phone', 'guests'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur',  () => validateField(el));
    el.addEventListener('input', () => { if (el.classList.contains('error')) validateField(el); });
  });

  function validateField(el) {
    let error = null;
    switch (el.id) {
      case 'first-name': error = validateName(el.value, fieldLabel('first-name', 'First name')); break;
      case 'last-name':  error = validateName(el.value, fieldLabel('last-name', 'Last name'));   break;
      case 'email':      error = validateEmail(el.value);              break;
      case 'phone':      error = validatePhone(el.value);              break;
      case 'guests':     error = validateGuests(el.value);             break;
    }
    setFieldState(el, !error, error || '');
    return !error;
  }

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields
    let allValid = true;
    ['first-name', 'last-name', 'email', 'phone', 'guests'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !validateField(el)) allValid = false;
    });

    // Validate date selection
    const calError  = document.getElementById('calendar-error');
    const startDate = Calendar.getStartDate();
    const endDate   = Calendar.getEndDate();

    if (!startDate || !endDate) {
      calError.textContent = tr('form.err.dates', 'Please select your check-in and check-out dates on the calendar.');
      calError.classList.add('show');
      allValid = false;
    } else if (!Availability.isRangeValid(startDate, endDate)) {
      calError.textContent = tr('form.err.range', 'Your selected dates include unavailable days. Please choose only green dates.');
      calError.classList.add('show');
      allValid = false;
    } else {
      calError.classList.remove('show');
    }

    if (!allValid) {
      const firstError = form.querySelector('.has-error, .calendar-error.show');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Gather values
    const firstName = document.getElementById('first-name').value.trim();
    const lastName  = document.getElementById('last-name').value.trim();
    const email     = document.getElementById('email').value.trim();
    const phone     = document.getElementById('phone').value.trim();
    const guests    = document.getElementById('guests').value;
    const message   = document.getElementById('message')?.value.trim() || '';
    const nights    = nightsBetween(startDate, endDate);

    // Show loading state
    const submitBtn   = form.querySelector('.btn-submit');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           style="width:18px;height:18px;animation:eva-spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2 a10 10 0 0 1 10 10" stroke-opacity="0.9"/>
      </svg>
      ${tr('form.sending', 'Sending…')}`;

    if (!document.getElementById('eva-spin-style')) {
      const s = document.createElement('style');
      s.id = 'eva-spin-style';
      s.textContent = '@keyframes eva-spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(s);
    }

    // Remove any previous error banner
    form.querySelector('.form-alert-error')?.remove();

    try {
      if (WEB3FORMS_KEY === 'YOUR_ACCESS_KEY') {
        await new Promise(r => setTimeout(r, 600));
        throw new Error(
          'Form not yet activated. Open js/contact.js, visit web3forms.com, ' +
          'enter info@visit-eva-orebic.com, and paste the Access Key into WEB3FORMS_KEY.'
        );
      }

      const payload = {
        access_key:    WEB3FORMS_KEY,
        subject:       `Booking enquiry, ${firstName} ${lastName} · ${formatDateReadable(startDate)} → ${formatDateReadable(endDate)}`,
        from_name:     'Eva Apartman Website',
        to:            'info@visit-eva-orebic.com',
        name:          `${firstName} ${lastName}`,
        email:         email || 'not provided',
        phone:         phone,
        guests:        guests,
        check_in:      formatDateReadable(startDate),
        check_out:     formatDateReadable(endDate),
        nights:        `${nights} night${nights !== 1 ? 's' : ''}`,
        // What the guest was shown, from the prices set in /admin.
        estimated_total: estimateForEmail(startDate, endDate),
        message:       message || '(no additional message)',
        // So the host knows which language to reply in.
        language:      LANG_NAMES[pageLang()],
        replyto:       email || undefined,
      };

      const res = await fetch('https://api.web3forms.com/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Submission failed.');
      }

      // ── Success ──
      form.style.display = 'none';
      successCard.classList.add('show');
      Calendar.reset();

    } catch (err) {
      console.error('Form submission error:', err);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;

      const alert = document.createElement('div');
      alert.className = 'form-alert-error';
      alert.style.cssText = [
        'padding:0.9rem 1.2rem',
        'background:#fde8e6',
        'border:1px solid #c0392b',
        'border-left:4px solid #c0392b',
        'border-radius:8px',
        'color:#a93226',
        'font-size:0.9rem',
        'margin-top:1rem',
        'line-height:1.5',
      ].join(';');
      // The technical reason goes to the console above; the guest gets a
      // message in their language with a way to reach us instead.
      alert.textContent = tr('form.err.generic',
        'Something went wrong. Please try again, or contact us directly by phone or WhatsApp.');
      form.appendChild(alert);
    }
  });
});
