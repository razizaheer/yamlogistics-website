#!/usr/bin/env python3
"""Home pages (English + 10 languages): the '3D' tool tile pointed at the CBM calculator; point it at the
load planner and add an AWB label generator tile after it. English home: internal .html links -> clean URLs.
Idempotent. Re-run after any i18n rebuild of the home pages."""
import os, re
R = '/home/claude/yamlogistics-website/'
AWB = {
    'en': ('AWB label generator', 'Barcoded IATA air cargo labels for every piece, as a print-ready PDF. Free, no sign-up.'),
    'ar': ('مولّد ملصقات بوليصة الشحن الجوي', 'ملصقات شحن جوي بباركود وفق IATA لكل طرد، بصيغة PDF جاهزة للطباعة. مجاناً وبدون تسجيل.'),
    'de': ('AWB-Etikettengenerator', 'Luftfracht-Etiketten mit IATA-Barcode für jedes Packstück als druckfertiges PDF. Kostenlos, ohne Anmeldung.'),
    'es': ('Generador de etiquetas AWB', 'Etiquetas de carga aérea IATA con código de barras para cada bulto, en PDF listo para imprimir. Gratis, sin registro.'),
    'fr': ("Générateur d'étiquettes AWB", 'Étiquettes de fret aérien IATA avec code-barres pour chaque colis, en PDF prêt à imprimer. Gratuit, sans inscription.'),
    'hi': ('AWB लेबल जनरेटर', 'हर पैकेज के लिए बारकोड वाले IATA एयर कार्गो लेबल, प्रिंट के लिए तैयार PDF में। मुफ़्त, बिना साइन-अप।'),
    'ja': ('AWBラベル作成ツール', '各貨物にIATA準拠のバーコード付き航空貨物ラベルを作成し、印刷用PDFで出力。無料・登録不要。'),
    'ko': ('AWB 라벨 생성기', '각 화물에 IATA 바코드 항공화물 라벨을 인쇄용 PDF로 만듭니다. 무료, 가입 불필요.'),
    'pt': ('Gerador de etiquetas AWB', 'Etiquetas de carga aérea IATA com código de barras para cada volume, em PDF pronto para imprimir. Grátis, sem cadastro.'),
    'ru': ('Генератор этикеток AWB', 'Этикетки авиагруза IATA со штрихкодом для каждого места, в PDF для печати. Бесплатно, без регистрации.'),
    'zh': ('AWB 标签生成器', '为每件货物生成带条码的 IATA 航空货运标签，可直接打印的 PDF。免费，无需注册。'),
}
TILE_RE = re.compile(r'(<a class="card" href=")([^"]*?)cbm-calculator(\.html)?("[^>]*>\s*<span[^>]*>3D</span>)')

def fix(lang):
    f = R + ('index.html' if lang == 'en' else lang + '/index.html')
    s = open(f, encoding='utf-8').read()
    pre = '' if lang == 'en' else lang + '/'
    ext = '' if lang == 'en' else '.html'
    s = TILE_RE.sub(lambda m: m.group(1) + pre + 'container-load-planner' + ext + m.group(4), s)
    m = re.search(r'<a class="card" href="[^"]*container-load-planner[^"]*"[^>]*>\s*<span[^>]*>3D</span>', s)
    assert m, f
    start = s.rfind('<a class="card"', 0, m.end())
    end = s.find('</a>', m.end()) + 4
    tile = s[start:end]
    if 'awb-label-generator' not in s[end:end + 1500]:
        t, d = AWB[lang]
        new = re.sub(r'href="[^"]*"', 'href="%sawb-label-generator%s"' % (pre, ext), tile, 1)
        new = re.sub(r'>3D</span>', '>AWB</span>', new, 1)
        new = re.sub(r'(<span style="font-weight: 600; font-size: 17px">)[^<]*(</span>)', lambda k: k.group(1) + t + k.group(2), new, 1)
        new = re.sub(r'(<span style="font-size: 14px; line-height: 1.5; color: #5E7891">)[^<]*(</span>)', lambda k: k.group(1) + d + k.group(2), new, 1)
        s = s[:end] + '\n' + new + s[end:]
    if lang == 'en':
        def clean(k):
            name = k.group(2)
            return k.group(1) + name + k.group(3) if os.path.exists(R + name + '.html') and not name.endswith('index') else k.group(0)
        s = re.sub(r'(href=")([a-z0-9][a-z0-9/_-]*)\.html([#"])', clean, s)
    open(f, 'w', encoding='utf-8').write(s)

for l in AWB:
    fix(l)
print('ok')
