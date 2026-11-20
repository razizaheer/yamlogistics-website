# "Best free container loading calculators" round-up. Facts about other tools were read from
# their own public pages on READ (ContainerMath: its Capterra listing). Re-check every few months.
import sys
sys.path.insert(0, '/root/dbg/lp')
sys.path.insert(0, '/home/claude/yamlogistics-website/tools/loadpages')
from lib import *
from compare import CK_DOES, COMPARE

READ = '20 November 2026'
A = lambda href, t: '<a href="%s" rel="nofollow noopener" target="_blank" style="color:#0A6CC2">%s</a>' % (href, t)
SLUG = 'free-container-loading-calculators'

TOOLS = [
    # name, type, free use, paid from, sign-up, source link
    ('<b>CargoKit</b> (ours)', 'Web, plus Android app that works offline', 'Everything free, no limit on plans', 'None', 'Not needed', '<a href="container-load-planner" style="color:#0A6CC2">our planner</a>'),
    ('SeaRates Load Calculator', 'Web', '1 calculation a day; 20 a month (at most 3 a day) after registering', 'USD 29 a month for up to 50 calculations', 'Needed for more than 1 a day', A('https://www.searates.com/pricing/load-calculator', 'pricing page')),
    ('Pier2Pier 3D Load Calculator', 'Web', 'Typing cargo in by hand is free. Excel/CSV import, pallet loading and custom equipment are in a 6-week trial', 'Not shown', 'Not needed for manual entry', A('https://www.pier2pier.com/loadcalc/', 'load calculator page')),
    ('EasyCargo', 'Web', '10-day trial of the full version, no credit card', 'Licence by the day, month or year; page description says from USD 2.2 a day', 'A form to start the trial', A('https://www.easycargo3d.com/en/pricing/', 'pricing page')),
    ('Cargo-Planner', 'Not checked', 'Free trial on any plan, with Standard features; length not stated', 'Lite USD 59 a month, Standard USD 99 a month', 'Sign-up page', A('https://www.cargo-planner.com/pricing', 'pricing page')),
    ('Goodloading', 'Web, no installation', '"Demo version always free"; limits not stated', 'Not shown on the home page', 'Free registration offered', A('https://www.goodloading.com/en', 'home page')),
    ('CargoWiz', 'Desktop, installed on a PC', '30-day full-featured trial', 'Not listed; licensed per user', 'Not stated', A('https://softtruck.com/', 'home page')),
    ('ContainerMath', 'Web', 'Free trial with 3 calculations, no credit card', 'Starter USD 19.90 a month', 'Account', A('https://www.capterra.com/p/10048852/ContainerMath/', 'Capterra listing')),
]

table_html = table(['Tool', 'Runs on', 'What is free', 'Paid from', 'Sign-up', 'Source'],
                   [[t[0], t[1], t[2], t[3], t[4], t[5]] for t in TOOLS],
                   left=True, note='What each tool\'s own public page said when we read it on %s (ContainerMath: its Capterra listing). "Not shown" or "not stated" means we did not find it on that page, not that it does not exist. Prices change; check before you buy.' % READ)

PICKS = [
    ('Free with no limit, Excel import and pallets', 'CargoKit. It is the only tool in this list where the time-saving features (Excel import, pallet building, PDF report, loading video) are free with no trial and no sign-up. We make it, so check it against the others yourself.'),
    ('A quick one-off check, by hand', 'Pier2Pier lets you type cargo in by hand free without registering. SeaRates gives one free calculation a day without registering.'),
    ('Freight rates and the load plan in one place', 'SeaRates, which sells freight rate search next to its load calculator and also offers integration into your own website or system.'),
    ('Load planning as a full-time job, with support', 'EasyCargo, Cargo-Planner or CargoWiz. Paid tools add things like multi-drop priority groups, axle loads, custom equipment libraries and vendor support. Try them in their free trials on your real loads.'),
    ('No internet at the factory or warehouse', 'CargoKit for Android works without a signal. CargoWiz is desktop software installed on a PC.'),
]
table_html = table_html.replace('white-space:nowrap;', '').replace('min-width:740px', 'min-width:980px')
picks_html = ''.join('<div style="background:#FFFFFF;border:1px solid #E1EDF7;border-radius:16px;padding:16px 18px;margin-bottom:10px;max-width:980px"><b style="font-family:\'Archivo\',sans-serif;font-size:17px;display:block;margin-bottom:4px;color:#0B2A4A">%s</b><span style="font-size:15.5px;line-height:1.6;color:#3D5873">%s</span></div>' % (e(a), b) for a, b in PICKS)

