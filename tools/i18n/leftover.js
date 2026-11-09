// usage: node leftover.js <lang> page...   (after crawling <lang>/<page>.html into out/<lang>-<page>.json)
const fs = require('fs');
const [, , lang, ...pages] = process.argv;
for (const p of pages) {
  const en = new Set(JSON.parse(fs.readFileSync(__dirname + '/crawl/' + p + '.json', 'utf8')));
  const tr = JSON.parse(fs.readFileSync(__dirname + '/crawl/' + lang + '-' + p + '.json', 'utf8'));
  const left = tr.filter((s) => en.has(s) && /[a-z]{3,}/.test(s) && s.split(' ').length > 1);
  console.log('== ' + lang + ' ' + p + ': ' + tr.length + ' strings, ' + left.length + ' still English');
  for (const s of left) console.log('   ' + s.slice(0, 120));
}
