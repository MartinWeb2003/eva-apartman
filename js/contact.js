/**
 * Eva Apartman - Contact Form
 *
 * Validates the form and sends it via EmailJS.
 *
 * ─── SETUP ────────────────────────────────────────────────────────
 * 1. Sign up free at https://www.emailjs.com/
 * 2. "Add Service" → connect your Gmail account → copy the Service ID
 * 3. "Email Templates" → create a template that uses these variables:
 *       {{from_name}}   – guest full name
 *       {{reply_to}}    – guest email (optional, useful for replying)
 *       {{guests}}      – number of people
 *       {{check_in}}    – check-in date
 *       {{check_out}}   – check-out date
 *       {{message}}     – optional extra message
 * 4. Copy the Template ID and your Public Key (Account → API Keys)
 * 5. Paste them into the three constants below.
 * ──────────────────────────────────────────────────────────────────
 */

const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // e.g. 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // e.g. 'template_xyz789'
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // e.g. 'AbCdEf1234567890'

// ── Utility ──────────────────────────────────────────────────────────────────

function formatDateReadable(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
  });
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

function clearFieldState(field) {
  const group = field.closest('.form-group');
  if (!group) return;
  group.classList.remove('has-error');
  field.classList.remove('error', 'success');
}

// ── Validators ───────────────────────────────────────────────────────────────

function validateName(value, label) {
  if (!value.trim()) return `${label} is required.`;
  if (value.trim().length < 2) return `${label} must be at least 2 characters.`;
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(value.trim()))
    return `${label} contains invalid characters.`;
  return null;
}

function validateGuests(value) {
  if (!value) return 'Please select the number of guests.';
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1 || n > 8) return 'Number of guests must be between 1 and 8.';
  return null;
}

function validateEmail(value) {
  if (!value.trim()) return null; // email is optional
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return 'Please enter a valid email address.';
  return null;
}

// ── Main form logic ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const form        = document.getElementById('contact-form');
  const successCard = document.getElementById('form-success');
  if (!form) return;

  // Initialise EmailJS
  if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  // Live validation on blur
  ['first-name', 'last-name', 'email', 'guests'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('blur', () => validateField(el));
    el.addEventListener('input', () => {
      if (el.classList.contains('error')) validateField(el);
    });
  });

  function validateField(el) {
    let error = null;
    switch (el.id) {
      case 'first-name': error = validateName(el.value, 'First name'); break;
      case 'last-name':  error = validateName(el.value, 'Last name');  break;
      case 'email':      error = validateEmail(el.value);              break;
      case 'guests':     error = validateGuests(el.value);             break;
    }
    if (error) {
      setFieldState(el, false, error);
    } else {
      setFieldState(el, true);
    }
    return !error;
  }

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields
    const fields = ['first-name', 'last-name', 'email', 'guests'];
    let allValid = true;

    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el && !validateField(el)) allValid = false;
    });

    // Validate date selection
    const calError = document.getElementById('calendar-error');
    const startDate = Calendar.getStartDate();
    const endDate   = Calendar.getEndDate();

    if (!startDate || !endDate) {
      calError.textContent = 'Please select your check-in and check-out dates on the calendar.';
      calError.classList.add('show');
      allValid = false;
    } else if (!Availability.isRangeValid(startDate, endDate)) {
      calError.textContent = 'Your selected date range contains unavailable dates. Please choose only green dates.';
      calError.classList.add('show');
      allValid = false;
    } else {
      calError.classList.remove('show');
    }

    if (!allValid) {
      // Scroll to first error
      const firstError = form.querySelector('.has-error, .calendar-error.show');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Gather values
    const firstName = document.getElementById('first-name').value.trim();
    const lastName  = document.getElementById('last-name').value.trim();
    const email     = document.getElementById('email').value.trim();
    const guests    = document.getElementById('guests').value;
    const message   = document.getElementById('message') ? document.getElementById('message').value.trim() : '';

    const templateParams = {
      from_name:  `${firstName} ${lastName}`,
      reply_to:   email || '(not provided)',
      guests:     guests,
      check_in:   formatDateReadable(startDate),
      check_out:  formatDateReadable(endDate),
      message:    message || '(no additional message)',
    };

    // Show loading state
    const submitBtn = form.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           style="width:18px;height:18px;animation:spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2 a10 10 0 0 1 10 10" stroke-opacity="0.9"/>
      </svg>
      Sending…`;

    // Add spin keyframe once
    if (!document.getElementById('spin-style')) {
      const s = document.createElement('style');
      s.id = 'spin-style';
      s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(s);
    }

    try {
      if (typeof emailjs === 'undefined') {
        // EmailJS not configured yet — simulate for testing
        await new Promise(r => setTimeout(r, 1200));
        throw new Error('EmailJS is not configured. Please add your Service ID, Template ID, and Public Key to js/contact.js');
      }

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

      // Show success
      form.style.display = 'none';
      successCard.classList.add('show');
      Calendar.reset();

    } catch (err) {
      console.error('EmailJS error:', err);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;

      // Show error to user
      let userMsg = 'Something went wrong. Please try again or contact us directly by phone.';
      if (err.message && err.message.includes('EmailJS is not configured')) {
        userMsg = err.message;
      }

      const existingAlert = form.querySelector('.form-alert-error');
      if (existingAlert) existingAlert.remove();

      const alert = document.createElement('div');
      alert.className = 'form-alert-error';
      alert.style.cssText = `
        padding: 0.9rem 1.2rem;
        background: #fde8e6;
        border: 1px solid #c0392b;
        border-left: 4px solid #c0392b;
        border-radius: 8px;
        color: #a93226;
        font-size: 0.9rem;
        margin-top: 1rem;
      `;
      alert.textContent = userMsg;
      form.appendChild(alert);
    }
  });
});
