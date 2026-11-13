/* Two customs money calculators for India, with the rule built in:
   1. charges for filing a bill of entry late (section 46(3) of the Customs Act and the Bill of Entry regulations as amended in 2021)
   2. interest on duty paid late (section 47(2), 15% a year, Notification 33/2016-Customs (N.T.))
   Everything is worked out on the device. */
(function () {
  'use strict';
  var D = document, root = D.getElementById('cl-root'); if (!root) return;
  var KEY = 'ck_cl_v1', DAY = 864e5;
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function dt(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; }
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function nice(d) { return d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
  function num(s) { var n = parseFloat(String(s || '').replace(/[, ₹]/g, '')); return isNaN(n) ? 0 : n; }
  var css = '#cl-root{font-family:Geist,system-ui,sans-serif;color:#0B2A4A}.cl-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:26px;margin-bottom:16px}.cl-h{font-family:Archivo,sans-serif;font-weight:800;font-size:22px;margin:0 0 4px}.cl-s{font-size:15px;line-height:1.55;color:#3D5873;margin:0 0 16px}' +
    '.cl-l{display:block;font-family:"Geist Mono",monospace;font-size:11.5px;letter-spacing:.08em;color:#5E7891;text-transform:uppercase;margin:0 0 6px}.cl-f{margin:0 0 14px}.cl-f input[type=date],.cl-f input[type=text]{width:100%;box-sizing:border-box;border:1.5px solid #CFE0EF;border-radius:14px;padding:13px 14px;font:600 17px Geist,system-ui,sans-serif;color:#0B2A4A;background:#fff;min-height:50px}.cl-f small{display:block;font-size:13px;color:#5E7891;margin-top:5px;line-height:1.45}' +
    '.cl-g{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}.cl-row{display:flex;flex-wrap:wrap;gap:8px}.cl-p{border:1.5px solid #CFE0EF;background:#fff;color:#0B2A4A;border-radius:999px;padding:10px 16px;font:600 15px Geist,system-ui,sans-serif;cursor:pointer;min-height:44px}.cl-p.on{background:#0A6CC2;border-color:#0A6CC2;color:#fff}.cl-ck{display:flex;gap:10px;align-items:flex-start;font-size:15px;line-height:1.45;cursor:pointer}.cl-ck input{width:22px;height:22px;flex:none;margin:0;accent-color:#0A6CC2}' +
    '.cl-out{border-radius:18px;padding:16px 18px;background:#F1F8FF;border:1px solid #CFE0EF}.cl-out.bad{background:#FFF4D6;border-color:#F3DE9B}.cl-out.ok{background:#EAF7EF;border-color:#BFE3CC}.cl-out b{display:block;font-family:Archivo,sans-serif;font-weight:900;font-size:30px}.cl-out p{font-size:14.5px;line-height:1.55;margin:6px 0 0;color:#17436B}.cl-b{border:0;border-radius:999px;padding:11px 18px;font:700 15px Geist,system-ui,sans-serif;cursor:pointer;min-height:44px;background:#fff;color:#B42318;box-shadow:inset 0 0 0 1.5px #F2B8B8}.cl-rule{font-size:13.5px;line-height:1.55;color:#3D5873;margin:14px 0 0;padding-top:12px;border-top:1px dashed #D6E6F4}' +
    '@media (max-width:640px){.cl-card{padding:18px;border-radius:18px}.cl-g{grid-template-columns:1fr}.cl-out b{font-size:26px}}';
  var st = D.createElement('style'); st.textContent = css; D.head.appendChild(st);
  var S = { place: 'sea', near: false, arr: '', fil: '', duty: '', nil: false, iduty: '', idue: '', ipaid: '' };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv) for (var k in S) if (sv[k] != null) S[k] = sv[k]; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  function late() {
    var a = dt(S.arr), f = dt(S.fil);
    if (!a || !f) return '<div class="cl-out"><p style="margin:0">Enter both dates to see the charge.</p></div>';
    var same = S.place === 'air' || (S.place === 'sea' && S.near), due = new Date(a.getTime() - (same ? 0 : DAY)), d = Math.round((f - due) / DAY);
    if (d <= 0) return '<div class="cl-out ok"><b>No late charge</b><p>The bill of entry was due by the end of ' + nice(due) + ' and was filed on ' + nice(f) + '.</p></div>';
    var ch = 5000 * Math.min(d, 3) + 10000 * Math.max(0, d - 3), cap = S.nil ? 50000 : num(S.duty) > 0 ? num(S.duty) : 0, capped = cap && ch > cap, pay = capped ? cap : ch;
    return '<div class="cl-out bad"><b>' + inr(pay) + '</b><p>Due by the end of ' + nice(due) + ', filed on ' + nice(f) + ': ' + d + (d === 1 ? ' day' : ' days') + ' late. ' + inr(5000) + ' a day for the first three days' + (d > 3 ? ', then ' + inr(10000) + ' a day for ' + (d - 3) + (d - 3 === 1 ? ' day' : ' days') + ', comes to ' + inr(ch) + '.' : ' comes to ' + inr(ch) + '.') +
      (capped ? ' The charge is limited to ' + (S.nil ? inr(50000) + ' because no duty is payable' : 'the duty payable on the bill of entry') + ', so ' + inr(pay) + ' applies.' : '') + '</p><p>The customs officer can waive the charge when there was good reason for the delay. Ask your customs broker to apply.</p></div>';
  }
  function intr() {
    var a = num(S.iduty), due = dt(S.idue), paid = dt(S.ipaid);
    if (!a || !due || !paid) return '<div class="cl-out"><p style="margin:0">Enter the duty and both dates to see the interest.</p></div>';
    var d = Math.round((paid - due) / DAY);
    if (d <= 0) return '<div class="cl-out ok"><b>No interest</b><p>The duty was paid on or before the day it was due.</p></div>';
    var i = a * 0.15 * d / 365;
    return '<div class="cl-out bad"><b>' + inr(i) + '</b><p>' + inr(a) + ' at 15% a year for ' + d + (d === 1 ? ' day' : ' days') + ' (' + nice(due) + ' to ' + nice(paid) + '). Duty plus interest: ' + inr(a + i) + '.</p></div>';
  }
  function draw() {
    var P = [['sea', 'Sea port'], ['air', 'Airport or land customs station']];
    root.innerHTML = '<div class="cl-card"><div style="display:flex;justify-content:flex-end;margin:0 0 6px"><button type="button" class="cl-b" id="cl-clear">✕ Clear form</button></div><h2 class="cl-h">Late bill of entry charge</h2><p class="cl-s">What customs adds when the bill of entry is filed after the time allowed.</p>' +
      '<div class="cl-f"><span class="cl-l">Where the goods arrive</span><div class="cl-row">' + P.map(function (p) { return '<button type="button" class="cl-p' + (S.place === p[0] ? ' on' : '') + '" data-place="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div></div>' +
      (S.place === 'sea' ? '<div class="cl-f"><label class="cl-ck"><input type="checkbox" id="cl-near"' + (S.near ? ' checked' : '') + '><span>Shipped from Bangladesh, Maldives, Myanmar, Pakistan or Sri Lanka</span></label></div>' : '') +
      '<div class="cl-g"><div class="cl-f"><label class="cl-l" for="cl-arr">' + (S.place === 'sea' ? 'Date the vessel arrived (entry inwards)' : 'Date the aircraft or vehicle arrived') + '</label><input type="date" id="cl-arr" value="' + h(S.arr) + '"></div><div class="cl-f"><label class="cl-l" for="cl-fil">Date the bill of entry was filed</label><input type="date" id="cl-fil" value="' + h(S.fil) + '"></div></div>' +
      '<div class="cl-f"><label class="cl-l" for="cl-duty">Duty payable on the bill of entry (optional)</label><input type="text" inputmode="decimal" id="cl-duty" placeholder="e.g. 85000" value="' + h(S.duty) + '"' + (S.nil ? ' disabled' : '') + '><small>The charge cannot be more than the duty payable.</small></div><div class="cl-f"><label class="cl-ck"><input type="checkbox" id="cl-nil"' + (S.nil ? ' checked' : '') + '><span>No duty is payable (exempt or nil rate)</span></label></div>' +
      '<div id="cl-o1">' + late() + '</div><p class="cl-rule"><b>The rule used.</b> A bill of entry has to be filed by the end of the day before the vessel arrives, holidays included. For sea cargo from the five neighbouring countries, and for all cargo at an airport or land customs station, the limit is the end of the day of arrival. After that the charge is ₹5,000 a day for the first three days and ₹10,000 a day after, limited to the duty payable, or to ₹50,000 where no duty is payable. Source: section 46(3) of the Customs Act, 1962 as amended by the Finance Act, 2021; Notifications 34/2021 and 35/2021-Customs (N.T.) and Circular 08/2021-Customs, all of 29 March 2021. ICDs are not covered here: ask your customs broker which date counts.</p></div>' +
      '<div class="cl-card"><h2 class="cl-h">Interest on duty paid late</h2><p class="cl-s">Simple interest at 15% a year on import duty paid after it was due.</p>' +
      '<div class="cl-f"><label class="cl-l" for="cl-iduty">Duty amount</label><input type="text" inputmode="decimal" id="cl-iduty" placeholder="e.g. 250000" value="' + h(S.iduty) + '"></div>' +
      '<div class="cl-g"><div class="cl-f"><label class="cl-l" for="cl-idue">Date the duty was due</label><input type="date" id="cl-idue" value="' + h(S.idue) + '"><small>Self-assessed: the day the bill of entry was filed. Assessed by an officer: one working day after it was returned to you for payment.</small></div><div class="cl-f"><label class="cl-l" for="cl-ipaid">Date the duty was paid</label><input type="date" id="cl-ipaid" value="' + h(S.ipaid) + '"></div></div>' +
      '<div id="cl-o2">' + intr() + '</div><p class="cl-rule"><b>The rule used.</b> Duty is payable on the day the bill of entry is presented when it is self-assessed, or within one day, not counting holidays, of the bill being returned for payment after assessment. Later payment carries interest at 15% a year. Source: section 47(2) of the Customs Act, 1962 and Notification 33/2016-Customs (N.T.) of 1 March 2016. Importers with deferred duty payment follow their own due dates.</p></div>';
    function on(id, k, ev, redraw) { var e = D.getElementById(id); if (!e) return; e[ev] = function () { S[k] = e.type === 'checkbox' ? e.checked : e.value; save(); if (redraw) draw(); else { D.getElementById('cl-o1').innerHTML = late(); D.getElementById('cl-o2').innerHTML = intr(); } }; }
    on('cl-near', 'near', 'onchange'); on('cl-arr', 'arr', 'oninput'); on('cl-fil', 'fil', 'oninput'); on('cl-duty', 'duty', 'oninput'); on('cl-nil', 'nil', 'onchange', 1); on('cl-iduty', 'iduty', 'oninput'); on('cl-idue', 'idue', 'oninput'); on('cl-ipaid', 'ipaid', 'oninput');
    root.querySelectorAll('[data-place]').forEach(function (b) { b.onclick = function () { S.place = b.getAttribute('data-place'); save(); draw(); }; });
    D.getElementById('cl-clear').onclick = function () { if (!confirm('Clear both calculators?')) return; try { localStorage.removeItem(KEY); } catch (e) {} S = { place: 'sea', near: false, arr: '', fil: '', duty: '', nil: false, iduty: '', idue: '', ipaid: '' }; draw(); };
  }
  draw();
})();
