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
    ['Pallets & air ULDs', 'pag-md', 'PAG air pallet – main deck (244 cm)', 307, 213, 244, 6000, 0, 0, 'Usable base inside the net. The aircraft contour is not modelled, so confirm with the airline.'],
    ['Pallets & air ULDs', 'ake', 'AKE / LD3 air container', 150, 147, 157, 1500, 0, 0, 'Planned on the rectangular base inside the container. The sloped side adds a little space that is not used here. Confirm the load with the airline.'],
    ['Pallets & air ULDs', 'akh', 'AKH / LD3-45 air container (narrow-body)', 150, 147, 108, 1060, 0, 0, 'Low container for A320-family aircraft. Planned on the rectangular base inside. Confirm the load with the airline.'],
    ['Pallets & air ULDs', 'ld7', 'LD7 / P1P contoured air container', 307, 213, 157, 4400, 0, 0, 'Planned on the rectangular base inside. The contoured top adds space that is not used here. Confirm the load with the airline.'],
    ['Trucks & trailers', 'in20', 'India 20 ft closed body truck', 610, 213, 213, 7000, 213, 213, 'Typical inner size. Body sizes vary by builder, so check the truck sent. Payload depends on the vehicle registration.'],
    ['Trucks & trailers', 'in24', 'India 24 ft closed body truck', 732, 229, 229, 9000, 229, 229, 'Typical inner size. Body sizes vary by builder, so check the truck sent. Payload depends on the vehicle registration.'],
    ['Trucks & trailers', 'in32s', 'India 32 ft container truck, single axle (SXL)', 975, 236, 244, 7000, 236, 244, 'Typical inner size. Single-axle 32 ft trucks carry light, bulky cargo. Payload depends on the vehicle registration.'],
    ['Trucks & trailers', 'in32m', 'India 32 ft container truck, multi-axle (MXL)', 975, 236, 244, 15000, 236, 244, 'Typical inner size. Payload depends on the vehicle registration and the state rules for axle loads.'],
    ['Trucks & trailers', 'eu136', 'EU 13.6 m curtainsider trailer', 1360, 248, 270, 24000, 248, 270, 'Typical standard trailer. Mega trailers are up to 300 cm high inside.'],
    ['Trucks & trailers', 'us53', 'US 53 ft dry van trailer', 1600, 249, 270, 20400, 249, 265, 'Typical inner size. Road weight limits in the US are by axle and state.']
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
    if (opts && /^ep/.test(opts.strategy || '')) return packEP(eq, stock, opts);
    const L = eq.L, W = eq.W, H = eq.H, maxKg = eq.maxKg;
    const boxes = [], walls = [];
    let x = 0, kg = 0;
    const saved = stock.map((s) => s.oris);
    for (const s of stock) s.oris = fitOris(s.allOris || s.oris, eq);
    // loading priority: 'rear' items go in first (against the front wall), 'door' items last (at the doors)
    const phaseOf = (s) => (s.type.prio === 'rear' ? 0 : s.type.prio === 'door' ? 2 : 1);
    let phase = 0, pool = stock;
    const live = () => stock.filter((s) => s.left > 0 && s.oris.length && phaseOf(s) === phase);

    // Fill one wall slice of depth d starting at x0; dryRun = evaluate only
    function fillWall(d, x0, dry, lead, forced) {
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
        for (const s of (only ? [only] : pool)) {
          const n0 = left.get(s);
          if (n0 <= 0) continue;
          for (const o of (onlyO ? [onlyO] : s.oris)) {
            if (o.d > dd + EPS || o.w > cw + EPS || o.h > ch + EPS) continue;
            const nd = Math.floor((dd + EPS) / o.d);
            let ny = Math.floor((ch + EPS) / o.h);
            if (!s.type.stackable) ny = Math.min(ny, 1);
            if (s.type.maxLayers > 0) ny = onTopOf ? 0 : Math.min(ny, s.type.maxLayers); // layer-limited items stay on the floor
            if (s.type.onTop === false) { if (onTopOf) continue; ny = Math.min(ny, 1); } // floor only: may not sit on other cargo
            // never put heavier cargo on lighter cargo (compare load per square cm; light loads under 80 kg/m² are always fine)
            if (onTopOf && onTopOf.kg != null && s.type.kg > 25 && s.type.kg / (o.d * o.w) > Math.max(1.25 * onTopOf.kg / onTopOf.a, 0.008) + EPS) continue; // 0.008 kg/cm² = 80 kg/m²: light enough for any carton
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
        return { k, rows, top: y0 + rows * o.h, fullTop: y0 + Math.floor(k / nd) * o.h, partial: k % nd !== 0 };
      }

      function doColumn(b) {
        const colW = b.o.w;
        const i0 = placed.length;
        const r = placeColumn(b, z, 0);
        blocks.push({ type: b.s.type, n: r.k, o: b.o, nd: b.nd, rows: r.rows, i0, z0: z, dz: b.o.w, y0: 0 });
        // top-up above a flat, stackable column
        if (!r.partial && b.s.type.stackable && r.fullTop < H - EPS) {
          const yTop = r.fullTop;
          const t = bestBlock(colW, H - yTop, { kg: b.s.type.kg, a: b.o.d * b.o.w }, b.nd * b.o.d);
          if (t) {
            let zz = z;
            while (zz + t.o.w <= z + colW + EPS && left.get(t.s) > 0) {
              let n = Math.min(t.nd * t.ny, left.get(t.s));
              while (n > 0 && !canAdd(t.s, n)) n--;
              if (n <= 0) break;
              const i1 = placed.length;
              const rr = placeColumn({ ...t, n }, zz, yTop);
              blocks.push({ type: t.s.type, n: rr.k, o: t.o, nd: t.nd, rows: rr.rows, top: true, i0: i1, z0: zz, dz: t.o.w, y0: yTop });
              zz += t.o.w;
            }
          }
        }
        z += colW;
      }

      // 0) long pieces (that only fit lengthways) go in first, so they are never left over for a wall too short for them
      if (forced && forced.length) {
        for (const st of forced) {
          while (z < W - EPS && left.get(st) > 0) {
            const b = bestBlock(W - z, H, false, 0, st);
            if (!b) break;
            doColumn(b);
          }
        }
      }
      // 1) plan the column widths across the wall with a small knapsack (value = cargo volume per column)
      const tmpls = [];
      for (const st of pool) {
        if (left.get(st) <= 0) continue;
        for (const o of st.oris) {
          const b = bestBlock(W, H, false, 0, st, o);
          if (!b) continue;
          let v = b.n * o.d * o.w * o.h;
          if (b.s.type.stackable && b.n === b.nd * b.ny && b.ny * o.h < H - EPS) {
            const t = bestBlock(o.w, H - b.ny * o.h, { kg: st.type.kg, a: o.d * o.w }, b.nd * o.d);
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
      if (kg >= maxKg - EPS) break;
      const avail = live();
      if (!avail.length) { if (phase < 2) { phase++; continue; } break; }
      pool = avail;
      // candidate depths: depths of orientations of the lead items (largest unit volume first), limited to length left
      const cands = new Set();
      const strat = (opts && opts.strategy) || 'dense';
      let sorted = avail.slice().sort((a, b) => b.unitVol - a.unitVol);
      if (strat === 'hard') sorted = avail.slice().sort((a, b) => ((a.type.stackable && !a.type.maxLayers) - (b.type.stackable && !b.type.maxLayers)) || (b.unitVol - a.unitVol));
      const leadN = strat === 'wide' || strat === 'long' ? 99 : strat === 'dense' ? 3 : 1;
      const lead = strat === 'dense' || strat === 'wide' || strat === 'long' ? null : sorted[0];
      for (const s of sorted.slice(0, leadN)) for (const o of s.oris) if (o.d <= L - x + EPS) cands.add(o.d);
      if (!cands.size) {
        for (const s of avail) for (const o of s.oris) if (o.d <= L - x + EPS) cands.add(o.d);
        if (!cands.size) break;
      }
      // 'long' strategy: pieces that can only lie lengthways and need a deep wall are loaded first
      let forced = null;
      if (strat === 'long') {
        const minD = (s) => Math.min(...s.oris.map((o) => o.d));
        forced = avail.filter((s) => minD(s) >= 0.35 * L && minD(s) <= L - x + EPS).sort((a, b) => minD(b) - minD(a));
        if (forced.length) { cands.clear(); cands.add(minD(forced[0])); }
      }
      let best = null;
      for (const d of cands) {
        const r = fillWall(d, x, true, lead, forced);
        if (!r.n) continue;
        const dens = r.vol / (d * W * H);
        // prefer dense walls; small bonus for walls that place the biggest items
        const score = (lead ? (r.leadVol / d) / (W * H) * 10 : 0) + dens + 0.0001 * r.n;
        if (!best || score > best.score) best = { d, score };
      }
      if (!best) { if (phase < 2) { phase++; continue; } break; }
      const r = fillWall(best.d, x, false, lead, forced);
      walls.push({ x0: x, d: best.d, from: boxes.length - r.n, to: boxes.length, blocks: r.blocks, kg: r.kgW });
      // compact: real depth used by this wall
      let maxX = x;
      for (let i = boxes.length - r.n; i < boxes.length; i++) maxX = Math.max(maxX, boxes[i].x + boxes[i].dx);
      x = maxX;
    }
    kg = fillHoles(eq, stock, boxes, walls, kg);
    stock.forEach((s, i) => { s.oris = saved[i]; });
    const vol = boxes.reduce((a, b) => a + b.dx * b.dy * b.dz, 0);
    return { boxes, walls, kg, vol };
  }

  /** Second pass: put pieces that are left over into the empty spaces between and above the walls
      (corner-point search, full support underneath, heavier never on lighter). Each piece joins the loading
      step of the wall it sits in (or of the cargo it rests on, if that is loaded later), so the loading order stays real. */
  function fillHoles(eq, stock, boxes, walls, kg) {
    const L = eq.L, W = eq.W, H = eq.H;
    const rem = stock.filter((s) => s.left > 0 && s.oris.length && s.type.kg <= eq.maxKg);
    if (!rem.length || !walls.length || rem.reduce((a, s) => a + s.left, 0) > 80 || boxes.length > 1500) return kg;
    const wallOf = new Int32Array(boxes.length + 200);
    walls.forEach((w, k) => { for (let i = w.from; i < w.to; i++) wallOf[i] = k; });
    const all = boxes.slice(), extra = walls.map(() => []);
    let pts = [[0, 0, 0]];
    const addPts = (b) => { pts.push([b.x + b.dx, b.y, b.z], [b.x, b.y + b.dy, b.z], [b.x, b.y, b.z + b.dz]); };
    for (const b of all) addPts(b);
    const overlaps = (x, y, z, d, h, w) => {
      for (const b of all) if (x < b.x + b.dx - EPS && b.x < x + d - EPS && y < b.y + b.dy - EPS && b.y < y + h - EPS && z < b.z + b.dz - EPS && b.z < z + w - EPS) return true;
      return false;
    };
    rem.sort((a, b) => b.unitVol - a.unitVol);
    for (const s of rem) {
      const t = s.type;
      while (s.left > 0 && kg + t.kg <= eq.maxKg + EPS) {
        let best = null;
        for (const [px, py, pz] of pts) {
          if (best && px * 1e6 + py * 1e3 + pz >= best.key) continue;
          for (const o of s.oris) {
            if (px + o.d > L + EPS || py + o.h > H + EPS || pz + o.w > W + EPS) continue;
            let sup = [];
            if (py > EPS) {
              if (t.onTop === false || t.maxLayers > 0) continue;
              let area = 0, ok = true;
              for (const b of all) {
                if (Math.abs(b.y + b.dy - py) > 0.5) continue;
                const ox = Math.min(px + o.d, b.x + b.dx) - Math.max(px, b.x), oz = Math.min(pz + o.w, b.z + b.dz) - Math.max(pz, b.z);
                if (ox <= EPS || oz <= EPS) continue;
                if (!b.type.stackable || (t.kg > 25 && t.kg / (o.d * o.w) > Math.max(1.25 * b.type.kg / (b.dx * b.dz), 0.008) + EPS)) { ok = false; break; }
                area += ox * oz; sup.push(b);
              }
              if (!ok || area < 0.8 * o.d * o.w - EPS) continue;
            }
            if (overlaps(px, py, pz, o.d, o.h, o.w)) continue;
            best = { key: px * 1e6 + py * 1e3 + pz, x: px, y: py, z: pz, o, sup };
            break;
          }
        }
        if (!best) break;
        const o = best.o;
        const box = { type: t, x: best.x, y: best.y, z: best.z, dx: o.d, dy: o.h, dz: o.w, upright: o.upright };
        // the loading step: the wall where it stands, or later if it rests on cargo of a later wall
        let k = 0;
        for (let j = 0; j < walls.length; j++) if (walls[j].x0 <= box.x + EPS) k = j;
        for (const b of best.sup) { const bi = all.indexOf(b); if (bi >= 0 && bi < boxes.length) k = Math.max(k, wallOf[bi]); else if (b._wall != null) k = Math.max(k, b._wall); }
        box._wall = k;
        all.push(box); extra[k].push(box); addPts(box);
        s.left--; kg += t.kg;
      }
    }
    if (!extra.some((e) => e.length)) return kg;
    // rebuild the box list wall by wall, with the extra pieces at the end of their wall
    const out = [];
    walls.forEach((w, k) => {
      const own = boxes.slice(w.from, w.to), from = out.length;
      out.push(...own);
      for (const b of extra[k]) {
        w.blocks.push({ type: b.type, n: 1, o: { d: b.dx, w: b.dz, h: b.dy, upright: b.upright }, nd: 1, rows: 1, top: b.y > EPS, i0: out.length - from, z0: b.z, dz: b.dz, y0: b.y, fill: true });
        w.kg += b.type.kg;
        delete b._wall; out.push(b);
      }
      w.from = from; w.to = out.length;
    });
    boxes.length = 0; boxes.push(...out);
    return kg;
  }

  /** Corner-point packing, piece by piece (good for mixed cargo and long pieces). Pieces are taken in one of
      several orders (opts.strategy ep-vol / ep-len / ep-area / ep-h), each placed where it ends nearest the
      front wall, on the floor or fully supported. The loading order is then rebuilt so that every piece is
      reachable from the doors and never loaded before the cargo it stands on. */
  function packEP(eq, stock, opts) {
    const L = eq.L, W = eq.W, H = eq.H, maxKg = eq.maxKg;
    const saved = stock.map((s) => s.oris);
    for (const s of stock) s.oris = fitOris(s.allOris || s.oris, eq);
    const live = stock.filter((s) => s.left > 0 && s.oris.length);
    const mode = opts.strategy;
    const maxDim = (s) => Math.max(s.type.l, s.type.w, s.type.h);
    const key = {
      'ep-vol': (s) => s.unitVol,
      'ep-len': (s) => maxDim(s) * 1e7 + s.unitVol,
      'ep-area': (s) => Math.max(...s.oris.map((o) => o.d * o.w)) * 1e7 + s.unitVol,
      'ep-h': (s) => Math.min(...s.oris.map((o) => o.h)) * 1e7 + s.unitVol
    }[mode] || ((s) => s.unitVol);
    // optional seeded jitter, so several slightly different orders can be tried and the best one kept
    let seed = opts.seed || 0;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const jit = new Map(stock.map((s) => [s, opts.jit ? (opts.jit[s.type.idx] || 1) : opts.seed ? 1 + (rnd() - 0.5) * 0.3 : 1]));
    if (opts.jitOut) stock.forEach((s) => { opts.jitOut[s.type.idx] = jit.get(s); });
    // load-order phases first ('rear' items at the front wall, 'door' items last), then heavy floor-only cargo, then the chosen order
    const ph = (s) => (s.type.prio === 'rear' ? 0 : s.type.prio === 'door' ? 2 : 1);
    // pieces that only fit lengthways and are long go in first, before the space they need is cut up
    const isLong = (s) => Math.min(...s.oris.map((o) => o.d)) >= 0.35 * L;
    live.sort((a, b) => ph(a) - ph(b) || (isLong(b) - isLong(a)) || ((b.type.onTop === false) - (a.type.onTop === false)) || key(b) * jit.get(b) - key(a) * jit.get(a));
    const boxes = [];
    let kg = 0;
    let pts = [[0, 0, 0]];
    // boxes indexed by 25 cm slices along the length, so overlap and support checks only look nearby
    const BS = 25, nb = Math.ceil(L / BS) + 1, bins = Array.from({ length: nb }, () => []);
    let stamp = 0; const tmp = [];
    const near = (x0, x1) => { const a = Math.max(0, Math.floor(x0 / BS)), c = Math.min(nb - 1, Math.floor((x1 - EPS) / BS)); if (a === c) return bins[a]; stamp++; tmp.length = 0; for (let k = a; k <= c; k++) for (const b of bins[k]) if (b._st !== stamp) { b._st = stamp; tmp.push(b); } return tmp; };
    const index = (b) => { const a = Math.max(0, Math.floor(b.x / BS)), c = Math.min(nb - 1, Math.floor((b.x + b.dx - EPS) / BS)); for (let k = a; k <= c; k++) bins[k].push(b); };
    const free = (x, y, z, d, h, w) => {
      // look straight in the slices the piece covers (no de-duplication needed to find an overlap)
      const a = Math.max(0, Math.floor(x / BS)), c = Math.min(nb - 1, Math.floor((x + d - EPS) / BS));
      for (let k = a; k <= c; k++) {
        const bin = bins[k];
        for (let i = 0; i < bin.length; i++) {
          const b = bin[i];
          if (x < b.x + b.dx - EPS && b.x < x + d - EPS && y < b.y + b.dy - EPS && b.y < y + h - EPS && z < b.z + b.dz - EPS && b.z < z + w - EPS) return false;
        }
      }
      return true;
    };
    const supportOk = (t, x, y, z, o) => {
      if (y < EPS) return true;
      if (t.onTop === false || t.maxLayers > 0) return false;
      let area = 0;
      for (const b of near(x, x + o.d)) {
        if (Math.abs(b.y + b.dy - y) > 0.5) continue;
        const ox = Math.min(x + o.d, b.x + b.dx) - Math.max(x, b.x), oz = Math.min(z + o.w, b.z + b.dz) - Math.max(z, b.z);
        if (ox <= EPS || oz <= EPS) continue;
        if (!b.type.stackable) return false;
        if (t.kg > 25 && t.kg / (o.d * o.w) > Math.max(1.25 * b.type.kg / (b.dx * b.dz), 0.008) + EPS) return false;
        area += ox * oz;
      }
      return area >= 0.8 * o.d * o.w - EPS;
    };
    // after packing: the pieces at the very back (with nothing on top of them) are moved into any gap further
    // forward where they fit and are fully supported, as long as that shortens the load
    const unindex = (b) => { for (const bin of bins) { const i = bin.indexOf(b); if (i >= 0) bin.splice(i, 1); } };
    const hasOnTop = (b) => near(b.x, b.x + b.dx).some((q) => q !== b && Math.abs(q.y - (b.y + b.dy)) < 0.5 && Math.min(b.x + b.dx, q.x + q.dx) - Math.max(b.x, q.x) > EPS && Math.min(b.z + b.dz, q.z + q.dz) - Math.max(b.z, q.z) > EPS);
    function compactTail() {
      for (let round = 0; round < 60; round++) {
        let end = 0;
        for (const b of boxes) end = Math.max(end, b.x + b.dx);
        const back = boxes.filter((b) => b.x + b.dx > end - EPS);
        if (back.some(hasOnTop)) return;
        let moved = 0;
        for (const b of back) {
          unindex(b);
          const st = stock.find((q) => q.type === b.type);
          const oris = st ? st.oris : [{ d: b.dx, w: b.dz, h: b.dy, upright: b.upright }];
          const cps = [[0, 0, 0]];
          for (const q of boxes) if (q !== b) cps.push([q.x + q.dx, q.y, q.z], [q.x, q.y + q.dy, q.z], [q.x, q.y, q.z + q.dz], [q.x + q.dx, 0, q.z], [q.x, 0, q.z + q.dz]);
          let best = null;
          for (const [px, py, pz] of cps) for (const o of oris) {
            const e = px + o.d;
            if (e > end - 1 || py + o.h > H + EPS || pz + o.w > W + EPS) continue;
            const sc = e * 1e6 + py * 1e3 + pz;
            if (best && sc >= best.sc) continue;
            if (!free(px, py, pz, o.d, o.h, o.w) || !supportOk(b.type, px, py, pz, o)) continue;
            best = { sc, px, py, pz, o };
          }
          if (best) { b.x = best.px; b.y = best.py; b.z = best.pz; b.dx = best.o.d; b.dy = best.o.h; b.dz = best.o.w; b.upright = best.o.upright; moved++; }
          index(b);
        }
        if (moved < back.length) return;
      }
    }
    let fails = 0;
    for (const s of live) {
      const t = s.type;
      while (s.left > 0) {
        if (kg + t.kg > maxKg + EPS) break;
        let best = null;
        const minD = s.minD || (s.minD = Math.min(...s.oris.map((o) => o.d)));
        for (const [px, py, pz] of pts) {
          // points are sorted along the length: once no orientation can beat the best, stop looking
          if (best && (opts.front ? px * 1e6 : (px + minD) * 1e6) > best.sc) break;
          for (const o of s.oris) {
            const end = px + o.d;
            if (end > L + EPS || py + o.h > H + EPS || pz + o.w > W + EPS) continue;
            // score: how far the piece reaches towards the doors, then height, then across
            const sc = opts.front ? px * 1e6 + py * 1e3 + pz + end * 1e-3 : opts.low ? end * 1e6 + py * 1e3 + pz : end * 1e6 + (py + o.h) * 1e3 + pz;
            if (best && sc >= best.sc) continue;
            if (!free(px, py, pz, o.d, o.h, o.w) || !supportOk(t, px, py, pz, o)) continue;
            best = { sc, x: px, y: py, z: pz, o };
          }
        }
        if (!best) { fails++; break; }
        const o = best.o, b = { type: t, x: best.x, y: best.y, z: best.z, dx: o.d, dy: o.h, dz: o.w, upright: o.upright };
        boxes.push(b); index(b); s.left--; kg += t.kg;
        pts.push([b.x + b.dx, b.y, b.z], [b.x, b.y + b.dy, b.z], [b.x, b.y, b.z + b.dz]);
        if (opts.proj) { // also the same corners dropped to the floor / cargo below and slid to the side wall
          const down = (x, y, z) => { let t = 0; for (const q of near(x, x + 1)) if (q.y + q.dy <= y + EPS && x >= q.x - EPS && x < q.x + q.dx - EPS && z >= q.z - EPS && z < q.z + q.dz - EPS) t = Math.max(t, q.y + q.dy); return t; };
          const side = (x, y, z) => { let t = 0; for (const q of near(x, x + 1)) if (q.z + q.dz <= z + EPS && x >= q.x - EPS && x < q.x + q.dx - EPS && y >= q.y - EPS && y < q.y + q.dy - EPS) t = Math.max(t, q.z + q.dz); return t; };
          for (const [x, y, z] of [[b.x + b.dx, b.y, b.z], [b.x, b.y, b.z + b.dz], [b.x + b.dx, b.y, b.z]]) { pts.push([x, down(x, y, z), z]); pts.push([x, y, side(x, y, z)]); }
        }
        // drop points that are now inside a piece or outside the space
        if (pts.length > 60) { const seen = new Set(); pts = pts.filter(([x, y, z]) => { const k = (Math.round(x * 10) * 30000 + Math.round(y * 10)) * 30000 + Math.round(z * 10); if (seen.has(k)) return false; seen.add(k); return true; }); }
        if (pts.length > 60) pts = pts.filter(([x, y, z]) => x < L - EPS && y < H - EPS && z < W - EPS && !near(x, x + 1).some((q) => x >= q.x - EPS && x < q.x + q.dx - EPS && y >= q.y - EPS && y < q.y + q.dy - EPS && z >= q.z - EPS && z < q.z + q.dz - EPS));
        pts.sort((a, c) => a[0] - c[0] || a[1] - c[1] || a[2] - c[2]);
      }
    }
    if (opts.tail !== false) compactTail();
    const { ordered, walls } = epSteps(boxes, L);
    for (const b of ordered) delete b._st;
    stock.forEach((s, i) => { s.oris = saved[i]; });
    const vol = ordered.reduce((a, b) => a + b.dx * b.dy * b.dz, 0);
    return { boxes: ordered, walls, kg, vol };
  }

  /** Loading steps for a piece-by-piece plan. The crew always works from the front wall (the far end) towards the
      doors and from the floor up: a piece is never loaded after anything it stands on, and never after a piece
      that sits between it and the doors in its way (overlapping it seen from the doors). Within those rules the
      deepest reachable pieces go first; pieces of the same kind next to each other are loaded together.
      Returns the boxes in loading order and one "wall" per section of about 1.2 m, with one block per group. */
  function epSteps(boxes, L) {
    const n = boxes.length;
    if (!n) return { ordered: [], walls: [] };
    const SEC = 120, BAND = 45;
    const ov = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) > EPS;
    // what must be loaded before each piece: what it stands on, and the deeper pieces it would block
    const need = boxes.map(() => []);
    for (let i = 0; i < n; i++) {
      const b = boxes[i];
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const q = boxes[j];
        if (!ov(b.z, b.z + b.dz, q.z, q.z + q.dz)) continue;
        const onIt = b.y > EPS && Math.abs(q.y + q.dy - b.y) < 0.5 && ov(b.x, b.x + b.dx, q.x, q.x + q.dx);
        const deeper = q.x + q.dx <= b.x + EPS && ov(b.y, b.y + b.dy, q.y, q.y + q.dy);
        if (onIt || deeper) need[i].push(j);
      }
    }
    const left = new Int32Array(n); need.forEach((a, i) => { left[i] = a.length; });
    const after = boxes.map(() => []); need.forEach((a, i) => a.forEach((j) => after[j].push(i)));
    const kind = (b) => b.type.idx + '|' + b.dx + '|' + b.dy + '|' + b.dz;
    const done = new Uint8Array(n), order = [];
    let ready = []; for (let i = 0; i < n; i++) if (!left[i]) ready.push(i);
    let last = null;
    while (order.length < n) {
      if (!ready.length) { // cannot happen with a valid plan; fall back to the deepest piece left
        let k = -1; for (let i = 0; i < n; i++) if (!done[i] && (k < 0 || boxes[i].x < boxes[k].x)) k = i;
        ready.push(k);
      }
      // only pieces near the deepest reachable one are candidates, so the load never jumps back
      let xmin = Infinity; for (const i of ready) xmin = Math.min(xmin, boxes[i].x);
      let pick = -1, pk = null;
      for (const i of ready) {
        const b = boxes[i];
        if (b.x > xmin + BAND) continue;
        const k = [last && kind(b) === kind(last) ? 0 : 1, Math.round(b.y), Math.round(b.x), Math.round(b.z)];
        if (!pk || k[0] < pk[0] || (k[0] === pk[0] && (k[1] < pk[1] || (k[1] === pk[1] && (k[2] < pk[2] || (k[2] === pk[2] && k[3] < pk[3])))))) { pick = i; pk = k; }
      }
      ready = ready.filter((i) => i !== pick);
      done[pick] = 1; order.push(pick); last = boxes[pick];
      for (const j of after[pick]) if (--left[j] === 0 && !done[j]) ready.push(j);
    }
    // sections (overview steps) and blocks (detailed steps)
    const ordered = [], walls = [];
    let wall = null, prev = null;
    for (const i of order) {
      const b = boxes[i];
      if (!wall || b.x >= wall.x0 + SEC) {
        wall = { x0: b.x, d: 0, from: ordered.length, to: ordered.length, blocks: [], kg: 0, ep: true };
        walls.push(wall); prev = null;
      }
      const blk = wall.blocks[wall.blocks.length - 1];
      if (blk && prev && kind(b) === kind(prev)) { blk.n++; blk._b.push(b); }
      else wall.blocks.push({ type: b.type, n: 1, o: { d: b.dx, w: b.dz, h: b.dy, upright: b.upright }, i0: ordered.length - wall.from, _b: [b] });
      ordered.push(b); wall.kg += b.type.kg; prev = b; wall.to = ordered.length;
      wall.x0 = Math.min(wall.x0, b.x); wall.d = Math.max(wall.d, b.x + b.dx - wall.x0);
    }
    for (const w of walls) for (const blk of w.blocks) {
      const bs = blk._b, cnt = (f) => new Set(bs.map((q) => Math.round(f(q)))).size;
      blk.nd = cnt((q) => q.x); blk.rows = cnt((q) => q.y); blk.top = bs[0].y > EPS;
      blk.z0 = Math.min(...bs.map((q) => q.z)); blk.dz = Math.max(...bs.map((q) => q.z + q.dz)) - blk.z0; blk.y0 = Math.min(...bs.map((q) => q.y));
      delete blk._b;
    }
    return { ordered, walls };
  }

  /** Orientations that fit inside the equipment and pass through its door (door opening = width x height at the rear end). */
  function fitOris(oris, eq) {
    return oris.filter((o) => o.d <= eq.L + EPS && o.w <= eq.W + EPS && o.h <= eq.H + EPS && (!eq.doorW || (o.w <= eq.doorW + EPS && o.h <= eq.doorH + EPS)));
  }
  function whyNot(s, eq) {
    if (s.type.kg > eq.maxKg) return 'heavier than the payload limit';
    const inside = s.oris.some((o) => o.d <= eq.L + EPS && o.w <= eq.W + EPS && o.h <= eq.H + EPS);
    return inside ? 'will not pass through the door opening (' + Math.round(eq.doorW) + ' × ' + Math.round(eq.doorH) + ' cm)' : 'too large for this equipment';
  }

  /** Plan: items [{name,l,w,h,qty,kg,upright,stackable,maxLayers,color}], equipment id or object. */
  function plan(items, eqIn, opts = {}) {
    if (!opts.strategy) {
      // try every method and keep the best: most packages placed, then fewest units, then the shortest load.
      // Wall-by-wall plans give simpler loading steps, so a piece-by-piece plan must save real length to win.
      const eq0 = typeof eqIn === 'string' ? EQUIPMENT.find((e) => e.id === eqIn) : eqIn;
      const pcs = items.reduce((a, it) => a + (Math.floor(+it.qty) || 0), 0);
      let best = null;
      const consider = (r, ep) => {
        const len = r.units.reduce((a, u) => a + (u.usedL || 0) * (u.usedL ? 1 : 0), 0) + (ep ? 0.03 * eq0.L * r.units.length : 0);
        const key = [r.totalBoxes, -r.units.length, -len];
        if (!best || key[0] > best.key[0] || (key[0] === best.key[0] && (key[1] > best.key[1] || (key[1] === best.key[1] && key[2] > best.key[2] + 1e-9)))) best = { r, key };
      };
      for (const strategy of ['dense', 'wide', 'big', 'hard', 'long']) consider(plan(items, eqIn, { ...opts, strategy }), false);
      if (pcs <= (opts.epMax || 600) && !opts.noEP) {
        // piece-by-piece plans: four loading orders, a few random variations, then small changes to the best
        // order found so far (kept when the load gets shorter), until the time budget is used
        const t0 = Date.now(), budget = opts.budget == null ? 1500 : opts.budget;
        const epKey = (r) => r.units.length * 1e7 - r.totalBoxes * 1e4 + r.units.reduce((a, u) => a + (u.usedL || 0), 0);
        let top = null;
        const tryEP = (o) => {
          const jo = [], r = plan(items, eqIn, { ...opts, proj: 1, jitOut: jo, ...o });
          consider(r, true);
          const k = epKey(r);
          if (!top || k < top.k) top = { k, jit: jo, strategy: o.strategy };
        };
        for (const strategy of ['ep-h', 'ep-vol', 'ep-area', 'ep-len']) tryEP({ strategy });
        let rs = 987654321;
        const rnd = () => { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff; };
        for (let k = 1; k < 400 && Date.now() - t0 < budget; k++) {
          if (k <= 4) { tryEP({ strategy: k % 2 ? 'ep-h' : 'ep-vol', seed: k }); continue; }
          const j = top.jit.slice(), m = 1 + Math.floor(rnd() * 3);
          for (let q = 0; q < m; q++) { const i = Math.floor(rnd() * j.length); j[i] = (j[i] || 1) * (1 + (rnd() - 0.5) * 0.4); }
          tryEP({ strategy: top.strategy, jit: j });
        }
      }
      return best.r;
    }
    const eq = typeof eqIn === 'string' ? EQUIPMENT.find((e) => e.id === eqIn) : eqIn;
    const types = items.map((it, i) => ({ ...it, idx: i, kg: +it.kg || 0 }));
    const stock = types.filter((t) => t.qty > 0 && t.l > 0 && t.w > 0 && t.h > 0).map((t) => ({
      type: t, left: Math.floor(t.qty), oris: orientations(t), unitVol: t.l * t.w * t.h
    }));
    for (const s of stock) s.allOris = s.oris;
    // items that can never fit
    const tooBig = [];
    for (const s of stock) {
      const f = fitOris(s.oris, eq);
      if (!f.length || s.type.kg > eq.maxKg) { tooBig.push({ type: s.type, n: s.left, why: whyNot(s, eq) }); s.left = 0; }
      s.oris = f;
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
    const F = eq.full || eq;
    const cap = F.L * F.W * F.H;
    u.eq = eq; u.index = i;
    // drums and rolls take a square space but hold only pi/4 of it
    u.vol = u.boxes.reduce((a, b) => a + b.dx * b.dy * b.dz * (b.type.shape === 'drum' ? Math.PI / 4 : 1), 0);
    u.util = u.vol / cap;
    u.kgUtil = u.kg / eq.maxKg;
    const m = u.boxes.reduce((a, b) => a + b.type.kg, 0);
    u.cogX = m > 0 ? u.boxes.reduce((a, b) => a + b.type.kg * (b.x + b.dx / 2), 0) / m / eq.L : 0.5;
    u.cogZ = m > 0 ? u.boxes.reduce((a, b) => a + b.type.kg * (b.z + b.dz / 2), 0) / m / eq.W : 0.5;
    u.counts = {};
    for (const b of u.boxes) u.counts[b.type.idx] = (u.counts[b.type.idx] || 0) + 1;
    u.usedL = u.boxes.reduce((a, b) => Math.max(a, b.x + b.dx), 0);
    u.usedW = u.boxes.reduce((a, b) => Math.max(a, b.z + b.dz), 0);
    u.usedH = u.boxes.reduce((a, b) => Math.max(a, b.y + b.dy), 0);
    u.floor = u.boxes.reduce((a, b) => a + (b.y < EPS ? b.dx * b.dz : 0), 0);
    // weight along the length in 10 equal slices (front wall to doors)
    const bins = new Array(10).fill(0);
    for (const b of u.boxes) {
      const per = b.type.kg / b.dx;
      for (let k = 0; k < 10; k++) {
        const a0 = k * F.L / 10, a1 = (k + 1) * F.L / 10;
        const ov = Math.min(a1, b.x + b.dx) - Math.max(a0, b.x);
        if (ov > 0) bins[k] += per * ov;
      }
    }
    u.bins = bins;
    u.frontKg = bins.slice(0, 5).reduce((a, v) => a + v, 0);
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
    for (const s of stock) s.allOris = s.oris;
    const tooBig = [];
    for (const s of stock) {
      const fitsSome = cands.some(({ eq }) => fitOris(s.oris, eq).length && s.type.kg <= eq.maxKg);
      if (!fitsSome) { tooBig.push({ type: s.type, n: s.left, why: whyNot(s, cands[cands.length - 1].eq).replace('this equipment', 'any of these units') }); s.left = 0; }
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
        const left0 = before.reduce((a, v) => a + v, 0);
        for (const strategy of ['dense', 'wide', 'big', 'hard', 'long'].concat(left0 <= 600 ? ['ep-h', 'ep-vol'] : [])) {
          restore(before);
          const u = packOne(c.eq, stock, { strategy, proj: 1 });
          if (!u.boxes.length) continue;
          const all = stock.every((x) => x.left === 0);
          const share = Math.max(u.vol / Math.max(1, remVol), remKg > 0 ? u.kg / remKg : 0);
          const score = all ? 10 + 1 / c.cost : share / c.cost;
          if (!best || score > best.score + 1e-9) best = { c, strategy, score };
        }
      }
      restore(before);
      if (!best) break;
      const u = packOne(best.c.eq, stock, { strategy: best.strategy, proj: 1 });
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
        const e = m.get(k) || { type: b.type, o: b.o, top: !!b.top, n: 0, cols: 0, rows: 0, nd: b.nd };
        e.n += b.n; e.cols++; e.rows = Math.max(e.rows, b.rows || 1); m.set(k, e);
      }
      st.parts = [...m.values()];
      st.n = st.to - st.from;
      st.kg = st.walls.reduce((a, w) => a + w.kg, 0);
    }
    let pcs = 0, kg = 0;
    for (const st of out) { pcs += st.n; kg += st.kg; st.cumN = pcs; st.cumKg = kg; }
    return out;
  }

  /** Detailed loading steps: one step per block of one item in one place (floor blocks first, then the blocks on top),
      across a group of identical rows. Each step lists the box index ranges it places. */
  function detailSteps(unit) {
    const out = [];
    const MAXN = 36;
    const push = (idx, b0, reps) => {
      let z0 = Infinity, z1 = -Infinity, y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity, kg = 0;
      for (const i of idx) { const bx = unit.boxes[i]; z0 = Math.min(z0, bx.z); z1 = Math.max(z1, bx.z + bx.dz); y0 = Math.min(y0, bx.y); y1 = Math.max(y1, bx.y + bx.dy); x0 = Math.min(x0, bx.x); x1 = Math.max(x1, bx.x + bx.dx); kg += bx.type.kg; }
      const cnt = (f) => new Set(idx.map((i) => Math.round(f(unit.boxes[i])))).size;
      // layout of one row of this block: across (z), high (y), deep (x)
      const deep = Math.max(1, Math.round(cnt((b) => b.x) / reps));
      const across = cnt((b) => b.z), high = cnt((b) => b.y);
      // is the block a plain grid (so "3 across x 4 high" describes it), or an irregular group best shown in the picture?
      const grid = across * high * deep * reps === idx.length;
      out.push({ type: b0.type, o: b0.o, top: !!b0.top, n: idx.length, kg, idx, z0, z1, y0, y1, x0, x1, reps, across, high, deep, grid });
    };
    // split one row's packages into slices from the front wall towards the doors
    const slices = (idx) => {
      const byX = new Map();
      for (const i of idx) { const k = Math.round(unit.boxes[i].x); if (!byX.has(k)) byX.set(k, []); byX.get(k).push(i); }
      const xs = [...byX.keys()].sort((a, b) => a - b), target = idx.length / Math.ceil(idx.length / MAXN), res = [];
      let cur = [];
      for (const x of xs) { const sl = byX.get(x); if (cur.length && cur.length + sl.length > target * 1.3) { res.push(cur); cur = []; } cur = cur.concat(sl); }
      if (cur.length) res.push(cur);
      return res;
    };
    // piece-by-piece plans: the blocks are already in a safe loading order (section by section, nothing before
    // what it stands on), so keep that order and only split very large blocks
    if (unit.walls.length && unit.walls[0].ep) {
      for (const w of unit.walls) for (const b of w.blocks) {
        const a = []; for (let i = w.from + b.i0; i < w.from + b.i0 + b.n; i++) a.push(i);
        for (let k = 0; k < a.length; k += MAXN) push(a.slice(k, k + MAXN), b, 1);
      }
      let pcs = 0, kg = 0;
      for (const st of out) { pcs += st.n; kg += st.kg; st.cumN = pcs; st.cumKg = kg; }
      return out;
    }
    for (const g of steps(unit)) {
      const start = out.length;
      const w0 = g.walls[0];
      const order = w0.blocks.map((b, j) => j).sort((a, b) => (!!w0.blocks[a].top - !!w0.blocks[b].top) || (w0.blocks[a].y0 - w0.blocks[b].y0) || (w0.blocks[a].z0 - w0.blocks[b].z0));
      const segs = [];
      for (const j of order) {
        const b = w0.blocks[j], last = segs[segs.length - 1];
        const pb = last && w0.blocks[last[last.length - 1]];
        if (pb && pb.type === b.type && !!pb.top === !!b.top && pb.o.d === b.o.d && pb.o.w === b.o.w && pb.o.h === b.o.h && Math.abs(pb.y0 - b.y0) < EPS) last.push(j);
        else segs.push([j]);
      }
      for (const seg of segs) {
        const rows = g.walls.map((w) => { const a = []; for (const j of seg) { const b = w.blocks[j]; if (b && b.n) for (let i = w.from + b.i0; i < w.from + b.i0 + b.n; i++) a.push(i); } return a; }).filter((a) => a.length);
        if (!rows.length) continue;
        const b0 = w0.blocks[seg[0]], perRow = rows[0].length, total = rows.reduce((a, r) => a + r.length, 0);
        if (total <= MAXN) push([].concat(...rows), b0, rows.length);
        else if (perRow <= MAXN) { // a few whole rows per step
          const k = Math.max(1, Math.floor(MAXN / perRow));
          for (let r = 0; r < rows.length; r += k) push([].concat(...rows.slice(r, r + k)), b0, Math.min(k, rows.length - r));
        } else for (const r of rows) for (const sl of slices(r)) push(sl, b0, 1);
      }
      // within a row group: floor blocks from the front wall towards the doors (side by side), then the blocks on top
      const part = out.splice(start).sort((a, b) => (a.top - b.top) || (a.top ? a.y0 - b.y0 : 0) || (a.x0 - b.x0) || (a.z0 - b.z0));
      out.push(...part);
    }
    let pcs = 0, kg = 0;
    for (const st of out) { pcs += st.n; kg += st.kg; st.cumN = pcs; st.cumKg = kg; }
    return out;
  }

  /** Build pallets from loose cartons. pal = {l, w, deck (cm), maxH (cm, total incl. deck), maxKg (cargo), tare (kg), name}.
      Each product gets its own full pallets; the part-pallets left over are combined on mixed pallets.
      Returns {pallets: [{key, name, l, w, h, kg, qty, contents: {idx: n}, unit, eq}], loose: [items that do not fit a pallet]}. */
  function palletise(items, pal) {
    const peq = { group: 'Pallets & air ULDs', id: 'build', name: pal.name || 'Pallet', L: pal.l, W: pal.w, H: Math.max(1, pal.maxH - pal.deck), maxKg: pal.maxKg, doorW: 0, doorH: 0, note: '' };
    const types = items.map((it, i) => ({ ...it, idx: i, kg: +it.kg || 0 }));
    const out = new Map(), loose = [];
    const add = (u, label) => {
      const contents = {};
      for (const b of u.boxes) contents[b.type.idx] = (contents[b.type.idx] || 0) + 1;
      const h = u.boxes.reduce((a, b) => Math.max(a, b.y + b.dy), 0);
      const key = Object.entries(contents).sort().map((e) => e.join(':')).join('|') + '#' + Math.round(h);
      const e = out.get(key);
      if (e) { e.qty++; return; }
      const ks = Object.keys(contents);
      if (ks.length === 1) label = types[+ks[0]].name;
      out.set(key, { key, label, mixed: ks.length > 1, contents, h: Math.round(h + pal.deck), kg: u.kg + (pal.tare || 0), cargoKg: u.kg, qty: 1, unit: u });
    };
    const rest = [];
    for (const t of types) {
      if (!(t.qty > 0 && t.l > 0 && t.w > 0 && t.h > 0)) continue;
      const st = [{ type: t, left: Math.floor(t.qty), oris: orientations(t), unitVol: t.l * t.w * t.h }];
      st[0].allOris = st[0].oris;
      if (!fitOris(st[0].oris, peq).length || t.kg > peq.maxKg) { loose.push(t); continue; }
      let guard = 0;
      while (st[0].left > 0 && guard++ < 500) {
        const snap = st[0].left;
        const u = packOne(peq, st, { strategy: 'dense' });
        if (!u.boxes.length) break;
        // a part-pallet (less than 85% of a full one) waits for the mixed round
        if (st[0].left === 0 && guard > 1) {
          const full = out.size ? [...out.values()].find((p) => p.contents[t.idx] && Object.keys(p.contents).length === 1) : null;
          if (full && u.boxes.length < 0.85 * full.contents[t.idx]) { rest.push({ ...t, qty: snap }); break; }
        }
        add(u, t.name);
      }
    }
    if (rest.length) {
      const st = rest.map((t) => { const s = { type: t, left: Math.floor(t.qty), oris: orientations(t), unitVol: t.l * t.w * t.h }; s.allOris = s.oris; return s; });
      let guard = 0;
      while (st.some((s) => s.left > 0) && guard++ < 500) {
        const u = packOne(peq, st, { strategy: 'hard' });
        if (!u.boxes.length) break;
        add(u, 'Mixed');
      }
    }
    let k = 0;
    const pallets = [...out.values()].map((p) => {
      finalize(p.unit, peq, k);
      p.unit.steps = steps(p.unit);
      return { ...p, n: ++k, l: pal.l, w: pal.w, eq: peq };
    });
    return { pallets, loose, eq: peq };
  }

  const api = { EQUIPMENT, plan, planMix, steps, detailSteps, orientations, palletise };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LPEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
