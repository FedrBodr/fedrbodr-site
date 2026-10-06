import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const ownHosts = /(^|\.)(fedrbodr\.com|vezdepost\.ru)$/;

const rules = read('go/.htaccess')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('RedirectMatch'));

test('short links follow the one-line format', () => {
  assert.ok(rules.length > 0);
  for (const rule of rules) {
    assert.match(rule, /^RedirectMatch 302 \^\/go\/[a-z0-9]+(-[a-z0-9]+)*\/\?\$ https:\/\/\S+$/, rule);
  }
});

test('short link codes are unique', () => {
  const codes = rules.map((rule) => rule.split(' ')[2]);
  assert.equal(new Set(codes).size, codes.length);
});

test('links to own projects carry source, medium and campaign', () => {
  for (const rule of rules) {
    const url = new URL(rule.split(' ')[3]);
    if (!ownHosts.test(url.hostname)) continue;
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
      assert.match(url.searchParams.get(key) ?? '', /^[a-z0-9]+(-[a-z0-9]+)*$/, `${key} in ${rule}`);
    }
  }
});

test('deploy uploads the short links', () => {
  assert.match(read('deploy.sh'), /"go\/\.htaccess"/);
});
