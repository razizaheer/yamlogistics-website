// usage: node merge.js <job> <pages,comma,sep> [lang,...]
// adds tr/<job>-out-<lang>.json to i18n/<lang>.js without overwriting existing keys, adds pages to YAM_PAGES,
// and installs the runtime extras (dialogs and toasts outside <main>).
const fs = require('fs');
const L = require('./lib');
const [, , job, pagesArg, langsArg] = process.argv;
const newPages = (pagesArg || '').split(',').filter(Boolean).map((p) => p.replace(/\.html$/, '') + '.html');
const langs = langsArg ? langsArg.split(',') : L.LANGS;
const OLD_TAIL_END = "mo.observe(el,{childList:true,subtree:true,characterData:true});window.YAM_TR(el)};})();";
const NEW_TAIL_END = "mo.observe(el,{childList:true,subtree:true,characterData:true});window.YAM_TR(el);extras()};" +
  "var ext=false;function extras(){if(ext)return;ext=true;window.YAM_T=function(s){return tr.text(String(s))};" +
  "var A=window.alert,C=window.confirm;window.alert=function(m){return A.call(window,tr.text(String(m)))};window.confirm=function(m){return C.call(window,tr.text(String(m)))};" +
  "var b2=false,mo2=new MutationObserver(function(ms){if(b2)return;b2=true;try{var seen=[];ms.forEach(function(m){[m.target].concat([].slice.call(m.addedNodes||[])).forEach(function(n){while(n&&n.parentNode&&n.parentNode!==document.body)n=n.parentNode;if(n&&n.nodeType===1&&n.parentNode===document.body&&!/^(MAIN|HEADER|FOOTER|NAV|SCRIPT|STYLE)$/.test(n.tagName)&&seen.indexOf(n)<0){seen.push(n);window.YAM_TR(n)}})})}finally{mo2.takeRecords();b2=false}});" +
  "var go=function(){mo2.observe(document.body,{childList:true,subtree:true,characterData:true})};if(document.body)go();else document.addEventListener('DOMContentLoaded',go)}})();";
for (const g of langs) {
  const info = L.loadDict(g);
  let add = {};
  if (job !== '-') {
    const f = __dirname + '/tr/' + job + '-out-' + g + '.json';
    if (!fs.existsSync(f)) { console.log(g, 'no output yet'); continue; }
    add = JSON.parse(fs.readFileSync(f, 'utf8'));
  }
  const d = info.dict; let n = 0, same = 0;
  for (const [k, v] of Object.entries(add)) {
    if (k in d) continue;
    if (v === k) { same++; continue; } // nothing to translate (names, codes)
    d[k] = v; n++;
  }
  const pages = [...info.pages]; for (const p of newPages) if (!pages.includes(p)) pages.push(p);
  if (info.src.includes(OLD_TAIL_END)) info.src = info.src.replace(OLD_TAIL_END, NEW_TAIL_END);
  else if (!info.src.includes(NEW_TAIL_END)) throw new Error('runtime tail not recognised in ' + g);
  L.saveDict(g, info, d, pages);
  console.log(g, '+' + n, 'keys (' + same + ' unchanged skipped), pages', pages.length);
}
