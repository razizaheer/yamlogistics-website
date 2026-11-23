#!/usr/bin/env python3
"""Ranking round 3 (weekly push 23 Nov 2026). Idempotent: marker blocks <!--seo-r3--> / <!--seo-r3f-->.
- track-shipment (English and Japanese): airline AWB prefix table and shipping line owner-code table, both linked to the
  per-carrier tracking pages; how an AWB number works (prefix, serial, mod-7 check digit); HAWB vs MAWB; extra FAQs; HowTo.
  The Japanese page gets its own Japanese text (Search Console: "awb 追跡", "awb追跡", "hawb 追跡" at about position 10)
  and a title/H1 that lead with AWB追跡. The Japanese block is marked data-notr so the runtime translator leaves it alone.
- mexico-import-tariff-2026: how the import taxes add up (IGI, DTA, IVA 16% on value + IGI + DTA), worked example, FAQs."""
import json, re, os
R = '/home/claude/yamlogistics-website/'
SITE = 'https://www.yamlogistics.com/'
E = lambda s: s.replace('&', '&amp;')

H2 = "font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 110%; font-size: clamp(30px, 3.4vw, 46px); line-height: 1.05; letter-spacing: -0.03em; margin: 0 0 22px"
H3 = "font-family: 'Archivo', sans-serif; font-weight: 800; font-size: 22px; margin: 26px 0 10px"
P = 'font-size: 16.5px; line-height: 1.7; color: #3D5873; margin: 0 0 14px; max-width: 860px'
UL = 'font-size: 16px; line-height: 1.7; color: #3D5873; padding-left: 22px; margin: 0 0 16px; max-width: 900px'
A = 'color: #0A6CC2'
TH = 'text-align: left; padding: 10px 12px; background: #0B2A4A; color: #FFFFFF; font-size: 14px'
TD = 'padding: 9px 12px; border-bottom: 1px solid #E3ECF5; font-size: 15px; color: #0B2A4A; vertical-align: top'
DET = ('<details style="background: #FFFFFF; border-radius: 16px; padding: 20px 24px; margin-bottom: 10px">'
       '<summary style="font-weight: 600; font-size: 18px; display: flex; justify-content: space-between; gap: 20px">%s<span style="color: #0A6CC2">+</span></summary>'
       '<p style="font-size: 16px; line-height: 1.65; color: #3D5873; margin: 12px 0 0">%s</p></details>')

def section(kicker, title, inner, sid='', notr=False):
    return ('<!--seo-r3--><div style="background: #FFFFFF"%s><div style="max-width: 1100px; margin: 0 auto; padding: 72px 32px">'
            '<div style="font-family: \'Geist Mono\', monospace; font-size: 12px; letter-spacing: 0.12em; color: #0A6CC2; margin-bottom: 12px">%s</div>'
            '<h2%s style="%s">%s</h2>%s</div></div><!--/seo-r3-->\n') % (' data-notr' if notr else '', kicker, (' id="%s"' % sid) if sid else '', H2, title, inner)
def ul(items): return '<ul style="%s">%s</ul>' % (UL, ''.join('<li style="margin-bottom: 8px">%s</li>' % i for i in items))
def ol(items): return '<ol style="%s">%s</ol>' % (UL, ''.join('<li style="margin-bottom: 8px">%s</li>' % i for i in items))
def p(t): return '<p style="%s">%s</p>' % (P, t)
def h3(t): return '<h3 style="%s">%s</h3>' % (H3, t)
def table(head, rows, minw=520):
    return ('<div style="overflow-x: auto; max-width: 980px; margin: 0 0 18px"><table style="border-collapse: collapse; width: 100%%; min-width: %dpx">'
            '<thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>') % (minw,
        ''.join('<th style="%s">%s</th>' % (TH, h) for h in head),
        ''.join('<tr>%s</tr>' % ''.join('<td style="%s">%s</td>' % (TD, c) for c in r) for r in rows))
def link(href, text): return '<a href="%s" style="%s">%s</a>' % (href, A, text)

# ---------------------------------------------------------------- carrier data from the site's own files
AL = {a[0]: a[1] for a in json.load(open(R + 'awb-data.json', encoding='utf-8'))['al']}
PREF = ['176', '157', '607', '141', '098', '312', '775', '020', '235', '618', '160', '180', '125', '057', '074', '065', '071',
        '172', '023', '406', '001', '006', '016', '999', '784', '112', '297', '695', '131', '205', '933', '217', '232', '045', '081', '978']
