/* Home page "Trade Desk" cards: puts a photo on each card and, on the English home page,
   fills the three cards with the latest briefs from /api/briefs (the same feed as the Trade Desk page). */
(function () {
  'use strict';
  var PICS = {
    customs: ['customs-poster.jpg', 'trade-compliance-poster.jpg'],
    routes: ['hero-poster.jpg', 'port-poster.jpg'],
    trade: ['port-poster.jpg', 'consolidation-poster.jpg'],
    policy: ['trade-compliance-poster.jpg', 'rio-poster.jpg'],
    mobile: ['bom-poster.jpg', 'air-poster.jpg'],
    air: ['air-poster.jpg', 'bom-poster.jpg']
  };
  var ALL = ['port-poster.jpg', 'customs-poster.jpg', 'hero-poster.jpg', 'bom-poster.jpg', 'consolidation-poster.jpg', 'trade-compliance-poster.jpg', 'rio-poster.jpg', 'air-poster.jpg'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var english = !/^\/(ar|de|es|fr|hi|ja|ko|pt|ru|zh)\//.test(location.pathname);

  function cards() {
    var desk = document.getElementById('desk');
    if (!desk) return [];
    return [].slice.call(desk.querySelectorAll('a.card')).filter(function (a) {
      var f = a.firstElementChild;
      return f && /aspect-ratio/.test(f.getAttribute('style') || '');
    });
  }
  function tagOf(a) {
    var s = a.children[1] && a.children[1].querySelector('span');
    var t = s ? (s.textContent.split('·')[0] || '').trim().toLowerCase() : '';
    return t;
  }
  function photo(a, tag, used) {
    var list = (PICS[tag] || []).concat(ALL), pic = list[0];
    for (var i = 0; i < list.length; i++) if (used.indexOf(list[i]) < 0) { pic = list[i]; break; }
    used.push(pic);
    var box = a.firstElementChild;
    box.style.padding = '0';
    box.style.overflow = 'hidden';
    box.style.background = '#0B2A4A';
    box.innerHTML = '<img src="/' + pic + '" alt="" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block">';
  }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fill(a, b) {
    var body = a.children[1], sp = body ? body.querySelectorAll(':scope > span') : [];
    if (sp.length < 3) return;
    var d = new Date(b.d + 'T00:00:00');
    sp[0].textContent = String(b.tag || 'trade').toUpperCase() + ' · ' + d.getDate() + ' ' + MON[d.getMonth()];
    sp[1].textContent = b.title || '';
    sp[2].textContent = b.summary || '';
    a.setAttribute('href', '/trade-desk');
  }
  function today() { var n = new Date(); return n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2); }

  // The page template can re-draw the section after load, so keep checking for a few seconds
  // and treat any card without a photo as new.
  var LIST = null;
  function run() {
    var cs = cards(), used = [];
    cs.forEach(function (a, i) {
      var b = LIST && LIST[i];
      var fresh = !a.firstElementChild.querySelector('img');
      if (b && (fresh || a.getAttribute('data-brief') !== b.d + b.title)) { fill(a, b); a.setAttribute('data-brief', b.d + b.title); }
      if (fresh) photo(a, b ? String(b.tag || '').toLowerCase() : (PICS[tagOf(a)] ? tagOf(a) : ['mobile', 'customs', 'routes'][i]), used);
      else used.push((a.firstElementChild.querySelector('img').getAttribute('src') || '').slice(1));
    });
  }
  var ticks = 0, iv = null;
  function start(list) {
    if (list) LIST = list;
    run();
    if (!iv) iv = setInterval(function () { run(); if (++ticks > 40) clearInterval(iv); }, 300);
  }

  if (!english) { start(null); return; }
  var done = false;
  var timer = setTimeout(function () { if (!done) { done = true; start(null); } }, 2500);
  fetch('/api/briefs').then(function (r) { return r.json(); }).then(function (j) {
    done = true; clearTimeout(timer); start(pick(j));
  }).catch(function () { if (!done) { done = true; clearTimeout(timer); start(null); } });

  function pick(j) {
    var all = (j && j.briefs || []).filter(function (b) { return b && b.d && b.title; });
    if (!all.length) return null;
    all.sort(function (x, y) { return x.d < y.d ? 1 : x.d > y.d ? -1 : 0; });
    var t = today(), past = all.filter(function (b) { return b.d <= t; });
    var out = past.slice(0, 3);
    if (out.length < 3) out = out.concat(all.filter(function (b) { return b.d > t; }).reverse()).slice(0, 3);
    return out;
  }
})();
