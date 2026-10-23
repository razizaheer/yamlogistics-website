/* YAM Logistics — read an air waybill (PDF / image) in the browser and pull out the label details.
   Nothing is uploaded: PDFs are read with pdf.js, images and scanned PDFs with Tesseract OCR, both running locally. */
(function (G) {
  'use strict';

  var API;
  // ---------- helpers ----------
  function up(s) { return String(s || '').toUpperCase(); }
  function median(a) { if (!a.length) return 0; var b = a.slice().sort(function (x, y) { return x - y; }); return b[b.length >> 1]; }
  // OCR often confuses letters and digits; fix tokens that are clearly meant to be numbers
  function digitFix(tok) {
    if (/[-\/]/.test(tok)) return tok.split(/([-\/])/).map(function (p) { return /[-\/]/.test(p) ? p : digitFix1(p); }).join('');
    return digitFix1(tok);
  }
  function digitFix1(tok) {
    if (!/\d/.test(tok)) return tok;
    var m = tok.replace(/[OoQD]/g, '0').replace(/[Il|!]/g, '1').replace(/[S]/g, '5').replace(/[B]/g, '8').replace(/[Z]/g, '2');
    var al = tok.replace(/[^0-9A-Za-z]/g, '').length, dg = tok.replace(/[^0-9]/g, '').length;
    return (dg >= al * 0.6 || (al <= 4 && dg >= 2)) ? m : tok;
  }
  function letterFix(tok) { return up(tok).replace(/0/g, 'O').replace(/1/g, 'I').replace(/5/g, 'S').replace(/8/g, 'B'); }
  function cleanTok(t) { return String(t).replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9.]+$/g, ''); }

  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var p = [], i, j; for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) { var q = [i]; for (j = 1; j <= b.length; j++) q[j] = Math.min(p[j] + 1, q[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = q; }
    return p[b.length];
  }
  // ---------- geometry: words → lines ----------
  // word: {t, x0, y0, x1, y1}; y grows downwards
  function buildLines(words) {
    var hs = words.map(function (w) { return w.y1 - w.y0; }), mh = median(hs) || 10;
    var ws = words.slice().sort(function (a, b) { return (a.y0 + a.y1) - (b.y0 + b.y1); }), rows = [];
    ws.forEach(function (w) {
      var cy = (w.y0 + w.y1) / 2, r = rows.length ? rows[rows.length - 1] : null;
      if (r && Math.abs(cy - r.cy) < mh * 0.45) { r.w.push(w); r.cy = (r.cy * (r.w.length - 1) + cy) / r.w.length; }
      else rows.push({ cy: cy, w: [w] });
    });
    var lines = [];
    rows.forEach(function (r) {
      r.w.sort(function (a, b) { return a.x0 - b.x0; });
      var cur = [r.w[0]];
      for (var i = 1; i < r.w.length; i++) {
        var a = r.w[i - 1], b = r.w[i], h = Math.max(a.y1 - a.y0, b.y1 - b.y0);
        if (b.x0 - a.x1 > h * 2.6) { lines.push(cur); cur = []; }
        cur.push(b);
      }
      lines.push(cur);
    });
    return lines.map(function (ws) {
      return { words: ws, text: ws.map(function (w) { return w.t; }).join(' '), x0: ws[0].x0, x1: ws[ws.length - 1].x1, y0: Math.min.apply(null, ws.map(function (w) { return w.y0; })), y1: Math.max.apply(null, ws.map(function (w) { return w.y1; })) };
    }).sort(function (a, b) { return a.y0 - b.y0 || a.x0 - b.x0; });
  }

  // find a label (sequence of words, e.g. ['airport','of','destination']) → bounding box
  function findLabel(words, seq, from) {
    // plain words match fuzzily (OCR misreads small print: "Handing Information", "Arport"); patterns match exactly
    var re = seq.map(function (s) {
      if (!/^[a-z]+$/.test(s) || s.length < 5) return new RegExp('^' + s + '$', 'i');
      var tol = s.length >= 10 ? 2 : 1;
      return { test: function (w) { return lev(w.toLowerCase(), s) <= tol; } };
    }), hits = [];
    for (var i = 0; i < words.length; i++) {
      if (!re[0].test(cleanTok(words[i].t))) continue;
      var box = { x0: words[i].x0, y0: words[i].y0, x1: words[i].x1, y1: words[i].y1 }, ok = true, last = words[i];
      for (var k = 1; k < re.length; k++) {
        // next word: on the same line (or wrapped onto the next one), close by
        var h = last.y1 - last.y0, nx = null;
        for (var j = 0; j < words.length; j++) {
          var w = words[j]; if (w === last) continue;
          var same = Math.abs((w.y0 + w.y1) / 2 - (last.y0 + last.y1) / 2) < h * 0.6 && w.x0 > last.x0 && w.x0 - last.x1 < h * 2.2;
          var wrap = w.y0 > last.y0 + h * 0.5 && w.y0 - last.y1 < h * 1.2 && Math.abs(w.x0 - box.x0) < h * 3;
          if ((same || wrap) && re[k].test(cleanTok(w.t)) && (!nx || (same && w.x0 < nx.x0))) nx = w;
        }
        if (!nx) { ok = false; break; }
        box.x0 = Math.min(box.x0, nx.x0); box.x1 = Math.max(box.x1, nx.x1); box.y1 = Math.max(box.y1, nx.y1); last = nx;
      }
      if (ok) { box.h = words[i].y1 - words[i].y0; hits.push(box); }
    }
    return from === 'all' ? hits : hits[0] || null;
  }

  // words sitting under a label, inside a column [x0, x1], within maxDy
  function below(words, lab, x0, x1, maxDy) {
    return words.filter(function (w) {
      var cx = (w.x0 + w.x1) / 2;
      return w.y0 >= lab.y1 - lab.h * 0.2 && w.y0 <= lab.y1 + maxDy && w.x0 >= x0 && cx <= x1 && !isLabelWord(w, lab);
    });
  }
  function isLabelWord(w, lab) { return w.y1 <= lab.y1 + 1 && w.y0 >= lab.y0 - 1; }
  function firstLines(ws, n) {
    if (!ws.length) return [];
    var ls = buildLines(ws);
    return ls.slice(0, n || 1);
  }

  // ---------- reference data ----------
  var REF = null;
  function prep(data) {
    if (REF && REF.src === data) return REF;
    var al = {}, ap = {}, city = {}, name = {};
    data.al.forEach(function (a) { al[a[0]] = a; });
    data.ap.forEach(function (a) {
      ap[a[0]] = a;
      var c = up(a[1]).replace(/[^A-Z ]/g, '').trim(); if (c) (city[c] = city[c] || []).push(a[0]);
      var n = up(a[3]).replace(/\b(INTL|INTERNATIONAL|AIRPORT|AIRFIELD|APT|FIELD|REGIONAL)\b/g, '').replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
      if (n.length >= 4 && n !== c) (name[n] = name[n] || []).push(a[0]);
    });
    // common spellings on Indian / GCC paperwork
    var extra = { 'NEW DELHI': ['DEL'], 'BOMBAY': ['BOM'], 'MADRAS': ['MAA'], 'CALCUTTA': ['CCU'], 'BANGALORE': ['BLR'], 'BENGALURU': ['BLR'], 'NAVI MUMBAI': ['NMI', 'BOM'] };
    Object.keys(extra).forEach(function (k) { city[k] = city[k] || extra[k].filter(function (c) { return ap[c]; }); });
    REF = { src: data, al: al, ap: ap, city: city, name: name };
    return REF;
  }
  var NOT_AIRPORT = /^(THE|AND|FOR|INR|USD|EUR|GBP|AED|NVD|NCV|PCS|KGS|CTN|PPD|COL|AWB|NIL|DIM|NOT|PER|VIA|ALL|ANY|LTD|PVT|LLC|INC|CBM|AGT|DOC|SPX|ECC|EAP|MAWB|HAWB|NEW|OLD|SAN|LOS|DEL MAR|SHC|PAY|DGR|AVI|PES|PEM|PIL|ELI|ELM|RCL|RRY|ICE|VAL|HEA|BIG|CAO|NSC)$/;
  function isCode(t, R) { if (/^[A-Z][a-z]/.test(cleanTok(t))) return ''; var c = letterFix(cleanTok(t)); return /^[A-Z]{3}$/.test(c) && R.ap[c] && !NOT_AIRPORT.test(c) ? c : ''; }

  // place text ("MOSCOW SHEREMETYEVO", "DELHI, INDIA") → candidate airport codes
  function placeCodes(text, R) {
    var t = up(text).replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); if (!t) return { codes: [], how: '' };
    var toks = t.split(' '), codes = [];
    toks.forEach(function (k) { var c = isCode(k, R); if (c && codes.indexOf(c) < 0) codes.push(c); });
    var byName = [], byCity = [];
    Object.keys(R.name).forEach(function (n) { if ((' ' + t + ' ').indexOf(' ' + n + ' ') >= 0 || (n.length >= 6 && t.indexOf(n) >= 0)) byName = byName.concat(R.name[n]); });
    for (var len = 3; len >= 1; len--) for (var i = 0; i + len <= toks.length; i++) { var p = toks.slice(i, i + len).join(' '); if (R.city[p]) byCity = byCity.concat(R.city[p]); }
    if (byName.length) {
      // name match narrowed by city if both present
      var both = byName.filter(function (c) { return byCity.indexOf(c) >= 0; });
      return { codes: uniq(both.length ? both : byName), how: 'name' };
    }
    if (byCity.length) {
      var inCity = codes.filter(function (c) { return byCity.indexOf(c) >= 0; });
      return inCity.length ? { codes: inCity, how: 'code' } : { codes: uniq(byCity), how: 'city' };
    }
    return { codes: codes, how: codes.length ? 'code' : '' };
  }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  // ---------- the parser ----------
  function parse(words, W, H, data) {
    var R = prep(data), out = { fields: {}, notes: [] };
    API.last = words;
    var lines = buildLines(words);
    function set(k, v, conf, why, weak) { if (v === '' || v == null) return; out.fields[k] = { v: v, conf: conf, why: why || '', weak: !!weak }; }
    var fixedLines = lines.map(function (l) { return l.text.split(/\s+/).map(digitFix).join(' '); });
    var all = fixedLines.join('\n');

    // 1. air waybill number: 3-digit prefix + 8-digit serial (last digit = first 7 mod 7)
    var cands = {}, topOrigin = {};
    function addC(p, s, bonus, org) {
      if (!/^\d{3}$/.test(p) || !/^\d{8}$/.test(s)) return;
      var k = p + s, c = cands[k] = cands[k] || { p: p, s: s, n: 0, score: 0 };
      c.n++; c.score += bonus;
      if (org) topOrigin[k] = org;
    }
    fixedLines.forEach(function (L) {
      var m, re1 = /(?:^|[^\d])(\d{3})\s?[-–—.\/]?\s?(\d{4})\s?[-–]?\s?(\d{4})(?!\d)/g, re2 = /(?:^|[^\d])(\d{3})[\s-]+([A-Z0-9]{3})[\s-]+(\d{4})[\s-]?(\d{4})(?!\d)/g;
      while ((m = re1.exec(L))) addC(m[1], m[2] + m[3], 1);
      while ((m = re2.exec(L))) { var o = isCode(m[2], R); addC(m[1], m[3] + m[4], o ? 3 : 1, o); }
    });
    var best = null;
    Object.keys(cands).forEach(function (k) {
      var c = cands[k];
      c.check = (+c.s.slice(0, 7)) % 7 === +c.s[7];
      c.air = !!R.al[c.p];
      c.score += c.n * 2 + (c.check ? 10 : 0) + (c.air ? 6 : 0);
      if (!best || c.score > best.score) best = c;
    });
    if (best) {
      var conf = best.check && best.air ? 'ok' : 'check';
      set('awb', best.p + '-' + best.s, conf, !best.check ? 'The check digit does not match. Compare the number with your document.' : !best.air ? 'Airline prefix ' + best.p + ' is not in our list.' : '');
      if (best.air) set('air', best.p + ' · ' + R.al[best.p][1] + (R.al[best.p][2] ? ' (' + R.al[best.p][2] + ')' : ''), conf);
      if (topOrigin[best.p + best.s]) set('org', topOrigin[best.p + best.s], 'ok');
    }

    // 2. house air waybill
    var rawAll = lines.map(function (l) { return l.text; }).join('\n');
    var hm = rawAll.match(/\b(?:HAWB|HWB|H\.A\.W\.B\.?|HOUSE\s+(?:AIR\s*)?WAY\s*BILL|HOUSE\s+AWB)\s*(?:NO\.?|NUMBER|NUM|#)?\s*[:#.\-]?\s*([A-Z0-9][A-Z0-9\/\-]{4,19})/i);
    var isHouse = /HOUSE\s+(AIR\s*)?WAY\s*BILL|\bHAWB\b|\bHWB\b/i.test(rawAll);
    if (hm && /\d/.test(hm[1]) && !/^(ISSUED|NOT|NO)$/i.test(hm[1])) set('hw', up(hm[1]), 'check');

    // 3. airport of departure / destination
    var dep = findLabel(words, ['airport', 'of', 'departure']);
    if (dep && !out.fields.org) {
      var dl = firstLines(below(words, dep, dep.x0 - W * 0.02, dep.x0 + W * 0.55, dep.h * 4), 1);
      if (dl.length) { var pc = placeCodes(dl[0].text, R); if (pc.codes.length === 1) set('org', pc.codes[0], 'ok'); else if (pc.codes.length > 1) out.orgOpts = pc.codes; out.orgText = dl[0].text; }
    }
    // routing: "To / By first carrier / to / by / to / by"
    var route = [];
    var bfc = findLabel(words, ['by', 'first', 'carrier']), cur = findLabel(words, ['currency']);
    if (bfc) {
      var band = words.filter(function (w) { return Math.abs((w.y0 + w.y1) / 2 - (bfc.y0 + bfc.y1) / 2) < bfc.h * 0.8; });
      var toLabs = band.filter(function (w) { return /^to$/i.test(cleanTok(w.t)); }).sort(function (a, b) { return a.x0 - b.x0; });
      var vals = below(words, bfc, 0, W, bfc.h * 4.5).filter(function (w) { return w.y0 > bfc.y1 - bfc.h * 0.2; });
      toLabs.forEach(function (t) {
        var hit = null;
        vals.forEach(function (w) { var c = isCode(w.t, R); if (c && Math.abs(w.x0 - t.x0) < W * 0.035 && (!hit || Math.abs(w.x0 - t.x0) < Math.abs(hit.w.x0 - t.x0))) hit = { w: w, c: c }; });
        if (hit) route.push(hit.c);
      });
    }
    if (!route.length && cur) {
      // carrier label unreadable: take the airport codes in the routing row, left of "Currency"
      var dl0 = findLabel(words, ['airport', 'of', 'destination']), yb = dl0 && dl0.y0 > cur.y0 ? dl0.y0 : cur.y1 + cur.h * 3;
      words.filter(function (w) { var cy = (w.y0 + w.y1) / 2; return cy > cur.y0 + cur.h * 0.45 && cy < yb && w.x1 < cur.x0; }).sort(function (a, b) { return a.x0 - b.x0; })
        .forEach(function (w) { var c = isCode(w.t, R); if (c && route.indexOf(c) < 0) route.push(c); });
    }
    var dst = '', dstConf = 'check', dstWhy = '';
    var des = findLabel(words, ['airport', 'of', 'destination']);
    if (des) {
      var dlns = firstLines(below(words, des, des.x0 - W * 0.02, des.x0 + W * 0.45, des.h * 4), 1);
      if (dlns.length) {
        var pd = placeCodes(dlns[0].text, R), last = route[route.length - 1];
        out.dstText = dlns[0].text;
        if (pd.how === 'code') { dst = pd.codes[0]; dstConf = 'ok'; }
        else if (route.some(function (c) { return pd.codes.indexOf(c) >= 0; })) { dst = route.filter(function (c) { return pd.codes.indexOf(c) >= 0; }).pop(); dstConf = 'ok'; }
        else if (pd.codes.length === 1) { dst = pd.codes[0]; dstConf = 'ok'; }
        else if (pd.codes.length > 1) { out.dstOpts = pd.codes; dstWhy = '"' + dlns[0].text + '" has more than one airport.'; }
      }
    }
    if (!dst && route.length && !out.dstOpts) { dst = route[route.length - 1]; dstWhy = 'Taken from the routing boxes.'; }
    if (dst) set('dst', dst, dstConf, dstWhy);
    var tp = route.filter(function (c, i) { return c !== dst && route.indexOf(c) === i; });
    if (tp[0]) set('v1', tp[0], dstConf === 'ok' ? 'ok' : 'check');
    if (tp[1]) set('v2', tp[1], dstConf === 'ok' ? 'ok' : 'check');

    // 4. pieces and gross weight (rate description block)
    var pcsLab = findLabel(words, ['no\\.?', 'of', 'pieces']) || findLabel(words, ['pieces']), gwLab = findLabel(words, ['gross', 'weight']);
    if (!gwLab && pcsLab) {
      // "Gross" unreadable: the gross weight column is the left-most "Weight" heading next to the pieces heading
      var wl = findLabel(words, ['weight'], 'all').filter(function (l) { return Math.abs(l.y0 - pcsLab.y0) < pcsLab.h * 4 && l.x0 > pcsLab.x0; }).sort(function (a, b) { return a.x0 - b.x0; });
      if (wl.length) gwLab = wl[0];
    }
    function numBelow(lab, maxDy, isInt, row) {
      if (!lab) return null;
      var ws = below(words, lab, lab.x0 - W * 0.02, lab.x1 + W * 0.015, maxDy).sort(function (a, b) { return a.y0 - b.y0; }), hits = [];
      for (var i = 0; i < ws.length; i++) { var t = digitFix(cleanTok(ws[i].t)).replace(/,(?=\d{3}\b)/g, ''); if (isInt ? /^\d{1,4}$/.test(t) : /^\d{1,6}([.,]\d{1,3})?$/.test(t)) hits.push({ v: t.replace(',', '.'), w: ws[i] }); }
      if (row && hits.length) {
        // the gross weight sits on the same row as the number of pieces
        var cy = (row.y0 + row.y1) / 2, hh = row.y1 - row.y0;
        var same = hits.filter(function (x) { return Math.abs((x.w.y0 + x.w.y1) / 2 - cy) < hh * 0.9; });
        if (same.length) return same[0];
        if (hits[0].w.y0 > row.y1 + hh) return null;
      }
      return hits[0] || null;
    }
    var pcs = numBelow(pcsLab, H * 0.3, true), gw = numBelow(gwLab, H * 0.3, false, pcs && pcs.w), unit = 'KG', gwByUnit = false;
    // strongest signal: the gross weight is the number followed by the unit letter (K or L) on the pieces row,
    // e.g. "7  1650.0 K  Q  1680.0" (1680.0 there is the chargeable weight, not the gross weight)
    if (pcs && pcs.w) {
      var py = (pcs.w.y0 + pcs.w.y1) / 2, ph = pcs.w.y1 - pcs.w.y0;
      var row = words.filter(function (w) { return Math.abs((w.y0 + w.y1) / 2 - py) < ph * 0.9 && w.x0 > pcs.w.x1; }).sort(function (a, b) { return a.x0 - b.x0; });
      for (var ri = 0; ri < row.length; ri++) {
        var tk = cleanTok(row[ri].t), num = null, u = null;
        var glued = tk.match(/^(\d[\d,]*(?:\.\d{1,3})?)(K|KG|KGS|L|LB|LBS)$/i);
        if (glued) { num = glued[1]; u = glued[2]; }
        else if (/^(K|KG|KGS|L|LB|LBS)$/i.test(tk) && ri > 0) { num = digitFix(cleanTok(row[ri - 1].t)); u = tk; }
        if (num) { num = num.replace(/,(?=\d{3}\b)/g, ''); if (/^\d{1,6}(\.\d{1,3})?$/.test(num)) { gw = { v: num, w: row[ri] }; unit = /^L/i.test(u) ? 'LB' : 'KG'; gwByUnit = true; break; } }
      }
    }
    if (gw && !gwByUnit) { var uw = words.filter(function (w) { return Math.abs((w.y0 + w.y1) / 2 - (gw.w.y0 + gw.w.y1) / 2) < (gw.w.y1 - gw.w.y0) && w.x0 > gw.w.x1 && w.x0 - gw.w.x1 < W * 0.12; }).sort(function (a, b) { return a.x0 - b.x0; })[0]; if (uw && /^(L|LB|LBS)$/i.test(cleanTok(uw.t))) unit = 'LB'; }
    // fallback: a line like "31 298.0 K Q ..." or "31 PCS 298 KGS"
    if (!pcs || !gw) {
      for (var i = 0; i < fixedLines.length; i++) {
        var m1 = fixedLines[i].match(/^\s*(\d{1,4})\s+(\d{1,6}(?:\.\d{1,3})?)\s*(K|KG|KGS|L|LB|LBS)\b/i);
        if (m1) { if (!pcs) pcs = { v: m1[1] }; if (!gw) { gw = { v: m1[2] }; unit = /^L/i.test(m1[3]) ? 'LB' : 'KG'; } break; }
      }
      var m2 = all.match(/\b(\d{1,4})\s*(?:PCS|PIECES|PKGS|PACKAGES|CTNS|CARTONS)\b/i), m3 = null;
      fixedLines.some(function (L) { if (/VOL|CHARG|DIM|CBM/i.test(L)) return false; var mm = L.match(/\b(\d{1,6}(?:\.\d{1,3})?)\s*(KGS?|KILOS?|LBS?)\b/i); if (mm) m3 = mm; return !!mm; });
      if (!pcs && m2) pcs = { v: m2[1], weak: 1 };
      if (!gw && m3) { gw = { v: m3[1], weak: 1 }; unit = /^L/i.test(m3[2]) ? 'LB' : 'KG'; }
    }
    // the totals line repeats the same figures; seeing them twice raises confidence
    function seenTwice(v) { if (!v) return false; var n = 0; all.split(/\s+/).forEach(function (k) { k = k.replace(/,(?=\d{3}\b)/g, ''); if (/^\d+(\.\d+)?$/.test(k) && +k === +v) n++; }); return n >= 2; }
    if (pcs && +pcs.v > 0) {
      var pc2 = seenTwice(pcs.v) && !pcs.weak ? 'ok' : 'check';
      if (isHouse) { set('hp', String(+pcs.v), pc2, '', !!pcs.weak); set('tot', String(+pcs.v), 'check', 'This is a house air waybill. Enter the total pieces of the master AWB if it is different.', !!pcs.weak); }
      else set('tot', String(+pcs.v), pc2, '', !!pcs.weak);
    }
    if (gw && +gw.v > 0) {
      var gv = String(+gw.v), g2 = (gwByUnit || seenTwice(gw.v)) && !gw.weak ? 'ok' : 'check';
      if (isHouse) { set('hwt', gv, g2, '', !!gw.weak); set('tw', gv, 'check', 'House weight. Enter the master AWB weight if it is different.', !!gw.weak); }
      else set('tw', gv, g2, '', !!gw.weak);
      out.unit = unit;
    }

    // sanity: an average piece over 3,000 kg is very unusual for air cargo
    if (out.fields.tw && out.fields.tot && +out.fields.tw.v / +out.fields.tot.v > 3000) { out.fields.tw.conf = 'check'; out.fields.tw.why = 'This weight looks very high for ' + out.fields.tot.v + ' pieces. Please check.'; }
    // 5. handling information
    var hl = findLabel(words, ['handling', 'information']);
    if (hl) {
      var stop = pcsLab && pcsLab.y0 > hl.y1 ? pcsLab.y0 : hl.y1 + H * 0.08;
      var hw = words.filter(function (w) { return w.y0 > hl.y1 - hl.h * 0.2 && w.y1 < stop && w.y0 < hl.y1 + H * 0.08 && w.x0 >= hl.x0 - W * 0.02 && !isLabelWord(w, hl) && !/^(SCI|OCI|X)$/.test(cleanTok(w.t)); });
      var ht = buildLines(hw).slice(0, 2).map(function (l) { return l.text; }).join(' ').replace(/\s+/g, ' ').trim();
      if (ht && !/^(SPECIAL|OPTIONAL)/i.test(ht)) { ht = up(ht); if (ht.length > 48) { ht = ht.slice(0, 49); ht = ht.slice(0, Math.max(ht.lastIndexOf(' '), 30)).replace(/[\s,;:\/&-]+$/, ''); } set('hi', ht, 'check'); }
    }

    out.isHouse = isHouse;
    out.lines = lines.length;
    return out;
  }

  // ---------- file → words ----------
  var BASE = (function () { var s = typeof document !== 'undefined' && document.currentScript; return s ? s.src.replace(/[^\/]*$/, '') : ''; })();
  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error('load ' + src)); }; document.head.appendChild(s); });
  }
  var pdfjsP = null, tessP = null;
  function pdfjs() {
    if (!pdfjsP) pdfjsP = loadScript(BASE + 'vendor/ocr/pdf.min.js?v=3').then(function () { var L = G.pdfjsLib; L.GlobalWorkerOptions.workerSrc = BASE + 'vendor/ocr/pdf.worker.min.js?v=3'; return L; });
    return pdfjsP;
  }
  function tess(progress) {
    if (!tessP) tessP = loadScript(BASE + 'vendor/ocr/tesseract.min.js?v=5').then(function () {
      return G.Tesseract.createWorker('eng', 1, {
        workerPath: BASE + 'vendor/ocr/worker.min.js?v=5', corePath: BASE + 'vendor/ocr/', langPath: BASE + 'vendor/ocr/lang', gzip: true,
        logger: function (m) { if (tessP && tessP.onp) tessP.onp(m); }
      });
    });
    tessP.onp = progress;
    return tessP;
  }

  function pdfWords(page) {
    var vp = page.getViewport({ scale: 1 });
    return page.getTextContent().then(function (tc) {
      var words = [];
      tc.items.forEach(function (it) {
        if (!it.str || !it.str.trim()) return;
        var p = vp.convertToViewportPoint(it.transform[4], it.transform[5]), fh = Math.hypot(it.transform[2], it.transform[3]) || it.height || 8;
        var cw = (it.width || fh * 0.5 * it.str.length) / it.str.length, re = /\S+/g, m;
        while ((m = re.exec(it.str))) words.push({ t: m[0], x0: p[0] + m.index * cw, x1: p[0] + (m.index + m[0].length) * cw, y0: p[1] - fh * 0.8, y1: p[1] + fh * 0.2 });
      });
      return { words: words, W: vp.width, H: vp.height };
    });
  }

  // OCR words → deskewed page coordinates
  function ocrWords(data) {
    var ws = [], ang = [];
    (data.lines || []).forEach(function (l) { var b = l.baseline; if (b && b.x1 - b.x0 > 80) ang.push(Math.atan2(b.y1 - b.y0, b.x1 - b.x0)); });
    var a = -median(ang), c = Math.cos(a), s = Math.sin(a);
    (data.words || []).forEach(function (w) {
      if (!w.text || !w.text.trim() || w.confidence < 25) return;
      var b = w.bbox, cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, rx = cx * c - cy * s, ry = cx * s + cy * c, hw = (b.x1 - b.x0) / 2, hh = (b.y1 - b.y0) / 2;
      ws.push({ t: w.text, x0: rx - hw, x1: rx + hw, y0: ry - hh, y1: ry + hh, conf: w.confidence });
    });
    return ws;
  }
  function canvasFrom(src, maxSide, rot) {
    var w = src.width, h = src.height, k = Math.min(1, maxSide / Math.max(w, h)), cv = document.createElement('canvas');
    var cw = Math.round(w * k), ch = Math.round(h * k);
    cv.width = rot % 180 ? ch : cw; cv.height = rot % 180 ? cw : ch;
    var x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height);
    x.translate(cv.width / 2, cv.height / 2); x.rotate(rot * Math.PI / 180); x.drawImage(src, -cw / 2, -ch / 2, cw, ch);
    return cv;
  }
  function ocr1(canvas, data, progress, psm) {
    return tess(progress).then(function (wk) { return wk.setParameters({ tessedit_pageseg_mode: psm }).then(function () { return wk.recognize(canvas); }); }).then(function (r) {
      var ws = ocrWords(r.data);
      var xs = ws.map(function (w) { return w.x1; }), ys = ws.map(function (w) { return w.y1; });
      return parse(ws, Math.max(canvas.width, Math.max.apply(null, xs.concat([0]))), Math.max(canvas.height, Math.max.apply(null, ys.concat([0]))), data);
    });
  }
  // two readings with different page layout analysis (automatic, then sparse text); forms often need both
  function ocr(canvas, data, progress, quick) {
    var p1 = function (m) { progress(m, 0); }, p2 = function (m) { progress(m, 1); };
    return ocr1(canvas, data, p1, '3').then(function (a) {
      if (quick && !good(a)) return a;
      return ocr1(canvas, data, p2, '11').then(function (b) {
        var m = merge([a, b]), f = m.fields;
        var unsure = ['awb', 'dst', 'tot', 'tw'].some(function (k) { return !f[k] || f[k].conf !== 'ok'; });
        if (!unsure) return m;
        return ocr1(canvas, data, function (x) { progress(x, 2); }, '6').then(function (c) { return merge([a, b, c]); });
      });
    });
  }
  function merge(rs) {
    var a = rs[0], out = { fields: {}, notes: [], isHouse: rs.some(function (r) { return r.isHouse; }) };
    rs.forEach(function (r) { ['unit', 'dstOpts', 'dstText'].forEach(function (k) { if (!out[k] && r[k]) out[k] = r[k]; }); });
    var keys = []; rs.forEach(function (r) { Object.keys(r.fields).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); });
    keys.forEach(function (k) {
      var votes = {}, order = [];
      rs.forEach(function (r) { var f = r.fields[k]; if (!f) return; var v = String(f.v); if (!votes[v]) { votes[v] = []; order.push(v); } votes[v].push(f); });
      order.sort(function (x, y) {
        var ox = votes[x].some(function (f) { return f.conf === 'ok'; }), oy = votes[y].some(function (f) { return f.conf === 'ok'; });
        var sx = votes[x].filter(function (f) { return !f.weak; }).length, sy = votes[y].filter(function (f) { return !f.weak; }).length;
        return (oy - ox) || (sy - sx) || (votes[y].length - votes[x].length);
      });
      var win = votes[order[0]], best = win.filter(function (f) { return f.conf === 'ok'; })[0] || win[0];
      var strong = win.filter(function (f) { return !f.weak; });
      if (order.length > 1 && !(k === 'awb' && best.conf === 'ok')) out.fields[k] = { v: best.v, conf: 'check', why: 'Unclear in your file: we read ' + order.slice(0, 3).join(' or ') + '. Please check.' };
      else out.fields[k] = { v: best.v, conf: best.conf === 'ok' || (strong.length >= 2 && !best.why) ? 'ok' : 'check', why: best.why };
    });
    var F = out.fields;
    ['v1', 'v2'].forEach(function (k) { if (F[k] && F.dst && F[k].v === F.dst.v) delete F[k]; });
    if (!F.v1 && F.v2) { F.v1 = F.v2; delete F.v2; }
    return out;
  }

  function good(r) { return r && r.fields.awb; }

  // main entry: file → { fields, notes, thumb (canvas), method }
  function read(file, data, progress) {
    progress = progress || function () {};
    var isPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name);
    if (isPdf) {
      progress({ stage: 'Opening PDF', p: 0.05 });
      return pdfjs().then(function (L) { return file.arrayBuffer().then(function (b) { return L.getDocument({ data: new Uint8Array(b), isEvalSupported: false }).promise; }); }).then(function (doc) {
        function tryPage(n) {
          return doc.getPage(n).then(function (page) {
            return pdfWords(page).then(function (pw) {
              var vp = page.getViewport({ scale: 3 }), cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
              return page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function () {
                var chars = pw.words.reduce(function (s, w) { return s + w.t.length; }, 0);
                if (chars > 60) { var r = parse(pw.words, pw.W, pw.H, data); r.method = 'pdf-text'; r.thumb = cv; return r; }
                progress({ stage: 'Scanned PDF, reading the text', p: 0.15 });
                return ocr(cv, data, ocrProgress(progress)).then(function (r) { r.method = 'ocr'; r.thumb = cv; return r; });
              });
            });
          });
        }
        return tryPage(1).then(function (r) { return good(r) || doc.numPages < 2 ? r : tryPage(2).then(function (r2) { return good(r2) ? r2 : r; }); });
      });
    }
    progress({ stage: 'Opening image', p: 0.05 });
    return (G.createImageBitmap ? createImageBitmap(file, { imageOrientation: 'from-image' }) : new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = URL.createObjectURL(file); })).then(function (bmp) {
      var cv = canvasFrom(bmp, 2600, 0);
      return ocr(cv, data, ocrProgress(progress)).then(function (r) {
        r.method = 'ocr'; r.thumb = cv;
        if (good(r)) return r;
        // maybe the photo is sideways: try turning it
        progress({ stage: 'Trying the image turned sideways', p: 0.6 });
        var cv2 = canvasFrom(bmp, 2600, 90);
        return ocr(cv2, data, function () {}, true).then(function (r2) {
          if (good(r2)) { r2.method = 'ocr'; r2.thumb = cv2; return r2; }
          var cv3 = canvasFrom(bmp, 2600, 270);
          return ocr(cv3, data, function () {}, true).then(function (r3) { if (good(r3)) { r3.method = 'ocr'; r3.thumb = cv3; return r3; } return r; });
        });
      });
    });
  }
  function ocrProgress(progress) {
    return function (m, pass) {
      if (m.status === 'recognizing text') progress({ stage: pass < 2 ? 'Reading the text (step ' + (pass + 1) + ' of 2)' : 'Double-checking unclear details', p: Math.min(0.97, 0.2 + 0.36 * pass + 0.36 * (m.progress || 0)) });
      else if (/load|initializ/i.test(m.status)) progress({ stage: 'Loading the text reader (first time only)', p: 0.1 + 0.1 * (m.progress || 0) });
    };
  }

  API = { read: read, parse: parse, buildLines: buildLines, ocrWords: ocrWords, merge: merge };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.AWBRead = API;
})(typeof window !== 'undefined' ? window : globalThis);
