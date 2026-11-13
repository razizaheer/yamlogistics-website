/* Mexico 2026 tariff-hike checker. Data: the two decrees published in Mexico's official gazette (DOF)
   on 29 Dec 2025 and 23 Apr 2026, built into mx-tariff-2026.json. Spanish texts are shown as published.
   Everything runs on the device. */
(function () {
  'use strict';
  var D = document, root = D.getElementById('mx-root'); if (!root) return;
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function f8(c) { return c.slice(0, 4) + '.' + c.slice(4, 6) + '.' + c.slice(6); }
  function f6(c) { return c.slice(0, 4) + '.' + c.slice(4, 6); }
  function money(n) { return n.toLocaleString('en-US', { maximumFractionDigits: 0 }); }
  var CH = { 28: 'Inorganic chemicals', 29: 'Organic chemicals', 33: 'Perfumery and cosmetics', 34: 'Soap and cleaning preparations', 35: 'Glues and enzymes', 39: 'Plastics', 40: 'Rubber and tyres', 42: 'Leather goods and bags', 48: 'Paper and paperboard', 49: 'Printed matter', 50: 'Silk', 51: 'Wool', 52: 'Cotton', 53: 'Other vegetable fibres', 54: 'Man-made filaments', 55: 'Man-made staple fibres', 56: 'Wadding, felt, twine', 57: 'Carpets', 58: 'Special woven fabrics', 59: 'Coated textile fabrics', 60: 'Knitted fabrics', 61: 'Knitted garments', 62: 'Woven garments', 63: 'Made-up textiles', 64: 'Footwear', 65: 'Headgear', 68: 'Stone and cement articles', 69: 'Ceramics', 70: 'Glass', 71: 'Jewellery and precious metals', 72: 'Iron and steel', 73: 'Articles of iron or steel', 74: 'Copper', 75: 'Nickel', 76: 'Aluminium', 82: 'Tools and cutlery', 83: 'Misc. metal articles', 84: 'Machinery', 85: 'Electrical equipment', 87: 'Vehicles and parts', 88: 'Aircraft and parts', 90: 'Instruments', 92: 'Musical instruments', 94: 'Furniture and lighting', 95: 'Toys and sports goods', 96: 'Misc. manufactured articles' };
  var css = '#mx-root{font-family:Geist,system-ui,sans-serif;color:#0B2A4A}.mx-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:26px;margin-bottom:16px}.mx-h{font-family:Archivo,sans-serif;font-weight:800;font-size:20px;margin:0 0 8px}.mx-s{font-size:15px;line-height:1.55;color:#3D5873;margin:0 0 14px}.mx-lab{display:block;font-size:13px;font-weight:600;color:#3D5873;margin:14px 0 6px}' +
    '.mx-in{display:flex;gap:8px}.mx-in input,.mx-v{flex:1;min-width:0;border:1.5px solid #CFE0EF;border-radius:16px;padding:14px 16px;font:600 18px Geist,system-ui,sans-serif;color:#0B2A4A;min-height:54px;box-sizing:border-box}.mx-v{width:100%;font-size:16px;min-height:48px}.mx-x{border:0;border-radius:16px;background:#fff;box-shadow:inset 0 0 0 1.5px #F2B8B8;color:#B42318;font:700 15px Geist,system-ui,sans-serif;padding:0 16px;cursor:pointer}' +
    '.mx-row{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}.mx-p{border:1.5px solid #CFE0EF;background:#F1F8FF;color:#0B2A4A;border-radius:999px;padding:9px 15px;font:600 14px Geist,system-ui,sans-serif;cursor:pointer;min-height:42px}.mx-p small{font-weight:500;color:#5E7891;margin-left:5px}' +
    '.mx-pills{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 4px}.mx-pill{background:#F1F8FF;border:1px solid #D6E6F4;border-radius:12px;padding:8px 12px;font-size:13.5px;line-height:1.35}.mx-pill b{display:block;font-family:Archivo,sans-serif;font-size:17px}' +
    '.mx-yes,.mx-no{border-radius:16px;padding:14px 16px;margin:0 0 14px;font-size:15px;line-height:1.5}.mx-yes{background:#FFF4E5;border:1px solid #F5C98A;color:#6B3D00}.mx-no{background:#EEF8F1;border:1px solid #BFE3CB;color:#14532D}.mx-yes b,.mx-no b{display:block;font-family:Archivo,sans-serif;font-size:18px;margin-bottom:2px}' +
    '.mx-line{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-top:1px solid #EEF4FA}.mx-line.hit{background:#FFFBEA;margin:0 -10px;padding:12px 10px;border-radius:12px}.mx-rate{flex:none;width:78px;text-align:center;border-radius:14px;padding:9px 4px;background:#0B2A4A;color:#fff;font:800 22px Archivo,sans-serif}.mx-rate small{display:block;font:500 10.5px Geist,system-ui,sans-serif;opacity:.85;margin-top:1px}.mx-rate.nil{background:#EEF8F1;color:#14532D}.mx-t{font-size:15px;line-height:1.45;min-width:0}.mx-t b{font-family:"Geist Mono",monospace;font-size:15px}.mx-t i{font-style:normal;color:#5E7891;font-size:13px;display:block;margin-top:3px}.mx-t em{font-style:normal;display:block;margin-top:4px;font-weight:600;color:#0A6CC2;font-size:14px}.mx-t u{text-decoration:none;display:block;margin-top:4px;font-size:13px;color:#6B3D00;background:#FFF4E5;border-radius:8px;padding:6px 8px}' +
    '.mx-pick{display:block;width:100%;text-align:left;border:1px solid #E1EDF7;background:#fff;border-radius:14px;padding:12px 14px;margin-bottom:8px;cursor:pointer;font:500 15px Geist,system-ui,sans-serif;color:#0B2A4A}.mx-pick b{font-family:"Geist Mono",monospace;margin-right:8px}.mx-pick span{display:block;font-size:13px;color:#5E7891;margin-top:2px}.mx-det{margin-top:16px}.mx-det summary{cursor:pointer;font-weight:700;font-size:15px;color:#0A6CC2;min-height:32px}.mx-src{font-size:13px;line-height:1.5;color:#5E7891;margin:14px 0 0}.mx-src a{color:#0A6CC2}@media (max-width:640px){.mx-card{padding:18px;border-radius:18px}}';
  var st = D.createElement('style'); st.textContent = css; D.head.appendChild(st);
  var S = { q: '', v: '' }, DB = null, EN = null, loading = null;
  try { var sv = JSON.parse(localStorage.getItem('ck_mx_v1') || 'null'); if (sv) S = sv; } catch (e) {}
  function save() { try { localStorage.setItem('ck_mx_v1', JSON.stringify(S)); } catch (e) {} }
  root.innerHTML = '<div class="mx-card"><div class="mx-pills" id="mx-pills"></div><label class="mx-lab" for="mx-q">HS code, Indian HSN, Mexican tariff line, or product</label><div class="mx-in"><input id="mx-q" type="text" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. 8708 or cotton shirts" value="' + h(S.q) + '"><button type="button" class="mx-x" id="mx-clear">✕ Clear</button></div><label class="mx-lab" for="mx-v">Customs value in US dollars (optional, to see the duty)</label><input class="mx-v" id="mx-v" inputmode="decimal" autocomplete="off" placeholder="e.g. 10000" value="' + h(S.v) + '"><details class="mx-det"><summary>Browse by chapter</summary><div class="mx-row" id="mx-ch"></div></details></div><div class="mx-card" id="mx-out" aria-live="polite"><p class="mx-s" style="margin:0">Loading the list…</p></div>';
  var Q = D.getElementById('mx-q'), V = D.getElementById('mx-v'), OUT = D.getElementById('mx-out');
  function load() {
    if (!loading) loading = fetch('mx-tariff-2026.json?v=1').then(function (x) { return x.json(); }).then(function (j) {
      var by6 = {}, by4 = {}, by2 = {}; j.r.forEach(function (r) { (by6[r[0].slice(0, 6)] = by6[r[0].slice(0, 6)] || []).push(r); (by4[r[0].slice(0, 4)] = by4[r[0].slice(0, 4)] || []).push(r); by2[r[0].slice(0, 2)] = (by2[r[0].slice(0, 2)] || 0) + 1; });
      DB = { j: j, by6: by6, by4: by4, by2: by2 };
      fetch('hs6-en.json?v=1').then(function (x) { return x.json(); }).then(function (e) { EN = e; if (S.q) find(); }).catch(function () {});
      return DB;
    });
    return loading;
  }
  function label6(k) { return (EN && EN.s[k]) || ''; }
  function val() { var n = parseFloat(String(S.v || '').replace(/[, ]/g, '')); return n > 0 ? n : 0; }
  function line(r, hit) {
    var nil = r[3] === 'Ex.', d = DB.j.d[r[4]], v = val();
    return '<div class="mx-line' + (hit ? ' hit' : '') + '"><div class="mx-rate' + (nil ? ' nil' : '') + '">' + (nil ? 'Nil' : h(r[3]) + '%') + '<small>from ' + h(d.from) + '</small></div><div class="mx-t"><b>' + f8(r[0]) + '</b><br><span lang="es">' + h(r[1]) + '</span><i>Unit: ' + h(r[2]) + ' · Decree of ' + h(d.pub) + '</i>' + (v && !nil ? '<em>Duty on US$ ' + money(v) + ': US$ ' + money(v * parseFloat(r[3]) / 100) + '</em>' : '') + (r[5] ? '<u>' + h(r[5]) + '</u>' : '') + '</div></div>';
  }
  function src() { var d = DB.j.d; return '<p class="mx-src">Source: Mexico’s official gazette (Diario Oficial de la Federación), decrees of <a href="' + h(d[0].u) + '" target="_blank" rel="noopener">' + h(d[0].pub) + '</a> and <a href="' + h(d[1].u) + '" target="_blank" rel="noopener">' + h(d[1].pub) + '</a>, as kept by the Chamber of Deputies. Texts are shown in Spanish as published. Read ' + h(DB.j.read) + '. ' + h(DB.j.other) + ' The duty shown is the general import duty only. Other Mexican charges and taxes are not included.</p>'; }
  function show6(k, typed) {
    var rs = DB.by6[k] || [], en = label6(k), o = '<h2 class="mx-h">HS ' + f6(k) + '</h2>' + (en ? '<p class="mx-s">' + h(en) + '</p>' : '');
    if (rs.length) {
      var exact = typed && typed.length === 8 && rs.some(function (r) { return r[0] === typed; });
      o += '<div class="mx-yes"><b>Yes. ' + rs.length + (rs.length === 1 ? ' Mexican line' : ' Mexican lines') + ' under these six digits ' + (rs.length === 1 ? 'is' : 'are') + ' in the 2026 decrees.</b>The rate shown is Mexico’s general import duty, which applies to goods of Indian origin. Mexico adds its own last two digits, so ask your buyer which line the goods fall under.</div>';
      o += rs.map(function (r) { return line(r, exact && r[0] === typed); }).join('');
    } else {
      var nb = (DB.by4[k.slice(0, 4)] || []);
      o += '<div class="mx-no"><b>No line under these six digits is in the two decrees.</b>This does not mean nil duty. Mexico’s earlier general rate for the line still applies. Ask your buyer or the Mexican customs broker for the rate in force.</div>';
      if (nb.length) { var g = {}; nb.forEach(function (r) { g[r[0].slice(0, 6)] = (g[r[0].slice(0, 6)] || 0) + 1; }); o += '<p class="mx-s" style="margin:0 0 8px"><b>Raised lines in the same heading ' + k.slice(0, 2) + '.' + k.slice(2, 4) + '</b></p>' + Object.keys(g).sort().map(function (x) { return pick(x, g[x]); }).join(''); }
    }
    OUT.innerHTML = o + src(); bind();
  }
  function pick(k, n) { var rs = DB.by6[k], lo = 999, hi = 0, en = label6(k); rs.forEach(function (r) { var x = r[3] === 'Ex.' ? 0 : parseFloat(r[3]); if (x < lo) lo = x; if (x > hi) hi = x; }); return '<button type="button" class="mx-pick" data-6="' + k + '"><b>' + f6(k) + '</b>' + (lo === hi ? hi + '%' : lo + '% to ' + hi + '%') + ' · ' + rs.length + (rs.length === 1 ? ' line' : ' lines') + '<span>' + h(en || rs[0][1]) + '</span></button>'; }
  function bind() { OUT.querySelectorAll('[data-6]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-6'); S.q = k; Q.value = k; save(); show6(k); window.scrollTo(0, OUT.getBoundingClientRect().top + window.scrollY - 90); }; }); }
  function groups(keys, head) { OUT.innerHTML = '<p class="mx-s">' + head + '</p>' + keys.slice(0, 60).map(function (k) { return pick(k); }).join('') + (keys.length > 60 ? '<p class="mx-s">Showing 60 of ' + keys.length + '. Type more digits or another word to narrow it.</p>' : '') + src(); bind(); }
  function find() {
    if (!DB) { load().then(find).catch(function () { OUT.innerHTML = '<p class="mx-s" style="margin:0">The list could not be loaded. Check your connection and try again.</p>'; }); return; }
    var raw = (S.q || '').trim(), dig = raw.replace(/[^0-9]/g, ''), isNum = /^[0-9 .]+$/.test(raw);
    if (!raw) { OUT.innerHTML = '<h2 class="mx-h">Check a product</h2><p class="mx-s" style="margin:0">Type a code or a product above, or browse by chapter. The list covers ' + DB.j.r.length.toLocaleString('en-US') + ' Mexican tariff lines.</p>' + src(); return; }
    if (isNum && dig.length >= 6) { show6(dig.slice(0, 6), dig.slice(0, 8)); return; }
    if (isNum && dig.length >= 2) {
      var ks = Object.keys(DB.by6).filter(function (k) { return k.indexOf(dig) === 0; }).sort(), n = 0; ks.forEach(function (k) { n += DB.by6[k].length; });
      if (!ks.length) { OUT.innerHTML = '<div class="mx-no"><b>No line starting with ' + h(dig) + ' is in the two decrees.</b>This does not mean nil duty. Mexico’s earlier general rate still applies.</div>' + src(); return; }
      groups(ks, (dig.length === 2 ? 'Chapter ' + dig + (CH[+dig] ? ', ' + CH[+dig] : '') : 'Codes starting with ' + h(dig)) + ': ' + n + ' raised lines in ' + ks.length + ' six-digit groups. Pick one.'); return;
    }
    if (raw.length < 3) { OUT.innerHTML = '<p class="mx-s" style="margin:0">Type at least three letters or two digits.</p>'; return; }
    var toks = norm(raw).split(' ').filter(Boolean), sc = {};
    Object.keys(DB.by6).forEach(function (k) { var en = norm(label6(k) + ' ' + ((EN && EN.h[k.slice(0, 4)]) || '')), es = norm(DB.by6[k].map(function (r) { return r[1]; }).join(' ')), all = en + ' ' + es; for (var i = 0; i < toks.length; i++) if (all.indexOf(toks[i]) < 0) return; sc[k] = 1; });
    var hit = Object.keys(sc).sort();
    if (!hit.length) { OUT.innerHTML = '<p class="mx-s" style="margin:0">Nothing found for “' + h(raw) + '” among the raised lines. Try a simpler word, a Spanish word, or the HS code. A product that is not found may simply not be in the decrees.</p>' + src(); return; }
    groups(hit, hit.length + (hit.length === 1 ? ' group' : ' groups') + ' of raised lines match “' + h(raw) + '”. Pick one.');
  }
  var tm = null;
  Q.oninput = function () { S.q = Q.value; save(); clearTimeout(tm); tm = setTimeout(find, 180); };
  V.oninput = function () { S.v = V.value; save(); clearTimeout(tm); tm = setTimeout(find, 180); };
  D.getElementById('mx-clear').onclick = function () { S = { q: '', v: '' }; Q.value = ''; V.value = ''; save(); find(); Q.focus(); };
  load().then(function () {
    var d = DB.j.d; D.getElementById('mx-pills').innerHTML = '<div class="mx-pill"><b>' + d[0].n.toLocaleString('en-US') + ' lines</b>from ' + h(d[0].from) + '</div><div class="mx-pill"><b>' + d[1].n + ' lines</b>from ' + h(d[1].from) + '</div><div class="mx-pill"><b>Up to 50%</b>general duty</div>';
    D.getElementById('mx-ch').innerHTML = Object.keys(DB.by2).sort().map(function (c) { return '<button type="button" class="mx-p" data-c="' + c + '">' + c + ' ' + h(CH[+c] || '') + '<small>' + DB.by2[c] + '</small></button>'; }).join('');
    D.getElementById('mx-ch').querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { S.q = b.getAttribute('data-c'); Q.value = S.q; save(); find(); window.scrollTo(0, OUT.getBoundingClientRect().top + window.scrollY - 90); }; });
    find();
  }).catch(function () { OUT.innerHTML = '<p class="mx-s" style="margin:0">The list could not be loaded. Check your connection and try again.</p>'; });
})();
