/* Trade agreement preference checker: does a product get a duty preference in MERCOSUR or Chile when it is of Indian origin?
   Data: Annex I of the India-MERCOSUR PTA and Annex B1 of the India-Chile PTA, built into pta-data.json. Runs on the device. */
(function () {
  'use strict';
  var D = document, root = D.getElementById('pta-root'); if (!root) return;
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function f8(c) { return c.slice(0, 4) + '.' + c.slice(4, 6) + '.' + c.slice(6); }
  function f6(c) { return c.slice(0, 4) + '.' + c.slice(4, 6); }
  function pc(n) { return (Math.round(n * 100) / 100) + '%'; }
  var css = '#pta-root{font-family:Geist,system-ui,sans-serif;color:#0B2A4A}.pt-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:26px;margin-bottom:16px}.pt-h{font-family:Archivo,sans-serif;font-weight:800;font-size:20px;margin:0 0 8px}.pt-s{font-size:15px;line-height:1.55;color:#3D5873;margin:0 0 14px}.pt-lab{display:block;font-size:13px;font-weight:600;color:#3D5873;margin:14px 0 6px}' +
    '.pt-in{display:flex;gap:8px}.pt-in input{flex:1;min-width:0;border:1.5px solid #CFE0EF;border-radius:16px;padding:14px 16px;font:600 18px Geist,system-ui,sans-serif;color:#0B2A4A;min-height:54px;box-sizing:border-box}.pt-x{border:0;border-radius:16px;background:#fff;box-shadow:inset 0 0 0 1.5px #F2B8B8;color:#B42318;font:700 15px Geist,system-ui,sans-serif;padding:0 16px;cursor:pointer}' +
    '.pt-row{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}.pt-p{border:1.5px solid #CFE0EF;background:#F1F8FF;color:#0B2A4A;border-radius:999px;padding:9px 15px;font:600 14px Geist,system-ui,sans-serif;cursor:pointer;min-height:42px}' +
    '.pt-pills{display:flex;flex-wrap:wrap;gap:8px}.pt-pill{background:#F1F8FF;border:1px solid #D6E6F4;border-radius:12px;padding:8px 12px;font-size:13.5px;line-height:1.35}.pt-pill b{display:block;font-family:Archivo,sans-serif;font-size:17px}' +
    '.pt-ag{border:1px solid #E1EDF7;border-radius:18px;padding:16px;margin:0 0 14px}.pt-ag h3{font-family:Archivo,sans-serif;font-weight:800;font-size:17px;margin:0 0 2px}.pt-ag .w{font-size:13px;color:#5E7891;margin:0 0 10px}.pt-yes,.pt-no{border-radius:12px;padding:10px 12px;font-size:14.5px;line-height:1.45;margin:0 0 6px}.pt-yes{background:#EEF8F1;border:1px solid #BFE3CB;color:#14532D}.pt-no{background:#F4F6F8;border:1px solid #DDE3EA;color:#3D5873}.pt-mid{border-radius:12px;padding:10px 12px;font-size:14.5px;line-height:1.45;margin:0 0 6px;background:#FFF4E5;border:1px solid #F5C98A;color:#6B3D00}.pt-yes b,.pt-no b,.pt-mid b{display:block;font-size:15.5px}' +
    '.pt-line{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-top:1px solid #EEF4FA}.pt-m{flex:none;width:78px;text-align:center;border-radius:14px;padding:9px 4px;background:#14532D;color:#fff;font:800 22px Archivo,sans-serif}.pt-m small{display:block;font:500 10.5px Geist,system-ui,sans-serif;opacity:.9;margin-top:1px}.pt-m.v{background:#6B3D00;font-size:16px}.pt-t{font-size:15px;line-height:1.45;min-width:0}.pt-t b{font-family:"Geist Mono",monospace;font-size:15px}.pt-t em{font-style:normal;display:block;margin-top:4px;font-weight:600;color:#0A6CC2;font-size:14px}.pt-t u{text-decoration:none;display:block;margin-top:4px;font-size:13px;color:#6B3D00;background:#FFF4E5;border-radius:8px;padding:6px 8px}' +
    '.pt-pick{display:block;width:100%;text-align:left;border:1px solid #E1EDF7;background:#fff;border-radius:14px;padding:12px 14px;margin-bottom:8px;cursor:pointer;font:500 15px Geist,system-ui,sans-serif;color:#0B2A4A}.pt-pick b{font-family:"Geist Mono",monospace;margin-right:8px}.pt-pick span{display:block;font-size:13px;color:#5E7891;margin-top:2px}.pt-pick i{font-style:normal;display:inline-block;background:#EEF8F1;color:#14532D;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:700;margin-right:6px}.pt-src{font-size:13px;line-height:1.5;color:#5E7891;margin:14px 0 0}.pt-src a{color:#0A6CC2}@media (max-width:640px){.pt-card{padding:18px;border-radius:18px}}';
  var st = D.createElement('style'); st.textContent = css; D.head.appendChild(st);
  var EX = ['3004', '8708', '6205', 'cumin', 'tyres', 'medicaments'];
  var S = { q: '' }, DB = null, EN = null, loading = null;
  try { var sv = JSON.parse(localStorage.getItem('ck_pta_v1') || 'null'); if (sv) S = sv; } catch (e) {}
  function save() { try { localStorage.setItem('ck_pta_v1', JSON.stringify(S)); } catch (e) {} }
  root.innerHTML = '<div class="pt-card"><div class="pt-pills" id="pt-pills"></div><label class="pt-lab" for="pt-q">HS code, Indian HSN or product</label><div class="pt-in"><input id="pt-q" type="text" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. 3004 or cotton shirts" value="' + h(S.q) + '"><button type="button" class="pt-x" id="pt-clear">✕ Clear</button></div><div class="pt-row">' + EX.map(function (e) { return '<button type="button" class="pt-p" data-e="' + h(e) + '">' + h(e) + '</button>'; }).join('') + '</div></div><div class="pt-card" id="pt-out" aria-live="polite"><p class="pt-s" style="margin:0">Loading the lists…</p></div>';
  var Q = D.getElementById('pt-q'), OUT = D.getElementById('pt-out');
  function load() {
    if (!loading) loading = fetch('pta-data.json?v=1').then(function (x) { return x.json(); }).then(function (j) {
      j.a.forEach(function (a) { a.by6 = {}; a.r.forEach(function (r) { (a.by6[r[0].slice(0, 6)] = a.by6[r[0].slice(0, 6)] || []).push(r); }); });
      DB = j;
      fetch('hs6-en.json?v=1').then(function (x) { return x.json(); }).then(function (e) { EN = e; if (S.q) find(); }).catch(function () {});
      return DB;
    });
    return loading;
  }
  function label6(k) { return (EN && EN.s[k]) || ''; }
  function line(a, r) {
    var mer = a.k === 'mercosur', m = r[2], split = m === -1, note = mer ? r[3] : (split ? '' : r[3]), txt = mer ? h(r[1]) : '<span lang="es">' + h(r[1]) + '</span>', badge, extra = '';
    if (split) { badge = '<div class="pt-m v">' + (r[3] === r[4] ? r[4] + '%' : r[3] + '–' + r[4] + '%') + '<small>depends</small></div>'; note = 'The margin for this code depends on the exact product. Read the entry in the official list.'; }
    else badge = '<div class="pt-m">' + m + '%<small>off the duty</small></div>';
    if (!mer && !split && a.gen) extra = '<em>' + (m === 100 ? 'Duty nil instead of ' + a.gen + '%' : 'Duty ' + pc(a.gen * (100 - m) / 100) + ' instead of ' + a.gen + '%') + '</em>';
    return '<div class="pt-line">' + badge + '<div class="pt-t"><b>' + f8(r[0]) + '</b><br>' + txt + extra + (note ? '<u>' + h(note) + '</u>' : '') + '</div></div>';
  }
  function src() {
    return '<p class="pt-src">Sources: ' + DB.a.map(function (a) { return h(a.list) + ', as published by <a href="' + h(a.u) + '" target="_blank" rel="noopener">' + h(a.by) + '</a> (codes of ' + h(a.hs) + ')'; }).join('; ') + '. Read ' + h(DB.read) + '. The preference applies only to goods that meet the agreement’s rules of origin and arrive with its certificate of origin. Codes in these lists are older than today’s tariff, so the importer’s customs broker confirms the match.</p>';
  }
  function show6(k) {
    var en = label6(k), o = '<h2 class="pt-h">HS ' + f6(k) + '</h2>' + (en ? '<p class="pt-s">' + h(en) + '</p>' : '');
    DB.a.forEach(function (a) {
      var rs = a.by6[k] || [];
      o += '<div class="pt-ag"><h3>' + h(a.k === 'mercosur' ? 'MERCOSUR' : 'Chile') + '</h3><p class="w">' + h(a.who === 'Chile' ? a.n : a.who) + ' · in force since ' + h(a.since) + '</p>';
      if (rs.length) o += '<div class="pt-yes"><b>Yes. ' + rs.length + (rs.length === 1 ? ' line' : ' lines') + ' under these six digits ' + (rs.length === 1 ? 'has' : 'have') + ' a preference.</b>The last two digits are the importing country’s own. Match your product to the description.</div>' + rs.map(function (r) { return line(a, r); }).join('');
      else {
        var hd = []; Object.keys(a.by6).sort().forEach(function (x) { if (x.slice(0, 4) === k.slice(0, 4)) hd = hd.concat(a.by6[x]); });
        if (hd.length) o += '<div class="pt-mid"><b>Not under these six digits, but heading ' + k.slice(0, 2) + '.' + k.slice(2, 4) + ' has ' + hd.length + ' listed ' + (hd.length === 1 ? 'line' : 'lines') + '.</b>This list uses ' + h(a.hs) + ' codes, and some numbers have changed since. Check whether one of these descriptions is your product.</div>' + hd.slice(0, 12).map(function (r) { return line(a, r); }).join('') + (hd.length > 12 ? '<p class="pt-s" style="margin:8px 0 0;font-size:13.5px">and ' + (hd.length - 12) + ' more. Type ' + k.slice(0, 4) + ' to see the groups.</p>' : '');
        else o += '<div class="pt-no"><b>Nothing in heading ' + k.slice(0, 2) + '.' + k.slice(2, 4) + ' is in the list.</b>The normal duty applies.</div>';
      }
      o += '</div>';
    });
    OUT.innerHTML = o + src(); 
  }
  function pick(k) { var tags = '', d = ''; DB.a.forEach(function (a) { var rs = a.by6[k]; if (rs) { tags += '<i>' + (a.k === 'mercosur' ? 'MERCOSUR' : 'Chile') + ' ' + rs.length + '</i>'; if (!d) d = rs[0][1]; } }); return '<button type="button" class="pt-pick" data-6="' + k + '"><b>' + f6(k) + '</b>' + tags + '<span>' + h(label6(k) || d) + '</span></button>'; }
  function bind() { OUT.querySelectorAll('[data-6]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-6'); S.q = k; Q.value = k; save(); show6(k); window.scrollTo(0, OUT.getBoundingClientRect().top + window.scrollY - 90); }; }); }
  function groups(keys, head) { OUT.innerHTML = '<p class="pt-s">' + head + '</p>' + keys.slice(0, 60).map(pick).join('') + (keys.length > 60 ? '<p class="pt-s">Showing 60 of ' + keys.length + '. Type more digits or another word to narrow it.</p>' : '') + src(); bind(); }
  function allKeys() { var m = {}; DB.a.forEach(function (a) { Object.keys(a.by6).forEach(function (k) { m[k] = 1; }); }); return Object.keys(m).sort(); }
  function find() {
    if (!DB) { load().then(find).catch(function () { OUT.innerHTML = '<p class="pt-s" style="margin:0">The lists could not be loaded. Check your connection and try again.</p>'; }); return; }
    var raw = (S.q || '').trim(), dig = raw.replace(/[^0-9]/g, ''), isNum = /^[0-9 .]+$/.test(raw);
    if (!raw) { OUT.innerHTML = '<h2 class="pt-h">Check a product</h2><p class="pt-s" style="margin:0">Type a code or a product above. The result shows whether goods of Indian origin get a lower duty in MERCOSUR or in Chile, and by how much.</p>' + src(); return; }
    if (isNum && dig.length >= 6) { show6(dig.slice(0, 6)); return; }
    if (isNum && dig.length >= 2) {
      var ks = allKeys().filter(function (k) { return k.indexOf(dig) === 0; });
      if (!ks.length) { OUT.innerHTML = '<div class="pt-no"><b>No listed line starts with ' + h(dig) + '.</b>The normal duty applies in MERCOSUR and in Chile.</div>' + src(); return; }
      groups(ks, 'Codes starting with ' + h(dig) + ': ' + ks.length + ' six-digit groups have a preference. Pick one.'); return;
    }
    if (raw.length < 3) { OUT.innerHTML = '<p class="pt-s" style="margin:0">Type at least three letters or two digits.</p>'; return; }
    var toks = norm(raw).split(' ').filter(Boolean), hit = [], sc = {};
    allKeys().forEach(function (k) { var own = norm(label6(k) + ' ' + DB.a.map(function (a) { return (a.by6[k] || []).map(function (r) { return r[1]; }).join(' '); }).join(' ')), all = own + ' ' + norm((EN && EN.h[k.slice(0, 4)]) || ''), inOwn = true; for (var i = 0; i < toks.length; i++) { if (all.indexOf(toks[i]) < 0) return; if (own.indexOf(toks[i]) < 0) inOwn = false; } sc[k] = inOwn ? 1 : 0; hit.push(k); });
    hit.sort(function (x, y) { return sc[y] - sc[x] || (x < y ? -1 : 1); });
    if (!hit.length) { OUT.innerHTML = '<p class="pt-s" style="margin:0">Nothing found for “' + h(raw) + '” in the two lists. Try a simpler word or the HS code. A product that is not found may simply have no preference.</p>' + src(); return; }
    groups(hit, hit.length + (hit.length === 1 ? ' group' : ' groups') + ' with a preference match “' + h(raw) + '”. Pick one.');
  }
  var tm = null;
  Q.oninput = function () { S.q = Q.value; save(); clearTimeout(tm); tm = setTimeout(find, 180); };
  D.getElementById('pt-clear').onclick = function () { S = { q: '' }; Q.value = ''; save(); find(); Q.focus(); };
  root.querySelectorAll('[data-e]').forEach(function (b) { b.onclick = function () { S.q = b.getAttribute('data-e'); Q.value = S.q; save(); find(); }; });
  load().then(function () {
    D.getElementById('pt-pills').innerHTML = DB.a.map(function (a) { return '<div class="pt-pill"><b>' + a.r.length.toLocaleString('en-US') + ' lines</b>' + (a.k === 'mercosur' ? 'MERCOSUR, 10% to 100% off' : 'Chile, 30% to 100% off') + '</div>'; }).join('');
    find();
  }).catch(function () { OUT.innerHTML = '<p class="pt-s" style="margin:0">The lists could not be loaded. Check your connection and try again.</p>'; });
})();
