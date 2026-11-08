/* CargoKit: container number checker (ISO 6346) and container type code reference.
   Check digit maths follows ISO 6346. Camera scan reads the number locally with Tesseract OCR (nothing is uploaded). */
(function (G) {
  'use strict';
  var BASE = (function () { var s = document.currentScript; return s ? s.src.replace(/[^\/]*$/, '') : ''; })();
  var root = document.getElementById('cn-root');
  if (!root) return;

  // ---- ISO 6346 ----
  var VAL = {}; (function () {
    var v = 10, i, c;
    for (i = 0; i < 26; i++) { if (v % 11 === 0) v++; VAL[String.fromCharCode(65 + i)] = v; v++; }
  })();
  function checkDigit(ten) {
    var sum = 0, i, ch;
    for (i = 0; i < 10; i++) { ch = ten.charAt(i); sum += (/\d/.test(ch) ? +ch : VAL[ch]) * Math.pow(2, i); }
    return (sum % 11) % 10;
  }
  function parse(raw) {
    var s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!s) return { state: 'empty' };
    var m = s.match(/^([A-Z]{3})([A-Z])(\d{6})(\d?)$/);
    if (!m) {
      if (s.length < 10) return { state: 'short', s: s };
      return { state: 'bad', s: s };
    }
    var ten = m[1] + m[2] + m[3], exp = checkDigit(ten);
    var r = { state: m[4] === '' ? 'compute' : (+m[4] === exp ? 'valid' : 'invalid'), owner: m[1], cat: m[2], serial: m[3], given: m[4], expected: exp, s: s };
    r.pretty = m[1] + m[2] + ' ' + m[3] + ' ' + (r.state === 'invalid' ? m[4] : exp);
    return r;
  }
  var CAT = { U: 'U: freight container', J: 'J: detachable freight-container related equipment', Z: 'Z: trailer or chassis' };

  // ---- type codes ----
  var LEN = { '1': "10 ft", '2': "20 ft", '3': "30 ft", '4': "40 ft", 'L': "45 ft", 'M': "48 ft" };
  var HGT = { '0': "8 ft", '2': "8 ft 6 in (standard)", '4': "9 ft", '5': "9 ft 6 in (high cube)", '6': "over 9 ft 6 in", '8': "4 ft 3 in (half height)", '9': "4 ft or less" };
  var GRP = { G: 'General purpose (dry)', V: 'Ventilated', B: 'Dry bulk', S: 'Named cargo (for example livestock or cars)', R: 'Refrigerated (reefer)', H: 'Insulated or heated', U: 'Open top', P: 'Platform (flat rack and platform types)', T: 'Tank', A: 'Air or surface container' };
  function decodeType(raw) {
    var s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (s.length < 4) return null;
    s = s.slice(0, 4);
    var out = { code: s, parts: [] };
    out.parts.push(['Length', s.charAt(0), LEN[s.charAt(0)] || 'Other length code, see ISO 6346']);
    out.parts.push(['Height', s.charAt(1), HGT[s.charAt(1)] || 'Other height code, see ISO 6346']);
    out.parts.push(['Type', s.charAt(2), GRP[s.charAt(2)] || 'Other type group, see ISO 6346']);
    var a = s.charAt(3), note = 'Variant ' + a + ', see ISO 6346 for the exact meaning';
    if (s.charAt(2) === 'G' && a === '0') note = 'Openings at one or both ends';
    if (s.charAt(2) === 'G' && a === '1') note = 'Passive vents at the top (the usual dry box)';
    out.parts.push(['Features', a, note]);
    return out;
  }
  // [code, name, typical inside m3, typical max cargo t] — numbers from the CargoKit container sizes guide, typical only
  var TYPES = [
    ['22G1', "20′ standard dry (20GP)", '33.2', '28.2'], ['42G1', "40′ standard dry (40GP)", '67.7', '26.7'],
    ['45G1', "40′ high cube (40HC)", '76.3', '26.6'], ['L5G1', "45′ high cube (45HC)", '86.0', '25.7'],
    ['22R1', "20′ reefer", '28.3', '27.4'], ['45R1', "40′ high cube reefer", '67.5', '29.5'],
    ['22U1', "20′ open top", '', ''], ['42U1', "40′ open top", '', ''],
    ['22P1', "20′ flat rack", '', ''], ['42P1', "40′ flat rack", '', ''], ['22T1', "20′ ISO tank", '', '']
  ];

  // ---- UI helpers ----
  function el(tag, css, html) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var CARD = 'background:#FFFFFF;border:1px solid #E1EDF7;border-radius:24px;padding:28px;margin-bottom:14px';
  var LBL = "font-family:'Geist Mono',monospace;font-size:11px;letter-spacing:.1em;color:#0A6CC2;margin-bottom:10px";
  var INP = "width:100%;box-sizing:border-box;border:2px solid #CFE3F5;border-radius:16px;padding:16px 18px;font:600 24px/1.2 'Geist Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#0B2A4A;background:#F7FBFF";
  var BTN = "border:0;border-radius:999px;min-height:46px;padding:0 20px;font:600 15px/1 Geist,system-ui,sans-serif;cursor:pointer;background:#0A6CC2;color:#FFFFFF";
  var BTN2 = "border:0;border-radius:999px;min-height:46px;padding:0 20px;font:600 15px/1 Geist,system-ui,sans-serif;cursor:pointer;background:#E1EDF7;color:#0B2A4A";

  root.innerHTML = '';
  // card 1: number check
  var c1 = el('div', CARD);
  c1.appendChild(el('div', LBL, 'CONTAINER NUMBER (ISO 6346)'));
  var inp = el('input', INP); inp.type = 'text'; inp.id = 'cn-in'; inp.maxLength = 16; inp.placeholder = 'CSQU 305438 3'; inp.setAttribute('autocomplete', 'off'); inp.setAttribute('autocapitalize', 'characters'); inp.setAttribute('aria-label', 'Container number');
  c1.appendChild(inp);
  var row = el('div', 'display:flex;flex-wrap:wrap;gap:10px;margin-top:14px');
  var scanBtn = el('button', BTN2, '📷 Scan with camera'); scanBtn.type = 'button';
  var file = el('input'); file.type = 'file'; file.accept = 'image/*'; file.setAttribute('capture', 'environment'); file.style.display = 'none';
  var ex = el('button', BTN2, 'Try an example'); ex.type = 'button';
  row.appendChild(scanBtn); row.appendChild(ex); row.appendChild(file); c1.appendChild(row);
  var scanMsg = el('div', 'font-size:14px;color:#5E7891;margin-top:10px;min-height:20px'); c1.appendChild(scanMsg);
  var res = el('div', 'margin-top:14px'); res.id = 'cn-res'; res.setAttribute('aria-live', 'polite'); c1.appendChild(res);
  root.appendChild(c1);

  // card 2: type code
  var c2 = el('div', CARD);
  c2.appendChild(el('div', LBL, 'SIZE AND TYPE CODE (4 CHARACTERS)'));
  var tin = el('input', INP); tin.type = 'text'; tin.id = 'cn-ty'; tin.maxLength = 6; tin.placeholder = '45G1'; tin.setAttribute('autocomplete', 'off'); tin.setAttribute('aria-label', 'Container type code');
  c2.appendChild(tin);
  c2.appendChild(el('div', 'font-size:14px;color:#5E7891;margin-top:8px', 'Printed near the door on the container, next to the owner and number, for example 22G1 or 45G1.'));
  var tres = el('div', 'margin-top:14px'); tres.id = 'cn-tres'; c2.appendChild(tres);
  root.appendChild(c2);

  // card 3: reference table
  var c3 = el('div', CARD);
  c3.appendChild(el('div', LBL, 'COMMON TYPE CODES'));
  var q = el('input', INP.replace('font:600 24px', 'font:500 18px').replace('letter-spacing:.08em;text-transform:uppercase;', '').replace(/'Geist Mono',monospace/, 'Geist,system-ui,sans-serif')); q.type = 'search'; q.placeholder = 'Search: 40, reefer, open top, 45G1…'; q.setAttribute('aria-label', 'Search type codes');
  c3.appendChild(q);
  var tbl = el('div', 'margin-top:14px;display:grid;gap:8px'); tbl.id = 'cn-tbl'; c3.appendChild(tbl);
  c3.appendChild(el('div', 'font-size:13px;line-height:1.5;color:#5E7891;margin-top:14px', 'Volumes and weights are typical figures for guidance. The CSC safety approval plate on the container shows its real limits. More sizes in the <a href="container-sizes.html">container sizes guide</a>.'));
  root.appendChild(c3);

  var fmtTimer;
  function fmtInput() {
    var s = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11), o = s.slice(0, 4);
    if (s.length > 4) o += ' ' + s.slice(4, 10);
    if (s.length > 10) o += ' ' + s.slice(10);
    if (inp.value !== o) inp.value = o;
  }
  function renderNum() {
    var r = parse(inp.value), h = '';
    var tag = function (bg, fg, t) { return '<div style="display:inline-block;background:' + bg + ';color:' + fg + ';border-radius:999px;padding:8px 16px;font:700 16px/1 Geist,sans-serif;margin-bottom:12px">' + t + '</div>'; };
    if (r.state === 'empty') { h = '<div style="color:#5E7891;font-size:15px">Type or scan a container number. We check the last digit with the ISO 6346 formula.</div>'; }
    else if (r.state === 'short') { h = '<div style="color:#5E7891;font-size:15px">Keep typing: 4 letters, 6 digits, then the check digit (' + r.s.length + ' of 11).</div>'; }
    else if (r.state === 'bad') { h = tag('#FDE8E6', '#9B1C12', 'Not a valid format') + '<div style="font-size:15px;line-height:1.55">A container number is 4 letters (3 for the owner and one for the category, normally U), then 6 digits, then 1 check digit. Example: CSQU 305438 3.</div>'; }
    else {
      var head;
      if (r.state === 'valid') head = tag('#E7F7EE', '#0B4D24', '✓ Valid: check digit ' + r.expected + ' is correct');
      else if (r.state === 'invalid') head = tag('#FDE8E6', '#9B1C12', '✗ Check digit should be ' + r.expected + ', not ' + r.given);
      else head = tag('#E1EDF7', '#0B2A4A', 'The check digit for this number is ' + r.expected);
      h = head + '<div style="font:700 26px/1.2 \'Geist Mono\',monospace;letter-spacing:.06em;margin:4px 0 14px">' + r.pretty + '</div>' +
        '<div style="display:grid;gap:8px;font-size:15px;line-height:1.5">' +
        '<div><b>Owner code</b>: ' + esc(r.owner) + ' (the line or lessor; look it up in the <a href="https://www.bic-code.org/bic-codes/" rel="noopener">BIC code list</a>)</div>' +
        '<div><b>Category</b>: ' + esc(CAT[r.cat] || r.cat + ': not a standard category (normally U, J or Z)') + '</div>' +
        '<div><b>Serial number</b>: ' + r.serial + '</div>' +
        '<div><b>Check digit</b>: ' + r.expected + '</div></div>';
      if (r.state === 'invalid') h += '<div style="margin-top:12px;font-size:14px;line-height:1.55;color:#5E7891">A wrong check digit usually means a typo or a misread letter (for example O and 0, or I and 1). Check the number against the container door or the booking.</div>';
    }
    res.innerHTML = h;
    if (G.CK && (r.state === 'valid' || r.state === 'invalid' || r.state === 'compute')) G.CK.refresh();
  }
  function renderType() {
    var d = decodeType(tin.value);
    if (!d) { tres.innerHTML = ''; if (G.CK) G.CK.refresh(); return; }
    var known = null; TYPES.forEach(function (t) { if (t[0] === d.code) known = t; });
    var h = '<div style="font:700 26px/1.2 \'Geist Mono\',monospace;letter-spacing:.06em;margin-bottom:10px">' + esc(d.code) + (known ? ' <span style="font:600 16px Geist,sans-serif;letter-spacing:0;color:#17436B">· ' + esc(known[1]) + '</span>' : '') + '</div><div style="display:grid;gap:6px;font-size:15px;line-height:1.5">';
    d.parts.forEach(function (p) { h += '<div><b>' + p[0] + '</b> (' + esc(p[1]) + '): ' + esc(p[2]) + '</div>'; });
    h += '</div>';
    if (known && known[2]) h += '<div style="margin-top:10px;font-size:15px"><b>Typical space inside</b>: ' + known[2] + ' m³ · <b>max cargo</b>: about ' + known[3] + ' t</div>';
    tres.innerHTML = h;
    if (G.CK) G.CK.refresh();
  }
  function renderTable() {
    var f = q.value.trim().toLowerCase(), n = 0; tbl.innerHTML = '';
    TYPES.forEach(function (t) {
      var hay = (t[0] + ' ' + t[1]).toLowerCase().replace(/[′']/g, '');
      if (f && hay.indexOf(f.replace(/[′']/g, '')) < 0) return; n++;
      var b = el('button', 'text-align:left;border:1px solid #E1EDF7;border-radius:16px;background:#F7FBFF;padding:14px 16px;cursor:pointer;font:15px/1.4 Geist,system-ui,sans-serif;color:#0B2A4A;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline');
      b.type = 'button';
      b.innerHTML = '<b style="font-family:\'Geist Mono\',monospace;font-size:17px;color:#0A6CC2">' + t[0] + '</b><span style="flex:1;min-width:140px">' + esc(t[1]) + '</span>' + (t[2] ? '<span style="color:#5E7891;font-size:14px">' + t[2] + ' m³ · ' + t[3] + ' t</span>' : '');
      b.onclick = function () { tin.value = t[0]; renderType(); tin.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
      tbl.appendChild(b);
    });
    if (!n) tbl.innerHTML = '<div style="color:#5E7891">No match. Try a code like 22G1, or words such as reefer, open top or 40.</div>';
  }

  inp.addEventListener('input', function () { fmtInput(); renderNum(); });
  tin.addEventListener('input', renderType);
  q.addEventListener('input', renderTable);
  ex.onclick = function () { inp.value = 'CSQU 305438 3'; fmtInput(); renderNum(); };

  // ---- camera scan (local OCR) ----
  var tessP = null;
  function loadScript(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function tess() {
    if (!tessP) tessP = loadScript(BASE + 'vendor/ocr/tesseract.min.js?v=5').then(function () {
      return G.Tesseract.createWorker('eng', 1, { workerPath: BASE + 'vendor/ocr/worker.min.js?v=5', corePath: BASE + 'vendor/ocr/', langPath: BASE + 'vendor/ocr/lang', gzip: true });
    });
    return tessP;
  }
  // fix common OCR mix-ups: in the digit part O->0, I->1, S->5, B->8; in the letter part 0->O, 1->I, 5->S, 8->B
  function fixOcr(t) {
    var s = String(t).toUpperCase().replace(/[^A-Z0-9]/g, ''), i, best = null;
    var toD = { O: '0', I: '1', L: '1', S: '5', B: '8', Z: '2', G: '6' }, toL = { '0': 'O', '1': 'I', '5': 'S', '8': 'B', '2': 'Z', '6': 'G' };
    for (i = 0; i + 10 <= s.length; i++) {
      var w = s.slice(i, i + 11), a = '', k;
      if (w.length < 10) continue;
      for (k = 0; k < w.length; k++) {
        var ch = w.charAt(k);
        if (k < 4) a += toL[ch] || ch; else a += /\d/.test(ch) ? ch : (toD[ch] || ch);
      }
      if (/^[A-Z]{3}[UJZ]\d{6}\d?$/.test(a)) { var p = parse(a); if (!best || (p.state === 'valid' && best.state !== 'valid')) best = p; if (p.state === 'valid') break; }
    }
    return best;
  }
  scanBtn.onclick = function () { file.value = ''; file.click(); };
  file.onchange = function () {
    var f = file.files && file.files[0]; if (!f) return;
    scanMsg.textContent = 'Reading the photo on your phone… the first scan takes a few seconds.';
    tess().then(function (w) { return w.recognize(f); }).then(function (r) {
      var txt = (r && r.data && r.data.text) || '', p = fixOcr(txt.replace(/\s+/g, ''));
      if (!p) p = fixOcr(txt.split(/\n/).join(' '));
      if (p) { inp.value = p.s; fmtInput(); renderNum(); scanMsg.textContent = p.state === 'valid' ? 'Found it, and the check digit matches.' : 'Found a number. Check it against the container, scans can misread a character.'; }
      else scanMsg.textContent = 'No container number found. Get closer, keep the number level and in good light, then try again.';
    }).catch(function () { scanMsg.textContent = 'The scan could not run here (needs a modern browser). You can still type the number.'; });
  };

  // for the share / save module
  G.CK_RESULT = function () {
    var r = parse(inp.value), d = decodeType(tin.value), lines = [], title = 'Container number check';
    if (r.state === 'valid' || r.state === 'invalid' || r.state === 'compute') {
      lines.push('Container number: ' + r.pretty);
      lines.push(r.state === 'valid' ? 'Check digit ' + r.expected + ' is correct (ISO 6346)' : r.state === 'invalid' ? 'Check digit is WRONG: expected ' + r.expected + ', got ' + r.given : 'Calculated check digit: ' + r.expected);
      lines.push('Owner code: ' + r.owner + ' · Category: ' + r.cat);
      title = 'Container ' + r.pretty;
    }
    if (d) {
      var known = null; TYPES.forEach(function (t) { if (t[0] === d.code) known = t; });
      lines.push('Type code ' + d.code + (known ? ': ' + known[1] : ''));
      d.parts.forEach(function (p) { lines.push(p[0] + ': ' + p[2]); });
      if (!r || r.state === 'empty' || r.state === 'short' || r.state === 'bad') title = 'Container type ' + d.code;
    }
    return lines.length ? { title: title, lines: lines } : null;
  };
  G.CK_PARSE6346 = parse; // exposed for tests

  fmtInput(); renderNum(); renderType(); renderTable();
})(window);
