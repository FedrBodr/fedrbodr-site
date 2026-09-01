import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function script(id) {
  const match = html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)<\\/script>`));
  assert.ok(match, `${id} script must exist`);
  return match[1];
}

class FakeElement {
  constructor(attributes = {}) {
    this.attributes = new Map(Object.entries(attributes));
    this.listeners = {};
    this.textContent = '';
  }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  addEventListener(name, listener) { this.listeners[name] = listener; }
  click() { this.listeners.click(); }
}

function storage(saved, throws = false) {
  const writes = [];
  return {
    writes,
    getItem(key) {
      if (throws) throw new Error('storage blocked');
      assert.equal(key, 'fedrbodr.theme');
      return saved;
    },
    setItem(key, value) {
      if (throws) throw new Error('storage blocked');
      writes.push([key, value]);
    }
  };
}

function load({ saved = null, storageThrows = false } = {}) {
  const documentElement = new FakeElement();
  const button = new FakeElement();
  const icon = new FakeElement();
  button.querySelector = (selector) => selector === 'span' ? icon : null;
  const meta = new FakeElement();
  const localStorage = storage(saved, storageThrows);
  const document = {
    documentElement,
    querySelector(selector) {
      if (selector === '.theme-toggle') return button;
      if (selector === 'meta[name="theme-color"]') return meta;
      return null;
    }
  };

  const context = { document, localStorage };
  vm.runInNewContext(script('theme-bootstrap'), context);
  vm.runInNewContext(script('theme-switcher'), context);
  return { button, documentElement, icon, localStorage, meta };
}

test('theme bootstrap appears before styles and defaults to dark', () => {
  assert.ok(html.indexOf('id="theme-bootstrap"') < html.indexOf('<style>'));
  const page = load();
  assert.equal(page.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(page.button.getAttribute('aria-pressed'), 'true');
  assert.equal(page.meta.getAttribute('content'), '#0a0a0a');
  assert.deepEqual(page.localStorage.writes, []);
});

test('valid saved theme is restored and invalid value falls back to dark', () => {
  assert.equal(load({ saved: 'light' }).documentElement.getAttribute('data-theme'), 'light');
  assert.equal(load({ saved: 'dark' }).documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(load({ saved: 'sepia' }).documentElement.getAttribute('data-theme'), 'dark');
});

test('button toggles theme, button state, browser color, and storage', () => {
  const page = load();
  page.button.click();
  assert.equal(page.documentElement.getAttribute('data-theme'), 'light');
  assert.equal(page.button.getAttribute('aria-pressed'), 'false');
  assert.equal(page.meta.getAttribute('content'), '#f6f6f7');
  assert.deepEqual(page.localStorage.writes, [['fedrbodr.theme', 'light']]);
  page.button.click();
  assert.equal(page.documentElement.getAttribute('data-theme'), 'dark');
  assert.deepEqual(page.localStorage.writes.at(-1), ['fedrbodr.theme', 'dark']);
});

test('blocked storage keeps theme switching functional', () => {
  const page = load({ saved: 'light', storageThrows: true });
  assert.equal(page.documentElement.getAttribute('data-theme'), 'dark');
  assert.doesNotThrow(() => page.button.click());
  assert.equal(page.documentElement.getAttribute('data-theme'), 'light');
});

test('theme toggle has bilingual accessible text', () => {
  const tag = html.match(/<button[^>]*class="theme-toggle"[^>]*>/)?.[0] || '';
  assert.match(tag, /data-i18n-attr="aria-label"/);
  assert.match(tag, /data-ru="Переключить тему"/);
  assert.match(tag, /data-en="Toggle theme"/);
});
