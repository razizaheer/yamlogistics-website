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
    truck: 'in', build: false, pb: { t: 'euro', l: 120, w: 80, deck: 15, maxH: 180, maxKg: 1000, tare: 25, stack: false },
    heavy: true, heavyKg: 250, gapD: 0, gapR: 0, palSel: null,
    items: [
      { name: 'Carton A', l: 60, w: 40, h: 40, qty: 200, kg: 12, orient: 'any', stackable: true, maxLayers: '', color: '' },
      { name: 'Carton B', l: 50, w: 50, h: 60, qty: 80, kg: 20, orient: 'upright', stackable: true, maxLayers: '', color: '' }
    ],
    result: null, unitSel: 0, step: -1
  };
  const isDrum = (it) => it && it.shape === 'drum';
  const unitVol = (it) => it.l * it.w * it.h * (isDrum(it) ? Math.PI / 4 : 1);
  const lenF = () => (S.unit === 'in' ? 2.54 : 1);
  const wtF = () => (S.wunit === 'lb' ? 0.45359237 : 1);
  const showLen = (cm, d = 0) => fmt(cm / lenF(), S.unit === 'in' ? 1 : d);
  const showWt = (kg) => fmt(kg / wtF(), 0);
  const EQ = (id) => E.EQUIPMENT.find((e) => e.id === id);
  const CATS = {
    dry: { label: 'Dry containers', sub: '20′ · 40′ · 40′ HC', kind: 'container', cands: () => [['20gp', 1], ['40gp', 1.3], ['40hc', 1.35]] },
    reefer: { label: 'Reefer containers', sub: '20′ RF · 40′ HC RF', kind: 'container', note: 'Reefer heights are kept below the red load line so cold air can circulate.', cands: () => [['20rf', 1], ['40rh', 1.3]] },
    uld: { label: 'Air pallets (ULDs)', sub: 'PMC · PAG', kind: 'air pallet', note: 'Air pallets are planned as a box shape. The aircraft contour is not modelled, so the airline will confirm the build-up.', cands: () => (S.deck === 'md' ? [['pmc-md', 1], ['pag-md', 0.93]] : [['pmc-ld', 1], ['pag-ld', 0.93]]) },
    truck: { label: 'Trucks & trailers', sub: 'India · Europe · USA', kind: 'truck', note: 'Truck bodies vary by builder and the legal payload depends on the vehicle registration and axle rules. Check the actual truck before loading.', cands: () => (S.truck === 'eu' ? [['eu136', 1]] : S.truck === 'us' ? [['us53', 1]] : [['in20', 0.62], ['in24', 0.74], ['in32s', 0.86], ['in32m', 1]]) }
  };
  const KN = { container: ['Container', 'containers'], 'air pallet': ['Air pallet', 'air pallets'], truck: ['Truck', 'trucks'] };
  const PRIO = [['auto', 'Auto'], ['rear', 'First, at the front wall'], ['door', 'Last, at the doors']];
  const PALLETS = [['euro', 'Euro 120 × 80', 120, 80], ['std', 'Standard 120 × 100', 120, 100], ['asia', 'Asia 110 × 110', 110, 110], ['us', 'US 48″ × 40″', 121.9, 101.6], ['custom', 'Other size', 0, 0]];
  const palletOf = (it) => (PALLETS.find((p) => p[2] && Math.abs(p[2] - it.l) < 0.6 && Math.abs(p[3] - it.w) < 0.6) || PALLETS[PALLETS.length - 1])[0];

  // ---------------- share / import
  function encodeState() {
    const b = S.pb;
    const o = { u: S.unit, wu: S.wunit, c: S.cat, p: S.pal ? 1 : 0, d: S.deck, t: S.truck, b: S.build ? [b.t, b.l, b.w, b.deck, b.maxH, b.maxKg, b.tare, b.stack ? 1 : 0] : 0, r: [S.heavy ? 1 : 0, S.heavyKg, S.gapD, S.gapR],
      i: S.items.map((it) => [it.name, it.l, it.w, it.h, it.qty, it.kg, ({ any: 0, upright: 1, fixed: 2 })[it.orient] || 0, it.stackable ? 1 : 0, it.maxLayers || 0, it.color || '', it.onTop === false ? 0 : 1, ({ auto: 0, rear: 1, door: 2 })[it.prio] || 0, isDrum(it) ? 1 : 0]) };
    return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/, '');
  }
  function decodeHash() {
    const h = location.hash.slice(1);
    try {
      if (h.startsWith('p=')) {
        const o = JSON.parse(decodeURIComponent(escape(atob(h.slice(2)))));
        S.unit = o.u || 'cm'; S.wunit = o.wu || 'kg'; S.cat = CATS[o.c] ? o.c : 'dry'; S.pal = !!o.p; S.deck = o.d === 'md' ? 'md' : 'ld';
        S.truck = ['in', 'eu', 'us'].includes(o.t) ? o.t : 'in';
        if (Array.isArray(o.b)) { const b = o.b; S.build = true; S.pb = { t: b[0], l: +b[1], w: +b[2], deck: +b[3], maxH: +b[4], maxKg: +b[5], tare: +b[6], stack: !!b[7] }; }
        if (Array.isArray(o.r)) { S.heavy = !!o.r[0]; S.heavyKg = +o.r[1] || 250; S.gapD = +o.r[2] || 0; S.gapR = +o.r[3] || 0; }
        S.items = (o.i || []).map((r) => ({ name: r[0], l: r[1], w: r[2], h: r[3], qty: r[4], kg: r[5], orient: ['any', 'upright', 'fixed'][r[6]] || 'any', stackable: !!r[7], maxLayers: r[8] || '', color: r[9] || '', onTop: r[10] !== 0, prio: ['auto', 'rear', 'door'][r[11]] || 'auto', shape: r[12] ? 'drum' : 'box' }));
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
      <div class="lp-f"><span>2 · Are your packages on pallets?</span><div class="lp-seg lp-wrap" id="lp-pal"><button data-p="0">No, loose cartons / cases</button><button data-p="1">Yes, already palletised</button><button data-p="2">Build pallets for me</button></div></div>
      <div class="lp-f" id="lp-truckf"><span>Trucks for</span><div class="lp-seg" id="lp-truck"><button data-t="in">India</button><button data-t="eu">Europe</button><button data-t="us">USA</button></div></div>
      <div class="lp-f" id="lp-deckf"><span>Aircraft</span><div class="lp-seg" id="lp-deck"><button data-d="ld">Passenger, lower deck (160 cm)</button><button data-d="md">Freighter, main deck (244 cm)</button></div></div>
      <div class="lp-f"><span>Units</span><div class="lp-seg" id="lp-units"><button data-u="cm">cm</button><button data-u="in">inches</button></div></div>
      <div class="lp-f"><span>Weight</span><div class="lp-seg" id="lp-wunits"><button data-w="kg">kg</button><button data-w="lb">lb</button></div></div>
    </div>
    <div class="lp-pb" id="lp-pb" hidden>
      <div class="lp-row">
        <div class="lp-f"><span>Pallet</span><select id="lp-pbt">${PALLETS.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></div>
        <div class="lp-f"><span>Length (<i class="lp-lu"></i>)</span><input class="lp-in lp-small" id="lp-pbl" inputmode="decimal"></div>
        <div class="lp-f"><span>Width (<i class="lp-lu"></i>)</span><input class="lp-in lp-small" id="lp-pbw" inputmode="decimal"></div>
        <div class="lp-f"><span>Max height incl. pallet (<i class="lp-lu"></i>)</span><input class="lp-in lp-small" id="lp-pbh" inputmode="decimal"></div>
        <div class="lp-f"><span>Max cargo per pallet (<i class="lp-wu"></i>)</span><input class="lp-in lp-small" id="lp-pbk" inputmode="decimal"></div>
        <div class="lp-f"><span>Empty pallet weight (<i class="lp-wu"></i>)</span><input class="lp-in lp-small" id="lp-pbtare" inputmode="decimal"></div>
        <div class="lp-f"><span>Pallet deck height (<i class="lp-lu"></i>)</span><input class="lp-in lp-small" id="lp-pbd" inputmode="decimal"></div>
        <label class="lp-chk"><input type="checkbox" id="lp-pbs"> Pallets can be double-stacked</label>
      </div>
      <p class="lp-muted">We stack your cartons on pallets first, one product per pallet where we can, and combine the part-pallets left over. Then we load the pallets.</p>
    </div>
    <div class="lp-eqinfo" id="lp-eqinfo"></div>
    <div class="lp-q">3 · Your packages <span class="lp-muted">type them, paste from Excel or upload a file. We work out which containers you need.</span></div>
    <div class="lp-tablewrap"><table class="lp-table">
      <thead id="lp-head"></thead>
      <tbody id="lp-rows"></tbody>
    </table></div>
    <div class="lp-row lp-actions">
      <button class="lp-btn lp-ghost" id="lp-add">+ Add package</button>
      <button class="lp-btn lp-ghost" id="lp-adddrum">+ Add drum / roll</button>
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
    <div class="lp-rules" id="lp-rules">
      <div class="lp-q">4 · Loading rules <span class="lp-muted">we always keep heavier cargo off lighter cargo and check every package against the door opening</span></div>
      <div class="lp-row">
        <label class="lp-chk"><input type="checkbox" id="lp-heavy"> Keep heavy pieces upright and on the floor: anything over <input class="lp-in lp-small" id="lp-heavykg" inputmode="decimal"> <i class="lp-wu"></i></label>
        <div class="lp-f"><span>Keep free at the doors (<i class="lp-lu"></i>)</span><input class="lp-in lp-small" id="lp-gapd" inputmode="decimal"></div>
        <div class="lp-f"><span>Keep free under the roof (<i class="lp-lu"></i>)</span><input class="lp-in lp-small" id="lp-gapr" inputmode="decimal"></div>
      </div>
      <p class="lp-muted">Use the <b>Load order</b> column to put an item in first (against the front wall) or last (at the doors, for the first drop or for customs inspection).</p>
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
          <span class="lp-muted" style="flex:1 1 200px">${items.length} package line${items.length === 1 ? '' : 's'} found · ${fmt(items.reduce((a, it) => a + it.qty, 0))} pcs · ${fmt(items.reduce((a, it) => a + unitVol(it) * it.qty, 0) / 1e6, 2)} m³</span>
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
    document.querySelectorAll('#lp-pal button').forEach((b) => b.classList.toggle('on', b.dataset.p === (S.build ? '2' : S.pal ? '1' : '0')));
    document.querySelectorAll('#lp-truck button').forEach((b) => b.classList.toggle('on', b.dataset.t === S.truck));
    $('lp-truckf').hidden = S.cat !== 'truck';
    $('lp-pb').hidden = !S.build;
    renderOpts();
    document.querySelectorAll('#lp-deck button').forEach((b) => b.classList.toggle('on', b.dataset.d === S.deck));
    $('lp-deckf').hidden = S.cat !== 'uld';
    document.querySelectorAll('#lp-units button').forEach((b) => b.classList.toggle('on', b.dataset.u === S.unit));
    document.querySelectorAll('#lp-wunits button').forEach((b) => b.classList.toggle('on', b.dataset.w === S.wunit));
  }
  $('lp-cats').addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; S.cat = b.dataset.cat; segs(); renderEqInfo(); });
  $('lp-truck').addEventListener('click', (e) => { const t = e.target.dataset.t; if (t) { S.truck = t; segs(); renderEqInfo(); } });
  function renderOpts() {
    document.querySelectorAll('.lp-lu').forEach((x) => { x.textContent = S.unit; });
    document.querySelectorAll('.lp-wu').forEach((x) => { x.textContent = S.wunit; });
    const L = (v) => (v ? +(v / lenF()).toFixed(1) : 0), K = (v) => (v ? +(v / wtF()).toFixed(0) : 0), b = S.pb;
    const set = (id, v) => { const el = $(id); if (el && document.activeElement !== el) el.value = v; };
    set('lp-pbt', b.t); set('lp-pbl', L(b.l)); set('lp-pbw', L(b.w)); set('lp-pbh', L(b.maxH)); set('lp-pbk', K(b.maxKg)); set('lp-pbtare', K(b.tare)); set('lp-pbd', L(b.deck));
    $('lp-pbs').checked = b.stack; $('lp-heavy').checked = S.heavy; set('lp-heavykg', K(S.heavyKg)); set('lp-gapd', L(S.gapD)); set('lp-gapr', L(S.gapR));
  }
  root.addEventListener('input', (e) => {
    const id = e.target.id, v = parseFloat(e.target.value), b = S.pb;
    const cm = v > 0 ? v * lenF() : 0, kg = v > 0 ? v * wtF() : 0;
    switch (id) {
      case 'lp-pbt': { const p = PALLETS.find((x) => x[0] === e.target.value); b.t = e.target.value; if (p && p[2]) { b.l = p[2]; b.w = p[3]; } renderOpts(); break; }
      case 'lp-pbl': b.l = cm; b.t = 'custom'; break;
      case 'lp-pbw': b.w = cm; b.t = 'custom'; break;
      case 'lp-pbh': b.maxH = cm; break;
      case 'lp-pbk': b.maxKg = kg; break;
      case 'lp-pbtare': b.tare = kg; break;
      case 'lp-pbd': b.deck = cm; break;
      case 'lp-pbs': b.stack = e.target.checked; break;
      case 'lp-heavy': S.heavy = e.target.checked; break;
      case 'lp-heavykg': S.heavyKg = kg; break;
      case 'lp-gapd': S.gapD = cm; break;
      case 'lp-gapr': S.gapR = cm; break;
      default: return;
    }
    if (id === 'lp-pbl' || id === 'lp-pbw') { const el = $('lp-pbt'); if (el) el.value = 'custom'; }
  });
  root.addEventListener('change', (e) => { if (e.target.type === 'checkbox' && /^lp-(pbs|heavy)$/.test(e.target.id)) e.target.dispatchEvent(new Event('input', { bubbles: true })); });
  $('lp-deck').addEventListener('click', (e) => { const d = e.target.dataset.d; if (d) { S.deck = d; segs(); renderEqInfo(); } });
  $('lp-pal').addEventListener('click', (e) => {
    const p = e.target.dataset.p; if (p == null) return;
    const was = S.pal;
    S.pal = p === '1'; S.build = p === '2';
    if (was !== S.pal) for (const it of S.items) {
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
    $('lp-head').innerHTML = `<tr><th title="Colour in the 3D plan">Colour</th><th>${S.pal ? 'Pallet name' : 'Package name'}</th>${S.pal ? '<th>Pallet size</th>' : ''}<th>${S.items.some(isDrum) ? 'Length / Ø' : 'Length'} (${u})</th><th>Width (${u})</th><th>${S.pal ? 'Height incl. pallet' : 'Height'} (${u})</th><th>Qty</th><th>Weight / pc (${S.wunit})</th><th title="How the package may be turned when loading">Orientation</th><th title="Other packages may be placed on top of this one">${S.pal ? 'Double-stack' : 'Others on top'}</th><th title="This package may be placed on top of other cargo (untick to keep it on the floor)">Can sit on others</th><th title="Max layers of this item, optional">Max layers</th><th title="Put this item in first (against the front wall) or last (at the doors)">Load order</th><th></th></tr>`;
    $('lp-rows').innerHTML = S.items.map((it, i) => `<tr data-i="${i}">
      <td class="lp-c"><input type="color" class="lp-color" data-k="color" value="${it.color || PALETTE[i % PALETTE.length]}" aria-label="Colour"></td>
      <td><div class="lp-nm">${isDrum(it) ? '<span class="lp-drum" title="Drum or roll (round)">◯</span>' : ''}<input class="lp-in lp-name" data-k="name" value="${esc(it.name)}" maxlength="40"></div></td>
      ${S.pal ? `<td><select class="lp-in lp-pt" data-k="pallet" aria-label="Pallet size">${PALLETS.map(([v, t]) => `<option value="${v}"${palletOf(it) === v ? ' selected' : ''}>${t}</option>`).join('')}</select></td>` : ''}
      <td><input class="lp-in" data-k="l" inputmode="decimal" ${isDrum(it) ? 'aria-label="Diameter" placeholder="Ø"' : ''} value="${it.l ? +(it.l / lenF()).toFixed(2) : ''}"></td>
      <td>${isDrum(it) ? `<input class="lp-in lp-same" value="= Ø" disabled aria-label="Width equals the diameter">` : `<input class="lp-in" data-k="w" inputmode="decimal" value="${it.w ? +(it.w / lenF()).toFixed(2) : ''}">`}</td>
      <td><input class="lp-in" data-k="h" inputmode="decimal" value="${it.h ? +(it.h / lenF()).toFixed(2) : ''}"></td>
      <td><input class="lp-in" data-k="qty" inputmode="numeric" value="${it.qty || ''}"></td>
      <td><input class="lp-in" data-k="kg" inputmode="decimal" value="${it.kg ? +(it.kg / wtF()).toFixed(2) : ''}"></td>
      <td><select class="lp-in lp-or" data-k="orient" aria-label="Orientation">${(isDrum(it) ? [['upright', 'Standing only'], ['any', 'Can lie down']] : [['any', 'Any way'], ['upright', 'This side up'], ['fixed', 'Fixed, no turning']]).map(([v, t]) => `<option value="${v}"${(it.orient || 'any') === v ? ' selected' : ''}>${t}</option>`).join('')}</select></td>
      <td class="lp-c"><input type="checkbox" data-k="stackable" ${it.stackable ? 'checked' : ''} aria-label="Others on top"></td>
      <td class="lp-c"><input type="checkbox" data-k="onTop" ${it.onTop === false ? '' : 'checked'} aria-label="Can sit on other cargo"></td>
      <td><input class="lp-in lp-small" data-k="maxLayers" inputmode="numeric" placeholder="any" value="${it.maxLayers || ''}"></td>
      <td><select class="lp-in lp-pr" data-k="prio" aria-label="Load order">${PRIO.map(([v, t]) => `<option value="${v}"${(it.prio || 'auto') === v ? ' selected' : ''}>${t}</option>`).join('')}</select></td>
      <td><button class="lp-x" data-del="${i}" aria-label="Remove">×</button></td></tr>`).join('');
    totals();
  }
  $('lp-rows').addEventListener('input', (e) => {
    const tr = e.target.closest('tr'); if (!tr) return;
    const it = S.items[+tr.dataset.i], k = e.target.dataset.k;
    if (k === 'stackable' || k === 'onTop') it[k] = e.target.checked;
    else if (k === 'pallet') { const p = PALLETS.find((x) => x[0] === e.target.value); if (p && p[2]) { it.l = p[2]; it.w = p[3]; renderRows(); return; } }
    else if (k === 'name' || k === 'orient' || k === 'color' || k === 'prio') it[k] = e.target.value;
    else {
      const v = parseFloat(e.target.value);
      it[k] = !(v > 0) ? 0 : (k === 'qty' || k === 'maxLayers') ? Math.floor(v) : k === 'kg' ? v * wtF() : v * lenF();
      if (isDrum(it) && k === 'l') it.w = it.l;
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
  $('lp-adddrum').addEventListener('click', () => {
    const n = S.items.filter(isDrum).length + 1;
    S.items.push({ name: 'Drum ' + n, shape: 'drum', l: 58, w: 58, h: 88, qty: 1, kg: 0, orient: 'upright', stackable: true, maxLayers: 2, color: '' });
    renderRows();
  });
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
    for (const it of S.items) { const q = it.qty || 0; pcs += q; cbm += unitVol(it) * q / 1e6; kg += (it.kg || 0) * q; }
    $('lp-totals').innerHTML = `<b>${fmt(pcs)}</b> pcs · <b>${fmt(cbm, 2)}</b> m³ · <b>${showWt(kg)}</b> ${S.wunit}`;
  }

  // ---------------- calculate
  $('lp-go').addEventListener('click', calc);
  function calc() {
    const raw = S.items.filter((it) => it.l > 0 && it.w > 0 && it.h > 0 && +it.qty > 0)
      .map((it) => {
        const heavy = S.heavy && S.heavyKg > 0 && (it.kg || 0) >= S.heavyKg;
        if (isDrum(it)) it.w = it.l;
        return { ...it, heavy, upright: it.orient === 'upright' || it.orient === 'fixed' || heavy, onTop: heavy ? false : it.onTop, maxLayers: +it.maxLayers || 0, qty: Math.floor(+it.qty), prio: it.prio || 'auto', color: it.color || PALETTE[S.items.indexOf(it) % PALETTE.length] };
      });
    if (!raw.length) { $('lp-out').innerHTML = '<div class="lp-card lp-warn">Enter at least one package with length, width, height and quantity.</div>'; return; }
    let items = raw, pb = null;
    if (S.build) {
      const b = S.pb;
      if (!(b.l > 0 && b.w > 0 && b.maxH > b.deck && b.maxKg > 0)) { $('lp-out').innerHTML = '<div class="lp-card lp-warn">Enter the pallet size, the maximum height and the maximum weight per pallet.</div>'; return; }
      pb = E.palletise(raw, { l: b.l, w: b.w, deck: b.deck, maxH: b.maxH, maxKg: b.maxKg, tare: b.tare, name: palName() });
      items = pb.pallets.map((p) => {
        const ks = Object.keys(p.contents).map(Number);
        const main = ks.sort((a, c) => p.contents[c] - p.contents[a])[0];
        const pr = new Set(ks.map((k) => raw[k].prio));
        return { name: 'P' + p.n + ' – ' + (p.mixed ? 'Mixed pallet' : p.label), l: p.l, w: p.w, h: p.h, qty: p.qty, kg: p.kg, orient: 'upright', upright: true, stackable: S.pb.stack, onTop: S.pb.stack, maxLayers: S.pb.stack ? 2 : 0, prio: pr.size === 1 ? [...pr][0] : 'auto', color: raw[main].color, pallet: p };
      });
      for (const t of pb.loose) items.push({ ...raw[t.idx], name: raw[t.idx].name + ' (loose, too big for the pallet)' });
    }
    const gap = (eq) => (S.gapD > 0 || S.gapR > 0 ? { ...eq, L: Math.max(10, eq.L - S.gapD), H: Math.max(10, eq.H - S.gapR), full: eq } : eq);
    const cands = CATS[S.cat].cands().map(([id, cost]) => ({ eq: gap(EQ(id)), cost }));
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
    for (const o of opts) { prep(o.res, items); o.res.cargo = raw; o.res.pb = pb; }
    S.options = opts; S.opt = 0;
    show(0);
    try { history.replaceState(null, '', location.pathname + location.search + '#p=' + encodeState()); } catch (e) { /* ignore */ }
    $('lp-out').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function palName() { const b = S.pb, p = PALLETS.find((x) => x[0] === b.t && x[2]); return p ? p[1] + ' pallet' : `Pallet ${showLen(b.l)} × ${showLen(b.w)} ${S.unit}`; }
  function show(i) { S.opt = i; S.result = S.options[i].res; S.unitSel = 0; S.palSel = null; S.step = -1; renderResult(); }
  const curU = () => (S.palSel != null && S.result.pb ? S.result.pb.pallets[S.palSel].unit : S.result.units[S.unitSel]);
  const Fof = (eq) => eq.full || eq;
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
  // plain-language description of one block of a loading step
  function partText(p, perRow) {
    const t = p.type, o = p.o;
    const up = o.h === t.h;
    const pallet = !!t.pallet || S.pal;
    const long = Math.max(t.l, t.w);
    const tall = o.h >= Math.max(t.l, t.w, t.h) - 0.01 && o.h > Math.min(t.l, t.w, t.h) + 0.01;
    if (isDrum(t)) {
      const hw = t.l === t.h ? ['standing upright'] : up ? ['standing upright'] : [o.d === t.h ? 'lying down, along the length' : 'lying down, across', 'wedge them so they cannot roll'];
      const across = Math.max(1, Math.round(p.cols / perRow));
      const grids = [`${across} across`]; if (p.rows > 1) grids.push(`${p.rows} high`); if (p.nd > 1) grids.push(`${p.nd} deep`);
      return { n: p.n, name: t.name, where: p.top ? 'on top of the stacks below' : 'on the floor', hows: hw, how: hw.join(', '), grids, grid: grids.join(' × '), dim: `Ø ${showLen(t.l)} × ${showLen(t.h)} ${S.unit}` };
    }
    const hows = pallet ? [] : [up ? 'standing upright' : tall ? 'standing on its end' : 'turned on its side'];
    if (o.d !== o.w && up) hows.push(o.d === long ? 'long side along the ' + (curU().eq.group === 'Pallets & air ULDs' ? 'pallet' : 'length') : 'long side across');
    const across = Math.max(1, Math.round(p.cols / perRow));
    const grids = [`${across} across`]; if (p.rows > 1) grids.push(`${p.rows} high`); if (p.nd > 1) grids.push(`${p.nd} deep`);
    return { n: p.n, name: t.name, where: p.top ? 'on top of the stacks below' : 'on the floor', hows, how: hows.join(', '), grids, grid: grids.join(' × '), dim: `${showLen(o.d)} × ${showLen(o.w)} × ${showLen(o.h)} ${S.unit}` };
  }
  function stepText(st, k, u) {
    const reps = st.walls.length;
    const parts = st.parts.map((p) => {
      const x = partText(p, reps);
      return `<li><span class="lp-dot" style="background:${itemColor(p.type)}"></span><span><b>${fmt(x.n)} × ${esc(x.name)}</b> ${[x.where, ...x.hows].map((h) => `<span>${h}</span>`).join(', ')}<br><span class="lp-muted">${reps > 1 ? '<span>each row:</span> ' : ''}${x.grids.map((g) => `<span>${g}</span>`).join(' × ')} · ${x.dim}</span></span></li>`;
    }).join('');
    const end = u.eq.group === 'Pallets & air ULDs' ? 'from the far edge' : 'from the front wall';
    return `<div class="lp-steptitle"><span class="lp-tick" aria-hidden="true"></span>Step ${k + 1} of ${u.steps.length}${reps > 1 ? ` · ${reps} identical rows` : ''}</div><div class="lp-muted">${showLen(st.x0)}–${showLen(st.x1)} ${S.unit} ${end} · running total ${fmt(st.cumN)} pcs, ${showWt(st.cumKg)} ${S.wunit}</div><ul>${parts}</ul>`;
  }

  // ---------------- results
  function bar(p, warn) { const c = p > 1 ? '#E2483A' : warn && p > 0.9 ? '#F59E0B' : '#0A6CC2'; return `<span class="lp-bar"><i style="width:${Math.min(100, p * 100).toFixed(1)}%;background:${c}"></i></span>`; }

  function renderResult() {
    const r = S.result;
    const n = r.units.length;
    const kind = CATS[S.cat].kind, kn = KN[kind];
    const totalPcs = r.items.reduce((a, it) => a + it.qty, 0);
    const warn = [];
    for (const t of r.tooBig) warn.push(`<b>${fmt(t.n)} × ${esc(t.type.name)}</b> cannot be loaded: ${t.why}.`);
    for (const t of r.notPlaced) warn.push(`<b>${fmt(t.n)} × ${esc(t.type.name)}</b> were not planned (the planner stops at 200 units). Ask us to plan this load.`);
    const cmp = S.options.length > 1 ? `<div class="lp-cmp"><div class="lp-k">Other ways to ship it · click to view</div><table><tr><th></th><th>${kn[1][0].toUpperCase() + kn[1].slice(1)}</th><th>Avg. fill</th></tr>${S.options.map((o, i) => `<tr class="lp-opt ${i === S.opt ? 'on' : ''}" data-o="${i}"><td>${esc(o.label)}</td><td>${esc(composition(o.res))}</td><td>${o.res.units.length ? Math.round(o.res.units.reduce((a, u) => a + u.util, 0) / o.res.units.length * 100) + '%' : '–'}</td></tr>`).join('')}</table></div>` : '';
    const tabs = r.groups.map((g, gi) => {
      const a = g.units[0].index + 1, b = g.units[g.units.length - 1].index + 1;
      const on = S.palSel == null && g.units.includes(r.units[S.unitSel]);
      return `<button class="lp-tab ${on ? 'on' : ''}" data-u="${g.units[0].index}">${kn[0]} ${a}${b > a ? '–' + b : ''} <small>${esc(g.units[0].eq.name.replace(/ \(.*\)$/, ''))}${g.units.length > 1 ? ` · ×${g.units.length} identical` : ''}</small></button>`;
    }).join('') + (r.pb ? r.pb.pallets.map((p, i) => `<button class="lp-tab lp-ptab ${S.palSel === i ? 'on' : ''}" data-pal="${i}">Pallet P${p.n} <small>×${p.qty} · ${showLen(p.h)} ${S.unit} · ${showWt(p.kg)} ${S.wunit}</small></button>`).join('') : '');
    const pbCard = r.pb ? `<div class="lp-pbsum"><div class="lp-k">Pallets we build first · ${fmt(r.pb.pallets.reduce((a, p) => a + p.qty, 0))} × ${esc(palName())}</div><table class="lp-ut"><tr><th>Pallet</th><th>Qty</th><th>On each pallet</th><th>Height</th><th>Weight each</th></tr>${r.pb.pallets.map((p, i) => `<tr class="lp-popen" data-pal="${i}"><td><b>P${p.n}</b></td><td>${fmt(p.qty)}</td><td>${Object.entries(p.contents).map(([k, n]) => `<span class="lp-dot" style="background:${r.cargo[k].color}"></span>${fmt(n)} × ${esc(r.cargo[k].name)}`).join('<br>')}</td><td>${showLen(p.h)} ${S.unit}</td><td>${showWt(p.kg)} ${S.wunit}</td></tr>`).join('')}</table>${r.pb.loose.length ? `<div class="lp-muted">Loaded loose (too big for the pallet): ${r.pb.loose.map((t) => esc(t.name)).join(', ')}</div>` : ''}</div>` : '';
    const heavyN = r.cargo ? r.cargo.filter((it) => it.heavy).map((it) => esc(it.name)) : [];
    $('lp-out').innerHTML = `
<div class="lp-card lp-sum">
  <div class="lp-sumhead">
    <div><div class="lp-k">You need</div><div class="lp-big">${n ? esc(composition(r)) : 'Nothing could be loaded'}</div>
    <div class="lp-muted">${fmt(r.totalBoxes)} of ${fmt(totalPcs)} packages planned · ${fmt(r.units.reduce((a, u) => a + u.vol, 0) / 1e6, 2)} m³ · ${showWt(r.units.reduce((a, u) => a + u.kg, 0))} ${S.wunit}</div></div>
    ${cmp}
  </div>
  ${warn.length ? `<div class="lp-warn">${warn.join('<br>')}</div>` : ''}
  ${heavyN.length ? `<div class="lp-muted lp-rulenote">Kept upright and on the floor as heavy pieces: ${heavyN.join(', ')}.</div>` : ''}
  ${pbCard}
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
    <button class="lp-btn" id="lp-pdf">↓ Summary PDF</button>
    <button class="lp-btn" id="lp-pdf2">↓ Step-by-step PDF</button>
    <a class="lp-btn lp-wa" id="lp-wa" target="_blank" rel="noopener">Get a quote for this load on WhatsApp</a>
    <a class="lp-btn lp-ghost" id="lp-mail">Email this plan</a>
    <button class="lp-btn lp-ghost" id="lp-copy">Copy share link</button>
  </div>
  <p class="lp-fine">Plans are computer-generated estimates for planning. Real loads need allowances for pallets, dunnage, lashing and how the cargo is packed. Always check weight limits for the route, axle loads and the carrier’s rules. Our team can check any plan before you book.</p>
</div>` : ''}`;
    document.querySelectorAll('.lp-opt').forEach((tr) => tr.addEventListener('click', () => show(+tr.dataset.o)));
    if (!n) return;
    $('lp-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-u],[data-pal]'); if (!b) return;
      if (b.dataset.pal != null) { S.palSel = +b.dataset.pal; } else { S.unitSel = +b.dataset.u; S.palSel = null; }
      S.step = -1; renderResult();
    });
    document.querySelectorAll('.lp-popen').forEach((tr) => tr.addEventListener('click', () => { S.palSel = +tr.dataset.pal; S.step = -1; renderResult(); $('lp-tabs').scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
    renderUnit();
    shareLinks();
    $('lp-pdf').addEventListener('click', () => makePdf('summary'));
    $('lp-pdf2').addEventListener('click', () => makePdf('steps'));
    $('lp-copy').addEventListener('click', () => { const u = location.href; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => { $('lp-copy').textContent = 'Link copied ✓'; }).catch(() => { prompt('Copy this link', u); }); });
  }

  function summaryText() {
    const r = S.result;
    const lines = [`Load plan: ${composition(r)}${S.pal ? ' (palletised)' : ''}${r.pb ? ` (${r.pb.pallets.reduce((a, p) => a + p.qty, 0)} pallets built, ${palName()})` : ''}`];
    for (const it of (r.cargo || r.items)) lines.push(`- ${it.qty} × ${it.name}: ${showLen(it.l)}×${showLen(it.w)}×${showLen(it.h)} ${S.unit}, ${showWt(it.kg)} ${S.wunit}/pc${it.orient === 'fixed' ? ', fixed orientation' : it.upright ? ', this side up' : ''}${it.stackable ? '' : ', non-stackable'}`);
    lines.push('Plan: ' + location.href);
    return lines.join('\n');
  }
  function shareLinks() {
    const txt = 'Hello YAM Logistics, please quote for this shipment.\n' + summaryText();
    $('lp-wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(txt);
    $('lp-mail').href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Load plan – quote request') + '&body=' + encodeURIComponent(txt);
  }

  // utilisation numbers for one unit: [label, used, max, unit text, formatter]
  function utilRows(u) {
    const F = Fof(u.eq), m2 = (v) => fmt(v / 1e4, 1), m3 = (v) => fmt(v / 1e6, 2), L = (v) => showLen(v), W = (v) => showWt(v);
    return [
      ['Weight', u.kg, u.eq.maxKg, S.wunit, W],
      ['Volume', u.vol, F.L * F.W * F.H, 'm³', m3],
      ['Length', u.usedL, F.L, S.unit, L],
      ['Width', u.usedW, F.W, S.unit, L],
      ['Height', u.usedH, F.H, S.unit, L],
      ['Floor area', u.floor, F.L * F.W, 'm²', m2]
    ];
  }
  function balance(u) {
    const off = u.cogX < 0.35 || u.cogX > 0.65 || u.cogZ < 0.4 || u.cogZ > 0.6;
    const side = u.cogZ < 0.4 || u.cogZ > 0.6;
    return { off, text: !off ? 'Well balanced' : side ? 'Weight is to one side: spread heavy items across the width' : u.cogX < 0.35 ? 'Front-heavy: move some heavy items towards the doors' : 'Door-heavy: move heavy items towards the front wall' };
  }
  function renderUnit() {
    const r = S.result, u = curU(), eq = u.eq, isPal = S.palSel != null;
    const bal = balance(u), maxBin = Math.max(1, ...u.bins);
    const rows = utilRows(u).map(([k, a, m, un, f]) => `<tr><td>${k}</td><td><b>${f(a)}</b></td><td>${f(Math.max(0, m - a))}</td><td>${f(m)} ${un}</td><td>${bar(a / m, k === 'Weight')} ${Math.round(a / m * 100)}%</td></tr>`).join('');
    $('lp-stats').innerHTML = `
      <table class="lp-ut"><tr><th></th><th>Used</th><th>Free</th><th>Max</th><th>Fill</th></tr>${rows}</table>
      <div class="lp-wd">
        <div class="lp-k">Weight along the ${isPal ? 'pallet' : 'length'}</div>
        <div class="lp-wbars">${u.bins.map((v) => `<i style="height:${Math.max(2, v / maxBin * 100).toFixed(0)}%" title="${showWt(v)} ${S.wunit}"></i>`).join('')}<b class="lp-cog" style="left:${(u.cogX * 100).toFixed(1)}%"></b></div>
        <div class="lp-wends"><span>${isPal ? 'Far edge' : 'Front wall'}</span><span>${isPal ? 'Near edge' : 'Doors'}</span></div>
        <div><b class="${bal.off ? 'lp-red' : ''}">Centre of gravity ${Math.round(u.cogX * 100)}% along, ${Math.round(u.cogZ * 100)}% across</b><br><span class="lp-muted">${bal.text}. Front half ${showWt(u.frontKg)} ${S.wunit}, rear half ${showWt(u.kg - u.frontKg)} ${S.wunit}.</span></div>
      </div>`;
    const list = isPal ? r.cargo : r.items;
    $('lp-legend').innerHTML = list.map((it, i) => { const c = u.counts[i]; return c ? `<span><span class="lp-dot" style="background:${it.color}"></span>${esc(it.name)} × ${fmt(c)}</span>` : ''; }).join('');
    const intro = isPal ? `Build pallet P${r.pb.pallets[S.palSel].n} (make ${r.pb.pallets[S.palSel].qty}) · start at the far edge` : 'Loading sequence · start at the front wall, finish at the doors';
    $('lp-steps').innerHTML = `<div class="lp-k">${intro}</div>` +
      u.steps.map((st, k) => `<div class="lp-step ${S.step === k ? 'on' : ''}" data-s="${k}">${stepText(st, k, u)}</div>`).join('') +
      `<div class="lp-step lp-final ${S.step === -1 ? 'on' : ''}" data-s="-1"><div class="lp-steptitle">Finished ${isPal ? 'pallet' : 'load'}</div><div class="lp-muted">${isPal ? 'Stretch-wrap the pallet, strap it if heavy and label it on two sides.' : 'Secure the load at the doors with lashing, airbags or a timber frame.'}</div></div>`;
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
    const u = curU();
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
    let cyl = null;
    let controls = null, group = null, inst = null, edges = null, eqDims = null, curUnit = null, view = 'iso', doorLbl = null, dims = null;
    const dimOff = (F) => Math.max(14, Math.min(F.W, F.H) * 0.14);

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
      eqDims = eq.full || eq; curUnit = u;
      const L = eqDims.L, W = eqDims.W, H = eqDims.H;
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
      doorLbl = null;
      // dimension lines on the 3D model: length, width and height with their measurements
      dims = new THREE.Group(); group.add(dims);
      {
        const off = dimOff(eqDims), tk = off * 0.45;
        const lm = new THREE.LineBasicMaterial({ color: 0x0B2A4A });
        const seg = (a, b) => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]); dims.add(new THREE.Line(g, lm)); };
        const txt = (t, p) => { const sp = label(t); const sw = Math.max(70, Math.min(W, H) * 0.62); sp.scale.set(sw, sw / 4, 1); sp.position.set(...p); dims.add(sp); };
        const lt = (v) => `${showLen(v)} ${S.unit}`;
        seg([0, 0, W + off], [L, 0, W + off]); seg([0, 0, W + off - tk], [0, 0, W + off + tk]); seg([L, 0, W + off - tk], [L, 0, W + off + tk]);
        txt(lt(L), [L / 2, 0, W + off * 2.6]);
        seg([L + off, 0, 0], [L + off, 0, W]); seg([L + off - tk, 0, 0], [L + off + tk, 0, 0]); seg([L + off - tk, 0, W], [L + off + tk, 0, W]);
        txt(lt(W), [L + off * 3.2, 0, W / 2 - off * 0.6]);
        seg([0, 0, W + off], [0, H, W + off]); seg([0, H, W + off - tk], [0, H, W + off + tk]);
        txt(lt(H), [-off * 1.2, H / 2, W + off * 2.4]);
      }
      if (eq.group !== 'Pallets & air ULDs') { const d = label('DOORS'); d.position.set(L, H + Math.max(18, H * 0.1), W / 2); d.scale.set(Math.max(90, W * 0.55), Math.max(22, W * 0.14), 1); group.add(d); doorLbl = d; }
      else if (eq.id === 'build') { // pallet deck under the cargo
        const deck = new THREE.Mesh(new THREE.BoxGeometry(L, 12, W), new THREE.MeshLambertMaterial({ color: 0xB08A5A })); deck.position.set(L / 2, -7, W / 2); group.add(deck);
      }
      // boxes: one instanced mesh, in loading order
      const N = u.boxes.length;
      const geo = new THREE.BoxGeometry(1, 1, 1);
      inst = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, N));
      // drums and rolls: a second instanced mesh of cylinders, same index as the box list (unused slots scaled to zero)
      const anyDrum = u.boxes.some((b) => isDrum(b.type));
      cyl = anyDrum ? new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 28), new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, N)) : null;
      const zero = new THREE.Matrix4().makeScale(0, 0, 0), q = new THREE.Quaternion(), qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2), qz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2), one = new THREE.Quaternion();
      const m = new THREE.Matrix4(), col = new THREE.Color();
      const gap = 0.6; // visual gap between packages (cm)
      const pos = new Float32Array(N * 24 * 3);
      u.boxes.forEach((b, i) => {
        col.set(itemColor(b.type));
        if (isDrum(b.type)) {
          const t = b.type, c = new THREE.Vector3(b.x + b.dx / 2, b.y + b.dy / 2, b.z + b.dz / 2);
          // the cylinder's axis runs along the side that equals the drum's height
          const ax = t.l === t.h || Math.abs(b.dy - t.h) < 0.01 ? 'y' : Math.abs(b.dx - t.h) < 0.01 ? 'x' : 'z';
          const len = ax === 'y' ? b.dy : ax === 'x' ? b.dx : b.dz, dia = ax === 'y' ? Math.min(b.dx, b.dz) : Math.min(b.dy, ax === 'x' ? b.dz : b.dx);
          m.compose(c, ax === 'y' ? one : ax === 'x' ? qx : qz, new THREE.Vector3(Math.max(0.5, dia - gap), Math.max(0.5, len - gap), Math.max(0.5, dia - gap)));
          cyl.setMatrixAt(i, m); cyl.setColorAt(i, col); inst.setMatrixAt(i, zero); inst.setColorAt(i, col);
          for (let j = 0; j < 24; j++) pos.set([c.x, c.y, c.z], (i * 24 + j) * 3);
          return;
        }
        if (cyl) { cyl.setMatrixAt(i, zero); cyl.setColorAt(i, col); }
        m.makeScale(Math.max(0.5, b.dx - gap), Math.max(0.5, b.dy - gap), Math.max(0.5, b.dz - gap));
        m.setPosition(b.x + b.dx / 2, b.y + b.dy / 2, b.z + b.dz / 2);
        inst.setMatrixAt(i, m); inst.setColorAt(i, col);
        // edges
        const x0 = b.x + gap / 2, x1 = b.x + b.dx - gap / 2, y0 = b.y + gap / 2, y1 = b.y + b.dy - gap / 2, z0 = b.z + gap / 2, z1 = b.z + b.dz - gap / 2;
        const P = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
        const Ed = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
        Ed.forEach((k, j) => { pos.set(P[k], (i * 24 + j) * 3); });
      });
      inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      group.add(inst);
      if (cyl) { cyl.instanceMatrix.needsUpdate = true; if (cyl.instanceColor) cyl.instanceColor.needsUpdate = true; group.add(cyl); }
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
      inst.count = to; if (cyl) cyl.count = to;
      const col = new THREE.Color(), white = new THREE.Color(0xffffff);
      for (let i = 0; i < to; i++) {
        col.set(itemColor(u.boxes[i].type));
        if (step >= 0 && i < from) col.lerp(white, 0.55);
        inst.setColorAt(i, col); if (cyl) cyl.setColorAt(i, col);
      }
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      if (cyl && cyl.instanceColor) cyl.instanceColor.needsUpdate = true;
      edges.geometry.setDrawRange(0, to * 24);
      render();
    }
    function snapshot(u, step, w, h, v) {
      // render offscreen at a fixed size for the PDF
      if (u !== curUnit) build(u, u.eq);
      // isometric-style orthographic camera, framed tightly around the container (and the DOORS label)
      const F = eqDims, L = F.L, W = F.W, H = F.H;
      const dir = new THREE.Vector3(0.95, 0.72, 1.15).normalize(), up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(up, dir).normalize(), upv = new THREE.Vector3().crossVectors(dir, right).normalize();
      const pts = [];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push(new THREE.Vector3(sx * L / 2, sy * H / 2, sz * W / 2));
      if (doorLbl) pts.push(new THREE.Vector3(L / 2, H / 2 + Math.max(18, H * 0.1) + Math.max(22, W * 0.14) / 2, 0));
      { const o = dimOff(F) * 2.6; for (const q of [[L / 2 + o, -H / 2, -W / 2], [L / 2 + o, -H / 2, W / 2], [-L / 2, -H / 2, W / 2 + o], [L / 2, -H / 2, W / 2 + o], [-L / 2 - o, H / 2, W / 2 + o], [-L / 2, H / 2 + o, W / 2]]) pts.push(new THREE.Vector3(...q)); }
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const q of pts) { const a = q.dot(right), b = q.dot(upv); x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); }
      const pad = 0.02 * Math.max(x1 - x0, y1 - y0);
      let hw = (x1 - x0) / 2 + pad, hh = (y1 - y0) / 2 + pad;
      const asp = w / h; if (hw / hh > asp) hh = hw / asp; else hw = hh * asp;
      const cxm = (x0 + x1) / 2, cym = (y0 + y1) / 2;
      const cam = new THREE.OrthographicCamera(-hw, hw, hh, -hh, 1, 100000);
      const ctr = right.clone().multiplyScalar(cxm).add(upv.clone().multiplyScalar(cym));
      cam.position.copy(ctr.clone().add(dir.clone().multiplyScalar(20000))); cam.up.copy(upv); cam.lookAt(ctr); cam.updateProjectionMatrix();
      const pr = renderer.getPixelRatio();
      renderer.setPixelRatio(1); renderer.setSize(w, h, false);
      show(u, step);
      if (dims) dims.visible = false;
      renderer.render(scene, cam);
      if (dims) dims.visible = true;
      const url = renderer.domElement.toDataURL('image/jpeg', 0.86);
      // where a point of the container (local cm) lands on the picture, 0..1 across and down
      view3d.proj = { L, W, H, off: dimOff(F), at: (x, y, z) => { const q = new THREE.Vector3(x - L / 2, y - H / 2, z - W / 2); return [(q.dot(right) - cxm + hw) / (2 * hw), (hh - (q.dot(upv) - cym)) / (2 * hh)]; } };
      renderer.setPixelRatio(pr); resize(); setView(view);
      return url;
    }
    // straight-on views with a known scale, so the PDF can draw dimension lines over them
    function snapOrtho(u, w, h, v) {
      if (u !== curUnit) build(u, u.eq);
      const F = eqDims, L = F.L, W = F.W, H = F.H;
      const ext = { top: [L, W], side: [L, H], door: [W, H] }[v];
      let hw = ext[0] / 2 + ext[0] * 0.05 + 30, hh = ext[1] / 2 + ext[1] * 0.12 + 30;
      const asp = w / h;
      if (hw / hh > asp) hh = hw / asp; else hw = hh * asp;
      const cam = new THREE.OrthographicCamera(-hw, hw, hh, -hh, 1, 100000);
      const D = 20000;
      if (v === 'top') { cam.position.set(0, D, 0); cam.up.set(0, 0, -1); }
      else if (v === 'side') { cam.position.set(0, 0, D); cam.up.set(0, 1, 0); }
      else { cam.position.set(D, 0, 0); cam.up.set(0, 1, 0); }
      cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
      const pr = renderer.getPixelRatio();
      renderer.setPixelRatio(1); renderer.setSize(w, h, false);
      show(u, -1);
      if (doorLbl) doorLbl.visible = false;
      if (dims) dims.visible = false;
      renderer.render(scene, cam);
      if (dims) dims.visible = true;
      const url = renderer.domElement.toDataURL('image/jpeg', 0.88);
      if (doorLbl) doorLbl.visible = true;
      renderer.setPixelRatio(pr); resize(); setView(view);
      return { url, hw, hh, L, W, H };
    }
    Object.assign(view3d, { build, show, setView, snapshot, snapOrtho, resize, cur: () => curUnit });
  }

  // ---------------- PDF
  // mode 'summary': overview + one page per unit (3D, 3 measured views, utilisation, weight spread) + stuffing record
  // mode 'steps': the same, plus every loading step with a picture, a tick box and running totals
  async function makePdf(mode) {
    const btn = $(mode === 'steps' ? 'lp-pdf2' : 'lp-pdf');
    if (!window.jspdf || !view3d.ready) { alertBox('The PDF needs the 3D view to load first.'); return; }
    const btns = [$('lp-pdf'), $('lp-pdf2')];
    btns.forEach((b) => { b.disabled = true; });
    const old = btn.textContent; btn.textContent = 'Preparing PDF…';
    await new Promise((res) => setTimeout(res, 30));
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const r = S.result, cargo = r.cargo || r.items;
      const PW = 297, PH = 210, M = 10, TOP = 28, BOT = PH - 15 - 6;
      const kn = KN[CATS[S.cat].kind];
      const now = new Date();
      const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const ref = 'LP-' + now.toISOString().slice(2, 16).replace(/[-T:]/g, '');
      const docTitle = mode === 'steps' ? 'Step-by-step loading plan' : 'Load plan summary';
      if (window.YAMBrand) await YAMBrand.ready();
      const clean = (x) => String(x).replace(/[′’]/g, "'").replace(/[″]/g, '"').replace(/[–—]/g, '-').replace(/[×]/g, 'x').replace(/[·]/g, '-').replace(/m³/g, 'm3').replace(/m²/g, 'm2').replace(/[^\x20-\x7E]/g, '');
      const head = (sub) => {
        if (window.YAMBrand) { YAMBrand.header(doc, docTitle, clean(sub)); YAMBrand.footer(doc, clean(`Plan ${ref}, ${date}. Computer-generated plan for guidance: allow for dunnage, lashing and the carrier's rules. Check weights and the actual equipment before loading.`)); return; }
        doc.setFillColor(10, 108, 194); doc.rect(0, 0, PW, 16, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('YAM Logistics - ' + docTitle, M, 10.5); doc.setTextColor(11, 42, 74);
      };
      const ink = (c) => { const k = new THREE.Color(c); return [Math.round(k.r * 255), Math.round(k.g * 255), Math.round(k.b * 255)]; };
      const T = (txt, x, y, o = {}) => {
        doc.setFont('helvetica', o.b ? 'bold' : 'normal'); doc.setFontSize(o.s || 9);
        const c = o.c || [11, 42, 74]; doc.setTextColor(c[0], c[1], c[2]);
        doc.text(Array.isArray(txt) ? txt.map(clean) : clean(txt), x, y, o.a ? { align: o.a, angle: o.angle } : o.angle ? { angle: o.angle } : undefined);
      };
      const muted = [94, 120, 145], blue = [10, 108, 194], red = [226, 72, 58];
      const box = (x, y, w, h, fill) => { if (fill) { doc.setFillColor(...fill); doc.rect(x, y, w, h, 'F'); } };
      const tick = (x, y, sz = 3.6) => { doc.setDrawColor(11, 42, 74); doc.setLineWidth(0.3); doc.rect(x, y - sz + 0.6, sz, sz); };
      const shot = async (n) => { if (n % 4 === 0) { btn.textContent = `Preparing PDF… ${n}`; await new Promise((res) => setTimeout(res, 0)); } };
      const unitTitle = (g) => { const a = g.units[0].index + 1, b = g.units[g.units.length - 1].index + 1; return `${kn[0]} ${a}${b > a ? '-' + b : ''} - ${g.units[0].eq.name}`; };
      const rules = (it) => [isDrum(it) ? (it.upright ? 'Drum, standing' : 'Roll, may lie down') : '', isDrum(it) ? '' : it.orient === 'fixed' ? 'Fixed' : it.upright ? 'Upright' : '', it.stackable ? '' : 'No stack on top', it.onTop === false ? 'Floor only' : '', it.prio === 'rear' ? 'Load first' : it.prio === 'door' ? 'Load last' : '', it.heavy ? 'Heavy' : ''].filter(Boolean).join(', ') || '-';

      // ---- page 1: overview
      head(date);
      T(composition(r), M, TOP + 6, { s: 20, b: true });
      const totKg = r.units.reduce((a, u) => a + u.kg, 0), totVol = r.units.reduce((a, u) => a + u.vol, 0);
      const pcs = cargo.reduce((a, it) => a + it.qty, 0);
      T(`Plan ${ref}  |  ${date}  |  ${S.cat === 'truck' ? 'Road' : S.cat === 'uld' ? 'Air' : 'Sea'} shipment${S.build ? ', palletised by this plan' : S.pal ? ', palletised cargo' : ''}`, M, TOP + 12, { c: muted });
      const kp = [[`${r.units.length}`, kn[1]], [fmt(pcs), S.pal ? 'pallets' : 'packages'], [fmt(totVol / 1e6, 2), 'm3 of cargo'], [showWt(totKg), S.wunit + ' total'], [r.units.length ? Math.round(r.units.reduce((a, u) => a + u.util, 0) / r.units.length * 100) + '%' : '-', 'average volume fill']];
      if (r.pb) kp.splice(2, 0, [fmt(r.pb.pallets.reduce((a, p) => a + p.qty, 0)), 'pallets built']);
      const kw = (PW - 2 * M - (kp.length - 1) * 3) / kp.length;
      kp.forEach(([v, l], i) => { const x = M + i * (kw + 3); box(x, TOP + 16, kw, 17, [234, 243, 252]); box(x, TOP + 16, 1.2, 17, blue); T(v, x + 5, TOP + 25.5, { s: 15, b: true }); T(l, x + 5, TOP + 30.5, { s: 8, c: muted }); });
      let y = TOP + 41;
      const cx = [M, M + 6, M + 78, M + 128, M + 143, M + 166, M + 190, M + 210];
      const hdr = () => { box(M, y - 4.2, PW - 2 * M, 6, [11, 42, 74]); ['', 'Cargo', `L x W x H (${S.unit})`, 'Qty', `Wt/pc (${S.wunit})`, `Total (${S.wunit})`, 'm3', 'Handling'].forEach((t, i) => T(t, cx[i] + 1, y, { s: 8, b: true, c: [255, 255, 255] })); y += 6.5; };
      hdr();
      cargo.forEach((it, i) => {
        if (y > BOT - 6) { doc.addPage(); head('Cargo list'); y = TOP + 4; hdr(); }
        if (i % 2) box(M, y - 4.2, PW - 2 * M, 6, [246, 249, 252]);
        doc.setFillColor(...ink(it.color)); doc.rect(cx[0] + 1, y - 3.1, 3.6, 3.6, 'F');
        [clean(it.name).slice(0, 44), isDrum(it) ? `dia ${showLen(it.l)} x ${showLen(it.h)}` : `${showLen(it.l)} x ${showLen(it.w)} x ${showLen(it.h)}`, fmt(it.qty), showWt(it.kg), showWt(it.kg * it.qty), fmt(unitVol(it) * it.qty / 1e6, 2), rules(it)].forEach((t, j) => T(t, cx[j + 1] + 1, y, { s: 8.5 }));
        y += 6;
      });
      y += 4;
      if (r.pb) {
        if (y > BOT - 30) { doc.addPage(); head('Pallets'); y = TOP + 4; }
        T(`Pallets built first: ${r.pb.pallets.reduce((a, p) => a + p.qty, 0)} x ${palName()} (max ${showLen(S.pb.maxH)} ${S.unit} high, ${showWt(S.pb.maxKg)} ${S.wunit} cargo each)`, M, y, { b: true, s: 10 }); y += 6;
        r.pb.pallets.forEach((p) => {
          if (y > BOT - 6) { doc.addPage(); head('Pallets'); y = TOP + 4; }
          T(`P${p.n}  x${p.qty}   ${showLen(p.l)} x ${showLen(p.w)} x ${showLen(p.h)} ${S.unit}, ${showWt(p.kg)} ${S.wunit} each:  ` + Object.entries(p.contents).map(([k, n]) => `${n} x ${cargo[k].name}`).join(' + '), M + 2, y, { s: 8.5 }); y += 5;
        });
        y += 3;
      }
      if (y > BOT - 28) { doc.addPage(); head('Units'); y = TOP + 4; }
      const ux = [M, M + 70, M + 120, M + 150, M + 180, M + 208, M + 236];
      box(M, y - 4.2, PW - 2 * M, 6, [11, 42, 74]);
      [kn[0], 'Equipment', 'Packages', 'Weight', 'Volume', 'Length used', 'Balance'].forEach((t, i) => T(t, ux[i] + 1, y, { s: 8, b: true, c: [255, 255, 255] })); y += 6.5;
      r.groups.forEach((g) => {
        if (y > BOT - 6) { doc.addPage(); head('Units'); y = TOP + 4; hdr(); }
        const u = g.units[0], a = u.index + 1, b = g.units[g.units.length - 1].index + 1, bal = balance(u);
        [`${a}${b > a ? '-' + b + ' (' + g.units.length + ' alike)' : ''}`, u.eq.name.replace(/ \(.*\)$/, ''), fmt(u.boxes.length), `${showWt(u.kg)} (${Math.round(u.kgUtil * 100)}%)`, `${fmt(u.vol / 1e6, 1)} m3 (${Math.round(u.util * 100)}%)`, `${showLen(u.usedL)} of ${showLen(Fof(u.eq).L)}`, bal.off ? 'Check' : 'OK'].forEach((t, j) => T(t, ux[j] + 1, y, { s: 8.5, c: j === 6 && bal.off ? red : undefined }));
        y += 6;
      });
      if (r.tooBig.length || r.notPlaced.length) { y += 2; [...r.tooBig, ...r.notPlaced].forEach((t) => { T(`Not loaded: ${t.n} x ${t.type.name} - ${t.why}`, M, y, { c: red, s: 9 }); y += 5; }); }
      if (S.gapD || S.gapR) { T(`Space kept free: ${showLen(S.gapD)} ${S.unit} at the doors, ${showLen(S.gapR)} ${S.unit} under the roof.`, M, y + 2, { c: muted, s: 8.5 }); y += 6; }
      if (window.YAMBrand && y < BOT - 34) YAMBrand.promo(doc, M, BOT - 32, PW - 2 * M, 'Ready to ship this load? YAM Logistics can handle the whole move.');

      // ---- drawing helpers for measured views
      const dimLine = (x1, y1, x2, y2, label, o = {}) => {
        doc.setDrawColor(...(o.c || [11, 42, 74])); doc.setLineWidth(0.25);
        doc.line(x1, y1, x2, y2);
        const vert = Math.abs(x2 - x1) < 0.01, t = 1.2;
        if (vert) { doc.line(x1 - t, y1, x1 + t, y1); doc.line(x2 - t, y2, x2 + t, y2); T(label, x1 - 1.4, (y1 + y2) / 2, { s: 7, b: true, a: 'center', angle: 90, c: o.c }); }
        else { doc.line(x1, y1 - t, x1, y1 + t); doc.line(x2, y2 - t, x2, y2 + t); T(label, (x1 + x2) / 2, y1 - 1.2, { s: 7, b: true, a: 'center', c: o.c }); }
      };
      // measurements drawn straight onto a 3D picture (vector lines, so they stay sharp)
      const isoDims = (u, ix, iy, iw, ih, small) => {
        const pj = view3d.proj; if (!pj) return;
        const { L, W, H, off } = pj, tk = off * 0.45;
        const P = (x, y, z) => { const [a, b] = pj.at(x, y, z); return [ix + a * iw, iy + b * ih]; };
        const fs = small ? 6.2 : 8;
        const seg = (a, b, c) => { const p = P(...a), q = P(...b); doc.setDrawColor(...c); doc.setLineWidth(small ? 0.2 : 0.3); doc.line(p[0], p[1], q[0], q[1]); };
        // a = start, b = end, n1 = tick direction, out = which way the label sits (3D, cm)
        const dim = (a, b, n1, out, lab, c = [11, 42, 74]) => {
          seg(a, b, c);
          [a, b].forEach((e) => seg(e.map((v, i) => v - n1[i] * tk), e.map((v, i) => v + n1[i] * tk), c));
          const p = P(...a), q = P(...b);
          let ang = -Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
          const mid = a.map((v, i) => (v + b[i]) / 2 + out[i]);
          const m = P(...mid), r = ang * Math.PI / 180, hgt = fs * 0.353 * 0.35;
          T(lab, m[0] + Math.sin(r) * hgt, m[1] + Math.cos(r) * hgt, { s: fs, b: true, c, a: 'center', angle: ang });
        };
        const lt = (v) => `${showLen(v)} ${S.unit}`;
        dim([0, 0, W + off], [L, 0, W + off], [0, 0, 1], [0, 0, off * 1.3], lt(L));
        dim([L + off, 0, 0], [L + off, 0, W], [1, 0, 0], [off * 2.6, 0, -off * 0.6], lt(W));
        dim([0, 0, W + off], [0, H, W + off], [0, 0, 1], [-off * 0.9, 0, off * 0.9], lt(H));
      };
      const ortho = (u, v, x, y0, w, h) => {
        const pxw = Math.round(w * 9), pxh = Math.round(h * 9);
        const o = view3d.snapOrtho(u, pxw, pxh, v);
        doc.addImage(o.url, 'JPEG', x, y0, w, h);
        const X = (a) => x + (a + o.hw) / (2 * o.hw) * w, Y = (b) => y0 + (o.hh - b) / (2 * o.hh) * h;
        const L = o.L, W = o.W, H = o.H, u2 = (n) => `${showLen(n)} ${S.unit}`;
        if (v === 'side') {
          dimLine(X(-L / 2), Y(-H / 2) + 3.2, X(L / 2), Y(-H / 2) + 3.2, (u.eq.id === 'build' ? 'Pallet ' : u.eq.group === 'Pallets & air ULDs' ? 'Base ' : 'Inside length ') + u2(L));
          dimLine(X(-L / 2), Y(H / 2) - 2, X(-L / 2 + u.usedL), Y(H / 2) - 2, 'Cargo ' + u2(u.usedL), { c: blue });
          dimLine(X(L / 2) + 4, Y(H / 2), X(L / 2) + 4, Y(-H / 2), (u.eq.id === 'build' ? 'max load ' : '') + u2(H));
          T(u.eq.group === 'Pallets & air ULDs' ? '' : 'Front wall', X(-L / 2), Y(-H / 2) + 7.2, { s: 6.5, c: muted }); T(u.eq.group === 'Pallets & air ULDs' ? '' : 'Doors', X(L / 2), Y(-H / 2) + 7.2, { s: 6.5, c: muted, a: 'right' });
        } else if (v === 'top') {
          dimLine(X(-L / 2) - 3, Y(W / 2), X(-L / 2) - 3, Y(-W / 2), u2(W));
          dimLine(X(L / 2) + 3, Y(W / 2), X(L / 2) + 3, Y(W / 2 - u.usedW), u2(u.usedW), { c: blue });
        } else {
          dimLine(X(-W / 2), Y(-H / 2) + 3.2, X(W / 2), Y(-H / 2) + 3.2, u2(W));
          dimLine(X(-W / 2) - 3, Y(H / 2), X(-W / 2) - 3, Y(-H / 2), u2(H));
          dimLine(X(W / 2) + 3, Y(-H / 2 + u.usedH), X(W / 2) + 3, Y(-H / 2), u2(u.usedH), { c: blue });
        }
        T({ side: 'Side view', top: 'Top view', door: u.eq.group === 'Pallets & air ULDs' ? 'End view' : 'View from the doors' }[v], x + 1.5, y0 + 3.6, { s: 7.5, b: true, c: muted });
      };
      const utilBlock = (u, x, y1, w) => {
        T('Space and weight used', x, y1, { b: true, s: 10 }); y1 += 2;
        const c = [x, x + 19, x + 35, x + 51, x + 76];
        box(x, y1, w, 5.5, [11, 42, 74]); ['', 'Used', 'Free', 'Max', 'Fill'].forEach((t, i) => T(t, c[i] + 1, y1 + 3.9, { s: 7.5, b: true, c: [255, 255, 255] })); y1 += 5.5;
        utilRows(u).forEach(([k, a, m, un, f], i) => {
          if (i % 2) box(x, y1, w, 5.5, [246, 249, 252]);
          const pct = a / m;
          [k, f(a), f(Math.max(0, m - a)), f(m) + ' ' + clean(un)].forEach((t, j) => T(t, c[j] + 1, y1 + 3.9, { s: 7.5, b: j === 1 }));
          box(c[4] + 1, y1 + 1.5, w - (c[4] - x) - 12, 2.6, [225, 236, 246]); box(c[4] + 1, y1 + 1.5, (w - (c[4] - x) - 12) * Math.min(1, pct), 2.6, pct > 1 ? red : k === 'Weight' && pct > 0.9 ? [245, 158, 11] : blue);
          T(Math.round(pct * 100) + '%', x + w - 1, y1 + 3.9, { s: 7.5, a: 'right' });
          y1 += 5.5;
        });
        return y1;
      };
      const weightBlock = (u, x, y1, w, isPal) => {
        T('Weight along the ' + (isPal ? 'pallet' : 'length'), x, y1, { b: true, s: 10 }); y1 += 2;
        const h = 13, mx = Math.max(1, ...u.bins), bw = w / 10;
        box(x, y1, w, h, [246, 249, 252]);
        u.bins.forEach((v, i) => { const bh = v / mx * (h - 3); box(x + i * bw + 0.6, y1 + h - bh, bw - 1.2, bh, blue); });
        const cxp = x + u.cogX * w; doc.setDrawColor(...red); doc.setLineWidth(0.5); doc.line(cxp, y1 - 0.5, cxp, y1 + h + 0.5);
        T('CoG', cxp + 1, y1 + 3, { s: 6.5, b: true, c: red });
        T(isPal ? 'Far edge' : 'Front wall', x, y1 + h + 3.4, { s: 6.5, c: muted }); T(isPal ? 'Near edge' : 'Doors', x + w, y1 + h + 3.4, { s: 6.5, c: muted, a: 'right' });
        const bal = balance(u);
        y1 += h + 7.5;
        T(`Centre of gravity: ${Math.round(u.cogX * 100)}% along, ${Math.round(u.cogZ * 100)}% across`, x, y1, { s: 8, b: true, c: bal.off ? red : undefined }); y1 += 4;
        T(doc.splitTextToSize(clean(`${bal.text}. Front half ${showWt(u.frontKg)} ${S.wunit}, rear half ${showWt(u.kg - u.frontKg)} ${S.wunit}.`), w), x, y1, { s: 7.5, c: muted });
        return y1 + 8;
      };
      let n = 0;
      const unitPage = async (u, title, list, isPal) => {
        doc.addPage(); head(title);
        T(title, M, TOP + 4, { b: true, s: 13 });
        const iw = 168, ih = 78;
        doc.addImage(view3d.snapshot(u, -1, 1680, 780, 'iso'), 'JPEG', M, TOP + 7, iw, ih); isoDims(u, M, TOP + 7, iw, ih, false); await shot(++n);
        // colour key under the picture
        let lx = M, ly = TOP + 7 + ih + 4;
        list.forEach((it, i) => {
          const c = u.counts[i]; if (!c) return;
          const t = clean(`${fmt(c)} x ${it.name}`).slice(0, 46); doc.setFontSize(7.5);
          const tw = doc.getTextWidth(t) + 9;
          if (lx + tw > M + iw) { lx = M; ly += 4.2; }
          if (ly > TOP + 7 + ih + 9) return;
          doc.setFillColor(...ink(it.color)); doc.rect(lx, ly - 2.6, 3, 3, 'F'); T(t, lx + 4, ly, { s: 7.5 }); lx += tw;
        });
        const rx = M + iw + 6, rw = PW - M - rx;
        let yy = utilBlock(u, rx, TOP + 8, rw);
        yy = weightBlock(u, rx, yy + 6, rw, isPal);
        // measured views
        const vy = TOP + 7 + ih + 11, vh = BOT - vy - 1;
        const F = Fof(u.eq), wide = F.L / F.H > 2.2;
        if (wide) {
          const dw = Math.min(56, vh * F.W / F.H * 1.25), sw = (PW - 2 * M - dw - 6) / 2;
          ortho(u, 'side', M, vy, sw, vh); await shot(++n);
          ortho(u, 'top', M + sw + 3, vy, sw, vh); await shot(++n);
          ortho(u, 'door', M + 2 * sw + 6, vy, dw, vh); await shot(++n);
        } else {
          const sw = (PW - 2 * M - 6) / 3;
          ortho(u, 'side', M, vy, sw, vh); ortho(u, 'top', M + sw + 3, vy, sw, vh); ortho(u, 'door', M + 2 * sw + 6, vy, sw, vh); await shot(++n);
        }
        if (isPal || yy < BOT - 20) { /* contents fit in the right column on short loads */ }
        return yy;
      };
      const stepPages = async (u, title, isPal) => {
        const st = u.steps, per = 3, rh = (BOT - TOP - 2 * 2.5) / per, ih = rh - 2, iw = Math.min(140, ih * 2.9);
        for (let k = 0; k < st.length; k++) {
          if (k % per === 0) { doc.addPage(); head(title + ' - steps'); }
          const y0 = TOP - 1 + (k % per) * (rh + 2.5);
          box(M, y0, PW - 2 * M, rh, [250, 252, 254]);
          doc.addImage(view3d.snapshot(u, k, Math.round(iw * 9), Math.round(ih * 9), 'iso'), 'JPEG', M + 1, y0 + 1, iw, ih); isoDims(u, M + 1, y0 + 1, iw, ih, true); await shot(++n);
          const x = M + iw + 5, tw = PW - M - x - 2;
          let ty = y0 + 6;
          tick(x, ty, 4.2);
          const reps = st[k].walls.length;
          T(`Step ${k + 1} of ${st.length}${reps > 1 ? ` - ${reps} identical rows` : ''}`, x + 6.5, ty, { b: true, s: 11 }); ty += 5;
          T(`${showLen(st[k].x0)}-${showLen(st[k].x1)} ${S.unit} from the ${isPal ? 'far edge' : 'front wall'}   |   total after this step: ${fmt(st[k].cumN)} pcs, ${showWt(st[k].cumKg)} ${S.wunit}`, x, ty, { s: 8, c: muted }); ty += 5;
          const compact = st[k].parts.length * 7.8 > y0 + rh - ty;
          if (compact) for (const p of st[k].parts) {
            if (ty > y0 + rh - 1.5) { T('...more in the 3D view on the website', x, ty, { s: 7, c: muted }); break; }
            const t = partText(p, reps);
            doc.setFillColor(...ink(itemColor(p.type))); doc.rect(x, ty - 2.5, 2.8, 2.8, 'F');
            doc.setFontSize(7.4);
            const l = doc.splitTextToSize(clean(`${fmt(t.n)} x ${t.name} ${t.where}${t.how ? ', ' + t.how : ''} | ${reps > 1 ? 'each row ' : ''}${t.grid}`), tw - 5);
            T(l.slice(0, 2), x + 4.5, ty, { s: 7.4 }); ty += Math.min(2, l.length) * 3.1 + 0.7;
          }
          else for (const p of st[k].parts) {
            if (ty > y0 + rh - 2) { T('...more in the 3D view on the website', x, ty, { s: 7.5, c: muted }); break; }
            const t = partText(p, reps);
            doc.setFillColor(...ink(itemColor(p.type))); doc.rect(x, ty - 2.7, 3.2, 3.2, 'F');
            const l1 = doc.splitTextToSize(clean(`${fmt(t.n)} x ${t.name} ${t.where}${t.how ? ', ' + t.how : ''}`), tw - 5);
            T(l1, x + 5, ty, { s: 8.3, b: true }); ty += l1.length * 3.6;
            T(clean(`${reps > 1 ? 'Each row: ' : ''}${t.grid}  |  ${t.dim}`), x + 5, ty, { s: 7.8, c: muted }); ty += 4.8;
          }
          if (n > 160) break;
        }
      };
      const signOff = (u, idx) => {
        doc.addPage(); head(`Stuffing record - ${kn[0]} ${idx + 1}`);
        T(`Stuffing record - ${kn[0]} ${idx + 1}: ${u.eq.name}`, M, TOP + 4, { b: true, s: 13 });
        T(`Planned: ${fmt(u.boxes.length)} ${S.pal || r.pb ? 'pallets / packages' : 'packages'}, ${showWt(u.kg)} ${S.wunit} cargo, ${fmt(u.vol / 1e6, 2)} m3. Plan ${ref}.`, M, TOP + 10, { s: 9, c: muted });
        const F = [[S.cat === 'truck' ? 'Vehicle no.' : S.cat === 'uld' ? 'ULD no.' : 'Container no.', ''], ['Seal no.', ''], ['Size / type', u.eq.name.replace(/ \(.*\)$/, '')], [S.cat === 'dry' || S.cat === 'reefer' ? 'Tare weight (' + S.wunit + ')' : 'Empty weight (' + S.wunit + ')', ''],
          ['Cargo weight (' + S.wunit + ')', `planned ${showWt(u.kg)}, actual:`], [S.cat === 'dry' || S.cat === 'reefer' ? 'VGM (' + S.wunit + '), method 1 / 2' : 'Gross weight (' + S.wunit + ')', ''], ['Date and time', ''], ['Place of stuffing', ''], ['Truck / trailer no.', '']];
        const fw = (PW - 2 * M - 6) / 3, fh = 11;
        F.forEach(([k, v], i) => { const x = M + (i % 3) * (fw + 3), y0 = TOP + 14 + Math.floor(i / 3) * (fh + 2); doc.setDrawColor(207, 224, 239); doc.setLineWidth(0.3); doc.rect(x, y0, fw, fh); T(k, x + 2, y0 + 3.6, { s: 7, c: muted }); if (v) T(v, x + 2, y0 + 8.6, { s: 9, b: true }); });
        let yy = TOP + 14 + 3 * (fh + 2) + 6;
        const lists = [
          ['Before loading', [S.cat === 'truck' ? 'Truck body clean, dry, no holes, roof and floor sound' : 'Container clean, dry, no holes (no daylight inside with doors shut)', 'Doors, hinges and locking bars work', 'No old labels, smells or nails on the floor', 'Lashing, dunnage and airbags ready', 'DG labels and documents ready, if any']],
          ['Photos to take', ['Empty, inside, before loading', 'Half loaded', 'Fully loaded, before closing', 'Doors closed with the seal fitted', 'Seal number close-up', 'Container number and the CSC plate']],
          ['After loading', ['Load secured at the doors', 'Weights checked against the plan', 'Seal number written on the documents', 'Copy of this record to YAM Logistics']]
        ];
        lists.forEach(([h, items], i) => { const x = M + i * (fw + 3); let ly = yy; T(h, x, ly, { b: true, s: 10 }); ly += 6; items.forEach((t) => { tick(x, ly); T(t, x + 5.5, ly, { s: 8.2 }); ly += 6; }); });
        yy += 46;
        T('Differences from the plan, damage or remarks', M, yy, { b: true, s: 10 }); yy += 2;
        doc.setDrawColor(207, 224, 239); for (let i = 1; i <= 3; i++) doc.line(M, yy + i * 7, PW - M, yy + i * 7);
        yy += 29;
        ['Loaded by (name and signature)', 'Supervisor / shipper (name and signature)', S.cat === 'truck' ? 'Driver (name and signature)' : 'Transporter / driver (name and signature)'].forEach((t, i) => { const x = M + i * (fw + 3); doc.setDrawColor(11, 42, 74); doc.line(x, yy + 8, x + fw - 6, yy + 8); T(t, x, yy + 12, { s: 7.5, c: muted }); });
      };

      // ---- pallet builds
      if (r.pb) for (const [i, p] of r.pb.pallets.entries()) {
        const u = p.unit;
        await unitPage(u, `Pallet P${p.n} (build ${p.qty}) - ${showLen(p.l)} x ${showLen(p.w)} x ${showLen(p.h)} ${S.unit}, ${showWt(p.kg)} ${S.wunit}`, cargo, true);
        if (mode === 'steps') await stepPages(u, `Pallet P${p.n}`, true);
        if (n > 160) break;
      }
      // ---- units
      for (const g of r.groups) {
        const u = g.units[0], title = unitTitle(g) + (g.units.length > 1 ? ` (load all ${g.units.length} the same way)` : '');
        await unitPage(u, title, r.items, false);
        if (mode === 'steps') await stepPages(u, unitTitle(g), false);
        if (n > 160) break;
      }
      // ---- stuffing records
      r.units.slice(0, 30).forEach((u, i) => signOff(u, i));
      if (window.YAMBrand) YAMBrand.finish(doc);
      doc.save(`YAM-load-plan-${mode === 'steps' ? 'step-by-step' : 'summary'}-${r.units.length}-${kn[1].replace(' ', '-')}.pdf`);
    } catch (e) {
      console.error(e); alertBox('Sorry, the PDF could not be created in this browser.');
    } finally {
      btns.forEach((b) => { b.disabled = false; }); btn.textContent = old;
      const u = curU(); if (view3d.ready && view3d.cur() !== u) view3d.build(u, u.eq);
      syncStep();
    }
  }
  function alertBox(msg) { const d = document.createElement('div'); d.className = 'lp-card lp-warn'; d.textContent = msg; $('lp-out').prepend(d); setTimeout(() => d.remove(), 5000); }

  // ---------------- init
  const fromLink = decodeHash();
  segs(); renderRows(); renderEqInfo();
  if (fromLink) setTimeout(calc, 50);
})();
