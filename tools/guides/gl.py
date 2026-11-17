import sys, re, json, io, os, glob, importlib
sys.path.insert(0, '/root/dbg/lp'); sys.path.insert(0, '/root/dbg/duty')
import lib
from lib import e, p, h2, h3, ul, table, btn, section, note, rd, wr, cards, R
REL = re.compile(r'((?:href|src)=")(?!https?:|/|#|mailto:|tel:|data:|\.\./)([^"]+")')
CATS = [
 ('import', 'Importing into India'), ('export', 'Exporting from India'), ('customs', 'Customs duty and valuation'),
 ('docs', 'Shipping documents'), ('inco', 'Incoterms and trade terms'), ('sea', 'Sea freight and containers'),
 ('air', 'Air freight and courier'), ('dg', 'Special cargo and dangerous goods'), ('abroad', 'Shipping to other countries'),
 ('money', 'Payments, schemes and compliance'), ('local', 'India ports, ICDs and terminals')]
CN = dict(CATS)
G = []   # all guides
def g(slug, cat, title, desc, intro, secs, faq, tool=('customs-duty-calculator', 'Open the duty calculator')):
    assert cat in CN, cat
    assert 3 <= len(faq) <= 5, slug
    G.append(dict(slug=slug, cat=cat, title=title, desc=desc, intro=intro, secs=secs, faq=faq, tool=tool))
def render(sec):
    out = ''
    for hd, c in sec:
        out += h3(hd)
        for x in (c if isinstance(c, list) and c and isinstance(c[0], (list, tuple, str)) and not isinstance(c, str) else [c]):
            pass
    return out
def block(c):
    if isinstance(c, str): return p(c)
    if isinstance(c, list): return ul(c)
    if isinstance(c, tuple) and c[0] == 'p': return p(c[1])
    if isinstance(c, tuple) and c[0] == 'ul': return ul(c[1])
    if isinstance(c, tuple) and c[0] == 'table': return table(c[1], c[2], c[3] if len(c) > 3 else '')
    if isinstance(c, tuple) and c[0] == 'note': return note(c[1])
    raise ValueError(c)
def body_of(x, byc):
    inner = ''
    for hd, parts in x['secs']:
        inner += h3(hd)
        for c in (parts if isinstance(parts, list) and parts and isinstance(parts[0], (str, list, tuple)) and not all(isinstance(i, str) for i in parts) else ([parts] if not isinstance(parts, list) or all(isinstance(i, str) for i in parts) and False else parts)):
            inner += block(c)
    return inner
def build_body(x):
    inner = ''
    for hd, parts in x['secs']:
        inner += h3(hd)
        if isinstance(parts, str): parts = [parts]
        elif all(isinstance(i, str) for i in parts): parts = [parts]
        elif isinstance(parts, list) and parts and all(isinstance(i, str) for i in parts) and False: pass
        for c in parts: inner += block(c)
    inner += note('<b>For guidance only.</b> Rules, rates and forms change, and your case may differ. Check with Customs or a licensed customs broker before you act. We can help: <a href="contact" style="color:#0A6CC2;font-weight:700">talk to YAM Logistics</a>, a licensed <a href="customs-brokerage" style="color:#0A6CC2">customs broker</a> and <a href="freight-forwarder-delhi" style="color:#0A6CC2">freight forwarder in Delhi</a> with <a href="ocean-freight" style="color:#0A6CC2">sea</a> and <a href="air-freight" style="color:#0A6CC2">air</a> freight.')
    sib = [y for y in G if y['cat'] == x['cat'] and y['slug'] != x['slug']]
    i = [y['slug'] for y in G if y['cat'] == x['cat']].index(x['slug'])
    sib = sib[i:] + sib[:i]; sib = sib[:4]
    rel = [('guides/' + y['slug'], y['title'].split('|')[0], y['desc'][:110].rstrip(' ,.;') + '…') for y in sib]
    inner += h2('KEEP READING', 'Related guides') + cards(rel) + '<div style="height:10px"></div>' + btn(x['tool'][0], x['tool'][1]) + btn('guides/', 'All guides', True)
    return section(inner)
def make(x):
    a, b = (x['title'].split('|') + [''])[:2]
    T = a + ' | YAM Logistics'
    lib.page('guides/' + x['slug'], T, x['desc'], a, 'GUIDE · ' + CN[x['cat']].upper(), a, b, x['intro'], build_body(x), x['faq'],
             cta='Free tools for importers, exporters and forwarders. No sign-up.', cta_btn=x['tool'][1], cta_href=x['tool'][0])
    f = 'guides/%s.html' % x['slug']; s = rd(f)
    s = s.replace('"name":"Free tools","item":"https://www.yamlogistics.com/free-tools"', '"name":"Guides","item":"https://www.yamlogistics.com/guides/"')
    s = REL.sub(lambda m: m.group(1) + '../' + m.group(2), s); wr(f, s)
EXTRA = {}
def X(slug, secs, faq=()):
    o = EXTRA.get(slug, ([], []))
    EXTRA[slug] = (o[0] + list(secs), o[1] + list(faq))
def _fp(parts):
    # a list of long strings is paragraphs, not bullets
    if isinstance(parts, list) and parts and all(isinstance(i, str) for i in parts) and sum(len(i) for i in parts) / len(parts) > 170:
        return [('p', i) for i in parts]
    return parts
def load_all():
    for f in sorted(glob.glob('/root/dbg/guides/b[0-9]*.py')):
        exec(compile(open(f).read(), f, 'exec'), globals())
    for f in sorted(glob.glob('/root/dbg/guides/e[0-9]*.py')):
        exec(compile(open(f).read(), f, 'exec'), globals())
    for x in G:
        if x['slug'] in EXTRA:
            x['secs'] = list(x['secs']) + [(hd, _fp(pt)) for hd, pt in EXTRA[x['slug']][0]]; x['faq'] = list(x['faq']) + EXTRA[x['slug']][1]
