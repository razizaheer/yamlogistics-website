/* YAM Logistics: import duty and tax calculator for 11 destinations. You enter the duty rate; the tool applies each country's valuation base, taxes and fees. Runs on the device. */
(function () {
  var root = document.getElementById('wd-root'); if (!root) return;
  var KEY = 'ck_wd_v1', D = document;
  var EUVAT = { AT: ['Austria', 20], BE: ['Belgium', 21], BG: ['Bulgaria', 20], HR: ['Croatia', 25], CY: ['Cyprus', 19], CZ: ['Czechia', 21], DK: ['Denmark', 25], EE: ['Estonia', 24], FI: ['Finland', 25.5], FR: ['France', 20], DE: ['Germany', 19], GR: ['Greece', 24], HU: ['Hungary', 27], IE: ['Ireland', 23], IT: ['Italy', 22], LV: ['Latvia', 21], LT: ['Lithuania', 21], LU: ['Luxembourg', 17], MT: ['Malta', 18], NL: ['Netherlands', 21], PL: ['Poland', 23], PT: ['Portugal', 23], RO: ['Romania', 21], SK: ['Slovakia', 23], SI: ['Slovenia', 22], ES: ['Spain', 21], SE: ['Sweden', 25] };
  // base: 'cif' (duty on goods + freight + insurance) or 'fob' (duty on goods only). vat = default tax rate %. chips = typical duty rates to tap.
  var C = {
    US: { n: 'United States', cur: 'USD', flag: '🇺🇸', base: 'fob', vat: 0, chips: [0, 2.5, 5, 7.5, 10, 25], tax: '', find: ['USITC Harmonized Tariff Schedule', 'https://hts.usitc.gov/'], note: 'US duty is charged on the transaction value of the goods, without international freight and insurance. Many goods also carry extra tariffs (for example Section 301, 232 or country-specific measures): add them in the extra duty box. Sales tax is not collected at the border.' },
    EU: { n: 'European Union', cur: 'EUR', flag: '🇪🇺', base: 'cif', vat: 21, chips: [0, 2.7, 4.7, 6.5, 8, 12], tax: 'Import VAT', find: ['EU Access2Markets (TARIC rates)', 'https://trade.ec.europa.eu/access-to-markets/en/home'], note: 'Duty is charged on the CIF value. Import VAT is charged on CIF plus duty at the rate of the member state where the goods are released. Pick the state.' },
    AE: { n: 'United Arab Emirates', cur: 'AED', flag: '🇦🇪', base: 'cif', vat: 5, chips: [0, 5, 50, 100], tax: 'VAT', find: ['Dubai Customs tariff', 'https://www.dubaicustoms.gov.ae/'], note: 'Most goods carry the 5% GCC common external tariff on CIF value. Some goods are 0% and a few (alcohol, tobacco) are far higher. VAT of 5% is charged on CIF plus duty. Free zone entry suspends both until goods move to the mainland.' },
    GB: { n: 'United Kingdom', cur: 'GBP', flag: '🇬🇧', base: 'cif', vat: 20, chips: [0, 2.5, 4, 6.5, 8, 12], tax: 'Import VAT', find: ['UK Trade Tariff', 'https://www.trade-tariff.service.gov.uk/'], note: 'Duty is charged on the CIF value, and import VAT on CIF plus duty. Some goods have a reduced or zero VAT rate. Postponed VAT accounting can remove the cash cost for VAT-registered importers.' },
    SA: { n: 'Saudi Arabia', cur: 'SAR', flag: '🇸🇦', base: 'cif', vat: 15, chips: [0, 5, 12, 15], tax: 'VAT', find: ['ZATCA customs tariff', 'https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/default.aspx'], note: 'Most goods carry 5% on CIF value, but many lines are higher (up to 15% and above). VAT of 15% is charged on CIF plus duty. Some goods need SASO conformity before release.' },
    OM: { n: 'Oman', cur: 'OMR', flag: '🇴🇲', base: 'cif', vat: 5, chips: [0, 5, 50, 100], tax: 'VAT', find: ['Oman Customs', 'https://www.customs.gov.om/'], note: 'Most goods carry 5% on CIF value under the GCC tariff. VAT of 5% is charged on the customs value plus duty and related charges.' },
    AU: { n: 'Australia', cur: 'AUD', flag: '🇦🇺', base: 'fob', vat: 10, chips: [0, 5], tax: 'GST', find: ['Australian Border Force tariff', 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification'], note: 'Duty is charged on the customs value, which is the goods without international freight and insurance. GST of 10% is charged on the value of the taxable importation: goods, duty, international freight and insurance. Consignments of AUD 1,000 or less are usually handled differently.' },
    JP: { n: 'Japan', cur: 'JPY', flag: '🇯🇵', base: 'cif', vat: 10, chips: [0, 3, 5, 8, 10], tax: 'Consumption tax', find: ['Japan Customs tariff', 'https://www.customs.go.jp/english/tariff/'], note: 'Duty is charged on the CIF value. Consumption tax is 10% on CIF plus duty (7.8% national and 2.2% local). A reduced 8% rate applies to some food. Amounts are in yen, so enter whole numbers.' },
    SG: { n: 'Singapore', cur: 'SGD', flag: '🇸🇬', base: 'cif', vat: 9, chips: [0], tax: 'GST', find: ['Singapore Customs', 'https://www.customs.gov.sg/'], note: 'Singapore is a free port. Only liquor, tobacco, motor vehicles and petroleum carry duty. Everything else is duty-free, and GST of 9% is charged on CIF plus any duty. For dutiable goods, enter the duty as a percentage of CIF.' },
    MX: { n: 'Mexico', cur: 'MXN', flag: '🇲🇽', base: 'cif', vat: 16, chips: [0, 5, 10, 15, 25, 35], tax: 'IVA', find: ['Mexico TIGIE via VUCEM', 'https://www.ventanillaunica.gob.mx/'], note: 'IGI is charged on the customs value (CIF). DTA is 0.8% of that value (a flat fee applies for some free-trade origins). IVA of 16% is charged on customs value plus IGI plus DTA. Goods from countries without a trade agreement can face higher rates.' },
    BR: { n: 'Brazil', cur: 'BRL', flag: '🇧🇷', base: 'cif', vat: 0, chips: [0, 10, 14, 16, 20, 35], tax: '', find: ['Siscomex tariff (TEC)', 'https://portal.siscomex.gov.br/'], note: 'Brazil stacks taxes. II is on CIF, IPI on CIF plus II, PIS and COFINS on CIF, and ICMS is calculated on a base that includes itself and the other taxes. ICMS varies by state (17 to 23%). Tax reform is being phased in, so confirm with a broker.' }
  };
  var ORDER = ['US', 'EU', 'AE', 'GB', 'SA', 'OM', 'AU', 'JP', 'SG', 'MX', 'BR'];
  var S = { cn: 'AE', v: {} };
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
  function curOf() { return C[S.cn].cur; }
  function render() {
    var c = C[S.cn], H = '';
    H += '<div class="wd-card"><h2 class="wd-h">1. Where are you importing to?</h2><p class="wd-s">Choose the destination. The tool uses that country\'s valuation base, taxes and fees.</p><div class="wd-cn" id="wd-cn">';
    ORDER.forEach(function (k) { H += '<button data-cn="' + k + '"' + (k === S.cn ? ' class="on"' : '') + '>' + C[k].flag + ' ' + C[k].n + '</button>'; });
    H += '</div><div class="wd-note">' + c.note + '</div></div>';
    H += '<div class="wd-card"><h2 class="wd-h">2. Your shipment</h2><p class="wd-s">Enter all amounts in <b>' + c.cur + '</b> (or any one currency, if you convert at the rate customs will use). Goods value is the invoice value on FOB or ex-works terms.</p><div class="wd-g">';
    H += field('g', 'Goods value (' + c.cur + ')', 'e.g. 20000', '', 0) + field('q', 'Quantity (optional)', 'e.g. 500', 'For cost per unit', 0);
    H += field('fr', 'International freight (' + c.cur + ')', 'e.g. 1800', 'Port or airport of loading to destination', 0) + field('ins', 'Insurance (' + c.cur + ')', 'e.g. 100', 'Cargo insurance for the voyage', 0);
    H += '</div></div>';
    H += '<div class="wd-card"><h2 class="wd-h">3. Duty and taxes</h2><p class="wd-s">The duty rate depends on the HS code and the origin. Look it up in the official tariff, then type it here.</p><div class="wd-g">';
    var dl = S.cn === 'BR' ? 'Import duty II (%)' : S.cn === 'MX' ? 'Import duty IGI (%)' : 'Customs duty rate (%)';
    H += '<div class="w"><label class="wd-l" for="wd_d">' + dl + '</label><input class="wd-in" id="wd_d" data-k="d" inputmode="decimal" placeholder="e.g. ' + (c.chips[2] != null ? c.chips[2] : 5) + '" value="' + esc(get('d') == null ? '' : get('d')) + '"><div class="wd-chips" id="wd-chips">';
    c.chips.forEach(function (p) { H += '<button data-p="' + p + '">' + p + '%</button>'; });
    H += '</div><div class="wd-hint">Tap a typical rate or type your own. Find the exact rate: <a href="' + c.find[1] + '" target="_blank" rel="noopener">' + c.find[0] + '</a>. Tip: use our HSN code finder to get the product code first.</div></div>';
    H += field('xd', 'Extra duties (%)', '0', S.cn === 'US' ? 'Additional tariffs, anti-dumping or countervailing duty' : 'Anti-dumping or other additional duty, if any', 0);
    if (S.cn === 'EU') {
      var sel = get('st') || 'DE', o = '';
      Object.keys(EUVAT).forEach(function (k) { o += '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + EUVAT[k][0] + ' (' + EUVAT[k][1] + '%)</option>'; });
      H += '<div><label class="wd-l" for="wd_st">Member state of release</label><select class="wd-in" id="wd_st" data-k="st">' + o + '</select><div class="wd-hint">Standard VAT rate shown. Reduced rates apply to some goods.</div></div>';
    }
    if (S.cn === 'US') {
      var md = get('md') || 'sea';
      H += '<div><label class="wd-l" for="wd_md">Mode of transport</label><select class="wd-in" id="wd_md" data-k="md"><option value="sea"' + (md === 'sea' ? ' selected' : '') + '>Ocean</option><option value="air"' + (md === 'air' ? ' selected' : '') + '>Air or other</option></select><div class="wd-hint">The harbor maintenance fee applies to ocean cargo only.</div></div>';
    }
    if (c.tax && S.cn !== 'EU' && S.cn !== 'US') H += field('v', c.tax + ' rate (%)', String(c.vat), 'Change it if your goods have a reduced or zero rate', 0);
    if (S.cn === 'EU') H += field('v', 'VAT rate (%) override', '', 'Leave blank to use the state rate above', 0);
    if (S.cn === 'MX') H += field('dta', 'DTA (%)', '0.8', 'Standard 0.8% of customs value', 0);
    if (S.cn === 'BR') {
      H += field('ipi', 'IPI (%)', 'e.g. 10', 'From the TIPI table for the NCM code', 0) + field('pis', 'PIS-Importação (%)', '2.1', 'Standard 2.1%', 0) + field('cof', 'COFINS-Importação (%)', '9.65', 'Standard 9.65%', 0) + field('icms', 'ICMS (%)', '18', 'Your state rate, often 17 to 23%', 0);
    }
    H += '</div>';
    if (c.tax || S.cn === 'BR') {
      H += '<label style="display:flex;gap:10px;align-items:flex-start;margin-top:14px;font-size:14px;color:#3D5873;cursor:pointer"><input type="checkbox" id="wd_cr" data-k="cr"' + (get('cr') === '1' ? ' checked' : '') + ' style="margin-top:3px"> <span>My business can claim the import ' + (S.cn === 'BR' ? 'taxes (IPI, PIS, COFINS, ICMS)' : c.tax.replace(/^Import /, '')) + ' back as a credit. Show landed cost without it.</span></label>';
    }
    H += '</div><div id="wd-out"></div>';
    root.innerHTML = H;
    calc();
  }
  function calc() {
    var c = C[S.cn], cur = c.cur, out = el('wd-out'); if (!out) return;
    var g = nm('g'), fr = nm('fr'), ins = nm('ins'), q = nm('q'), d = nm('d'), xd = nm('xd');
    if (!(g > 0)) { last = null; out.innerHTML = '<div class="wd-card" style="text-align:center;color:#5E7891">Enter the goods value to see the duty and taxes.</div>'; return; }
    var cif = g + fr + ins, base = c.base === 'fob' ? g : cif;
    var rows = [], fees = 0, dutyAmt = base * d / 100, xAmt = base * xd / 100, vat = 0, vatLabel = '', rec = 0;
    rows.push(['Goods value', g]);
    if (fr) rows.push(['International freight', fr]);
    if (ins) rows.push(['Insurance', ins]);
    rows.push(['<b>CIF value</b>', cif, 'sub']);
    var cb = c.base === 'fob' ? 'Duty base: goods value only (freight and insurance excluded)' : 'Duty base: CIF value';
    var tail = [];
    if (S.cn === 'BR') {
      var ipi = nm('ipi'), pis = nm('pis', 2.1), cof = nm('cof', 9.65), icms = nm('icms', 18);
      var ii = dutyAmt, ipiA = (cif + ii + xAmt) * ipi / 100, pisA = cif * pis / 100, cofA = cif * cof / 100;
      var pre = cif + ii + xAmt + ipiA + pisA + cofA, icmsBase = icms < 100 ? pre / (1 - icms / 100) : pre, icmsA = icmsBase * icms / 100;
      rows.push(['Import duty II (' + d + '%)', ii]);
      if (xAmt) rows.push(['Extra duties', xAmt]);
      rows.push(['IPI (' + ipi + '% on CIF + II)', ipiA]);
      rows.push(['PIS-Importação (' + pis + '%)', pisA]);
      rows.push(['COFINS-Importação (' + cof + '%)', cofA]);
      rows.push(['ICMS (' + icms + '%, calculated "por dentro")<small>Base ' + f(icmsBase) + ' includes the ICMS itself</small>', icmsA]);
      var tx = ii + xAmt + ipiA + pisA + cofA + icmsA; rec = ipiA + pisA + cofA + icmsA;
      return finish(rows, tx, rec, cif, g, fr, ins, q, cur, cb, ['Brazil also charges the Siscomex fee, AFRMM on sea freight (8%) and state-specific extras, not included here. Whether IPI, PIS, COFINS and ICMS can be credited depends on your tax regime.']);
    }
    rows.push(['Customs duty (' + d + '%)<small>' + cb + '</small>', dutyAmt]);
    if (xAmt) rows.push(['Extra duties (' + xd + '%)', xAmt]);
    if (S.cn === 'US') {
      var mpf, mpfNote = '';
      if (g < 2500) { mpf = 2.77; mpfNote = 'Informal entry flat fee (value under $2,500)'; } else { mpf = Math.min(670.86, Math.max(34.58, g * 0.003464)); mpfNote = '0.3464% of value, minimum $34.58, maximum $670.86 (from 1 Oct 2026)'; }
      var md = get('md') || 'sea', hmf = md === 'sea' ? g * 0.00125 : 0;
      rows.push(['Merchandise processing fee (MPF)<small>' + mpfNote + '</small>', mpf]);
      if (hmf) rows.push(['Harbor maintenance fee (HMF)<small>0.125% of value, ocean only</small>', hmf]);
      var txu = dutyAmt + xAmt + mpf + hmf;
      return finish(rows, txu, 0, cif, g, fr, ins, q, cur, cb, ['MPF is waived for some free-trade origins. Rates for tariffs and fees change often, so check the day you file.']);
    }
    if (S.cn === 'AU') {
      var voti = g + dutyAmt + xAmt + fr + ins, gstR = nm('v', 10);
      vat = voti * gstR / 100; vatLabel = 'GST (' + gstR + '% on goods + duty + freight + insurance)<small>Value of taxable importation ' + f(voti) + '</small>'; rows.push([vatLabel, vat]);
      return finish(rows, dutyAmt + xAmt + vat, vat, cif, g, fr, ins, q, cur, cb, g <= 1000 ? ['Consignments of AUD 1,000 or less are generally treated as low value, and the rules differ. Check before relying on this figure.'] : []);
    }
    var vr = S.cn === 'EU' ? (get('v') !== undefined && String(get('v')).trim() !== '' ? nm('v') : EUVAT[get('st') || 'DE'][1]) : nm('v', c.vat);
    var vb = cif + dutyAmt + xAmt;
    if (S.cn === 'MX') {
      var dtaP = nm('dta', 0.8), dta = cif * dtaP / 100; rows.push(['DTA customs processing (' + dtaP + '%)', dta]); fees = dta; vb += dta;
    }
    vat = vb * vr / 100;
    var lbl = S.cn === 'JP' ? 'Consumption tax (' + vr + '%)<small>National 7.8% plus local 2.2% on CIF + duty</small>' : S.cn === 'EU' ? 'Import VAT (' + vr + '%, ' + EUVAT[get('st') || 'DE'][0] + ')<small>On CIF + duty</small>' : c.tax + ' (' + vr + '% on CIF + duty' + (S.cn === 'MX' ? ' + DTA' : '') + ')';
    rows.push([lbl, vat]);
    var notes = [];
    if (S.cn === 'SG' && d === 0) notes.push('Most goods in Singapore carry no duty. Only liquor, tobacco, motor vehicles and petroleum do.');
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
    H += '<div class="wd-note wd-warn">Indicative only. The result depends on the duty rate you enter, the exact HS code, the origin and any trade agreement or exemption. Not including port charges, clearance fees, inland transport or other local costs. Confirm with a licensed customs broker before you file.</div>';
    H += '<div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap"><a class="wd-a" href="hsn-code-finder.html" style="background:#EEF6FD;color:#0A6CC2">Find the HSN code</a><a class="wd-a" href="https://wa.me/message/6YB7I76DV6UJL1" target="_blank" rel="noopener" style="background:#25D366;color:#073B1B">Ask a licensed broker on WhatsApp</a></div></div>';
    el('wd-out').innerHTML = H;
    last = { title: C[S.cn].n + ' import duty and tax', lines: L.concat(['Total duty, taxes and fees: ' + cur + ' ' + f(tax, cur === 'JPY' ? 0 : 2), 'Landed cost: ' + cur + ' ' + f(landed, cur === 'JPY' ? 0 : 2), 'Indicative estimate. Confirm the rate and classification with a licensed customs broker.']) };
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cn]');
    if (b) { S.cn = b.dataset.cn; save(); render(); return; }
    var p = e.target.closest('[data-p]');
    if (p) { setv('d', p.dataset.p); save(); var i = el('wd_d'); if (i) i.value = p.dataset.p; calc(); }
  });
  root.addEventListener('input', function (e) { var k = e.target.dataset.k; if (!k || e.target.type === 'checkbox' || e.target.tagName === 'SELECT') return; setv(k, e.target.value); save(); calc(); });
  root.addEventListener('change', function (e) {
    var k = e.target.dataset.k; if (!k) return;
    if (e.target.type === 'checkbox') setv(k, e.target.checked ? '1' : '0'); else setv(k, e.target.value);
    save(); calc();
  });
  window.CK_WORLD = function () { return last; };
  render();
})();
