import sys
sys.path.insert(0, '/root/dbg/lp')
from lib import *

READ = '16 November 2026'
A = lambda href, t: '<a href="%s" rel="nofollow noopener" target="_blank" style="color:#0A6CC2">%s</a>' % (href, t)
YES = '<b style="color:#0B7A43">Yes, free</b>'
def disclaimer(name, links):
    return note('<b>About this comparison.</b> The %s column is what their own public pages said when we read them on %s (%s). Prices and features change, so check their site before you decide. %s is a trademark of its owner; CargoKit and YAM Logistics are not affiliated with it. If anything here is out of date, <a href="contact" style="color:#5B4708">tell us</a> and we will correct it.' % (e(name), READ, ', '.join(links), e(name)))
CK_DOES = ul(['Works out the best mix of 20 ft, 40 ft and 40 ft high cube containers, reefers, air pallets and trucks for your packing list.',
              'Reads your packing list from Excel or CSV, or you type or paste the rows.',
              'Builds pallets first if you want, with a height and weight limit, then loads the pallets.',
              'Shows the load in 3D with top, side and door views, weight balance and centre of gravity.',
              'Writes step-by-step loading instructions for the stuffing crew.',
              'Gives a PDF report and an MP4 loading video you can send on WhatsApp.',
              'Free on the web and in the CargoKit Android app, in 11 languages, with no sign-up.'])
COMPARE = [('pier2pier-alternative', 'CargoKit and Pier2Pier', 'What each gives you free and what sits behind a trial.'),
           ('searates-load-calculator-alternative', 'CargoKit and SeaRates Load Calculator', 'Daily limits, monthly plans and what is free.'),
           ('easycargo-alternative', 'CargoKit and EasyCargo', 'A 10-day trial against a tool that stays free.'),
           ('free-container-loading-calculators', '8 free container loading calculators compared', 'CargoKit, SeaRates, Pier2Pier, EasyCargo, Cargo-Planner and more.')]
def others(skip): return cards([c for c in COMPARE if c[0] != skip] + [('container-load-planner', 'Open the free 3D load planner', 'Enter your packing list and see it loaded.')])
HEAD = lambda name: ['', name, 'CargoKit load planner']
made = []
def mk(slug, *a, **k): made.append((slug, a[0], page(slug, *a, **k)))

# ---------------------------------------------------------------- Pier2Pier
P2 = [A('https://www.pier2pier.com/loadcalc/', 'load calculator page'), A('https://www.pier2pier.com/blog/3d-load-calculator-guide/', 'guide')]
body = section(
    h2('SIDE BY SIDE', 'CargoKit and Pier2Pier at a glance') +
    p('Pier2Pier is a logistics reference site with a capable 3D load calculator. Typing in your cargo by hand is free there. The time-saving features sit inside a six-week trial. In CargoKit those same features are free and stay free.') +
    table(HEAD('Pier2Pier'), [
        ['Typing cargo in by hand', 'Free, no registration', YES],
        ['Excel and CSV import', 'In the 6-week free trial', YES],
        ['Pallet loading', 'In the 6-week free trial', YES],
        ['Your own equipment sizes', 'In the 6-week free trial', 'Not yet. 26 standard containers, trucks, pallets and air ULDs'],
        ['Price after the trial', 'Not shown on the pages we read', 'Free'],
        ['Sign-up', 'Not needed for manual entry', 'Not needed'],
        ['PDF report and share link', 'Yes', YES],
        ['MP4 loading video', 'Not mentioned on the pages we read', YES],
        ['Works offline in a phone app', 'Not mentioned on the pages we read', 'Yes, CargoKit for Android'],
        ['Interface languages', '13', '11'],
    ], left=True) + disclaimer('Pier2Pier', P2) +
    btn('container-load-planner', 'Open the free load planner') + btn(preset('dry', [('Cartons 60 × 40 × 40', 60, 40, 40, 250, 12)]), 'See an example loaded in 3D', True)
) + section(
    h2('BE FAIR', 'When Pier2Pier is the better choice') +
    ul(['<b>You need your own equipment sizes.</b> Pier2Pier lets you define custom containers and trucks. CargoKit works from a fixed list of 26 standard units.',
        '<b>You want route search, demurrage and CO2 tools in the same place.</b> Pier2Pier has a transport route finder, a demurrage calculator and a CO2 and distance estimator.',
        '<b>Your team already works in it.</b> If your colleagues share Pier2Pier plans every day, switching has a cost.']) +
    h2('WHAT YOU GET', 'What the CargoKit load planner does') + CK_DOES +
    h3('Other comparisons') + others('pier2pier-alternative') +
    h3('Load calculators by equipment') + related(''), '#FFFFFF')
