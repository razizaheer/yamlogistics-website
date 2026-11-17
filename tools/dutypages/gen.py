# Import duty pages: one per HS 6-digit subheading, top N by number of supplier countries (UN Comtrade 2025).
import sys, json, re, os, io, html
sys.path.insert(0, '/root/dbg/lp')
import lib
from lib import e, p, h2, h3, ul, btn, cards, section, note, rd, wr, R

H = json.load(open(R + 'hs6-en.json'))
L = json.load(open('/root/dbg/duty/lines.json'))
IMP = json.load(open('/root/dbg/duty/imp.json'))
PAR = json.load(open('/root/dbg/duty/par.json'))
AREAS = {str(a['PartnerCode']): a['PartnerDesc'] for a in json.load(open('/root/dbg/duty/areas.json'))['results']}
NAMEFIX = {'China, Hong Kong SAR': 'Hong Kong', 'Rep. of Korea': 'South Korea', 'USA': 'United States', 'United Arab Emirates': 'UAE', 'Viet Nam': 'Vietnam', 'Türkiye': 'Turkey', 'Russian Federation': 'Russia', 'Other Asia, nes': 'Taiwan', 'Czechia': 'Czech Republic', 'United Rep. of Tanzania': 'Tanzania', "Lao People's Dem. Rep.": 'Laos', 'Dem. Rep. of the Congo': 'DR Congo', 'Rep. of Moldova': 'Moldova', 'Iran (Islamic Republic of)': 'Iran', 'Iran': 'Iran', 'China, Macao SAR': 'Macao', 'Bolivia (Plurinational State of)': 'Bolivia', 'Brunei Darussalam': 'Brunei', "Côte d'Ivoire": 'Ivory Coast', 'Syrian Arab Republic': 'Syria', 'Venezuela (Bolivarian Republic of)': 'Venezuela'}
SKIP_PARTNERS = {'0', '899', '837', '838', '839', '879', '490999'}  # world and "not elsewhere specified" areas, except 490 below
MINP = 10000   # a supplier country counts when India imported at least US$ 10,000 from it
MINV = 5e6
N = int(sys.argv[1]) if len(sys.argv) > 1 else 1000

def guides_for(code):
    g = [('guides/how-customs-duty-is-calculated-in-india', 'How duty is calculated', 'Basic duty, surcharge and IGST, step by step.'),
         ('guides/assessable-value-cif-landing-charges', 'Assessable value', 'How CIF value and landing charges are worked out.'),
         ('guides/hs-code-classification-general-rules', 'Classifying your goods', 'The general rules for choosing the right HS code.')]
    ch = code[:2]; h4 = code[:4]
    if h4 == '8507' or h4 == '8506': g.append(('guides/lithium-battery-shipping-guide', 'Shipping lithium batteries', 'UN numbers, UN 38.3 tests and packing.'))
    if int(ch) <= 24: g.append(('guides/fssai-import-clearance', 'FSSAI import clearance', 'Shelf life, labels and the food import process.'))
    if ch in ('84', '85', '94', '95'): g.append(('guides/bis-certification-for-imports', 'BIS certification', 'Which imported goods need BIS registration.'))
    if ch in ('72', '73', '76', '39', '29', '28'): g.append(('guides/anti-dumping-duty-explained', 'Anti-dumping duty', 'Extra duties on goods from named countries.'))
    g.append(('guides/igst-on-imports-and-input-tax-credit', 'IGST and input tax credit', 'How to claim back the IGST you pay at import.'))
    return g[:5]

def cname(c):
    n = AREAS.get(c, c); return NAMEFIX.get(n, n)
def partners(code):
    d = PAR.get(code, {}); return sorted([(c, v) for c, v in d.items() if c not in SKIP_PARTNERS and v >= MINP], key=lambda t: -t[1])
def usd(v):
    return ('US$ %.2f billion' % (v / 1e9)) if v >= 1e9 else ('US$ %.1f million' % (v / 1e6)) if v >= 1e6 else 'US$ {:,}'.format(round(v))
def pc(x):
    if x is None: return '—'
    s = ('%.2f' % x).rstrip('0').rstrip('.'); return s + '%'
