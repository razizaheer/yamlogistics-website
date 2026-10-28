// Cloudflare Pages Function: Trade Desk live news wire.
// GET /api/news          -> {updated, items:[{t,u,s,d,c}], n:{brent,wci}}
// GET /api/news?debug=1  -> per-feed status report
// Shows headline, source, time and link only. Article text is never republished.
const BUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const UA = 'Mozilla/5.0 (compatible; YAMLogistics-TradeDesk/1.0; +https://www.yamlogistics.com/trade-desk)';

// f: 1 = keep everything (feed is already on-topic), 0 = keep only trade/shipping-relevant items
const FEEDS = [
  // Indian government
  { s: 'RBI', u: 'https://www.rbi.org.in/pressreleases_rss.xml', f: 0, g: 1 },
  { s: 'RBI', u: 'https://www.rbi.org.in/notifications_rss.xml', f: 0, g: 1 },
  // International bodies: WTO/UNCTAD/IMO feeds block automated readers; covered via trade press
      // Shipping and logistics press
  { s: 'The Loadstar', u: 'https://theloadstar.com/feed/', f: 1 },
  { s: 'Splash247', u: 'https://splash247.com/feed/', f: 0 },
  { s: 'gCaptain', u: 'https://gcaptain.com/feed/', f: 0 },
  { s: 'Container News', u: 'https://container-news.com/feed/', f: 1 },
  { s: 'Hellenic Shipping News', u: 'https://www.hellenicshippingnews.com/feed/', f: 0 },
  { s: 'Seatrade Maritime', u: 'https://www.seatrade-maritime.com/rss.xml', f: 0 },
  { s: 'The Maritime Executive', u: 'https://maritime-executive.com/articles.rss', f: 0 },
  { s: 'Air Cargo Week', u: 'https://aircargoweek.com/feed/', f: 1 },
  // Indian trade press
  { s: 'CargoTalk', u: 'https://www.cargotalk.in/feed/', f: 1 },
  { s: 'Maritime Gateway', u: 'https://www.maritimegateway.com/feed/', f: 1 },
  { s: 'Logistics Insider', u: 'https://www.logisticsinsider.in/feed/', f: 1 },
  { s: 'ET Infra', u: 'https://infra.economictimes.indiatimes.com/rss/topstories', f: 0 },
  { s: 'Economic Times', u: 'https://economictimes.indiatimes.com/news/economy/foreign-trade/rssfeeds/1200949414.cms', f: 1 },
  { s: 'BusinessLine', u: 'https://www.thehindubusinessline.com/economy/logistics/feeder/default.rss', f: 1 },
  { s: 'BusinessLine', u: 'https://www.thehindubusinessline.com/economy/feeder/default.rss', f: 0 },
  { s: 'Mint', u: 'https://www.livemint.com/rss/economy', f: 0 },
  // Commodities
  { s: 'Hellenic Shipping News', u: 'https://www.hellenicshippingnews.com/category/commodities/feed/', f: 1 }
];

const REL = /\b(customs?|cbic|dgft|icegate|tariffs?|dut(y|ies)|export|import|trade (deal|pact|agreement|talks|policy|deficit)|fta|wto|sanction|freight|shipping|shipper|container|teu|vessel|ship|port|terminal|cargo|logistic|air ?cargo|freighter|airline|supply chain|suez|red sea|hormuz|panama|strait|canal|bunker|charter|baltic|scfi|drewry|rupee|forex|crude|brent|oil price|lng|commodit|steel|alumin|copper|iron ore|coal|wheat|rice|sugar|cotton|gold|silver|rare earth)/i;
const INDIA = /\b(india|indian|mumbai|nhava|jnpt|jnpa|mundra|kandla|chennai|delhi|gujarat|kolkata|cochin|kochi|vizag|visakhapatnam|tuticorin|hazira|pipavav|rupee|dgft|cbic|bengaluru|hyderabad)\b/i;
const CATS = [
  ['customs', /\b(customs?|cbic|icegate|bill of entry|shipping bill|igst|bcd|anti-dumping|safeguard dut|import duty|export duty)/i],
  ['policy', /\b(tariff|fta|trade (deal|pact|agreement|talks|policy)|wto|dgft|sanction|export ban|import ban|quota|foreign trade|rodtep|drawback|ceasefire|minister)/i],
  ['air', /\b(air ?cargo|air freight|airline|freighter|airport|awb|iata|aviation)/i],
  ['routes', /\b(port|vessel|ship|shipping|container|teu|suez|red sea|hormuz|panama|canal|strait|terminal|freight rate|carrier|alliance|blank sailing|congestion)/i],
  ['mobile', /\b(smartphone|mobile phone|iphone|apple|electronics|semiconductor)/i],
  ['commodities', /\b(crude|brent|oil|lng|steel|alumin|copper|iron ore|coal|wheat|rice|sugar|cotton|gold|silver|commodit|rare earth)/i]
];

const dec = (s) => (s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;|&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();
const tag = (x, n) => { const m = new RegExp('<' + n + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + n + '>', 'i').exec(x); return m ? m[1] : ''; };

function parse(xml) {
  const out = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks) {
    const t = dec(tag(b, 'title'));
    let u = dec(tag(b, 'link'));
    if (!u) { const m = /<link[^>]*href="([^"]+)"/i.exec(b); u = m ? m[1] : ''; }
    if (!u) u = dec(tag(b, 'guid'));
    const ds = dec(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'));
    const d = Date.parse(ds);
    const x = dec(tag(b, 'description') || tag(b, 'summary')).slice(0, 400);
    if (t && /^https?:\/\//.test(u)) out.push({ t, u, d: isNaN(d) ? 0 : d, x });
  }
  return out;
}

async function get(url, ms = 8000, b = 0) {
  const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': b ? BUA : UA, 'Accept-Language': 'en-IN,en;q=0.9', 'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5' }, signal: ac.signal, cf: { cacheTtl: 900, cacheEverything: true } });
    return { ok: r.ok, status: r.status, text: r.ok ? await r.text() : '' };
  } catch (e) { return { ok: false, status: String(e && e.name || e), text: '' }; }
  finally { clearTimeout(tm); }
}