mk('pier2pier-alternative',
   'Free Pier2Pier Alternative: 3D Load Calculator, No Trial | YAM Logistics',
   'Looking for a free alternative to the Pier2Pier 3D load calculator? CargoKit gives Excel import, pallet building, a PDF report and a loading video free, with no trial and no sign-up.',
   'Pier2Pier alternative', 'COMPARISON · 3D LOAD CALCULATOR · FREE',
   'A free alternative to the Pier2Pier load calculator.', 'No trial, no sign-up.',
   'A plain comparison of the CargoKit 3D load planner and the Pier2Pier 3D load calculator: what each gives you free, what sits behind a trial, and where Pier2Pier is the better choice.',
   body,
   [('Is the Pier2Pier load calculator free?', 'Typing cargo in by hand is free and needs no registration. Excel and CSV import, customised equipment, pallet loading and extra packing options are part of a six-week free trial, according to their load calculator page on %s. We did not find a published price for what follows the trial.' % READ),
    ('Is CargoKit really free?', 'Yes. The load planner, Excel import, pallet building, PDF report and loading video are free, with no sign-up and no limit on the number of plans. It is paid for by YAM Logistics, a customs broker and freight forwarder, as a tool for the trade.'),
    ('Can I import my packing list from Excel?', 'Yes. CargoKit reads Excel and CSV files and has a template you can download. You can also paste rows.'),
    ('What does Pier2Pier do that CargoKit does not?', 'Custom equipment sizes, a transport route finder, a demurrage calculator and a CO2 and distance estimator. CargoKit has its own set of other free tools: duty calculators, an HS code finder, document generators, dangerous goods checkers and shipment tracking.'),
    ('Do I need to install anything?', 'No. CargoKit runs in the browser. There is also a free Android app that works without a signal.')])

# ---------------------------------------------------------------- SeaRates
SR = [A('https://www.searates.com/pricing/load-calculator', 'pricing page')]
body = section(
    h2('SIDE BY SIDE', 'CargoKit and SeaRates Load Calculator at a glance') +
    p('SeaRates offers a well-known load calculator alongside its freight rate tools. Free use is limited by the number of calculations, and regular users move to a monthly plan. CargoKit has no limit and no plan.') +
    table(HEAD('SeaRates Load Calculator'), [
        ['Free use without registering', '1 calculation a day', 'No limit'],
        ['Free use after registering', '20 calculations a month, at most 3 a day', 'No limit, no registration'],
        ['Paid plans', 'PackLite USD 29 a month (up to 50 calculations)<br>CargoFit USD 69 a month (up to 150)<br>LoadPro USD 149 a month (up to 350)', 'None. Free'],
        ['Excel and CSV import', 'Not stated on the pricing page', YES],
        ['Pallet building', 'Not stated on the pricing page', YES],
        ['PDF report and loading video', 'Not stated on the pricing page', YES],
        ['Works offline in a phone app', 'Not stated on the pricing page', 'Yes, CargoKit for Android'],
    ], left=True) + disclaimer('SeaRates', SR) +
    btn('container-load-planner', 'Open the free load planner') + btn(preset('dry', [('Cartons 60 × 40 × 40', 60, 40, 40, 250, 12)]), 'See an example loaded in 3D', True)
) + section(
    h2('BE FAIR', 'When SeaRates is the better choice') +
    ul(['<b>You want freight rates in the same place.</b> SeaRates is known first for freight rates; the load calculator sits next to its rate search.',
        '<b>You want the calculator inside your own website or system.</b> SeaRates sells integration of its load calculator into websites, CRM, TMS and ERP systems.',
        '<b>You plan road loads by axle.</b> SeaRates offers an axle weight calculator. CargoKit shows weight balance and centre of gravity but does not calculate axle loads.']) +
    h2('WHAT YOU GET', 'What the CargoKit load planner does') + CK_DOES +
    h3('Other comparisons') + others('searates-load-calculator-alternative') +
    h3('Load calculators by equipment') + related(''), '#FFFFFF')
