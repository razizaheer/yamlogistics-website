/* CargoKit: B/L and AWB draft maker. Builds a check draft (never a real bill of lading or air waybill) as an A4 PDF.
   Runs on the device; nothing is uploaded. Can fill itself from the invoice and packing list maker (ck_doc_v1). */
(function () {
  var root = document.getElementById('bd-root'); if (!root) return;
  var D = document, KEY = 'ck_draft_v1', WA = 'https://wa.me/message/6YB7I76DV6UJL1';
  var css = D.createElement('style');
  css.textContent =
    '.bd-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:24px;margin-bottom:16px}' +
    '.bd-h{font-family:Archivo,sans-serif;font-weight:800;font-size:21px;margin:0 0 4px;color:#0B2A4A}.bd-s{font-size:14px;color:#5E7891;margin:0 0 16px;line-height:1.5}' +
    '.bd-g{display:grid;grid-template-columns:1fr 1fr;gap:12px}.bd-g .w{grid-column:1/-1}.bd-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.bd-g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}' +
    '@media(max-width:620px){.bd-g{grid-template-columns:1fr}.bd-g3,.bd-g4{grid-template-columns:1fr 1fr}}' +
    '.bd-l{font-size:13px;font-weight:600;color:#3D5873;margin:0 0 6px;display:block}' +
    '.bd-in{width:100%;box-sizing:border-box;padding:12px 13px;border:1px solid #C9DCEC;border-radius:14px;font:inherit;font-size:16px;color:#0B2A4A;background:#fff}textarea.bd-in{min-height:84px;resize:vertical;font-family:Geist,system-ui,sans-serif}' +
    '.bd-in:focus{outline:2px solid #0A6CC2;border-color:#0A6CC2}.bd-in.bad{border-color:#DC2626;background:#FEF2F2}' +
    '.bd-it{border:1px solid #E1EDF7;background:#F7FBFF;border-radius:18px;padding:14px;margin-top:12px}.bd-it .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-weight:700;color:#0B2A4A}' +
    '.bd-b{border:0;border-radius:999px;padding:13px 20px;font:inherit;font-weight:700;font-size:15px;cursor:pointer}.bd-p{background:#0A6CC2;color:#fff}.bd-y{background:#FFC93C;color:#0B2A4A}.bd-q{background:#EEF6FD;color:#0B2A4A}.bd-r{background:#FEE2E2;color:#B91C1C}.bd-w{background:#25D366;color:#06331A}' +
    '.bd-tabs{display:inline-flex;gap:6px;background:#EEF6FD;border-radius:999px;padding:5px;margin:0 0 18px}.bd-tabs button{border:0;border-radius:999px;padding:12px 22px;font:inherit;font-weight:700;font-size:16px;background:none;color:#0B2A4A;cursor:pointer}.bd-tabs button.on{background:#0B2A4A;color:#fff}' +
    '.bd-tot{background:#0A6CC2;color:#fff;border-radius:18px;padding:16px 20px;margin-top:14px;font-size:14px;line-height:1.6}.bd-tot b{font-family:Archivo,sans-serif;font-size:22px}' +
    '.bd-note{font-size:13px;line-height:1.55;color:#7A3E00;background:#FFF8E6;border-radius:12px;padding:12px 14px;margin-top:14px}.bd-msg{font-size:13px;margin-top:4px;color:#B91C1C}.bd-ok{color:#15803D}' +
    '.bd-more{background:#fff;border:1px dashed #C9DCEC;border-radius:24px;padding:18px 24px;margin-bottom:16px}.bd-more>summary{cursor:pointer;font-family:Archivo,sans-serif;font-weight:800;font-size:19px;color:#0B2A4A;list-style:none}.bd-more>summary::-webkit-details-marker{display:none}.bd-more>summary:before{content:"+ ";color:#0A6CC2}.bd-more[open]>summary:before{content:"− "}.bd-more .bd-s{margin-top:6px}.bd-opt{font-weight:400;color:#7C93A8}' +
    '.bd-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}';
  D.head.appendChild(css);

  var BLF = ['blNo', 'bkNo', 'carrier', 'shp', 'cons', 'notify', 'preCarr', 'por', 'vessel', 'voy', 'pol', 'pod', 'pdel', 'fdest', 'marks', 'pkgKind', 'desc', 'hs', 'inv', 'sb', 'iec', 'nw', 'service', 'frt', 'payAt', 'issuePlace', 'issueDate', 'orig', 'onboard', 'stc'];
  var AWF = ['awbPfx', 'awbNo', 'carrier', 'shp', 'shpAcc', 'cons', 'consAcc', 'agent', 'dep', 'to1', 'by1', 'to2', 'by2', 'to3', 'by3', 'dest', 'flight', 'fdate', 'frt', 'dvc', 'dvcu', 'ins', 'handling', 'sci', 'goods', 'emerg', 'remarks', 'execDate', 'execPlace', 'execBy'];
  var S = { tab: 'bl', bl: { f: {}, ctrs: [] }, awb: { f: {}, lines: [], oc: [] } };
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(i) { return D.getElementById(i); }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isNaN(n) ? 0 : n; }
  function fmt(n, d) { return n.toLocaleString('en-US', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dmy(s) { if (!/^\d{4}-\d\d-\d\d$/.test(s || '')) return s || ''; var p = s.split('-'), M = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']; return M[+p[1] - 1] + '.' + p[2] + '.' + p[0]; }
  function load() { try { var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.bl && j.awb) S = j; } catch (e) {} }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function bCtr() { return { no: '', type: "40'HC", seal: '', pk: '', gw: '', cb: '' }; }
  function bLine() { return { pcs: '', gw: '', dims: '' }; }
  load();
  if (!S.bl.ctrs.length) S.bl.ctrs.push(bCtr());
  if (!S.awb.lines.length) S.awb.lines.push(bLine());
  var bf = S.bl.f, af = S.awb.f;
  if (!bf.frt) bf.frt = 'FREIGHT PREPAID'; if (!bf.service) bf.service = 'CY/CY'; if (!bf.orig) bf.orig = 'THREE (3)'; if (!bf.issueDate) bf.issueDate = today(); if (bf.stc == null) bf.stc = 'yes';
  if (!af.frt) af.frt = 'PREPAID'; if (!af.dvc) af.dvc = 'NVD'; if (!af.dvcu) af.dvcu = 'NCV'; if (!af.ins) af.ins = 'NIL'; if (!af.execDate) af.execDate = today();

  // ---------- checks
  var ISO = {}; 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (c, i) { var v = 10 + i; v += Math.floor((v - 1) / 10); ISO[c] = v; });
  function ctrOk(n) {
    n = String(n || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (!/^[A-Z]{4}\d{7}$/.test(n)) return null;
    var s = 0; for (var i = 0; i < 10; i++) { var c = n[i], v = /\d/.test(c) ? +c : ISO[c]; s += v * Math.pow(2, i); }
    return (s % 11) % 10 === +n[10];
  }
  function awbOk(p, n) { n = String(n || '').replace(/\D/g, ''); if (!/^\d{3}$/.test(String(p || '')) || n.length !== 8) return null; return (+n.slice(0, 7)) % 7 === +n[7]; }
  var ONES = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  var TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  function words(n) {
    n = Math.floor(n); if (n < 20) return ONES[n]; if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
    if (n < 1000) return ONES[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' AND ' + words(n % 100) : '');
    if (n < 100000) return words(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + words(n % 1000) : ''); return String(n);
  }

  // ---------- form helpers
  function inp(g, id, label, ph, cls, type) { return '<div' + (cls ? ' class="' + cls + '"' : '') + '><label class="bd-l" for="' + g + '_' + id + '">' + label + '</label><input class="bd-in" id="' + g + '_' + id + '" data-g="' + g + '" data-f="' + id + '" placeholder="' + h(ph || '') + '"' + (type ? ' type="' + type + '"' : '') + '></div>'; }
  function area(g, id, label, ph, cls) { return '<div class="' + (cls || 'w') + '"><label class="bd-l" for="' + g + '_' + id + '">' + label + '</label><textarea class="bd-in" id="' + g + '_' + id + '" data-g="' + g + '" data-f="' + id + '" placeholder="' + h(ph || '') + '"></textarea></div>'; }
  function sel(g, id, label, opts, cls) { return '<div' + (cls ? ' class="' + cls + '"' : '') + '><label class="bd-l" for="' + g + '_' + id + '">' + label + '</label><select class="bd-in" id="' + g + '_' + id + '" data-g="' + g + '" data-f="' + id + '">' + opts.map(function (o) { var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return '<option value="' + h(v) + '">' + h(t) + '</option>'; }).join('') + '</select></div>'; }

  var O = ' <span class="bd-opt">(optional)</span>';
  var MORE_S = '<p class="bd-s">Fill these only if you know them. Your forwarder, the shipping line or the airline will complete the rest.</p>';
  var BL_HTML =
    '<div class="bd-card"><h2 class="bd-h">1. Shipper and consignee</h2><p class="bd-s">Exactly as on your invoice. Your details are kept on this phone.</p><div class="bd-g">' +
    area('bl', 'shp', 'Shipper (name and address)', 'Company name\nAddress\nCity, PIN, country', 'w') + area('bl', 'cons', 'Consignee', 'TO ORDER, or company name and full address, tax ID', 'w') + area('bl', 'notify', 'Notify party' + O, 'SAME AS CONSIGNEE, or name and address', 'w') + '</div></div>' +
    '<div class="bd-card"><h2 class="bd-h">2. From and to</h2><div class="bd-g">' +
    inp('bl', 'pol', 'Port of loading', 'e.g. NHAVA SHEVA, INDIA') + inp('bl', 'pod', 'Port of discharge', 'e.g. JEBEL ALI, UAE') + '</div></div>' +
    '<div class="bd-card"><h2 class="bd-h">3. Packages and weight</h2><p class="bd-s">One block per container, or one block for LCL. Container numbers, if you have them, are checked as you type.</p><div id="bl-ctrs"></div><div style="margin-top:12px"><button type="button" class="bd-b bd-q" id="bl-add">+ Add container</button></div></div>' +
    '<div class="bd-card"><h2 class="bd-h">4. The goods</h2><div class="bd-g">' +
    area('bl', 'desc', 'Description of goods', 'e.g. PRINTERS', 'w') + inp('bl', 'pkgKind', 'Kind of packages', 'e.g. PALLETS, CARTONS, BAGS') + inp('bl', 'hs', 'HS code(s)' + O, 'e.g. 84433100, 84433240') +
    inp('bl', 'inv', 'Invoice no. and date' + O, 'e.g. IT/405/26 DT.02.08.2026') + inp('bl', 'sb', 'Shipping bill no. and date' + O, 'e.g. 5683234 DT.05.08.2026') + inp('bl', 'iec', 'IEC no.' + O, '') + inp('bl', 'nw', 'Net weight (kg)' + O, '') +
    area('bl', 'marks', 'Marks and numbers' + O, 'e.g. AS PER INVOICE', 'w') + '</div><div id="bl-tot" class="bd-tot"></div></div>' +
    '<details class="bd-more"><summary>More details (optional)</summary>' + MORE_S + '<div class="bd-g">' +
    inp('bl', 'vessel', 'Ocean vessel', 'e.g. HEMMA BHUM') + inp('bl', 'voy', 'Voyage no.', 'e.g. 017E') + inp('bl', 'preCarr', 'Pre-carriage by', 'e.g. RAIL, TRUCK') + inp('bl', 'por', 'Place of receipt', 'e.g. ICD TUGHLAKABAD') +
    inp('bl', 'pdel', 'Place of delivery', '') + inp('bl', 'fdest', 'Final destination', '') + inp('bl', 'carrier', 'Shipping line or NVOCC', '') + inp('bl', 'blNo', 'B/L no.', '') + inp('bl', 'bkNo', 'Booking no.', '') +
    sel('bl', 'stc', 'Wording', [['yes', "SHIPPER'S LOAD, COUNT & WEIGHT / SAID TO CONTAIN (FCL)"], ['no', 'No STC wording (LCL)']]) +
    sel('bl', 'frt', 'Freight', ['FREIGHT PREPAID', 'FREIGHT COLLECT']) + inp('bl', 'payAt', 'Freight payable at', 'e.g. NHAVA SHEVA, INDIA') + inp('bl', 'service', 'Service', 'CY/CY') + sel('bl', 'orig', 'Number of original B/Ls', ['THREE (3)', 'TWO (2)', 'ONE (1)', 'ZERO (0) – SEAWAY BILL', 'ZERO (0) – TELEX RELEASE']) +
    inp('bl', 'issuePlace', 'Place of issue', 'e.g. NHAVA SHEVA, INDIA') + inp('bl', 'issueDate', 'Date of issue', '', '', 'date') + inp('bl', 'onboard', 'Shipped on board date', '', '', 'date') + '</div></details>';

  var AWB_HTML =
    '<div class="bd-card"><h2 class="bd-h">1. Shipper and consignee</h2><p class="bd-s">Exactly as on your invoice. Your details are kept on this phone.</p><div class="bd-g">' +
    area('awb', 'shp', "Shipper's name and address", 'Company name, address, phone', 'w') + area('awb', 'cons', "Consignee's name and address", 'Company name, address, phone, tax no.', 'w') + '</div></div>' +
    '<div class="bd-card"><h2 class="bd-h">2. From and to</h2><div class="bd-g">' +
    inp('awb', 'dep', 'Airport of departure', 'e.g. NEW DELHI (DEL)') + inp('awb', 'dest', 'Airport of destination', 'e.g. DUBAI (DXB)') + '</div></div>' +
    '<div class="bd-card"><h2 class="bd-h">3. Packages and weight</h2><p class="bd-s">From your packing list. If you add dimensions (L×W×H/pieces in cm, one per line) we also show the volume weight (cm³ ÷ 6000) and chargeable weight.</p><div id="awb-lines"></div><div style="margin-top:12px"><button type="button" class="bd-b bd-q" id="awb-add">+ Add a line</button></div>' +
    '<div class="bd-g" style="margin-top:12px">' + area('awb', 'goods', 'Description of goods', 'e.g. SAID TO CONTAIN MOBILE PHONES. HSN 85171300. INVOICE NO …', 'w') + '</div><div id="awb-tot" class="bd-tot"></div></div>' +
    '<div class="bd-card"><h2 class="bd-h">4. Special instructions' + O + '</h2><p class="bd-s">Needed for most dangerous goods and shipments with batteries. Not sure which battery wording applies? <a href="lithium-battery-checker.html">Check it here</a>.</p><div class="bd-g">' +
    inp('awb', 'emerg', '24-hour emergency contact', 'e.g. +91 98XXX XXXXX, name', 'w') +
    area('awb', 'remarks', 'Special comments', 'e.g. UN3481, LITHIUM ION BATTERIES CONTAINED IN EQUIPMENT, PI 967, SECTION II', 'w') + '</div>' +
    '<div class="bd-row" style="margin-top:10px;gap:8px">' + [["UN3481, LITHIUM ION BATTERIES CONTAINED IN EQUIPMENT, PI 967, SECTION II", "Li-ion in equipment (PI 967)"], ["UN3481, LITHIUM ION BATTERIES PACKED WITH EQUIPMENT, PI 966, SECTION II", "Li-ion packed with equipment (PI 966)"], ["UN3091, LITHIUM METAL BATTERIES CONTAINED IN EQUIPMENT, PI 970, SECTION II", "Li-metal in equipment (PI 970)"], ["UN3091, LITHIUM METAL BATTERIES PACKED WITH EQUIPMENT, PI 969, SECTION II", "Li-metal packed with equipment (PI 969)"], ["BATTERY CERTIFICATE AND MSDS ATTACHED", "Battery certificate / MSDS attached"], ["PLEASE INFORM CONSIGNEE IMMEDIATELY ON ARRIVAL OF CARGO", "Inform consignee on arrival"]].map(function (c) { return '<button type="button" class="bd-b bd-q" style="padding:8px 14px;font-size:13px" data-chip="' + h(c[0]) + '">+ ' + h(c[1]) + '</button>'; }).join('') + '</div>' + '</div>' +
    '<details class="bd-more"><summary>More details (optional)</summary>' + MORE_S + '<div class="bd-g4">' +
    inp('awb', 'awbPfx', 'AWB prefix', 'e.g. 098') + inp('awb', 'awbNo', 'AWB serial (8 digits)', 'e.g. 3227 5821') + inp('awb', 'carrier', 'Airline', 'e.g. AIR INDIA') + inp('awb', 'flight', 'Requested flight', 'e.g. AI 0915') +
    '<div class="bd-msg" id="awb-chk" style="grid-column:1/-1"></div>' +
    inp('awb', 'fdate', 'Flight date', '', '', 'date') + inp('awb', 'to1', 'Via / to (1)', 'e.g. DXB') + inp('awb', 'by1', 'By airline (1)', 'e.g. AI') + inp('awb', 'to2', 'To (2)', '') + inp('awb', 'by2', 'By (2)', '') + inp('awb', 'to3', 'To (3)', '') + inp('awb', 'by3', 'By (3)', '') +
    sel('awb', 'frt', 'Freight', ['PREPAID', 'COLLECT']) + inp('awb', 'dvc', 'Declared value for carriage', 'NVD') + inp('awb', 'dvcu', 'Declared value for customs', 'NCV') + inp('awb', 'ins', 'Amount of insurance', 'NIL') + inp('awb', 'sci', 'SCI', '') +
    inp('awb', 'shpAcc', "Shipper's account no.", '') + inp('awb', 'consAcc', "Consignee's account no.", '') + inp('awb', 'execDate', 'Date', '', '', 'date') + inp('awb', 'execPlace', 'Place', 'e.g. NEW DELHI') + '</div><div class="bd-g" style="margin-top:12px">' +
    area('awb', 'agent', 'Forwarder or agent, name and city', 'e.g. ABC FREIGHT PVT LTD, NEW DELHI') + inp('awb', 'execBy', 'Name of shipper or agent', '') +
    area('awb', 'handling', 'Handling information', 'e.g. PLEASE INFORM CONSIGNEE ON ARRIVAL. MARKS & NO.: …') + '</div></details>';

  root.innerHTML =
    '<div class="bd-tabs" role="tablist"><button type="button" data-t="bl">🚢 B/L draft</button><button type="button" data-t="awb">✈️ AWB draft</button></div>' +
    '<div class="bd-card" style="background:#FFF8E6;border-color:#FFE3A0"><b style="font-family:Archivo,sans-serif;font-size:18px">Start from your invoice and packing list</b><div class="bd-s" style="margin:4px 0 12px">We fill in the parties, ports, goods, packages and weights for you. <span id="bd-priv">Files are read on this phone; nothing is uploaded.</span></div>' +
    '<div class="bd-row"><button type="button" class="bd-b bd-y" id="bd-up">Read my invoice / packing list (PDF or photo)</button><button type="button" class="bd-b bd-q" id="bd-fill">Use the invoice I made in CargoKit</button><button type="button" class="bd-b bd-r" id="bd-clr2">✕ Clear form</button><input type="file" id="bd-file" accept="application/pdf,image/*" multiple hidden></div><div class="bd-s" id="bd-upmsg" style="margin:10px 0 0" aria-live="polite"></div></div>' +
    '<div id="bd-bl">' + BL_HTML + '</div><div id="bd-awb">' + AWB_HTML + '</div>' +
    '<div class="bd-card"><h2 class="bd-h">Make the draft</h2><p class="bd-s">An A4 PDF marked DRAFT, for checking with your forwarder, carrier or buyer before the real document is issued.</p>' +
    '<div class="bd-row"><button type="button" class="bd-b bd-p" id="bd-pdf">Download the draft PDF</button><button type="button" class="bd-b bd-w" id="bd-wa">Share the PDF</button><a class="bd-b bd-q" href="document-checker.html" style="text-decoration:none">Check it against my invoice →</a><button type="button" class="bd-b bd-r" id="bd-clr">Clear this form</button></div>' +
    '<div class="bd-note">This is a draft for checking only. It is not a bill of lading or an air waybill and cannot be used to ship, claim or release cargo. Only the carrier, NVOCC or airline (or its agent) issues the real document and its number.</div></div>';

  function bindFields(g, list) {
    var f = S[g].f;
    list.forEach(function (k) { var e = el(g + '_' + k); if (!e) return; e.value = f[k] == null ? '' : f[k]; var fn = function () { f[k] = e.value; save(); refresh(); }; e.addEventListener('input', fn); e.addEventListener('change', fn); });
  }
  bindFields('bl', BLF); bindFields('awb', AWF);

  function ctrsUI() {
    el('bl-ctrs').innerHTML = S.bl.ctrs.map(function (c, i) {
      return '<div class="bd-it"><div class="top"><span>Container ' + (i + 1) + '</span>' + (S.bl.ctrs.length > 1 ? '<button type="button" class="bd-b bd-r" data-rmc="' + i + '" style="padding:6px 12px;font-size:13px">Remove</button>' : '') + '</div><div class="bd-g3">' +
        '<div><label class="bd-l">Container no.' + O + '</label><input class="bd-in" data-c="' + i + '" data-k="no" placeholder="e.g. SKHU9622884" value="' + h(c.no) + '"><div class="bd-msg" id="cm' + i + '"></div></div>' +
        '<div><label class="bd-l">Type</label><select class="bd-in" data-c="' + i + '" data-k="type">' + ["20'GP", "40'GP", "40'HC", "45'HC", "20'RF", "40'RH", "20'OT", "40'OT", "20'FR", "40'FR", "20'TK", 'LCL'].map(function (t) { return '<option' + (t === c.type ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>' +
        '<div><label class="bd-l">Seal no.' + O + '</label><input class="bd-in" data-c="' + i + '" data-k="seal" value="' + h(c.seal) + '"></div>' +
        '<div><label class="bd-l">Packages</label><input class="bd-in" inputmode="numeric" data-c="' + i + '" data-k="pk" value="' + h(c.pk) + '"></div>' +
        '<div><label class="bd-l">Gross weight (kg)</label><input class="bd-in" inputmode="decimal" data-c="' + i + '" data-k="gw" value="' + h(c.gw) + '"></div>' +
        '<div><label class="bd-l">Volume (CBM)' + O + '</label><input class="bd-in" inputmode="decimal" data-c="' + i + '" data-k="cb" value="' + h(c.cb) + '"></div></div></div>';
    }).join('');
    ctrChecks();
  }
  function ctrChecks() {
    S.bl.ctrs.forEach(function (c, i) {
      var m = el('cm' + i), r = ctrOk(c.no), inpEl = root.querySelector('input[data-c="' + i + '"][data-k="no"]'); if (!m) return;
      if (!c.no) { m.textContent = ''; inpEl.classList.remove('bad'); return; }
      if (r === null) { m.className = 'bd-msg'; m.textContent = '4 letters and 7 digits, e.g. MSKU1234565'; inpEl.classList.add('bad'); }
      else if (!r) { m.className = 'bd-msg'; m.textContent = 'Check digit does not match: please re-check this number'; inpEl.classList.add('bad'); }
      else { m.className = 'bd-msg bd-ok'; m.textContent = '✓ Valid container number'; inpEl.classList.remove('bad'); }
    });
  }
  function linesUI() {
    el('awb-lines').innerHTML = S.awb.lines.map(function (l, i) {
      return '<div class="bd-it"><div class="top"><span>Line ' + (i + 1) + '</span>' + (S.awb.lines.length > 1 ? '<button type="button" class="bd-b bd-r" data-rml="' + i + '" style="padding:6px 12px;font-size:13px">Remove</button>' : '') + '</div><div class="bd-g">' +
        '<div><label class="bd-l">Pieces</label><input class="bd-in" inputmode="numeric" data-l="' + i + '" data-k="pcs" value="' + h(l.pcs) + '"></div>' +
        '<div><label class="bd-l">Gross weight (kg)</label><input class="bd-in" inputmode="decimal" data-l="' + i + '" data-k="gw" value="' + h(l.gw) + '"></div>' +
        '<div class="w"><label class="bd-l">Dimensions (cm), one per line: L×W×H/pieces' + O + '</label><textarea class="bd-in" data-l="' + i + '" data-k="dims" placeholder="120x80x84/2\n120x80x100/1">' + h(l.dims) + '</textarea></div></div></div>';
    }).join('');
  }
  // ---------- sums
  function blSum() {
    var c = S.bl.ctrs, pk = 0, gw = 0, cb = 0, types = {};
    c.forEach(function (x) { pk += num(x.pk); gw += num(x.gw); cb += num(x.cb); if (x.no || x.pk || x.gw) types[x.type] = (types[x.type] || 0) + 1; });
    var n = c.filter(function (x) { return x.no || x.pk || x.gw; }).length;
    return { pk: pk, gw: gw, cb: cb, n: n, types: types };
  }
  function dimsOf(t) { var v = 0; String(t || '').split(/\n|;/).forEach(function (r) { var m = r.replace(/\s/g, '').match(/^(\d+(?:\.\d+)?)[x*×](\d+(?:\.\d+)?)[x*×](\d+(?:\.\d+)?)(?:\/(\d+))?/i); if (m) v += m[1] * m[2] * m[3] * (m[4] ? +m[4] : 1); }); return v; }
  function awbSum() {
    var pcs = 0, gw = 0, ch = 0, vol = 0, vw = 0;
    var rows = S.awb.lines.map(function (l) {
      var cm3 = dimsOf(l.dims), v = cm3 / 6000, g = num(l.gw), c = Math.ceil(Math.max(g, v) * 2) / 2;
      pcs += num(l.pcs); gw += g; ch += c; vol += cm3; vw += v;
      return { l: l, vw: v, c: c };
    });
    return { rows: rows, pcs: pcs, gw: gw, ch: ch, vw: vw, vol: vol / 1e6 };
  }
  function stcText() {
    var b = S.bl.f, s = blSum(), out = [];
    if (b.stc === 'yes') out.push("SHIPPER'S LOAD, COUNT & WEIGHT", 'SAID TO CONTAIN');
    var t = Object.keys(s.types).filter(function (k) { return k !== 'LCL'; });
    if (t.length) out.push(t.map(function (k) { return s.types[k] + ' X ' + k.replace("'", "' ") + ' FCL'; }).join(', ') + ' CONTAINER' + (s.n > 1 ? 'S' : '') + (b.stc === 'yes' ? ' STC :' : ' :'));
    if (s.pk) out.push(fmt(s.pk, 0) + ' (' + words(s.pk) + ') ' + (b.pkgKind || 'PACKAGES').toUpperCase() + (b.desc ? ' CONTAINING:' : ''));
    if (b.desc) out.push(b.desc.toUpperCase());
    if (b.hs) out.push('H.S. CODE: ' + b.hs.toUpperCase()); if (b.inv) out.push('INV. NO: ' + b.inv.toUpperCase()); if (b.sb) out.push('S/BILL NO: ' + b.sb.toUpperCase());
    if (b.iec) out.push('IEC NO: ' + b.iec.toUpperCase()); if (num(b.nw)) out.push('NET WT. ' + fmt(num(b.nw)) + ' KGS');
    return out;
  }
  function sayText() {
    var s = blSum(), t = Object.keys(s.types).filter(function (k) { return k !== 'LCL'; });
    if (t.length) return 'SAY : ' + words(s.n) + ' (' + t.map(function (k) { return k + ' X' + s.types[k]; }).join(', ') + ') CONTAINER' + (s.n > 1 ? 'S' : '') + ' ONLY.';
    if (s.pk) return 'SAY : ' + words(s.pk) + ' ' + (S.bl.f.pkgKind || 'PACKAGES').toUpperCase() + ' ONLY.';
    return '';
  }
  function refresh() {
    var s = blSum();
    el('bl-tot').innerHTML = '<b>' + s.n + '</b> container' + (s.n === 1 ? '' : 's') + ' · <b>' + fmt(s.pk, 0) + '</b> packages · <b>' + fmt(s.gw, 3) + '</b> kg gross · <b>' + fmt(s.cb, 3) + '</b> CBM' + (sayText() ? '<div style="margin-top:6px;opacity:.9">' + h(sayText()) + '</div>' : '');
    var a = awbSum();
    el('awb-tot').innerHTML = '<b>' + fmt(a.pcs, 0) + '</b> pcs · <b>' + fmt(a.gw) + '</b> kg gross · volume <b>' + fmt(a.vol, 3) + '</b> m³ (<b>' + fmt(a.vw) + '</b> kg volume weight) · chargeable <b>' + fmt(a.ch) + '</b> kg';
    var c = awbOk(S.awb.f.awbPfx, S.awb.f.awbNo), m = el('awb-chk');
    m.className = 'bd-msg' + (c ? ' bd-ok' : ''); m.textContent = c === null ? (S.awb.f.awbNo ? 'Enter a 3-digit prefix and an 8-digit serial' : '') : c ? '✓ Valid air waybill number' : 'The last digit does not match (serial ÷ 7): please re-check';
    ctrChecks();
  }
  function tab(t) {
    S.tab = t; save();
    el('bd-bl').hidden = t !== 'bl'; el('bd-awb').hidden = t !== 'awb';
    root.querySelectorAll('.bd-tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); });
  }

  root.addEventListener('input', function (e) {
    var t = e.target, k = t.dataset.k;
    if (t.dataset.c != null) { S.bl.ctrs[+t.dataset.c][k] = t.value; save(); refresh(); }
    else if (t.dataset.l != null) { S.awb.lines[+t.dataset.l][k] = t.value; save(); refresh(); }
    
  });
  root.addEventListener('change', function (e) { var t = e.target; if (t.tagName === 'SELECT' && (t.dataset.c != null || t.dataset.l != null)) t.dispatchEvent(new Event('input', { bubbles: true })); });
  root.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.dataset.t) return tab(t.dataset.t);
    if (t.dataset.rmc != null) { S.bl.ctrs.splice(+t.dataset.rmc, 1); save(); ctrsUI(); refresh(); }
    if (t.dataset.rml != null) { S.awb.lines.splice(+t.dataset.rml, 1); save(); linesUI(); refresh(); }
    if (t.dataset.chip) { var r = el('awb_remarks'), v = r.value.trim(); if (v.indexOf(t.dataset.chip) < 0) { r.value = (v ? v + '\n' : '') + t.dataset.chip; r.dispatchEvent(new Event('input', { bubbles: true })); } }
  });
  el('bl-add').onclick = function () { var l = S.bl.ctrs[S.bl.ctrs.length - 1]; var n = bCtr(); if (l) n.type = l.type; S.bl.ctrs.push(n); save(); ctrsUI(); refresh(); };
  el('awb-add').onclick = function () { S.awb.lines.push(bLine()); save(); linesUI(); refresh(); };
  el('bd-clr2').onclick = function () { el('bd-clr').click(); };
  el('bd-clr').onclick = function () {
    if (!confirm('Clear the ' + (S.tab === 'bl' ? 'B/L' : 'AWB') + ' draft?')) return;
    if (S.tab === 'bl') S.bl = { f: { frt: 'FREIGHT PREPAID', service: 'CY/CY', orig: 'THREE (3)', issueDate: today(), stc: 'yes' }, ctrs: [bCtr()] };
    else S.awb = { f: { frt: 'PREPAID', dvc: 'NVD', dvcu: 'NCV', ins: 'NIL', execDate: today() }, lines: [bLine()] };
    try { sessionStorage.removeItem('bd_ai'); } catch (e) {}
    save(); location.reload();
  };
  // fill from the invoice and packing list maker
  el('bd-fill').onclick = function () {
    var d = null; try { d = JSON.parse(localStorage.getItem('ck_doc_v1') || 'null'); } catch (e) {}
    if (!d || !d.f || !d.f.exName) { el('bd-upmsg').textContent = 'No CargoKit invoice found on this phone yet. Make one in the invoice & packing list maker, or read your own invoice with the yellow button.'; return; }
    var f = d.f, it = d.items || [], party = function (n, a, t) { return [n, a, t].filter(Boolean).join('\n').toUpperCase(); };
    var gw = 0, nw = 0, pk = 0, cb = 0; it.forEach(function (x) { gw += num(x.gw); nw += num(x.nw); pk += num(x.pk); cb += num(x.cb); });
    var desc = it.map(function (x) { return x.d; }).filter(Boolean).join('\n').toUpperCase(), hs = it.map(function (x) { return x.hs; }).filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ');
    var inv = (f.invNo || '') + (f.invDate ? ' DT.' + f.invDate.split('-').reverse().join('.') : '');
    if (S.tab === 'bl') {
      var b = S.bl.f; b.shp = party(f.exName, f.exAddr, f.exTax); b.cons = party(f.coName, f.coAddr, f.coTax); b.notify = f.ntName ? f.ntName.toUpperCase() : 'SAME AS CONSIGNEE';
      b.pol = (f.pol || b.pol || '').toUpperCase(); b.pod = (f.pod || b.pod || '').toUpperCase(); b.pdel = (f.dest || f.pod || b.pdel || '').toUpperCase(); b.desc = desc; b.hs = hs; b.inv = inv.toUpperCase(); if (nw) b.nw = String(nw);
      if (f.vessel) b.vessel = f.vessel.toUpperCase(); if (f.marks) b.marks = f.marks.toUpperCase();
      if (S.bl.ctrs.length === 1 && !S.bl.ctrs[0].pk && !S.bl.ctrs[0].gw) { S.bl.ctrs[0].pk = pk ? String(pk) : ''; S.bl.ctrs[0].gw = gw ? String(gw) : ''; S.bl.ctrs[0].cb = cb ? String(cb) : ''; }
    } else {
      var a = S.awb.f; a.shp = party(f.exName, f.exAddr, f.exTax); a.cons = party(f.coName, f.coAddr, f.coTax); a.dep = (f.pol || a.dep || '').toUpperCase(); a.dest = (f.pod || f.dest || a.dest || '').toUpperCase();
      a.goods = ['SAID TO CONTAIN ' + desc.replace(/\n/g, ', '), hs ? 'HSN: ' + hs : '', inv ? 'INVOICE NO: ' + inv.toUpperCase() : ''].filter(Boolean).join('\n');
      if (S.awb.lines.length === 1 && !S.awb.lines[0].pcs && !S.awb.lines[0].gw) { S.awb.lines[0].pcs = pk ? String(pk) : ''; S.awb.lines[0].gw = gw ? String(gw) : ''; }
    }
    save(); location.reload();
  };

  // read the visitor's own invoice / packing list (PDF, scan or photo) with the document checker's reader
  function ld(src) { return new Promise(function (ok, no) { var s = D.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; D.head.appendChild(s); }); }
  var rdP; function readers() { if (!rdP) rdP = (window.BLRead ? Promise.resolve() : ld('bl-reader.js?v=4')).then(function () { return window.DocCheck ? 0 : ld('doc-check.js?v=3'); }).then(function () { return window.DocAI ? 0 : ld('doc-ai.js?v=1'); }); return rdP; }
  function vOf(x) { return x == null ? null : typeof x === 'object' && !Array.isArray(x) ? x.v : x; }
  function addrAfter(text, name) {
    if (!name) return ''; var T = String(text || ''), i = T.toUpperCase().indexOf(name.toUpperCase()); if (i < 0) return '';
    var out = [], ls = T.slice(i + name.length).split('\n').map(function (s) { return s.trim(); });
    if (ls[0]) ls[0] = ls[0].replace(/^[,.\s]+/, '');
    for (var k = 0; k < ls.length && out.length < 3; k++) { var s = ls[k]; if (!s) { if (out.length) break; continue; } if (/CONSIGNEE|BUYER|SHIPPER|EXPORTER|NOTIFY|INVOICE|DATE|PORT|COUNTRY OF|TERMS|SOLD TO|BILL TO|SHIP TO|IEC|GSTIN|INCOTERM|CURRENCY|PAYMENT|VESSEL|FLIGHT|MARKS|DESCRIPTION|TEL|PHONE|EMAIL/i.test(s) && !/\d{5,6}/.test(s)) break; out.push(s.slice(0, 70)); }
    return out.join('\n');
  }
  el('bd-up').onclick = function () { el('bd-file').click(); };
  el('bd-file').onchange = function () {
    var files = [].slice.call(this.files || []), msg = el('bd-upmsg'); this.value = ''; if (!files.length) return;
    msg.textContent = 'Getting the reader ready…';
    readers().then(function () {
      var F = {}, txt = '', N = { pallets: 0, cartons: 0, pieces: 0, gross: 0, net: 0, cbm: 0, dims: [] }, ai = [];
      return files.reduce(function (pr, f, n) {
        return pr.then(function () {
          return window.BLRead.readText(f, function (p) { msg.textContent = 'Reading ' + f.name + (files.length > 1 ? ' (' + (n + 1) + ' of ' + files.length + ')' : '') + ': ' + p.stage + (p.p ? ' ' + Math.round(p.p * 100) + '%' : ''); })
            .then(function (d) { var x = window.DocCheck.extract(d, S.tab === 'awb'); txt += '\n' + (d.text || '');
              // totals read from the tables by column name, and the page text kept on this device in case the user asks for the AI reading
              try { var m = window.DocAI.numbers(d); ['pallets', 'cartons', 'pieces', 'gross', 'net', 'cbm'].forEach(function (k) { if (m[k] > N[k]) N[k] = m[k]; }); if (m.dims.length > N.dims.length) N.dims = m.dims; ai.push({ name: f.name, text: window.DocAI.layoutText(d, true).slice(0, 9000) }); } catch (e) {}
              Object.keys(x).forEach(function (k) { var v = vOf(x[k]); if (v != null && v !== '' && !(Array.isArray(v) && !v.length) && (F[k] == null || (k === 'gross' && v > F[k]))) F[k] = v; }); });
        });
      }, Promise.resolve()).then(function () { return { F: F, txt: txt, N: N, ai: ai }; });
    }).then(function (r) {
      var F = r.F, got = [], g = S.tab, f = S[g].f;
      // what we read from the documents replaces what was typed before: the user asked us to read them
      function put(k, v, label) { if (v == null || v === '') return; f[k] = String(v).toUpperCase(); got.push(label); }
      var sa = addrAfter(r.txt, F.shipper), ca = addrAfter(r.txt, F.consignee);
      put('shp', F.shipper && [F.shipper, sa].filter(Boolean).join('\n'), 'shipper'); put('cons', F.consignee && [F.consignee, ca].filter(Boolean).join('\n'), 'consignee');
      var hs = Array.isArray(F.hs) ? F.hs.map(function (x) { return typeof x === 'object' ? x.v || x.code : x; }).filter(Boolean).join(', ') : F.hs;
      var N = r.N, pk = N.pallets || num(F.pkgs) || N.cartons, gw = Math.max(num(F.gross), N.gross), nw = num(F.net) || N.net;
      try { if (r.ai.length) sessionStorage.setItem('bd_ai', JSON.stringify({ tab: g, docs: r.ai })); else sessionStorage.removeItem('bd_ai'); } catch (e) {}
      if (g === 'bl') {
        put('pol', F.pol, 'port of loading'); put('pod', F.pod, 'port of discharge'); put('hs', hs, 'HS codes'); put('inv', F.inv, 'invoice no.'); if (nw) put('nw', nw, 'net weight');
        var c = S.bl.ctrs[0];
        if (S.bl.ctrs.length === 1) { if (pk) { c.pk = String(pk); got.push(fmt(pk, 0) + (pk === 1 ? ' package' : ' packages')); } if (gw) { c.gw = String(gw); got.push(fmt(gw) + ' kg gross'); } if (N.cbm) { c.cb = String(N.cbm); got.push(N.cbm + ' CBM'); } }
        (F.ctr || []).forEach(function (no, i) { if (i && !S.bl.ctrs[i]) S.bl.ctrs.push(bCtr()); if (S.bl.ctrs[i] && !S.bl.ctrs[i].no) S.bl.ctrs[i].no = no; });
      } else {
        put('dep', F.pol, 'departure'); put('dest', F.pod, 'destination');
        var gd = [hs ? 'HSN: ' + hs : '', F.inv ? 'INVOICE NO: ' + F.inv : ''].filter(Boolean).join('\n'); if (gd) { f.goods = gd.toUpperCase(); got.push('HS codes and invoice no.'); }
        var l = S.awb.lines[0]; if (S.awb.lines.length === 1) { if (pk) { l.pcs = String(pk); got.push(fmt(pk, 0) + (pk === 1 ? ' piece' : ' pieces')); } if (gw) { l.gw = String(gw); got.push(fmt(gw) + ' kg gross'); } if (N.dims.length) { l.dims = N.dims.join('\n'); got.push('dimensions'); } }
      }
      save();
      try { sessionStorage.setItem('bd_msg', got.length ? 'Filled from your documents: ' + got.join(', ') + '. Please check every field, and add anything we missed.' : 'We opened the file but could not find the shipment details in it. Please type them in, or try the invoice and the packing list together.'); } catch (e) {}
      location.reload();
    }).catch(function () { msg.textContent = 'That file could not be read. Please try a PDF or a clear photo.'; });
  };
  try { var bm = sessionStorage.getItem('bd_msg'); if (bm) { el('bd-upmsg').innerHTML = '<b>' + h(bm) + '</b>'; sessionStorage.removeItem('bd_msg'); } } catch (e) {}

  // optional second step: the text of the documents just read goes to our AI reader, only when this button is pressed
  function wrap(t, n) { var out = [], line = ''; String(t || '').split(/\s+/).forEach(function (w) { if (line && (line + ' ' + w).length > n) { out.push(line); line = w; } else line = line ? line + ' ' + w : w; }); if (line) out.push(line); return out.join('\n'); }
  (function () {
    var st; try { st = JSON.parse(sessionStorage.getItem('bd_ai') || 'null'); } catch (e) {}
    if (!st || !st.docs || !st.docs.length || st.tab !== S.tab) return;
    fetch('/api/read-doc').then(function (r) { return r.json(); }).then(function (j) { if (j && j.on) show(); }).catch(function () {});
    function show() {
    el('bd-priv').textContent = 'Files are read on this phone. Nothing is uploaded unless you choose the AI reading below.';
    var box = D.createElement('div'); box.style.cssText = 'margin-top:12px;padding-top:12px;border-top:1px dashed #E6C46A';
    box.innerHTML = '<button type="button" class="bd-b bd-q" id="bd-ai">✨ Names or addresses missing? Read them with AI</button><div class="bd-s" id="bd-aimsg" style="margin:8px 0 0" aria-live="polite">This sends the text of the documents you just chose (not the files) to our AI reader, to find the shipper, consignee, ports and goods. Nothing is stored.</div>';
    el('bd-upmsg').parentNode.appendChild(box);
    el('bd-ai').onclick = function () {
      var b = this, m = el('bd-aimsg'); b.disabled = true; m.textContent = 'Reading with AI… this takes about 10 seconds.';
      (window.DocAI ? Promise.resolve() : ld('doc-ai.js?v=1')).then(function () { return window.DocAI.read(st.docs, st.tab); }).then(function (x) {
        var g = S.tab, f = S[g].f, got = [];
        function put(k, v, label) { if (v == null || v === '') return; f[k] = String(v).toUpperCase(); got.push(label); }
        put('shp', x.shipper_name && [x.shipper_name, wrap(x.shipper_address, 46)].filter(Boolean).join('\n'), 'shipper');
        put('cons', x.consignee_name && [x.consignee_name, wrap(x.consignee_address, 46)].filter(Boolean).join('\n'), 'consignee');
        var inv = [x.invoice_no, x.invoice_date ? 'DT ' + x.invoice_date : ''].filter(Boolean).join(' ');
        if (g === 'bl') {
          put('notify', wrap(x.notify_party, 46), 'notify party'); put('pol', x.port_of_loading, 'port of loading'); put('pod', x.port_of_discharge, 'port of discharge'); put('fdest', x.final_destination, 'final destination');
          put('desc', x.goods_description, 'goods'); put('hs', x.hs_codes, 'HS codes'); put('inv', x.invoice_no && inv, 'invoice no.');
        } else {
          put('dep', x.port_of_loading, 'departure'); put('dest', x.port_of_discharge, 'destination');
          put('goods', [x.goods_description, x.hs_codes ? 'HSN: ' + x.hs_codes : '', x.invoice_no ? 'INVOICE NO: ' + inv : ''].filter(Boolean).join('\n'), 'goods, HS codes and invoice no.');
        }
        if (!got.length) { m.textContent = 'The AI reader could not find more details in these documents. Please type them in.'; b.disabled = false; return; }
        save();
        try { sessionStorage.removeItem('bd_ai'); sessionStorage.setItem('bd_msg', 'Filled by the AI reader: ' + got.join(', ').replace(/\.$/, '') + '. AI can make mistakes: please check every field against your documents.'); } catch (e) {}
        location.reload();
      }).catch(function (e) {
        var c = String((e && e.message) || '');
        m.textContent = c === 'slow-down' || c === 'busy' ? 'The AI reader has reached its limit for now. Please try again later, or type the details in.' : c === 'not-set-up' ? 'The AI reader is not switched on yet.' : 'The AI reader could not be reached. Please try again, or type the details in.';
        b.disabled = false;
      });
    };
    }
  })();

  // ---------- PDF
  var jsP; function jspdf() { if (!jsP) jsP = new Promise(function (ok, no) { var s = D.createElement('script'); s.src = 'vendor/jspdf.umd.min.js'; s.onload = function () { ok(window.jspdf); }; s.onerror = no; D.head.appendChild(s); }); return jsP; }
  function mark(doc, W, H) {
    doc.saveGraphicsState && doc.saveGraphicsState();
    if (doc.GState) doc.setGState(new doc.GState({ opacity: 0.09 }));
    doc.setTextColor(200, 30, 30); doc.setFont('helvetica', 'bold'); doc.setFontSize(110);
    doc.text('DRAFT', W / 2, H / 2 + 40, { align: 'center', angle: 35 });
    doc.restoreGraphicsState && doc.restoreGraphicsState();
    if (doc.GState) doc.setGState(new doc.GState({ opacity: 1 }));
    doc.setTextColor(11, 42, 74);
  }
  function box(doc, x, y, w, hgt, label, text, o) {
    o = o || {}; doc.setDrawColor(150, 170, 190); doc.setLineWidth(0.6); doc.rect(x, y, w, hgt);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(94, 120, 145); doc.text(label, x + 4, y + 8);
    if (text) { doc.setFont('courier', o.b ? 'bold' : 'bold'); doc.setFontSize(o.s || 8.6); doc.setTextColor(11, 42, 74); var l = doc.splitTextToSize(String(text).toUpperCase(), w - 8); doc.text(l.slice(0, o.max || 8), x + 4, y + 18); }
  }
  // logos for the branded strip, drawn from the site's SVGs into PNGs once
  var LG = {}, lgP;
  function logos() {
    if (!lgP) lgP = Promise.all([['ck', 'cargokit-logo.svg']].map(function (x) {
      return new Promise(function (ok) {
        var im = new Image(); im.onload = function () { try { var c = D.createElement('canvas'), s = 4; c.width = (im.naturalWidth || 300) * s; c.height = (im.naturalHeight || 100) * s; var g = c.getContext('2d'); g.drawImage(im, 0, 0, c.width, c.height); LG[x[0]] = { d: c.toDataURL('image/png'), r: c.height / c.width }; } catch (e) {} ok(); };
        im.onerror = function () { ok(); }; im.src = x[1];
      });
    }));
    return lgP;
  }
  function foot(doc, W, H, what) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(185, 28, 28);
    doc.text('DRAFT FOR CHECKING ONLY · NOT ' + what + ' · NOT NEGOTIABLE', W / 2, H - 72, { align: 'center' }); doc.text('NO CARGO CAN BE SHIPPED, CLAIMED OR RELEASED ON THIS DRAFT', W / 2, H - 62, { align: 'center' });
    var y0 = H - 52, M = 26;
    doc.setFillColor(242, 248, 253); doc.rect(0, y0, W, 52, 'F'); doc.setDrawColor(10, 108, 194); doc.setLineWidth(1.2); doc.line(0, y0, W, y0);
    var lh = 24, x = M;
    if (LG.ck) { var w = lh / LG.ck.r; doc.addImage(LG.ck.d, 'PNG', x, y0 + 12, w, lh, undefined, 'FAST'); x += w + 8; }
    doc.setTextColor(11, 42, 74); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('Made free with CargoKit', x, y0 + 21);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(61, 88, 115); doc.text('B/L and AWB draft maker', x, y0 + 31); doc.setTextColor(10, 108, 194); doc.text('www.CargoKit.ai', x, y0 + 40); doc.link(M, y0 + 4, x - M + 170, 44, { url: 'https://www.cargokit.ai/' });
    var xr = W - M;
    doc.setTextColor(11, 42, 74); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('Free tools for shippers and forwarders', xr, y0 + 21, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(61, 88, 115); doc.text('3D container load planner · HSN finder · duty calculator · DG checks', xr, y0 + 31, { align: 'right' });
    doc.setTextColor(10, 108, 194); doc.text('Free on the web and on Android: www.CargoKit.ai', xr, y0 + 40, { align: 'right' }); doc.link(W / 2, y0 + 4, W / 2 - M, 44, { url: 'https://www.cargokit.ai/' });
    doc.setTextColor(140, 160, 180); doc.setFontSize(6); doc.text('Made ' + new Date().toLocaleString('en-GB') + '. Only the carrier, NVOCC or airline issues the real document.', W / 2, H - 4, { align: 'center' });
  }
  function blPdf(lib) {
    var doc = new lib.jsPDF({ unit: 'pt', format: 'a4' }), W = 595, H = 842, M = 26, b = S.bl.f, s = blSum(), cw = W - 2 * M, x2 = M + cw * 0.55;
    mark(doc, W, H);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(11, 42, 74); doc.text('BILL OF LADING · DRAFT FOR CHECKING', M, M + 12);
    var y = M + 22;
    box(doc, M, y, cw * 0.55, 74, 'Shipper', b.shp, { max: 6 }); box(doc, x2, y, cw * 0.45, 30, 'B/L no.', b.blNo || 'TO BE ISSUED BY THE CARRIER', { s: 10 }); box(doc, x2, y + 30, cw * 0.45, 22, 'Booking no.', b.bkNo); box(doc, x2, y + 52, cw * 0.45, 22, 'Carrier / NVOCC (reference only)', b.carrier);
    y += 74; box(doc, M, y, cw * 0.55, 74, 'Consignee', b.cons, { max: 6 }); box(doc, x2, y, cw * 0.45, 74, 'Export references', [b.inv && 'INV: ' + b.inv, b.sb && 'S/BILL: ' + b.sb, b.iec && 'IEC: ' + b.iec].filter(Boolean).join('\n'));
    y += 74; box(doc, M, y, cw * 0.55, 62, 'Notify party', b.notify, { max: 5 }); box(doc, x2, y, cw * 0.45, 62, 'Service', b.service);
    y += 62; var q = cw / 4;
    box(doc, M, y, q, 28, 'Pre-carriage by', b.preCarr); box(doc, M + q, y, q, 28, 'Place of receipt', b.por); box(doc, M + 2 * q, y, q, 28, 'Ocean vessel / voyage', [b.vessel, b.voy].filter(Boolean).join(' ')); box(doc, M + 3 * q, y, q, 28, 'Port of loading', b.pol);
    y += 28; box(doc, M, y, q, 28, 'Port of discharge', b.pod); box(doc, M + q, y, q, 28, 'Place of delivery', b.pdel); box(doc, M + 2 * q, y, q * 2, 28, 'Final destination (merchant reference only)', b.fdest);
    y += 28;
    // goods table
    var cx = [M, M + cw * 0.27, M + cw * 0.39, M + cw * 0.77, M + cw * 0.89, M + cw], th = 330;
    doc.setDrawColor(150, 170, 190); doc.rect(M, y, cw, th); for (var i = 1; i < 5; i++) doc.line(cx[i], y, cx[i], y + th);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(94, 120, 145);
    ['Container no. / seal no.\nMarks and numbers', 'No. of containers\nor packages', 'Kind of packages; description of goods', 'Gross weight', 'Measurement'].forEach(function (t, i) { doc.text(t.split('\n'), cx[i] + 4, y + 8); });
    doc.line(M, y + 22, M + cw, y + 22);
    doc.setFont('courier', 'bold'); doc.setFontSize(8.2); doc.setTextColor(11, 42, 74);
    var ly = y + 34, cl = [];
    S.bl.ctrs.forEach(function (c) { if (c.no) cl.push(c.type + ' ' + c.no.toUpperCase().replace(/\s/g, '') + (c.seal ? ' / ' + c.seal.toUpperCase() : '')); });
    if (b.marks) cl.push('', 'MARKS: ' + b.marks.toUpperCase());
    doc.text(doc.splitTextToSize(cl.join('\n'), cx[1] - cx[0] - 8).slice(0, 34), cx[0] + 4, ly);
    var tc = Object.keys(s.types).filter(function (k) { return k !== 'LCL'; });
    doc.text([s.pk ? fmt(s.pk, 0) + ' ' + (b.pkgKind || 'PKGS').toUpperCase() : '', tc.map(function (k) { return k + ' X' + s.types[k]; }).join(', ')].filter(Boolean), cx[1] + 4, ly);
    doc.text(doc.splitTextToSize(stcText().join('\n'), cx[3] - cx[2] - 8).slice(0, 34), cx[2] + 4, ly);
    doc.text(s.gw ? fmt(s.gw, 3) + ' KGS' : '', cx[4] - 4, ly, { align: 'right' }); doc.text(s.cb ? fmt(s.cb, 3) + ' CBM' : '', cx[5] - 4, ly, { align: 'right' });
    y += th;
    box(doc, M, y, cw * 0.75, 24, 'Total number of containers or packages (in words)', sayText()); box(doc, M + cw * 0.75, y, cw * 0.25, 24, 'Freight', b.frt);
    y += 24; var t3 = cw / 3;
    box(doc, M, y, t3, 28, 'Freight payable at', b.payAt); box(doc, M + t3, y, t3, 28, 'Number of original B/Ls', b.orig); box(doc, M + 2 * t3, y, t3, 28, 'Place and date of issue', [b.issuePlace, dmy(b.issueDate)].filter(Boolean).join('  '));
    y += 28; box(doc, M, y, t3, 28, 'Shipped on board date', dmy(b.onboard)); box(doc, M + t3, y, t3 * 2, 28, 'Signed for the carrier', 'TO BE SIGNED BY THE CARRIER ON THE ISSUED B/L');
    foot(doc, W, H, 'A BILL OF LADING');
    return doc;
  }
  function awbPdf(lib) {
    var doc = new lib.jsPDF({ unit: 'pt', format: 'a4' }), W = 595, H = 842, M = 26, a = S.awb.f, s = awbSum(), cw = W - 2 * M, half = cw / 2;
    var no = a.awbNo ? (a.awbPfx || '___') + '-' + String(a.awbNo).replace(/\D/g, '').replace(/^(\d{4})(\d{4})$/, '$1 $2') : 'AWB NO. TO BE ALLOCATED';
    mark(doc, W, H);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(a.awbNo ? 14 : 9); doc.setTextColor(11, 42, 74); doc.text(no, M, M + 12); doc.text(no, W - M, M + 12, { align: 'right' });
    doc.setFontSize(9); doc.text("AIR WAYBILL DRAFT · SHIPPER'S DETAILS · FOR CHECKING", W / 2, M + 12, { align: 'center' });
    var y = M + 20;
    box(doc, M, y, half, 64, "Shipper's name and address", a.shp, { max: 5 }); box(doc, M + half, y, half, 30, 'Airline (reference only)', a.carrier); box(doc, M + half, y + 30, half, 34, "Shipper's account no.", a.shpAcc);
    y += 64; box(doc, M, y, half, 64, "Consignee's name and address", a.cons, { max: 5 }); box(doc, M + half, y, half, 64, "Consignee's account no.", a.consAcc);
    y += 64; box(doc, M, y, half, 40, 'Forwarder or agent, name and city', a.agent, { max: 3 }); box(doc, M + half, y, half, 40, 'Accounting information', 'FREIGHT ' + (a.frt || 'PREPAID'));
    y += 40; box(doc, M, y, half, 24, 'Airport of departure and requested routing', a.dep); var t3 = half / 3;
    box(doc, M + half, y, t3, 24, 'Decl. value for carriage', a.dvc, { s: 7.8 }); box(doc, M + half + t3, y, t3, 24, 'Decl. value for customs', a.dvcu, { s: 7.8 }); box(doc, M + half + 2 * t3, y, t3, 24, 'Amount of insurance', a.ins, { s: 7.8 });
    y += 24; var r = half / 6;
    [['To', a.to1], ['By first carrier', a.by1], ['To', a.to2], ['By', a.by2], ['To', a.to3], ['By', a.by3]].forEach(function (p, i) { box(doc, M + i * r, y, r, 24, p[0], p[1]); });
    box(doc, M + half, y, half / 2, 24, 'Airport of destination', a.dest); box(doc, M + half * 1.5, y, half / 2, 24, 'Requested flight / date', [a.flight, dmy(a.fdate)].filter(Boolean).join('  '));
    y += 24; box(doc, M, y, cw - 70, 40, 'Handling information', a.handling, { max: 3 }); box(doc, M + cw - 70, y, 70, 40, 'SCI', a.sci);
    y += 40;
    var cx = [M, M + 44, M + 112, M + 128, M + 196, M + 264, M + cw], th = 236;
    doc.setDrawColor(150, 170, 190); doc.rect(M, y, cw, th); for (var i = 1; i < cx.length - 1; i++) doc.line(cx[i], y, cx[i], y + th);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.2); doc.setTextColor(94, 120, 145);
    ['No. of\npieces', 'Gross\nweight', 'kg', 'Volume\nweight', 'Chargeable\nweight', 'Nature and quantity of goods (incl. dimensions or volume)'].forEach(function (tx, i) { doc.text(tx.split('\n'), cx[i] + 3, y + 8); });
    doc.line(M, y + 22, M + cw, y + 22);
    doc.setFont('courier', 'bold'); doc.setFontSize(8); doc.setTextColor(11, 42, 74);
    var ly = y + 34;
    s.rows.forEach(function (rw) {
      var l = rw.l; if (!l.pcs && !l.gw) return;
      doc.text(String(l.pcs || ''), cx[1] - 3, ly, { align: 'right' }); doc.text(l.gw ? fmt(num(l.gw)) : '', cx[2] - 3, ly, { align: 'right' }); doc.text('K', cx[2] + 4, ly);
      doc.text(rw.vw ? fmt(rw.vw) : '', cx[4] - 3, ly, { align: 'right' }); doc.text(fmt(rw.c), cx[5] - 3, ly, { align: 'right' });
      ly += 14;
    });
    var gl = [a.goods || ''], dl = []; S.awb.lines.forEach(function (l) { if (l.dims) dl.push(l.dims.toUpperCase()); });
    if (dl.length) gl.push('DIMS IN CMS:', dl.join('\n')); if (s.vol) gl.push('VOLUME: ' + fmt(s.vol, 3) + ' M3');
    doc.setFontSize(7.8); doc.text(doc.splitTextToSize(gl.join('\n').toUpperCase(), cx[6] - cx[5] - 6).slice(0, 26), cx[5] + 3, y + 34);
    doc.setFontSize(8); doc.line(M, y + th - 18, cx[5], y + th - 18);
    doc.text(fmt(s.pcs, 0), cx[1] - 3, y + th - 6, { align: 'right' }); doc.text(fmt(s.gw), cx[2] - 3, y + th - 6, { align: 'right' }); doc.text(s.vw ? fmt(s.vw) : '', cx[4] - 3, y + th - 6, { align: 'right' }); doc.text(fmt(s.ch), cx[5] - 3, y + th - 6, { align: 'right' });
    y += th;
    box(doc, M, y, cw, 26, '24-hour emergency contact', a.emerg, { s: 9 });
    y += 26; box(doc, M, y, cw, 64, 'Special comments', a.remarks, { max: 5 });
    y += 64;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(61, 88, 115);
    doc.text(doc.splitTextToSize('Shipper to confirm that the particulars above are correct and, where the consignment contains dangerous goods, that they are properly described and in proper condition for carriage by air under the applicable regulations. Rates and charges are entered by the airline or its agent. The airline\'s issued air waybill and its conditions of contract govern.', half - 8), M + 4, y + 12);
    box(doc, M + half, y, half, 40, 'Executed on (date) · at (place) · by', [dmy(a.execDate), a.execPlace, a.execBy].filter(Boolean).join('  ·  '));
    foot(doc, W, H, 'AN AIR WAYBILL');
    return doc;
  }
  function makePdf() {
    return Promise.all([jspdf(), logos()]).then(function (r) { var lib = r[0]; return S.tab === 'bl' ? blPdf(lib) : awbPdf(lib); });
  }
  function fname() {
    if (S.tab === 'bl') return 'CargoKit-BL-draft-' + ((S.bl.f.blNo || S.bl.f.bkNo || 'draft').replace(/[^\w-]/g, '')) + '.pdf';
    return 'CargoKit-AWB-draft-' + ((S.awb.f.awbPfx || '') + (S.awb.f.awbNo || 'draft')).replace(/[^\w-]/g, '') + '.pdf';
  }
  function missing() {
    var m = [];
    if (S.tab === 'bl') { var b = S.bl.f, s = blSum();
      [['shp', 'shipper'], ['cons', 'consignee'], ['pol', 'port of loading'], ['pod', 'port of discharge'], ['desc', 'description of goods']].forEach(function (x) { if (!(b[x[0]] || '').trim()) m.push(x[1]); });
      if (!s.pk) m.push('number of packages'); if (!s.gw) m.push('gross weight');
    } else { var a = S.awb.f, w = awbSum();
      [['shp', 'shipper'], ['cons', 'consignee'], ['dep', 'airport of departure'], ['dest', 'airport of destination']].forEach(function (x) { if (!(a[x[0]] || '').trim()) m.push(x[1]); });
      if (!w.pcs) m.push('number of pieces'); if (!w.gw) m.push('gross weight');
    }
    return !m.length || confirm('Still empty: ' + m.join(', ') + '.\n\nMake the draft anyway?');
  }
  el('bd-pdf').onclick = function () { if (!missing()) return; makePdf().then(function (doc) { doc.save(fname()); }).catch(function () { alert('The PDF could not be made. Please check your connection once and try again.'); }); };
  el('bd-wa').onclick = function () {
    if (!missing()) return;
    makePdf().then(function (doc) {
      var blob = doc.output('blob'), file = null; try { file = new File([blob], fname(), { type: 'application/pdf' }); } catch (e) {}
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: fname(), text: 'Draft made free with CargoKit · www.CargoKit.ai' }).catch(function () {}); }
      else { doc.save(fname()); }
    });
  };

  root.querySelectorAll('.bd-more').forEach(function (d) { var g = d.querySelectorAll('input:not([type=date]),textarea'), n = 0; g.forEach(function (x) { if (x.value && !/^(NVD|NCV|NIL|CY\/CY)$/.test(x.value)) n++; }); if (n) d.open = true; });
  ctrsUI(); linesUI(); tab(S.tab === 'awb' ? 'awb' : 'bl'); refresh();
  try { if (/[?&#]awb\b/.test(location.search + location.hash)) tab('awb'); else if (/[?&#]bl\b/.test(location.search + location.hash)) tab('bl'); } catch (e) {}
})();
