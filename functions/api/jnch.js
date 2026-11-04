// Cloudflare Pages Function: public notices of Jawaharlal Nehru Custom House (Nhava Sheva), read from the public list on jawaharcustoms.gov.in.
// GET /api/jnch -> {at, src, items:[{n:number, s:subject, d:"DD.MM.YYYY", u:pdf url}]}
// Cached for 6 hours at the edge; last good copy kept in R2 (bucket bound as MSDS, key notices/jnch.json) as a fallback.
// The custom house starts a new page each year: add the new year's PageID to PAGES (newest first).
const CORS = { 'Access-Control-Allow-Origin': '*' };
const BASE = 'https://www.jawaharcustoms.gov.in/';
const PAGES = ['information.aspx?PageID=3899']; // 2026
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; YAMLogistics-notifications/1.0; +https://www.yamlogistics.com)', 'Accept': 'text/html' };
const strip = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&#8217;|&rsquo;/g, '’').replace(/&#8211;|&ndash;/g, '–').replace(/\(opens in new window\)/gi, ' ').replace(/\s+/g, ' ').trim();

function parse(html) {
  return html.split(/<tr[\s>]/i).slice(1).map((row) => {
    const td = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
    const href = (row.match(/href\s*=\s*["']([^"']+\.pdf)["']/i) || [])[1];
    if (td.length < 3 || !href) return null;
    const d = strip(td[td.length - 1]);
    if (!/\d{1,2}\.\d{1,2}\.\d{4}/.test(d)) return null;
    let n = strip(td[0]), s = strip(td.slice(1, -1).join(' '));
    if (!/\d/.test(n)) { s = (n + ' ' + s).trim(); n = ''; }
    s = s.replace(/^(Sub(ject)?\s*[:\-–]+\s*)/i, '');
    let u = href.trim(); try { u = encodeURI(decodeURI(new URL(u, BASE).href)); } catch (e) { u = ''; }
    return { n: n.replace(/^PN\s*/i, ''), s, d, u };
  }).filter((x) => x && x.s && x.u);
}

async function page(p) {
  const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 15000);
  try {
    const r = await fetch(BASE + p, { headers: UA, signal: ac.signal });
    if (!r.ok) throw new Error(p + ' ' + r.status);
    return parse(await r.text());
  } finally { clearTimeout(tm); }
}

export async function onRequestGet({ request, env, waitUntil }) {
  const cache = caches.default, key = new Request(new URL('/api/jnch?v=1', request.url).toString());
  const hit = await cache.match(key); if (hit) return hit;
  let body;
  try {
    const items = (await Promise.all(PAGES.map(page))).flat();
    if (items.length < 5) throw new Error('too few rows');
    body = { at: new Date().toISOString(), src: 'jawaharcustoms.gov.in', items };
    if (env.MSDS) waitUntil(env.MSDS.put('notices/jnch.json', JSON.stringify(body), { httpMetadata: { contentType: 'application/json' } }));
  } catch (e) {
    const o = env.MSDS && await env.MSDS.get('notices/jnch.json');
    body = o ? { ...(await o.json()), stale: true } : { at: null, items: [], error: 'Custom house website not reachable right now' };
  }
  const res = new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=21600', ...CORS } });
  if (body.items.length && !body.stale) waitUntil(cache.put(key, res.clone()));
  return res;
}
