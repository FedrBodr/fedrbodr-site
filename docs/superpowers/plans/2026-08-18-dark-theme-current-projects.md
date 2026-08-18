# Dark Theme and Current Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the static FedrBodr site dark by default, add a persistent light/dark switch, and replace the project grid with agreed «В работе» and «Запущено» groups.

**Architecture:** Keep the current single-file static architecture. Add a tiny synchronous theme bootstrap in `<head>` to prevent a light flash, a separate footer controller for the switch, semantic CSS variables for both palettes, and source-level Node tests matching the existing test style. Project content remains static bilingual HTML so it works without JavaScript.

**Tech Stack:** HTML5, CSS custom properties, browser JavaScript (ES5-compatible style used by the page), Node.js built-in `node:test`, `assert`, and `vm`.

## Global Constraints

- The first visit always uses the dark theme; do not follow `prefers-color-scheme`.
- Store only explicit `dark` or `light` values under `fedrbodr.theme`; blocked or invalid storage falls back to dark.
- Dark palette base values: `#0b1110`, `#121c19`, `#f2f4ee`, `#80d1ae`, `#f2b84b`, and `#294037`.
- Light palette base values: `#f4f7f5`, `#ffffff`, `#13201b`, `#5e6e66`, `#287a59`, `#9a6500`, and `#d7e1dc`.
- Keep the site dependency-free and preserve the current single `index.html` architecture.
- Every new visible or accessible string must have natural Russian and English versions using the existing `data-ru` / `data-en` convention.
- KSY Store is the first current project and uses the exclusive «Заказная разработка» / “Custom development” badge.
- Do not add links for projects that do not have agreed public URLs.
- Keep Vezdepost and «Русский Лайнап» links and existing analytics behavior intact.
- At content widths below 680 px, project grids use one column and never produce horizontal scrolling.
- Do not stage or commit `.idea/`, `.tmp/`, or `.superpowers/` artifacts.

## File Map

- Modify `index.html`: add theme bootstrap/controller, switch markup, palette variables, updated project markup, and responsive project styles.
- Create `tests/theme-switch.test.mjs`: execute the theme scripts against browser fakes and verify default, persistence, invalid storage, blocked storage, button state, and early bootstrap placement.
- Create `tests/projects-content.test.mjs`: verify project grouping, order, bilingual copy, badge semantics, launched links, and removal of the placeholder card.
- Modify `.gitignore`: ignore `.superpowers/` visual-brainstorm artifacts created during design.

---

### Task 1: Persistent dark-by-default theme

**Files:**
- Modify: `.gitignore`
- Modify: `index.html:27-216`
- Modify: `index.html:220-235`
- Modify: `index.html:421-485`
- Create: `tests/theme-switch.test.mjs`

**Interfaces:**
- Consumes: existing `data-i18n-attr` translation behavior and the header `.nav-links` layout.
- Produces: root attribute `data-theme="dark|light"`, storage key `fedrbodr.theme`, button `.theme-toggle`, `<script id="theme-bootstrap">`, and `<script id="theme-switcher">`.

- [ ] **Step 1: Write the failing theme behavior test**

Create `tests/theme-switch.test.mjs` with the following complete test harness:

```js
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
  assert.equal(page.meta.getAttribute('content'), '#0b1110');
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
  assert.equal(page.meta.getAttribute('content'), '#f4f7f5');
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
```

- [ ] **Step 2: Run the test and verify the missing feature fails**

Run:

```bash
rtk node --test tests/theme-switch.test.mjs
```

Expected: FAIL with `theme-bootstrap script must exist`.

- [ ] **Step 3: Add the synchronous theme bootstrap and accessible switch**

In `index.html`, replace the existing theme-color meta with this meta and immediately following bootstrap, before font links and `<style>`:

```html
<meta name="theme-color" content="#0b1110" />
<script id="theme-bootstrap">
(function(){
  var STORAGE_KEY = 'fedrbodr.theme';
  var theme = 'dark';
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') theme = saved;
  } catch (_) {}
  document.documentElement.setAttribute('data-theme', theme);
})();
</script>
```

Place this button before `.lang-wrap` in the header. The text icon denotes the theme that pressing the button will activate:

