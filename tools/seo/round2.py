#!/usr/bin/env python3
"""Ranking round 2 (21 Nov 2026): seven tool pages get the depth the top-ranking rivals have
(worked examples, formula and code tables, how-to steps, extra FAQs) plus HowTo schema.
container-number-checker also gets a bulk checker. Idempotent: marker blocks <!--seo-r2--> / <!--seo-r2f-->.
English pages only; translated pages follow through tools/i18n."""
import json, re, sys, os
sys.path.insert(0, '/home/claude/yamlogistics-website/tools/seo')
R = '/home/claude/yamlogistics-website/'
SITE = 'https://www.yamlogistics.com/'
E = lambda s: s.replace('&', '&amp;')

H2 = "font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 110%; font-size: clamp(30px, 3.4vw, 46px); line-height: 1.05; letter-spacing: -0.03em; margin: 0 0 22px"
H3 = "font-family: 'Archivo', sans-serif; font-weight: 800; font-size: 22px; margin: 26px 0 10px"
P = 'font-size: 16.5px; line-height: 1.7; color: #3D5873; margin: 0 0 14px; max-width: 860px'
UL = 'font-size: 16px; line-height: 1.7; color: #3D5873; padding-left: 22px; margin: 0 0 16px; max-width: 900px'
A = 'color: #0A6CC2'
TH = 'text-align: left; padding: 10px 12px; background: #0B2A4A; color: #FFFFFF; font-size: 14px'
TD = 'padding: 9px 12px; border-bottom: 1px solid #E3ECF5; font-size: 15px; color: #0B2A4A; vertical-align: top'

def section(kicker, title, inner, sid=''):
    return ('<!--seo-r2--><div style="background: #FFFFFF"><div style="max-width: 1100px; margin: 0 auto; padding: 72px 32px">'
            '<div style="font-family: \'Geist Mono\', monospace; font-size: 12px; letter-spacing: 0.12em; color: #0A6CC2; margin-bottom: 12px">%s</div>'
            '<h2%s style="%s">%s</h2>%s</div></div><!--/seo-r2-->\n') % (kicker, (' id="%s"' % sid) if sid else '', H2, title, inner)
def ul(items): return '<ul style="%s">%s</ul>' % (UL, ''.join('<li style="margin-bottom: 8px">%s</li>' % i for i in items))
def ol(items): return '<ol style="%s">%s</ol>' % (UL, ''.join('<li style="margin-bottom: 8px">%s</li>' % i for i in items))
def p(t): return '<p style="%s">%s</p>' % (P, t)
def h3(t): return '<h3 style="%s">%s</h3>' % (H3, t)
def table(head, rows):
    return ('<div style="overflow-x: auto; max-width: 980px; margin: 0 0 18px"><table style="border-collapse: collapse; width: 100%%; min-width: 560px">'
            '<thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>') % (
        ''.join('<th style="%s">%s</th>' % (TH, h) for h in head),
        ''.join('<tr>%s</tr>' % ''.join('<td style="%s">%s</td>' % (TD, c) for c in r) for r in rows))
DET = ('<details style="background: #FFFFFF; border-radius: 16px; padding: 16px 20px; margin-bottom: 10px; max-width: 900px">'
       '<summary style="cursor: pointer; font-family: \'Archivo\', sans-serif; font-weight: 700; font-size: 17px">%s</summary>'
       '<p style="margin: 10px 0 0; font-size: 15px; line-height: 1.6; color: #3D5873">%s</p></details>')

# ---- ISO 6346 values for the worked example
def iso_val():
    v, n = {}, 10
    for c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
        if n % 11 == 0: n += 1
        v[c] = n; n += 1
    return v
V = iso_val()
def iso_rows(code):
    rows, tot = [], 0
    for i, ch in enumerate(code):
        val = V[ch] if ch.isalpha() else int(ch)
        w = 2 ** i; tot += val * w
        rows.append([str(i + 1), '<b>%s</b>' % ch, str(val), str(w), str(val * w)])
    return rows, tot
