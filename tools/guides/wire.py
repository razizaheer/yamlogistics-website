import sys, re, io, os, glob
sys.path.insert(0,'/root/dbg/guides')
R='/home/claude/yamlogistics-website/'
rd=lambda f: io.open(R+f,encoding='utf-8').read(); wr=lambda f,s: io.open(R+f,'w',encoding='utf-8',newline='').write(s)
slugs=sorted(os.path.basename(f)[:-5] for f in glob.glob(R+'guides/*.html') if not f.endswith('index.html'))
f='sitemap.xml'; s=rd(f)
s=re.sub(r'<url><loc>https://www\.yamlogistics\.com/guides/[^<]*</loc><lastmod>[^<]*</lastmod></url>\n','',s)
a='<url><loc>https://www.yamlogistics.com/customs-duty-calculator</loc>'; assert a in s
new='<url><loc>https://www.yamlogistics.com/guides/</loc><lastmod>2026-11-17</lastmod></url>\n'+''.join('<url><loc>https://www.yamlogistics.com/guides/%s</loc><lastmod>2026-11-17</lastmod></url>\n'%x for x in slugs)
s=s.replace(a,new+a,1); wr(f,s); print('sitemap',s.count('<loc>'))
f='llms.txt'; s=rd(f)
if 'guides/' not in s:
    i=s.index('customs-duty-calculator'); j=s.index('\n',i)+1
    s=s[:j]+'- [Import and export guides](https://www.yamlogistics.com/guides/): %d plain English guides on customs, duty, documents, Incoterms, freight and shipping to other countries.\n'%len(slugs)+s[j:]; wr(f,s)
f='sw.js'; s=rd(f); wr(f,re.sub(r"const VERSION = '[^']*'","const VERSION = 'ck59guides-17nov'",s,count=1))
# link band on free-tools
f='free-tools.html'; s=rd(f)
if 'href="guides/"' not in s:
    j=s.index('The questions we answer every day'); i=s.rfind('<div style="background',0,j)
    band=('<div style="background:#FFFFFF"><div style="max-width:1400px;margin:0 auto;padding:40px 32px">'
     '<a href="guides/" style="display:block;max-width:900px;background:#F2F8FD;border:1px solid #E1EDF7;border-radius:16px;padding:18px 22px;text-decoration:none;color:#0B2A4A">'
     '<b style="font-family:\'Archivo\',sans-serif;font-size:19px;display:block;margin-bottom:4px">Import and export guides: %d answers</b>'
     '<span style="font-size:15.5px;line-height:1.5;color:#3D5873">Customs, duty, documents, Incoterms, containers and air freight, in plain English. →</span></a></div></div>\n')%len(slugs)
    wr(f,s[:i]+band+s[i:]); print('band ok')
print(len(slugs))
