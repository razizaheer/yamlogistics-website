import re,sys
sys.path.insert(0,'/root/dbg/lp')
from lib import rd,wr,cards,h2
exec(open('/root/dbg/svc/wire2.py').read().split('band=(')[0].split("NEW=[")[0]) if False else None
OLD=[('customs-clearance-india','Customs clearance in India','All 14 stations and the full process.'),
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
ADD=[('customs-clearance-mumbai','Customs clearance in Mumbai','Nhava Sheva and Sahar.'),('air-cargo-clearance-mumbai-sahar','Mumbai Sahar air cargo','24x7 desk, INBOM4.'),('air-cargo-clearance-bengaluru','Bengaluru air cargo','INBLR4.'),('air-cargo-clearance-chennai','Chennai air cargo','INMAA4.'),('air-cargo-clearance-hyderabad','Hyderabad air cargo','INHYD4.'),('air-cargo-clearance-ahmedabad','Ahmedabad air cargo','INAMD4.'),('electronics-import-clearance-india','Electronics import clearance','BIS and WPC.'),('food-import-clearance-india','Food import clearance','FSSAI and customs.'),('machinery-import-clearance-india','Machinery import clearance','EPCG and project cargo.')]
NEW=OLD+ADD
mk=lambda L:'<div style="background:#FFFFFF"><div style="max-width:1400px;margin:0 auto;padding:48px 32px">'+h2('WHERE WE CLEAR AND SHIP','Pages by location and service')+cards(L)+'</div></div>\n'
ob,nb=mk(OLD),mk(NEW)
for f in ['index','customs-brokerage','air-freight','ocean-freight']:
    s=rd(f+'.html'); assert ob in s or nb in s,f
    wr(f+'.html',s.replace(ob,nb)); print(f,'ok')
f='sitemap.xml'; s=rd(f)
for n,_,_ in ADD:
    u='<url><loc>https://www.yamlogistics.com/%s</loc><lastmod>2026-11-17</lastmod></url>\n'%n
    if u not in s: s=s.replace('</urlset>',u+'</urlset>')
wr(f,s); print('sitemap',s.count('<loc>'))
f='llms.txt'; s=rd(f)
for n,t,d in ADD:
    if n not in s: s=s.rstrip('\n')+'\n- [%s](https://www.yamlogistics.com/%s): %s\n'%(t,n,d)
wr(f,s)
f='sw.js'; s=rd(f); wr(f,re.sub(r"const VERSION = '[^']*'","const VERSION = 'ck61loc-17nov'",s,count=1))
