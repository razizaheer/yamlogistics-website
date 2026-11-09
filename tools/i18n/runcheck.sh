# needs a local server in the repo root: python3 -m http.server 8765 --bind 127.0.0.1
cd "$(dirname "$0")"
for g in ar de es fr hi ja ko pt ru zh; do
  for p in hsn-code-finder track-shipment my-shipments landed-cost-calculator bl-awb-draft document-generator; do node crawl.js $g/$p.html crawl/$g-$p.json MSKU1234565 176-12345675 "Acme Exports Pvt Ltd" >/dev/null 2>&1 & done; wait
  node leftover.js $g hsn-code-finder track-shipment my-shipments landed-cost-calculator bl-awb-draft document-generator
done > leftover-all.txt
