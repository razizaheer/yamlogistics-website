# Generator for load-planner content pages (landing, question and comparison pages).
# Base page: customs-late-charges-calculator.html. Run from anywhere; writes into the repo.
import re, json, html, io, base64
R = '/home/claude/yamlogistics-website/'
BASE = 'customs-late-charges-calculator'
SITE = 'https://www.yamlogistics.com/'
CAP = json.load(open('/root/dbg/lp/cap.json'))
EQ = CAP['eq']
e = lambda x: html.escape(str(x), quote=True)

def rd(f): return io.open(R + f, encoding='utf-8').read()
def wr(f, s): io.open(R + f, 'w', encoding='utf-8', newline='').write(s)

def preset(cat, items, truck='in', deck='ld'):
    """Link that opens the planner with these items and calculates. items: (name,l,w,h,qty,kg)."""
    o = {'u': 'cm', 'wu': 'kg', 'c': cat, 'p': 0, 'd': deck, 't': truck, 'b': 0, 'r': [0, 250, 0, 0],
         'i': [[n, l, w, h, q, kg, 0, 1, 0, '', 1, 0, 0, ''] for (n, l, w, h, q, kg) in items]}
    s = base64.b64encode(json.dumps(o, separators=(',', ':')).encode('utf-8')).decode().rstrip('=')
    return 'container-load-planner#p=' + s

# ---------- building blocks (inline styles, same look as the rest of the site)
P = 'font-size:17px;line-height:1.65;color:#3D5873;margin:0 0 16px;max-width:860px'
def p(t): return '<p style="%s">%s</p>' % (P, t)
def h2(kicker, t):
    return ('<div style="font-family:\'Geist Mono\',monospace;font-size:12px;letter-spacing:0.12em;color:#0A6CC2;margin-bottom:12px">%s</div>'
            '<h2 style="font-family:\'Archivo\',sans-serif;font-weight:900;font-stretch:110%%;font-size:clamp(26px,3vw,40px);line-height:1.08;letter-spacing:-0.02em;margin:0 0 20px">%s</h2>') % (e(kicker), e(t))
def h3(t): return '<h3 style="font-family:\'Archivo\',sans-serif;font-weight:800;font-size:20px;margin:26px 0 10px">%s</h3>' % e(t)
def ul(items): return '<ul style="%s;padding-left:22px">%s</ul>' % (P, ''.join('<li style="margin-bottom:8px">%s</li>' % i for i in items))
def table(head, rows, note='', left=False):
    """Up to 3 columns: fits a phone with wrapping. More: scrolls sideways with the first column pinned."""
    wide = len(head) > 3
    al = lambda i: 'left' if (i == 0 or left) else 'right'
    pin = 'position:sticky;left:0;z-index:1;' if wide else ''
    th = ''.join('<th style="text-align:%s;padding:12px 12px;font-family:\'Geist Mono\',monospace;font-size:12px;letter-spacing:0.04em;color:#17436B;background:#EAF4FD;vertical-align:bottom;%s%s">%s</th>' % (al(i), (pin + 'max-width:150px;') if i == 0 else '', 'white-space:nowrap;' if wide and i else '', e(h)) for i, h in enumerate(head))
    tr = ''
    for r in rows:
        tr += '<tr>' + ''.join('<td style="text-align:%s;padding:11px 12px;border-top:1px solid #E1EDF7;font-size:15px;line-height:1.4;vertical-align:top;%s">%s</td>' % (al(i), ('font-weight:600;color:#0B2A4A;background:#FFFFFF;' + pin + ('max-width:150px;' if wide else '')) if i == 0 else ('color:#3D5873;' + ('white-space:nowrap;' if wide else '')), c) for i, c in enumerate(r)) + '</tr>'
    n = '<div style="font-size:13.5px;line-height:1.5;color:#5E7891;margin:10px 2px 0;max-width:860px">%s</div>' % note if note else ''
    hint = '<style>.lp-sw{display:none}@media(max-width:760px){.lp-sw{display:block}}</style><div class="lp-sw" style="font-size:13px;color:#5E7891;margin:0 2px 8px">Swipe the table sideways for more columns →</div>' if wide else ''
    tb = '<table style="border-collapse:collapse;width:100%%;%s"><thead><tr>%s</tr></thead><tbody>%s</tbody></table>' % ('min-width:%dpx' % (150 + 118 * (len(head) - 1)) if wide else '', th, tr)
    return hint + '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;background:#FFFFFF;border:1px solid #E1EDF7;border-radius:16px;max-width:980px">' + tb + '</div>' + n + '<div style="height:22px"></div>'
