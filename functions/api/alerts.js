// Cloudflare Pages Function: shipment ETA alerts by email and/or WhatsApp (opt-in, verified).
// Storage: the R2 bucket bound as MSDS, keys alerts/<id>.json. No new binding needed.
// Email: Resend (env RESEND_API_KEY, ALERT_FROM). WhatsApp: Meta Cloud API (env WA_TOKEN, WA_PHONE_ID, WA_TPL_CODE, WA_TPL_ALERT, optional WA_TPL_LANG).
// Daily run: POST /api/alerts-run with header x-cron-secret = env.ALERT_CRON_SECRET (called by a GitHub Actions schedule).
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
export const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS } });
const SITE = 'https://www.yamlogistics.com';
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
async function sha(s) { return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))); }
const rnd = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
const istDate = (ms = Date.now()) => new Date(ms + 5.5 * 3600e3).toISOString().slice(0, 10);
const dayDiff = (eta, today) => Math.round((Date.parse(eta + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 864e5);
const emailOk = (e) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e) && e.length <= 254;
const phoneNorm = (p) => String(p || '').replace(/[^\d]/g, '');
const phoneOk = (p) => /^[1-9]\d{7,14}$/.test(p);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function configured(env) { return { store: !!env.MSDS, email: !!(env.RESEND_API_KEY && env.ALERT_FROM), whatsapp: !!(env.WA_TOKEN && env.WA_PHONE_ID && env.WA_TPL_CODE && env.WA_TPL_ALERT) }; }
export function cleanShips(a) {
  if (!Array.isArray(a)) return [];
  return a.slice(0, 50).map((s) => ({ num: String(s.num || '').toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 24), label: String(s.label || '').replace(/[\r\n]+/g, ' ').slice(0, 60), eta: /^\d{4}-\d{2}-\d{2}$/.test(s.eta || '') ? s.eta : '', done: !!s.done })).filter((s) => s.num && s.eta);
}
async function getRec(env, id) { const o = await env.MSDS.get('alerts/' + id + '.json'); return o ? await o.json() : null; }
async function putRec(env, rec) { await env.MSDS.put('alerts/' + rec.id + '.json', JSON.stringify(rec), { httpMetadata: { contentType: 'application/json' } }); }

export async function sendEmail(env, to, subject, text, html, stopUrl) {
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.ALERT_FROM, to: [to], subject, text, html, headers: stopUrl ? { 'List-Unsubscribe': '<' + stopUrl + '>' } : undefined }) });
  if (!r.ok) { let t = ''; try { t = (await r.text()).slice(0, 220); } catch (e) {} sendEmail.lastErr = r.status + ' ' + t; }
  return r.ok;
}
export async function sendWA(env, to, template, params) {
  const r = await fetch('https://graph.facebook.com/v20.0/' + env.WA_PHONE_ID + '/messages', { method: 'POST', headers: { Authorization: 'Bearer ' + env.WA_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'template', template: { name: template, language: { code: env.WA_TPL_LANG || 'en' }, components: [{ type: 'body', parameters: params.map((t) => ({ type: 'text', text: String(t).slice(0, 900) })) }].concat(template === env.WA_TPL_CODE ? [{ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: String(params[0]) }] }] : []) } }) });
  return r.ok;
}

