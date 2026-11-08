/* YAM Logistics: commercial invoice, packing list and document checklist maker. Runs on the device; nothing is uploaded. */
(function () {
  var root = document.getElementById('dg-root'); if (!root) return;
  var KEY = 'ck_doc_v1', D = document;
  var css = D.createElement('style');
  css.textContent = '.dg-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:24px;margin-bottom:16px}.dg-h{font-family:Archivo,sans-serif;font-weight:800;font-size:21px;margin:0 0 4px;color:#0B2A4A}.dg-s{font-size:14px;color:#5E7891;margin:0 0 14px;line-height:1.5}' +
    '.dg-g{display:grid;grid-template-columns:1fr 1fr;gap:12px}.dg-g .w{grid-column:1/-1}@media(max-width:560px){.dg-g{grid-template-columns:1fr}}.dg-l{font-size:13px;font-weight:600;color:#3D5873;margin:0 0 6px;display:block}' +
    '.dg-in{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid #C9DCEC;border-radius:14px;font:inherit;font-size:16px;color:#0B2A4A;background:#fff}.dg-in:focus{outline:2px solid #0A6CC2;border-color:#0A6CC2}textarea.dg-in{min-height:76px;resize:vertical}' +
    '.dg-it{border:1px solid #E1EDF7;background:#F7FBFF;border-radius:18px;padding:14px;margin-top:12px}.dg-it .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-weight:700;color:#0A6CC2}' +
    '.dg-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}@media(max-width:560px){.dg-g3{grid-template-columns:1fr 1fr}}' +
    '.dg-b{border:0;border-radius:999px;padding:13px 20px;font:inherit;font-weight:700;font-size:15px;cursor:pointer}.dg-p{background:#0A6CC2;color:#fff}.dg-y{background:#FFC93C;color:#0B2A4A}.dg-q{background:#EEF6FD;color:#0B2A4A}.dg-r{background:#FFE3DF;color:#B42318}' +
    '.dg-tot{background:#0A6CC2;color:#fff;border-radius:18px;padding:16px 20px;margin-top:14px;font-size:14px;line-height:1.6}.dg-tot b{font-family:Archivo,sans-serif;font-size:26px;display:block}' +
    '.dg-chk label{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px solid #EEF4FA;font-size:15px;line-height:1.45;color:#0B2A4A;cursor:pointer}.dg-chk input{width:20px;height:20px;flex:none;margin-top:1px}.dg-chk small{display:block;color:#5E7891;font-size:12.5px}' +
    '.dg-note{font-size:12.5px;line-height:1.55;color:#7A3E00;background:#FFF8E6;border-radius:12px;padding:12px 14px;margin-top:14px}.dg-tabs{display:flex;gap:6px;background:#EEF6FD;border-radius:999px;padding:4px;flex-wrap:wrap;margin-bottom:12px}.dg-tabs button{border:0;border-radius:999px;padding:9px 14px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;background:transparent;color:#3D5873}.dg-tabs button.on{background:#0A6CC2;color:#fff}';
  D.head.appendChild(css);

  var INC = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
  var CUR = ['USD', 'EUR', 'GBP', 'AED', 'INR', 'CNY', 'JPY', 'SGD', 'AUD', 'CAD', 'CHF', 'SAR', 'QAR', 'KWD', 'BHD', 'KRW', 'HKD', 'ZAR', 'BRL'];
  var UNITS = ['PCS', 'KGS', 'MTS', 'SET', 'MTR', 'LTR', 'BOX', 'PKT', 'PAIR', 'NOS', 'SQM', 'CBM'];
  var CNAME = { USD: 'US DOLLARS', EUR: 'EUROS', GBP: 'POUNDS STERLING', AED: 'UAE DIRHAMS', INR: 'INDIAN RUPEES', SGD: 'SINGAPORE DOLLARS', AUD: 'AUSTRALIAN DOLLARS', CAD: 'CANADIAN DOLLARS', CHF: 'SWISS FRANCS' };
  var F = ['exName', 'exAddr', 'exTax', 'coName', 'coAddr', 'coTax', 'ntName', 'invNo', 'invDate', 'poNo', 'inc', 'incPlace', 'cur', 'origin', 'pol', 'pod', 'dest', 'vessel', 'pay', 'marks', 'freight', 'insur', 'reason'];
  var S = { f: {}, items: [], cl: {} };

  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(i) { return D.getElementById(i); }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isNaN(n) ? 0 : n; }
  function fmt(n) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function load() { try { var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.f) { S = j; if (!S.items) S.items = []; if (!S.cl) S.cl = {}; } } catch (e) {} }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function blankItem() { return { d: '', hs: '', q: '', u: 'PCS', p: '', pk: '', nw: '', gw: '', cb: '' }; }
  load(); if (!S.items.length) S.items.push(blankItem()); if (!S.f.invDate) S.f.invDate = today(); if (!S.f.cur) S.f.cur = 'USD'; if (!S.f.inc) S.f.inc = 'FOB';

  function inp(id, label, ph, cls, type) { return '<div' + (cls ? ' class="' + cls + '"' : '') + '><label class="dg-l" for="f_' + id + '">' + label + '</label><input class="dg-in" id="f_' + id + '" data-f="' + id + '" placeholder="' + (ph || '') + '"' + (type ? ' type="' + type + '"' : '') + '></div>'; }
  function area(id, label, ph) { return '<div class="w"><label class="dg-l" for="f_' + id + '">' + label + '</label><textarea class="dg-in" id="f_' + id + '" data-f="' + id + '" placeholder="' + (ph || '') + '"></textarea></div>'; }
  function sel(id, label, opts) { return '<div><label class="dg-l" for="f_' + id + '">' + label + '</label><select class="dg-in" id="f_' + id + '" data-f="' + id + '">' + opts.map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select></div>'; }

  var CL = {
    'Export by sea': [['Commercial invoice', 'Signed, with HSN, Incoterm and value'], ['Packing list', 'Must match the invoice weights and packages'], ['Shipping bill', 'Filed by your customs broker on ICEGATE'], ['Export order or contract', 'Purchase order from the buyer'], ['IEC and GST details', 'And the LUT or IGST payment proof'], ['Bill of lading draft', 'Check it before the line issues the final'], ['VGM declaration', 'Verified gross mass, required before loading'], ['Certificate of origin', 'If the buyer or a trade agreement needs it'], ['Product certificates', 'Phytosanitary, fumigation, quality or lab reports as needed'], ['Cargo insurance', 'If you sell CIF or CIP']],
    'Export by air': [['Commercial invoice', 'Signed, with HSN, Incoterm and value'], ['Packing list', 'Must match the invoice weights and packages'], ['Shipping bill', 'Filed by your customs broker'], ['Air waybill instructions', 'Shipper details, consignee and goods description'], ['IEC and GST details', 'And the LUT or IGST payment proof'], ['Dangerous goods declaration', 'If batteries, chemicals or other DG are inside'], ['Certificate of origin', 'If the buyer needs it'], ['Product certificates', 'Health, quality or lab reports as needed']],
    'Import by sea': [['Commercial invoice', 'From the supplier, with HSN and Incoterm'], ['Packing list', 'Matches the invoice'], ['Bill of lading', 'Original, telex release or sea waybill'], ['IEC', 'Your importer exporter code'], ['Bill of entry', 'Filed by your customs broker'], ['Import licence or permit', 'Only if the DGFT policy is Restricted'], ['Certificate of origin', 'To claim a trade agreement duty rate'], ['BIS, FSSAI or other approvals', 'Depends on the goods'], ['Insurance certificate', 'Marine cargo cover'], ['Delivery order', 'From the shipping line after freight is paid']],
    'Import by air': [['Commercial invoice', 'From the supplier, with HSN and Incoterm'], ['Packing list', 'Matches the invoice'], ['Air waybill', 'Master and house AWB'], ['IEC', 'Your importer exporter code'], ['Bill of entry', 'Filed by your customs broker'], ['Import licence or permit', 'Only if the DGFT policy is Restricted'], ['BIS, FSSAI or other approvals', 'Depends on the goods'], ['Certificate of origin', 'To claim a trade agreement duty rate']]
  };

  root.innerHTML =
    '<div class="dg-card"><h2 class="dg-h">1. The parties</h2><p class="dg-s">Your details are kept on this phone so you do not type them again.</p><div class="dg-g">' +
    inp('exName', 'Exporter or seller name', 'Company name', 'w') + area('exAddr', 'Exporter address', 'Street, city, country') + inp('exTax', 'Tax or registration number (optional)', 'IEC, GSTIN, VAT or EIN', 'w') +
    inp('coName', 'Consignee or buyer name', 'Company name', 'w') + area('coAddr', 'Consignee address', 'Street, city, country') + inp('coTax', 'Buyer tax number (optional)', 'VAT, EIN or tax ID', 'w') + inp('ntName', 'Notify party (optional)', 'Name, address', 'w') + '</div></div>' +
    '<div class="dg-card"><h2 class="dg-h">2. The shipment</h2><div class="dg-g">' +
    inp('invNo', 'Invoice number', 'e.g. INV-2026-001') + inp('invDate', 'Invoice date', '', '', 'date') + inp('poNo', 'Buyer PO or contract no. (optional)', '') + sel('inc', 'Incoterm', INC) + inp('incPlace', 'Named place', 'e.g. Nhava Sheva') + sel('cur', 'Currency', CUR) +
    inp('origin', 'Country of origin', 'India') + inp('pol', 'Port of loading', '') + inp('pod', 'Port of discharge', '') + inp('dest', 'Final destination', '') + inp('vessel', 'Vessel or flight (optional)', '') + inp('pay', 'Payment terms', 'e.g. 30% advance, 70% against B/L copy') +
    inp('marks', 'Marks and numbers (optional)', 'e.g. As per cartons', 'w') + inp('reason', 'Reason for export (optional)', 'Sale, sample, return, repair') + inp('freight', 'Freight to show on invoice (optional)', '0.00') + inp('insur', 'Insurance to show on invoice (optional)', '0.00') + '</div></div>' +
    '<div class="dg-card"><h2 class="dg-h">3. The goods</h2><p class="dg-s">Add one card for each product line. Weights and cartons are used on the packing list.</p><div id="dg-items"></div><div style="margin-top:14px"><button class="dg-b dg-q" id="dg-add" type="button">+ Add another item</button></div><div class="dg-tot" id="dg-tot"></div></div>' +
    '<div class="dg-card"><h2 class="dg-h">4. Make the documents</h2><p class="dg-s">Each one is a clean A4 PDF. Share it straight to WhatsApp or save it.</p><div style="display:flex;flex-wrap:wrap;gap:10px"><button class="dg-b dg-p" id="dg-inv" type="button">Commercial invoice PDF</button><button class="dg-b dg-p" id="dg-pl" type="button">Packing list PDF</button><button class="dg-b dg-y" id="dg-both" type="button">Both in one PDF</button><button class="dg-b dg-r" id="dg-clear" type="button">Clear this form</button></div><div class="dg-note"><b>Check before you use.</b> These are standard layouts for convenience, not legal advice. Your buyer, bank or customs may ask for more details or a different format. Review every field, sign the printed copy, and have a licensed customs broker check the invoice before filing. YAM Logistics accepts no liability for how a generated document is used.</div></div>' +
    '<div class="dg-card"><h2 class="dg-h">Document checklist</h2><p class="dg-s">Tick what you have. Your ticks are kept on this phone.</p><div class="dg-tabs" id="dg-tabs"></div><div class="dg-chk" id="dg-chk"></div></div>';

  F.forEach(function (k) { var e = el('f_' + k); if (e) { e.value = S.f[k] || ''; var fn = function () { S.f[k] = e.value; save(); totals(); }; e.addEventListener('input', fn); e.addEventListener('change', fn); } });
  function itemsUI() {
    el('dg-items').innerHTML = S.items.map(function (it, i) {
      return '<div class="dg-it"><div class="top"><span>Item ' + (i + 1) + '</span>' + (S.items.length > 1 ? '<button type="button" class="dg-b dg-r" data-rm="' + i + '" style="padding:6px 12px;font-size:13px">Remove</button>' : '') + '</div>' +
        '<label class="dg-l">Description of goods</label><input class="dg-in" data-i="' + i + '" data-k="d" value="' + h(it.d) + '" placeholder="e.g. Cotton T-shirts, 100% cotton, men">' +
        '<div class="dg-g3" style="margin-top:10px"><div><label class="dg-l">HSN code</label><input class="dg-in" data-i="' + i + '" data-k="hs" value="' + h(it.hs) + '" inputmode="numeric"></div>' +
        '<div><label class="dg-l">Quantity</label><input class="dg-in" data-i="' + i + '" data-k="q" value="' + h(it.q) + '" inputmode="decimal"></div>' +
        '<div><label class="dg-l">Unit</label><select class="dg-in" data-i="' + i + '" data-k="u">' + UNITS.map(function (u) { return '<option' + (u === it.u ? ' selected' : '') + '>' + u + '</option>'; }).join('') + '</select></div>' +
        '<div><label class="dg-l">Unit price</label><input class="dg-in" data-i="' + i + '" data-k="p" value="' + h(it.p) + '" inputmode="decimal"></div>' +
        '<div><label class="dg-l">Cartons or packages</label><input class="dg-in" data-i="' + i + '" data-k="pk" value="' + h(it.pk) + '" inputmode="numeric"></div>' +
        '<div><label class="dg-l">Net weight (kg)</label><input class="dg-in" data-i="' + i + '" data-k="nw" value="' + h(it.nw) + '" inputmode="decimal"></div>' +
        '<div><label class="dg-l">Gross weight (kg)</label><input class="dg-in" data-i="' + i + '" data-k="gw" value="' + h(it.gw) + '" inputmode="decimal"></div>' +
        '<div><label class="dg-l">Volume (CBM)</label><input class="dg-in" data-i="' + i + '" data-k="cb" value="' + h(it.cb) + '" inputmode="decimal"></div></div></div>';
    }).join('');
    totals();
  }
  el('dg-items').addEventListener('input', function (e) { var t = e.target; if (t.dataset.k) { S.items[+t.dataset.i][t.dataset.k] = t.value; save(); totals(); } });
  el('dg-items').addEventListener('change', function (e) { var t = e.target; if (t.dataset.k) { S.items[+t.dataset.i][t.dataset.k] = t.value; save(); totals(); } });
  el('dg-items').addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (b) { S.items.splice(+b.dataset.rm, 1); save(); itemsUI(); } });
  el('dg-add').addEventListener('click', function () { S.items.push(blankItem()); save(); itemsUI(); });
  function sums() {
    var T = { sub: 0, pk: 0, nw: 0, gw: 0, cb: 0 };
    S.items.forEach(function (it) { T.sub += num(it.q) * num(it.p); T.pk += num(it.pk); T.nw += num(it.nw); T.gw += num(it.gw); T.cb += num(it.cb); });
    T.fr = num(S.f.freight); T.in = num(S.f.insur); T.tot = T.sub + T.fr + T.in; return T;
  }
  function totals() {
    var T = sums(), c = S.f.cur || 'USD';
    el('dg-tot').innerHTML = 'Invoice total<b>' + c + ' ' + fmt(T.tot) + '</b>' + S.items.length + ' item' + (S.items.length > 1 ? 's' : '') + ' · ' + T.pk + ' packages · net ' + fmt(T.nw) + ' kg · gross ' + fmt(T.gw) + ' kg · ' + fmt(T.cb) + ' CBM';
  }
  // checklist
  var cur = Object.keys(CL)[0];
  function clUI() {
    el('dg-tabs').innerHTML = Object.keys(CL).map(function (k) { return '<button type="button" class="' + (k === cur ? 'on' : '') + '" data-t="' + k + '">' + k + '</button>'; }).join('');
    el('dg-chk').innerHTML = CL[cur].map(function (r, i) { var id = cur + '|' + i; return '<label><input type="checkbox" data-c="' + h(id) + '"' + (S.cl[id] ? ' checked' : '') + '><span>' + r[0] + '<small>' + r[1] + '</small></span></label>'; }).join('');
  }
  el('dg-tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (b) { cur = b.dataset.t; clUI(); } });
  el('dg-chk').addEventListener('change', function (e) { var c = e.target.dataset.c; if (c) { S.cl[c] = e.target.checked; save(); } });
  el('dg-clear').addEventListener('click', function () { if (!confirm('Clear all the fields on this form?')) return; var cl = S.cl; S = { f: { invDate: today(), cur: 'USD', inc: 'FOB' }, items: [blankItem()], cl: cl }; save(); location.reload(); });

  // ---------- PDF ----------
  function clean(s) { return String(s == null ? '' : s).replace(/[′]/g, "'").replace(/[″]/g, '"').replace(/[–—]/g, '-').replace(/[·•]/g, '-').replace(/₹/g, 'Rs ').replace(/[^\x20-\x7E\n]/g, '').trim(); }
  function words(n) {
    var o = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'], t = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    function b100(x) { return x < 20 ? o[x] : t[Math.floor(x / 10)] + (x % 10 ? ' ' + o[x % 10] : ''); }
    function b1000(x) { var s = ''; if (x >= 100) { s = o[Math.floor(x / 100)] + ' HUNDRED'; x %= 100; if (x) s += ' AND '; } return s + (x ? b100(x) : ''); }
    if (n === 0) return 'ZERO';
    var sc = [[1e9, 'BILLION'], [1e6, 'MILLION'], [1e3, 'THOUSAND']], r = '';
    sc.forEach(function (p) { if (n >= p[0]) { r += b1000(Math.floor(n / p[0])) + ' ' + p[1] + ' '; n %= p[0]; } });
    if (n > 0) r += b1000(n);
    return r.trim();
  }
  function inWords(v, c) { var w = Math.floor(v + 1e-9), ct = Math.round((v - w) * 100); if (ct === 100) { w++; ct = 0; } return (CNAME[c] || c) + ' ' + words(w) + (ct ? ' AND ' + words(ct) + ' CENTS' : '') + ' ONLY'; }
  var jsP = null;
  function jspdf() { if (!jsP) jsP = new Promise(function (ok, no) { var s = D.createElement('script'); s.src = 'vendor/jspdf.umd.min.js'; s.onload = function () { ok(window.jspdf); }; s.onerror = no; D.head.appendChild(s); }); return jsP; }
  var M = 40, W = 595, PH = 842, BOT = 770;
  function head(doc, title, f) {
    doc.setFillColor(10, 108, 194); doc.rect(0, 0, W, 54, 'F'); doc.setFillColor(255, 201, 60); doc.rect(0, 54, W, 3, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text(title, M, 34);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text('No. ' + clean(f.invNo || '-'), W - M, 24, { align: 'right' }); doc.text('Date: ' + clean(f.invDate || ''), W - M, 40, { align: 'right' });
    doc.setTextColor(11, 42, 74);
  }
  function box(doc, x, y, w, label, lines) {
    var wrap = []; lines.forEach(function (l) { if (clean(l)) doc.splitTextToSize(clean(l), w - 16).forEach(function (p) { wrap.push(p); }); });
    var hh = 26 + Math.max(wrap.length, 1) * 12.5;
    doc.setDrawColor(201, 220, 236); doc.roundedRect(x, y, w, hh, 4, 4, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(10, 108, 194); doc.text(label, x + 8, y + 14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(11, 42, 74);
    wrap.forEach(function (p, i) { doc.text(p, x + 8, y + 28 + i * 12.5); });
    return hh;
  }
  function parties(doc, f, y) {
    var w = (W - 2 * M - 12) / 2;
    var a = box(doc, M, y, w, 'EXPORTER / SELLER', [f.exName, f.exAddr, f.exTax ? 'Tax no: ' + f.exTax : '']);
    var b = box(doc, M + w + 12, y, w, 'CONSIGNEE / BUYER', [f.coName, f.coAddr, f.coTax ? 'Tax no: ' + f.coTax : '']);
    y += Math.max(a, b) + 10;
    if (clean(f.ntName)) { y += box(doc, M, y, W - 2 * M, 'NOTIFY PARTY', [f.ntName]) + 10; }
    return y;
  }
  function details(doc, f, y, isInv) {
    var P = [['Incoterm', (f.inc || '') + (f.incPlace ? ' ' + f.incPlace : '')], ['Country of origin', f.origin], ['Port of loading', f.pol], ['Port of discharge', f.pod], ['Final destination', f.dest], ['Vessel / flight', f.vessel], ['Buyer PO / contract', f.poNo], ['Reason for export', f.reason]];
    if (isInv) { P.splice(1, 0, ['Currency', f.cur]); P.push(['Payment terms', f.pay]); }
    P = P.filter(function (p) { return clean(p[1]); });
    var cw = (W - 2 * M) / 2;
    doc.setFontSize(9.5);
    for (var i = 0; i < P.length; i += 2) {
      [0, 1].forEach(function (k) { var p = P[i + k]; if (!p) return; var x = M + k * cw; doc.setFont('helvetica', 'bold'); doc.setTextColor(94, 120, 145); doc.text(p[0] + ':', x, y); doc.setFont('helvetica', 'normal'); doc.setTextColor(11, 42, 74); doc.text(doc.splitTextToSize(clean(p[1]), cw - 100)[0] || '', x + 98, y); });
      y += 15;
    }
    return y + 6;
  }
  function table(doc, cols, rows, y, totalRow, title, f) {
    // cols: [{h, w, a:'l'|'r'}]
    function hdr() {
      doc.setFillColor(238, 246, 253); doc.rect(M, y, W - 2 * M, 20, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(11, 42, 74);
      var x = M; cols.forEach(function (c) { doc.text(c.h, c.a === 'r' ? x + c.w - 5 : x + 5, y + 13, { align: c.a === 'r' ? 'right' : 'left' }); x += c.w; }); y += 20;
    }
    hdr(); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    rows.concat(totalRow ? [totalRow] : []).forEach(function (r, ri) {
      var isTot = totalRow && ri === rows.length, cells = r.map(function (v, i) { return doc.splitTextToSize(clean(v), cols[i].w - 10); });
      var n = Math.max.apply(null, cells.map(function (c) { return c.length || 1; })), hh = n * 12 + 10;
      if (y + hh > BOT) { doc.addPage(); head(doc, title, f); y = 78; hdr(); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); }
      if (isTot) { doc.setFillColor(247, 251, 255); doc.rect(M, y, W - 2 * M, hh, 'F'); doc.setFont('helvetica', 'bold'); }
      var x = M; cells.forEach(function (c, i) { c.forEach(function (ln, j) { doc.text(ln, cols[i].a === 'r' ? x + cols[i].w - 5 : x + 5, y + 14 + j * 12, { align: cols[i].a === 'r' ? 'right' : 'left' }); }); x += cols[i].w; });
      doc.setDrawColor(225, 237, 247); doc.line(M, y + hh, W - M, y + hh); y += hh;
      if (isTot) doc.setFont('helvetica', 'normal');
    });
    return y;
  }
  function sign(doc, f, y, text) {
    if (y > 650) { doc.addPage(); head(doc, text.title, f); y = 80; }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(61, 88, 115);
    var l = doc.splitTextToSize(text.decl, W - 2 * M); l.forEach(function (p, i) { doc.text(p, M, y + i * 12); }); y += l.length * 12 + 40;
    doc.setDrawColor(11, 42, 74); doc.line(W - M - 190, y, W - M, y); doc.setFontSize(9); doc.text('Authorised signatory', W - M - 190, y + 13); doc.text(clean(f.exName), W - M - 190, y + 26);
  }
  function footers(doc) {
    var n = doc.getNumberOfPages();
    for (var i = 1; i <= n; i++) { doc.setPage(i); doc.setDrawColor(255, 201, 60); doc.setLineWidth(1.5); doc.line(M, 800, W - M, 800); doc.setLineWidth(0.5); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(94, 120, 145);
      doc.text('Made with CargoKit by YAM Logistics - cargokit.ai. A convenience draft: check every detail before use.', M, 814); doc.text('Page ' + i + ' of ' + n, W - M, 814, { align: 'right' }); }
  }
  function invoice(doc, f, first) {
    if (!first) doc.addPage(); head(doc, 'COMMERCIAL INVOICE', f);
    var y = parties(doc, f, 74); y = details(doc, f, y + 4, true) + 4;
    var c = f.cur || 'USD', T = sums();
    var cols = [{ h: '#', w: 26 }, { h: 'DESCRIPTION OF GOODS', w: 205 }, { h: 'HSN', w: 62 }, { h: 'QTY', w: 56, a: 'r' }, { h: 'UNIT', w: 38 }, { h: 'PRICE (' + c + ')', w: 62, a: 'r' }, { h: 'AMOUNT (' + c + ')', w: 66, a: 'r' }];
    var rows = S.items.map(function (it, i) { return [String(i + 1), it.d, it.hs, it.q ? String(num(it.q)) : '', it.u, fmt(num(it.p)), fmt(num(it.q) * num(it.p))]; });
    y = table(doc, cols, rows, y, null, 'COMMERCIAL INVOICE', f);
    var tx = W - M; y += 16; doc.setFontSize(10); doc.setTextColor(11, 42, 74);
    function line(l, v, b) { if (y > BOT) { doc.addPage(); head(doc, 'COMMERCIAL INVOICE', f); y = 80; } doc.setFont('helvetica', b ? 'bold' : 'normal'); doc.text(l, tx - 170, y); doc.text(c + ' ' + fmt(v), tx, y, { align: 'right' }); y += 16; }
    line('Goods value', T.sub); if (T.fr) line('Freight', T.fr); if (T.in) line('Insurance', T.in); line('TOTAL (' + (f.inc || '') + ')', T.tot, true);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); var wl = doc.splitTextToSize('Amount in words: ' + inWords(T.tot, c), W - 2 * M); wl.forEach(function (p, i) { doc.text(p, M, y + 6 + i * 12); }); y += wl.length * 12 + 16;
    sign(doc, f, y, { title: 'COMMERCIAL INVOICE', decl: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.' + (clean(f.origin) ? ' The goods are of ' + clean(f.origin) + ' origin.' : '') });
  }
  function packing(doc, f, first) {
    if (!first) doc.addPage(); head(doc, 'PACKING LIST', f);
    var y = parties(doc, f, 74); y = details(doc, f, y + 4, false);
    if (clean(f.marks)) { doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(94, 120, 145); doc.text('Marks and numbers:', M, y); doc.setFont('helvetica', 'normal'); doc.setTextColor(11, 42, 74); doc.text(doc.splitTextToSize(clean(f.marks), W - 2 * M - 110)[0], M + 110, y); y += 18; }
    y += 4; var T = sums();
    var cols = [{ h: '#', w: 26 }, { h: 'DESCRIPTION OF GOODS', w: 205 }, { h: 'PKGS', w: 48, a: 'r' }, { h: 'QTY', w: 70, a: 'r' }, { h: 'NET KG', w: 55, a: 'r' }, { h: 'GROSS KG', w: 60, a: 'r' }, { h: 'CBM', w: 51, a: 'r' }];
    var rows = S.items.map(function (it, i) { return [String(i + 1), it.d + (it.hs ? '  (HSN ' + it.hs + ')' : ''), it.pk ? String(num(it.pk)) : '', (it.q ? String(num(it.q)) : '') + ' ' + it.u, fmt(num(it.nw)), fmt(num(it.gw)), fmt(num(it.cb))]; });
    y = table(doc, cols, rows, y, ['', 'TOTAL', String(T.pk), '', fmt(T.nw), fmt(T.gw), fmt(T.cb)], 'PACKING LIST', f);
    sign(doc, f, y + 20, { title: 'PACKING LIST', decl: 'We certify that the goods listed above are packed as shown and that the weights and measurements are correct to the best of our knowledge.' });
  }
  function toast(m) { var t = el('dg-toast'); if (!t) { t = D.createElement('div'); t.id = 'dg-toast'; t.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:90px;background:#0B2A4A;color:#fff;padding:12px 18px;border-radius:14px;font-size:14px;z-index:99999;max-width:90%;text-align:center'; D.body.appendChild(t); } t.textContent = m; t.style.display = 'block'; clearTimeout(t._h); t._h = setTimeout(function () { t.style.display = 'none'; }, 3000); }
  function check() {
    var miss = []; if (!clean(S.f.exName)) miss.push('exporter name'); if (!clean(S.f.coName)) miss.push('buyer name'); if (!S.items.some(function (i) { return clean(i.d); })) miss.push('at least one item');
    if (miss.length) { toast('Please add: ' + miss.join(', ')); return false; } return true;
  }
  function make(kind) {
    if (!check()) return; toast('Making the PDF…');
    jspdf().then(function (lib) {
      var doc = new lib.jsPDF({ unit: 'pt', format: 'a4' }), f = S.f;
      if (kind === 'inv') invoice(doc, f, true); else if (kind === 'pl') packing(doc, f, true); else { invoice(doc, f, true); packing(doc, f, false); }
      footers(doc);
      var blob = doc.output('blob'), nm = (kind === 'inv' ? 'commercial-invoice-' : kind === 'pl' ? 'packing-list-' : 'invoice-and-packing-list-') + (clean(f.invNo).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'draft') + '.pdf', file = null;
      try { file = new File([blob], nm, { type: 'application/pdf' }); } catch (e) {}
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], title: nm }).catch(function () {});
      var a = D.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nm; D.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); URL.revokeObjectURL(a.href); }, 4000);
    }).catch(function () { toast('Could not make the PDF here. Please try again.'); });
  }
  el('dg-inv').addEventListener('click', function () { make('inv'); });
  el('dg-pl').addEventListener('click', function () { make('pl'); });
  el('dg-both').addEventListener('click', function () { make('both'); });
  itemsUI(); clUI();
  window.DG_WORDS = inWords;
})();
