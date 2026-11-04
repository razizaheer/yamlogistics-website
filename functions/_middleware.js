// Cloudflare Pages middleware: open the site in Portuguese for visitors in Brazil and in Spanish for visitors in
// Spanish-speaking Latin America, on pages that have a translation. A language picked from the menu (cookie yam_lang)
// always wins, and search-engine crawlers are never redirected.
const PT = new Set(['BR']);
const ES = new Set(['AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'UY', 'VE']);
const COMMON = ['index', 'container-load-planner', 'cbm-calculator', 'contact', 'about', 'customs-brokerage', 'ocean-freight', 'air-freight', 'mobile-phone-exports', 'third-country-trade', 'india-logistics-partner', 'india-latin-america-trade'];
const PAGES = { es: new Set(COMMON), pt: new Set(COMMON) };
const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|linkedin|preview|lighthouse|headless/i;

export async function onRequest(ctx) {
  const { request } = ctx;
  if (request.method !== 'GET') return ctx.next();
  const url = new URL(request.url), p = url.pathname;
  // only English HTML pages at the root
  if (/^\/(api|ar|de|es|fr|hi|ja|ko|pt|ru|zh|tracking|vendor|i18n|_fonts|samples|notices|labels|containers|fta)(\/|$)/.test(p) || /\.(?!html$)[a-z0-9]{2,5}$/i.test(p)) return ctx.next();
  const ck = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)yam_lang=([a-z]{2})/);
  let lang = ck ? ck[1] : null;
  if (!lang) {
    if (BOT.test(request.headers.get('User-Agent') || '')) return ctx.next();
    const c = request.cf && request.cf.country;
    lang = PT.has(c) ? 'pt' : ES.has(c) ? 'es' : null;
  }
  if (lang !== 'es' && lang !== 'pt') return ctx.next();
  const page = p.replace(/^\/+/, '').replace(/\.html$/, '') || 'index';
  if (!PAGES[lang].has(page)) return ctx.next();
  return new Response(null, { status: 302, headers: { Location: '/' + lang + '/' + (page === 'index' ? '' : page) + url.search, 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
}
