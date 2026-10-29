/* YAM branding on paper: every page prints with the YAM header and contact footer (Ctrl+P or the Print button). */
(function () {
  if (typeof document === 'undefined' || window.__yamPrint) return; window.__yamPrint = 1;
  if (/dg-labels/.test(location.pathname)) return; // IATA/UN regulated label artwork: printed exactly as published, no branding
  var BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^\/]*$/, '');
  var TOOLS = /(customs-duty-calculator|cbm-calculator|incoterms|hsn-code-finder|lithium-battery-checker|export-benefit-finder|container-sizes|track-shipment|trade-desk|fta|tracking\/)/;
  var L = { en: 'Print / Save as PDF', hi: 'प्रिंट / PDF सेव करें', ar: 'طباعة / حفظ PDF', zh: '打印 / 保存为 PDF', es: 'Imprimir / Guardar PDF', fr: 'Imprimer / Enregistrer en PDF', de: 'Drucken / Als PDF speichern', pt: 'Imprimir / Salvar PDF', ru: 'Печать / Сохранить PDF', ja: '印刷 / PDFで保存', ko: '인쇄 / PDF 저장' };
  function go() {
    var css = '.yam-pp{display:none}.yam-prb{position:fixed;left:18px;bottom:24px;z-index:60;display:inline-flex;align-items:center;gap:8px;background:#0B2A4A;color:#fff;border:0;border-radius:999px;padding:11px 16px;font:600 14px/1 Geist,system-ui,sans-serif;box-shadow:0 6px 18px rgba(11,42,74,.25);cursor:pointer}.yam-prb:hover{background:#0A6CC2}' +
      '@media (max-width:640px){.yam-prb{padding:10px 12px;font-size:13px;bottom:18px;left:12px}}' +
      '@media print{@page{margin:7mm 0 7mm}header.site,footer,.fab,.yam-prb,nav,#wire .wt,iframe{display:none!important}body{background:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      '.yam-pt{width:100%;border-collapse:collapse}.yam-pt>thead>tr>td,.yam-pt>tfoot>tr>td,.yam-pt>tbody>tr>td{padding:0}.yam-pp{display:flex!important;align-items:center;gap:12px;padding:0 10mm;background:#fff;font-family:Geist,Arial,sans-serif;color:#0B2A4A;break-inside:avoid}' +
      '.yam-ph{height:24mm;margin-bottom:5mm;border-bottom:1.1mm solid #0A6CC2;box-shadow:0 .6mm 0 #FFC93C}.yam-ph img{height:17mm}.yam-ph .n{flex:1}.yam-ph .n b{display:block;font:800 16pt Archivo,Arial,sans-serif}.yam-ph .n span{display:block;font-size:8pt;color:#5E7891}.yam-ph .n i{display:block;font-style:normal;font-weight:700;font-size:9pt;color:#0A6CC2}.yam-ph .t{text-align:right;font-weight:700;font-size:11pt;color:#0A6CC2;max-width:80mm}' +
      '.yam-pf{height:16mm;margin-top:5mm;background:#0B2A4A!important;color:#fff;border-top:.6mm solid #FFC93C}.yam-pf .c{flex:1}.yam-pf .c b{display:block;font:800 12.5pt Archivo,Arial,sans-serif;color:#FFC93C}.yam-pf .c span{font-size:8pt}.yam-pf .s{font-size:7pt;color:#C8D6E6;text-align:right}.yam-pf img{width:12.5mm;height:12.5mm;background:#fff;padding:.6mm}}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var t = (document.title || '').split(/\s[|–-]\s/)[0];
    var h = document.createElement('div'); h.className = 'yam-pp yam-ph'; h.setAttribute('data-notr', '');
    h.innerHTML = '<img src="' + BASE + 'yam-logo.svg" alt="YAM Logistics"><div class="n"><b>YAM Logistics Pvt. Ltd.</b><span>Licensed customs broker since 1992 &nbsp;|&nbsp; New Delhi &nbsp;|&nbsp; Mumbai &nbsp;|&nbsp; Mundra</span><i>www.yamlogistics.com</i></div><div class="t"></div>';
    h.querySelector('.t').textContent = t;
    var f = document.createElement('div'); f.className = 'yam-pp yam-pf'; f.setAttribute('data-notr', '');
    f.innerHTML = '<div class="c"><b>www.yamlogistics.com</b><span>+91 11 4160 3301 &nbsp;|&nbsp; info@yamlogistics.com &nbsp;|&nbsp; WhatsApp &amp; Telegram @YAMLOGISTICS</span></div><div class="s">Printed from www.yamlogistics.com<br>Scan for free tools, quotes and tracking</div><img src="' + BASE + 'yam-qr.png" alt="">';
    var T = null;
    // Chrome repeats a table's head and foot on every printed page, so the page is wrapped in one while printing.
    function wrap() {
      if (T) return;
      T = document.createElement('table'); T.className = 'yam-pt';
      T.innerHTML = '<thead><tr><td></td></tr></thead><tfoot><tr><td></td></tr></tfoot><tbody><tr><td></td></tr></tbody>';
      T.tHead.rows[0].cells[0].appendChild(h); T.tFoot.rows[0].cells[0].appendChild(f);
      var cell = T.tBodies[0].rows[0].cells[0], kids = Array.prototype.slice.call(document.body.childNodes);
      document.body.insertBefore(T, document.body.firstChild);
      kids.forEach(function (k) { if (k !== T && k.nodeName !== 'SCRIPT') cell.appendChild(k); });
    }
    function unwrap() {
      if (!T) return;
      var cell = T.tBodies[0].rows[0].cells[0];
      while (cell.firstChild) document.body.insertBefore(cell.firstChild, T);
      T.remove(); T = null;
    }
    window.__yamPrintWrap = wrap; window.__yamPrintUnwrap = unwrap;
    window.addEventListener('beforeprint', wrap); window.addEventListener('afterprint', unwrap);
    if (window.matchMedia) { var mq = window.matchMedia('print'); var cb = function (e) { if (e.matches) wrap(); }; mq.addListener ? mq.addListener(cb) : mq.addEventListener('change', cb); }
    if (TOOLS.test(location.pathname)) {
      var lg = (document.documentElement.lang || 'en').slice(0, 2), b = document.createElement('button');
      b.className = 'yam-prb'; b.type = 'button'; b.setAttribute('data-notr', '');
      b.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>';
      b.appendChild(document.createTextNode(L[lg] || L.en)); b.onclick = function () { window.print(); };
      document.body.appendChild(b);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