def awb_page(pre):
    f = [x for x in os.listdir(R + 'tracking') if x.endswith('-%s-awb-tracking.html' % pre)]
    assert f, pre
    return 'tracking/' + f[0][:-5]
src = open(R + 'track.js', encoding='utf-8').read()
SEA = {}
for m in re.finditer(r'\["([^"]+)", "[^"]*", \[([^\]]*)\], \[([^\]]*)\]', src):
    SEA[m.group(1)] = (re.findall(r'"([A-Z]{4})"', m.group(2)), re.findall(r'"([A-Z]{4})"', m.group(3)))
LINES = [('Maersk', 'maersk'), ('MSC', 'msc'), ('CMA CGM', 'cma-cgm'), ('Hapag-Lloyd', 'hapag-lloyd'), ('ONE (Ocean Network Express)', 'one-ocean-network-express'),
         ('COSCO Shipping', 'cosco'), ('OOCL', 'oocl'), ('Evergreen', 'evergreen'), ('Yang Ming', 'yang-ming'), ('HMM', 'hmm'), ('ZIM', 'zim'),
         ('Wan Hai Lines', 'wan-hai'), ('PIL (Pacific International Lines)', 'pil'), ('KMTC', 'kmtc'), ('APL', 'apl')]
for _, sl in LINES: assert os.path.exists(R + 'tracking/%s-container-tracking.html' % sl), sl

def awb_rows():
    return [['<b>%s</b>' % pre, link(awb_page(pre), E(AL[pre])), '%s-1234 5675' % pre] for pre in PREF]
def awb_table(head):
    rows = awb_rows(); half = (len(rows) + 1) // 2
    return table(head + head[:2], [l[:2] + (r[:2] if r else ['', '']) for l, r in zip(rows[:half], rows[half:] + [None])], 600)
def line_rows():
    out = []
    for name, sl in LINES:
        own, bl = SEA[name]
        out.append([link('tracking/%s-container-tracking' % sl, E(name)), ', '.join(own[:5]) + (' …' if len(own) > 5 else ''), ', '.join(bl) or '–'])
    return out

# check digit worked example (same number the AWB label generator uses as its placeholder)
EX_P, EX_S = '176', '12345675'
EX_Q, EX_R = divmod(int(EX_S[:7]), 7)
assert EX_R == int(EX_S[7])

EN_SECTION = section('CARRIER CODES', 'Which airline or shipping line is my number from?',
    p('The tracker reads the carrier from the number itself. An air waybill starts with the airline’s three-digit prefix; a container number starts with the owner’s four-letter code. The tables below list the most common ones, each linked to its own tracking page.') +
    h3('AWB prefix list: airline cargo tracking by prefix') +
    awb_table(['Prefix', 'Airline']) +
    p('All %d airline prefixes we recognise are in the %s. If your AWB starts with a number not shown here, paste it into the box at the top of this page.' % (len(AL), link('tracking/index', 'tracking directory'))) +
    h3('Container owner codes and B/L prefixes of the main shipping lines') +
    table(['Shipping line', 'Container owner codes (first 4 letters)', 'B/L number prefix'], line_rows(), 560) +
    p('Leased containers (for example TGHU, TCNU, SEGU, CAIU, FCIU) belong to leasing companies, not to the line carrying them. Track those with the B/L number or pick the carrying line in the tracker.') +
    h3('How an air waybill number works') +
    p('An AWB number has 11 digits: the 3-digit airline prefix, then an 8-digit serial number. The last digit of the serial is a check digit: the first seven digits divided by 7 leave it as the remainder.') +
    p('Example: %s-%s. %s ÷ 7 = %d, remainder <b>%d</b>, which matches the last digit, so the number is well formed. A mismatch nearly always means a typing mistake. To print barcoded labels for an AWB, or to generate a series of valid AWB numbers, use the %s.' % (
        EX_P, EX_S, EX_S[:7], EX_Q, EX_R, link('awb-label-generator', 'AWB label generator'))) +
    h3('HAWB vs MAWB: which number to track') +
    ul(['<b>MAWB</b> (master air waybill) is issued by the airline to the forwarder or consolidator. It has the airline prefix and is the number the airline’s tracking understands.',
        '<b>HAWB</b> (house air waybill) is issued by the forwarder to the shipper. Its format is the forwarder’s own, so airline tracking cannot read it. Ask the forwarder for the MAWB number, or use the forwarder’s own tracking.',
        'For sea cargo the same split exists: the master B/L comes from the shipping line, the house B/L from the forwarder or NVOCC. The container number works on the line’s tracking either way.']) +
    p('Status codes such as RCS, DEP, RCF and NFD are explained in %s.' % link('air-cargo-status-codes', 'air cargo status codes')), 'carrier-codes')
