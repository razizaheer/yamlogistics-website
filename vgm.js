/* VGM declaration maker (CargoKit / YAM Logistics).
   Fill in the shipper, the booking and one line per container; the tool works out the verified gross mass,
   checks it against the container's limits and makes an A4 declaration (PDF), a text copy and a CSV.
   Everything stays in the browser (localStorage 'ck_vgm_v1'). PDFs carry CargoKit branding only. */
(function () {
  'use strict';
  var D = document, root = D.getElementById('vgm-root'); if (!root) return;
  var KEY = 'ck_vgm_v1';
  var TYPES = [['20GP', "20' Standard", 2200, 30480], ['40GP', "40' Standard", 3750, 32500], ['40HC', "40' High Cube", 3900, 32500], ['20RF', "20' Reefer", 3000, 30480], ['40RH', "40' High Cube Reefer", 4600, 34000], ['45HC', "45' High Cube", 4800, 32500], ['20OT', "20' Open Top", 2350, 30480], ['40OT', "40' Open Top", 3950, 32500], ['20FR', "20' Flat Rack", 2750, 34000], ['40FR', "40' Flat Rack", 5200, 45000], ['20TK', "20' Tank", 3600, 36000], ['OTH', 'Other', 0, 0]];
  var CARGO = ['Normal', 'Reefer', 'Hazardous', 'Other'];
  var S = { shipper: '', addr: '', reg: '', person: '', desig: '', contact: '', booking: '', bl: '', line: '', vessel: '', pol: '', method: '1', unit: 'kg', appr: '', lh: false, bk: true, rows: [] };
  function blank() { return { no: '', type: '40HC', max: '', tare: '', gross: '', truck: '', cargo: '', pack: '', seal: '', wb: '', wbreg: '', slip: '', when: '', ctype: 'Normal', un: '', how: 'direct' }; }
  function load() { try { var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.rows) { for (var k in S) if (j[k] != null) S[k] = j[k]; } } catch (e) {} if (!S.rows.length) S.rows = [blank()]; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var num = function (v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; };
  var fmt = function (n) { return (Math.round(n * 10) / 10).toLocaleString('en-IN', { maximumFractionDigits: 1 }); };
  var typeOf = function (id) { for (var i = 0; i < TYPES.length; i++) if (TYPES[i][0] === id) return TYPES[i]; return TYPES[TYPES.length - 1]; };

  // ISO 6346: owner code (3 letters) + U/J/Z + 6 digits + check digit
  function cnCheck(v) {
    var s = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!s) return { ok: false, empty: true, s: s };
    if (!/^[A-Z]{4}\d{7}$/.test(s)) return { ok: false, s: s, why: 'A container number is 4 letters and 7 digits, like MSKU1234565' };
    var sum = 0;
    for (var i = 0; i < 10; i++) {
      var c = s.charCodeAt(i), val;
      if (c >= 65) { val = c - 55; val += Math.floor((val - 1) / 10); /* skip multiples of 11 */ } else val = c - 48;
      sum += val * Math.pow(2, i);
    }
    var cd = sum % 11 % 10;
    return cd === +s.charAt(10) ? { ok: true, s: s } : { ok: false, s: s, why: 'Check digit should be ' + cd + '. Please check the number against the container door' };
  }
  // the verified gross mass of one line, in the chosen unit
  function vgmOf(r) {
    if (S.method === '2') return num(r.cargo) + num(r.pack) + num(r.tare);
    if (r.how === 'truck') return num(r.gross) - num(r.truck);
    return num(r.gross);
  }
  function problems(r) {
    var p = [], v = vgmOf(r), c = cnCheck(r.no), mx = num(r.max), tr = num(r.tare);
    if (c.empty) p.push(['e', 'Container number is missing']); else if (!c.ok) p.push(['w', c.why]);
    if (!(v > 0)) p.push(['e', 'Weights are missing, so there is no VGM yet']);
    else {
      if (mx > 0 && v > mx) p.push(['e', 'VGM is ' + fmt(v - mx) + ' ' + S.unit + ' over the maximum gross mass on the CSC plate. The line will not load it']);
      if (tr > 0 && v <= tr) p.push(['e', 'VGM is not more than the tare weight. Check the figures']);
      if (S.method === '1' && r.how === 'truck' && num(r.truck) <= 0) p.push(['e', 'Enter the weight of the truck and chassis so it can be subtracted']);
    }
    if (S.method === '2' && !(tr > 0)) p.push(['e', 'Method 2 needs the tare weight printed on the container door']);
    if (S.method === '1' && !r.slip) p.push(['w', 'Weighing slip number is missing']);
    if (r.ctype === 'Hazardous' && !r.un) p.push(['w', 'Hazardous cargo: add the UN number and class']);
    return p;
  }
  function headProblems() {
    var p = [];
    if (!S.shipper) p.push('Shipper name');
    if (!S.person) p.push('Authorised person');
    if (!S.booking && !S.bl) p.push('Booking or B/L number');
    return p;
  }

  var css = '.vg-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:26px;margin-bottom:16px}.vg-q{font-family:Archivo,sans-serif;font-weight:800;font-size:20px;margin:0 0 4px}.vg-m{color:#5E7891;font-size:14px;line-height:1.5;margin:0 0 14px}.vg-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.vg-f{display:flex;flex-direction:column;gap:5px;font-size:12px;color:#5E7891;font-family:"Geist Mono",monospace;letter-spacing:.04em;text-transform:uppercase}.vg-f input,.vg-f select,.vg-f textarea{font:16px Geist,system-ui,sans-serif;color:#0B2A4A;border:1px solid #CFE0EE;border-radius:12px;padding:11px 12px;background:#fff;text-transform:none;letter-spacing:0;min-width:0;width:100%;box-sizing:border-box}.vg-f input:focus,.vg-f select:focus,.vg-f textarea:focus{outline:2px solid #0A6CC2;border-color:#0A6CC2}.vg-seg{display:inline-flex;background:#EAF3FC;border-radius:999px;padding:4px;gap:2px;flex-wrap:wrap}.vg-seg button{border:0;background:transparent;border-radius:999px;padding:9px 16px;font:600 15px Geist,system-ui,sans-serif;color:#17436B;cursor:pointer}.vg-seg button.on{background:#0A6CC2;color:#fff}.vg-row{border:1px solid #E1EDF7;border-radius:18px;padding:16px;margin-bottom:12px;background:#F9FCFF}.vg-rh{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;font-weight:700}.vg-x{border:0;background:#FDECEC;color:#B91C1C;border-radius:999px;padding:6px 12px;cursor:pointer;font:600 13px Geist,system-ui,sans-serif}.vg-v{margin-top:12px;display:flex;flex-wrap:wrap;align-items:center;gap:10px}.vg-big{font-family:Archivo,sans-serif;font-weight:900;font-size:26px;color:#0B2A4A}.vg-ok{color:#15803D;font-weight:600}.vg-e{color:#B91C1C;font-size:14px;line-height:1.5}.vg-w{color:#B45309;font-size:14px;line-height:1.5}.vg-btn{border:0;border-radius:999px;padding:13px 22px;font:700 16px Geist,system-ui,sans-serif;cursor:pointer;background:#0A6CC2;color:#fff}.vg-btn.g{background:#EAF3FC;color:#0B2A4A}.vg-btn.y{background:#FFC93C;color:#0B2A4A}.vg-btn:disabled{opacity:.5;cursor:default}.vg-act{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.vg-note{background:#FFF9E8;border:1px solid #F3DE9B;border-radius:14px;padding:12px 14px;font-size:14px;line-height:1.55;color:#5B4708;margin:10px 0 0}.vg-sum{width:100%;border-collapse:collapse;font-size:15px}.vg-sum th{text-align:left;font:12px "Geist Mono",monospace;color:#5E7891;letter-spacing:.06em;text-transform:uppercase;padding:6px 8px;border-bottom:1px solid #E1EDF7}.vg-sum td{padding:8px;border-bottom:1px solid #EEF4FA}@media(max-width:640px){.vg-card{padding:16px;border-radius:18px}}';

  var F = function (label, key, val, o) {
    o = o || {};
    return '<label class="vg-f"><span>' + esc(label) + '</span>' + (o.opts ? '<select data-k="' + key + '">' + o.opts.map(function (x) { var v = x[0] !== undefined && x.length ? x[0] : x, t = x.length > 1 && typeof x !== 'string' ? x[1] : x; return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select>' : o.area ? '<textarea rows="2" data-k="' + key + '" placeholder="' + esc(o.ph || '') + '">' + esc(val) + '</textarea>' : '<input data-k="' + key + '" value="' + esc(val) + '" placeholder="' + esc(o.ph || '') + '"' + (o.num ? ' inputmode="decimal"' : '') + (o.type ? ' type="' + o.type + '"' : '') + '>') + '</label>';
  };
  function rowHtml(r, i) {
    var u = S.unit, m2 = S.method === '2', t = typeOf(r.type);
    var w = m2 ? F('Cargo weight, all packages (' + u + ')', 'r.cargo.' + i, r.cargo, { num: 1, ph: 'gross weight of the goods' }) + F('Pallets, dunnage, lashing (' + u + ')', 'r.pack.' + i, r.pack, { num: 1, ph: '0 if already included' }) + F('Container tare (' + u + ')', 'r.tare.' + i, r.tare, { num: 1, ph: 'on the door, e.g. ' + (t[2] || 3900) })
      : '<label class="vg-f"><span>What did the weighbridge weigh?</span><select data-k="r.how.' + i + '"><option value="direct"' + (r.how !== 'truck' ? ' selected' : '') + '>The packed container alone</option><option value="truck"' + (r.how === 'truck' ? ' selected' : '') + '>Truck with the container on it</option></select></label>' + F(r.how === 'truck' ? 'Truck + container (' + u + ')' : 'Weighed gross mass (' + u + ')', 'r.gross.' + i, r.gross, { num: 1 }) + (r.how === 'truck' ? F('Truck, chassis and fuel (' + u + ')', 'r.truck.' + i, r.truck, { num: 1, ph: 'empty truck weight' }) : '') + F('Container tare (' + u + ') · optional', 'r.tare.' + i, r.tare, { num: 1, ph: 'on the door' });
    return '<div class="vg-row" data-row="' + i + '"><div class="vg-rh"><span>Container ' + (i + 1) + '</span>' + (S.rows.length > 1 ? '<button type="button" class="vg-x" data-del="' + i + '">Remove</button>' : '') + '</div><div class="vg-g">' +
      F('Container number', 'r.no.' + i, r.no, { ph: 'MSKU1234565' }) + F('Size and type', 'r.type.' + i, r.type, { opts: TYPES.map(function (x) { return [x[0], x[1]]; }) }) + F('Max gross mass on CSC plate (' + u + ')', 'r.max.' + i, r.max, { num: 1, ph: t[3] ? 'e.g. ' + t[3] : '' }) + w + F('Seal number', 'r.seal.' + i, r.seal) +
      (m2 ? '' : F('Weighbridge name and address', 'r.wb.' + i, r.wb) + F('Weighbridge registration no.', 'r.wbreg.' + i, r.wbreg) + F('Weighing slip no.', 'r.slip.' + i, r.slip)) + F(m2 ? 'Date and time of packing' : 'Date and time of weighing', 'r.when.' + i, r.when, { type: 'datetime-local' }) + F('Type of cargo', 'r.ctype.' + i, r.ctype, { opts: CARGO }) + (r.ctype === 'Hazardous' ? F('UN number and class', 'r.un.' + i, r.un, { ph: 'UN 1263, class 3' }) : '') +
      '</div><div class="vg-v" id="vg-v' + i + '"></div></div>';
  }
  function verdict(i) {
    var el = D.getElementById('vg-v' + i), r = S.rows[i]; if (!el) return;
    var v = vgmOf(r), p = problems(r), mx = num(r.max), tr = num(r.tare);
    el.innerHTML = '<span class="vg-big">VGM ' + (v > 0 ? fmt(v) + ' ' + S.unit : '–') + '</span>' + (v > 0 && !p.some(function (x) { return x[0] === 'e'; }) ? '<span class="vg-ok">✓ ' + (mx > 0 ? fmt(mx - v) + ' ' + S.unit + ' below the CSC limit' : 'ready') + (tr > 0 && S.method === '1' ? ' · cargo about ' + fmt(v - tr) + ' ' + S.unit : '') + '</span>' : '') + (p.length ? '<div style="flex-basis:100%">' + p.map(function (x) { return '<div class="' + (x[0] === 'e' ? 'vg-e' : 'vg-w') + '">' + (x[0] === 'e' ? '✕ ' : '! ') + esc(x[1]) + '</div>'; }).join('') + '</div>' : '');
  }
  function summary() {
    var el = D.getElementById('vg-sum'); if (!el) return;
    var hp = headProblems(), bad = S.rows.some(function (r) { return problems(r).some(function (x) { return x[0] === 'e'; }); });
    var tot = S.rows.reduce(function (a, r) { return a + Math.max(0, vgmOf(r)); }, 0);
    el.innerHTML = '<table class="vg-sum"><tr><th>#</th><th>Container</th><th>Type</th><th>VGM (' + S.unit + ')</th><th>Status</th></tr>' + S.rows.map(function (r, i) { var p = problems(r), e = p.filter(function (x) { return x[0] === 'e'; }).length, w = p.length - e; return '<tr><td>' + (i + 1) + '</td><td>' + esc(cnCheck(r.no).s || '–') + '</td><td>' + esc(typeOf(r.type)[1]) + '</td><td><b>' + (vgmOf(r) > 0 ? fmt(vgmOf(r)) : '–') + '</b></td><td class="' + (e ? 'vg-e' : w ? 'vg-w' : 'vg-ok') + '">' + (e ? 'Fix ' + e + ' item' + (e > 1 ? 's' : '') : w ? 'Check ' + w + ' item' + (w > 1 ? 's' : '') : 'Ready') + '</td></tr>'; }).join('') + (S.rows.length > 1 ? '<tr><td></td><td colspan="2"><b>Total</b></td><td><b>' + fmt(tot) + '</b></td><td></td></tr>' : '') + '</table>' + (hp.length ? '<div class="vg-e" style="margin-top:10px">Still needed above: ' + esc(hp.join(', ')) + '.</div>' : '');
    var ok = !hp.length && !bad;
    ['vg-pdf', 'vg-pdf2', 'vg-txt', 'vg-csv'].forEach(function (id) { var b = D.getElementById(id); if (b) b.disabled = !ok; });
  }
  function render() {
    var m2 = S.method === '2';
    root.innerHTML = '<style>' + css + '</style>' +
      '<div class="vg-card"><div class="vg-q">1 · Who is declaring</div><p class="vg-m">The shipper named on the bill of lading is responsible for the VGM. These details are saved on this device, so next time you only add the containers.</p><div class="vg-g">' +
      F('Shipper name (as on the B/L)', 'shipper', S.shipper) + F('Shipper address', 'addr', S.addr) + F('IEC / registration no.', 'reg', S.reg, { ph: 'IEC, CIN or licence no.' }) + F('Authorised person (full name)', 'person', S.person, { ph: 'IN CAPITAL LETTERS' }) + F('Designation', 'desig', S.desig) + F('24-hour contact (phone or email)', 'contact', S.contact) + '</div></div>' +
      '<div class="vg-card"><div class="vg-q">2 · The shipment</div><div class="vg-g">' + F('Booking number', 'booking', S.booking) + F('B/L number (if issued)', 'bl', S.bl) + F('Shipping line', 'line', S.line) + F('Vessel and voyage', 'vessel', S.vessel) + F('Port of loading', 'pol', S.pol) + '</div></div>' +
      '<div class="vg-card"><div class="vg-q">3 · How was the weight found?</div><div class="vg-act" style="margin:10px 0 4px"><div class="vg-seg" id="vg-method"><button type="button" data-m="1" class="' + (m2 ? '' : 'on') + '">Method 1 · weighed the packed container</button><button type="button" data-m="2" class="' + (m2 ? 'on' : '') + '">Method 2 · added up the contents</button></div><div class="vg-seg" id="vg-unit"><button type="button" data-u="kg" class="' + (S.unit === 'kg' ? 'on' : '') + '">kg</button><button type="button" data-u="lb" class="' + (S.unit === 'lb' ? 'on' : '') + '">lb</button></div></div>' +
      (m2 ? '<div class="vg-note"><b>Method 2 needs approval.</b> You weigh every package, pallet and piece of dunnage and add the container tare. In India this method may be used only by shippers whose procedure is approved by the Directorate General of Shipping; many other countries also ask for a registration or certificate. If you are not approved, use Method 1.</div><div class="vg-g" style="margin-top:12px">' + F('Method 2 approval / certificate no.', 'appr', S.appr) + '</div>' : '<p class="vg-m" style="margin-top:10px">The packed and sealed container is weighed on a weighbridge. If the truck was weighed with the container on it, the tool subtracts the truck for you.</p>') + '</div>' +
      '<div class="vg-card"><div class="vg-q">4 · Containers</div><p class="vg-m">One block per container. The maximum gross mass and the tare are printed on the container door (CSC plate).</p><div id="vg-rows">' + S.rows.map(rowHtml).join('') + '</div><div class="vg-act"><button type="button" class="vg-btn g" id="vg-add">+ Add container</button><button type="button" class="vg-btn g" id="vg-dup">+ Copy the last one</button></div></div>' +
      '<div class="vg-card"><div class="vg-q">5 · Your declaration</div><div id="vg-sum" style="margin:10px 0 16px"></div><div class="vg-act"><button type="button" class="vg-btn" id="vg-pdf">↓ VGM declaration (PDF)</button><button type="button" class="vg-btn g" id="vg-pdf2">↓ All containers on one sheet</button><button type="button" class="vg-btn g" id="vg-txt">Copy as text for email</button><button type="button" class="vg-btn g" id="vg-csv">↓ CSV for upload</button><button type="button" class="vg-btn g" id="vg-clear">Clear containers</button></div><label style="display:flex;gap:8px;align-items:center;margin-top:12px;font-size:15px"><input type="checkbox" id="vg-lh"' + (S.lh ? ' checked' : '') + '> Print it on my own letterhead: no CargoKit header, and the top of the page is left blank</label><label style="display:flex;gap:8px;align-items:center;margin-top:8px;font-size:15px"><input type="checkbox" id="vg-bk"' + (S.bk ? ' checked' : '') + '> Show the booking number on the declaration</label><p class="vg-m" style="margin-top:8px">The declaration is in the standard Indian format, "Information about verified gross mass of container", one page per container. Sign and stamp the PDF, then send it to your shipping line, forwarder or terminal before their VGM cut-off. Many lines also want the same figures typed into their own portal: the text and CSV copies make that quick.</p></div>';
    S.rows.forEach(function (r, i) { verdict(i); }); summary();
  }
  function setKey(k, v) {
    if (k.indexOf('r.') === 0) { var a = k.split('.'), r = S.rows[+a[2]]; if (!r) return false; r[a[1]] = v; return a[1] === 'how' || a[1] === 'ctype' || a[1] === 'type'; }
    S[k] = v; return false;
  }
  root.addEventListener('input', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-k'); if (!k) return;
    var v = e.target.value; if (/^r\.no\./.test(k) || k === 'person') { /* keep typing natural; upper-case on output */ }
    var re = setKey(k, v); save();
    if (re && e.target.tagName === 'SELECT') { render(); return; }
    if (k.indexOf('r.') === 0) verdict(+k.split('.')[2]);
    summary();
  });
  root.addEventListener('change', function (e) { if (e.target.id === 'vg-lh') { S.lh = e.target.checked; save(); return; } if (e.target.id === 'vg-bk') { S.bk = e.target.checked; save(); return; } var k = e.target.getAttribute && e.target.getAttribute('data-k'); if (k && e.target.tagName === 'SELECT') { if (setKey(k, e.target.value)) { save(); render(); } } });
  root.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
    if (t.dataset.m) { S.method = t.dataset.m; save(); render(); }
    else if (t.dataset.u) { S.unit = t.dataset.u; save(); render(); }
    else if (t.dataset.del != null) { S.rows.splice(+t.dataset.del, 1); if (!S.rows.length) S.rows = [blank()]; save(); render(); }
    else if (t.id === 'vg-add') { var b = blank(), l = S.rows[S.rows.length - 1]; if (l) { b.type = l.type; b.wb = l.wb; b.wbreg = l.wbreg; b.ctype = l.ctype; b.how = l.how; } S.rows.push(b); save(); render(); }
    else if (t.id === 'vg-dup') { var c = JSON.parse(JSON.stringify(S.rows[S.rows.length - 1])); c.no = ''; c.seal = ''; c.slip = ''; S.rows.push(c); save(); render(); }
    else if (t.id === 'vg-clear') { S.rows = [blank()]; S.booking = ''; S.bl = ''; S.vessel = ''; save(); render(); }
    else if (t.id === 'vg-pdf') indiaPdf(t);
    else if (t.id === 'vg-pdf2') makePdf(t);
    else if (t.id === 'vg-txt') { copy(textOut(), t); }
    else if (t.id === 'vg-csv') { dl('VGM-' + (S.booking || S.bl || 'declaration') + '.csv', csvOut(), 'text/csv'); }
  });
  function copy(txt, btn) { var done = function () { var o = btn.textContent; btn.textContent = 'Copied ✓'; setTimeout(function () { btn.textContent = o; }, 1800); }; if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, function () { fallback(); }); else fallback(); function fallback() { var ta = D.createElement('textarea'); ta.value = txt; D.body.appendChild(ta); ta.select(); try { D.execCommand('copy'); done(); } catch (e) {} ta.remove(); } }
  function dl(name, data, type) { var a = D.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: type })); a.download = name.replace(/[^\w.\-]+/g, '-'); D.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 3000); }
  var when = function (v) { if (!v) return ''; var d = new Date(v); if (isNaN(d)) return v; var p = function (n) { return (n < 10 ? '0' : '') + n; }; return p(d.getDate()) + '-' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + '-' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); };
  var methodText = function () { return S.method === '2' ? 'Method 2: all packages and cargo items, pallets, dunnage and securing material were weighed and added to the tare mass of the container' : 'Method 1: the packed and sealed container was weighed on calibrated weighing equipment'; };
  function textOut() {
    var L = ['VERIFIED GROSS MASS (VGM) DECLARATION', 'SOLAS Chapter VI, Regulation 2', ''];
    L.push('Shipper: ' + S.shipper + (S.reg ? ' (' + S.reg + ')' : '')); if (S.addr) L.push('Address: ' + S.addr);
    if (S.booking) L.push('Booking no.: ' + S.booking); if (S.bl) L.push('B/L no.: ' + S.bl); if (S.line) L.push('Shipping line: ' + S.line); if (S.vessel) L.push('Vessel / voyage: ' + S.vessel); if (S.pol) L.push('Port of loading: ' + S.pol);
    L.push(methodText() + '.' + (S.method === '2' && S.appr ? ' Approval no. ' + S.appr + '.' : '')); L.push('');
    S.rows.forEach(function (r, i) {
      L.push((i + 1) + '. ' + (cnCheck(r.no).s || '-') + ' · ' + typeOf(r.type)[1] + ' · VGM ' + fmt(vgmOf(r)) + ' ' + S.unit.toUpperCase() + (num(r.max) ? ' · max gross ' + fmt(num(r.max)) : '') + (num(r.tare) ? ' · tare ' + fmt(num(r.tare)) : '') + (r.seal ? ' · seal ' + r.seal : ''));
      var x = []; if (S.method !== '2') { if (r.wb) x.push('weighbridge ' + r.wb); if (r.wbreg) x.push('reg. ' + r.wbreg); if (r.slip) x.push('slip ' + r.slip); } if (r.when) x.push(when(r.when)); x.push('cargo: ' + r.ctype + (r.un ? ' ' + r.un : ''));
      L.push('   ' + x.join(' · '));
    });
    L.push(''); L.push('Authorised person: ' + String(S.person).toUpperCase() + (S.desig ? ', ' + S.desig : '')); if (S.contact) L.push('Contact: ' + S.contact);
    return L.join('\n');
  }
  function csvOut() {
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var H = ['Booking No', 'BL No', 'Container No', 'Size Type', 'VGM', 'Unit', 'Method', 'Max Gross Mass', 'Tare', 'Seal No', 'Weighbridge', 'Weighbridge Reg No', 'Weighing Slip No', 'Date Time', 'Cargo Type', 'UN No Class', 'Shipper', 'Shipper Reg No', 'Authorised Person', 'Designation', 'Contact'];
    var R = S.rows.map(function (r) { return [S.booking, S.bl, cnCheck(r.no).s, r.type, Math.round(vgmOf(r) * 10) / 10, S.unit.toUpperCase(), 'Method ' + S.method, r.max, r.tare, r.seal, S.method === '2' ? '' : r.wb, S.method === '2' ? '' : r.wbreg, S.method === '2' ? '' : r.slip, when(r.when), r.ctype, r.un, S.shipper, S.reg, String(S.person).toUpperCase(), S.desig, S.contact].map(q).join(','); });
    return [H.join(',')].concat(R).join('\r\n');
  }
  var jsP; function jspdf() { if (!jsP) jsP = new Promise(function (ok, no) { if (window.jspdf) return ok(window.jspdf); var s = D.createElement('script'); s.src = 'vendor/jspdf.umd.min.js'; s.onload = function () { ok(window.jspdf); }; s.onerror = no; D.head.appendChild(s); }); return jsP; }
  function makePdf(btn) {
    var old = btn.textContent; btn.disabled = true; btn.textContent = 'Making PDF…';
    Promise.all([jspdf(), window.YAMBrand ? YAMBrand.ready() : null]).then(function (a) {
      var doc = new a[0].jsPDF({ unit: 'mm', format: 'a4' }), B = window.YAMBrand, W = 210, M = 12, TOP = B ? B.HEAD + 8 : 14, BOT = 297 - (B ? B.FOOT + 8 : 14);
      var pt = function (t) { return String(t == null ? '' : t).replace(/[′’]/g, "'").replace(/[–—]/g, '-').replace(/·/g, '|').replace(/[^\x00-\xFF]/g, '?'); };
      var T = function (t, x, y, o) { o = o || {}; doc.setFont('helvetica', o.b ? 'bold' : 'normal'); doc.setFontSize(o.s || 9.5); var c = o.c || [11, 42, 74]; doc.setTextColor(c[0], c[1], c[2]); doc.text(pt(t), x, y, { align: o.a || 'left', maxWidth: o.w }); };
      var muted = [94, 120, 145];
      var head = function () { if (B) { B.header(doc, 'VGM declaration', 'SOLAS Chapter VI, Regulation 2'); B.footer(doc, 'Made with the free VGM declaration maker on www.CargoKit.ai. The shipper is responsible for the figures declared.'); } };
      head(); var y = TOP;
      T('Verified gross mass (VGM) declaration', M, y, { s: 15, b: true }); y += 5.5;
      T('Container mass declaration by the shipper under SOLAS Chapter VI, Regulation 2', M, y, { s: 9, c: muted }); y += 7;
      var kv = function (rows, x, w) { var yy = y; rows.forEach(function (r) { if (!r[1]) return; T(r[0], x, yy, { s: 7.5, c: muted }); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); var ls = doc.splitTextToSize(pt(r[1]), w - 36); doc.setTextColor(11, 42, 74); doc.text(ls, x + 34, yy); yy += Math.max(5, ls.length * 4.2 + 0.8); }); return yy; };
      var yl = kv([['Shipper', S.shipper], ['Address', S.addr], ['IEC / reg. no.', S.reg], ['Authorised person', String(S.person).toUpperCase() + (S.desig ? ', ' + S.desig : '')], ['24-hour contact', S.contact]], M, 96);
      var yr = kv([['Booking no.', S.booking], ['B/L no.', S.bl], ['Shipping line', S.line], ['Vessel / voyage', S.vessel], ['Port of loading', S.pol], ['Date of declaration', when(new Date().toISOString()).slice(0, 11)]], M + 100, 86);
      y = Math.max(yl, yr) + 3;
      doc.setFillColor(234, 243, 252); doc.roundedRect(M, y - 4, W - 2 * M, S.method === '2' && S.appr ? 13 : 9, 1.5, 1.5, 'F');
      T(methodText() + '.', M + 3, y + 1.6, { s: 9, b: true, w: W - 2 * M - 6 }); if (S.method === '2' && S.appr) T('Method 2 approval / certificate no.: ' + S.appr, M + 3, y + 6.2, { s: 8.5 });
      y += S.method === '2' && S.appr ? 15 : 11;
      var m2 = S.method === '2';
      var cols = m2 ? [['#', 7], ['Container no.', 30], ['Type', 24], ['Max gross', 20], ['Cargo', 20], ['Packing', 18], ['Tare', 17], ['VGM (' + S.unit.toUpperCase() + ')', 24], ['Seal no.', 26]] : [['#', 7], ['Container no.', 30], ['Type', 24], ['Max gross', 20], ['Tare', 17], ['VGM (' + S.unit.toUpperCase() + ')', 24], ['Seal no.', 26], ['Slip no.', 38]];
      var tw = cols.reduce(function (a, c) { return a + c[1]; }, 0), k = (W - 2 * M) / tw; cols.forEach(function (c) { c[1] *= k; });
      var th = function () { doc.setFillColor(11, 42, 74); doc.rect(M, y - 4.4, W - 2 * M, 6.4, 'F'); var x = M; cols.forEach(function (c) { T(c[0], x + 1.2, y, { s: 8, b: true, c: [255, 255, 255] }); x += c[1]; }); y += 6.6; };
      th();
      S.rows.forEach(function (r, i) {
        var sub = []; if (!m2) { if (r.wb) sub.push('Weighbridge: ' + r.wb); if (r.wbreg) sub.push('Reg. no. ' + r.wbreg); if (r.how === 'truck') sub.push('Truck + container ' + fmt(num(r.gross)) + ' less truck ' + fmt(num(r.truck))); } if (r.when) sub.push((m2 ? 'Packed ' : 'Weighed ') + when(r.when)); sub.push('Cargo: ' + r.ctype + (r.un ? ' (' + r.un + ')' : ''));
        if (y > BOT - 62) { doc.addPage(); head(); y = TOP; th(); }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.3); var sl = doc.splitTextToSize(pt(sub.join('   |   ')), W - 2 * M - cols[0][1] - 4), rh = 7 + sl.length * 3.3;
        if (i % 2 === 0) { doc.setFillColor(246, 250, 254); doc.rect(M, y - 4.2, W - 2 * M, rh, 'F'); }
        var v = m2 ? [i + 1, cnCheck(r.no).s, typeOf(r.type)[1], num(r.max) ? fmt(num(r.max)) : '-', fmt(num(r.cargo)), fmt(num(r.pack)), fmt(num(r.tare)), fmt(vgmOf(r)), r.seal || '-'] : [i + 1, cnCheck(r.no).s, typeOf(r.type)[1], num(r.max) ? fmt(num(r.max)) : '-', num(r.tare) ? fmt(num(r.tare)) : '-', fmt(vgmOf(r)), r.seal || '-', r.slip || '-'];
        var x = M; cols.forEach(function (c, j) { T(v[j], x + 1.2, y, { s: 9, b: c[0].indexOf('VGM') === 0 || j === 1 }); x += c[1]; });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.3); doc.setTextColor(94, 120, 145); doc.text(sl, M + cols[0][1] + 1.2, y + 4.2);
        y += rh + 0.4;
      });
      if (S.rows.length > 1) { T('Total VGM: ' + fmt(S.rows.reduce(function (a, r) { return a + Math.max(0, vgmOf(r)); }, 0)) + ' ' + S.unit.toUpperCase() + ' in ' + S.rows.length + ' containers', M, y + 1, { s: 9.5, b: true }); y += 7; }
      if (y > BOT - 58) { doc.addPage(); head(); y = TOP; }
      y += 4; T('Declaration', M, y, { s: 10.5, b: true }); y += 5;
      var decl = 'I declare, on behalf of the shipper named above, that the verified gross mass of each packed container stated in this document was obtained by ' + (m2 ? 'Method 2' : 'Method 1') + ' of SOLAS Chapter VI, Regulation 2, that the weighing equipment used was calibrated and certified as required where the container was packed, and that the details given are true and correct. I understand that the carrier and the terminal will rely on this declaration for the stowage of the ship.';
      var dls = doc.splitTextToSize(decl, W - 2 * M); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(11, 42, 74); doc.text(dls, M, y); y += dls.length * 4.2 + 8;
      doc.setDrawColor(150, 170, 190); doc.setLineWidth(0.3);
      [[M, 'Name of authorised person', String(S.person).toUpperCase()], [M + 66, 'Signature and company stamp', ''], [M + 132, 'Place and date', '']].forEach(function (b) { if (b[2]) T(b[2], b[0], y + 9, { s: 9.5, b: true }); doc.line(b[0], y + 12, b[0] + 56, y + 12); T(b[1], b[0], y + 16, { s: 7.5, c: muted }); });
      if (B) B.finish(doc);
      doc.save(('VGM-' + (S.booking || S.bl || 'declaration') + '.pdf').replace(/[^\w.\-]+/g, '-'));
    }).catch(function (e) { console.error(e); alert('Sorry, the PDF could not be made in this browser.'); }).then(function () { btn.disabled = false; btn.textContent = old; summary(); });
  }

  // The Indian format: "Information about verified gross mass of container", 13 rows, one page per container.
  // CargoKit header and footer by default; the shipper can tick "my own letterhead" to get a blank top instead.
  // The small CargoKit credit line is always printed.
  function indiaPdf(btn) {
    var old = btn.textContent; btn.disabled = true; btn.textContent = 'Making PDF…';
    Promise.all([jspdf(), window.YAMBrand ? YAMBrand.ready() : null]).then(function (a) {
      var lib = a[0], B = S.lh ? null : window.YAMBrand;
      var doc = new lib.jsPDF({ unit: 'mm', format: 'a4' }), W = 210;
      var pt = function (t) { return String(t == null ? '' : t).replace(/[′’]/g, "'").replace(/[–—]/g, '-').replace(/[^\x00-\xFF]/g, '?'); };
      var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
      var dt = function (v) { if (!v) return ''; var d = new Date(v); if (isNaN(d)) return String(v); return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ' HRS'; };
      var f2 = function (n) { return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
      var f0 = function (n) { return (Math.round(n * 10) / 10).toLocaleString('en-IN', { maximumFractionDigits: 1 }); };
      var U = S.unit === 'lb' ? 'LBS' : 'KGS', now = new Date(), today = p2(now.getDate()) + '-' + p2(now.getMonth() + 1) + '-' + now.getFullYear();
      S.rows.forEach(function (r, i) {
        if (i) doc.addPage();
        var y;
        if (B) { B.header(doc, 'VGM declaration', 'Container ' + (i + 1) + ' of ' + S.rows.length); B.footer(doc, 'Prepared with the free VGM declaration maker on www.CargoKit.ai. The shipper is responsible for the figures declared.'); y = B.HEAD + 12; }
        else y = 50; // blank space for the shipper's own letterhead
        doc.setTextColor(20, 20, 20); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        var title = 'INFORMATION ABOUT VERIFIED GROSS MASS OF CONTAINER'; doc.text(title, W / 2, y, { align: 'center' });
        var tw = doc.getTextWidth(title); doc.setLineWidth(0.3); doc.setDrawColor(20, 20, 20); doc.line(W / 2 - tw / 2, y + 1, W / 2 + tw / 2, y + 1);
        y += 7;
        var v = vgmOf(r), tare = num(r.tare), c = cnCheck(r.no).s, t = typeOf(r.type), ft = (t[0].match(/^\d\d/) || [''])[0];
        var mass = S.method === '2' ? f0(num(r.cargo) + num(r.pack)) + ' ' + U + '+TARE ' + f0(tare) + ' ' + U + ' =\nTOTAL: ' + f2(v) + ' ' + U + ' METHOD 2' : (tare > 0 && v > tare ? f0(v - tare) + ' ' + U + '+TARE ' + f0(tare) + ' ' + U + ' =\n' : '') + 'TOTAL: ' + f2(v) + ' ' + U + ' METHOD 1';
        var who = [String(S.person).toUpperCase(), String(S.desig).toUpperCase()].filter(Boolean).join('\n');
        var rows = [
          ['1*', 'Name of the shipper', String(S.shipper).toUpperCase()],
          ['2*', 'Shipper Registration/License No. (IEC No/CIN No) **', String(S.reg).toUpperCase()],
          ['3*', 'Name and designation of official of the shipper authorized to sign document', who],
          ['4*', '24 x 7 contact details of authorized official of shipper', S.contact],
          ['5*', 'Container No.', c + (ft ? '/' + ft : '')],
          ['6*', 'Container Size (TEU/FEU/other)', ft ? '1X' + ft : t[1].toUpperCase()],
          ['7*', 'Maximum permissible weight of container as per the CSC plate', num(r.max) ? f2(num(r.max)) + ' ' + U + '.' : ''],
          ['8*', 'Verified gross mass of container (method-1/method-2)', mass],
          ['9*', S.method === '2' ? 'Date and time of weighing' : 'Date and time of weighing', dt(r.when)],
          ['10*', 'Weighing slip no.', S.method === '2' ? (S.appr ? 'METHOD 2 APPROVAL ' + S.appr : '') : r.slip],
          ['11*', 'Weighbridge registration no. & Address of Weighbridge', [r.wbreg, r.wb].filter(Boolean).join('\n').toUpperCase()],
          ['12', 'Type (Normal/Reefer/Hazardous/others)', String(r.ctype).toUpperCase()],
          ['13', 'If Hazardous, UN No, IMDG class', r.ctype === 'Hazardous' ? String(r.un).toUpperCase() : 'NON HAZ']
        ];
        var X = [20, 34, 112, 190], LH = 6.1;
        var cell = function (txt, x, w) { return doc.splitTextToSize(pt(txt), w - 4); };
        doc.setFontSize(10.5); doc.setLineWidth(0.35);
        // header row
        var hh = 9; doc.rect(X[0], y, X[3] - X[0], hh); doc.line(X[1], y, X[1], y + hh); doc.line(X[2], y, X[2], y + hh);
        doc.text('Sr.', (X[0] + X[1]) / 2, y + 3.8, { align: 'center' }); doc.text('No.', (X[0] + X[1]) / 2, y + 7.8, { align: 'center' });
        doc.text('Details of Information', (X[1] + X[2]) / 2, y + 4.6, { align: 'center' }); doc.text('Particulars', (X[2] + X[3]) / 2, y + 4.6, { align: 'center' });
        y += hh;
        rows.forEach(function (rw) {
          var a = cell(rw[1], X[1], X[2] - X[1]), b = [];
          String(rw[2] || '').split('\n').forEach(function (ln) { b = b.concat(cell(ln, X[2], X[3] - X[2])); });
          var n = Math.max(a.length, b.length, 1), h = n * LH + 2.6;
          doc.rect(X[0], y, X[3] - X[0], h); doc.line(X[1], y, X[1], y + h); doc.line(X[2], y, X[2], y + h);
          doc.text(rw[0], X[0] + 4, y + 5); doc.text(a, X[1] + 2.4, y + 5, { lineHeightFactor: 1.62 }); doc.text(b, X[2] + 2.4, y + 5, { lineHeightFactor: 1.62 });
          y += h;
        });
        // signature block
        y += B ? 22 : 26;
        var sx = 150; doc.setFontSize(10.5);
        var st = 'Signature of Authorized Person of Shipper'; doc.text(st, sx, y, { align: 'center' }); var sw = doc.getTextWidth(st); doc.line(sx - sw / 2, y + 1, sx + sw / 2, y + 1);
        y += 7; doc.text('Name:-  ' + pt(String(S.person).toUpperCase()), sx + 4, y, { align: 'center' });
        y += 7; doc.text('Date: ' + today, sx + 4, y, { align: 'center' });
        y += 9; doc.setFontSize(9);
        doc.text('*Indicates mandatory fields', 22, y); y += 4.4;
        doc.text('**Shippers not having IEC No. or CIN No. may provide information as follows:', 22, y); y += 4.4;
        doc.text('Company - PAN No.', 26, y); y += 4.4; doc.text('Individuals', 26, y); y += 4.4;
        doc.text('Indian National - AADHAR No', 26, y); y += 4.4; doc.text('Foreign National - PASSPORT No & Country of issue of passport.', 26, y);
        y += 7;
        if (S.bk && (S.booking || S.bl)) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(70, 70, 70); doc.text(pt((S.booking ? 'Booking No. ' + S.booking : '') + (S.booking && S.bl ? '   |   ' : '') + (S.bl ? 'B/L No. ' + S.bl : '') + (S.line ? '   |   ' + S.line : '')), 22, y); y += 5; }
        // the credit line is always there: in the footer band, or as one small line when the page goes on a letterhead
        if (!B) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(140, 150, 160); doc.text('Prepared with the free VGM declaration maker on www.CargoKit.ai', 22, y); }
      });
      if (B) B.finish(doc);
      doc.save(('VGM-' + (S.booking || S.bl || cnCheck(S.rows[0].no).s || 'declaration') + '.pdf').replace(/[^\w.\-]+/g, '-'));
    }).catch(function (e) { console.error(e); alert('Sorry, the PDF could not be made in this browser.'); }).then(function () { btn.disabled = false; btn.textContent = old; summary(); });
  }
  // containers handed over from the load planner: #lp=<base64 json {u, c:[[typeId, cargoKg, name]]}>
  function fromPlanner() {
    var h = location.hash; if (h.indexOf('#lp=') !== 0) return false;
    try {
      var o = JSON.parse(decodeURIComponent(escape(atob(h.slice(4)))));
      if (!o || !o.c || !o.c.length) return false;
      var map = { '20gp': '20GP', '40gp': '40GP', '40hc': '40HC', '20rf': '20RF', '40rh': '40RH' };
      S.method = '2'; S.unit = o.u === 'lb' ? 'lb' : 'kg';
      S.rows = o.c.slice(0, 40).map(function (c) { var b = blank(); b.type = map[c[0]] || 'OTH'; b.cargo = String(c[1]); var t = typeOf(b.type); if (t[3] && S.unit === 'kg') b.max = ''; return b; });
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
      return true;
    } catch (e) { return false; }
  }
  load(); var lp = fromPlanner(); if (lp) save(); render();
  if (lp) { var n = D.createElement('div'); n.className = 'vg-note'; n.style.margin = '0 0 16px'; n.innerHTML = '<b>Filled from your load plan.</b> The cargo weight of each container came from the planner. Add the container number and the tare from the door. If you will weigh the packed container on a weighbridge instead, switch to Method 1.'; root.insertBefore(n, root.children[1]); }
})();
