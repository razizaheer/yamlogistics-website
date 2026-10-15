/* YAM Logistics – Container load planner UI (needs lp-engine.js, three.min.js, OrbitControls.js, jspdf.umd.min.js) */
(function () {
  'use strict';
  const E = window.LPEngine;
  const root = document.getElementById('lp-root');
  if (!root || !E) return;

  const PALETTE = ['#0A6CC2', '#F59E0B', '#16A34A', '#E2483A', '#7C3AED', '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#4F46E5', '#0D9488', '#A16207', '#BE123C', '#2563EB', '#9333EA', '#059669'];
  const WA = '919212558167';
  const EMAIL = 'info@yamlogistics.com';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n, d = 0) => (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

  // ---------------- state
  const S = {
    unit: 'cm', wunit: 'kg', eq: '40hc', eqo: null, // eqo = overrides {L,W,H,maxKg}
    items: [
      { name: 'Carton A', l: 60, w: 40, h: 40, qty: 200, kg: 12, upright: false, stackable: true, maxLayers: '' },
      { name: 'Carton B', l: 50, w: 50, h: 60, qty: 80, kg: 20, upright: true, stackable: true, maxLayers: '' }
    ],
    result: null, unitSel: 0, step: -1
  };
  const lenF = () => (S.unit === 'in' ? 2.54 : 1);
  const wtF = () => (S.wunit === 'lb' ? 0.45359237 : 1);
  const showLen = (cm, d = 0) => fmt(cm / lenF(), S.unit === 'in' ? 1 : d);
  const showWt = (kg) => fmt(kg / wtF(), 0);
  const eqBase = () => E.EQUIPMENT.find((e) => e.id === S.eq);
  const eqNow = () => ({ ...eqBase(), ...(S.eqo || {}) });

  // ---------------- share / import
  function encodeState() {
    const o = { u: S.unit, wu: S.wunit, e: S.eq, eo: S.eqo, i: S.items.map((it) => [it.name, it.l, it.w, it.h, it.qty, it.kg, it.upright ? 1 : 0, it.stackable ? 1 : 0, it.maxLayers || 0]) };
    return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/, '');
  }
  function decodeHash() {
    const h = location.hash.slice(1);
    try {
      if (h.startsWith('p=')) {
        const o = JSON.parse(decodeURIComponent(escape(atob(h.slice(2)))));
        S.unit = o.u || 'cm'; S.wunit = o.wu || 'kg'; S.eq = o.e || '40hc'; S.eqo = o.eo || null;
        S.items = (o.i || []).map((r) => ({ name: r[0], l: r[1], w: r[2], h: r[3], qty: r[4], kg: r[5], upright: !!r[6], stackable: !!r[7], maxLayers: r[8] || '' }));
        return true;
      }
      if (h.startsWith('c=')) { // from the CBM calculator
        const o = JSON.parse(decodeURIComponent(h.slice(2)));
        S.unit = o.unit === 'in' ? 'in' : 'cm';
        const f = S.unit === 'in' ? 2.54 : 1;
        S.items = (o.rows || []).filter((r) => +r.l && +r.w && +r.h).map((r, i) => ({ name: 'Item ' + (i + 1), l: +r.l * f, w: +r.w * f, h: +r.h * f, qty: Math.max(1, Math.floor(+r.pcs || 1)), kg: +r.kg || 0, upright: false, stackable: true, maxLayers: '' }));
        return S.items.length > 0;
      }
    } catch (e) { /* ignore bad links */ }
    return false;
  }

  // ---------------- layout
  root.innerHTML = `
<div class="lp">
  <div class="lp-card lp-form">
    <div class="lp-row lp-top">
      <label class="lp-f lp-eq"><span>Container, pallet or ULD</span><select id="lp-eq"></select></label>
      <div class="lp-f"><span>Units</span><div class="lp-seg" id="lp-units"><button data-u="cm">cm</button><button data-u="in">inches</button></div></div>
      <div class="lp-f"><span>Weight</span><div class="lp-seg" id="lp-wunits"><button data-w="kg">kg</button><button data-w="lb">lb</button></div></div>
    </div>
    <div class="lp-eqinfo" id="lp-eqinfo"></div>
    <div class="lp-tablewrap"><table class="lp-table">
      <thead><tr><th></th><th>Package name</th><th>Length</th><th>Width</th><th>Height</th><th>Qty</th><th>Weight / pc</th><th title="Must stay upright, this side up">Upright only</th><th title="Other packages can be placed on top">Stackable</th><th title="Max layers of this item, optional">Max layers</th><th></th></tr></thead>
      <tbody id="lp-rows"></tbody>
    </table></div>
    <div class="lp-row lp-actions">
      <button class="lp-btn lp-ghost" id="lp-add">+ Add package</button>
      <button class="lp-btn lp-ghost" id="lp-paste-t">Paste from Excel</button>
      <button class="lp-btn lp-ghost" id="lp-example">Load example</button>
      <button class="lp-btn lp-ghost" id="lp-clear">Clear</button>
      <span class="lp-totals" id="lp-totals"></span>
    </div>
    <div class="lp-paste" id="lp-paste" hidden>
      <p>Copy columns from Excel in this order: <b>Name, Length, Width, Height, Quantity, Weight per piece</b>. One package per line.</p>
      <textarea id="lp-paste-ta" rows="5" placeholder="Carton A	60	40	40	200	12"></textarea>
      <button class="lp-btn" id="lp-paste-go">Add these packages</button>
    </div>
    <button class="lp-btn lp-go" id="lp-go">Calculate load plan →</button>
  </div>
  <div id="lp-out"></div>
</div>`;

  const $ = (id) => document.getElementById(id);

  // equipment select
  const groups = {};
  for (const e of E.EQUIPMENT) (groups[e.group] = groups[e.group] || []).push(e);
  $('lp-eq').innerHTML = Object.entries(groups).map(([g, list]) => `<optgroup label="${esc(g)}">${list.map((e) => `<option value="${e.id}">${esc(e.name)}</option>`).join('')}</optgroup>`).join('');

  function renderEqInfo() {
    const e = eqNow();
    $('lp-eq').value = S.eq;
    const u = S.unit === 'in' ? 'in' : 'cm';
    $('lp-eqinfo').innerHTML = `
      <span>Inside <b>L</b> <input class="lp-in lp-eqv" data-k="L" value="${showLen(e.L)}"> × <b>W</b> <input class="lp-in lp-eqv" data-k="W" value="${showLen(e.W)}"> × <b>H</b> <input class="lp-in lp-eqv" data-k="H" value="${showLen(e.H)}"> ${u}</span>
      <span>Max payload <input class="lp-in lp-eqv lp-kg" data-k="maxKg" value="${Math.round(e.maxKg / wtF())}"> ${S.wunit}</span>
      <span class="lp-muted">${fmt(e.L * e.W * e.H / 1e6, 1)} m³${S.eqo ? ' · <a href="#" id="lp-eqreset">reset to standard</a>' : ''}</span>
      ${e.note ? `<span class="lp-note">${esc(e.note)}</span>` : ''}`;
    document.querySelectorAll('.lp-eqv').forEach((inp) => inp.addEventListener('change', () => {
      const k = inp.dataset.k, v = parseFloat(inp.value);
      if (!(v > 0)) return renderEqInfo();
      S.eqo = { ...(S.eqo || {}), [k]: k === 'maxKg' ? v * wtF() : v * lenF() };
      renderEqInfo();
    }));
    const r = $('lp-eqreset'); if (r) r.addEventListener('click', (ev) => { ev.preventDefault(); S.eqo = null; renderEqInfo(); });
  }
  $('lp-eq').addEventListener('change', () => { S.eq = $('lp-eq').value; S.eqo = null; renderEqInfo(); });

  function segs() {
    document.querySelectorAll('#lp-units button').forEach((b) => b.classList.toggle('on', b.dataset.u === S.unit));
    document.querySelectorAll('#lp-wunits button').forEach((b) => b.classList.toggle('on', b.dataset.w === S.wunit));
  }
  $('lp-units').addEventListener('click', (e) => { const u = e.target.dataset.u; if (u) { S.unit = u; segs(); renderRows(); renderEqInfo(); if (S.result) renderResult(); } });
  $('lp-wunits').addEventListener('click', (e) => { const w = e.target.dataset.w; if (w) { S.wunit = w; segs(); renderRows(); renderEqInfo(); if (S.result) renderResult(); } });

  // rows (stored internally in cm/kg)
  function renderRows() {
    $('lp-rows').innerHTML = S.items.map((it, i) => `<tr data-i="${i}">
      <td><span class="lp-dot" style="background:${PALETTE[i % PALETTE.length]}"></span></td>
      <td><input class="lp-in lp-name" data-k="name" value="${esc(it.name)}" maxlength="40"></td>
      <td><input class="lp-in" data-k="l" inputmode="decimal" value="${it.l ? +(it.l / lenF()).toFixed(2) : ''}"></td>
      <td><input class="lp-in" data-k="w" inputmode="decimal" value="${it.w ? +(it.w / lenF()).toFixed(2) : ''}"></td>
      <td><input class="lp-in" data-k="h" inputmode="decimal" value="${it.h ? +(it.h / lenF()).toFixed(2) : ''}"></td>
      <td><input class="lp-in" data-k="qty" inputmode="numeric" value="${it.qty || ''}"></td>
      <td><input class="lp-in" data-k="kg" inputmode="decimal" value="${it.kg ? +(it.kg / wtF()).toFixed(2) : ''}"></td>
      <td class="lp-c"><input type="checkbox" data-k="upright" ${it.upright ? 'checked' : ''} aria-label="Upright only"></td>
      <td class="lp-c"><input type="checkbox" data-k="stackable" ${it.stackable ? 'checked' : ''} aria-label="Stackable"></td>
      <td><input class="lp-in lp-small" data-k="maxLayers" inputmode="numeric" placeholder="any" value="${it.maxLayers || ''}"></td>
      <td><button class="lp-x" data-del="${i}" aria-label="Remove">×</button></td></tr>`).join('');
    totals();
  }
  $('lp-rows').addEventListener('input', (e) => {
    const tr = e.target.closest('tr'); if (!tr) return;
    const it = S.items[+tr.dataset.i], k = e.target.dataset.k;
    if (k === 'upright' || k === 'stackable') it[k] = e.target.checked;
    else if (k === 'name') it.name = e.target.value;
    else {
      const v = parseFloat(e.target.value);
      it[k] = !(v > 0) ? 0 : (k === 'qty' || k === 'maxLayers') ? Math.floor(v) : k === 'kg' ? v * wtF() : v * lenF();
    }
    totals();
  });
  $('lp-rows').addEventListener('change', (e) => { if (e.target.type === 'checkbox') e.target.dispatchEvent(new Event('input', { bubbles: true })); });
  $('lp-rows').addEventListener('click', (e) => { const d = e.target.dataset.del; if (d != null) { S.items.splice(+d, 1); if (!S.items.length) addRow(); renderRows(); } });
  function addRow() { S.items.push({ name: 'Package ' + String.fromCharCode(65 + (S.items.length % 26)), l: 0, w: 0, h: 0, qty: 1, kg: 0, upright: false, stackable: true, maxLayers: '' }); }
  $('lp-add').addEventListener('click', () => { addRow(); renderRows(); });
  $('lp-clear').addEventListener('click', () => { S.items = []; addRow(); S.result = null; $('lp-out').innerHTML = ''; renderRows(); });
  $('lp-example').addEventListener('click', () => {
    S.unit = 'cm'; S.wunit = 'kg'; S.eq = '40hc'; S.eqo = null;
    S.items = [
      { name: 'Rug bales', l: 120, w: 60, h: 50, qty: 90, kg: 45, upright: false, stackable: true, maxLayers: '' },
      { name: 'Brassware cartons', l: 60, w: 40, h: 40, qty: 260, kg: 18, upright: true, stackable: true, maxLayers: '' },
      { name: 'Machine on pallet', l: 120, w: 100, h: 110, qty: 4, kg: 650, upright: true, stackable: false, maxLayers: '' },
      { name: 'Small cartons', l: 40, w: 30, h: 25, qty: 300, kg: 6, upright: false, stackable: true, maxLayers: '' }
    ];
    segs(); renderRows(); renderEqInfo();
  });
  $('lp-paste-t').addEventListener('click', () => { $('lp-paste').hidden = !$('lp-paste').hidden; });
  $('lp-paste-go').addEventListener('click', () => {
    const lines = $('lp-paste-ta').value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const add = [];
    for (const line of lines) {
      const c = line.split(/\t|;|,(?=\s*\d)/).map((x) => x.trim());
      const nums = c.map((x) => parseFloat(x.replace(/,/g, '')));
      let name = c[0], off = 1;
      if (isFinite(nums[0])) { name = 'Package ' + (S.items.length + add.length + 1); off = 0; }
      const [l, w, h, q, kg] = nums.slice(off);
      if (l > 0 && w > 0 && h > 0) add.push({ name, l: l * lenF(), w: w * lenF(), h: h * lenF(), qty: Math.max(1, Math.floor(q || 1)), kg: (kg || 0) * wtF(), upright: false, stackable: true, maxLayers: '' });
    }
    if (add.length) {
      S.items = S.items.filter((it) => it.l && it.w && it.h).concat(add);
      $('lp-paste-ta').value = ''; $('lp-paste').hidden = true; renderRows();
    }
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
      .map((it) => ({ ...it, maxLayers: +it.maxLayers || 0, qty: Math.floor(+it.qty), color: PALETTE[S.items.indexOf(it) % PALETTE.length] }));
    if (!items.length) { $('lp-out').innerHTML = '<div class="lp-card lp-warn">Enter at least one package with length, width, height and quantity.</div>'; return; }
    const eq = eqNow();
    const t0 = performance.now();
    const res = E.plan(items, eq);
    res.ms = performance.now() - t0;
    res.items = items;
    // compare dry containers
    res.compare = null;
    if (eq.group === 'Dry containers' && !S.eqo) {
      res.compare = ['20gp', '40gp', '40hc', '45hc'].map((id) => {
        const r = id === S.eq ? res : E.plan(items, id);
        const last = r.units[r.units.length - 1];
        return { id, name: E.EQUIPMENT.find((e) => e.id === id).name, n: r.units.length, ok: !r.tooBig.length, util: last ? last.util : 0, avg: r.units.length ? r.units.reduce((a, u) => a + u.util, 0) / r.units.length : 0 };
      });
    }
    // group identical units
    const sig = (u) => Object.entries(u.counts).sort().map((e) => e.join(':')).join('|') + '#' + u.boxes.length + '#' + Math.round(u.usedL);
    res.groups = [];
    for (const u of res.units) {
      const g = res.groups[res.groups.length - 1];
      if (g && sig(g.units[0]) === sig(u)) g.units.push(u); else res.groups.push({ units: [u] });
    }
    for (const u of res.units) u.steps = E.steps(u);
    S.result = res; S.unitSel = 0; S.step = -1;
    try { history.replaceState(null, '', '#p=' + encodeState()); } catch (e) { /* ignore */ }
    renderResult();
    $('lp-out').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const r = S.result, eq = r.eq;
    const n = r.units.length;
    const kind = eq.group === 'Pallets & air ULDs' ? (/pallet/i.test(eq.name) && !/air/i.test(eq.name) ? 'pallet' : 'air pallet') : 'container';
    const plural = (k) => (k === 1 ? kind : kind === 'pallet' ? 'pallets' : kind === 'air pallet' ? 'air pallets' : 'containers');
    const totalPcs = r.items.reduce((a, it) => a + it.qty, 0);
    const warn = [];
    for (const t of r.tooBig) warn.push(`<b>${fmt(t.n)} × ${esc(t.type.name)}</b> cannot be loaded: ${t.why}.`);
    for (const t of r.notPlaced) warn.push(`<b>${fmt(t.n)} × ${esc(t.type.name)}</b> were not planned (the planner stops at 200 units). Ask us to plan this load.`);
    const cmp = r.compare ? `<div class="lp-cmp"><div class="lp-k">Compare containers</div><table><tr><th></th><th>Units</th><th>Average fill</th></tr>${r.compare.map((c) => `<tr class="${c.id === S.eq ? 'on' : ''}"><td>${esc(c.name)}</td><td>${c.ok ? c.n : '–'}</td><td>${c.ok ? Math.round(c.avg * 100) + '%' : 'does not fit'}</td></tr>`).join('')}</table></div>` : '';
    const tabs = r.groups.map((g, gi) => {
      const a = g.units[0].index + 1, b = g.units[g.units.length - 1].index + 1;
      const on = g.units.includes(r.units[S.unitSel]);
      return `<button class="lp-tab ${on ? 'on' : ''}" data-u="${g.units[0].index}">${kind === 'container' ? 'Container' : 'Pallet'} ${a}${b > a ? '–' + b : ''}${g.units.length > 1 ? ` <small>×${g.units.length} identical</small>` : ''}</button>`;
    }).join('');
    $('lp-out').innerHTML = `
<div class="lp-card lp-sum">
  <div class="lp-sumhead">
    <div><div class="lp-k">You need</div><div class="lp-big">${n ? `${n} × ${esc(eq.name)}` : 'Nothing could be loaded'}</div>
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
    if (!n) return;
    $('lp-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-u]'); if (!b) return; S.unitSel = +b.dataset.u; S.step = -1; renderResult(); });
    renderUnit();
    shareLinks();
    $('lp-pdf').addEventListener('click', makePdf);
    $('lp-copy').addEventListener('click', () => { const u = location.href; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => { $('lp-copy').textContent = 'Link copied ✓'; }).catch(() => { prompt('Copy this link', u); }); });
  }

  function summaryText() {
    const r = S.result;
    const lines = [`Load plan: ${r.units.length} × ${r.eq.name}`];
    for (const it of r.items) lines.push(`- ${it.qty} × ${it.name}: ${showLen(it.l)}×${showLen(it.w)}×${showLen(it.h)} ${S.unit}, ${showWt(it.kg)} ${S.wunit}/pc${it.upright ? ', upright' : ''}${it.stackable ? '' : ', non-stackable'}`);
    lines.push('Plan: ' + location.href);
    return lines.join('\n');
  }
  function shareLinks() {
    const txt = 'Hello YAM Logistics, please quote for this shipment.\n' + summaryText();
    $('lp-wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(txt);
    $('lp-mail').href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Load plan – quote request') + '&body=' + encodeURIComponent(txt);
  }

  function renderUnit() {
    const r = S.result, u = r.units[S.unitSel], eq = r.eq;
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
      const r = S.result, eq = r.eq;
      const PW = 297, PH = 210, M = 12;
      const head = (title) => {
        doc.setFillColor(10, 108, 194); doc.rect(0, 0, PW, 16, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('YAM Logistics · Container load plan', M, 10.5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(title, PW - M, 10.5, { align: 'right' });
        doc.setTextColor(11, 42, 74);
        doc.setFontSize(7.5); doc.setTextColor(94, 120, 145);
        doc.text('yamlogistics.com · WhatsApp +91 92125 58167 · Computer-generated plan for guidance; allow for dunnage, lashing and carrier rules.', M, PH - 6);
        doc.setTextColor(11, 42, 74);
      };
      const clean = (s) => String(s).replace(/[′]/g, "'").replace(/[–]/g, '-').replace(/[×]/g, 'x').replace(/[·]/g, '-').replace(/[^\x20-\x7E]/g, '');
      // page 1: summary
      head(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
      doc.text(clean(`${r.units.length} x ${eq.name}`), M, 30);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.text(clean(`Inside ${showLen(eq.L)} x ${showLen(eq.W)} x ${showLen(eq.H)} ${S.unit} - payload ${showWt(eq.maxKg)} ${S.wunit} - ${fmt(r.totalBoxes)} packages planned`), M, 37);
      let y = 47;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      const cols = [M, M + 8, M + 80, M + 140, M + 160, M + 185, M + 215];
      ['', 'Package', `L x W x H (${S.unit})`, 'Qty', `Wt/pc (${S.wunit})`, 'Upright', 'Stackable'].forEach((t, i) => doc.text(t, cols[i], y));
      doc.setFont('helvetica', 'normal'); y += 6;
      r.items.forEach((it, i) => {
        const c = new THREE.Color(it.color);
        doc.setFillColor(c.r * 255, c.g * 255, c.b * 255); doc.rect(cols[0], y - 3.2, 4, 4, 'F');
        [clean(it.name).slice(0, 40), `${showLen(it.l)} x ${showLen(it.w)} x ${showLen(it.h)}`, fmt(it.qty), showWt(it.kg), it.upright ? 'Yes' : 'No', it.stackable ? 'Yes' : 'No'].forEach((t, j) => doc.text(clean(t), cols[j + 1], y));
        y += 6; if (y > 120) return;
      });
      y += 4; doc.setFont('helvetica', 'bold'); doc.text('Units', M, y); doc.setFont('helvetica', 'normal'); y += 6;
      r.groups.forEach((g) => {
        const u = g.units[0], a = u.index + 1, b = g.units[g.units.length - 1].index + 1;
        doc.text(clean(`Unit ${a}${b > a ? '-' + b + ' (' + g.units.length + ' identical)' : ''}: ${fmt(u.boxes.length)} pcs, ${Math.round(u.util * 100)}% volume, ${showWt(u.kg)} ${S.wunit} (${Math.round(u.kgUtil * 100)}% of payload)`), M, y);
        y += 5.5; if (y > PH - 14) { doc.addPage(); head('Units'); y = 26; }
      });
      if (r.tooBig.length) { y += 2; doc.setTextColor(226, 72, 58); r.tooBig.forEach((t) => { doc.text(clean(`Not loaded: ${t.n} x ${t.type.name} - ${t.why}`), M, y); y += 5; }); doc.setTextColor(11, 42, 74); }
      // per unit group
      let shots = 0;
      for (const g of r.groups) {
        const u = g.units[0], a = u.index + 1, b = g.units[g.units.length - 1].index + 1;
        const title = `Unit ${a}${b > a ? '-' + b : ''}`;
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
      doc.save(`YAM-load-plan-${r.units.length}x-${eq.id}.pdf`);
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
