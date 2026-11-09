// usage: node prep.js <outfile.json> page1 page2 ...   (pages without .html; uses out/<page>.json crawl results)
// writes { en: [templated strings missing in at least one language], missing: {lang: [..]} }
const fs = require('fs');
const L = require('./lib');
const [, , outFile, ...pages] = process.argv;

// entity names that are never translated (carriers)
const ENT = new Set();
try {
  const t = fs.readFileSync(L.ROOT + '/track.js', 'utf8');
  for (const m of t.matchAll(/^\s*\["([^"]+)", "https?:/gm)) ENT.add(m[1]);
  const a = JSON.parse(fs.readFileSync(L.ROOT + '/awb-data.json', 'utf8'));
  for (const r of a.al) ENT.add(r[1]);
} catch (e) { console.error(e.message); }
const ENTS = [...ENT].filter((e) => e.length > 2).sort((a, b) => b.length - a.length);
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ENT_RE = new RegExp('(^|[^A-Za-z])(' + ENTS.map(reEsc).join('|') + ')(?![A-Za-z])', 'g');
const JUNK = new Set(['Order 4521', 'note', 'Acme Exports Pvt Ltd', 'Test 0', 'Test 1', 'Test 2', 'mobile phone', '8517']);
const MON = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*';

function templ(s, page) {
  const DOC = /^(bl-awb-draft|document-generator)$/.test(page);
  if (DOC && !/[a-z]/.test(s)) return null; // document wording stays English
  if (/^SAY : /.test(s)) return null;
  if (JUNK.has(s)) return null;
  if (ENT.has(s) || ENT.has(s.replace(/\s*[↗→]$/, ''))) return null;
  if (!/[a-z]/.test(s) && /\d/.test(s) && s.length < 30) return null; // codes
  if (/^[A-Z]{4}\s?\d/.test(s) && s.length < 25) return null;
  let i = 0; const nx = () => '{' + (i++) + '}';
  let t = s;
  t = t.replace(new RegExp('\\b\\d{1,2} ' + MON + '(?: \\d{4})?\\b', 'g'), () => '\u0001');
  t = t.replace(/(likely codes? for |No matching tariff lines for )“[^”]*”/, (m, p) => p + '“\u0004”');
  if (/^(track-shipment|my-shipments)$/.test(page)) t = t.replace(ENT_RE, (m, p, e) => p + '\u0002').replace(/(·|^✓?\s*(CONTAINER|AWB|B\/L)) [A-Z][A-Z .()-]{2,}$/, '$1 \u0002');
  t = t.replace(/\d+(?:[.,]\d+)*/g, '\u0003');
  t = t.replace(/[\u0001\u0002\u0003\u0004]/g, () => nx());
  if (/^(\{\d\} )?(\{\d\}|[A-Z][\w-]*)( (Cargo|SkyCargo|Shipping|Line|Lines|Feeders|Airlines|Airways))+( ↗)?$/.test(t) || /\{\d\} (Sky)?Cargo/.test(t)) return null;
  if (i > 9) return null;
  if (!/[A-Za-z]{2}/.test(t.replace(/\{\d\}/g, ''))) return null;
  return t;
}

const all = new Map(); // templ -> source page
const orig = new Map(); // templ -> original instances
for (const p of pages) {
  let crawl = [];
  try { crawl = JSON.parse(fs.readFileSync(__dirname + '/crawl/' + p + '.json', 'utf8')); } catch (e) { console.error('no crawl for', p); }
  const stat = L.staticStrings(fs.readFileSync(L.ROOT + '/' + p + '.html', 'utf8'));
  for (const s of [...stat, ...crawl]) { const n = L.core.norm(s); const t = templ(n, p); if (!t) continue; if (!all.has(t)) all.set(t, p); if (!orig.has(t)) orig.set(t, []); orig.get(t).push(n); }
}
const missing = {}; const need = new Set();
for (const g of L.LANGS) {
  const d = L.loadDict(g).dict; const tr = L.core.make(Object.assign({}, d));
  missing[g] = [];
  for (const t of all.keys()) {
    // a template counts as known if the key exists, or a concrete instance translates fully
    if (Object.prototype.hasOwnProperty.call(d, t)) continue;
    if ((orig.get(t) || []).every((o) => tr.t(o) != null)) continue;
    missing[g].push(t); need.add(t);
  }
}
const en = [...need];
fs.writeFileSync(outFile, JSON.stringify({ en, known: [...all.keys()], src: Object.fromEntries(en.map((t) => [t, all.get(t)])), missing }, null, 1));
console.log('total', all.size, 'need', en.length, Object.entries(missing).map(([g, a]) => g + ':' + a.length).join(' '));
