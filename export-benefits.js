/* YAM Logistics – Export benefit finder: duty drawback, RoDTEP, RoSCTL and export policy by HS code (client-side, static data) */
(function () {
  var root = document.getElementById('eb-root');
  if (!root) return;
  var D = null, sel = null, dbSel = null, CBIC = null;
  var CUR = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'CNY', 'JPY', 'SGD', 'HKD', 'CHF', 'AUD', 'CAD', 'SAR', 'QAR', 'KWD', 'BHD', 'NZD', 'SEK', 'NOK', 'DKK', 'TRY', 'ZAR', 'KRW'];
  var UQ = { 'kg': 'kg', 'u': 'unit (piece)', 'm2': 'm²', 'm3': 'm³', 'm': 'metre', 'l': 'litre', 'pa': 'pair', 'mt': 'tonne', 'c/k': 'carat', 'g': 'gram', '1000 kwh': '1000 kWh', 'piece': 'piece', 'pair': 'pair', 'sq. mtrs.': 'm²', 'gram': 'gram', 'unit': 'unit' };
  var POL = { F: ['Free', 'Export freely, no DGFT licence needed', '#E9FBF0', '#0F7A3D'], R: ['Restricted', 'Needs a DGFT export authorisation or must meet a policy condition', '#FFF4D6', '#9A5B00'], P: ['Prohibited', 'Cannot be exported', '#FFE3DF', '#B42318'], S: ['State trading (STE)', 'Export only through the notified state trading enterprise', '#F1E9FF', '#5B2BB5'] };

  var css = document.createElement('style');
  css.textContent = '.eb{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:20px;align-items:start}@media(max-width:960px){.eb{grid-template-columns:1fr}}' +
    '.eb-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:26px;box-shadow:0 20px 50px rgba(11,42,74,.06)}' +
    '.eb-l{font-size:13px;font-weight:600;color:#3D5873;margin:0 0 6px;display:block}.eb-in{width:100%;box-sizing:border-box;padding:14px 16px;border:1px solid #C9DCEC;border-radius:14px;font:inherit;font-size:16px;color:#0B2A4A;background:#fff}' +
    '.eb-in:focus{outline:2px solid #0A6CC2;border-color:#0A6CC2}.eb-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}@media(max-width:560px){.eb-row{grid-template-columns:1fr}}' +
    '.eb-res{margin-top:14px;max-height:420px;overflow:auto;border:1px solid #E1EDF7;border-radius:16px}.eb-it{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #EEF4FA;background:#fff;padding:12px 14px;cursor:pointer;font:inherit;color:#0B2A4A}' +
    '.eb-it:hover,.eb-it.on{background:#EEF6FD}.eb-c{font-family:"Geist Mono",monospace;font-size:13px;color:#0A6CC2;font-weight:500}.eb-p{font-size:12px;color:#5E7891;margin-top:2px;line-height:1.4}.eb-d{font-size:15px;font-weight:600;margin-top:2px}' +
    '.eb-b{float:right;font-family:"Geist Mono",monospace;font-size:12px;background:#E9FBF0;color:#0F7A3D;border-radius:999px;padding:3px 9px;margin-left:8px}' +
    '.eb-big{background:#0F7A3D;color:#fff;border-radius:20px;padding:20px 22px;margin:16px 0}.eb-big b{font-family:Archivo,sans-serif;font-weight:900;font-size:40px;display:block;line-height:1.05}.eb-big span{font-size:14px;opacity:.9}' +
    '.eb-s{border:1px solid #E1EDF7;border-radius:18px;padding:16px 18px;margin-top:12px}.eb-s h3{font-family:Archivo,sans-serif;font-weight:800;font-size:18px;margin:0 0 4px;display:flex;justify-content:space-between;gap:10px;align-items:baseline}.eb-s h3 em{font-style:normal;font-family:"Geist Mono",monospace;font-size:15px;color:#0F7A3D;white-space:nowrap}' +
    '.eb-s .k{font-size:14px;line-height:1.6;color:#3D5873}.eb-s .k b{color:#0B2A4A}.eb-na h3 em{color:#8296AA}' +
    '.eb-pill{display:inline-block;border-radius:999px;padding:5px 12px;font-size:13px;font-weight:600}.eb-note{font-size:13px;line-height:1.55;color:#3D5873;background:#F7FBFF;border-radius:14px;padding:12px 14px;margin-top:10px}' +
    '.eb-x{font-size:13px;color:#3D5873;line-height:1.5;border-left:3px solid #FFC93C;padding:6px 10px;margin:8px 0 0;background:#FFFBF0;border-radius:0 10px 10px 0}' +
    '.eb-tabs{display:flex;flex-wrap:wrap;background:#EEF6FD;border-radius:18px;padding:4px;gap:4px;margin-top:6px}.eb-tabs button{flex:1 1 auto;border:0;border-radius:14px;padding:9px 12px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;background:transparent;color:#3D5873}.eb-tabs button.on{background:#0A6CC2;color:#fff}' +
    '.eb-cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.eb-cta a{padding:13px 20px;border-radius:999px;font-weight:600;text-decoration:none}.eb-empty{color:#5E7891;padding:30px 10px;text-align:center}' +
    '.eb-src{font-size:12px;color:#5E7891;margin-top:14px;line-height:1.5}.eb-warn{background:#FFF4D6;border:1px solid #F5D08A;color:#7A3E00;border-radius:18px;padding:16px 20px;margin-bottom:18px;font-size:14px;line-height:1.55}.eb-warn a{color:#7A3E00;font-weight:600}' +
    '.eb-ack{display:flex;gap:10px;align-items:flex-start;background:#FFFBF0;border:1px solid #F5D08A;border-radius:14px;padding:14px 16px;font-size:14px;line-height:1.5;color:#4A3200;margin-top:14px;cursor:pointer}.eb-ack input{width:20px;height:20px;flex:none;margin-top:1px;accent-color:#0A6CC2}' +
    '.eb-sel{margin-top:8px}.eb-sel select{font-size:14px;padding:10px 12px}';
  document.head.appendChild(css);

  function h(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fc(c) { return c.length === 8 ? c.slice(0, 4) + ' ' + c.slice(4, 6) + ' ' + c.slice(6) : c; }
  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function num(el) { var n = parseFloat(String(el.value).replace(/,/g, '')); return isFinite(n) && n > 0 ? n : null; }
  function uq(u) { return UQ[(u || '').toLowerCase()] || u || 'unit'; }

  root.innerHTML = '<div class="eb-warn" role="note"><b>For guidance only.</b> This tool gives indicative estimates from the published schedules. It is not a customs or DGFT ruling, and the amount you actually receive depends on classification, documents and the officer\'s scrutiny. YAM Logistics Pvt. Ltd. accepts no legal responsibility for any use of these results. <a href="#disclaimer">Read the full disclaimer</a>.</div>' +
    '<div class="eb"><div class="eb-card">' +
    '<label class="eb-l" for="eb-q">HS code or description of your export product</label>' +
    '<input id="eb-q" class="eb-in" placeholder="e.g. 6109 10 00, or “cotton t-shirts”, “basmati rice”, “steel bolts”" autocomplete="off">' +
    '<div style="margin-top:16px"><span class="eb-l">You export as</span><div class="eb-tabs" id="eb-ty"><button data-t="DTA" class="on">Regular exporter (DTA)</button><button data-t="AA">Advance Authorisation</button><button data-t="EOU">EOU / SEZ unit</button></div></div>' +
    '<div class="eb-row"><div><label class="eb-l" for="eb-v">FOB value of the shipment</label><div style="display:flex;gap:8px"><select id="eb-cur" class="eb-in" style="width:96px;flex:none"></select><input id="eb-v" class="eb-in" inputmode="decimal" placeholder="e.g. 25000"></div></div>' +
    '<div><label class="eb-l" for="eb-n">Quantity <span id="eb-nu" style="font-weight:400;color:#5E7891"></span></label><input id="eb-n" class="eb-in" inputmode="decimal" placeholder="for per-unit caps"></div></div>' +
    '<div id="eb-fx" style="display:none;margin-top:10px"><label class="eb-l" for="eb-r">Exchange rate (₹ per unit)</label><input id="eb-r" class="eb-in" inputmode="decimal"><div id="eb-fxn" style="font-size:12px;color:#5E7891;margin-top:6px;line-height:1.45"></div></div>' +
    '<label class="eb-ack"><input type="checkbox" id="eb-ack"><span>I understand the results are <b>indicative estimates for guidance only</b>, not a customs or DGFT ruling, and that YAM Logistics Pvt. Ltd. accepts <b>no liability</b> for their use.</span></label>' +
    '<div id="eb-list" class="eb-res"><div class="eb-empty">Loading the export schedules…</div></div></div>' +
    '<div class="eb-card" id="eb-out"><div class="eb-empty">Search for your product and pick a tariff line to see every export benefit on it.</div></div></div>';

  var q = document.getElementById('eb-q'), v = document.getElementById('eb-v'), cur = document.getElementById('eb-cur'), r = document.getElementById('eb-r'), n = document.getElementById('eb-n'), list = document.getElementById('eb-list'), out = document.getElementById('eb-out'), ack = document.getElementById('eb-ack'), fxn = document.getElementById('eb-fxn');
  var ty = 'DTA';
  cur.innerHTML = CUR.map(function (c) { return '<option>' + c + '</option>'; }).join('');
  cur.value = 'USD'; document.getElementById('eb-fx').style.display = 'block';
  document.getElementById('eb-ty').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; ty = b.getAttribute('data-t'); [].forEach.call(this.querySelectorAll('button'), function (x) { x.classList.toggle('on', x === b); }); recalc(); });
  try { if (sessionStorage.getItem('yam-eb-ack') === '1') ack.checked = true; } catch (e) {}
  ack.addEventListener('change', function () { try { sessionStorage.setItem('yam-eb-ack', ack.checked ? '1' : '0'); } catch (e) {} recalc(); });

  // CBIC customs exchange rate (EXPORT rate) for converting FOB
  var cbicP = fetch('api/cbic-fx').then(function (x) { if (!x.ok) throw 0; return x.json(); })
    .catch(function () { return fetch('cbic-fx.json?v=1').then(function (x) { return x.json(); }); })
    .then(function (j) { if (j && j.r) CBIC = j; return CBIC; }).catch(function () { return null; });
  function fmtD(d) { var m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(d || ''); return m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : d; }
  function getFx(c) {
    if (c === 'INR') { fxn.innerHTML = ''; return; }
    fxn.innerHTML = 'Loading the CBIC customs exchange rate…';
    cbicP.then(function (cb) {
      if (cur.value !== c) return;
      var x = cb && cb.r && cb.r[c];
      if (x) { var per = x.e / (x.u || 1); r.value = per >= 1 ? per.toFixed(2) : per.toFixed(4); recalc(); fxn.innerHTML = '<b style="color:#0F7B3F">✓ CBIC customs rate for exports</b>: ₹' + x.e + (x.u > 1 ? ' per ' + x.u + ' ' + c : ' per ' + c) + '. Notification No. ' + h(cb.n) + ', in force from ' + h(fmtD(cb.d)) + '. Customs uses the rate in force on the date the shipping bill is filed. You can edit it.'; }
      else { fxn.innerHTML = 'CBIC does not notify a rate for ' + c + '. Please enter the rate.'; }
    });
  }
  getFx('USD');
  cur.addEventListener('change', function () { document.getElementById('eb-fx').style.display = cur.value === 'INR' ? 'none' : 'block'; r.value = ''; getFx(cur.value); recalc(); });
  [v, r, n].forEach(function (el) { el.addEventListener('input', recalc); });

  var idx = null;
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function stem(w) { return w.length > 4 ? w.replace(/(ies)$/, 'y').replace(/(es|s)$/, '') : w; }
  var STOP = { of: 1, and: 1, the: 1, for: 1, or: 1, with: 1, in: 1, a: 1, an: 1, to: 1, other: 1, made: 1 };
  function build() { idx = D.rows.map(function (x) { return { d: ' ' + norm(x[1]).split(' ').map(stem).join(' ') + ' ', p: ' ' + norm(x[2] >= 0 ? D.paths[x[2]] : '').split(' ').map(stem).join(' ') + ' ' }; }); }
  function search(t) {
    var digits = t.replace(/[\s.\-]/g, '');
    if (/^\d{2,8}$/.test(digits)) return D.rows.map(function (x, i) { return i; }).filter(function (i) { return D.rows[i][0].indexOf(digits) === 0; }).slice(0, 80);
    var ws = norm(t).split(' ').filter(function (w) { return w && !STOP[w]; }).map(stem);
    if (!ws.length) return [];
    var sc = [];
    for (var i = 0; i < idx.length; i++) {
      var s = 0, all = true;
      for (var k = 0; k < ws.length; k++) { var w = ws[k], inD = idx[i].d.indexOf(' ' + w) >= 0, inP = idx[i].p.indexOf(' ' + w) >= 0; if (inD) s += 3; else if (inP) s += 1; else all = false; if (idx[i].d.indexOf(' ' + w + ' ') >= 0) s += 1; }
      if (s > 0) sc.push([all ? s + 10 : s, i]);
    }
    sc.sort(function (a, b) { return b[0] - a[0] || (D.rows[a[1]][0] < D.rows[b[1]][0] ? -1 : 1); });
    return sc.slice(0, 60).map(function (x) { return x[1]; });
  }
  function rodTxt(x) { var a = x[4]; if (!a) return 'no RoDTEP'; if (a[0] === -1) return 'RoDTEP ₹' + a[2] + '/' + uq(a[3]); return a[0] ? 'RoDTEP ' + a[0] + '%' : 'RoDTEP nil'; }
  function renderList(ids) {
    if (!ids.length) { list.innerHTML = '<div class="eb-empty">No matching tariff lines. Try another word, or the first 4 digits of the HS code.</div>'; return; }
    list.innerHTML = ids.map(function (i) {
      var x = D.rows[i], ch = +x[0].slice(0, 2), badge = (ch >= 61 && ch <= 63) ? 'RoSCTL' : rodTxt(x);
      return '<button class="eb-it' + (sel === i ? ' on' : '') + '" data-i="' + i + '"><span class="eb-b">' + h(badge) + '</span><span class="eb-c">' + fc(x[0]) + '</span><div class="eb-d">' + h(x[1]) + '</div><div class="eb-p">' + h(x[2] >= 0 ? D.paths[x[2]].slice(0, 160) : '') + '</div></button>';
    }).join('');
  }
  list.addEventListener('click', function (e) { var b = e.target.closest('.eb-it'); if (!b) return; sel = +b.getAttribute('data-i'); dbSel = null; [].forEach.call(list.querySelectorAll('.eb-it'), function (x) { x.classList.toggle('on', x === b); }); recalc(); if (window.innerWidth < 960) out.scrollIntoView({ behavior: 'smooth' }); });
  var tm;
  q.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { if (!D) return; var t = q.value.trim(); if (!t) { list.innerHTML = '<div class="eb-empty">Start typing an HS code or a product name.</div>'; return; } renderList(search(t)); }, 160); });

  // drawback lines for a heading: the Schedule is aligned to the Customs Tariff only at 4 digits
  function dbLines(code) {
    var hd = code.slice(0, 4);
    return D.db.filter(function (e) { return e[0].slice(0, 4) === hd; });
  }
  function pctOf(s) { var m = /^([\d.]+)\s*%$/.exec(String(s || '').trim()); return m ? parseFloat(m[1]) : null; }
  function guessDb(lines, x) {
    var leaves = lines.filter(function (e) { return e[3] && !/^omitted|^deleted/i.test(e[1]); });
    if (!leaves.length) return -1;
    if (leaves.length === 1) return lines.indexOf(leaves[0]);
    function ws(t) { return norm(t).split(' ').filter(function (w) { return w.length > 3 && !STOP[w]; }).map(stem); }
    var wd = ws(x[1]), wp = ws(x[2] >= 0 ? D.paths[x[2]] : '');
    var best = -1, bs = -1;
    leaves.forEach(function (e) {
      var dw = ws(e[1]), s = 0;
      dw.forEach(function (d) { if (wd.some(function (w) { return w.indexOf(d) >= 0 || d.indexOf(w) >= 0; })) s += 2; else if (wp.some(function (w) { return w.indexOf(d) >= 0 || d.indexOf(w) >= 0; })) s += 0.5; });
      if (dw.length) s = s / Math.sqrt(dw.length);
      if (/^others?$/.test(norm(e[1]))) s = Math.max(s, 0.3);
      if (s > bs) { bs = s; best = lines.indexOf(e); }
    });
    return best;
  }
  // convert a quantity entered in the tariff UQC into the drawback / scheme unit
  function conv(qty, from, to) {
    if (qty == null) return null;
    var f = (from || '').toLowerCase().replace(/[^a-z0-9]/g, ''), t = (to || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (f === 'kg' && (t === 'mt' || t === 'tonne')) return qty / 1000;
    if (f === 'kg' && (t === 'gram' || t === 'gms' || t === 'g')) return qty * 1000;
    if ((f === 'g' || f === 'gram') && t === 'kg') return qty / 1000;
    if (f === 'm2' && /^sqmtr/.test(t)) return qty;
    return qty;
  }
  out.addEventListener('change', function (e) { if (e.target.id === 'eb-dbs') { dbSel = +e.target.value; recalc(); } });

  function recalc() {
    if (!D || sel == null) return;
    if (!ack.checked) { out.innerHTML = '<div class="eb-empty" style="color:#7A3E00">Please tick the box confirming you understand the results are for guidance only, and your benefits will appear here.</div>'; return; }
    var x = D.rows[sel], code = x[0], ch = +code.slice(0, 2), textile = ch >= 61 && ch <= 63;
    var uqc = (x[4] && x[4][3]) || x[3]; var fv = num(v), rate = cur.value === 'INR' ? 1 : num(r), fob = fv != null && rate != null ? fv * rate : null, qty = num(n);
    document.getElementById('eb-nu').textContent = '(in ' + uq((x[4] && x[4][3]) || x[3]) + ')';
    var H = '<div style="font-family:\'Geist Mono\',monospace;font-size:13px;color:#0A6CC2">' + fc(code) + '</div><div style="font-family:Archivo,sans-serif;font-weight:800;font-size:22px;line-height:1.2;margin:4px 0 2px">' + h(x[1]) + '</div><div style="font-size:13px;color:#5E7891">' + h(x[2] >= 0 ? D.paths[x[2]] : '') + '</div>';
    var total = 0, S = '';

    // ---- Export policy
    var pol = x[6], xn = D.xn && D.xn[code.slice(0, 2)];
    if (!pol) S += '<div class="eb-note" style="margin-top:14px">Export policy for this line was not found in the DGFT schedule. Please check with us before you ship.</div>';
    if (pol) {
      var pk = POL[pol[0]] || null;
      S += '<div style="margin-top:14px"><span class="eb-pill" style="background:' + (pk ? pk[2] : '#EEF2F6') + ';color:' + (pk ? pk[3] : '#3D5873') + '">Export policy: ' + h(pk ? pk[0] : pol[0]) + '</span> <span style="font-size:13px;color:#3D5873">' + h(pk ? pk[1] : '') + '</span>' + (pol[1] ? '<div class="eb-x"><b>Policy condition:</b> ' + h(pol[1]) + '</div>' : '') + '</div>';
    }
    if (pol && pol[0] === 'P') S += '<div class="eb-warn" style="margin:10px 0 0"><b>Export of this item is prohibited</b> under the current DGFT export policy, unless a condition above allows it. The incentives below are shown for reference only.</div>';
    if (xn && xn.length) S += '<details style="margin-top:8px;font-size:13px;color:#3D5873"><summary style="cursor:pointer;font-weight:600;color:#0A6CC2">Chapter ' + code.slice(0, 2) + ' export conditions (' + xn.length + ')</summary>' + xn.map(function (z) { return '<div class="eb-x"><b>' + h(z[0]) + ' ' + h(z[1]) + ':</b> ' + h(z[2]).replace(/\n/g, '<br>') + '</div>'; }).join('') + '</details>';

    // ---- Duty drawback (AIR)
    var lines = dbLines(code), di = dbSel != null ? dbSel : guessDb(lines, x), dbAmt = null, dbS = '';
    if (ty !== 'DTA') {
      dbS = '<div class="eb-s eb-na"><h3>Duty drawback (All Industry Rate)<em>not available</em></h3><div class="k">AIR drawback does not apply to goods made or exported under an ' + (ty === 'AA' ? 'Advance Authorisation' : 'EOU or SEZ unit') + ' (note 9 of the drawback schedule). Exports under a Special Advance Authorisation for garments have their own, lower rates.</div></div>';
    } else if (!lines.length) {
      dbS = '<div class="eb-s eb-na"><h3>Duty drawback (All Industry Rate)<em>not listed</em></h3><div class="k">This heading is not in the drawback schedule. You can apply for a brand rate of drawback if you can show the duties you paid on inputs.</div></div>';
    } else {
      var opts = lines.map(function (e, i) { var leaf = !!e[3]; return '<option value="' + i + '"' + (i === di ? ' selected' : '') + (leaf ? '' : ' disabled') + '>' + h(e[0] + ' · ' + e[1].slice(0, 90) + (leaf ? ' — ' + e[3] + (e[4] ? ', cap ₹' + e[4] + '/' + e[2] : '') : '')) + '</option>'; }).join('');
      var e = di >= 0 ? lines[di] : null, k = '';
      if (e && e[3]) {
        var p = pctOf(e[3]), cap = e[4] ? parseFloat(e[4]) : null;
        if (/^nil$/i.test(e[3])) { dbAmt = 0; k = 'The drawback rate for this line is <b>Nil</b>.'; }
        else if (p != null) {
          k = '<b>' + p + '% of FOB</b>' + (cap ? ', capped at <b>₹' + cap + ' per ' + h(e[2] || 'unit') + '</b>' : '') + '.';
          var dq = conv(qty, uqc, e[2]); if (fob != null) { dbAmt = fob * p / 100; if (cap && dq != null) { var c2 = cap * dq; if (c2 < dbAmt) { dbAmt = c2; k += ' The cap applies to this shipment.'; } } else if (cap) k += ' Enter the quantity in ' + h(e[2] || 'units') + ' to apply the cap.'; }
        } else { k = 'Specific rate: <b>' + h(e[3]) + (/per/i.test(e[3]) ? '' : ' per ' + h(e[2] || 'unit')) + '</b>.' + (qty == null ? ' Enter the quantity to estimate.' : ''); var m = /₹\s*([\d.]+)/.exec(e[3]); var dq2 = conv(qty, uqc, e[2]); if (m && dq2 != null) { dbAmt = parseFloat(m[1]) * dq2; k += ' (' + (Math.round(dq2 * 1000) / 1000) + ' ' + h(e[2]) + ')'; } }
      } else k = 'Pick the drawback line that matches your goods.';
      dbS = '<div class="eb-s"><h3>Duty drawback (All Industry Rate)<em>' + (dbAmt != null ? inr(dbAmt) : '—') + '</em></h3><div class="k">' + k + '</div><div class="eb-sel"><label class="eb-l" for="eb-dbs">Drawback line (the schedule matches the tariff only at 4 digits — choose the one that fits)</label><select id="eb-dbs" class="eb-in">' + opts + '</select></div><div class="eb-x">Claimed on the shipping bill and credited to your bank account. Drawback and RoDTEP can be claimed on the same export.</div></div>';
      if (dbAmt) total += dbAmt;
    }

    // ---- RoDTEP / RoSCTL
    var rS = '';
    if (textile) {
      var t = lines[di] && D.rs[lines[di][0]], rsAmt = null, kk = '';
      if (ty === 'EOU') kk = 'RoSCTL is not available to EOU or SEZ units.';
      else if (t && t.length > 1) {
        kk = 'State levies <b>' + t[2] + '%</b>' + (t[3] ? ' (cap ₹' + t[3] + '/' + h(t[1]) + ')' : '') + ' + central levies <b>' + t[4] + '%</b>' + (t[5] ? ' (cap ₹' + t[5] + '/' + h(t[1]) + ')' : '') + ' of FOB, for the RoSCTL line you picked above.';
        if (fob != null) { var a1 = fob * t[2] / 100, a2 = fob * t[4] / 100; if (qty != null) { if (t[3]) a1 = Math.min(a1, t[3] * qty); if (t[5]) a2 = Math.min(a2, t[5] * qty); } else if (t[3] || t[5]) kk += ' Enter the quantity in ' + h(t[1]) + 's to apply the caps.'; rsAmt = a1 + a2; }
        if (ty === 'AA') kk += ' Under a Special Advance Authorisation for fabric, lower RoSCTL rates (Schedules 3 and 4) apply.';
      } else kk = 'Pick the matching line in the drawback box above; RoSCTL uses the same tariff items.';
      rS = '<div class="eb-s' + (rsAmt == null ? ' eb-na' : '') + '"><h3>RoSCTL (garments and made-ups)<em>' + (rsAmt != null ? inr(rsAmt) : '—') + '</em></h3><div class="k">' + kk + '</div><div class="eb-x">Chapters 61, 62 and 63 get RoSCTL instead of RoDTEP. Issued as a transferable duty credit scrip on ICEGATE. Scheme valid to 31 December 2026.</div></div>';
      if (rsAmt) total += rsAmt;
    } else {
      var a = ty === 'DTA' ? x[4] : x[5], rdAmt = null, k2 = '';
      if (!a) k2 = 'This tariff line is not in RoDTEP ' + (ty === 'DTA' ? 'Appendix 4R' : 'Appendix 4RE') + ', so no RoDTEP is available.';
      else if (a[0] === -1) { k2 = 'Fixed rebate: <b>₹' + a[2] + ' per ' + h(uq(a[3])) + '</b>.'; if (qty != null) rdAmt = a[2] * qty; else k2 += ' Enter the quantity to estimate.'; }
      else if (a[0] === 0) { rdAmt = 0; k2 = 'The RoDTEP rate for this line is <b>Nil</b>.'; }
      else {
        k2 = '<b>' + a[0] + '% of FOB</b>' + (a[1] ? ', capped at <b>₹' + a[1] + ' per ' + h(uq(a[3])) + '</b>' : '') + ' (' + (ty === 'DTA' ? 'Appendix 4R' : 'Appendix 4RE, for AA, EOU and SEZ exports') + ').';
        if (fob != null) { rdAmt = fob * a[0] / 100; if (a[1] && qty != null) { if (a[1] * qty < rdAmt) { rdAmt = a[1] * qty; k2 += ' The cap applies to this shipment.'; } } else if (a[1]) k2 += ' Enter the quantity in ' + h(uq(a[3])) + ' to apply the cap.'; }
      }
      rS = '<div class="eb-s' + (rdAmt == null && !a ? ' eb-na' : '') + '"><h3>RoDTEP<em>' + (rdAmt != null ? inr(rdAmt) : (a ? '—' : 'not listed')) + '</em></h3><div class="k">' + k2 + '</div><div class="eb-x">Claim it on the shipping bill; the credit comes as a transferable e-scrip on ICEGATE that you can use for import duty or sell. Scheme valid to 31 December 2026 (DGFT Notification 41/2026-27).</div></div>';
      if (rdAmt) total += rdAmt;
    }

    H += S;
    if (fob != null) H += '<div class="eb-big"><span>Estimated export incentives on this shipment</span><b>' + inr(total) + '</b><span>' + (fob ? ((total / fob) * 100).toFixed(2) + '% of FOB ' + inr(fob) : '') + '</span></div>';
    else H += '<div class="eb-note" style="margin-top:14px">Enter the FOB value (and quantity, for per-unit caps) to see the amounts in rupees.</div>';
    H += dbS + rS;
    H += '<div class="eb-s"><h3>Also check</h3><div class="k">' +
      '• <b>IGST refund</b>: export with IGST paid and get it refunded automatically, or export without tax under a <b>Letter of Undertaking (LUT)</b>.<br>' +
      '• <b>Niryat Protsahan</b> (Export Promotion Mission): 2.75% interest subvention on export credit for MSMEs, for HS lines on the government\'s positive list.<br>' +
      '• <b>Advance Authorisation</b>: import inputs duty-free against an export obligation.<br>' +
      '• <b>EPCG</b>: import capital goods at zero duty against an export obligation of six times the duty saved.<br>' +
      '• <b>MEIS</b> ended on 31 December 2020 and was replaced by RoDTEP.</div></div>';
    H += '<div class="eb-cta"><a href="https://wa.me/YAMLOGISTICS?text=' + encodeURIComponent('Hi YAM, I export ' + x[1] + ' (HS ' + code + '). Please help me claim drawback / RoDTEP.') + '" style="background:#25D366;color:#06331A">Ask our export desk on WhatsApp</a><a href="contact.html" style="background:#0A6CC2;color:#fff">Get a quote</a></div>';
    H += '<div class="eb-src">Sources: ' + h(D.v) + '. Estimates exclude conditions such as realisation of export proceeds, value-addition rules and items on the RoDTEP ineligible list. Please verify before you rely on them.</div>';
    out.innerHTML = H;
  }

  fetch('export-data.json?v=2').then(function (x) { return x.json(); }).then(function (j) {
    D = j; build();
    list.innerHTML = '<div class="eb-empty">Start typing an HS code or a product name.</div>';
    var m = /[?#&]hs=(\d{4,8})/.exec(location.href);
    if (m) { q.value = m[1]; renderList(search(m[1])); }
  }).catch(function () { list.innerHTML = '<div class="eb-empty">Could not load the export schedules. Please refresh the page.</div>'; });
})();
