import json,collections
W=json.load(open('/root/dbg/tt/world.json',encoding='utf-8'))
R='/home/claude/yamlogistics-website/'
old=json.load(open(R+'corridors.json',encoding='utf-8'))
AIR={'South Asia':[1,3],'Gulf and Middle East':[1,3],'Southeast Asia':[2,4],'East Asia':[2,4],'Europe':[2,5],'Africa':[3,6],'North America':[3,6],'Caribbean':[4,7],'Oceania':[3,6]}
SANC={'IR','CU'}
def flag(cc): return ''.join(chr(0x1F1E6+ord(c)-65) for c in cc)
rows=[]
for o in old['rows']:
    o=dict(o); o['desk']=1; rows.append(o)
for w in W:
    svc=w['svc']; rr=[]
    for i,r in enumerate(w['r']):
        nm='{:,}'.format(int(round(r['nm'],-1)))
        if svc=='L': t='Landlocked. Cargo discharges at %s (%s) and moves on by road or rail. About %s nautical miles by sea to that port. The inland leg is extra.'%(w['port'],w['x'],nm)
        elif svc=='d': t='About %s nautical miles by sea. Usually a direct service from Nhava Sheva or Mundra.'%nm
        elif svc=='f': t='About %s nautical miles by sea. Direct on some services, otherwise one change of ship%s.'%(nm,(' at '+w['x']) if w['x'] else '')
        else: t='About %s nautical miles by sea. Usually transhipped at %s.'%(nm,w['x'])
        x={'d':r['d'],'t':t}
        if r.get('via'): x['via']=r['via']
        if len(w['r'])>1 and i==0: x['w']='In November 2026 most carriers were moving back to the Suez route, but some sailings still go round the Cape. Ask which route your sailing takes.'
        if 'ormuz' in w['pas'] and i==0: x['w']='This route passes the Strait of Hormuz, where shipping was disrupted earlier in 2026. Check the current position before you book.'
        rr.append(x)
    row={'f':flag(w['cc']),'n':w['n'],'reg':w['reg'],'est':1,'r':rr,'air':AIR[w['reg']],'airT':'Typically %d–%d days airport to airport for this region, from Delhi or Mumbai.'%tuple(AIR[w['reg']]),'ports':[[w['port'],w['code']]],'airports':[],'chk':'November 2026'}
    if svc=='L': row['door']='to '+w['port']+', inland leg extra'
    if w['cc'] in SANC: row['x']='Check the goods and every party against sanctions and export-control lists before you quote.'
    rows.append(row)
out={'v':2,'from':old['from'],'base':old['base'],'rows':rows}
b=json.dumps(out,ensure_ascii=False,separators=(',',':')); open(R+'corridors.json','w',encoding='utf-8').write(b)
print(len(b),len(rows),'countries',len(set(w['cc'] for w in W))+23, collections.Counter(r['reg'] for r in rows))
