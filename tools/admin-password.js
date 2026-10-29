/**
 * Eva Apartman – admin password setup
 * ---------------------------------------------------------------------------
 * Prints the two secret values the admin sign-in needs, ready to paste into
 * Netlify → Site configuration → Environment variables:
 *
 *     node tools/admin-password.js "the new password"
 *
 *   ADMIN_PASSWORD_HASH  an scrypt verifier of the password. The password
 *                        itself is never stored anywhere.
 *   SESSION_SECRET       a fresh random key that signs the 30-day sign-in
 *                        cookie. Replacing it signs out every device.
 *
 * The check runs on the server (netlify/functions/admin.mjs), so unlike the
 * old panel nothing here can be bypassed from the browser. A long password
 * still matters: use four or more unrelated words, e.g. "maslina terasa
 * plavac jedro" — easy to type on a phone, hard to guess.
 *
 * After changing the variables in Netlify, trigger a redeploy (Deploys →
 * Trigger deploy) so the function picks them up.
 */
'use strict';

const crypto = require('crypto');

const N = 2 ** 15;
const r = 8;
const p = 1;
const KEYLEN = 32;
const MIN_LENGTH = 12;

const password = process.argv[2];

if (!password) {
  console.error('Usage: node tools/admin-password.js "<new password>"');
  process.exit(1);
}
if (password.length < MIN_LENGTH) {
  console.error(`Please use at least ${MIN_LENGTH} characters. Four ordinary words separated by spaces work well.`);
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password.normalize('NFC'), salt, KEYLEN, { N, r, p, maxmem: 256 * 1024 * 1024 });

console.log('\nAdd these in Netlify → Site configuration → Environment variables');
console.log('(scope: Functions), then Deploys → Trigger deploy:\n');
console.log(`ADMIN_PASSWORD_HASH = scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${hash.toString('base64')}`);
console.log(`SESSION_SECRET      = ${crypto.randomBytes(32).toString('base64url')}`);
console.log('\nKeep this output private and don\'t commit it.');
