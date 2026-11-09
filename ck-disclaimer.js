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
    d.innerHTML = '<b>Just for an idea.</b> ' + txt;
    d.style.cssText = 'border-left:4px solid #E0A100;background:#FFF8E4;color:#6B4B00;border-radius:0 14px 14px 0;padding:12px 16px;font-size:14px;line-height:1.55;margin:0 0 16px;max-width:1100px';
    return d;
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
      el.parentNode.insertBefore(banner(T[k]), el); return;
    }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', go); else go();
  setTimeout(go, 1200);
})();
