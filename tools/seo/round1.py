#!/usr/bin/env python3
"""Ranking round 1 (20 Nov 2026) for four tool pages: customs-duty-calculator, hsn-code-finder,
trade-notifications, bl-awb-draft. Title/description tuned to the searches Search Console shows,
share image, HowTo schema, a new content section and extra FAQs. Idempotent (marker blocks).
English pages only; translated pages are rebuilt through tools/i18n in a later round."""
import json, re, os
R = '/home/claude/yamlogistics-website/'
SITE = 'https://www.yamlogistics.com/'
E = lambda s: s.replace('&', '&amp;')

H2 = "font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 110%; font-size: clamp(30px, 3.4vw, 46px); line-height: 1.05; letter-spacing: -0.03em; margin: 0 0 22px"
P = 'font-size: 16.5px; line-height: 1.7; color: #3D5873; margin: 0 0 14px; max-width: 860px'
UL = 'font-size: 16px; line-height: 1.7; color: #3D5873; padding-left: 22px; margin: 0 0 16px; max-width: 900px'
A = 'color: #0A6CC2'

def section(kicker, title, inner, sid=''):
    return ('<!--seo-r1--><div style="background: #FFFFFF"><div style="max-width: 1100px; margin: 0 auto; padding: 72px 32px">'
            '<div style="font-family: \'Geist Mono\', monospace; font-size: 12px; letter-spacing: 0.12em; color: #0A6CC2; margin-bottom: 12px">%s</div>'
            '<h2%s style="%s">%s</h2>%s</div></div><!--/seo-r1-->\n') % (kicker, (' id="%s"' % sid) if sid else '', H2, title, inner)
def ul(items): return '<ul style="%s">%s</ul>' % (UL, ''.join('<li style="margin-bottom: 8px">%s</li>' % i for i in items))
def p(t): return '<p style="%s">%s</p>' % (P, t)
DET = ('<details style="background: #FFFFFF; border-radius: 16px; padding: 20px 24px; margin-bottom: 10px">'
       '<summary style="font-weight: 600; font-size: 18px; display: flex; justify-content: space-between; gap: 20px">%s<span style="color: #0A6CC2">+</span></summary>'
       '<p style="font-size: 16px; line-height: 1.65; color: #3D5873; margin: 12px 0 0">%s</p></details>')

def steps_from(s):
    return [(re.sub(r'&amp;', '&', a), re.sub(r'&amp;', '&', b)) for a, b in
            re.findall(r"font-size: 19px\">([^<]+)</span>\s*<span style=\"font-size: 14px[^>]*>([^<]+)</span>", s)]

# ---------------------------------------------------------------- page configs
chap = re.findall(r'id="ch(\d+)"[^>]*>Chapter \d+: (.*?)</', open(R + 'import-duty/index.html', encoding='utf-8').read())
chap_html = ('<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 8px; max-width: 1100px">' +
             ''.join('<a href="import-duty/#ch%s" style="display: block; background: #F2F8FD; border-radius: 12px; padding: 10px 14px; text-decoration: none; color: #0B2A4A; font-size: 14.5px; line-height: 1.4"><b style="font-family: \'Geist Mono\', monospace; color: #0A6CC2">%s</b> %s</a>' % (c, c, t) for c, t in chap) + '</div>')

