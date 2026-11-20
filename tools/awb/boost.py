#!/usr/bin/env python3
"""AWB label generator page: sharper snippet, sample label, how-to steps,
AWB check digit + series tool, extra FAQs. Idempotent (marker blocks)."""
import json, re, sys

F = sys.argv[1] if len(sys.argv) > 1 else 'awb-label-generator.html'
s = open(F, encoding='utf-8').read()

TITLE = 'Free AWB Label Generator: Print IATA Barcode Cargo Labels &amp; Stickers | YAM Logistics'
DESC = ('Make IATA air cargo labels (AWB stickers) free: one barcoded label per piece as a PDF '
        'for 4x6 thermal, 10x15 cm or A4. Reads your air waybill file. No sign-up.')
IMG = 'https://www.yamlogistics.com/awb-label-sample.png'

s = re.sub(r'<title>[^<]*</title>', '<title>%s</title>' % TITLE, s, 1)
s = re.sub(r'(<meta name="description" content=")[^"]*', r'\g<1>' + DESC, s, 1)
s = re.sub(r'(<meta property="og:title" content=")[^"]*', r'\g<1>' + TITLE, s, 1)
s = re.sub(r'(<meta property="og:description" content=")[^"]*', r'\g<1>' + DESC, s, 1)
if 'og:image' not in s:
    s = s.replace('<meta property="og:title"',
                  '<meta property="og:image" content="%s"><meta name="twitter:image" content="%s"><meta property="og:title"' % (IMG, IMG), 1)

H2 = "font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 110%; font-size: clamp(32px, 3.6vw, 50px); line-height: 1.04; letter-spacing: -0.03em; margin: 0 0 24px"
CARD = 'background: #F2F8FD; border-radius: 20px; padding: 24px'
P = 'font-size: 15.5px; line-height: 1.7; color: #3D5873; margin: 0'
INP = 'width: 100%; box-sizing: border-box; padding: 12px 14px; border: 1px solid #C9DCEC; border-radius: 12px; font-size: 16px; font-family: inherit'
BTN = 'padding: 12px 18px; border-radius: 12px; border: 0; font-weight: 700; font-size: 15px; cursor: pointer'

STEPS = [
    ('Enter the air waybill', 'Type the airline name or 3-digit prefix and the 11-digit air waybill number, or drop a PDF or photo of the air waybill and let the tool fill it in.'),
    ('Add destination and pieces', 'Enter the destination airport and the total number of pieces. Origin, transfer points, piece weight, handling information and house waybill details are optional.'),
    ('Check the preview', 'Each label shows the airline, AWB number, destination, pieces and a Code 128 barcode with the piece number. Step through the pieces to check them.'),
    ('Print and stick', 'Download the PDF for a 4x6 inch thermal printer, 10x15 cm labels or A4 sheets, and stick one label on each piece next to the address.'),
]
steps_html = ''.join(
    '<li style="margin: 0 0 14px"><b style="color: #0B2A4A">%s.</b> %s</li>' % (t, d) for t, d in STEPS)

NEWFAQ = [
    ('How do I generate an AWB number series?',
     'Enter the first air waybill number from the stock your airline allocated to you and how many numbers you need. The tool adds 1 to the 7-digit serial each time and works out the check digit, so 176-12345675 is followed by 176-12345686 and 176-12345690. Use only numbers the airline has issued to you.'),
    ('How is the AWB check digit calculated?',
     'The air waybill serial has 8 digits. The 8th is normally the remainder when the first 7 digits are divided by 7. For 1234567 the remainder is 5, so the serial is 12345675. A few carriers use their own numbering, so a mismatch is a warning, not proof of an error.'),
    ('Is an AWB label the same as an AWB sticker?',
     'Yes. Forwarders and airlines call the piece label an AWB label, cargo label or AWB sticker. It is different from the air waybill document itself, which travels with the shipment.'),
]
faq_html = ''.join(
    '<details style="background: #FFFFFF; border-radius: 16px; padding: 20px 24px; margin-bottom: 10px">'
    '<summary style="font-weight: 600; font-size: 18px; display: flex; justify-content: space-between; gap: 20px">%s<span style="color: #0A6CC2">+</span></summary>'
    '<p style="font-size: 16px; line-height: 1.65; color: #3D5873; margin: 12px 0 0">%s</p></details>' % (q, a)
    for q, a in NEWFAQ)

