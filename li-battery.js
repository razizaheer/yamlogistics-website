/* YAM Logistics — lithium battery air shipping checker (IATA DGR packing instructions 965–970) */
(function () {
  var root = document.getElementById('li-root'); if (!root) return;
  var css = '.li-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:28px}.li-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}.li-l{display:block;font-weight:600;font-size:14px;margin-bottom:8px}.li-l small{font-weight:400;color:#5E7891}.li-opts{display:flex;flex-wrap:wrap;gap:8px}.li-o{border:1px solid #CFE3F5;background:#F7FBFF;border-radius:12px;padding:10px 14px;font:inherit;font-size:14px;cursor:pointer;color:#0B2A4A}.li-o.on{background:#0A6CC2;border-color:#0A6CC2;color:#fff}.li-in{width:100%;box-sizing:border-box;font:inherit;font-size:18px;padding:12px 14px;border:2px solid #CFE3F5;border-radius:12px;outline:none}.li-in:focus{border-color:#0A6CC2}.li-chk{display:flex;gap:8px;align-items:flex-start;font-size:14px;color:#3D5873;margin-top:4px}.li-res{margin-top:22px}.li-top{border-radius:20px;padding:22px 24px;color:#fff}.li-top .k{font-family:"Geist Mono",monospace;font-size:12px;letter-spacing:.1em;opacity:.85}.li-top h3{font-family:Archivo,sans-serif;font-weight:900;font-size:30px;margin:6px 0 4px;line-height:1.1}.li-top p{margin:0;font-size:15px;opacity:.92}.li-pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.li-pills span{background:rgba(255,255,255,.18);border-radius:999px;padding:6px 12px;font-size:13px;font-weight:600}.li-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-top:14px}.li-box{background:#F7FBFF;border-radius:16px;padding:18px 20px}.li-box h4{margin:0 0 10px;font-size:15px}.li-box ul{margin:0;padding-left:18px;font-size:14.5px;line-height:1.6;color:#17436B}.li-labs{display:flex;flex-wrap:wrap;gap:12px;margin-top:6px}.li-labs a{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;color:#3D5873;text-decoration:none;width:120px;text-align:center}.li-labs img{width:96px;height:96px;object-fit:contain;background:#fff;border:1px solid #E1EDF7;border-radius:10px;padding:4px}.li-warn{background:#FEF3F2;color:#B42318;border-radius:14px;padding:14px 16px;font-size:14px;line-height:1.55;margin-top:14px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var S = { chem: 'ion', cfg: 'contained', unit: 'battery', rating: '', qty: '1', kg: '', dmg: false };
  function h(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function opts(key, list) { return '<div class="li-opts">' + list.map(function (o) { return '<button type="button" class="li-o' + (S[key] === o[0] ? ' on' : '') + '" data-k="' + key + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
  function form() {
    var ion = S.chem === 'ion';
    return '<div class="li-card"><div class="li-g">' +
      '<div><span class="li-l">1. Battery chemistry</span>' + opts('chem', [['ion', 'Lithium ion (rechargeable)'], ['metal', 'Lithium metal (non-rechargeable)']]) + '</div>' +
      '<div><span class="li-l">2. How is it shipped?</span>' + opts('cfg', [['alone', 'Batteries on their own'], ['packed', 'Packed with equipment'], ['contained', 'Inside the equipment']]) + '</div>' +
      '<div><span class="li-l">3. Cell or battery?</span>' + opts('unit', [['cell', 'Single cell'], ['battery', 'Battery (pack of cells)']]) + '</div>' +
      '<div><label class="li-l" for="li-r">4. ' + (ion ? 'Watt-hour rating per ' + S.unit + ' <small>(Wh, printed on the ' + S.unit + ')</small>' : 'Lithium content per ' + S.unit + ' <small>(grams)</small>') + '</label><input id="li-r" class="li-in" inputmode="decimal" placeholder="' + (ion ? 'e.g. 18.5' : 'e.g. 0.7') + '" value="' + h(S.rating) + '"><div style="font-size:12px;color:#5E7891;margin-top:6px">' + (ion ? 'Only mAh and volts? Wh = mAh ÷ 1000 × V. Example: 5,000 mAh at 3.85 V = 19.25 Wh.' : 'Ask your supplier or see the UN 38.3 test summary.') + '</div></div>' +
      '<div><label class="li-l" for="li-q">5. ' + (S.unit === 'cell' ? 'Cells' : 'Batteries') + ' per package</label><input id="li-q" class="li-in" inputmode="numeric" value="' + h(S.qty) + '"></div>' +
      '<div><label class="li-l" for="li-w">6. Net weight of lithium ' + (S.unit === 'cell' ? 'cells' : 'batteries') + ' per package <small>(kg, batteries only, not the equipment)</small></label><input id="li-w" class="li-in" inputmode="decimal" placeholder="e.g. 0.4" value="' + h(S.kg) + '"></div>' +
      '</div><label class="li-chk"><input type="checkbox" id="li-d"' + (S.dmg ? ' checked' : '') + '> The batteries are damaged, defective or recalled</label></div><div class="li-res" id="li-res"></div>';
  }
  var LAB = { m3480: ['battery-mark-un3480.png', 'Lithium battery mark (UN3480)'], m3481: ['battery-mark-un3481.png', 'Lithium battery mark (UN3481)'], m3090: ['battery-mark-un3090.png', 'Lithium battery mark (UN3090)'], m3091: ['battery-mark-un3091.png', 'Lithium battery mark (UN3091)'], c9a: ['class-9a-lithium.png', 'Class 9 lithium battery hazard label'], cao: ['cargo-aircraft-only.png', 'Cargo Aircraft Only label'] };
  function labels(list) { return '<div class="li-labs">' + list.map(function (k) { var l = LAB[k]; return '<a href="dg-labels.html" title="Download free from our DG labels library"><img src="labels/preview/' + l[0] + '" alt="' + h(l[1]) + '" loading="lazy">' + h(l[1]) + '</a>'; }).join('') + '</div><div style="font-size:12px;color:#5E7891;margin-top:8px">Download these labels free from our <a href="dg-labels.html">DG labels library</a>.</div>'; }
  function calc() {
    var out = document.getElementById('li-res'); if (!out) return;
    var ion = S.chem === 'ion', cell = S.unit === 'cell', r = parseFloat(String(S.rating).replace(',', '.')), q = parseInt(S.qty, 10) || 0, kg = parseFloat(String(S.kg).replace(',', '.'));
    if (S.dmg) { out.innerHTML = '<div class="li-top" style="background:#B42318"><div class="k">FORBIDDEN BY AIR</div><h3>Damaged or defective lithium batteries cannot fly.</h3><p>Batteries identified as damaged, defective or recalled for safety reasons are forbidden on passenger and cargo aircraft. They may move by sea or road under special provisions. Talk to us before you pack them.</p></div>'; return; }
    if (!(r > 0)) { out.innerHTML = '<div class="li-box" style="text-align:center;color:#5E7891">Enter the ' + (ion ? 'watt-hour rating' : 'lithium content') + ' to see the result.</div>'; return; }
    var un = ion ? (S.cfg === 'alone' ? 'UN3480' : 'UN3481') : (S.cfg === 'alone' ? 'UN3090' : 'UN3091');
    var pi = (ion ? 965 : 968) + (S.cfg === 'alone' ? 0 : S.cfg === 'packed' ? 1 : 2);
    var psn = (ion ? 'Lithium ion ' : 'Lithium metal ') + (S.cfg === 'alone' ? 'batteries' : 'batteries ' + (S.cfg === 'packed' ? 'packed with' : 'contained in') + ' equipment');
    var small = ion ? (cell ? r <= 20 : r <= 100) : (cell ? r <= 1 : r <= 2);
    var tiny = ion ? r <= 2.7 : r <= 0.3; // PI 965/968 Section II weight-limited category
    var sec, pax, kgMax, col, req = [], docs = [], labs = [], notes = [];
    var mark = { UN3480: 'm3480', UN3481: 'm3481', UN3090: 'm3090', UN3091: 'm3091' }[un];
    if (S.cfg === 'alone') {
      pax = false;
      if (!small) { sec = 'Section IA'; kgMax = 35; }
      else {
        var ok2 = tiny ? (!(kg > 2.5)) : (cell ? q <= 8 : q <= 2);
        if (ok2) { sec = 'Section II'; kgMax = tiny ? 2.5 : null; }
        else { sec = 'Section IB'; kgMax = 10; }
      }
    } else {
      pax = true;
      if (small && !(kg > 5)) { sec = 'Section II'; kgMax = 5; }
      else { sec = 'Section I'; kgMax = null; }
    }
    var full = sec !== 'Section II';
    // requirements
    if (full) {
      docs.push('Shipper’s Declaration for Dangerous Goods (DGD), signed by a DG-trained person');
      docs.push('Air waybill nature of goods referring to the DGD; the airline must accept the shipment as dangerous goods');
      labs.push('c9a'); labs.push(mark);
      req.push('Class 9 dangerous goods: UN specification packaging (Packing Group II performance)');
    } else {
      docs.push('No Shipper’s Declaration needed');
      docs.push('Air waybill statement: “' + psn + ' in compliance with Section II of PI ' + pi + '”');
      labs.push(mark);
      if (S.cfg !== 'contained') req.push('Strong rigid outer packaging that passes a 1.2 m drop test without damage to the batteries');
    }
    if (pi === 965 || pi === 968) { labs.push('cao'); req.push('Forbidden on passenger aircraft: cargo aircraft only'); }
    if (S.cfg === 'alone') {
      if (sec === 'Section IA') req.push('Maximum 35 kg net of batteries per package (cargo aircraft)');
      if (sec === 'Section IB') req.push('Maximum 10 kg gross per package');
      if (sec === 'Section II') { req.push(tiny ? 'Maximum 2.5 kg of ' + (cell ? 'cells' : 'batteries') + ' per package' : 'Maximum ' + (cell ? '8 cells' : '2 batteries') + ' per package'); req.push('Only one Section II package per consignment, and no more than one per overpack'); }
    } else if (sec === 'Section II') {
      req.push('Maximum 5 kg net of lithium ' + (ion ? 'ion' : 'metal') + ' batteries per package');
      if (S.cfg === 'packed') req.push('No more batteries than needed to power the equipment, plus two spare sets');
      if (S.cfg === 'contained') req.push('Equipment protected against accidental activation and packed in strong outer packaging');
    } else {
      req.push('Maximum 5 kg net of batteries per package on passenger aircraft, 35 kg on cargo aircraft');
      if (kg > 5) { labs.push('cao'); req.push('Above 5 kg per package: cargo aircraft only'); }
    }
    if (pi === 965) req.push('State of charge must not exceed 30% of rated capacity');
    if (pi === 966 && r > 2.7) req.push('From 1 January 2026, state of charge must not exceed 30% (batteries above 2.7 Wh)');
    if (pi === 967) notes.push('IATA recommends shipping at 30% state of charge or less, and some airlines require it.');
    if (S.cfg === 'contained' && sec === 'Section II' && ((cell && q <= 4) || (!cell && q <= 2))) { notes.push('With no more than 4 cells or 2 batteries installed per package, and no more than 2 packages in the consignment, the lithium battery mark is not required.'); }
    req.push('Every cell and battery type must have passed UN 38.3 testing: keep the test summary ready, as airlines and customs ask for it');
    req.push('Terminals protected against short circuit; batteries secured against movement');
    if (!ion && S.cfg !== 'alone') notes.push('Lithium metal batteries in equipment are restricted by many airlines (operator variations). Check before booking.');
    col = full ? '#B45309' : '#0F7B3F';
    var head = '<div class="li-top" style="background:' + col + '"><div class="k">' + (full ? 'FULLY REGULATED DANGEROUS GOODS' : 'SECTION II: LIGHTER RULES, NO DG DECLARATION') + '</div><h3>' + un + ' · PI ' + pi + ' · ' + sec + '</h3><p>' + h(psn) + '</p><div class="li-pills"><span>' + (pax ? (kg > 5 && full ? 'Cargo aircraft only' : 'Passenger & cargo aircraft') : 'Cargo aircraft only') + '</span><span>Class 9</span>' + (kgMax ? '<span>Max ' + kgMax + ' kg per package</span>' : '') + '</div></div>';
    var body = '<div class="li-cols"><div class="li-box"><h4>What you must do</h4><ul>' + req.map(function (x) { return '<li>' + h(x) + '</li>'; }).join('') + '</ul></div><div class="li-box"><h4>Documents</h4><ul>' + docs.map(function (x) { return '<li>' + h(x) + '</li>'; }).join('') + '<li>Commercial invoice and packing list stating the battery type, Wh rating or lithium content, and quantity</li></ul></div><div class="li-box"><h4>Labels & marks</h4>' + labels(labs.filter(function (v, i, a) { return a.indexOf(v) === i; })) + '</div></div>';
    var n = notes.length ? '<div class="li-box" style="margin-top:14px;background:#FFF8E6"><h4>Good to know</h4><ul>' + notes.map(function (x) { return '<li>' + h(x) + '</li>'; }).join('') + '</ul></div>' : '';
    var cta = '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:18px"><a target="_blank" rel="noopener" href="https://wa.me/YAMLOGISTICS?text=' + encodeURIComponent('Hello YAM, I need to air-ship ' + un + ' PI ' + pi + ' ' + sec + ' (' + r + (ion ? ' Wh' : ' g') + ').') + '" style="background:#25D366;color:#06331A;border-radius:999px;padding:12px 20px;font-weight:600;text-decoration:none">Book it with our DG desk</a><a href="dangerous-goods.html" style="background:#0A6CC2;color:#fff;border-radius:999px;padding:12px 20px;font-weight:600;text-decoration:none">Dangerous goods services →</a></div>';
    out.innerHTML = head + body + n + '<div class="li-warn">Guidance only, based on the IATA Dangerous Goods Regulations (2026 edition) for air cargo. Airline and state variations can be stricter, and courier and passenger baggage rules are different. YAM’s DG-certified staff confirm every lithium battery shipment before booking.</div>' + cta;
  }
  function draw() { root.innerHTML = form(); calc(); }
  root.addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (!b) return; S[b.getAttribute('data-k')] = b.getAttribute('data-v'); draw(); });
  root.addEventListener('input', function (e) { var id = e.target.id; if (id === 'li-r') S.rating = e.target.value; else if (id === 'li-q') S.qty = e.target.value; else if (id === 'li-w') S.kg = e.target.value; else return; calc(); });
  root.addEventListener('change', function (e) { if (e.target.id === 'li-d') { S.dmg = e.target.checked; calc(); } });
  draw();
})();
