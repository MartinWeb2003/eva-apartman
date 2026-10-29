/* Eva Apartman — calendar manager (/admin)
 * Talks only to /api/admin/* (netlify/functions/admin.mjs), which checks the
 * sign-in on every request. Dates are 'YYYY-MM-DD' strings throughout, the
 * same format the public calendar reads.
 */
(function () {
  'use strict';

  /* ── Text ──────────────────────────────────────────────────────────── */
  var T = {
    hr: {
      'title': 'Upravljanje kalendarom',
      'signout': 'Odjava',
      'login.title': 'Prijava',
      'login.text': 'Unesite lozinku za uređivanje kalendara rezervacija.',
      'login.password': 'Lozinka',
      'login.show': 'Prikaži',
      'login.hide': 'Sakrij',
      'login.submit': 'Prijavi se',
      'login.busy': 'Prijava…',
      'login.remember': 'Na ovom uređaju ostat ćete prijavljeni 30 dana.',
      'cal.title': 'Kalendar',
      'cal.live': 'Promjene su odmah vidljive na web stranici.',
      'cal.prev': 'Prethodni mjesec',
      'cal.next': 'Sljedeći mjesec',
      'cal.hint': 'Dodirnite slobodan dan za novu rezervaciju ili zauzeti dan za izmjenu.',
      'legend.free': 'Slobodno',
      'legend.booked': 'Zauzeto',
      'legend.off': 'Izvan sezone',
      'status.free': 'slobodno',
      'status.booked': 'zauzeto',
      'status.off': 'izvan sezone',
      'status.arrive': 'dolazak gostiju',
      'status.depart': 'odlazak gostiju',
      'status.turnover': 'odlazak i dolazak',
      'btn.newBooking': '+ Nova rezervacija',
      'btn.addSeason': '+ Dodaj sezonu',
      'upcoming.title': 'Nadolazeće rezervacije',
      'upcoming.empty': 'Nema nadolazećih rezervacija.',
      'past.title': 'Prošle rezervacije',
      'season.title': 'Sezona',
      'season.text': 'Gosti mogu birati datume samo unutar sezone.',
      'season.empty': 'Sezona nije postavljena, pa gosti ne mogu odabrati nijedan datum.',
      'copy.text': 'Za {to}. još nema sezone. Kopirati sezonu i rezervacije iz {from}. na iste datume u {to}.?',
      'copy.btn': 'Kopiraj iz {from}. u {to}.',
      'copy.done': 'Dodano: {s} sezona i {b} rezervacija.',
      'edit': 'Uredi',
      'delete': 'Obriši',
      'save': 'Spremi',
      'saving': 'Spremanje…',
      'cancel': 'Odustani',
      'saved': 'Spremljeno ✓',
      'deleted': 'Obrisano ✓',
      'booking.new': 'Nova rezervacija',
      'booking.edit': 'Izmjena rezervacije',
      'booking.start': 'Dolazak',
      'booking.end': 'Odlazak',
      'season.new': 'Nova sezona',
      'season.edit': 'Izmjena sezone',
      'season.start': 'Početak',
      'season.end': 'Zadnji dan',
      'season.days': '{n} dana',
      'nights.one': 'noć',
      'nights.many': 'noći',
      'note.offseason': 'Napomena: dio ovih datuma je izvan sezone.',
      'confirm.booking': 'Obrisati rezervaciju?',
      'confirm.booking.text': '{range}. Ti će datumi na web stranici ponovno biti slobodni.',
      'confirm.season': 'Obrisati sezonu?',
      'confirm.season.text': '{range}. Gosti tada neće moći birati te datume.',
      'session': 'Na ovom ste uređaju prijavljeni do {date}.',
      'err.invalid_date': 'Odaberite oba datuma.',
      'err.end_before_start': 'Drugi datum mora biti nakon prvoga.',
      'err.booking_overlap': 'Ti se datumi preklapaju s postojećom rezervacijom.',
      'err.season_overlap': 'Ta se sezona preklapa s postojećom.',
      'err.not_found': 'Taj je unos u međuvremenu promijenjen. Kalendar je osvježen.',
      'err.wrong_password': 'Pogrešna lozinka. Pokušajte ponovno.',
      'err.signed_out': 'Prijava je istekla. Prijavite se ponovno.',
      'err.not_configured': 'Prijava još nije postavljena na poslužitelju.',
      'err.network': 'Nema veze s poslužiteljem. Provjerite internet i pokušajte ponovno.',
      'err.generic': 'Nešto nije uspjelo. Pokušajte ponovno.'
    },
    en: {
      'title': 'Calendar manager',
      'signout': 'Sign out',
      'login.title': 'Sign in',
      'login.text': 'Enter the password to edit the booking calendar.',
      'login.password': 'Password',
      'login.show': 'Show',
      'login.hide': 'Hide',
      'login.submit': 'Sign in',
      'login.busy': 'Signing in…',
      'login.remember': 'You’ll stay signed in on this device for 30 days.',
      'cal.title': 'Calendar',
      'cal.live': 'Changes show on the website straight away.',
      'cal.prev': 'Previous month',
      'cal.next': 'Next month',
      'cal.hint': 'Tap a free day to add a booking, or a booked day to change it.',
      'legend.free': 'Free',
      'legend.booked': 'Booked',
      'legend.off': 'Off-season',
      'status.free': 'free',
      'status.booked': 'booked',
      'status.off': 'off-season',
      'status.arrive': 'guests arrive',
      'status.depart': 'guests leave',
      'status.turnover': 'guests leave and arrive',
      'btn.newBooking': '+ New booking',
      'btn.addSeason': '+ Add season',
      'upcoming.title': 'Upcoming bookings',
      'upcoming.empty': 'No upcoming bookings.',
      'past.title': 'Past bookings',
      'season.title': 'Season',
      'season.text': 'Guests can only pick dates inside the season.',
      'season.empty': 'No season is set, so guests can’t pick any dates.',
      'copy.text': 'There’s no season for {to} yet. Copy the {from} season and bookings to the same dates in {to}?',
      'copy.btn': 'Copy {from} to {to}',
      'copy.done': 'Added {s} season(s) and {b} booking(s).',
      'edit': 'Edit',
      'delete': 'Delete',
      'save': 'Save',
      'saving': 'Saving…',
      'cancel': 'Cancel',
      'saved': 'Saved ✓',
      'deleted': 'Deleted ✓',
      'booking.new': 'New booking',
      'booking.edit': 'Edit booking',
      'booking.start': 'Arrival',
      'booking.end': 'Departure',
      'season.new': 'New season',
      'season.edit': 'Edit season',
      'season.start': 'Opens',
      'season.end': 'Last day',
      'season.days': '{n} days',
      'nights.one': 'night',
      'nights.many': 'nights',
      'note.offseason': 'Note: some of these dates are outside the season.',
      'confirm.booking': 'Delete this booking?',
      'confirm.booking.text': '{range}. These dates will show as free on the website again.',
      'confirm.season': 'Delete this season?',
      'confirm.season.text': '{range}. Guests won’t be able to pick these dates.',
      'session': 'You’re signed in on this device until {date}.',
      'err.invalid_date': 'Choose both dates.',
      'err.end_before_start': 'The second date must be after the first.',
      'err.booking_overlap': 'Those dates overlap an existing booking.',
      'err.season_overlap': 'That overlaps an existing season.',
      'err.not_found': 'That entry changed in the meantime. The calendar has been refreshed.',
      'err.wrong_password': 'Wrong password. Please try again.',
      'err.signed_out': 'Your session ended. Please sign in again.',
      'err.not_configured': 'Sign-in isn’t set up on the server yet.',
      'err.network': 'Can’t reach the server. Check the internet connection and try again.',
      'err.generic': 'Something went wrong. Please try again.'
    }
  };

  var lang = 'hr';
  try { lang = localStorage.getItem('eva-admin-lang') === 'en' ? 'en' : 'hr'; } catch (e) { /* private mode */ }
  var LOCALE = { hr: 'hr-HR', en: 'en-GB' };

  function t(key, vars) {
    var s = (T[lang][key] !== undefined ? T[lang][key] : T.hr[key]) || key;
    Object.keys(vars || {}).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }

  var $ = function (id) { return document.getElementById(id); };

  /* ── Dates ('YYYY-MM-DD', computed in UTC so time zones never shift a day) ── */
  function parse(s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function addDays(s, n) { var d = parse(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function daysBetween(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
  function todayIso() { var n = new Date(); return iso(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()))); }

  function fmt(s, opts) {
    return new Intl.DateTimeFormat(LOCALE[lang], Object.assign({ timeZone: 'UTC' }, opts)).format(parse(s));
  }
  function fmtRange(r) {
    var sameYear = r.start.slice(0, 4) === r.end.slice(0, 4);
    var a = fmt(r.start, sameYear ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' });
    var b = fmt(r.end, { day: 'numeric', month: 'long', year: 'numeric' });
    return a + ' – ' + b;
  }
  function nightsLabel(n) {
    var one = lang === 'hr' ? (n % 10 === 1 && n % 100 !== 11) : n === 1;
    return n + ' ' + t(one ? 'nights.one' : 'nights.many');
  }

  /* ── State ─────────────────────────────────────────────────────────── */
  var data = { seasons: [], booked: [] };
  var cursor = (function () { var n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; })();
  var editing = null; // { kind: 'booking'|'season', original: range|null }

  /* ── API ───────────────────────────────────────────────────────────── */
  function api(method, path, body) {
    return fetch('/api/admin/' + path, {
      method: method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Eva-Admin': '1' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        if (res.ok) return json;
        var err = new Error(json.error || 'generic');
        err.code = json.error || 'generic';
        err.status = res.status;
        throw err;
      });
    }, function () {
      var err = new Error('network'); err.code = 'network'; throw err;
    });
  }

  function errorText(err) {
    var key = 'err.' + (err && err.code);
    return T[lang][key] ? t(key) : t('err.generic');
  }

  /* ── Views ─────────────────────────────────────────────────────────── */
  function show(view) {
    ['loading', 'login', 'app'].forEach(function (v) { $('view-' + v).hidden = v !== view; });
    $('signout-btn').hidden = view !== 'app';
    $('bottom-bar').hidden = view !== 'app';
    if (view === 'login') setTimeout(function () { $('password').focus(); }, 50);
  }

  function applyText() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = t(el.dataset.t); });
    document.querySelectorAll('[data-t-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.dataset.tAria)); });
    $('lang-btn').textContent = lang === 'hr' ? 'EN' : 'HR';
    $('lang-btn').setAttribute('aria-label', lang === 'hr' ? 'English' : 'Hrvatski');
    $('show-pw').textContent = t($('password').type === 'password' ? 'login.show' : 'login.hide');
    document.title = 'Eva Apartman · ' + t('cal.title');
  }

  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  /* ── Calendar ──────────────────────────────────────────────────────── */
  function inSeason(d) { return data.seasons.some(function (s) { return d >= s.start && d <= s.end; }); }
  function bookingOn(d) { return data.booked.find(function (b) { return d >= b.start && d < b.end; }); }

  function status(d) {
    var arrive = data.booked.some(function (b) { return b.start === d; });
    var depart = data.booked.some(function (b) { return b.end === d; });
    var inside = data.booked.some(function (b) { return d > b.start && d < b.end; });
    if (inside) return 'booked';
    if (arrive && depart) return 'turnover';
    if (arrive) return 'arrive';
    if (depart) return 'depart';
    return inSeason(d) ? 'free' : 'off';
  }

  function renderWeekdays() {
    var fmtWd = new Intl.DateTimeFormat(LOCALE[lang], { weekday: 'short', timeZone: 'UTC' });
    var html = '';
    for (var i = 0; i < 7; i++) html += '<span>' + fmtWd.format(new Date(Date.UTC(2024, 0, 1 + i))) + '</span>'; // 1 Jan 2024 = Monday
    $('weekdays').innerHTML = html;
  }

  function renderCalendar() {
    var first = new Date(Date.UTC(cursor.y, cursor.m, 1));
    $('month-label').textContent = new Intl.DateTimeFormat(LOCALE[lang], { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first);
    var grid = $('cal-grid');
    grid.innerHTML = '';
    var offset = (first.getUTCDay() + 6) % 7;
    for (var i = 0; i < offset; i++) {
      var blank = document.createElement('span');
      blank.className = 'day blank';
      grid.appendChild(blank);
    }
    var today = todayIso();
    var days = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
    for (var day = 1; day <= days; day++) {
      var d = iso(new Date(Date.UTC(cursor.y, cursor.m, day)));
      var st = status(d);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day ' + st + (inSeason(d) ? '' : ' off') + (d < today ? ' past' : '') + (d === today ? ' today' : '');
      btn.textContent = day;
      btn.dataset.date = d;
      btn.setAttribute('aria-label', fmt(d, { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + t('status.' + st));
      grid.appendChild(btn);
    }
  }

  function onDayTap(d) {
    var b = bookingOn(d);
    if (b) return openEditor('booking', b);
    openEditor('booking', null, { start: d, end: addDays(d, 3) });
  }

  /* ── Lists ─────────────────────────────────────────────────────────── */
  function entryHtml(r, kind, sub) {
    var li = document.createElement('li');
    li.className = 'entry';
    li.innerHTML =
      '<div class="entry-main"><strong></strong><span></span></div>' +
      '<div class="entry-actions">' +
      '<button type="button" class="ghost-btn small-btn" data-edit>' + t('edit') + '</button>' +
      '</div>';
    li.querySelector('strong').textContent = fmtRange(r);
    li.querySelector('.entry-main span').textContent = sub;
    li.querySelector('[data-edit]').addEventListener('click', function () { openEditor(kind, r); });
    return li;
  }

  function renderLists() {
    var today = todayIso();
    var upcoming = data.booked.filter(function (b) { return b.end > today; });
    var past = data.booked.filter(function (b) { return b.end <= today; }).reverse();

    var ul = $('upcoming-list');
    ul.innerHTML = '';
    if (!upcoming.length) ul.innerHTML = '<li class="empty">' + t('upcoming.empty') + '</li>';
    upcoming.forEach(function (b) { ul.appendChild(entryHtml(b, 'booking', nightsLabel(daysBetween(b.start, b.end)))); });

    var pl = $('past-list');
    pl.innerHTML = '';
    past.forEach(function (b) { pl.appendChild(entryHtml(b, 'booking', nightsLabel(daysBetween(b.start, b.end)))); });
    $('past-count').textContent = past.length;
    $('past-wrap').hidden = !past.length;

    var sl = $('season-list');
    sl.innerHTML = '';
    if (!data.seasons.length) sl.innerHTML = '<li class="empty">' + t('season.empty') + '</li>';
    data.seasons.slice().reverse().forEach(function (s) {
      sl.appendChild(entryHtml(s, 'season', t('season.days', { n: daysBetween(s.start, s.end) + 1 })));
    });

    renderCopyOffer();
  }

  /* Offer "copy last year" when the most recent season is over or this
     year has none, and the next year doesn't exist yet. */
  function copyYears() {
    if (!data.seasons.length) return null;
    var thisYear = new Date().getFullYear();
    var years = data.seasons.map(function (s) { return +s.start.slice(0, 4); });
    var latest = Math.max.apply(null, years);
    var latestSeason = data.seasons.filter(function (s) { return +s.start.slice(0, 4) === latest; })
      .sort(function (a, b) { return a.end < b.end ? 1 : -1; })[0];
    if (latest > thisYear) return null;
    if (latest === thisYear && latestSeason.end >= todayIso()) return null;
    return { from: latest, to: latest + 1 };
  }

  function renderCopyOffer() {
    var y = copyYears();
    $('copy-offer').hidden = !y;
    if (!y) return;
    $('copy-text').textContent = t('copy.text', y);
    $('copy-btn').textContent = t('copy.btn', y);
  }

  function render() {
    renderWeekdays();
    renderCalendar();
    renderLists();
  }

  /* ── Editor dialog ─────────────────────────────────────────────────── */
  function openEditor(kind, original, preset) {
    editing = { kind: kind, original: original || null };
    var r = original || preset || {};
    $('edit-title').textContent = t(kind + (original ? '.edit' : '.new'));
    $('label-start').textContent = t(kind + '.start');
    $('label-end').textContent = t(kind + '.end');
    $('date-start').value = r.start || '';
    $('date-end').value = r.end || '';
    $('edit-delete').hidden = !original;
    $('edit-error').textContent = '';
    setBusy(false);
    updateSummary();
    $('edit-dialog').showModal();
  }

  function updateSummary() {
    var a = $('date-start').value, b = $('date-end').value;
    var summary = '', note = '';
    if (a && b && a < b) {
      var n = daysBetween(a, b);
      if (editing.kind === 'booking') {
        summary = nightsLabel(n);
        for (var d = a; d < b; d = addDays(d, 1)) { if (!inSeason(d)) { note = t('note.offseason'); break; } }
      } else {
        summary = t('season.days', { n: n + 1 });
      }
    }
    $('edit-summary').textContent = summary;
    $('edit-note').textContent = note;
  }

  function setBusy(busy) {
    $('edit-save').disabled = busy;
    $('edit-delete').disabled = busy;
    $('edit-save').textContent = t(busy ? 'saving' : 'save');
  }

  function submitEditor(e) {
    e.preventDefault();
    var r = { start: $('date-start').value, end: $('date-end').value };
    if (!r.start || !r.end) { $('edit-error').textContent = t('err.invalid_date'); return; }
    if (r.end <= r.start) { $('edit-error').textContent = t('err.end_before_start'); return; }
    var Kind = editing.kind === 'booking' ? 'Booking' : 'Season';
    var body = editing.original
      ? { op: 'update' + Kind, from: editing.original, to: r }
      : { op: 'add' + Kind, start: r.start, end: r.end };
    setBusy(true);
    save(body, t('saved')).then(function () {
      $('edit-dialog').close();
      var d = parse(r.start);
      cursor = { y: d.getUTCFullYear(), m: d.getUTCMonth() };
      renderCalendar();
    }, function (err) {
      setBusy(false);
      $('edit-error').textContent = errorText(err);
    });
  }

  /* ── Delete ────────────────────────────────────────────────────────── */
  function askDelete() {
    var kind = editing.kind, r = editing.original;
    $('edit-dialog').close();
    $('confirm-title').textContent = t('confirm.' + kind);
    $('confirm-text').textContent = t('confirm.' + kind + '.text', { range: fmtRange(r) });
    $('confirm-error').textContent = '';
    $('confirm-ok').disabled = false;
    $('confirm-dialog').showModal();
    $('confirm-ok').onclick = function () {
      $('confirm-ok').disabled = true;
      var op = kind === 'booking' ? 'removeBooking' : 'removeSeason';
      save({ op: op, start: r.start, end: r.end }, t('deleted')).then(function () {
        $('confirm-dialog').close();
      }, function (err) {
        $('confirm-ok').disabled = false;
        $('confirm-error').textContent = errorText(err);
      });
    };
  }

  /* ── Save + load ───────────────────────────────────────────────────── */
  function accept(json) {
    data = { seasons: json.seasons || [], booked: json.booked || [] };
    render();
    return json;
  }

  function save(body, message) {
    return api('POST', 'data', body).then(function (json) {
      accept(json);
      if (message) toast(message);
      return json;
    }, function (err) {
      if (err.status === 401) { show('login'); $('login-error').textContent = t('err.signed_out'); }
      if (err.code === 'not_found') load();
      throw err;
    });
  }

  function load() {
    return api('GET', 'data').then(function (json) {
      accept(json);
      if (json.sessionExpires) {
        $('session-note').textContent = t('session', {
          date: new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'long' }).format(new Date(json.sessionExpires * 1000))
        });
        $('session-note').dataset.exp = json.sessionExpires;
      }
      show('app');
    }, function (err) {
      if (err.status === 401) return show('login');
      show('login');
      $('login-error').textContent = errorText(err);
    });
  }

  /* ── Wire up ───────────────────────────────────────────────────────── */
  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var pw = $('password').value;
    if (!pw) return;
    var btn = $('login-btn');
    btn.disabled = true;
    btn.textContent = t('login.busy');
    $('login-error').textContent = '';
    api('POST', 'login', { password: pw }).then(function () {
      $('password').value = '';
      return load();
    }, function (err) {
      $('login-error').textContent = errorText(err);
      $('password').select();
    }).then(function () {
      btn.disabled = false;
      btn.textContent = t('login.submit');
    });
  });

  $('show-pw').addEventListener('click', function () {
    var input = $('password');
    input.type = input.type === 'password' ? 'text' : 'password';
    this.textContent = t(input.type === 'password' ? 'login.show' : 'login.hide');
  });

  $('signout-btn').addEventListener('click', function () {
    api('POST', 'logout').catch(function () {}).then(function () { show('login'); });
  });

  $('lang-btn').addEventListener('click', function () {
    lang = lang === 'hr' ? 'en' : 'hr';
    try { localStorage.setItem('eva-admin-lang', lang); } catch (e) { /* private mode */ }
    applyText();
    if (!$('view-app').hidden) {
      render();
      var exp = $('session-note').dataset.exp;
      if (exp) $('session-note').textContent = t('session', {
        date: new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'long' }).format(new Date(exp * 1000))
      });
    }
  });

  $('prev-month').addEventListener('click', function () {
    cursor.m--; if (cursor.m < 0) { cursor.m = 11; cursor.y--; } renderCalendar();
  });
  $('next-month').addEventListener('click', function () {
    cursor.m++; if (cursor.m > 11) { cursor.m = 0; cursor.y++; } renderCalendar();
  });
  $('cal-grid').addEventListener('click', function (e) {
    var btn = e.target.closest('button.day');
    if (btn && btn.dataset.date) onDayTap(btn.dataset.date);
  });

  document.querySelectorAll('[data-action="new-booking"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      // Start from today, or from the opening day of the next season.
      var today = todayIso();
      var next = data.seasons.find(function (s) { return s.end >= today; });
      var start = next && next.start > today ? next.start : today;
      openEditor('booking', null, { start: start, end: addDays(start, 3) });
    });
  });
  $('add-season').addEventListener('click', function () {
    var y = new Date().getFullYear() + 1;
    openEditor('season', null, { start: y + '-06-01', end: y + '-10-01' });
  });

  $('copy-btn').addEventListener('click', function () {
    var y = copyYears();
    if (!y) return;
    var btn = this;
    btn.disabled = true;
    save({ op: 'copyYear', from: y.from, to: y.to }).then(function (json) {
      var r = json.result || {};
      toast(t('copy.done', { s: r.addedSeasons || 0, b: r.addedBookings || 0 }));
      cursor = { y: y.to, m: 5 };
      renderCalendar();
    }, function (err) { toast(errorText(err)); }).then(function () { btn.disabled = false; });
  });

  $('edit-form').addEventListener('submit', submitEditor);
  $('date-start').addEventListener('input', function () {
    // Keep the stay length when the arrival moves past the departure.
    var a = this.value, b = $('date-end').value;
    if (a && (!b || b <= a)) $('date-end').value = addDays(a, editing && editing.kind === 'season' ? 120 : 3);
    updateSummary();
  });
  $('date-end').addEventListener('input', updateSummary);
  $('edit-cancel').addEventListener('click', function () { $('edit-dialog').close(); });
  $('edit-delete').addEventListener('click', askDelete);
  $('confirm-cancel').addEventListener('click', function () { $('confirm-dialog').close(); });

  applyText();
  load();
})();