async function brent() {
  // 1) Stooq daily CSV for ICE Brent futures (cb.f)
  let r = await get('https://stooq.com/q/l/?s=cb.f&f=sd2t2ohlc&h&e=csv', 6000, 1);
  if (r.ok) {
    const row = r.text.trim().split('\n')[1] || ''; const c = row.split(',');
    const close = parseFloat(c[6]), open = parseFloat(c[3]);
    if (isFinite(close) && close > 0) return { v: close, ch: open ? +((close - open) / open * 100).toFixed(2) : null, d: c[1], src: 'ICE Brent futures', u: 'https://stooq.com/q/?s=cb.f' };
  }
  // 2) Yahoo Finance chart endpoint (BZ=F)
  r = await get('https://query1.finance.yahoo.com/v8/finance/chart/BZ%3DF?range=1d&interval=1d', 6000, 1);
  if (r.ok) {
    try {
      const m = JSON.parse(r.text).chart.result[0].meta; const v = m.regularMarketPrice, p = m.chartPreviousClose || m.previousClose;
      if (v) return { v: +v.toFixed(2), ch: p ? +((v - p) / p * 100).toFixed(2) : null, src: 'ICE Brent futures', u: 'https://finance.yahoo.com/quote/BZ%3DF/' };
    } catch (e) {}
  }
  return { err: 'unavailable', s1: r && r.status };
}

async function wci() {
  const u = 'https://www.drewry.co.uk/supply-chain-advisors/supply-chain-expertise/world-container-index-assessed-by-drewry';
  const r = await get(u, 7000); if (!r.ok) return null;
  const t = dec(r.text);
  const m = /World Container Index[^.]{0,200}?(?:to|at) \$\s?([\d,]+(?:\.\d+)?) per 40[- ]?ft/i.exec(t);
  if (!m) return null;
  const ch = /(increased|decreased|rose|fell|dropped|declined|climbed|was stable|remained stable)[^.]{0,40}?(\d+(?:\.\d+)?)%/i.exec(t.slice(Math.max(0, m.index - 300), m.index + 300));
  return { v: parseFloat(m[1].replace(/,/g, '')), ch: ch ? ((/(decreas|fell|dropped|declin)/i.test(ch[1]) ? -1 : 1) * parseFloat(ch[2])) : null, src: 'Drewry World Container Index', u };
}

async function build(debug) {
  const res = await Promise.all(FEEDS.map(async (f) => {
    let r = null, items = [];
    for (const u of [].concat(f.u)) { r = await get(u, 8000, f.b); items = r.ok ? parse(r.text) : []; if (items.length) break; }
    return { f, r, items };
  }));
  const now = Date.now(), maxAge = 7 * 864e5, seen = new Set(), all = [];
  const report = [];
  for (const { f, r, items } of res) {
    let kept = 0;
    for (const it of items) {
      if (!it.d || it.d > now + 36e5 || now - it.d > maxAge) continue;
      const txt = it.t + ' ' + it.x;
      if (f.g && !REL.test(txt)) continue;            // government feeds: trade-related only
      if (!f.f && !(REL.test(txt) && (INDIA.test(txt) || /\b(suez|red sea|hormuz|panama|freight rate|tariff|wto|fta|sanction|drewry|baltic|brent)/i.test(txt)))) continue;
      const w = new Set(it.t.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(' ').filter(x => x.length > 3));
      let dup = false;
      for (const o of seen) { let c = 0; for (const x of w) if (o.has(x)) c++; if (c / Math.max(1, Math.min(w.size, o.size)) >= 0.7) { dup = true; break; } }
      if (dup) continue; seen.add(w);
      const c = CATS.filter(([, re]) => re.test(txt)).map(([n]) => n).slice(0, 2);
      if (!c.length) c.push('trade');
      all.push({ t: it.t, u: it.u, s: f.s, d: it.d, c, in: INDIA.test(txt) ? 1 : 0 });
      kept++;
    }
    report.push({ s: f.s, u: [].concat(f.u)[0], status: r.status, parsed: items.length, kept, newest: items.reduce((a, b) => Math.max(a, b.d), 0) ? new Date(items.reduce((a, b) => Math.max(a, b.d), 0)).toISOString() : null });
  }
  // India-relevant stories first within the same day, then newest first
  all.sort((a, b) => (Math.floor(b.d / 864e5) - Math.floor(a.d / 864e5)) || (b.in - a.in) || (b.d - a.d));
  const [b, w] = await Promise.all([brent().catch(() => null), wci().catch(() => null)]);
  const out = { updated: now, items: all.slice(0, 60), n: { brent: b, wci: w } };
  if (debug) out.report = report;
  return out;
}

export async function onRequestGet(ctx) {
  const url = new URL(ctx.request.url);
  const debug = url.searchParams.get('debug') === '1';
  const cache = caches.default;
  const key = new Request(new URL('/api/news?cache=2', url).toString());
  if (!debug) { const hit = await cache.match(key); if (hit) return hit; }
  let data;
  try { data = await build(debug); }
  catch (e) { data = { updated: Date.now(), items: [], n: {}, error: String(e && e.message || e) }; }
  const res = new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=600, s-maxage=1800', 'access-control-allow-origin': '*' } });
  if (!debug && data.items.length) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
