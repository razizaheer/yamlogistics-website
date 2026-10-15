/* YAM site runtime: renders x-dc style templates (holes, sc-for, sc-if) and keeps interactive parts live. */
(function (root) {
  const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr']);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escA = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  function lookup(expr, scope) {
    expr = expr.trim();
    if (expr === 'true') return true; if (expr === 'false') return false;
    let v = scope;
    for (const part of expr.split('.')) { if (v == null) return undefined; v = v[part]; }
    return v;
  }
  const HOLE = /\{\{([^}]+)\}\}/g;
  const only = (s) => { const m = /^\s*\{\{([^}]+)\}\}\s*$/.exec(s); return m ? m[1] : null; };
  function interp(s, scope) { return s.replace(HOLE, (_, e) => { const v = lookup(e, scope); return v == null ? '' : String(v); }); }
  function hasDyn(node) {
    if (node.nodeType === 3) return node.nodeValue.indexOf('{{') >= 0;
    if (node.nodeType !== 1) return false;
    const t = node.localName;
    if (t === 'sc-for' || t === 'sc-if') return true;
    for (const a of node.attributes) if (a.value.indexOf('{{') >= 0) return true;
    for (const c of node.childNodes) if (hasDyn(c)) return true;
    return false;
  }
  function render(node, scope, ctx) {
    if (node.nodeType === 3) return node.nodeValue.indexOf('{{') >= 0 ? esc(interp(node.nodeValue, scope)) : esc(node.nodeValue);
    if (node.nodeType === 8) return '';
    if (node.nodeType !== 1) return '';
    const tag = node.localName;
    if (tag === 'sc-for') {
      const list = lookup(only(node.getAttribute('list')), scope) || [];
      const as = node.getAttribute('as');
      let out = '';
      list.forEach((item, i) => { const s = Object.create(scope); s[as] = item; s[as + 'Index'] = i; for (const c of node.childNodes) out += render(c, s, ctx); });
      return out;
    }
    if (tag === 'sc-if') {
      const v = lookup(only(node.getAttribute('value')), scope);
      if (!v || v === 'false') return '';
      let out = ''; for (const c of node.childNodes) out += render(c, scope, ctx); return out;
    }
    if (!hasDyn(node)) return node.outerHTML;
    let out = '<' + tag;
    for (const a of node.attributes) {
      const name = a.name;
      if (name.startsWith('hint-')) continue;
      const ev = /^on([a-z]+)$/i.exec(name);
      if (ev) {
        const fn = lookup(only(a.value) || '', scope);
        if (typeof fn === 'function') { const id = ctx.handlers.push(fn) - 1; out += ' data-ev-' + (ev[1].toLowerCase() === 'change' ? 'input' : ev[1].toLowerCase()) + '="' + id + '"'; }
        continue;
      }
      const o = only(a.value);
      let val = o ? lookup(o, scope) : interp(a.value, scope);
      if (o && (val === false || val === null || val === undefined)) { if (name !== 'value') continue; val = ''; }
      if (o && val === true && name !== 'value' && !name.startsWith('aria-')) { out += ' ' + name; continue; }
      out += ' ' + name + '="' + escA(val) + '"';
    }
    out += '>';
    if (VOID.has(tag)) return out;
    if (tag === 'textarea' || tag === 'script' || tag === 'style') return out + node.innerHTML + '</' + tag + '>';
    for (const c of node.childNodes) out += render(c, scope, ctx);
    return out + '</' + tag + '>';
  }

  // ---- link routing shared by build and browser
  const P = { quote: 'contact.html', calc: 'cbm-calculator.html', track: 'track-shipment.html', customs: 'customs-brokerage.html', mobile: 'mobile-phone-exports.html', third: 'third-country-trade.html', ocean: 'ocean-freight.html', air: 'air-freight.html', project: 'project-cargo.html', about: 'about.html', desk: 'trade-desk.html', bonded: 'bonded-warehousing.html', expo: 'exhibition-ata-carnet.html', consol: 'buyers-consolidation.html', dg: 'dangerous-goods.html', comp: 'trade-compliance.html', doa: 'destination-do-agency.html', haul: 'haulage-icd.html', charter: 'aircraft-charter.html', peri: 'perishables.html', pharma: 'pharmaceuticals.html', animals: 'live-animals.html', pets: 'pet-relocation.html', labels: 'dg-labels.html', wa: 'https://wa.me/919212558167' };
  const RULES = [
    [/^terms$|trading conditions|privacy/, P.about], [/email me updates|sign in/, P.quote], [/download checklist/, P.wa],
    [/bonded warehous|ftwz/, P.bonded], [/exhibition|ata carnet/, P.expo],
    [/quote|plan a re-export|plan this route|plan a project|plan a bonded|plan my exhibition|talk to the desk|talk to us|duty estimate|let.s talk|^ship |book a compliance|appoint yam|plan an animal|plan my pet/, P.quote],
    [/consolidation|purchase order|po management/, P.consol],
    [/calculator/, P.calc], [/^track|track shipment/, P.track],
    [/trade compliance|compliance advisory/, P.comp], [/customs brokerage|hs code/, P.customs],
    [/labels? (&|and) marks|dg labels|download (the )?labels|label library/, P.labels], [/dangerous goods|lithium/, P.dg], [/aircraft charter|^charter/, P.charter], [/perishable/, P.peri], [/pharma/, P.pharma], [/live animal/, P.animals], [/pet relocation|pet transport/, P.pets],
    [/destination|do agency/, P.doa], [/haulage|\bicds?\b/, P.haul],
    [/^air freight|air freight$/, P.air],
    [/mobile|phone/, P.mobile], [/third-country|re-export|merchanting/, P.third],
    [/briefing|trade desk|corridor brief|read the|read all|incoterms/, P.desk],
    [/ocean/, P.ocean], [/project|odc|breakbulk/, P.project],
    [/insurance/, P.quote], [/our story|about/, P.about], [/\bair\b/, P.air]
  ];
  function linkFor(text) { const k = String(text).replace(/\s+/g, ' ').trim().toLowerCase(); for (const [re, to] of RULES) if (re.test(k)) return to; return null; }
  function fixDomLinks(root) { root.querySelectorAll('a[href="#"]').forEach((a) => { const to = linkFor(a.textContent); if (to) a.setAttribute('href', to); }); }
  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(p) { this.state = Object.assign({}, this.state, typeof p === 'function' ? p(this.state) : p); if (this.__mount) this.__mount.update(); }
  }
  function renderToString(tplRoot, inst) {
    const ctx = { handlers: [] };
    let out = ''; for (const c of tplRoot.childNodes) out += render(c, inst.renderVals(), ctx);
    return { html: out, ctx };
  }
  // ---- browser side: morph DOM so focus and video playback survive re-renders
  function morph(from, to) {
    if (from.nodeType !== to.nodeType || from.nodeName !== to.nodeName) { from.replaceWith(to.cloneNode(true)); return; }
    if (from.nodeType === 3) { if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue; return; }
    if (from.nodeType !== 1) return;
    for (const a of Array.from(from.attributes)) if (!to.hasAttribute(a.name)) from.removeAttribute(a.name);
    for (const a of Array.from(to.attributes)) if (from.getAttribute(a.name) !== a.value) from.setAttribute(a.name, a.value);
    if (from.tagName === 'INPUT' || from.tagName === 'TEXTAREA') { if (document.activeElement !== from && to.hasAttribute('value')) from.value = to.getAttribute('value'); return; }
    if (from.tagName === 'VIDEO' || from.tagName === 'svg' || from.tagName === 'SVG') return;
    const a = Array.from(from.childNodes), b = Array.from(to.childNodes);
    for (let i = 0; i < b.length; i++) { if (i < a.length) morph(a[i], b[i]); else from.appendChild(b[i].cloneNode(true)); }
    for (let i = b.length; i < a.length; i++) a[i].remove();
  }
  function mount(app, tplRoot, Comp) {
    const inst = new Comp({});
    let ctx = { handlers: [] };
    const m = {};
    // morph needs same node name: wrap app children
    m.update = function () {
      const r = renderToString(tplRoot, inst); ctx = r.ctx;
      const holder = app.cloneNode(false); holder.innerHTML = r.html; fixDomLinks(holder); morph(app, holder);
    };
    inst.__mount = m;
    ['click', 'input', 'change'].forEach((type) => app.addEventListener(type, (e) => {
      const key = type === 'change' ? 'input' : type;
      let el = e.target;
      while (el && el !== app) { const id = el.getAttribute && el.getAttribute('data-ev-' + key); if (id != null) { if (type === 'change' && el.tagName !== 'SELECT') return; ctx.handlers[+id] && ctx.handlers[+id](e); return; } el = el.parentNode; }
    }));
    m.update();
    return inst;
  }
  root.YAMDC = { DCLogic, renderToString, mount, linkFor, P };
})(typeof window !== 'undefined' ? window : globalThis);
