/* YAM Logistics — free multi-carrier tracker (container / AWB / B/L router) */
(function () {
  var root = document.getElementById('trk-root'); if (!root) return;
  var WA = 'YAMLOGISTICS';
  // Ocean carriers: name, url template ({n} = number) or plain page (number copied), owner prefixes, B/L prefixes
  var SEA = [
    ['Maersk', 'https://www.maersk.com/tracking/{n}', ['MAEU', 'MSKU', 'MRKU', 'MRSU', 'MCRU', 'MSWU', 'SUDU', 'SEAU'], ['MAEU', 'MAEI']],
    ['MSC', 'https://www.msc.com/en/track-a-shipment?agencyPath=msc&trackingNumber={n}', ['MSCU', 'MEDU', 'MSDU', 'MSMU', 'MSNU', 'MSBU'], ['MEDU']],
    ['CMA CGM', 'https://www.cma-cgm.com/ebusiness/tracking/search?SearchBy=Container&Reference={n}', ['CMAU', 'CGMU', 'ECMU', 'CMNU'], ['CMDU']],
    ['APL', 'https://www.apl.com/ebusiness/tracking/search?SearchBy=Container&Reference={n}', ['APLU', 'APZU', 'APHU', 'APRU'], ['APLU']],
    ['ANL', 'https://www.anl.com.au/ebusiness/tracking/search?SearchBy=Container&Reference={n}', ['ANNU'], ['ANLC']],
    ['Hapag-Lloyd', 'https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html?container={n}', ['HLXU', 'HLBU', 'HLCU', 'UACU', 'UASU', 'UAEU'], ['HLCU']],
    ['ONE (Ocean Network Express)', 'https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking?ctrack-field={n}&trakNoParam={n}', ['ONEU', 'NYKU', 'MOLU', 'KKFU', 'KKLU'], ['ONEY']],
    ['COSCO Shipping', 'https://elines.coscoshipping.com/ebusiness/cargoTracking?trackingType=CONTAINER&number={n}', ['CBHU', 'CCLU', 'CSNU', 'CSLU', 'CXDU'], ['COSU']],
    ['OOCL', 'https://www.oocl.com/eng/ourservices/eservices/cargotracking/Pages/cargotracking.aspx', ['OOLU', 'OOCU'], ['OOLU']],
    ['Evergreen', 'https://ct.shipmentlink.com/servlet/TDB1_CargoTracking.do', ['EGHU', 'EGSU', 'EMCU', 'EISU', 'EITU'], ['EGLV']],
    ['Yang Ming', 'https://www.yangming.com/e-service/Track_Trace/track_trace_cargo_tracking.aspx', ['YMLU', 'YMMU'], ['YMLU', 'YMJA']],
    ['HMM', 'https://www.hmm21.com/e-service/general/trackNTrace/TrackNTrace.do', ['HDMU', 'HMMU'], ['HDMU']],
    ['ZIM', 'https://www.zim.com/tools/track-a-shipment?consnumber={n}', ['ZIMU', 'ZCSU'], ['ZIMU']],
    ['Wan Hai Lines', 'https://www.wanhai.com/views/cargoTrack/CargoTrack.xhtml', ['WHLU', 'WHSU'], ['WHLC']],
    ['PIL (Pacific International Lines)', 'https://www.pilship.com/', ['PCIU', 'PILU'], ['PCIU']],
    ['KMTC', 'https://www.ekmtc.com/', ['KMTU'], ['KMTC']],
    ['RCL (Regional Container Lines)', 'https://www.rclgroup.com/', ['REGU'], ['REGU']],
    ['SITC', 'https://www.sitcline.com/', [], ['SITC']],
    ['X-Press Feeders', 'https://www.x-pressfeeders.com/', [], []],
    ['Emirates Shipping Line', 'https://www.emiratesline.com/', [], []],
    ['TS Lines', 'https://www.tslines.com/', [], []],
    ['Shipping Corporation of India', 'https://www.shipindia.com/', ['SCIU'], []],
    ['Unifeeder', 'https://www.unifeeder.com/', [], []]
  ];
  var LEASE = ['TGHU', 'TCNU', 'TCLU', 'TRHU', 'TRLU', 'TEMU', 'TTNU', 'TXGU', 'GESU', 'GLDU', 'CAIU', 'CAXU', 'SEGU', 'SEKU', 'FCIU', 'FSCU', 'BMOU', 'DRYU', 'CRXU', 'CRSU', 'BEAU', 'IPXU', 'UETU', 'TGBU', 'INKU', 'DFSU', 'FFAU', 'NIDU', 'GATU', 'HJCU', 'TLLU', 'CLHU'];
  var AIR = { '001': 'American Airlines Cargo', '005': 'Continental', '006': 'Delta Cargo', '014': 'Air Canada Cargo', '016': 'United Cargo', '020': 'Lufthansa Cargo', '023': 'FedEx', '043': 'Dragonair', '045': 'LATAM Cargo', '047': 'TAP Air Cargo', '057': 'Air France Cargo', '064': 'Czech Airlines', '065': 'Saudia Cargo', '070': 'Syrian Air', '071': 'Ethiopian Cargo', '072': 'Gulf Air Cargo', '074': 'KLM Cargo', '075': 'Iberia Cargo', '076': 'Middle East Airlines', '077': 'EgyptAir Cargo', '079': 'Philippine Airlines', '080': 'LOT Cargo', '081': 'Qantas Freight', '083': 'South African Airways Cargo', '086': 'Air New Zealand Cargo', '098': 'Air India', '105': 'Finnair Cargo', '106': 'Caribbean Airlines', '108': 'Icelandair Cargo', '114': 'El Al Cargo', '115': 'Croatia Airlines', '117': 'SAS Cargo', '118': 'TAAG Angola', '124': 'Air Algérie', '125': 'British Airways World Cargo', '126': 'Garuda Indonesia Cargo', '131': 'JAL Cargo', '139': 'Aeroméxico Cargo', '141': 'flydubai Cargo', '145': 'LATAM Cargo', '147': 'Royal Air Maroc Cargo', '157': 'Qatar Airways Cargo', '160': 'Cathay Cargo', '172': 'Cargolux', '176': 'Emirates SkyCargo', '180': 'Korean Air Cargo', '182': 'Hungarian / Wizz', '199': 'Tunisair', '205': 'ANA Cargo', '214': 'PIA Cargo', '217': 'Thai Cargo', '220': 'Lufthansa Cargo', '229': 'Kuwait Airways Cargo', '232': 'MASkargo (Malaysia Airlines)', '235': 'Turkish Cargo', '257': 'Austrian Cargo', '288': 'Cathay Cargo', '297': 'China Airlines Cargo', '369': 'Atlas Air', '403': 'Polar Air Cargo', '406': 'UPS Airlines', '423': 'DHL Aviation', '501': 'Silk Way West', '512': 'Royal Jordanian Cargo', '555': 'Aeroflot Cargo', '603': 'SriLankan Cargo', '607': 'Etihad Cargo', '615': 'DHL Aviation (EAT Leipzig)', '618': 'Singapore Airlines Cargo', '631': 'Air Greenland', '635': 'Yemenia', '656': 'Air Niugini', '675': 'Air Macau', '695': 'EVA Air Cargo', '706': 'Kenya Airways Cargo', '724': 'Swiss WorldCargo', '731': 'Xiamen Airlines', '738': 'Vietnam Airlines Cargo', '774': 'Shanghai Airlines', '775': 'SpiceXpress (SpiceJet)', '781': 'China Eastern / China Cargo Airlines', '784': 'China Southern Cargo', '810': 'Air Arabia Cargo', '817': 'Air Seychelles', '831': 'Air Mauritius', '843': 'AirAsia', '865': 'MNG Airlines', '880': 'Hainan Airlines', '910': 'Oman Air Cargo', '932': 'Virgin Atlantic Cargo', '933': 'Nippon Cargo Airlines', '988': 'Asiana Cargo', '996': 'Air Europa Cargo', '999': 'Air China Cargo' };
  var LDB = 'https://ldb.co.in/ldb/containersearch';
  var css = '.tk-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:28px}.tk-row{display:flex;gap:10px;flex-wrap:wrap}.tk-in{flex:1 1 360px;min-width:0;font:inherit;font-size:20px;padding:18px 20px;border:2px solid #CFE3F5;border-radius:16px;outline:none;letter-spacing:.02em}.tk-in:focus{border-color:#0A6CC2}.tk-go{background:#0A6CC2;color:#fff;border:0;border-radius:16px;padding:0 30px;font:inherit;font-weight:700;font-size:18px;cursor:pointer;min-height:62px}.tk-go:hover{background:#0B4F8F}.tk-hint{font-size:13px;color:#5E7891;margin-top:10px}.tk-hint button{background:none;border:0;color:#0A6CC2;font:inherit;cursor:pointer;padding:0 4px;text-decoration:underline}.tk-res{margin-top:18px}.tk-kind{font-family:"Geist Mono",monospace;font-size:12px;letter-spacing:.1em;color:#5E7891}.tk-h{font-family:Archivo,sans-serif;font-weight:900;font-size:28px;line-height:1.15;margin:6px 0 4px}.tk-num{font-family:"Geist Mono",monospace;font-size:16px;color:#17436B}.tk-ok{color:#0F7B3F;font-size:13px;margin-top:6px}.tk-bad{color:#B42318;font-size:13px;margin-top:6px}.tk-btns{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin-top:18px}.tk-b{display:block;text-align:left;border-radius:16px;padding:16px 18px;font:inherit;cursor:pointer;text-decoration:none;border:1px solid #CFE3F5;background:#F7FBFF;color:#0B2A4A}.tk-b b{display:block;font-size:16px;margin-bottom:3px}.tk-b span{font-size:13px;color:#5E7891}.tk-b.pri{background:#0A6CC2;border-color:#0A6CC2;color:#fff}.tk-b.pri span{color:#DDEBFA}.tk-b.wa{background:#25D366;border-color:#25D366;color:#06331A}.tk-b.wa span{color:#0B4D24}.tk-b:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(10,108,194,.14)}.tk-sel{font:inherit;font-size:15px;padding:12px 14px;border:1px solid #CFE3F5;border-radius:12px;margin-top:12px;max-width:100%}.tk-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#0B2A4A;color:#fff;padding:12px 18px;border-radius:12px;font-size:14px;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,.25)}.tk-rec{margin-top:14px;font-size:13px;color:#5E7891}.tk-rec button{background:#EEF5FC;border:0;border-radius:999px;padding:5px 10px;margin:4px 4px 0 0;font:inherit;font-size:12px;color:#0B2A4A;cursor:pointer}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  root.innerHTML = '<div class="tk-card"><div class="tk-row"><input class="tk-in" id="tk-q" placeholder="Container, AWB or B/L number, e.g. MSKU 123456 5" autocomplete="off" spellcheck="false" aria-label="Tracking number"><button class="tk-go" id="tk-go">Track →</button></div><div class="tk-hint">Try: <button data-x="MSKU1234565">MSKU 123456 5</button><button data-x="176-12345675">176-1234 5675</button><button data-x="HLCUBO1251012345">Hapag-Lloyd B/L</button></div><div id="tk-rec" class="tk-rec"></div><div id="tk-res" class="tk-res"></div></div>';
  var q = document.getElementById('tk-q'), res = document.getElementById('tk-res');
  function h(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(t) { var d = document.createElement('div'); d.className = 'tk-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3500); }
  function copy(t) { try { navigator.clipboard.writeText(t); } catch (e) { } }
  function ctrCheck(c) { // ISO 6346 check digit
    var v = '0123456789A?BCDEFGHIJK?LMNOPQRSTU?VWXYZ', s = 0;
    for (var i = 0; i < 10; i++) s += v.indexOf(c[i]) * Math.pow(2, i);
    return (s % 11) % 10 === +c[10];
  }
  function awbCheck(a) { return parseInt(a.slice(3, 10), 10) % 7 === +a[10]; }
  function seaBy(pref, bl) { for (var i = 0; i < SEA.length; i++) if ((bl ? SEA[i][3] : SEA[i][2]).indexOf(pref) >= 0) return SEA[i]; return null; }
  function ttPost(kind, n) { // all-carrier fallback via track-trace.com (number pre-inserted)
    window.open('https://www.track-trace.com/' + kind + '#' + encodeURIComponent(n), '_blank', 'noopener');
    toast('Opening track-trace.com with your number filled in: press "Track direct" there.');
  }
  function carrierBtn(c, n) {
    var direct = c[0] === 'Maersk'; // verified to prefill; others: number copied to clipboard
    return '<a class="tk-b pri" target="_blank" rel="noopener" data-copy="' + h(n) + '" data-direct="' + (direct ? 1 : 0) + '" href="' + h(c[1].split('{n}').join(encodeURIComponent(n))) + '"><b>Track on ' + h(c[0]) + ' ↗</b><span>' + (direct ? 'Official live tracking, number filled in' : 'Official live tracking · number copied, paste if it is not filled in') + '</span></a>';
  }
  function waBtn(n, who) {
    var msg = 'Hello YAM, I need help with shipment ' + n + (who ? ' (' + who + ')' : '') + '.';
    return '<a class="tk-b wa" target="_blank" rel="noopener" href="https://wa.me/' + WA + '?text=' + encodeURIComponent(msg) + '"><b>Need it cleared? WhatsApp a broker</b><span>Customs, delivery or a stuck shipment: we reply fast</span></a>';
  }
  function picker(n) {
    return '<select class="tk-sel" id="tk-pick"><option value="">Choose the shipping line…</option>' + SEA.map(function (c, i) { return '<option value="' + i + '">' + h(c[0]) + '</option>'; }).join('') + '</select>';
  }
  function remember(n) { try { var r = JSON.parse(localStorage.getItem('yam-trk') || '[]').filter(function (x) { return x !== n; }); r.unshift(n); localStorage.setItem('yam-trk', JSON.stringify(r.slice(0, 6))); } catch (e) { } showRec(); }
  function showRec() { var el = document.getElementById('tk-rec'); try { var r = JSON.parse(localStorage.getItem('yam-trk') || '[]'); el.innerHTML = r.length ? 'Recent: ' + r.map(function (x) { return '<button data-x="' + h(x) + '">' + h(x) + '</button>'; }).join('') : ''; } catch (e) { el.innerHTML = ''; } }
  function run() {
    var raw = q.value.trim(); if (!raw) { res.innerHTML = ''; return; }
    var n = raw.toUpperCase().replace(/[\s\-\.\/]/g, ''), H = '';
    if (/^[A-Z]{3}[UJZ]\d{7}$/.test(n)) {
      var pref = n.slice(0, 4), c = seaBy(pref), ok = ctrCheck(n), lease = LEASE.indexOf(pref) >= 0;
      H += '<div class="tk-kind">CONTAINER NUMBER</div><div class="tk-h">' + (c ? h(c[0]) : lease ? 'Leased container' : 'Shipping line not recognised') + '</div><div class="tk-num">' + h(n.slice(0, 4) + ' ' + n.slice(4, 10) + ' ' + n[10]) + '</div>';
      H += ok ? '<div class="tk-ok">✓ Check digit valid</div>' : '<div class="tk-bad">⚠ The check digit doesn\'t match. Please re-check the number.</div>';
      if (!c) H += '<div style="font-size:14px;color:#3D5873;margin-top:8px">' + (lease ? 'The ' + pref + ' prefix belongs to a container leasing company, so the box is tracked by the line carrying it.' : 'We don\'t know the owner of prefix ' + pref + '.') + ' Choose the line below, or use the all-carriers search.</div>' + picker(n);
      H += '<div class="tk-btns" id="tk-btns">' + (c ? carrierBtn(c, n) : '') + '<a class="tk-b" href="#" data-tt="container"><b>All-carriers search ↗</b><span>Finds the line automatically (track-trace.com)</span></a><a class="tk-b" target="_blank" rel="noopener" data-copy="' + n + '" href="' + LDB + '"><b>India leg: ports, CFS, ICD &amp; rail ↗</b><span>Logistics Data Bank · number copied</span></a>' + waBtn(n, c && c[0]) + '</div>';
    } else if (/^\d{11}$/.test(n)) {
      var p = n.slice(0, 3), al = AIR[p], ok2 = awbCheck(n), fmt = p + '-' + n.slice(3, 7) + ' ' + n.slice(7);
      H += '<div class="tk-kind">AIR WAYBILL (AWB)</div><div class="tk-h">' + (al ? h(al) : 'Airline prefix ' + p) + '</div><div class="tk-num">' + fmt + '</div>';
      H += ok2 ? '<div class="tk-ok">✓ Check digit valid</div>' : '<div class="tk-bad">⚠ The check digit doesn\'t match. Please re-check the AWB number.</div>';
      H += '<div class="tk-btns"><a class="tk-b pri" href="#" data-tt="aircargo"><b>Track on ' + h(al || 'the airline') + ' ↗</b><span>Live airline status via track-trace.com · press "Track direct"</span></a>' + waBtn(fmt, al) + '</div>';
      n = fmt.replace(' ', '');
    } else if (/^[A-Z]{4}[A-Z0-9]{4,16}$/.test(n) && seaBy(n.slice(0, 4), true)) {
      var cb = seaBy(n.slice(0, 4), true);
      H += '<div class="tk-kind">BILL OF LADING</div><div class="tk-h">' + h(cb[0]) + '</div><div class="tk-num">' + h(n) + '</div>';
      H += '<div class="tk-btns">' + carrierBtn([cb[0], /maersk|msc\.com/.test(cb[1]) ? cb[1] : cb[1].split('?')[0].replace('/{n}', '')], n) + '<a class="tk-b" href="#" data-tt="container"><b>All-carriers search ↗</b><span>track-trace.com</span></a>' + waBtn(n, cb[0]) + '</div>';
    } else if (/^[A-Z0-9]{6,20}$/.test(n)) {
      H += '<div class="tk-kind">BOOKING / BILL OF LADING</div><div class="tk-h">Which shipping line?</div><div class="tk-num">' + h(n) + '</div><div style="font-size:14px;color:#3D5873;margin-top:8px">Bookings and B/Ls don\'t always show the carrier. Pick the line, or try the all-carriers search.</div>' + picker(n) + '<div class="tk-btns" id="tk-btns"><a class="tk-b" href="#" data-tt="container"><b>All-carriers search ↗</b><span>track-trace.com</span></a>' + waBtn(n) + '</div>';
    } else {
      H += '<div class="tk-bad" style="font-size:15px">That doesn\'t look like a container (4 letters + 7 digits), AWB (11 digits) or B/L number. Please check and try again.</div>';
    }
    res.innerHTML = H; res.setAttribute('data-n', n); if (H.indexOf('doesn\'t look like') < 0) remember(raw.toUpperCase());
  }
  document.getElementById('tk-go').addEventListener('click', run);
  q.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
  root.addEventListener('click', function (e) {
    var x = e.target.closest('[data-x]'); if (x) { q.value = x.getAttribute('data-x'); run(); return; }
    var t = e.target.closest('[data-tt]'); if (t) { e.preventDefault(); ttPost(t.getAttribute('data-tt'), res.getAttribute('data-n')); return; }
    var c = e.target.closest('[data-copy]'); if (c) { copy(c.getAttribute('data-copy')); if (c.getAttribute('data-direct') !== '1') toast('Number copied: paste it into the tracking box on the page that opens.'); }
  });
  root.addEventListener('change', function (e) {
    if (e.target.id !== 'tk-pick' || e.target.value === '') return;
    var c = SEA[+e.target.value], n = res.getAttribute('data-n'), b = document.getElementById('tk-btns');
    var old = b.querySelector('.tk-b.pri'); if (old) old.remove();
    b.insertAdjacentHTML('afterbegin', carrierBtn(c, n));
  });
  var u = new URLSearchParams(location.search).get('n'); if (u) { q.value = u; run(); }
  showRec();
})();