def btn(href, t, alt=False):
    st = 'background:#FFFFFF;color:#0A6CC2;border:2px solid #0A6CC2' if alt else 'background:#0A6CC2;color:#FFFFFF;border:2px solid #0A6CC2'
    return '<a href="%s" style="display:inline-block;%s;text-decoration:none;font-weight:700;border-radius:999px;padding:13px 24px;margin:4px 10px 18px 0">%s</a>' % (href, st, e(t))
def cards(items):
    c = ''.join('<a href="%s" style="display:block;background:#FFFFFF;border:1px solid #E1EDF7;border-radius:16px;padding:16px 18px;text-decoration:none;color:#0B2A4A"><b style="font-family:\'Archivo\',sans-serif;font-size:17px;display:block;margin-bottom:4px">%s</b><span style="font-size:14.5px;line-height:1.5;color:#3D5873">%s</span></a>' % (h, e(t), e(d)) for h, t, d in items)
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;max-width:1100px;margin-bottom:8px">%s</div>' % c
def section(inner, bg='#F7FBFF'):
    return '<div style="background:%s"><div style="max-width:1400px;margin:0 auto;padding:48px 32px">%s</div></div>' % (bg, inner)
def note(t): return '<div style="background:#FFF9E8;border:1px solid #F3DE9B;border-radius:16px;padding:14px 18px;margin:0 0 22px;font-size:15px;line-height:1.55;color:#5B4708;max-width:980px">%s</div>' % t

def spec_rows(ids):
    rows = []
    for i in ids:
        q = EQ[i]; vol = q['L'] * q['W'] * q['H'] / 1e6
        door = ('%d × %d' % (q['doorW'], q['doorH'])) if q['doorW'] else 'open'
        rows.append([e(q['name']), '%d × %d × %d' % (q['L'], q['W'], q['H']), door, '%.1f' % vol, '{:,}'.format(q['maxKg'])])
    return rows
SPEC_HEAD = ['Equipment', 'Inside L × W × H (cm)', 'Door W × H (cm)', 'Volume (m³)', 'Payload (kg)']
SPEC_NOTE = 'Typical dimensions used by the planner. Containers and truck bodies differ slightly by builder and owner, so check the unit you are given.'
SHORT = {'20gp': '20 ft', '40gp': '40 ft', '40hc': '40 ft HC', '45hc': '45 ft HC', '20rf': '20 ft reefer', '40rh': '40 ft HC reefer'}
ENGINE_NOTE = 'Counts come from the CargoKit load planner engine using the inside dimensions above, cartons turned any way up, no gaps. Weight is not limiting in these examples; heavy cargo reaches the payload limit first. Real loads need a little room for handling, so treat these as the upper end.'

RELATED = [
    ('20ft-container-load-calculator', '20 ft container load calculator', 'Pallets and cartons that fit a 20 ft standard container.'),
    ('40ft-container-load-calculator', '40 ft container load calculator', '40 ft standard, 40 ft high cube and 45 ft high cube.'),
    ('reefer-container-load-calculator', 'Reefer container load calculator', '20 ft and 40 ft high cube reefers, loaded below the red line.'),
    ('truck-load-calculator', 'Truck load calculator', 'Indian 20, 24 and 32 ft trucks, EU trailers and US 53 ft vans.'),
    ('air-cargo-uld-load-calculator', 'Air cargo ULD load calculator', 'PMC and PAG air pallets, AKE, AKH and LD7 containers.'),
    ('pallet-load-calculator', 'Pallet load calculator', 'How many cartons go on a Euro, standard or Asia pallet.'),
    ('how-many-pallets-fit-in-a-container', 'How many pallets fit in a container?', 'Pallet counts for every container and trailer size.'),
    ('how-many-cartons-fit-in-a-container', 'How many cartons fit in a container?', 'Carton counts for 20 ft, 40 ft and 40 ft high cube.'),
]
def related(skip):
    return cards([(s, t, d) for s, t, d in RELATED if s != skip] + [('container-load-planner', 'Open the free 3D load planner', 'Enter your own packing list and see it loaded.')])

