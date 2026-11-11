// Cloudflare Pages Function: the optional "Read it with AI" step of the document readers.
// POST /api/read-doc  {kind:'awb'|'bl', docs:[{name, text}]}  ->  {ok:true, fields:{...}}     GET /api/read-doc -> {ok, on}
// The browser reads the file itself and sends only the TEXT of the documents, and only when the visitor presses the AI button.
// The text goes to Cloudflare Workers AI (binding AI) for one reading and is not stored or logged here.
// It returns only names, addresses, places and the goods description; packages and weights are worked out on the device.
// Every name, place and code the model returns is checked against the text it was given.
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const MAX_DOCS = 4, MAX_CHARS = 24000, PER_HOUR = 8;
const OK_HOSTS = /^(www\.)?(yamlogistics\.com|cargokit\.ai)$|\.yamlogistics\.pages\.dev$|^yamlogistics\.pages\.dev$|^(localhost|127\.0\.0\.1)(:\d+)?$/;

const S = (d) => ({ type: 'string', description: d });
const P = {
  shipper_name: S('Exporter / seller company name (often the letterhead at the top)'),
  shipper_address: S('Exporter full address without the company name, one line'),
  consignee_name: S('Buyer / consignee company name'),
  consignee_address: S('Consignee full address without the company name, one line'),
  notify_party: S('Notify party name and address if the document names one, else empty'),
  invoice_no: S('invoice number'), invoice_date: S('as written'),
  port_of_loading: S(''), port_of_discharge: S(''), final_destination: S(''),
  incoterm: S('trade term with its place, e.g. FOB MUMBAI, CIF HAMBURG, DAP MOSCOW'),
  goods_description: S('general name of the goods in at most 8 words, never a list of models, sizes or colours'),
  hs_codes: S('distinct HS / HSN codes, comma separated')
};
const SCHEMA = { type: 'object', properties: P, required: Object.keys(P) };
const SYS = 'You read trade documents (commercial invoice, packing list) and pull out the parties, places and goods needed for an air waybill or bill of lading. ' +
  'The text keeps the page layout: each line is a row and cells are separated by three spaces. Lines in square brackets are notes added by the reader. ' +
  'Fill every field you can find in the documents. Use only what is written; if a detail is not there, return an empty string. Never invent. ' +
  'Reply with one JSON object and nothing else.';

const json = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const clean = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n || 300);

// keep only what the documents really say: a name, place or code that is not in the text is dropped
export function tidy(raw, text) {
  const T = String(text || '').toUpperCase(), f = {};
  const has = (s) => { s = clean(s, 60).toUpperCase(); return !!s && T.indexOf(s.split(' ')[0]) >= 0; };
  ['shipper_name', 'consignee_name', 'invoice_no', 'port_of_loading', 'port_of_discharge', 'final_destination', 'incoterm'].forEach((k) => { f[k] = has(raw[k]) ? clean(raw[k], 120) : ''; });
  f.shipper_address = f.shipper_name ? clean(raw.shipper_address, 260) : '';
  f.consignee_address = f.consignee_name ? clean(raw.consignee_address, 260) : '';
  f.notify_party = has(raw.notify_party) ? clean(raw.notify_party, 300) : '';
  f.invoice_date = clean(raw.invoice_date, 30);
  f.hs_codes = clean(raw.hs_codes, 200).split(/[,;\s]+/).filter((c) => /^\d{4,10}$/.test(c) && T.indexOf(c) >= 0).filter((c, i, a) => a.indexOf(c) === i).join(', ');
  // one general name for the goods: when the model lists the items, keep the first and say there are more
  let g = clean(raw.goods_description, 400); const cut = g.search(/[,;]/);
  if (cut > 8) g = g.slice(0, cut).trim() + ' AND OTHERS'; else if (g.length > 80) g = g.slice(0, 80).trim();
  f.goods_description = g;
  return f;
}

function parse(r) {
  let c = r && (r.response != null ? r.response : r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content);
  if (c && typeof c === 'object') return c;
  c = String(c || ''); const a = c.indexOf('{'), b = c.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('no json');
  return JSON.parse(c.slice(a, b + 1));
}

// a light brake per visitor, so one person cannot use up the day's free allowance
async function allowed(request) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'x', hour = new Date().toISOString().slice(0, 13);
    const key = new Request('https://rate.invalid/read-doc/' + encodeURIComponent(ip) + '/' + hour), cache = caches.default;
    const hit = await cache.match(key), n = hit ? parseInt(await hit.text(), 10) || 0 : 0;
    if (n >= PER_HOUR) return false;
    await cache.put(key, new Response(String(n + 1), { headers: { 'Cache-Control': 'max-age=3600' } }));
  } catch (e) {}
  return true;
}

// GET /api/read-doc -> {ok, on}: the page shows the AI button only when the reader is switched on (the AI binding exists)
export async function onRequestGet({ env }) { return json({ ok: true, on: !!env.AI }); }

export async function onRequestPost({ request, env }) {
  let host = '';
  try { host = new URL(request.headers.get('Origin') || '').host; } catch (e) {}
  if (!OK_HOSTS.test(host)) return json({ ok: false, error: 'forbidden' }, 403);
  if (!env.AI) return json({ ok: false, error: 'not-set-up' }, 503);
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, error: 'bad-request' }, 400); }
  const docs = (Array.isArray(body && body.docs) ? body.docs : []).slice(0, MAX_DOCS)
    .map((d) => ({ name: clean(d && d.name, 80), text: String((d && d.text) || '').slice(0, 9000) })).filter((d) => d.text.trim().length > 40);
  if (!docs.length) return json({ ok: false, error: 'no-text' }, 400);
  let user = docs.map((d, i) => '=== DOCUMENT ' + (i + 1) + ': ' + d.name + ' ===\n' + d.text).join('\n\n');
  if (user.length > MAX_CHARS) user = user.slice(0, MAX_CHARS);
  if (!(await allowed(request))) return json({ ok: false, error: 'slow-down' }, 429);
  try {
    const r = await env.AI.run(MODEL, { messages: [{ role: 'system', content: SYS }, { role: 'user', content: user }], response_format: { type: 'json_schema', json_schema: SCHEMA }, max_tokens: 700, temperature: 0 });
    return json({ ok: true, fields: tidy(parse(r), docs.map((d) => d.text).join('\n')) });
  } catch (e) {
    const m = String((e && e.message) || e);
    return json({ ok: false, error: /limit|quota|neuron|429|capacity/i.test(m) ? 'busy' : 'failed' }, /limit|quota|neuron|429|capacity/i.test(m) ? 429 : 502);
  }
}
