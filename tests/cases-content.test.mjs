import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('three evidence cases with task, solution and verifiable result', () => {
  const cases = html.slice(html.indexOf('<section id="cases"'), html.indexOf('</section>', html.indexOf('<section id="cases"')));
  for (const id of ['data-case="ksy"', 'data-case="marcel"', 'data-case="fintech"']) {
    assert.ok(cases.includes(id), `missing ${id}`);
  }
  assert.match(cases, /production-контур v0\.8\.4/i);
  assert.match(cases, /бизнес-эффект ещё измеряется/);
  assert.match(cases, /этап принят заказчиком и полностью оплачен/);
  assert.match(cases, /marcellior\.com/);
});

test('stale claims are gone', () => {
  assert.doesNotMatch(html, /следующая цель — первый оплаченный заказ/i);
  assert.doesNotMatch(html, /проходит реферальный пилот/i);
  assert.doesNotMatch(html, /KSY Store/);
});

test('experience states 20+ years and paid pilot', () => {
  const exp = html.slice(html.indexOf('<section id="experience"'), html.indexOf('</section>', html.indexOf('<section id="experience"')));
  assert.match(exp, /20\+/);
  assert.match(exp, /клиентский пилот принят и оплачен/);
  assert.doesNotMatch(exp, /15\+ лет/);
});
