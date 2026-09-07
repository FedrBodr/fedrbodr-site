import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const experience = html.match(/<section id="experience">([\s\S]*?)<\/section>/)?.[1] || '';

test('experience section leads with results in both languages', () => {
  assert.match(experience, /data-ru="15\+ лет: от банковских транзакций до собственных AI-продуктов"/);
  assert.match(experience, /data-en="15\+ years: from banking transactions to my own AI products"/);
  assert.match(experience, /ежедневного потока транзакций по всей стране/);
  assert.match(experience, /daily nationwide transaction flow/);
});

test('experience credentials contain concrete bilingual proof points', () => {
  const proofPoints = [
    ['>13<', 'команду до 13 человек', 'team of up to 13 people'],
    ['data-ru="Финтех"', 'банки, криптокошельки и платёжные системы', 'online banks, crypto wallets, and payment systems'],
    ['>30\\+<', 'платформ поддерживает Vezdepost', 'platforms supported by Vezdepost'],
    ['data-ru="Прод \\+ доход"', 'запущенные и доходные продукты', 'shipped and revenue-generating products']
  ];

  for (const variants of proofPoints) {
    for (const variant of variants) assert.match(experience, new RegExp(variant));
  }
});

test('experience section names current shipped outcomes without unsupported metrics', () => {
  for (const result of ['Vezdepost', 'AhMiranami', 'KSY Store', 'Marcel Lior']) {
    assert.match(experience, new RegExp(result));
  }
  assert.doesNotMatch(experience, /million tokens|миллион(?:а|ов)? токенов|552 tests|552 теста/);
});
