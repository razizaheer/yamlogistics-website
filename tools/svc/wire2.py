import re,sys,glob,os,io
sys.path.insert(0,'/root/dbg/lp')
from lib import rd,wr,cards,h2
NEW=[('customs-clearance-india','Customs clearance in India','All 14 stations and the full process.'),
('customs-clearance-delhi','Customs clearance in Delhi','IGI air cargo, ICD Tughlakabad and Dadri.'),
('customs-broker-in-delhi','Customs broker in Delhi','Licence R-7/92, New Delhi.'),
('freight-forwarder-delhi','Freight forwarder in Delhi','Sea and air with our own customs licence.'),
('sea-freight-services-india','Sea freight services','FCL and LCL via Mundra and Nhava Sheva.'),
('air-freight-services-india','Air freight services','Mumbai 24x7 desk and Delhi IGI.'),
('mundra-port-customs-clearance','Mundra port clearance','INMUN1, own office on site.'),
('nhava-sheva-jnpt-customs-clearance','Nhava Sheva clearance','INNSA1, Mumbai sea office.'),
('air-cargo-clearance-delhi-igi','Delhi IGI air cargo','INDEL4 import and export.'),
('icd-tughlakabad-customs-clearance','ICD Tughlakabad','INTKD6.'),
('icd-dadri-customs-clearance','ICD Dadri','INDER6.')]
band=('<div style="background:#FFFFFF"><div style="max-width:1400px;margin:0 auto;padding:48px 32px">'+h2('WHERE WE CLEAR AND SHIP','Pages by location and service')+cards(NEW)+'</div></div>\n')
marker='<div style="background: #0A6CC2; color: #FFFFFF">'
for f in ['customs-brokerage','air-freight','ocean-freight']:
    s=rd(f+'.html')
    if 'customs-clearance-delhi' in s: continue
    i=s.index(marker); wr(f+'.html',s[:i]+band+s[i:]); print(f,'band')
f='index.html'; s=rd(f)
if 'customs-clearance-delhi' not in s:
    j=s.index('<div style="background: #0A6CC2; color: #FFFFFF">') if '<div style="background: #0A6CC2; color: #FFFFFF">' in s else None
    if j is None: j=s.rindex('<footer')
    wr(f,s[:j]+band+s[j:]); print('index band')
# sitemap / llms
f='sitemap.xml'; s=rd(f)
for n,_,_ in NEW:
    u='<url><loc>https://www.yamlogistics.com/%s</loc><lastmod>2026-11-17</lastmod></url>\n'%n
    if u not in s: s=s.replace('</urlset>',u+'</urlset>')
wr(f,s); print('sitemap',s.count('<loc>'))
f='llms.txt'; s=rd(f)
if 'customs-clearance-delhi' not in s:
    s=s.rstrip('\n')+'\n\n## Customs clearance and freight by location\n'+''.join('- [%s](https://www.yamlogistics.com/%s): %s\n'%(t,n,d) for n,t,d in NEW)
    wr(f,s)
f='sw.js'; s=rd(f); wr(f,re.sub(r"const VERSION = '[^']*'","const VERSION = 'ck60svc-17nov'",s,count=1))
