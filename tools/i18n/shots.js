const { chromium } = require('playwright');
const OUT = __dirname + '/screenshots/';
require('fs').mkdirSync(OUT, { recursive: true });
const B = 'http://127.0.0.1:8765/';
(async () => {
  const b = await chromium.launch();
  const shot = async (name, url, fn, mobile) => {
    const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
    const pg = await ctx.newPage(); pg.on('dialog', (d) => d.dismiss());
    await pg.goto(B + url, { waitUntil: 'load' }); await pg.waitForTimeout(1500);
    if (fn) await fn(pg);
    await pg.waitForTimeout(800);
    await pg.screenshot({ path: OUT + name + '.png' });
    await ctx.close();
    console.log(name);
  };
  const toMain = async (pg, sel) => { await pg.evaluate((s) => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: 'start' }); }, sel); };
  await shot('es-hsn-results', 'es/hsn-code-finder.html', async (pg) => { await pg.check('main input[type=checkbox]').catch(() => {}); await pg.fill('#hf-q', 'cotton t-shirt'); await pg.dispatchEvent('#hf-q', 'input'); await pg.waitForTimeout(1200); await toMain(pg, '#hf-res'); });
  await shot('ar-track-result', 'ar/track-shipment.html', async (pg) => { await pg.fill('#tk-q', 'MSKU1234565'); await pg.click('#tk-go'); await pg.waitForTimeout(800); await toMain(pg, '#trk-root'); });
  await shot('zh-landed-cost', 'zh/landed-cost-calculator.html', async (pg) => { await toMain(pg, '#lc-wrap'); });
  await shot('ja-bl-draft', 'ja/bl-awb-draft.html', async (pg) => { await toMain(pg, '#bd-root'); });
  await shot('hi-invoice-maker', 'hi/document-generator.html', async (pg) => { await toMain(pg, '#dg-root'); });
  await shot('ru-my-shipments', 'ru/my-shipments.html', async (pg) => { await pg.fill('#ms-n', 'MSKU1234565'); await pg.fill('#ms-l', 'PO 4521'); await pg.click('#ms-add'); await pg.waitForTimeout(800); await toMain(pg, '#ms-list'); });
  await shot('ko-app-mode-hsn', 'ko/hsn-code-finder.html?source=app', null, true);
  await shot('de-app-mode-track', 'de/track-shipment.html?source=app', async (pg) => { await pg.fill('#tk-q', '176-12345675'); await pg.click('#tk-go'); await pg.waitForTimeout(800); }, true);
  await b.close();
})();
