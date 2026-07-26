# Browser Locale Language Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing RU/EN site select the first-visit language from the browser locale and remember an explicit language-switch choice.

**Architecture:** Keep translations and runtime logic inside `index.html`. Mark the language script with a stable ID so dependency-free Node tests can extract and execute it against a small fake DOM and storage implementation.

**Tech Stack:** HTML5, browser JavaScript (ES5-compatible style), Node.js built-in `node:test`, `node:vm`, and `node:assert`.

## Global Constraints

- A valid saved choice (`ru` or `en`) has priority over browser locale.
- A Russian-language primary browser locale, or one from region `RU`, `BY`, `KZ`, or `KG`, selects Russian; all other, missing, or malformed locales select English.
- Only an explicit RU/EN button click writes `fedrbodr.lang` to `localStorage`.
- Storage failures must not prevent language selection or switching.
- Keep one `index.html`; do not add routes, query parameters, runtime dependencies, or duplicated language pages.
- Preserve the existing `lang_switch` analytics event for clicks only.
- Do not modify or commit unrelated `.idea/` files.

---

### Task 1: Locale selection, persistence, metadata, and accessibility

**Files:**
- Create: `tests/language-switch.test.mjs`
- Modify: `index.html:7-25,222-233,261,421-448`

**Interfaces:**
- Consumes: existing `data-i18n`, `data-i18n-attr`, `data-ru`, `data-en`, and `data-lang` attributes.
- Produces: storage key `fedrbodr.lang`; `<script id="language-switcher">`; button `aria-pressed` state synchronized with the active language.

- [ ] **Step 1: Add a dependency-free behavioral test harness**

Create `tests/language-switch.test.mjs` with the complete fixture below. It extracts only the production language script, supplies translated text/attribute elements and RU/EN buttons, and runs the script in an isolated VM context.

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function languageScript() {
  const match = html.match(/<script id="language-switcher">([\s\S]*?)<\/script>/);
  assert.ok(match, 'language-switcher script must exist');
  return match[1];
}

class FakeElement {
  constructor(attributes = {}) {
    this.attributes = new Map(Object.entries(attributes));
    this.innerHTML = '';
    this.listeners = {};
    this.classes = new Set();
    this.classList = {
      toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name)
    };
  }

  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  addEventListener(name, listener) { this.listeners[name] = listener; }
  click() { this.listeners.click(); }
}

function load({ saved = null, language, languages, storageThrows = false } = {}) {
  const text = new FakeElement({ 'data-ru': 'Русский текст', 'data-en': 'English text' });
  const metadata = new FakeElement({
    'data-i18n-attr': 'content',
    'data-ru': 'Русское описание',
    'data-en': 'English description'
  });
  const ru = new FakeElement({ 'data-lang': 'ru' });
  const en = new FakeElement({ 'data-lang': 'en' });
  const documentElement = new FakeElement();
  const writes = [];
  const storage = {
    getItem(key) {
      if (storageThrows) throw new Error('storage blocked');
      assert.equal(key, 'fedrbodr.lang');
      return saved;
    },
    setItem(key, value) {
      if (storageThrows) throw new Error('storage blocked');
      writes.push([key, value]);
    }
  };
  const document = {
    documentElement,
    querySelectorAll(selector) {
      if (selector === '[data-i18n]') return [text];
      if (selector === '[data-i18n-attr]') return [metadata];
      if (selector === '.lang button') return [ru, en];
      return [];
    }
  };

  vm.runInNewContext(languageScript(), {
    document,
    localStorage: storage,
    navigator: { language, languages }
  });

  return { documentElement, en, metadata, ru, text, writes };
}

function assertLanguage(page, language) {
  assert.equal(page.documentElement.getAttribute('lang'), language);
  assert.equal(page.text.innerHTML, language === 'ru' ? 'Русский текст' : 'English text');
  assert.equal(page.metadata.getAttribute('content'), language === 'ru' ? 'Русское описание' : 'English description');
  assert.equal(page.ru.classes.has('active'), language === 'ru');
  assert.equal(page.en.classes.has('active'), language === 'en');
  assert.equal(page.ru.getAttribute('aria-pressed'), String(language === 'ru'));
  assert.equal(page.en.getAttribute('aria-pressed'), String(language === 'en'));
}

