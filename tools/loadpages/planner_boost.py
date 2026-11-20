#!/usr/bin/env python3
"""Load planner page: share image, loading video with VideoObject, HowTo schema from the existing
'How it works' steps, link to the free calculators round-up, 'container loading calculator' wording.
Idempotent (marker blocks / checks)."""
import json, re
F = '/home/claude/yamlogistics-website/container-load-planner.html'
s = open(F, encoding='utf-8').read()
SITE = 'https://www.yamlogistics.com/'
IMG = SITE + 'load-planner-preview.jpg'

if 'og:image' not in s:
    s = s.replace('<meta property="og:url"', '<meta property="og:image" content="%s"><meta name="twitter:image" content="%s"><meta property="og:url"' % (IMG, IMG), 1)

# wording
s = s.replace('>Load calculators for every container, truck and pallet</h2>', '>Container loading calculators for every container, truck and pallet</h2>', 1)

# video after the How it works grid
VID = '''<!--lp-video--><div style="max-width:900px;margin:36px auto 0"><video autoplay muted loop playsinline preload="metadata" poster="load-planner-loop-poster.jpg" width="900" height="629" style="width:100%;height:auto;display:block;border-radius:20px" aria-label="A 40 foot container being filled with coloured cartons row by row in the 3D container loading calculator"><source src="load-planner-loop.mp4" type="video/mp4"></video><p style="font-size:14px;line-height:1.5;color:#4A4030;margin:10px 4px 0">The loading animation the planner makes for every plan: cartons placed row by row from the front wall to the doors. You can download it as an MP4 for the loading crew.</p></div><!--/lp-video-->'''
s = re.sub(r'<!--lp-video-->.*?<!--/lp-video-->', '', s, flags=re.S)
i = s.find('Load step by step</span>')
i = s.find('</div>\n\n</div>', i) + len('</div>\n\n</div>')
s = s[:i] + VID + s[i:]

# round-up card next to the comparisons
CARD = '<a href="free-container-loading-calculators" style="display:block;background:#FFFFFF;border:1px solid #E1EDF7;border-radius:16px;padding:16px 18px;text-decoration:none;color:#0B2A4A"><b style="font-family:\'Archivo\',sans-serif;font-size:17px;display:block;margin-bottom:4px">8 free container loading calculators compared</b><span style="font-size:14.5px;line-height:1.5;color:#3D5873">CargoKit, SeaRates, Pier2Pier, EasyCargo, Cargo-Planner and more.</span></a>'
if 'href="free-container-loading-calculators"' not in s:
    j = s.find('A 10-day trial against a tool that stays free.</span></a>') + len('A 10-day trial against a tool that stays free.</span></a>')
    s = s[:j] + CARD + s[j:]

STEPS = [('Pick how you ship', 'Choose dry containers, reefer containers, trucks or air pallets (ULDs), and whether your packages are loose or on pallets.'),
         ('Add your packages', 'Type them in, paste your packing list from Excel, or upload the .xlsx or CSV file. Set which way each package may turn and whether it can be stacked on.'),
         ('Get the best mix', 'The calculator tests 20 ft, 40 ft and 40 ft high cube containers (or reefers, trucks or air pallets) and recommends the cheapest combination, with the fill and weight of each unit and a 3D view.'),
         ('Load step by step', 'Step through the loading row by row from the front wall to the doors, then download the PDF report or the MP4 loading video for the warehouse.')]

m = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', s, re.S)
d = json.loads(m.group(2))
g = [n for n in d['@graph'] if n.get('@type') not in ('HowTo', 'VideoObject')]
for n in g:
    if n.get('@type') == 'WebApplication':
        n['image'] = IMG
        n.setdefault('offers', {'@type': 'Offer', 'price': '0', 'priceCurrency': 'INR'})
    if n.get('@type') == 'WebPage':
        n['primaryImageOfPage'] = {'@type': 'ImageObject', 'url': IMG}
g.append({'@type': 'HowTo', 'name': 'How to plan a container load with the free 3D container loading calculator',
          'image': IMG, 'totalTime': 'PT2M',
          'step': [{'@type': 'HowToStep', 'position': k + 1, 'name': a, 'text': b, 'url': SITE + 'container-load-planner'} for k, (a, b) in enumerate(STEPS)]})
g.append({'@type': 'VideoObject', 'name': '3D container loading plan: a 40 ft container loaded row by row',
          'description': 'Loading animation from the free CargoKit 3D container load calculator: coloured cartons placed row by row from the front wall to the doors of a 40 ft container.',
          'thumbnailUrl': SITE + 'load-planner-loop-poster.jpg', 'contentUrl': SITE + 'load-planner-loop.mp4',
          'uploadDate': '2026-11-09', 'duration': 'PT11S', 'embedUrl': SITE + 'container-load-planner'})
d['@graph'] = g
s = s[:m.start(2)] + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + s[m.end(2):]
open(F, 'w', encoding='utf-8').write(s)
print('ok')