D = '<details style="background:#FFFFFF;border-radius:16px;padding:16px 20px"><summary style="cursor:pointer;font-family:\'Archivo\',sans-serif;font-weight:700;font-size:17px">%s</summary><p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:#3D5873">%s</p></details>'

def page(slug, T, DESC, crumb, chip, h1a, h1b, intro, body, faq, cta='See your own cargo loaded in 3D. Free, no sign-up.', cta_btn='Open the free load planner', cta_href='container-load-planner'):
    s = rd(BASE + '.html')
    oT = re.search(r'<title>(.*?)</title>', s).group(1); oD = re.search(r'<meta name="description" content="(.*?)">', s).group(1)
    m = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', s, re.S); j = json.loads(m.group(2))
    g = []
    for n in j['@graph']:
        t = n['@type']
        if t == 'WebApplication': continue
        if t == 'WebPage':
            n['name'] = T; n['description'] = DESC; n.pop('mainEntity', None)
        if t == 'BreadcrumbList': n['itemListElement'][2]['name'] = crumb
        if t == 'FAQPage': n['mainEntity'] = [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r'<[^>]+>', '', a)}} for q, a in faq]
        g.append(n)
    j['@graph'] = g
    s = s[:m.start(2)] + json.dumps(j, ensure_ascii=False, separators=(',', ':')) + s[m.end(2):]
    s = s.replace(oT, e(T)).replace(oD, e(DESC))
    s = re.sub(r'(letter-spacing: 0\.08em; margin-bottom: 22px">)[^<]*(</div>)', lambda k: k.group(1) + e(chip) + k.group(2), s, 1)
    s = re.sub(r'(<h1 [^>]*>).*?(</h1>)', lambda k: k.group(1) + e(h1a) + ' <span style="color: #0A6CC2">' + e(h1b) + '</span>' + k.group(2), s, 1, flags=re.S)
    s = re.sub(r'(<p style="font-size: 20px;[^>]*>).*?(</p>)', lambda k: k.group(1) + intro + k.group(2), s, 1, flags=re.S)
    # the tool block (from the pale section to the questions section) becomes the page body
    a = s.index('<div style="background: #F7FBFF">'); b = s.index('<div style="background: #F2F8FD">')
    s = s[:a] + body + '\n' + s[b:]
    a = s.index('<div style="display:grid;gap:10px;max-width:900px">'); b = s.index('</div>', s.rindex('</details>', a, s.index('<div style="background: #0A6CC2; color: #FFFFFF">')))
    s = s[:a] + '<div style="display:grid;gap:10px;max-width:900px">' + ''.join(D % (e(q), an) for q, an in faq) + s[b:]
    s = re.sub(r'(line-height: 1\.15; max-width: 640px">)[^<]*(</div>)', lambda k: k.group(1) + e(cta) + k.group(2), s, 1)
    s = re.sub(r'<a href="https://wa\.me/message/[^"]*" (style="background:#FFC93C;[^"]*")>[^<]*</a>', lambda k: '<a href="%s" %s>%s</a>' % (cta_href, k.group(1), e(cta_btn)), s, 1)
    s = s.replace('<script src="customs-late.js?v=1"></script>', '')
    s = s.replace(BASE, slug)
    low = s.lower()
    assert 'cl-root' not in s and 'customs-late' not in s and 'bill of entry late' not in low and 'late charges' not in low, 'leftover in ' + slug
    wr(slug + '.html', s); return len(s)
