import json, urllib.request, urllib.error, time, os
imp = json.load(open('imp.json'))
MINV = 5e6
cand = sorted([c for c, v in imp.items() if len(c) == 6 and v[0] >= MINV], key=lambda c: -imp[c][0])
B = "https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=699&period=2025&flowCode=M&partner2Code=0&customsCode=C00&motCode=0&cmdCode="
P = json.load(open('par.json')) if os.path.exists('par.json') else {}
todo = [c for c in cand if c not in P]
t0 = time.time(); calls = err = 0
def get(codes):
    global calls, err
    for a in range(4):
        try:
            calls += 1
            return json.load(urllib.request.urlopen(B + ",".join(codes), timeout=60))
        except urllib.error.HTTPError as e:
            err += 1; time.sleep(20 if e.code == 429 else 6)
        except Exception as e:
            err += 1; time.sleep(6)
    return None
def store(codes, j):
    for c in codes: P.setdefault(c, {})
    for r in j.get('data', []):
        if r['partnerCode'] != 0: P[r['cmdCode']][str(r['partnerCode'])] = round(r.get('primaryValue') or 0)
i = 0
while i < len(todo) and time.time() - t0 < 3000:
    ch = todo[i:i + 6]; i += 6
    j = get(ch)
    if j is None: 
        for c in ch: P.pop(c, None)
        continue
    if j.get('count', 0) >= 500:
        for c in ch:
            j1 = get([c])
            if j1: store([c], j1)
            time.sleep(1.0)
    else: store(ch, j)
    time.sleep(0.6)
    if calls % 25 == 0: json.dump(P, open("par.json", "w"))
json.dump(P, open('par.json', 'w'))
print('candidates', len(cand), '| have', len([c for c in cand if c in P]), '| calls', calls, 'errors', err, '| secs', round(time.time() - t0))
