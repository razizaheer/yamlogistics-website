/* Brazil NCM finder: from an Indian HSN code or product words to Brazil's 8-digit NCM codes.
   The first six digits (the HS code) are the same in both countries; the tool matches on them.
   NCM texts are shown exactly as Siscomex publishes them, in Portuguese. Runs on the device. */
(function () {
  'use strict';
  var D = document, root = D.getElementById('nb-root'); if (!root) return;
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pt(s) { return h(s).replace(/&lt;(\/?)(i|b|sub|sup)&gt;/gi, '<$1$2>'); }
  function tail(p) { var i = p.indexOf(' \u203A '); return i > 0 ? p.slice(i + 3) : p; }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function fmt(c) { return c.length === 8 ? c.slice(0, 4) + '.' + c.slice(4, 6) + '.' + c.slice(6) : c.length >= 5 ? c.slice(0, 4) + '.' + c.slice(4) : c.length === 4 ? c.slice(0, 2) + '.' + c.slice(2) : c; }
  var css = '#nb-root{font-family:Geist,system-ui,sans-serif;color:#0B2A4A}.nb-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:26px;margin-bottom:16px}.nb-h{font-family:Archivo,sans-serif;font-weight:800;font-size:20px;margin:0 0 6px}.nb-s{font-size:15px;line-height:1.55;color:#3D5873;margin:0 0 14px}' +
    '.nb-in{display:flex;gap:8px}.nb-in input{flex:1;min-width:0;border:1.5px solid #CFE0EF;border-radius:16px;padding:14px 16px;font:600 18px Geist,system-ui,sans-serif;color:#0B2A4A;min-height:54px}.nb-x{border:0;border-radius:16px;background:#fff;box-shadow:inset 0 0 0 1.5px #F2B8B8;color:#B42318;font:700 15px Geist,system-ui,sans-serif;padding:0 16px;cursor:pointer}' +
    '.nb-row{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}.nb-p{border:1.5px solid #CFE0EF;background:#F1F8FF;color:#0B2A4A;border-radius:999px;padding:9px 15px;font:600 14px Geist,system-ui,sans-serif;cursor:pointer;min-height:42px}' +
    '.nb-pick{display:block;width:100%;text-align:left;border:1px solid #E1EDF7;background:#fff;border-radius:14px;padding:12px 14px;margin-bottom:8px;cursor:pointer;font:500 15px Geist,system-ui,sans-serif;color:#0B2A4A}.nb-pick b{font-family:"Geist Mono",monospace;font-size:15px;margin-right:8px}.nb-pick span{display:block;font-size:13px;color:#5E7891;margin-top:2px}' +
    '.nb-line{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-top:1px solid #EEF4FA}.nb-line:first-of-type{border-top:0}.nb-c{flex:none;min-width:112px;text-align:center;border-radius:12px;padding:8px 6px;font:700 15.5px "Geist Mono",monospace;border:0}.nb-c8{background:#0B2A4A;color:#fff;cursor:pointer}.nb-c0{background:#F1F8FF;color:#3D5873}.nb-c small{display:block;font:500 10px Geist,system-ui,sans-serif;opacity:.8;margin-top:2px}.nb-t{font-size:15px;line-height:1.45}.nb-t.g{color:#5E7891;font-size:14px}' +
    '.nb-two{background:#F7FBFF;border:1px solid #D6E6F4;border-radius:16px;padding:14px 16px;margin:0 0 14px;font-size:14.5px;line-height:1.5}.nb-two b{font-family:"Geist Mono",monospace}.nb-det{margin:18px 0 0;border-top:1px solid #E1EDF7;padding-top:14px}.nb-det summary{cursor:pointer;font-weight:700;font-size:15px;color:#0A6CC2;min-height:32px}.nb-src{font-size:13px;line-height:1.5;color:#5E7891;margin:14px 0 0}@media (max-width:640px){.nb-card{padding:18px;border-radius:18px}.nb-c{min-width:100px;font-size:14.5px}}';
  var st = D.createElement('style'); st.textContent = css; D.head.appendChild(st);
  var EX = ['85171300', '30049099', '87089900', 'basmati rice', 'cotton yarn', 'smartphone', 'tyres'];
  var S = { q: '' }, DB = null, loading = null;
  try { var sv = JSON.parse(localStorage.getItem('ck_nb_v1') || 'null'); if (sv) S = sv; } catch (e) {}
  function save() { try { localStorage.setItem('ck_nb_v1', JSON.stringify(S)); } catch (e) {} }
  root.innerHTML = '<div class="nb-card"><p class="nb-s">Type an Indian HSN or HS code, or describe the product in English. You can also type Portuguese words.</p><div class="nb-in"><input id="nb-q" type="text" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="HSN code or product" value="' + h(S.q) + '"><button type="button" class="nb-x" id="nb-clear">✕ Clear</button></div><div class="nb-row">' + EX.map(function (e) { return '<button type="button" class="nb-p" data-e="' + h(e) + '">' + h(e) + '</button>'; }).join('') + '</div></div><div class="nb-card" id="nb-out" aria-live="polite"><p class="nb-s" style="margin:0">Results appear here.</p></div>';
  var Q = D.getElementById('nb-q'), OUT = D.getElementById('nb-out');
  function load() {
    if (!loading) loading = Promise.all([fetch('ncm-br.json?v=1').then(function (x) { return x.json(); }), fetch('hsn-data.json?v=2').then(function (x) { return x.json(); })]).then(function (r) {
      var by6 = {}; r[0].n.forEach(function (x) { if (x[0].length >= 4) { var k = x[0].slice(0, 4); (by6[k] = by6[k] || []).push(x); } });
      var hs = {}; r[1].rows.forEach(function (x) { var k = x[0].slice(0, 6); (hs[k] = hs[k] || []).push(x); });
      DB = { br: r[0], by4: by6, in6: hs, paths: r[1].paths, rows: r[1].rows }; return DB;
    });
    return loading;
  }
  function label6(k) { var r = DB.in6[k] || []; if (!r.length) return ''; var p = DB.paths[r[0][2]] || '', i = p.indexOf(' \u203A '); if (i > 0) return p.slice(i + 3); var d = []; r.forEach(function (x) { var t = x[1].replace(/\s*#omitted.*$/i, '').trim(); if (t && !/^[\d\s]+$/.test(t) && d.indexOf(t) < 0 && d.length < 3) d.push(t); }); return d.join('; ') + (r.length > d.length ? '\u2026' : ''); }
  function show6(hs6) {
    var h4 = hs6.slice(0, 4), all = DB.by4[h4] || [], lines = all.filter(function (x) { var c = x[0]; return c.length <= 5 ? hs6.indexOf(c) === 0 : c.slice(0, 6) === hs6; }), n8 = lines.filter(function (x) { return x[0].length === 8; });
    var ind = DB.in6[hs6] || [];
    if (!n8.length && !ind.length) { OUT.innerHTML = '<p class="nb-s" style="margin:0">No code starts with ' + h(fmt(hs6)) + ' in either list. Check the first six digits.</p>'; return; }
    var o = '<h2 class="nb-h">HS ' + h(hs6.slice(0, 4) + '.' + hs6.slice(4)) + '</h2><div class="nb-two">The first six digits, <b>' + h(hs6.slice(0, 4) + '.' + hs6.slice(4)) + '</b>, mean the same product group in India and Brazil. Each country adds its own last two digits, so the full 8-digit codes differ.</div>';
    o += '<p class="nb-s" style="margin:0 0 6px"><b>Brazil (NCM)</b> ' + (n8.length ? n8.length + (n8.length === 1 ? ' code' : ' codes') + '. Tap a dark code to copy it.' : '') + '</p>';
    o += n8.length ? lines.map(function (x) { var c = x[0], full = c.length === 8; return '<div class="nb-line">' + (full ? '<button type="button" class="nb-c nb-c8" data-c="' + fmt(c) + '">' + fmt(c) + '<small>NCM</small></button>' : '<div class="nb-c nb-c0">' + fmt(c) + '</div>') + '<div class="nb-t' + (full ? '' : ' g') + '" lang="pt">' + pt(x[1]) + '</div></div>'; }).join('') : '<p class="nb-s">No Brazilian code found under these six digits. Brazil may place the product under another subheading.</p>';
    if (ind.length) o += '<details class="nb-det"' + (ind.length <= 3 ? ' open' : '') + '><summary>India (ITC-HS) under the same six digits: ' + ind.length + (ind.length === 1 ? ' line' : ' lines') + '</summary>' + ind.map(function (x) { return '<div class="nb-line"><div class="nb-c nb-c0">' + x[0].slice(0, 4) + ' ' + x[0].slice(4, 6) + ' ' + x[0].slice(6) + '</div><div class="nb-t g">' + h(x[1]) + '<br><span style="font-size:12.5px">' + h(tail(DB.paths[x[2]] || '')) + '</span></div></div>'; }).join('') + '</details>';
    o += '<p class="nb-src">Brazilian codes and texts: Siscomex, Portal Único (' + h(DB.br.v) + ', ' + h(DB.br.ato) + '), shown as published, read ' + h(DB.br.read) + '. Indian lines: ' + h('Customs Tariff and ITC(HS)') + '. This matches codes only. It does not give Brazilian duty or tax rates, and the importer’s broker in Brazil decides the final NCM.</p>';
    OUT.innerHTML = o;
    OUT.querySelectorAll('.nb-c8').forEach(function (b) { b.onclick = function () { var c = b.getAttribute('data-c'); (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(c) : Promise.reject()).then(function () { var s = b.querySelector('small'); s.textContent = 'Copied'; setTimeout(function () { s.textContent = 'NCM'; }, 1200); }).catch(function () {}); }; });
  }
  function find() {
    var raw = S.q.trim(), dig = raw.replace(/[^0-9]/g, '');
    if (raw.length < 2) { OUT.innerHTML = '<p class="nb-s" style="margin:0">Results appear here.</p>'; return; }
    if (!DB) { OUT.innerHTML = '<p class="nb-s" style="margin:0">Loading the code lists…</p>'; load().then(find).catch(function () { OUT.innerHTML = '<p class="nb-s" style="margin:0">The code lists could not be loaded. Check your connection and try again.</p>'; }); return; }
    if (dig.length >= 6 && /^[0-9 .]+$/.test(raw)) { show6(dig.slice(0, 6)); return; }
    if (dig.length >= 4 && /^[0-9 .]+$/.test(raw)) {
      var h4 = dig.slice(0, 4), six = {}; (DB.by4[h4] || []).forEach(function (x) { if (x[0].length === 8) six[x[0].slice(0, 6)] = 1; });
      var ks = Object.keys(six).sort(); if (!ks.length) { OUT.innerHTML = '<p class="nb-s" style="margin:0">No Brazilian code starts with ' + h(h4) + '.</p>'; return; }
      OUT.innerHTML = '<p class="nb-s">Heading ' + h(h4.slice(0, 2) + '.' + h4.slice(2)) + ' has ' + ks.length + ' six-digit groups. Pick one, or type six digits.</p>' + ks.map(function (k) { return '<button type="button" class="nb-pick" data-6="' + k + '"><b>' + k.slice(0, 4) + '.' + k.slice(4) + '</b>' + h(label6(k).slice(0, 110)) + '</button>'; }).join(''); bindPick(); return;
    }
    var toks = norm(raw).split(' ').filter(Boolean), hit = {}, order = [];
    DB.rows.forEach(function (x) { var own = norm(x[1]), k = own + ' ' + norm(DB.paths[x[2]] || ''), inOwn = true; for (var i = 0; i < toks.length; i++) { if (k.indexOf(toks[i]) < 0) return; if (own.indexOf(toks[i]) < 0) inOwn = false; } var s = x[0].slice(0, 6); if (!hit[s]) { hit[s] = { n: 0, d: label6(s), pt: '' }; order.push(s); } hit[s].n += inOwn ? 20 : 1; });
    DB.br.n.forEach(function (x) { if (x[0].length !== 8) return; var k = norm(x[1].replace(/<[^>]+>/g, '')); for (var i = 0; i < toks.length; i++) if (k.indexOf(toks[i]) < 0) return; var s = x[0].slice(0, 6); if (!hit[s]) { hit[s] = { n: 0, d: '', pt: x[1] }; order.push(s); } else if (!hit[s].pt) hit[s].pt = x[1]; hit[s].n += 20; });
    if (!order.length) { OUT.innerHTML = '<p class="nb-s" style="margin:0">Nothing found for “' + h(raw) + '”. Try a simpler word, or type the HSN code.</p>'; return; }
    order.sort(function (a, b) { return hit[b].n - hit[a].n || (a < b ? -1 : 1); });
    OUT.innerHTML = '<p class="nb-s">' + (order.length > 30 ? 'Showing 30 of ' + order.length + ' product groups. Add a word to narrow it.' : order.length + (order.length === 1 ? ' product group.' : ' product groups.')) + ' Pick the one that fits.</p>' + order.slice(0, 30).map(function (k) { var x = hit[k]; return '<button type="button" class="nb-pick" data-6="' + k + '"><b>' + k.slice(0, 4) + '.' + k.slice(4) + '</b>' + h((x.d || x.pt).replace(/<[^>]+>/g, '').slice(0, 110)) + (x.d && x.pt ? '<span lang="pt">' + h(x.pt.replace(/<[^>]+>/g, '').slice(0, 90)) + '</span>' : '') + '</button>'; }).join(''); bindPick();
  }
  function bindPick() { OUT.querySelectorAll('[data-6]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-6'); S.q = k; Q.value = k; save(); show6(k); window.scrollTo(0, OUT.getBoundingClientRect().top + window.scrollY - 90); }; }); }
  var tm = null;
  Q.oninput = function () { S.q = Q.value; save(); clearTimeout(tm); tm = setTimeout(find, 180); };
  Q.onfocus = function () { load().catch(function () {}); };
  D.getElementById('nb-clear').onclick = function () { S.q = ''; Q.value = ''; save(); find(); Q.focus(); };
  root.querySelectorAll('[data-e]').forEach(function (b) { b.onclick = function () { S.q = b.getAttribute('data-e'); Q.value = S.q; save(); find(); }; });
  if (S.q) find();
})();
