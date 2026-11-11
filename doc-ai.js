/* Helpers for the document readers.
   1. layoutText / numbers: work on the device. They rebuild each page row by row, find the header of every table and
      say which column each number of a totals row belongs to, so packages, weights and volume can be read from any table layout.
   2. read: the optional second step "Read it with AI". Only when the user presses that button is the TEXT of the
      documents (never the file itself) sent to our reader, which returns the names, addresses and ports. Nothing is stored. */
(function () {
  'use strict';
  function isNum(t) { t = String(t || '').trim(); return /\d/.test(t) && /^[\d.,\s%\-]+$/.test(t); }
  function val(t) { var n = parseFloat(String(t).replace(/,/g, '')); return isNaN(n) ? 0 : n; }
  function wOf(c) { return c.w || c.s.length * 4; }
  function shortLabel(c) { var t = c.s.trim(); return t.length <= 18 && t.indexOf(':') < 0; }
  // the header rows of the table a row belongs to: the nearest row above with 4+ cells and no numbers, plus the header lines touching it
  function headBand(rows, i) {
    for (var j = i - 1; j >= 0; j--) {
      if (rows[j].c.length >= 4 && rows[j].n === 0) {
        var cells = rows[j].c.slice(), a = j, b = j;
        while (a > 0 && j - a < 2 && rows[a - 1].n === 0 && rows[a - 1].y - rows[a].y <= 9 && (rows[a - 1].c.length >= 3 || rows[a - 1].c.every(shortLabel))) { a--; cells = cells.concat(rows[a].c); }
        while (b < i - 1 && rows[b + 1].n === 0 && rows[b].y - rows[b + 1].y <= 9) { b++; cells = cells.concat(rows[b].c); }
        return { id: j, end: b, cells: cells };
      }
    }
    return null;
  }
  function colName(cells, c) {
    var x0 = c.x - 2, x1 = c.x + (c.w || 6) + 2, mid = (x0 + x1) / 2;
    var hit = cells.filter(function (h) { return h.x <= x1 && h.x + wOf(h) >= x0; });
    if (!hit.length) {
      var best = null, bd = 26;
      cells.forEach(function (h) { var d = Math.abs(h.x + wOf(h) / 2 - mid); if (d < bd) { bd = d; best = h; } });
      if (best) hit = cells.filter(function (h) { return Math.abs(h.x + wOf(h) / 2 - (best.x + wOf(best) / 2)) < 12; });
    }
    hit.sort(function (a, b) { return b.y - a.y || a.x - b.x; });
    return hit.map(function (h) { return h.s.trim(); }).join(' ');
  }
  // pages -> rows (top to bottom) -> cells (left to right)
  function pagesOf(d) {
    var items = (d && d.items) || [], pages = {}, out = [];
    items.forEach(function (it) { if (!it.s || !it.s.trim()) return; var p = it.p || 1; (pages[p] = pages[p] || []).push(it); });
    Object.keys(pages).map(Number).sort(function (a, b) { return a - b; }).forEach(function (p) {
      var its = pages[p].slice().sort(function (a, b) { return b.y - a.y || a.x - b.x; }), rows = [];
      its.forEach(function (it) { var r = rows[rows.length - 1]; if (r && Math.abs(r.y - it.y) <= 3) r.c.push(it); else rows.push({ y: it.y, c: [it] }); });
      rows.forEach(function (r) { r.c.sort(function (a, b) { return a.x - b.x; }); r.n = r.c.filter(function (c) { return isNum(c.s); }).length; });
      rows.forEach(function (r, i) {
        r.total = r.c.length >= 2 && r.n === r.c.length;
        r.band = (r.total || r.n >= 3) ? headBand(rows, i) : null;
        r.cols = r.band ? r.c.filter(function (c) { return isNum(c.s); }).map(function (c) { return { v: c.s.trim(), h: colName(r.band.cells, c) }; }).filter(function (x) { return x.h; }) : [];
      });
      out.push(rows);
    });
    return out;
  }
  function lineOf(r) {
    var line = '', end = null;
    r.c.forEach(function (it) { var gap = end == null ? 0 : it.x - end; line += (end == null ? '' : gap > 14 ? '   ' : gap > 1.5 ? ' ' : '') + it.s.trim(); end = it.x + wOf(it); });
    return line;
  }
  // Text of a document laid out the way it looks on the page. brief: leave out the middle of long tables.
  function layoutText(d, brief) {
    var pages = pagesOf(d);
    if (!pages.length) return String((d && d.text) || '');
    var out = [];
    pages.forEach(function (rows) {
      var noted = {}, seen = {}, skipped = 0;
      rows.forEach(function (r) {
        var id = r.band ? r.band.id : -1;
        if (brief && r.band && !r.total) { seen[id] = (seen[id] || 0) + 1; if (seen[id] > 3) { skipped++; return; } }
        if (skipped && (r.total || !r.band)) { out.push('   […' + skipped + ' more rows]'); skipped = 0; }
        out.push(lineOf(r));
        if (!r.cols.length || (!r.total && noted[id])) return;
        noted[id] = 1;
        out.push('   [' + (r.total ? 'totals row' : 'first row') + ', column of each number: ' + r.cols.map(function (x) { return x.v + ' = ' + x.h; }).join('; ') + ']');
      });
      out.push('');
    });
    var t = out.join('\n');
    // a scanned page has no positioned text: fall back to what the text recognition returned
    return t.replace(/\s/g, '').length > 40 ? t : String(d.text || '');
  }
  // Packages, weights and volume from the totals rows of the tables, by the name of the column each number sits in.
  function numbers(d) {
    var o = { pallets: 0, cartons: 0, pieces: 0, gross: 0, net: 0, cbm: 0, dims: [] }, pal = {};
    pagesOf(d).forEach(function (rows) {
      rows.forEach(function (r) {
        if (!r.band) return;
        if (!r.total) {
          // a pallet row: a number under PALLET NO / PALLET NUMBER, with its size under PALLET SIZE … L W H
          var pn = r.cols.filter(function (x) { return /PALLET\s*(NO\b|NUMBER|#)/i.test(x.h) && !/SIZE|WT|WEIGHT|CBM/i.test(x.h); })[0];
          if (pn && !pal[pn.v]) {
            pal[pn.v] = 1; o.pallets++;
            var sz = r.cols.filter(function (x) { return /PALLET.*(SIZE|DIM)/i.test(x.h); }).map(function (x) { return x.v; });
            if (sz.length === 3) o.dims.push(sz.join('x') + '/1');
          }
          return;
        }
        r.cols.forEach(function (x) {
          var h = x.h.toUpperCase(), v = val(x.v); if (!v) return;
          var per = /\/|\bPER\b|\bEACH\b|\bUNIT\b|RATE|PRICE|AMOUNT|VALUE/.test(h);
          if (/WT|WEIGHT|\bKGS?\b|KG'S/.test(h) && !per) {
            if (/NET|\bN\.?\s?W/.test(h)) o.net = Math.max(o.net, v);
            else if (!/VOL|CHARGEABLE|DIM/.test(h)) o.gross = Math.max(o.gross, v);
          } else if (/CBM|M3|\bVOL/.test(h) && !/WT|WEIGHT|KG/.test(h)) o.cbm = Math.max(o.cbm, v);
          else if (/CTN|CARTON|BOX|PKG|PACKAGE|BAG|DRUM|ROLL|BALE|CASE/.test(h) && !/SIZE|PCS\s*\/|PER/.test(h) && !per) o.cartons = Math.max(o.cartons, v);
          else if (/PCS|QTY|QUANTITY|UNITS|NOS/.test(h) && !per) o.pieces = Math.max(o.pieces, v);
        });
      });
    });
    if (o.net && o.net >= o.gross) o.net = 0;
    return o;
  }
  function read(docs, kind) {
    var body = { kind: kind || 'awb', docs: docs.map(function (x) { return { name: String(x.name || '').slice(0, 80), text: String(x.text != null ? x.text : layoutText(x.d, true)).slice(0, 9000) }; }) };
    return fetch('/api/read-doc', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j || !j.ok) throw new Error((j && j.error) || 'failed'); return j.fields; }); });
  }
  window.DocAI = { layoutText: layoutText, numbers: numbers, read: read };
})();
