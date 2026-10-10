import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('show section and soon-links are gone', () => {
  assert.doesNotMatch(html, /<section id="show">/);
  assert.doesNotMatch(html, /0-to-prod»: от идеи до боевого запуска/);
  assert.doesNotMatch(html, /data-soon="1"/);
  assert.doesNotMatch(html, /Ссылка скоро/);
});

test('client-first contact CTA and trust line', () => {
  const contact = html.slice(html.indexOf('<section id="contact"'), html.indexOf('</section>', html.indexOf('<section id="contact"')));
  assert.match(contact, /Нужно запустить, закончить или спасти веб-проект\?/);
  assert.match(contact, /Need to launch, finish or rescue a web product\?/);
  assert.match(contact, /data-ru="Самозанятый · по договору · с чеком"/);
  assert.match(contact, /data-en="Self-employed · contract-based · receipts provided"/);
});

test('3D maps spotlight comes right after the hero; build-in-public block is gone', () => {
  const order = ['class="hero"', 'id="prostranstvo"', 'id="directions"', 'id="order"', 'id="cases"', 'id="experience"', 'id="about"', 'id="assistant"', 'id="contact"'];
  const positions = order.map((id) => html.indexOf(id));
  assert.ok(positions.every((p) => p > 0), 'every section is present');
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.doesNotMatch(html, /id="build"|href="#build"|href="#show"/);
});

test('Prostranstvo spotlight links to the live map and the order form', () => {
  const spot = html.slice(html.indexOf('<section id="prostranstvo"'), html.indexOf('</section>', html.indexOf('<section id="prostranstvo"')));
  assert.match(spot, /href="\/chicano-day\/"/);
  assert.match(spot, /href="\/prostranstvo\/#lead-form"/);
  assert.match(spot, /От 30 000 ₽/);
  assert.match(spot, /From ₽30,000/);
  assert.match(spot, /src="img\/chicano-overview-800\.webp"/);
  assert.match(html, /<a href="#prostranstvo" class="nav-hl"/);
});

test('robots and sitemap exist with canonical URL', () => {
  const robots = readFileSync(new URL('../robots.txt', import.meta.url), 'utf8');
  assert.match(robots, /Sitemap: https:\/\/fedrbodr\.com\/sitemap\.xml/);
  const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.match(sitemap, /https:\/\/fedrbodr\.com\//);
});

test('meta title and description carry the new positioning', () => {
  assert.match(html, /launch and rescue|Запуск и спасение веб-проектов/);
  assert.doesNotMatch(html, /от идеи до прода за несколько дней<\/title>/);
});
