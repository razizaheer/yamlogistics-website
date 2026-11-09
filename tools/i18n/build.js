// Build translated pages: node build.js <lang|all> page1 page2 ...
// <lang>/<page>.html = English page translated with the i18n/<lang>.js dictionary (same as the existing pages).
const fs = require('fs');
const { parseHTML } = require('linkedom');
const L = require('./lib');
const SITE = 'https://www.yamlogistics.com/';
const ATTR_LANG = { zh: 'zh-Hans' };
const NAMES = { en: 'English', zh: '中文', es: 'Español', ar: 'العربية', fr: 'Français', de: 'Deutsch', ja: '日本語', pt: 'Português', ru: 'Русский', hi: 'हिन्दी', ko: '한국어' };
const PREVAILS = 'This translation is for your convenience. If it differs from the English version, the English version prevails.';
const BUILDING = new Set((process.env.BUILDING || '').split(',').filter(Boolean));
const exists = (lang, slug) => BUILDING.has(lang + '/' + slug) || fs.existsSync(L.ROOT + '/' + lang + '/' + slug + '.html');

function build(lang, slug, I18V) {
  const info = L.loadDict(lang);
  const dict = Object.assign({}, info.dict);
  const tr = L.core.make(dict);
  const pages = new Set(info.pages);
  const html = fs.readFileSync(L.ROOT + '/' + slug + '.html', 'utf8');
  const { document } = parseHTML(html);
  const H = document.documentElement, head = document.head;
  H.setAttribute('lang', ATTR_LANG[lang] || lang);
  if (lang === 'ar') H.setAttribute('dir', 'rtl');
  const base = document.createElement('base'); base.setAttribute('href', '../'); head.insertBefore(base, head.firstChild);
  const tt = (s) => tr.text(s);
  const t = document.querySelector('title'); if (t) t.textContent = tt(t.textContent);
  for (const m of document.querySelectorAll('meta[name=description],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"],meta[property="og:image:alt"]')) m.setAttribute('content', tt(m.getAttribute('content') || ''));
  let loc = document.querySelector('meta[property="og:locale"]');
  if (!loc) { loc = document.createElement('meta'); const d = document.querySelector('meta[name=description]'); head.insertBefore(loc, d || null); }
  loc.setAttribute('content', lang); loc.setAttribute('property', 'og:locale');
  const url = SITE + lang + '/' + slug;
  const can = document.querySelector('link[rel=canonical]'); if (can) can.setAttribute('href', url);
  const ou = document.querySelector('meta[property="og:url"]'); if (ou) ou.setAttribute('content', url);
  // hreflang: every language that has this page
  for (const a of document.querySelectorAll('link[rel=alternate][hreflang]')) a.remove();
  let after = can;
  for (const g of ['ar', 'de', 'en', 'es', 'fr', 'hi', 'ja', 'ko', 'pt', 'ru', 'zh', 'x-default']) {
    if (g !== 'en' && g !== 'x-default' && g !== lang && !exists(g, slug)) continue;
    const l = document.createElement('link'); l.setAttribute('rel', 'alternate'); l.setAttribute('hreflang', g);
    l.setAttribute('href', SITE + (g === 'en' || g === 'x-default' ? '' : g + '/') + slug);
    if (after && after.parentNode) { after.after(l); after = l; } else head.appendChild(l);
  }
  // language menus
  for (const sel of document.querySelectorAll('select.langs')) {
    for (const o of sel.querySelectorAll('option')) {
      const g = o.getAttribute('lang') || 'en';
      o.setAttribute('value', g === 'en' ? slug + '.html' : g + '/' + ((g === lang || exists(g, slug)) ? slug : 'index') + '.html');
      if (g === lang) { o.setAttribute('selected', ''); o.textContent = '🌐 ' + NAMES[g]; } else { o.removeAttribute('selected'); o.textContent = NAMES[g]; }
    }
  }
  // text + links
  const page = slug + '.html';
  const hm = (h) => {
    if (/^(https?:|mailto:|tel:|javascript:|data:|\/\/)/.test(h)) return h;
    if (h.charAt(0) === '#') return h === '#' ? h : lang + '/' + page + h;
    const i = h.indexOf('#'), p = i < 0 ? h : h.slice(0, i), hs = i < 0 ? '' : h.slice(i);
    return pages.has(p) ? lang + '/' + p + hs : h;
  };
  L.core.dom(document.body, tr, { href: hm });
  // legal pages / disclaimers: the English version prevails
  const disc = document.getElementById('disclaimer');
  if (disc && dict[PREVAILS]) {
    const h = disc.querySelector('h2') || disc.querySelector('h3');
    const p = document.createElement('p');
    p.setAttribute('style', 'font-size: 14px; line-height: 1.55; color: #5E7891; margin: 10px 0 0; font-style: italic');
    p.textContent = dict[PREVAILS];
    if (h) h.after(p); else disc.prepend(p);
  }
  else if (slug === 'privacy' && dict[PREVAILS]) {
    const h1 = document.querySelector('main h1');
    const p = document.createElement('p');
    p.setAttribute('style', 'font-size: 14px; line-height: 1.55; color: #5E7891; margin: 10px 0 18px; font-style: italic');
    p.textContent = dict[PREVAILS];
    if (h1) h1.after(p);
  }
  // runtime translation before the first tool script
  const first = [...document.body.querySelectorAll('script[src]')][0];
  const mk = (src, code) => { const s = document.createElement('script'); if (src) s.setAttribute('src', src); if (code) s.textContent = code; return s; };
  const ins = [mk('i18n/tr-core.js'), mk('i18n/' + lang + '.js?v=' + I18V), mk(null, "YAM_TR_OBSERVE(document.querySelector('main'))")];
  for (const s of ins) { if (first) first.parentNode.insertBefore(s, first); else document.body.appendChild(s); }
  let out = document.toString();
  if (!/^<!doctype/i.test(out)) out = '<!doctype html>\n' + out;
  fs.writeFileSync(L.ROOT + '/' + lang + '/' + slug + '.html', out);
  return out.length;
}
module.exports = { build, exists };
if (require.main === module) {
  const [, , which, ...slugs] = process.argv;
  const langs = which === 'all' ? L.LANGS : which.split(',');
  const V = process.env.I18V || '3';
  for (const g of langs) for (const s of slugs) console.log(g, s, build(g, s, V));
}
