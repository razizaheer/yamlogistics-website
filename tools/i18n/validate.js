// usage: node validate.js <job> <lang>  -> checks tr/<job>-out-<lang>.json against tr/<job>-in-<lang>.json
const fs = require('fs');
const [, , job, lang] = process.argv;
const inp = JSON.parse(fs.readFileSync(__dirname + '/tr/' + job + '-in-' + lang + '.json', 'utf8'));
let out;
try { out = JSON.parse(fs.readFileSync(__dirname + '/tr/' + job + '-out-' + lang + '.json', 'utf8')); } catch (e) { console.log('NOT VALID JSON:', e.message); process.exit(1); }
const ph = (s) => (s.match(/\{\d\}/g) || []).sort().join(',');
let bad = 0, miss = 0;
for (const k of inp) {
  if (!(k in out)) { miss++; if (miss <= 30) console.log('MISSING:', JSON.stringify(k)); continue; }
  const v = out[k];
  if (typeof v !== 'string' || !v.trim()) { bad++; console.log('EMPTY:', JSON.stringify(k)); continue; }
  if (ph(k) !== ph(v)) { bad++; console.log('PLACEHOLDERS DIFFER:', JSON.stringify(k), '=>', JSON.stringify(v)); }
}
const extra = Object.keys(out).filter((k) => !inp.includes(k));
if (extra.length) console.log('KEYS NOT IN INPUT (typo in key?):', extra.slice(0, 20).map((x) => JSON.stringify(x)).join('\n'));
console.log(`${lang}: ${inp.length} input, ${Object.keys(out).length} output, ${miss} missing, ${bad} bad, ${extra.length} unknown keys`);
process.exit(miss || bad || extra.length ? 1 : 0);
