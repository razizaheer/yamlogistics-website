// Standard-rate duty for every tariff line, using the same rules as duty-calc.js (no trade agreement selected).
const D = JSON.parse(require('fs').readFileSync('/home/claude/yamlogistics-website/duty-data.json', 'utf8'));
const out = {}; let noRate = 0;
for (const x of D.rows) {
  const code = x[0]; let bcd = x[5], src = 'tariff';
  const n45 = x[10].map((i) => D.n45[i]);
  let auto = n45.filter((e) => /^all goods(,? other than (those|goods|the goods) (mentioned|specified|covered) (at|in|under|against) s\.? ?nos?\.? ?[\dA-Z]+(,? (and|or) [\dA-Z]+)?( of this table)?)?\.?$/i.test(e[3]) && (e[2] === '-' || e[2] === '') && /^(Nil|[\d.]+\s?%)$/.test(e[1]));
  let probable = null;
  if (!auto.length) n45.forEach((e) => { if (!probable && e[4].indexOf(code) >= 0 && (e[2] === '-' || e[2] === '') && /^(Nil|[\d.]+\s?%)$/.test(e[1]) && !/for use|imported by|when imported|specified|list|other than|if imported|subject to|for the manufacture|for manufacture/i.test(e[3])) probable = e; });
  if (probable) auto = [probable];
  if (auto.length) { const a = auto[auto.length - 1]; bcd = a[1] === 'Nil' ? 0 : parseFloat(a[1]); src = /\//.test(a[0]) ? 'Notification ' + a[0] : 'Notification 45/2025-Customs, S. No. ' + a[0]; }
  (D.n57 || []).filter((e) => e[4].some((c) => code.indexOf(c) === 0)).forEach((e) => { if (e[5] === 1) { const r = e[1] === 'Nil' ? 0 : parseFloat(e[1]); if (bcd == null || r < bcd) { bcd = r; src = 'Notification 57/2017-Customs, S. No. ' + e[0]; } } });
  let ig = x[6].map((i) => D.igst[i]), igRate = ig.length ? ig[0][0] : 18, igSure = x[7] === 1;
  if (/^220[3-8]/.test(code) && !/^2207/.test(code)) { igRate = 0; igSure = true; }
  const pfx = (l) => l.some((c) => code.indexOf(c) === 0);
  const plen = (l) => { let m = 0; l.forEach((c) => { if (code.indexOf(c) === 0 && c.length > m) m = c.length; }); return m; };
  const aM = (D.aidc2 || []).filter((e) => pfx(e[1]) && !pfx(e[6] || []));
  let aAuto = null; aM.forEach((e) => { if (e[4] === 1 && /^(Nil|[\d.]+\s?%)$/.test(e[3]) && (!aAuto || plen(e[1]) >= plen(aAuto[1]))) aAuto = e; });
  const aidc = aAuto ? (aAuto[3] === 'Nil' ? 0 : parseFloat(aAuto[3])) : 0;
  const sM = (D.sws2 || []).filter((e) => pfx(e[1])); const swsEx = sM.some((e) => e[3] === 1);
  let tot = null, sws = null;
  if (bcd != null) { sws = swsEx ? 0 : bcd * 0.10; tot = bcd + sws + aidc + (100 + bcd + sws + aidc) * igRate / 100; } else noRate++;
  const r2 = (n) => n == null ? null : Math.round(n * 1000) / 1000;
  (out[code.slice(0, 6)] = out[code.slice(0, 6)] || []).push({ c: code, d: x[1], p: D.paths[x[2]], u: x[3], t: x[4], bcd: r2(bcd), src, sws: r2(sws), aidc: r2(aidc), ig: igRate, igs: igSure ? 1 : 0, tot: r2(tot), pol: x[8], pn: x[9] || '', nc: n45.length, cond: (n45.length - (auto.length ? 1 : 0)) + aM.filter((e) => e !== aAuto).length + sM.filter((e) => e[3] !== 1).length });
}
require('fs').writeFileSync('/root/dbg/duty/lines.json', JSON.stringify({ v: D.v, h: out }));
console.log('lines', D.rows.length, 'hs6', Object.keys(out).length, 'no rate', noRate);
const s = out['851713'] || out['851712']; console.log(JSON.stringify((s || [])[0]));
console.log(JSON.stringify(out['847130'][0]));
