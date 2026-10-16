/* YAM Logistics – Container load planner UI (needs lp-engine.js, three.min.js, OrbitControls.js, jspdf.umd.min.js) */
(function () {
  'use strict';
  const E = window.LPEngine;
  const root = document.getElementById('lp-root');
  if (!root || !E) return;

  const PALETTE = ['#0A6CC2', '#F59E0B', '#16A34A', '#E2483A', '#7C3AED', '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#4F46E5', '#0D9488', '#A16207', '#BE123C', '#2563EB', '#9333EA', '#059669'];
  const WA = 'YAMLOGISTICS';
  const EMAIL = 'info@yamlogistics.com';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n, d = 0) => (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

  // ---------------- state
  const S = {
    unit: 'cm', wunit: 'kg', cat: 'dry', pal: false, deck: 'ld', opt: 0, options: null,
    items: [
      { name: 'Carton A', l: 60, w: 40, h: 40, qty: 200, kg: 12, orient: 'any', stackable: true, maxLayers: '', color: '' },
      { name: 'Carton B', l: 50, w: 50, h: 60, qty: 80, kg: 20, orient: 'upright', stackable: true, maxLayers: '', color: '' }
    ],
    result: null, unitSel: 0, step: -1
  };
  const lenF = () => (S.unit === 'in' ? 2.54 : 1);
  const wtF = () => (S.wunit === 'lb' ? 0.45359237 : 1);
  const showLen = (cm, d = 0) => fmt(cm / lenF(), S.unit === 'in' ? 1 : d);
  const showWt = (kg) => fmt(kg / wtF(), 0);
  const EQ = (id) => E.EQUIPMENT.find((e) => e.id === id);
  const CATS = {
    dry: { label: 'Dry containers', sub: '20′ · 40′ · 40′ HC', kind: 'container', cands: () => [['20gp', 1], ['40gp', 1.3], ['40hc', 1.35]] },
    reefer: { label: 'Reefer containers', sub: '20′ RF · 40′ HC RF', kind: 'container', note: 'Reefer heights are kept below the red load line so cold air can circulate.', cands: () => [['20rf', 1], ['40rh', 1.3]] },
    uld: { label: 'Air pallets (ULDs)', sub: 'PMC · PAG', kind: 'air pallet', note: 'Air pallets are planned as a box shape. The aircraft contour is not modelled, so the airline will confirm the build-up.', cands: () => (S.deck === 'md' ? [['pmc-md', 1], ['pag-md', 0.93]] : [['pmc-ld', 1], ['pag-ld', 0.93]]) }
  };
  const PALLETS = [['euro', 'Euro 120 × 80', 120, 80], ['std', 'Standard 120 × 100', 120, 100], ['asia', 'Asia 110 × 110', 110, 110], ['us', 'US 48″ × 40″', 121.9, 101.6], ['custom', 'Other size', 0, 0]];
  const palletOf = (it) => (PALLETS.find((p) => p[2] && Math.abs(p[2] - it.l) < 0.6 && Math.abs(p[3] - it.w) < 0.6) || PALLETS[PALLETS.length - 1])[0];

  // ---------------- share / import
  function encodeState() {
    const o = { u: S.unit, wu: S.wunit, c: S.cat, p: S.pal ? 1 : 0, d: S.deck, i: S.items.map((it) => [it.name, it.l, it.w, it.h, it.qty, it.kg, ({ any: 0, upright: 1, fixed: 2 })[it.orient] || 0, it.stackable ? 1 : 0, it.maxLayers || 0, it.color || '', it.onTop === false ? 0 : 1]) };
    return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/, '');
  }
  function decodeHash() {
    const h = location.hash.slice(1);
    try {
      if (h.startsWith('p=')) {
        const o = JSON.parse(decodeURIComponent(escape(atob(h.slice(2)))));
        S.unit = o.u || 'cm'; S.wunit = o.wu || 'kg'; S.cat = CATS[o.c] ? o.c : 'dry'; S.pal = !!o.p; S.deck = o.d === 'md' ? 'md' : 'ld';
        S.items = (o.i || []).map((r) => ({ name: r[0], l: r[1], w: r[2], h: r[3], qty: r[4], kg: r[5], orient: ['any', 'upright', 'fixed'][r[6]] || 'any', stackable: !!r[7], maxLayers: r[8] || '', color: r[9] || '', onTop: r[10] !== 0 }));
        return true;
      }
      if (h.startsWith('c=')) { // from the CBM calculator
        const o = JSON.parse(decodeURIComponent(h.slice(2)));
        S.unit = o.unit === 'in' ? 'in' : 'cm';
        const f = S.unit === 'in' ? 2.54 : 1;
        S.items = (o.rows || []).filter((r) => +r.l && +r.w && +r.h).map((r, i) => ({ name: 'Item ' + (i + 1), l: +r.l * f, w: +r.w * f, h: +r.h * f, qty: Math.max(1, Math.floor(+r.pcs || 1)), kg: +r.kg || 0, orient: 'any', stackable: true, maxLayers: '', color: '' }));
        return S.items.length > 0;
      }
    } catch (e) { /* ignore bad links */ }
    return false;
  }

  // ---------------- layout
  root.innerHTML = `
<div class="lp">
  <div class="lp-card lp-form">
    <div class="lp-q">1 · What will you ship in?</div>
    <div class="lp-cats" id="lp-cats">${Object.entries(CATS).map(([k, c]) => `<button data-cat="${k}"><b>${c.label}</b><span>${c.sub}</span></button>`).join('')}</div>
    <div class="lp-row lp-top">
      <div class="lp-f"><span>2 · Are your packages on pallets?</span><div class="lp-seg" id="lp-pal"><button data-p="0">No, loose cartons / cases</button><button data-p="1">Yes, palletised</button></div></div>
      <div class="lp-f" id="lp-deckf"><span>Aircraft</span><div class="lp-seg" id="lp-deck"><button data-d="ld">Passenger, lower deck (160 cm)</button><button data-d="md">Freighter, main deck (244 cm)</button></div></div>
      <div class="lp-f"><span>Units</span><div class="lp-seg" id="lp-units"><button data-u="cm">cm</button><button data-u="in">inches</button></div></div>
      <div class="lp-f"><span>Weight</span><div class="lp-seg" id="lp-wunits"><button data-w="kg">kg</button><button data-w="lb">lb</button></div></div>
    </div>
    <div class="lp-eqinfo" id="lp-eqinfo"></div>
    <div class="lp-q">3 · Your packages <span class="lp-muted">type them, paste from Excel or upload a file. We work out which containers you need.</span></div>
    <div class="lp-tablewrap"><table class="lp-table">
      <thead id="lp-head"></thead>
      <tbody id="lp-rows"></tbody>
    </table></div>
    <div class="lp-row lp-actions">
      <button class="lp-btn lp-ghost" id="lp-add">+ Add package</button>
      <button class="lp-btn lp-ghost lp-xl" id="lp-paste-t">⇪ Upload or paste Excel</button>
      <button class="lp-btn lp-ghost" id="lp-example">Load example</button>
      <button class="lp-btn lp-ghost" id="lp-clear">Clear</button>
      <span class="lp-totals" id="lp-totals"></span>
    </div>
    <div class="lp-paste" id="lp-paste" hidden>
      <div class="lp-drop" id="lp-drop">
        <b>Drop your Excel or CSV file here</b> or <label class="lp-link">choose a file<input type="file" id="lp-file" accept=".xlsx,.xlsm,.csv,.txt,.tsv" hidden></label>
        <div class="lp-muted">.xlsx or .csv · first sheet is read · nothing is uploaded, the file stays in your browser</div>
      </div>
      <p>Or copy the whole table in Excel (headers included) and paste it here:</p>
      <textarea id="lp-paste-ta" rows="5" placeholder="Description	Length	Width	Height	Qty	Weight&#10;Carton A	60	40	40	200	12"></textarea>
      <div class="lp-row"><button class="lp-btn" id="lp-paste-go">Read pasted table</button><button type="button" class="lp-link lp-linkbtn" id="lp-tpl">Download Excel template (standard cargo-list format)</button></div>
      <div id="lp-map"></div>
    </div>
    <button class="lp-btn lp-go" id="lp-go">Calculate load plan →</button>
  </div>
  <div id="lp-out"></div>
</div>`;

  const $ = (id) => document.getElementById(id);

  // ---------------- Excel / CSV import
  const LPImport = (function () {
    const FIELDS = [
      ['skip', '— ignore —'], ['name', 'Package name'], ['dims', 'L × W × H in one cell'], ['l', 'Length'], ['w', 'Width'], ['h', 'Height'],
      ['qty', 'Quantity'], ['kg', 'Weight per piece'], ['kgTotal', 'Total weight (all pieces)'], ['orient', 'Orientation / this side up'], ['rotate', 'Allow rotation (yes / no)'], ['stack', 'Others on top (yes / no)'], ['under', 'Can sit on others (yes / no)'], ['layers', 'Max layers']
    ];
    const RX = {
      dims: /dimension|measurement|\bsize\b|l\s*[x×*]\s*w|lxwxh/i,
      l: /^\s*l\b|length|lenght|\blen\b|long/i,
      w: /^\s*w\b|width|breadth|wide/i,
      h: /^\s*h\b|height|\bhigh\b|\bht\b/i,
      qty: /qty|quantit|pcs|pieces|no\.? ?of|number of|ctns|\bcartons?\b|pkgs|packages|units|count|\bnos\b/i,
      kgTotal: /total.*(weight|wt|kg)|(gross|weight|wt).*total/i,
      kg: /weight|\bwt\b|\bkgs?\b|\blbs?\b|mass|gross/i,
      under: /stack\w*\s*under|under\b|sit on|on top of others/i,
      stack: /stack/i,
      rotate: /rotat|turn/i,
      orient: /orient|upright|this side|side up/i,
      layers: /layer|tier/i,
      name: /desc|name|item|package|product|sku|article|goods|marks|type|commodity/i
    };
    let parsed = null; // {rows, header, map, lenU, wtU}

    function csvRows(text) {
      const first = text.split(/\r?\n/)[0] || '';
      const d = first.includes('\t') ? '\t' : (first.split(';').length > first.split(',').length ? ';' : ',');
      const rows = []; let row = [], cell = '', q = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
        if (c === '"' && cell === '') { q = true; continue; }
        if (c === d) { row.push(cell); cell = ''; continue; }
        if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; continue; }
        cell += c;
      }
      if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
      return rows;
    }

    // minimal .xlsx reader: unzip with the browser's DecompressionStream, read the first worksheet
    async function xlsxRows(buf) {
      const dv = new DataView(buf), u8 = new Uint8Array(buf);
      let eocd = -1;
      for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
      if (eocd < 0) throw new Error('not a zip');
      const n = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
      const files = {};
      const td = new TextDecoder();
      for (let k = 0; k < n; k++) {
        if (dv.getUint32(p, true) !== 0x02014b50) break;
        const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
        const nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
        const name = td.decode(u8.subarray(p + 46, p + 46 + nl));
        files[name] = { method, csize, off };
        p += 46 + nl + el + cl;
      }
      async function read(name) {
        const f = files[name]; if (!f) return null;
        const lnl = dv.getUint16(f.off + 26, true), lel = dv.getUint16(f.off + 28, true);
        const data = u8.subarray(f.off + 30 + lnl + lel, f.off + 30 + lnl + lel + f.csize);
        if (f.method === 0) return td.decode(data);
        if (typeof DecompressionStream === 'undefined') throw new Error('old browser');
        const ds = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        return await new Response(ds).text();
      }
      const xml = (s) => new DOMParser().parseFromString(s, 'application/xml');
      let sheetPath = 'xl/worksheets/sheet1.xml';
      try {
        const wb = xml(await read('xl/workbook.xml')), rels = xml(await read('xl/_rels/workbook.xml.rels'));
        const first = wb.getElementsByTagName('sheet')[0];
        const rid = first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
        for (const r of rels.getElementsByTagName('Relationship')) if (r.getAttribute('Id') === rid) { const t = r.getAttribute('Target'); sheetPath = t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, ''); }
      } catch (e) { /* fall back to sheet1 */ }
      const ssx = await read('xl/sharedStrings.xml');
      const shared = ssx ? [...xml(ssx).getElementsByTagName('si')].map((si) => [...si.getElementsByTagName('t')].map((t) => t.textContent).join('')) : [];
      const sx = await read(sheetPath); if (!sx) throw new Error('no sheet');
      const rows = [];
      for (const r of xml(sx).getElementsByTagName('row')) {
        const ri = (+r.getAttribute('r') || rows.length + 1) - 1, row = [];
        for (const c of r.getElementsByTagName('c')) {
          const ref = c.getAttribute('r') || ''; let col = 0;
          for (const ch of ref.replace(/\d+/g, '')) col = col * 26 + ch.charCodeAt(0) - 64;
          col = col ? col - 1 : row.length;
          const t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0];
          let val = '';
          if (t === 's') val = shared[+(v && v.textContent)] || '';
          else if (t === 'inlineStr') val = [...c.getElementsByTagName('t')].map((x) => x.textContent).join('');
          else val = v ? v.textContent : '';
          row[col] = val;
        }
        rows[ri] = row;
      }
      return rows.map((r) => (r || []).map((x) => (x == null ? '' : String(x))));
    }

    const num = (s) => { const v = parseFloat(String(s).replace(/[, ](?=\d{3}\b)/g, '').replace(/[^\d.\-eE]/g, '')); return isFinite(v) ? v : NaN; };
    function unitOf(h, kind) {
      const s = String(h).toLowerCase();
      if (kind === 'len') { if (/\bmm\b|millim/.test(s)) return 'mm'; if (/\binch|\(in\)|\bins?\b|"/.test(s)) return 'in'; if (/\bcm\b|centim/.test(s)) return 'cm'; if (/\(m\)|\bmtrs?\b|\bmeters?\b|\bmetres?\b/.test(s)) return 'm'; return ''; }
      if (/\blbs?\b|pound/.test(s)) return 'lb'; if (/\bkgs?\b|kilo/.test(s)) return 'kg'; return '';
    }
    function analyze(rows) {
      rows = rows.filter((r) => r && r.some((c) => String(c).trim() !== ''));
      if (!rows.length) return null;
      const width = Math.max(...rows.map((r) => r.length));
      // header row: the row (in the first 15) with the most keyword hits
      let hi = -1, best = 1;
      rows.slice(0, 15).forEach((r, i) => {
        const hits = r.filter((c) => c && isNaN(num(c)) && Object.entries(RX).some(([k, rx]) => k !== 'name' && rx.test(c))).length;
        if (hits > best) { best = hits; hi = i; }
      });
      const header = hi >= 0 ? rows[hi].map((c) => String(c || '').trim()) : [];
      const body = rows.slice(hi + 1);
      const map = new Array(width).fill('skip');
      const used = new Set();
      if (hi >= 0) {
        const serial = /^\s*(s\.?\s*no|sr\.?\s*no|sl\.?\s*no|serial|#|item\s*no|line\s*no)\.?\s*$/i;
        for (const f of ['dims', 'kgTotal', 'l', 'w', 'h', 'qty', 'kg', 'under', 'stack', 'rotate', 'orient', 'layers', 'name']) {
          for (let c = 0; c < width; c++) {
            if (map[c] !== 'skip' || serial.test(header[c] || '')) continue;
            if (RX[f].test(header[c] || '') && !(f !== 'dims' && used.has(f))) {
              if ((f === 'l' || f === 'w' || f === 'h') && RX.dims.test(header[c])) continue;
              map[c] = f; used.add(f); break;
            }
          }
        }
        // a lone "weight" next to a quantity is usually per piece; "gross" alone could be total — leave to the user
      } else {
        const firstNum = !isNaN(num((body[0] || [])[0]));
        (firstNum ? ['l', 'w', 'h', 'qty', 'kg'] : ['name', 'l', 'w', 'h', 'qty', 'kg']).forEach((f, i) => { if (i < width) map[i] = f; });
      }
      const lenCol = map.findIndex((f) => f === 'l' || f === 'dims'), wtCol = map.findIndex((f) => f === 'kg' || f === 'kgTotal');
      let lenU = (lenCol >= 0 && unitOf(header[lenCol], 'len')) || '';
      if (!lenU) { // no unit in the header: very large numbers are millimetres
        const big = Math.max(0, ...body.map((r) => ['l', 'w', 'h'].map((f) => num(r[map.indexOf(f)])).filter((v) => !isNaN(v))).flat());
        lenU = big > 1400 ? 'mm' : S.unit;
      }
      return { header, body, map, width, lenU, wtU: (wtCol >= 0 && unitOf(header[wtCol], 'wt')) || S.wunit };
    }
    function toItems(P) {
      const lf = { cm: 1, mm: 0.1, m: 100, in: 2.54 }[P.lenU] || 1, wf = P.wtU === 'lb' ? 0.45359237 : 1;
      const out = [], col = (f) => P.map.indexOf(f);
      for (const r of P.body) {
        const g = (f) => { const c = col(f); return c >= 0 ? r[c] : ''; };
        let l = num(g('l')), w = num(g('w')), h = num(g('h'));
        if (col('dims') >= 0) { const m = String(g('dims')).split(/\s*[x×*X\/]\s*|\s+/).map(num).filter((v) => !isNaN(v)); if (m.length >= 3) [l, w, h] = m; }
        if (!(l > 0 && w > 0 && h > 0)) continue;
        let qty = col('qty') >= 0 ? Math.floor(num(g('qty'))) : 1; if (!(qty > 0)) qty = 1;
        let kg = num(g('kg')); if (col('kgTotal') >= 0 && isNaN(kg)) kg = num(g('kgTotal')) / qty;
        const o = String(g('orient')).toLowerCase(), st = String(g('stack')).toLowerCase(), ro = String(g('rotate')).trim().toLowerCase(), un = String(g('under')).trim().toLowerCase();
        const NO = /^(no|n|false|0|non.*|not allowed)$/;
        out.push({
          name: String(g('name') || '').trim().slice(0, 40) || 'Package ' + (S.items.length + out.length + 1),
          l: l * lf, w: w * lf, h: h * lf, qty, kg: isNaN(kg) ? 0 : kg * wf,
          orient: /fix|no.?turn|no.?rot/.test(o) ? 'fixed' : /up|side|yes|true|^y$|^1$/.test(o) ? 'upright' : NO.test(ro) ? 'upright' : 'any',
          stackable: !NO.test(st.trim()), onTop: !NO.test(un), maxLayers: Math.floor(num(g('layers'))) || '', color: ''
        });
      }
      return out;
    }
    function showMap() {
      const P = parsed, box = document.getElementById('lp-map');
      if (!P) { box.innerHTML = '<div class="lp-warn">We could not find any rows in that file. Check that the sizes are in the first sheet.</div>'; return; }
      const items = toItems(P);
      const opts = (sel) => FIELDS.map(([v, t]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${t}</option>`).join('');
      const sample = P.body.slice(0, 4);
      box.innerHTML = `<div class="lp-mapcard">
        <div class="lp-k">Check the columns</div>
        <div class="lp-tablewrap"><table class="lp-maptable"><thead><tr>${Array.from({ length: P.width }, (_, c) => `<th><select class="lp-in" data-c="${c}">${opts(P.map[c])}</select><div class="lp-muted">${esc(P.header[c] || 'Column ' + (c + 1))}</div></th>`).join('')}</tr></thead>
        <tbody>${sample.map((r) => `<tr>${Array.from({ length: P.width }, (_, c) => `<td>${esc(r[c] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="lp-row" style="margin-top:10px;align-items:center">
          <label class="lp-f"><span>Sizes in</span><select class="lp-in" id="lp-mlu">${['cm', 'mm', 'm', 'in'].map((u) => `<option${u === P.lenU ? ' selected' : ''}>${u}</option>`).join('')}</select></label>
          <label class="lp-f"><span>Weight in</span><select class="lp-in" id="lp-mwu">${['kg', 'lb'].map((u) => `<option${u === P.wtU ? ' selected' : ''}>${u}</option>`).join('')}</select></label>
          <span class="lp-muted" style="flex:1 1 200px">${items.length} package line${items.length === 1 ? '' : 's'} found · ${fmt(items.reduce((a, it) => a + it.qty, 0))} pcs · ${fmt(items.reduce((a, it) => a + it.l * it.w * it.h * it.qty, 0) / 1e6, 2)} m³</span>
          <button class="lp-btn" id="lp-madd" ${items.length ? '' : 'disabled'}>Add to list</button>
          <button class="lp-btn lp-ghost" id="lp-mrep" ${items.length ? '' : 'disabled'}>Replace list</button>
        </div></div>`;
      box.querySelectorAll('select[data-c]').forEach((s) => s.addEventListener('change', () => { P.map[+s.dataset.c] = s.value; showMap(); }));
      document.getElementById('lp-mlu').onchange = (e) => { P.lenU = e.target.value; showMap(); };
      document.getElementById('lp-mwu').onchange = (e) => { P.wtU = e.target.value; showMap(); };
      const done = (replace) => {
        const add = toItems(P);
        S.items = (replace ? [] : S.items.filter((it) => it.l && it.w && it.h)).concat(add);
        parsed = null; box.innerHTML = ''; document.getElementById('lp-paste-ta').value = ''; document.getElementById('lp-paste').hidden = true;
        renderRows();
      };
      document.getElementById('lp-madd').onclick = () => done(false);
      document.getElementById('lp-mrep').onclick = () => done(true);
    }
    async function readFile(f) {
      const box = document.getElementById('lp-map');
      box.innerHTML = '<div class="lp-muted">Reading ' + esc(f.name) + '…</div>';
      try {
        let rows;
        if (/\.(xlsx|xlsm)$/i.test(f.name)) rows = await xlsxRows(await f.arrayBuffer());
        else if (/\.xls$/i.test(f.name)) { box.innerHTML = '<div class="lp-warn">Old .xls files can’t be read here. In Excel use File › Save As › Excel Workbook (.xlsx) or CSV, or simply copy the table and paste it below.</div>'; return; }
        else rows = csvRows(await f.text());
        parsed = analyze(rows); showMap();
      } catch (e) {
        console.error(e);
        box.innerHTML = '<div class="lp-warn">This file could not be read. Save it as .xlsx or CSV, or copy the table and paste it below.</div>';
      }
    }
    function init() {
      document.getElementById('lp-paste-t').addEventListener('click', () => { const p = document.getElementById('lp-paste'); p.hidden = !p.hidden; });
      document.getElementById('lp-file').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) readFile(f); e.target.value = ''; });
      const drop = document.getElementById('lp-drop');
      ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('on'); }));
      ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('on'); }));
      drop.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) readFile(f); });
      document.getElementById('lp-paste-go').addEventListener('click', () => { parsed = analyze(csvRows(document.getElementById('lp-paste-ta').value)); showMap(); });
      document.getElementById('lp-paste-ta').addEventListener('paste', () => setTimeout(() => { parsed = analyze(csvRows(document.getElementById('lp-paste-ta').value)); showMap(); }, 30));
      document.getElementById('lp-tpl').addEventListener('click', (e) => {
        e.preventDefault();
        const a = document.createElement('a'); a.href = 'YAM-load-planner-template.xlsx'; a.download = 'YAM-load-planner-template.xlsx'; document.body.appendChild(a); a.click(); a.remove();
      });
    }
    function fromText(text) { document.getElementById('lp-paste').hidden = false; document.getElementById('lp-paste-ta').value = text; parsed = analyze(csvRows(text)); showMap(); document.getElementById('lp-map').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    return { init, analyze, toItems, csvRows, fromText };
  })();


  function renderEqInfo() {
    const c = CATS[S.cat];
    const list = c.cands().map(([id]) => EQ(id));
    $('lp-eqinfo').innerHTML = `<span class="lp-muted">We’ll choose the best mix of: ${list.map((e) => `<b>${esc(e.name)}</b> (${showLen(e.L)} × ${showLen(e.W)} × ${showLen(e.H)} ${S.unit}, max ${showWt(e.maxKg)} ${S.wunit})`).join(' · ')}</span>${c.note ? `<span class="lp-note">${esc(c.note)}</span>` : ''}`;
  }

  function segs() {
    document.querySelectorAll('#lp-cats button').forEach((b) => b.classList.toggle('on', b.dataset.cat === S.cat));
    document.querySelectorAll('#lp-pal button').forEach((b) => b.classList.toggle('on', b.dataset.p === (S.pal ? '1' : '0')));
    document.querySelectorAll('#lp-deck button').forEach((b) => b.classList.toggle('on', b.dataset.d === S.deck));
    $('lp-deckf').hidden = S.cat !== 'uld';
    document.querySelectorAll('#lp-units button').forEach((b) => b.classList.toggle('on', b.dataset.u === S.unit));
    document.querySelectorAll('#lp-wunits button').forEach((b) => b.classList.toggle('on', b.dataset.w === S.wunit));
  }
  $('lp-cats').addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; S.cat = b.dataset.cat; segs(); renderEqInfo(); });
  $('lp-deck').addEventListener('click', (e) => { const d = e.target.dataset.d; if (d) { S.deck = d; segs(); renderEqInfo(); } });
  $('lp-pal').addEventListener('click', (e) => {
    const p = e.target.dataset.p; if (p == null) return;
    S.pal = p === '1';
    for (const it of S.items) {
      if (S.pal) { if (it.orient === 'any') it.orient = 'upright'; it.stackable = false; if (!(it.l && it.w)) { it.l = 120; it.w = 80; } if (/^(Package|Carton)/.test(it.name)) it.name = it.name.replace(/^(Package|Carton)/, 'Pallet'); }
      else { it.stackable = true; if (/^Pallet/.test(it.name)) it.name = it.name.replace(/^Pallet/, 'Package'); }
    }
    segs(); renderRows();
  });
  $('lp-units').addEventListener('click', (e) => { const u = e.target.dataset.u; if (u) { S.unit = u; segs(); renderRows(); renderEqInfo(); if (S.result) renderResult(); } });
  $('lp-wunits').addEventListener('click', (e) => { const w = e.target.dataset.w; if (w) { S.wunit = w; segs(); renderRows(); renderEqInfo(); if (S.result) renderResult(); } });

  // rows (stored internally in cm/kg)
  function renderRows() {
    const u = S.unit === 'in' ? 'in' : 'cm';
    $('lp-head').innerHTML = `<tr><th title="Colour in the 3D plan">Colour</th><th>${S.pal ? 'Pallet name' : 'Package name'}</th>${S.pal ? '<th>Pallet size</th>' : ''}<th>Length (${u})</th><th>Width (${u})</th><th>${S.pal ? 'Height incl. pallet' : 'Height'} (${u})</th><th>Qty</th><th>Weight / pc (${S.wunit})</th><th title="How the package may be turned when loading">Orientation</th><th title="Other packages may be placed on top of this one">${S.pal ? 'Double-stack' : 'Others on top'}</th><th title="This package may be placed on top of other cargo (untick to keep it on the floor)">Can sit on others</th><th title="Max layers of this item, optional">Max layers</th><th></th></tr>`;
    $('lp-rows').innerHTML = S.items.map((it, i) => `<tr data-i="${i}">
      <td class="lp-c"><input type="color" class="lp-color" data-k="color" value="${it.color || PALETTE[i % PALETTE.length]}" aria-label="Colour"></td>
      <td><input class="lp-in lp-name" data-k="name" value="${esc(it.name)}" maxlength="40"></td>
      ${S.pal ? `<td><select class="lp-in lp-pt" data-k="pallet" aria-label="Pallet size">${PALLETS.map(([v, t]) => `<option value="${v}"${palletOf(it) === v ? ' selected' : ''}>${t}</option>`).join('')}</select></td>` : ''}
      <td><input class="lp-in" data-k="l" inputmode="decimal" value="${it.l ? +(it.l / lenF()).toFixed(2) : ''}"></td>
      <td><input class="lp-in" data-k="w" inputmode="decimal" value="${it.w ? +(it.w / lenF()).toFixed(2) : ''}"></td>
      <td><input class="lp-in" data-k="h" inputmode="decimal" value="${it.h ? +(it.h / lenF()).toFixed(2) : ''}"></td>
      <td><input class="lp-in" data-k="qty" inputmode="numeric" value="${it.qty || ''}"></td>
      <td><input class="lp-in" data-k="kg" inputmode="decimal" value="${it.kg ? +(it.kg / wtF()).toFixed(2) : ''}"></td>
      <td><select class="lp-in lp-or" data-k="orient" aria-label="Orientation">${[['any', 'Any way'], ['upright', 'This side up'], ['fixed', 'Fixed, no turning']].map(([v, t]) => `<option value="${v}"${(it.orient || 'any') === v ? ' selected' : ''}>${t}</option>`).join('')}</select></td>
      <td class="lp-c"><input type="checkbox" data-k="stackable" ${it.stackable ? 'checked' : ''} aria-label="Others on top"></td>
      <td class="lp-c"><input type="checkbox" data-k="onTop" ${it.onTop === false ? '' : 'checked'} aria-label="Can sit on other cargo"></td>
      <td><input class="lp-in lp-small" data-k="maxLayers" inputmode="numeric" placeholder="any" value="${it.maxLayers || ''}"></td>
      <td><button class="lp-x" data-del="${i}" aria-label="Remove">×</button></td></tr>`).join('');
    totals();
  }
  $('lp-rows').addEventListener('input', (e) => {
    const tr = e.target.closest('tr'); if (!tr) return;
    const it = S.items[+tr.dataset.i], k = e.target.dataset.k;
    if (k === 'stackable' || k === 'onTop') it[k] = e.target.checked;
    else if (k === 'pallet') { const p = PALLETS.find((x) => x[0] === e.target.value); if (p && p[2]) { it.l = p[2]; it.w = p[3]; renderRows(); return; } }
    else if (k === 'name' || k === 'orient' || k === 'color') it[k] = e.target.value;
    else {
      const v = parseFloat(e.target.value);
      it[k] = !(v > 0) ? 0 : (k === 'qty' || k === 'maxLayers') ? Math.floor(v) : k === 'kg' ? v * wtF() : v * lenF();
    }
    totals();
  });
  $('lp-rows').addEventListener('change', (e) => { if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') e.target.dispatchEvent(new Event('input', { bubbles: true })); });
  $('lp-rows').addEventListener('click', (e) => { const d = e.target.dataset.del; if (d != null) { S.items.splice(+d, 1); if (!S.items.length) addRow(); renderRows(); } });
  function addRow() {
    const L = String.fromCharCode(65 + (S.items.length % 26));
    S.items.push(S.pal ? { name: 'Pallet ' + L, l: 120, w: 80, h: 0, qty: 1, kg: 0, orient: 'upright', stackable: false, maxLayers: '', color: '' }
      : { name: 'Package ' + L, l: 0, w: 0, h: 0, qty: 1, kg: 0, orient: 'any', stackable: true, maxLayers: '', color: '' });
  }
  $('lp-add').addEventListener('click', () => { addRow(); renderRows(); });
  $('lp-clear').addEventListener('click', () => { S.items = []; addRow(); S.result = null; $('lp-out').innerHTML = ''; renderRows(); });
  $('lp-example').addEventListener('click', () => {
    S.unit = 'cm'; S.wunit = 'kg';
    S.items = S.pal ? [
      { name: 'Euro pallets – garments', l: 120, w: 80, h: 160, qty: 22, kg: 420, orient: 'upright', stackable: false, maxLayers: '', color: '' },
      { name: 'Standard pallets – machinery parts', l: 120, w: 100, h: 110, qty: 9, kg: 780, orient: 'upright', stackable: true, maxLayers: 2, color: '' }
    ] : [
      { name: 'Rug bales', l: 120, w: 60, h: 50, qty: 90, kg: 45, orient: 'any', stackable: true, maxLayers: '', color: '' },
      { name: 'Brassware cartons', l: 60, w: 40, h: 40, qty: 260, kg: 18, orient: 'upright', stackable: true, maxLayers: '', color: '' },
      { name: 'Machine on pallet', l: 120, w: 100, h: 110, qty: 4, kg: 650, orient: 'upright', stackable: false, maxLayers: '', color: '' },
      { name: 'Small cartons', l: 40, w: 30, h: 25, qty: 300, kg: 6, orient: 'any', stackable: true, maxLayers: '', color: '' }
    ];
    segs(); renderRows(); renderEqInfo();
  });
  LPImport.init();
  // paste a whole Excel table straight into the package list
  $('lp-rows').addEventListener('paste', (e) => {
    const t = (e.clipboardData || window.clipboardData).getData('text');
    if (t && (/\t/.test(t) || /\n.*\S/.test(t.trim()))) { e.preventDefault(); LPImport.fromText(t); }
  });
  function totals() {
    let pcs = 0, cbm = 0, kg = 0;
    for (const it of S.items) { const q = it.qty || 0; pcs += q; cbm += (it.l * it.w * it.h * q) / 1e6; kg += (it.kg || 0) * q; }
    $('lp-totals').innerHTML = `<b>${fmt(pcs)}</b> pcs · <b>${fmt(cbm, 2)}</b> m³ · <b>${showWt(kg)}</b> ${S.wunit}`;
  }

  // ---------------- calculate
  $('lp-go').addEventListener('click', calc);
  function calc() {
    const items = S.items.filter((it) => it.l > 0 && it.w > 0 && it.h > 0 && +it.qty > 0)
      .map((it) => ({ ...it, upright: it.orient === 'upright' || it.orient === 'fixed', maxLayers: +it.maxLayers || 0, qty: Math.floor(+it.qty), color: it.color || PALETTE[S.items.indexOf(it) % PALETTE.length] }));
    if (!items.length) { $('lp-out').innerHTML = '<div class="lp-card lp-warn">Enter at least one package with length, width, height and quantity.</div>'; return; }
    const cands = CATS[S.cat].cands().map(([id, cost]) => ({ eq: EQ(id), cost }));
    const opts = [];
    const mix = E.planMix(items, cands);
    opts.push({ label: 'Recommended', res: mix });
    for (const c of cands) {
      const r1 = E.plan(items, c.eq);
      r1.cost = r1.units.length * c.cost;
      if (!r1.tooBig.length) opts.push({ label: 'Only ' + c.eq.name.replace(/ \(.*\)$/, ''), res: r1 });
    }
    // if a single-type plan is cheaper than the mix, recommend it instead
    let bi = 0;
    opts.forEach((o, i) => { if (o.res.totalBoxes >= opts[bi].res.totalBoxes && o.res.cost < opts[bi].res.cost - 1e-9) bi = i; });
    if (bi) { const b = opts.splice(bi, 1)[0]; b.label = 'Recommended'; opts[0].label = 'Mixed sizes'; opts.unshift(b); }
    for (const o of opts) prep(o.res, items);
    S.options = opts; S.opt = 0;
    show(0);
    try { history.replaceState(null, '', location.pathname + location.search + '#p=' + encodeState()); } catch (e) { /* ignore */ }
    $('lp-out').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function show(i) { S.opt = i; S.result = S.options[i].res; S.unitSel = 0; S.step = -1; renderResult(); }
  function prep(res, items) {
    res.items = items;
    // group identical units
    const sig = (u) => u.eq.id + '#' + Object.entries(u.counts).sort().map((e) => e.join(':')).join('|') + '#' + u.boxes.length + '#' + Math.round(u.usedL);
    res.groups = [];
    for (const u of res.units) {
      const g = res.groups[res.groups.length - 1];
      if (g && sig(g.units[0]) === sig(u)) g.units.push(u); else res.groups.push({ units: [u] });
    }
    for (const u of res.units) u.steps = E.steps(u);
  }
  function composition(r) {
    const m = new Map();
    for (const u of r.units) m.set(u.eq.name, (m.get(u.eq.name) || 0) + 1);
    return [...m.entries()].map(([k, v]) => `${v} × ${k.replace(/ \(.*\)$/, '')}`).join(' + ');
  }

  function itemColor(type) { return type.color || PALETTE[type.idx % PALETTE.length]; }
  function orientText(b) {
    const t = b.type, o = b.o;
    if (o.h === t.h) return (o.d === t.l ? 'as packed' : 'turned 90°') + ', upright';
    return 'laid on its side';
  }

  function stepText(st, k) {
    const u = S.result.eq;
    const parts = st.parts.map((p) => {
      const across = p.cols;
      const dim = `${showLen(p.o.d)}×${showLen(p.o.w)}×${showLen(p.o.h)} ${S.unit}`;
      return `<li><span class="lp-dot" style="background:${itemColor(p.type)}"></span><b>${fmt(p.n)} × ${esc(p.type.name)}</b> ${p.top ? 'on top of the stacks below' : 'from the floor'}, ${orientText(p)} (${dim} L×W×H), in ${across} stack${across > 1 ? 's' : ''}</li>`;
    }).join('');
    const reps = st.walls.length;
    const pos = `${showLen(st.x0)}–${showLen(st.x1)} ${S.unit} from the front wall`;
    return `<div class="lp-steptitle">Step ${k + 1}${reps > 1 ? ` · ${reps} identical rows` : ''}</div><div class="lp-muted">${pos}${reps > 1 ? ' (per row: ' + fmt(st.n / reps) + ' pcs)' : ''}</div><ul>${parts}</ul>`;
  }

  // ---------------- results
  function bar(p, warn) { const c = p > 1 ? '#E2483A' : warn && p > 0.9 ? '#F59E0B' : '#0A6CC2'; return `<span class="lp-bar"><i style="width:${Math.min(100, p * 100).toFixed(1)}%;background:${c}"></i></span>`; }

  function renderResult() {
    const r = S.result;
    const n = r.units.length;
    const kind = CATS[S.cat].kind;
    const plural = (k) => (k === 1 ? kind : kind === 'pallet' ? 'pallets' : kind === 'air pallet' ? 'air pallets' : 'containers');
    const totalPcs = r.items.reduce((a, it) => a + it.qty, 0);
    const warn = [];
    for (const t of r.tooBig) warn.push(`<b>${fmt(t.n)} × ${esc(t.type.name)}</b> cannot be loaded: ${t.why}.`);
    for (const t of r.notPlaced) warn.push(`<b>${fmt(t.n)} × ${esc(t.type.name)}</b> were not planned (the planner stops at 200 units). Ask us to plan this load.`);
    const cmp = S.options.length > 1 ? `<div class="lp-cmp"><div class="lp-k">Other ways to ship it · click to view</div><table><tr><th></th><th>${kind === 'container' ? 'Containers' : 'Air pallets'}</th><th>Avg. fill</th></tr>${S.options.map((o, i) => `<tr class="lp-opt ${i === S.opt ? 'on' : ''}" data-o="${i}"><td>${esc(o.label)}</td><td>${esc(composition(o.res))}</td><td>${o.res.units.length ? Math.round(o.res.units.reduce((a, u) => a + u.util, 0) / o.res.units.length * 100) + '%' : '–'}</td></tr>`).join('')}</table></div>` : '';
    const tabs = r.groups.map((g, gi) => {
      const a = g.units[0].index + 1, b = g.units[g.units.length - 1].index + 1;
      const on = g.units.includes(r.units[S.unitSel]);
      return `<button class="lp-tab ${on ? 'on' : ''}" data-u="${g.units[0].index}">${kind === 'container' ? 'Container' : 'Air pallet'} ${a}${b > a ? '–' + b : ''} <small>${esc(g.units[0].eq.name.replace(/ \(.*\)$/, ''))}${g.units.length > 1 ? ` · ×${g.units.length} identical` : ''}</small></button>`;
    }).join('');
    $('lp-out').innerHTML = `
<div class="lp-card lp-sum">
  <div class="lp-sumhead">
    <div><div class="lp-k">You need</div><div class="lp-big">${n ? esc(composition(r)) : 'Nothing could be loaded'}</div>
    <div class="lp-muted">${fmt(r.totalBoxes)} of ${fmt(totalPcs)} packages planned · ${fmt(r.units.reduce((a, u) => a + u.vol, 0) / 1e6, 2)} m³ · ${showWt(r.units.reduce((a, u) => a + u.kg, 0))} ${S.wunit}</div></div>
    ${cmp}
  </div>
  ${warn.length ? `<div class="lp-warn">${warn.join('<br>')}</div>` : ''}
</div>
${n ? `<div class="lp-card">
  <div class="lp-tabs" id="lp-tabs">${tabs}</div>
  <div class="lp-stats" id="lp-stats"></div>
  <div class="lp-viewwrap">
    <div class="lp-view">
      <div class="lp-canvas" id="lp-canvas"><div class="lp-loading">Loading 3D view…</div></div>
      <div class="lp-vbar">
        <div class="lp-seg" id="lp-views"><button data-v="iso" class="on">3D</button><button data-v="top">Top</button><button data-v="side">Side</button><button data-v="door">Doors</button></div>
        <div class="lp-stepnav"><button class="lp-btn lp-ghost" id="lp-prev">◀</button><span id="lp-stepl"></span><button class="lp-btn lp-ghost" id="lp-next">▶</button><button class="lp-btn lp-ghost" id="lp-play">▶ Play</button></div>
      </div>
      <div class="lp-legend" id="lp-legend"></div>
    </div>
    <div class="lp-steps" id="lp-steps"></div>
  </div>
  <div class="lp-row lp-share">
    <button class="lp-btn" id="lp-pdf">↓ Download loading plan (PDF)</button>
    <a class="lp-btn lp-wa" id="lp-wa" target="_blank" rel="noopener">Get a quote for this load on WhatsApp</a>
    <a class="lp-btn lp-ghost" id="lp-mail">Email this plan</a>
    <button class="lp-btn lp-ghost" id="lp-copy">Copy share link</button>
  </div>
  <p class="lp-fine">Plans are computer-generated estimates for planning. Real loads need allowances for pallets, dunnage, lashing and how the cargo is packed. Always check weight limits for the route, axle loads and the carrier’s rules. Our team can check any plan before you book.</p>
</div>` : ''}`;
    document.querySelectorAll('.lp-opt').forEach((tr) => tr.addEventListener('click', () => show(+tr.dataset.o)));
    if (!n) return;
    $('lp-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-u]'); if (!b) return; S.unitSel = +b.dataset.u; S.step = -1; renderResult(); });
    renderUnit();
    shareLinks();
    $('lp-pdf').addEventListener('click', makePdf);
    $('lp-copy').addEventListener('click', () => { const u = location.href; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => { $('lp-copy').textContent = 'Link copied ✓'; }).catch(() => { prompt('Copy this link', u); }); });
  }

  function summaryText() {
    const r = S.result;
    const lines = [`Load plan: ${composition(r)}${S.pal ? ' (palletised)' : ''}`];
    for (const it of r.items) lines.push(`- ${it.qty} × ${it.name}: ${showLen(it.l)}×${showLen(it.w)}×${showLen(it.h)} ${S.unit}, ${showWt(it.kg)} ${S.wunit}/pc${it.orient === 'fixed' ? ', fixed orientation' : it.upright ? ', this side up' : ''}${it.stackable ? '' : ', non-stackable'}`);
    lines.push('Plan: ' + location.href);
    return lines.join('\n');
  }
  function shareLinks() {
    const txt = 'Hello YAM Logistics, please quote for this shipment.\n' + summaryText();
    $('lp-wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(txt);
    $('lp-mail').href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Load plan – quote request') + '&body=' + encodeURIComponent(txt);
  }

  function renderUnit() {
    const r = S.result, u = r.units[S.unitSel], eq = u.eq;
    const cogWarn = u.cogX < 0.35 || u.cogX > 0.65 || u.cogZ < 0.4 || u.cogZ > 0.6;
    $('lp-stats').innerHTML = `
      <div><div class="lp-k">Packages</div><b>${fmt(u.boxes.length)}</b></div>
      <div><div class="lp-k">Volume used</div><b>${Math.round(u.util * 100)}%</b> ${bar(u.util)}<span class="lp-muted">${fmt(u.vol / 1e6, 2)} of ${fmt(eq.L * eq.W * eq.H / 1e6, 1)} m³</span></div>
      <div><div class="lp-k">Weight</div><b>${Math.round(u.kgUtil * 100)}%</b> ${bar(u.kgUtil, true)}<span class="lp-muted">${showWt(u.kg)} of ${showWt(eq.maxKg)} ${S.wunit}</span></div>
      <div><div class="lp-k">Length used</div><b>${showLen(u.usedL)} ${S.unit}</b><span class="lp-muted">of ${showLen(eq.L)} ${S.unit}</span></div>
      <div><div class="lp-k">Centre of gravity</div><b class="${cogWarn ? 'lp-red' : ''}">${Math.round(u.cogX * 100)}% along</b><span class="lp-muted">${cogWarn ? 'Off-centre: spread heavy items' : 'Well balanced'}</span></div>`;
    $('lp-legend').innerHTML = r.items.map((it, i) => { const c = u.counts[i]; return c ? `<span><span class="lp-dot" style="background:${it.color}"></span>${esc(it.name)} × ${fmt(c)}</span>` : ''; }).join('');
    $('lp-steps').innerHTML = `<div class="lp-k">Loading sequence · start at the front wall, finish at the doors</div>` +
      u.steps.map((st, k) => `<div class="lp-step ${S.step === k ? 'on' : ''}" data-s="${k}">${stepText(st, k)}</div>`).join('') +
      `<div class="lp-step lp-final ${S.step === -1 ? 'on' : ''}" data-s="-1"><div class="lp-steptitle">Finished load</div><div class="lp-muted">Secure the load at the doors with lashing, airbags or a timber frame.</div></div>`;
    $('lp-steps').onclick = (e) => { const d = e.target.closest('[data-s]'); if (!d) return; S.step = +d.dataset.s; stopPlay(); syncStep(); };
    $('lp-prev').onclick = () => { stopPlay(); const m = u.steps.length; S.step = S.step === -1 ? m - 1 : Math.max(0, S.step - 1); syncStep(); };
    $('lp-next').onclick = () => { stopPlay(); const m = u.steps.length; S.step = S.step === -1 ? 0 : S.step + 1 >= m ? -1 : S.step + 1; syncStep(); };
    $('lp-play').onclick = () => { if (playT) return stopPlay(); S.step = 0; syncStep(); $('lp-play').textContent = '■ Stop'; playT = setInterval(() => { const m = u.steps.length; if (S.step === -1) return stopPlay(); S.step = S.step + 1 >= m ? -1 : S.step + 1; syncStep(); }, 1300); };
    $('lp-views').onclick = (e) => { const v = e.target.dataset.v; if (!v) return; document.querySelectorAll('#lp-views button').forEach((b) => b.classList.toggle('on', b === e.target)); view3d.setView(v); };
    ensure3d().then(() => { view3d.build(u, eq); syncStep(); }).catch(() => { $('lp-canvas').innerHTML = '<div class="lp-loading">The 3D view needs WebGL, which this browser has turned off. The loading steps are listed alongside.</div>'; });
  }
  let playT = null;
  function stopPlay() { if (playT) { clearInterval(playT); playT = null; } const b = $('lp-play'); if (b) b.textContent = '▶ Play'; }
  function syncStep() {
    const u = S.result.units[S.unitSel];
    document.querySelectorAll('.lp-step').forEach((d) => d.classList.toggle('on', +d.dataset.s === S.step));
    const on = document.querySelector('.lp-step.on'); if (on && playT) on.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    $('lp-stepl').textContent = S.step === -1 ? `All ${u.steps.length} steps` : `Step ${S.step + 1} of ${u.steps.length}`;
    if (view3d.ready) view3d.show(u, S.step);
  }

  // ---------------- 3D
  const view3d = { ready: false };
  let threeP = null;
  function ensure3d() {
    if (threeP) return threeP;
    threeP = new Promise((res, rej) => {
      if (!window.THREE || !THREE.OrbitControls) return rej(new Error('three missing'));
      try {
        const c = document.createElement('canvas');
        if (!(c.getContext('webgl2') || c.getContext('webgl'))) return rej(new Error('no webgl'));
      } catch (e) { return rej(e); }
      res();
    }).then(init3d);
    return threeP;
  }
  function init3d() {
    const host = $('lp-canvas');
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0xF4F8FC, 1);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 1, 100000);
    scene.add(new THREE.AmbientLight(0xffffff, 0.62));
    const dl = new THREE.DirectionalLight(0xffffff, 0.55); dl.position.set(1, 2, 1.4); scene.add(dl);
    const dl2 = new THREE.DirectionalLight(0xffffff, 0.25); dl2.position.set(-1, 0.6, -1); scene.add(dl2);
    let controls = null, group = null, inst = null, edges = null, eqDims = null, curUnit = null, view = 'iso';

    function attach() {
      const h = $('lp-canvas'); if (!h) return;
      if (renderer.domElement.parentNode !== h) { h.innerHTML = ''; h.appendChild(renderer.domElement); controls = new THREE.OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.addEventListener('change', render); }
      resize();
    }
    function resize() {
      const h = $('lp-canvas'); if (!h) return;
      const w = h.clientWidth || 800, ht = h.clientHeight || 460;
      renderer.setSize(w, ht, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      camera.aspect = w / ht; camera.updateProjectionMatrix(); render();
    }
    window.addEventListener('resize', resize);
    function render() { renderer.render(scene, camera); }
    function loop() { if (controls) controls.update(); requestAnimationFrame(loop); render(); }

    function label(text) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 64;
      const g = c.getContext('2d'); g.fillStyle = '#0B2A4A'; g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 32);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
      return s;
    }

    function build(u, eq) {
      attach();
      if (group) { scene.remove(group); group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (o.material.map && o.material.map.dispose(), o.material.dispose()); }); }
      group = new THREE.Group(); scene.add(group);
      eqDims = eq; curUnit = u;
      const L = eq.L, W = eq.W, H = eq.H;
      group.position.set(-L / 2, -H / 2, -W / 2);
      // floor
      const floor = new THREE.Mesh(new THREE.BoxGeometry(L, 2, W), new THREE.MeshLambertMaterial({ color: 0xC9B79C }));
      floor.position.set(L / 2, -1, W / 2); group.add(floor);
      // back (front wall) and one side wall, translucent
      const wallM = new THREE.MeshLambertMaterial({ color: 0x9FB7CC, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false });
      const fw = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallM); fw.rotation.y = Math.PI / 2; fw.position.set(0, H / 2, W / 2); group.add(fw);
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(L, H), wallM); sw.position.set(L / 2, H / 2, 0); group.add(sw);
      const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L, H, W)), new THREE.LineBasicMaterial({ color: 0x0B2A4A }));
      box.position.set(L / 2, H / 2, W / 2); group.add(box);
      if (eq.group !== 'Pallets & air ULDs') { const d = label('DOORS'); d.position.set(L, H + Math.max(18, H * 0.1), W / 2); d.scale.set(Math.max(90, W * 0.55), Math.max(22, W * 0.14), 1); group.add(d); }
      // boxes: one instanced mesh, in loading order
      const N = u.boxes.length;
      const geo = new THREE.BoxGeometry(1, 1, 1);
      inst = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, N));
      const m = new THREE.Matrix4(), col = new THREE.Color();
      const gap = 0.6; // visual gap between packages (cm)
      const pos = new Float32Array(N * 24 * 3);
      u.boxes.forEach((b, i) => {
        m.makeScale(Math.max(0.5, b.dx - gap), Math.max(0.5, b.dy - gap), Math.max(0.5, b.dz - gap));
        m.setPosition(b.x + b.dx / 2, b.y + b.dy / 2, b.z + b.dz / 2);
        inst.setMatrixAt(i, m); inst.setColorAt(i, col.set(itemColor(b.type)));
        // edges
        const x0 = b.x + gap / 2, x1 = b.x + b.dx - gap / 2, y0 = b.y + gap / 2, y1 = b.y + b.dy - gap / 2, z0 = b.z + gap / 2, z1 = b.z + b.dz - gap / 2;
        const P = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
        const Ed = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
        Ed.forEach((k, j) => { pos.set(P[k], (i * 24 + j) * 3); });
      });
      inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      group.add(inst);
      const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      edges = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: 0x0B2A4A, transparent: true, opacity: 0.35 }));
      group.add(edges);
      setView(view, true);
      if (!view3d.ready) { view3d.ready = true; loop(); }
    }
    function setView(v, keep) {
      view = v || view;
      const e = eqDims; if (!e) return;
      const L = e.L, W = e.W, H = e.H;
      const t = new THREE.Vector3(0, 0, 0);
      const dir = { iso: [0.95, 0.75, 1.15], top: [0.0001, 1, 0.001], side: [0.0001, 0.12, 1], door: [1, 0.1, 0.0001] }[view] || [1, 0.8, 1];
      const v3 = new THREE.Vector3(...dir).normalize();
      // fit the container's bounding box into the view
      const half = new THREE.Vector3(L / 2 + 20, H / 2 + 20, W / 2 + 20);
      const fov = camera.fov * Math.PI / 180, fovH = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect);
      const corners = [];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) corners.push(new THREE.Vector3(sx * half.x, sy * half.y, sz * half.z));
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(up, v3).normalize(); if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
      const upv = new THREE.Vector3().crossVectors(v3, right).normalize();
      let dist = 0;
      for (const c of corners) {
        const depth = c.dot(v3), x = Math.abs(c.dot(right)), y = Math.abs(c.dot(upv));
        dist = Math.max(dist, depth + x / Math.tan(fovH / 2), depth + y / Math.tan(fov / 2));
      }
      camera.position.copy(v3.multiplyScalar(dist * 1.04));
      camera.up.set(0, 1, 0);
      camera.lookAt(t); if (controls) { controls.target.copy(t); controls.update(); }
      render();
    }
    function show(u, step) {
      if (!inst || u !== curUnit) return;
      const N = u.boxes.length;
      let to = N, from = 0;
      if (step >= 0) { const st = u.steps[step]; from = st.from; to = st.to; }
      inst.count = to;
      const col = new THREE.Color(), white = new THREE.Color(0xffffff);
      for (let i = 0; i < to; i++) {
        col.set(itemColor(u.boxes[i].type));
        if (step >= 0 && i < from) col.lerp(white, 0.55);
        inst.setColorAt(i, col);
      }
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      edges.geometry.setDrawRange(0, to * 24);
      render();
    }
    function snapshot(u, step, w, h, v) {
      // render offscreen at a fixed size for the PDF
      const prev = { w: renderer.domElement.width, h: renderer.domElement.height, aspect: camera.aspect, view };
      renderer.setPixelRatio(1); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      setView(v || 'iso'); show(u, step); render();
      const url = renderer.domElement.toDataURL('image/jpeg', 0.86);
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); camera.aspect = prev.aspect; view = prev.view; resize(); setView(view);
      return url;
    }
    Object.assign(view3d, { build, show, setView, snapshot, resize });
  }

  // ---------------- PDF
  async function makePdf() {
    const btn = $('lp-pdf');
    if (!window.jspdf || !view3d.ready) { alertBox('The PDF needs the 3D view to load first.'); return; }
    btn.disabled = true; const old = btn.textContent; btn.textContent = 'Preparing PDF…';
    await new Promise((r) => setTimeout(r, 30));
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const r = S.result;
      const PW = 297, PH = 210, M = 12;
      const head = (title) => {
        doc.setFillColor(10, 108, 194); doc.rect(0, 0, PW, 16, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('YAM Logistics · Container load plan', M, 10.5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(title, PW - M, 10.5, { align: 'right' });
        doc.setTextColor(11, 42, 74);
        doc.setFontSize(7.5); doc.setTextColor(94, 120, 145);
        doc.text('yamlogistics.com · WhatsApp @YAMLOGISTICS · Computer-generated plan for guidance; allow for dunnage, lashing and carrier rules.', M, PH - 6);
        doc.setTextColor(11, 42, 74);
      };
      const clean = (s) => String(s).replace(/[′]/g, "'").replace(/[–]/g, '-').replace(/[×]/g, 'x').replace(/[·]/g, '-').replace(/[^\x20-\x7E]/g, '');
      // page 1: summary
      head(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
      doc.text(clean(composition(r)), M, 30);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.text(clean(`${fmt(r.totalBoxes)} ${S.pal ? 'pallets' : 'packages'} planned - ${fmt(r.units.reduce((a, u) => a + u.vol, 0) / 1e6, 2)} m3 - ${showWt(r.units.reduce((a, u) => a + u.kg, 0))} ${S.wunit}`), M, 37);
      let y = 47;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      const cols = [M, M + 8, M + 80, M + 140, M + 160, M + 185, M + 215];
      ['', 'Package', `L x W x H (${S.unit})`, 'Qty', `Wt/pc (${S.wunit})`, 'Upright', 'Stackable'].forEach((t, i) => doc.text(t, cols[i], y));
      doc.setFont('helvetica', 'normal'); y += 6;
      r.items.forEach((it, i) => {
        const c = new THREE.Color(it.color);
        doc.setFillColor(c.r * 255, c.g * 255, c.b * 255); doc.rect(cols[0], y - 3.2, 4, 4, 'F');
        [clean(it.name).slice(0, 40), `${showLen(it.l)} x ${showLen(it.w)} x ${showLen(it.h)}`, fmt(it.qty), showWt(it.kg), it.orient === 'fixed' ? 'Fixed' : it.upright ? 'Yes' : 'No', it.stackable ? 'Yes' : 'No'].forEach((t, j) => doc.text(clean(t), cols[j + 1], y));
        y += 6; if (y > 120) return;
      });
      y += 4; doc.setFont('helvetica', 'bold'); doc.text('Units', M, y); doc.setFont('helvetica', 'normal'); y += 6;
      r.groups.forEach((g) => {
        const u = g.units[0], a = u.index + 1, b = g.units[g.units.length - 1].index + 1;
        doc.text(clean(`Unit ${a}${b > a ? '-' + b + ' (' + g.units.length + ' identical)' : ''} - ${u.eq.name}: ${fmt(u.boxes.length)} pcs, ${Math.round(u.util * 100)}% volume, ${showWt(u.kg)} ${S.wunit} (${Math.round(u.kgUtil * 100)}% of payload)`), M, y);
        y += 5.5; if (y > PH - 14) { doc.addPage(); head('Units'); y = 26; }
      });
      if (r.tooBig.length) { y += 2; doc.setTextColor(226, 72, 58); r.tooBig.forEach((t) => { doc.text(clean(`Not loaded: ${t.n} x ${t.type.name} - ${t.why}`), M, y); y += 5; }); doc.setTextColor(11, 42, 74); }
      // per unit group
      let shots = 0;
      for (const g of r.groups) {
        const u = g.units[0], a = u.index + 1, b = g.units[g.units.length - 1].index + 1;
        const title = `Unit ${a}${b > a ? '-' + b : ''} - ${u.eq.name}`;
        doc.addPage(); head(clean(title));
        doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
        doc.text(clean(`${title}${g.units.length > 1 ? ' (load ' + g.units.length + ' units the same way)' : ''}: finished load`), M, 26);
        const img = view3d.snapshot(u, -1, 1500, 760, 'iso'); shots++;
        doc.addImage(img, 'JPEG', M, 30, PW - 2 * M, (PW - 2 * M) * 760 / 1500);
        // steps, 2 per page
        const st = u.steps;
        for (let k = 0; k < st.length; k++) {
          if (k % 2 === 0) { doc.addPage(); head(clean(title + ' - loading steps')); }
          const top = k % 2 === 0 ? 22 : 22 + (PH - 30) / 2;
          const iw = 150, ih = iw * 0.5;
          const im = view3d.snapshot(u, k, 1200, 600, 'iso'); shots++;
          doc.addImage(im, 'JPEG', M, top, iw, ih);
          const tx = M + iw + 6; let ty = top + 6;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
          doc.text(clean(`Step ${k + 1}${st[k].walls.length > 1 ? ' - ' + st[k].walls.length + ' identical rows' : ''}`), tx, ty); ty += 6;
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
          doc.text(clean(`${showLen(st[k].x0)}-${showLen(st[k].x1)} ${S.unit} from the front wall`), tx, ty); ty += 6;
          for (const p of st[k].parts) {
            const line = `${fmt(p.n)} x ${p.type.name} ${p.top ? 'on top' : 'from the floor'}, ${orientText(p)} (${showLen(p.o.d)}x${showLen(p.o.w)}x${showLen(p.o.h)} ${S.unit}), ${p.cols} stack${p.cols > 1 ? 's' : ''}`;
            const wrapped = doc.splitTextToSize(clean(line), PW - tx - M);
            doc.text(wrapped, tx, ty); ty += wrapped.length * 4.4 + 1.5;
            if (ty > top + ih) break;
          }
          if (shots % 6 === 0) { btn.textContent = `Preparing PDF… ${shots}`; await new Promise((res) => setTimeout(res, 0)); }
          if (shots > 120) break;
        }
        if (shots > 120) break;
      }
      doc.save(`YAM-load-plan-${r.units.length}-units.pdf`);
    } catch (e) {
      console.error(e); alertBox('Sorry, the PDF could not be created in this browser.');
    } finally {
      btn.disabled = false; btn.textContent = old; syncStep();
    }
  }
  function alertBox(msg) { const d = document.createElement('div'); d.className = 'lp-card lp-warn'; d.textContent = msg; $('lp-out').prepend(d); setTimeout(() => d.remove(), 5000); }

  // ---------------- init
  const fromLink = decodeHash();
  segs(); renderRows(); renderEqInfo();
  if (fromLink) setTimeout(calc, 50);
})();
