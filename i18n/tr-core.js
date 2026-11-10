/* YAM i18n core: shared by build (node) and browser. dict: { "English text": "translation" }; keys may hold {0}.. placeholders */
(function (root) {
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // localise dates such as "18 October 2026" / "October 2026" / "5 Nov" that sit inside placeholders
  const MN = { de: 'Januar Februar März April Mai Juni Juli August September Oktober November Dezember', es: 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre', fr: 'janvier février mars avril mai juin juillet août septembre octobre novembre décembre', pt: 'janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro', ru: 'января февраля марта апреля мая июня июля августа сентября октября ноября декабря', ar: 'يناير فبراير مارس أبريل مايو يونيو يوليو أغسطس سبتمبر أكتوبر نوفمبر ديسمبر', hi: 'जनवरी फ़रवरी मार्च अप्रैल मई जून जुलाई अगस्त सितंबर अक्तूबर नवंबर दिसंबर' };
  const EN = 'January February March April May June July August September October November December'.split(' ');
  const MNR = { ru: 'январь февраль март апрель май июнь июль август сентябрь октябрь ноябрь декабрь' };
  const dateRe = /^(?:(\d{1,2}) )?(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?: (\d{4}))?$/;
  function locDate(v, lang) {
    const m = dateRe.exec(v); if (!m || !lang) return null;
    const i = EN.findIndex((e) => e.slice(0, 3) === m[2].slice(0, 3)); if (i < 0) return null;
    const d = m[1], y = m[3];
    if (lang === 'ja' || lang === 'zh') return (y ? y + '年' : '') + (i + 1) + '月' + (d ? d + '日' : '');
    if (lang === 'ko') return (y ? y + '년 ' : '') + (i + 1) + '월' + (d ? ' ' + d + '일' : '');
    const names = (d || !MNR[lang]) ? MN[lang] : MNR[lang]; if (!names) return null;
    const n = names.split(' ')[i];
    if (lang === 'de') return (d ? d + '. ' : '') + n + (y ? ' ' + y : '');
    if (lang === 'es' || lang === 'pt') return (d ? d + ' de ' : '') + n + (y ? ' de ' + y : '');
    return (d ? d + ' ' : '') + n + (y ? ' ' + y : '');
  }
  function make(dict, lang) {
    lang = lang || root.YAM_LANG || (root.document && root.document.documentElement && (root.document.documentElement.lang || '').slice(0, 2)) || '';
    const pats = [];
    for (const k of Object.keys(dict)) {
      if (!/\{\d\}/.test(k)) continue;
      const lit = k.replace(/\{\d\}/g, '');
      if (!/[A-Za-z]{2}/.test(lit)) continue;
      const order = []; const src = '^' + k.split(/(\{\d\})/).map((p) => { const m = /^\{(\d)\}$/.exec(p); if (m) { order.push(+m[1]); return '([\\s\\S]*?)'; } return reEsc(p); }).join('') + '$';
      pats.push({ re: new RegExp(src), order, to: dict[k], weight: lit.length });
    }
    pats.sort((a, b) => b.weight - a.weight);
    for (const k of Object.keys(dict)) { const m = /^(.*?[A-Za-z].*?)[\s:(]*\{\d\}[\s)]*$/.exec(k); if (m && !/\{\d\}/.test(m[1])) { const kk = norm(m[1].replace(/[\s:]+$/, '') + (/:\s*\{/.test(k) ? ':' : '')); if (!(kk in dict)) dict[kk] = norm(dict[k].replace(/\{\d\}/g, '')); } }
    const cache = new Map();
    function t(s, depth) {
      const n = norm(s); if (!n || !/[A-Za-z]{2}/.test(n)) return null;
      if (Object.prototype.hasOwnProperty.call(dict, n)) return dict[n];
      if (cache.has(n)) return cache.get(n);
      let out = null;
      if ((depth || 0) < 3) for (const p of pats) {
        const m = p.re.exec(n); if (!m) continue;
        const caps = {}; p.order.forEach((idx, i) => { const v = m[i + 1]; caps[idx] = locDate(v, lang) || t(v, (depth || 0) + 1) || v; });
        out = p.to.replace(/\{(\d)\}/g, (_, d) => (caps[d] != null ? caps[d] : '')); break;
      }
      if (out == null) { const m = /^([^A-Za-z]*?)([A-Za-z][\s\S]*?)([^A-Za-z]*)$/.exec(n); if (m && (m[1] || m[3]) && Object.prototype.hasOwnProperty.call(dict, m[2])) out = m[1] + dict[m[2]] + m[3]; }
      cache.set(n, out); return out;
    }
    function text(s) { const r = t(s, 0); if (r == null) return s; const lead = /^\s*/.exec(s)[0], trail = /\s*$/.exec(s)[0]; return lead + r + trail; }
    return { t: (s) => t(s, 0), text };
  }
  const ATTRS = ['title', 'alt', 'aria-label', 'placeholder'];
  // translate a DOM subtree in place (browser or linkedom)
  function dom(rootNode, tr, opts) {
    opts = opts || {};
    const walk = (n) => {
      if (n.nodeType === 3) { const v = n.nodeValue; if (/[A-Za-z]{2}/.test(v)) { const w = tr.text(v); if (w !== v) n.nodeValue = w; } return; }
      if (n.nodeType !== 1) return;
      const tag = (n.localName || n.nodeName || '').toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'template' || tag === 'svg' || tag === 'textarea' || tag === 'code') return;
      if (n.hasAttribute && n.hasAttribute('data-notr')) return;
      for (const a of ATTRS) { if (n.hasAttribute(a)) { const v = n.getAttribute(a); const w = tr.text(v); if (w !== v) n.setAttribute(a, w); } }
      if (tag === 'input' && /^(button|submit)$/i.test(n.getAttribute('type') || '') && n.hasAttribute('value')) { const v = n.getAttribute('value'); const w = tr.text(v); if (w !== v) n.setAttribute('value', w); }
      if (opts.href && tag === 'a' && n.hasAttribute('href')) { const h = n.getAttribute('href'); const nh = opts.href(h); if (nh && nh !== h) n.setAttribute('href', nh); }
      let prev = null;
      for (const c of Array.from(n.childNodes)) { if (c.nodeType === 3 && prev && prev.nodeType === 3) { prev.nodeValue += c.nodeValue; c.remove(); continue; } prev = c; }
      for (const c of Array.from(n.childNodes)) walk(c);
    };
    walk(rootNode);
  }
  const api = { make, dom, norm };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.YAMI18N = api;
})(typeof window !== 'undefined' ? window : globalThis);
