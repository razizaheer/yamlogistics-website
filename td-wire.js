/* YAM Trade Desk: live wire (headlines from /api/news) + market numbers */
(function () {
  var DATA = null, BRIEFS = null, OPEN = -1, FILTER = 'all', SHOW = 12, KEY = 'yam-wire1', BKEY = 'yam-briefs1';
  var LABEL = { customs: 'CUSTOMS', policy: 'TRADE POLICY', routes: 'ROUTES', air: 'AIR', mobile: 'MOBILE', commodities: 'COMMODITIES', trade: 'TRADE' };
  var COL = { customs: '#0A6CC2', policy: '#7A3FC2', routes: '#0F7B3F', air: '#B45309', mobile: '#C2410C', commodities: '#8A6A00', trade: '#3D5873' };
  var TABS = [['all', 'All'], ['india', 'India'], ['customs', 'Customs'], ['policy', 'Trade policy'], ['routes', 'Ocean & routes'], ['air', 'Air'], ['commodities', 'Commodities']];
  var css = '#wire{max-width:1400px;margin:0 auto;padding:56px 32px 10px;font-family:Geist,system-ui,sans-serif;color:#0B2A4A}' +
    '.w-top{display:flex;flex-wrap:wrap;gap:14px 28px;align-items:flex-end;justify-content:space-between;margin-bottom:22px}' +
    '.w-h{font-family:Archivo,sans-serif;font-weight:900;font-stretch:110%;font-size:clamp(32px,3.6vw,48px);line-height:1;letter-spacing:-.02em;margin:0}' +
    '.w-live{display:inline-flex;align-items:center;gap:8px;font-family:"Geist Mono",monospace;font-size:12px;letter-spacing:.12em;color:#0F7B3F;margin-bottom:12px}' +
    '.w-dot{width:8px;height:8px;border-radius:50%;background:#16A34A;box-shadow:0 0 0 0 rgba(22,163,74,.5);animation:wp 2s infinite}@keyframes wp{70%{box-shadow:0 0 0 8px rgba(22,163,74,0)}100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}}' +
    '.w-sub{font-size:15px;color:#3D5873;line-height:1.55;margin:10px 0 0;max-width:640px}' +
    '.w-nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:0 0 22px}' +
    '.w-n{background:#F2F8FD;border-radius:18px;padding:16px 18px;text-decoration:none;color:#0B2A4A;display:block}.w-n:hover{background:#E6F1FB}' +
    '.w-nl{font-family:"Geist Mono",monospace;font-size:11px;letter-spacing:.1em;color:#5E7891}.w-nv{font-family:Archivo,sans-serif;font-weight:900;font-size:26px;margin:4px 0 2px}.w-ns{font-size:12.5px;color:#5E7891}' +
    '.w-up{color:#B42318}.w-dn{color:#0F7B3F}' +
    '.w-tabs{display:flex;flex-wrap:wrap;gap:6px}.w-tab{border:0;border-radius:999px;min-height:38px;padding:0 16px;font:600 14px Geist,sans-serif;cursor:pointer;background:#EEF6FD;color:#3D5873}.w-tab[aria-selected=true]{background:#0A6CC2;color:#fff}' +
    '.w-list{border-top:1px solid #E1EDF7}.w-it{display:grid;grid-template-columns:92px 1fr;gap:14px;padding:14px 4px;border-bottom:1px solid #E1EDF7;text-decoration:none;color:#0B2A4A}.w-it:hover .w-t{color:#0A6CC2}' +
    '.w-time{font-family:"Geist Mono",monospace;font-size:12px;color:#5E7891;padding-top:3px}.w-t{font-size:16.5px;font-weight:600;line-height:1.4}.w-meta{font-size:12.5px;color:#5E7891;margin-top:4px}.w-tag{font-family:"Geist Mono",monospace;font-size:10.5px;letter-spacing:.08em;font-weight:600;margin-right:8px}' +
    '.w-more{margin:18px 0 0;border:1px solid #CFE3F5;background:#fff;border-radius:999px;min-height:42px;padding:0 20px;font:600 14px Geist,sans-serif;color:#0A6CC2;cursor:pointer}' +
    '.w-note{font-size:12px;color:#7A8FA3;margin-top:14px;line-height:1.5}.w-empty{padding:24px 0;color:#5E7891}' +
    '.b-wrap{margin:0 0 44px}.b-h{font-family:Archivo,sans-serif;font-weight:900;font-stretch:110%;font-size:clamp(26px,2.6vw,34px);margin:0 0 6px}.b-sub{font-size:14.5px;color:#3D5873;margin:0 0 18px}' +
    '.b-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;align-items:start}.b-card{background:#0B2A4A;color:#fff;border-radius:22px;padding:22px 22px 18px;display:flex;flex-direction:column;gap:10px;min-height:250px}' +
    '.b-meta{font-family:"Geist Mono",monospace;font-size:11px;letter-spacing:.1em;color:#FFC93C}.b-t{font-family:Archivo,sans-serif;font-weight:800;font-size:21px;line-height:1.2}.b-s{font-size:15px;line-height:1.55;color:#DCEEFC}' +
    '.b-body{font-size:15px;line-height:1.65;color:#fff;white-space:pre-line;border-top:1px solid rgba(255,255,255,.15);padding-top:12px}.b-src{font-size:12.5px;color:#9FC3E6}.b-src a{color:#FFC93C}' +
    '.b-btn{align-self:flex-start;margin-top:auto;background:none;border:0;padding:4px 0;font:600 15px Geist,sans-serif;color:#FFC93C;cursor:pointer}' +
    '@media(max-width:700px){#wire{padding:40px 16px 6px}.w-nums{grid-template-columns:1fr 1fr;gap:8px}.w-n{padding:12px 14px}.w-nv{font-size:21px}.w-n:last-child .w-nv{font-size:15px!important}.w-it{grid-template-columns:1fr;gap:4px}.w-time{padding:0}}';
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ago(t) { var m = Math.round((Date.now() - t) / 60000); if (m < 60) return Math.max(m, 1) + ' min ago'; var hr = Math.round(m / 60); if (hr < 24) return hr + ' h ago'; var d = Math.round(hr / 24); return d === 1 ? 'yesterday' : d + ' days ago'; }
  function pct(v) { if (v == null || isNaN(v)) return ''; return '<span class="' + (v > 0 ? 'w-up' : v < 0 ? 'w-dn' : '') + '">' + (v > 0 ? '▲ ' : v < 0 ? '▼ ' : '') + Math.abs(v).toFixed(1) + '%</span>'; }
  function nums(n) {
    n = n || {}; var out = '';
    if (n.wci && n.wci.v) out += '<a class="w-n" href="' + h(n.wci.u) + '" target="_blank" rel="noopener nofollow"><div class="w-nl">CONTAINER RATES · DREWRY WCI</div><div class="w-nv">$' + n.wci.v.toLocaleString('en-US') + '</div><div class="w-ns">per 40ft, weekly composite ' + pct(n.wci.ch) + '</div></a>';
    if (n.brent && n.brent.v) out += '<a class="w-n" href="' + h(n.brent.u) + '" target="_blank" rel="noopener nofollow"><div class="w-nl">BRENT CRUDE</div><div class="w-nv">$' + n.brent.v.toFixed(2) + '</div><div class="w-ns">per barrel, ICE futures ' + pct(n.brent.ch) + '</div></a>';
    if (n.fx && n.fx.v) out += '<a class="w-n" href="customs-duty-calculator.html"><div class="w-nl">USD/INR · CBIC CUSTOMS RATE</div><div class="w-nv">₹' + n.fx.v.toFixed(2) + '</div><div class="w-ns">imports, notification ' + h(n.fx.no) + '</div></a>';
    out += '<a class="w-n" href="https://fbx.freightos.com/" target="_blank" rel="noopener nofollow"><div class="w-nl">MORE BENCHMARKS</div><div class="w-nv" style="font-size:18px;line-height:1.3;margin-top:8px">Freightos FBX · Baltic Dry ↗</div><div class="w-ns">daily container and bulk indices</div></a>';
    return out;
  }
  function briefs() {
    var b = (BRIEFS && BRIEFS.briefs) || []; if (!b.length) return '';
    return '<div class="b-wrap"><h2 class="b-h">This week from the desk</h2><p class="b-sub">Short briefs from our customs and freight team: what changed and what it means for your shipments.</p><div class="b-grid">' +
      b.slice(0, 6).map(function (x, i) {
        var c = LABEL[x.tag] ? x.tag : 'trade', dt = new Date(x.d + 'T00:00:00');
        return '<div class="b-card"><div class="b-meta">' + LABEL[c] + ' · ' + (isNaN(dt) ? '' : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })) + '</div><div class="b-t">' + h(x.title) + '</div><div class="b-s">' + h(x.summary) + '</div>' +
          (OPEN === i ? '<div class="b-body">' + h(x.body) + '</div>' + (x.src ? '<div class="b-src">Source: ' + (x.url ? '<a href="' + h(x.url) + '" target="_blank" rel="noopener nofollow">' + h(x.src) + ' ↗</a>' : h(x.src)) + '</div>' : '') : '') +
          '<button class="b-btn" data-b="' + i + '">' + (OPEN === i ? 'Close ↑' : 'Read the brief →') + '</button></div>';
      }).join('') + '</div></div>';
  }
  function render() {
    var el = document.getElementById('wire'); if (!el) return;
    var items = (DATA && DATA.items) || [];
    var list = items.filter(function (i) { return FILTER === 'all' || (FILTER === 'india' ? i.in : i.c.indexOf(FILTER) >= 0); });
    var rows = list.slice(0, SHOW).map(function (i) {
      var c = i.c[0] || 'trade';
      return '<a class="w-it" href="' + h(i.u) + '" target="_blank" rel="noopener nofollow"><div class="w-time">' + ago(i.d) + '</div><div><div class="w-t">' + h(i.t) + '</div><div class="w-meta"><span class="w-tag" style="color:' + COL[c] + '">' + LABEL[c] + '</span>' + h(i.s) + ' ↗</div></div></a>';
    }).join('');
    el.innerHTML = '<style>' + css + '</style>' + briefs() + '<div class="w-top"><div><div class="w-live"><span class="w-dot"></span>LIVE WIRE · UPDATED EVERY 30 MIN</div><h2 class="w-h">Trade &amp; shipping news</h2><p class="w-sub">Headlines that matter for Indian importers and exporters, from 16 trusted shipping, trade and business publications. Each link opens the original article.</p></div>' +
      '<div class="w-tabs" role="tablist" aria-label="News topic">' + TABS.map(function (t) { return '<button class="w-tab" role="tab" data-w="' + t[0] + '" aria-selected="' + (FILTER === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="w-nums">' + nums(DATA && DATA.n) + '</div>' +
      '<div class="w-list">' + (rows || '<div class="w-empty">' + (DATA ? 'No headlines in this topic in the last 7 days.' : 'Loading the latest headlines…') + '</div>') + '</div>' +
      (list.length > SHOW ? '<button class="w-more" data-more="1">Show more headlines</button>' : '') +
      '<div class="w-note">Headlines and links belong to their publishers. YAM Logistics selects and sorts them automatically and does not edit them. Market figures are for reference only' + (DATA && DATA.updated ? ' · checked ' + ago(DATA.updated) : '') + '.</div>';
  }
  // The live feeds run on Cloudflare; copies served elsewhere (e.g. GitHub Pages) read them from the Cloudflare site.
  var API = /(\.pages\.dev|yamlogistics\.com)$/.test(location.hostname) ? '/' : 'https://yamlogistics.pages.dev/';
  function load() {
    try { var bc = JSON.parse(localStorage.getItem(BKEY) || 'null'); if (bc) { BRIEFS = bc; render(); } } catch (e) { }
    fetch(API + 'api/briefs').then(function (r) { return r.json(); }).then(function (b) { if (b && b.briefs) { BRIEFS = b; try { localStorage.setItem(BKEY, JSON.stringify(b)); } catch (e) { } render(); } }).catch(function () { });
    try { var c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c && Date.now() - c.updated < 30 * 60e3) { DATA = c; render(); return; } if (c) { DATA = c; render(); } } catch (e) { }
    Promise.all([
      fetch(API + 'api/news').then(function (r) { return r.json(); }),
      fetch(API + 'api/cbic-fx').then(function (r) { return r.json(); }).catch(function () { return null; })
    ]).then(function (a) {
      var d = a[0] || {}; d.n = d.n || {};
      if (a[1] && a[1].r && a[1].r.USD) d.n.fx = { v: a[1].r.USD.i, no: a[1].n };
      DATA = d; try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { } render();
    }).catch(function () { if (!DATA) { DATA = { items: [], n: {} }; render(); } });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('#wire [data-w]'); if (t) { FILTER = t.getAttribute('data-w'); SHOW = 12; render(); return; }
    var bb = e.target.closest && e.target.closest('#wire [data-b]'); if (bb) { var i = +bb.getAttribute('data-b'); OPEN = OPEN === i ? -1 : i; render(); return; }
    var m = e.target.closest && e.target.closest('#wire [data-more]'); if (m) { SHOW += 15; render(); }
  });
  // the page body is redrawn by the site runtime; refill the wire whenever its slot comes back empty
  var mo = new MutationObserver(function () { var el = document.getElementById('wire'); if (el && !el.firstChild) render(); });
  function start() { mo.observe(document.body, { childList: true, subtree: true }); render(); load(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