ex_rows, ex_tot = iso_rows('CSQU305438')
ex_cd = ex_tot % 11 % 10
letters = table(['Letter', 'Value'] * 4, [sum(([c, str(V[c])] for c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i::7]), []) + [''] * (8 - 2 * len('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i::7])) for i in range(7)])

BULK = ('<div style="background: #F2F8FD; border-radius: 18px; padding: 22px; max-width: 900px; margin: 6px 0 24px">'
        '<label for="cn-bulk" style="font-weight: 700; display: block; margin-bottom: 8px">Check many container numbers at once</label>'
        '<p style="font-size: 14.5px; color: #3D5873; margin: 0 0 10px">Paste up to 500 numbers, one per line or separated by commas or spaces (for example from a packing list or an Excel column).</p>'
        '<textarea id="cn-bulk" rows="6" style="width: 100%; box-sizing: border-box; font-family: \'Geist Mono\', monospace; font-size: 15px; padding: 12px; border-radius: 12px; border: 1px solid #C9D9EA" placeholder="CSQU3054383&#10;MSCU1234565&#10;TGHU8765432"></textarea>'
        '<div style="display: flex; gap: 10px; margin: 12px 0; flex-wrap: wrap">'
        '<button type="button" id="cn-bulk-go" style="background: #0A6CC2; color: #FFFFFF; border: 0; border-radius: 999px; padding: 11px 22px; font-weight: 700; cursor: pointer">Check all</button>'
        '<button type="button" id="cn-bulk-copy" style="background: #FFFFFF; color: #0B2A4A; border: 1px solid #C9D9EA; border-radius: 999px; padding: 11px 22px; font-weight: 600; cursor: pointer">Copy results</button>'
        '<button type="button" id="cn-bulk-clr" style="background: #FFFFFF; color: #0B2A4A; border: 1px solid #C9D9EA; border-radius: 999px; padding: 11px 22px; font-weight: 600; cursor: pointer">Clear</button></div>'
        '<div id="cn-bulk-sum" style="font-weight: 700; margin-bottom: 8px"></div><div id="cn-bulk-out" style="overflow-x: auto"></div></div>'
        '<script>(function(){var V={},n=10;"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function(c){if(n%11==0)n++;V[c]=n++;});'
        'function cd(s){var t=0;for(var i=0;i<10;i++){var c=s[i];t+=(/[A-Z]/.test(c)?V[c]:+c)*Math.pow(2,i);}return t%11%10;}'
        'var ta=document.getElementById("cn-bulk"),out=document.getElementById("cn-bulk-out"),sum=document.getElementById("cn-bulk-sum"),last="";'
        'document.getElementById("cn-bulk-go").onclick=function(){var L=ta.value.toUpperCase().split(/[\\s,;]+/).filter(Boolean).slice(0,500),ok=0,rows=[],txt=["Number\\tResult"];'
        'L.forEach(function(x){var s=x.replace(/[^A-Z0-9]/g,""),r;if(!/^[A-Z]{3}[UJZ][0-9]{6,7}$/.test(s))r="Wrong format";else{var c=cd(s);'
        'if(s.length==10)r="Check digit should be "+c+" ("+s+c+")";else if(+s[10]==c){r="Valid";ok++;}else r="Wrong check digit: should be "+c;}'
        'rows.push("<tr><td style=\\"padding:6px 10px;font-family:monospace\\">"+s+"</td><td style=\\"padding:6px 10px;color:"+(r=="Valid"?"#127A3E":"#B42318")+"\\">"+r+"</td></tr>");txt.push(s+"\\t"+r);});'
        'sum.textContent=L.length?ok+" of "+L.length+" valid":"";out.innerHTML=L.length?"<table style=\\"border-collapse:collapse;background:#fff;border-radius:10px\\">"+rows.join("")+"</table>":"";last=txt.join("\\n");};'
        'document.getElementById("cn-bulk-copy").onclick=function(){if(last&&navigator.clipboard)navigator.clipboard.writeText(last);};'
        'document.getElementById("cn-bulk-clr").onclick=function(){ta.value="";out.innerHTML="";sum.textContent="";last="";};})();</script>')

PAGES = {
 'container-number-checker': dict(
   title='Container Number Check Digit Calculator (ISO 6346): Validate One or Many, Size/Type Codes | YAM Logistics',
   desc='Free container check digit calculator: validate an ISO 6346 container number or check hundreds at once, see the worked calculation, scan with your phone camera and decode size and type codes such as 22G1 and 45G1.',
   before='>Good to know.</h2>',
   section=section('CHECK DIGIT CALCULATOR', 'Container check digit: bulk check and worked example',
     BULK +
     h3('How the check digit is calculated') +
     p('A container number has an owner code of three letters, an equipment category letter (U, J or Z), a six-digit serial number and one check digit. The check digit catches typing and reading mistakes. ISO 6346 works it out in four steps:') +
     ol(['Give each of the first ten characters a value. Digits keep their value. Letters use the table below: A is 10 and the values go up by one, skipping 11, 22 and 33.',
         'Multiply each value by its position weight: 1 for the first character, then 2, 4, 8 and so on up to 512 for the tenth.',
         'Add up the ten results.',
         'Divide the total by 11. The remainder is the check digit; a remainder of 10 counts as 0.']) +
     table(['Letter', 'Value'] * 4, [sum(([c, str(V[c])] for c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i:i + 4]), []) + [''] * (8 - 2 * len('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i:i + 4])) for i in range(0, 26, 4)]) +
     h3('Worked example: CSQU305438') +
     table(['Position', 'Character', 'Value', 'Weight', 'Value × weight'], ex_rows + [['', '', '', '<b>Total</b>', '<b>%d</b>' % ex_tot]]) +
     p('%d divided by 11 leaves a remainder of %d, so the check digit is <b>%d</b> and the full number is <b>CSQU305438%d</b>. This is the example the ISO 6346 standard itself uses. Type any number into the checker above to see the same working for your own container.' % (ex_tot, ex_tot % 11, ex_cd, ex_cd)), 'check-digit'),
   faq=[('Can I check many container numbers at once?', 'Yes. Paste up to 500 numbers into the bulk checker on this page, one per line or separated by commas. Each one is marked valid, wrong check digit (with the right digit) or wrong format, and you can copy the results back into Excel.'),
        ('What is a container check digit calculator?', 'It works out the eleventh character of a container number from the first ten, using the ISO 6346 method. If the last digit on a document does not match, the number has been typed or read wrongly.')],
   steps=[('Enter the container number', 'Type the 11-character number, or the first 10 characters to get the check digit. Paste a list into the bulk checker for many numbers.'),
          ('Read the result', 'The checker shows whether the check digit is right and, if not, which digit it should be.'),
          ('Decode the size and type code', 'Enter the 4-character code from the door, such as 22G1 or 45G1, to see the length, height and container type.')]),
 'cbm-calculator': dict(
   before=">How it's calculated</h2>",
   section=section('CBM FORMULA', 'CBM formula, worked example and how much fits in a container',
     p('CBM (cubic metres) is length × width × height of one carton in metres, multiplied by the number of cartons. Measure in centimetres, multiply the three sides and divide by 1,000,000.') +
     h3('Worked example') +
     p('120 cartons of 60 × 40 × 50 cm: 60 × 40 × 50 = 120,000 cm³ = 0.12 CBM per carton. 0.12 × 120 = <b>14.4 CBM</b>. At 18 kg a carton the gross weight is 2,160 kg.') +
     ul(['<b>Sea LCL</b>: freight is charged per revenue ton, the higher of CBM or tonnes (1 CBM = 1,000 kg). 14.4 CBM against 2.16 tonnes is charged as 14.4 revenue tons. Most consolidators have a minimum of 1 CBM.',
         '<b>Air freight</b>: chargeable weight is the higher of gross weight and volume weight, where volume weight = CBM × 167 kg (the 6,000 cm³ per kg rule). 14.4 CBM is 2,405 kg volume weight, so 2,405 kg is charged.',
         '<b>Courier</b>: most express companies divide cm³ by 5,000, so 1 CBM counts as 200 kg.']) +
     h3('How many CBM fit in a container') +
     table(['Container', 'Inside size (L × W × H)', 'Nominal volume', 'Practical load for cartons', 'Max payload (typical)'],
           [['20 ft standard', '5.90 × 2.35 × 2.39 m', '33 CBM', '25 to 28 CBM', 'about 28,000 kg'],
            ['40 ft standard', '12.03 × 2.35 × 2.39 m', '67 CBM', '55 to 58 CBM', 'about 26,500 kg'],
            ['40 ft high cube', '12.03 × 2.35 × 2.69 m', '76 CBM', '65 to 68 CBM', 'about 26,400 kg'],
            ['45 ft high cube', '13.56 × 2.35 × 2.69 m', '86 CBM', '72 to 76 CBM', 'about 27,700 kg']]) +
     p('The practical figure is lower than the nominal volume because cartons never fill every gap. Sizes and payloads vary by owner and box; check the CSC plate and the line’s equipment sheet. To see exactly how your cartons stack, with weight and the number of boxes that fit, use the free <a href="container-load-planner" style="%s">3D container load planner</a> or the full <a href="container-sizes" style="%s">container sizes guide</a>.' % (A, A))),
   faq=[('How do I calculate CBM in cm?', 'Multiply length × width × height in centimetres and divide by 1,000,000. A 50 × 40 × 30 cm carton is 60,000 cm³, or 0.06 CBM. Multiply by the number of cartons for the total.'),
        ('How many cartons fit in a 20 ft container?', 'Divide the practical load of about 25 to 28 CBM by the CBM of one carton. 0.06 CBM cartons give roughly 420 to 460 cartons, if the weight stays under the payload. The 3D load planner gives the exact count for your carton size.')],
   steps=[('Choose the units', 'Pick centimetres, millimetres, metres or inches, and kilograms or pounds.'),
          ('Enter each box size', 'Enter length, width, height, weight and the number of boxes. Add another box size for mixed cargo.'),
          ('Read CBM and chargeable weight', 'See total CBM, sea revenue tons, air and courier volumetric weight, and which containers the cargo fits.')]),
 'landed-cost-calculator': dict(
   before='>Good to know.</h2>',
   section=section('HOW IT IS WORKED OUT', 'Landed cost in India: the duty sum, step by step',
     p('Customs duty in India is charged on the <b>assessable value</b>: the CIF value of the goods (cost, insurance and freight to the Indian port) converted to rupees at the CBIC <a href="customs-exchange-rates" style="%s">customs exchange rate</a> for the date the bill of entry is filed. The usual layers are:' % A) +
     table(['Layer', 'Charged on', 'Typical rate'],
           [['Basic customs duty (BCD)', 'Assessable value', 'Set by the tariff line, often 0% to 20%; lower under a trade agreement'],
            ['Agriculture infrastructure and development cess (AIDC)', 'Assessable value', 'Only on certain goods, such as some edible oils, gold and silver; often with a matching cut in BCD'],
            ['Social welfare surcharge (SWS)', 'Basic customs duty (and AIDC where levied)', '10% on most goods; some goods are exempt'],
            ['IGST', 'Assessable value + BCD + SWS (+ AIDC)', '5%, 18% or 40% under the current GST rates for most goods; 0% for some'],
            ['GST compensation cess', 'As for IGST', 'Only on a few goods such as tobacco products'],
            ['Anti-dumping or safeguard duty', 'Assessable value', 'Only for listed goods and countries, notified separately']]) +
     h3('Worked example') +
     p('Goods with a CIF value of ₹1,00,000, BCD 10%, SWS 10% and IGST 18%:') +
     table(['Line', 'Sum', 'Amount'],
           [['Basic customs duty', '10% of ₹1,00,000', '₹10,000'], ['Social welfare surcharge', '10% of ₹10,000', '₹1,000'],
            ['IGST', '18% of ₹1,11,000', '₹19,980'], ['<b>Total duty and tax paid at customs</b>', '', '<b>₹30,980</b>'],
            ['Less IGST you can claim back as input tax credit', '', '− ₹19,980'], ['<b>Real cost of duty if you are GST registered</b>', '', '<b>₹11,000</b>']]) +
     p('So the cash you pay at customs and the cost that stays in your product are two different numbers. A GST-registered importer who uses the goods in a taxable business normally gets the IGST back as credit; an unregistered buyer or a personal import does not. Add port and CFS charges, the customs broker’s fee, transport to your warehouse and any bank charges to get the full landed cost per unit, which this calculator does.') +
     p('Rates on this page are examples. Get the rates for your own product from the <a href="customs-duty-calculator" style="%s">import duty calculator</a> and check the latest <a href="trade-notifications" style="%s">customs notifications</a> before you price a deal.' % (A, A))),
   faq=[('Is IGST on imports part of my landed cost?', 'You pay it in cash at customs, so it is part of the money you need to clear the goods. If you are GST registered and use the goods in your taxable business, you can usually claim it back as input tax credit, so it drops out of the real cost of the product. If you cannot claim the credit, it stays in the cost.'),
        ('Is social welfare surcharge charged on the total value?', 'No. Social welfare surcharge is a percentage (usually 10%) of the basic customs duty, not of the value of the goods. On goods with 10% basic duty, it adds 1% of the value.')],
   steps=[('Enter the goods and invoice', 'Add the product, HSN code, quantity and invoice value with its currency and Incoterm.'),
          ('Add freight, insurance and local costs', 'Enter freight and insurance if the price is not CIF, plus port, CFS, clearing and transport charges.'),
          ('Read the landed cost', 'See each duty line, the IGST you can claim back, and the landed cost in total and per unit.')]),
 'icegate-status-guide': dict(
   title='ICEGATE Bill of Entry Status & Shipping Bill Status: How to Check, What Each Status Means | YAM Logistics',
   desc='How to check bill of entry status and shipping bill status on ICEGATE, what you need (port code, number, date), and what each status means, from assessment and payment to Out of Charge, Let Export Order and IGST refund codes.',
   before='>Good to know.</h2>',
   section=section('STEP BY STEP', 'How to check bill of entry status on ICEGATE',
     p('At the time of writing, ICEGATE shows the clearance status of a bill of entry only after you log in. Your customs broker can always see it in their filing system and send you the screen. To check it yourself:') +
     ol(['Log in to ICEGATE with the importer’s or the customs broker’s registered ID.',
         'Open the bill of entry enquiry (current status) under the documents or enquiry menu.',
         'Enter the three details from the bill of entry: the <b>port code</b> (six characters, such as INNSA1 for Nhava Sheva or INDEL4 for Delhi air cargo; see the <a href="port-airport-codes" style="%s">port code finder</a>), the <b>bill of entry number</b> (seven digits) and the <b>bill of entry date</b>.' % A,
         'Read the dates on the status line: filing, assessment, duty payment, examination and Out of Charge. The status codes are explained in the lookup above.']) +
     p('For a <b>shipping bill</b>, the same three details give the export status: Let Export Order, EGM filed, and the scroll status of drawback and IGST refund. Importers who only need the bill of entry details for GST input tax credit can also search them on the GST portal under Services, then User Services, then Search BoE.') +
     h3('The common bill of entry stages') +
     table(['Stage', 'What it means', 'What you do'],
           [['Filed / pending for assessment', 'The bill of entry is with customs for checking the value, classification and duty.', 'Wait, or answer a query if one is raised.'],
            ['Query raised', 'The assessing officer wants a document or an explanation.', 'Your broker replies on ICEGATE with the documents.'],
            ['Assessed, duty unpaid', 'Duty is worked out.', 'Pay the duty online; late payment adds interest.'],
            ['Examination order', 'Customs will open and check the cargo at the port or CFS.', 'Your broker arranges the examination with the custodian.'],
            ['Out of Charge (OOC)', 'Customs has cleared the goods.', 'Pay port and CFS charges and take delivery.']])),
   faq=[('Can I check bill of entry status without logging in?', 'At the time of writing, ICEGATE shows clearance status only after login. Ask your customs broker, who sees it in their filing system, or log in with the importer’s ICEGATE ID.'),
        ('What details do I need to check bill of entry status?', 'The port code (six characters, such as INNSA1), the bill of entry number and the bill of entry date. For a shipping bill you need the port code, shipping bill number and date.')],
   steps=[('Log in to ICEGATE', 'Use the importer’s or customs broker’s registered ICEGATE ID.'),
          ('Enter port code, number and date', 'Enter the six-character port code and the bill of entry or shipping bill number and date.'),
          ('Read the status', 'Look up any status code on this page to see what it means and what to do next.')]),
 'customs-exchange-rates': dict(
   before='>Good to know.</h2>',
   section=section('HOW IT WORKS', 'How CBIC customs exchange rates work',
     p('Customs in India does not use the bank or RBI rate to value goods. Under section 14 of the Customs Act, 1962, CBIC notifies its own conversion rates, usually twice a month, in a notification numbered “Customs (N.T.)”. Each new notification replaces the last one.') +
     ul(['<b>Two rates for each currency</b>: an import rate and a slightly lower export rate. Imports use the import column, exports the export column.',
         '<b>Schedule I</b> gives the rupee value of one unit of currencies such as the US dollar, euro, pound and UAE dirham.',
         '<b>Schedule II</b> gives the value of 100 units for currencies with a small unit value, such as the Japanese yen and Korean won.',
         '<b>Which date applies</b>: for imports, the rate in force on the date the bill of entry is filed (or on the date of arrival, if it is filed before arrival). For exports, the rate in force on the date the shipping bill is filed.']) +
     h3('Worked example') +
     p('An invoice of USD 10,000 CIF, filed while the notified import rate is ₹88.00 (an example figure): assessable value = 10,000 × 88.00 = ₹8,80,000. Duty is worked out on that rupee value. Use the current rate shown above for real filings.') +
     p('The <a href="customs-duty-calculator" style="%s">import duty calculator</a> and the <a href="landed-cost-calculator" style="%s">landed cost calculator</a> on this site convert foreign-currency values at these rates.' % (A, A))),
   faq=[('How often do customs exchange rates change in India?', 'CBIC usually notifies new rates twice a month, and sometimes more often when currencies move sharply. Each notification states the date from which it applies.'),
        ('Why is the customs rate different from the bank rate?', 'Customs uses the rates CBIC notifies under section 14 of the Customs Act, so every importer and exporter is valued at the same rate for the same period. Your bank converts your actual payment at its own rate on the day you pay.')],
   steps=[('Pick the currency', 'Find the invoice currency in the table or type it in the search.'),
          ('Use the right column', 'Use the import rate for a bill of entry and the export rate for a shipping bill.'),
          ('Convert the value', 'Multiply the invoice value by the rate to get the rupee value customs will use.')]),
 'india-transit-times': dict(
   before='>Good to know.</h2>',
   section=section('WHAT CHANGES IT', 'What changes the sea transit time from India',
     p('The days shown above are typical port-to-port times. Your actual shipment can be quicker or slower for these reasons:') +
     ul(['<b>Load port</b>: west-coast ports such as Mundra and Nhava Sheva have the most direct services to Europe, the Gulf, Africa and the Americas. East-coast ports such as Chennai and Kolkata are quicker to South East Asia and the Far East.',
         '<b>Direct or transhipment</b>: a direct service is fastest. Transhipment at Colombo, Singapore, Jebel Ali or another hub usually adds three to ten days, more if the connection is missed.',
         '<b>Route</b>: since late 2023 many services to Europe, the Mediterranean and the US East Coast go round the Cape of Good Hope instead of through the Red Sea and Suez, which adds roughly 10 to 14 days. Lines change routings at short notice, so confirm with the line.',
         '<b>Inland legs</b>: from an inland container depot such as Tughlakabad, Dadri or Ludhiana, add rail time to the port, usually two to five days, and the gate-in cut-off.',
         '<b>Clearance and door delivery</b>: door-to-door adds export clearance, destination clearance and delivery, often a week or more on top of the sea time.']) +
     p('Air freight from Delhi, Mumbai, Chennai or Bengaluru reaches most countries in two to eight days including handling. For a quote with the actual sailing, use the <a href="freight-quote-checker" style="%s">freight quote checker</a> or ask us.' % A)),
   faq=[('Why is my shipment taking longer than the transit time shown?', 'The usual reasons are transhipment at a hub, a longer routing round the Cape of Good Hope, port congestion, a missed connection or an inland leg from an ICD. Ask the line or your forwarder for the vessel schedule and the transhipment port.')],
   steps=[('Choose the destination country', 'Search the country you are shipping to.'),
          ('Compare sea and air', 'See typical port-to-port sea days and airport-to-airport air days from India.'),
          ('Plan the full journey', 'Add inland, clearance and delivery time to the sea or air time for a door-to-door estimate.')]),
 'port-airport-codes': dict(
   before='>Good to know.</h2>',
   section=section('CODE FORMATS', 'UN/LOCODE, Indian customs port codes and IATA codes',
     p('Three kinds of location code appear on shipping and customs documents. They look alike but are not interchangeable:') +
     table(['Code', 'Format', 'Example', 'Where it is used'],
           [['UN/LOCODE', '5 characters: 2-letter country + 3-letter place', 'INNSA (Nhava Sheva), INMUN (Mundra), AEJEA (Jebel Ali)', 'Bookings, bills of lading, carrier and EDI systems worldwide'],
            ['Indian customs location code', '6 characters: UN/LOCODE + 1 digit for the type of location', 'INNSA1 (sea port), INDEL4 (Delhi air cargo), INTKD6 (ICD Tughlakabad)', 'Bills of entry, shipping bills, GST export and import invoices, ICEGATE'],
            ['IATA airport code', '3 letters', 'DEL, BOM, MAA, DXB', 'Air waybills, airline bookings']]) +
     p('In the Indian customs code the last digit tells you the type of location: 1 is a sea port, 4 an air cargo complex and 6 an inland container depot, among others. The bill of entry and shipping bill numbers are always read together with the port code, because the same number can exist at two ports.') +
     p('For the status of a bill of entry or shipping bill, see the <a href="icegate-status-guide" style="%s">ICEGATE status guide</a>; for days between ports, see <a href="india-transit-times" style="%s">transit times from India</a>.' % (A, A))),
   faq=[('What is the port code for GST export invoices?', 'GST export invoices use the six-character Indian customs port code of the port of export, such as INNSA1 for Nhava Sheva, INMUN1 for Mundra or INDEL4 for Delhi air cargo, together with the shipping bill number and date.'),
        ('What is the difference between INNSA and INNSA1?', 'INNSA is the UN/LOCODE for Nhava Sheva, used in bookings and on bills of lading. INNSA1 is the Indian customs location code for the Nhava Sheva sea port, used on bills of entry, shipping bills and GST invoices.')],
   steps=[('Type a place or code', 'Search by port, airport or city name, or by a code you want to decode.'),
          ('Pick the right code type', 'Use UN/LOCODE for bookings, the 6-character customs code for bills of entry, shipping bills and GST, and the IATA code for air waybills.'),
          ('Copy the code', 'Copy the code into your document or booking.')]),
}

def run(slug, c):
    f = R + slug + '.html'
    s = open(f, encoding='utf-8').read()
    if c.get('title'):
        T, D = E(c['title']), E(c['desc'])
        s = re.sub(r'<title>[^<]*</title>', '<title>%s</title>' % T, s, count=1)
        s = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + D, s, count=1)
        s = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + T, s, count=1)
        s = re.sub(r'(<meta property="og:description" content=")[^"]*', lambda m: m.group(1) + D, s, count=1)
    s = re.sub(r'<!--seo-r2-->.*?<!--/seo-r2-->\n?', '', s, flags=re.S)
    s = re.sub(r'<!--seo-r2f-->.*?<!--/seo-r2f-->', '', s, flags=re.S)
    h = s.find(c['before']); w = s.rfind('<div style="background', 0, h)
    assert h > 0 and w > 0, slug
    s = s[:w] + c['section'] + s[w:]
    if c['faq']:
        h = s.find(c['before']) + len(c['before'])
        s = s[:h] + '\n<!--seo-r2f-->' + ''.join(DET % (q, a) for q, a in c['faq']) + '<!--/seo-r2f-->' + s[h:]
    m = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', s, re.S)
    d = json.loads(m.group(2)); g = d['@graph']
    g[:] = [n for n in g if n.get('@type') != 'HowTo']
    name = None
    for n in g:
        if n.get('@type') == 'WebPage':
            if c.get('title'):
                n['name'] = c['title'].replace(' | YAM Logistics', ''); n['description'] = c['desc']
            name = n['name']
        if n.get('@type') == 'FAQPage' and c['faq']:
            have = {q['name'] for q in n['mainEntity']}
            for q, a in c['faq']:
                if q not in have:
                    n['mainEntity'].append({'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': re.sub(r'<[^>]+>', '', a)}})
    if c.get('steps'):
        hw = {'@type': 'HowTo', 'name': (name or slug).split(':')[0].split(' (')[0] + ': how to use it',
              'step': [{'@type': 'HowToStep', 'position': i + 1, 'name': a, 'text': b, 'url': SITE + slug} for i, (a, b) in enumerate(c['steps'])]}
        g.append(hw)
    s = s[:m.start(2)] + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + s[m.end(2):]
    open(f, 'w', encoding='utf-8').write(s)
    tf = R + slug + '.tpl.json'
    if os.path.exists(tf):   # page body is mounted at runtime from this template: put the same content there
        j = json.load(open(tf, encoding='utf-8')); h = j['h']
        h = re.sub(r'<!--seo-r2-->.*?<!--/seo-r2-->\n?', '', h, flags=re.S)
        h = re.sub(r'<!--seo-r2f-->.*?<!--/seo-r2f-->', '', h, flags=re.S)
        i = h.find(c['before']); w = h.rfind('<div style="background', 0, i); assert i > 0 and w >= 0, tf
        h = h[:w] + c['section'] + h[w:]
        if c['faq']:
            i = h.find(c['before']) + len(c['before'])
            h = h[:i] + '<!--seo-r2f-->' + ''.join(DET % (q, a) for q, a in c['faq']) + '<!--/seo-r2f-->' + h[i:]
        j['h'] = h; json.dump(j, open(tf, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print('  + template', tf)
    print(slug, 'faq+', len(c['faq']), 'steps', len(c.get('steps', [])))

for k, v in PAGES.items():
    run(k, v)
