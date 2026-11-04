// Cloudflare Pages Function: DGFT notifications, public notices, trade notices and circulars, read from the public lists on dgft.gov.in.
// GET /api/dgft -> {at, src, items:[{t:type, n:number, y:year, s:subject, d:"DD/MM/YYYY", u:pdf url}]}
// Cached for 6 hours at the edge; last good copy kept in R2 (bucket bound as MSDS, key notices/dgft.json) as a fallback.
const CORS = { 'Access-Control-Allow-Origin': '*' };
const LISTS = [['Notification', 'notification'], ['Public Notice', 'public-notice'], ['Trade Notice', 'trade-notice'], ['Circular', 'circular']];
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; YAMLogistics-notifications/1.0; +https://www.yamlogistics.com)', 'Accept': 'text/html' };
const strip = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

async function list(type, opt) {
  const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 15000);
  try {
    const r = await fetch('https://www.dgft.gov.in/CP/?opt=' + opt, { headers: UA, signal: ac.signal });
    if (!r.ok) throw new Error(opt + ' ' + r.status);
    const h = await r.text(), b = h.slice(h.indexOf('<tbody'), h.indexOf('</tbody>'));
    return b.split(/<tr[\s>]/i).slice(1).map((row) => {
      const td = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
      const href = (row.match(/href\s*=\s*"([^"]+)"/i) || [])[1] || '';
      if (td.length < 5) return null;
      return { t: type, n: strip(td[1]), y: strip(td[2]), s: strip(td[3]), d: strip(td[4]), u: href ? encodeURI(decodeURI(href.trim())) : '' };
    }).filter((x) => x && x.n);
  } finally { clearTimeout(tm); }
}

export async function onRequestGet({ request, env, waitUntil }) {
  const cache = caches.default, key = new Request(new URL('/api/dgft?v=1', request.url).toString());
  const hit = await cache.match(key); if (hit) return hit;
  let body;
  try {
    const parts = await Promise.all(LISTS.map(([t, o]) => list(t, o)));
    const items = parts.flat();
    if (items.length < 20) throw new Error('too few rows');
    body = { at: new Date().toISOString(), src: 'dgft.gov.in', items };
    if (env.MSDS) waitUntil(env.MSDS.put('notices/dgft.json', JSON.stringify(body), { httpMetadata: { contentType: 'application/json' } }));
  } catch (e) {
    const o = env.MSDS && await env.MSDS.get('notices/dgft.json');
    body = o ? { ...(await o.json()), stale: true } : { at: null, items: [], error: 'DGFT website not reachable right now' };
  }
  const res = new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=21600', ...CORS } });
  if (body.items.length && !body.stale) waitUntil(cache.put(key, res.clone()));
  return res;
}
