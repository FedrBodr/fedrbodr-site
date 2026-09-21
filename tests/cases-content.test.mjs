import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('evidence cases with task, solution and verifiable result', () => {
  const cases = html.slice(html.indexOf('<section id="cases"'), html.indexOf('</section>', html.indexOf('<section id="cases"')));
  for (const id of ['data-case="ksy"', 'data-case="vezdepost"']) {
    assert.ok(cases.includes(id), `missing ${id}`);
  }
  assert.match(cases, /production-контур v0\.8\.4/i);
  assert.match(cases, /бизнес-эффект ещё измеряется/);
  assert.match(cases, /интеграцию MAX/);
  assert.doesNotMatch(cases, /marcel|fintech|без названия/i);
});

test('stale claims are gone', () => {
  assert.doesNotMatch(html, /следующая цель — первый оплаченный заказ/i);
  assert.doesNotMatch(html, /проходит реферальный пилот/i);
  assert.doesNotMatch(html, /KSY Store/);
});

test('experience states 20+ years without the pilot', () => {
  const exp = html.slice(html.indexOf('<section id="experience"'), html.indexOf('</section>', html.indexOf('<section id="experience"')));
  assert.match(exp, /20\+/);
  assert.doesNotMatch(exp, /пилот|Marcel Lior/);
  assert.doesNotMatch(exp, /15\+ лет/);
});

test('Prostranstvo is featured as an own product case', () => {
  const cases = html.slice(html.indexOf('<section id="cases"'), html.indexOf('</section>', html.indexOf('<section id="cases"')));
  assert.match(cases, /data-case="prostranstvo"/);
  assert.match(cases, /fedrbodr\.com\/prostranstvo\//);
  assert.match(cases, /fedrbodr\.com\/batareya\//);
  assert.match(cases, /Собственный продукт/);
});
