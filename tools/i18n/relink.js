// usage: I18V=3 node relink.js slug1 slug2 ...  (after build.js): point the rest of the site to the new translated pages
const fs = require('fs');
const L = require('./lib');
const slugs = process.argv.slice(2);
const V = process.env.I18V || '3';
const SITE = 'https://www.yamlogistics.com/';
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const has = (g, s) => fs.existsSync(L.ROOT + '/' + g + '/' + s + '.html');
let n = 0;
// 1) translated pages: static links to the new pages, and the current dictionary version
for (const g of L.LANGS) {
  for (const f of fs.readdirSync(L.ROOT + '/' + g).filter((x) => x.endsWith('.html'))) {
    const p = L.ROOT + '/' + g + '/' + f; let s = fs.readFileSync(p, 'utf8'); const o = s;
    for (const sl of slugs) if (has(g, sl)) s = s.replace(new RegExp('href="' + reEsc(sl) + '\\.html(#[^"]*)?"', 'g'), (m, h) => 'href="' + g + '/' + sl + '.html' + (h || '') + '"');
    s = s.replace(new RegExp('i18n/' + g + '\\.js(\\?v=\\d+)?"', 'g'), 'i18n/' + g + '.js?v=' + V + '"');
    if (s !== o) { fs.writeFileSync(p, s); n++; }
  }
  // 2) Free Tools menu
  const mp = L.ROOT + '/menus/ftm-' + g + '.txt'; let m = fs.readFileSync(mp, 'utf8'); const mo = m;
  for (const sl of slugs) if (has(g, sl)) m = m.replace(new RegExp('href="/' + reEsc(sl) + '\\.html', 'g'), 'href="/' + g + '/' + sl + '.html');
  if (m !== mo) { fs.writeFileSync(mp, m); n++; }
}
// 3) English pages: language menu and hreflang
for (const sl of slugs) {
  const p = L.ROOT + '/' + sl + '.html'; let s = fs.readFileSync(p, 'utf8'); const o = s;
  s = s.replace(/<option([^>]*?) lang="([a-z]{2})" value="[^"]*">/g, (m, pre, g) => '<option' + pre + ' lang="' + g + '" value="' + (g === 'en' ? sl + '.html' : (has(g, sl) ? g + '/' + sl : g + '/index') + '.html') + '">');
  s = s.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?/g, '');
  const alts = ['en', ...L.LANGS.filter((g) => has(g, sl)), 'x-default'].map((g) => '<link rel="alternate" hreflang="' + g + '" href="' + SITE + (g === 'en' || g === 'x-default' ? '' : g + '/') + sl + '">').join('\n');
  s = s.replace(/(<link rel="canonical" href="[^"]*">)\n?/, '$1\n' + alts + '\n');
  if (s !== o) { fs.writeFileSync(p, s); n++; }
}
// 4) sitemap
const smp = L.ROOT + '/sitemap.xml'; let sm = fs.readFileSync(smp, 'utf8');
const today = new Date().toISOString().slice(0, 10); let add = '';
for (const sl of slugs) for (const g of L.LANGS) { const u = SITE + g + '/' + sl; if (has(g, sl) && !sm.includes('<loc>' + u + '</loc>')) add += '<url><loc>' + u + '</loc><lastmod>' + today + '</lastmod></url>\n'; }
if (add) { sm = sm.replace('</urlset>', add + '</urlset>'); fs.writeFileSync(smp, sm); n++; }
console.log('files changed:', n);