```html
<button type="button" class="theme-toggle" data-i18n-attr="aria-label" data-ru="Переключить тему" data-en="Toggle theme" aria-label="Переключить тему" aria-pressed="true"><span aria-hidden="true">☀</span></button>
```

Add this controller immediately before `language-switcher`:

```html
<script id="theme-switcher">
(function(){
  var STORAGE_KEY = 'fedrbodr.theme';
  var button = document.querySelector('.theme-toggle');
  var themeColor = document.querySelector('meta[name="theme-color"]');

  function currentTheme(){
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function render(){
    var dark = currentTheme() === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.querySelector('span').textContent = dark ? '☀' : '☾';
    themeColor.setAttribute('content', dark ? '#0b1110' : '#f4f7f5');
  }

  button.addEventListener('click', function(){
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (_) {}
    render();
  });

  render();
})();
</script>
```

- [ ] **Step 4: Replace the palette with semantic dark and light variables**

Replace the current `:root` color block and introduce a light override:

```css
:root{
  color-scheme:dark;
  --blue:#80d1ae;
  --sky:#9dd6bb;
  --red:#f2b84b;
  --ink:#f2f4ee;
  --muted:#9fb0a9;
  --bg:#0b1110;
  --card:#121c19;
  --line:#294037;
  --header:rgba(11,17,16,.88);
  --soft:#18241f;
  --soft-2:#101714;
  --on-accent:#08110d;
  --accent-shadow:rgba(128,209,174,.22);
  --special-shadow:rgba(242,184,75,.22);
  --radius:18px;
  --maxw:960px;
}
:root[data-theme="light"]{
  color-scheme:light;
  --blue:#287a59;
  --sky:#3f8065;
  --red:#9a6500;
  --ink:#13201b;
  --muted:#5e6e66;
  --bg:#f4f7f5;
  --card:#ffffff;
  --line:#d7e1dc;
  --header:rgba(244,247,245,.9);
  --soft:#e8f0ec;
  --soft-2:#edf3f0;
  --on-accent:#ffffff;
  --accent-shadow:rgba(40,122,89,.18);
  --special-shadow:rgba(154,101,0,.18);
}
```

Make the existing hard-coded surfaces theme-aware with these exact replacements:

```css
header{background:var(--header)}
.portrait{box-shadow:0 24px 60px var(--accent-shadow)}
.portrait-tag{box-shadow:0 4px 14px rgba(0,0,0,.18)}
.btn-primary{background:var(--red);color:var(--on-accent);box-shadow:0 6px 18px var(--special-shadow)}
.chip{color:var(--blue);background:var(--soft);border-color:var(--line)}
.contact-box{background:linear-gradient(135deg,#1f644b,#174633)}
.order{background:linear-gradient(180deg,var(--bg),var(--soft-2))}
```

Add switch styling and preserve a compact mobile header:

```css
.theme-toggle{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border:1px solid var(--line);border-radius:50%;background:var(--card);color:var(--ink);font-size:16px;cursor:pointer}
@media(max-width:820px){
  .nav-links{gap:10px}
  .nav-links a:not(.lang-wrap){display:none}
}
```

Change accent foreground declarations that currently hard-code white (`.lang button.active`, `.step-n`) to `color:var(--on-accent)`. Keep truly white text inside the dark green contact banner unchanged.

- [ ] **Step 5: Ignore design-session artifacts and run theme tests**

Append this block to `.gitignore`:

```gitignore

# Локальные макеты visual companion
.superpowers/
```

Run:

```bash
rtk node --test tests/theme-switch.test.mjs tests/language-switch.test.mjs
```

Expected: all theme and language tests PASS.

- [ ] **Step 6: Commit the theme deliverable**

```bash
rtk git add .gitignore index.html tests/theme-switch.test.mjs
rtk git commit -m "feat: add persistent dark theme"
```

Expected: commit succeeds. Because this repository has a production `post-commit` deploy hook, the executing agent must tell the user before running the commit or invoke Git with a task-approved hooks override when production deployment is not authorized.

---

### Task 2: Current and launched project groups

**Files:**
- Modify: `index.html:177-186`
- Modify: `index.html:365-391`
- Create: `tests/projects-content.test.mjs`

