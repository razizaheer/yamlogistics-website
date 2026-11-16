import io, re, json
R = '/home/claude/yamlogistics-website/'
rd = lambda f: io.open(R + f, encoding='utf-8').read(); wr = lambda f, s: io.open(R + f, 'w', encoding='utf-8', newline='').write(s)
top = json.load(open('/root/dbg/duty/top.json'))
# calculator page: a link band above its questions
f = 'customs-duty-calculator.html'; s = rd(f)
if 'href="import-duty/"' not in s:
    m = re.search(r'<h2[^>]*>[^<]*(questions|Questions|know)[^<]*</h2>', s)
    i = m.start(); k = s.rfind('<div style="background', 0, i)
    band = ('<div style="background:#FFFFFF"><div style="max-width:1400px;margin:0 auto;padding:40px 32px">'
            '<a href="import-duty/" style="display:block;max-width:900px;background:#F2F8FD;border:1px solid #E1EDF7;border-radius:16px;padding:18px 22px;text-decoration:none;color:#0B2A4A">'
            '<b style="font-family:\'Archivo\',sans-serif;font-size:19px;display:block;margin-bottom:4px">Import duty by product: %s pages</b>'
            '<span style="font-size:15.5px;line-height:1.5;color:#3D5873">The duty on the products India imports from the most countries, one page per HS code, with every HSN line and a worked example. →</span></a></div></div>\n') % '{:,}'.format(len(top))
    wr(f, s[:k] + band + s[k:]); print('calculator band added before:', m.group(0)[-60:])
# sitemap
f = 'sitemap.xml'; s = rd(f)
s = re.sub(r'<url><loc>https://www\.yamlogistics\.com/import-duty/[^<]*</loc><lastmod>[^<]*</lastmod></url>\n', '', s)
a = '<url><loc>https://www.yamlogistics.com/customs-duty-calculator</loc>'; assert a in s
new = '<url><loc>https://www.yamlogistics.com/import-duty/</loc><lastmod>2026-11-17</lastmod></url>\n' + ''.join('<url><loc>https://www.yamlogistics.com/import-duty/%s</loc><lastmod>2026-11-17</lastmod></url>\n' % c for c, _, _ in sorted(top))
wr(f, s.replace(a, new + a, 1)); print('sitemap urls', (s.replace(a, new + a, 1)).count('<loc>'))
f = 'llms.txt'; s = rd(f)
if 'import-duty/' not in s:
    i = s.index('customs-duty-calculator'); j = s.index('\n', i) + 1
    wr(f, s[:j] + '- [Import duty in India by HS code](https://www.yamlogistics.com/import-duty/): %s product pages with basic customs duty, IGST and total duty for every HSN line, a worked example and supplier countries.\n' % '{:,}'.format(len(top)) + s[j:])
f = 'sw.js'; s = rd(f); wr(f, re.sub(r"const VERSION = '[^']*'", "const VERSION = 'ck58duty-17nov'", s, count=1)); print('sw bumped')
