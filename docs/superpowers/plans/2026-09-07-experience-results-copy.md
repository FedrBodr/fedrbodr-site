# Experience Results Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage experience section's years-first copy with bilingual, verifiable proof of fintech scale and current shipped-product results.

**Architecture:** Keep the existing static HTML and its `data-ru` / `data-en` localization mechanism unchanged. Add one focused Node test that treats the experience section as a content contract, then update only that section in `index.html`.

**Tech Stack:** Static HTML, Node.js built-in test runner, `node:assert/strict`.

## Global Constraints

- Keep the existing visual structure and update Russian and English copy together.
- Use only claims already present in the repository or supported by public professional materials.
- Describe Sberbank work as participation in processing a nationwide daily transaction flow, not sole ownership.
- Do not invent customer, revenue, or usage numbers.
- Do not use token counts or test counts as homepage customer-value claims.

---

### Task 1: Replace years-first experience copy with results-led proof

**Files:**
- Create: `tests/experience-content.test.mjs`
- Modify: `index.html:359-372`

**Interfaces:**
- Consumes: the existing `<section id="experience">` markup and `data-ru` / `data-en` localization attributes.
- Produces: a bilingual experience-section content contract verified by Node's built-in test runner.

- [ ] **Step 1: Write the failing content contract**

Create `tests/experience-content.test.mjs`:

```js
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
    ['>30\+<', 'платформ поддерживает Vezdepost', 'platforms supported by Vezdepost'],
    ['data-ru="Прод \+ доход"', 'запущенные и доходные продукты', 'shipped and revenue-generating products']
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
```

- [ ] **Step 2: Run the focused test and verify that it fails**

Run: `rtk node --test tests/experience-content.test.mjs`

Expected: FAIL because the new headline and proof points are not yet present.

- [ ] **Step 3: Update the bilingual experience section**

In `index.html`, keep the existing section wrapper and company/LinkedIn line, and replace the headline, lead, and credential cards with this content:

```html
<h2 data-i18n data-ru="15+ лет: от банковских транзакций до собственных AI-продуктов" data-en="15+ years: from banking transactions to my own AI products">15+ лет: от банковских транзакций до собственных AI-продуктов</h2>
<p class="lead" data-i18n data-ru="Работал с системами, где результат измеряется не строками кода, а надёжностью платежей и работающим продом. Делал интернет-банки, криптокошельки и платёжные сервисы для Сбербанка, Райффайзена, Альфа-Банка и Crypterium. В Сбере участвовал в обработке ежедневного потока транзакций по всей стране, в Crypterium разрабатывал платёжные микросервисы и интеграции с ЮKassa, QIWI и другими системами. Собрал и вёл команду до 13 человек. Сегодня использую этот опыт, чтобы с помощью ИИ быстрее выпускать собственные и клиентские продукты. Vezdepost уже работает в проде и поддерживает публикацию в 30+ платформ, AhMiranami приносит доход, KSY Store проходит реферальный пилот, а сайт Marcel Lior сдан под ключ. Не просто пишу код — довожу продукт от идеи до работающего результата." data-en="I have worked on systems where results are measured not in lines of code, but in reliable payments and software that reaches production. I built online banking, crypto-wallet, and payment services for Sberbank, Raiffeisen, Alfa-Bank, and Crypterium. At Sberbank, I helped process the daily nationwide transaction flow; at Crypterium, I built payment microservices and integrations with YooKassa, QIWI, and other providers. I also built and led a team of up to 13 people. Today I use that experience and AI to ship my own products and client work faster. Vezdepost is live and supports publishing to 30+ platforms, AhMiranami generates revenue, KSY Store is in a referral pilot, and the Marcel Lior website was delivered end to end. I do not just write code — I take products from idea to a working result.">Работал с системами, где результат измеряется не строками кода, а надёжностью платежей и работающим продом. Делал интернет-банки, криптокошельки и платёжные сервисы для Сбербанка, Райффайзена, Альфа-Банка и Crypterium. В Сбере участвовал в обработке ежедневного потока транзакций по всей стране, в Crypterium разрабатывал платёжные микросервисы и интеграции с ЮKassa, QIWI и другими системами. Собрал и вёл команду до 13 человек. Сегодня использую этот опыт, чтобы с помощью ИИ быстрее выпускать собственные и клиентские продукты. Vezdepost уже работает в проде и поддерживает публикацию в 30+ платформ, AhMiranami приносит доход, KSY Store проходит реферальный пилот, а сайт Marcel Lior сдан под ключ. Не просто пишу код — довожу продукт от идеи до работающего результата.</p>
<div class="creds">
  <div class="cred"><div class="big">15+</div><p data-i18n data-ru="лет коммерческой разработки" data-en="years of commercial development">лет коммерческой разработки</p></div>
  <div class="cred"><div class="big">13</div><p data-i18n data-ru="человек в команде, которую собрал и вёл" data-en="people in a team I built and led">человек в команде, которую собрал и вёл</p></div>
  <div class="cred"><div class="big" data-i18n data-ru="Финтех" data-en="Fintech">Финтех</div><p data-i18n data-ru="банки, криптокошельки и платёжные системы" data-en="online banks, crypto wallets, and payment systems">банки, криптокошельки и платёжные системы</p></div>
  <div class="cred"><div class="big">30+</div><p data-i18n data-ru="платформ поддерживает Vezdepost" data-en="platforms supported by Vezdepost">платформ поддерживает Vezdepost</p></div>
  <div class="cred"><div class="big" data-i18n data-ru="Прод + доход" data-en="Live + revenue">Прод + доход</div><p data-i18n data-ru="запущенные и доходные продукты" data-en="shipped and revenue-generating products">запущенные и доходные продукты</p></div>
</div>
```

- [ ] **Step 4: Run the focused and full test suites**

Run: `rtk node --test tests/experience-content.test.mjs`

Expected: all focused tests PASS.

Run: `rtk node --test tests/*.test.mjs`

Expected: all repository tests PASS.

- [ ] **Step 5: Inspect and commit the implementation**

Run: `rtk git diff --check && rtk git diff -- index.html tests/experience-content.test.mjs`

Expected: no whitespace errors; the diff contains only the agreed experience copy and its test.

```bash
rtk git add index.html tests/experience-content.test.mjs
rtk git commit -m "feat: strengthen experience proof points"
```
