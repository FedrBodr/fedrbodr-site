import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = read('index.html');
const privacy = read('privacy.html');
const htaccess = read('.htaccess');
const securityTxt = read('.well-known/security.txt');
const deploy = read('deploy.sh');

test('no links to Instagram', () => {
  assert.doesNotMatch(html, /instagram/i);
});

test('footer links to the privacy policy and cookie settings', () => {
  const footer = html.slice(html.indexOf('<footer>'), html.indexOf('</footer>'));
  assert.match(footer, /href="\/privacy\.html"/);
  assert.match(footer, /class="cookie-settings"/);
  assert.match(privacy, /152-ФЗ/);
  assert.match(privacy, /studio\.fedrbodr\.com\/privacy/);
});

test('analytics loads only after cookie consent', () => {
  const analytics = html.slice(html.indexOf('<script id="analytics">'), html.indexOf('</script>', html.indexOf('<script id="analytics">')));
  assert.match(analytics, /window\.fedrbodrStartAnalytics = function/);
  assert.match(analytics, /localStorage\.getItem\('fedrbodr\.cookies'\) === 'accepted'/);
  assert.match(html, /id="cookie-banner"[^>]*hidden/);
  assert.match(html, /id="cookie-accept"/);
  assert.match(html, /id="cookie-decline"/);
});

test('Google Analytics is removed', () => {
  assert.doesNotMatch(html, /gtag|googletagmanager|google-analytics/i);
  assert.doesNotMatch(htaccess, /googletagmanager|google-analytics|analytics\.google/i);
  assert.match(privacy, /ИНН 772373964340/);
});

test('every data form asks for consent', () => {
  assert.match(html, /id="assistant-consent"/);
  assert.match(html, /assistant-lead-consent/);
  assert.doesNotMatch(html, /you@mail\.com/);
});

test('CSP script hashes match the inline scripts', () => {
  const expected = [];
  for (const [, attrs = '', body] of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=/.test(attrs)) continue;
    expected.push(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
  const csp = htaccess.match(/Content-Security-Policy(?:-Report-Only)? "([^"]+)"/)[1];
  const actual = csp.match(/'sha256-[^']+'/g) || [];
  assert.deepEqual(actual.sort(), expected.sort(), `update script-src in .htaccess:\n${expected.join(' ')}`);
});

test('security headers are set', () => {
  for (const header of ['Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy']) {
    assert.match(htaccess, new RegExp(`Header always set ${header} `));
  }
});

test('security.txt has a contact and a future expiry', () => {
  assert.match(securityTxt, /^Contact: mailto:\S+@\S+$/m);
  const expires = securityTxt.match(/^Expires: (\S+)$/m)[1];
  assert.ok(new Date(expires) > new Date(), 'security.txt has expired');
});

test('deploy uploads the new files', () => {
  for (const file of ['privacy.html', '.htaccess', '.well-known/security.txt']) {
    assert.ok(deploy.includes(`"${file}"`), `${file} missing from deploy.sh`);
  }
});
