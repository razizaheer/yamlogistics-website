/* YAM Logistics — read a bill of lading / sea waybill (PDF, scan or photo) in the browser.
   Finds the shipping line, the B/L number and the container numbers. Nothing is uploaded:
   text PDFs are read with pdf.js, scans and photos with Tesseract OCR, both running locally. */
(function (G) {
  'use strict';
  var BASE = (function () { var s = document.currentScript; return s ? s.src.replace(/[^\/]*$/, '') : ''; })();
  function loadScript(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  var pdfP = null, tessP = null;
  function pdfjs() { if (!pdfP) pdfP = loadScript(BASE + 'vendor/ocr/pdf.min.js?v=3').then(function () { var L = G.pdfjsLib; L.GlobalWorkerOptions.workerSrc = BASE + 'vendor/ocr/pdf.worker.min.js?v=3'; return L; }); return pdfP; }
  function tess(onp) {
    if (!tessP) tessP = loadScript(BASE + 'vendor/ocr/tesseract.min.js?v=5').then(function () {
      return G.Tesseract.createWorker('eng', 1, { workerPath: BASE + 'vendor/ocr/worker.min.js?v=5', corePath: BASE + 'vendor/ocr/', langPath: BASE + 'vendor/ocr/lang', gzip: true, logger: function (m) { if (tessP && tessP.onp) tessP.onp(m); } });
    });
    tessP.onp = onp; return tessP;
  }

  // Shipping lines, matched on names printed on the document (strongest first)
  var LINES = [
    ['MSC', /MEDITERRANEAN\s+SHIPPING|\bmsc\.com\b|\bMEDU[A-Z0-9]{6,}/i], ['CMA CGM', /CMA\s*CGM/i], ['Maersk', /\bMAERSK\b/i], ['Hapag-Lloyd', /HAPAG/i],
    ['ONE (Ocean Network Express)', /OCEAN\s+NETWORK\s+EXPRESS|one-line\.com|\bONEY[A-Z0-9]{6,}/i], ['COSCO Shipping', /\bCOSCO\b/i], ['OOCL', /\bOOCL\b|ORIENT\s+OVERSEAS/i],
    ['Evergreen', /EVERGREEN\s+(LINE|MARINE)|shipmentlink|\bEGLV\d{6,}/i], ['Yang Ming', /YANG\s*MING/i], ['HMM', /\bHMM\b|HYUNDAI\s+MERCHANT/i], ['ZIM', /ZIM\s+INTEGRATED|\bzim\.com\b/i],
    ['Wan Hai Lines', /WAN\s*HAI/i], ['PIL (Pacific International Lines)', /PACIFIC\s+INTERNATIONAL\s+LINES|pilship/i], ['KMTC', /\bKMTC|KOREA\s+MARINE\s+TRANSPORT|ekmtc/i],
    ['Sinokor', /SINOKOR|\bSNKO\d{6,}/i], ['RCL (Regional Container Lines)', /REGIONAL\s+CONTAINER\s+LINES/i], ['SITC', /\bSITC\b/i], ['X-Press Feeders', /X-?PRESS\s+FEEDERS/i],
    ['Emirates Shipping Line', /EMIRATES\s+SHIPPING\s+LINE/i], ['TS Lines', /\bT\.?S\.?\s+LINES\b/i], ['Shipping Corporation of India', /SHIPPING\s+CORPORATION\s+OF\s+INDIA/i],
    ['Unifeeder', /UNIFEEDER/i], ['Hamburg Süd', /HAMBURG\s+S(U|Ü)D/i], ['Gold Star Line', /GOLD\s+STAR\s+LINE/i], ['CU Lines', /\bCU\s+LINES\b/i], ['InterAsia Lines', /INTERASIA/i],
    ['SM Line', /\bSM\s+LINE\b/i], ['CK Line', /\bCK\s+LINE\b/i], ['Namsung Shipping', /NAMSUNG/i], ['Pan Continental Shipping', /PAN\s+CONTINENTAL|\bPANCON\b/i], ['Dongyoung Shipping', /DONGYOUNG/i],
    ['Marfret', /MARFRET/i], ['Swire Shipping', /SWIRE\s+SHIPPING/i], ['Grimaldi', /GRIMALDI/i], ['Sallaum Lines', /SALLAUM/i], ['Sea Lead Shipping', /SEA\s+LEAD/i], ['Simatech Shipping', /SIMATECH/i],
    ['Global Feeder Shipping', /GLOBAL\s+FEEDER/i], ['Bengal Tiger Line', /BENGAL\s+TIGER/i], ['Transworld Feeders', /TRANSWORLD\s+FEEDERS/i], ['Shreyas Shipping', /SHREYAS/i], ['Sarjak Container Lines', /SARJAK/i]
  ];
  // B/L number shapes per line (tried before labels)
  var BLRX = { 'MSC': /\bMEDU[A-Z]?\d[A-Z0-9]{5,10}\b/, 'KMTC': /\bKMTC[A-Z]{3}[0-9O]{6,9}\b/, 'Sinokor': /\bSNK[O0]\d{8,14}\b/, 'Maersk': /\b\d{9}\b/, 'Hapag-Lloyd': /\bHLCU[A-Z0-9]{8,14}\b/,
    'ONE (Ocean Network Express)': /\bONEY[A-Z0-9]{8,12}\b/, 'COSCO Shipping': /\bCOSU\d{8,12}\b/, 'OOCL': /\bOOLU\d{8,12}\b/, 'Evergreen': /\bEGLV\d{9,12}\b/, 'Yang Ming': /\bYM(LU|JA)[A-Z0-9]{6,10}\b/,
    'HMM': /\bHDMU[A-Z0-9]{8,10}\b/, 'ZIM': /\bZIMU[A-Z0-9]{6,12}\b/, 'Wan Hai Lines': /\b\d{3}[A-Z]\d{6,8}\b/, 'CMA CGM': /\b[A-Z]{3}\d{7}\b/, 'SITC': /\bSITC[A-Z0-9]{6,12}\b/ };

  function ctrCheck(c) {
    var v = '0123456789A?BCDEFGHIJK?LMNOPQRSTU?VWXYZ', s = 0;
    for (var i = 0; i < 10; i++) { var x = v.indexOf(c[i]); if (x < 0) return false; s += x * Math.pow(2, i); }
    return (s % 11) % 10 === +c[10];
  }
  function fixCtr(t) { // OCR: letters part / digits part
    var L = t.slice(0, 4).replace(/0/g, 'O').replace(/1/g, 'I').replace(/5/g, 'S').replace(/8/g, 'B'), D = t.slice(4).replace(/[OQD]/g, '0').replace(/[IL|]/g, '1').replace(/S/g, '5').replace(/B/g, '8').replace(/Z/g, '2').replace(/G/g, '6');
    return L + D;
  }
  function containers(T) {
    var out = [], seen = {}, m, re = /\b([A-Z0-9]{3}[UJZ])\s?([0-9OQDILSBZG]{6})\s?-?\s?([0-9OQDILSBZG])\b/g;
    while ((m = re.exec(T))) { var c = fixCtr(m[1] + m[2] + m[3]); if (/^[A-Z]{3}[UJZ]\d{7}$/.test(c) && ctrCheck(c) && !seen[c]) { seen[c] = 1; out.push(c); } }
    return out;
  }
  var STOP = /^(NUMBER|NO|NON|NEGOTIABLE|COPY|ORIGINAL|WAYBILL|SEA|BILL|LADING|BOOKING|REF|SHIPPER|CONSIGNEE|EXPORT|REFERENCES)$/;
  function blNumber(T, line, ctrs) {
    var U = T.toUpperCase(), m, cand;
    if (line && BLRX[line] && (m = U.match(BLRX[line])) && ctrs.indexOf(m[0]) < 0) return m[0].replace(/^SNK0/, 'SNKO');
    var lab = /(B\s*\/\s*L|BILL\s+OF\s+LADING|SEA\s*WAYBILL|WAYBILL)\s*(NO\.?|NUMBER|#)\s*[:.]?/g, best = null;
    while ((m = lab.exec(U)) && !best) {
      var win = U.slice(m.index + m[0].length, m.index + m[0].length + 260).replace(/(TEL|FAX|PHONE|MOB)[^A-Z]{0,4}[+\d][\d\s\-]{5,}/g, ' ');
      win.split(/[\s,;]+/).some(function (t) { t = t.replace(/^[^A-Z0-9]+|[^A-Z0-9]+$/g, ''); if (t.length >= 6 && t.length <= 22 && !STOP.test(t) && /\d{3,}/.test(t) && /^[A-Z0-9\-\/]+$/.test(t) && ctrs.indexOf(t) < 0 && !/^\d{1,2}[\-\/]\d/.test(t)) { best = t; return true; } return false; });
    }
    if (best) return best;
    // no label in the text layer (e.g. labels printed as an image): first long letters+digits token
    cand = (U.match(/\b(?=[A-Z0-9]{10,22}\b)(?=(?:[A-Z0-9]*\d){3})(?=(?:[A-Z0-9]*[A-Z]){4})[A-Z0-9]{10,22}\b/g) || []).filter(function (t) { return ctrs.indexOf(t) < 0 && !/^\d{2}[A-Z]{5}\d{4}[A-Z]/.test(t) && !/^[A-Z]{5}\d{4}[A-Z]$/.test(t); });
    return cand[0] || '';
  }
  function imoOk(n) { n = String(n); if (!/^\d{7}$/.test(n)) return false; var s = 0; for (var i = 0; i < 6; i++) s += (+n[i]) * (7 - i); return s % 10 === +n[6]; }
  function imoFrom(T) { var m, re = /\bIMO\b[^0-9\n]{0,20}(\d{7})\b/gi; while ((m = re.exec(T))) if (imoOk(m[1])) return m[1]; return ''; }
  function splitVessel(v) {
    v = String(v || '').replace(/\s+/g, ' ').replace(/^[^A-Z0-9]+|[^A-Z0-9)]+$/gi, '').toUpperCase(); if (!v || /^X+$/.test(v.replace(/\s/g, ''))) return null;
    var voy = '', m = v.match(/^(.*?)\s*(?:\/|\s-\s)\s*([A-Z0-9\-]{2,12})$/);
    if (m) { v = m[1]; voy = m[2]; } else if ((m = v.match(/^(.*?[A-Z].*?)\s+(V\.?\s*)?(\d{3,4}[A-Z]{0,2}|\d{2,3}[A-Z]{1,2}|[0-9][A-Z0-9]{4,10})$/))) { v = m[1]; voy = m[3]; }
    v = v.replace(/^(M\.?V\.?|MV)\s+/, '').trim(); if (v.length < 3 || !/[A-Z]{2}/.test(v)) return null;
    return { name: v, voyage: voy };
  }
  // find the value printed under a "Vessel" label, using text positions
  function vesselFromItems(items) {
    var labs = items.filter(function (it) { return /^\s*(OCEAN\s+|LOCAL\s+|INTENDED\s+)?VESSEL(\s*(\/|AND|&)\s*VOY(AGE)?(\s*NO\.?)?)?\s*[:.]?\s*$/i.test(it.s) || /^\s*VESSEL\s*\/\s*VOY/i.test(it.s); });
    for (var k = 0; k < labs.length; k++) {
      var L = labs[k], below = items.filter(function (it) { return it !== L && it.y < L.y - 2 && it.y > L.y - 34 && it.x > L.x - 70 && it.x < L.x + 160 && /[A-Z]{2}/i.test(it.s) && !/PORT|PLACE|LOADING|DISCHARGE|RECEIPT|VOYAGE|NUMBER|CLAUSE|DELIVERY|PRE.?CARRIAGE/i.test(it.s); });
      if (!below.length) continue;
      var top = Math.max.apply(null, below.map(function (it) { return it.y; })); below = below.filter(function (it) { return it.y > top - 5; }); below.sort(function (a, b) { return Math.abs(a.x - L.x) - Math.abs(b.x - L.x); });
      var row = below[0].y, line = items.filter(function (it) { return Math.abs(it.y - row) < 2.5 && it.x >= below[0].x - 1 && it.x < below[0].x + 220; }).sort(function (a, b) { return a.x - b.x; }).map(function (it) { return it.s.trim(); }).filter(Boolean);
      var txt = line[0] + (line[1] && /^\/|^V\.?\s*\d|^\d{2,4}[A-Z]{0,2}$/.test(line[1]) ? ' ' + line[1] : '');
      var v = splitVessel(txt); if (v) return v;
    }
    // no label: a CAPS name followed on the same row by a voyage-like code
    for (var i = 0; i < items.length; i++) {
      var a = items[i], t = a.s.trim(); if (!/^[A-Z][A-Z .\-]{3,28}[A-Z0-9]$/.test(t) || /PORT|PLACE|INDIA|DELHI|MUMBAI|LTD|PVT|LLC|ROAD|STREET|FLOOR|SEAL|CONTAINER|SHIPPER|CONSIGNEE|NOTIFY|SAME AS/.test(t) || t.split(' ').length > 4) continue;
      var nx = items.filter(function (it) { return it !== a && Math.abs(it.y - a.y) < 2.5 && it.x > a.x && it.x < a.x + 260 && it.s.trim(); }).sort(function (p, q) { return p.x - q.x; })[0];
      if (nx && /^(V\.?\s*)?(\d{2,4}[A-Z]{0,2}|\d{3}[A-Z]\d?)$/.test(nx.s.trim())) { var g = splitVessel(t + ' / ' + nx.s.trim().replace(/^V\.?\s*/, '')); if (g) { g.guess = true; return g; } }
    }
    return null;
  }
  function parse(T) {
    var line = null; for (var i = 0; i < LINES.length; i++) if (LINES[i][1].test(T)) { line = LINES[i][0]; break; }
    var ctrs = containers(T.toUpperCase()), bl = blNumber(T, line, ctrs);
    var looksBL = /BILL\s+OF\s+LADING|SEA\s*WAYBILL|\bWAYBILL\b|B\s*\/\s*L|PORT\s+OF\s+(LOADING|DISCHARGE)|VESSEL/i.test(T) || ctrs.length > 0;
    var looksAWB = /AIR\s*WAYBILL|AIRPORT\s+OF\s+(DEPARTURE|DESTINATION)|\bAWB\b|HOUSE\s+AIR/i.test(T) && !ctrs.length;
    var imo = imoFrom(T);
    return { imo: imo, vessel: null, line: line, bl: bl, containers: ctrs, looksBL: looksBL && !looksAWB, looksAWB: looksAWB, house: !line && (ctrs.length > 0 || !!bl) };
  }
  function pdfText(doc) {
    var n = Math.min(doc.numPages, 4), ps = [], items1 = [];
    for (var i = 1; i <= n; i++) ps.push(doc.getPage(i).then(function (p) { return p.getTextContent().then(function (tc) { var out = '', y0 = null; tc.items.forEach(function (it) { var y = Math.round(it.transform[5]); if (p.pageNumber === 1 && it.str && it.str.trim()) items1.push({ s: it.str, x: it.transform[4], y: it.transform[5] }); if (y0 !== null && Math.abs(y - y0) > 2) out += '\n'; else if (out && !/\s$/.test(out)) out += ' '; out += it.str; y0 = y; }); return out; }); }));
    return Promise.all(ps).then(function (a) { var t = new String(a.join('\n')); t.items = items1; return t; });
  }
  function ocrCanvas(cv, onp) { return tess(function (m) { if (m.status === 'recognizing text') onp({ stage: 'Reading the document', p: 0.3 + 0.65 * m.progress }); }).then(function (w) { return w.recognize(cv).then(function (r) { return r.data.text; }); }); }
  function read(file, onp) {
    onp = onp || function () { };
    var isPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name);
    if (isPdf) {
      onp({ stage: 'Opening the PDF', p: 0.05 });
      return pdfjs().then(function (L) { return file.arrayBuffer().then(function (b) { return L.getDocument({ data: new Uint8Array(b), isEvalSupported: false }).promise; }); }).then(function (doc) {
        return pdfText(doc).then(function (t) {
          if (t.replace(/\s/g, '').length > 150) { var r = parse(String(t)); r.vessel = vesselFromItems(t.items || []); r.method = 'pdf-text'; return r; }
          onp({ stage: 'Scanned PDF, reading the image', p: 0.2 });
          return doc.getPage(1).then(function (page) { var vp = page.getViewport({ scale: 2.5 }), cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height; return page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function () { return ocrCanvas(cv, onp); }); }).then(function (t2) { var r = parse(t2); r.method = 'ocr'; return r; });
        });
      });
    }
    onp({ stage: 'Reading the image', p: 0.1 });
    return new Promise(function (ok, no) { var im = new Image(); im.onload = function () { var s = Math.min(1, 3000 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = im.width * s; cv.height = im.height * s; cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); ok(cv); }; im.onerror = no; im.src = URL.createObjectURL(file); })
      .then(function (cv) { return ocrCanvas(cv, onp); }).then(function (t) { var r = parse(t); r.method = 'ocr'; return r; });
  }
  // Plain text + positioned words of any document (up to 6 pages), for the document checker. OCR only page 1 of scans.
  function readText(file, onp) {
    onp = onp || function () { };
    var isPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name);
    function ocrResult(r) { var it = []; (r.data.words || []).forEach(function (w) { it.push({ s: w.text, x: w.bbox.x0, y: -w.bbox.y0, w: w.bbox.x1 - w.bbox.x0, p: 1 }); }); return { text: r.data.text, items: it, method: 'ocr' }; }
    function ocrCv(cv) { return tess(function (m) { if (m.status === 'recognizing text') onp({ stage: 'Reading the scan', p: 0.3 + 0.65 * m.progress }); }).then(function (w) { return w.recognize(cv); }).then(ocrResult); }
    if (isPdf) {
      onp({ stage: 'Opening the PDF', p: 0.05 });
      return pdfjs().then(function (L) { return file.arrayBuffer().then(function (b) { return L.getDocument({ data: new Uint8Array(b), isEvalSupported: false }).promise; }); }).then(function (doc) {
        var n = Math.min(doc.numPages, 6), ps = [], items = [];
        for (var i = 1; i <= n; i++) ps.push(doc.getPage(i).then(function (p) { return p.getTextContent().then(function (tc) { var out = '', y0 = null; tc.items.forEach(function (it) { var y = Math.round(it.transform[5]); if (it.str && it.str.trim()) items.push({ s: it.str, x: it.transform[4], y: it.transform[5], w: it.width || 0, p: p.pageNumber }); if (y0 !== null && Math.abs(y - y0) > 2) out += '\n'; else if (out && !/\s$/.test(out)) out += ' '; out += it.str; y0 = y; }); return out; }); }));
        return Promise.all(ps).then(function (a) {
          var t = a.join('\n'); if (t.replace(/\s/g, '').length > 150) return { text: t, items: items, method: 'pdf-text' };
          onp({ stage: 'Scanned PDF, reading the image', p: 0.2 });
          return doc.getPage(1).then(function (page) { var vp = page.getViewport({ scale: 2.5 }), cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height; return page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function () { return ocrCv(cv); }); });
        });
      });
    }
    onp({ stage: 'Reading the image', p: 0.1 });
    return new Promise(function (ok, no) { var im = new Image(); im.onload = function () { var s = Math.min(1, 3000 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = im.width * s; cv.height = im.height * s; cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); ok(cv); }; im.onerror = no; im.src = URL.createObjectURL(file); }).then(ocrCv);
  }
  G.BLRead = { read: read, parse: parse, containers: containers, ctrCheck: ctrCheck, imoOk: imoOk, splitVessel: splitVessel, readText: readText, lines: LINES };
})(window);
