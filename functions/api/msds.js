// Cloudflare Pages Function: receive an MSDS from the DG cargo checker and store it in R2.
// POST /api/msds (multipart: file, name, company, email, phone, hsn, consent, query, parsed, page, website[honeypot])
// Needs an R2 bucket bound to this Pages project as "MSDS" (Settings > Functions > R2 bucket bindings).
// Files go to msds/YYYY-MM/<id>-<name>; a JSON record per upload goes to records/YYYY-MM/<id>.json (our own database).
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });
const MAX = 10 * 1024 * 1024;
const clip = (v, n = 200) => String(v || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

export const onRequestOptions = () => new Response(null, { headers: CORS });

export async function onRequestPost({ request, env }) {
  if (!env.MSDS) return json({ ok: false, error: 'storage-not-configured' }, 503);
  let fd; try { fd = await request.formData(); } catch { return json({ ok: false, error: 'bad-form' }, 400); }
  if (clip(fd.get('website'))) return json({ ok: true, id: 'thanks' }); // honeypot: pretend success for bots
  if (fd.get('consent') !== 'yes') return json({ ok: false, error: 'consent-required' }, 400);
  const file = fd.get('file'), name = clip(fd.get('name'), 120), email = clip(fd.get('email'), 160);
  if (!file || typeof file === 'string') return json({ ok: false, error: 'no-file' }, 400);
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return json({ ok: false, error: 'name-email-required' }, 400);
  if (file.size > MAX) return json({ ok: false, error: 'too-large' }, 413);
  const buf = await file.arrayBuffer(), b = new Uint8Array(buf.slice(0, 8));
  const isPdf = b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46, isPng = b[0] === 0x89 && b[1] === 0x50, isJpg = b[0] === 0xff && b[1] === 0xd8;
  if (!isPdf && !isPng && !isJpg) return json({ ok: false, error: 'pdf-png-jpg-only' }, 415);
  const now = new Date(), ym = now.toISOString().slice(0, 7);
  const id = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14) + '-' + crypto.randomUUID().slice(0, 6);
  const safe = clip(file.name, 80).replace(/[^A-Za-z0-9._-]+/g, '_') || 'msds';
  const key = `msds/${ym}/${id}-${safe}`;
  let parsed = {}; try { parsed = JSON.parse(String(fd.get('parsed') || '{}')); } catch { }
  const rec = {
    id, received: now.toISOString(), file: key, bytes: file.size, type: isPdf ? 'pdf' : isPng ? 'png' : 'jpg',
    name, company: clip(fd.get('company'), 160), email, phone: clip(fd.get('phone'), 40), hsn: clip(fd.get('hsn'), 12),
    query: clip(fd.get('query'), 120), page: clip(fd.get('page'), 300), consent: true,
    parsed: { product: clip(parsed.product, 120), uns: Array.isArray(parsed.uns) ? parsed.uns.slice(0, 6).map((u) => clip(u, 4)) : [], cls: clip(parsed.cls, 4), pg: clip(parsed.pg, 3), flash: typeof parsed.flash === 'number' ? parsed.flash : null, notReg: !!parsed.notReg, mp: !!parsed.mp, date: clip(parsed.date, 30), found14: !!parsed.found14 },
    country: (request.cf && request.cf.country) || '', status: 'new', verified: false
  };
  await env.MSDS.put(key, buf, { httpMetadata: { contentType: isPdf ? 'application/pdf' : isPng ? 'image/png' : 'image/jpeg' }, customMetadata: { id, email, name: name.slice(0, 60) } });
  await env.MSDS.put(`records/${ym}/${id}.json`, JSON.stringify(rec, null, 1), { httpMetadata: { contentType: 'application/json' } });
  return json({ ok: true, id });
}