def hs(code): return code[:4] + '.' + code[4:]
def hs8(c): return c[:4] + ' ' + c[4:6] + ' ' + c[6:]
def short(t, n=58):
    t = re.sub(r'\s+', ' ', t).strip()
    if len(t) <= n: return t
    c = t[:n]; c = c[:c.rfind(' ')] if ' ' in c else c
    return c.rstrip(' ,;:(') + '…'
def cap1(t): return t[:1].upper() + t[1:] if t else t
POL = {'F': 'Free', 'R': 'Restricted', 'P': 'Prohibited', 'S': 'State trading', 'M': 'Varies', '?': 'Check'}

# ---- ranking
cands = []
for code, v in IMP.items():
    if len(code) != 6 or v[0] < MINV or code not in PAR or code not in L['h'] or code not in H['s']: continue
    if not any(x['tot'] is not None for x in L['h'][code]): continue
    cands.append((len(partners(code)), v[0], code))
cands.sort(key=lambda t: (-t[0], -t[1]))
TOP = cands[:N]
RANK = {c: i + 1 for i, (_, _, c) in enumerate(TOP)}
TOPSET = set(RANK)

def lines_table(lines):
    th = lambda t, al='right': '<th style="text-align:%s;padding:11px 9px;font-family:\'Geist Mono\',monospace;font-size:11.5px;letter-spacing:0.03em;color:#17436B;background:#EAF4FD;vertical-align:bottom">%s</th>' % (al, t)
    td = lambda t, al='right', ex='': '<td style="text-align:%s;padding:11px 9px;border-top:1px solid #E1EDF7;font-size:15px;line-height:1.4;vertical-align:top;color:#3D5873;%s">%s</td>' % (al, ex, t)
    rows = ''
    for x in lines:
        b = pc(x['bcd']) if x['bcd'] is not None else 'n/a'
        tar = x['t'] or ''; sub = ''
        if x['bcd'] is not None and x['src'] != 'tariff' and tar and tar != pc(x['bcd']): sub = 'Tariff rate ' + short(tar, 40) + '; ' + pc(x['bcd']) + ' by notification. '
        elif re.search(r'Rs|whichever|per ', tar): sub = 'Tariff: ' + short(tar, 60) + '. '
        polc = {'F': '#0F7A3D', 'R': '#9A5B00', 'P': '#B42318'}.get(x['pol'], '#3D5873')
        first = ('<a href="customs-duty-calculator#hs=%s" style="color:#0A6CC2;font-weight:700;text-decoration:none;white-space:nowrap;font-family:\'Geist Mono\',monospace;font-size:14px">%s</a>' % (x['c'], hs8(x['c']))
                 + '<div style="color:#0B2A4A;margin-top:3px">%s</div>' % e(cap1(short(x['d'], 110)))
                 + '<div style="font-size:12.5px;color:#5E7891;margin-top:3px">%sImport policy: <span style="color:%s;font-weight:600">%s</span></div>' % (e(sub), polc, POL.get(x['pol'], 'Check')))
        rows += '<tr>' + td(first, 'left') + td(b, 'right', 'white-space:nowrap') + td(pc(x['ig']), 'right', 'white-space:nowrap') + td('<b style="color:#0B2A4A">%s</b>' % pc(x['tot']), 'right', 'white-space:nowrap') + '</tr>'
    head = th('HSN line', 'left') + th('Basic duty') + th('IGST') + th('Total duty')
    return ('<div style="background:#FFFFFF;border:1px solid #E1EDF7;border-radius:16px;max-width:980px;overflow:hidden"><table style="border-collapse:collapse;width:100%%"><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>'
            '<div style="font-size:13.5px;line-height:1.5;color:#5E7891;margin:10px 2px 22px;max-width:900px">Total duty is the standard rate as a percentage of the assessable (CIF) value: basic customs duty, social welfare surcharge, AIDC where it applies, and IGST charged on the value plus those duties. No trade agreement applied. Tap a code to open it in the calculator.</div>') % (head, rows)

def rng(vals):
    v = sorted(set(vals)); return pc(v[0]) if len(v) == 1 else pc(v[0]) + ' to ' + pc(v[-1])
def inr(n):
    s = '%d' % round(n);
    if len(s) > 3:
        h_, t_ = s[:-3], s[-3:]; h_ = re.sub(r'(\d)(?=(\d\d)+$)', r'\1,', h_); s = h_ + ',' + t_
    return 'Rs ' + s

