import json,sys,math,collections
sys.path.insert(0,'/root/dbg/tt'); import world
import searoute as sr
from searoute import setup_P
P=setup_P(); by={v['port']:v for k,v in P.nodes(data=True) if v.get('port')}
LP={p[0]:p for p in json.load(open('/home/claude/yamlogistics-website/locode-ports.json',encoding='utf-8'))['p']}
MAN={'MAPTM':(-5.50,35.89),'QAHMD':(51.61,25.02),'BHKBS':(50.71,26.20),'TRAMR':(28.69,40.97),'PTSIE':(-8.87,37.95),'EETLL':(24.95,59.49),'GALBV':(9.50,0.29),'CUMAR':(-82.76,23.01),'CGPNR':(11.83,-4.78),'KHKOS':(103.50,10.63),'MZBEW':(34.83,-19.82)}
def coord(code):
    if code in by: return (by[code]['x'],by[code]['y'])
    p=LP.get(code)
    if p and p[4] is not None: return (p[5],p[4])
    return MAN[code]
NS=coord('INNSA'); direct=set(by['INNSA'].get('to_cty',[]))|set(by['INMUN'].get('to_cty',[]))
rows=[l.split('|') for l in world.ROWS.strip().split('\n')]
out=[];chk=[]
def dist(c,restr=None):
    r=sr.searoute(list(NS),list(c),units='naut',restrictions=restr or ['northwest'],return_passages=True)
    return r['properties']['length'], r['properties'].get('traversed_passages') or r['properties'].get('passages') or []
ADD={'d':(0,0),'f':(2,4),'t':(5,9),'L':(0,0)}
def days(nm,svc):
    a,b=ADD[svc]; lo=nm/390+0.5+a; hi=nm/290+2+b
    return [max(1,round(lo)),max(2,round(hi))]
for cc,name,reg,port,code,svc,extra in rows:
    try: c=coord(code)
    except KeyError: print('NO COORD',name,code); continue
    nm,pas=dist(c)
    base='d' if svc=='L' else svc
    if svc=='L':
        # landlocked: use the gateway country's own service type
        g=[r for r in rows if r[4]==code and r[5]!='L']; base=g[0][5] if g else 'f'
    r1={'nm':round(nm),'d':days(nm,base)}
    rr=[r1]
    if 'suez' in pas:
        nm2,p2=dist(c,['northwest','suez']); r1['via']='Via the Suez Canal'; rr.append({'via':'Via the Cape of Good Hope','nm':round(nm2),'d':days(nm2,base)})
    out.append({'cc':cc,'n':name,'reg':reg,'port':port,'code':code,'svc':svc,'x':extra,'r':rr,'pas':pas})
    chk.append((name,svc,cc in direct,round(nm),pas,[x['d'] for x in rr]))
json.dump(out,open('/root/dbg/tt/world.json','w'),ensure_ascii=False)
for c in chk: print(c)
print(len(out)); print('classified d but not in direct list:',[c[0] for c in chk if c[1]=='d' and not c[2]]); print('classified t but in direct list:',[c[0] for c in chk if c[1]=='t' and c[2]])
