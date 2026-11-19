# Inject a Russian link band to the India-Russia pages into key ru pages (idempotent; re-run after an i18n rebuild)
import io, re
R = '/home/claude/yamlogistics-website/'
ITEMS = [('ru/dostavka-gruzov-iz-indii-v-rossiyu', 'Доставка из Индии в Россию', 'Море, авиа, контейнеры, сроки'),
         ('ru/dostavka-iz-indii-novorossiysk', 'Индия — Новороссийск', 'Из Мундры и Нхава-Шевы'),
         ('ru/dostavka-iz-indii-sankt-peterburg', 'Индия — Санкт-Петербург', 'Северо-запад России и Москва'),
         ('ru/dostavka-iz-indii-vladivostok', 'Индия — Владивосток', 'Коридор Ченнаи — Владивосток'),
         ('ru/tamozhennoe-oformlenie-eksporta-v-indii', 'Экспорт из Индии: таможня', 'Оформление отправки в Индии')]
BAND = ('<!--ru-band--><div style="background:#FFFFFF"><div style="max-width:1400px;margin:0 auto;padding:40px 32px"><div style="font-family:\'Geist Mono\',monospace;font-size:12px;letter-spacing:0.12em;color:#0A6CC2;margin-bottom:14px">ИНДИЯ → РОССИЯ</div>'
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">' +
        ''.join('<a href="%s" style="display:block;background:#F2F8FD;border-radius:18px;padding:16px 18px;text-decoration:none;color:#0B2A4A"><b style="font-family:\'Archivo\',sans-serif;font-size:16px;display:block">%s</b><span style="font-size:14px;color:#3D5873">%s</span></a>' % i for i in ITEMS) +
        '</div></div></div><!--/ru-band-->')
for f in ['index', 'ocean-freight', 'air-freight', 'customs-brokerage', 'third-country-trade']:
    p = R + 'ru/%s.html' % f; s = io.open(p, encoding='utf-8').read()
    s = re.sub(r'<!--ru-band-->.*?<!--/ru-band-->', '', s, flags=re.S)
    i = s.rindex('</div>\n</main>') if '</div>\n</main>' in s else s.rindex('</main>')
    s = s[:i] + BAND + s[i:]
    io.open(p, 'w', encoding='utf-8', newline='').write(s); print(f)
