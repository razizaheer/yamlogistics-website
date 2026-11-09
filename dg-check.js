/* YAM Logistics — DG cargo checker: HSN code, product name, UN number or MSDS -> guidance on general cargo vs dangerous goods.
   Guidance only, written by YAM. UN reference data: US DOT Hazardous Materials Table (49 CFR 172.101, public domain). */
(function () {
  'use strict';
  var root = document.getElementById('dg-root'); if (!root) return;
  var TB = (function () { var sc = document.currentScript || [].slice.call(document.scripts).filter(function (x) { return /dg-check\.js/.test(x.src); })[0]; return sc ? sc.src.replace(/[^\/]*$/, '') : ''; })();
  var API = /(^|\.)yamlogistics\.(pages\.dev|com)$/.test(location.hostname) ? '/' : 'https://yamlogistics.pages.dev/';
  var WA = 'https://wa.me/message/6YB7I76DV6UJL1';

  var css = '.dg-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:28px}.dg-row{display:flex;flex-wrap:wrap;gap:10px}.dg-in{flex:1 1 320px;min-width:0;box-sizing:border-box;font:inherit;font-size:18px;padding:14px 16px;border:2px solid #CFE3F5;border-radius:14px;outline:none}.dg-in:focus{border-color:#0A6CC2}.dg-btn{border:0;border-radius:999px;padding:14px 24px;font:inherit;font-weight:600;font-size:15px;cursor:pointer;background:#0A6CC2;color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:8px}.dg-btn.y{background:#FFC93C;color:#0B2A4A}.dg-btn.g{background:#0F7B3F}.dg-btn.o{background:#fff;color:#0A6CC2;border:2px solid #CFE3F5}.dg-btn:disabled{opacity:.5;cursor:not-allowed}.dg-ex{margin-top:12px;font-size:13.5px;color:#5E7891}.dg-ex a{color:#0A6CC2;cursor:pointer;text-decoration:underline;margin:0 4px}.dg-disc{background:#FFF8E6;border:1px solid #F5D98B;border-radius:16px;padding:16px 18px;font-size:13.5px;line-height:1.6;color:#4A4030;margin-top:18px}.dg-disc b{color:#7A4B00}.dg-res{margin-top:22px}.dg-top{border-radius:20px;padding:22px 24px;color:#fff}.dg-top .k{font-family:"Geist Mono",monospace;font-size:12px;letter-spacing:.1em;opacity:.85}.dg-top h3{font-family:Archivo,sans-serif;font-weight:900;font-size:30px;margin:6px 0 6px;line-height:1.1}.dg-top p{margin:0;font-size:15.5px;line-height:1.55;opacity:.95}.dg-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-top:14px}.dg-box{background:#F7FBFF;border-radius:16px;padding:18px 20px}.dg-box h4{margin:0 0 10px;font-size:15px}.dg-box p{margin:0;font-size:14.5px;line-height:1.6;color:#17436B}.dg-box ul{margin:0;padding-left:18px;font-size:14.5px;line-height:1.6;color:#17436B}.dg-tbl{width:100%;border-collapse:collapse;font-size:14px}.dg-tbl th{text-align:left;font-weight:600;color:#5E7891;font-size:12px;letter-spacing:.04em;padding:6px 8px;border-bottom:1px solid #E1EDF7}.dg-tbl td{padding:8px;border-bottom:1px solid #EEF4FA;vertical-align:top;color:#0B2A4A}.dg-tw{overflow-x:auto}.dg-un{font-family:"Geist Mono",monospace;font-weight:600;white-space:nowrap}.dg-pill{display:inline-block;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:600;white-space:nowrap}.dg-labs{display:flex;flex-wrap:wrap;gap:12px}.dg-labs a{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;color:#3D5873;text-decoration:none;width:104px;text-align:center}.dg-labs img{width:84px;height:84px;object-fit:contain;background:#fff;border:1px solid #E1EDF7;border-radius:10px;padding:4px}.dg-more{margin-top:14px;font-size:14px;color:#3D5873}.dg-more a{display:inline-block;margin:4px 6px 0 0;padding:6px 12px;border-radius:999px;background:#EEF5FC;color:#0A6CC2;text-decoration:none;cursor:pointer}.dg-acts{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:18px}.dg-chk{display:flex;gap:8px;align-items:flex-start;font-size:13.5px;color:#3D5873;line-height:1.5}.dg-chk input{margin-top:3px}.dg-up{margin-top:22px;border:2px dashed #CFE3F5;border-radius:20px;padding:24px;background:#F7FBFF}.dg-up h3{font-family:Archivo,sans-serif;font-weight:900;font-size:24px;margin:0 0 6px}.dg-up p{margin:0 0 14px;font-size:14.5px;color:#3D5873;line-height:1.6}.dg-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:14px 0}.dg-f input{font:inherit;font-size:15px;padding:10px 12px;border:1px solid #CFE3F5;border-radius:10px;min-width:0}.dg-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}.dg-msg{margin-top:12px;font-size:14px;line-height:1.55}.dg-ok{color:#0F7B3F}.dg-bad{color:#B42318}.dg-note{font-size:13px;color:#5E7891;margin-top:10px;line-height:1.55}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(id) { return document.getElementById(id); }

  var RISK = {
    dg: { t: 'Usually dangerous goods', c: '#B42318', s: 'Treat this as DG unless the MSDS clearly says it is not regulated for transport.' },
    often: { t: 'Often dangerous goods', c: '#C2410C', s: 'Many products in this group are DG. The MSDS (Section 14) decides.' },
    dep: { t: 'Depends on what exactly it is', c: '#B45309', s: 'Some versions are DG and some are not. Check the MSDS, or ask us.' },
    gen: { t: 'Usually general cargo', c: '#0F7B3F', s: 'Normally not dangerous goods. See any special handling notes below.' },
    unk: { t: 'Not sure yet', c: '#4A6A88', s: 'Try another name or the HSN code, or send us the MSDS.' }
  };
  var FLAG = {
    msds: ['MSDS needed', 'Shipping lines, airlines and CFSs will ask for the Safety Data Sheet (MSDS). Section 14 must show the transport classification.'],
    nonhaz: ['Non-haz declaration', 'If the MSDS says "not regulated", most lines still want a non-hazardous cargo declaration on your letterhead.'],
    refuse: ['Carrier restrictions', 'Some shipping lines or airlines refuse this cargo or accept it only with prior approval. Check before booking.'],
    li: ['Lithium batteries', 'If there are lithium batteries in or with the goods, lithium battery rules apply (UN3480 / UN3481 / UN3090 / UN3091), including a UN 38.3 test summary.'],
    dryice: ['Dry ice', 'Packing with dry ice (UN1845) makes an air shipment DG. Net dry-ice weight must be declared.'],
    magnet: ['Magnetised material (air)', 'Strong magnets can be UN2807 by air if the field exceeds the limit. Needs a gauss test. Not regulated by sea.'],
    perish: ['Perishable', 'Temperature control: reefer container by sea, cool chain by air.'],
    live: ['Live animals', 'Airline approval, approved containers and veterinary certificates are needed.'],
    val: ['Valuable cargo', 'Special handling, secure storage and full insurance recommended.'],
    odc: ['Out of gauge / heavy', 'Large or heavy units may need flat racks, open tops or breakbulk.'],
    fuel: ['Fuel or engine', 'Engines, vehicles and machinery with fuel or batteries are DG unless drained and certified.'],
    gas: ['Gas under pressure', 'Filled cylinders and units with refrigerant or gas cartridges may be Class 2.'],
    test: ['Test report needed', 'A UN N.4 self-heating test report from a lab can allow shipping as non-DG.'],
    licence: ['Licence or permit', 'Needs a government licence or permit (e.g. PESO, AERB, arms, hazardous waste) before export.'],
    mp: ['Marine pollutant', 'May be environmentally hazardous by sea (UN3077 / UN3082, Class 9) even if not otherwise DG.'],
    pharma: ['Temperature-controlled', 'Pharma cool chain (2–8°C or 15–25°C); time-and-temperature labels may apply.'],
    radiation: ['Radiation check', 'Metal scrap imports into India need pre-shipment inspection and a radiation check.'],
    fumig: ['Fumigation / wood', 'Fumigation certificate or ISPM-15 treated wood packaging may be required.'],
    airforbid: ['Often forbidden by air', 'Most airlines will not carry this as air cargo, or only with special approval.']
  };
  var LBL = { '1': 'class-1-explosive', '1.4': 'class-1-4', '2.1': 'class-2-1', '2.2': 'class-2-2', '2.3': 'class-2-3', '3': 'class-3', '4.1': 'class-4-1', '4.2': 'class-4-2', '4.3': 'class-4-3', '5.1': 'class-5-1', '5.2': 'class-5-2', '6.1': 'class-6-1', '6.2': 'class-6-2', '7': 'class-7-ii', '8': 'class-8', '9': 'class-9' };
  var CLN = { '1': 'Explosives', '2.1': 'Flammable gas', '2.2': 'Non-flammable gas', '2.3': 'Toxic gas', '3': 'Flammable liquid', '4.1': 'Flammable solid', '4.2': 'Spontaneously combustible', '4.3': 'Dangerous when wet', '5.1': 'Oxidiser', '5.2': 'Organic peroxide', '6.1': 'Toxic', '6.2': 'Infectious', '7': 'Radioactive', '8': 'Corrosive', '9': 'Miscellaneous' };
  var EX = ['3303', 'perfume', 'power bank', 'charcoal', 'castor meal', '2710', 'hand sanitiser', 'UN1263', 'spirits', 'ferrosilicon'];

  var G = null, UN = null, UNI = {}, last = null;
  function load() {
    if (!G) G = Promise.all([fetch(TB + 'dg-guide.json?v=1').then(function (r) { return r.json(); }), fetch(TB + 'un-data.json?v=1').then(function (r) { return r.json(); })]).then(function (a) {
      var g = a[0], rows = a[1].r.concat(g.S); UN = rows;
      rows.forEach(function (r) { (UNI[r[0]] = UNI[r[0]] || []).push(r); });
      g.PK = g.P.map(function (p) { return p[0].map(function (k) { return k.toLowerCase(); }); });
      return g;
    });
    return G;
  }

  // ---------- UI ----------
  root.innerHTML = '<div class="dg-card">' +
    '<label for="dg-q" style="display:block;font-weight:600;font-size:15px;margin-bottom:10px">HSN code, product name or UN number</label>' +
    '<div class="dg-row"><input id="dg-q" class="dg-in" autocomplete="off" placeholder="e.g. 330300, perfume, power bank, UN1263"><button id="dg-go" class="dg-btn">Check cargo →</button></div>' +
    '<div class="dg-ex">Try:' + EX.map(function (e) { return '<a data-q="' + h(e) + '">' + h(e) + '</a>'; }).join('') + '</div>' +
    '<div class="dg-disc"><b>Important: guidance only.</b> This tool reflects YAM Logistics’ own knowledge and experience and is provided free for general guidance. It is not the IATA Dangerous Goods Regulations, the IMDG Code or any official classification, and is not endorsed by IATA, IMO, ICAO or any carrier. Classification of dangerous goods is the legal responsibility of the shipper and must be based on the product’s current Safety Data Sheet (MSDS, Section 14) and the applicable regulations. Airlines, shipping lines, ports and authorities may apply stricter rules. YAM Logistics accepts no liability for any loss, delay, penalty or damage arising from use of this tool. Always confirm with a certified dangerous goods professional before booking.</div>' +
    '<div id="dg-res" class="dg-res"></div>' +
    '<div class="dg-up" id="dg-up"><h3>Have the MSDS? Upload it.</h3><p>We read Section 14 (transport information) of a text PDF right here in your browser and show what it says. Send it to our DG desk too, and a YAM specialist will review it for your shipment.</p>' +
    '<div class="dg-row"><input type="file" id="dg-file" accept=".pdf,application/pdf,image/png,image/jpeg" style="font:inherit;font-size:14px;flex:1 1 260px;min-width:0"></div>' +
    '<div id="dg-read" class="dg-msg"></div>' +
    '<div id="dg-send" style="display:none"><div class="dg-f"><input id="dg-n" placeholder="Your name *" autocomplete="name"><input id="dg-c" placeholder="Company" autocomplete="organization"><input id="dg-e" type="email" placeholder="Email *" autocomplete="email"><input id="dg-p" placeholder="Phone (optional)" autocomplete="tel"><input id="dg-h" placeholder="HSN code (optional)"><input id="dg-w" class="dg-hp" tabindex="-1" autocomplete="off" aria-hidden="true"></div>' +
    '<label class="dg-chk"><input type="checkbox" id="dg-cons"><span>I agree that YAM Logistics may keep this MSDS and my contact details to assist with my shipment and to improve this tool, as described in the privacy note below. I understand the result is guidance only.</span></label>' +
    '<div class="dg-acts"><button class="dg-btn g" id="dg-sub" disabled>Send MSDS to YAM DG desk</button></div>' +
    '<div class="dg-note">Privacy: your MSDS and details are stored securely by YAM Logistics, used only to answer your enquiry and to build our internal cargo knowledge base, and never sold or shared outside YAM. To have them deleted, message us on WhatsApp.</div><div id="dg-sm" class="dg-msg"></div></div></div>' +
    '</div>';

  var q = $('dg-q'), res = $('dg-res');
  $('dg-go').onclick = run; q.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
  root.querySelectorAll('.dg-ex a').forEach(function (a) { a.onclick = function () { q.value = a.getAttribute('data-q'); run(); }; });

  function run() {
    var v = q.value.trim(); if (!v) { q.focus(); return; }
    res.innerHTML = '<div class="dg-box">Checking…</div>';
    load().then(function (g) { render(lookup(g, v), v); }).catch(function () { res.innerHTML = '<div class="dg-box dg-bad">Sorry, the checker could not load. Please refresh the page.</div>'; });
    try { history.replaceState(null, '', location.pathname + '?q=' + encodeURIComponent(v)); } catch (e) { }
  }

  // ---------- lookup ----------
  function words(s) { return s.toLowerCase().replace(/[^a-z0-9%+.-]+/g, ' ').trim(); }
  function hasPhrase(hay, k) { return (' ' + hay + ' ').indexOf(' ' + k + ' ') >= 0; }
  function lookup(g, v) {
    var m = v.match(/^\s*u\.?\s*n\.?\s*-?\s*(\d{4})\s*$/i);
    if (m) return unResult(g, m[1]);
    var d = v.replace(/[\s.]/g, '');
    if (/^\d{2,8}$/.test(d)) return hsnResult(g, d);
    var w = words(v), best = [], i, j;
    g.P.forEach(function (p, i) {
      var sc = 0; g.PK[i].forEach(function (k) {
        if (w === k) sc = Math.max(sc, 100);
        else if (hasPhrase(w, k)) sc = Math.max(sc, 60 + k.length);
        else if (k.length > 3 && w.length > 3 && hasPhrase(k, w)) sc = Math.max(sc, 40 + w.length);
      });
      if (sc) best.push([sc, i]);
    });
    best.sort(function (a, b) { return b[0] - a[0]; });
    var uns = unSearch(w);
    if (best.length) {
      var p = g.P[best[0][1]];
      return { kind: 'product', title: p[1], risk: p[2], uns: p[3], flags: p[4], note: p[5], hsn: p[6], more: best.slice(1, 7).map(function (b) { return g.P[b[1]][1]; }), unHits: uns.slice(0, 6) };
    }
    if (uns.length) return { kind: 'unsearch', title: 'Matches in the UN dangerous goods list', risk: 'dg', uns: uns.slice(0, 12).map(function (r) { return r[0]; }), flags: ['msds'], note: 'We did not find this product in our guide, but these UN entries match its name. If your product is one of them, it is dangerous goods. If not, check the MSDS.', more: [], unHits: [] };
    return { kind: 'none', title: 'Not in our guide yet', risk: 'unk', uns: [], flags: ['msds'], note: 'We do not have this product yet. Try its HSN code, a simpler name or the UN number from the MSDS, or upload the MSDS below and our DG desk will check it.', more: [], unHits: [] };
  }
  function unSearch(w) {
    if (w.length < 4) return [];
    var parts = w.split(' ').filter(function (x) { return x.length > 2; }); if (!parts.length) return [];
    var out = [], seen = {};
    UN.forEach(function (r) { var n = r[1].toLowerCase(); if (parts.every(function (p) { return n.indexOf(p) >= 0; }) && !seen[r[0]]) { seen[r[0]] = 1; out.push(r); } });
    return out;
  }
  function hsnResult(g, d) {
    var ch = d.slice(0, 2), hd = d.slice(0, 4), h6 = d.slice(0, 6), e = (d.length >= 6 && g.H[h6]) || (d.length >= 4 && g.H[hd]), lvl = e ? 'heading' : 'chapter';
    if (!e) e = g.C[ch];
    if (!e) return { kind: 'none', title: 'HSN ' + d + ' not recognised', risk: 'unk', uns: [], flags: ['msds'], note: 'Indian HSN chapters run from 01 to 97 (chapter 77 is unused). Please check the code with our HSN finder.', more: [], unHits: [], hsn: d };
    var r = { kind: 'hsn', hsn: d, lvl: lvl, title: e[1], risk: e[0], note: e[2], flags: e[3], uns: e[4], more: [], unHits: [] };
    if (lvl === 'chapter' && d.length >= 4) r.note += ' (Guidance is for the whole chapter ' + ch + '; we have no specific note for heading ' + hd + ' yet.)';
    if (d.length === 4 && UNI[d]) r.alsoUN = d;
    return r;
  }
  function unResult(g, n) {
    var rows = UNI[n];
    if (!rows) return { kind: 'none', title: 'UN' + n + ' not found', risk: 'unk', uns: [], flags: ['msds'], note: 'This UN number is not in our reference list. Please check it on the MSDS.', more: [], unHits: [] };
    var cls = rows[0][2], fl = ['msds'];
    if (/^(3480|3481|3090|3091)$/.test(n)) fl.push('li'); if (n === '1845') fl.push('dryice'); if (n === '2807') fl.push('magnet'); if (/^(3077|3082)$/.test(n)) fl.push('mp');
    return { kind: 'un', title: 'UN' + n + ' — ' + rows[0][1], risk: 'dg', uns: [n], flags: fl, note: 'UN' + n + ' is in the dangerous goods list: Class ' + cls + (CLN[cls] ? ' (' + CLN[cls] + ')' : '') + '. A DG booking, DG declaration, UN-approved packaging, marks and labels are needed. Small quantities may qualify for limited or excepted quantity rules.', more: [], unHits: [] };
  }

  function airOf(r) { var p = r[5], c = r[6]; if (!p && !c) return ['Check with airline', '#5E7891']; if (p === 'Forbidden' && c === 'Forbidden') return ['Forbidden by air', '#B42318']; if (p === 'Forbidden') return ['Cargo aircraft only', '#C2410C']; return ['Passenger and cargo aircraft (within limits)', '#0F7B3F']; }
  function verdicts(r) {
    var rows = []; r.uns.forEach(function (u) { (UNI[u] || []).slice(0, 2).forEach(function (x) { rows.push(x); }); });
    var air, sea, f = r.flags || [];
    if (r.risk === 'dg') {
      var anyPax = rows.some(function (x) { return x[5] && x[5] !== 'Forbidden'; }), anyCao = rows.some(function (x) { return x[6] && x[6] !== 'Forbidden'; });
      air = f.indexOf('airforbid') >= 0 ? 'Dangerous goods. Usually forbidden by air or accepted only with special approval.' : rows.length && !anyPax && !anyCao ? 'Dangerous goods. Forbidden by air for these entries.' : rows.length && !anyPax ? 'Dangerous goods. Likely cargo aircraft only (freighter).' : 'Dangerous goods. Needs airline DG acceptance, a Shipper’s Declaration for Dangerous Goods, UN-approved packaging and labels.';
      sea = 'Dangerous goods under the IMDG Code. Needs a DG booking approved by the line, a DG declaration, labels on the packages and placards on the container.';
    } else if (r.risk === 'gen') {
      air = f.indexOf('magnet') >= 0 ? 'Usually general cargo, but strong magnets need a gauss test (UN2807 by air).' : f.indexOf('dryice') >= 0 ? 'General cargo, unless packed with dry ice (then UN1845 applies).' : f.indexOf('li') >= 0 ? 'General cargo, unless it contains lithium batteries.' : 'Usually general cargo.';
      sea = f.indexOf('mp') >= 0 ? 'Usually general cargo, but check whether it is a marine pollutant.' : 'Usually general cargo.';
    } else if (r.risk === 'unk') {
      air = 'Not known yet. The MSDS Section 14 decides.'; sea = air;
    } else {
      air = 'Could be DG. The MSDS Section 14 decides. If it shows a UN number, the airline needs a DG booking.';
      sea = 'Could be DG. The MSDS Section 14 decides. If "not regulated", most lines still ask for a non-haz declaration.';
    }
    return { air: air, sea: sea, rows: rows };
  }
  function docs(r) {
    var d = [], f = r.flags || [];
    if (r.risk === 'dg') d.push('MSDS (Safety Data Sheet), current version', 'Shipper’s Declaration for Dangerous Goods (air) / DG declaration (sea)', 'UN-specification packaging, marks and hazard labels', '24-hour emergency contact on the declaration');
    else if (r.risk === 'gen') d.push('Commercial invoice and packing list');
    else if (r.risk === 'unk') d.push('MSDS (Safety Data Sheet) with Section 14 transport information');
    else d.push('MSDS (Safety Data Sheet) with Section 14 transport information', 'Non-hazardous declaration on letterhead, if the MSDS says not regulated');
    if (f.indexOf('li') >= 0) d.push('UN 38.3 test summary for the batteries');
    if (f.indexOf('test') >= 0) d.push('UN N.4 self-heating test report from an accredited lab');
    if (f.indexOf('licence') >= 0) d.push('Export licence / permit (PESO, AERB, DGFT or as applicable)');
    if (f.indexOf('magnet') >= 0) d.push('Magnetic field (gauss) test report for air');
    if (f.indexOf('dryice') >= 0) d.push('Dry-ice net weight on the air waybill and packages');
    if (f.indexOf('fuel') >= 0) d.push('Drained / no-fuel certificate if shipping as non-DG');
    if (f.indexOf('perish') >= 0 || f.indexOf('pharma') >= 0) d.push('Temperature instructions for the carrier');
    if (f.indexOf('live') >= 0) d.push('Veterinary health certificate and airline approval');
    return d;
  }
  function labels(r, rows) {
    var L = {}, f = r.flags || [];
    rows.forEach(function (x) { var c = x[2]; if (/^(3480|3481|3090|3091)$/.test(x[0])) L['class-9a-lithium'] = 'Class 9 lithium'; else if (/^1\.4/.test(c)) L['class-1-4'] = 'Class 1.4'; else if (/^1/.test(c)) L['class-1-explosive'] = 'Class 1'; else if (LBL[c]) L[LBL[c]] = 'Class ' + c; (x[3] || '').split(',').forEach(function (s) { if (LBL[s]) L[LBL[s]] = 'Class ' + s; }); if (x[0] === '3373') L['un3373-biological-substance'] = 'UN3373'; if (x[0] === '1845') L['dry-ice-un1845'] = 'Dry ice'; if (x[5] === 'Forbidden' && x[6] && x[6] !== 'Forbidden') L['cargo-aircraft-only'] = 'Cargo aircraft only'; });
    if (f.indexOf('mp') >= 0) L['environmentally-hazardous'] = 'Env. hazardous';
    if (f.indexOf('magnet') >= 0) L['magnetized-material'] = 'Magnetised';
    if (f.indexOf('perish') >= 0) L['perishable'] = 'Perishable';
    if (f.indexOf('live') >= 0) L['live-animals'] = 'Live animals';
    return Object.keys(L).slice(0, 8).map(function (k) { return [k, L[k]]; });
  }

  function render(r, v) {
    var R = RISK[r.risk], V = verdicts(r), D = docs(r), Lb = labels(r, V.rows);
    last = { r: r, q: v, V: V, D: D };
    var html = '<div class="dg-top" style="background:' + R.c + '"><div class="k">' + h(r.kind === 'hsn' ? 'HSN ' + r.hsn + (r.lvl === 'chapter' ? ' · CHAPTER ' + r.hsn.slice(0, 2) : '') : r.kind === 'un' ? 'UN NUMBER' : 'PRODUCT') + (r.hsn && r.kind === 'product' ? ' · TYPICAL HSN ' + h(r.hsn) : '') + '</div><h3>' + h(R.t) + '</h3><p><b>' + h(r.title.replace(/\.$/, '')) + '.</b> ' + h(R.s) + '</p></div>';
    html += '<div class="dg-cols"><div class="dg-box"><h4>✈️ By air</h4><p>' + h(V.air) + '</p></div><div class="dg-box"><h4>🚢 By sea</h4><p>' + h(V.sea) + '</p></div></div>';
    html += '<div class="dg-box" style="margin-top:14px"><h4>What YAM says</h4><p>' + h(r.note) + '</p>' + (r.alsoUN ? '<p style="margin-top:8px">Did you mean the UN number? <a style="color:#0A6CC2;cursor:pointer;text-decoration:underline" data-q="UN' + r.alsoUN + '">Check UN' + r.alsoUN + '</a></p>' : '') + '</div>';
    if (V.rows.length) {
      html += '<div class="dg-box" style="margin-top:14px"><h4>Possible UN entries</h4><div class="dg-tw"><table class="dg-tbl"><tr><th>UN</th><th>Name</th><th>Class</th><th>PG</th><th>Air (indicative)</th></tr>' + V.rows.slice(0, 14).map(function (x) { var a = airOf(x); return '<tr><td class="dg-un">UN' + h(x[0]) + '</td><td>' + h(x[1]) + '</td><td>' + h(x[2]) + (x[3] ? ' (' + h(x[3]) + ')' : '') + '</td><td>' + h(x[4] || '–') + '</td><td><span class="dg-pill" style="background:' + a[1] + '1a;color:' + a[1] + '">' + h(a[0]) + '</span></td></tr>'; }).join('') + '</table></div><div class="dg-note">The right entry depends on the exact product and concentration. Air status is indicative, from public-domain US DOT data; IATA rules and airline variations may be stricter.</div></div>';
    }
    var fl = (r.flags || []).filter(function (k) { return FLAG[k]; });
    html += '<div class="dg-cols">';
    if (fl.length) html += '<div class="dg-box"><h4>Watch out for</h4><ul>' + fl.map(function (k) { return '<li><b>' + h(FLAG[k][0]) + ':</b> ' + h(FLAG[k][1]) + '</li>'; }).join('') + '</ul></div>';
    html += '<div class="dg-box"><h4>Documents to prepare</h4><ul>' + D.map(function (x) { return '<li>' + h(x) + '</li>'; }).join('') + '</ul></div></div>';
    if (Lb.length) html += '<div class="dg-box" style="margin-top:14px"><h4>Labels you may need</h4><div class="dg-labs">' + Lb.map(function (l) { return '<a href="' + TB + 'dg-labels.html" title="Download free from our DG labels page"><img loading="lazy" src="' + TB + 'labels/preview/' + l[0] + '.png" alt="' + h(l[1]) + ' label"><span>' + h(l[1]) + '</span></a>'; }).join('') + '</div><div class="dg-note">Download print-ready labels free from our <a href="' + TB + 'dg-labels.html" style="color:#0A6CC2">DG labels page</a>' + ((r.flags || []).indexOf('li') >= 0 ? ' and check battery rules with our <a href="' + TB + 'lithium-battery-checker.html" style="color:#0A6CC2">lithium battery checker</a>' : '') + '.</div></div>';
    if ((r.more && r.more.length) || (r.unHits && r.unHits.length)) {
      html += '<div class="dg-more">' + (r.more.length ? 'Other matches: ' + r.more.map(function (m) { return '<a data-q="' + h(m) + '">' + h(m) + '</a>'; }).join('') : '') + (r.unHits.length ? '<div style="margin-top:6px">In the UN list: ' + r.unHits.map(function (x) { return '<a data-q="UN' + x[0] + '">UN' + h(x[0]) + ' ' + h(x[1].slice(0, 40)) + '</a>'; }).join('') + '</div>' : '') + '</div>';
    }
    var wa = WA;
    html += '<div class="dg-acts"><a class="dg-btn y" href="' + wa + '" target="_blank" rel="noopener">WhatsApp our DG desk</a><button class="dg-btn o" id="dg-pdf" disabled>Download PDF summary</button><a class="dg-btn o" href="#dg-up">Upload MSDS</a></div><label class="dg-chk" style="margin-top:10px"><input type="checkbox" id="dg-ack"><span>I understand this result is guidance only and the shipper is responsible for classification.</span></label>';
    res.innerHTML = html;
    res.querySelectorAll('[data-q]').forEach(function (a) { a.onclick = function () { q.value = a.getAttribute('data-q'); run(); window.scrollTo({ top: root.getBoundingClientRect().top + scrollY - 80, behavior: 'smooth' }); }; });
    var ack = $('dg-ack'), pb = $('dg-pdf'); ack.onchange = function () { pb.disabled = !ack.checked; }; pb.onclick = pdf;
  }

  // ---------- branded PDF ----------
  function loadS(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = TB + src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function pdf() {
    if (!last) return; var b = $('dg-pdf'); b.disabled = true;
    Promise.all([window.jspdf ? 0 : loadS('vendor/jspdf.umd.min.js'), window.YAMBrand ? 0 : loadS('yam-brand.js?v=4')]).then(function () { var BR = window.YAMBrand; BR.base = TB; return BR.ready(); }).then(function (BR) {
      var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' }), W = 210, M = 16, y = 40, r = last.r, R = RISK[r.risk], H = doc.internal.pageSize.getHeight();
      var when = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      function page(need) { if (y + need > H - 30) { doc.addPage(); BR.header(doc, 'DG cargo check', when); BR.footer(doc, 'Guidance only. The shipper is responsible for classification.'); y = 40; } }
      function para(t, sz, col, bold) { doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(sz); doc.setTextColor(col[0], col[1], col[2]); var L = doc.splitTextToSize(t, W - 2 * M); page(L.length * sz * 0.42 + 2); doc.text(L, M, y); y += L.length * sz * 0.42 + 2; }
      BR.header(doc, 'DG cargo check', when); BR.footer(doc, 'Guidance only. The shipper is responsible for classification.');
      para('You searched: ' + last.q, 9, [94, 120, 145]); y += 2;
      var rc = R.c.match(/\w\w/g).map(function (x) { return parseInt(x, 16); });
      doc.setFillColor(rc[0], rc[1], rc[2]); doc.roundedRect(M, y, W - 2 * M, 22, 3, 3, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text(R.t, M + 6, y + 9); doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text(doc.splitTextToSize(r.title, W - 2 * M - 12)[0], M + 6, y + 16); y += 30;
      para('By air', 11, [11, 42, 74], true); para(last.V.air, 10, [43, 66, 92]); y += 2;
      para('By sea', 11, [11, 42, 74], true); para(last.V.sea, 10, [43, 66, 92]); y += 2;
      para('Our guidance', 11, [11, 42, 74], true); para(r.note, 10, [43, 66, 92]); y += 2;
      if (last.V.rows.length) { para('Possible UN entries', 11, [11, 42, 74], true); last.V.rows.slice(0, 10).forEach(function (x) { para('UN' + x[0] + '  ' + x[1] + '  |  Class ' + x[2] + (x[3] ? ' (' + x[3] + ')' : '') + (x[4] ? '  |  PG ' + x[4] : '') + '  |  Air: ' + airOf(x)[0], 9, [43, 66, 92]); }); y += 2; }
      var fl = (r.flags || []).filter(function (k) { return FLAG[k]; });
      if (fl.length) { para('Watch out for', 11, [11, 42, 74], true); fl.forEach(function (k) { para('• ' + FLAG[k][0] + ': ' + FLAG[k][1], 9.5, [43, 66, 92]); }); y += 2; }
      para('Documents to prepare', 11, [11, 42, 74], true); last.D.forEach(function (d) { para('• ' + d, 9.5, [43, 66, 92]); }); y += 4;
      page(40); BR.promo(doc, M, y, W - 2 * M); y += 38;
      para('IMPORTANT — GUIDANCE ONLY. This summary reflects YAM Logistics’ own knowledge and experience and is provided free for general guidance. It is not the IATA Dangerous Goods Regulations, the IMDG Code or any official classification, and is not endorsed by IATA, IMO, ICAO or any carrier. Classification of dangerous goods is the legal responsibility of the shipper and must be based on the product’s current Safety Data Sheet (MSDS, Section 14) and the applicable regulations. Airlines, shipping lines, ports and authorities may apply stricter rules. YAM Logistics accepts no liability for any loss, delay, penalty or damage arising from use of this summary. Always confirm with a certified dangerous goods professional before booking.', 8, [120, 75, 0]);
      BR.finish(doc);
      doc.save('CargoKit-DG-check-' + last.q.replace(/[^A-Z0-9]+/gi, '-').slice(0, 30) + '.pdf');
    }).catch(function () { alertMsg('Sorry, the PDF could not be created in this browser.'); }).then(function () { b.disabled = false; });
  }
  function alertMsg(t) { var d = document.createElement('div'); d.className = 'dg-box dg-bad'; d.style.marginTop = '10px'; d.textContent = t; res.appendChild(d); }

  // ---------- MSDS reader ----------
  var FILE = null, PARSED = {};
  var pdfP = null;
  function pdfjs() { if (!pdfP) pdfP = loadS('vendor/ocr/pdf.min.js?v=3').then(function () { var L = window.pdfjsLib; L.GlobalWorkerOptions.workerSrc = TB + 'vendor/ocr/pdf.worker.min.js?v=3'; return L; }); return pdfP; }
  function pdfText(file) {
    return pdfjs().then(function (L) { return file.arrayBuffer().then(function (b) { return L.getDocument({ data: new Uint8Array(b), isEvalSupported: false }).promise; }); }).then(function (doc) {
      var n = Math.min(doc.numPages, 20), ps = [];
      for (var i = 1; i <= n; i++) ps.push(doc.getPage(i).then(function (p) { return p.getTextContent().then(function (tc) { var out = '', lastY = null; tc.items.forEach(function (it) { var yy = it.transform ? Math.round(it.transform[5]) : 0; if (lastY !== null && Math.abs(yy - lastY) > 2) out += '\n'; else if (out && !/\s$/.test(out)) out += ' '; out += it.str; lastY = yy; }); return out; }); }));
      return Promise.all(ps).then(function (a) { return a.join('\n'); });
    });
  }
  function parseMSDS(t) {
    var o = {}, T = t.replace(/\r/g, ''), m;
    m = T.match(/(?:product\s*(?:name|identifier)|trade\s*name|material\s*name)\s*[:\-]?\s*([^\n]{3,90})/i); if (m) o.product = m[1].trim();
    var s14 = T.search(/(section\s*14|^\s*14\s*[.:)]?\s*transport\s*information|transport\s*information)/im), s15 = T.search(/(section\s*15|^\s*15\s*[.:)]?\s*regulatory\s*information|regulatory\s*information)/im);
    var sec = s14 >= 0 ? T.slice(s14, s15 > s14 ? s15 : s14 + 2500) : ''; o.found14 = !!sec;
    var scope = sec || T;
    var uns = {}, re = /\bUN\s*(?:No\.?|number)?\s*[:\-]?\s*(\d{4})\b/gi; while ((m = re.exec(scope))) uns[m[1]] = 1; o.uns = Object.keys(uns).filter(function (u) { return u !== '0000'; });
    m = scope.match(/(?:transport\s*hazard\s*class(?:\(es\))?|hazard\s*class|class)\s*[:\-]?\s*(\d(?:\.\d)?)\b/i); if (m) o.cls = m[1];
    m = scope.match(/packing\s*group\s*[:\-]?\s*(III|II|I)\b/i); if (m) o.pg = m[1];
    o.notReg = /not\s+(?:regulated|restricted|classified\s+as\s+(?:a\s+)?dangerous|dangerous\s+goods|subject\s+to)|non[-\s]?(?:hazardous|dangerous)|no\s+dangerous\s+goods/i.test(sec);
    o.mp = /marine\s*pollutant\s*[:\-]?\s*(yes|y\b)/i.test(scope);
    m = T.match(/flash\s*point[^\n0-9\-]{0,40}(-?\d+(?:\.\d+)?)\s*°?\s*([CF])\b/i); if (m) { var fp = parseFloat(m[1]); if (/f/i.test(m[2])) fp = (fp - 32) * 5 / 9; o.flash = Math.round(fp); }
    m = T.match(/(?:revision|issue|version|print|prepared)\s*(?:date|on)?\s*[:\-]?\s*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}|\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/i); if (m) o.date = m[1];
    m = T.match(/\b(?:19|20)\d{2}\b/g); if (m) o.year = Math.max.apply(null, m.map(Number).filter(function (y) { return y <= new Date().getFullYear(); }));
    return o;
  }
  $('dg-file').addEventListener('change', function (e) {
    var f = e.target.files[0], out = $('dg-read'); FILE = f || null; PARSED = {}; $('dg-send').style.display = f ? 'block' : 'none'; upd();
    if (!f) { out.innerHTML = ''; return; }
    if (f.size > 10 * 1024 * 1024) { out.innerHTML = '<span class="dg-bad">This file is over 10 MB. Please send a smaller PDF.</span>'; FILE = null; $('dg-send').style.display = 'none'; return; }
    if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) { out.innerHTML = '<span>Images can’t be read automatically here. Send it to our DG desk below and a specialist will review it.</span>'; return; }
    out.innerHTML = 'Reading the MSDS…';
    load().then(function () { return pdfText(f); }).then(function (t) {
      if (t.replace(/\s/g, '').length < 200) { out.innerHTML = 'This looks like a scanned PDF, so we can’t read the text here. Send it to our DG desk below and a specialist will review it.'; return; }
      var o = parseMSDS(t); PARSED = o; var html = '<div class="dg-box" style="background:#fff"><h4>What this MSDS says' + (o.product ? ': ' + h(o.product) : '') + '</h4><ul>';
      if (!o.found14) html += '<li class="dg-bad">We could not find Section 14 (transport information). A compliant MSDS must have it.</li>';
      if (o.uns.length) html += '<li><b>UN number:</b> ' + o.uns.map(function (u) { var r = (UNI[u] || [])[0]; return 'UN' + h(u) + (r ? ' (' + h(r[1].slice(0, 60)) + ')' : ''); }).join(', ') + '</li>';
      if (o.cls) html += '<li><b>Class:</b> ' + h(o.cls) + (CLN[o.cls] ? ' — ' + CLN[o.cls] : '') + '</li>';
      if (o.pg) html += '<li><b>Packing group:</b> ' + h(o.pg) + '</li>';
      if (o.flash != null) html += '<li><b>Flash point:</b> ' + o.flash + ' °C' + (o.flash < 60 ? ' (below 60 °C: a liquid is normally Class 3)' : '') + '</li>';
      if (o.mp) html += '<li><b>Marine pollutant:</b> yes</li>';
      if (o.date || o.year) html += '<li><b>Date on the MSDS:</b> ' + h(o.date || o.year) + (o.year && new Date().getFullYear() - o.year >= 5 ? ' — <span class="dg-bad">this may be too old; many lines want an MSDS from the last 3 to 5 years</span>' : '') + '</li>';
      html += '</ul>';
      var verdict;
      if (o.uns.length) verdict = '<p class="dg-bad" style="margin-top:10px"><b>The MSDS shows a UN number, so this is dangerous goods for transport.</b> You will need a DG booking and declaration.</p>';
      else if (o.notReg && !(o.flash != null && o.flash < 60)) verdict = '<p class="dg-ok" style="margin-top:10px"><b>The MSDS says it is not regulated for transport.</b> It can usually move as general cargo with a non-haz declaration.</p>';
      else if (o.flash != null && o.flash < 60) verdict = '<p class="dg-bad" style="margin-top:10px"><b>Check needed:</b> the flash point is below 60 °C but no UN number was found. Please let our DG desk review it.</p>';
      else verdict = '<p style="margin-top:10px"><b>We could not read a clear transport classification.</b> Send it to our DG desk below for a review.</p>';
      out.innerHTML = html + verdict + '<div class="dg-note">Read automatically and may miss details. Guidance only.</div></div>';
      if (o.uns.length) { q.value = 'UN' + o.uns[0]; run(); }
    }).catch(function () { out.innerHTML = 'Sorry, this PDF could not be read here. You can still send it to our DG desk below.'; });
  });
  ['dg-n', 'dg-e', 'dg-cons'].forEach(function (id) { $(id).addEventListener('input', upd); $(id).addEventListener('change', upd); });
  function upd() { $('dg-sub').disabled = !(FILE && $('dg-n').value.trim() && /\S+@\S+\.\S+/.test($('dg-e').value) && $('dg-cons').checked); }
  $('dg-sub').onclick = function () {
    var b = this, sm = $('dg-sm'); b.disabled = true; sm.innerHTML = 'Sending…';
    var fd = new FormData(); fd.append('file', FILE); fd.append('name', $('dg-n').value.trim()); fd.append('company', $('dg-c').value.trim()); fd.append('email', $('dg-e').value.trim()); fd.append('phone', $('dg-p').value.trim()); fd.append('hsn', $('dg-h').value.trim()); fd.append('website', $('dg-w').value); fd.append('consent', 'yes'); fd.append('query', q.value.trim()); fd.append('parsed', JSON.stringify(PARSED || {})); fd.append('page', location.href);
    fetch(API + 'api/msds', { method: 'POST', body: fd }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) throw j; return j; }); }).then(function (j) {
      sm.innerHTML = '<span class="dg-ok"><b>Received, thank you.</b> Reference ' + h(j.id || '') + '. Our DG desk will review it and get back to you.</span>';
    }).catch(function () {
      var wa = WA;
      sm.innerHTML = '<span class="dg-bad">Sorry, the upload did not go through.</span> Please <a href="' + wa + '" target="_blank" rel="noopener" style="color:#0A6CC2;font-weight:600">send the MSDS on WhatsApp</a> instead.'; b.disabled = false;
    });
  };

  var u = new URLSearchParams(location.search).get('q'); if (u) { q.value = u; run(); }
})();
