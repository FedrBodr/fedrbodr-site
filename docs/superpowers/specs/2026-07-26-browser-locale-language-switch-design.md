# Browser locale and language switch design

## Goal

Serve the existing one-page site in Russian or English. On a visitor's first
visit, choose the language from the browser locale. After the visitor uses the
RU/EN switch, remember that explicit choice for later visits.

## Language selection

The initial language is resolved in this order:

1. A valid saved choice (`ru` or `en`) from `localStorage`.
2. The browser's preferred languages. Any locale whose primary language is
   `ru` selects Russian; every other locale selects English.
3. English if browser locale information is missing or unusable.

Only a click on the language switch is persisted. Automatic locale detection
must not write to storage. Invalid stored values are ignored.

If storage access throws or is unavailable, language detection and switching
still work for the current page; only persistence is lost.

## Page updates

Keep the current single-file architecture and the existing `data-ru` and
`data-en` translations. Applying a language updates:

- all visible elements marked with `data-i18n`;
- translated attributes marked with `data-i18n-attr`;
- the document `<html lang>` value;
- the active state and `aria-pressed` state of the RU/EN buttons;
- the document title, description, Open Graph, and Twitter text metadata;
- translatable image alternative text and accessible labels.

The page continues to render Russian HTML before JavaScript runs. Once the
script executes, it applies the resolved language. No new routes, query
parameters, or duplicated HTML pages are introduced.

## Interaction and analytics

The existing pill-shaped RU/EN switch remains in the header on desktop and
mobile. Selecting the already active language is harmless and keeps the saved
choice valid.

The existing `lang_switch` analytics event remains tied to user clicks. Locale
detection during page load must not emit a language-switch event.

## Verification

Automated checks will cover:

- saved `ru` and `en` choices overriding browser locale;
- Russian browser locales selecting Russian when nothing is saved;
- non-Russian, missing, or malformed locale data selecting English;
- a manual switch updating content, metadata, `<html lang>`, button state, and
  storage;
- unavailable storage degrading without breaking language selection;
- every translatable element providing both Russian and English values.

Manual verification will check the switch at desktop and mobile widths and
confirm that translated text does not break the header or key content blocks.