CHOOSE = ul([
    '<b>Count the free calculations.</b> Some tools give one a day or three a month. If you plan several shipments a week, that runs out fast.',
    '<b>Check what sits behind the trial.</b> Excel import and pallet loading are the features that save time, and several tools keep them for trial or paid users.',
    '<b>Match the equipment you actually use.</b> 20 ft, 40 ft and 40 ft high cube containers, reefers, Indian or European trucks, air pallets. A tool built only for containers will not help with a 32 ft truck.',
    '<b>Look at the output your crew gets.</b> A 3D picture is nice; step-by-step loading instructions, a PDF and a video are what the people at the dock can follow.',
    '<b>Check weights, not just space.</b> A plan that fits the volume but overloads the container or puts all the weight at one end is no use.',
])

body = section(
    h2('SIDE BY SIDE', '8 container loading calculators compared') +
    p('We build the CargoKit load planner, so we have an interest here. To keep it fair, every fact about the other tools below comes from their own public pages, linked in the last column, read on %s. Where a page did not say, we say so instead of guessing.' % READ) +
    table_html +
    btn('container-load-planner', 'Open the free load planner') + btn(preset('dry', [('Cartons 60 × 40 × 40', 60, 40, 40, 250, 12)]), 'See an example loaded in 3D', True)
) + section(
    h2('WHICH ONE', 'Which calculator suits which job') + picks_html +
    h2('HOW TO CHOOSE', 'Five things to check before you pick a load calculator') + CHOOSE +
    h2('WHAT YOU GET', 'What the free CargoKit load planner does') + CK_DOES +
    h3('One-to-one comparisons') + cards([c for c in COMPARE if c[0] != SLUG]) +
    h3('Load calculators by equipment') + related(''), '#FFFFFF')

FAQ = [
    ('What is the best free container loading calculator?', 'It depends on how often you plan loads and which features you need free. Among the eight tools we compared, CargoKit is the one that gives Excel import, pallet building, a PDF report and a loading video free with no trial, limit or sign-up. Pier2Pier is free for typing cargo in by hand, and SeaRates gives one free calculation a day. We make CargoKit, so try it next to the others on your own packing list.'),
    ('Is there a completely free 3D container loading calculator?', 'Yes. The CargoKit 3D load planner is free with no time limit, no calculation limit and no registration. It is paid for by YAM Logistics, a customs broker and freight forwarder in New Delhi, as a tool for the trade.'),
    ('Which container load calculators work offline?', 'Of the tools we compared, the CargoKit Android app works without a signal, and CargoWiz is desktop software installed on a PC. The others run in a web browser.'),
    ('Can a free load calculator import my packing list from Excel?', 'CargoKit imports Excel and CSV free and has a template to download. On Pier2Pier, Excel and CSV import is part of a six-week trial, according to its load calculator page on %s.' % READ),
    ('How accurate are online container load calculators?', 'They are as accurate as the dimensions and weights you enter and the inside sizes of the container. Real containers vary a little by builder, and cartons bulge, so leave some room and check the payload and weight balance as well as the space.'),
    ('Do I need to pay for load planning software?', 'Not for most exporters and forwarders who plan a few containers a week. A paid tool can be worth it if load planning is someone\'s full-time job and you need features such as multi-drop priority groups, axle loads, custom equipment libraries or vendor support.'),
]

n = page(SLUG,
         'Best Free Container Loading Calculators (2026): 8 Tools Compared | YAM Logistics',
         'Free container loading calculators compared: CargoKit, SeaRates, Pier2Pier, EasyCargo, Cargo-Planner, Goodloading, CargoWiz and ContainerMath. What is free, trial limits and prices.',
         'Free container loading calculators', 'COMPARISON · CONTAINER LOADING CALCULATOR · 2026',
         'Free container loading calculators, compared.', '8 tools, facts from their own pages.',
         'Which container loading calculator is actually free? We compared eight 3D load planning tools on free use, trial limits, prices and sign-up, using what each tool\'s own page says.',
         body, FAQ, cta='Try the free 3D load calculator on your own packing list.')
print(SLUG, n)