**Interfaces:**
- Consumes: semantic theme variables from Task 1 and existing project analytics for real `<a href>` links.
- Produces: `[data-project-group="working"]`, `[data-project-group="launched"]`, five ordered `[data-project]` current cards, `.project-badge`, and `.client-work`.

- [ ] **Step 1: Write failing project structure and localization tests**

Create `tests/projects-content.test.mjs`:

```js
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
  const expected = ['ksy-store', 'gopro-wifi-viewer', 'imvu-profit', 'arbiterra', 'lead-intelligence'];
  const actual = [...html.matchAll(/data-project="([^"]+)"/g)].map((match) => match[1]).slice(0, 5);
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
    'Набор продуктов для американских IMVU-креаторов',
    'наследие одного из первых моих проектов, Deepforks',
    'Поиск компаний и ЛПР по открытым данным'
  ];
  for (const text of required) assert.ok(html.includes(text), `missing Russian copy: ${text}`);
  for (const card of html.matchAll(/<article class="proj-card[^>]*data-project="[^"]+">([\s\S]*?)<\/article>/g)) {
    assert.match(card[1], /data-ru=/);
    assert.match(card[1], /data-en=/);
  }
});

test('launched group keeps both existing products and links', () => {
  const launched = section('launched');
  assert.match(launched, />Vezdepost</);
  assert.match(launched, />Русский Лайнап</);
  assert.match(launched, /https:\/\/vezdepost\.ru/);
  assert.match(launched, /https:\/\/github\.com\/FedrBodr\/vezdepost/);
  assert.match(launched, /https:\/\/russianlineup\.ru/);
});

test('placeholder project is removed', () => {
  assert.doesNotMatch(html, /data-ru="Следующий проект"/);
  assert.doesNotMatch(html, /class="proj-card dashed"/);
});
```

- [ ] **Step 2: Run the test and verify the new groups are missing**

Run:

```bash
rtk node --test tests/projects-content.test.mjs
```

Expected: FAIL with `working project group must exist` or an empty project-order assertion.

- [ ] **Step 3: Replace the project markup with the agreed bilingual content**

Replace the contents of `<section id="projects">` with this structure:

