/* "Clear form" button for the calculators and checkers.
   It forgets what the tool saved on this device and opens the tool fresh, so nobody has to reload or go back. */
(function () {
  'use strict';
  var T = {
    'customs-duty-calculator': { root: '#dc-root', keys: ['ck_wd_v1'] },
    'landed-cost-calculator': { root: '#lc-wrap', keys: [] },
    'cbm-calculator': { root: null, keys: [] },
    'freight-compare': { root: '#fc-root', keys: ['ck_fc_v1'] },
    'document-checker': { root: '#dc-root', keys: [] },
    'dg-cargo-checker': { root: '#dg-root', keys: [] },
    'lithium-battery-checker': { root: '#li-root', keys: [] },
    'container-number-checker': { root: '#cn-root', keys: [] },
    'export-benefit-finder': { root: '#eb-root', keys: [] }
  };
  var slug = (location.pathname.replace(/\/+$/, '').split('/').pop() || '').replace(/\.html$/, ''), c = T[slug]; if (!c) return;
  function place() {
    if (document.getElementById('ck-clear')) return true;
    var root = c.root ? document.querySelector(c.root) : null;
    if (!c.root) { var i = document.querySelector('main input'); root = i && (i.closest('div[style*="overflow-x"]') || i.parentElement); }
    if (!root || !root.parentNode) return false;
    var row = document.createElement('div'); row.style.cssText = 'display:flex;justify-content:flex-end;margin:0 0 10px';
    row.innerHTML = '<button type="button" id="ck-clear" style="border:1px solid #F3C5C5;background:#FDECEC;color:#B91C1C;border-radius:999px;padding:9px 16px;font:600 14px Geist,system-ui,sans-serif;cursor:pointer">✕ Clear form</button>';
    root.parentNode.insertBefore(row, root);
    row.firstChild.addEventListener('click', function () {
      if (!confirm('Clear everything on this form and start again?')) return;
      try { c.keys.forEach(function (k) { localStorage.removeItem(k); }); sessionStorage.setItem('ck_cleared', '1'); } catch (e) {}
      if (location.search || location.hash) location.replace(location.pathname); else location.reload();
    });
    return true;
  }
  function go() {
    // some pages redraw their body after loading, which removes the button: keep putting it back
    place(); setInterval(place, 2000);
    try { var m = document.querySelector('main') || document.body; new MutationObserver(function () { if (!document.getElementById('ck-clear')) place(); }).observe(m, { childList: true, subtree: true }); } catch (e) {}
    try { if (sessionStorage.getItem('ck_cleared')) { sessionStorage.removeItem('ck_cleared'); setTimeout(function () { var b = document.getElementById('ck-clear'); if (b) b.scrollIntoView({ block: 'center' }); }, 700); } } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
