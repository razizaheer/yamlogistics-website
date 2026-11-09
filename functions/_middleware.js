// Cloudflare Pages middleware.
// 1) Opens the site in Portuguese for visitors in Brazil and in Spanish for visitors in Spanish-speaking Latin America,
//    on pages that have a translation. A language picked from the menu (cookie yam_lang) always wins, and
//    search-engine crawlers are never redirected.
// 2) Adds the app tags (manifest, home-screen icon, offline service worker) to every HTML page, so the site
//    can be installed as the YAM Logistics app.
const PT = new Set(['BR']);
const ES = new Set(['AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'UY', 'VE']);
const COMMON = ['index', 'container-load-planner', 'cbm-calculator', 'contact', 'about', 'customs-brokerage', 'ocean-freight', 'air-freight', 'mobile-phone-exports', 'third-country-trade', 'india-logistics-partner', 'india-latin-america-trade', 'latin-america'];
const PAGES = { es: new Set(COMMON), pt: new Set(COMMON) };
const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|linkedin|preview|lighthouse|headless/i;
const APP_TAGS = '<link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/app/icon-180.png"><script src="/app/pwa.js?v=4" defer></script>';

// WhatsApp: every chat button opens the business short link (until the @CARGOKIT username is live).
const WA_LINK = 'https://wa.me/message/6YB7I76DV6UJL1';
const waFix = {
  element(el) { if (/wa\.me\/(YAMLOGISTICS|CARGOKIT)/i.test(el.getAttribute('href') || '')) el.setAttribute('href', WA_LINK); },
  text(t) { if (/WhatsApp @YAMLOGISTICS/.test(t.text)) t.replace(t.text.replace(/WhatsApp @YAMLOGISTICS/g, 'WhatsApp @CARGOKIT')); }
};

// Free Tools menu: one file per language (/menus/ftm-<lang>.txt) is put into every page here, so a menu
// change never needs all 780 pages re-uploaded. If the file can't be read, the page keeps its own menu.
const MENU_LANGS = /^\/(ar|de|es|fr|hi|ja|ko|pt|ru|zh)\//;
const menuCache = new Map();
async function menuFor(ctx, url) {
  const lg = (url.pathname.match(MENU_LANGS) || [])[1] || 'en';
  const hit = menuCache.get(lg);
  if (hit && Date.now() - hit.t < 300000) return hit.html;
  try {
    const r = await ctx.env.ASSETS.fetch(new Request(new URL('/menus/ftm-' + lg + '.txt', url)));
    const html = r.ok ? await r.text() : '';
    const ok = html.includes('class="ft-c"') ? html : '';
    menuCache.set(lg, { html: ok, t: Date.now() });
    return ok;
  } catch (e) {
    return '';
  }
}

// Top bar: the Import Duty Calculator button is gone (it is in the Free Tools menu); a My Shipments button
// sits next to Track Shipment instead.
const MYSHIP = { en: 'My Shipments', es: 'Mis envíos', pt: 'Meus embarques', fr: 'Mes envois', de: 'Meine Sendungen', ar: 'شحناتي', hi: 'मेरे शिपमेंट', ja: 'マイ貨物', ko: '내 화물', ru: 'Мои отправки', zh: '我的货物' };
function topBar(url) {
  const lg = (url.pathname.match(MENU_LANGS) || [])[1] || 'en';
  let done = false;
  return [
    ['.links > a.nb4', { element(el) { el.remove(); } }],
    ['.links > a.btn-o', { element(el) { if (done) return; done = true; el.after('<a href="/my-shipments.html" class="btn-o">★ ' + MYSHIP[lg] + '</a>', { html: true }); } }]
  ];
}

async function withAppTags(ctx) {
  const res = await ctx.next();
  try {
    const ct = res.headers.get('Content-Type') || '';
    if (!ct.includes('text/html') || typeof HTMLRewriter === 'undefined') return res;
    const menu = await menuFor(ctx, new URL(ctx.request.url));
    const lg = (new URL(ctx.request.url).pathname.match(/^\/(es|pt)\//) || [])[1] || 'en';
    const desk = { en: ['latin-america.html', 'Latin America Desk · Rio'], es: ['es/latin-america.html', 'Oficina América Latina · Río'], pt: ['pt/latin-america.html', 'Escritório América Latina · Rio'] }[lg];
    let added = false;
    const rw = new HTMLRewriter().on('head', { element(el) { el.append(APP_TAGS, { html: true }); } }).on('a[href*="wa.me/"]', waFix)
      // footer: a link to the Latin America desk right after "India–Latin America Corridor"
      .on('footer a[href*="india-latin-america-trade"]', { element(el) { if (added) return; added = true; el.after('<a href="/' + desk[0].replace(/\.html$/, '') + '">' + desk[1] + '</a>', { html: true }); } })
      .on('details.ftm', { element(el) { if (menu) el.setInnerContent(menu, { html: true }); } });
    for (const [sel, h] of topBar(new URL(ctx.request.url))) rw.on(sel, h);
    return rw.transform(res);
  } catch (e) {
    return res;
  }
}

// 3) CargoKit domains: cargokit.app, cargokit.in and every www. version send people to https://cargokit.ai,
//    and the home page of cargokit.ai shows the free tools page (the address bar stays cargokit.ai).
const CK_MAIN = 'cargokit.ai';
const CK_HOST = /^(www\.)?cargokit\.(ai|app|in)$/i;

async function cargoKitHome(ctx, url) {
  const res = await ctx.env.ASSETS.fetch(new Request(new URL('/free-tools', url), ctx.request));
  const out = new Response(res.body, res);
  out.headers.set('Cache-Control', 'public, max-age=300');
  try {
    if (typeof HTMLRewriter === 'undefined') return out;
    const menu = await menuFor(ctx, url), tb = topBar(url);
    return new HTMLRewriter().on('head', { element(el) { el.append(APP_TAGS, { html: true }); } })
      .on('details.ftm', { element(el) { if (menu) el.setInnerContent(menu, { html: true }); } })
      .on(tb[0][0], tb[0][1]).on(tb[1][0], tb[1][1]).transform(out);
  } catch (e) {
    return out;
  }
}

// 4) Live site: yamlogistics.com goes to https://www.yamlogistics.com (the address Google lists), and the
//    Cloudflare test address (*.pages.dev) is kept out of search engines so it never competes with it.
export async function onRequest(ctx) {
  const res = await route(ctx);
  const host = new URL(ctx.request.url).hostname.toLowerCase();
  if (!host.endsWith('.pages.dev')) return res;
  try {
    const out = new Response(res.body, res);
    out.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return out;
  } catch (e) {
    return res;
  }
}

async function route(ctx) {
  const { request } = ctx;
  const url = new URL(request.url), p = url.pathname;
  const host = url.hostname.toLowerCase();
  // Never serve a page over plain http: send every http request to the secure address.
  if (url.protocol === 'http:' && !/^(localhost|127\.0\.0\.1)$/.test(host)) {
    const h = host === 'yamlogistics.com' ? 'www.yamlogistics.com' : host;
    return new Response(null, { status: 301, headers: { Location: 'https://' + h + p + url.search } });
  }
  if (host === 'yamlogistics.com') return new Response(null, { status: 301, headers: { Location: 'https://www.yamlogistics.com' + p + url.search } });
  if (CK_HOST.test(host)) {
    if (host !== CK_MAIN) return new Response(null, { status: 301, headers: { Location: 'https://' + CK_MAIN + p + url.search } });
    if (request.method === 'GET' && (p === '/' || p === '/index' || p === '/index.html')) return cargoKitHome(ctx, url);
  }
  if (request.method !== 'GET') return ctx.next();
  if (/^\/(api|vendor|i18n|_fonts|samples|notices|labels|containers|fta|app)(\/|$)/.test(p) || /\.(?!html$)[a-z0-9]{2,12}$/i.test(p)) return ctx.next();
  // translated pages and tracking pages: no redirect, just the app tags
  if (/^\/(ar|de|es|fr|hi|ja|ko|pt|ru|zh|tracking)(\/|$)/.test(p)) return withAppTags(ctx);
  const ck = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)yam_lang=([a-z]{2})/);
  let lang = ck ? ck[1] : null;
  if (!lang) {
    if (BOT.test(request.headers.get('User-Agent') || '')) return withAppTags(ctx);
    const c = request.cf && request.cf.country;
    lang = PT.has(c) ? 'pt' : ES.has(c) ? 'es' : null;
  }
  if (lang !== 'es' && lang !== 'pt') return withAppTags(ctx);
  const page = p.replace(/^\/+/, '').replace(/\.html$/, '') || 'index';
  if (!PAGES[lang].has(page)) return withAppTags(ctx);
  return new Response(null, { status: 302, headers: { Location: '/' + lang + '/' + (page === 'index' ? '' : page) + url.search, 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
}