EN_FAQ = [('How do I find the airline from an AWB number?', 'Look at the first three digits. They are the airline prefix: 176 is Emirates, 157 Qatar Airways, 098 Air India, 020 Lufthansa Cargo, 618 Singapore Airlines. Paste the full number into the tracker and it picks the airline for you.'),
          ('Can I track a HAWB number?', 'Usually not on the airline’s site, because a house air waybill is the forwarder’s own number. Track the master air waybill (MAWB), which starts with the airline prefix, or use the forwarder’s tracking.'),
          ('How do I know which shipping line a container belongs to?', 'The first four letters are the owner code: MSKU and MAEU are Maersk, MSCU and MEDU are MSC, CMAU is CMA CGM, HLXU is Hapag-Lloyd. Leasing company codes such as TGHU or SEGU do not show the line; use the B/L number for those.')]
EN_STEPS = [('Paste the number', 'Paste a container number, an air waybill (AWB) number or a bill of lading number into the box.'),
            ('Check the carrier', 'The tracker reads the carrier from the AWB prefix or container owner code. Pick the line yourself if the box is leased.'),
            ('Open live status', 'Open the carrier’s own tracking with the number filled in, and the Indian port, ICD and rail leg if the cargo is coming to India.')]

JA_SECTION = section('航空会社・船会社コード', 'AWB番号・コンテナ番号から運送会社を調べる',
    p('トラッカーは番号そのものから運送会社を判別します。AWB（航空運送状）番号は航空会社の3桁のプレフィックスで始まり、コンテナ番号は所有者を示す4文字のコードで始まります。主なコードを下の表にまとめました。各社の追跡ページにリンクしています（英語ページ）。') +
    h3('AWBプレフィックス一覧：航空会社別のAWB追跡') +
    awb_table(['プレフィックス', '航空会社']) +
    p('対応している%d社すべてのプレフィックスは%sで確認できます。表にない番号は、このページ上部の入力欄にそのまま貼り付けてください。' % (len(AL), link('tracking/index', '追跡ディレクトリ'))) +
    h3('主な船会社のコンテナ所有者コードとB/L番号の頭文字') +
    table(['船会社', 'コンテナ所有者コード（先頭4文字）', 'B/L番号の頭文字'], line_rows(), 560) +
    p('TGHU、TCNU、SEGU、CAIU、FCIUなどはリース会社のコンテナで、運んでいる船会社はコードから分かりません。B/L番号で追跡するか、トラッカーで船会社を選んでください。') +
    h3('AWB番号の仕組み') +
    p('AWB番号は11桁で、3桁の航空会社プレフィックスと8桁のシリアル番号からなります。シリアル番号の最後の1桁はチェックデジットで、最初の7桁を7で割った余りになります。') +
    p('例：%s-%s。%s ÷ 7 = %d、余り<b>%d</b>で最後の桁と一致するので、正しい形式の番号です。一致しない場合はほとんどが入力ミスです。AWBのバーコードラベル印刷や、正しいAWB番号の連番作成には%sをご利用ください。' % (
        EX_P, EX_S, EX_S[:7], EX_Q, EX_R, link('awb-label-generator', 'AWBラベル作成ツール'))) +
    h3('HAWB追跡とMAWB追跡の違い') +
    ul(['<b>MAWB</b>（マスターエアウェイビル）は航空会社がフォワーダー（混載業者）に発行するもので、航空会社のプレフィックスが付きます。航空会社の追跡で使えるのはこの番号です。',
        '<b>HAWB</b>（ハウスエアウェイビル）はフォワーダーが荷主に発行する番号で、形式はフォワーダーごとに異なり、航空会社の追跡では読めません。フォワーダーにMAWB番号を確認するか、フォワーダー自身の追跡サービスを使ってください。',
        '海上貨物も同じで、マスターB/Lは船会社、ハウスB/LはフォワーダーやNVOCCが発行します。コンテナ番号ならどちらの場合も船会社の追跡で調べられます。']) +
    p('RCS、DEP、RCF、NFDなどのステータスの意味は%sで説明しています（英語）。' % link('air-cargo-status-codes', '航空貨物ステータスコード')), 'carrier-codes', notr=True)
