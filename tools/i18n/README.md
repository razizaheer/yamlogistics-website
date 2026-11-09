# Translation tools (not part of the site)

`functions/_middleware.js` answers 404 for `/tools/*`, so nothing here is served.

These scripts make the translated pages `<lang>/<page>.html` and grow the dictionaries `i18n/<lang>.js`.
Languages: ar, de, es, fr, hi, ja, ko, pt, ru, zh.

## Setup

```bash
cd tools/i18n && npm install            # linkedom; Playwright/Chromium must already be installed
python3 -m http.server 8765 --bind 127.0.0.1   # run in the repo root, keep it running
```

## Steps for a new page (example: two tool pages)

1. **Crawl** the English page through its states and record every string shown (also alerts, confirms, toasts):
   `node crawl.js hsn-code-finder.html crawl/hsn-code-finder.json "mobile phone" 8517`
   A file in `scen/<page>.js` drives the page (searches, buttons, adding items). Without one, it clicks and fills everything in `<main>`.
   Text inside an element marked `data-notr` is skipped (use it for official tariff, HS and notification text, which stays English).
2. **Prep**: `node prep.js stepN.json page1 page2`. It adds the static page text, turns numbers, dates and carrier names into
   `{0}` placeholders and lists, per language, what the dictionary does not cover yet.
3. **Jobs**: `node mkjobs.js stepN.json sN extraN.json` writes `tr/sN-in-<lang>.json` and a glossary `tr/gloss-<lang>.json`
   (tool names from `menus/ftm-<lang>.txt`, so terms stay the same as in the menu).
4. **Translate** each `tr/sN-in-<lang>.json` into `tr/sN-out-<lang>.json` (object English → translation) and check it with
   `node validate.js sN <lang>` (all keys present, same `{n}` placeholders).
5. **Merge**: `node merge.js sN page1,page2` adds new keys to `i18n/<lang>.js` (existing keys are never overwritten,
   unchanged names and codes are skipped) and adds the pages to `window.YAM_PAGES`.
6. **Build**: `BUILDING=<lang>/<page>,... node build.js all page1 page2` writes `<lang>/<page>.html`: `<base href="../">`,
   `lang` (and `dir="rtl"` for ar), canonical, og tags, hreflang, the language menu, translated static text and links, the
   "English version prevails" line under a `#disclaimer` section, and the runtime scripts before the first tool script.
7. **Relink**: `I18V=3 node relink.js page1 page2` points the other translated pages, the Free Tools menus
   (`menus/ftm-<lang>.txt`), the English page (language menu and hreflang) and `sitemap.xml` to the new pages, and sets the
   dictionary version on every translated page. Then add the pages to `COMMON` in `functions/_middleware.js`.
8. **Check**: crawl the translated pages (`runcheck.sh`) and `node leftover.js <lang> page...` lists text still in English.
   `node partial.js stepN.json partialN.json` finds strings that only half-translate because a broader `{0}` pattern
   matched them; give those their own keys.
9. **Screenshots**: `node shots.js`.

## What is translated at runtime

`i18n/tr-core.js` + `i18n/<lang>.js`, started with `YAM_TR_OBSERVE(document.querySelector('main'))`. It translates `<main>`
as the tools change it, and also elements the tools add straight to `<body>` (toasts, the disclaimer block) and the text of
`alert()` / `confirm()`. App chrome (bottom tabs, install bar, rating prompt) has its own table in `app/pwa.js`.

PDFs made by the tools stay in English (trade documents).

## Files

- `crawl/` English crawl results per page, `stepN*.json` prep output, `extraN.json` strings added by hand
  (dialogs and messages the crawl cannot reach), `partialN.json` half-translated strings found after step N.
- `tr/` translation jobs, outputs and glossaries. `fix1.js` removed two over-broad keys after step 1.
- `screenshots/` checks of the translated pages.
