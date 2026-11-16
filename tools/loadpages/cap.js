const E = require('/home/claude/yamlogistics-website/lp-engine.js');
const eq = (id) => E.EQUIPMENT.find((e) => e.id === id);
function cap(item, id) {
  const e = eq(id); const est = Math.max(1, Math.floor((e.L * e.W * e.H) / (item.l * item.w * item.h)));
  const byKg = item.kg ? Math.floor(e.maxKg / item.kg) : est;
  const qty = Math.min(est, byKg + 5);
  const r = E.plan([{ name: 'x', color: '#0A6CC2', ...item, qty }], id);
  const n = Math.max(0, ...r.units.map((u) => u.boxes.length));
  return { n, fill: Math.round((n * item.l * item.w * item.h) / (e.L * e.W * e.H) * 100), kg: Math.round(n * (item.kg || 0)), wl: item.kg && n * item.kg > e.maxKg - item.kg };
}
const out = { eq: {}, pallets: {}, cartons: {}, uld: {}, trucks: {}, perPallet: {} };
E.EQUIPMENT.forEach((e) => out.eq[e.id] = e);
const P = { 'Euro 120 × 80': [120, 80], 'Standard 120 × 100': [120, 100], 'US 48 × 40 in': [121.9, 101.6], 'Asia 110 × 110': [110, 110] };
const PC = ['20gp', '40gp', '40hc', '45hc', '20rf', '40rh', 'in32m', 'eu136', 'us53'];
for (const [k, [l, w]] of Object.entries(P)) { out.pallets[k] = {}; for (const c of PC) out.pallets[k][c] = cap({ l, w, h: 150, kg: 0, upright: true, stackable: false }, c).n; }
const C = [[60, 40, 40], [60, 40, 30], [50, 40, 30], [50, 50, 50], [40, 30, 30], [45, 35, 25], [30, 30, 30], [80, 60, 50]];
for (const [l, w, h] of C) { const k = l + ' × ' + w + ' × ' + h; out.cartons[k] = {}; for (const c of ['20gp', '40gp', '40hc']) out.cartons[k][c] = cap({ l, w, h, kg: 0, stackable: true }, c);
  out.trucks[k] = {}; for (const c of ['in20', 'in24', 'in32m', 'eu136', 'us53']) out.trucks[k][c] = cap({ l, w, h, kg: 0, stackable: true }, c).n;
  out.uld[k] = {}; for (const c of ['pmc-ld', 'pmc-md', 'pag-ld', 'ake', 'akh']) out.uld[k][c] = cap({ l, w, h, kg: 0, stackable: true }, c).n;
  out.perPallet[k] = {}; for (const c of ['euro', 'uspal', 'asia']) out.perPallet[k][c] = cap({ l, w, h, kg: 0, stackable: true }, c).n; }
require('fs').writeFileSync('/root/dbg/lp/cap.json', JSON.stringify(out));
const row = (o) => Object.entries(o).map(([k, v]) => k + ': ' + JSON.stringify(v, (kk, vv) => (vv && vv.n !== undefined ? vv.n + ' (' + vv.fill + '%)' : vv))).join('\n');
console.log('PALLETS\n' + row(out.pallets) + '\nCARTONS\n' + row(out.cartons) + '\nTRUCKS\n' + row(out.trucks) + '\nULD\n' + row(out.uld) + '\nPER PALLET\n' + row(out.perPallet));