SECTION = '''<!--awb-boost-->
<div style="background: #FFFFFF">
<div style="max-width: 1100px; margin: 0 auto; padding: 72px 32px 24px">
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; align-items: start">
<div>
<h2 style="%(H2)s">How to make AWB labels</h2>
<ol style="font-size: 16px; line-height: 1.7; color: #3D5873; padding-left: 20px; margin: 0">%(steps)s</ol>
</div>
<figure style="margin: 0; text-align: center">
<picture><source srcset="awb-label-sample.webp" type="image/webp"><img src="awb-label-sample.png" width="467" height="546" loading="lazy" alt="Sample IATA air cargo label made with the free AWB label generator: Emirates, air waybill 176-1234 5675, destination DXB, piece 1 of 12, with Code 128 barcode" style="max-width: 100%%; height: auto"></picture>
<figcaption style="font-size: 13.5px; color: #3D5873; margin-top: 8px">A sample label from this tool (example AWB number, not a real shipment).</figcaption>
</figure>
</div>
</div>
</div>

<div style="background: #FFFFFF">
<div style="max-width: 1100px; margin: 0 auto; padding: 24px 32px 80px">
<h2 id="awb-series" style="%(H2)s">AWB number check digit and series generator</h2>
<p style="%(P)s; max-width: 760px; margin-bottom: 22px">An air waybill number is a 3-digit airline prefix and an 8-digit serial. The last digit of the serial is a check digit: the first 7 digits divided by 7, keep the remainder. Check one number, or list the next numbers in the stock your airline allocated to you.</p>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px">
<div style="%(CARD)s">
<div style="font-family: 'Archivo', sans-serif; font-weight: 800; font-size: 20px; margin-bottom: 12px">Check an AWB number</div>
<label for="aw-chk" style="font-size: 14px; font-weight: 600">Air waybill number</label>
<input id="aw-chk" inputmode="numeric" placeholder="e.g. 176-12345675" style="%(INP)s; margin: 6px 0 12px">
<div id="aw-chk-out" aria-live="polite" style="%(P)s; min-height: 26px"></div>
</div>
<div style="%(CARD)s">
<div style="font-family: 'Archivo', sans-serif; font-weight: 800; font-size: 20px; margin-bottom: 12px">Generate an AWB series</div>
<label for="aw-start" style="font-size: 14px; font-weight: 600">First AWB number in your stock</label>
<input id="aw-start" inputmode="numeric" placeholder="e.g. 176-12345675" style="%(INP)s; margin: 6px 0 12px">
<label for="aw-n" style="font-size: 14px; font-weight: 600">How many numbers (1 to 100)</label>
<input id="aw-n" inputmode="numeric" value="10" style="%(INP)s; margin: 6px 0 12px">
<div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px">
<button type="button" id="aw-go" style="%(BTN)s; background: #0A6CC2; color: #fff">List numbers</button>
<button type="button" id="aw-copy" style="%(BTN)s; background: #E1EDF7; color: #0B2A4A">Copy</button>
<button type="button" id="aw-clr" style="%(BTN)s; background: #E1EDF7; color: #0B2A4A">Clear</button>
</div>
<div id="aw-msg" aria-live="polite" style="%(P)s; margin-bottom: 8px"></div>
<textarea id="aw-out" rows="6" readonly aria-label="AWB number series" style="%(INP)s; font-family: ui-monospace, monospace; font-size: 15px"></textarea>
</div>
</div>
<p style="font-size: 13.5px; line-height: 1.6; color: #5B7590; margin: 14px 0 0">Use only air waybill numbers issued to you by the airline. A few carriers use their own numbering, so a check digit mismatch is a warning, not proof of an error.</p>
</div>
</div>
<script>
(function(){
  function parse(v){var d=(v||'').replace(/\\D/g,'');if(d.length===11)return{p:d.slice(0,3),s7:d.slice(3,10),c:d[10]};if(d.length===10)return{p:d.slice(0,3),s7:d.slice(3,10),c:null};return null;}
  function fmt(p,s7){return p+'-'+s7+(parseInt(s7,10)%%7);}
  var $=function(i){return document.getElementById(i);};
  $('aw-chk').addEventListener('input',function(){
    var r=parse(this.value),o=$('aw-chk-out');
    if(!this.value.trim()){o.textContent='';return;}
    if(!r){o.textContent='Enter 11 digits: 3-digit prefix and 8-digit serial.';return;}
    var want=String(parseInt(r.s7,10)%%7);
    if(r.c===null){o.textContent='Check digit should be '+want+': '+fmt(r.p,r.s7);return;}
    o.textContent=(r.c===want)?'\\u2713 Check digit matches ('+r.p+'-'+r.s7+r.c+').':'\\u26A0 Check digit is '+r.c+', expected '+want+' ('+fmt(r.p,r.s7)+').';
  });
  $('aw-go').addEventListener('click',function(){
    var r=parse($('aw-start').value),n=parseInt($('aw-n').value,10),m=$('aw-msg');
    if(!r){m.textContent='Enter the first AWB number: 3-digit prefix and 8-digit serial.';return;}
    if(!(n>=1&&n<=100)){m.textContent='Choose between 1 and 100 numbers.';return;}
    var base=parseInt(r.s7,10),out=[];
    for(var i=0;i<n;i++){var k=base+i;if(k>9999999)break;var s7=('0000000'+k).slice(-7);out.push(fmt(r.p,s7));}
    $('aw-out').value=out.join('\\n');m.textContent=out.length+' numbers listed.';
  });
  $('aw-copy').addEventListener('click',function(){var t=$('aw-out').value;if(!t)return;try{navigator.clipboard.writeText(t);$('aw-msg').textContent='Copied.';}catch(e){$('aw-out').select();}});
  $('aw-clr').addEventListener('click',function(){$('aw-start').value='';$('aw-n').value='10';$('aw-out').value='';$('aw-msg').textContent='';$('aw-chk').value='';$('aw-chk-out').textContent='';});
})();
</script>
<!--/awb-boost-->
''' % dict(H2=H2, P=P, CARD=CARD, INP=INP, BTN=BTN, steps=steps_html)

