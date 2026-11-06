/* YAM Logistics app: registers the offline service worker and offers "Install the app" where the browser allows it. */
(function () {
  'use strict';
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || /android-app:/.test(document.referrer || '');
  if (standalone) document.documentElement.classList.add('yam-app');
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
})();
