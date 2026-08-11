/**
 * Eva Apartman – Admin password hash generator
 * ---------------------------------------------------------------------------
 * The admin panel used to compare against a plaintext string sitting in
 * tripuneva1/index.html, i.e. the password was readable by anyone who opened
 * "view source". This prints a PBKDF2 verifier to paste in its place.
 *
 *     node tools/admin-password.js "my new password"
 *
 * READ THIS BEFORE RELYING ON IT
 * ------------------------------
 * The check still runs in the visitor's browser, so this is obfuscation, not
 * access control. A determined attacker can take the salt and hash from the
 * page and grind guesses offline; PBKDF2 at 250k iterations makes that slow and
 * a long random password makes it impractical, but nothing here stops someone
 * who simply edits the JS in devtools to skip the check.
 *
 * The panel only writes to localStorage on the visitor's own machine, so the
 * blast radius is small — but the JSONBin master key field in that page is a
 * real credential. For actual protection, put the directory behind Netlify's
 * password protection or Netlify Identity, which enforce on the server.
 */
'use strict';

const crypto = require('crypto');

const ITERATIONS = 250000;
const KEYLEN = 32;
const DIGEST = 'sha256';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node tools/admin-password.js "<new password>"');
  process.exit(1);
}

if (password.length < 12) {
  console.warn('! Warning: shorter than 12 characters. Because the verifier ships');
  console.warn('  to the browser, a short password can be brute-forced offline.\n');
}

const salt = crypto.randomBytes(16).toString('hex');
/* The browser decodes PW_SALT from hex into bytes before calling deriveBits,
   so derive over the same raw bytes here — passing the hex *string* would salt
   with its 32 ASCII characters instead and never match. */
const hash = crypto
  .pbkdf2Sync(password, Buffer.from(salt, 'hex'), ITERATIONS, KEYLEN, DIGEST)
  .toString('hex');

console.log('Paste these into tripuneva1/index.html, replacing the existing values:\n');
console.log(`var PW_SALT       = '${salt}';`);
console.log(`var PW_HASH       = '${hash}';`);
console.log(`var PW_ITERATIONS = ${ITERATIONS};`);