# remove previous run
s = re.sub(r'<!--awb-boost-->.*?<!--/awb-boost-->\n?', '', s, flags=re.S)
s = re.sub(r'<!--awb-faq-->.*?<!--/awb-faq-->', '', s, flags=re.S)

# insert section before the FAQ block wrapper
h = s.find('>Questions people ask</h2>')
w = s.rfind('<div style="background: #F2F8FD">', 0, h)
assert h > 0 and w > 0
s = s[:w] + SECTION + '\n' + s[w:]

# visible FAQ items right after the FAQ heading
h = s.find('>Questions people ask</h2>') + len('>Questions people ask</h2>')
s = s[:h] + '\n<!--awb-faq-->' + faq_html + '<!--/awb-faq-->' + s[h:]

# JSON-LD: FAQ entries + HowTo + image
def fix(m):
    d = json.loads(m.group(1))
    g = d.get('@graph')
    if not g:
        return m.group(0)
    for node in g:
        if node.get('@type') == 'FAQPage':
            names = {q['name'] for q in node['mainEntity']}
            for q, a in NEWFAQ:
                if q not in names:
                    node['mainEntity'].append({'@type': 'Question', 'name': q,
                                               'acceptedAnswer': {'@type': 'Answer', 'text': a}})
        if node.get('@type') == 'WebApplication':
            node['image'] = IMG
            node['offers'] = {'@type': 'Offer', 'price': '0', 'priceCurrency': 'INR'}
        if node.get('@type') == 'WebPage':
            node['description'] = DESC
            node['primaryImageOfPage'] = {'@type': 'ImageObject', 'url': IMG}
    g[:] = [n for n in g if n.get('@type') != 'HowTo']
    g.append({'@type': 'HowTo', 'name': 'How to make IATA air cargo (AWB) labels',
              'image': IMG, 'totalTime': 'PT2M', 'tool': [{'@type': 'HowToTool', 'name': 'Thermal label printer or A4 printer'}],
              'step': [{'@type': 'HowToStep', 'position': i + 1, 'name': t, 'text': dd,
                        'url': 'https://www.yamlogistics.com/awb-label-generator'} for i, (t, dd) in enumerate(STEPS)]})
    return '<script type="application/ld+json">' + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + '</script>'

s = re.sub(r'<script type="application/ld\+json">(.*?)</script>', fix, s, count=1, flags=re.S)
open(F, 'w', encoding='utf-8').write(s)
print('ok')
