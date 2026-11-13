/* Port, airport and location code finder. Seaports and inland depots come from UN/LOCODE (UNECE), airports from OurAirports.
   Both lists are loaded once and searched on the device. */
(function () {
  'use strict';
  var D = document, root = D.getElementById('pf-root'); if (!root) return;
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  var css = '#pf-root{font-family:Geist,system-ui,sans-serif;color:#0B2A4A}.pf-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:26px;margin-bottom:16px}.pf-s{font-size:15px;line-height:1.55;color:#3D5873;margin:0 0 14px}' +
    '.pf-in{display:flex;gap:8px}.pf-in input{flex:1;min-width:0;border:1.5px solid #CFE0EF;border-radius:16px;padding:14px 16px;font:600 18px Geist,system-ui,sans-serif;color:#0B2A4A;min-height:54px}.pf-x{border:0;border-radius:16px;background:#fff;box-shadow:inset 0 0 0 1.5px #F2B8B8;color:#B42318;font:700 15px Geist,system-ui,sans-serif;padding:0 16px;cursor:pointer}' +
    '.pf-row{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}.pf-p{border:1.5px solid #CFE0EF;background:#fff;color:#0B2A4A;border-radius:999px;padding:9px 15px;font:600 14.5px Geist,system-ui,sans-serif;cursor:pointer;min-height:42px}.pf-p.on{background:#0A6CC2;border-color:#0A6CC2;color:#fff}.pf-e{background:#F1F8FF;border-color:#CFE0EF;font-family:"Geist Mono",monospace;font-size:13.5px}' +
    '.pf-r{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-top:1px solid #EEF4FA}.pf-r:first-child{border-top:0}.pf-c{flex:none;min-width:86px;text-align:center;background:#0B2A4A;color:#fff;border-radius:14px;padding:10px 8px;font:700 19px "Geist Mono",monospace;letter-spacing:.04em;cursor:pointer;border:0}.pf-c small{display:block;font:500 10.5px Geist,system-ui,sans-serif;letter-spacing:.04em;opacity:.8;margin-top:3px}' +
    '.pf-n b{display:block;font-size:16.5px;line-height:1.3}.pf-n span{display:block;font-size:13.5px;color:#5E7891;margin-top:2px}.pf-n a{color:#0A6CC2;font-weight:600;text-decoration:none}.pf-t{display:inline-block;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:700;margin:6px 6px 0 0}.pf-t1{background:#E7F0FF;color:#0A4E96}.pf-t4{background:#FFF1CC;color:#7A4B00}.pf-t6{background:#EAF7EF;color:#17633A}.pf-in6{display:block;margin-top:6px;font-size:13.5px;color:#3D5873}.pf-in6 code{font:700 13.5px "Geist Mono",monospace;background:#F1F8FF;border-radius:6px;padding:1px 6px}' +
    '@media (max-width:640px){.pf-card{padding:18px;border-radius:18px}.pf-c{min-width:74px;font-size:17px}}';
  var st = D.createElement('style'); st.textContent = css; D.head.appendChild(st);
  var KINDS = [['all', 'All'], ['sea', 'Seaports'], ['air', 'Airports'], ['icd', 'ICDs and inland depots']];
  var EX = ['INNSA', 'INMUN', 'DEL', 'BOM', 'AEJEA', 'RUNVS', 'BRSSZ', 'MXVER', 'Santos', 'Tughlakabad', 'Hamburg', 'Dubai'];
  var S = { q: '', k: 'all' }, DB = null, loading = null;
  try { var sv = JSON.parse(localStorage.getItem('ck_pf_v1') || 'null'); if (sv) S = sv; } catch (e) {}
  function save() { try { localStorage.setItem('ck_pf_v1', JSON.stringify(S)); } catch (e) {} }

  root.innerHTML = '<div class="pf-card"><p class="pf-s">Type a port, airport or city, or a code such as INNSA, DEL or AEJEA.</p><div class="pf-in"><input id="pf-q" type="search" autocomplete="off" autocapitalize="characters" placeholder="Port, airport, city or code" value="' + h(S.q) + '"><button type="button" class="pf-x" id="pf-clear">✕ Clear</button></div>' +
    '<div class="pf-row" id="pf-kinds">' + KINDS.map(function (k) { return '<button type="button" class="pf-p' + (S.k === k[0] ? ' on' : '') + '" data-k="' + k[0] + '">' + k[1] + '</button>'; }).join('') + '</div>' +
    '<div class="pf-row" id="pf-ex">' + EX.map(function (e) { return '<button type="button" class="pf-p pf-e" data-e="' + h(e) + '">' + h(e) + '</button>'; }).join('') + '</div></div><div class="pf-card" id="pf-out" aria-live="polite"><p class="pf-s" style="margin:0">Results appear here as you type.</p></div>';
  var Q = D.getElementById('pf-q'), OUT = D.getElementById('pf-out');

  function load() {
    if (!loading) loading = Promise.all([fetch('locode-ports.json?v=1').then(function (x) { return x.json(); }), fetch('airports.json?v=1').then(function (x) { return x.json(); })]).then(function (r) {
      var cn = r[0].c, rows = [];
      r[0].p.forEach(function (p) { var cc = p[0].slice(0, 2), f = p[3]; rows.push({ t: f.indexOf('1') >= 0 ? 'sea' : (f.indexOf('6') >= 0 || f.indexOf('2') >= 0) ? 'icd' : 'air', code: p[0], name: p[1], sub: p[2], cc: cc, cn: cn[cc] || cc, f: f, la: p[4], lo: p[5], k: norm(p[1] + ' ' + (cn[cc] || '')) }); });
      // UN/LOCODE airport-only rows are dropped where OurAirports has the airport, to avoid doubles
      rows = rows.filter(function (x) { return !(x.t === 'air'); });
      r[1].a.forEach(function (a) { rows.push({ t: 'air', code: a[0], icao: a[1], name: a[2], city: a[3], cc: a[4], cn: cn[a[4]] || a[4], la: a[5], lo: a[6], big: a[7] === 'l', k: norm(a[2] + ' ' + a[3] + ' ' + (cn[a[4]] || '')) }); });
      DB = { rows: rows, v: [r[0].v, r[1].v] }; return DB;
    });
    return loading;
  }
  function find() {
    var q = norm(S.q), up = S.q.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (q.length < 2) { OUT.innerHTML = '<p class="pf-s" style="margin:0">Results appear here as you type.</p>'; return; }
    if (!DB) { OUT.innerHTML = '<p class="pf-s" style="margin:0">Loading the code lists…</p>'; load().then(find).catch(function () { OUT.innerHTML = '<p class="pf-s" style="margin:0">The code lists could not be loaded. Check your connection and try again.</p>'; }); return; }
    var toks = q.split(' '), res = [];
    for (var i = 0; i < DB.rows.length; i++) {
      var x = DB.rows[i]; if (S.k !== 'all' && x.t !== S.k) continue;
      var sc = 0;
      if (x.code === up || (x.icao && x.icao === up)) sc = 100;
      else if (up.length >= 3 && x.code.indexOf(up) === 0) sc = up.length >= 4 ? 60 : 12;
      else { var ok = true; for (var j = 0; j < toks.length; j++) if (x.k.indexOf(toks[j]) < 0) { ok = false; break; } if (ok) sc = (x.k.indexOf(q) === 0 ? 40 : 20) + (x.big ? 8 : 0) + (x.t === 'sea' ? 4 : 0) + (x.cc === 'IN' ? 3 : 0); }
      if (sc) res.push([sc, x]);
    }
    res.sort(function (a, b) { return b[0] - a[0] || (a[1].name < b[1].name ? -1 : 1); });
    var n = res.length; res = res.slice(0, 40);
    if (!n) { OUT.innerHTML = '<p class="pf-s" style="margin:0">Nothing found for “' + h(S.q) + '”. Try the city name, or fewer letters.</p>'; return; }
    OUT.innerHTML = '<p class="pf-s">' + (n > 40 ? 'Showing the first 40 of ' + n.toLocaleString('en-IN') + ' matches. Add the country to narrow it.' : n + (n === 1 ? ' match.' : ' matches.')) + ' Tap a code to copy it.</p>' + res.map(function (r) { return card(r[1]); }).join('') +
      '<p class="pf-s" style="margin:16px 0 0;font-size:13px">Sources: ' + h(DB.v[0]) + '; ' + h(DB.v[1]) + '. Codes change, so confirm against your booking or carrier before you put one on a document.</p>';
    OUT.querySelectorAll('.pf-c').forEach(function (b) { b.onclick = function () { var c = b.getAttribute('data-c'); (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(c) : Promise.reject()).then(function () { var s = b.querySelector('small'), t = s.textContent; s.textContent = 'Copied'; setTimeout(function () { s.textContent = t; }, 1200); }).catch(function () {}); }; });
  }
  function card(x) {
    var map = x.la != null ? ' · <a href="https://www.openstreetmap.org/?mlat=' + x.la + '&mlon=' + x.lo + '#map=10/' + x.la + '/' + x.lo + '" target="_blank" rel="noopener">Map</a>' : '';
    if (x.t === 'air') return '<div class="pf-r"><button type="button" class="pf-c" data-c="' + x.code + '">' + x.code + '<small>IATA</small></button><div class="pf-n"><b>' + h(x.name) + '</b><span>' + h([x.city, x.cn].filter(Boolean).join(', ')) + (x.icao ? ' · ICAO ' + h(x.icao) : '') + map + '</span><span class="pf-t pf-t4">Airport</span>' + (x.cc === 'IN' ? '<span class="pf-in6">Indian customs air cargo code is usually <code>IN' + x.code + '4</code></span>' : '') + '</div></div>';
    var tags = (x.f.indexOf('1') >= 0 ? '<span class="pf-t pf-t1">Seaport</span>' : '') + (x.f.indexOf('6') >= 0 ? '<span class="pf-t pf-t6">ICD or multimodal</span>' : '') + (x.f.indexOf('2') >= 0 ? '<span class="pf-t pf-t6">Rail terminal</span>' : '') + (x.f.indexOf('4') >= 0 ? '<span class="pf-t pf-t4">Airport</span>' : '');
    var ind = x.cc === 'IN' ? '<span class="pf-in6">Indian customs location code is usually <code>' + x.code + (x.f.indexOf('1') >= 0 ? '1' : '6') + '</code>' + (x.f.indexOf('1') >= 0 && x.f.indexOf('6') >= 0 ? ' for the seaport' : '') + '</span>' : '';
    return '<div class="pf-r"><button type="button" class="pf-c" data-c="' + x.code + '">' + x.code.slice(0, 2) + ' ' + x.code.slice(2) + '<small>UN/LOCODE</small></button><div class="pf-n"><b>' + h(x.name) + '</b><span>' + h([x.sub, x.cn].filter(Boolean).join(', ')) + map + '</span>' + tags + ind + '</div></div>';
  }
  var tm = null;
  Q.oninput = function () { S.q = Q.value; save(); clearTimeout(tm); tm = setTimeout(find, 140); };
  Q.onfocus = function () { load().catch(function () {}); };
  D.getElementById('pf-clear').onclick = function () { S.q = ''; Q.value = ''; save(); find(); Q.focus(); };
  D.getElementById('pf-kinds').querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { S.k = b.getAttribute('data-k'); save(); D.getElementById('pf-kinds').querySelectorAll('[data-k]').forEach(function (q) { q.className = 'pf-p' + (q === b ? ' on' : ''); }); find(); }; });
  D.getElementById('pf-ex').querySelectorAll('[data-e]').forEach(function (b) { b.onclick = function () { S.q = b.getAttribute('data-e'); Q.value = S.q; save(); find(); }; });
  if (S.q) find();
})();
