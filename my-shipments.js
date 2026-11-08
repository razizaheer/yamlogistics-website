/* YAM Logistics: My shipments. Saved list of containers, AWBs and B/Ls with ETA and notes. Stays on this device. */
(function () {
  var root = document.getElementById('ms-root'); if (!root || !window.YAMTrack) return;
  var KEY = 'ck_ship_v1', D = document, L = [], tab = 'active', editing = null;
  var css = D.createElement('style');
  css.textContent = '.ms-card{background:#fff;border:1px solid #E1EDF7;border-radius:22px;padding:20px;margin-bottom:14px}.ms-h{font-family:Archivo,sans-serif;font-weight:800;font-size:21px;margin:0 0 4px;color:#0B2A4A}.ms-s{font-size:14px;color:#5E7891;margin:0 0 14px;line-height:1.5}' +
    '.ms-g{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ms-g .w{grid-column:1/-1}@media(max-width:560px){.ms-g{grid-template-columns:1fr}}.ms-l{font-size:13px;font-weight:600;color:#3D5873;margin:0 0 6px;display:block}' +
    '.ms-in{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid #C9DCEC;border-radius:14px;font:inherit;font-size:16px;color:#0B2A4A;background:#fff}.ms-in:focus{outline:2px solid #0A6CC2;border-color:#0A6CC2}' +
    '.ms-b{border:0;border-radius:999px;padding:11px 16px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;text-decoration:none;display:inline-block}.ms-p{background:#0A6CC2;color:#fff}.ms-q{background:#EEF6FD;color:#0B2A4A}.ms-w{background:#25D366;color:#073B1B}.ms-r{background:#FFE3DF;color:#B42318}.ms-y{background:#FFC93C;color:#0B2A4A}' +
    '.ms-tabs{display:flex;gap:6px;background:#EEF6FD;border-radius:999px;padding:4px;margin:0 0 14px;width:fit-content}.ms-tabs button{border:0;border-radius:999px;padding:9px 16px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;background:transparent;color:#3D5873}.ms-tabs button.on{background:#0A6CC2;color:#fff}' +
    '.ms-num{font-family:"Geist Mono",monospace;font-size:17px;letter-spacing:.03em;color:#0B2A4A;margin:4px 0}.ms-k{font-size:12px;letter-spacing:.08em;color:#B45309;font-family:"Geist Mono",monospace}.ms-chip{display:inline-block;border-radius:999px;padding:5px 12px;font-size:13px;font-weight:700;margin:6px 0}' +
    '.ms-c-ok{background:#E9FBF0;color:#0F7A3D}.ms-c-soon{background:#FFF3D6;color:#8A5A00}.ms-c-late{background:#FFE3DF;color:#B42318}.ms-c-no{background:#EEF4FA;color:#5E7891}' +
    '.ms-bar{background:#0A6CC2;color:#fff;border-radius:18px;padding:14px 18px;margin-bottom:14px;font-size:15px;line-height:1.5}.ms-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.ms-empty{text-align:center;color:#5E7891;padding:30px 10px;line-height:1.6}';
  D.head.appendChild(css);
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(i) { return D.getElementById(i); }
  function load() { try { L = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { L = []; } if (!Array.isArray(L)) L = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(L.slice(0, 200))); } catch (e) {} syncSoon(); }
  function toast(m) { var t = el('ms-toast'); if (!t) { t = D.createElement('div'); t.id = 'ms-toast'; t.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:90px;background:#0B2A4A;color:#fff;padding:12px 18px;border-radius:14px;font-size:14px;z-index:99999;max-width:90%;text-align:center'; D.body.appendChild(t); } t.textContent = m; t.style.display = 'block'; clearTimeout(t._h); t._h = setTimeout(function () { t.style.display = 'none'; }, 3000); }
  function copy(t) { try { navigator.clipboard.writeText(t); } catch (e) { var a = D.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; D.body.appendChild(a); a.select(); try { D.execCommand('copy'); } catch (x) {} a.remove(); } }
  function days(eta) { if (!eta) return null; var a = new Date(eta + 'T00:00:00'), n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((a - n) / 864e5); }
  function chip(s) {
    if (s.done) return '<span class="ms-chip ms-c-ok">✓ Delivered</span>';
    var d = days(s.eta); if (d == null) return '<span class="ms-chip ms-c-no">No ETA set</span>';
    var dt = new Date(s.eta + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    if (d < 0) return '<span class="ms-chip ms-c-late">ETA ' + dt + ' passed ' + (-d) + ' day' + (d === -1 ? '' : 's') + ' ago</span>';
    if (d === 0) return '<span class="ms-chip ms-c-soon">Arrives today · ' + dt + '</span>';
    if (d <= 3) return '<span class="ms-chip ms-c-soon">Arrives in ' + d + ' day' + (d === 1 ? '' : 's') + ' · ' + dt + '</span>';
    return '<span class="ms-chip ms-c-ok">Arrives in ' + d + ' days · ' + dt + '</span>';
  }
  function info(s) { return window.YAMTrack.detect(s.num) || { kind: '', pretty: s.num, carrier: '', url: '' }; }
  function msg(s) { var i = info(s); return 'Shipment ' + i.pretty + (s.label ? ' (' + s.label + ')' : '') + (i.carrier ? ' · ' + i.carrier : '') + (s.eta ? ' · ETA ' + s.eta : '') + (s.note ? '\n' + s.note : '') + '\nTracked with CargoKit by YAM Logistics, cargokit.ai'; }

  function render() {
    var act = L.filter(function (s) { return !s.done; }), don = L.filter(function (s) { return s.done; });
    act.sort(function (a, b) { var x = a.eta || '9999', y = b.eta || '9999'; return x < y ? -1 : x > y ? 1 : 0; });
    var soon = act.filter(function (s) { var d = days(s.eta); return d != null && d >= 0 && d <= 3; }).length, late = act.filter(function (s) { var d = days(s.eta); return d != null && d < 0; }).length;
    var bar = (soon || late) ? '<div class="ms-bar">' + (soon ? '<b>' + soon + '</b> arriving within 3 days. ' : '') + (late ? '<b>' + late + '</b> past the ETA you set. Check with the carrier.' : '') + '</div>' : '';
    var list = (tab === 'active' ? act : don);
    el('ms-list').innerHTML = bar + '<div class="ms-tabs"><button data-tab="active" class="' + (tab === 'active' ? 'on' : '') + '">Active (' + act.length + ')</button><button data-tab="done" class="' + (tab === 'done' ? 'on' : '') + '">Delivered (' + don.length + ')</button></div>' +
      (list.length ? list.map(card).join('') : '<div class="ms-card ms-empty">' + (tab === 'active' ? 'Nothing saved yet.<br>Add a container, AWB or B/L number above and it stays here on your phone.' : 'No delivered shipments yet.') + '</div>') +
      (L.length ? '<div class="ms-btns"><button class="ms-b ms-q" id="ms-share">Share my active list</button></div>' : '');
  }
  function card(s) {
    var i = info(s), ed = editing === s.id;
    var H = '<div class="ms-card"><div class="ms-k">' + h((i.kind || 'SHIPMENT').toUpperCase()) + (i.carrier ? ' · ' + h(i.carrier.toUpperCase()) : '') + '</div>' + (s.label ? '<div class="ms-h" style="font-size:18px">' + h(s.label) + '</div>' : '') + '<div class="ms-num">' + h(i.pretty) + '</div>' + (i.ok === false ? '<div style="color:#B42318;font-size:13px">Check digit does not match. Please re-check the number.</div>' : '') + chip(s) + (s.note ? '<div style="font-size:14px;color:#3D5873;line-height:1.5;white-space:pre-wrap">' + h(s.note) + '</div>' : '');
    if (ed) {
      H += '<div class="ms-g" style="margin-top:12px"><div class="w"><label class="ms-l">Label</label><input class="ms-in" data-e="label" value="' + h(s.label) + '" placeholder="e.g. Order 4521 Dubai"></div><div><label class="ms-l">ETA at port</label><input class="ms-in" type="date" data-e="eta" value="' + h(s.eta) + '"></div><div class="w"><label class="ms-l">Note</label><input class="ms-in" data-e="note" value="' + h(s.note) + '" placeholder="Vessel, supplier, anything to remember"></div></div><div class="ms-btns"><button class="ms-b ms-p" data-a="ok" data-id="' + s.id + '">Done</button></div>';
    } else {
      H += '<div class="ms-btns"><button class="ms-b ms-p" data-a="trk" data-id="' + s.id + '">Track ↗</button><button class="ms-b ms-w" data-a="wa" data-id="' + s.id + '">WhatsApp</button>' + (s.eta && !s.done ? '<button class="ms-b ms-q" data-a="cal" data-id="' + s.id + '">⏰ Remind me</button>' : '') + '<button class="ms-b ms-q" data-a="ed" data-id="' + s.id + '">Edit</button><button class="ms-b ms-q" data-a="dn" data-id="' + s.id + '">' + (s.done ? 'Move back to active' : 'Mark delivered') + '</button><button class="ms-b ms-r" data-a="rm" data-id="' + s.id + '">Delete</button></div>';
    }
    return H + '</div>';
  }
  root.innerHTML = '<div class="ms-card"><div style="display:flex;gap:8px;margin:0 0 16px;flex-wrap:wrap"><a href="track-shipment.html" style="background:#EEF6FD;color:#0B2A4A;border-radius:999px;padding:9px 16px;font-weight:600;font-size:14px;text-decoration:none">Track a number</a><span style="background:#0A6CC2;color:#fff;border-radius:999px;padding:9px 16px;font-weight:600;font-size:14px">★ My shipments</span></div>' +
    '<h2 class="ms-h">Add a shipment</h2><p class="ms-s">Container, air waybill or bill of lading number. We find the carrier and the official tracking page for you.</p><div class="ms-g"><div class="w"><label class="ms-l" for="ms-n">Number</label><input class="ms-in" id="ms-n" placeholder="e.g. MSKU 123456 5, 176-12345675, MAEU123456789" autocomplete="off" spellcheck="false"><div id="ms-hint" style="font-size:13px;margin-top:6px;min-height:18px"></div></div>' +
    '<div><label class="ms-l" for="ms-l">Label (optional)</label><input class="ms-in" id="ms-l" placeholder="e.g. Order 4521 Dubai"></div><div><label class="ms-l" for="ms-e">ETA at port (optional)</label><input class="ms-in" id="ms-e" type="date"></div><div class="w"><label class="ms-l" for="ms-t">Note (optional)</label><input class="ms-in" id="ms-t" placeholder="Vessel, supplier, anything to remember"></div></div>' +
    '<div class="ms-btns"><button class="ms-b ms-y" id="ms-add">Save shipment</button></div></div><div class="ms-card" id="ms-al"></div><div id="ms-list"></div>' +
    '<div style="font-size:12.5px;color:#5E7891;line-height:1.55;margin-top:10px">Your list is kept on this phone only. CargoKit does not read live carrier status. Tap Track and the carrier\'s own page opens with your number ready. The ETA is the date you enter, so update it when the carrier changes it.</div>';
  el('ms-n').addEventListener('input', function () {
    var d = window.YAMTrack.detect(el('ms-n').value), x = el('ms-hint'); if (!el('ms-n').value.trim()) { x.innerHTML = ''; return; }
    x.innerHTML = !d ? '<span style="color:#B42318">Not a container, AWB or B/L number yet.</span>' : d.ok === false ? '<span style="color:#B42318">' + h(d.kind) + ' · check digit does not match. Please re-check.</span>' : '<span style="color:#0F7A3D">✓ ' + h(d.kind) + (d.carrier ? ' · ' + h(d.carrier) : '') + '</span>';
  });
  el('ms-add').addEventListener('click', function () {
    var d = window.YAMTrack.detect(el('ms-n').value); if (!d) { toast('Please enter a valid container, AWB or B/L number.'); return; }
    if (L.some(function (s) { return s.num === d.num; })) { toast('That shipment is already saved.'); return; }
    L.unshift({ id: Date.now().toString(36), num: d.num, label: el('ms-l').value.trim(), eta: el('ms-e').value, note: el('ms-t').value.trim(), done: false, t: Date.now() }); save();
    ['ms-n', 'ms-l', 'ms-e', 'ms-t'].forEach(function (i) { el(i).value = ''; }); el('ms-hint').innerHTML = ''; tab = 'active'; render(); toast('Saved.');
  });
  function find(id) { for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  el('ms-list').addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; render(); return; }
    if (e.target.closest('#ms-share')) { var A = L.filter(function (s) { return !s.done; }); window.open('https://wa.me/?text=' + encodeURIComponent('My shipments\n\n' + A.map(msg).join('\n\n')), '_blank', 'noopener'); return; }
    var b = e.target.closest('[data-a]'); if (!b) return; var s = find(b.dataset.id); if (!s) return;
    var a = b.dataset.a;
    if (a === 'trk') { var i = info(s); copy(i.pretty.replace(/ /g, '')); toast('Number copied'); window.open(i.url || ('track-shipment.html?n=' + encodeURIComponent(s.num)), '_blank', 'noopener'); }
    else if (a === 'wa') window.open('https://wa.me/?text=' + encodeURIComponent(msg(s)), '_blank', 'noopener');
    else if (a === 'cal') ics(s);
    else if (a === 'ed') { editing = s.id; render(); }
    else if (a === 'ok') { editing = null; save(); render(); }
    else if (a === 'dn') { s.done = !s.done; save(); render(); }
    else if (a === 'rm') { if (b.dataset.sure) { L = L.filter(function (x) { return x.id !== s.id; }); save(); render(); } else { b.dataset.sure = 1; b.textContent = 'Tap again to delete'; setTimeout(function () { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'Delete'; } }, 3000); } }
  });
  el('ms-list').addEventListener('input', function (e) { var k = e.target.dataset.e; if (!k || !editing) return; var s = find(editing); if (s) { s[k] = e.target.value; save(); } });

  // ---------- calendar reminder (works without any server) ----------
  function ics(s) {
    var i = info(s), d = s.eta.replace(/-/g, ''), nx = new Date(s.eta + 'T00:00:00Z'); nx.setUTCDate(nx.getUTCDate() + 1);
    var e = nx.toISOString().slice(0, 10).replace(/-/g, ''), nm = (s.label ? s.label + ' ' : '') + i.pretty, esc = function (x) { return String(x).replace(/[\;,]/g, '\\$&').replace(/\n/g, '\\n'); };
    var txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CargoKit//YAM Logistics//EN', 'BEGIN:VEVENT', 'UID:' + s.id + '@cargokit.ai', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', 'DTSTART;VALUE=DATE:' + d, 'DTEND;VALUE=DATE:' + e,
      'SUMMARY:' + esc('Shipment ETA: ' + nm), 'DESCRIPTION:' + esc((i.carrier ? i.carrier + '. ' : '') + (s.note || '') + ' Tracking: ' + (i.url || 'https://www.yamlogistics.com/track-shipment')),
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Shipment arriving tomorrow', 'TRIGGER:-PT15H', 'END:VALARM', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Shipment due today', 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var blob = new Blob([txt], { type: 'text/calendar' }), a = D.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'shipment-' + i.num.replace(/[^A-Za-z0-9]/g, '') + '.ics'; D.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); URL.revokeObjectURL(a.href); }, 4000);
    toast('Open the file to add the reminder to your calendar');
  }

  // ---------- email and WhatsApp alerts ----------
  var API = /(^|\.)yamlogistics\.(pages\.dev|com)$/.test(location.hostname) ? '/' : 'https://yamlogistics.pages.dev/', AK = 'ck_alert_v1', CFG = null, AS = {}, pend = null, tmr = null;
  try { AS = JSON.parse(localStorage.getItem(AK) || '{}') || {}; } catch (e) { AS = {}; }
  function aSave() { try { localStorage.setItem(AK, JSON.stringify(AS)); } catch (e) {} }
  function ships() { return L.map(function (s) { return { num: s.num, label: s.label, eta: s.eta, done: !!s.done }; }); }
  function call(b) { return fetch(API + 'api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); }).catch(function () { return { ok: false, error: 'network' }; }); }
  function syncSoon() { clearTimeout(tmr); if (!AS.email && !AS.whatsapp) return; tmr = setTimeout(function () { ['email', 'whatsapp'].forEach(function (ch) { var s = AS[ch]; if (!s) return; call({ action: 'sync', channel: ch, to: s.to, token: s.token, shipments: ships() }).then(function (r) { if (!r.ok && r.error === 'auth') { delete AS[ch]; aSave(); alertUI(); } }); }); }, 1500); }
  var ERR = { 'invalid-recipient': 'That does not look right. Please check it.', wait: 'Please wait a minute before asking for another code.', 'too-many': 'Too many tries today. Please try again tomorrow.', 'send-failed': 'We could not send the code. Please try again.', 'wrong-code': 'That code is not right.', expired: 'That code has expired. Please ask for a new one.', network: 'No connection. Please try again.' };
  function alertUI() {
    var box = el('ms-al'); if (!box) return;
    var head = '<h2 class="ms-h">Get alerts</h2>';
    if (!CFG) { box.innerHTML = head + '<p class="ms-s">Checking…</p>'; return; }
    var any = CFG.store && (CFG.email || CFG.whatsapp);
    if (!any) { box.innerHTML = head + '<p class="ms-s" style="margin:0">Email and WhatsApp alerts are being switched on. Until then, tap <b>⏰ Remind me</b> on a shipment to add a reminder to your phone calendar. It works offline.</p>'; return; }
    var H = head + '<p class="ms-s">We message you 3 days before the ETA, on the day, and 2 days after it passes. Choose how you want them. Each shipment needs an ETA.</p>';
    ['email', 'whatsapp'].forEach(function (ch) {
      if (!CFG[ch]) return; var nm = ch === 'email' ? 'Email' : 'WhatsApp', s = AS[ch];
      H += '<div style="border-top:1px solid #EEF4FA;padding:12px 0">';
      if (s) H += '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span><b>' + nm + ' alerts on</b><br><span style="font-size:13px;color:#5E7891">' + h(ch === 'email' ? s.to : '+' + s.to) + '</span></span><button class="ms-b ms-r" data-al="stop" data-ch="' + ch + '">Stop</button></div>';
      else if (pend && pend.ch === ch) H += '<label class="ms-l">Enter the 6 digit code we sent to ' + h(ch === 'email' ? pend.to : '+' + pend.to) + '</label><div style="display:flex;gap:8px;flex-wrap:wrap"><input class="ms-in" id="ms-code" inputmode="numeric" maxlength="6" placeholder="123456" style="flex:1;min-width:140px"><button class="ms-b ms-p" data-al="verify">Verify</button><button class="ms-b ms-q" data-al="cancel">Back</button></div><div id="ms-ame" style="color:#B42318;font-size:13px;margin-top:6px"></div>';
      else H += '<label class="ms-l" for="ms-a-' + ch + '">' + (ch === 'email' ? 'Email address' : 'WhatsApp number with country code') + '</label><div style="display:flex;gap:8px;flex-wrap:wrap"><input class="ms-in" id="ms-a-' + ch + '" type="' + (ch === 'email' ? 'email' : 'tel') + '" placeholder="' + (ch === 'email' ? 'you@company.com' : '+91 98100 12345') + '" style="flex:1;min-width:180px"><button class="ms-b ms-y" data-al="send" data-ch="' + ch + '">Send code</button></div><div id="ms-ame-' + ch + '" style="color:#B42318;font-size:13px;margin-top:6px"></div>';
      H += '</div>';
    });
    H += '<div style="font-size:12px;color:#5E7891;line-height:1.5;margin-top:6px">If you turn on alerts, we store your contact and your shipment numbers, labels and ETAs on our server, only to send you these alerts. You can stop at any time and everything is deleted.</div>';
    box.innerHTML = H;
  }
  el('ms-al').addEventListener('click', function (e) {
    var b = e.target.closest('[data-al]'); if (!b) return; var a = b.dataset.al, ch = b.dataset.ch;
    if (a === 'send') {
      var to = el('ms-a-' + ch).value.trim(), er = el('ms-ame-' + ch); er.textContent = ''; if (!to) { er.textContent = 'Please enter it first.'; return; }
      if (!L.some(function (s) { return s.eta && !s.done; })) { er.textContent = 'Add a shipment with an ETA first.'; return; }
      b.disabled = true; call({ action: 'subscribe', channel: ch, to: to, shipments: ships() }).then(function (r) { b.disabled = false; if (r.ok) { pend = { ch: ch, to: ch === 'email' ? to.toLowerCase() : to.replace(/\D/g, '') }; alertUI(); } else er.textContent = ERR[r.error] || 'Something went wrong. Please try again.'; });
    } else if (a === 'verify') {
      var code = el('ms-code').value.trim(), er2 = el('ms-ame'); b.disabled = true;
      call({ action: 'verify', channel: pend.ch, to: pend.to, code: code }).then(function (r) { b.disabled = false; if (r.ok) { AS[pend.ch] = { to: pend.to, id: r.id, token: r.token }; aSave(); pend = null; alertUI(); syncSoon(); toast('Alerts are on'); } else er2.textContent = ERR[r.error] || 'Something went wrong. Please try again.'; });
    } else if (a === 'cancel') { pend = null; alertUI(); }
    else if (a === 'stop') { var s = AS[ch]; if (!s) return; call({ action: 'stop', channel: ch, to: s.to, token: s.token }).then(function () { delete AS[ch]; aSave(); alertUI(); toast('Alerts stopped and your details deleted'); }); }
  });
  alertUI();
  fetch(API + 'api/alerts').then(function (r) { return r.json(); }).then(function (c) { CFG = c; alertUI(); }).catch(function () { CFG = { store: false }; alertUI(); });
  load(); render();
  var q = new URLSearchParams(location.search).get('add'); if (q) { el('ms-n').value = q; el('ms-n').dispatchEvent(new Event('input')); }
})();