PAGES = {
 'customs-duty-calculator': dict(
   title='Import Duty Calculator India: Customs Duty by HSN Code (BCD, SWS, IGST) | YAM Logistics',
   desc='Free import duty calculator for India: know your customs duty by HSN code or product name. BCD, social welfare surcharge, IGST, trade-agreement rates by origin, landed cost and DGFT import policy.',
   before='>Customs duty questions</h2>',
   section=section('KNOW YOUR CUSTOMS DUTY', 'Know your customs duty: this calculator and ICEGATE',
     p('Many importers search for “know your customs duty” when they want the duty calculator on ICEGATE, the Indian Customs portal run by CBIC. This free import duty calculator does the same sum from the Customs Tariff and adds what you usually need next:') +
     ul(['<b>Search by product name</b>, not only by the 8-digit HSN code.',
         '<b>Country of origin</b>: if India has a trade agreement with that country, the preferential rate for the line is shown next to the standard rate.',
         '<b>The full payable amount</b>: basic customs duty, social welfare surcharge and IGST on the assessable value, and the landed cost of the goods.',
         '<b>DGFT import policy</b> for the line, so you see straight away if it is free, restricted or prohibited.',
         '<b>No login</b>, and it works on a phone.']) +
     p('Rates change with the Union Budget and with notifications during the year. Before you file a bill of entry, check the rate on ICEGATE and in the <a href="trade-notifications" style="%s">latest customs notifications</a>, and use the <a href="customs-exchange-rates" style="%s">customs exchange rate</a> for the week of filing.' % (A, A))),
   faq=[('Is this the same as the ICEGATE duty calculator?', 'It does the same calculation from the Customs Tariff: basic customs duty, social welfare surcharge and IGST on the assessable value. It also searches by product name, shows trade-agreement rates by country of origin, the DGFT import policy and the landed cost. ICEGATE is the official source, so check the rate there before you file.'),
        ('How do I calculate import duty on goods from China?', 'Enter the HSN code or describe the goods, choose China as the country of origin and enter the invoice value. If a trade-agreement rate applies to that line, the calculator shows it. Some goods from China also carry anti-dumping or safeguard duty, which is charged on top; check the latest notifications for your product before you import.')]),
 'hsn-code-finder': dict(
   title='HSN Code Finder India: Search ITC-HS Codes by Product Name | YAM Logistics',
   desc='Free HSN code finder for India: describe your product in plain words and get likely 8-digit HSN / ITC-HS codes from the Customs Tariff, with customs duty and import and export policy. Browse codes by chapter.',
   before='>Questions people ask</h2>',
   section=section('BROWSE BY CHAPTER', 'HSN code list by chapter',
     p('Prefer to browse? These are the chapters of the Indian Customs Tariff with products on our import duty pages. Each chapter lists 6-digit HS codes with their duty, and each code opens a page with the 8-digit tariff lines, rates and policy. For any other product, describe it in the finder above.') + chap_html, 'chapters'),
   faq=[('How many digits does an HSN code have for imports and exports?', 'Customs filings in India use the 8-digit ITC-HS code. The first 6 digits are the international HS code, the same in every country; the last 2 are India’s own split of that code. GST invoices need 4 or 6 digits, depending on annual turnover.'),
        ('Where can I see the customs duty for an HSN code?', 'Every result in the finder shows the basic customs duty. For the full payable amount with social welfare surcharge, IGST and the landed cost, open the <a href="customs-duty-calculator" style="color: #0A6CC2">import duty calculator</a>, or browse the <a href="import-duty/" style="color: #0A6CC2">import duty pages for 1,000 products</a>.')]),
 'trade-notifications': dict(
   title='Customs Notifications 2026: Latest CBIC & DGFT Notifications, Circulars, Public Notices | YAM Logistics',
   desc='Latest customs notifications and circulars from CBIC, DGFT notifications, public notices and trade notices, and custom house public notices in one searchable place, with plain-English summaries from a licensed customs broker.',
   before=None, section='', faq=[]),
 'bl-awb-draft': dict(
   title='Bill of Lading & Air Waybill Draft Maker: Free B/L and AWB Draft PDF | YAM Logistics',
   desc='Free bill of lading and air waybill draft maker: enter shipper, consignee, ports, containers or pieces and get a clean A4 draft B/L or draft AWB as a PDF to check with your forwarder. Checks container and AWB numbers.',
   before='>Good to know.</h2>',
   section=section('BEFORE IT IS ISSUED', 'What to check on a B/L or AWB draft',
     p('The carrier issues the final bill of lading or air waybill from the details it is given. A correction after that usually costs an amendment fee and time, and at destination a mismatch with the invoice or letter of credit can hold the cargo. Go through these lines on the draft first:') +
     ul(['<b>Shipper, consignee and notify party</b>: names and addresses exactly as on the commercial invoice and, if there is one, the letter of credit. Use “to order” only if the LC asks for it.',
         '<b>Ports and places</b>: place of receipt, port of loading, port of discharge and final place of delivery as booked.',
         '<b>Containers</b>: container and seal numbers as at gate-in. The draft maker checks the container number check digit.',
         '<b>Cargo</b>: number and type of packages, description, gross weight and volume matching the packing list and the shipping bill; HS code if the destination requires it.',
         '<b>Freight terms</b>: freight prepaid or collect, in line with the Incoterm.',
         '<b>Release</b>: number of originals, or a sea waybill or telex release if that was agreed.',
         '<b>For an AWB</b>: airline prefix and AWB number (the draft maker checks the check digit), pieces, gross and chargeable weight, handling information and house waybill numbers.'])),
   faq=[], steps=[('Choose B/L or AWB', 'Pick a sea bill of lading or an air waybill draft.'),
                  ('Fill in the parties and route', 'Enter shipper, consignee, notify party, ports or airports.'),
                  ('Add containers or pieces', 'Add containers with seal numbers, or pieces with weights. Container and AWB numbers are checked as you type.'),
                  ('Download the draft PDF', 'Get a clean A4 draft marked DRAFT and send it to your forwarder or carrier to agree before the final document is issued.')]),
}

