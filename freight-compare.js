/* YAM Logistics: LCL vs FCL and sea vs air comparison. You enter the quotes; the tool does the maths. Runs on the device. */
(function () {
  var root = document.getElementById('fc-root'); if (!root) return;
  var KEY = 'ck_fc_v1', D = document, S = { tab: 'lf', v: {} };
  try { var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.v) S = j; } catch (e) {}
  var CT = { '20GP': [33.2, 28200], '40GP': [67.7, 26700], '40HC': [76.3, 26600], '45HC': [86.0, 25700] };
  var css = D.createElement('style');
  css.textContent = '.fc-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:24px;margin-bottom:16px}.fc-h{font-family:Archivo,sans-serif;font-weight:800;font-size:21px;margin:0 0 4px;color:#0B2A4A}.fc-s{font-size:14px;color:#5E7891;margin:0 0 14px;line-height:1.5}' +
    '.fc-g{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fc-g .w{grid-column:1/-1}@media(max-width:560px){.fc-g{grid-template-columns:1fr}}.fc-l{font-size:13px;font-weight:600;color:#3D5873;margin:0 0 6px;display:block}.fc-hint{font-size:12px;color:#5E7891;margin-top:5px;line-height:1.4}' +
    '.fc-in{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid #C9DCEC;border-radius:14px;font:inherit;font-size:16px;color:#0B2A4A;background:#fff}.fc-in:focus{outline:2px solid #0A6CC2;border-color:#0A6CC2}' +
    '.fc-tabs{display:flex;gap:6px;background:#EEF6FD;border-radius:999px;padding:4px;margin:0 0 16px;width:fit-content;max-width:100%;flex-wrap:wrap}.fc-tabs button{border:0;border-radius:999px;padding:10px 18px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;background:transparent;color:#3D5873}.fc-tabs button.on{background:#0A6CC2;color:#fff}' +
    '.fc-big{background:#0A6CC2;color:#fff;border-radius:20px;padding:18px 20px;margin-bottom:12px;line-height:1.5}.fc-big b{display:block;font-family:Archivo,sans-serif;font-size:26px;margin:2px 0}.fc-t{width:100%;border-collapse:collapse;margin-top:6px}.fc-t td{padding:10px 8px;border-bottom:1px solid #EEF4FA;font-size:15px;color:#0B2A4A}.fc-t td:last-child{text-align:right;font-weight:700}.fc-t .hl td{background:#F7FBFF}' +
    '.fc-win{background:#E9FBF0;color:#0F7A3D}.fc-note{font-size:13px;line-height:1.55;color:#3D5873;background:#F7FBFF;border-left:4px solid #0A6CC2;border-radius:10px;padding:10px 14px;margin-top:10px}.fc-leg{font-size:12.5px;color:#5E7891;line-height:1.55;margin-top:12px}.fc-empty{color:#5E7891;text-align:center;padding:24px 8px;line-height:1.6}';
  D.head.appendChild(css);
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function n(id) { var v = parseFloat(String(S.v[id] == null ? '' : S.v[id]).replace(/,/g, '')); return isNaN(v) || v < 0 ? 0 : v; }
  function f(x, d) { return x.toLocaleString('en-US', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function inp(id, label, ph, hint, cls) { return '<div' + (cls ? ' class="' + cls + '"' : '') + '><label class="fc-l" for="v_' + id + '">' + label + '</label><input class="fc-in" id="v_' + id + '" data-v="' + id + '" inputmode="decimal" placeholder="' + (ph || '') + '" value="' + h(S.v[id] || '') + '">' + (hint ? '<div class="fc-hint">' + hint + '</div>' : '') + '</div>'; }
  function cur() { return (S.v.cur || 'USD').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'USD'; }

  root.innerHTML = '<div class="fc-tabs" id="fc-tabs"><button data-t="lf">LCL or FCL</button><button data-t="sa">Sea or air</button></div><div class="fc-card" id="fc-in"></div><div class="fc-card" id="fc-out"></div>' +
    '<div class="fc-leg">Results use only the figures you enter. Rates change daily, so use a current quote from your forwarder. Estimates for guidance only, not a quotation.</div>';
  var last = null;
  function inputs() {
    var c = cur(), H;
    if (S.tab === 'lf') {
      H = '<h2 class="fc-h">Your cargo and your two quotes</h2><p class="fc-s">Ask for both an LCL and an FCL quote for the same route, then enter them here. Leave the extras empty if the quote is all-in.</p><div class="fc-g">' +
        inp('cbm', 'Cargo volume (CBM)', 'e.g. 14') + inp('kg', 'Cargo weight (kg)', 'e.g. 6500') +
        '<div><label class="fc-l" for="v_ct">Container for the FCL quote</label><select class="fc-in" id="v_ct" data-v="ct">' + Object.keys(CT).map(function (k) { return '<option' + ((S.v.ct || '40HC') === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></div>' + inp('cur', 'Currency of your quotes', 'USD') +
        inp('lr', 'LCL rate per W/M (' + c + ')', 'per CBM or per tonne, whichever is higher', 'W/M means weight or measure: 1 tonne or 1 CBM, whichever is greater.', 'w') + inp('fr', 'FCL rate per container (' + c + ')', 'ocean freight for one box') +
        inp('le', 'Extra LCL charges (' + c + ')', 'CFS, handling, per shipment') + inp('fe', 'Extra FCL charges per container (' + c + ')', 'stuffing, seal, haulage') + inp('uf', 'Usable container volume (%)', '90', 'Boxes are rarely packed to 100% of nominal volume. 85 to 90 is common.') + '</div>';
    } else {
      H = '<h2 class="fc-h">Your cargo and your two quotes</h2><p class="fc-s">Enter the sea and air quotes for the same route. The time cost of money tied up in goods at sea is included.</p><div class="fc-g">' +
        inp('cbm', 'Cargo volume (CBM)', 'e.g. 3') + inp('kg', 'Gross weight (kg)', 'e.g. 800') + inp('val', 'Goods value (' + c + ')', 'invoice value') + inp('cur', 'Currency of your quotes', 'USD') +
        inp('sr', 'Sea LCL rate per W/M (' + c + ')', '', '1 tonne or 1 CBM, whichever is greater.') + inp('ar', 'Air rate per chargeable kg (' + c + ')', '') +
        inp('se', 'Extra sea charges (' + c + ')', 'CFS, handling') + inp('ae', 'Extra air charges (' + c + ')', 'screening, handling') + inp('sd', 'Sea door to door days', 'e.g. 35') + inp('ad', 'Air door to door days', 'e.g. 7') +
        inp('cc', 'Your cost of money (% a year)', '12', 'Interest, or the return you could earn on the cash tied up in the goods.', 'w') + '</div>';
    }
    el('fc-in').innerHTML = H;
    [].forEach.call(D.querySelectorAll('#fc-tabs button'), function (b) { b.classList.toggle('on', b.dataset.t === S.tab); });
  }
  function el(i) { return D.getElementById(i); }
  function row(a, b, cls) { return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + a + '</td><td>' + b + '</td></tr>'; }
  function calc() {
    var c = cur(), L = [], H = '';
    if (S.tab === 'lf') {
      var cbm = n('cbm'), kg = n('kg'), lr = n('lr'), fr = n('fr');
      if (!(cbm > 0 && lr > 0 && fr > 0)) { el('fc-out').innerHTML = '<div class="fc-empty">Enter the volume, the LCL rate and the FCL rate to compare.</div>'; last = null; return; }
      var ct = S.v.ct || '40HC', cap = CT[ct], uf = (n('uf') || 90) / 100, le = n('le'), fe = n('fe');
      var wm = Math.max(cbm, kg / 1000), lcl = wm * lr + le;
      var boxes = Math.max(1, Math.ceil(Math.max(cbm / (cap[0] * uf), kg / cap[1]) - 1e-9)), fcl = boxes * (fr + fe);
      var be = lr > 0 ? ((fr + fe) - le) / lr : 0, cheap = lcl <= fcl ? 'LCL' : 'FCL', diff = Math.abs(lcl - fcl), win = Math.min(lcl, fcl);
      H += '<div class="fc-big"><span style="font-size:13px;opacity:.9">CHEAPER FOR THIS CARGO</span><b>' + cheap + ' by ' + c + ' ' + f(diff, 0) + '</b>' + (cheap === 'LCL' ? 'LCL ' + c + ' ' + f(lcl, 0) + ' against FCL ' + c + ' ' + f(fcl, 0) : 'FCL ' + c + ' ' + f(fcl, 0) + ' against LCL ' + c + ' ' + f(lcl, 0)) + '</div>';
      H += '<table class="fc-t">' + row('LCL chargeable (W/M)', f(wm, 2) + (kg / 1000 > cbm ? ' (weight)' : ' (volume)')) + row('LCL total', c + ' ' + f(lcl, 0), cheap === 'LCL' ? 'hl' : '') + row('LCL cost per CBM', c + ' ' + f(lcl / cbm, 2)) +
        row('Containers needed (' + ct + ')', boxes + ' · ' + f(cbm / (boxes * cap[0]) * 100, 0) + '% of the volume used') + row('FCL total', c + ' ' + f(fcl, 0), cheap === 'FCL' ? 'hl' : '') + row('FCL cost per CBM', c + ' ' + f(fcl / cbm, 2)) +
        (boxes === 1 && be > 0 ? row('Break-even for one ' + ct, f(be, 1) + ' W/M') : '') + '</table>';
      if (boxes === 1 && be > 0) H += '<div class="fc-note">' + (wm >= be ? 'Your cargo is above the break-even of ' + f(be, 1) + ' W/M, so a full container costs less than paying LCL.' : 'Your cargo is below the break-even of ' + f(be, 1) + ' W/M, so LCL costs less than booking a whole container.') + ' Cargo that fills about ' + f(be / (cap[0] * uf) * 100, 0) + '% of the box is the point where FCL starts to win.</div>';
      H += '<div class="fc-note"><b>Not only price.</b> LCL goes through a consolidation and a deconsolidation warehouse, which usually adds days and more handling. FCL is sealed at your door, which suits fragile, valuable or time-sensitive goods.</div>';
      L = ['LCL or FCL, ' + ct + ' container', 'Cargo: ' + f(cbm, 2) + ' CBM, ' + f(kg, 0) + ' kg', 'LCL: ' + f(wm, 2) + ' W/M x ' + c + ' ' + f(lr, 2) + (le ? ' + ' + f(le, 0) + ' extras' : '') + ' = ' + c + ' ' + f(lcl, 0), 'FCL: ' + boxes + ' x ' + c + ' ' + f(fr + fe, 0) + ' = ' + c + ' ' + f(fcl, 0), 'Cheaper: ' + cheap + ' by ' + c + ' ' + f(diff, 0)];
      if (boxes === 1 && be > 0) L.push('Break-even for one ' + ct + ': ' + f(be, 1) + ' W/M');
      last = { title: 'LCL or FCL: ' + cheap + ' is cheaper', lines: L.concat(['Estimate from the quotes entered. Check with a forwarder.']) };
    } else {
      var cb = n('cbm'), kg2 = n('kg'), val = n('val'), sr = n('sr'), ar = n('ar');
      if (!(cb > 0 && kg2 > 0 && sr > 0 && ar > 0)) { el('fc-out').innerHTML = '<div class="fc-empty">Enter the volume, the weight and both rates to compare.</div>'; last = null; return; }
      var se = n('se'), ae = n('ae'), sd = n('sd'), ad = n('ad'), cc = (S.v.cc === '' || S.v.cc == null ? 12 : n('cc')) / 100;
      var wm2 = Math.max(cb, kg2 / 1000), vol = cb * 167, ck = Math.max(kg2, vol), sea = wm2 * sr + se, air = ck * ar + ae;
      var extra = Math.max(0, sd - ad), carry = val * cc * extra / 365, seaAll = sea + carry, cheap2 = seaAll <= air ? 'Sea' : 'Air', diff2 = Math.abs(seaAll - air);
      H += '<div class="fc-big"><span style="font-size:13px;opacity:.9">CHEAPER OVERALL</span><b>' + cheap2 + ' by ' + c + ' ' + f(diff2, 0) + '</b>Air costs ' + f(air / Math.max(sea, 1e-9), 1) + ' times the sea freight</div>';
      H += '<table class="fc-t">' + row('Sea chargeable (W/M)', f(wm2, 2)) + row('Sea freight total', c + ' ' + f(sea, 0)) + (val > 0 && extra > 0 ? row('Cost of money for ' + extra + ' extra days at sea', c + ' ' + f(carry, 0)) : '') + row('Sea total including time cost', c + ' ' + f(seaAll, 0), cheap2 === 'Sea' ? 'hl' : '') +
        row('Air chargeable weight', f(ck, 0) + ' kg (' + (vol > kg2 ? 'volume, 167 kg per CBM' : 'actual weight') + ')') + row('Air total', c + ' ' + f(air, 0), cheap2 === 'Air' ? 'hl' : '') + '</table>';
      if (extra > 0 && air > sea) H += '<div class="fc-note">Air only pays off if getting the goods ' + extra + ' days sooner is worth at least <b>' + c + ' ' + f((air - sea) / extra, 0) + ' a day</b> to you in sales, avoided stock-outs or penalties.</div>';
      H += '<div class="fc-note"><b>Rule of thumb.</b> Air freight is charged on the higher of actual weight and volume, with 1 CBM counted as 167 kg. Sea is charged on 1 tonne or 1 CBM, whichever is greater. Light, bulky cargo is hit hardest by air.</div>';
      L = ['Sea or air', 'Cargo: ' + f(cb, 2) + ' CBM, ' + f(kg2, 0) + ' kg' + (val ? ', value ' + c + ' ' + f(val, 0) : ''), 'Sea: ' + f(wm2, 2) + ' W/M = ' + c + ' ' + f(sea, 0) + (carry ? ' + time cost ' + f(carry, 0) : ''), 'Air: ' + f(ck, 0) + ' kg = ' + c + ' ' + f(air, 0), 'Cheaper overall: ' + cheap2 + ' by ' + c + ' ' + f(diff2, 0)];
      last = { title: 'Sea or air: ' + cheap2 + ' is cheaper', lines: L.concat(['Estimate from the quotes entered. Check with a forwarder.']) };
    }
    H += '<div style="margin-top:14px"><a class="fc-btn" href="https://wa.me/message/6YB7I76DV6UJL1" target="_blank" rel="noopener" style="display:inline-block;background:#25D366;color:#073B1B;border-radius:999px;padding:12px 20px;font-weight:700;text-decoration:none">Get a live quote from YAM on WhatsApp</a></div>';
    el('fc-out').innerHTML = H;
  }
  function all() { inputs(); calc(); }
  el('fc-tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (b) { S.tab = b.dataset.t; save(); all(); } });
  root.addEventListener('input', function (e) { var k = e.target.dataset.v; if (!k) return; S.v[k] = e.target.value; save(); if (k === 'cur') { /* labels use the code; refresh without losing focus */ calc(); } else calc(); });
  root.addEventListener('change', function (e) { var k = e.target.dataset.v; if (k === 'ct') { S.v.ct = e.target.value; save(); calc(); } if (k === 'cur') { inputsKeep(); } });
  function inputsKeep() { var a = D.activeElement && D.activeElement.id; inputs(); calc(); if (a && el(a)) el(a).focus(); }
  window.CK_FC = function () { return last; };
  all();
})();
