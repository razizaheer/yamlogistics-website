/* YAM Logistics app: registers the offline service worker and offers "Install the app" where the browser allows it. */
(function () {
  'use strict';
  // Opened as the installed app? (home-screen app, or the Google Play app, which marks its first page with
  // ?source=app and an android-app:// referrer). Remembered for the rest of the app session.
  var standalone = false;
  try {
    standalone = (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches)) ||
      /android-app:/.test(document.referrer || '') || /[?&]source=app\b/.test(location.search) || sessionStorage.getItem('yam_app') === '1';
    if (standalone) sessionStorage.setItem('yam_app', '1');
  } catch (e) {}
  if (standalone) { document.documentElement.classList.add('yam-app'); appShell(); }

  // App look: compact header, slim footer and a bottom tab bar, like a normal phone app.
  function appShell() {
    var css = document.createElement('style');
    css.textContent =
      'html.yam-app{-webkit-tap-highlight-color:transparent}' +
      'html.yam-app body{padding-bottom:calc(72px + env(safe-area-inset-bottom))}' +
      'html.yam-app header.site .util .u1,html.yam-app header.site .calc-m{display:none!important}' +
      'html.yam-app footer{display:none!important}' +
      'html.yam-app .fab{bottom:calc(88px + env(safe-area-inset-bottom))!important}' +
      'html.yam-app .fab-tg{display:none!important}' +
      '#yam-tabs{position:fixed;left:0;right:0;bottom:0;z-index:9990;background:#FFFFFF;border-top:1px solid #E1EDF7;box-shadow:0 -6px 20px rgba(11,42,74,.08);display:flex;padding:6px 4px calc(6px + env(safe-area-inset-bottom));font:600 11px/1.2 Geist,system-ui,sans-serif}' +
      '#yam-tabs a{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 2px;min-height:52px;justify-content:center;color:#5E7891;text-decoration:none;border-radius:12px;user-select:none}' +
      '#yam-tabs a svg{width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}' +
      '#yam-tabs a.on{color:#0A6CC2}#yam-tabs a.on svg{fill:#E1EDF7}' +
      '#yam-tabs a:active{background:#F2F8FD}' +
      'html.yam-app header.site .util{display:none!important}' +
      'html.yam-app header.site .logo{height:38px!important}' +
      'html.yam-app header.site .nav-in{min-height:0!important;padding-top:6px!important;padding-bottom:6px!important}' +
      'html.yam-app .ft-hero{background:#FFFFFF!important}' +
      'html.yam-app .ft-hero>div{padding:14px 16px 2px!important}' +
      'html.yam-app .ft-hero>div>div:first-child{display:none!important}' +
      'html.yam-app .ft-hero h1{font-size:24px!important;line-height:1.15!important;margin:0!important}' +
      'html.yam-app .ft-hero p{display:none!important}' +
      
      'html.yam-app .ft-gw{padding:12px 12px 20px!important}' +
      'html.yam-app .ft-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}' +
      'html.yam-app .ft-grid .ftc{padding:14px!important;border-radius:16px!important;gap:6px!important;min-height:92px}' +
      'html.yam-app .ft-grid .ftc span:nth-child(2){font-size:16px!important;line-height:1.2!important}' +
      'html.yam-app .ft-grid .ftc span:nth-child(3),html.yam-app .ft-grid .ftc span:nth-child(4){display:none!important}' +
      'html.yam-app .ft-more{display:none!important}' +
      '#yam-slim{padding:18px 16px 8px;text-align:center;font:13px/1.5 Geist,system-ui,sans-serif;color:#5E7891}#yam-slim a{color:#0A6CC2;text-decoration:none}';
    document.head.appendChild(css);
    var lang = (location.pathname.match(/^\/(ar|de|es|fr|hi|ja|ko|pt|ru|zh)\//) || [])[1];
    var pre = lang ? '/' + lang : '';
    var I = {
      tools: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
      plan: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
      cbm: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h2M12 18h2M16 15v3"/>',
      docs: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13l2 2 4-4"/>',
      track: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
      hsn: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M8 9h5M8 12h3"/>',
      duty: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'
    };
    var tabs = [
      ['tools', '/free-tools', 'Tools', /^\/(free-tools|index)?(\.html)?$/],
      ['plan', pre + '/container-load-planner', 'Planner', /container-load-planner/],
      ['hsn', '/hsn-code-finder', 'HSN', /hsn-code-finder/],
      ['duty', '/customs-duty-calculator', 'Duty', /customs-duty-calculator|landed-cost/],
      ['track', '/track-shipment', 'Track', /track-shipment|my-shipments|^\/tracking\//]
    ];
    function build() {
      if (document.getElementById('yam-tabs')) return;
      var nav = document.createElement('nav');
      nav.id = 'yam-tabs';
      nav.setAttribute('aria-label', 'App');
      var p = location.pathname.replace(/^\/(ar|de|es|fr|hi|ja|ko|pt|ru|zh)(?=\/)/, '');
      nav.innerHTML = tabs.map(function (t) {
        return '<a href="' + t[1] + '"' + (t[3].test(p) ? ' class="on" aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + I[t[0]] + '</svg><span>' + t[2] + '</span></a>';
      }).join('');
      document.body.appendChild(nav);
      var slim = document.createElement('div');
      slim.id = 'yam-slim';
      slim.innerHTML = '<span>CargoKit by YAM Logistics</span> · <a href="/privacy">Privacy</a> · <a href="/contact">Contact</a>';
      var f = document.querySelector('footer');
      if (f) f.parentNode.insertBefore(slim, f); else document.body.appendChild(slim);
      if (window.YAM_TR) try { window.YAM_TR(nav); window.YAM_TR(slim); } catch (err) {}
    }
    if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
  }
  // Share / save / PDF for results (CBM, duty, HSN, container number) and the My saved page.
  (function () {
    var pth = location.pathname.replace(/^\/(ar|de|es|fr|hi|ja|ko|pt|ru|zh)(?=\/)/, '').replace(/\.html$/, '').replace(/\/$/, '');
    if (/^\/(cbm-calculator|customs-duty-calculator|hsn-code-finder|container-number-checker|landed-cost-calculator|freight-compare|world-duty-calculator)$/.test(pth)) {
      var k = document.createElement('script'); k.src = '/app/ck-kit.js?v=4'; k.defer = true; document.head.appendChild(k);
    }
  })();
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  var KEY = 'yam_install_dismissed', deferred = null;
  function dismissedRecently() { try { var t = +localStorage.getItem(KEY) || 0; return Date.now() - t < 30 * 864e5; } catch (e) { return false; } }
  function install() {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.finally(function () { deferred = null; hideBar(); setButtons(); });
  }
  function setButtons() { document.querySelectorAll('[data-yam-install]').forEach(function (b) { b.hidden = !deferred; b.onclick = install; }); }
  function hideBar() { var b = document.getElementById('yam-install'); if (b) b.remove(); }
  function showBar() {
    if (standalone || dismissedRecently() || document.getElementById('yam-install')) return;
    var bar = document.createElement('div');
    bar.id = 'yam-install';
    bar.setAttribute('role', 'dialog');
    bar.style.cssText = 'position:fixed;left:12px;right:84px;bottom:14px;z-index:9998;max-width:520px;background:#0B2A4A;color:#FFFFFF;border-radius:16px;padding:12px 14px;display:flex;gap:10px;align-items:center;box-shadow:0 12px 30px rgba(11,42,74,.3);font:14px/1.35 Geist,system-ui,sans-serif';
    bar.innerHTML = '<img src="/app/icon-192.png" alt="" width="40" height="40" style="border-radius:10px;background:#fff;flex:0 0 auto">' +
      '<span style="flex:1"><b style="display:block">Install CargoKit, our free app</b><span style="color:#CFE3F5">Our tools on your home screen, even with no signal.</span></span>' +
      '<button type="button" data-a="i" style="border:0;border-radius:999px;background:#FFC93C;color:#0B2A4A;font:inherit;font-weight:700;padding:9px 14px;min-height:40px;cursor:pointer">Install</button>' +
      '<button type="button" data-a="x" aria-label="Close" style="border:0;background:transparent;color:#CFE3F5;font-size:22px;line-height:1;padding:4px 6px;cursor:pointer">×</button>';
    bar.addEventListener('click', function (e) {
      var a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'i') install();
      else { try { localStorage.setItem(KEY, String(Date.now())); } catch (err) {} hideBar(); }
    });
    document.body.appendChild(bar);
    if (window.YAM_TR) try { window.YAM_TR(bar); } catch (err) {}
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e; setButtons();
    // offer it on the tool pages, a few seconds after the page opens
    if (/(planner|calculator|checker|labels|incoterms|finder|sizes|generator|track|free-tools)/.test(location.pathname)) setTimeout(showBar, 4000);
  });
  window.addEventListener('appinstalled', function () { deferred = null; hideBar(); setButtons(); });
  document.addEventListener('DOMContentLoaded', setButtons);

  // Ask for a Play Store rating once, after a few successful results (app mode only)
  if (standalone) (function () {
    var K = 'ck_rate_v1';
    function get() { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) { return {}; } }
    function set(o) { try { localStorage.setItem(K, JSON.stringify(o)); } catch (e) {} }
    function ask() {
      var s = get(); if (s.done || document.getElementById('ck-rate')) return;
      var es = /^es/.test(document.documentElement.lang), pt = /^pt/.test(document.documentElement.lang);
      var tx = es ? ['¿Te sirve CargoKit?', 'Calificar', 'Ahora no'] : pt ? ['Gostando do CargoKit?', 'Avaliar', 'Agora não'] : ['Finding CargoKit useful?', 'Rate it', 'Not now'];
      var d = document.createElement('div'); d.id = 'ck-rate';
      d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:9999;background:#0a5fc4;color:#fff;border-radius:14px;padding:12px 14px;display:flex;gap:10px;align-items:center;font:600 15px Inter,system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.3)';
      d.innerHTML = '<span style="flex:1">' + tx[0] + '</span><a href="https://play.google.com/store/apps/details?id=ai.cargokit.app" style="background:#ffc72c;color:#111;padding:8px 14px;border-radius:10px;text-decoration:none">' + tx[1] + '</a><button style="background:none;border:0;color:#fff;font:inherit;opacity:.85">' + tx[2] + '</button>';
      d.querySelector('a').onclick = function () { set({ done: 1 }); d.remove(); };
      d.querySelector('button').onclick = function () { set({ n: -5, later: 1 }); if (get().later2) set({ done: 1 }); d.remove(); };
      document.body.appendChild(d);
    }
    function ok() {
      var s = get(); if (s.done) return;
      s.n = (s.n || 0) + 1; set(s);
      if (s.n === 6) setTimeout(ask, 1500);
    }
    var seen = {};
    document.addEventListener('yam-dc', function () { if (window.YAM_DC_LAST && !seen.dc) { seen.dc = 1; ok(); } });
    document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('#ck-pill, .ck-share, [data-ck-ok]'); if (b) ok(); });
    // one count per visit to a tool page that has produced a result
    setTimeout(function () { if (/container-number|freight-compare|world-duty|cbm|hsn/.test(location.pathname) && !seen.p) { seen.p = 1; ok(); } }, 20000);
  })();
})();

