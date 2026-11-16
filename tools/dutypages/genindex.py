import sys, json, re, io
sys.path.insert(0, '/root/dbg/lp'); sys.path.insert(0, '/root/dbg/duty')
import lib, gen
from lib import e, p, h2, h3, btn, section, note, rd, wr, R
from gen import TOP, H, L, IMP, hs, short, cap1, rng, fix, partners
by = {}
for n_, v_, c in TOP: by.setdefault(c[:2], []).append(c)
blocks = ''; toc = ''
for ch in sorted(by):
    name = cap1(short(H['c'].get(ch, ''), 90))
    toc += '<a href="#ch%s" style="display:inline-block;background:#FFFFFF;border:1px solid #E1EDF7;border-radius:999px;padding:6px 12px;margin:0 6px 8px 0;font-size:14px;color:#0A6CC2;text-decoration:none;font-weight:600">%s</a>' % (ch, ch)
    items = ''
    for c in sorted(by[ch]):
        rated = [x for x in L['h'][c] if x['tot'] is not None]
        items += '<a class="idr" href="import-duty/%s"><span><b>%s</b> %s</span><i>%s</i></a>' % (c, hs(c), e(cap1(short(H['s'][c], 86))), rng([x['tot'] for x in rated]))
    blocks += '<h3 id="ch%s" style="font-family:\'Archivo\',sans-serif;font-weight:800;font-size:19px;margin:28px 0 10px;scroll-margin-top:90px">Chapter %s: %s</h3><div style="background:#FFFFFF;border:1px solid #E1EDF7;border-radius:16px;max-width:980px;overflow:hidden">%s</div>' % (ch, ch, e(name), items)
n = len(TOP)
body = section(
    h2('{:,} PRODUCTS · {} CHAPTERS'.format(n, len(by)), 'Find your product') +
    p('Each page gives the basic customs duty, IGST and total duty for every eight-digit HSN line, a worked example, the countries India buys from and a link to the calculator. The figure on the right is the total duty at the standard rate, as a percentage of the CIF value.') +
    '<style>.idr{display:flex;justify-content:space-between;gap:12px;padding:11px 14px;border-top:1px solid #E1EDF7;text-decoration:none;color:#3D5873;font-size:15px}.idr:first-child{border-top:0}.idr b{font-family:\'Geist Mono\',monospace;font-size:14px;color:#0A6CC2}.idr i{font-style:normal;font-weight:700;white-space:nowrap;font-size:14.5px;color:#0B2A4A}</style><div style="margin:0 0 6px;max-width:980px">' + toc + '</div>' + blocks +
    '<div style="height:26px"></div>' +
    note('<b>How these products were chosen.</b> They are the six-digit HS subheadings that India imported from the largest number of countries in 2025, with at least US$ 5 million of imports (UN Comtrade). That favours goods bought by many importers over bulk commodities bought by a few. Rates are from the CargoKit duty calculator and are for guidance: verify with Customs and a licensed customs broker.') +
    btn('customs-duty-calculator', 'Any other HSN code: open the calculator'))
lib.page('import-duty/index', 'Import Duty in India by HS Code: {:,} Products | YAM Logistics'.format(n),
    'Import duty in India for {:,} widely imported products, by HS code: basic customs duty, IGST and total duty for every HSN line, with worked examples and a free calculator.'.format(n),
    'Import duty by HS code', 'INDIA IMPORT DUTY · {:,} PRODUCTS · BY HS CODE'.format(n),
    'Import duty in India by HS code.', '{:,} products, every HSN line.'.format(n),
    'The duty rates for the products India imports from the most countries, one page per six-digit HS subheading. Pick a chapter, find your product, and see the duty before you ship.',
    body,
    [('How is import duty calculated in India?', 'Basic customs duty is charged on the assessable (CIF) value. Social welfare surcharge is 10% of the basic duty unless exempt. AIDC applies to some goods. IGST is then charged on the value plus all those duties.'),
     ('What is the difference between an HS code and an HSN code?', 'The first six digits are the international HS code. India adds two more digits to make the eight-digit HSN (ITC-HS) code, and the duty rate is set at eight digits.'),
     ('Which products are listed here?', 'The {:,} six-digit HS subheadings that India imported from the largest number of countries in 2025. For any other product, use the customs duty calculator.'.format(n)),
     ('Are these rates final?', 'No. They are the standard rates in our data and are for guidance. Classification, exemptions, trade agreements and anti-dumping duty can change the amount. Verify with Customs and a licensed customs broker.')],
    cta='Know the duty before you ship. Free calculator, no sign-up.', cta_btn='Open the duty calculator', cta_href='customs-duty-calculator')
f = 'import-duty/index.html'; fix(f); s = rd(f)
s = s.replace('https://www.yamlogistics.com/import-duty/index', 'https://www.yamlogistics.com/import-duty/'); wr(f, s)
print('index ok', len(s), 'chapters', len(by))
