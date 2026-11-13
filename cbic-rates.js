/* Customs exchange rates page: the rates CBIC has notified (read through /api/cbic-fx, the same source the duty calculator uses),
   shown as a table with a converter. Falls back to the snapshot bundled with the site when the live source is not reachable. */
(function () {
  'use strict';
  var D = document, root = D.getElementById('fx-root'); if (!root) return;
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function nice(d) { var m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(d || ''); return m ? (+m[1]) + ' ' + MON[+m[2] - 1] + ' ' + m[3] : (d || ''); }
  function inr(n) { return '₹' + (Math.round(n * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  var css = '#fx-root{font-family:Geist,system-ui,sans-serif;color:#0B2A4A}.fx-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:26px;margin-bottom:16px}.fx-h{font-family:Archivo,sans-serif;font-weight:800;font-size:22px;margin:0 0 4px}.fx-s{font-size:15px;line-height:1.55;color:#3D5873;margin:0 0 16px}' +
    '.fx-now{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 4px}.fx-pill{background:#F1F8FF;border:1px solid #CFE0EF;border-radius:14px;padding:10px 14px;font-size:14px}.fx-pill b{display:block;font-family:Archivo,sans-serif;font-size:17px}' +
    '.fx-g{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fx-g label{display:block;font-family:"Geist Mono",monospace;font-size:11.5px;letter-spacing:.08em;color:#5E7891;text-transform:uppercase;margin-bottom:6px}.fx-g input,.fx-g select{width:100%;box-sizing:border-box;border:1.5px solid #CFE0EF;border-radius:14px;padding:13px 14px;font:600 17px Geist,system-ui,sans-serif;color:#0B2A4A;background:#fff;min-height:50px}' +
    '.fx-seg{display:flex;gap:8px;margin:14px 0}.fx-seg button{flex:1;border:1.5px solid #CFE0EF;background:#fff;color:#0B2A4A;border-radius:999px;padding:11px 12px;font:600 15px Geist,system-ui,sans-serif;cursor:pointer;min-height:46px}.fx-seg button.on{background:#0A6CC2;border-color:#0A6CC2;color:#fff}' +
    '.fx-out{background:#EAF7EF;border:1px solid #BFE3CC;border-radius:18px;padding:16px 18px}.fx-out b{display:block;font-family:Archivo,sans-serif;font-weight:900;font-size:30px;letter-spacing:-.01em}.fx-out span{font-size:14px;color:#3D5873}' +
    '.fx-tbl{width:100%;border-collapse:collapse;font-size:15px}.fx-tbl th{text-align:right;font-family:"Geist Mono",monospace;font-size:11px;letter-spacing:.06em;color:#5E7891;padding:8px 6px;border-bottom:1px solid #E1EDF7}.fx-tbl th:first-child,.fx-tbl td:first-child{text-align:left}.fx-tbl td{padding:10px 6px;border-bottom:1px solid #EEF4FA;text-align:right;font-variant-numeric:tabular-nums}.fx-tbl td b{font-size:15.5px}.fx-tbl td span{display:block;font-size:12.5px;color:#5E7891}.fx-tbl tr{cursor:pointer}.fx-tbl tr:hover td{background:#F7FBFF}' +
    '.fx-b{border:0;border-radius:999px;padding:12px 20px;font:700 15px Geist,system-ui,sans-serif;cursor:pointer;min-height:46px;background:#0A6CC2;color:#fff}.fx-b2{background:#fff;color:#B42318;box-shadow:inset 0 0 0 1.5px #F2B8B8}.fx-acts{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}' +
    '@media (max-width:640px){.fx-card{padding:18px;border-radius:18px}.fx-g{grid-template-columns:1fr}.fx-out b{font-size:26px}}';
  var st = D.createElement('style'); st.textContent = css; D.head.appendChild(st);

  var S = { amt: '', cur: 'USD', dir: 'i' };
  try { var sv = JSON.parse(localStorage.getItem('ck_fx_v1') || 'null'); if (sv) S = sv; } catch (e) {}
  function save() { try { localStorage.setItem('ck_fx_v1', JSON.stringify(S)); } catch (e) {} }

  fetch('api/cbic-fx').then(function (x) { if (!x.ok) throw 0; return x.json(); }).then(function (j) { if (!j || !j.r || !j.r.USD) throw 0; j.live = 1; return j; })
    .catch(function () { return fetch('cbic-fx.json?v=1').then(function (x) { return x.json(); }); })
    .then(draw).catch(function () { root.innerHTML = '<div class="fx-card"><p class="fx-s" style="margin:0">The rates could not be loaded. Please check your connection and reload the page.</p></div>'; });

  function draw(j) {
    var R = j.r, codes = Object.keys(R).sort(function (a, b) { return a === 'USD' ? -1 : b === 'USD' ? 1 : a < b ? -1 : 1; });
    if (!R[S.cur]) S.cur = 'USD';
    var o = '<div class="fx-card"><h2 class="fx-h">Rates in force</h2><div class="fx-now"><div class="fx-pill">In force from<b>' + h(nice(j.d)) + '</b></div>' + (j.n ? '<div class="fx-pill">ICEGATE notice<b>No. ' + h(j.n) + '</b></div>' : '') + '<div class="fx-pill">US dollar, imports<b>' + inr(R.USD.i) + '</b></div><div class="fx-pill">US dollar, exports<b>' + inr(R.USD.e) + '</b></div></div>' +
      (j.live ? '' : '<p class="fx-s" style="margin:12px 0 0;color:#7A4B00">The live source could not be reached, so these are the last rates saved with the site. Check the date above before you use them.</p>') + '</div>';
    o += '<div class="fx-card"><div class="fx-acts" style="justify-content:flex-end;margin:0 0 6px"><button type="button" class="fx-b fx-b2" id="fx-clear">✕ Clear form</button></div><h2 class="fx-h">Convert at the customs rate</h2><p class="fx-s">For the assessable value on a bill of entry or the FOB value on a shipping bill.</p>' +
      '<div class="fx-g"><div><label for="fx-amt">Amount</label><input id="fx-amt" inputmode="decimal" placeholder="e.g. 12500" value="' + h(S.amt) + '"></div><div><label for="fx-cur">Currency</label><select id="fx-cur">' + codes.map(function (c) { return '<option value="' + c + '"' + (c === S.cur ? ' selected' : '') + '>' + c + ' · ' + h(R[c].n) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="fx-seg"><button type="button" data-dir="i"' + (S.dir === 'i' ? ' class="on"' : '') + '>Import (bill of entry)</button><button type="button" data-dir="e"' + (S.dir === 'e' ? ' class="on"' : '') + '>Export (shipping bill)</button></div><div class="fx-out" id="fx-out"></div>' +
      '<div class="fx-acts"><button type="button" class="fx-b" id="fx-copy">Copy the result</button></div><div class="fx-s" id="fx-msg" style="margin:10px 0 0" aria-live="polite"></div></div>';
    o += '<div class="fx-card"><h2 class="fx-h">All notified currencies</h2><p class="fx-s">Rupees per unit of foreign currency. Tap a row to use it in the converter.</p><div style="overflow-x:auto"><table class="fx-tbl"><thead><tr><th>CURRENCY</th><th>IMPORT</th><th>EXPORT</th></tr></thead><tbody>' +
      codes.map(function (c) { var r = R[c]; return '<tr data-c="' + c + '"><td><b>' + c + '</b><span>' + h(r.n) + (r.u > 1 ? ' · per ' + r.u : '') + '</span></td><td>' + r.i.toFixed(2) + '</td><td>' + r.e.toFixed(2) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    root.innerHTML = o;
    function line() { var r = R[S.cur], a = parseFloat(String(S.amt).replace(/,/g, '')), rate = S.dir === 'i' ? r.i : r.e; return { r: r, a: a, rate: rate, v: a > 0 ? a * rate / r.u : 0 }; }
    function out() {
      var x = line(), lab = (x.r.u > 1 ? x.r.u + ' ' : '1 ') + S.cur + ' = ' + inr(x.rate) + ' (' + (S.dir === 'i' ? 'import' : 'export') + ' rate from ' + nice(j.d) + ')';
      D.getElementById('fx-out').innerHTML = x.v ? '<b>' + inr(x.v) + '</b><span>' + h(x.a.toLocaleString('en-IN')) + ' ' + S.cur + ' at ' + h(lab) + '</span>' : '<b>' + inr(x.rate) + '</b><span>' + h(lab) + '. Enter an amount to convert.</span>';
    }
    out();
    D.getElementById('fx-amt').oninput = function () { S.amt = this.value; save(); out(); };
    D.getElementById('fx-cur').onchange = function () { S.cur = this.value; save(); out(); };
    root.querySelectorAll('[data-dir]').forEach(function (b) { b.onclick = function () { S.dir = b.getAttribute('data-dir'); save(); root.querySelectorAll('[data-dir]').forEach(function (q) { q.className = q === b ? 'on' : ''; }); out(); }; });
    root.querySelectorAll('tr[data-c]').forEach(function (tr) { tr.onclick = function () { S.cur = tr.getAttribute('data-c'); save(); D.getElementById('fx-cur').value = S.cur; out(); D.getElementById('fx-amt').focus(); window.scrollTo(0, D.getElementById('fx-amt').getBoundingClientRect().top + window.scrollY - 160); }; });
    D.getElementById('fx-clear').onclick = function () { S = { amt: '', cur: 'USD', dir: 'i' }; try { localStorage.removeItem('ck_fx_v1'); } catch (e) {} draw(j); };
    D.getElementById('fx-copy').onclick = function () {
      var x = line(), m = D.getElementById('fx-msg'), tx = (x.v ? x.a.toLocaleString('en-IN') + ' ' + S.cur + ' = ' + inr(x.v) + ' at the customs ' : 'Customs ') + (S.dir === 'i' ? 'import' : 'export') + ' rate of ' + inr(x.rate) + ' per ' + (x.r.u > 1 ? x.r.u + ' ' : '') + S.cur + ', in force from ' + nice(j.d) + (j.n ? ' (ICEGATE notice No. ' + j.n + ')' : '') + '. Source: cargokit.ai';
      (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(tx) : Promise.reject()).then(function () { m.textContent = 'Copied.'; }).catch(function () { m.textContent = tx; });
    };
  }
})();