test('saved choice overrides browser locale without rewriting storage', () => {
  const page = load({ saved: 'en', language: 'ru-RU', languages: ['ru-RU'] });
  assertLanguage(page, 'en');
  assert.deepEqual(page.writes, []);
});

test('Russian language or conservative Russian-speaking regions select Russian', () => {
  assertLanguage(load({ language: 'ru-RU', languages: ['ru-RU', 'en-US'] }), 'ru');
  assertLanguage(load({ language: 'be-BY', languages: ['be-BY'] }), 'ru');
  assertLanguage(load({ language: 'kk-Cyrl-KZ', languages: ['kk-Cyrl-KZ'] }), 'ru');
  assertLanguage(load({ language: 'ky-KG', languages: ['ky-KG'] }), 'ru');
});

test('other, missing, or malformed locales select English', () => {
  assertLanguage(load({ language: 'en-US', languages: ['en-US', 'ru-RU'] }), 'en');
  assertLanguage(load({ language: 'uk-UA', languages: ['uk-UA'] }), 'en');
  assertLanguage(load({ language: 'not_a_locale', languages: ['not_a_locale'] }), 'en');
  assertLanguage(load(), 'en');
});

test('invalid stored value is ignored', () => {
  assertLanguage(load({ saved: 'de', language: 'ru-RU' }), 'ru');
});

test('button click switches language and persists explicit choice', () => {
  const page = load({ language: 'ru-RU' });
  page.en.click();
  assertLanguage(page, 'en');
  assert.deepEqual(page.writes, [['fedrbodr.lang', 'en']]);
});

test('blocked storage degrades gracefully', () => {
  const page = load({ language: 'ru-RU', storageThrows: true });
  assertLanguage(page, 'ru');
  assert.doesNotThrow(() => page.en.click());
  assertLanguage(page, 'en');
});

