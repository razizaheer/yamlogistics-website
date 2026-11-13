/* Transit times from India to about 150 countries. Latin America and Russia rows are YAM's own corridor figures.
   The other rows are estimates worked out from the sea distance (see the note under the list). Data is built into corridors.json.
   Runs on the device. */
(function () {
  'use strict';
  var D = document, root = D.getElementById('tt-root'); if (!root) return;
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  var MAXD = 70, MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fd(d) { return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }
  function minus(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() - n); return x; }
  var css = '#tt-root{font-family:Geist,system-ui,sans-serif;color:#0B2A4A}.tt-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:26px;margin-bottom:16px}.tt-s{font-size:15px;line-height:1.55;color:#3D5873;margin:0 0 14px}.tt-lab{display:block;font-size:13px;font-weight:600;color:#3D5873;margin:14px 0 6px}' +
    '.tt-in{display:flex;gap:8px}.tt-in input,.tt-f{flex:1;min-width:0;border:1.5px solid #CFE0EF;border-radius:16px;padding:13px 16px;font:600 17px Geist,system-ui,sans-serif;color:#0B2A4A;min-height:52px;box-sizing:border-box;background:#fff}.tt-f{width:100%;font-size:16px}.tt-x{border:0;border-radius:16px;background:#fff;box-shadow:inset 0 0 0 1.5px #F2B8B8;color:#B42318;font:700 15px Geist,system-ui,sans-serif;padding:0 16px;cursor:pointer}.tt-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    '.tt-row{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}.tt-p{border:1.5px solid #CFE0EF;background:#F1F8FF;color:#0B2A4A;border-radius:999px;padding:9px 15px;font:600 14px Geist,system-ui,sans-serif;cursor:pointer;min-height:42px}.tt-p.on{background:#0B2A4A;border-color:#0B2A4A;color:#fff}' +
    '.tt-d{border:1px solid #E1EDF7;border-radius:18px;margin:0 0 10px;background:#fff}.tt-d summary{list-style:none;cursor:pointer;padding:14px 16px}.tt-d summary::-webkit-details-marker{display:none}.tt-top{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px;justify-content:space-between}.tt-n{font-family:Archivo,sans-serif;font-weight:800;font-size:17px}.tt-days{font:700 15px "Geist Mono",monospace;white-space:nowrap}.tt-e{font:600 10.5px Geist,system-ui,sans-serif;font-style:normal;color:#6B3D00;background:#FFF4E5;border-radius:999px;padding:2px 8px;margin-left:8px;vertical-align:middle;letter-spacing:.02em}.tt-sub{font-size:13px;color:#5E7891;margin-top:2px}.tt-bar{position:relative;height:8px;border-radius:99px;background:#EEF4FA;margin-top:9px}.tt-bar i{position:absolute;top:0;bottom:0;border-radius:99px;background:#0A6CC2}.tt-bar i.b2{background:#FFB020}' +
    '.tt-b{padding:0 16px 16px;font-size:15px;line-height:1.55}.tt-b h4{text-transform:uppercase;font:700 12px "Geist Mono",monospace;letter-spacing:.08em;color:#0A6CC2;margin:14px 0 4px}.tt-b p{margin:0 0 6px;color:#17436B}.tt-w{background:#FFF4E5;border-radius:10px;padding:8px 10px;font-size:13.5px;color:#6B3D00;margin:6px 0}.tt-c{display:inline-block;background:#F1F8FF;border:1px solid #D6E6F4;border-radius:10px;padding:5px 9px;margin:0 6px 6px 0;font-size:13.5px}.tt-c b{font-family:"Geist Mono",monospace;font-size:12px;color:#5E7891;margin-left:5px}.tt-go{display:inline-block;margin-top:8px;font-weight:700;color:#0A6CC2;text-decoration:none}.tt-when{background:#EEF8F1;border:1px solid #BFE3CB;border-radius:12px;padding:10px 12px;margin:10px 0 0;font-size:14.5px;color:#14532D}.tt-when.late{background:#FDECEC;border-color:#F2B8B8;color:#8A1C13}.tt-src{font-size:13px;line-height:1.5;color:#5E7891;margin:14px 0 0}@media (max-width:640px){.tt-card{padding:18px;border-radius:18px}.tt-2{grid-template-columns:1fr}}';
  var st = D.createElement('style'); st.textContent = css; D.head.appendChild(st);
  var S = { q: '', reg: '', sort: 'fast', by: '' }, DB = null;
  try { var sv = JSON.parse(localStorage.getItem('ck_tt_v1') || 'null'); if (sv) S = sv; } catch (e) {}
  function save() { try { localStorage.setItem('ck_tt_v1', JSON.stringify(S)); } catch (e) {} }
  root.innerHTML = '<div class="tt-card"><label class="tt-lab" for="tt-q" style="margin-top:0">Country or port</label><div class="tt-in"><input id="tt-q" type="text" enterkeyhint="search" autocomplete="off" spellcheck="false" placeholder="e.g. Germany or Callao" value="' + h(S.q) + '"><button type="button" class="tt-x" id="tt-clear">✕ Clear</button></div><div class="tt-2"><div><label class="tt-lab" for="tt-reg">Region</label><select class="tt-f" id="tt-reg"></select></div><div><label class="tt-lab" for="tt-sort">Order</label><select class="tt-f" id="tt-sort"><option value="fast">Fastest by sea first</option><option value="az">A to Z</option></select></div></div><label class="tt-lab" for="tt-by">Needed at destination by (optional)</label><input class="tt-f" id="tt-by" type="date" value="' + h(S.by) + '"></div><div class="tt-card" id="tt-out" aria-live="polite"><p class="tt-s" style="margin:0">Loading…</p></div>';
  var Q = D.getElementById('tt-q'), OUT = D.getElementById('tt-out'), SORT = D.getElementById('tt-sort'), BY = D.getElementById('tt-by'), REG = D.getElementById('tt-reg');
  SORT.value = S.sort === 'az' ? 'az' : 'fast';
  function when(r, row) {
    if (!S.by) return ''; var a = new Date(S.by + 'T00:00:00'); if (isNaN(a)) return '';
    var today = new Date(); today.setHours(0, 0, 0, 0); var safe = minus(a, r.d[1]), last = minus(a, r.d[0]), o;
    if (safe >= today) o = '<div class="tt-when"><b>Sail by ' + fd(safe) + '</b> to be safe. On the shortest estimate the last sailing is ' + fd(last) + '.</div>';
    else if (last >= today) o = '<div class="tt-when late"><b>Tight.</b> Only the shortest estimate still fits: sail by ' + fd(last) + '.' + (row.air ? ' By air, send by ' + fd(minus(a, row.air[1])) + '.' : '') + '</div>';
    else o = '<div class="tt-when late"><b>Too late by sea.</b>' + (row.air && minus(a, row.air[1]) >= today ? ' By air, send by ' + fd(minus(a, row.air[1])) + '.' : row.air && minus(a, row.air[0]) >= today ? ' By air it is tight: send by ' + fd(minus(a, row.air[0])) + '.' : ' Ask us about the options.') + '</div>';
    return o;
  }
  function card(row, open) {
    var r0 = row.r[0], lo = 999, hi = 0; row.r.forEach(function (r) { if (r.d[0] < lo) lo = r.d[0]; if (r.d[1] > hi) hi = r.d[1]; });
    var bars = row.r.map(function (r, i) { return '<i class="' + (i ? 'b2' : '') + '" style="left:' + (r.d[0] / MAXD * 100) + '%;width:' + ((r.d[1] - r.d[0]) / MAXD * 100) + '%"></i>'; }).join('');
    var o = '<details class="tt-d"' + (open ? ' open' : '') + '><summary><div class="tt-top"><span class="tt-n">' + row.f + ' ' + h(row.n) + (row.est ? '<i class="tt-e">estimate</i>' : '') + '</span><span class="tt-days">' + (row.r.length > 1 ? row.r[0].d[0] + '–' + row.r[0].d[1] + ' or ' + row.r[1].d[0] + '–' + row.r[1].d[1] : lo + '–' + hi) + ' days</span></div><div class="tt-sub">' + h(row.door ? (row.est ? 'By sea ' : 'By sea, ') + row.door : 'By sea' + (row.ports[0] ? (/^No seaport: /.test(row.ports[0][0]) ? ' ' + row.ports[0][0].replace(/^No seaport: /, '') + ', then by land' : ' to ' + row.ports[0][0]) : '')) + (row.air ? ' · by air ' + row.air[0] + '–' + row.air[1] + ' days' : '') + '</div><div class="tt-bar">' + bars + '</div></summary><div class="tt-b">';
    row.r.forEach(function (r) { o += '<h4>' + h(r.via || 'By sea') + '</h4><p>' + h(r.t) + '</p>' + (r.w ? '<div class="tt-w">' + h(r.w) + '</div>' : '') + when(r, row); });
    if (row.ports.length) o += '<h4>' + (row.reg === 'Russia' ? 'GATEWAY PORTS' : row.door && row.est ? 'GATEWAY PORT' : row.est ? 'MAIN PORT' : 'MAIN SEAPORTS') + '</h4>' + row.ports.map(function (p) { return '<span class="tt-c">' + h(p[0]) + '<b>' + h(p[1]) + '</b></span>'; }).join('');
    if (row.air) o += '<h4>BY AIR</h4><p>' + h(row.airT) + '</p>' + row.airports.map(function (p) { return '<span class="tt-c">' + h(p[0]) + '<b>' + h(p[1]) + '</b></span>'; }).join('');
    if (row.ag) o += '<h4>TRADE AGREEMENT WITH INDIA</h4><p>' + h(row.ag) + '</p>';
    o += (row.x ? '<div class="tt-w">' + h(row.x) + '</div>' : '') + '<p style="font-size:13px;color:#5E7891;margin-top:8px">' + (row.est ? 'Estimate from the sea distance, worked out ' + h(row.chk) + '. Not a carrier schedule.' : 'YAM Logistics figure, checked ' + h(row.chk) + '.') + '</p>' + (row.k ? '<a class="tt-go" href="' + h(row.k) + '.html">' + (row.reg === 'Russia' ? 'How we ship to Russia and the CIS' : 'Open the ' + h(row.n) + ' guide') + ' \u2192</a>' : '') + '</div></details>';
    return o;
  }
  function render() {
    if (!DB) return;
    if (!REG.options.length) {
      var ORD = ['South Asia', 'Gulf and Middle East', 'Southeast Asia', 'East Asia', 'Europe', 'Africa', 'North America', 'Mexico and Central America', 'Caribbean', 'South America', 'Oceania', 'Russia'], cnt = {};
      DB.rows.forEach(function (r) { cnt[r.reg] = (cnt[r.reg] || 0) + 1; if (ORD.indexOf(r.reg) < 0) ORD.push(r.reg); });
      REG.innerHTML = '<option value="">All regions (' + DB.rows.length + ')</option>' + ORD.filter(function (g) { return cnt[g]; }).map(function (g) { return '<option value="' + h(g) + '">' + h(g) + ' (' + cnt[g] + ')</option>'; }).join('');
      REG.value = S.reg || ''; if (REG.value !== (S.reg || '')) { S.reg = ''; REG.value = ''; }
      REG.onchange = function () { S.reg = REG.value; save(); render(); };
    }
    var q = norm(S.q), hay = function (r) { return norm(r.n + ' ' + r.ports.map(function (p) { return p[0] + ' ' + p[1]; }).join(' ') + ' ' + r.airports.map(function (p) { return p[0] + ' ' + p[1]; }).join(' ')); };
    var rows = DB.rows.filter(function (r) { if (S.reg && r.reg !== S.reg) return false; return !q || hay(r).indexOf(q) >= 0; }), wide = '';
    if (!rows.length && q && S.reg) { rows = DB.rows.filter(function (r) { return hay(r).indexOf(q) >= 0; }); if (rows.length) wide = ' Nothing in ' + S.reg + ' matched, so this is from all regions.'; }
    rows.sort(S.sort === 'az' ? function (a, b) { return a.n < b.n ? -1 : 1; } : function (a, b) { return (a.r[0].d[0] + a.r[0].d[1]) - (b.r[0].d[0] + b.r[0].d[1]) || (a.n < b.n ? -1 : 1); });
    if (!rows.length) { OUT.innerHTML = '<p class="tt-s" style="margin:0">Nothing matches “' + h(S.q) + '”. Clear the search to see every destination.</p>'; return; }
    OUT.innerHTML = '<p class="tt-s">' + rows.length + (rows.length === 1 ? ' destination' : ' destinations') + '. Tap one for the routing and ports.' + h(wide) + (S.by ? ' Sailing dates are worked out for arrival by ' + h(fd(new Date(S.by + 'T00:00:00'))) + '.' : '') + '</p>' + rows.map(function (r) { return card(r, rows.length === 1 || (S.by && rows.length <= 3)); }).join('') + '<p class="tt-src">From ' + h(DB.from) + '. Rows without a tag are YAM Logistics figures from its own shipments and public sources: Latin America is port to port, and Russia is to the door in the Moscow region. Rows tagged \u201cestimate\u201d are worked out from the sea distance from Nhava Sheva at normal container-ship speeds, with an allowance for port calls and for a change of ship where one is usual. They are not carrier schedules. Where a route can use the Suez Canal, the time round the Cape of Good Hope is shown as well. Air times for estimate rows are typical for the region. The bar shows the range on a scale of 0 to ' + MAXD + ' days. Confirm the sailing with your forwarder before you promise a date.</p>';
  }
  var tm = null;
  Q.oninput = function () { S.q = Q.value; save(); clearTimeout(tm); tm = setTimeout(render, 150); };
  SORT.onchange = function () { S.sort = SORT.value; save(); render(); };
  BY.onchange = BY.oninput = function () { S.by = BY.value; save(); render(); };
  D.getElementById('tt-clear').onclick = function () { S = { q: '', reg: '', sort: 'fast', by: '' }; Q.value = ''; BY.value = ''; SORT.value = 'fast'; REG.value = ''; save(); render(); Q.focus(); };
  fetch('corridors.json?v=2').then(function (x) { return x.json(); }).then(function (j) { DB = j; render(); }).catch(function () { OUT.innerHTML = '<p class="tt-s" style="margin:0">The table could not be loaded. Check your connection and try again.</p>'; });
})();
