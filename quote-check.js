/* Freight quote checker: pick the Incoterm on your deal and tick what the quote in front of you covers.
   The tool lists what you still have to pay, what the other side pays, and what to ask the forwarder.
   Everything runs on the device. No rates are stored or sent: the tool names charge types, never amounts. */
(function () {
  'use strict';
  var D = document, root = D.getElementById('qc-root'); if (!root) return;
  var KEY = 'ck_qc_v1';
  function el(id) { return D.getElementById(id); }
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Cost steps in the order the cargo moves. names: how the step may appear on a quote (sea FCL, sea LCL, air).
  var STEPS = [
    { k: 'pack', g: 'At origin', t: 'Export packing and marking', n: ['Packing, palletising, fumigation, marks and labels'] },
    { k: 'load', g: 'At origin', t: 'Loading at the seller’s premises', n: ['Loading charges, labour, forklift'] },
    { k: 'pre', g: 'At origin', t: 'Transport to the port, airport or ICD', n: ['Trucking, pick-up, inland haulage (IHC), rail freight'] },
    { k: 'exc', g: 'At origin', t: 'Export customs clearance', n: ['Shipping bill filing, customs broker (CHA) agency charges, examination, certificate of origin'] },
    { k: 'oth', g: 'At origin', t: 'Origin terminal and document charges', n: ['Origin THC, B/L fee, seal, VGM and documentation charges', 'CFS stuffing charges, origin THC, B/L fee, documentation charges', 'Airline terminal charges (TSP), AWB fee, X-ray and screening, documentation charges'] },
    { k: 'onb', g: 'At origin', t: 'Loading on board', n: ['Usually inside the origin THC', 'Usually inside the CFS and THC charges', 'Usually inside the airline terminal charges'] },
    { k: 'frt', g: 'Main carriage', t: 'Freight to the destination port or airport', n: ['Ocean freight with BAF or bunker, war risk, peak season and other surcharges', 'LCL freight per CBM or tonne (W/M) with surcharges', 'Air freight per chargeable kg with fuel and security surcharges'] },
    { k: 'ins', g: 'Main carriage', t: 'Cargo insurance', n: ['Marine cargo insurance premium', 'Marine cargo insurance premium', 'Air cargo insurance premium'] },
    { k: 'dth', g: 'At destination', t: 'Destination terminal and document charges', n: ['Destination THC, delivery order (DO) fee, container cleaning and washing, import documentation', 'CFS destuffing charges, destination THC, delivery order (DO) fee', 'Airline terminal charges, delivery order (DO) fee, break-bulk fee'] },
    { k: 'imc', g: 'At destination', t: 'Import customs clearance', n: ['Bill of entry filing, customs broker agency charges, examination, CFS or terminal handling for examination'] },
    { k: 'dty', g: 'At destination', t: 'Import duty and taxes', n: ['Customs duty, IGST or VAT, cess and any anti-dumping duty'] },
    { k: 'del', g: 'At destination', t: 'Transport to the buyer’s door', n: ['Trucking, inland haulage, empty container return', 'Trucking from the CFS', 'Trucking from the airport'] },
    { k: 'unl', g: 'At destination', t: 'Unloading at the buyer’s premises', n: ['Unloading labour, crane or forklift'] }
  ];
  // Who bears each step: S seller, B buyer, s or b = usually that side, but it depends (see NOTE).
  //            pack load pre  exc  oth  onb  frt  ins  dth  imc  dty  del  unl
  var T = {
    EXW: { n: 'Ex Works', sea: 0, w: 'S  B  B  B  B  B  B  b  B  B  B  B  B', risk: 'when the goods are placed at your disposal at the seller’s premises, before loading', ins: 'Neither side has to insure. The buyer carries the risk for the whole journey, so the buyer normally insures.' },
    FCA: { n: 'Free Carrier', sea: 0, w: 'S  S  s  S  b  B  B  b  B  B  B  B  B', risk: 'when the goods are handed to the buyer’s carrier at the named place', ins: 'Neither side has to insure. The buyer carries the risk from the handover, so the buyer normally insures.' },
    FAS: { n: 'Free Alongside Ship', sea: 1, w: 'S  S  S  S  S  B  B  b  B  B  B  B  B', risk: 'when the goods are placed alongside the vessel at the named port', ins: 'Neither side has to insure. The buyer normally insures from the port of loading.' },
    FOB: { n: 'Free On Board', sea: 1, w: 'S  S  S  S  S  S  B  b  B  B  B  B  B', risk: 'when the goods are on board the vessel at the port of loading', ins: 'Neither side has to insure. The buyer carries the risk from on board, so the buyer normally insures.' },
    CFR: { n: 'Cost and Freight', sea: 1, w: 'S  S  S  S  S  S  S  b  b  B  B  B  B', risk: 'when the goods are on board the vessel at the port of loading, although the seller pays the freight', ins: 'The seller does not have to insure. The risk on the voyage is the buyer’s, so the buyer should insure.' },
    CIF: { n: 'Cost, Insurance and Freight', sea: 1, w: 'S  S  S  S  S  S  S  S  b  B  B  B  B', risk: 'when the goods are on board the vessel at the port of loading, although the seller pays freight and insurance', ins: 'The seller must insure, but only to the minimum cover (Institute Cargo Clauses C) unless you agree more. Ask for the policy or certificate.' },
    CPT: { n: 'Carriage Paid To', sea: 0, w: 'S  S  S  S  S  S  S  b  b  B  B  b  B', risk: 'when the goods are handed to the first carrier, although the seller pays carriage to the named place', ins: 'The seller does not have to insure. The risk in transit is the buyer’s, so the buyer should insure.' },
    CIP: { n: 'Carriage and Insurance Paid To', sea: 0, w: 'S  S  S  S  S  S  S  S  b  B  B  b  B', risk: 'when the goods are handed to the first carrier, although the seller pays carriage and insurance', ins: 'The seller must insure with all-risks cover (Institute Cargo Clauses A) unless you agree less. Ask for the policy or certificate.' },
    DAP: { n: 'Delivered at Place', sea: 0, w: 'S  S  S  S  S  S  S  s  S  B  B  S  B', risk: 'when the goods arrive at the named place, ready for unloading', ins: 'Neither side has to insure. The seller carries the risk until arrival, so the seller normally insures.' },
    DPU: { n: 'Delivered at Place Unloaded', sea: 0, w: 'S  S  S  S  S  S  S  s  S  B  B  S  S', risk: 'when the goods are unloaded at the named place', ins: 'Neither side has to insure. The seller carries the risk until unloading, so the seller normally insures.' },
    DDP: { n: 'Delivered Duty Paid', sea: 0, w: 'S  S  S  S  S  S  S  s  S  S  S  S  B', risk: 'when the goods arrive at the named place, cleared for import, ready for unloading', ins: 'Neither side has to insure. The seller carries the risk until arrival, so the seller normally insures.' }
  };
  var ORDER = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
  Object.keys(T).forEach(function (k) { var a = T[k].w.trim().split(/\s+/); T[k].m = {}; STEPS.forEach(function (s, i) { T[k].m[s.k] = a[i]; }); });
  // why a step "depends"
  var NOTE = {
    'FCA:pre': 'The seller pays if the named place is a terminal or the forwarder’s warehouse. If the named place is the seller’s own premises, the buyer’s carrier collects and the buyer pays.',
    'FCA:oth': 'Terminal charges at origin are usually billed to the buyer with the freight, but sellers and buyers often argue over them. Agree it in the contract.',
    'CFR:dth': 'The buyer pays, unless the seller’s freight contract already includes discharge and terminal charges at destination.',
    'CIF:dth': 'The buyer pays, unless the seller’s freight contract already includes discharge and terminal charges at destination.',
    'CPT:dth': 'The buyer pays, unless the seller’s carriage contract already includes them.',
    'CIP:dth': 'The buyer pays, unless the seller’s carriage contract already includes them.',
    'CPT:del': 'The seller pays carriage as far as the named place. If that place is the port or airport, the onward transport is the buyer’s.',
    'CIP:del': 'The seller pays carriage as far as the named place. If that place is the port or airport, the onward transport is the buyer’s.'
  };
  ORDER.forEach(function (k) { if (k !== 'CIF' && k !== 'CIP') NOTE[k + ':ins'] = 'Insurance is not compulsory under ' + k + '. The side that carries the risk in transit normally buys it.'; });
  var MODES = [['fcl', 'Sea, full container (FCL)'], ['lcl', 'Sea, part load (LCL)'], ['air', 'Air']];

  var S = { role: 'B', mode: 'fcl', term: 'FOB', q: {} };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv && T[sv.term]) S = sv; if (!S.q) S.q = {}; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function nm(s) { var i = S.mode === 'fcl' ? 0 : S.mode === 'lcl' ? 1 : 2; return s.n[i] || s.n[0]; }
  function side(c) { return c.toUpperCase(); }
  function word(c) { return side(c) === 'S' ? 'Seller' : 'Buyer'; }

  var css = '#qc-root{font-family:Geist,system-ui,sans-serif;color:#0B2A4A}.qc-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:26px;margin-bottom:16px}.qc-h{font-family:Archivo,sans-serif;font-weight:800;font-size:22px;letter-spacing:-.01em;margin:0 0 4px}.qc-s{font-size:15px;line-height:1.55;color:#3D5873;margin:0 0 16px}' +
    '.qc-row{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}.qc-l{font-family:"Geist Mono",monospace;font-size:11.5px;letter-spacing:.08em;color:#5E7891;margin:0 0 8px;text-transform:uppercase}' +
    '.qc-p{border:1.5px solid #CFE0EF;background:#fff;color:#0B2A4A;border-radius:999px;padding:10px 16px;font:600 15px Geist,system-ui,sans-serif;cursor:pointer;min-height:44px}.qc-p.on{background:#0A6CC2;border-color:#0A6CC2;color:#fff}.qc-p:disabled{opacity:.35;cursor:not-allowed}.qc-p small{display:block;font-weight:500;font-size:11.5px;opacity:.85}.qc-terms{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr))}.qc-terms .qc-p{border-radius:16px;text-align:left;padding:10px 14px}' +
    '.qc-t{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border:1px solid #E1EDF7;border-radius:14px;margin-bottom:8px;cursor:pointer;background:#fff}.qc-t.on{background:#F1F8FF;border-color:#9CC9F0}.qc-t input{width:22px;height:22px;margin:1px 0 0;flex:none;accent-color:#0A6CC2}.qc-t b{display:block;font-size:15.5px}.qc-t span{display:block;font-size:13px;line-height:1.45;color:#5E7891;margin-top:2px}' +
    '.qc-g{font-family:"Geist Mono",monospace;font-size:11.5px;letter-spacing:.08em;color:#B45309;margin:16px 0 8px;text-transform:uppercase}' +
    '.qc-box{border-radius:18px;padding:18px 20px;margin-bottom:12px}.qc-box h3{font-family:Archivo,sans-serif;font-weight:800;font-size:18px;margin:0 0 4px}.qc-box p{font-size:14px;line-height:1.5;margin:0 0 10px}.qc-box ul{margin:0;padding:0;list-style:none}.qc-box li{padding:9px 0;border-top:1px solid rgba(11,42,74,.1);font-size:15px;line-height:1.45}.qc-box li:first-child{border-top:0}.qc-box li span{display:block;font-size:13px;color:#3D5873;margin-top:2px}.qc-box li em{display:block;font-style:normal;font-size:13px;color:#7A4B00;margin-top:4px}' +
    '.qc-ask{background:#FFF4D6;border:1px solid #F3DE9B}.qc-ok{background:#EAF7EF;border:1px solid #BFE3CC}.qc-odd{background:#FDECEC;border:1px solid #F2B8B8}.qc-oth{background:#F2F8FD;border:1px solid #D6E6F4}.qc-info{background:#fff;border:1px solid #E1EDF7}' +
    '.qc-b{border:0;border-radius:999px;padding:12px 20px;font:700 15px Geist,system-ui,sans-serif;cursor:pointer;min-height:46px}.qc-b1{background:#0A6CC2;color:#fff}.qc-b2{background:#FFC93C;color:#0B2A4A}.qc-b3{background:#fff;color:#B42318;box-shadow:inset 0 0 0 1.5px #F2B8B8}.qc-acts{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}' +
    '.qc-tbl{width:100%;border-collapse:collapse;font-size:14px}.qc-tbl th{text-align:left;font-family:"Geist Mono",monospace;font-size:11px;letter-spacing:.06em;color:#5E7891;padding:8px 6px;border-bottom:1px solid #E1EDF7}.qc-tbl td{padding:9px 6px;border-bottom:1px solid #EEF4FA;vertical-align:top}.qc-tag{display:inline-block;border-radius:999px;padding:3px 10px;font-weight:700;font-size:12.5px}.qc-tS{background:#E7F0FF;color:#0A4E96}.qc-tB{background:#FFF1CC;color:#7A4B00}.qc-me{outline:2px solid #0A6CC2;outline-offset:1px}' +
    '@media (max-width:640px){.qc-card{padding:18px;border-radius:18px}.qc-p{padding:9px 13px;font-size:14.5px}}';
  var st = D.createElement('style'); st.textContent = css; D.head.appendChild(st);

  function draw() {
    var t = T[S.term], me = S.role, air = S.mode === 'air';
    var o = '<div class="qc-card"><div class="qc-acts" style="justify-content:flex-end;margin:0 0 6px"><button type="button" class="qc-b qc-b3" id="qc-clear">✕ Clear form</button></div>' +
      '<h2 class="qc-h">1. Your deal</h2><p class="qc-s">Three taps. Nothing you choose leaves your phone.</p>' +
      '<div class="qc-l">I am the</div><div class="qc-row">' + [['B', 'Buyer (importer)'], ['S', 'Seller (exporter)']].map(function (r) { return '<button type="button" class="qc-p' + (S.role === r[0] ? ' on' : '') + '" data-role="' + r[0] + '">' + r[1] + '</button>'; }).join('') + '</div>' +
      '<div class="qc-l">The cargo moves by</div><div class="qc-row">' + MODES.map(function (m) { return '<button type="button" class="qc-p' + (S.mode === m[0] ? ' on' : '') + '" data-mode="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '</div>' +
      '<div class="qc-l">Incoterm on the contract or proforma</div><div class="qc-row qc-terms">' + ORDER.map(function (k) { var dis = air && T[k].sea; return '<button type="button" class="qc-p' + (S.term === k ? ' on' : '') + '" data-term="' + k + '"' + (dis ? ' disabled title="For sea and inland waterway only"' : '') + '>' + k + '<small>' + h(T[k].n) + '</small></button>'; }).join('') + '</div>' +
      (air ? '<p class="qc-s" style="margin:-8px 0 0">FAS, FOB, CFR and CIF are for sea and inland waterway only, so they are switched off for air.</p>' : (t.sea && S.mode !== 'air' && (S.term === 'FOB' || S.term === 'CFR' || S.term === 'CIF') && S.mode === 'fcl' ? '<p class="qc-s" style="margin:-8px 0 0">Note: for cargo in containers the ICC recommends FCA, CPT or CIP instead of ' + S.term + ', because the seller hands the container over at the terminal, not on board. ' + S.term + ' is still widely used, and the split below follows it.</p>' : '')) +
      '</div>';

    o += '<div class="qc-card"><h2 class="qc-h">2. What the quote covers</h2><p class="qc-s">Look at the quote or estimate in front of you and tick every step it includes. Each step shows the names it usually goes by.</p>';
    var g = '';
    STEPS.forEach(function (s) {
      if (s.g !== g) { g = s.g; o += '<div class="qc-g">' + g + '</div>'; }
      var on = !!S.q[s.k];
      o += '<label class="qc-t' + (on ? ' on' : '') + '"><input type="checkbox" data-q="' + s.k + '"' + (on ? ' checked' : '') + '><div><b>' + h(s.t) + '</b><span>' + h(nm(s)) + '</span></div></label>';
    });
    o += '</div>';

    // results
    var ask = [], ok = [], odd = [], oth = [];
    STEPS.forEach(function (s) {
      var c = t.m[s.k], mine = side(c) === me, inq = !!S.q[s.k], note = NOTE[S.term + ':' + s.k] || '';
      var item = { s: s, note: note, dep: c !== side(c) };
      if (mine && inq) ok.push(item); else if (mine && !inq) ask.push(item); else if (!mine && inq) odd.push(item); else oth.push(item);
    });
    function li(x) { return '<li><b>' + h(x.s.t) + '</b><span>' + h(nm(x.s)) + '</span>' + (x.note ? '<em>' + h(x.note) + '</em>' : '') + '</li>'; }
    var you = me === 'B' ? 'buyer' : 'seller', them = me === 'B' ? 'seller' : 'buyer', any = Object.keys(S.q).some(function (k) { return S.q[k]; });
    o += '<div class="qc-card"><h2 class="qc-h">3. Your answer under ' + S.term + '</h2><p class="qc-s">' + h(t.n) + ', seen from the ' + you + '’s side. ' + (any ? '' : 'Tick the steps in your quote above to see what is missing.') + '</p>';
    if (ask.length) o += '<div class="qc-box qc-ask"><h3>' + (any ? 'You pay these, and the quote does not show them' : 'You pay these under ' + S.term) + '</h3><p>' + (any ? 'Ask what each will cost before you accept. These are the usual surprise charges.' : 'Every one of them should be in a quote, or in someone’s quote, before the cargo moves.') + '</p><ul>' + ask.map(li).join('') + '</ul></div>';
    if (odd.length) o += '<div class="qc-box qc-odd"><h3>In the quote, but normally the ' + them + '’s cost</h3><p>Under ' + S.term + ' the ' + them + ' usually pays these. Check you are not paying twice, or that your price with the ' + them + ' allows for it.</p><ul>' + odd.map(li).join('') + '</ul></div>';
    if (ok.length) o += '<div class="qc-box qc-ok"><h3>You pay these, and the quote covers them</h3><ul>' + ok.map(li).join('') + '</ul></div>';
    if (oth.length) o += '<div class="qc-box qc-oth"><h3>The ' + them + ' pays these</h3><p>You should not be billed for them. If a bill arrives, point to the Incoterm.</p><ul>' + oth.map(li).join('') + '</ul></div>';
    o += '<div class="qc-box qc-info"><h3>Risk and insurance</h3><ul><li><b>Risk passes to the buyer</b> ' + h(t.risk) + '.</li><li><b>Insurance.</b> ' + h(t.ins) + '</li></ul></div>';
    o += '<div class="qc-box qc-info"><h3>Not on any quote, but watch for them</h3><ul>' +
      '<li><b>Demurrage, detention and storage.</b><span>Charged per day when the cargo or the container stays past the free days, usually because documents or duty payment are late. Ask how many free days you get at both ends.</span></li>' +
      '<li><b>Exchange rate and validity.</b><span>Freight is often quoted in US dollars and billed in local currency at the line’s or airline’s rate. Check how long the quote is valid and which charges are “subject to change”.</span></li>' +
      '<li><b>Tax on the services.</b><span>GST or VAT may apply to freight and local charges on top of the quoted figures. Ask whether the quote includes it.</span></li>' +
      (S.mode === 'air' ? '<li><b>Chargeable weight.</b><span>Air freight is billed on the higher of actual and volumetric weight. A light, bulky shipment costs more than its scale weight suggests.</span></li>' : S.mode === 'lcl' ? '<li><b>Minimum charges.</b><span>LCL quotes carry minimums per shipment and are billed per CBM or tonne, whichever is higher.</span></li>' : '<li><b>Container deposit and damage.</b><span>Some lines take a deposit or bill for cleaning and repairs when the empty container is returned.</span></li>') +
      '</ul></div>';
    o += '<div class="qc-acts"><button type="button" class="qc-b qc-b1" id="qc-copy">Copy the questions to ask</button><button type="button" class="qc-b qc-b2" id="qc-share">Share</button><button type="button" class="qc-b" id="qc-print" style="background:#fff;box-shadow:inset 0 0 0 1.5px #CFE0EF;color:#0B2A4A">Print or save as PDF</button></div><div class="qc-s" id="qc-msg" style="margin:10px 0 0" aria-live="polite"></div></div>';

    // full table for this term
    o += '<div class="qc-card"><h2 class="qc-h">Who pays what under ' + S.term + '</h2><p class="qc-s">The standard split under Incoterms 2020. Your contract can change it, so the contract wins.</p><div style="overflow-x:auto"><table class="qc-tbl"><thead><tr><th>STEP</th><th>WHO PAYS</th></tr></thead><tbody>' +
      STEPS.map(function (s) { var c = t.m[s.k], dep = c !== side(c); return '<tr><td><b>' + h(s.t) + '</b>' + (NOTE[S.term + ':' + s.k] ? '<div style="font-size:12.5px;color:#7A4B00;margin-top:3px">' + h(NOTE[S.term + ':' + s.k]) + '</div>' : '') + '</td><td><span class="qc-tag qc-t' + side(c) + (side(c) === me ? ' qc-me' : '') + '">' + word(c) + (dep ? ' (usually)' : '') + '</span></td></tr>'; }).join('') +
      '</tbody></table></div></div>';
    root.innerHTML = o;
    bind();
  }

  function text() {
    var t = T[S.term], me = S.role, you = me === 'B' ? 'buyer' : 'seller', L = [];
    L.push('Quote check: ' + S.term + ' (' + t.n + '), ' + MODES.filter(function (m) { return m[0] === S.mode; })[0][1] + ', I am the ' + you + '.');
    var ask = STEPS.filter(function (s) { return side(t.m[s.k]) === me && !S.q[s.k]; }), odd = STEPS.filter(function (s) { return side(t.m[s.k]) !== me && S.q[s.k]; });
    if (ask.length) { L.push(''); L.push('Please confirm the cost of these, which are not in your quote:'); ask.forEach(function (s, i) { L.push((i + 1) + '. ' + s.t + ' (' + nm(s) + ')'); }); }
    if (odd.length) { L.push(''); L.push('Your quote includes these, which under ' + S.term + ' are normally the other party’s cost. Please confirm why:'); odd.forEach(function (s, i) { L.push((i + 1) + '. ' + s.t); }); }
    L.push(''); L.push('Also please confirm: free days for demurrage and detention at both ends, the validity of the quote, the exchange rate used, and whether GST or VAT is included.');
    L.push(''); L.push('Made with the free quote checker at cargokit.ai');
    return L.join('\n');
  }

  function bind() {
    root.querySelectorAll('[data-role]').forEach(function (b) { b.onclick = function () { S.role = b.getAttribute('data-role'); save(); draw(); }; });
    root.querySelectorAll('[data-mode]').forEach(function (b) { b.onclick = function () { S.mode = b.getAttribute('data-mode'); if (S.mode === 'air' && T[S.term].sea) S.term = 'FCA'; save(); draw(); }; });
    root.querySelectorAll('[data-term]').forEach(function (b) { b.onclick = function () { S.term = b.getAttribute('data-term'); save(); draw(); }; });
    root.querySelectorAll('[data-q]').forEach(function (c) { c.onchange = function () { var y = window.scrollY; S.q[c.getAttribute('data-q')] = c.checked; save(); draw(); window.scrollTo(0, y); }; });
    el('qc-clear').onclick = function () { if (!confirm('Clear your choices and start again?')) return; try { localStorage.removeItem(KEY); } catch (e) {} S = { role: 'B', mode: 'fcl', term: 'FOB', q: {} }; draw(); window.scrollTo(0, root.getBoundingClientRect().top + window.scrollY - 90); };
    el('qc-copy').onclick = function () { var m = el('qc-msg'), tx = text(); (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(tx) : Promise.reject()).then(function () { m.textContent = 'Copied. Paste it into your email or message to the forwarder.'; }).catch(function () { var a = D.createElement('textarea'); a.value = tx; D.body.appendChild(a); a.select(); try { D.execCommand('copy'); m.textContent = 'Copied. Paste it into your email or message to the forwarder.'; } catch (e) { m.textContent = 'Could not copy on this device.'; } D.body.removeChild(a); }); };
    el('qc-share').onclick = function () { var tx = text(); if (navigator.share) navigator.share({ title: 'Quote check: ' + S.term, text: tx }).catch(function () {}); else window.open('https://wa.me/?text=' + encodeURIComponent(tx), '_blank', 'noopener'); };
    el('qc-print').onclick = function () { window.print(); };
  }
  draw();
})();
