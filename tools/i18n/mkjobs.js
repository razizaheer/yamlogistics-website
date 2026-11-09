// usage: node mkjobs.js <prep.json> <jobname> [extra.json]  -> tr/<job>-in-<lang>.json + tr/gloss-<lang>.json
const fs = require('fs');
const L = require('./lib');
const [, , prepFile, job, extraFile] = process.argv;
const P = JSON.parse(fs.readFileSync(prepFile, 'utf8'));
const extra = extraFile ? JSON.parse(fs.readFileSync(extraFile, 'utf8')) : [];
fs.mkdirSync(__dirname + '/tr', { recursive: true });
const pairs = (txt) => { const o = {}; for (const m of txt.matchAll(/data-k="([a-z]+)"[^>]*><b>([^<]*)<\/b><span>([^<]*)<\/span>/g)) o[m[1]] = [m[2], m[3]]; return o; };
const en = pairs(fs.readFileSync(L.ROOT + '/menus/ftm-en.txt', 'utf8'));
const TERMS = ['Free Tools', 'Get a quote →', 'Talk to the Desk →', 'licensed customs broker', 'Disclaimer', 'Basic customs duty', 'Social welfare surcharge', 'Country of origin', 'Freight', 'Insurance', 'Exchange rate', 'Ocean Freight · FCL / LCL', 'Air Freight', 'Customs Brokerage', 'Contact', 'Download PDF', 'Container', 'Gross weight (kg)', 'Net weight (kg)', 'Shipper', 'Consignee', 'Port of loading', 'Port of discharge', 'Chat with YAM on WhatsApp'];
for (const g of L.LANGS) {
  const tr = pairs(fs.readFileSync(L.ROOT + '/menus/ftm-' + g + '.txt', 'utf8'));
  const gl = {};
  for (const k in en) if (tr[k]) { gl[en[k][0].replace(/&amp;/g, '&')] = tr[k][0].replace(/&amp;/g, '&'); }
  const d = L.loadDict(g).dict;
  for (const t of TERMS) if (d[t]) gl[t] = d[t];
  fs.writeFileSync(__dirname + '/tr/gloss-' + g + '.json', JSON.stringify(gl, null, 1));
  const list = [...P.missing[g], ...extra.filter((x) => !(x in d))];
  fs.writeFileSync(__dirname + '/tr/' + job + '-in-' + g + '.json', JSON.stringify(list, null, 1));
  console.log(g, list.length, Object.keys(gl).length);
}