// "My top 3": the starred row at the top of the Free Tools menu (and of the Free Tools page).
// Defaults are the 3D load planner, HSN finder and duty calculator; each visitor can star any 3 tools
// with the ☆ next to a tool. Kept on this device only (localStorage), nothing is sent anywhere.
(function () {
  var KEY = 'ck_stars', DEF = ['load', 'hsn', 'duty'], MAX = 3;
  function get() {
    try { var a = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(a)) return a.slice(0, MAX); } catch (e) {}
    return DEF.slice();
  }
  function set(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  function pin(on) { return on ? '★' : '☆'; }
  function render() {
    var stars = get();
    // menu: star buttons on every tool, and the top row rebuilt from the chosen tools
    [].forEach.call(document.querySelectorAll('details.ftm'), function (d) {
      var row = d.querySelector('.ft-star'); if (!row) return;
      [].forEach.call(d.querySelectorAll('.ft-c a[data-k]'), function (a) {
        var b = a.querySelector('.ft-pin');
        if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'ft-pin'; a.appendChild(b); }
        var on = stars.indexOf(a.getAttribute('data-k')) >= 0;
        b.textContent = pin(on); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.setAttribute('aria-label', (on ? 'Unstar ' : 'Star ') + (a.querySelector('b') || a).textContent);
      });
      [].forEach.call(row.querySelectorAll('a, .ft-none'), function (x) { x.remove(); });
      stars.forEach(function (k) {
        var src = d.querySelector('.ft-c a[data-k="' + k + '"]'); if (!src) return;
        var c = src.cloneNode(true), p = c.querySelector('.ft-pin'); if (p) p.remove();
        row.appendChild(c);
      });
      if (!stars.length) { var n = document.createElement('div'); n.className = 'ft-none'; n.textContent = row.getAttribute('data-empty') || ''; row.appendChild(n); }
    });
    // Free Tools page: the "Start here" grid follows the same stars
    var top = document.getElementById('ft-top');
    if (top) {
      [].forEach.call(document.querySelectorAll('.ft-grid a.ftc[data-k]'), function (a) {
        if (top.contains(a)) return;
        var b = a.querySelector('.ft-pin');
        if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'ft-pin'; b.style.cssText = 'position:absolute;right:12px;top:12px'; a.style.position = 'relative'; a.appendChild(b); }
        var on = stars.indexOf(a.getAttribute('data-k')) >= 0;
        b.textContent = pin(on); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      top.innerHTML = '';
      stars.forEach(function (k) {
        var src = document.querySelector('.ft-grid:not(#ft-top) a.ftc[data-k="' + k + '"]'); if (!src) return;
        var c = src.cloneNode(true), p = c.querySelector('.ft-pin'); if (p) p.remove();
        c.style.background = '#FFF8E6'; c.style.border = '1.5px solid #FFE3A0';
        top.appendChild(c);
      });
    }
  }
  function warn(btn) {
    var d = btn.closest('details.ftm'), s = d && d.querySelector('.ft-sh small'), row = d && d.querySelector('.ft-star');
    var msg = (row && row.getAttribute('data-full')) || 'You can star 3 tools. Unstar one first.';
    if (s) { var old = s.textContent; s.textContent = msg; s.classList.add('warn'); setTimeout(function () { s.textContent = old; s.classList.remove('warn'); }, 2600); }
    else if (window.alert) { try { btn.title = msg; } catch (e) {} }
    btn.animate && btn.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }], { duration: 250 });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.ft-pin'); if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    var a = btn.closest('a[data-k]'); if (!a) return;
    var k = a.getAttribute('data-k'), s = get(), i = s.indexOf(k);
    if (i >= 0) s.splice(i, 1);
    else if (s.length >= MAX) { warn(btn); return; }
    else s.push(k);
    set(s); render();
  }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
