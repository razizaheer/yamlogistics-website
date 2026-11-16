import sys, io
sys.path.insert(0,'/root/dbg/lp')
from lib import *
from compare import COMPARE
f='container-load-planner.html'; s=rd(f)
assert 'id="more-load-calculators"' not in s, 'already applied'
oT='Free Container Load Planner & Calculator with 3D Loading Plan | YAM Logistics'; nT='Free 3D Container Load Calculator & Load Planner | YAM Logistics'
assert s.count(oT)==3; s=s.replace(oT,nT)
oD='Free container load calculator: enter your packages and see how many 20′, 40′ or 40′ HC containers, pallets or air pallets you need, with a 3D view, step-by-step loading sequence and PDF plan.'
nD='Free 3D container load calculator: enter your packing list and see how many 20′, 40′ or 40′ HC containers, trucks, pallets or air ULDs you need, with loading steps, a PDF report and a loading video. No sign-up.'
c=s.count(oD); assert c>=2,c; s=s.replace(oD,nD)
a='max-width: 1100px">Container load calculator. <span'; assert s.count(a)==1; s=s.replace(a,'max-width: 1100px">3D container load calculator. <span')
i=s.index('Load planner questions'); k=s.rfind('<div style="background: #F2F8FD">',0,i)
new=('<div id="more-load-calculators" style="background:#FFFFFF"><div style="max-width:1000px;margin:0 auto;padding:72px 32px 56px">'
 + h2('BY EQUIPMENT','Load calculators for every container, truck and pallet')
 + p('Sizes, pallet counts and carton counts for each type of equipment, worked out by this planner. Every page opens an example here that you can change to your own cargo.')
 + cards([(x,t,d) for x,t,d in RELATED])
 + '<div style="height:34px"></div>'
 + h2('FREE AGAINST PAID','Why this load planner is free')
 + p('Most 3D load calculators give you a trial, a daily limit or a monthly plan. This one is paid for by YAM Logistics, a customs broker and freight forwarder since 1992, as a tool for the trade. Excel import, pallet building, the PDF report and the loading video are free, with no sign-up and no limit on the number of plans.')
 + cards(COMPARE)
 + '</div></div>\n')
s=s[:k]+new+s[k:]
wr(f,s); print('ok',len(s))
