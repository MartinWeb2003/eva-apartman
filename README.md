# Eva Apartman — visit-eva-orebic.com

Static site for a holiday apartment in Kućište, Pelješac. Published on Netlify
straight from the repo root, with no build step running on Netlify — the
generated files are committed.

## The one rule

**Edit the templates in `src/`. Never edit `index.html`, `gallery.html`,
`location.html`, `contact.html`, `hr/`, `pl/`, `de/` or `sitemap.xml`** — the
next build overwrites them.

```
src/index.html   ──┐
src/gallery.html   ├──  npm run build  ──▶  index.html, hr/index.html, pl/…, de/…
src/location.html  │                        gallery.html, hr/gallery.html, …
src/contact.html ──┘                        sitemap.xml
```

## Everyday tasks

| I want to… | Do this |
|---|---|
| Add or remove photos | Drop files in `images/indoor` \| `terrace` \| `beach`, then double-click `update-gallery.bat` |
| Change wording | Edit the text in `js/translations.js` (all four languages live there), then `npm run build` |
| Change layout/markup | Edit the matching file in `src/`, then `npm run build` |
| Change styling | Edit `css/style.css` or `css/gallery.css`, then `npm run build` (the build re-stamps the cache-busting hash) |
| Check nothing broke | `npm run check` |
| Edit bookings / season dates | Open `/admin` on any phone or computer and sign in (see "Admin panel" below) |
| Change the admin password | `node tools/admin-password.js "new password"`, paste the two lines into Netlify's environment variables, redeploy |
| Try the admin panel locally | `node tools/admin-dev.js`, open http://localhost:8766/admin (in-memory copy, never touches live data) |

After any change: `npm run build`, then commit **and** push the generated files.

## Commands

```bash
npm install        # once
npm run build      # manifest → image derivatives → pages + sitemap
npm run rebuild    # same, but re-encodes every image from scratch
npm run check      # validates all 16 pages, exits non-zero on a problem
```

## How it fits together

| File | Job |
|---|---|
| `src/*.html` | The four page templates. Text nodes carry `data-i18n` keys. |
| `js/translations.js` | Every string in EN/HR/PL/DE. Used by the build **and** at runtime. |
| `tools/build-manifest.js` | Scans the photo folders → `images/gallery-manifest.json`. |
| `tools/optimize-images.js` | Makes WebP + resized variants → `images/opt/`, records sizes in `images/image-data.json`. |
| `tools/build-site.js` | Renders the 16 pages, pre-renders the gallery, injects JSON-LD, writes `sitemap.xml`. |
| `tools/structured-data.js` | The JSON-LD. Facts about the property live here. |
| `tools/check-build.js` | Validation. |
| `images/alt-text.json` | Per-photo alt text in four languages. |
| `netlify.toml` | Cache headers, security headers, redirects, admin `noindex`. |

## Things worth knowing

**Languages are real URLs.** `/` is English, `/hr/`, `/pl/`, `/de/` are the
others, each with its own `<title>`, `<meta description>` and a reciprocal
`hreflang` cluster. The language switcher navigates; it no longer swaps text in
place. Adding a language means adding it to `LANGS` in `tools/build-site.js`,
`js/i18n.js` and `js/translations.js`.

**The review rating appears twice** — in the badge on the homepage and in the
JSON-LD — and Google requires them to agree. Both are driven by `RATING` and
`REVIEW_COUNT` in `tools/structured-data.js`; `npm run check` fails if they
drift apart. Keep them matching the real Google Business Profile.

**CSS and JS are cached for a year.** That is only safe because the build
appends a content hash (`style.css?v=1a2b3c4d`). If you ever hand-edit a page to
drop the `?v=`, that file becomes uncacheable-in-practice for returning
visitors.

## Admin panel

`/admin` lets the host add, change and remove bookings and set the season,
from a phone. It's in Croatian by default (EN button top right). Changes show
on the public calendar immediately.

**How it's protected.** The page holds nothing secret. Every read and write
goes to `netlify/functions/admin.mjs`, which checks the password on the server
(scrypt hash, ~1 s penalty per wrong guess) and then issues a signed,
HttpOnly, 30-day session cookie. The JSONBin write key lives only in Netlify's
environment variables and never reaches a browser. Changes are sent as single
operations ("add this booking") and applied to the latest stored data, so two
devices can't overwrite each other.

**One-time setup** (Netlify → Site configuration → Environment variables, scope
"Functions"):

| Variable | Value |
|---|---|
| `ADMIN_PASSWORD_HASH` | from `node tools/admin-password.js "the password"` |
| `SESSION_SECRET` | from the same command |
| `JSONBIN_MASTER_KEY` | JSONBin dashboard → API Keys → X-Master-Key |

Then Deploys → Trigger deploy. Until all three are set, sign-in shows
"not set up on the server yet".

Don't add the bin ID as a variable: it isn't secret (the public calendar reads
with it, see `js/availability.js`) and Netlify's secrets scanner fails the
deploy when a variable's value also appears in the code.

**Sign everyone out** (lost phone, password shared too widely): change
`SESSION_SECRET` (any new value from the password tool) and redeploy.

**The calendar data is public.** The website reads the bin without a key, so
it must only ever hold dates. The API stores nothing but `start`/`end` pairs.