def make(code):
    lines = L['h'][code]; rated = [x for x in lines if x['tot'] is not None]
    desc = re.sub(r'\s+', ' ', H['s'][code]).strip(); head = H['h'].get(code[:4], '')
    val = IMP[code][0]; ps = partners(code); tot5 = sum(v for _, v in ps) or 1
    top5 = ', '.join('%s (%d%%)' % (cname(c), round(v * 100 / tot5)) if round(v * 100 / tot5) >= 1 else cname(c) for c, v in ps[:5])
    ex = max(rated, key=lambda x: (sum(1 for y in rated if y['tot'] == x['tot']), -lines.index(x)))   # the most common rate, first such line
    AV = 100000; b = AV * ex['bcd'] / 100; s = AV * ex['sws'] / 100; a = AV * ex['aidc'] / 100; ig = (AV + b + s + a) * ex['ig'] / 100; t = b + s + a + ig
    label = cap1(short(desc, 70)); tl = short(desc, 42)
    T = 'Import Duty on HS %s in India: %s | YAM Logistics' % (hs(code), cap1(tl))
    DESC = 'India import duty for HS %s (%s): basic customs duty %s, IGST %s, total %s of CIF value across %d HSN line%s. Worked example and free calculator.' % (hs(code), short(desc, 60), rng([x['bcd'] for x in rated]), rng([x['ig'] for x in rated]), rng([x['tot'] for x in rated]), len(lines), '' if len(lines) == 1 else 's')
    nres = [x for x in lines if x['pol'] in ('R', 'P', 'S')]
    cond = sum(x['cond'] for x in lines)
    exrows = [['Assessable value (CIF)', inr(AV)], ['Basic customs duty at ' + pc(ex['bcd']), inr(b)], ['Social welfare surcharge' + (' (10% of basic duty)' if ex['sws'] else ' (exempt)'), inr(s)]]
    if ex['aidc']: exrows.append(['AIDC at ' + pc(ex['aidc']), inr(a)])
    exrows += [['IGST at ' + pc(ex['ig']) + ' on value plus duties', inr(ig)], ['<b>Total duty</b>', '<b>%s (%s)</b>' % (inr(t), pc(ex['tot']))], ['Landed value after duty', inr(AV + t)]]
    sibs = [c for c in sorted(TOPSET) if c[:4] == code[:4] and c != code][:6]
    if len(sibs) < 3: sibs += [c for c in sorted(TOPSET) if c[:2] == code[:2] and c != code and c not in sibs][:6 - len(sibs)]
    body = section(
        h2('HS ' + hs(code) + ' · ' + str(len(lines)) + ' HSN LINE' + ('' if len(lines) == 1 else 'S'), 'Duty rates for HS ' + hs(code)) +
        p('HS %s covers: %s. It sits under heading %s (%s). India’s customs tariff splits it into %d eight-digit HSN line%s. At the standard rate the total duty comes to <b>%s</b> of the assessable value.' % (hs(code), e(desc[:1].lower() + desc[1:]), code[:4], e(short(head, 120)), len(lines), '' if len(lines) == 1 else 's', rng([x['tot'] for x in rated]))) +
        lines_table(lines) +
        btn('customs-duty-calculator#hs=' + ex['c'], 'Calculate duty for your value') + btn('import-duty/', 'All 1,000 products', True)
    ) + section(
        h2('WORKED EXAMPLE', 'Duty on a shipment worth ' + inr(AV)) +
        p('For HSN %s (%s) with an assessable value of %s, at the standard rate:' % (hs8(ex['c']), e(short(ex['d'], 80)), inr(AV))) +
        lib.table(['Step', 'Amount'], exrows) +
        p('The assessable value is the CIF value in rupees at the customs exchange rate. If your invoice is FOB, freight and insurance are added first; the calculator does this for you.') +
        h2('WHO SUPPLIES INDIA', 'Imports under HS ' + hs(code) + ' in 2025') +
        p('India imported %s of goods under HS %s in 2025, from %d countries. The largest suppliers were %s.' % (usd(val), hs(code), len(ps), top5)) +
        p('If your goods come from a country that has a trade agreement with India, such as the UAE, the ASEAN countries, Japan, South Korea or Australia, the basic duty can be lower with a valid certificate of origin. Choose the country of origin in the calculator to see the preferential rate.') +
        (h3('Import policy') + p('%d of the %d lines %s restricted, prohibited or reserved for state trading under the DGFT import policy. Check the exact line before you order.' % (len(nres), len(lines), 'is' if len(nres) == 1 else 'are') + (' For example: ' + e(short(nres[0]['pn'], 220)) if nres[0]['pn'] else '')) if nres else '') +
        (h3('Conditional exemptions') + p('There are conditional exemption or concession entries that can apply to these lines, for example for a stated end use or a named importer. They are not applied above. The calculator lists each one under the line.') if cond else '') +
        note('<b>For guidance.</b> Rates are from the data in the CargoKit duty calculator: %s. Duty rates change by notification, and classification decides the rate. Verify with Customs and a licensed customs broker before you rely on a figure.' % e(short(L['v'], 240))) +
        h3('Related products') + cards([('import-duty/' + c, 'HS ' + hs(c), cap1(short(H['s'][c], 80))) for c in sibs] + [('customs-duty-calculator', 'Customs duty calculator', 'Any HSN code, any country of origin, with landed cost.')]) + h3('Related guides') + cards(guides_for(code)), '#FFFFFF')
    faq = [('What is the import duty on HS %s in India?' % hs(code), 'At the standard rate the total duty is %s of the assessable (CIF) value: basic customs duty %s, social welfare surcharge of 10%% of the basic duty where it applies, and IGST of %s. The exact figure depends on the eight-digit HSN line.' % (rng([x['tot'] for x in rated]), rng([x['bcd'] for x in rated]), rng([x['ig'] for x in rated]))),
           ('What is the IGST rate on imports under HS %s?' % hs(code), 'IGST is %s. It is charged on the assessable value plus the customs duties, and a GST-registered importer can normally claim it as input tax credit.' % rng([x['ig'] for x in rated])),
           ('Is a licence needed to import goods under HS %s?' % hs(code), ('%d of the %d HSN lines %s restricted, prohibited or reserved for state trading under the DGFT import policy; the rest are free to import.' % (len(nres), len(lines), 'is' if len(nres) == 1 else 'are')) if nres else 'All %d HSN line%s under this subheading %s free to import under the DGFT import policy. Other rules, such as BIS, FSSAI or WPC approval, can still apply to the product.' % (len(lines), '' if len(lines) == 1 else 's', 'is' if len(lines) == 1 else 'are')),
           ('Which countries does India import HS %s from?' % hs(code), 'In 2025 India imported %s under this subheading from %d countries. The largest suppliers were %s.' % (usd(val), len(ps), top5)),
           ('How do I calculate the duty for my own shipment?', 'Open the free customs duty calculator, enter the HSN code and your invoice value, and choose the country of origin. It shows each duty, the total and the landed cost.')]
    lib.page('import-duty/' + code, T, DESC, 'HS ' + hs(code), 'INDIA IMPORT DUTY · HS ' + hs(code) + ' · ' + str(len(lines)) + ' HSN LINE' + ('' if len(lines) == 1 else 'S'),
             'Import duty on HS ' + hs(code) + ' in India.', label, 'Basic customs duty, IGST and the total duty for every HSN line under HS %s, with a worked example, the countries India buys from, and a free calculator for your own shipment.' % hs(code),
             body, faq, cta='Know the duty before you ship. Free calculator, no sign-up.', cta_btn='Open the duty calculator', cta_href='customs-duty-calculator')

REL = re.compile(r'((?:href|src)=")(?!https?:|/|#|mailto:|tel:|data:|\.\./)([^"]+")')
def fix(path):
    s = rd(path); s = REL.sub(lambda m: m.group(1) + '../' + m.group(2), s); wr(path, s)

if __name__ == '__main__':
    os.makedirs(R + 'import-duty', exist_ok=True)
    for i, (np_, v, code) in enumerate(TOP):
        make(code); fix('import-duty/' + code + '.html')
    json.dump([[c, n_, v_] for n_, v_, c in TOP], open('/root/dbg/duty/top.json', 'w'))
    print('pages', len(TOP), '| candidates', len(cands), '| partner count range', TOP[0][0], TOP[-1][0], '| first', TOP[0][2], '| last', TOP[-1][2])
