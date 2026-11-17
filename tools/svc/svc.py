import sys, re; sys.path.insert(0,'/root/dbg/lp')
import lib
from lib import *
PAGES=[]
def S(slug,T,DESC,crumb,chip,h1a,h1b,intro,secs,faq,cards_=None):
    PAGES.append(dict(slug=slug,T=T,DESC=DESC,crumb=crumb,chip=chip,h1a=h1a,h1b=h1b,intro=intro,secs=secs,faq=faq,cards=cards_ or []))
def build(x):
    inner=''
    for hd,parts in x['secs']:
        inner+=h3(hd)
        if isinstance(parts,str): parts=[parts]
        for c in parts:
            if isinstance(c,str): inner+=p(c)
            elif isinstance(c,list): inner+=ul(c)
            elif c[0]=='table': inner+=table(c[1],c[2],c[3] if len(c)>3 else '')
    inner+=note('<b>Talk to a licensed broker.</b> YAM Logistics holds customs broker licence R-7/92. Send the invoice, packing list and product details to <a href="contact" style="color:#0A6CC2;font-weight:700">our desk</a> and we will confirm the classification, duty and permissions before you ship. Rules and rates change; this page is for guidance.')
    inner+=h2('KEEP READING','Related pages and guides')+cards(x['cards']+[('customs-duty-calculator','Free customs duty calculator','Work out India import duty by HS code.'),('guides/','All guides','Plain-English guides to trade in India.')])
    inner+='<div style="height:10px"></div>'+btn('contact','Get a quote')+btn('customs-brokerage','Customs brokerage',True)
    return section(inner)
def make(x):
    T=x['T']
    lib.page(x['slug'],T,x['DESC'],x['crumb'],x['chip'],x['h1a'],x['h1b'],x['intro'],build(x),x['faq'],cta='Customs broker licence R-7/92. Clearance and freight from one desk.',cta_btn='Get a quote',cta_href='contact')
    f=x['slug']+'.html'; s=rd(f)
    s=s.replace('"name":"Free tools","item":"https://www.yamlogistics.com/free-tools"','"name":"Customs brokerage","item":"https://www.yamlogistics.com/customs-brokerage"')
    wr(f,s)
for f in ['p1','p2','p3']:
    exec(open('/root/dbg/svc/%s.py'%f).read())
only=sys.argv[1:]
for x in PAGES:
    if not only or x['slug'] in only: print(x['slug'],make(x))
