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
      const holder = app.cloneNode(false); holder.innerHTML = r.html; morph(app, holder);
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
  root.YAMDC = { DCLogic, renderToString, mount };
})(typeof window !== 'undefined' ? window : globalThis);
