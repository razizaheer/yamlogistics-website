/* YAM Logistics: import duty and tax calculator. Look up the product in the official tariff of the destination (US, EU, UK, Japan, Australia) and the duty rate fills in; the tool then applies each country's valuation base, taxes and fees. Runs on the device. */
(function () {
  var root = document.getElementById('wd-root'); if (!root) return;
  var KEY = 'ck_wd_v1', D = document;
  var EUVAT = { AT: ['Austria', 20], BE: ['Belgium', 21], BG: ['Bulgaria', 20], HR: ['Croatia', 25], CY: ['Cyprus', 19], CZ: ['Czechia', 21], DK: ['Denmark', 25], EE: ['Estonia', 24], FI: ['Finland', 25.5], FR: ['France', 20], DE: ['Germany', 19], GR: ['Greece', 24], HU: ['Hungary', 27], IE: ['Ireland', 23], IT: ['Italy', 22], LV: ['Latvia', 21], LT: ['Lithuania', 21], LU: ['Luxembourg', 17], MT: ['Malta', 18], NL: ['Netherlands', 21], PL: ['Poland', 23], PT: ['Portugal', 23], RO: ['Romania', 21], SK: ['Slovakia', 23], SI: ['Slovenia', 22], ES: ['Spain', 21], SE: ['Sweden', 25] };
  // base: 'cif' (duty on goods + freight + insurance) or 'fob' (duty on goods only). vat = default tax rate %. chips = typical duty rates to tap.
  var C = {
    US: { n: 'United States', cur: 'USD', flag: '🇺🇸', base: 'fob', vat: 0, chips: [0, 2.5, 5, 7.5, 10, 25], tax: '', find: ['USITC Harmonized Tariff Schedule', 'https://hts.usitc.gov/'], note: 'US duty is charged on the transaction value of the goods, without international freight and insurance. Many goods also carry extra tariffs (for example Section 301, 232 or country-specific measures): add them in the extra duty box. Sales tax is not collected at the border.' },
    EU: { n: 'European Union', cur: 'EUR', flag: '🇪🇺', base: 'cif', vat: 21, chips: [0, 2.7, 4.7, 6.5, 8, 12], tax: 'Import VAT', find: ['EU Common Customs Tariff (TARIC)', 'https://taxation-customs.ec.europa.eu/customs/calculation-customs-duties/customs-tariff/eu-customs-tariff-taric_en'], note: 'Duty is charged on the CIF value. Import VAT is charged on CIF plus duty at the rate of the member state where the goods are released. Pick the state.' },
    GB: { n: 'United Kingdom', cur: 'GBP', flag: '🇬🇧', base: 'cif', vat: 20, chips: [0, 2.5, 4, 6.5, 8, 12], tax: 'Import VAT', find: ['UK Trade Tariff', 'https://www.trade-tariff.service.gov.uk/'], note: 'Duty is charged on the CIF value, and import VAT on CIF plus duty. Some goods have a reduced or zero VAT rate. Postponed VAT accounting can remove the cash cost for VAT-registered importers.' },
    AU: { n: 'Australia', cur: 'AUD', flag: '🇦🇺', base: 'fob', vat: 10, chips: [0, 5], tax: 'GST', find: ['Australian Border Force tariff', 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification'], note: 'Duty is charged on the customs value, which is the goods without international freight and insurance. GST of 10% is charged on the value of the taxable importation: goods, duty, international freight and insurance. Consignments of AUD 1,000 or less are usually handled differently.' },
    JP: { n: 'Japan', cur: 'JPY', flag: '🇯🇵', base: 'cif', vat: 10, chips: [0, 3, 5, 8, 10], tax: 'Consumption tax', find: ['Japan Customs tariff', 'https://www.customs.go.jp/english/tariff/'], note: 'Duty is charged on the CIF value. Consumption tax is 10% on CIF plus duty (7.8% national and 2.2% local). A reduced 8% rate applies to some food. Amounts are in yen, so enter whole numbers.' },
    SG: { n: 'Singapore', cur: 'SGD', flag: '🇸🇬', base: 'cif', vat: 9, chips: [0], tax: 'GST', find: ['Singapore Customs', 'https://www.customs.gov.sg/'], note: 'Singapore is a free port. Only liquor, tobacco, motor vehicles and petroleum carry duty. Everything else is duty-free, and GST of 9% is charged on the CIF value.' },
  };
  var ORDER = ['US', 'EU', 'GB', 'JP', 'AU', 'SG'];
  var S = { cn: 'US', v: {} };
  try { var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && C[j.cn]) S = j; } catch (e) {}
  if (!S.v) S.v = {};
  var last = null;
  var css = D.createElement('style');
  css.textContent = '.wd-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:24px;margin-bottom:16px}.wd-h{font-family:Archivo,sans-serif;font-weight:800;font-size:21px;margin:0 0 4px;color:#0B2A4A}.wd-s{font-size:14px;color:#5E7891;margin:0 0 14px;line-height:1.5}' +
    '.wd-g{display:grid;grid-template-columns:1fr 1fr;gap:12px}.wd-g .w{grid-column:1/-1}@media(max-width:560px){.wd-g{grid-template-columns:1fr}}.wd-l{font-size:13px;font-weight:600;color:#3D5873;margin:0 0 6px;display:block}.wd-hint{font-size:12px;color:#5E7891;margin-top:5px;line-height:1.4}' +
    '.wd-in{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid #C9DCEC;border-radius:14px;font:inherit;font-size:16px;color:#0B2A4A;background:#fff}.wd-in:focus{outline:2px solid #0A6CC2;border-color:#0A6CC2}' +
    '.wd-cn{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 4px}.wd-cn button{border:1px solid #C9DCEC;background:#fff;border-radius:999px;padding:9px 14px;font:inherit;font-size:14px;font-weight:600;color:#3D5873;cursor:pointer}.wd-cn button.on{background:#0A6CC2;border-color:#0A6CC2;color:#fff}' +
    '.wd-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.wd-chips button{border:1px solid #C9DCEC;background:#F4F9FE;border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;color:#17436B;cursor:pointer}' +
    '.wd-big{background:#0A6CC2;color:#fff;border-radius:20px;padding:18px 20px;margin-bottom:12px}.wd-big .k{font-family:"Geist Mono",monospace;font-size:12px;letter-spacing:.08em;opacity:.85}.wd-big .v{font-family:Archivo,sans-serif;font-weight:900;font-size:34px;line-height:1.1;margin-top:4px}.wd-big .u{font-size:15px;opacity:.9;margin-top:6px}' +
    '.wd-t{width:100%;border-collapse:collapse;font-size:15px}.wd-t td{padding:10px 0;border-bottom:1px solid #E8F0F8;color:#0B2A4A;vertical-align:top}.wd-t td:last-child{text-align:right;font-weight:700;white-space:nowrap;padding-left:12px}.wd-t tr.sub td{font-weight:700;background:#F4F9FE}.wd-t td small{display:block;font-weight:400;color:#5E7891;font-size:12px}' +
    '.wd-note{border-left:4px solid #0A6CC2;background:#F0F7FE;border-radius:0 14px 14px 0;padding:12px 16px;font-size:14px;line-height:1.55;color:#17436B;margin-top:14px}.wd-warn{border-left-color:#E0A100;background:#FFF8E4;color:#6B4B00}' +
    '.wd-list{display:flex;flex-direction:column;margin-top:10px;border:1px solid #E1EDF7;border-radius:14px;overflow:hidden;max-height:420px;overflow-y:auto}.wd-list button{display:grid;grid-template-columns:96px 1fr auto;gap:10px;text-align:left;align-items:start;border:0;border-bottom:1px solid #E8F0F8;background:#fff;padding:11px 12px;font:inherit;font-size:14px;color:#0B2A4A;cursor:pointer}.wd-list button:hover{background:#F4F9FE}.wd-list .c{font-family:"Geist Mono",monospace;font-size:12px;color:#0A6CC2;padding-top:2px}.wd-list .d small{display:block;color:#5E7891;font-size:12px}.wd-list .r{font-weight:700;white-space:nowrap}@media(max-width:560px){.wd-list button{grid-template-columns:1fr auto}.wd-list .c{grid-column:1/-1}}.wd-sel{background:#F0F7FE;border:1px solid #C9DCEC;border-radius:14px;padding:14px 16px;font-size:15px;line-height:1.5;color:#0B2A4A}.wd-selr{margin-top:6px}.wd-chg{margin-top:10px;border:1px solid #0A6CC2;background:#fff;color:#0A6CC2;border-radius:999px;padding:8px 14px;font:inherit;font-size:14px;font-weight:600;cursor:pointer}' +
    '.wd-a{display:inline-block;border-radius:999px;padding:11px 18px;font-weight:700;text-decoration:none;font-size:15px}';
  D.head.appendChild(css);
  function el(i) { return D.getElementById(i); }
  function num(k) { var v = parseFloat(String(S.v[k] == null ? '' : S.v[k]).replace(/,/g, '')); return isFinite(v) ? v : 0; }
  function f(n, d) { if (!isFinite(n)) n = 0; return n.toLocaleString('en-US', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function key(k) { return S.cn + '_' + k; }
  function get(k) { return S.v[key(k)]; }
  function setv(k, v) { S.v[key(k)] = v; }
  function nm(k, dflt) { var v = parseFloat(String(get(k) == null ? '' : get(k)).replace(/,/g, '')); return isFinite(v) ? v : (dflt == null ? 0 : dflt); }
  function field(k, label, ph, hint, w) {
    return '<div' + (w ? ' class="w"' : '') + '><label class="wd-l" for="wd_' + k + '">' + label + '</label><input class="wd-in" id="wd_' + k + '" data-k="' + k + '" inputmode="decimal" placeholder="' + (ph || '') + '" value="' + esc(get(k) == null ? '' : get(k)) + '">' + (hint ? '<div class="wd-hint">' + hint + '</div>' : '') + '</div>';
  }
  var DATA = {}, HSN = null, results = [], qtext = '', busy = '';
  function loadTariff(cc, cb) {
    if (DATA[cc]) return cb(DATA[cc]);
    busy = 'Loading the ' + C[cc].n + ' tariff…'; paintResults();
    fetch('/tariffs/' + cc.toLowerCase() + '.json?v=1').then(function (r) { return r.json(); }).then(function (j) { j.r = j.r.filter(function (r) { return !/^9[89]/.test(r[0]); }); DATA[cc] = j; busy = ''; cb(j); }).catch(function () { busy = 'Could not load the tariff. Check your connection and try again.'; paintResults(); });
  }
  function loadHsn(cb) {
    if (HSN) return cb(HSN);
    fetch('/hsn-data.json?v=2').then(function (r) { return r.json(); }).then(function (j) {
      var t = {}, idx = [];
      j.rows.forEach(function (r) {
        var h = r[0].slice(0, 6), p = (j.paths[r[2]] || '').split(' › ');
        var title = p.slice(-2).join(' › ');
        if (!t[h]) t[h] = { title: title, fp: (j.paths[r[2]] || '').toLowerCase(), hay: '' };
        t[h].hay += ' ' + (j.paths[r[2]] || '') + ' ' + r[1];
      });
      Object.keys(t).forEach(function (h) { t[h].hay = t[h].hay.toLowerCase(); t[h].tl = t[h].title.toLowerCase(); idx.push(h); });
      HSN = { t: t, idx: idx }; cb(HSN);
    }).catch(function () { HSN = { t: {}, idx: [] }; cb(HSN); });
  }
  function clean(s) { return String(s).replace(/\|/g, '').replace(/\s+/g, ' ').trim(); }
  function short(d) { d = clean(d); if (d.length <= 90) return d; var p = d.split(' > '); while (p.length > 1 && p.join(' > ').length > 90) p.shift(); var r = p.join(' > '); return r.length > 100 ? r.slice(0, 98) + '…' : r; }
  function dotted(code) { return code.length >= 8 ? code.slice(0, 4) + '.' + code.slice(4, 6) + '.' + code.slice(6) : code.length === 6 ? code.slice(0, 4) + '.' + code.slice(4) : code; }
  // Turn a tariff rate string into a percentage and an optional specific (per weight or unit) duty.
  function parseRate(txt) {
    var t = String(txt || '').toLowerCase().replace(/,/g, ''), o = { pct: 0, spec: null, warn: '', txt: txt };
    if (!t || /variable|see taric/.test(t)) { o.warn = 'This code has a variable or conditional duty (for example a duty that depends on price or composition). Check the official tariff for the exact amount.'; o.bad = true; return o; }
    if (/^free\b/.test(t)) return o;
    var ps = []; t.replace(/(\d+(?:\.\d+)?)\s*%/g, function (m, n) { ps.push(parseFloat(n)); });
    var varies = /varies by item/.test(t);
    if (ps.length) o.pct = varies ? Math.max.apply(null, ps) : ps[0];
    if (varies) o.warn = 'The rate differs between items inside this code. The highest listed rate is used. Check the official tariff for your exact item.';
    var m = t.match(/(\d+(?:\.\d+)?)\s*(¢|cents?)?\s*(?:eur|gbp|usd|aud|yen|jpy)?\s*(?:\/|per)\s*(100 ?kg|1000 ?kg|tonne|kg|litre|liter|l|hl|each|item|stick|doz|dozen)\b/);
    if (m) {
      var amt = parseFloat(m[1]); if (m[2]) amt /= 100;
      var u = m[3].replace(' ', ''), per = 1, lab = 'kg';
      if (u === '100kg') per = 100; else if (u === '1000kg' || u === 'tonne') per = 1000; else if (u === 'kg') per = 1; else if (/^(litre|liter|l)$/.test(u)) lab = 'litres'; else if (u === 'hl') { per = 100; lab = 'litres'; } else lab = 'items';
      o.spec = { perUnit: amt / per, lab: lab, raw: txt };
    } else if (!ps.length) { o.warn = 'This duty could not be read automatically: ' + txt + '. Check the official tariff.'; o.bad = true; }
    if (/ or |if lower|if higher|whichever/.test(t) && o.spec) o.warn = (o.warn ? o.warn + ' ' : '') + 'The tariff gives alternative bases (for example percentage or per kilo, whichever is lower or higher). Both are shown; the calculator adds the specific amount, so treat the result as the upper estimate.';
    return o;
  }
  function search(qv) {
    var cc = S.cn; qtext = qv; var D = DATA[cc]; if (!D) { return; }
    var q = qv.trim(), out = [], digits = q.replace(/[\s.\-]/g, '');
    if (q.length < 2) { results = []; return paintResults(); }
    if (/^\d+$/.test(digits)) {
      for (var i = 0; i < D.r.length && out.length < 60; i++) if (D.r[i][0].indexOf(digits) === 0) out.push(D.r[i]);
      results = out; return paintResults(digits.length >= 2 ? '' : '');
    }
    var toks = q.toLowerCase().replace(/t-shirts?/g, 'tshirt').split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 2; }).map(function (w) { return w.replace(/(ies)$/, 'y').replace(/(es|s)$/, function (m) { return w.length > 4 ? '' : m; }); });
    if (!toks.length) { results = []; return paintResults(); }
    var STOP = { the: 1, and: 1, for: 1, with: 1, from: 1, new: 1, used: 1, made: 1, set: 1 };
    var SYN = { laptop: ['portable automatic data processing', 'computer'], laptops: ['portable automatic data processing', 'computer'], notebook: ['portable automatic data processing'], smartphone: ['telephone'], smartphones: ['telephone'], mobile: ['telephone'], cell: ['telephone'], phone: ['telephone'], phones: ['telephone'], shirt: ['shirts'], tshirt: ['t-shirts'], shoes: ['footwear'], shoe: ['footwear'], sneakers: ['footwear'], trainers: ['footwear'], sandals: ['footwear'], boots: ['footwear'], battery: ['accumulators', 'cells and batteries'], batteries: ['accumulators', 'cells and batteries'], lithium: ['lithium'], car: ['motor cars'], cars: ['motor cars'], truck: ['goods vehicles'], tire: ['tyres'], tires: ['tyres'], tyre: ['tyres'], bike: ['bicycles'], bicycle: ['bicycles'], toy: ['toys'], toys: ['toys'], tv: ['television'], television: ['television'], fridge: ['refrigerators'], refrigerator: ['refrigerators'], aircon: ['air conditioning'], tshirts: ['t-shirts'], jeans: ['trousers'], pants: ['trousers'], dress: ['dresses'], bag: ['handbags', 'bags'], bags: ['handbags', 'bags'], watch: ['wrist-watches', 'watches'], watches: ['wrist-watches', 'watches'], tile: ['tiles'], tiles: ['tiles'], rice: ['rice'], tea: ['tea'], coffee: ['coffee'], sugar: ['sugar'], steel: ['iron or steel', 'steel'], plastic: ['plastics'], plastics: ['plastics'], solar: ['photosensitive', 'photovoltaic'], panel: ['photovoltaic'], led: ['light-emitting diode', 'led'], furniture: ['furniture'], chair: ['seats'], chairs: ['seats'], pump: ['pumps'], pumps: ['pumps'], cable: ['insulated wire', 'cable'], cables: ['insulated wire', 'cable'], medicine: ['medicaments'], medicines: ['medicaments'], drug: ['medicaments'], drugs: ['medicaments'], perfume: ['perfumes'], cosmetics: ['beauty', 'make-up'], makeup: ['make-up'], wine: ['wine'], beer: ['beer'], whisky: ['whiskies'], whiskey: ['whiskies'], printer: ['printers'], camera: ['cameras'], cameras: ['cameras'], charger: ['static converters'], chargers: ['static converters'], headphones: ['headphones'], earphones: ['earphones'] };
    toks = toks.filter(function (w) { return !STOP[w]; });
    if (!toks.length) { results = []; return paintResults(); }
    var G = toks.map(function (w) { return [w].concat(SYN[w] || []); }), need = toks.length <= 2 ? toks.length : Math.ceil(toks.length * 0.6);
    var RX = G.map(function (g) { return g.map(function (w) { return new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); }); });
    function best(str, g, gi) { var R = RX[G.indexOf(g)]; for (var i = 0; i < R.length; i++) if (R[i].test(str)) return true; return false; }
    loadHsn(function (H) {
      var sc = {};
      H.idx.forEach(function (h) {
        var T = H.t[h], tot = 0, m = 0;
        for (var k = 0; k < G.length; k++) { if (best(T.tl, G[k])) { tot += 3; m++; } else if (best(T.fp, G[k])) { tot += 2; m++; } else if (best(T.hay, G[k])) { tot += 1; m++; } }
        if (m >= need) sc[h] = m * 100000 + tot * 1000 - T.tl.length;
      });
      D.r.forEach(function (r) { var d = clean(r[1]).toLowerCase(), h = r[0].slice(0, 6), tot = 0, m = 0; for (var k = 0; k < G.length; k++) { if (best(d, G[k])) { tot += 3; m++; } } if (m >= need) sc[h] = Math.max(sc[h] || 0, m * 100000 + tot * 1000 + 500 - d.length); });
      var top = Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a]; }).slice(0, 10), rank = {};
      top.forEach(function (h, i) { rank[h] = i; });
      var out2 = D.r.filter(function (r) { return rank[r[0].slice(0, 6)] != null; });
      out2.sort(function (a, b) { var ra = rank[a[0].slice(0, 6)], rb = rank[b[0].slice(0, 6)]; return ra !== rb ? ra - rb : (a[0] < b[0] ? -1 : 1); });
      results = out2.slice(0, 60); paintResults();
    });
  }
  function paintResults() {
    var box = el('wd-res'); if (!box) return;
    var c = C[S.cn], H = '';
    if (busy) { box.innerHTML = '<div class="wd-hint">' + busy + '</div>'; return; }
    if (qtext.trim().length >= 2 && !results.length) { box.innerHTML = '<div class="wd-hint">No match. Try fewer or simpler words, or the first 4 digits of the HS code.</div>'; return; }
    if (!results.length) { box.innerHTML = ''; return; }
    var hsT = HSN ? HSN.t : {};
    H += '<div class="wd-list">';
    results.forEach(function (r, i) {
      var ctx = hsT[r[0].slice(0, 6)] ? hsT[r[0].slice(0, 6)].title : '';
      var d = short(r[1]);
      H += '<button data-pick="' + i + '"><span class="c">' + dotted(r[0]) + '</span><span class="d">' + esc(d) + (ctx && /^(other|others?)$/i.test(d) ? '<small>' + esc(ctx) + '</small>' : '') + '</span><span class="r">' + esc(clean(r[2])) + '</span></button>';
    });
    H += '</div>';
    if (results.length >= 60) H += '<div class="wd-hint">Showing the first 60 matches. Type more of the code to narrow it down.</div>';
    box.innerHTML = H;
  }
  function sel() { try { return JSON.parse(get('sel') || 'null'); } catch (e) { return null; } }
  function curOf() { return C[S.cn].cur; }
  function render() {
    var c = C[S.cn], H = '', sl = sel();
    if (window.CK_EMBED) H += '<div class="wd-card"><h2 class="wd-h">' + '<img src="flags/' + S.cn.toLowerCase() + '.svg" alt="" width="28" height="21" style="vertical-align:-3px;border-radius:3px;box-shadow:0 0 0 1px rgba(11,42,74,.18)"> Importing to ' + c.n + '</h2><div class="wd-note" style="margin-top:0">' + c.note + '</div></div>';
    else H += '<div class="wd-card"><h2 class="wd-h">1. Where are you importing to?</h2><p class="wd-s">Choose the destination. The tool uses that country\'s official tariff, valuation base, taxes and fees.</p><div class="wd-cn" id="wd-cn">';
    if (!window.CK_EMBED) { ORDER.forEach(function (k) { H += '<button data-cn="' + k + '"' + (k === S.cn ? ' class="on"' : '') + '>' + C[k].flag + ' ' + C[k].n + '</button>'; });
    H += '</div><div class="wd-note">' + c.note + '</div></div>'; }
    H += '<div class="wd-card"><h2 class="wd-h">2. Your product</h2><p class="wd-s">' + (S.cn === 'SG' ? 'Singapore is a free port, so most goods have no customs duty.' : 'Type what you are importing (for example <i>mobile phone</i>, <i>cotton t-shirt</i>) or an HS code (for example <i>8517</i>). Pick the line that matches and the duty rate fills in from the ' + c.find[0] + '.') + '</p>';
    if (S.cn === 'SG') {
      H += '<div class="wd-note">Duty applies only to liquor, tobacco, motor vehicles and petroleum. For those goods this calculator cannot give an accurate figure, so ask a broker. For all other goods the duty is zero and GST of 9% is charged on the CIF value.</div>';
    } else if (sl) {
      H += '<div class="wd-sel"><div><b>' + dotted(sl.code) + '</b> ' + esc(sl.desc) + '</div><div class="wd-selr">Duty rate: <b>' + esc(sl.rate) + '</b></div><button id="wd-chg" class="wd-chg">Change product</button></div>';
      var pr = parseRate(sl.rate);
      if (pr.warn) H += '<div class="wd-note wd-warn">' + esc(pr.warn) + '</div>';
    } else {
      H += '<input class="wd-in" id="wd_q" placeholder="Product name or HS code" value="' + esc(qtext) + '" autocomplete="off"><div id="wd-res"></div>';
    }
    H += '</div>';
    H += '<div class="wd-card"><h2 class="wd-h">3. Your shipment</h2><p class="wd-s">Enter all amounts in <b>' + c.cur + '</b> (or any one currency, if you convert at the rate customs will use). Goods value is the invoice value on FOB or ex-works terms.</p><div class="wd-g">';
    H += field('g', 'Goods value (' + c.cur + ')', 'e.g. 20000', '', 0) + field('q', 'Quantity (optional)', 'e.g. 500', 'For cost per unit', 0);
    H += field('fr', 'International freight (' + c.cur + ')', 'e.g. 1800', 'Port or airport of loading to destination', 0) + field('ins', 'Insurance (' + c.cur + ')', 'e.g. 100', 'Cargo insurance for the voyage', 0);
    var pr2 = sl ? parseRate(sl.rate) : null;
    if (pr2 && pr2.spec) H += field('wt', 'Quantity for the specific duty (' + pr2.spec.lab + ')', 'e.g. 1000', 'This code charges ' + esc(pr2.spec.raw) + ', so the duty depends on ' + pr2.spec.lab + '.', 1);
    H += field('xd', 'Extra duties (%)', '0', S.cn === 'US' ? 'Additional tariffs such as Section 301, 232 or country-specific measures, anti-dumping or countervailing duty' : 'Anti-dumping or other additional duty, if any', 1);
    if (S.cn === 'EU') {
      var st = get('st') || 'DE', o = '';
      Object.keys(EUVAT).forEach(function (k) { o += '<option value="' + k + '"' + (k === st ? ' selected' : '') + '>' + EUVAT[k][0] + ' (' + EUVAT[k][1] + '%)</option>'; });
      H += '<div><label class="wd-l" for="wd_st">Member state of release</label><select class="wd-in" id="wd_st" data-k="st">' + o + '</select><div class="wd-hint">Standard VAT rate shown. Reduced rates apply to some goods.</div></div>';
    }
    if (S.cn === 'US') {
      var md = get('md') || 'sea';
      H += '<div><label class="wd-l" for="wd_md">Mode of transport</label><select class="wd-in" id="wd_md" data-k="md"><option value="sea"' + (md === 'sea' ? ' selected' : '') + '>Ocean</option><option value="air"' + (md === 'air' ? ' selected' : '') + '>Air or other</option></select><div class="wd-hint">The harbor maintenance fee applies to ocean cargo only.</div></div>';
    }
    if (c.tax && S.cn !== 'EU' && S.cn !== 'US') H += field('v', c.tax + ' rate (%)', String(c.vat), 'Change it if your goods have a reduced or zero rate', 0);
    if (S.cn === 'EU') H += field('v', 'VAT rate (%) override', '', 'Leave blank to use the state rate above', 0);
    H += '</div>';
    if (c.tax) H += '<label style="display:flex;gap:10px;align-items:flex-start;margin-top:14px;font-size:14px;color:#3D5873;cursor:pointer"><input type="checkbox" id="wd_cr" data-k="cr"' + (get('cr') === '1' ? ' checked' : '') + ' style="margin-top:3px"> <span>My business can claim the import ' + c.tax.replace(/^Import /, '') + ' back as a credit. Show landed cost without it.</span></label>';
    H += '</div><div id="wd-out"></div>';
    root.innerHTML = H;
    if (!sl && S.cn !== 'SG') { loadTariff(S.cn, function () { var i = el('wd_q'); if (i && i.value) search(i.value); else paintResults(); }); }
    calc();
  }
  function calc() {
    var c = C[S.cn], cur = c.cur, out = el('wd-out'); if (!out) return;
    var g = nm('g'), fr = nm('fr'), ins = nm('ins'), q = nm('q'), xd = nm('xd'), sl = sel();
    var pr = S.cn === 'SG' ? { pct: 0, spec: null } : sl ? parseRate(sl.rate) : null;
    if (!(g > 0)) { last = null; out.innerHTML = '<div class="wd-card" style="text-align:center;color:#5E7891">Enter the goods value to see the duty and taxes.</div>'; return; }
    if (!pr) { last = null; out.innerHTML = '<div class="wd-card" style="text-align:center;color:#5E7891">Pick your product above so the duty rate can be taken from the official tariff.</div>'; return; }
    var d = pr.pct, specAmt = pr.spec ? pr.spec.perUnit * nm('wt') : 0;
    var cif = g + fr + ins, base = c.base === 'fob' ? g : cif;
    var rows = [], fees = 0, dutyAmt = base * d / 100 + specAmt, xAmt = base * xd / 100, vat = 0;
    rows.push(['Goods value', g]);
    if (fr) rows.push(['International freight', fr]);
    if (ins) rows.push(['Insurance', ins]);
    rows.push(['<b>CIF value</b>', cif, 'sub']);
    var cb = c.base === 'fob' ? 'Duty base: goods value only (freight and insurance excluded)' : 'Duty base: CIF value';
    var rl = sl ? clean(sl.rate) : 'Free';
    rows.push(['Customs duty (' + esc(rl) + ')<small>' + cb + (pr.spec && !(nm('wt') > 0) ? '. Enter the quantity above to include the specific part.' : '') + '</small>', dutyAmt]);
    if (xAmt) rows.push(['Extra duties (' + xd + '%)', xAmt]);
    if (S.cn === 'US') {
      var mpf, mpfNote = '';
      if (g < 2500) { mpf = 2.77; mpfNote = 'Informal entry flat fee (value under $2,500)'; } else { mpf = Math.min(670.86, Math.max(34.58, g * 0.003464)); mpfNote = '0.3464% of value, minimum $34.58, maximum $670.86 (from 1 Oct 2026)'; }
      var md = get('md') || 'sea', hmf = md === 'sea' ? g * 0.00125 : 0;
      rows.push(['Merchandise processing fee (MPF)<small>' + mpfNote + '</small>', mpf]);
      if (hmf) rows.push(['Harbor maintenance fee (HMF)<small>0.125% of value, ocean only</small>', hmf]);
      return finish(rows, dutyAmt + xAmt + mpf + hmf, 0, cif, g, fr, ins, q, cur, cb, ['MPF is waived for some free-trade origins. Rates for tariffs and fees change often, so check the day you file.']);
    }
    if (S.cn === 'AU') {
      var voti = g + dutyAmt + xAmt + fr + ins, gstR = nm('v', 10);
      vat = voti * gstR / 100; rows.push(['GST (' + gstR + '% on goods + duty + freight + insurance)<small>Value of taxable importation ' + f(voti) + '</small>', vat]);
      return finish(rows, dutyAmt + xAmt + vat, vat, cif, g, fr, ins, q, cur, cb, g <= 1000 ? ['Consignments of AUD 1,000 or less are generally treated as low value, and the rules differ. Check before relying on this figure.'] : []);
    }
    var vr = S.cn === 'EU' ? (get('v') !== undefined && String(get('v')).trim() !== '' ? nm('v') : EUVAT[get('st') || 'DE'][1]) : nm('v', c.vat);
    var vb = cif + dutyAmt + xAmt;
    vat = vb * vr / 100;
    var lbl = S.cn === 'JP' ? 'Consumption tax (' + vr + '%)<small>National 7.8% plus local 2.2% on CIF + duty</small>' : S.cn === 'EU' ? 'Import VAT (' + vr + '%, ' + EUVAT[get('st') || 'DE'][0] + ')<small>On CIF + duty</small>' : c.tax + ' (' + vr + '% on CIF + duty)';
    rows.push([lbl, vat]);
    var notes = [];
    if (S.cn === 'GB') notes.push('Postponed VAT accounting lets VAT-registered importers account for import VAT on their return instead of paying it at the border.');
    return finish(rows, dutyAmt + xAmt + fees + vat, vat, cif, g, fr, ins, q, cur, cb, notes);
  }
  function finish(rows, tax, credit, cif, g, fr, ins, q, cur, cb, notes) {
    var landed = cif + tax, net = landed - credit, useNet = get('cr') === '1' && credit > 0;
    var shown = useNet ? net : landed, eff = g > 0 ? (shown - g - fr - ins) / g * 100 : 0;
    var H = '<div class="wd-big"><div class="k">' + (useNet ? 'LANDED COST AFTER TAX CREDIT' : 'LANDED COST') + ' · ' + cur + '</div><div class="v">' + f(shown, cur === 'JPY' ? 0 : 2) + '</div><div class="u">Duty, taxes and fees add ' + f(useNet ? tax - credit : tax, cur === 'JPY' ? 0 : 2) + ' (' + f(eff, 1) + '% of goods value)' + (q > 0 ? '. About ' + f(shown / q, cur === 'JPY' ? 0 : 2) + ' per unit.' : '.') + '</div></div>';
    H += '<div class="wd-card"><h2 class="wd-h">The breakdown</h2><table class="wd-t">';
    var L = [];
    rows.forEach(function (r) { H += '<tr' + (r[2] ? ' class="sub"' : '') + '><td>' + r[0] + '</td><td>' + f(r[1], cur === 'JPY' ? 0 : 2) + '</td></tr>'; L.push(r[0].replace(/<small>.*?<\/small>/g, '').replace(/<[^>]+>/g, '') + ': ' + cur + ' ' + f(r[1], cur === 'JPY' ? 0 : 2)); });
    H += '<tr class="sub"><td>Total duty, taxes and fees</td><td>' + f(tax, cur === 'JPY' ? 0 : 2) + '</td></tr>';
    H += '<tr class="sub"><td>Landed cost (cash at the border)</td><td>' + f(landed, cur === 'JPY' ? 0 : 2) + '</td></tr>';
    if (credit > 0) H += '<tr class="sub"><td>Landed cost without the creditable tax</td><td>' + f(net, cur === 'JPY' ? 0 : 2) + '</td></tr>';
    H += '</table>';
    (notes || []).forEach(function (n) { H += '<div class="wd-note">' + n + '</div>'; });
    H += '<div class="wd-note wd-warn">Indicative only. The duty rate is the standard (most-favoured-nation or general) rate from the official tariff. Lower preferential rates may apply under a trade agreement or for certain origins, and anti-dumping or other additional duties are not included unless you add them. Not including port charges, clearance fees, inland transport or other local costs. Confirm with a licensed customs broker before you file.</div>';
    H += '<div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap"><a class="wd-a" href="hsn-code-finder.html" style="background:#EEF6FD;color:#0A6CC2">Find the HSN code</a><a class="wd-a" href="https://wa.me/message/6YB7I76DV6UJL1" target="_blank" rel="noopener" style="background:#25D366;color:#073B1B">Ask a licensed broker on WhatsApp</a></div></div>';
    el('wd-out').innerHTML = H;
    last = { title: C[S.cn].n + ' import duty and tax', lines: L.concat(['Total duty, taxes and fees: ' + cur + ' ' + f(tax, cur === 'JPY' ? 0 : 2), 'Landed cost: ' + cur + ' ' + f(landed, cur === 'JPY' ? 0 : 2), 'Indicative estimate. Confirm the rate and classification with a licensed customs broker.']) };
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cn]');
    if (b) { S.cn = b.dataset.cn; save(); render(); return; }
    var pk = e.target.closest('[data-pick]');
    if (pk) { var r = results[+pk.dataset.pick], d = short(r[1]), hs = HSN && HSN.t[r[0].slice(0, 6)]; if (/^(other|others?)$/i.test(d) && hs) d = hs.title + ' › ' + d; setv('sel', JSON.stringify({ code: r[0], desc: d, rate: clean(r[2]) })); save(); render(); return; }
    if (e.target.id === 'wd-chg') { setv('sel', ''); save(); render(); }
  });
  root.addEventListener('input', function (e) { if (e.target.id === 'wd_q') { search(e.target.value); return; } var k = e.target.dataset.k; if (!k || e.target.type === 'checkbox' || e.target.tagName === 'SELECT') return; setv(k, e.target.value); save(); calc(); });
  root.addEventListener('change', function (e) {
    var k = e.target.dataset.k; if (!k) return;
    if (e.target.type === 'checkbox') setv(k, e.target.checked ? '1' : '0'); else setv(k, e.target.value);
    save(); calc();
  });
  window.CK_WORLD = function () { return last; };
  window.CK_WORLD_SET = function (cc) { if (C[cc]) { S.cn = cc; save(); render(); } };
  render();
})();