JA_FAQ = [('AWB番号から航空会社を調べるには？', '最初の3桁が航空会社のプレフィックスです。176はエミレーツ、157はカタール航空、131は日本航空、205は全日空、933は日本貨物航空、098はエア・インディアです。番号をすべてトラッカーに貼り付ければ、航空会社を自動で判別します。'),
          ('HAWB番号で追跡できますか？', '航空会社のサイトでは通常できません。HAWB（ハウスエアウェイビル）はフォワーダー独自の番号だからです。航空会社のプレフィックスで始まるMAWB番号で追跡するか、フォワーダーの追跡サービスを使ってください。'),
          ('コンテナがどの船会社のものか分かりますか？', '先頭4文字が所有者コードです。MSKUとMAEUはマースク、MSCUとMEDUはMSC、CMAUはCMA CGM、HLXUはハパックロイドです。TGHUやSEGUなどリース会社のコードでは船会社が分からないため、B/L番号で追跡してください。')]
JA_STEPS = [('番号を貼り付ける', 'コンテナ番号、AWB（航空運送状）番号、またはB/L番号を入力欄に貼り付けます。'),
            ('運送会社を確認する', 'AWBのプレフィックスやコンテナ所有者コードから運送会社を判別します。リースコンテナの場合は船会社を選びます。'),
            ('最新ステータスを開く', '番号が入力された状態で運送会社の追跡ページを開きます。インド向け貨物は港・ICD・鉄道区間も確認できます。')]
JA_TITLE = 'AWB追跡・コンテナ追跡（無料）：HAWB/MAWB対応、全航空会社・船会社 | YAM Logistics'
JA_DESC = 'AWB（航空運送状）番号を貼り付けるだけの無料AWB追跡。HAWBとMAWBの違い、航空会社プレフィックス一覧（176 エミレーツ、131 JAL、205 ANA、933 NCAなど）、55以上の船会社のコンテナ追跡にも対応。登録不要。'

# Mexico: worked example (illustrative rate; the page's checker gives the real rate per code)
CV, IGI_R = 10000, 35
IGI = CV * IGI_R / 100; DTA = CV * 8 / 1000; IVA = (CV + IGI + DTA) * 0.16
MX_SECTION = section('HOW THE DUTY ADDS UP', 'Mexico import duty calculation: IGI, DTA and IVA',
    p('The tariff rate this checker shows is the general import tax (IGI, impuesto general de importación). It is not the only charge at Mexican customs. For an ordinary definitive import the importer usually pays:') +
    ul(['<b>IGI</b>: the tariff rate for the 8-digit Mexican code (fracción arancelaria) multiplied by the customs value. The customs value is normally the transaction value plus freight and insurance up to the Mexican border or port.',
        '<b>DTA</b> (derecho de trámite aduanero): the customs processing fee, generally 8 per thousand (0.8%) of the customs value for definitive imports under the Federal Duties Law (Ley Federal de Derechos, art. 49). Fixed amounts apply in some cases, for example some goods under free trade agreements.',
        '<b>IVA</b> (value added tax): 16% on the customs value plus IGI plus the other import charges such as DTA (Ley del IVA, art. 27). Registered importers can usually credit import IVA against their sales IVA.',
        'Some goods also carry IEPS (special tax on items such as fuel, alcohol, tobacco and sugary drinks), countervailing or anti-dumping duties, or need an import permit or NOM certificate.']) +
    h3('Worked example') +
    table(['Item', 'How it is worked out', 'Amount (USD)'],
          [['Customs value', 'Goods + freight + insurance to Mexico', '{:,.2f}'.format(CV)],
           ['IGI at %d%%' % IGI_R, '{:,} × {}%'.format(CV, IGI_R), '{:,.2f}'.format(IGI)],
           ['DTA', '{:,} × 8 per thousand'.format(CV), '{:,.2f}'.format(DTA)],
           ['IVA at 16%', '({:,} + {:,.0f} + {:,.0f}) × 16%'.format(CV, IGI, DTA), '{:,.2f}'.format(IVA)],
           ['<b>Total taxes at the border</b>', 'IGI + DTA + IVA', '<b>{:,.2f}</b>'.format(IGI + DTA + IVA)]], 520) +
    p('The %d%% rate is only an example of a raised 2026 rate for goods from a country without a trade agreement with Mexico, such as India or China. Use the checker above for the rate on your code. Rates, the DTA and the IVA base here follow the laws as published; your Mexican customs broker (agente aduanal) confirms the final figures on the pedimento. For India’s own import duty, see the %s.' % (
        IGI_R, link('customs-duty-calculator', 'Indian import duty calculator'))), 'mexico-duty-calculation')
