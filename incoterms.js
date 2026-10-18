/* YAM Logistics — Incoterms® 2020 explorer (who pays, who carries the risk, step by step) */
(function () {
  var root = document.getElementById('inc-root'); if (!root) return;
  var STEPS = [
    ['Export packing', 'Packing, marking and labelling for export'],
    ['Loading at origin', 'Loading onto the first truck at the seller’s premises'],
    ['Pre-carriage', 'Transport to the export port, airport or terminal'],
    ['Export clearance', 'Shipping bill, export licences and export duties'],
    ['Origin terminal', 'Terminal handling and loading on the ship or aircraft'],
    ['Main carriage', 'Ocean or air freight to the destination country'],
    ['Insurance', 'Cargo insurance for the main journey'],
    ['Destination terminal', 'Unloading and terminal handling on arrival'],
    ['On-carriage', 'Transport from the arrival port to the named place'],
    ['Unloading', 'Unloading at the buyer’s premises or named place'],
    ['Import clearance', 'Bill of entry, customs duty, IGST and other import taxes']
  ];
  // cost bearer per step: S seller, B buyer. risk = index of the last step at the seller's risk (-1 = before loading)
  var R = {
    EXW: { n: 'Ex Works', m: 'any', c: 'SBBBBBBBBBB', risk: 0, at: 'At the seller’s premises, when the goods are placed at the buyer’s disposal, not loaded.',
      d: 'The seller only makes the goods available at its own premises. The buyer arranges and pays for everything else, including loading and export clearance.',
      tip: 'For Indian exports EXW is awkward: the exporter of record must file the shipping bill to claim GST refunds, RoDTEP and drawback. FCA is usually the better choice.' },
    FCA: { n: 'Free Carrier', m: 'any', c: 'SSBSBBBBBBB', risk: 1, at: 'When the goods are loaded on the buyer’s transport at the seller’s premises, or handed to the carrier at another named place.',
      d: 'The seller clears the goods for export and hands them to the buyer’s carrier at the named place. If the named place is the seller’s premises, the seller also loads them.',
      tip: 'The most practical term for containerised and air cargo. Name the place precisely, for example “FCA ICD Tughlakabad” or “FCA seller’s factory, Manesar”.' },
    FAS: { n: 'Free Alongside Ship', m: 'sea', c: 'SSSSBBBBBBB', risk: 3, at: 'When the goods are placed alongside the vessel at the named port of shipment.',
      d: 'The seller delivers the goods alongside the buyer’s vessel, cleared for export. The buyer pays for loading and everything after.',
      tip: 'Mainly used for bulk and breakbulk cargo. Not suitable for containers, which are handed over at a terminal before reaching the ship.' },
    FOB: { n: 'Free On Board', m: 'sea', c: 'SSSSSBBBBBB', risk: 4, at: 'When the goods are on board the vessel at the named port of shipment.',
      d: 'The seller clears the goods for export and loads them on board the vessel nominated by the buyer. The buyer pays the ocean freight, insurance and all destination costs.',
      tip: 'Widely used in India, but strictly a sea and inland waterway term. For containers and air cargo, FCA reflects where the risk really changes hands.' },
    CFR: { n: 'Cost and Freight', m: 'sea', c: 'SSSSSSBBBBB', risk: 4, at: 'On board the vessel at the port of shipment, even though the seller pays freight to the destination port.',
      d: 'The seller pays the ocean freight to the named destination port, but the risk passes to the buyer once the goods are on board at origin.',
      tip: 'The buyer carries the transit risk without being the one who books the ship, so the buyer should arrange its own cargo insurance.' },
    CIF: { n: 'Cost, Insurance and Freight', m: 'sea', c: 'SSSSSSSBBBB', risk: 4, at: 'On board the vessel at the port of shipment. The seller insures the voyage for the buyer’s benefit.',
      d: 'Like CFR, plus the seller must insure the goods for the voyage. The minimum cover is Institute Cargo Clauses (C), for 110% of the contract value.',
      tip: 'Indian customs values imports on a CIF basis. If you import on CIF terms, the assessable value is simply the invoice value, plus any additions the valuation rules require.' },
    CPT: { n: 'Carriage Paid To', m: 'any', c: 'SSSSSSBSSBB', risk: 1, at: 'When the goods are handed to the first carrier at origin, even though the seller pays carriage to the destination.',
      d: 'The seller pays carriage to the named place of destination, but the risk passes when the goods are handed to the first carrier at origin.',
      tip: 'Destination charges are paid by the seller only if they form part of its contract of carriage. Agree in writing who pays destination THC and delivery order charges.' },
    CIP: { n: 'Carriage and Insurance Paid To', m: 'any', c: 'SSSSSSSSSBB', risk: 1, at: 'When the goods are handed to the first carrier at origin. The seller insures the journey for the buyer’s benefit.',
      d: 'Like CPT, plus the seller must insure the goods. Under Incoterms 2020 the cover must be the broader Institute Cargo Clauses (A), all risks, for 110% of the value.',
      tip: 'A good fit for air freight and multimodal container moves where the buyer wants the seller to arrange door-to-port or door-to-door cover.' },
    DAP: { n: 'Delivered at Place', m: 'any', c: 'SSSSSSSSSBB', risk: 8, at: 'At the named destination, on the arriving vehicle, ready for unloading.',
      d: 'The seller delivers the goods to the named place in the buyer’s country, ready for unloading. The buyer unloads and clears the goods for import.',
      tip: 'The buyer is still the importer, so it pays the customs duty and IGST and needs its own IEC to file the bill of entry in India.' },
    DPU: { n: 'Delivered at Place Unloaded', m: 'any', c: 'SSSSSSSSSSB', risk: 9, at: 'At the named destination, once the goods have been unloaded.',
      d: 'The seller delivers the goods and also unloads them at the named place. This is the only Incoterms rule that requires the seller to unload. It replaced DAT in 2020.',
      tip: 'Use it only if the seller can actually arrange unloading at the destination, for example at a named CFS or warehouse.' },
    DDP: { n: 'Delivered Duty Paid', m: 'any', c: 'SSSSSSSSSBS', risk: 8, at: 'At the named destination, cleared for import, on the arriving vehicle ready for unloading.',
      d: 'The seller carries every cost and risk to the named place, including import clearance, customs duty and import taxes. The buyer only unloads.',
      tip: 'A foreign seller shipping DDP to India must act as, or appoint, the importer on record with an IEC. It cannot normally claim input credit for the IGST it pays.' }
  };
  var ORDER = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
  var css = '.inc-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}.inc-tab{border:1px solid #CFE3F5;background:#fff;border-radius:999px;padding:10px 16px;font:inherit;font-weight:700;font-family:"Geist Mono",monospace;cursor:pointer;color:#0B2A4A}.inc-tab.on{background:#0A6CC2;border-color:#0A6CC2;color:#fff}.inc-tab small{display:block;font-weight:400;font-size:10px;opacity:.7;letter-spacing:.04em}.inc-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:28px}.inc-h{font-family:Archivo,sans-serif;font-weight:900;font-size:32px;margin:0 0 6px}.inc-m{display:inline-block;font-size:12px;font-family:"Geist Mono",monospace;letter-spacing:.06em;border-radius:999px;padding:4px 10px;background:#EEF5FC;color:#0A6CC2;margin-bottom:12px}.inc-p{font-size:16px;line-height:1.6;color:#3D5873;margin:0 0 10px;max-width:900px}.inc-flow{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:6px;margin:22px 0 10px;position:relative}.inc-s{border-radius:14px;padding:12px 10px;min-height:118px;display:flex;flex-direction:column;gap:6px;position:relative}.inc-s b{font-size:13px;line-height:1.25}.inc-s span{font-size:11.5px;line-height:1.35;opacity:.85}.inc-s i{font-style:normal;font-family:"Geist Mono",monospace;font-size:11px;letter-spacing:.06em;font-weight:700}.inc-S{background:#0A6CC2;color:#fff}.inc-B{background:#FFE7A8;color:#4A3500}.inc-risk{position:absolute;top:-10px;bottom:-10px;right:-6px;width:4px;background:#B42318;border-radius:4px;z-index:2}.inc-risk em{position:absolute;top:-24px;right:-50px;white-space:nowrap;font-style:normal;font-size:11px;font-weight:700;color:#B42318;font-family:"Geist Mono",monospace}.inc-leg{display:flex;flex-wrap:wrap;gap:16px;font-size:13px;color:#3D5873;margin:6px 0 16px}.inc-leg span{display:inline-flex;align-items:center;gap:6px}.inc-leg i{width:14px;height:14px;border-radius:4px;display:inline-block}.inc-box{background:#F7FBFF;border-radius:16px;padding:16px 18px;margin-top:12px;font-size:15px;line-height:1.6;color:#17436B}.inc-box b{color:#0B2A4A}.inc-tbl{width:100%;border-collapse:separate;border-spacing:3px;font-size:12.5px;min-width:900px}.inc-tbl th{font-weight:600;color:#3D5873;text-align:center;padding:6px 4px;vertical-align:bottom;font-size:11.5px}.inc-tbl td{text-align:center;padding:8px 4px;border-radius:6px;font-family:"Geist Mono",monospace;font-weight:700}.inc-tbl td.k{background:#fff;text-align:left;font-family:inherit;padding-left:8px}.inc-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}@media(max-width:900px){.inc-flow{grid-template-columns:1fr 1fr}.inc-s{min-height:0}.inc-risk{display:none}.inc-s.rk{box-shadow:inset 0 -5px 0 #B42318}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function h(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var cur = 'FOB';
  try { var hs = (location.hash || '').replace('#', '').toUpperCase(); if (R[hs]) cur = hs; } catch (e) { }
  function tabs() { return '<div class="inc-tabs" role="tablist">' + ORDER.map(function (k) { return '<button class="inc-tab' + (k === cur ? ' on' : '') + '" data-k="' + k + '" role="tab" aria-selected="' + (k === cur) + '">' + k + '<small>' + (R[k].m === 'sea' ? 'SEA ONLY' : 'ANY MODE') + '</small></button>'; }).join('') + '</div>'; }
  function view() {
    var x = R[cur], f = '';
    STEPS.forEach(function (s, i) {
      var who = x.c[i];
      f += '<div class="inc-s inc-' + who + (i === x.risk ? ' rk' : '') + '"><i>' + (who === 'S' ? 'SELLER' : 'BUYER') + '</i><b>' + h(s[0]) + '</b><span>' + h(s[1]) + '</span>' + (i === x.risk ? '<div class="inc-risk"><em>RISK PASSES</em></div>' : '') + '</div>';
    });
    var ins = cur === 'CIF' ? 'The seller must insure: minimum Institute Cargo Clauses (C), 110% of value.' : cur === 'CIP' ? 'The seller must insure: Institute Cargo Clauses (A), all risks, 110% of value.' : (x.risk >= 8 ? 'Not compulsory, but the seller carries the risk to destination and usually insures.' : 'Not compulsory for either party. The buyer carries the transit risk, so the buyer should insure.');
    return tabs() + '<div class="inc-card"><div class="inc-m">' + (x.m === 'sea' ? 'SEA & INLAND WATERWAY ONLY' : 'ANY MODE: SEA, AIR, ROAD, RAIL, MULTIMODAL') + '</div><h2 class="inc-h">' + cur + ' · ' + h(x.n) + '</h2><p class="inc-p">' + h(x.d) + '</p>' +
      '<div class="inc-leg"><span><i style="background:#0A6CC2"></i>Seller pays</span><span><i style="background:#FFE7A8"></i>Buyer pays</span><span><i style="background:#B42318;width:4px"></i>Risk passes from seller to buyer</span></div>' +
      '<div class="inc-flow">' + f + '</div>' +
      '<div class="inc-box"><b>Where the risk passes:</b> ' + h(x.at) + '</div>' +
      '<div class="inc-box"><b>Insurance:</b> ' + h(ins) + '</div>' +
      '<div class="inc-box" style="background:#FFF8E6"><b>India tip:</b> ' + h(x.tip) + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:18px"><a href="customs-duty-calculator.html" style="background:#0A6CC2;color:#fff;border-radius:999px;padding:12px 20px;font-weight:600;text-decoration:none">Work out the import duty →</a><a target="_blank" rel="noopener" href="https://wa.me/YAMLOGISTICS?text=' + encodeURIComponent('Hello YAM, I need a quote on ' + cur + ' terms.') + '" style="background:#25D366;color:#06331A;border-radius:999px;padding:12px 20px;font-weight:600;text-decoration:none">Get a quote on ' + cur + ' terms</a></div></div>' + table();
  }
  function table() {
    var t = '<div class="inc-card" style="margin-top:16px"><h3 style="font-family:Archivo,sans-serif;font-weight:900;font-size:24px;margin:0 0 4px">All 11 rules side by side</h3><p class="inc-p" style="font-size:14px">S = seller pays, B = buyer pays. The red outline marks the last step at the seller’s risk. Tap a rule to open it above.</p><div class="inc-wrap"><table class="inc-tbl"><tr><th style="text-align:left">Rule</th>' + STEPS.map(function (s) { return '<th>' + h(s[0]) + '</th>'; }).join('') + '</tr>';
    ORDER.forEach(function (k) {
      t += '<tr><td class="k"><a href="#' + k + '" data-k="' + k + '" style="font-weight:700;text-decoration:none">' + k + '</a> <span style="color:#5E7891;font-size:11.5px">' + h(R[k].n) + '</span></td>' + R[k].c.split('').map(function (w, i) { return '<td style="background:' + (w === 'S' ? '#0A6CC2;color:#fff' : '#FFE7A8;color:#4A3500') + (i === R[k].risk ? ';box-shadow:inset 0 0 0 3px #B42318' : '') + '">' + w + '</td>'; }).join('') + '</tr>';
    });
    return t + '</table></div></div>';
  }
  function draw() { root.innerHTML = view(); }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]'); if (!b) return;
    e.preventDefault(); cur = b.getAttribute('data-k'); draw();
    try { history.replaceState(null, '', '#' + cur); } catch (er) { }
    if (b.tagName === 'A') root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  draw();
})();
