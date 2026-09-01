import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function section(name) {
  const marker = `<div class="project-group" data-project-group="${name}">`;
  const start = html.indexOf(marker);
  assert.notEqual(start, -1, `${name} project group must exist`);
  const nextGroup = html.indexOf('<div class="project-group"', start + marker.length);
  const sectionEnd = html.indexOf('</section>', start);
  const end = nextGroup !== -1 && nextGroup < sectionEnd ? nextGroup : sectionEnd;
  return html.slice(start, end);
}

test('current projects exist in the agreed order', () => {
  const expected = ['ksy-store', 'gopro-wifi-viewer', 'imvu-profit', 'marcel-lior'];
  const actual = [...html.matchAll(/data-project="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(actual, expected);
});

test('KSY Store is first and exclusively marked as custom development', () => {
  const ksy = html.match(/<article class="proj-card client-work" data-project="ksy-store">([\s\S]*?)<\/article>/)?.[1] || '';
  assert.match(ksy, /data-ru="Заказная разработка"/);
  assert.match(ksy, /data-en="Custom development"/);
  assert.doesNotMatch(ksy, /data-ru="В работе"/);
});

test('all agreed current-project descriptions are bilingual', () => {
  const required = [
    'Клиентский сервис моей студии',
    'Редизайн приложения для просмотра и управления GoPro',
    'Набор продуктов для IMVU-креаторов'
  ];
  for (const text of required) assert.ok(html.includes(text), `missing Russian copy: ${text}`);
  for (const card of html.matchAll(/<article class="proj-card[^>]*data-project="[^"]+">([\s\S]*?)<\/article>/g)) {
    assert.match(card[1], /data-ru=/);
    assert.match(card[1], /data-en=/);
  }
});

test('removed projects are gone from the working group', () => {
  const working = section('working');
  assert.doesNotMatch(working, />Arbiterra</);
  assert.doesNotMatch(working, />Lead Intelligence</);
});

test('launched group keeps Vezdepost and Marcel Lior with their links', () => {
  const launched = section('launched');
  assert.match(launched, />Vezdepost</);
  assert.match(launched, /https:\/\/vezdepost\.ru/);
  assert.match(launched, /https:\/\/github\.com\/FedrBodr\/vezdepost/);
  assert.match(launched, />Marcel Lior</);
  assert.match(launched, /https:\/\/marcellior\.com\//);
  assert.doesNotMatch(launched, />Русский Лайнап</);
  assert.doesNotMatch(launched, /russianlineup\.ru/);
});

test('placeholder project is removed', () => {
  assert.doesNotMatch(html, /data-ru="Следующий проект"/);
  assert.doesNotMatch(html, /class="proj-card dashed"/);
});