def run(slug, c):
    f = R + slug + '.html'
    s = open(f, encoding='utf-8').read()
    T, D = E(c['title']), E(c['desc'])
    s = re.sub(r'<title>[^<]*</title>', '<title>%s</title>' % T, s, count=1)
    s = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + D, s, count=1)
    s = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + T, s, count=1)
    s = re.sub(r'(<meta property="og:description" content=")[^"]*', lambda m: m.group(1) + D, s, count=1)
    img = SITE + 'og/%s.png' % slug
    if 'og:image' not in s:
        s = s.replace('<meta property="og:title"', '<meta property="og:image" content="%s"><meta name="twitter:image" content="%s"><meta property="og:title"' % (img, img), 1)
    s = re.sub(r'<!--seo-r1-->.*?<!--/seo-r1-->\n?', '', s, flags=re.S)
    s = re.sub(r'<!--seo-r1f-->.*?<!--/seo-r1f-->', '', s, flags=re.S)
    if c['section']:
        h = s.find(c['before']); w = s.rfind('<div style="background', 0, h)
        assert h > 0 and w > 0, slug
        s = s[:w] + c['section'] + s[w:]
    if c['faq']:
        h = s.find(c['before']) + len(c['before'])
        s = s[:h] + '\n<!--seo-r1f-->' + ''.join(DET % (q, a) for q, a in c['faq']) + '<!--/seo-r1f-->' + s[h:]
    steps = c.get('steps') or steps_from(s)
    m = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', s, re.S)
    d = json.loads(m.group(2)); g = d['@graph']
    g[:] = [n for n in g if n.get('@type') != 'HowTo']
    for n in g:
        if n.get('@type') == 'WebPage':
            n['name'] = c['title'].replace(' | YAM Logistics', ''); n['description'] = c['desc']
            n['primaryImageOfPage'] = {'@type': 'ImageObject', 'url': img}
        if n.get('@type') == 'WebApplication':
            n['image'] = img
        if n.get('@type') == 'FAQPage' and c['faq']:
            have = {q['name'] for q in n['mainEntity']}
            for q, a in c['faq']:
                if q not in have:
                    n['mainEntity'].append({'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': re.sub(r'<[^>]+>', '', a)}})
    if steps:
        g.append({'@type': 'HowTo', 'name': c['title'].split(':')[0].replace(' | YAM Logistics', '') + ': how to use it', 'image': img,
                  'step': [{'@type': 'HowToStep', 'position': i + 1, 'name': a, 'text': b, 'url': SITE + slug} for i, (a, b) in enumerate(steps)]})
    s = s[:m.start(2)] + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + s[m.end(2):]
    open(f, 'w', encoding='utf-8').write(s)
    print(slug, 'steps', len(steps), 'faq+', len(c['faq']))

for k, v in PAGES.items():
    run(k, v)
