/* YAM Logistics — Shipping Document Checker. Compares the commercial invoice, packing list and bill of lading
   and flags mismatches before filing. Everything runs in the visitor's browser: no document is uploaded or stored. */
(function (G) {
  'use strict';

  /* ---------- helpers ---------- */
  function U(s) { return String(s || '').toUpperCase(); }
  function num(s) {
    s = String(s).replace(/\s/g, '');
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
    else if (/^\d{1,3}(\.\d{3})+,\d+$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');
    else if (/^\d+,\d{3}$/.test(s)) s = s.replace(',', '');
    var n = parseFloat(s); return isNaN(n) ? null : n;
  }
  var NUMRX = /(\d{1,3}(?:[,.]\d{3})+(?:[.,]\d{1,3})?|\d+(?:[.,]\d{1,3})?)/;
  function fmt(n) { return n == null ? '' : (Math.round(n * 1000) / 1000).toLocaleString('en-US', { maximumFractionDigits: 3 }); }
  function uniq(a) { var o = [], s = {}; a.forEach(function (x) { var k = typeof x === 'object' ? JSON.stringify(x) : x; if (!s[k]) { s[k] = 1; o.push(x); } }); return o; }
  function ctrCheck(c) { var v = '0123456789A?BCDEFGHIJK?LMNOPQRSTU?VWXYZ', s = 0; for (var i = 0; i < 10; i++) { var x = v.indexOf(c[i]); if (x < 0) return false; s += x * Math.pow(2, i); } return (s % 11) % 10 === +c[10]; }

  /* ---------- positioned-text helpers (pdf.js items: {s,x,y,p}; y grows upwards) ---------- */
  function below(items, L, opt) {
    opt = opt || {};
    var lc = cx(L), c = items.filter(function (it) { return it !== L && it.p === L.p && it.y < L.y - 1.5 && it.y > L.y - (opt.dy || 60) && it.x > L.x - (opt.left || 90) && it.x < L.x + (opt.right || 220) && (!opt.test || opt.test(it.s.trim())); });
    if (!c.length) return c;
    var top = Math.max.apply(null, c.map(function (it) { return it.y; }));
    c.sort(function (a, b) { var ra = a.y > top - 4 ? 0 : 1, rb = b.y > top - 4 ? 0 : 1; return (ra - rb) || (Math.abs(cx(a) - lc) - Math.abs(cx(b) - lc)) || (b.y - a.y); });
    return c;
  }
  function cx(it) { return it.x + (it.w || it.s.length * 4.5) / 2; }
  function rightOf(items, L, maxDx) { return items.filter(function (it) { return it !== L && it.p === L.p && Math.abs(it.y - L.y) < 2.5 && it.x > L.x && it.x < L.x + (maxDx || 260) && it.s.trim(); }).sort(function (a, b) { return a.x - b.x; }); }

  /* ---------- parties ---------- */
  var LEGAL = /^(PVT|PRIVATE|LTD|LIMITED|LLC|LLP|CO|COMPANY|INC|CORP|CORPORATION|THE|AND|M\/S|MS|FZE|FZCO|FZC|GMBH|SA|SRL|SPA|BV|AG|PTE|PLC|HK|INDIA|EXPORTS?|IMPORTS?|INTERNATIONAL|INTL|TRADING|ENTERPRISES?|INDUSTRIES|GROUP)$/;
  var NOISE = /ACCOUNT|NUMBER|ISSUED\s+BY|@|WWW\.|\bLOAD\b|\bSTOW\b|SAID\s+TO|^AGENT|^\(|NAME\s*(AND|&)\s*ADDRESS|CERTIF|HEREBY|AGREES|\bCOUNT\b|^SAID$|^CONTAIN|SEALED|MERCHANT|PARTICULARS|CARRIED|INTERMEDIATE|FLIGHT|^['\u2019`]|NOT\s+NEGOTIABLE|NON.?NEGOTIABLE|CARRIER|COMPLETE\s+NAME|SAME\s+AS|TO\s+ORDER|^TEL|^PHONE|^FAX|^E-?MAIL|^GST|^IEC|^PAN\b|^\d|NOTIFY|^ADDRESS|REFERENCE|^NO\.?$|^:$/i;
  function nameTokens(n) { return U(n).replace(/[^A-Z0-9 &\/]/g, ' ').split(/\s+/).filter(function (t) { return t.length >= 2 && !LEGAL.test(t); }); }
  function cleanName(s) { return String(s).replace(/^\s*(M\/S\.?|MESSRS\.?)\s*/i, '').replace(/\s{2,}.*$/, '').replace(/[,;:]+$/, '').trim(); }
  function looksName(s) { s = s.trim(); return s.length >= 4 && /[A-Z]{3}/i.test(s) && !NOISE.test(s) && nameTokens(s).length >= 1; }
  function party(d, labelRx) {
    var it = d.items, i, L, m, c;
    for (i = 0; i < it.length; i++) {
      L = it[i]; var s = L.s.trim();
      if (!labelRx.test(s) || s.length > 60) continue;
      m = s.replace(labelRx, '').replace(/^[\s:.\-–(]*(\(?[^)]*\))?[\s:.\-–]*/, '');
      if (looksName(m) && !/^(AND|&|\/)/i.test(m)) return cleanName(m);
      c = rightOf(it, L, 280).filter(function (x) { return looksName(x.s); }); if (c.length && c[0].x - L.x < 200) return cleanName(c[0].s);
      c = below(it, L, { dy: 48, left: 30, right: 240, test: looksName }); if (c.length) return cleanName(c[0].s);
    }
    // text fallback: the line after the label
    var lines = d.text.split('\n');
    for (i = 0; i < lines.length; i++) if (labelRx.test(lines[i].trim())) for (var k = 1; k <= 3 && i + k < lines.length; k++) { var t = lines[i + k].trim(); if (looksName(t)) return cleanName(t); }
    return '';
  }
  function nameFound(name, text) {
    var tk = nameTokens(name); if (!tk.length) return null;
    var T = ' ' + U(text).replace(/[^A-Z0-9&\/]+/g, ' ') + ' ', hit = tk.filter(function (t) { return T.indexOf(' ' + t + ' ') >= 0; }).length;
    return hit / tk.length >= 0.75;
  }

  /* ---------- numbers: weights & packages ---------- */
  function labelledNumbers(d, rx, opt) {
    opt = opt || {}; var out = [], T = d.text, m, re = new RegExp(rx.source, 'gi');
    while ((m = re.exec(T))) {
      var pre = T.slice(Math.max(0, m.index - 14), m.index).toUpperCase();
      if (opt.skipPre && opt.skipPre.test(pre)) continue;
      var lines2 = T.slice(m.index + m[0].length, m.index + m[0].length + (opt.win || 90)).split(/\n/), same = lines2[0], next = lines2.slice(1, 3).join(' ');
      if (opt.stop) { var st = same.search(opt.stop); if (st >= 0) same = same.slice(0, st); st = next.search(opt.stop); if (st >= 0) next = next.slice(0, st); }
      var SA = /(?:^|[^A-Za-z0-9\/\-])(\d{1,3}(?:[,.]\d{3})+(?:[.,]\d{1,3})?|\d+(?:[.,]\d{1,3})?)(?![\dA-Za-z\/\-])/, KGX = /(?:^|[^A-Za-z0-9\/\-])(\d{1,3}(?:[,.]\d{3})+(?:[.,]\d{1,3})?|\d+(?:[.,]\d{1,3})?)\s*(?:KGS?|KGM|KILOS?)\b/i;
      var n = same.match(KGX) || same.match(SA) || next.match(KGX); if (!n) continue;
      var v = num(n[1]); if (v == null || v <= 0) continue;
      var tot = /TOTAL/i.test(T.slice(Math.max(0, m.index - 25), m.index + m[0].length));
      out.push({ v: v, total: tot });
    }
    // column layout: the value printed under a header label
    d.items.forEach(function (L) {
      if (!new RegExp('^\\s*(' + rx.source + ')\\s*(\\(?\\s*KGS?\\s*\\)?)?\\s*[:.]?\\s*$', 'i').test(L.s)) return;
      var c = below(d.items, L, { dy: 140, left: 60, right: 90, test: function (s) { return /^\s*[\d.,]+\s*(KGS?|KGM)?\s*$/i.test(s) && (/KG|[.,]/i.test(s) || /\d{3}/.test(s)) && num(s.replace(/[^\d.,]/g, '')) > 0; } });
      if (c.length) out.push({ v: num(c[0].s.replace(/[^\d.,]/g, '')), total: false, col: true });
    });
    return out;
  }
  // A weight that is only in a table: the number in the totals row (the lowest all-number row) under a header such as "PALLET GROSS".
  function tableTotal(d, rx, not) {
    var best = null;
    d.items.forEach(function (L) {
      if (!rx.test(L.s) || (not && not.test(L.s)) || L.s.length > 40) return;
      var rows = {};
      d.items.forEach(function (it) { if (it.y < L.y - 6 && (it.p || 1) === (L.p || 1)) { var k = Math.round(it.y / 3); (rows[k] = rows[k] || []).push(it); } });
      var keys = Object.keys(rows).map(Number).sort(function (a, b) { return a - b; });
      for (var i = 0; i < keys.length; i++) {
        var r = rows[keys[i]].filter(function (it) { return it.s.trim(); });
        if (r.length < 3 || !r.every(function (it) { return /^[\d.,\s]+$/.test(it.s); })) continue;
        var c = r.filter(function (it) { return it.x >= L.x - 10 && it.x <= L.x + (L.w || 30) + 50; }).sort(function (a, b) { return a.x - b.x; })[0];
        if (c) { var v = num(c.s.trim()); if (v != null && v >= 5 && (!best || v > best)) best = v; }
        break; // only the lowest all-number row counts as the totals row
      }
    });
    return best;
  }
  // The company on the letterhead (top of the first page) when no line says "Exporter" or "Shipper".
  function letterhead(d) {
    var top = d.items.filter(function (it) { return (it.p || 1) === 1 && it.s.trim(); }).sort(function (a, b) { return b.y - a.y; }).slice(0, 12);
    for (var i = 0; i < top.length; i++) { var s = top[i].s.trim(); if (s.length < 70 && /\b(PVT\.?|PRIVATE|LTD\.?|LIMITED|LLP|LLC|INC\.?|CORP\.?|CORPORATION|COMPANY|GMBH|FZC|FZE|FZCO|EXPORTS?|IMPEX|ENTERPRISES?|INDUSTRIES|TRADERS|TRADING|OVERSEAS|INTERNATIONAL)\b/i.test(s) && !/INVOICE|PACKING|LIST|SOLD TO|CONSIGNEE|BUYER|BILL TO|SHIP TO/i.test(s)) return s; }
    return '';
  }
  function weights(d) {
    var skip = /TARE|VGM|MAX|PAYLOAD|CAPACITY/;
    var g = labelledNumbers(d, /GROSS\s*(CARGO\s*)?(WEIGHT|WT\.?|WGT|MASS)?|G\.\s?W\.?|GR\.?\s?WT\.?/, { skipPre: skip, stop: /NET|N\.\s?W|CBM|M3|VOLUME|MEAS/i });
    var n = labelledNumbers(d, /NETT?\s*(WEIGHT|WT\.?|WGT|MASS)|N\.\s?W\.?/, { skipPre: skip, stop: /GROSS|G\.\s?W|CBM|M3|VOLUME|MEAS/i });
    // numbers followed by KG anywhere (used only when nothing is labelled)
    var kg = [], m, re = /(\d{1,3}(?:[,.]\d{3})+(?:[.,]\d{1,3})?|\d+(?:[.,]\d{1,3})?)\s*(KGS?|KGM|KILOS?)\b/gi;
    while ((m = re.exec(d.text))) { var pre = U(d.text.slice(Math.max(0, m.index - 30), m.index)); if (!/TARE|VGM|MAX|PAYLOAD|NET/.test(pre)) kg.push({ v: num(m[1]) }); }
    function pick(a, fb) { a = a.filter(function (x) { return x.v != null && x.v >= 5 && x.v < 5e6; }); if (!a.length) a = fb || []; if (!a.length) return null; var t = a.filter(function (x) { return x.total; }); var pool = t.length ? t : a; var best = Math.max.apply(null, pool.map(function (x) { return x.v; })); return { v: best, all: uniq(a.map(function (x) { return x.v; })) }; }
    if (!g.length && !kg.length) { var tt = tableTotal(d, /GROSS/i, /NET|TARE/i); if (tt) g.push({ v: tt, total: true }); }
    return { gross: pick(g, kg), net: pick(n) };
  }
  var PKG = 'PACKAGES?|PACKAGE\\(S\\)|PKGS?\\.?|CARTONS?|CTNS?\\.?|PALLETS?|PLTS?\\.?|BOXES|BOX|CASES?|BALES?|BAGS?|DRUMS?|CRATES?|ROLLS?|BUNDLES?|COILS?|SKIDS?|PIECES?\\s+\\(PACKAGES\\)|WOODEN\\s+CASES?|CARTON\\s+BOXES';
  function packages(d) {
    var T = d.text, out = [], m, re = new RegExp('(\\d[\\d,]*)\\s*(' + PKG + ')\\b', 'gi');
    while ((m = re.exec(T))) {
      var ctx = U(T.slice(Math.max(0, m.index - 40), m.index)), v = num(m[1]);
      if (v == null || v <= 0 || v > 100000) continue;
      if (/\d[X×]\s*$|[X×]\s*$/.test(ctx) && v < 5) continue; // "1 X 40HC"
      out.push({ v: v, total: /TOTAL|TTL|GRAND|SAY|ALTOGETHER/.test(ctx.slice(-30)), unit: m[2].toUpperCase().replace(/[^A-Z]/g, '') });
    }
    re = /TOTAL\s*(NO\.?\s*OF\s*)?(ITEMS|PACKAGES|PKGS|CARTONS|CTNS|PALLETS|PACKINGS|PACKAGE\(S\))\s*[:.\-]?\s*(\d[\d,]*)/gi;
    while ((m = re.exec(T))) out.push({ v: num(m[3]), total: true });
    d.items.forEach(function (L) { if (!/^\s*(TOTAL\s*)?(NO\.?\s*OF\s*)?(PACKAGES|PKGS|CARTONS|CTNS)\s*[:.]?\s*$/i.test(L.s)) return; var c = below(d.items, L, { dy: 140, left: 50, right: 80, test: function (s) { return /^\s*\d[\d,]*\s*$/.test(s); } }); if (c.length) out.push({ v: num(c[0].s), total: /TOTAL/i.test(L.s) }); });
    if (!out.length) return null;
    var tot = out.filter(function (x) { return x.total; }), vals = uniq(out.map(function (x) { return x.v; }));
    var lines = uniq(out.filter(function (x) { return !x.total; }).map(function (x) { return x.v; })), sum = lines.reduce(function (a, b) { return a + b; }, 0);
    var v = tot.length ? Math.max.apply(null, tot.map(function (x) { return x.v; })) : (lines.length > 1 && vals.indexOf(sum) < 0 ? null : Math.max.apply(null, vals));
    var all = vals.slice(); if (lines.length > 1) all.push(sum);
    return { v: v != null ? v : Math.max.apply(null, vals), all: uniq(all), unit: (out.filter(function (x) { return x.unit; })[0] || {}).unit || '' };
  }

  /* ---------- codes ---------- */
  function hsCodes(d) {
    var T = d.text, out = [], m;
    var re = /(^|[^A-Za-z0-9.\-\/])(\d{4}[.\s]?\d{2}[.\s]?\d{2}(?:\d{2})?|\d{4}\.\d{2}|\d{6})(?!\d|[.,]\d)/g;
    while ((m = re.exec(T))) {
      var raw = m[2], c = raw.replace(/\D/g, ''), at = m.index + m[1].length, pre = U(T.slice(Math.max(0, at - 26), at));
      var ch = +c.slice(0, 2), labelled = /HS|HSN|H\.S|TARIFF|ITC|CTH|CUSTOMS\s*CODE|COMMODITY/.test(pre), dotted = /\./.test(raw);
      if (ch < 1 || ch > 97) continue;
      if (/\s/.test(raw) && !labelled) continue;
      if (/^\d{4}\.\d{2}$/.test(raw) && !labelled) continue;
      if (/(TEL|FAX|PHONE|PH\.?|MOB|MOBILE|CONTACT)\b[^\n]{0,14}$/.test(pre)) continue;
      if (!labelled && !dotted && /(TEL|PH|PHONE|MOB|FAX|IEC|S\.?\s?B|SB\s*NO|BILL|INVOICE|INV|GST|PIN|ZIP|A\/C|ACCOUNT|IFSC|BOOKING|REF|NO\.?\s*&?\s*$|NO\s*[:.]|#|\+|DATE|LUT|ARN|AD\s*CODE|CONTAINER|SEAL|PO|ORDER|LC|L\/C)\W*$/.test(pre)) continue;
      if (/^(19|20)\d{6}$/.test(c) && !labelled) continue; // looks like a date 20260511
      if (c.length === 6 && !labelled && !dotted) continue;
      if (c.length === 10 && !labelled && !/00$/.test(c)) continue;
      out.push(c);
    }
    return uniq(out);
  }
  function containerData(d) {
    var T = U(d.text), ok = [], bad = [], m, re = /\b([A-Z]{3}[UJZ])\s?(\d{6})\s?-?\s?(\d)\b/g;
    while ((m = re.exec(T))) { var c = m[1] + m[2] + m[3]; if (ctrCheck(c)) { if (ok.indexOf(c) < 0) ok.push(c); } else if (bad.indexOf(c) < 0) bad.push(c); }
    if (G.BLRead && d.method === 'ocr') G.BLRead.containers(T).forEach(function (c) { if (ok.indexOf(c) < 0) ok.push(c); });
    return { ok: ok, bad: bad.filter(function (c) { return ok.indexOf(c) < 0; }) };
  }
  function seals(d) {
    var T = U(d.text), out = [], m, re = /SEAL\s*(?:NO\.?|NOS\.?|NUMBER|#)?\s*[:.\-]?\s*([A-Z]{0,4}\d[A-Z0-9]{3,14})\b/g;
    while ((m = re.exec(T))) out.push(m[1]);
    re = /\b[A-Z]{3}[UJZ]\d{7}\s*\/\s*([A-Z]{0,4}\d[A-Z0-9]{3,14})\b/g; while ((m = re.exec(T))) out.push(m[1]);
    return uniq(out.filter(function (x) { return !/^[A-Z]{4}\d{7}$/.test(x) && !/^(NO|NUMBER)$/.test(x); }));
  }
  function ids(d) {
    var T = U(d.text), r = { iec: [], gstin: [] }, m, re = /\bIEC\s*(?:NO\.?|CODE|NUMBER)?\s*[:.\-–â€“\s]*([A-Z0-9]{10})\b/g;
    while ((m = re.exec(T))) r.iec.push(m[1]);
    re = /\b(\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z])\b/g; while ((m = re.exec(T))) r.gstin.push(m[1]);
    r.iec = uniq(r.iec); r.gstin = uniq(r.gstin); return r;
  }
  function invoiceNo(d) {
    var T = d.text, m, re = /INVOICE\s*(?:NO\.?|NUMBER|NUM|#)\s*(?:&|AND)?\s*(?:DATE)?\s*[:.\-]?\s*([A-Z0-9][A-Z0-9\/\-]{2,24})/gi;
    while ((m = re.exec(T))) { var v = m[1].replace(/[\/\-]+$/, ''); if (/\d/.test(v) && !/^(DATE|DATED|DT)$/i.test(v)) return v; }
    d.items.forEach(function () { });
    for (var i = 0; i < d.items.length; i++) { var L = d.items[i]; if (/^\s*(INVOICE|INV\.?)\s*(NO\.?|NUMBER|#)\s*[:.]?\s*$/i.test(L.s)) { var c = rightOf(d.items, L, 200).concat(below(d.items, L, { dy: 30 })).filter(function (x) { return /\d/.test(x.s) && /^[A-Z0-9\/\- ]{3,25}$/i.test(x.s.trim()); }); if (c.length) return c[0].s.trim(); } }
    return '';
  }
  var INCO = /\b(EXW|EX[\s-]?WORKS|FCA|FAS|FOB|F\.O\.B\.?|CFR|CNF|C\s?&\s?F|C\s?AND\s?F|CIF|C\.I\.F\.?|CPT|CIP|DAP|DPU|DDP)\b/;
  function incoterm(d) {
    var T = U(d.text), m = T.match(/(INCOTERMS?|TERMS\s+OF\s+DELIVERY|DELIVERY\s+TERMS?|PRICE\s+TERMS?|TERMS\s+OF\s+(SALE|PRICE))[^\n]{0,60}/), s = m ? m[0].match(INCO) : null;
    if (!s) s = T.match(INCO); if (!s) return '';
    var k = s[1].replace(/[.\s]/g, ''); return { 'EXWORKS': 'EXW', 'EX-WORKS': 'EXW', 'CNF': 'CFR', 'C&F': 'CFR', 'CANDF': 'CFR' }[k] || k;
  }
  function freightTerm(d) { var T = U(d.text), p = /FREIGHT\s*(IS\s*)?PRE-?PAID|PRE-?PAID\s*AS\s*ARRANGED/.test(T), c = /FREIGHT\s*(IS\s*)?COLLECT|COLLECT\s*AS\s*ARRANGED/.test(T); if (!p && !c) { p = /\bPRE-?PAID\b/.test(T); c = /\bCOLLECT\b/.test(T); } return p && !c ? 'PREPAID' : c && !p ? 'COLLECT' : p && c ? 'PREPAID/COLLECT' : ''; }
  var PORT_ALIAS = [['DELHI', /DELHI|INDIRA\s*GANDHI|\bDEL\b/], ['MUMBAI AIR', /BOMBAY|CHHATRAPATI|\bBOM\b/], ['DUBAI', /DUBAI|\bDXB\b|\bDWC\b|MAKTOUM/], ['HONG KONG', /HONG\s*KONG|\bHKG\b/], ['SAO PAULO', /S[AÃ]O\s*PAULO|GUARULHOS|\bGRU\b/], ['NHAVA SHEVA', /NHAVA\s*SHEVA|JNPT|JAWAHARLAL|INNSA/], ['MUNDRA', /MUNDRA|INMUN/], ['TUGHLAKABAD', /TUGHLAKABAD|\bTKD\b|INTKD/], ['CHENNAI', /CHENNAI|INMAA/], ['KOLKATA', /KOLKATA|CALCUTTA|INCCU/], ['PIPAVAV', /PIPAVAV/], ['HAZIRA', /HAZIRA/], ['KANDLA', /KANDLA|DEENDAYAL/]];
  function portKey(s) { s = U(s); for (var i = 0; i < PORT_ALIAS.length; i++) if (PORT_ALIAS[i][1].test(s)) return PORT_ALIAS[i][0]; var w = s.replace(/[^A-Z ]/g, ' ').split(/\s+/).filter(function (t) { return t.length > 2 && !/^(PORT|OF|LOADING|DISCHARGE|THE|CHINA|INDIA|ANY|CITY)$/.test(t); }); return w[0] || ''; }
  function port(d, rx) {
    var it = d.items;
    for (var i = 0; i < it.length; i++) {
      var L = it[i]; if (!rx.test(it[i].s) || it[i].s.length > 90 || !new RegExp('^\\s*(' + rx.source + ')', 'i').test(it[i].s)) continue;
      if (/AGENT|CONTRACT/i.test(L.s.replace(rx, ''))) continue;
      var rest = L.s.replace(rx, '').replace(/^[\s:.\-–]+/, ''); if (/[A-Z]{3}/i.test(rest) && !/PLACE|\bPORT\b|AGENT|COUNTRY|ORIGIN|VESSEL|DESTINATION|ROUTING|CARRIER|ADDR|ADDS|FLIGHT|REQUESTED/i.test(rest)) return rest.trim();
      var c = rightOf(it, L, 200).filter(function (x) { return /[A-Z]{3}/i.test(x.s) && !/\bPORT\b|PLACE|DELIVERY|RECEIPT|VESSEL|CARRIAGE|COUNTRY|ORIGIN|CONTRACT|NUMBER|TERMS|AGENT|DESTINATION|FINAL|FLIGHT|REQUESTED|REQUIRED|ACCOUNTING|INSURANCE|CURRENCY|REFERENCE/i.test(x.s); }); if (c.length && c[0].x - L.x < 170) return c[0].s.trim();
      c = below(it, L, { dy: 30, left: 90, right: 200, test: function (s) { return /[A-Z]{3}/i.test(s) && !/\bPORT\b|PLACE|DELIVERY|RECEIPT|VESSEL|CARRIAGE|VOYAGE|BOOKING|REF|REQUIRED|INSURANCE|COUNTRY|ORIGIN|CONTRACT|NUMBER|TERMS|AGENT|DESTINATION|FINAL|F U R|ROUTING|FLIGHT|REQUESTED|CURRENCY|^TO$|^BY|^\(/i.test(s) && s.trim().length > 2; } }); if (c.length) return c[0].s.trim();
    }
    var m = d.text.match(new RegExp('(?:^|\\n)\\s*(?:' + rx.source + ')\\s*[:.\\-]?\\s*([A-Za-z][A-Za-z ,]{2,30})', 'i')); return m && !/PORT|PLACE|COUNTRY|AGENT/i.test(m[1]) ? m[1].trim() : '';
  }

  /* ---------- air waybill ---------- */
  function awbNo(d) {
    var T = U(d.text), m, re = /(?:^|[^\d])(\d{3})[\s\-]*(?:[A-Z]{3}[\s\-]*)?(\d{4})[\s\-]*(\d{4})(?!\d)/g, bad = '';
    while ((m = re.exec(T))) { var ser = m[2] + m[3]; if (+ser.slice(0, 7) % 7 === +ser[7]) return { v: m[1] + '-' + ser, ok: true }; if (!bad && /AWB|AIR\s*WAYBILL|MAWB|HAWB/.test(T.slice(Math.max(0, m.index - 30), m.index))) bad = m[1] + '-' + ser; }
    return bad ? { v: bad, ok: false } : null;
  }
  function colNum(d, labelRx, intOnly) {
    for (var i = 0; i < d.items.length; i++) { var L = d.items[i]; if (!labelRx.test(L.s.trim())) continue; var c = below(d.items, L, { dy: 70, left: 60, right: 60, test: function (s) { return intOnly ? /^\s*\d{1,5}\s*$/.test(s) : /^\s*\d[\d.,]*\s*(K|KG|KGS)?\s*$/i.test(s); } }); if (c.length) return num(c[0].s.replace(/[^\d.,]/g, '')); }
    return null;
  }
  function airFacts(d, f) {
    f.awb = awbNo(d);
    if (f.awb) { var ser = f.awb.v.slice(4); f.hs = f.hs.filter(function (h) { return h !== ser; }); }
    var pcs = colNum(d, /^(NO\.?\s*OF\s*)?PIECES(\s*RCP)?$|^NO\.?\s*OF$/i, true), m = U(d.text).match(/(?:TOTAL\s*)?(?:NO\.?\s*OF\s*)?PIECES\s*[:.\-]?\s*(\d{1,5})\b/);
    if (pcs == null && m) pcs = +m[1];
    if (pcs != null) f.pkgs = { v: pcs, all: [pcs], unit: 'PCS' };
    var cw = colNum(d, /^CHARGEABLE(\s*WEIGHT)?$/i); f.charge = cw;
    return f;
  }

  /* ---------- extract all facts from one document ---------- */
  function extract(d, air) {
    d.items = d.items || []; d.text = d.text || '';
    var w = weights(d), c = containerData(d);
    var f = {
      shipper: party(d, /^\s*(SHIPPER|EXPORTER|SELLER|CONSIGNOR|SUPPLIER|BENEFICIARY)(?![\u2019'`\u00b4]?\s*S\s*(LOAD|REF|STOW|COUNT|DECLARATION|CERTIF|ACCOUNT|INSTRUCTION|ATTENTION|SIGNATURE))(?![A-Z])/i),
      consignee: party(d, /^\s*(CONSIGNEE|BUYER|IMPORTER|SOLD\s+TO|BILL\s+TO|SHIP\s+TO|DELIVER\s+TO)(?![\u2019'`\u00b4]?\s*S?\s*ACCOUNT)\b/i),
      gross: w.gross, net: w.net, pkgs: packages(d), hs: hsCodes(d), ctr: c.ok, ctrBad: c.bad, seals: seals(d), ids: ids(d),
      inv: invoiceNo(d), inco: incoterm(d), freight: freightTerm(d),
      pol: port(d, /AIRPORT\s+OF\s+DEPARTURE|PORT\s+OF\s+LOADING|PORT\s+OF\s+SHIPMENT|LOADING\s+PORT|\bPOL\b/i), pod: port(d, /AIRPORT\s+(OF\s+)?DESTINATION|PORT\s+OF\s+DISCHARGE|DISCHARGE\s+PORT|PORT\s+OF\s+DESTINATION|\bPOD\b/i)
    };
    if (!f.shipper) f.shipper = letterhead(d);
    return air ? airFacts(d, f) : f;
  }

  /* ---------- compare ---------- */
  var KINDS = [['inv', 'Commercial invoice'], ['pl', 'Packing list'], ['bl', 'Bill of lading']];
  function near(a, b) { return Math.abs(a - b) <= Math.max(1, 0.005 * Math.max(a, b)); }
  var AIR = false;
  function compare(F, T, air) { // F: {inv,pl,bl} facts (or null), T: texts; air: third document is an air waybill
    AIR = !!air;
    var rows = [], notes = [], have = KINDS.filter(function (k) { return F[k[0]]; }).map(function (k) { return k[0]; });
    function row(id, label, cells, status, note) { rows.push({ id: id, label: label, cells: cells, status: status, note: note || '' }); }
    // parties: extracted name searched in the other documents
    ['shipper', 'consignee'].forEach(function (p) {
      var src = (p === 'shipper' ? ['inv', 'bl', 'pl'] : ['bl', 'inv', 'pl']).filter(function (k) { return F[k] && F[k][p]; })[0];
      var label = p === 'shipper' ? 'Shipper / exporter' : 'Consignee / buyer', cells = {};
      if (!src) { have.forEach(function (k) { cells[k] = { v: '', s: 'miss' }; }); row(p, label, cells, 'miss', 'Name not found. Type it in to check it against the other documents.'); return; }
      var name = F[src][p], bad = [];
      have.forEach(function (k) { if (k === src) { cells[k] = { v: name, s: 'ok', edit: true }; return; } var f = nameFound(name, T[k]); cells[k] = { v: f ? 'Found' : 'Not found', s: f ? 'ok' : 'bad' }; if (!f) bad.push(k); });
      row(p, label, cells, bad.length ? 'bad' : 'ok', bad.length ? '“' + name + '” does not appear on the ' + bad.map(nm).join(' and ') + '. ' + (p === 'consignee' ? 'The invoice buyer can legitimately differ from the ' + nm('bl') + ' consignee (e.g. “to order” or a bank), but it must be deliberate.' : 'Check the spelling and the legal name.') : '');
    });
    // numbers
    function numRow(id, label, key, unit, why) {
      var cells = {}, vals = [];
      have.forEach(function (k) { var x = F[k][key]; cells[k] = x && x.v != null ? { v: fmt(x.v) + (unit ? ' ' + unit : ''), s: 'ok', edit: true, n: x.v, all: x.all } : { v: '', s: 'miss', edit: true }; if (x && x.v != null) vals.push([k, x]); });
      var st = 'ok', note = '';
      if (vals.length < 2) st = vals.length ? 'info' : 'miss';
      else {
        var base = vals[0][1], off = vals.filter(function (p) { return !near(p[1].v, base.v) && !(p[1].all || []).some(function (a) { return (base.all || [base.v]).some(function (b) { return near(a, b); }); }); });
        if (off.length) { st = 'bad'; off.forEach(function (p) { cells[p[0]].s = 'bad'; }); note = why; }
      }
      row(id, label, cells, st, note);
    }
    numRow('gross', 'Gross weight', 'gross', 'kg', 'Gross weights differ. Customs and the shipping line compare these; a mismatch can lead to a hold, examination or amendment fees.');
    numRow('net', 'Net weight', 'net', 'kg', 'Net weights differ between documents.');
    numRow('pkgs', AIR ? 'Packages / pieces' : 'Number of packages', 'pkgs', '', AIR ? 'Piece counts differ. The pieces on the AWB and IGM must match the packing list, or the shipment can be held as short or excess landed.' : 'Package counts differ. The count on the B/L/IGM must match the packing list, or the shipment can be held as short or excess.');
    have.forEach(function (k) { var g = F[k].gross, n = F[k].net; if (g && n && n.v > g.v + 0.01) notes.push({ s: 'bad', t: 'On the ' + nm(k) + ', net weight (' + fmt(n.v) + ' kg) is more than gross weight (' + fmt(g.v) + ' kg).' }); });
    // sets
    function setRow(id, label, get, why, opt) {
      opt = opt || {}; var cells = {}, sets = {}, any = 0;
      have.forEach(function (k) { var s = get(F[k]) || []; sets[k] = s; if (s.length) any++; cells[k] = { v: s.join(', '), s: s.length ? 'ok' : (opt.optional && opt.optional(k) ? 'na' : 'miss'), edit: true, list: true }; });
      var st = any >= 2 ? 'ok' : any ? 'info' : 'miss', note = '', diff = [];
      if (any >= 2) {
        var keys = have.filter(function (k) { return sets[k].length; }), norm = opt.norm || function (x) { return x; };
        keys.forEach(function (a) { keys.forEach(function (b) { if (a >= b) return; var A = sets[a].map(norm), B = sets[b].map(norm), onlyA = A.filter(function (x) { return B.indexOf(x) < 0; }), onlyB = B.filter(function (x) { return A.indexOf(x) < 0; }); if (onlyA.length || onlyB.length) { st = opt.soft ? 'warn' : 'bad'; cells[a].s = cells[b].s = opt.soft ? 'warn' : 'bad'; diff.push((onlyA.length ? onlyA.join(', ') + ' on the ' + nm(a) + ' only' : '') + (onlyA.length && onlyB.length ? '; ' : '') + (onlyB.length ? onlyB.join(', ') + ' on the ' + nm(b) + ' only' : '')); } }); });
        if (diff.length) note = why + ' ' + uniq(diff).join('. ') + '.';
      }
      row(id, label, cells, st, note);
    }
    if (AIR && F.bl) { var a = F.bl.awb, ac = {}; have.forEach(function (k) { ac[k] = k === 'bl' ? (a ? { v: a.v, s: a.ok ? 'ok' : 'bad' } : { v: '', s: 'miss' }) : { v: '', s: 'na' }; }); row('awb', 'AWB number', ac, a ? (a.ok ? 'ok' : 'bad') : 'miss', a && !a.ok ? 'AWB ' + a.v + ' fails the airline check digit (the last digit should equal the first seven digits of the serial divided by 7). It is probably mistyped.' : ''); if (F.bl.charge && F.bl.gross && F.bl.charge > F.bl.gross.v + 1) notes.push({ s: 'info', t: 'Chargeable weight on the AWB (' + fmt(F.bl.charge) + ' kg) is higher than the gross weight (' + fmt(F.bl.gross.v) + ' kg): the cargo is billed on volume weight. Check the carton dimensions if this looks high.' }); }
    if (!AIR) setRow('ctr', 'Container numbers', function (f) { return f.ctr; }, 'Container numbers differ:', { optional: function (k) { return k === 'inv'; } });
    if (!AIR) setRow('seal', 'Seal numbers', function (f) { return f.seals; }, 'Seal numbers differ:', { optional: function (k) { return k === 'inv'; } });
    setRow('hs', 'HS codes (first 6 digits compared)', function (f) { return f.hs; }, 'HS codes differ:', { soft: true, norm: function (x) { return x.slice(0, 6); } });
    setRow('iec', 'IEC', function (f) { return f.ids.iec; }, 'IEC numbers differ:', { optional: function () { return true; } });
    setRow('gstin', 'GSTIN', function (f) { return f.ids.gstin; }, 'GSTINs differ:', { optional: function () { return true; } });
    // invoice number referenced elsewhere
    if (F.inv) {
      var iv = F.inv.inv, cells = { inv: iv ? { v: iv, s: 'ok', edit: true } : { v: '', s: 'miss', edit: true } }, st = iv ? 'ok' : 'miss', note = '';
      have.filter(function (k) { return k !== 'inv'; }).forEach(function (k) { if (!iv) { cells[k] = { v: '', s: 'na' }; return; } var f = U(T[k]).replace(/\s/g, '').indexOf(U(iv).replace(/\s/g, '')) >= 0; cells[k] = { v: f ? 'Referenced' : 'Not referenced', s: f ? 'ok' : (k === 'pl' ? 'warn' : 'na') }; if (!f && k === 'pl') { st = 'warn'; note = 'The packing list does not mention invoice ' + iv + '. Most custom houses expect the packing list to carry the invoice number and date.'; } });
      row('invno', 'Invoice number', cells, st, note);
    }
    // ports
    ['pol', 'pod'].forEach(function (p) {
      var cells = {}, keys = {}, n = 0;
      have.forEach(function (k) { var v = F[k][p]; cells[k] = v ? { v: v, s: 'ok', edit: true } : { v: '', s: 'na', edit: true }; if (v) { keys[k] = portKey(v); n++; } });
      var vals = uniq(Object.keys(keys).map(function (k) { return keys[k]; }).filter(Boolean)), st = n >= 2 ? (vals.length > 1 ? 'warn' : 'ok') : n ? 'info' : 'miss';
      if (st === 'warn') Object.keys(keys).forEach(function (k) { cells[k].s = 'warn'; });
      row(p, p === 'pol' ? (AIR ? 'Airport of departure' : 'Port of loading') : (AIR ? 'Airport of destination' : 'Port of discharge'), cells, st, st === 'warn' ? 'Ports read differently on the documents. Check whether this is a real difference (e.g. place of receipt vs port of loading) or a typo.' : '');
    });
    // invalid container numbers
    have.forEach(function (k) { (F[k].ctrBad || []).forEach(function (c) { notes.push({ s: 'bad', t: 'Container ' + c + ' on the ' + nm(k) + ' fails the ISO 6346 check digit. It is probably mistyped.' }); }); });
    // incoterm vs freight term
    var inco = F.inv && F.inv.inco, fr = F.bl && F.bl.freight;
    if (inco && fr && fr.indexOf('/') < 0) {
      var exp = /^(EXW|FCA|FAS|FOB)$/.test(inco) ? 'COLLECT' : /^(CFR|CIF|CPT|CIP|DAP|DPU|DDP)$/.test(inco) ? 'PREPAID' : '';
      if (exp && exp !== fr) notes.push({ s: 'warn', t: 'The invoice says ' + inco + ' but the ' + nm('bl') + ' says freight ' + fr.toLowerCase() + '. Under ' + inco + ' freight is normally ' + exp.toLowerCase() + '. This can be fine if agreed, but confirm it: it affects who pays and the customs value (freight is added for assessment under FOB/FCA).' });
      else if (exp) notes.push({ s: 'ok', t: 'Incoterm ' + inco + ' on the invoice is consistent with freight ' + fr.toLowerCase() + ' on the ' + nm('bl') + '.' });
    }
    if (!AIR && F.bl && F.bl.hs.length === 0 && have.indexOf('bl') >= 0) notes.push({ s: 'info', t: 'No HS codes found on the B/L. Many lines now ask for them on the manifest, so check if your shipping line or destination requires them.' });
    var c = { ok: 0, bad: 0, warn: 0, miss: 0 }; rows.forEach(function (r) { if (c[r.status] != null) c[r.status]++; }); notes.forEach(function (n) { if (n.s === 'bad') c.bad++; if (n.s === 'warn') c.warn++; });
    return { rows: rows, notes: notes, have: have, count: c };
  }
  function nm(k) { return { inv: 'invoice', pl: 'packing list', bl: AIR ? 'AWB' : 'B/L' }[k]; }

  G.DocCheck = { extract: extract, compare: compare, num: num, nameFound: nameFound, KINDS: KINDS, _: { hsCodes: hsCodes, packages: packages, weights: weights, seals: seals, party: party, port: port } };

  /* ---------- UI ---------- */
  if (typeof document === 'undefined') return;
  var root = document.getElementById('dc-root'); if (!root) return;
  var css = '.dc-slots{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.dc-slot{border:2px dashed #CFE3F5;border-radius:18px;padding:18px;background:#F7FBFF;cursor:pointer;position:relative;min-height:128px;display:flex;flex-direction:column;gap:6px;transition:border-color .15s,background .15s}.dc-slot:hover,.dc-slot.drag{border-color:#0A6CC2;background:#EEF6FE}.dc-slot.done{border-style:solid;border-color:#9AD1B0;background:#F1FBF5}.dc-slot input{position:absolute;inset:0;opacity:0;cursor:pointer}.dc-k{font-family:"Archivo",sans-serif;font-weight:800;font-size:18px;color:#0B2A4A}.dc-h{font-size:13.5px;color:#5E7891;line-height:1.45}.dc-f{font-size:13.5px;color:#0F7B3F;font-weight:600;word-break:break-all}.dc-x{position:relative;z-index:2;align-self:flex-start;font:inherit;font-size:12.5px;border:0;background:none;color:#B42318;cursor:pointer;padding:0}.dc-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:16px}.dc-btn{font:inherit;font-weight:600;border:0;background:#0A6CC2;color:#fff;border-radius:999px;padding:14px 26px;cursor:pointer;font-size:16px}.dc-btn[disabled]{opacity:.45;cursor:default}.dc-btn2{font:inherit;font-weight:600;border:1px solid #CFE3F5;background:#fff;color:#0A6CC2;border-radius:999px;padding:12px 20px;cursor:pointer;font-size:14.5px}.dc-priv{font-size:13px;color:#0F7B3F;display:flex;gap:6px;align-items:center}.dc-st{font-size:14px;color:#5E7891;margin-top:10px;min-height:20px}.dc-sum{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0 14px}.dc-chip{border-radius:14px;padding:12px 16px;font-size:14px;font-weight:600;min-width:120px}.dc-chip b{display:block;font-family:"Archivo",sans-serif;font-size:26px;font-weight:900}.dc-tw{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid #E1EDF7;border-radius:16px}.dc-t{border-collapse:collapse;width:100%;min-width:640px;font-size:14px}.dc-t th{background:#F2F8FD;text-align:left;padding:12px 14px;font-size:12.5px;letter-spacing:.04em;color:#3D5873;text-transform:uppercase}.dc-t td{padding:10px 14px;border-top:1px solid #EEF3F8;vertical-align:top}.dc-t td:first-child{font-weight:600;color:#0B2A4A;width:270px}.dc-t td{padding-left:22px}.dc-t td:first-child{padding-left:14px}.dc-v{font:inherit;font-size:14px;width:100%;min-width:120px;border:1px solid transparent;border-radius:8px;padding:6px 8px;background:transparent;color:inherit}.dc-v:hover,.dc-v:focus{border-color:#CFE3F5;background:#fff;outline:none}.dc-c{border-radius:10px}.dc-ok{background:#F1FBF5}.dc-bad{background:#FEF3F2}.dc-warn{background:#FFF8E6}.dc-miss{background:#F7F8FA;color:#8A9AAD}.dc-na{color:#8A9AAD}.dc-n{font-size:13px;color:#B42318;line-height:1.5;margin-top:4px}.dc-n.w{color:#9A5B00}.dc-ic{display:inline-block;width:22px;font-weight:700}.dc-notes{margin-top:18px;display:flex;flex-direction:column;gap:8px}.dc-note{border-radius:12px;padding:12px 14px;font-size:14.5px;line-height:1.55}.dc-disc{font-size:12.5px;color:#5E7891;line-height:1.6;margin-top:18px}.dc-ph{display:none}.dc-pv{display:none}.dc-mode{display:inline-flex;gap:4px;background:#EEF4FA;border-radius:999px;padding:4px;margin-bottom:14px;flex-wrap:wrap}.dc-mode button{font:inherit;font-weight:600;font-size:14.5px;border:0;background:none;color:#3D5873;border-radius:999px;padding:10px 18px;cursor:pointer}.dc-mode button.on{background:#fff;color:#0A6CC2;box-shadow:0 1px 4px rgba(11,42,74,.12)}@media print{body.dc-print #app>div>div:not(:has(#dc-report)){display:none!important}body.dc-print #app>div>div:has(#dc-report)>div{padding:0 10mm!important;max-width:none!important}body.dc-print #dc-root{border:0!important;padding:0!important}body.dc-print .dc-slots,body.dc-print .dc-mode,body.dc-print #dc-root>.dc-bar,body.dc-print #dc-st{display:none!important}.dc-noprint{display:none!important}.dc-t tr{break-inside:avoid}.dc-v{display:none!important}.dc-pv{display:block!important;word-break:break-word}.dc-ph{display:block!important}.dc-tw{overflow:visible;border:0}.dc-t{min-width:0;font-size:11px}.dc-v{border:0!important;padding:0;font-size:11px}.dc-t td,.dc-t th{padding:6px 8px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var HINT = { inv: 'PDF, scan or photo. Shows buyer, seller, Incoterm, HS codes.', pl: 'PDF, scan or photo. Shows packages, net and gross weights.', bl: 'B/L or sea waybill, draft or final.', awb: 'Master or house AWB, draft or final.' };
  var S = { files: {}, data: {}, facts: {}, over: {}, air: /[?&]mode=air/.test(location.search) };
  function hint(k) { return k === 'bl' && S.air ? HINT.awb : HINT[k]; }
  root.innerHTML = '<div class="dc-mode" role="tablist"><button type="button" data-m="sea">🚢 Sea freight · B/L</button><button type="button" data-m="air">✈️ Air freight · AWB</button></div><div class="dc-slots">' + KINDS.map(function (k) { return '<label class="dc-slot" data-k="' + k[0] + '"><input type="file" accept="application/pdf,image/*" data-k="' + k[0] + '"><span class="dc-k" data-t="' + k[0] + '">' + k[1] + '</span><span class="dc-h" data-h="' + k[0] + '">' + HINT[k[0]] + '</span></label>'; }).join('') + '</div>'
    + '<div class="dc-bar"><button class="dc-btn" id="dc-go" disabled>Check documents</button><button class="dc-btn2" id="dc-demo">Try with sample documents</button><span class="dc-priv">🔒 Your documents are read on this device and never uploaded.</span></div><div class="dc-st" id="dc-st"></div><div id="dc-report"></div>';
  var stEl = document.getElementById('dc-st'), go = document.getElementById('dc-go'), rep = document.getElementById('dc-report');
  function setSlot(k) {
    var lab = root.querySelector('.dc-slot[data-k="' + k + '"]'), hEl = lab.querySelector('[data-h]'), f = S.files[k];
    lab.classList.toggle('done', !!f);
    hEl.innerHTML = f ? '<span class="dc-f">✓ ' + h(f.name) + '</span>' : hint(k);
    var old = lab.querySelector('.dc-x'); if (old) old.remove();
    if (f) { var x = document.createElement('button'); x.className = 'dc-x'; x.type = 'button'; x.textContent = 'Remove'; x.onclick = function (e) { e.preventDefault(); delete S.files[k]; delete S.data[k]; lab.querySelector('input').value = ''; setSlot(k); }; lab.appendChild(x); }
    go.disabled = Object.keys(S.files).length < 2;
  }
  root.querySelectorAll('input[type=file]').forEach(function (inp) {
    inp.addEventListener('change', function () { if (inp.files[0]) { S.files[inp.dataset.k] = inp.files[0]; delete S.data[inp.dataset.k]; setSlot(inp.dataset.k); } });
    var lab = inp.parentNode; ['dragenter', 'dragover'].forEach(function (e) { lab.addEventListener(e, function () { lab.classList.add('drag'); }); }); ['dragleave', 'drop'].forEach(function (e) { lab.addEventListener(e, function () { lab.classList.remove('drag'); }); });
  });
  var BASE = (function () { var s = document.currentScript || [].slice.call(document.scripts).filter(function (x) { return /doc-check\.js/.test(x.src); })[0]; return s ? s.src.replace(/[^\/]*$/, '') : ''; })();
  function setMode(air) { S.air = air; root.querySelectorAll('.dc-mode button').forEach(function (b) { b.classList.toggle('on', (b.dataset.m === 'air') === air); }); root.querySelector('[data-t=bl]').textContent = air ? 'Air waybill (AWB)' : 'Bill of lading'; setSlot('bl'); if (rep.innerHTML) draw(); }
  root.querySelectorAll('.dc-mode button').forEach(function (b) { b.onclick = function () { setMode(b.dataset.m === 'air'); }; });
  setMode(S.air);
  document.getElementById('dc-demo').onclick = function () {
    stEl.textContent = 'Loading the sample documents…';
    Promise.all(KINDS.map(function (k) { return fetch(BASE + 'samples/sample-' + (S.air ? { inv: 'inv-air', pl: 'pl-air', bl: 'awb' }[k[0]] : k[0]) + '.pdf').then(function (r) { return r.blob(); }).then(function (b) { S.files[k[0]] = new File([b], 'sample-' + { inv: 'commercial-invoice', pl: 'packing-list', bl: S.air ? 'air-waybill' : 'bill-of-lading' }[k[0]] + '.pdf', { type: 'application/pdf' }); delete S.data[k[0]]; setSlot(k[0]); }); }))
      .then(run).catch(function () { stEl.textContent = 'Could not load the samples. Please try again.'; });
  };
  go.onclick = run;
  function run() {
    var ks = KINDS.map(function (k) { return k[0]; }).filter(function (k) { return S.files[k]; }); if (ks.length < 2) return;
    go.disabled = true; rep.innerHTML = ''; S.over = {};
    var i = 0;
    (function next() {
      if (i >= ks.length) { go.disabled = false; stEl.textContent = ''; draw(); rep.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      var k = ks[i++];
      if (S.data[k]) return next();
      stEl.textContent = 'Reading the ' + nm(k) + '…';
      G.BLRead.readText(S.files[k], function (p) { stEl.textContent = 'Reading the ' + nm(k) + ': ' + p.stage + (p.p ? ' (' + Math.round(p.p * 100) + '%)' : ''); }).then(function (d) { S.data[k] = d; next(); }).catch(function () { stEl.textContent = 'Could not read the ' + nm(k) + '. Is it a PDF or a clear photo?'; go.disabled = false; });
    })();
  }
  function applyOver(F) {
    Object.keys(S.over).forEach(function (key) {
      var p = key.split('|'), k = p[0], id = p[1], v = S.over[key], f = F[k]; if (!f) return;
      var map = { gross: 'gross', net: 'net', pkgs: 'pkgs' };
      if (map[id]) { var n = num(v.replace(/[^\d.,]/g, '')); f[map[id]] = n == null ? null : { v: n, all: [n] }; }
      else if (id === 'ctr') f.ctr = U(v).split(/[\s,;]+/).filter(Boolean);
      else if (id === 'seal') f.seals = U(v).split(/[\s,;]+/).filter(Boolean);
      else if (id === 'hs') f.hs = v.split(/[\s,;]+/).map(function (x) { return x.replace(/\D/g, ''); }).filter(Boolean);
      else if (id === 'iec') f.ids.iec = U(v).split(/[\s,;]+/).filter(Boolean);
      else if (id === 'gstin') f.ids.gstin = U(v).split(/[\s,;]+/).filter(Boolean);
      else if (id === 'invno') f.inv = v.trim();
      else if (id === 'shipper' || id === 'consignee') { f[id] = v.trim(); }
      else if (id === 'pol' || id === 'pod') f[id] = v.trim();
    });
  }
  function draw() {
    var F = {}, T = {};
    Object.keys(S.data).forEach(function (k) { if (S.files[k]) { F[k] = extract({ text: S.data[k].text, items: S.data[k].items, method: S.data[k].method }, S.air && k === 'bl'); T[k] = S.data[k].text; } });
    applyOver(F);
    // a typed party name: re-search the others
    var R = compare(F, T, S.air), c = R.count, cols = R.have;
    var SYM = { ok: '✓', bad: '✗', warn: '!', miss: '?', info: 'i', na: '–' }, COL = { ok: '#0F7B3F', bad: '#B42318', warn: '#9A5B00', miss: '#8A9AAD', info: '#0A6CC2', na: '#8A9AAD' };
    var html = '<div class="dc-ph" style="font-family:Archivo,sans-serif;font-weight:900;font-size:18px;margin-bottom:4px">Shipping document check · ' + (S.air ? 'Air freight' : 'Sea freight') + '</div><div class="dc-ph" style="font-size:11px;color:#5E7891;margin-bottom:10px">' + new Date().toLocaleString('en-GB') + ' · ' + cols.map(function (k) { return h(S.files[k].name); }).join(' · ') + '</div>'
      + '<div class="dc-sum">' + [['bad', 'Mismatches', '#FEF3F2', '#B42318'], ['warn', 'Check these', '#FFF8E6', '#9A5B00'], ['ok', 'Matching', '#F1FBF5', '#0F7B3F'], ['miss', 'Not found', '#F7F8FA', '#5E7891']].map(function (x) { return '<div class="dc-chip" style="background:' + x[2] + ';color:' + x[3] + '"><b>' + c[x[0]] + '</b>' + x[1] + '</div>'; }).join('') + '</div>'
      + '<div class="dc-tw"><table class="dc-t"><thead><tr><th>Check</th>' + cols.map(function (k) { return '<th>' + h({ inv: 'Invoice', pl: 'Packing list', bl: S.air ? 'AWB' : 'B/L' }[k]) + '</th>'; }).join('') + '</tr></thead><tbody>'
      + R.rows.map(function (r) {
        return '<tr><td><span class="dc-ic" style="color:' + COL[r.status] + '">' + SYM[r.status] + '</span>' + h(r.label) + (r.note ? '<div class="dc-n' + (r.status === 'warn' ? ' w' : '') + '">' + h(r.note) + '</div>' : '') + '</td>'
          + cols.map(function (k) { var x = r.cells[k] || { v: '', s: 'na' }; return '<td class="dc-c dc-' + x.s + '">' + (x.edit ? '<input class="dc-v" data-o="' + k + '|' + r.id + '" value="' + h(x.v) + '" placeholder="' + (x.s === 'na' ? '–' : 'not found, type to add') + '"><span class="dc-pv">' + h(x.v || (x.s === 'na' ? '–' : 'not found')) + '</span>' : h(x.v || (x.s === 'na' ? '–' : 'not found'))) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>'
      + (R.notes.length ? '<div class="dc-notes">' + R.notes.map(function (n) { return '<div class="dc-note" style="background:' + { bad: '#FEF3F2', warn: '#FFF8E6', ok: '#F1FBF5', info: '#F2F8FD' }[n.s] + '"><b style="color:' + COL[n.s] + '">' + SYM[n.s] + '</b> ' + h(n.t) + '</div>'; }).join('') + '</div>' : '')
      + '<div class="dc-bar dc-noprint"><button class="dc-btn" id="dc-pdf">Download report (PDF)</button><span class="dc-h">Something misread? Click any value in the table to correct it; the check updates.</span></div>'
      + '<p class="dc-disc">This check is automated and reads documents by pattern, so it can miss or misread values; scans and photos are less accurate than PDFs. It does not replace review by your customs broker, and YAM Logistics accepts no liability for decisions based on it. Your documents were read on your device and were not uploaded or stored.</p>';
    rep.innerHTML = html;
    rep.querySelectorAll('.dc-v').forEach(function (inp) { inp.addEventListener('change', function () { S.over[inp.dataset.o] = inp.value; draw(); }); });
    document.getElementById('dc-pdf').onclick = function () { document.body.classList.add('dc-print'); window.print(); };
    window.addEventListener('afterprint', function () { document.body.classList.remove('dc-print'); });
  }
})(typeof window !== 'undefined' ? window : globalThis);
