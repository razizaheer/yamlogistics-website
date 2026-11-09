// usage: node partial.js <prep.json> <out.json>  -> strings that only partly translate via a broader pattern
const fs = require('fs');
const L = require('./lib');
const [, , prepFile, outFile] = process.argv;
const P = JSON.parse(fs.readFileSync(prepFile, 'utf8'));
const all = Object.keys(P.src).length ? Object.keys(P.src) : P.en;
// everything the prep step saw (also the ones it considered known)
const keys = new Set([...all, ...(P.known || [])]);
const OK = /^(HSN|AWB|ITC|CBIC|DGFT|IGST|BCD|SWS|AIDC|GST|IEC|GSTIN|YAM|CargoKit|WhatsApp|Telegram|Logistics|Data|Bank|Pvt|Ltd|ICEGATE|NVOCC|MSDS|PDF|ETA|CBM|FCL|LCL|ULD|EXW|FOB|CIF|CFR|CPT|CIP|DAP|DPU|DDP|FCA|FAS|USD|INR|SKyCargo|Maersk|India|Mumbai|Delhi|Mundra|Kalkaji|LinkedIn|Instagram|Facebook|Hapag|Lloyd|Emirates|SkyCargo|Cargo|MSKU|MAEU|Nhava|Sheva|JNPT|Chennai|Kolkata|Note)$/i;
const flagged = new Set();
const words = (s) => s.toLowerCase().match(/[a-z]{3,}/g) || [];
for (const g of L.LANGS) {
  const d = L.loadDict(g).dict; const tr = L.core.make(Object.assign({}, d));
  const latin = /^(de|es|fr|pt)$/.test(g);
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(d, k)) continue;
    const inst = k.replace(/\{\d\}/g, '7');
    const r = tr.t(inst); if (r == null) continue;
    let bad = false;
    if (!latin) bad = (r.match(/[A-Za-z]{4,}/g) || []).some((w) => !OK.test(w) && words(k).includes(w.toLowerCase()));
    else { const kw = words(k), rw = r.toLowerCase().match(/[a-zà-ÿ]+/g) || []; for (let i = 0; i + 2 < kw.length && !bad; i++) { const tri = kw.slice(i, i + 3).join(' '); if (rw.join(' ').includes(tri)) bad = true; } }
    if (bad) flagged.add(k);
  }
}
fs.writeFileSync(outFile, JSON.stringify([...flagged], null, 1));
console.log(flagged.size, 'flagged'); for (const f of flagged) console.log('  ' + f.slice(0, 110));