mk('searates-load-calculator-alternative',
   'Free SeaRates Load Calculator Alternative, No Daily Limit | YAM Logistics',
   'A free alternative to the SeaRates load calculator. No daily limit, no monthly plan and no registration: 3D loading plan, Excel import, pallets, PDF report and loading video.',
   'SeaRates load calculator alternative', 'COMPARISON · CONTAINER LOAD CALCULATOR · FREE',
   'A free alternative to the SeaRates load calculator.', 'No daily limit, no plan.',
   'A plain comparison of the CargoKit 3D load planner and the SeaRates Load Calculator: how many calculations are free, what the monthly plans cost, and where SeaRates is the better choice.',
   body,
   [('Is the SeaRates load calculator free?', 'Partly. According to its pricing page on %s, unregistered users get 1 calculation a day and registered users 20 a month with at most 3 a day. Paid plans start at USD 29 a month for up to 50 calculations.' % READ),
    ('How many calculations can I run in CargoKit?', 'As many as you like. The planner runs in your own browser, so there is no counter, no daily limit and no registration.'),
    ('Is CargoKit really free?', 'Yes. It is paid for by YAM Logistics, a customs broker and freight forwarder, as a tool for the trade.'),
    ('What does SeaRates do that CargoKit does not?', 'Freight rate search, integration of the calculator into your own website or system, and an axle weight calculator.'),
    ('Can CargoKit load trucks and air pallets as well as containers?', 'Yes. It covers dry and reefer containers, Indian, European and US trucks, pallets, and air ULDs such as PMC, PAG and AKE.')])

# ---------------------------------------------------------------- EasyCargo
EC = [A('https://www.easycargo3d.com/en/pricing/', 'pricing page')]
body = section(
    h2('SIDE BY SIDE', 'CargoKit and EasyCargo at a glance') +
    p('EasyCargo is well-known load planning software sold by licence. You can try the full version for ten days. CargoKit is a free tool with no trial clock, built by a freight forwarder for the trade.') +
    table(HEAD('EasyCargo'), [
        ['Free use', '10-day trial of the full version, no credit card', 'Free with no time limit'],
        ['After the trial', 'A paid licence: one-day tickets, monthly or yearly', 'Still free'],
        ['Permanently free version', 'None mentioned on the pricing page', 'Yes'],
        ['Sign-up', 'A form to start the trial', 'Not needed'],
        ['Excel import', 'Yes', YES],
        ['Pallet building', 'Not checked', YES],
        ['PDF report and loading video', 'Step-by-step reports: yes. Video: not checked', YES],
        ['Works offline in a phone app', 'Not checked', 'Yes, CargoKit for Android'],
    ], left=True) + disclaimer('EasyCargo', EC) +
    btn('container-load-planner', 'Open the free load planner') + btn(preset('dry', [('Cartons 60 × 40 × 40', 60, 40, 40, 250, 12)]), 'See an example loaded in 3D', True)
) + section(
    h2('BE FAIR', 'When EasyCargo is the better choice') +
    ul(['<b>You load multi-drop trucks.</b> EasyCargo has priority groups that keep each delivery together in unloading order. CargoKit lets you mark items as first in or last in, which covers simpler cases.',
        '<b>You need axle loads.</b> EasyCargo calculates the load on individual axles. CargoKit shows weight balance and centre of gravity but not axle loads.',
        '<b>You plan loads all day, every day.</b> A licensed tool with support may be worth paying for when load planning is someone’s full-time job.']) +
    h2('WHAT YOU GET', 'What the CargoKit load planner does') + CK_DOES +
    h3('Other comparisons') + others('easycargo-alternative') +
    h3('Load calculators by equipment') + related(''), '#FFFFFF')
mk('easycargo-alternative',
   'Free EasyCargo Alternative: 3D Load Planner, No Licence | YAM Logistics',
   'A free alternative to EasyCargo load planning software. No 10-day trial and no licence: 3D loading plan, Excel import, pallet building, PDF report and loading video.',
   'EasyCargo alternative', 'COMPARISON · LOAD PLANNING SOFTWARE · FREE',
   'A free alternative to EasyCargo.', 'No trial clock, no licence.',
   'A plain comparison of the CargoKit 3D load planner and EasyCargo load planning software: what is free, what needs a licence, and where EasyCargo is the better choice.',
   body,
   [('Is EasyCargo free?', 'EasyCargo offers a 10-day free trial of the full version with no credit card, according to its pricing page on %s. After that it is sold by licence: one-day tickets, monthly or yearly. Its pricing page does not mention a permanently free version.' % READ),
    ('Is CargoKit really free?', 'Yes. There is no trial, no licence and no sign-up. It is paid for by YAM Logistics, a customs broker and freight forwarder, as a tool for the trade.'),
    ('What does EasyCargo do that CargoKit does not?', 'Priority groups for multi-drop loads and the load on individual axles. If you need those every day, EasyCargo is worth a look.'),
    ('Can I import a packing list from Excel into CargoKit?', 'Yes. CargoKit reads Excel and CSV files and has a template to download.'),
    ('Does CargoKit work on a phone?', 'Yes, in the browser and in the free CargoKit Android app, which also works without a signal.')])

if __name__ == '__main__':
    for s, t, ln in made: print(ln, len(t), s)