test('every translated HTML element defines both language values', () => {
  const markup = html.slice(0, html.indexOf('<script id="language-switcher">'));
  const translatedLines = markup.split('\n').filter((line) => line.includes('data-i18n'));
  assert.ok(translatedLines.length > 0);
  for (const line of translatedLines) {
    assert.match(line, /data-ru=/);
    assert.match(line, /data-en=/);
  }
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run:

```bash
rtk node --test tests/language-switch.test.mjs
```

Expected: FAIL with `language-switcher script must exist`, because the existing inline script has no stable ID and still always selects Russian.

- [ ] **Step 3: Mark all language-dependent metadata and accessible attributes**

In `index.html`, add `data-i18n` plus `data-ru`/`data-en` to `<title>`. Add `data-i18n-attr="content"` plus translated values to `og:title`, `og:description`, `og:locale`, `og:locale:alternate`, `twitter:title`, and `twitter:description`. Use these exact locale mappings:

```html
<meta property="og:locale" data-i18n-attr="content" data-ru="ru_RU" data-en="en_US" content="ru_RU" />
<meta property="og:locale:alternate" data-i18n-attr="content" data-ru="en_US" data-en="ru_RU" content="en_US" />
```

Reuse the existing Russian title/description copy and their existing English description. Use this English title wherever a translated title is required:

```text
Dmitry Fedorenko (FedrBodr) — IT products from idea to production in days
```

Use this English social description for both Open Graph and Twitter:

```text
IT founder. MVP development from one week. Building products in public — the complete 0-to-prod journey.
```

Translate the switch label and both image alternatives using the existing attribute mechanism:

```html
<span class="lang-wrap lang" role="group" data-i18n-attr="aria-label" data-ru="Язык" data-en="Language" aria-label="Язык">
  <button type="button" data-lang="ru" class="active" aria-pressed="true">RU</button>
  <button type="button" data-lang="en" aria-pressed="false">EN</button>
</span>
```

```html
<img class="brand-avatar" src="img/avatar.jpg" data-i18n-attr="alt" data-ru="Дмитрий Федоренко" data-en="Dmitry Fedorenko" alt="Дмитрий Федоренко" width="30" height="30" />
<img class="portrait" src="img/portrait.jpg" data-i18n-attr="alt" data-ru="Дмитрий Федоренко с сёрфбордом на пляже" data-en="Dmitry Fedorenko with a surfboard on the beach" alt="Дмитрий Федоренко с сёрфбордом на пляже" width="300" height="440" fetchpriority="high" />
```

- [ ] **Step 4: Replace the locale script with the minimal persistent implementation**

Replace `index.html:421-448` with:

```html
<script id="language-switcher">
(function(){
  var STORAGE_KEY = 'fedrbodr.lang';

  function isSupported(lang){
    return lang === 'ru' || lang === 'en';
  }

  function readSavedLanguage(){
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return isSupported(saved) ? saved : null;
    } catch (_) {
      return null;
    }
  }

  function browserLanguage(){
    var locale = '';
    if (navigator.languages && navigator.languages.length) locale = navigator.languages[0];
    else if (navigator.language) locale = navigator.language;
    if (typeof locale !== 'string') return 'en';
    var parts = locale.replace(/_/g, '-').split('-');
    if (parts[0].toLowerCase() === 'ru') return 'ru';
    var russianRegions = { RU: true, BY: true, KZ: true, KG: true };
    for (var i = 1; i < parts.length; i++) {
      if (/^[a-z]{2}$/i.test(parts[i]) && russianRegions[parts[i].toUpperCase()]) return 'ru';
    }
    return 'en';
  }

  function saveLanguage(lang){
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
  }

  function setLang(lang){
    if (!isSupported(lang)) lang = 'en';
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var value = el.getAttribute('data-' + lang);
      if (value !== null) el.innerHTML = value;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function(el){
      var attr = el.getAttribute('data-i18n-attr');
      var value = el.getAttribute('data-' + lang);
      if (value !== null) el.setAttribute(attr, value);
    });
    document.querySelectorAll('.lang button').forEach(function(button){
      var active = button.getAttribute('data-lang') === lang;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  document.querySelectorAll('.lang button').forEach(function(button){
    button.addEventListener('click', function(){
      var lang = button.getAttribute('data-lang');
      setLang(lang);
      saveLanguage(lang);
    });
  });

  setLang(readSavedLanguage() || browserLanguage());
})();
</script>
```

Do not alter the separate analytics script. Its delegated click handler must continue to emit `lang_switch` only when a visitor clicks a language button.

- [ ] **Step 5: Run automated verification**

Run:

```bash
rtk node --test tests/language-switch.test.mjs
rtk git diff --check
```

Expected: seven passing tests, followed by no whitespace errors.

- [ ] **Step 6: Perform browser smoke checks**

Serve the repository without modifying it:

```bash
rtk python3 -m http.server 4173
```

At `http://127.0.0.1:4173/`, verify:

1. With `fedrbodr.lang` absent and the browser locale set to Russian, Belarusian, Kazakhstani, or Kyrgyzstani, the page opens in Russian.
2. With `fedrbodr.lang` absent and a non-Russian locale, the page opens in English.
3. Clicking RU or EN updates the visible page, title, description/social metadata, image alternatives, `<html lang>`, active pill, and `aria-pressed` values.
4. Reloading preserves the clicked language.
5. At desktop and mobile widths, both language buttons remain visible and translated text does not overflow the header or key content blocks.

Expected: all five checks pass with no console errors.

- [ ] **Step 7: Commit the implementation**

```bash
rtk git add index.html tests/language-switch.test.mjs
rtk git commit -m "feat: remember locale-aware language selection"
```

Expected: the commit contains only `index.html` and `tests/language-switch.test.mjs`; unrelated `.idea/` files remain untracked.