```html
<div class="wrap">
  <p class="eyebrow" data-i18n data-ru="Проекты" data-en="Projects">Проекты</p>
  <h2 data-i18n data-ru="Что я строю" data-en="What I'm building">Что я строю</h2>

  <div class="project-group" data-project-group="working">
    <div class="project-group-head">
      <h3 data-i18n data-ru="В работе" data-en="In progress">В работе</h3>
      <span data-i18n data-ru="5 проектов · сейчас" data-en="5 projects · now">5 проектов · сейчас</span>
    </div>
    <div class="proj proj-working">
      <article class="proj-card client-work" data-project="ksy-store">
        <span class="project-badge" data-i18n data-ru="Заказная разработка" data-en="Custom development">Заказная разработка</span>
        <h3>KSY Store</h3>
        <p data-i18n data-ru="Клиентский сервис моей студии: находит скидки PlayStation Store и автоматически публикует подборки в Telegram." data-en="A client service from my studio: finds PlayStation Store discounts and automatically publishes curated deals to Telegram.">Клиентский сервис моей студии: находит скидки PlayStation Store и автоматически публикует подборки в Telegram.</p>
      </article>
      <article class="proj-card" data-project="gopro-wifi-viewer">
        <span class="project-badge" data-i18n data-ru="В работе" data-en="In progress">В работе</span>
        <h3>GoProWifiViewer</h3>
        <p data-i18n data-ru="Редизайн приложения для просмотра и управления GoPro по Wi‑Fi." data-en="Redesigning an app for viewing and controlling a GoPro over Wi-Fi.">Редизайн приложения для просмотра и управления GoPro по Wi‑Fi.</p>
      </article>
      <article class="proj-card" data-project="imvu-profit">
        <span class="project-badge" data-i18n data-ru="В работе" data-en="In progress">В работе</span>
        <h3>ImvuProfit и ко</h3>
        <p data-i18n data-ru="Набор продуктов для американских IMVU-креаторов: инструменты роста и монетизации." data-en="A suite of products for US-based IMVU creators: tools for growth and monetization.">Набор продуктов для американских IMVU-креаторов: инструменты роста и монетизации.</p>
      </article>
      <article class="proj-card" data-project="arbiterra">
        <span class="project-badge" data-i18n data-ru="В работе" data-en="In progress">В работе</span>
        <h3>Arbiterra</h3>
        <p data-i18n data-ru="Обновляю криптовалютного торгового бота — наследие одного из первых моих проектов, Deepforks." data-en="Updating a crypto trading bot — a legacy of Deepforks, one of my earliest projects.">Обновляю криптовалютного торгового бота — наследие одного из первых моих проектов, Deepforks.</p>
      </article>
      <article class="proj-card" data-project="lead-intelligence">
        <span class="project-badge" data-i18n data-ru="В работе" data-en="In progress">В работе</span>
        <h3>Lead Intelligence</h3>
        <p data-i18n data-ru="Поиск компаний и ЛПР по открытым данным с персональными обращениями через LinkedIn." data-en="Finding companies and decision-makers from public data, with personalized outreach via LinkedIn.">Поиск компаний и ЛПР по открытым данным с персональными обращениями через LinkedIn.</p>
      </article>
    </div>
  </div>

  <div class="project-group" data-project-group="launched">
    <div class="project-group-head">
      <h3 data-i18n data-ru="Запущено" data-en="Launched">Запущено</h3>
      <span data-i18n data-ru="2 продукта · в проде" data-en="2 products · live">2 продукта · в проде</span>
    </div>
    <div class="proj proj-launched">
      <article class="proj-card">
        <h3>Vezdepost</h3>
        <p data-i18n data-ru="Open-source планировщик публикаций: один пост — сразу в Telegram, MAX, VK, X и ещё 30+ платформ, по расписанию, с календарём и аналитикой. AI-developed форк Postiz, развиваю с помощью Claude Code: русский интерфейс, российские платформы, хостинг в РФ. Облако сейчас бесплатно, self-host — бесплатен всегда." data-en="An open-source post scheduler: one post goes to Telegram, MAX, VK, X and 30+ more platforms — scheduled, with a calendar and analytics. An AI-developed Postiz fork I grow with Claude Code: Russian UI, Russian platforms, hosting in Russia. Cloud is free for now, self-host is free forever.">Open-source планировщик публикаций: один пост — сразу в Telegram, MAX, VK, X и ещё 30+ платформ, по расписанию, с календарём и аналитикой. AI-developed форк Postiz, развиваю с помощью Claude Code: русский интерфейс, российские платформы, хостинг в РФ. Облако сейчас бесплатно, self-host — бесплатен всегда.</p>
        <div class="links">
          <a href="https://vezdepost.ru" target="_blank" rel="noopener">vezdepost.ru →</a>
          <a href="https://github.com/FedrBodr/vezdepost" target="_blank" rel="noopener">GitHub →</a>
        </div>
      </article>
      <article class="proj-card">
        <h3>Русский Лайнап</h3>
        <p data-i18n data-ru="Электросёрф-бренд — проект для души. Собираю с нуля как хобби: продукт, магазин, комьюнити." data-en="An electric-surf brand — my passion project. Building it from scratch as a hobby: product, shop, community.">Электросёрф-бренд — проект для души. Собираю с нуля как хобби: продукт, магазин, комьюнити.</p>
        <a href="https://russianlineup.ru" target="_blank" rel="noopener" data-i18n data-ru="russianlineup.ru →" data-en="russianlineup.ru →">russianlineup.ru →</a>
      </article>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Add group, badge, two-column, and mobile styles**

Replace the current Projects CSS block with:

```css
/* Projects */
.project-group{margin-top:34px}
.project-group+.project-group{margin-top:46px}
.project-group-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:14px}
.project-group-head h3{font-family:"Unbounded","Golos Text",sans-serif;font-size:22px;line-height:1.2}
.project-group-head span{font-family:"JetBrains Mono",monospace;color:var(--blue);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.11em;text-align:right}
.proj{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.proj-card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:22px;position:relative;overflow:hidden;min-width:0}
.proj-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--blue)}
.proj-card.client-work{border-color:var(--red);box-shadow:0 10px 30px var(--special-shadow)}
.proj-card.client-work::before{background:var(--red)}
.project-badge{display:inline-block;margin:0 0 14px;font-family:"JetBrains Mono",monospace;font-size:10px;font-weight:700;line-height:1;text-transform:uppercase;letter-spacing:.08em;color:var(--blue)}
.client-work .project-badge{color:var(--red)}
.proj-card h3{font-size:19px;margin-bottom:7px;padding-right:4px}
.proj-card p{color:var(--muted);font-size:14px;margin-bottom:12px}
.proj-card p:last-child{margin-bottom:0}
.proj-card a{font-weight:700;color:var(--blue);font-size:14px}
.proj-card .links{display:flex;flex-wrap:wrap;gap:16px}
.proj-launched .proj-card{background:var(--soft-2)}
@media(max-width:679px){
  .project-group-head{align-items:flex-start}
  .project-group-head h3{font-size:20px}
  .proj{grid-template-columns:1fr}
}
```

- [ ] **Step 5: Run content, localization, and theme tests**

Run:

```bash
rtk node --test tests/projects-content.test.mjs tests/language-switch.test.mjs tests/theme-switch.test.mjs
```

Expected: all tests PASS. If the existing localization test flags a new translated line, put `data-ru` and `data-en` on that same line because the current test intentionally validates line-level markup.

- [ ] **Step 6: Commit the project-section deliverable**

```bash
rtk git add index.html tests/projects-content.test.mjs
rtk git commit -m "feat: show current and launched projects"
```

Expected: commit succeeds under the same deployment-hook rule from Task 1.

---

### Task 3: Integrated visual and accessibility verification

**Files:**
- Modify if verification finds a defect: `index.html`
- Modify if a regression needs coverage: `tests/theme-switch.test.mjs`
- Modify if a regression needs coverage: `tests/projects-content.test.mjs`

**Interfaces:**
- Consumes: complete page from Tasks 1–2.
- Produces: verified desktop/mobile rendering and a clean final test run; no new public interface.

- [ ] **Step 1: Run the complete automated suite**

```bash
rtk node --test tests/*.test.mjs
rtk git diff --check
```

Expected: every Node test PASS and `git diff --check` prints no errors.

- [ ] **Step 2: Start a local static server**

```bash
rtk python3 -m http.server 8765
```

Expected: `Serving HTTP on ... port 8765`. Keep this process running only for the visual checks.

- [ ] **Step 3: Verify the desktop dark and light states**

Open `http://localhost:8765/` at a viewport near 1440×900 and verify all of the following:

- dark graphite/green theme appears before interaction and without a light flash;
- the header, hero, order section, cards, footer, and contact section use the same palette system;
- clicking the theme button changes every surface to the light palette, changes the icon and browser theme color, and keeps readable contrast;
- refreshing preserves the chosen theme;
- KSY Store is the first current card with the yellow «Заказная разработка» badge;
- the remaining four current cards and both launched cards appear in the agreed order and groups;
- Vezdepost, GitHub, and Russian Lineup links retain their original targets.

- [ ] **Step 4: Verify responsive layout and keyboard behavior**

At viewport widths 390 px and 679 px, verify:

- the page has no horizontal scrollbar;
- project cards are one column;
- the theme and RU/EN controls remain visible and do not overlap;
- Tab reaches the theme button and both language buttons with a visible focus ring;
- Enter or Space toggles the theme button;
- switching RU/EN updates group names, badges, descriptions, counts, and the theme button accessible label.

- [ ] **Step 5: Turn each visual defect into a regression check before fixing it**

If verification finds a defect, first add the smallest failing assertion to the relevant existing test. For example, a missing mobile breakpoint becomes:

```js
test('project grid collapses below 680px', () => {
  assert.match(html, /@media\(max-width:679px\)[\s\S]*?\.proj\{grid-template-columns:1fr\}/);
});
```

Run that single file to observe FAIL, make the minimal `index.html` correction, then rerun it to observe PASS. Do not change copy or scope during visual polish.

- [ ] **Step 6: Run final verification and commit only verified fixes**

```bash
rtk node --test tests/*.test.mjs
rtk git diff --check
rtk git status --short
```

Expected: all tests PASS, whitespace check is clean, and status contains only intentional task files plus pre-existing user files. If Step 5 produced fixes, commit only those files:

```bash
rtk git add index.html tests/theme-switch.test.mjs tests/projects-content.test.mjs
rtk git commit -m "fix: polish theme and project layout"
```

If no fixes were needed, do not create an empty commit.