export const onRequestOptions = () => new Response(null, { headers: CORS });
export async function onRequestGet({ request, env }) {
  const u = new URL(request.url), stop = u.searchParams.get('stop');
  if (stop) {
    const [id, tok] = stop.split('.'); let ok = false;
    if (env.MSDS && /^[a-f0-9]{24}$/.test(id || '')) { const r = await getRec(env, id); if (r && r.token === tok) { await env.MSDS.delete('alerts/' + id + '.json'); ok = true; } }
    return new Response('<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><body style="font-family:system-ui;max-width:480px;margin:60px auto;padding:0 20px;color:#0B2A4A"><h2>' + (ok ? 'You are unsubscribed' : 'Link not valid') + '</h2><p>' + (ok ? 'We have deleted your alert details. You will not get more messages from CargoKit.' : 'This link has already been used or is not correct. Open My shipments in CargoKit and tap Stop alerts.') + '</p>', { status: ok ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  return json(configured(env));
}

export async function onRequestPost({ request, env }) {
  const path = new URL(request.url).pathname;
  if (path.endsWith('/alerts-run')) return run(request, env);
  const c = configured(env); if (!c.store) return json({ ok: false, error: 'not-configured' }, 503);
  let b; try { b = await request.json(); } catch { return json({ ok: false, error: 'bad-request' }, 400); }
  const ch = b.channel === 'whatsapp' ? 'whatsapp' : b.channel === 'email' ? 'email' : '';
  if (!ch || !c[ch]) return json({ ok: false, error: 'channel-off' }, 503);
  const to = ch === 'email' ? String(b.to || '').trim().toLowerCase() : phoneNorm(b.to);
  if (b.action !== 'sync' && b.action !== 'stop' && (ch === 'email' ? !emailOk(to) : !phoneOk(to))) return json({ ok: false, error: 'invalid-recipient' }, 400);
  const id = (await sha(ch + ':' + to)).slice(0, 24), now = Date.now();

  if (b.action === 'subscribe') {
    // light abuse limit per IP per day
    const ip = request.headers.get('CF-Connecting-IP') || 'x', rlk = 'alerts-rl/' + istDate() + '/' + (await sha(ip)).slice(0, 16);
    const rl = await env.MSDS.get(rlk); const n = rl ? +(await rl.text()) : 0; if (n >= 12) return json({ ok: false, error: 'too-many' }, 429);
    await env.MSDS.put(rlk, String(n + 1));
    let r = await getRec(env, id) || { id, ch, to, verified: false, token: '', ships: [], sent: {}, codes: [] };
    r.codes = (r.codes || []).filter((t) => now - t < 864e5); if (r.codes.length >= 5 || (r.codes.length && now - r.codes[r.codes.length - 1] < 45e3)) return json({ ok: false, error: 'wait' }, 429);
    r.codes.push(now); r.code = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)); r.codeAt = now; r.tries = 0; r.pending = cleanShips(b.shipments);
    let sent = false;
    if (ch === 'email') sent = await sendEmail(env, to, 'Your CargoKit code: ' + r.code, 'Your CargoKit verification code is ' + r.code + '. It works for 15 minutes. If you did not ask for it, ignore this email.', '<p>Your CargoKit verification code is <b style="font-size:20px">' + r.code + '</b>.</p><p>It works for 15 minutes. If you did not ask for it, ignore this email.</p>');
    else sent = await sendWA(env, to, env.WA_TPL_CODE, [r.code]);
    if (!sent) return json({ ok: false, error: 'send-failed', detail: ch === 'email' ? (sendEmail.lastErr || '') : '' }, 422);
    await putRec(env, r); return json({ ok: true, id });
  }
  const r = await getRec(env, id);
  if (b.action === 'verify') {
    if (!r || !r.code || now - r.codeAt > 15 * 60e3) return json({ ok: false, error: 'expired' }, 400);
    if ((r.tries = (r.tries || 0) + 1) > 5) { delete r.code; await putRec(env, r); return json({ ok: false, error: 'expired' }, 400); }
    if (String(b.code || '').trim() !== r.code) { await putRec(env, r); return json({ ok: false, error: 'wrong-code' }, 400); }
    r.verified = true; r.token = rnd(12); r.ships = r.pending || []; delete r.code; delete r.pending; r.sent = {}; await putRec(env, r);
    return json({ ok: true, id, token: r.token });
  }
  if (!r || !r.verified || r.token !== b.token) return json({ ok: false, error: 'auth' }, 403);
  if (b.action === 'sync') { r.ships = cleanShips(b.shipments); await putRec(env, r); return json({ ok: true, n: r.ships.length }); }
  if (b.action === 'stop') { await env.MSDS.delete('alerts/' + id + '.json'); return json({ ok: true }); }
  return json({ ok: false, error: 'bad-action' }, 400);
}

export function due(rec, today) {
  const out = [];
  for (const s of rec.ships || []) {
    if (s.done) continue; const d = dayDiff(s.eta, today); let rule = d === 3 ? 'd3' : d === 0 ? 'd0' : d === -2 ? 'late' : '';
    if (!rule) continue; const k = s.num + '|' + s.eta + '|' + rule; if (rec.sent && rec.sent[k]) continue; out.push({ s, rule, k, d });
  }
  return out;
}
const lineOf = (x) => (x.s.label ? x.s.label + ' (' + x.s.num + ')' : x.s.num) + (x.rule === 'd3' ? ' is due in 3 days (' + x.s.eta + ')' : x.rule === 'd0' ? ' is due today' : ' is 2 days past its ETA of ' + x.s.eta + '. Check with the carrier');

async function run(request, env) {
  if (!env.ALERT_CRON_SECRET || request.headers.get('x-cron-secret') !== env.ALERT_CRON_SECRET) return json({ ok: false }, 401);
  if (!env.MSDS) return json({ ok: false, error: 'not-configured' }, 503);
  const c = configured(env), today = istDate(), res = { checked: 0, messages: 0, failed: 0 }; let cursor;
  do {
    const l = await env.MSDS.list({ prefix: 'alerts/', cursor, limit: 500 }); cursor = l.truncated ? l.cursor : undefined;
    for (const o of l.objects) {
      if (!o.key.endsWith('.json')) continue; const rec = await (await env.MSDS.get(o.key)).json(); if (!rec.verified || !c[rec.ch]) continue; res.checked++;
      const dl = due(rec, today); if (!dl.length) continue;
      const stopUrl = SITE + '/api/alerts?stop=' + rec.id + '.' + rec.token; let ok = false;
      if (rec.ch === 'email') {
        const lines = dl.map(lineOf);
        ok = await sendEmail(env, rec.to, 'CargoKit: ' + (dl.length === 1 ? lines[0].slice(0, 70) : dl.length + ' shipments need attention'), lines.join('\n') + '\n\nOpen My shipments: ' + SITE + '/my-shipments\n\nStop these alerts: ' + stopUrl,
          '<p>' + lines.map(esc).join('<br>') + '</p><p><a href="' + SITE + '/my-shipments">Open My shipments</a></p><p style="font-size:12px;color:#5E7891">You get this because you turned on alerts in CargoKit. <a href="' + stopUrl + '">Stop these alerts</a>.</p>', stopUrl);
      } else ok = await sendWA(env, rec.to, env.WA_TPL_ALERT, [dl.map(lineOf).join('; ')]);
      if (ok) { rec.sent = rec.sent || {}; dl.forEach((x) => { rec.sent[x.k] = today; }); const keep = Object.entries(rec.sent).slice(-200); rec.sent = Object.fromEntries(keep); await putRec(env, rec); res.messages++; } else res.failed++;
    }
  } while (cursor);
  return json({ ok: true, ...res });
}
