// shared helpers: load an i18n/<lang>.js dictionary, write it back, extract static strings from a page
const fs = require('fs');
const path = require('path');
const ROOT = process.env.SITE_ROOT || path.resolve(__dirname, '../..');
const LANGS = ['ar', 'de', 'es', 'fr', 'hi', 'ja', 'ko', 'pt', 'ru', 'zh'];
const core = require(ROOT + '/i18n/tr-core.js');

// i18n/<lang>.js = prefix + 'YAMI18N.make(' + JSON + ');' + suffix
function loadDict(lang) {
  const src = fs.readFileSync(ROOT + '/i18n/' + lang + '.js', 'utf8');
  const a = src.indexOf('YAMI18N.make(') + 'YAMI18N.make('.length;
  // the JSON object ends at the first '});var L=window.YAM_LANG'
  const endMark = src.indexOf(');var L=window.YAM_LANG', a);
  if (endMark < 0) throw new Error('cannot find dict end in ' + lang);
  const json = src.slice(a, endMark);
  const dict = JSON.parse(json);
  const pm = /window\.YAM_PAGES=(\[[^\]]*\])/.exec(src);
  return { src, a, endMark, dict, pages: JSON.parse(pm[1]) };
}
function saveDict(lang, info, dict, pages) {
  let src = info.src.slice(0, info.a) + JSON.stringify(dict) + info.src.slice(info.endMark);
  if (pages) src = src.replace(/window\.YAM_PAGES=\[[^\]]*\]/, 'window.YAM_PAGES=' + JSON.stringify(pages));
  fs.writeFileSync(ROOT + '/i18n/' + lang + '.js', src);
}

// all strings dom() would try to translate in an HTML file (whole document incl. head title/meta handled separately)
function staticStrings(html) {
  const { parseHTML } = require('linkedom');
  const { document } = parseHTML(html);
  const out = new Set();
  const rec = { t: (s) => { const n = core.norm(s); if (/[A-Za-z]{2}/.test(n)) out.add(n); return null; }, text: (s) => { rec.t(s); return s; } };
  for (const m of document.querySelectorAll('details.ftm, script, style')) m.remove();
  core.dom(document.body || document.documentElement, rec);
  const t = document.querySelector('title'); if (t) rec.t(t.textContent);
  for (const m of document.querySelectorAll('meta[name=description],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"]')) rec.t(m.getAttribute('content') || '');
  return [...out];
}
module.exports = { ROOT, LANGS, core, loadDict, saveDict, staticStrings };
