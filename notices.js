/* YAM Logistics — trade notifications library: DGFT (live from dgft.gov.in via /api/dgft) + CBIC and custom house notices curated by YAM (notices.json). */
(function () {
  'use strict';
  var root = document.getElementById('nt-root'); if (!root) return;
  var TB = (function () { var sc = document.currentScript || [].slice.call(document.scripts).filter(function (x) { return /notices\.js/.test(x.src); })[0]; return sc ? sc.src.replace(/[^\/]*$/, '') : ''; })();
  var API = /(^|\.)yamlogistics\.(pages\.dev|com)$/.test(location.hostname) ? '/' : 'https://yamlogistics.pages.dev/';
  var css = '.nt-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.nt-in{flex:1 1 320px;min-width:0;font:inherit;font-size:17px;padding:13px 16px;border:2px solid #CFE3F5;border-radius:14px;outline:none}.nt-in:focus{border-color:#0A6CC2}.nt-sel{font:inherit;font-size:14px;padding:11px 12px;border:1px solid #CFE3F5;border-radius:12px;background:#fff;color:#0B2A4A}.nt-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.nt-chip{border:1px solid #CFE3F5;background:#F7FBFF;border-radius:999px;padding:7px 14px;font:inherit;font-size:13.5px;cursor:pointer;color:#0B2A4A}.nt-chip.on{background:#0A6CC2;border-color:#0A6CC2;color:#fff}.nt-meta{font-size:13px;color:#5E7891;margin-top:12px}.nt-list{margin-top:14px;display:flex;flex-direction:column;gap:10px}.nt-it{background:#fff;border:1px solid #E1EDF7;border-radius:16px;padding:16px 18px}.nt-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:12.5px;color:#5E7891}.nt-b{display:inline-block;border-radius:999px;padding:3px 10px;font-weight:600;font-size:12px}.nt-s{font-weight:600;font-size:16px;line-height:1.4;margin:8px 0 0;color:#0B2A4A}.nt-sum{font-size:14.5px;line-height:1.6;color:#17436B;margin:8px 0 0;background:#F7FBFF;border-radius:10px;padding:10px 12px}.nt-sum b{color:#0B2A4A}.nt-act{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.nt-a{font-size:13.5px;font-weight:600;text-decoration:none;color:#0A6CC2;border:1px solid #CFE3F5;border-radius:999px;padding:6px 12px}.nt-more{display:block;margin:16px auto 0;font:inherit;font-weight:600;border:0;background:#0A6CC2;color:#fff;border-radius:999px;padding:12px 24px;cursor:pointer}.nt-note{font-size:13px;line-height:1.6;color:#5E7891;margin-top:16px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var SRC = { DGFT: ['DGFT', '#0F7B3F'], CBIC: ['CBIC Customs', '#0A6CC2'], 'Custom House': ['Custom House', '#B45309'] };
  var S = { q: '', src: '', type: '', year: '', shown: 30 }, ALL = [], AT = null;

  root.innerHTML = '<div class="nt-bar"><input class="nt-in" id="nt-q" placeholder="Search number, subject, port or HSN (e.g. 47/2026, SCMTR, Nhava Sheva, 7106)" autocomplete="off"><select class="nt-sel" id="nt-type"><option value="">All types</option><option>Notification</option><option>Public Notice</option><option>Trade Notice</option><option>Circular</option></select><select class="nt-sel" id="nt-year"><option value="">All years</option></select></div>'
    + '<div class="nt-chips" id="nt-src"><button class="nt-chip on" data-s="">All sources</button><button class="nt-chip" data-s="CBIC">CBIC Customs</button><button class="nt-chip" data-s="DGFT">DGFT</button><button class="nt-chip" data-s="Custom House">Custom houses</button></div>'
    + '<div class="nt-meta" id="nt-meta">Loading notifications…</div><div class="nt-list" id="nt-list"></div><button class="nt-more" id="nt-more" style="display:none">Show more</button>'
    + '<div class="nt-note">DGFT items are read automatically from dgft.gov.in, and Nhava Sheva (JNCH) public notices from jawaharcustoms.gov.in. CBIC and other custom house items are added by YAM from official circulars and trade association updates. Summaries are written by YAM for quick reading; the official document is the only authoritative text.</div>';

  function dkey(d) { var m = String(d || '').match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/); return m ? m[3] + ('0' + m[2]).slice(-2) + ('0' + m[1]).slice(-2) : '00000000'; }
  function dfmt(d) { var k = dkey(d); if (k === '00000000') return d || ''; return new Date(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function norm(x) { return String(x || '').toLowerCase(); }
  function typeOf(t) { t = norm(t); return /public notice/.test(t) ? 'Public Notice' : /trade notice/.test(t) ? 'Trade Notice' : /circular/.test(t) ? 'Circular' : /notification/.test(t) ? 'Notification' : 'Other'; }

  Promise.all([
    fetch(API + 'api/dgft').then(function (r) { return r.json(); }).catch(function () { return { items: [] }; }),
    fetch(TB + 'notices.json?v=' + Date.now().toString(36).slice(0, 5)).then(function (r) { return r.json(); }).catch(function () { return { items: [] }; }),
    fetch(API + 'api/jnch').then(function (r) { return r.json(); }).catch(function () { return { items: [] }; })
  ]).then(function (a) {
    AT = a[0].at;
    var dg = (a[0].items || []).map(function (x) { return { src: 'DGFT', t: x.t, n: x.n, d: x.d, s: x.s, u: x.u }; });
    var cu = (a[1].items || []).map(function (x) { return { src: x.src, by: x.by, t: x.t, n: x.n, d: x.d, s: x.s, sum: x.sum, who: x.who, due: x.due, tags: x.tags, u: x.file ? TB + x.file : (x.url || ''), ext: x.url && !x.file ? x.url : '' }; });
    var seen = {}; cu.forEach(function (x) { if (x.ext) seen[x.ext] = 1; });
    var jn = (a[2].items || []).filter(function (x) { return !seen[x.u]; }).map(function (x) { return { src: 'Custom House', by: 'JNCH, Nhava Sheva', t: 'Public Notice', n: x.n, d: x.d, s: x.s, u: x.u, ext: x.u, tags: ['JNPT', 'Nhava Sheva', 'JNCH'] }; });
    ALL = cu.concat(dg, jn).map(function (x) { x.k = dkey(x.d); x.tt = typeOf(x.t); x.txt = norm([x.n, x.s, x.sum, x.t, x.by, (x.tags || []).join(' ')].join(' ')); return x; }).sort(function (p, q) { return q.k.localeCompare(p.k); });
    var ys = {}; ALL.forEach(function (x) { if (x.k !== '00000000') ys[x.k.slice(0, 4)] = 1; });
    document.getElementById('nt-year').innerHTML = '<option value="">All years</option>' + Object.keys(ys).sort().reverse().map(function (y) { return '<option>' + y + '</option>'; }).join('');
    var p = new URLSearchParams(location.search); if (p.get('q')) { S.q = p.get('q'); document.getElementById('nt-q').value = S.q; }
    draw();
  });

  function item(x) {
    var sb = SRC[x.src] || [x.src, '#5E7891'], share = 'https://wa.me/?text=' + encodeURIComponent((x.src === 'DGFT' ? 'DGFT ' : x.src === 'CBIC' ? 'CBIC ' : '') + x.t + ' ' + x.n + ' (' + dfmt(x.d) + '): ' + x.s + ' ' + location.origin + location.pathname + '?q=' + encodeURIComponent(x.n));
    return '<div class="nt-it"><div class="nt-top"><span class="nt-b" style="background:' + sb[1] + '1a;color:' + sb[1] + '">' + h(sb[0]) + '</span><span><b>' + h(x.t) + '</b> ' + h(x.n) + '</span><span>· ' + h(dfmt(x.d)) + '</span>' + (x.by ? '<span>· ' + h(x.by) + '</span>' : '') + (x.due ? '<span class="nt-b" style="background:#FEF3F2;color:#B42318">Deadline ' + h(dfmt(x.due)) + '</span>' : '') + '</div>'
      + '<p class="nt-s">' + h(x.s) + '</p>'
      + (x.sum ? '<div class="nt-sum"><b>In short:</b> ' + h(x.sum) + (x.who ? '<br><b>Who it affects:</b> ' + h(x.who) : '') + '</div>' : '')
      + '<div class="nt-act">' + (x.u ? '<a class="nt-a" target="_blank" rel="noopener" href="' + h(x.u) + '">' + (x.src === 'DGFT' ? 'Official PDF on dgft.gov.in ↗' : x.ext ? 'Official PDF on ' + h(x.ext.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]) + ' ↗' : 'Download PDF ↓') + '</a>' : '<span style="font-size:13px;color:#5E7891">Official copy: ' + (x.src === 'CBIC' ? 'CBIC Tax Information Portal' : 'the issuing custom house') + '</span>') + '<a class="nt-a" target="_blank" rel="noopener" href="' + h(share) + '">Share on WhatsApp</a></div></div>';
  }
  function draw() {
    var q = norm(S.q).trim(), words = q.split(/\s+/).filter(Boolean);
    var L = ALL.filter(function (x) { return (!S.src || x.src === S.src) && (!S.type || x.tt === S.type) && (!S.year || x.k.slice(0, 4) === S.year) && words.every(function (w) { return x.txt.indexOf(w) >= 0; }); });
    document.getElementById('nt-meta').textContent = L.length + ' of ' + ALL.length + ' documents' + (AT ? ' · DGFT list checked ' + new Date(AT).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
    document.getElementById('nt-list').innerHTML = L.slice(0, S.shown).map(item).join('') || '<div class="nt-it">Nothing matches. Try fewer words, or WhatsApp us and we will find it for you.</div>';
    document.getElementById('nt-more').style.display = L.length > S.shown ? 'block' : 'none';
  }
  var tm; document.getElementById('nt-q').addEventListener('input', function (e) { clearTimeout(tm); tm = setTimeout(function () { S.q = e.target.value; S.shown = 30; draw(); }, 150); });
  document.getElementById('nt-type').addEventListener('change', function (e) { S.type = e.target.value; S.shown = 30; draw(); });
  document.getElementById('nt-year').addEventListener('change', function (e) { S.year = e.target.value; S.shown = 30; draw(); });
  document.getElementById('nt-src').addEventListener('click', function (e) { var b = e.target.closest('[data-s]'); if (!b) return; S.src = b.getAttribute('data-s'); S.shown = 30; [].forEach.call(this.children, function (c) { c.classList.toggle('on', c === b); }); draw(); });
  document.getElementById('nt-more').addEventListener('click', function () { S.shown += 30; draw(); });
})();
