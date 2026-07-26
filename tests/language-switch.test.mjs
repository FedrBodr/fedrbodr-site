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
