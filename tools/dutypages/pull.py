import json, urllib.request, time, os, sys
H = json.load(open('/home/claude/yamlogistics-website/hs6-en.json'))
codes = sorted(H['s'].keys())
B = "https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=699&period=2025&flowCode=M&partnerCode=0&partner2Code=0&customsCode=C00&motCode=0&cmdCode="
out = json.load(open('imp.json')) if os.path.exists('imp.json') else {}
done = set(json.load(open('done.json'))) if os.path.exists('done.json') else set()
N = 140; t0 = time.time(); err = 0
for i in range(0, len(codes), N):
    if i in done: continue
    if time.time() - t0 > 520: break
    ch = codes[i:i + N]
    for attempt in range(3):
        try:
            j = json.load(urllib.request.urlopen(B + ",".join(ch), timeout=60))
            for r in j.get('data', []): out[r['cmdCode']] = [r.get('primaryValue') or 0, r.get('netWgt') or 0]
            if j.get('count', 0) >= 500: print('CAP hit at', i)
            done.add(i); break
        except Exception as e:
            err += 1; time.sleep(6)
    time.sleep(1.2)
json.dump(out, open('imp.json', 'w')); json.dump(sorted(done), open('done.json', 'w'))
tot = sum(v[0] for v in out.values())
print('chunks done', len(done), 'of', (len(codes) + N - 1) // N, '| codes with imports', len(out), '| total bn', round(tot / 1e9, 1), '| errors', err)
