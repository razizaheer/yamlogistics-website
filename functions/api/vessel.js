// Cloudflare Pages Function: remember which IMO number belongs to a vessel name (learned from visitors and our team).
// GET /api/vessel?name=HENG%20HUI%206 -> {imo:"9287895"} | {imo:null}
// POST /api/vessel {name, imo} -> stores it if the IMO check digit is valid. Uses the R2 bucket bound as MSDS (key vessels/index.json).
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS } });
const norm = (n) => String(n || '').toUpperCase().replace(/^(M\.?V\.?|MV)\s+/, '').replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
const imoOk = (n) => { n = String(n); if (!/^\d{7}$/.test(n)) return false; let s = 0; for (let i = 0; i < 6; i++) s += (+n[i]) * (7 - i); return s % 10 === +n[6]; };
const KEY = 'vessels/index.json';
async function load(env) { const o = await env.MSDS.get(KEY); return o ? await o.json() : {}; }

export const onRequestOptions = () => new Response(null, { headers: CORS });
export async function onRequestGet({ request, env }) {
  if (!env.MSDS) return json({ imo: null });
  const name = norm(new URL(request.url).searchParams.get('name'));
  if (!name) return json({ imo: null });
  const db = await load(env); const e = db[name];
  return json({ imo: e ? e.imo : null });
}
export async function onRequestPost({ request, env }) {
  if (!env.MSDS) return json({ ok: false }, 503);
  let b; try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  const name = norm(b.name), imo = String(b.imo || '').trim();
  if (name.length < 3 || !imoOk(imo)) return json({ ok: false, error: 'invalid' }, 400);
  const db = await load(env);
  if (db[name] && db[name].imo === imo) return json({ ok: true });
  db[name] = { imo, at: new Date().toISOString(), n: (db[name] && db[name].imo === imo ? db[name].n + 1 : 1) };
  await env.MSDS.put(KEY, JSON.stringify(db), { httpMetadata: { contentType: 'application/json' } });
  return json({ ok: true });
}
