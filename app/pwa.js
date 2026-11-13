/* YAM Logistics app: registers the offline service worker and offers "Install the app" where the browser allows it. */
// App chrome text in every site language (the tool pages themselves are translated by /i18n/<lang>.js).
var CK_UI = (function () {
  var L = (location.pathname.match(/^\/(ar|de|es|fr|hi|ja|ko|pt|ru|zh)\//) || [])[1] || 'en';
  //       0 Tools, 1 Planner, 2 HSN, 3 Duty, 4 Track, 5 App, 6 by-line, 7 Privacy, 8 Contact, 9 install title, 10 install text, 11 Install, 12 Close,
  //       13 track placeholder, 14 track label, 15 rate q, 16 Rate it, 17 Not now, 18 Star, 19 Unstar
  var T = {
    en: ['Tools', 'Planner', 'HSN', 'Duty', 'Track', 'App', 'CargoKit by YAM Logistics', 'Privacy', 'Contact', 'Install CargoKit, our free app', 'Our tools on your home screen, even with no signal.', 'Install', 'Close', 'Track container, AWB or B/L', 'Container, AWB or B/L number', 'Finding CargoKit useful?', 'Rate it', 'Not now', 'Star', 'Unstar'],
    es: ['Herramientas', 'Planificador', 'HSN', 'Aranceles', 'Rastrear', 'App', 'CargoKit de YAM Logistics', 'Privacidad', 'Contacto', 'Instale CargoKit, nuestra app gratuita', 'Nuestras herramientas en su pantalla de inicio, incluso sin señal.', 'Instalar', 'Cerrar', 'Rastree contenedor, AWB o B/L', 'Número de contenedor, AWB o B/L', '¿Te sirve CargoKit?', 'Calificar', 'Ahora no', 'Marcar', 'Desmarcar'],
    pt: ['Ferramentas', 'Planejador', 'HSN', 'Impostos', 'Rastrear', 'App', 'CargoKit da YAM Logistics', 'Privacidade', 'Contato', 'Instale o CargoKit, nosso app gratuito', 'Nossas ferramentas na sua tela inicial, mesmo sem sinal.', 'Instalar', 'Fechar', 'Rastreie contêiner, AWB ou B/L', 'Número de contêiner, AWB ou B/L', 'Gostando do CargoKit?', 'Avaliar', 'Agora não', 'Marcar', 'Desmarcar'],
    fr: ['Outils', 'Planificateur', 'HSN', 'Droits', 'Suivi', 'App', 'CargoKit par YAM Logistics', 'Confidentialité', 'Contact', 'Installez CargoKit, notre app gratuite', 'Nos outils sur votre écran d’accueil, même sans réseau.', 'Installer', 'Fermer', 'Suivre conteneur, AWB ou B/L', 'Numéro de conteneur, AWB ou B/L', 'CargoKit vous est utile ?', 'Noter', 'Plus tard', 'Épingler', 'Retirer'],
    de: ['Tools', 'Planer', 'HSN', 'Zoll', 'Tracking', 'App', 'CargoKit von YAM Logistics', 'Datenschutz', 'Kontakt', 'Installieren Sie CargoKit, unsere kostenlose App', 'Unsere Tools auf Ihrem Startbildschirm, auch ohne Netz.', 'Installieren', 'Schließen', 'Container, AWB oder B/L verfolgen', 'Container-, AWB- oder B/L-Nummer', 'Ist CargoKit hilfreich?', 'Bewerten', 'Nicht jetzt', 'Markieren', 'Entfernen'],
    ar: ['الأدوات', 'المخطط', 'HSN', 'الرسوم', 'التتبع', 'التطبيق', 'CargoKit من YAM Logistics', 'الخصوصية', 'اتصل بنا', 'ثبّت CargoKit، تطبيقنا المجاني', 'أدواتنا على شاشتك الرئيسية، حتى دون إشارة.', 'تثبيت', 'إغلاق', 'تتبع حاوية أو AWB أو B/L', 'رقم الحاوية أو AWB أو B/L', 'هل تجد CargoKit مفيدًا؟', 'قيّمه', 'ليس الآن', 'تثبيت كمفضلة', 'إزالة من المفضلة'],
    hi: ['टूल्स', 'प्लानर', 'HSN', 'ड्यूटी', 'ट्रैक', 'ऐप', 'YAM Logistics का CargoKit', 'गोपनीयता', 'संपर्क', 'CargoKit इंस्टॉल करें, हमारा मुफ़्त ऐप', 'हमारे टूल आपकी होम स्क्रीन पर, बिना सिग्नल के भी।', 'इंस्टॉल करें', 'बंद करें', 'कंटेनर, AWB या B/L ट्रैक करें', 'कंटेनर, AWB या B/L नंबर', 'क्या CargoKit उपयोगी लगा?', 'रेटिंग दें', 'अभी नहीं', 'स्टार करें', 'स्टार हटाएँ'],
    ja: ['ツール', 'プランナー', 'HSN', '関税', '追跡', 'アプリ', 'CargoKit by YAM Logistics', 'プライバシー', 'お問い合わせ', '無料アプリ CargoKit をインストール', 'ツールをホーム画面に。電波がなくても使えます。', 'インストール', '閉じる', 'コンテナ・AWB・B/L を追跡', 'コンテナ、AWB または B/L 番号', 'CargoKit は役に立っていますか？', '評価する', '後で', 'お気に入り', 'お気に入り解除'],
    ko: ['도구', '플래너', 'HSN', '관세', '추적', '앱', 'YAM Logistics의 CargoKit', '개인정보', '문의', '무료 앱 CargoKit 설치', '홈 화면에서 바로 쓰는 도구, 신호가 없어도 됩니다.', '설치', '닫기', '컨테이너, AWB 또는 B/L 추적', '컨테이너, AWB 또는 B/L 번호', 'CargoKit이 도움이 되셨나요?', '평가하기', '나중에', '즐겨찾기', '즐겨찾기 해제'],
    ru: ['Инструменты', 'Планировщик', 'HSN', 'Пошлины', 'Трекинг', 'Приложение', 'CargoKit от YAM Logistics', 'Конфиденциальность', 'Контакты', 'Установите CargoKit — наше бесплатное приложение', 'Наши инструменты на главном экране, даже без связи.', 'Установить', 'Закрыть', 'Отследить контейнер, AWB или B/L', 'Номер контейнера, AWB или B/L', 'CargoKit вам полезен?', 'Оценить', 'Не сейчас', 'В избранное', 'Убрать из избранного'],
    zh: ['工具', '规划', 'HSN', '关税', '追踪', '应用', 'YAM Logistics 出品的 CargoKit', '隐私', '联系我们', '安装 CargoKit 免费应用', '工具放在主屏幕上，没有信号也能用。', '安装', '关闭', '追踪集装箱、AWB 或提单', '集装箱、AWB 或 B/L 号码', 'CargoKit 对您有帮助吗？', '去评分', '以后再说', '收藏', '取消收藏']
  };
  var t = T[L] || T.en;
  // link to the translated version of a page when this language has one (window.YAM_PAGES from /i18n/<lang>.js)
  function href(path) {
    if (L === 'en') return path;
    var pages = window.YAM_PAGES || [], f = path.replace(/^\//, '').replace(/#.*$/, '');
    return pages.indexOf(f + '.html') >= 0 || pages.indexOf(f) >= 0 ? '/' + L + path : path;
  }
  return { L: L, t: t, href: href };
})();
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
  if (standalone) {
    var band = function () {
      // CargoKit banner instead of the YAM sales banner at the foot of each tool page (English pages)
      if (/^\/(ar|de|es|fr|hi|ja|ko|pt|ru|zh)\//.test(location.pathname)) return;
      var b = document.querySelector('main div[style="background: #0A6CC2; color: #FFFFFF"]');
      if (!b || b.getAttribute('data-ck')) return;
      b.setAttribute('data-ck', '1'); b.innerHTML = "<div style=\"max-width: 1400px; margin: 0 auto; padding: 56px 32px; display: flex; flex-wrap: wrap; gap: 24px; align-items: center; justify-content: space-between\"><div style=\"max-width: 720px\"><div style=\"font-family: 'Geist Mono', monospace; font-size: 12px; letter-spacing: 0.12em; color: #FFE3A0; margin-bottom: 10px\">CARGOKIT \u00b7 FREE, NO SIGN-UP</div><div style=\"font-family: 'Archivo', sans-serif; font-weight: 800; font-size: 26px; line-height: 1.15\">Every CargoKit tool is free for shippers, forwarders and agents.</div><div style=\"font-size: 15px; line-height: 1.55; opacity: .9; margin-top: 8px\">3D load planner, HSN finder, duty calculator, B/L and AWB drafts, DG checks and tracking. On the web and on Android.</div></div><div style=\"display: flex; flex-wrap: wrap; gap: 10px\"><a href=\"/free-tools\" style=\"background:#FFC93C;color:#0B2A4A;text-decoration:none;font-weight:700;border-radius:999px;padding:14px 26px\">All free tools \u2192</a><a href=\"https://wa.me/?text=Free%20shipping%20tools%3A%20load%20planner%2C%20HSN%20finder%2C%20B%2FL%20and%20AWB%20drafts%20%E2%80%93%20https%3A%2F%2Fcargokit.ai\" target=\"_blank\" rel=\"noopener\" style=\"background:rgba(255,255,255,.14);color:#FFFFFF;text-decoration:none;font-weight:700;border-radius:999px;padding:14px 26px;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.5)\">Share CargoKit</a></div></div>";
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', band); else band();
    var brand = function () {
      // the app is CargoKit: its own name and icon in the header instead of the YAM logo
      var a = document.querySelector('header .brand, nav .brand');
      if (!a || a.querySelector('.ck-brand')) return;
      a.innerHTML = '<span class="ck-brand"><img src="/cargokit-logo.svg" alt="">CargoKit</span>';
      a.setAttribute('href', '/free-tools');
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brand); else brand();
    var addTrk = function () {
      var top = document.getElementById('ft-top');
      if (!top || document.getElementById('ck-trk')) return;
      var f = document.createElement('form');
      f.id = 'ck-trk';
      f.innerHTML = '<input name="n" placeholder="' + CK_UI.t[13] + '" autocomplete="off" aria-label="' + CK_UI.t[14] + '"><button type="submit">' + CK_UI.t[4] + '</button>';
      f.addEventListener('submit', function (e) { e.preventDefault(); var v = f.n.value.trim(); location.href = CK_UI.href('/track-shipment') + '.html' + (v ? '?n=' + encodeURIComponent(v) : ''); });
      var h = top.previousElementSibling; (h || top).parentNode.insertBefore(f, h || top);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addTrk); else addTrk();
  }

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
      // tools page in the app: icon tiles like the big carrier apps (3 per row: coloured icon, name under it),
      // your top 3 as wide tiles on top, and a track box first
      'html.yam-app .ft-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}' +
      'html.yam-app .ft-grid .ftc{min-height:0!important;padding:14px 6px 12px!important;align-items:center!important;text-align:center;gap:8px!important;border-radius:18px!important;box-shadow:0 4px 14px rgba(11,42,74,.06)}' +
      'html.yam-app .ft-grid .ftc span:nth-child(1){display:none!important}' +
      'html.yam-app .ft-grid .ftc span:nth-child(2){font-family:Geist,system-ui,sans-serif!important;font-weight:600!important;font-size:13px!important;line-height:1.25!important}' +
      'html.yam-app .ft-grid .ftc .fti{width:48px;height:48px;border-radius:15px}' +
      'html.yam-app .ft-grid .ftc .ft-pin{top:2px!important;right:2px!important;width:26px;height:26px;font-size:15px;line-height:26px}' +
      'html.yam-app #ft-top{grid-template-columns:repeat(3,minmax(0,1fr))!important}' +
      'html.yam-app #ft-top .ftc{padding:14px 6px!important;background:linear-gradient(160deg,#0B4F8F,#0A6CC2)!important;border:0!important}' +
      'html.yam-app #ft-top .ftc span:nth-child(2){color:#FFFFFF!important}' +
      'html.yam-app #ft-top .ftc .fti{background:rgba(255,255,255,.16)!important;color:#FFC93C!important}' +
      'html.yam-app h2.ft-gh{font-size:17px!important;margin:22px 2px 10px!important}html.yam-app h2.ft-gh small{display:block;margin:2px 0 0!important;font-size:12.5px!important}' +
      'html.yam-app .ft-hero{display:none!important}' +
      'html.yam-app .ck-brand{display:inline-flex;align-items:center;gap:9px;font:800 21px Archivo,Geist,system-ui,sans-serif;color:#0B2A4A;letter-spacing:-.01em}html.yam-app .ck-brand img{width:34px;height:34px;border-radius:9px}' +
      '#ck-trk{display:flex;gap:8px;background:#FFFFFF;border-radius:18px;padding:8px;box-shadow:0 8px 24px rgba(11,42,74,.10);margin:4px 0 6px}' +
      '#ck-trk input{flex:1;min-width:0;border:0;outline:0;font:500 15px Geist,system-ui,sans-serif;padding:10px 8px;color:#0B2A4A;background:transparent}' +
      '#ck-trk button{border:0;border-radius:12px;background:#0A6CC2;color:#FFFFFF;font:700 14px Geist,system-ui,sans-serif;padding:0 16px}' +
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
      ['tools', CK_UI.href('/free-tools'), CK_UI.t[0], /^\/(free-tools|index)?(\.html)?$/],
      ['plan', pre + '/container-load-planner', CK_UI.t[1], /container-load-planner/],
      ['hsn', CK_UI.href('/hsn-code-finder'), CK_UI.t[2], /hsn-code-finder/],
      ['duty', CK_UI.href('/customs-duty-calculator'), CK_UI.t[3], /customs-duty-calculator|landed-cost/],
      ['track', CK_UI.href('/track-shipment'), CK_UI.t[4], /track-shipment|my-shipments|^\/tracking\//]
    ];
    function build() {
      if (document.getElementById('yam-tabs')) return;
      var nav = document.createElement('nav');
      nav.id = 'yam-tabs';
      nav.setAttribute('aria-label', CK_UI.t[5]);
      var p = location.pathname.replace(/^\/(ar|de|es|fr|hi|ja|ko|pt|ru|zh)(?=\/)/, '');
      nav.innerHTML = tabs.map(function (t) {
        return '<a href="' + t[1] + '"' + (t[3].test(p) ? ' class="on" aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + I[t[0]] + '</svg><span>' + t[2] + '</span></a>';
      }).join('');
      document.body.appendChild(nav);
      var slim = document.createElement('div');
      slim.id = 'yam-slim';
      slim.innerHTML = '<span>' + CK_UI.t[6] + '</span> · <a href="' + CK_UI.href('/privacy') + '">' + CK_UI.t[7] + '</a> · <a href="' + CK_UI.href('/contact') + '">' + CK_UI.t[8] + '</a>';
      var f = document.querySelector('footer');
      if (f) f.parentNode.insertBefore(slim, f); else document.body.appendChild(slim);
      
    }
    if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
  }
  // Share / save / PDF for results (CBM, duty, HSN, container number) and the My saved page.
  (function () {
    var pth = location.pathname.replace(/^\/(ar|de|es|fr|hi|ja|ko|pt|ru|zh)(?=\/)/, '').replace(/\.html$/, '').replace(/\/$/, '');
    if (/^\/(cbm-calculator|customs-duty-calculator|hsn-code-finder|container-number-checker|landed-cost-calculator|freight-compare|world-duty-calculator|freight-quote-checker|customs-exchange-rates|port-airport-codes|icegate-status-guide|customs-late-charges-calculator|brazil-ncm-finder|mexico-import-tariff-2026|trade-agreement-preference-checker|india-transit-times)$/.test(pth)) {
      var k = document.createElement('script'); k.src = '/app/ck-kit.js?v=5'; k.defer = true; document.head.appendChild(k);
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
      '<span style="flex:1"><b style="display:block">' + CK_UI.t[9] + '</b><span style="color:#CFE3F5">' + CK_UI.t[10] + '</span></span>' +
      '<button type="button" data-a="i" style="border:0;border-radius:999px;background:#FFC93C;color:#0B2A4A;font:inherit;font-weight:700;padding:9px 14px;min-height:40px;cursor:pointer">' + CK_UI.t[11] + '</button>' +
      '<button type="button" data-a="x" aria-label="' + CK_UI.t[12] + '" style="border:0;background:transparent;color:#CFE3F5;font-size:22px;line-height:1;padding:4px 6px;cursor:pointer">×</button>';
    bar.addEventListener('click', function (e) {
      var a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'i') install();
      else { try { localStorage.setItem(KEY, String(Date.now())); } catch (err) {} hideBar(); }
    });
    document.body.appendChild(bar);
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
      var tx = [CK_UI.t[15], CK_UI.t[16], CK_UI.t[17]];
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
        b.setAttribute('aria-label', (on ? CK_UI.t[19] : CK_UI.t[18]) + ': ' + (a.querySelector('b') || a).textContent);
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
