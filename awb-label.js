(function () {
  var root = document.getElementById('al-root');
  if (!root) return;

  // ---------- Code 128 (set C, numeric) ----------
  var C128 = ['212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214', '211232', '2331112'];
  function code128C(digits) {
    var vals = [105], sum = 105;
    for (var i = 0; i < digits.length; i += 2) { var v = +digits.substr(i, 2); vals.push(v); sum += v * (i / 2 + 1); }
    vals.push(sum % 103); vals.push(106);
    return vals.map(function (v) { return C128[v]; }).join(''); // alternating bar/space widths, starting with a bar
  }
  window.__c128 = code128C;

  // ---------- helpers ----------
  function h(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  var D = null, LOGO = null, ALMAP = {};
  // page formats: slots are label areas in mm on the page; cut = dashed cut lines for plain paper
  var IN = 25.4;
  function grid(pw, ph, lw, lh, mx, my, gx, gy) { var s = []; for (var r = 0; r < 2; r++) for (var c = 0; c < 2; c++) s.push([mx + c * (lw + gx), my + r * (lh + gy), lw, lh]); return { w: pw, h: ph, slots: s }; }
  var SIZES = {
    't46': { g: 'Thermal label printer (label roll)', name: '4 × 6 in roll labels (102 × 152 mm)', w: 4 * IN, h: 6 * IN, slots: [[0, 0, 4 * IN, 6 * IN]], tip: 'For Zebra, TSC, Honeywell, Rollo and similar printers with 4 × 6 in labels. One label per page. Print at 100% (actual size), not "fit to page".' },
    't100': { g: 'Thermal label printer (label roll)', name: '100 × 150 mm roll labels', w: 100, h: 150, slots: [[0, 0, 100, 150]], tip: 'For thermal printers with 100 × 150 mm labels. One label per page. Print at 100% (actual size).' },
    'pa4': { g: 'Laser or inkjet printer (plain paper)', name: 'A4 paper, 4 labels per page, cut and tape', cut: true, tip: 'Print on plain A4 paper, cut along the dashed lines and fix each label with clear tape. Print at 100% (actual size). Use normal or best quality, not draft.' },
    'plt': { g: 'Laser or inkjet printer (plain paper)', name: 'US Letter paper, 4 labels per page, cut and tape', cut: true, tip: 'Print on plain Letter paper, cut along the dashed lines and fix each label with clear tape. Print at 100% (actual size).' },
    'sa4': { g: 'Laser or inkjet printer (sticker label sheets)', name: 'A4 sticker sheets, 4 labels of 99.1 × 139 mm (e.g. Avery L7169)', tip: 'Load A4 sheets with 4 self-adhesive labels of 99.1 × 139 mm. Print at 100% (actual size). Test on plain paper first by holding the print against a label sheet.' },
    'slt': { g: 'Laser or inkjet printer (sticker label sheets)', name: 'Letter sticker sheets, 4 labels of 3.5 × 5 in (e.g. Avery 5168)', tip: 'Load Letter sheets with 4 self-adhesive labels of 3.5 × 5 in. Print at 100% (actual size) and test on plain paper first.' }
  };
  (function () {
    var p = grid(210, 297, 105, 148.5, 0, 0, 0, 0); SIZES.pa4.w = p.w; SIZES.pa4.h = p.h; SIZES.pa4.slots = p.slots;
    p = grid(8.5 * IN, 11 * IN, 4.25 * IN, 5.5 * IN, 0, 0, 0, 0); SIZES.plt.w = p.w; SIZES.plt.h = p.h; SIZES.plt.slots = p.slots;
    p = grid(210, 297, 99.1, 139, 4.65, 9.5, 2.5, 0); SIZES.sa4.w = p.w; SIZES.sa4.h = p.h; SIZES.sa4.slots = p.slots;
    p = grid(8.5 * IN, 11 * IN, 3.5 * IN, 5 * IN, 0.5 * IN, 0.5 * IN, 0.5 * IN, 0); SIZES.slt.w = p.w; SIZES.slt.h = p.h; SIZES.slt.slots = p.slots;
  })();

  var css = '<style>' +
    '.al-warn{background:#FFF8E6;border:1px solid #F5D08A;border-radius:16px;padding:14px 18px;font-size:14px;line-height:1.55;color:#4A3200;margin-bottom:16px}.al-warn a{color:#7A3E00;font-weight:600}' +
    '.al{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:20px;align-items:start}@media (max-width:980px){.al{grid-template-columns:1fr}}' +
    '.al-card{background:#FFFFFF;border:1px solid #E1EDF7;border-radius:24px;padding:24px;box-shadow:0 10px 30px -18px rgba(11,42,74,.25)}' +
    '.al-h{font-family:"Archivo",sans-serif;font-weight:800;font-size:18px;margin:0 0 4px;color:#0B2A4A}.al-s{font-size:13px;color:#5E7891;margin:0 0 14px}' +
    '.al-g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 14px;margin-bottom:18px}.al-g3{grid-template-columns:repeat(3,minmax(0,1fr))}@media (max-width:560px){.al-g,.al-g3{grid-template-columns:1fr}}' +
    '.al-f label{display:block;font-weight:600;font-size:13px;margin-bottom:5px;color:#0B2A4A}.al-f label i{font-style:normal;font-weight:400;color:#5E7891}' +
    '.al-in{width:100%;box-sizing:border-box;font:inherit;font-size:15px;padding:11px 12px;border:1.5px solid #C9DCEC;border-radius:12px;outline:none;color:#0B2A4A;background:#FFFFFF}.al-in:focus{border-color:#0A6CC2;box-shadow:0 0 0 3px rgba(10,108,194,.12)}' +
    '.al-row{display:flex;gap:8px}.al-row .al-in{flex:1}.al-row select.al-in{flex:none;width:84px}' +
    '.al-msg{font-size:12.5px;margin-top:5px;line-height:1.4}.al-msg.bad{color:#B42318}.al-msg.ok{color:#0F7B3F}' +
    '.al-sec{font-family:"Geist Mono",monospace;font-size:11px;letter-spacing:.1em;color:#0A6CC2;text-transform:uppercase;margin:6px 0 10px;padding-top:12px;border-top:1px solid #E1EDF7}' +
    '.al-ack{display:flex;gap:10px;align-items:flex-start;background:#FFFBF0;border:1px solid #F5D08A;border-radius:14px;padding:14px 16px;font-size:14px;line-height:1.5;color:#4A3200;margin-top:6px;cursor:pointer}.al-ack input{width:20px;height:20px;flex:none;margin-top:1px;accent-color:#0A6CC2}.al-ack a{color:#7A3E00;font-weight:600}' +
    '.al-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.al-btn{font:inherit;font-weight:600;font-size:15px;border:0;border-radius:999px;padding:13px 22px;cursor:pointer;background:#0A6CC2;color:#FFFFFF}.al-btn.o{background:#FFFFFF;color:#0A6CC2;box-shadow:inset 0 0 0 1.5px #0A6CC2}.al-btn[disabled]{opacity:.45;cursor:not-allowed}' +
    '.al-prev{position:sticky;top:20px}.al-pv{background:#F2F8FD;border-radius:18px;padding:18px;display:flex;justify-content:center}.al-pv svg{width:100%;max-width:340px;height:auto;background:#FFFFFF;box-shadow:0 8px 24px -10px rgba(11,42,74,.35);border-radius:4px}' +
    '.al-nav{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;font-size:14px;color:#3D5873}.al-nav button{font:inherit;border:1px solid #C9DCEC;background:#FFFFFF;border-radius:999px;padding:6px 14px;cursor:pointer;color:#0B2A4A}' +
    '.al-src{font-size:12px;color:#5E7891;margin-top:12px;line-height:1.5}' +
    '.al-up{border:1.5px dashed #9CC3E6;background:#F5FAFE;border-radius:18px;padding:16px 18px;margin:0 0 18px;transition:background .15s,border-color .15s}.al-up.drag{background:#E6F1FB;border-color:#0A6CC2}' +
    '.al-up-t{display:flex;gap:14px;align-items:center;flex-wrap:wrap}.al-up-i{width:44px;height:44px;border-radius:12px;background:#0B2A4A;color:#FFC93C;display:flex;align-items:center;justify-content:center;flex:none;font-size:22px}' +
    '.al-up-x{flex:1;min-width:200px}.al-up-x b{display:block;font-family:"Archivo",sans-serif;font-size:15.5px;color:#0B2A4A}.al-up-x span{font-size:13px;color:#5E7891;line-height:1.45;display:block;margin-top:2px}' +
    '.al-up .al-btn{padding:10px 18px;font-size:14px}.al-bar{height:6px;border-radius:9px;background:#DCEAF6;overflow:hidden;margin-top:12px}.al-bar i{display:block;height:100%;width:0;background:#0A6CC2;transition:width .3s}' +
    '.al-res{display:flex;gap:14px;margin-top:14px;align-items:flex-start}.al-res img{width:92px;flex:none;border:1px solid #C9DCEC;border-radius:6px;background:#fff;cursor:zoom-in}.al-res ul{margin:6px 0 0;padding:0;list-style:none;font-size:13px;line-height:1.6;color:#3D5873}.al-res li b{color:#0B2A4A}' +
    '.al-in.f-ok{border-color:#3FA46A;background:#F3FBF6}.al-in.f-chk{border-color:#E0A11B;background:#FFFAEB}.al-msg.chk{color:#8A5A00}' +
    '</style>';

  var ackd = false; try { ackd = sessionStorage.getItem('al-ack') === '1'; } catch (e) {}
  function fld(id, lab, opt, ph, extra) { return '<div class="al-f"><label for="' + id + '">' + lab + (opt ? ' <i>(optional)</i>' : '') + '</label><input id="' + id + '" class="al-in" placeholder="' + (ph || '') + '" autocomplete="off"' + (extra || '') + '><div class="al-msg" id="' + id + '-m"></div></div>'; }

  root.innerHTML = css +
    '<div class="al-warn" role="note"><b>For guidance only.</b> This tool prints labels in the layout of IATA Resolution 606 from the details you enter. Check them against your air waybill and the airline\'s or handler\'s requirements before use. Dangerous goods need their own marks and labels. YAM Logistics Pvt. Ltd. accepts no legal responsibility for any use of these labels. <a href="#disclaimer">Read the full disclaimer</a>.</div>' +
    '<div class="al"><div class="al-card">' +
    '<div class="al-h">Shipment details</div><p class="al-s">Fields marked optional can be left blank. Everything stays in your browser.</p>' +
    '<div class="al-up" id="al-up"><div class="al-up-t"><div class="al-up-i" aria-hidden="true">⇪</div><div class="al-up-x"><b>Fill in from your air waybill</b><span>Drop a PDF, JPG or PNG of your AWB here. It is read on your own device and never uploaded. You check the details before printing.</span></div>' +
    '<label class="al-btn" for="al-file" style="display:inline-block">Choose file</label><input type="file" id="al-file" accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp" hidden></div>' +
    '<div id="al-upst" style="display:none"><div class="al-msg" id="al-upm" style="color:#3D5873"></div><div class="al-bar"><i id="al-upb"></i></div></div><div id="al-upr"></div></div>' +
    '<div class="al-sec" style="border:0;padding-top:0;margin-top:0">Air waybill (mandatory)</div>' +
    '<div class="al-g">' +
    fld('al-air', 'Airline', 0, 'Type name or prefix, e.g. 176 or Emirates', ' list="al-airl"') +
    fld('al-awb', 'Air waybill number', 0, 'e.g. 176-12345675', ' inputmode="numeric"') +
    fld('al-dst', 'Destination airport', 0, 'e.g. DXB', ' list="al-apl" maxlength="40"') +
    fld('al-org', 'Origin airport', 1, 'e.g. BOM', ' list="al-apl" maxlength="40"') +
    '</div>' +
    '<div class="al-sec">Pieces and weight</div>' +
    '<div class="al-g al-g3">' +
    fld('al-tot', 'Total pieces', 0, 'e.g. 12', ' inputmode="numeric"') +
    fld('al-from', 'Print labels from', 1, '1', ' inputmode="numeric"') +
    fld('al-to', 'Print labels to', 1, 'last piece', ' inputmode="numeric"') +
    '</div><div class="al-g">' +
    '<div class="al-f"><label for="al-tw">Total weight <i>(optional)</i></label><div class="al-row"><input id="al-tw" class="al-in" inputmode="decimal" placeholder="e.g. 480"><select id="al-u" class="al-in"><option>KG</option><option>LB</option></select></div></div>' +
    fld('al-pw', 'Weight of each piece', 1, 'only if all pieces weigh the same', ' inputmode="decimal"') +
    '</div>' +
    '<div class="al-sec">Routing and handling</div>' +
    '<div class="al-g">' +
    fld('al-v1', 'Transfer point 1', 1, 'e.g. DXB', ' list="al-apl" maxlength="40"') +
    fld('al-v2', 'Transfer point 2', 1, '', ' list="al-apl" maxlength="40"') +
    fld('al-hi', 'Handling information', 1, 'e.g. PER, COL, SPX, DO NOT STACK', ' maxlength="48"') +
    fld('al-oi', 'Other information', 1, 'e.g. shipper reference', ' maxlength="48"') +
    '</div>' +
    '<div class="al-sec">House air waybill (for consolidations)</div>' +
    '<div class="al-g al-g3">' +
    fld('al-hw', 'HAWB number', 1, 'e.g. YAM2610001', ' maxlength="20"') +
    fld('al-hp', 'HAWB pieces', 1, '', ' inputmode="numeric"') +
    fld('al-hwt', 'HAWB weight', 1, 'same unit', ' inputmode="decimal"') +
    '</div>' +
    '<div class="al-sec">Print</div>' +
    '<div class="al-f" style="margin-bottom:14px"><label for="al-sz">Printer and label stock</label><select id="al-sz" class="al-in">' + (function () { var gs = {}, o = ''; Object.keys(SIZES).forEach(function (k) { (gs[SIZES[k].g] = gs[SIZES[k].g] || []).push(k); }); Object.keys(gs).forEach(function (g) { o += '<optgroup label="' + g + '">' + gs[g].map(function (k) { return '<option value="' + k + '">' + SIZES[k].name + '</option>'; }).join('') + '</optgroup>'; }); return o; })() + '</select><div class="al-msg" id="al-tip" style="color:#3D5873"></div></div>' +
    '<label class="al-ack"><input type="checkbox" id="al-ack"' + (ackd ? ' checked' : '') + '><span>I will check these labels against my air waybill and the airline\'s requirements. I understand they are provided <b>for guidance only</b> and that YAM Logistics Pvt. Ltd. accepts <b>no liability</b> for their use. I have read the <a href="#disclaimer">disclaimer</a>.</span></label>' +
    '<div class="al-btns"><button class="al-btn" id="al-dl" disabled>Download PDF</button><button class="al-btn o" id="al-pr" disabled>Print</button></div>' +
    '<div class="al-msg" id="al-st"></div>' +
    '</div>' +
    '<div class="al-prev"><div class="al-card"><div class="al-h">Preview</div><p class="al-s" id="al-pvs">Fill in the airline, air waybill number, destination and pieces.</p><div class="al-pv" id="al-pv"></div><div class="al-nav" id="al-nav" style="display:none"><button id="al-prevb">‹ Previous</button><span id="al-pn"></span><button id="al-nextb">Next ›</button></div>' +
    '<div class="al-src">Barcode: Code 128, 16 digits (airline prefix, 8-digit serial, a separator zero and a 4-digit piece number) as set out in IATA Resolution 606. Airport list based on OpenFlights data (ODbL).</div></div></div></div>' +
    '<datalist id="al-airl"></datalist><datalist id="al-apl"></datalist>';

  var ack = $('al-ack'), dl = $('al-dl'), pr = $('al-pr'), pv = $('al-pv'), cur = 0;

  function val(id) { return ($(id).value || '').trim(); }
  function code3(s) { var m = String(s || '').toUpperCase().match(/^\s*([A-Z]{3})\b/); return m ? m[1] : ''; }
  function num(s) { var n = parseFloat(String(s || '').replace(/,/g, '')); return isFinite(n) && n > 0 ? n : null; }
  function msg(id, t, cls) { var e = $(id + '-m'); if (e) { e.textContent = t || ''; e.className = 'al-msg' + (cls ? ' ' + cls : ''); } }

  function read() {
    var errs = [];
    var air = val('al-air'), pm = air.match(/^\s*(\d{3})\b/), prefix = pm ? pm[1] : '';
    var awbRaw = val('al-awb').replace(/[^0-9]/g, '');
    if (awbRaw.length === 11) { if (!prefix) prefix = awbRaw.slice(0, 3); else if (awbRaw.slice(0, 3) !== prefix) errs.push('al-awb:The first 3 digits do not match the airline prefix ' + prefix + '.'); awbRaw = awbRaw.slice(3); }
    var airName = '';
    if (prefix && ALMAP[prefix]) airName = ALMAP[prefix][0];
    else if (air) airName = air.replace(/^\s*\d{3}\s*[·\-–]?\s*/, '').replace(/\s*\([A-Z0-9]{2}\)\s*$/, '');
    airName = airName.replace(/\s*\([A-Z0-9]{2}\)\s*$/, '');
    if (!prefix) errs.push('al-air:Pick an airline from the list, or type its 3-digit prefix.');
    var serial = awbRaw;
    if (serial && serial.length !== 8) errs.push('al-awb:The air waybill serial number has 8 digits (after the 3-digit prefix).');
    var warnCheck = '';
    if (serial.length === 8 && (+serial.slice(0, 7)) % 7 !== +serial[7]) warnCheck = 'Check digit does not match (the 8th digit is usually the first 7 digits mod 7). Please re-check the number.';
    var dst = code3(val('al-dst')), org = code3(val('al-org')), v1 = code3(val('al-v1')), v2 = code3(val('al-v2'));
    if (val('al-dst') && !dst) errs.push('al-dst:Use the 3-letter airport code.');
    var tot = parseInt(val('al-tot'), 10);
    if (val('al-tot') && !(tot > 0)) errs.push('al-tot:Enter the total number of pieces.');
    if (tot > 9999) errs.push('al-tot:Up to 9,999 pieces per air waybill.');
    var from = parseInt(val('al-from'), 10) || 1, to = parseInt(val('al-to'), 10) || tot || 1;
    if (tot && (from < 1 || to > tot || from > to)) errs.push('al-to:The range must be between 1 and ' + tot + '.');
    if (tot && to - from + 1 > 500) errs.push('al-to:Up to 500 labels at a time. Print in batches.');
    var u = $('al-u').value, tw = num(val('al-tw')), pw = num(val('al-pw')), hwt = num(val('al-hwt'));
    var ok = prefix && serial.length === 8 && dst && tot > 0 && !errs.length;
    return { ok: ok, errs: errs, warnCheck: warnCheck, prefix: prefix, airName: airName, serial: serial, dst: dst, org: org, v1: v1, v2: v2, tot: tot, from: from, to: to, u: u, tw: tw, pw: pw, hw: val('al-hw').toUpperCase(), hp: parseInt(val('al-hp'), 10) || null, hwt: hwt, hi: val('al-hi').toUpperCase(), oi: val('al-oi') };
  }

  // ---------- label layout (mm, on a 100 × 150 design box) ----------
  function fmtW(n) { return (Math.round(n * 10) / 10).toLocaleString('en-IN'); }
  function layout(d, piece) {
    var O = []; // ops
    var L = function (x1, y1, x2, y2, w) { O.push({ t: 'l', x1: x1, y1: y1, x2: x2, y2: y2, w: w || 0.4 }); };
    var T = function (x, y, s, pt, b, al) { O.push({ t: 't', x: x, y: y, s: String(s), pt: pt, b: !!b, al: al || 'left' }); };
    // frame
    O.push({ t: 'r', x: 1, y: 1, w: 98, h: 148, lw: 0.6 });
    // airline
    var an = d.airName.toUpperCase(); var apt = an.length > 26 ? 12 : an.length > 20 ? 14 : 16;
    T(4, 10.5, an, apt, true);
    T(96, 6.5, 'AIR CARGO', 6.5, false, 'right');
    L(1, 14, 99, 14);
    // AWB number
    T(4, 18.2, 'AIR WAYBILL NO.', 6.5);
    T(50, 27.5, d.prefix + '-' + d.serial.slice(0, 4) + ' ' + d.serial.slice(4), 26, true, 'center');
    // barcode
    var data = d.prefix + d.serial + '0' + ('0000' + piece).slice(-4);
    O.push({ t: 'b', data: data, y: 31, h: 22.5 });
    T(50, 57.3, data, 7, false, 'center');
    L(1, 60, 99, 60);
    // destination | total pieces
    L(58, 60, 58, 86);
    T(4, 64.2, 'DESTINATION', 6.5); T(4, 82.5, d.dst, 46, true);
    T(61, 64.2, 'TOTAL NO. OF PIECES', 6.5); T(78.5, 82.5, String(d.tot), d.tot > 999 ? 26 : d.tot > 99 ? 32 : 40, true, 'center');
    L(1, 86, 99, 86);
    // origin | transfer | piece no.
    L(30, 86, 30, 100); L(64, 86, 64, 100);
    T(4, 89.8, 'ORIGIN', 6); T(4, 97.6, d.org || '', 16, true);
    T(33, 89.8, 'TRANSFER POINT(S)', 6); T(33, 97.6, [d.v1, d.v2].filter(Boolean).join(' / '), 14, true);
    T(67, 89.8, 'PIECE NO.', 6); T(67, 97.6, piece + ' of ' + d.tot, 14, true);
    L(1, 100, 99, 100);
    // weights
    L(50, 100, 50, 113);
    T(4, 103.8, 'WEIGHT OF THIS PIECE', 6); T(4, 111, d.pw ? fmtW(d.pw) + ' ' + d.u : '', 14, true);
    T(53, 103.8, 'TOTAL WEIGHT OF SHIPMENT', 6); T(53, 111, d.tw ? fmtW(d.tw) + ' ' + d.u : '', 14, true);
    L(1, 113, 99, 113);
    // HAWB
    L(50, 113, 50, 126); L(75, 113, 75, 126);
    T(4, 116.8, 'HOUSE WAYBILL NO.', 6); T(4, 124, d.hw, d.hw.length > 14 ? 10 : 13, true);
    T(53, 116.8, 'HWB PIECES', 6); T(53, 124, d.hp ? String(d.hp) : '', 13, true);
    T(78, 116.8, 'HWB WEIGHT', 6); T(78, 124, d.hwt ? fmtW(d.hwt) + ' ' + d.u : '', 11, true);
    L(1, 126, 99, 126);
    // handling / other
    L(50, 126, 50, 137);
    T(4, 129.6, 'HANDLING INFORMATION', 6); T(4, 134.8, d.hi, d.hi.length > 22 ? 7.5 : 9.5, true);
    T(53, 129.6, 'OTHER INFORMATION', 6); T(53, 134.8, d.oi, d.oi.length > 22 ? 7.5 : 9.5, true);
    // branding strip
    L(1, 137, 99, 137, 0.3);
    O.push({ t: 'i', x: 3.5, y: 138.2, w: 20, h: 10.4 });
    T(96, 142.4, 'Free air cargo labels at', 7, false, 'right');
    T(96, 146.6, 'www.yamlogistics.com', 10, true, 'right');
    return O;
  }

  // ---------- SVG preview ----------
  function svg(d, piece) {
    var O = layout(d, piece), S = '';
    O.forEach(function (o) {
      if (o.t === 'r') S += '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" fill="none" stroke="#000" stroke-width="' + o.lw + '"/>';
      else if (o.t === 'l') S += '<line x1="' + o.x1 + '" y1="' + o.y1 + '" x2="' + o.x2 + '" y2="' + o.y2 + '" stroke="#000" stroke-width="' + o.w + '"/>';
      else if (o.t === 't') S += '<text x="' + o.x + '" y="' + o.y + '" font-family="Helvetica,Arial,sans-serif" font-size="' + (o.pt * 0.3528).toFixed(2) + '" font-weight="' + (o.b ? 700 : 400) + '" text-anchor="' + (o.al === 'center' ? 'middle' : o.al === 'right' ? 'end' : 'start') + '" fill="#000">' + h(o.s) + '</text>';
      else if (o.t === 'b') { var bb = bars(o.data); bb.bars.forEach(function (b) { S += '<rect x="' + b[0].toFixed(3) + '" y="' + o.y + '" width="' + b[1].toFixed(3) + '" height="' + o.h + '" fill="#000"/>'; }); }
      else if (o.t === 'i' && LOGO) S += '<image href="' + LOGO + '" x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" preserveAspectRatio="xMinYMid meet"/>';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150">' + S + '</svg>';
  }
  function bars(data) {
    var p = code128C(data), mods = 0, i;
    for (i = 0; i < p.length; i++) mods += +p[i];
    var X = Math.min(0.62, 90 / (mods + 20)), x = 50 - mods * X / 2, out = [];
    for (i = 0; i < p.length; i++) { var w = +p[i] * X; if (i % 2 === 0) out.push([x, w]); x += w; }
    return { bars: out, X: X };
  }

  // ---------- PDF ----------
  function loadPdf() {
    return new Promise(function (res, rej) {
      if (window.jspdf) return res(window.jspdf);
      var s = document.createElement('script'); s.src = 'jspdf.umd.min.js?v=1'; s.onload = function () { res(window.jspdf); }; s.onerror = rej; document.head.appendChild(s);
    });
  }
  function drawPdf(doc, d, piece, ox, oy, k) {
    var O = layout(d, piece);
    doc.setTextColor(0, 0, 0); doc.setDrawColor(0, 0, 0); doc.setFillColor(0, 0, 0);
    O.forEach(function (o) {
      if (o.t === 'r') { doc.setLineWidth(o.lw * k); doc.rect(ox + o.x * k, oy + o.y * k, o.w * k, o.h * k); }
      else if (o.t === 'l') { doc.setLineWidth(o.w * k); doc.line(ox + o.x1 * k, oy + o.y1 * k, ox + o.x2 * k, oy + o.y2 * k); }
      else if (o.t === 't') { doc.setFont('helvetica', o.b ? 'bold' : 'normal'); doc.setFontSize(o.pt * k); doc.text(o.s, ox + o.x * k, oy + o.y * k, { align: o.al }); }
      else if (o.t === 'b') { bars(o.data).bars.forEach(function (b) { doc.rect(ox + b[0] * k, oy + o.y * k, b[1] * k, o.h * k, 'F'); }); }
      else if (o.t === 'i' && LOGOPNG) { doc.addImage(LOGOPNG, 'PNG', ox + o.x * k, oy + o.y * k, o.w * k, o.w * k * LOGOR, undefined, 'FAST'); }
    });
  }
  var LOGOPNG = null, LOGOR = 0.52;
  function makePdf(d) {
    var sz = SIZES[$('al-sz').value];
    return loadPdf().then(function (J) {
      var doc = new J.jsPDF({ unit: 'mm', format: [sz.w, sz.h], orientation: 'portrait', compress: true });
      doc.setProperties({ title: 'Air cargo labels ' + d.prefix + '-' + d.serial, creator: 'YAM Logistics free label generator (www.yamlogistics.com)' });
      var per = sz.slots.length, n = 0;
      for (var p = d.from; p <= d.to; p++) {
        var slot = n % per;
        if (n && slot === 0) doc.addPage([sz.w, sz.h], 'portrait');
        if (slot === 0 && sz.cut) {
          doc.setLineWidth(0.2); doc.setDrawColor(150, 150, 150); doc.setLineDashPattern([2, 2], 0);
          doc.line(sz.w / 2, 0, sz.w / 2, sz.h); doc.line(0, sz.h / 2, sz.w, sz.h / 2); doc.setLineDashPattern([], 0);
        }
        var s = sz.slots[slot], pad = per > 1 ? (sz.cut ? 4 : 1.5) : 0, k = Math.min((s[2] - 2 * pad) / 100, (s[3] - 2 * pad) / 150);
        drawPdf(doc, d, p, s[0] + (s[2] - 100 * k) / 2, s[1] + (s[3] - 150 * k) / 2, k);
        n++;
      }
      return doc;
    });
  }

  function refresh() {
    if (!D) return;
    $('al-tip').textContent = SIZES[$('al-sz').value].tip;
    var d = read();
    ['al-air', 'al-awb', 'al-dst', 'al-tot', 'al-to'].forEach(function (id) { msg(id, ''); });
    d.errs.forEach(function (e) { var i = e.indexOf(':'); msg(e.slice(0, i), e.slice(i + 1), 'bad'); });
    if (!d.errs.some(function (e) { return e.indexOf('al-awb') === 0; })) msg('al-awb', d.warnCheck, d.warnCheck ? 'bad' : '');
    if (d.prefix && ALMAP[d.prefix] && !d.errs.some(function (e) { return e.indexOf('al-air') === 0; })) msg('al-air', '✓ ' + d.prefix + ' · ' + ALMAP[d.prefix][0], 'ok');
    var n = d.ok ? d.to - d.from + 1 : 0;
    dl.disabled = pr.disabled = !(d.ok && ack.checked);
    dl.textContent = 'Download PDF' + (n ? ' (' + n + ' label' + (n > 1 ? 's' : '') + ')' : '');
    if (!d.ok) { pv.innerHTML = ''; $('al-nav').style.display = 'none'; $('al-pvs').textContent = 'Fill in the airline, air waybill number, destination and pieces.'; return; }
    if (cur < d.from || cur > d.to) cur = d.from;
    pv.innerHTML = svg(d, cur);
    $('al-pvs').textContent = n + ' label' + (n > 1 ? 's' : '') + ', one for each piece. ' + (ack.checked ? '' : 'Tick the box on the left to enable the download.');
    $('al-nav').style.display = n > 1 ? 'flex' : 'none'; $('al-pn').textContent = 'Piece ' + cur + ' of ' + d.tot;
  }
  root.addEventListener('input', function (e) { if (e.target.id === 'al-air' || e.target.id === 'al-awb') cur = 0; refresh(); });
  root.addEventListener('change', refresh);
  ack.addEventListener('change', function () { try { sessionStorage.setItem('al-ack', ack.checked ? '1' : '0'); } catch (e) {} refresh(); });
  $('al-prevb').addEventListener('click', function () { var d = read(); if (cur > d.from) { cur--; refresh(); } });
  $('al-nextb').addEventListener('click', function () { var d = read(); if (cur < d.to) { cur++; refresh(); } });
  function busy(b, t) { $('al-st').textContent = t || ''; $('al-st').className = 'al-msg'; dl.disabled = pr.disabled = b || dl.disabled; }
  dl.addEventListener('click', function () {
    var d = read(); if (!d.ok || !ack.checked) return; busy(true, 'Preparing your PDF…');
    makePdf(d).then(function (doc) { doc.save('AWB-' + d.prefix + '-' + d.serial + '-labels.pdf'); busy(false, ''); refresh(); }).catch(function () { busy(false, 'Could not create the PDF. Please refresh and try again.'); refresh(); });
  });
  pr.addEventListener('click', function () {
    var d = read(); if (!d.ok || !ack.checked) return;
    var w = window.open('', '_blank'); busy(true, 'Opening the print view…');
    makePdf(d).then(function (doc) { doc.autoPrint(); var u = doc.output('bloburl'); if (w) w.location.href = u; else window.open(u, '_blank'); busy(false, ''); refresh(); }).catch(function () { if (w) w.close(); busy(false, 'Could not open the print view. Use Download PDF instead.'); refresh(); });
  });

  // ---------- fill in from an uploaded air waybill (read locally) ----------
  var readerP = null, FIDS = { air: 'al-air', awb: 'al-awb', dst: 'al-dst', org: 'al-org', tot: 'al-tot', tw: 'al-tw', v1: 'al-v1', v2: 'al-v2', hi: 'al-hi', hw: 'al-hw', hp: 'al-hp', hwt: 'al-hwt' };
  var FNAMES = { awb: 'Air waybill number', air: 'Airline', org: 'Origin', dst: 'Destination', v1: 'Transfer point 1', v2: 'Transfer point 2', tot: 'Total pieces', tw: 'Total weight', hi: 'Handling information', hw: 'HAWB number', hp: 'HAWB pieces', hwt: 'HAWB weight' };
  function apName(c) { if (!D) return c; for (var i = 0; i < D.ap.length; i++) if (D.ap[i][0] === c) return c + ' · ' + D.ap[i][1] + ', ' + D.ap[i][2]; return c; }
  function clearFill() { Object.keys(FIDS).forEach(function (k) { var e = $(FIDS[k]); e.classList.remove('f-ok', 'f-chk'); }); }
  function upMsg(t, p) { $('al-upst').style.display = 'block'; $('al-upm').textContent = t; $('al-upb').style.width = Math.round((p || 0) * 100) + '%'; }
  function handleFile(file) {
    if (!file) return;
    if (!D) { upMsg('Still loading the airline list. Try again in a moment.', 0); return; }
    if (file.size > 25 * 1024 * 1024) { upMsg('That file is over 25 MB. Please use a smaller scan or photo.', 0); return; }
    if (!/pdf|jpe?g|png|webp/i.test(file.type + file.name)) { upMsg('Please choose a PDF, JPG or PNG file.', 0); return; }
    $('al-upr').innerHTML = ''; upMsg('Opening your file…', 0.03);
    if (!readerP) readerP = new Promise(function (res, rej) { var s = document.createElement('script'); s.src = 'awb-reader.js?v=2'; s.onload = function () { res(window.AWBRead); }; s.onerror = rej; document.head.appendChild(s); });
    readerP.then(function (R) { return R.read(file, D, function (p) { upMsg(p.stage + '…', p.p); }); }).then(showResult).catch(function () {
      readerP = window.AWBRead ? readerP : null;
      upMsg('Sorry, we could not read that file. Please type the details in below.', 0);
    });
  }
  function showResult(r) {
    $('al-upst').style.display = 'none';
    var f = r.fields, keys = Object.keys(f);
    if (!f.awb) {
      $('al-upr').innerHTML = '<p class="al-msg bad" style="margin-top:12px">We could not find an air waybill number in this file. ' + (r.method === 'ocr' ? 'Try a sharper, straight-on photo or a PDF, or ' : '') + 'type the details in below.</p>';
      return;
    }
    clearFill();
    // start from a clean form so nothing is left over from an earlier file
    Object.keys(FIDS).concat(['al-pw', 'al-oi', 'al-from', 'al-to']).forEach(function (k) { var e = $(FIDS[k] || k); if (e) e.value = ''; });
    Object.keys(FIDS).forEach(function (k) { msg(FIDS[k], ''); });
    keys.forEach(function (k) {
      var id = FIDS[k], e = $(id); if (!e) return;
      e.value = /^(dst|org|v1|v2)$/.test(k) ? apName(f[k].v) : f[k].v;
      e.classList.add(f[k].conf === 'ok' ? 'f-ok' : 'f-chk');
    });
    if (r.unit) $('al-u').value = r.unit;
    ['al-from', 'al-to'].forEach(function (id) { $(id).value = ''; });
    cur = 0; refresh();
    keys.forEach(function (k) { if (f[k].conf !== 'ok' || f[k].why) msg(FIDS[k], f[k].why || 'Read from your file. Please check.', 'chk'); });
    if (!f.dst && r.dstOpts) msg('al-dst', 'Your file says "' + (r.dstText || '') + '". Pick the airport: ' + r.dstOpts.slice(0, 6).join(', ') + '.', 'chk');
    else if (!f.dst) msg('al-dst', 'Not found in your file. Please enter the destination.', 'chk');
    if (!f.tot) msg('al-tot', 'Not found in your file. Please enter the total pieces.', 'chk');
    var nOk = keys.filter(function (k) { return f[k].conf === 'ok'; }).length, nChk = keys.length - nOk;
    var th = ''; try { var c = r.thumb, k2 = 240 / c.width, s = document.createElement('canvas'); s.width = 240; s.height = Math.round(c.height * k2); s.getContext('2d').drawImage(c, 0, 0, s.width, s.height); th = s.toDataURL('image/jpeg', 0.8); } catch (e) {}
    $('al-upr').innerHTML = '<div class="al-res">' + (th ? '<img id="al-thumb" src="' + th + '" alt="Your air waybill" title="Open your file to compare">' : '') + '<div><b style="color:#0B2A4A">' + (r.isHouse ? 'House air waybill' : 'Air waybill') + ' read: ' + keys.length + ' details filled in.</b>' +
      '<ul><li><b style="color:#0F7B3F">Green</b>: ' + nOk + ' passed our checks (check digit, airline, airport codes).</li>' +
      '<li><b style="color:#8A5A00">Amber</b>: ' + nChk + ' need a quick look against your document.</li>' +
      '<li>Anything missing? Type it in. Your file was not uploaded.</li></ul></div></div>';
    var ti = $('al-thumb'); if (ti) ti.addEventListener('click', function () { try { r.thumb.toBlob(function (b) { window.open(URL.createObjectURL(b), '_blank'); }, 'image/jpeg', 0.9); } catch (e) {} });
    var top = $('al-up').getBoundingClientRect().top; if (top < 0) $('al-up').scrollIntoView({ behavior: 'smooth' });
  }
  $('al-file').addEventListener('change', function (e) { handleFile(e.target.files[0]); e.target.value = ''; });
  var up = $('al-up');
  ['dragenter', 'dragover'].forEach(function (ev) { up.addEventListener(ev, function (e) { e.preventDefault(); up.classList.add('drag'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { up.addEventListener(ev, function (e) { e.preventDefault(); up.classList.remove('drag'); }); });
  up.addEventListener('drop', function (e) { handleFile(e.dataTransfer && e.dataTransfer.files[0]); });
  root.addEventListener('input', function (e) { if (e.target.classList) e.target.classList.remove('f-ok', 'f-chk'); });

  // logo: converted to black and white so it prints cleanly on thermal printers
  var im = new Image(); im.onload = function () {
    try {
      var c = document.createElement('canvas'), s = 6; c.width = im.naturalWidth * s || 786; c.height = im.naturalHeight * s || 408; LOGOR = c.height / c.width;
      var g = c.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
      var px = g.getImageData(0, 0, c.width, c.height), a = px.data;
      for (var i = 0; i < a.length; i += 4) { var y = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2], v = y < 235 ? 0 : 255; a[i] = a[i + 1] = a[i + 2] = v; a[i + 3] = 255; }
      g.putImageData(px, 0, 0);
      LOGOPNG = c.toDataURL('image/png'); LOGO = LOGOPNG; refresh();
    } catch (e) {}
  }; im.src = 'yam-logo.svg';

  fetch('awb-data.json?v=1').then(function (x) { return x.json(); }).then(function (j) {
    D = j;
    D.al.forEach(function (a) { ALMAP[a[0]] = [a[1], a[2]]; });
    $('al-airl').innerHTML = D.al.map(function (a) { return '<option value="' + a[0] + ' · ' + h(a[1]) + (a[2] ? ' (' + h(a[2]) + ')' : '') + '">'; }).join('');
    $('al-apl').innerHTML = D.ap.map(function (a) { return '<option value="' + a[0] + ' · ' + h(a[1]) + ', ' + h(a[2]) + '">'; }).join('');
    refresh();
  }).catch(function () { $('al-pvs').textContent = 'Could not load the airline list. Please refresh the page.'; });
})();
