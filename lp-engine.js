/* YAM Logistics – container load planner engine (wall-building heuristic).
   Units: cm and kg. Container axes: x = length (0 = front wall, L = doors), y = height, z = width.
   Works in the browser (window.LPEngine) and in Node (module.exports). */
(function (root) {
  'use strict';

  const EQUIPMENT = [
    // group, id, name, inner L, W, H (cm), payload kg, door W, H, note
    ['Dry containers', '20gp', '20′ Standard (20GP)', 589, 235, 239, 28200, 234, 228, ''],
    ['Dry containers', '40gp', '40′ Standard (40GP)', 1203, 235, 239, 26700, 234, 228, ''],
    ['Dry containers', '40hc', '40′ High Cube (40HC)', 1203, 235, 269, 26500, 234, 258, ''],
    ['Dry containers', '45hc', '45′ High Cube (45HC)', 1356, 235, 269, 27700, 234, 258, ''],
    ['Reefers & specials', '20rf', '20′ Reefer', 544, 229, 222, 27000, 229, 226, 'Height kept below the red load line so cold air can circulate.'],
    ['Reefers & specials', '40rh', '40′ High Cube Reefer', 1158, 229, 245, 29000, 229, 250, 'Height kept below the red load line so cold air can circulate.'],
    ['Reefers & specials', '20ot', '20′ Open Top', 589, 235, 235, 28100, 234, 225, 'Cargo taller than the container can be loaded from the top as out-of-gauge. Ask us.'],
    ['Reefers & specials', '40ot', '40′ Open Top', 1203, 235, 235, 26600, 234, 225, 'Cargo taller than the container can be loaded from the top as out-of-gauge. Ask us.'],
    ['Reefers & specials', '20fr', '20′ Flat Rack', 562, 223, 233, 27000, 0, 0, 'Space between the end walls. Wider or taller cargo can still go as out-of-gauge.'],
    ['Reefers & specials', '40fr', '40′ Flat Rack', 1198, 223, 197, 39000, 0, 0, 'Space between the end walls. Wider or taller cargo can still go as out-of-gauge.'],
    ['Pallets & air ULDs', 'euro', 'Euro pallet 120 × 80', 120, 80, 160, 1000, 0, 0, 'Load height is editable. Pallet deck (about 15 cm) not included.'],
    ['Pallets & air ULDs', 'uspal', 'Standard pallet 120 × 100', 120, 100, 160, 1000, 0, 0, 'Load height is editable. Pallet deck (about 15 cm) not included.'],
    ['Pallets & air ULDs', 'asia', 'Asia pallet 110 × 110', 110, 110, 160, 1000, 0, 0, 'Load height is editable. Pallet deck (about 15 cm) not included.'],
    ['Pallets & air ULDs', 'pmc-ld', 'PMC air pallet – lower deck (160 cm)', 307, 233, 160, 4600, 0, 0, 'Usable base inside the net. The aircraft contour is not modelled, so confirm with the airline.'],
    ['Pallets & air ULDs', 'pmc-md', 'PMC air pallet – main deck (244 cm)', 307, 233, 244, 6800, 0, 0, 'Usable base inside the net. The aircraft contour is not modelled, so confirm with the airline.'],
    ['Pallets & air ULDs', 'pag-ld', 'PAG air pallet – lower deck (160 cm)', 307, 213, 160, 4600, 0, 0, 'Usable base inside the net. The aircraft contour is not modelled, so confirm with the airline.'],
    ['Pallets & air ULDs', 'pag-md', 'PAG air pallet – main deck (244 cm)', 307, 213, 244, 6000, 0, 0, 'Usable base inside the net. The aircraft contour is not modelled, so confirm with the airline.']
  ].map(([group, id, name, L, W, H, maxKg, doorW, doorH, note]) => ({ group, id, name, L, W, H, maxKg, doorW, doorH, note }));

  const EPS = 1e-6;

  function orientations(it) {
    const { l, w, h } = it;
    const list = it.orient === 'fixed'
      ? [[l, w, h]]
      : it.upright
      ? [[l, w, h], [w, l, h]]
      : [[l, w, h], [w, l, h], [l, h, w], [h, l, w], [w, h, l], [h, w, l]];
    const seen = new Set(), out = [];
    for (const [d, wd, ht] of list) { // d = depth along x, wd = across z, ht = height y
      const k = d + 'x' + wd + 'x' + ht;
      if (!seen.has(k)) { seen.add(k); out.push({ d, w: wd, h: ht, upright: ht === h }); }
    }
    return out;
  }

  /** Pack one equipment unit. `stock` = [{type, left}] (mutated). Returns {boxes, walls, kg, vol}. */
  function packOne(eq, stock, opts) {
    const L = eq.L, W = eq.W, H = eq.H, maxKg = eq.maxKg;
    const boxes = [], walls = [];
    let x = 0, kg = 0;
    const live = () => stock.filter((s) => s.left > 0);

    // Fill one wall slice of depth d starting at x0; dryRun = evaluate only
    function fillWall(d, x0, dry, lead) {
      const left = new Map(stock.map((s) => [s, s.left]));
      let kgW = 0, vol = 0;
      const placed = [];
      const blocks = []; // for step text
      let z = 0;
      const canAdd = (s, n) => kg + kgW + s.type.kg * n <= maxKg + EPS;

      // choose best block for a cell (width avail cw, height avail ch, depth d, base support stackable?)
      function bestBlock(cw, ch, onTopOf, dLim, only, onlyO) {
        const dd = dLim || d;
        let best = null;
        for (const s of (only ? [only] : stock)) {
          const n0 = left.get(s);
          if (n0 <= 0) continue;
          for (const o of (onlyO ? [onlyO] : s.oris)) {
            if (o.d > dd + EPS || o.w > cw + EPS || o.h > ch + EPS) continue;
            const nd = Math.floor((dd + EPS) / o.d);
            let ny = Math.floor((ch + EPS) / o.h);
            if (!s.type.stackable) ny = Math.min(ny, 1);
            if (s.type.maxLayers > 0) ny = onTopOf ? 0 : Math.min(ny, s.type.maxLayers); // layer-limited items stay on the floor
            if (s.type.onTop === false) { if (onTopOf) continue; ny = Math.min(ny, 1); } // floor only: may not sit on other cargo
            if (ny <= 0) continue;
            // one column (nd deep x ny high), possibly several across in the same width if cw allows (handled by outer loop)
            let n = Math.min(nd * ny, n0);
            // weight limit
            while (n > 0 && !canAdd(s, n)) n--;
            if (n <= 0) continue;
            const used = n * o.d * o.w * o.h;
            const score = used / (dd * o.w * ch) + (o.w / cw) * 0.02 + (s.type.kg > 0 ? 0 : 0);
            if (!best || score > best.score + 1e-9 || (Math.abs(score - best.score) < 1e-9 && o.w > best.o.w)) best = { s, o, nd, ny, n, score };
          }
        }
        return best;
      }

      function placeColumn(b, z0, y0) {
        // fill depth first (x), then height (y)
        const { s, o, nd } = b;
        let n = b.n, k = 0, rows = 0;
        const layers = Math.ceil(n / nd);
        for (let iy = 0; iy < layers && n > 0; iy++) {
          for (let ix = 0; ix < nd && n > 0; ix++) {
            placed.push({ type: s.type, x: x0 + ix * o.d, y: y0 + iy * o.h, z: z0, dx: o.d, dy: o.h, dz: o.w, upright: o.upright });
            n--; k++;
          }
          rows++;
        }
        left.set(s, left.get(s) - k);
        kgW += k * s.type.kg; vol += k * o.d * o.w * o.h;
        return { k, top: y0 + rows * o.h, fullTop: y0 + Math.floor(k / nd) * o.h, partial: k % nd !== 0 };
      }

      function doColumn(b) {
        const colW = b.o.w;
        const r = placeColumn(b, z, 0);
        blocks.push({ type: b.s.type, n: r.k, o: b.o, nd: b.nd });
        // top-up above a flat, stackable column
        if (!r.partial && b.s.type.stackable && r.fullTop < H - EPS) {
          const yTop = r.fullTop;
          const t = bestBlock(colW, H - yTop, true, b.nd * b.o.d);
          if (t) {
            let zz = z;
            while (zz + t.o.w <= z + colW + EPS && left.get(t.s) > 0) {
              let n = Math.min(t.nd * t.ny, left.get(t.s));
              while (n > 0 && !canAdd(t.s, n)) n--;
              if (n <= 0) break;
              const rr = placeColumn({ ...t, n }, zz, yTop);
              blocks.push({ type: t.s.type, n: rr.k, o: t.o, nd: t.nd, top: true });
              zz += t.o.w;
            }
          }
        }
        z += colW;
      }

      // 1) plan the column widths across the wall with a small knapsack (value = cargo volume per column)
      const tmpls = [];
      for (const st of stock) {
        if (left.get(st) <= 0) continue;
        for (const o of st.oris) {
          const b = bestBlock(W, H, false, 0, st, o);
          if (!b) continue;
          let v = b.n * o.d * o.w * o.h;
          if (b.s.type.stackable && b.n === b.nd * b.ny && b.ny * o.h < H - EPS) {
            const t = bestBlock(o.w, H - b.ny * o.h, true, b.nd * o.d);
            if (t) v += t.n * t.o.d * t.o.w * t.o.h * Math.floor((o.w + EPS) / t.o.w);
          }
          if (lead && st === lead) v *= 3;
          tmpls.push({ st, o, wmm: Math.ceil(o.w * 10 - 1e-6), v });
        }
      }
      const Wmm = Math.floor(W * 10 + 1e-6);
      if (tmpls.length && tmpls.length * Wmm < 4e6) {
        const best = new Float64Array(Wmm + 1), pick = new Int32Array(Wmm + 1).fill(-1);
        for (let c = 1; c <= Wmm; c++) {
          best[c] = best[c - 1]; pick[c] = -1;
          for (let i = 0; i < tmpls.length; i++) {
            const t = tmpls[i];
            if (t.wmm <= c && best[c - t.wmm] + t.v > best[c] + 1e-9) { best[c] = best[c - t.wmm] + t.v; pick[c] = i; }
          }
        }
        const seq = [];
        for (let c = Wmm; c > 0;) { if (pick[c] < 0) { c--; continue; } seq.push(tmpls[pick[c]]); c -= tmpls[pick[c]].wmm; }
        seq.sort((a, b) => (b.st === lead) - (a.st === lead) || b.o.w - a.o.w);
        for (const t of seq) {
          if (z >= W - EPS) break;
          const b = bestBlock(W - z, H, false, 0, t.st, t.o);
          if (b) doColumn(b);
        }
      }
      // 2) greedy fill of any width left over
      while (z < W - EPS) {
        const cw = W - z;
        const b = (lead && left.get(lead) > 0 && bestBlock(cw, H, false, 0, lead)) || bestBlock(cw, H, false);
        if (!b) break;
        doColumn(b);
      }
      if (!dry) {
        for (const s of stock) s.left = left.get(s);
        kg += kgW;
        for (const p of placed) boxes.push(p);
      }
      const leadVol = lead ? placed.filter((p) => p.type === lead.type).reduce((a, p) => a + p.dx * p.dy * p.dz, 0) : 0;
      return { vol, n: placed.length, placed, blocks, kgW, leadVol };
    }

    let guard = 0;
    while (x < L - EPS && guard++ < 2000) {
      const avail = live();
      if (!avail.length || kg >= maxKg - EPS) break;
      // candidate depths: depths of orientations of the lead items (largest unit volume first), limited to length left
      const cands = new Set();
      const strat = (opts && opts.strategy) || 'dense';
      let sorted = avail.slice().sort((a, b) => b.unitVol - a.unitVol);
      if (strat === 'hard') sorted = avail.slice().sort((a, b) => ((a.type.stackable && !a.type.maxLayers) - (b.type.stackable && !b.type.maxLayers)) || (b.unitVol - a.unitVol));
      const leadN = strat === 'dense' ? 3 : 1;
      const lead = strat === 'dense' ? null : sorted[0];
      for (const s of sorted.slice(0, leadN)) for (const o of s.oris) if (o.d <= L - x + EPS) cands.add(o.d);
      if (!cands.size) {
        for (const s of avail) for (const o of s.oris) if (o.d <= L - x + EPS) cands.add(o.d);
        if (!cands.size) break;
      }
      let best = null;
      for (const d of cands) {
        const r = fillWall(d, x, true, lead);
        if (!r.n) continue;
        const dens = r.vol / (d * W * H);
        // prefer dense walls; small bonus for walls that place the biggest items
        const score = (lead ? (r.leadVol / d) / (W * H) * 10 : 0) + dens + 0.0001 * r.n;
        if (!best || score > best.score) best = { d, score };
      }
      if (!best) break;
      const r = fillWall(best.d, x, false, lead);
      walls.push({ x0: x, d: best.d, from: boxes.length - r.n, to: boxes.length, blocks: r.blocks, kg: r.kgW });
      // compact: real depth used by this wall
      let maxX = x;
      for (let i = boxes.length - r.n; i < boxes.length; i++) maxX = Math.max(maxX, boxes[i].x + boxes[i].dx);
      x = maxX;
    }
    const vol = boxes.reduce((a, b) => a + b.dx * b.dy * b.dz, 0);
    return { boxes, walls, kg, vol };
  }

  /** Plan: items [{name,l,w,h,qty,kg,upright,stackable,maxLayers,color}], equipment id or object. */
  function plan(items, eqIn, opts = {}) {
    if (!opts.strategy) {
      let best = null;
      for (const strategy of ['dense', 'big', 'hard']) {
        const r = plan(items, eqIn, { ...opts, strategy });
        const key = [r.totalBoxes, -r.units.length, r.units.reduce((a, u) => a + u.util * u.util, 0)];
        if (!best || key[0] > best.key[0] || (key[0] === best.key[0] && (key[1] > best.key[1] || (key[1] === best.key[1] && key[2] > best.key[2] + 1e-9)))) best = { r, key };
      }
      return best.r;
    }
    const eq = typeof eqIn === 'string' ? EQUIPMENT.find((e) => e.id === eqIn) : eqIn;
    const types = items.map((it, i) => ({ ...it, idx: i, kg: +it.kg || 0 }));
    const stock = types.filter((t) => t.qty > 0 && t.l > 0 && t.w > 0 && t.h > 0).map((t) => ({
      type: t, left: Math.floor(t.qty), oris: orientations(t), unitVol: t.l * t.w * t.h
    }));
    // items that can never fit
    const tooBig = [];
    for (const s of stock) {
      s.oris = s.oris.filter((o) => o.d <= eq.L + EPS && o.w <= eq.W + EPS && o.h <= eq.H + EPS);
      if (!s.oris.length || s.type.kg > eq.maxKg) { tooBig.push({ type: s.type, n: s.left, why: !s.oris.length ? 'too large for this equipment' : 'heavier than the payload limit' }); s.left = 0; }
    }
    const units = [];
    let guard = 0;
    while (stock.some((s) => s.left > 0) && guard++ < (opts.maxUnits || 200)) {
      const before = stock.reduce((a, s) => a + s.left, 0);
      const u = packOne(eq, stock, opts);
      if (!u.boxes.length) break;
      units.push(u);
      if (stock.reduce((a, s) => a + s.left, 0) === before) break;
    }
    const notPlaced = stock.filter((s) => s.left > 0).map((s) => ({ type: s.type, n: s.left, why: 'limit of units reached' }));
    units.forEach((u, i) => finalize(u, eq, i));
    return { eq, strategy: opts.strategy, units, tooBig, notPlaced, totalBoxes: units.reduce((a, u) => a + u.boxes.length, 0) };
  }

  function finalize(u, eq, i) {
    const cap = eq.L * eq.W * eq.H;
    u.eq = eq; u.index = i;
    u.util = u.vol / cap;
    u.kgUtil = u.kg / eq.maxKg;
    const m = u.boxes.reduce((a, b) => a + b.type.kg, 0);
    u.cogX = m > 0 ? u.boxes.reduce((a, b) => a + b.type.kg * (b.x + b.dx / 2), 0) / m / eq.L : 0.5;
    u.cogZ = m > 0 ? u.boxes.reduce((a, b) => a + b.type.kg * (b.z + b.dz / 2), 0) / m / eq.W : 0.5;
    u.counts = {};
    for (const b of u.boxes) u.counts[b.type.idx] = (u.counts[b.type.idx] || 0) + 1;
    u.usedL = u.boxes.reduce((a, b) => Math.max(a, b.x + b.dx), 0);
    return u;
  }

  /** Choose the best mix of equipment. cands = [{eq, cost}]. Fills unit by unit:
      if everything left fits in one unit, take the cheapest that does; otherwise take the unit
      that moves the largest share of the remaining volume or weight per unit of cost. */
  function planMix(items, cands, opts = {}) {
    const types = items.map((it, i) => ({ ...it, idx: i, kg: +it.kg || 0 }));
    const stock = types.filter((t) => t.qty > 0 && t.l > 0 && t.w > 0 && t.h > 0).map((t) => ({
      type: t, left: Math.floor(t.qty), oris: orientations(t), unitVol: t.l * t.w * t.h
    }));
    const tooBig = [];
    for (const s of stock) {
      const fitsSome = cands.some(({ eq }) => s.oris.some((o) => o.d <= eq.L + EPS && o.w <= eq.W + EPS && o.h <= eq.H + EPS) && s.type.kg <= eq.maxKg);
      if (!fitsSome) { tooBig.push({ type: s.type, n: s.left, why: 'too large or too heavy for any of these units' }); s.left = 0; }
    }
    const snap = () => stock.map((x) => x.left);
    const restore = (v) => stock.forEach((x, i) => { x.left = v[i]; });
    const units = [];
    let guard = 0;
    while (stock.some((x) => x.left > 0) && guard++ < (opts.maxUnits || 200)) {
      const before = snap();
      const remVol = stock.reduce((a, x) => a + x.left * x.unitVol, 0);
      const remKg = stock.reduce((a, x) => a + x.left * x.type.kg, 0);
      let best = null;
      for (const c of cands) {
        for (const strategy of ['dense', 'big', 'hard']) {
          restore(before);
          const u = packOne(c.eq, stock, { strategy });
          if (!u.boxes.length) continue;
          const all = stock.every((x) => x.left === 0);
          const share = Math.max(u.vol / Math.max(1, remVol), remKg > 0 ? u.kg / remKg : 0);
          const score = all ? 10 + 1 / c.cost : share / c.cost;
          if (!best || score > best.score + 1e-9) best = { c, strategy, score };
        }
      }
      restore(before);
      if (!best) break;
      const u = packOne(best.c.eq, stock, { strategy: best.strategy });
      units.push(finalize(u, best.c.eq, units.length));
    }
    const notPlaced = stock.filter((x) => x.left > 0).map((x) => ({ type: x.type, n: x.left, why: 'limit of units reached' }));
    return { mix: true, eq: units[0] ? units[0].eq : cands[0].eq, units, tooBig, notPlaced, totalBoxes: units.reduce((a, u) => a + u.boxes.length, 0),
      cost: units.reduce((a, u) => a + cands.find((c) => c.eq === u.eq).cost, 0) };
  }

  /** Group walls into loading steps; identical consecutive walls merge into one step. */
  function steps(unit) {
    const sig = (w) => w.blocks.map((b) => b.type.idx + ':' + b.n + ':' + b.o.d + 'x' + b.o.w + 'x' + b.o.h + (b.top ? 't' : '')).join('|');
    const out = [];
    for (const w of unit.walls) {
      const s = sig(w);
      const last = out[out.length - 1];
      if (last && last.sig === s) { last.walls.push(w); last.to = w.to; last.x1 = w.x0 + w.d; }
      else out.push({ sig: s, walls: [w], from: w.from, to: w.to, x0: w.x0, x1: w.x0 + w.d });
    }
    // summarise block counts per type/orientation in each step
    for (const st of out) {
      const m = new Map();
      for (const w of st.walls) for (const b of w.blocks) {
        const k = b.type.idx + '|' + b.o.d + '|' + b.o.w + '|' + b.o.h + '|' + (b.top ? 1 : 0);
        const e = m.get(k) || { type: b.type, o: b.o, top: !!b.top, n: 0, cols: 0 };
        e.n += b.n; e.cols++; m.set(k, e);
      }
      st.parts = [...m.values()];
      st.n = st.to - st.from;
    }
    return out;
  }

  const api = { EQUIPMENT, plan, planMix, steps, orientations };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LPEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
