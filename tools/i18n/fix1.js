// one-off fixes after step 1: remove over-broad template keys created by the carrier-name templating,
// and add the exact headings they were standing in for.
const L = require('./lib');
const DEL = ['CONTAINER {0}', 'FREE TOOL · {0}'];
const ADD = {
  'FREE TOOL · SAVED SHIPMENTS': { es: 'HERRAMIENTA GRATIS · ENVÍOS GUARDADOS', pt: 'FERRAMENTA GRATUITA · EMBARQUES SALVOS', fr: 'OUTIL GRATUIT · ENVOIS ENREGISTRÉS', de: 'KOSTENLOSES TOOL · GESPEICHERTE SENDUNGEN', ar: 'أداة مجانية · الشحنات المحفوظة', hi: 'मुफ़्त टूल · सेव किए गए शिपमेंट', ja: '無料ツール · 保存した貨物', ko: '무료 도구 · 저장된 화물', ru: 'БЕСПЛАТНЫЙ ИНСТРУМЕНТ · СОХРАНЁННЫЕ ОТПРАВКИ', zh: '免费工具 · 已保存的货物' }
};
for (const g of L.LANGS) {
  const info = L.loadDict(g); const d = info.dict; let n = 0;
  for (const k of DEL) if (k in d) { delete d[k]; n++; }
  for (const [k, v] of Object.entries(ADD)) if (!(k in d) && v[g]) { d[k] = v[g]; n++; }
  L.saveDict(g, info, d);
  console.log(g, n, 'changes');
}
