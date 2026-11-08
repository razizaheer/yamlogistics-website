/* YAM Logistics: landed cost wizard (India imports). Builds on duty-calc.js (window.YAM_DC_LAST). Runs on the device. */
(function () {
  var root = document.getElementById('lc-s2'), res = document.getElementById('lc-s3');
  if (!root || !res) return;
  var css = document.createElement('style');
  css.textContent = '#dc-out{display:none!important}#lc-wrap .dc{grid-template-columns:1fr!important}#lc-wrap .dc-card{box-shadow:none}' +
    '.lc-steps{display:flex;gap:8px;margin:0 0 18px;padding:0;list-style:none;flex-wrap:wrap}.lc-steps li{display:flex;align-items:center;gap:8px;background:#EEF6FD;color:#3D5873;border-radius:999px;padding:7px 14px 7px 8px;font-size:13px;font-weight:600}' +
    '.lc-steps li b{width:22px;height:22px;border-radius:50%;background:#C9DCEC;color:#0B2A4A;display:inline-flex;align-items:center;justify-content:center;font-size:12px}.lc-steps li.on{background:#0A6CC2;color:#fff}.lc-steps li.on b{background:#FFC93C}' +
    '.lc-h{font-family:Archivo,sans-serif;font-weight:800;font-size:22px;margin:0 0 4px;color:#0B2A4A}.lc-sub{font-size:14px;color:#5E7891;margin:0 0 14px;line-height:1.5}' +
    '.lc-sec{margin-top:22px}.lc-inr{position:relative}.lc-inr span{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#5E7891;font-weight:600;pointer-events:none}.lc-inr input{padding-left:30px!important}' +
    '.lc-chk{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.5;color:#17436B;margin-top:16px;cursor:pointer}.lc-chk input{width:20px;height:20px;flex:none;margin-top:1px}' +
    '.lc-btn{border:0;border-radius:999px;padding:13px 20px;font:inherit;font-weight:700;cursor:pointer;font-size:15px}.lc-wa{background:#25D366;color:#073B1B}.lc-ln{background:#EEF6FD;color:#0B2A4A}' +
    '.lc-sum td:first-child{color:#0B2A4A}.lc-sub2 td{background:#F7FBFF;font-weight:700}.lc-cr td{color:#0F7A3D}';
  document.head.appendChild(css);

  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function inr2(n) { return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function pct(n) { return (Math.round(n * 10) / 10) + '%'; }
  function fld(id, label, ph, hint) {
    return '<div><label class="dc-l" for="' + id + '">' + label + '</label><div class="lc-inr"><span>₹</span><input id="' + id + '" class="dc-in" inputmode="decimal" placeholder="' + ph + '"></div>' + (hint ? '<div style="font-size:12px;color:#5E7891;margin-top:5px;line-height:1.4">' + hint + '</div>' : '') + '</div>';
  }
  root.innerHTML = '<div class="dc-card"><h2 class="lc-h">2. Quantity and costs in India</h2><p class="lc-sub">Add what you pay after the cargo reaches the Indian port. Leave a box empty if it does not apply. Ask your broker or forwarder for the real figures.</p>' +
    '<div class="dc-row" style="margin-top:0"><div><label class="dc-l" for="lc-q">Quantity (units in this shipment)</label><input id="lc-q" class="dc-in" inputmode="decimal" placeholder="e.g. 1000"></div>' +
    fld('lc-sp', 'Your selling price per unit (optional)', 'to see your margin') + '</div>' +
    '<div class="dc-row">' + fld('lc-port', 'Port, terminal and shipping line charges', 'THC, delivery order, CFS', 'Terminal handling, DO, CFS or ICD, detention if any') +
    fld('lc-cha', 'Customs clearance and documentation', 'broker fee, filing', '') + '</div>' +
    '<div class="dc-row">' + fld('lc-inl', 'Transport to your warehouse', 'truck, rail', '') + fld('lc-oth', 'Other costs', 'inspection, testing, insurance top-up', '') + '</div>' +
    '<label class="lc-chk"><input type="checkbox" id="lc-itc" checked><span>My business can claim <b>IGST as input tax credit</b>. Show the net cost after the credit.</span></label></div>';
  res.innerHTML = '<div class="dc-card" id="lc-out"></div>';
  var out = document.getElementById('lc-out');
  function el(i) { return document.getElementById(i); }
  function num(i) { var n = parseFloat(String(el(i).value).replace(/,/g, '')); return isNaN(n) || n < 0 ? 0 : n; }

  var last = null;
  function calc() {
    var d = window.YAM_DC_LAST;
    if (!d) {
      last = null;
      out.innerHTML = '<h2 class="lc-h">3. Your landed cost</h2><div class="dc-empty">Pick your goods, the country of origin and the invoice value in step 1 (and tick the guidance box). Your landed cost appears here.</div>';
      mark(1); return;
    }
    var q = num('lc-q'), sp = num('lc-sp'), port = num('lc-port'), cha = num('lc-cha'), inl = num('lc-inl'), oth = num('lc-oth');
    var itc = el('lc-itc').checked, local = port + cha + inl + oth;
    var dutyOnly = d.bcd + d.sws + d.aidc;                      // duty that is a real cost (not creditable)
    var gross = d.cif + dutyOnly + d.igst + local;               // everything paid
    var net = gross - (itc ? d.igst : 0);                        // true cost if IGST is claimed back
    var cost = itc ? net : gross, per = q > 0 ? cost / q : 0;
    var rows = [], L = [];
    function row(a, b, cls, sub) { rows.push('<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + a + (sub ? ' <span class="s">' + sub + '</span>' : '') + '</td><td>' + b + '</td></tr>'); }
    var tl = { FOB: 'FOB', CNF: 'C&amp;F', CIF: 'CIF' }[d.terms] || d.terms;
    if (d.terms === 'FOB') {
      row('FOB value', inr(d.val), '', d.cur !== 'INR' ? d.cur + ' × ' + d.rate : '');
      row('Sea or air freight', inr(d.fr), '', d.frDef ? '20% of FOB, customs default' : 'as entered');
      row('Insurance', inr(d.ins), '', d.insDef ? '1.125%, customs default' : 'as entered');
    } else if (d.terms === 'CNF') {
      row('C&amp;F value', inr(d.val), '', d.cur !== 'INR' ? d.cur + ' × ' + d.rate : '');
      row('Insurance', inr(d.ins), '', d.insDef ? '1.125%, customs default' : 'as entered');
    }
    row('CIF value (assessable value)', inr(d.cif), d.terms === 'CIF' ? '' : 'lc-sub2', d.terms === 'CIF' && d.cur !== 'INR' ? d.cur + ' × ' + d.rate : '');
    row('Basic customs duty', inr(d.bcd), '', d.bcdPct != null ? pct(d.bcdPct) : '');
    row('Social welfare surcharge', inr(d.sws));
    if (d.aidc > 0) row('Agriculture cess (AIDC)', inr(d.aidc));
    row('IGST', d.alco ? '-' : inr(d.igst), '', d.alco ? 'liquor is outside GST' : pct(d.igstPct));
    if (port) row('Port, terminal and line charges', inr(port));
    if (cha) row('Customs clearance and documentation', inr(cha));
    if (inl) row('Transport to your warehouse', inr(inl));
    if (oth) row('Other costs', inr(oth));
    row('Total paid', inr(gross), 'lc-sub2');
    if (itc && d.igst > 0) row('Less IGST input tax credit', '-' + inr(d.igst), 'lc-cr');
    if (itc && d.igst > 0) row('Net landed cost', inr(net), 'lc-sub2');
    var H = '<h2 class="lc-h">3. Your landed cost</h2>';
    H += '<div style="font-size:13px;color:#5E7891;margin-bottom:6px">' + h(d.code.slice(0, 4) + ' ' + d.code.slice(4, 6) + ' ' + d.code.slice(6)) + ' · ' + h(d.name) + ' · ' + h(d.country || 'origin not chosen') + ' · ' + tl + '</div>';
    H += '<div class="dc-big"><span style="font-size:13px;opacity:.85">' + (itc ? 'NET LANDED COST (AFTER IGST CREDIT)' : 'TOTAL LANDED COST') + ' · INDICATIVE</span><b>' + (q > 0 ? inr2(per) + ' <span style="font-size:18px;font-weight:600">per unit</span>' : inr(cost)) + '</b><span style="font-size:14px;opacity:.9">' + (q > 0 ? inr(cost) + ' for ' + q.toLocaleString('en-IN') + ' units · ' : '') + 'duty and IGST are ' + pct(d.cif ? d.tot / d.cif * 100 : 0) + ' of CIF</span></div>';
    if (sp > 0 && q > 0) {
      var m = sp - per, mp = m / sp * 100;
      H += '<div class="dc-note" style="margin-top:0;background:' + (m >= 0 ? '#E9FBF0' : '#FFE3DF') + '"><b>Margin at ' + inr2(sp) + ' per unit:</b> ' + (m >= 0 ? '' : '-') + inr2(Math.abs(m)) + ' per unit (' + pct(mp) + ' of selling price)' + (m < 0 ? '. You would lose money at this price.' : '.') + '</div>';
    }
    H += '<table class="dc-t lc-sum">' + rows.join('') + '</table>';
    if (d.frDef || d.insDef) H += '<div class="dc-x">Freight or insurance uses the customs default, not your real cost. Enter the actual figures in step 1 for a tighter estimate.</div>';
    H += '<div class="dc-x">The exchange rate is the one used in step 1. Your bank rate on the day of payment will differ a little. Duty is on the CBIC rate, not the bank rate.</div>';
    if (d.pol && d.pol !== 'Free') H += '<div class="dc-x" style="border-left-color:#B42318;background:#FFF1EF">DGFT import policy for this code is <b>' + h(d.pol) + '</b>. You may need an authorisation before you import.</div>';
    H += '<div class="dc-cta"><button class="lc-btn lc-wa" id="lc-brk">Ask a licensed broker to check this</button><button class="lc-btn lc-ln" id="lc-cp">Copy summary</button></div>';
    H += '<div class="dc-legal">Indicative estimate for guidance only. It is not a customs assessment or legal advice. Rates change by notification. Please confirm with a licensed customs broker before you commit to a price.</div>';
    out.innerHTML = H;
    // summary for share / save / broker
    L.push('HSN ' + d.code.slice(0, 4) + ' ' + d.code.slice(4, 6) + ' ' + d.code.slice(6) + ': ' + d.name.slice(0, 70));
    L.push('Origin: ' + (d.country || 'not chosen') + ' · Terms: ' + d.terms);
    if (q > 0) L.push('Landed cost per unit: ' + inr2(per) + (itc ? ' (net of IGST credit)' : ''));
    L.push((itc ? 'Net landed cost: ' : 'Total landed cost: ') + inr(cost) + (q > 0 ? ' for ' + q + ' units' : ''));
    L.push('CIF value: ' + inr(d.cif));
    L.push('Basic customs duty: ' + inr(d.bcd));
    L.push('Social welfare surcharge: ' + inr(d.sws));
    if (d.aidc > 0) L.push('Agriculture cess: ' + inr(d.aidc));
    L.push('IGST: ' + (d.alco ? 'n/a' : inr(d.igst) + ' (' + pct(d.igstPct) + ')'));
    if (local) L.push('Costs in India: ' + inr(local));
    if (itc && d.igst > 0) L.push('IGST credit assumed: ' + inr(d.igst));
    if (sp > 0 && q > 0) L.push('Margin at ' + inr2(sp) + ' per unit: ' + inr2(sp - per) + ' (' + pct((sp - per) / sp * 100) + ')');
    L.push('Indicative estimate for guidance only. Verify with Customs and a licensed customs broker.');
    last = { title: 'Landed cost estimate', lines: L };
    el('lc-cp').onclick = function () { copy(L.join('\n'), 'Summary copied'); };
    el('lc-brk').onclick = function () {
      copy('Landed cost check from CargoKit\n' + L.join('\n'), 'Summary copied. Paste it in the WhatsApp chat.');
      setTimeout(function () { window.open('https://wa.me/message/6YB7I76DV6UJL1', '_blank', 'noopener'); }, 400);
    };
    mark(q > 0 || local > 0 ? 3 : 2);
  }
  function copy(t, msg) {
    var done = function () { toast(msg); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { fb(t); done(); }); else { fb(t); done(); }
  }
  function fb(t) { var a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} a.remove(); }
  function toast(m) {
    var t = document.getElementById('lc-toast'); if (!t) { t = document.createElement('div'); t.id = 'lc-toast'; t.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:90px;background:#0B2A4A;color:#fff;padding:12px 18px;border-radius:14px;font-size:14px;z-index:99999;max-width:90%;text-align:center'; document.body.appendChild(t); }
    t.textContent = m; t.style.display = 'block'; clearTimeout(t._h); t._h = setTimeout(function () { t.style.display = 'none'; }, 3200);
  }
  function mark(n) { [].forEach.call(document.querySelectorAll('.lc-steps li'), function (li, i) { li.classList.toggle('on', i + 1 <= n); }); }

  ['lc-q', 'lc-sp', 'lc-port', 'lc-cha', 'lc-inl', 'lc-oth'].forEach(function (i) { el(i).addEventListener('input', calc); });
  el('lc-itc').addEventListener('change', calc);
  document.addEventListener('yam-dc', calc);
  window.CK_LANDED = function () { return last; };
  calc();
})();
