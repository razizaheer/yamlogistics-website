import sys; sys.path.insert(0,'/root/dbg/guides')
from gl import *
load_all()
n = len(G)
toc = ''; blocks = ''
for k, nm in CATS:
    xs = [x for x in G if x['cat'] == k]
    toc += '<a href="#c-%s" style="display:inline-block;background:#FFFFFF;border:1px solid #E1EDF7;border-radius:999px;padding:6px 12px;margin:0 6px 8px 0;font-size:14px;color:#0A6CC2;text-decoration:none;font-weight:600">%s (%d)</a>' % (k, e(nm), len(xs))
    items = ''.join('<a class="gd" href="guides/%s" data-t="%s"><b>%s</b><span>%s</span></a>' % (x['slug'], e((x['title'] + ' ' + x['desc']).lower()), e(x['title'].split('|')[0]), e(x['desc'][:120].rstrip(' ,.;') + '…')) for x in xs)
    blocks += '<h3 id="c-%s" class="gh" style="font-family:\'Archivo\',sans-serif;font-weight:800;font-size:21px;margin:30px 0 12px;scroll-margin-top:90px">%s</h3><div class="gg" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;max-width:1100px">%s</div>' % (k, e(nm), items)
css = '<style>.gd{display:block;background:#FFFFFF;border:1px solid #E1EDF7;border-radius:16px;padding:14px 16px;text-decoration:none;color:#3D5873}.gd b{display:block;font-family:\'Archivo\',sans-serif;font-size:16.5px;color:#0B2A4A;margin-bottom:4px}.gd span{font-size:14px;line-height:1.5}#gq{width:100%;max-width:520px;box-sizing:border-box;font-size:16px;padding:13px 18px;border:2px solid #CFE3F5;border-radius:999px;margin:6px 0 16px;color:#0B2A4A}</style>'
js = '<script>(function(){var q=document.getElementById("gq");if(!q)return;q.addEventListener("input",function(){var v=q.value.trim().toLowerCase();document.querySelectorAll(".gd").forEach(function(a){a.style.display=(!v||a.getAttribute("data-t").indexOf(v)>-1)?"":"none"});document.querySelectorAll(".gg").forEach(function(g){var any=g.querySelector(".gd:not([style*=none])");g.style.display=any?"":"none";g.previousElementSibling.style.display=any?"":"none"})})})()</script>'
body = section(h2('%d GUIDES · %d TOPICS' % (n, len(CATS)), 'Find your answer') +
    p('Plain English guides for importers, exporters and freight forwarders in India. Each one covers the steps, the documents, the common mistakes and links to the free tool that does the sum for you.') + css +
    '<input id="gq" type="search" placeholder="Search guides: bill of lading, IEC, demurrage..." aria-label="Search guides">' +
    '<div style="margin:0 0 6px;max-width:980px">' + toc + '</div>' + blocks + '<div style="height:24px"></div>' +
    note('<b>For guidance only.</b> Rules, rates and forms change. Check with Customs or a licensed customs broker before you act.') +
    btn('free-tools', 'See all free tools') + btn('import-duty/', 'Import duty by HS code', True) + js)
lib.page('guides/index', 'Import Export Guides for India: %d Guides | YAM Logistics' % n,
  '%d plain English guides on importing and exporting in India: customs, duty, documents, Incoterms, sea and air freight, dangerous goods and shipping to other countries.' % n,
  'Guides', 'GUIDES · IMPORT · EXPORT · FREIGHT', 'Import and export guides.', '%d answers, in plain English.' % n,
  'Step by step guides on customs, duty, shipping documents, Incoterms, containers, air freight and shipping to other countries. Written by a Delhi customs broker and freight forwarder.',
  body,
  [('Who writes these guides?', 'YAM Logistics, a customs broker and freight forwarder based in Delhi, in business since 1987.'),
   ('Are the guides up to date?', 'We review them as rules change, but rates and forms move often. Always check the latest notification or ask a licensed broker.'),
   ('Can you help with my shipment?', 'Yes. Contact us for customs clearance, freight and documentation.')],
  cta='Free tools for importers, exporters and forwarders. No sign-up.', cta_btn='See all free tools', cta_href='free-tools')
f = 'guides/index.html'; s = rd(f)
s = s.replace('"name":"Free tools","item":"https://www.yamlogistics.com/free-tools"', '"name":"Guides","item":"https://www.yamlogistics.com/guides/"')
s = s.replace('https://www.yamlogistics.com/guides/index', 'https://www.yamlogistics.com/guides/')
s = REL.sub(lambda m: m.group(1) + '../' + m.group(2), s); wr(f, s)
print('hub', len(s))
