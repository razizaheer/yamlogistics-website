// Cloudflare Pages Function: latest CBIC customs exchange rates (import/export) from ICEGATE.
// GET /api/cbic-fx  ->  {n:"29/2026", d:"16-10-2026", src:"icegate", r:{USD:{i:95.9,e:94.2,u:1,n:"US Dollar"}, ...}}
const API = 'https://foservices.icegate.gov.in/cbu/icegateapi/';
const HDR = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/plain, */*', 'Origin': 'https://foservices.icegate.gov.in', 'Referer': 'https://foservices.icegate.gov.in/', 'User-Agent': 'Mozilla/5.0 (compatible; YAMLogistics-duty-calculator/1.0; +https://www.yamlogistics.com)' };

async function post(path, body) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 9000);
  try {
    const r = await fetch(API + path, { method: 'POST', headers: HDR, body: JSON.stringify(body), signal: ac.signal });
    if (!r.ok) throw new Error(path + ' HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}
const toDate = (s) => { const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s || ''); return m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) : null; };

async function fromIcegate() {
  const list = await post('getnotdetails', {});
  if (!Array.isArray(list) || !list.length) throw new Error('empty notification list');
  const todayIST = new Date(Date.now() + 5.5 * 3600e3); const today = Date.UTC(todayIST.getUTCFullYear(), todayIST.getUTCMonth(), todayIST.getUTCDate());
  for (const item of list.slice(0, 4)) {
    const j = await post('igexratepublishnot', { notNum: item.notificationNumber });
    const det = j && j.currencyDetail; if (!Array.isArray(det) || det.length < 5) continue;
    const eff = toDate(j.notPublishDate); if (eff && eff.getTime() > today) continue; // not yet in force
    const r = {};
    for (const c of det) {
      const i = Number(c.cbicImport), e = Number(c.cbicExport), u = parseFloat(c.units) || 1;
      if (c.currencyCode && i > 0) r[c.currencyCode] = { i, e, u, n: c.currencyDesc };
    }
    if (!r.USD) continue;
    return { n: j.notificationNumber || item.notificationNumber, d: j.notPublishDate, src: 'icegate', r };
  }
  throw new Error('no usable notification');
}

export async function onRequestGet(ctx) {
  const cache = caches.default;
  const key = new Request(new URL('/api/cbic-fx?cache=1', ctx.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  let data, ok = true;
  try { data = await fromIcegate(); }
  catch (err) {
    ok = false;
    const s = await ctx.env.ASSETS.fetch(new Request(new URL('/cbic-fx.json', ctx.request.url)));
    data = await s.json(); data.fallback = String((err && err.message) || err);
  }
  const res = new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': ok ? 'public, max-age=10800' : 'public, max-age=900', 'access-control-allow-origin': '*' } });
  ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