MX_FAQ = [('How is import duty calculated in Mexico?', 'The general import tax (IGI) is the tariff rate times the customs value. On top, the customs processing fee (DTA) is generally 0.8% of the customs value, and IVA of 16% is charged on the customs value plus IGI and DTA. Some goods also pay IEPS or trade remedy duties.'),
          ('Is IVA charged on the duty in Mexico?', 'Yes. Import IVA at 16% is worked out on the customs value plus the general import tax and the other import charges such as the DTA, not on the goods value alone.')]
MX_STEPS = [('Enter the product or code', 'Type the product name or the 8-digit Mexican tariff code (fracción arancelaria).'),
            ('See the 2026 rate', 'Check whether the code was in the January 2026 increase and the rate for countries without a trade agreement.'),
            ('Add DTA and IVA', 'Add the 0.8% customs processing fee and 16% IVA on value plus duty to estimate the total taxes at the border.')]

def put(f, before, sec, faq, steps, title=None, desc=None, h1=None):
    s = open(f, encoding='utf-8').read()
    s = re.sub(r'<!--seo-r3-->.*?<!--/seo-r3-->\n?', '', s, flags=re.S)
    s = re.sub(r'<!--seo-r3f-->.*?<!--/seo-r3f-->', '', s, flags=re.S)
    if title:
        T, D = E(title), E(desc)
        s = re.sub(r'<title>[^<]*</title>', '<title>%s</title>' % T, s, count=1)
        for pat, val in ((r'(<meta name="description" content=")[^"]*', D), (r'(<meta property="og:title" content=")[^"]*', T),
                         (r'(<meta property="og:description" content=")[^"]*', D), (r'(<meta name="twitter:title" content=")[^"]*', T),
                         (r'(<meta name="twitter:description" content=")[^"]*', D)):
            s = re.sub(pat, lambda m: m.group(1) + val, s, count=1)
    if h1:
        s, n = re.subn(h1[0], h1[1], s, count=1); assert n == 1 or h1[1] in s, f
    h = s.find(before); w = s.rfind('<div style="background', 0, h)
    assert h > 0 and w > 0, f
    s = s[:w] + sec + s[w:]
    h = s.find(before) + len(before)
    s = s[:h] + '\n<!--seo-r3f-->' + ''.join(DET % (q, a) for q, a in faq) + '<!--/seo-r3f-->' + s[h:]
    m = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', s, re.S)
    d = json.loads(m.group(2)); g = d['@graph']
    g[:] = [n for n in g if n.get('@type') != 'HowTo']
    canon = re.search(r'rel="canonical" href="([^"]+)"', s).group(1)
    name = None
    for n in g:
        if n.get('@type') == 'WebPage':
            if title: n['name'] = title.replace(' | YAM Logistics', ''); n['description'] = desc
            name = n['name']
        if n.get('@type') == 'FAQPage':
            have = {q['name'] for q in n['mainEntity']}
            for q, a in faq:
                if q not in have:
                    n['mainEntity'].append({'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': re.sub(r'<[^>]+>', '', a)}})
    g.append({'@type': 'HowTo', 'name': (name or 'How to use it').split(':')[0].split('：')[0], 'step': [
        {'@type': 'HowToStep', 'position': i + 1, 'name': a, 'text': b, 'url': canon} for i, (a, b) in enumerate(steps)]})
    s = s[:m.start(2)] + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + s[m.end(2):]
    open(f, 'w', encoding='utf-8').write(s)
    print(f, 'faq+', len(faq))

put(R + 'track-shipment.html', '>Tracking questions</h2>', EN_SECTION, EN_FAQ, EN_STEPS)
put(R + 'ja/track-shipment.html', '>追跡に関する質問</h2>', JA_SECTION, JA_FAQ, JA_STEPS, JA_TITLE, JA_DESC,
    (r'あらゆるコンテナや航空運送状を追跡。', 'AWB追跡・コンテナ追跡を無料で。'))
put(R + 'mexico-import-tariff-2026.html', '>Good to know.</h2>', MX_SECTION, MX_FAQ, MX_STEPS)
