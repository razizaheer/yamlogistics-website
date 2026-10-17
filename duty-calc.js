/* YAM Logistics – India customs duty calculator (client-side, static data) */
(function () {
  var root = document.getElementById('dc-root');
  if (!root) return;
  var D = null, sel = null;
  var WA = 'YAMLOGISTICS';
  var FTA = {
    'United Arab Emirates': { a: 'India–UAE CEPA', data: 'uae' },
    'Japan': { a: 'India–Japan CEPA' }, 'South Korea': { a: 'India–Korea CEPA' },
    'Australia': { a: 'India–Australia ECTA' }, 'Mauritius': { a: 'India–Mauritius CECPA' },
    'Singapore': { a: 'India–Singapore CECA / ASEAN' }, 'Malaysia': { a: 'India–Malaysia CECA / ASEAN' },
    'Thailand': { a: 'India–ASEAN FTA' }, 'Vietnam': { a: 'India–ASEAN FTA' }, 'Indonesia': { a: 'India–ASEAN FTA' },
    'Philippines': { a: 'India–ASEAN FTA' }, 'Brunei': { a: 'India–ASEAN FTA' }, 'Cambodia': { a: 'India–ASEAN FTA' },
    'Laos': { a: 'India–ASEAN FTA' }, 'Myanmar': { a: 'India–ASEAN FTA' },
    'Sri Lanka': { a: 'India–Sri Lanka FTA / SAFTA' }, 'Nepal': { a: 'India–Nepal Treaty / SAFTA' },
    'Bhutan': { a: 'India–Bhutan Agreement / SAFTA' }, 'Bangladesh': { a: 'SAFTA' }, 'Maldives': { a: 'SAFTA' },
    'Afghanistan': { a: 'SAFTA' }, 'Switzerland': { a: 'India–EFTA TEPA' }, 'Norway': { a: 'India–EFTA TEPA' },
    'Iceland': { a: 'India–EFTA TEPA' }, 'Liechtenstein': { a: 'India–EFTA TEPA' }, 'Chile': { a: 'India–Chile PTA' },
    'Brazil': { a: 'India–MERCOSUR PTA' }, 'Argentina': { a: 'India–MERCOSUR PTA' }, 'Uruguay': { a: 'India–MERCOSUR PTA' },
    'Paraguay': { a: 'India–MERCOSUR PTA' }, 'Afghanistan ': { a: 'India–Afghanistan PTA' }
  };
  var COUNTRIES = ['China', 'United States', 'United Arab Emirates', 'Germany', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Vietnam', 'Indonesia', 'Taiwan', 'Hong Kong', 'United Kingdom', 'Italy', 'France', 'Netherlands', 'Belgium', 'Spain', 'Switzerland', 'Australia', 'Saudi Arabia', 'Qatar', 'Oman', 'Kuwait', 'Bahrain', 'Russia', 'Turkey', 'Israel', 'Sri Lanka', 'Bangladesh', 'Nepal', 'Bhutan', 'Maldives', 'Mauritius', 'South Africa', 'Kenya', 'Nigeria', 'Egypt', 'Brazil', 'Argentina', 'Chile', 'Mexico', 'Canada', 'Peru', 'Colombia', 'Uruguay', 'Paraguay', 'Norway', 'Iceland', 'Sweden', 'Denmark', 'Finland', 'Poland', 'Czech Republic', 'Austria', 'Ireland', 'Portugal', 'Philippines', 'Cambodia', 'Laos', 'Myanmar', 'Brunei', 'New Zealand', 'Afghanistan', 'Iran', 'Ukraine', 'Other'];
  var CUR = ['INR', 'USD', 'EUR', 'CNY', 'GBP', 'AED', 'JPY', 'SGD'];
  var POL = { F: ['Free', 'Import freely, no DGFT licence needed', '#E9FBF0', '#0F7A3D'], R: ['Restricted', 'Needs a DGFT authorisation or meets a policy condition', '#FFF4D6', '#9A5B00'], P: ['Prohibited', 'Cannot be imported', '#FFE3DF', '#B42318'], S: ['State trading (STE)', 'Import only through notified state agencies', '#F1E9FF', '#5B2BB5'], M: ['Varies', 'Policy differs between sub-lines; check the exact item', '#FFF4D6', '#9A5B00'], '?': ['Not found', 'Check the ITC(HS) Schedule I for this item', '#EEF2F6', '#3D5873'] };

  var css = document.createElement('style');
  css.textContent = '.dc{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:20px;align-items:start}@media(max-width:960px){.dc{grid-template-columns:1fr}}' +
    '.dc-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:26px;box-shadow:0 20px 50px rgba(11,42,74,.06)}' +
    '.dc-l{font-size:13px;font-weight:600;color:#3D5873;margin:0 0 6px;display:block}.dc-in{width:100%;box-sizing:border-box;padding:14px 16px;border:1px solid #C9DCEC;border-radius:14px;font:inherit;font-size:16px;color:#0B2A4A;background:#fff}' +
    '.dc-in:focus{outline:2px solid #0A6CC2;border-color:#0A6CC2}.dc-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}@media(max-width:560px){.dc-row{grid-template-columns:1fr}}' +
    '.dc-res{margin-top:14px;max-height:420px;overflow:auto;border:1px solid #E1EDF7;border-radius:16px}.dc-it{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #EEF4FA;background:#fff;padding:12px 14px;cursor:pointer;font:inherit;color:#0B2A4A}' +
    '.dc-it:hover,.dc-it.on{background:#EEF6FD}.dc-c{font-family:"Geist Mono",monospace;font-size:13px;color:#0A6CC2;font-weight:500}.dc-p{font-size:12px;color:#5E7891;margin-top:2px;line-height:1.4}.dc-d{font-size:15px;font-weight:600;margin-top:2px}' +
    '.dc-b{float:right;font-family:"Geist Mono",monospace;font-size:12px;background:#EEF6FD;color:#0B2A4A;border-radius:999px;padding:3px 9px;margin-left:8px}' +
    '.dc-t{width:100%;border-collapse:collapse;font-size:15px;margin-top:6px}.dc-t td{padding:10px 4px;border-bottom:1px solid #EEF4FA}.dc-t td:last-child{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}.dc-t .s{color:#5E7891;font-weight:400;font-size:13px}' +
    '.dc-tot td{border-bottom:0;font-size:18px;padding-top:14px}.dc-big{background:#0A6CC2;color:#fff;border-radius:20px;padding:20px 22px;margin:16px 0}.dc-big b{font-family:Archivo,sans-serif;font-weight:900;font-size:40px;display:block;line-height:1.05}' +
    '.dc-pill{display:inline-block;border-radius:999px;padding:5px 12px;font-size:13px;font-weight:600}.dc-note{font-size:13px;line-height:1.55;color:#3D5873;background:#F7FBFF;border-radius:14px;padding:12px 14px;margin-top:10px}' +
    '.dc-h{font-family:Archivo,sans-serif;font-weight:800;font-size:20px;margin:22px 0 8px}.dc-x{font-size:13px;color:#3D5873;line-height:1.5;border-left:3px solid #FFC93C;padding:6px 10px;margin:6px 0;background:#FFFBF0;border-radius:0 10px 10px 0}' +
    '.dc-cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.dc-cta a{padding:13px 20px;border-radius:999px;font-weight:600;text-decoration:none}.dc-empty{color:#5E7891;padding:30px 10px;text-align:center}' +
    '.dc-tabs{display:inline-flex;background:#EEF6FD;border-radius:999px;padding:4px;gap:4px;margin-top:8px}.dc-tabs button{border:0;border-radius:999px;padding:8px 14px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;background:transparent;color:#3D5873}.dc-tabs button.on{background:#0A6CC2;color:#fff}' +
    '.dc-src{font-size:12px;color:#5E7891;margin-top:14px;line-height:1.5}' +
    '.dc-warn{background:#FFF4D6;border:1px solid #F5D08A;color:#7A3E00;border-radius:18px;padding:16px 20px;margin-bottom:18px;font-size:14px;line-height:1.55}.dc-warn b{color:#7A3E00}.dc-warn a{color:#7A3E00;font-weight:600}' +
    '.dc-ack{display:flex;gap:10px;align-items:flex-start;background:#FFFBF0;border:1px solid #F5D08A;border-radius:14px;padding:14px 16px;font-size:14px;line-height:1.5;color:#4A3200;margin-top:14px;cursor:pointer}.dc-ack input{width:20px;height:20px;flex:none;margin-top:1px;accent-color:#0A6CC2}' +
    '.dc-legal{font-size:12.5px;line-height:1.55;color:#7A3E00;background:#FFF8E6;border-radius:12px;padding:12px 14px;margin-top:16px}';
  document.head.appendChild(css);

  function h(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fc(c) { return c.slice(0, 4) + ' ' + c.slice(4, 6) + ' ' + c.slice(6); }
  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function pct(n) { return (Math.round(n * 100) / 100) + '%'; }

  root.innerHTML = '<div class="dc-warn" role="note"><b>Important: for guidance only.</b> This calculator gives an indicative estimate based on published tariff data. It is not a customs assessment, a classification ruling or legal advice, and the duty you actually pay may differ. YAM Logistics Pvt. Ltd. accepts no legal responsibility for any use of or reliance on these results. Always verify with Customs, DGFT and a licensed customs broker before you act. <a href="#disclaimer">Read the full disclaimer</a>.</div>' +
    '<div class="dc"><div class="dc-card">' +
    '<label class="dc-l" for="dc-q">HSN code or description of goods</label>' +
    '<input id="dc-q" class="dc-in" placeholder="e.g. 8517 13 00, or “lithium battery”, “steel pipes”" autocomplete="off">' +
    '<div class="dc-row"><div><label class="dc-l" for="dc-o">Country of origin</label><select id="dc-o" class="dc-in"></select></div>' +
    '<div><label class="dc-l" for="dc-t">Invoice terms</label><select id="dc-t" class="dc-in"><option value="CIF">CIF (cost, insurance, freight)</option><option value="CNF">C&amp;F / CFR (cost and freight)</option><option value="FOB">FOB (free on board)</option></select></div></div>' +
    '<div style="margin-top:16px"><label class="dc-l" for="dc-v"><span id="dc-vl">CIF</span> value (optional)</label><div style="display:flex;gap:8px"><select id="dc-cur" class="dc-in" style="width:96px;flex:none"></select><input id="dc-v" class="dc-in" inputmode="decimal" placeholder="e.g. 100000"></div></div>' +
    '<div class="dc-row" id="dc-adj" style="display:none"><div id="dc-frw"><label class="dc-l" for="dc-fr">Freight <span style="font-weight:400;color:#5E7891">(default 20% of FOB)</span></label><input id="dc-fr" class="dc-in" inputmode="decimal" placeholder="Leave blank for 20%"></div><div><label class="dc-l" for="dc-in2">Insurance <span style="font-weight:400;color:#5E7891">(default 1.125%)</span></label><input id="dc-in2" class="dc-in" inputmode="decimal" placeholder="Leave blank for 1.125%"></div></div>' +
    '<div id="dc-fx" style="display:none;margin-top:10px"><label class="dc-l" for="dc-r">Exchange rate (₹ per unit) <span style="font-weight:400;color:#5E7891">— customs uses the CBIC-notified rate</span></label><input id="dc-r" class="dc-in" inputmode="decimal"></div>' +
    '<label class="dc-ack"><input type="checkbox" id="dc-ack"><span>I understand that results are <b>indicative estimates for guidance only</b>, are not a customs assessment or legal advice, and that YAM Logistics Pvt. Ltd. accepts <b>no liability</b> for their use. I have read the <a href="#disclaimer">disclaimer</a>.</span></label>' +
    '<div id="dc-list" class="dc-res"><div class="dc-empty">Loading the tariff…</div></div></div>' +
    '<div class="dc-card" id="dc-out"><div class="dc-empty">Search for your goods and pick a tariff line to see the duty.</div></div></div>';

  var q = document.getElementById('dc-q'), o = document.getElementById('dc-o'), v = document.getElementById('dc-v'), cur = document.getElementById('dc-cur'), r = document.getElementById('dc-r'), list = document.getElementById('dc-list'), out = document.getElementById('dc-out');
  o.innerHTML = '<option value="">Select country…</option>' + COUNTRIES.map(function (c) { return '<option>' + h(c) + (FTA[c] ? ' ★' : '') + '</option>'; }).join('').replace(/ ★<\/option>/g, ' (trade agreement)</option>');
  cur.innerHTML = CUR.map(function (c) { return '<option>' + c + '</option>'; }).join('');
  var terms = document.getElementById('dc-t'), frI = document.getElementById('dc-fr'), insI = document.getElementById('dc-in2');
  function termsUI() {
    var t = terms.value;
    document.getElementById('dc-vl').textContent = t === 'CNF' ? 'C&F' : t;
    document.getElementById('dc-adj').style.display = t === 'CIF' ? 'none' : 'grid';
    document.getElementById('dc-frw').style.display = t === 'FOB' ? 'block' : 'none';
    recalc();
  }
  terms.addEventListener('change', termsUI);
  [frI, insI].forEach(function (el) { el.addEventListener('input', recalc); });
  var ack = document.getElementById('dc-ack');
  try { if (sessionStorage.getItem('yam-dc-ack') === '1') ack.checked = true; } catch (e) {}
  ack.addEventListener('change', function () { try { sessionStorage.setItem('yam-dc-ack', ack.checked ? '1' : '0'); } catch (e) {} recalc(); });
  var fxCache = {};
  function getFx(c) {
    if (c === 'INR') return;
    if (fxCache[c]) { r.value = fxCache[c]; recalc(); return; }
    fetch('https://api.frankfurter.dev/v1/latest?base=' + c + '&symbols=INR').then(function (x) { return x.json(); }).then(function (j) {
      if (j && j.rates && j.rates.INR) { fxCache[c] = j.rates.INR.toFixed(2); if (cur.value === c) { r.value = fxCache[c]; recalc(); } }
    }).catch(function () {});
  }
  cur.addEventListener('change', function () { document.getElementById('dc-fx').style.display = cur.value === 'INR' ? 'none' : 'block'; r.value = ''; getFx(cur.value); recalc(); });
  [o, v, r].forEach(function (el) { el.addEventListener('input', recalc); el.addEventListener('change', recalc); });

  var idx = null;
  function norm(s) { return s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function stem(w) { return w.length > 4 ? w.replace(/(ies)$/, 'y').replace(/(es|s)$/, '') : w; }
  function build() {
    idx = D.rows.map(function (x) { return { d: ' ' + norm(x[1]).split(' ').map(stem).join(' ') + ' ', p: ' ' + norm(D.paths[x[2]]).split(' ').map(stem).join(' ') + ' ' }; });
  }
  var STOP = { of: 1, and: 1, the: 1, for: 1, or: 1, with: 1, in: 1, a: 1, an: 1, to: 1, other: 1, made: 1 };
  function search(t) {
    var digits = t.replace(/[\s.\-]/g, '');
    if (/^\d{2,8}$/.test(digits)) {
      return D.rows.map(function (x, i) { return i; }).filter(function (i) { return D.rows[i][0].indexOf(digits) === 0; }).slice(0, 60);
    }
    var ws = norm(t).split(' ').filter(function (w) { return w && !STOP[w]; }).map(stem);
    if (!ws.length) return [];
    var sc = [];
    for (var i = 0; i < idx.length; i++) {
      var s = 0, all = true;
      for (var k = 0; k < ws.length; k++) {
        var w = ws[k], inD = idx[i].d.indexOf(' ' + w) >= 0, inP = idx[i].p.indexOf(' ' + w) >= 0;
        if (inD) s += 3; else if (inP) s += 1; else all = false;
        if (idx[i].d.indexOf(' ' + w + ' ') >= 0) s += 1;
      }
      if (s > 0) sc.push([all ? s + 10 : s, i]);
    }
    sc.sort(function (a, b) { return b[0] - a[0] || (D.rows[a[1]][0] < D.rows[b[1]][0] ? -1 : 1); });
    return sc.slice(0, 60).map(function (x) { return x[1]; });
  }
  function renderList(ids) {
    if (!ids.length) { list.innerHTML = '<div class="dc-empty">No matching tariff lines. Try another word, or the first 4 digits of the HSN code.</div>'; return; }
    list.innerHTML = ids.map(function (i) {
      var x = D.rows[i];
      return '<button class="dc-it' + (sel === i ? ' on' : '') + '" data-i="' + i + '"><span class="dc-b">BCD ' + h(x[4] || '?') + '</span><span class="dc-c">' + fc(x[0]) + '</span><div class="dc-d">' + h(x[1]) + '</div><div class="dc-p">' + h(D.paths[x[2]].slice(0, 160)) + '</div></button>';
    }).join('');
  }
  list.addEventListener('click', function (e) { var b = e.target.closest('.dc-it'); if (!b) return; sel = +b.getAttribute('data-i'); [].forEach.call(list.querySelectorAll('.dc-it'), function (n) { n.classList.toggle('on', n === b); }); recalc(); if (window.innerWidth < 960) out.scrollIntoView({ behavior: 'smooth' }); });
  var tm;
  q.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { if (!D) return; var t = q.value.trim(); if (!t) { list.innerHTML = '<div class="dc-empty">Start typing an HSN code or a product name.</div>'; return; } renderList(search(t)); }, 160); });

  function recalc() {
    if (!D || sel == null) return;
    if (!ack.checked) { out.innerHTML = '<div class="dc-empty" style="color:#7A3E00">Please tick the box confirming you understand the results are for guidance only, then the estimate will appear here.</div>'; return; }
    var x = D.rows[sel], code = x[0], country = o.value.replace(/ \(trade agreement\)$/, ''), fta = FTA[country];
    var bcdTxt = x[4], bcd = x[5], bcdSrc = 'Customs Tariff (standard rate)';
    var n45 = x[10].map(function (i) { return D.n45[i]; });
    var auto = n45.filter(function (e) { return /^all goods(,? other than (those|goods|the goods) (mentioned|specified|covered) (at|in|under|against) s\.? ?nos?\.? ?[\dA-Z]+(,? (and|or) [\dA-Z]+)?( of this table)?)?\.?$/i.test(e[3]) && (e[2] === '-' || e[2] === '') && /^(Nil|[\d.]+\s?%)$/.test(e[1]); });
    var probable = null;
    if (!auto.length) n45.forEach(function (e) { if (!probable && e[4].indexOf(code) >= 0 && (e[2] === '-' || e[2] === '') && /^(Nil|[\d.]+\s?%)$/.test(e[1]) && !/for use|imported by|when imported|specified|list|other than|if imported|subject to|for the manufacture|for manufacture/i.test(e[3])) probable = e; });
    if (probable) auto = [probable];
    if (auto.length) { var a = auto[auto.length - 1]; bcd = a[1] === 'Nil' ? 0 : parseFloat(a[1]); bcdSrc = (/\//.test(a[0]) ? 'Notification ' + a[0] : 'Notification 45/2025-Customs, S. No. ' + a[0]) + (a === probable ? ' (for: ' + a[3].slice(0, 80) + ')' : ''); }
    var n57 = (D.n57 || []).filter(function (e) { return e[4].some(function (c) { return code.indexOf(c) === 0; }); });
    n57.forEach(function (e) { if (e[5] === 1) { var r = e[1] === 'Nil' ? 0 : parseFloat(e[1]); if (bcd == null || r < bcd) { bcd = r; bcdSrc = 'Notification 57/2017-Customs, S. No. ' + e[0] + ' (as amended)'; } } });
    var prefUsed = false;
    var noRate = (bcd == null);
    if (fta && fta.data === 'uae' && x[11] != null && (bcd == null || x[11] < bcd)) { bcd = x[11]; bcdSrc = 'India–UAE CEPA (Notification 22/2022-Customs), with a valid certificate of origin'; prefUsed = true; }
    var ig = x[6].map(function (i) { return D.igst[i]; }), igRate = ig.length ? ig[0][0] : 18, igSure = x[7] === 1;
    var alco = /^220[3-8]/.test(code) && !/^2207/.test(code);
    if (alco) { ig = []; igRate = 0; igSure = true; }
    var pfx = function (l) { return l.some(function (c) { return code.indexOf(c) === 0; }); };
    var plen = function (l) { var m = 0; l.forEach(function (c) { if (code.indexOf(c) === 0 && c.length > m) m = c.length; }); return m; };
    var aM = (D.aidc2 || []).filter(function (e) { return pfx(e[1]) && !pfx(e[6] || []); });
    var aAuto = null; aM.forEach(function (e) { if (e[4] === 1 && /^(Nil|[\d.]+\s?%)$/.test(e[3]) && (!aAuto || plen(e[1]) >= plen(aAuto[1]))) aAuto = e; });
    var aidcR = aAuto ? (aAuto[3] === 'Nil' ? 0 : parseFloat(aAuto[3])) : 0;
    var aOther = aM.filter(function (e) { return e !== aAuto && !(aAuto && /^SA-/.test(aAuto[0]) && plen(e[1]) <= plen(aAuto[1])); });
    var sM = (D.sws2 || []).filter(function (e) { return pfx(e[1]); });
    var swsE = null; sM.forEach(function (e) { if (e[3] === 1 && !swsE) swsE = e; });
    var swsNo = swsE ? swsE[0] : null, swsOther = sM.filter(function (e) { return e[3] !== 1; });
    var val = parseFloat(String(v.value).replace(/,/g, '')) || 0;
    var rate = cur.value === 'INR' ? 1 : (parseFloat(r.value) || 0);
    var t = terms.value, num = function (el) { var n = parseFloat(String(el.value).replace(/,/g, '')); return isNaN(n) ? null : n; };
    var fob = 0, fr = 0, ins = 0, cnf = 0, cif = 0, frDef = false, insDef = false;
    if (t === 'FOB') { fob = val; fr = num(frI); if (fr == null) { fr = fob * 0.20; frDef = true; } ins = num(insI); if (ins == null) { ins = fob * 0.01125; insDef = true; } cif = fob + fr + ins; }
    else if (t === 'CNF') { cnf = val; ins = num(insI); if (ins == null) { ins = cnf * 0.01125; insDef = true; } cif = cnf + ins; }
    else cif = val;
    var cifR = cif * rate, landing = cifR * 0.01;
    var av = cifR + landing;
    if (noRate) av = 0;
    var bcdAmt = bcd != null ? av * bcd / 100 : 0, sws = swsNo != null ? 0 : bcdAmt * 0.10, aidcAmt = av * aidcR / 100, igst = (av + bcdAmt + sws + aidcAmt) * igRate / 100, tot = bcdAmt + sws + aidcAmt + igst;
    var pol = POL[x[8]] || POL['?'];
    var H = '';
    H += '<div class="dc-c" style="font-size:15px">' + fc(code) + '</div><div style="font-family:Archivo,sans-serif;font-weight:800;font-size:24px;line-height:1.15;margin:4px 0 6px">' + h(x[1]) + '</div><div class="dc-p" style="font-size:13px">' + h(D.paths[x[2]]) + '</div>';
    H += '<div style="margin-top:12px"><span class="dc-pill" style="background:' + pol[2] + ';color:' + pol[3] + '">DGFT import policy: ' + pol[0] + '</span> <span class="s" style="font-size:13px;color:#5E7891">' + pol[1] + '</span></div>';
    if (x[9]) H += '<div class="dc-note"><b>Policy detail:</b> ' + h(x[9]) + '…</div>';
    if (noRate) H += '<div class="dc-x" style="margin-top:16px">The basic customs duty rate for this tariff line is not yet loaded in the calculator, so we can’t estimate the duty. Ask us on WhatsApp and a broker will confirm it.</div>';
    if (av > 0) {
      H += '<div class="dc-big"><span style="font-size:13px;opacity:.85">INDICATIVE ESTIMATE · FOR GUIDANCE ONLY</span><b>' + inr(tot) + '</b><span style="font-size:14px;opacity:.9">Effective rate ' + pct(cifR ? tot / cifR * 100 : 0) + ' of CIF · landed cost ' + inr(cifR + tot) + '</span></div>';
    } else if (!noRate) {
      H += '<div class="dc-note" style="margin-top:16px">Enter the invoice value to see the duty in rupees.</div>';
    }
    H += '<table class="dc-t">';
    if (av > 0) {
      var R = function (n) { return inr(n * rate); };
      if (t === 'FOB') {
        H += '<tr><td>FOB value' + (rate !== 1 ? ' <span class="s">' + cur.value + ' × ' + rate + '</span>' : '') + '</td><td>' + R(fob) + '</td></tr>';
        H += '<tr><td>Freight <span class="s">' + (frDef ? '20% of FOB (default)' : 'as entered') + '</span></td><td>' + R(fr) + '</td></tr>';
        H += '<tr><td>Insurance <span class="s">' + (insDef ? '1.125% of FOB (default)' : 'as entered') + '</span></td><td>' + R(ins) + '</td></tr>';
      } else if (t === 'CNF') {
        H += '<tr><td>C&amp;F value' + (rate !== 1 ? ' <span class="s">' + cur.value + ' × ' + rate + '</span>' : '') + '</td><td>' + R(cnf) + '</td></tr>';
        H += '<tr><td>Insurance <span class="s">' + (insDef ? '1.125% of C&amp;F (default)' : 'as entered') + '</span></td><td>' + R(ins) + '</td></tr>';
      }
      H += '<tr><td>CIF value' + (t === 'CIF' && rate !== 1 ? ' <span class="s">' + cur.value + ' × ' + rate + '</span>' : '') + '</td><td>' + inr(cifR) + '</td></tr>';
      H += '<tr><td>Landing charges <span class="s">1% of CIF</span></td><td>' + inr(landing) + '</td></tr>';
      H += '<tr><td><b>Assessable value</b> <span class="s">CIF + landing charges</span></td><td>' + inr(av) + '</td></tr>';
    }
    H += '<tr><td>Basic customs duty <span class="s">' + (bcd != null ? pct(bcd) : h(bcdTxt || '—')) + ' · ' + h(bcdSrc) + '</span></td><td>' + (av > 0 ? inr(bcdAmt) : (bcd != null ? pct(bcd) : '—')) + '</td></tr>';
    if (swsNo != null) H += '<tr><td>Social welfare surcharge <span class="s">exempt · Notification 11/2018-Customs, S. No. ' + swsNo + '</span></td><td>' + (av > 0 ? inr(0) : 'Nil') + '</td></tr>';
    else H += '<tr><td>Social welfare surcharge <span class="s">10% of BCD</span></td><td>' + (av > 0 ? inr(sws) : '10%') + '</td></tr>';
    if (aAuto && aidcR > 0) H += '<tr><td>Agriculture cess (AIDC) <span class="s">' + pct(aidcR) + ' · Notification ' + (/^SA-/.test(aAuto[0]) ? aAuto[0].slice(3) + '-Customs' : '11/2021-Customs, S. No. ' + h(aAuto[0])) + '</span></td><td>' + (av > 0 ? inr(aidcAmt) : pct(aidcR)) + '</td></tr>';
    if (alco) H += '<tr><td>IGST <span class="s">not applicable: alcoholic liquor for human consumption is outside GST</span></td><td>—</td></tr>';
    else H += '<tr><td>IGST <span class="s">' + pct(igRate) + (igSure ? '' : ' · likely, check below') + ' · on value + BCD + SWS' + (aidcAmt > 0 ? ' + AIDC' : '') + '</span></td><td>' + (av > 0 ? inr(igst) : pct(igRate)) + '</td></tr>';
    if (av > 0) H += '<tr class="dc-tot"><td><b>Total duty &amp; IGST</b></td><td>' + inr(tot) + '</td></tr>';
    H += '</table>';
    if (aOther.length) { H += '<div class="dc-x" style="border-left-color:#B42318;background:#FFF1EF"><b>Agriculture cess (AIDC) may apply' + (aAuto ? ' at a different rate' : '') + ' and is not included above:</b> ' + aOther.slice(0, 3).map(function (e) { return h(e[3]) + ' (11/2021, S. No. ' + h(e[0]) + ': ' + h(e[2].slice(0, 120)) + (e[5] ? '. ' + h(e[5].slice(0, 140)) : '') + ')'; }).join('; ') + '. Ask us to confirm.</div>'; }
    if (swsOther.length && swsNo == null) H += '<div class="dc-x">Social welfare surcharge may be exempt for some goods under this code (Notification 11/2018-Customs, S. No. ' + h(swsOther[0][0]) + ': ' + h(swsOther[0][2].slice(0, 160)) + '). The estimate above includes it.</div>';
    var n45n = n45.filter(function (e) { return e[5]; }); if (n45n.length && auto.indexOf(n45n[0]) >= 0) H += '<div class="dc-x">' + h(n45n[0][5]) + '</div>';
    if (bcdTxt && /Rs\./.test(bcdTxt)) H += '<div class="dc-x">Tariff rate is <b>' + h(bcdTxt) + '</b>. Where a specific duty per unit is higher, that amount applies, so the actual duty may be more.</div>';
    if (fta && !prefUsed) H += '<div class="dc-x"><b>' + h(country) + '</b> is covered by the <b>' + h(fta.a) + '</b>. Goods that meet its rules of origin may pay a lower basic customs duty with a certificate of origin. ' + (fta.data ? 'No lower rate is listed for this line.' : 'We are adding this agreement’s rates; ask us for the preferential rate.') + '</div>';
    if (prefUsed) H += '<div class="dc-x">Standard tariff rate without a certificate of origin: <b>' + h(bcdTxt) + '</b>.</div>';
    if (ig.length > 1 || !igSure) {
      H += '<div class="dc-h">IGST: confirm the right entry</div>';
      ig.slice(0, 4).forEach(function (e) { H += '<div class="dc-x"><b>' + pct(e[0]) + '</b> · Schedule ' + e[1] + ', S. No. ' + h(e[2]) + ': ' + h(e[3].slice(0, 220)) + (e[3].length > 220 ? '…' : '') + '</div>'; });
      if (/^0[1-9]|^1[0-4]/.test(code)) H += '<div class="dc-note">Many fresh farm products are fully exempt from IGST under a separate exemption notification. Ask us to confirm.</div>';
    }
    var cond = n45.filter(function (e) { return auto.indexOf(e) < 0; });
    if (cond.length) {
      H += '<div class="dc-h">Possible concessions (Notification 45/2025-Customs)</div><div class="s" style="font-size:13px;color:#5E7891;margin-bottom:4px">These apply only to the goods described, often with conditions or for specific users.</div>';
      cond.slice(0, 6).forEach(function (e) { H += '<div class="dc-x"><b>S. No. ' + h(e[0]) + (e[1] ? ' · BCD ' + h(e[1]) : '') + '</b>' + (e[2] && e[2] !== '-' ? ' · condition ' + h(e[2]) : '') + ': ' + h(e[3].slice(0, 230)) + (e[3].length > 230 ? '…' : '') + '</div>'; });
      if (cond.length > 6) H += '<div class="s" style="font-size:13px;color:#5E7891">+ ' + (cond.length - 6) + ' more entries.</div>';
    }
    var c57 = n57.filter(function (e) { return e[5] !== 1; });
    if (c57.length) {
      H += '<div class="dc-h">Possible concessions (Notification 57/2017-Customs, mobile phones and parts)</div>';
      c57.forEach(function (e) { H += '<div class="dc-x"><b>S. No. ' + h(e[0]) + ' · BCD ' + h(e[1]) + '</b>' + (e[2] ? ' · condition ' + h(e[2]) + ' (end-use, under the IGCR Rules)' : '') + ': ' + h(e[3]) + '</div>'; });
    }
    H += '<div class="dc-note"><b>Not included:</b> anti-dumping, safeguard or countervailing duty; agriculture cess (AIDC) where it is not shown in the table; compensation cess on tobacco; concessions under other end-use or manufacturing notifications; and port, freight forwarding and clearance charges.</div>';
    var msg = 'Hello YAM, please confirm the import duty for HSN ' + fc(code) + ' (' + x[1].slice(0, 60) + ')' + (country ? ', origin ' + country : '') + (val ? ', ' + (t === 'CNF' ? 'C&F' : t) + ' ' + cur.value + ' ' + val : '') + '. Calculator estimate (indicative): ' + (av > 0 ? inr(tot) : 'BCD ' + (bcd != null ? pct(bcd) : bcdTxt) + ', IGST ' + pct(igRate)) + '.';
    H += '<div class="dc-cta"><a href="https://wa.me/' + WA + '?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener" style="background:#25D366;color:#06331A">Confirm with a broker on WhatsApp</a><a href="contact.html" style="background:#0A6CC2;color:#fff">Get a clearance quote →</a></div>';
    H += '<div class="dc-legal"><b>Disclaimer:</b> indicative estimate for guidance only. Not a customs assessment, classification ruling or legal advice. Duty is finally assessed by Customs, and classification and declarations remain the importer’s responsibility. YAM Logistics Pvt. Ltd. accepts no liability for any loss, duty, interest, penalty or cost arising from use of or reliance on this result. <a href="#disclaimer" style="color:#7A3E00;font-weight:600">Full disclaimer</a>.</div>';
    H += '<div class="dc-src">Source: ' + h(D.v) + '. Includes Budget 2025 and Budget 2026 changes.</div>';
    out.innerHTML = H;
  }

  fetch('duty-data.json?v=7').then(function (x) { return x.json(); }).then(function (j) {
    D = j; build();
    list.innerHTML = '<div class="dc-empty">Start typing an HSN code or a product name.</div>';
    var m = location.hash.match(/hs=(\d{4,8})/);
    if (m) { q.value = m[1]; renderList(search(m[1])); var i = D.rows.findIndex(function (x) { return x[0].indexOf(m[1]) === 0; }); if (i >= 0) { sel = i; recalc(); } }
  }).catch(function () { list.innerHTML = '<div class="dc-empty">Could not load the tariff. Please refresh the page.</div>'; });
})();
