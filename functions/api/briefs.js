// Cloudflare Pages Function: "From the desk" briefs written by YAM's weekly news task.
// Source: Google Drive folder "Trade Desk briefs" (link-shared, view only). One JSON file per week,
// named briefs-YYYY-MM-DD.json: {"week":"...","briefs":[{d,tag,title,summary,body,src,url}]}
// GET /api/briefs -> {updated, briefs:[...]}   GET /api/briefs?debug=1 -> adds folder/file status
const FOLDER = '1CWK5KalKwBFghKugfhxw7TvRr29XueWP';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

async function get(url, ms = 8000) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: ac.signal }); return { ok: r.ok, status: r.status, text: await r.text() }; }
  catch (e) { return { ok: false, status: String(e && e.name || e), text: '' }; }
  finally { clearTimeout(t); }
}

async function listFiles() {
  const r = await get('https://drive.google.com/embeddedfolderview?id=' + FOLDER);
  if (!r.ok) return { files: [], status: r.status };
  const files = [], seen = new Set();
  const re = /href="https:\/\/drive\.google\.com\/file\/d\/([\w-]+)\/[^"]*"[\s\S]*?class="flip-entry-title">([^<]+)</g;
  let m;
  while ((m = re.exec(r.text))) { if (!seen.has(m[1]) && /^briefs-\d{4}-\d{2}-\d{2}/.test(m[2].trim())) { seen.add(m[1]); files.push({ id: m[1], name: m[2].trim() }); } }
  files.sort((a, b) => b.name.localeCompare(a.name));
  return { files, status: r.status };
}

const clean = (s, n) => String(s || '').replace(/\s+\n/g, '\n').trim().slice(0, n);

async function build(debug) {
  const { files, status } = await listFiles();
  const out = [], rep = [];
  for (const f of files.slice(0, 3)) {
    const r = await get('https://drive.google.com/uc?export=download&id=' + f.id);
    let n = 0;
    try {
      const j = JSON.parse(r.text);
      for (const b of (j.briefs || [])) {
        if (!b.title || !b.body) continue;
        out.push({ d: clean(b.d || j.week, 10), tag: clean(b.tag, 20) || 'trade', title: clean(b.title, 140), summary: clean(b.summary, 300), body: clean(b.body, 2500), src: clean(b.src, 160), url: /^https?:\/\//.test(b.url || '') ? b.url : '' });
        n++;
      }
    } catch (e) { }
    rep.push({ name: f.name, status: r.status, briefs: n });
  }
  out.sort((a, b) => b.d.localeCompare(a.d));
  const res = { updated: Date.now(), briefs: out.slice(0, 8) };
  if (debug) res.report = { folderStatus: status, files: files.map(f => f.name), read: rep };
  return res;
}

export async function onRequestGet(ctx) {
  const url = new URL(ctx.request.url);
  const debug = url.searchParams.get('debug') === '1';
  const cache = caches.default;
  const key = new Request(new URL('/api/briefs?cache=1', url).toString());
  if (!debug) { const hit = await cache.match(key); if (hit) return hit; }
  let data;
  try { data = await build(debug); } catch (e) { data = { updated: Date.now(), briefs: [], error: String(e && e.message || e) }; }
  const res = new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=900, s-maxage=1800', 'access-control-allow-origin': '*' } });
  if (!debug && data.briefs.length) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
