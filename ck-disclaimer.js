/* CargoKit / YAM Logistics: "for an idea only" notice on every calculator page. Also flags the page so branded PDFs carry the same line. */
(function () {
  var D = document, CALC = 'Indicative estimate for guidance only. Not a quote, customs ruling or professional advice. Confirm with a licensed customs broker.';
  window.CK_CALC = CALC;
  var T = {
    duty: 'Results are indicative estimates, not a quote, a customs ruling or professional advice. Duty rates, taxes, fees and exchange rates change, and what you actually pay depends on the exact classification, country of origin, customs value and the day you file. Lower rates under trade agreements, anti-dumping and other extra duties may apply and are not included unless you add them. Confirm with a licensed customs broker before you ship or file.',
    cost: 'Results are indicative estimates, not a quote or professional advice. Your real landed cost depends on the final duty and tax rates, exchange rates, freight and local charges on the day. Confirm with a licensed customs broker before you ship.',
    cbm: 'Results are a calculation aid only. Carriers and airlines apply their own rounding, minimums and rules, so the chargeable weight on your booking may differ. Confirm with your carrier or forwarder.',
    fc: 'Results are rough comparisons using the figures you enter, not a quote. Real freight rates, transit times and surcharges change daily and depend on the route, carrier and cargo. Ask for a live quote before you decide.',
    lp: 'Loading plans are a planning guide only. How cargo really fits depends on the true packed sizes, weights, strength of packing, stowage and the actual container or vehicle. The final stuffing, lashing and weight declaration are the responsibility of the shipper and the stuffing team. Confirm before loading.',
    hs: 'Suggestions are an aid, not a classification ruling. The correct HS or HSN code depends on the exact product, its composition and use. Confirm with a licensed customs broker before you file.'
  };
  function banner(txt) {
    var d = D.createElement('div'); d.className = 'ck-disc'; d.setAttribute('role', 'note');
    d.innerHTML = '<b>Just for an idea.</b> ' + txt + ' <a href="#disclaimer" style="color:#6B4B00;font-weight:700;text-decoration:underline">Read the full disclaimer</a>.';
    d.style.cssText = 'border-left:4px solid #E0A100;background:#FFF8E4;color:#6B4B00;border-radius:0 14px 14px 0;padding:12px 16px;font-size:14px;line-height:1.55;margin:0 0 16px;max-width:1100px';
    return d;
  }

  var NAMES = { cost: 'Landed Cost Calculator', cbm: 'CBM and Volumetric Weight Calculator', fc: 'Freight Comparison tool', lp: 'Container Load Planner', duty: 'Customs Duty Calculator', hs: 'HSN Code Finder' };
  var EXTRA = {
    cost: 'Duty, tax and exchange-rate figures come from public sources and may be out of date or incomplete. Customs duty is assessed only by the proper officer of Customs, and the amount finally assessed is what you pay. Freight, insurance and local charges are the figures you enter or rough assumptions, and real charges will differ.',
    cbm: 'Airlines, shipping lines and forwarders apply their own divisors, rounding, minimum charges and rules, so the chargeable weight or volume on your booking may differ from the result shown.',
    fc: 'Freight rates, transit times, surcharges and availability change daily and depend on route, carrier, cargo, season and market conditions. The Tool does not contain live rates and is not an offer to carry or to sell any service.',
    lp: 'The Tool does not know the true packed sizes, weights, strength, stackability, centre of gravity or lashing needs of your cargo, the condition of the container or vehicle, or local road and port limits. A plan on screen is not a stowage, lashing, safety or weight (VGM) certification. Dangerous goods, over-dimensional and special cargo need specialist planning.'
  };
  function legal(k) {
    var n = NAMES[k] || 'Tool', e = EXTRA[k] || '';
    var li = function (b, t) { return '<li style="margin-bottom:14px"><b>' + b + '</b> ' + t + '</li>'; };
    var d = D.createElement('div'); d.id = 'disclaimer'; d.className = 'ck-legal';
    d.style.cssText = 'background:#fff;border-top:1px solid #E1EDF7';
    d.innerHTML = '<div style="max-width:1000px;margin:0 auto;padding:72px 32px"><div style="font-family:\'Geist Mono\',monospace;font-size:12px;letter-spacing:.12em;color:#B42318;margin-bottom:14px">LEGAL DISCLAIMER · PLEASE READ</div>' +
      '<h2 style="font-family:Archivo,sans-serif;font-weight:900;font-size:clamp(28px,3.2vw,42px);line-height:1.05;letter-spacing:-.03em;margin:0 0 16px">Disclaimer and limitation of liability</h2>' +
      '<p style="font-size:17px;line-height:1.6;color:#17436B;margin:0 0 24px">This tool is for guidance only. Its results give you an idea, nothing more, and YAM Logistics Pvt. Ltd. accepts no legal responsibility for any use of it.</p>' +
      '<ol style="font-size:15px;line-height:1.65;color:#3D5873;padding-left:22px;margin:0">' +
      li('For guidance only.', 'The ' + n + ' (the “Tool”) is provided free of charge by YAM Logistics Pvt. Ltd. (“YAM”) for general information. Every result is an indicative estimate to give you an idea, not an exact figure.') +
      li('Not a quote or professional advice.', 'Results are not a quotation, offer, customs ruling, classification or valuation decision, or legal, tax, insurance, engineering or other professional advice. ' + e) +
      li('You are responsible for your own decisions.', 'The importer, exporter or shipper remains responsible for the correct classification, valuation, origin, declarations, packing, loading and documents for their own shipment.') +
      li('Data and results may be wrong or out of date.', 'The Tool relies on public sources, standard formulas and the figures you enter. Rates, rules and exchange rates change often. Errors can arise in the sources, in the formulas, in how the data is converted, or from wrong or missing inputs.') +
      li('No warranty.', 'The Tool and its results are provided “as is” and “as available”, without any warranty, express or implied, including as to accuracy, completeness, currency or fitness for a particular purpose.') +
      li('No liability.', 'To the fullest extent permitted by law, YAM, its directors, employees and agents accept no responsibility or liability for any loss, damage, cost or expense of any kind, whether direct, indirect or consequential, including any duty, tax, interest, penalty, fine, demurrage, detention, delay, cargo damage or loss of profit, arising from any use of or reliance on the Tool or its results.') +
      li('Verify before you act.', 'Before you quote a price, sign a contract, book freight, load cargo or file a declaration, check the facts with the official sources and with a licensed customs broker, carrier or forwarder.') +
      li('Our advice on your shipment is separate.', 'Using the Tool does not create a client relationship with YAM. If you engage YAM, our advice on your specific shipment is given separately in writing and is governed by our standard terms of business.') +
      li('Governing law.', 'This disclaimer is governed by the laws of India. Courts at New Delhi shall have exclusive jurisdiction. By using the Tool you accept this disclaimer.') +
      '</ol></div>';
    return d;
  }
  function addLegal(k) {
    if (D.getElementById('disclaimer')) return;
    var f = D.querySelector('footer'), n = legal(k);
    if (f && f.parentNode) f.parentNode.insertBefore(n, f); else D.body.appendChild(n);
  }
  function go() {
    if (D.querySelector('.ck-disc')) return;
    var map = [['ctabs', 'duty'], ['dc-root', 'cost'], ['fc-root', 'fc'], ['lp-root', 'lp'], ['hf-root', 'hs'], ['app', 'cbm']], i, el, k;
    var p = location.pathname;
    for (i = 0; i < map.length; i++) {
      el = D.getElementById(map[i][0]); if (!el) continue;
      k = map[i][1];
      if (map[i][0] === 'dc-root') k = /customs-duty/.test(p) ? 'duty' : /landed/.test(p) ? 'cost' : 'duty';
      if (map[i][0] === 'dc-root' && D.getElementById('ctabs')) continue;
      el.parentNode.insertBefore(banner(T[k]), el); addLegal(k); return;
    }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', go); else go();
  setTimeout(go, 1200);
})();
