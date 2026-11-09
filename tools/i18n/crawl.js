// Crawl a tool page through its states and collect every English string the browser shows.
// usage: node crawl.js <page> <out.json> [inputs...]
const { chromium } = require('playwright');
const fs = require('fs');
const [, , page, out, ...inputs] = process.argv;
const BASE = 'http://127.0.0.1:8765/';

const COLLECT = () => {
  window.__S = window.__S || new Set();
  const S = window.__S;
  const ATTRS = ['title', 'alt', 'aria-label', 'placeholder'];
  const add = (v) => { v = String(v || '').replace(/\s+/g, ' ').trim(); if (/[A-Za-z]{2}/.test(v) && !S.has(v)) { S.add(v); try { window.__push(v); } catch (e) {} } };
  const walk = (n) => {
    if (n.nodeType === 3) { add(n.nodeValue); return; }
    if (n.nodeType !== 1) return;
    const tag = n.localName;
    if (['script', 'style', 'template', 'svg', 'textarea', 'code', 'header', 'footer'].includes(tag)) return;
    if (n.hasAttribute('data-notr')) return;
    if (n.closest && n.closest('nav.nav, header, footer, .util, #yam-tabs, #yam-slim, #yam-install, details.ftm')) return;
    for (const a of ATTRS) if (n.hasAttribute(a)) add(n.getAttribute(a));
    if (tag === 'input' && /^(button|submit)$/i.test(n.type) && n.value) add(n.value);
    // merge adjacent text nodes like dom() does
    let buf = null;
    for (const c of Array.from(n.childNodes)) {
      if (c.nodeType === 3) { buf = (buf || '') + c.nodeValue; continue; }
      if (buf != null) { add(buf); buf = null; }
      walk(c);
    }
    if (buf != null) add(buf);
  };
  window.__walk = () => { const m = document.querySelector('main'); if (m) walk(m); for (const c of document.body.children) if (!['MAIN', 'HEADER', 'FOOTER', 'NAV', 'SCRIPT'].includes(c.tagName)) walk(c); };
  let tmo = 0; const mo = new MutationObserver(() => { clearTimeout(tmo); tmo = setTimeout(() => { try { window.__walk(); } catch (e) {} }, window.__DELAY || 0); });
  const start = () => { mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true }); window.__walk(); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  window.print = () => {}; if (/^\/(ar|de|es|fr|hi|ja|ko|pt|ru|zh)\//.test(location.pathname)) window.__DELAY = 60;
};

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const GOT = new Set();
  await ctx.exposeFunction('__push', (v) => { if (v.length < 2000) GOT.add(v); });
  await ctx.addInitScript(COLLECT);
  const pg = await ctx.newPage();
  const dialogs = new Set();
  let flip = 0;
  pg.on('dialog', async (d) => { dialogs.add(d.message()); try { (flip++ % 2 ? await d.accept() : await d.dismiss()); } catch (e) {} });
  pg.on('popup', (p) => p.close().catch(() => {}));
  await pg.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await pg.goto(BASE + page, { waitUntil: 'load' });
  await pg.waitForTimeout(1500);
  const scName = page.replace(/^(ar|de|es|fr|hi|ja|ko|pt|ru|zh)\//, '').replace(/\.html$/, ''); // same scenario for every language
  const sc = fs.existsSync(__dirname + '/scen/' + scName + '.js') ? require(__dirname + '/scen/' + scName + '.js') : null;
  const H = {
    pg, inputs, wait: (ms) => pg.waitForTimeout(ms || 300),
    async monkey(rounds = 2, root = 'main') {
      for (let r = 0; r < rounds; r++) {
        // fill text inputs
        const ins = await pg.$$(root + ' input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=button]):not([type=submit]):visible, ' + root + ' textarea:visible');
        for (const i of ins) { try { const t = await i.getAttribute('type'); await i.fill(t === 'number' ? String(10 + r * 7) : (t === 'date' ? '2026-11-09' : (inputs[r % Math.max(1, inputs.length)] || 'Test ' + r))); await i.dispatchEvent('input'); await i.dispatchEvent('change'); } catch (e) {} }
        const cbs = await pg.$$(root + ' input[type=checkbox]:visible, ' + root + ' input[type=radio]:visible');
        for (const c of cbs) { try { await c.click({ timeout: 500 }); } catch (e) {} }
        const sels = await pg.$$(root + ' select:visible');
        for (const s of sels) { try { const n = await s.evaluate((x) => x.options.length); for (let k = 0; k < n; k++) { await s.selectOption({ index: k }); await pg.waitForTimeout(60); } } catch (e) {} }
        const btns = await pg.$$(root + ' button:visible, ' + root + ' [role=tab]:visible, ' + root + ' summary:visible');
        for (const bt of btns) { try { await bt.click({ timeout: 600, noWaitAfter: true }); await pg.waitForTimeout(120); if (!pg.url().includes(page.replace(/\.html$/, ''))) { await pg.goBack(); await pg.waitForTimeout(800); } } catch (e) {} }
      }
    }
  };
  try { if (sc) await sc(H); else await H.monkey(3); } catch (e) { console.error('scenario error', e.message); }
  await pg.waitForTimeout(800);
  let strs = [];
  try { strs = await pg.evaluate(() => { window.__walk(); return Array.from(window.__S); }); } catch (e) { console.error(e.message); }
  const all = Array.from(new Set([...GOT, ...strs, ...dialogs]));
  fs.writeFileSync(out, JSON.stringify(all, null, 1));
  console.log(page, all.length, 'strings');
  await b.close();
})();
