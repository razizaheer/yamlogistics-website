/* CargoKit: share and save a result (WhatsApp, share sheet, copy, PDF) and the "My saved" list.
   Saved results stay on this device (localStorage). Nothing is uploaded. */
(function (G) {
  'use strict';
  if (G.CK) return;
  var KEY = 'ck_saved_v1';
  var D = document;
  var path = location.pathname.replace(/^\/(ar|de|es|fr|hi|ja|ko|pt|ru|zh)(?=\/)/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/';
  var BASE = (function () { var s = D.currentScript; return s ? s.src.replace(/[^\/]*\/[^\/]*$/, '') : '/'; })();
  var TOOLS = {
    '/cbm-calculator': 'CBM calculator', '/customs-duty-calculator': 'Import duty calculator', '/hsn-code-finder': 'HSN code finder',
    '/container-number-checker': 'Container number checker'
  };

  // ---------- storage ----------
  function list() { try { var a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function put(a) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, 200))); return true; } catch (e) { return false; } }
  function add(it) {
    var a = list(), sig = it.tool + '|' + it.lines.join('|');
    a = a.filter(function (x) { return x.tool + '|' + x.lines.join('|') !== sig; });
    it.id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); it.t = Date.now();
    a.unshift(it); return put(a) ? it : null;
  }
  function remove(id) { put(list().filter(function (x) { return x.id !== id; })); }

  // ---------- extractors (read what the tool is showing) ----------
  function lines(txt) { return String(txt || '').split('\n').map(function (s) { return s.replace(/\s+$/, ''); }).filter(function (s) { return s.trim(); }); }
  function short(s, n) { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  var EX = {};
  EX['/cbm-calculator'] = function () {
    var m = D.getElementById('app'); if (!m) return null;
    var L = lines(m.innerText), out = [], i;
    var at = function (re) { for (var k = 0; k < L.length; k++) if (re.test(L[k])) return k; return -1; };
    var a = at(/^AIR · CHARGEABLE WEIGHT/), s = at(/^SEA · TOTAL VOLUME/);
    if (a < 0 || s < 0 || /^0(\.0)? kg$/.test(L[a + 1] || '')) return null;
    for (i = 0; i < L.length; i++) if (/^Line \d+:/.test(L[i])) out.push(L[i]);
    if (!out.length) return null;
    out.push('Air chargeable weight: ' + L[a + 1]);
    if (L[a + 2]) out.push(L[a + 2]);
    var vi = at(/^Volumetric weight$/), gi = at(/^Gross weight$/);
    if (vi >= 0) out.push('Volumetric weight: ' + L[vi + 1]);
    if (gi >= 0) out.push('Gross weight: ' + L[gi + 1]);
    out.push('Sea total volume: ' + L[s + 1] + (L[s + 2] ? ' (' + L[s + 2] + ')' : ''));
    ['20′ Standard', '40′ Standard', '40′ High Cube'].forEach(function (n) { var k = at(new RegExp('^' + n.replace('′', '.') + '$')); if (k >= 0) out.push(n + ': ' + L[k + 1]); });
    return { title: 'CBM and chargeable weight', lines: out };
  };
  EX['/customs-duty-calculator'] = function () {
    var r = D.getElementById('dc-root'); if (!r) return null;
    var L = lines(r.innerText), k = -1, i;
    for (i = 0; i < L.length; i++) if (/^INDICATIVE ESTIMATE/.test(L[i])) { k = i; break; }
    if (k < 0) return null;
    var out = [], hs = '', nm = '';
    for (i = 0; i < k; i++) if (/^\d{4} \d{2} \d{2}$/.test(L[i])) { hs = L[i]; nm = L[i + 1] || ''; }
    if (hs) out.push('HSN ' + hs + (nm ? ': ' + short(nm, 70) : ''));
    var co = D.getElementById('dc-o'), v = D.getElementById('dc-v'), cur = D.getElementById('dc-cur'), tm = D.getElementById('dc-t');
    if (co && co.selectedIndex > 0) out.push('Origin: ' + co.options[co.selectedIndex].text.replace(/ \(trade agreement\)/, ''));
    if (tm && v && v.value) out.push('Value: ' + (cur ? cur.value : '') + ' ' + v.value + ' (' + tm.value + ')');
    out.push('Total duty and IGST: ' + L[k + 1]);
    if (L[k + 2]) out.push(L[k + 2]);
    for (i = k + 3; i < L.length && i < k + 14; i++) {
      var p = L[i].split('\t');
      if (p.length > 1) { out.push(short(p[0].split(' · ')[0], 60) + ': ' + p[1]); if (/^Total duty/.test(p[0])) break; }
      else if (/^IGST: confirm|^Possible concessions/.test(L[i])) break;
    }
    out.push('Indicative estimate for guidance only. Verify with Customs and a licensed customs broker.');
    return { title: 'Import duty estimate', lines: out };
  };
  EX['/hsn-code-finder'] = function () {
    var r = D.getElementById('hf-root'); if (!r) return null;
    var L = lines(r.innerText), h = -1, i;
    for (i = 0; i < L.length; i++) if (/^\d+ likely codes? for/.test(L[i])) { h = i; break; }
    if (h < 0) return null;
    var out = [L[h]], n = 0;
    for (i = h + 1; i < L.length && n < 3; i++) {
      if (/^\d{4} \d{2} \d{2}$/.test(L[i])) {
        var row = L[i] + ': ' + short(L[i + 1] || '', 70), bd = '', im = '';
        for (var j = i + 1; j < i + 9 && j < L.length; j++) { if (/^Basic duty/.test(L[j])) bd = L[j]; if (/^Import:/.test(L[j])) im = L[j]; }
        out.push(row + (bd ? ' · ' + bd : '') + (im ? ' · ' + im : '')); n++;
      }
    }
    if (n === 0) return null;
    out.push('Suggested codes for guidance only, not a classification ruling.');
    return { title: 'HSN code suggestions', lines: out };
  };
  EX['/container-number-checker'] = function () { return G.CK_RESULT ? G.CK_RESULT() : null; };

  // ---------- compose / share ----------
  function textOf(it, withUrl) {
    var url = it.url || (location.origin + '/' + path.replace(/^\//, ''));
    return 'CargoKit by YAM Logistics\n' + it.title + '\n\n' + it.lines.join('\n') + (withUrl === false ? '' : '\n\n' + url);
  }
  function wa(it) { var u = 'https://wa.me/?text=' + encodeURIComponent(textOf(it)); try { G.open(u, '_blank', 'noopener'); } catch (e) { location.href = u; } }
  function native(it) {
    if (navigator.share) return navigator.share({ title: it.title, text: textOf(it, false), url: it.url || location.href }).catch(function () {});
    return copy(it);
  }
  function copy(it) {
    var t = textOf(it);
    var done = function () { toast('Copied'); };
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(done, function () { fallbackCopy(t); done(); });
    fallbackCopy(t); done(); return Promise.resolve();
  }
  function fallbackCopy(t) { var a = D.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; D.body.appendChild(a); a.select(); try { D.execCommand('copy'); } catch (e) {} a.remove(); }
  var jsP = null;
  function jspdf() { if (!jsP) jsP = new Promise(function (ok, no) { var s = D.createElement('script'); s.src = BASE + 'vendor/jspdf.umd.min.js'; s.onload = function () { ok(G.jspdf); }; s.onerror = no; D.head.appendChild(s); }); return jsP; }
  function img(u) { return fetch(BASE + u).then(function (r) { return r.blob(); }).then(function (b) { return new Promise(function (ok) { var f = new FileReader(); f.onload = function () { ok(f.result); }; f.onerror = function () { ok(null); }; f.readAsDataURL(b); }); }).catch(function () { return null; }); }
  function pdf(it) {
    toast('Making the PDF…');
    return Promise.all([jspdf(), img('app/icon-192.png'), img('cargokit-qr.png')]).then(function (r) {
      var lib = r[0], imgs = { logo: r[1], qr: r[2] };
      var doc = new lib.jsPDF({ unit: 'pt', format: 'a4' }), W = doc.internal.pageSize.getWidth(), y = 56, m = 48;
      var H = 64;
      doc.setFillColor(10, 108, 194); doc.rect(0, 0, W, H, 'F');
      doc.setFillColor(255, 201, 60); doc.rect(0, H, W, 4, 'F');
      if (imgs.logo) { try { doc.addImage(imgs.logo, 'PNG', m, 12, 40, 40); } catch (e) {} }
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('CargoKit', m + 50, 33);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text('Free tools for importers and exporters  |  by YAM Logistics', m + 50, 49);
      y = H + 4 + 40;
      doc.setTextColor(11, 42, 74); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text(clean(it.title), m, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(94, 120, 145);
      doc.text(new Date(it.t || Date.now()).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }), m, y += 16);
      doc.setDrawColor(225, 237, 247); doc.line(m, y += 12, W - m, y);
      doc.setFontSize(12); doc.setTextColor(11, 42, 74); y += 8;
      it.lines.forEach(function (ln) {
        doc.splitTextToSize(clean(ln), W - m * 2).forEach(function (part) { if (y > 720) { doc.addPage(); y = 56; } doc.text(part, m, y += 18); });
        y += 4;
      });
      var n = doc.getNumberOfPages();
      for (var i = 1; i <= n; i++) {
        doc.setPage(i);
        doc.setFillColor(243, 248, 253); doc.rect(0, 752, W, 90, 'F');
        doc.setFillColor(255, 201, 60); doc.rect(0, 752, W, 2, 'F');
        if (imgs.qr) { try { doc.addImage(imgs.qr, 'PNG', W - m - 56, 764, 56, 56); } catch (e) {} }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(10, 108, 194); doc.text('Get the free CargoKit app  |  cargokit.ai', m, 780);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(94, 120, 145);
        doc.text('YAM Logistics Pvt. Ltd.  |  Licensed customs broker (CHA)  |  yamlogistics.com', m, 794);
        doc.text('Indicative result for guidance only. Verify with Customs and a licensed customs broker.', m, 807);
        doc.text('Page ' + i + ' of ' + n, W - m - 56, 832);
      }
      var blob = doc.output('blob'), name = 'cargokit-' + slug(it.title) + '.pdf';
      var f = null; try { f = new File([blob], name, { type: 'application/pdf' }); } catch (e) {}
      if (f && navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: it.title }).catch(function () {});
      var a = D.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; D.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); URL.revokeObjectURL(a.href); }, 4000);
    }).catch(function () { toast('PDF is not available here. Try WhatsApp or Copy.'); });
  }
  function clean(s) { return String(s).replace(/[′]/g, "'").replace(/[″]/g, '"').replace(/₹/g, 'Rs ').replace(/m³/g, 'm3').replace(/[·•]/g, '-').replace(/[–—]/g, '-').replace(/[^\x20-\x7E]/g, ''); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'result'; }

  // ---------- small UI ----------
  var toastEl = null, toastT = 0;
  function toast(msg, linkText, href) {
    if (!toastEl) { toastEl = D.createElement('div'); toastEl.setAttribute('role', 'status'); toastEl.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(96px + env(safe-area-inset-bottom));z-index:10001;background:#0B2A4A;color:#fff;border-radius:999px;padding:12px 20px;font:600 14px/1.2 Geist,system-ui,sans-serif;box-shadow:0 8px 24px rgba(11,42,74,.3);max-width:90vw;text-align:center'; D.body.appendChild(toastEl); }
    toastEl.innerHTML = ''; toastEl.appendChild(D.createTextNode(msg));
    if (linkText) { var a = D.createElement('a'); a.href = href; a.textContent = ' ' + linkText; a.style.cssText = 'color:#FFC93C;margin-left:6px;text-decoration:none'; toastEl.appendChild(a); }
    toastEl.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(function () { toastEl.style.display = 'none'; }, 3200);
  }
  var pill = null, sheet = null, last = null;
  function css() {
    if (D.getElementById('ck-css')) return;
    var s = D.createElement('style'); s.id = 'ck-css';
    s.textContent = '#ck-pill{position:fixed;left:14px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:9980;display:none;align-items:center;gap:8px;background:#0A6CC2;color:#fff;border:0;border-radius:999px;padding:13px 18px;font:700 15px/1 Geist,system-ui,sans-serif;box-shadow:0 8px 22px rgba(10,108,194,.35);cursor:pointer;min-height:48px}' +
      '#ck-pill:active{transform:scale(.97)}' +
      '#ck-sheet{position:fixed;inset:0;z-index:10000;display:none;background:rgba(11,42,74,.45)}#ck-sheet.on{display:block}' +
      '#ck-box{position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:24px 24px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom));max-width:560px;margin:0 auto;font-family:Geist,system-ui,sans-serif;color:#0B2A4A;box-shadow:0 -10px 40px rgba(11,42,74,.25)}' +
      '#ck-box h3{margin:0 0 4px;font:800 19px/1.2 Archivo,Geist,sans-serif}#ck-box p{margin:0 0 14px;font-size:13.5px;line-height:1.45;color:#5E7891;max-height:4.4em;overflow:hidden}' +
      '.ck-g{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.ck-b{display:flex;align-items:center;gap:10px;border:0;border-radius:16px;background:#F2F8FD;color:#0B2A4A;padding:14px;font:600 15px/1.2 Geist,system-ui,sans-serif;cursor:pointer;min-height:56px;text-align:left}.ck-b:active{background:#E1EDF7}.ck-b i{font-style:normal;font-size:22px}' +
      '.ck-b.g{background:#E7F7EE}.ck-b.p{background:#0A6CC2;color:#fff}' +
      '#ck-x{display:block;margin:14px auto 0;border:0;background:none;color:#5E7891;font:600 14px Geist,sans-serif;padding:8px 16px;cursor:pointer}';
    D.head.appendChild(s);
  }
  function build() {
    css();
    pill = D.createElement('button'); pill.id = 'ck-pill'; pill.type = 'button'; pill.innerHTML = '<span aria-hidden="true">↗</span> Share / Save';
    pill.onclick = function () { var r = current(); if (r) openSheet(r); };
    D.body.appendChild(pill);
    sheet = D.createElement('div'); sheet.id = 'ck-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Share or save this result');
    sheet.innerHTML = '<div id="ck-box"><h3></h3><p></p><div class="ck-g">' +
      '<button class="ck-b g" data-a="wa" type="button"><i aria-hidden="true">💬</i>WhatsApp</button>' +
      '<button class="ck-b" data-a="pdf" type="button"><i aria-hidden="true">📄</i>PDF</button>' +
      '<button class="ck-b" data-a="sh" type="button"><i aria-hidden="true">📤</i>Share…</button>' +
      '<button class="ck-b" data-a="cp" type="button"><i aria-hidden="true">📋</i>Copy</button>' +
      '<button class="ck-b p" data-a="sv" type="button" style="grid-column:1/-1"><i aria-hidden="true">⭐</i>Save to My saved</button>' +
      '</div><button id="ck-x" type="button">Close</button></div>';
    D.body.appendChild(sheet);
    sheet.addEventListener('click', function (e) {
      if (e.target === sheet || e.target.id === 'ck-x') { sheet.classList.remove('on'); return; }
      var b = e.target.closest('[data-a]'); if (!b || !last) return;
      var a = b.getAttribute('data-a');
      if (a === 'wa') wa(last); else if (a === 'pdf') pdf(last); else if (a === 'sh') native(last); else if (a === 'cp') copy(last);
      else if (a === 'sv') { var it = add({ tool: path, toolName: TOOLS[path] || 'CargoKit', title: last.title, lines: last.lines, url: location.href.split('#')[0] }); sheet.classList.remove('on'); toast(it ? 'Saved' : 'Could not save on this device', it ? 'View' : '', 'saved'); }
    });
  }
  function current() {
    var f = EX[path]; if (!f) return null;
    var r = null; try { r = f(); } catch (e) { r = null; }
    if (r && r.lines && r.lines.length) { r.url = location.href.split('#')[0]; r.tool = path; return r; }
    return null;
  }
  function openSheet(r) {
    last = r; sheet.querySelector('h3').textContent = r.title; sheet.querySelector('p').textContent = r.lines.slice(0, 3).join(' · ');
    sheet.classList.add('on');
  }
  var rt = 0;
  function refresh() { clearTimeout(rt); rt = setTimeout(function () { if (!pill) return; pill.style.display = current() ? 'inline-flex' : 'none'; }, 350); }

  // ---------- "My saved" page ----------
  function savedPage() {
    var root = D.getElementById('ck-saved-root'); if (!root) return;
    function ago(t) { var d = Math.round((Date.now() - t) / 60000); if (d < 1) return 'just now'; if (d < 60) return d + ' min ago'; if (d < 1440) return Math.round(d / 60) + ' h ago'; return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    var confirmClear = false;
    function draw() {
      var a = list(); root.innerHTML = '';
      if (!a.length) {
        root.innerHTML = '<div style="background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:36px 28px;text-align:center"><div style="font-size:40px">⭐</div><div style="font:800 22px Archivo,Geist,sans-serif;margin:8px 0">Nothing saved yet</div><p style="color:#5E7891;font-size:15px;line-height:1.55;max-width:460px;margin:0 auto 18px">Run a calculation, tap Share / Save under the result, then Save to My saved. It will show up here.</p><div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center"><a href="cbm-calculator" style="background:#0A6CC2;color:#fff;border-radius:999px;padding:12px 20px;text-decoration:none;font-weight:600">CBM calculator</a><a href="customs-duty-calculator" style="background:#E1EDF7;color:#0B2A4A;border-radius:999px;padding:12px 20px;text-decoration:none;font-weight:600">Import duty</a><a href="container-number-checker" style="background:#E1EDF7;color:#0B2A4A;border-radius:999px;padding:12px 20px;text-decoration:none;font-weight:600">Container number</a></div></div>';
        return;
      }
      a.forEach(function (it) {
        var c = D.createElement('div'); c.style.cssText = 'background:#fff;border:1px solid #E1EDF7;border-radius:20px;padding:20px;margin-bottom:12px';
        c.innerHTML = '<div style="font:11px \'Geist Mono\',monospace;letter-spacing:.1em;color:#0A6CC2">' + esc((it.toolName || 'CARGOKIT').toUpperCase()) + ' · ' + esc(ago(it.t)) + '</div>' +
          '<div style="font:800 19px/1.25 Archivo,Geist,sans-serif;margin:6px 0 10px">' + esc(it.title) + '</div>' +
          '<div style="font-size:14.5px;line-height:1.55;color:#17436B">' + it.lines.slice(0, 5).map(esc).join('<br>') + (it.lines.length > 5 ? '<br><span style="color:#5E7891">+ ' + (it.lines.length - 5) + ' more lines</span>' : '') + '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px"></div>';
        var bar = c.lastChild;
        function btn(t, bg, fg, fn) { var b = D.createElement('button'); b.type = 'button'; b.textContent = t; b.style.cssText = 'border:0;border-radius:999px;min-height:42px;padding:0 16px;font:600 14px Geist,sans-serif;cursor:pointer;background:' + bg + ';color:' + fg; b.onclick = fn; bar.appendChild(b); }
        btn('💬 WhatsApp', '#E7F7EE', '#0B4D24', function () { wa(it); });
        btn('📄 PDF', '#E1EDF7', '#0B2A4A', function () { pdf(it); });
        btn('Share…', '#E1EDF7', '#0B2A4A', function () { native(it); });
        if (it.url) { var o = D.createElement('a'); o.href = it.url; o.textContent = 'Open tool'; o.style.cssText = 'display:inline-flex;align-items:center;border-radius:999px;min-height:42px;padding:0 16px;font:600 14px Geist,sans-serif;background:#0A6CC2;color:#fff;text-decoration:none'; bar.appendChild(o); }
        btn('Delete', '#FDE8E6', '#9B1C12', function () { remove(it.id); draw(); });
        root.appendChild(c);
      });
      var clr = D.createElement('button'); clr.type = 'button'; clr.style.cssText = 'border:0;background:none;color:#5E7891;font:600 14px Geist,sans-serif;padding:12px;cursor:pointer;display:block;margin:6px auto 0';
      clr.textContent = confirmClear ? 'Tap again to delete everything' : 'Clear all'; clr.onclick = function () { if (!confirmClear) { confirmClear = true; clr.textContent = 'Tap again to delete everything'; return; } put([]); confirmClear = false; draw(); };
      root.appendChild(clr);
    }
    draw();
  }

  G.CK = { list: list, add: add, remove: remove, share: wa, pdf: pdf, copy: copy, refresh: refresh, current: current };

  function init() {
    savedPage();
    if (!EX[path]) return;
    build();
    var m = D.getElementById('app') || D.body;
    try { new MutationObserver(refresh).observe(m, { childList: true, subtree: true, characterData: true }); } catch (e) {}
    D.addEventListener('input', refresh, true); D.addEventListener('change', refresh, true);
    refresh();
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})(window);
