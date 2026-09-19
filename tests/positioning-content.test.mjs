import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('hero promises launch and rescue, not a days-long MVP', () => {
  const hero = html.slice(html.indexOf('<div class="hero">'), html.indexOf('<!-- ORDER'));
  assert.match(hero, /Запускаю и спасаю веб-проекты/);
  assert.match(hero, /backend, платежи, интеграции/);
  assert.doesNotMatch(hero, /Соберу ваш MVP от идеи до прода/);
  assert.match(hero, /href="#assistant"/);
});

test('three service directions are present and bilingual', () => {
  const order = html.slice(html.indexOf('<section id="order"'), html.indexOf('</section>', html.indexOf('<section id="order"')));
  for (const ru of ['Спасение и доработка', 'MVP и SaaS с нуля', 'Автоматизация процессов']) {
    assert.ok(order.includes(`data-ru="${ru}"`), `missing ${ru}`);
  }
  assert.match(order, /data-en="Rescue &amp; improve existing products"/);
  assert.match(order, /data-en="MVP &amp; SaaS from scratch"/);
  assert.match(order, /data-en="Process automation"/);
  assert.match(order, /Как KSY Deals/);
});

test('days-only promise is scoped to prototypes', () => {
  const order = html.slice(html.indexOf('<section id="order"'), html.indexOf('</section>', html.indexOf('<section id="order"')));
  assert.match(order, /Рабочий прототип за несколько дней/);
});
