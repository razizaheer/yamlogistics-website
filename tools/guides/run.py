import sys; sys.path.insert(0,'/root/dbg/guides')
from gl import *
load_all()
print(len(G))
only = sys.argv[1:] 
for x in G:
    if not only or x['slug'] in only: make(x)
