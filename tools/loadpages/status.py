import sys
sys.path.insert(0, '/root/dbg/lp')
from lib import *
ROWS = [
 ('BKD', 'Booked', 'Space is booked on a flight. The airline may not have the cargo yet.'),
 ('FOH', 'Freight on hand', 'The cargo is at the airline’s warehouse but is not yet accepted as ready for carriage, often because documents or screening are pending.'),
 ('RCS', 'Received from shipper', 'The airline has accepted the cargo and documents as ready for carriage. From here the airline is responsible for it.'),
 ('PRE', 'Prepared for loading', 'The cargo has been built onto a pallet or into a container for a flight.'),
 ('MAN', 'Manifested', 'The cargo is listed on the manifest of a specific flight.'),
 ('DEP', 'Departed', 'The flight carrying the cargo has left. Check the piece count: part shipments show fewer pieces than booked.'),
 ('TFD', 'Transferred to another airline', 'The cargo has been handed to another carrier for the next leg.'),
 ('RCT', 'Received from another airline', 'The next carrier has taken the cargo over.'),
 ('TRM', 'To be transferred', 'The cargo is listed for transfer to another airline.'),
 ('ARR', 'Arrived', 'The flight has arrived at the airport shown. The cargo is not yet checked into the warehouse.'),
 ('RCF', 'Received from flight', 'The cargo has been unloaded and checked into the airline’s warehouse at that airport.'),
 ('AWR', 'Documents received', 'The documents that travelled with the flight have arrived at the destination office.'),
 ('NFD', 'Notified for delivery', 'The consignee or their agent has been told the cargo is ready to collect.'),
 ('AWD', 'Documents delivered', 'The arrival documents have been handed to the consignee or their agent.'),
 ('CRC', 'Reported to customs', 'The shipment details have been reported to customs.'),
 ('TGC', 'Transferred to customs', 'The cargo has been moved into customs or other government control.'),
 ('CCD', 'Customs cleared', 'Customs has cleared the cargo.'),
 ('DLV', 'Delivered', 'The cargo has been handed to the consignee or their agent. The airline’s job is finished.'),
 ('DDL', 'Delivered to door', 'The cargo has been delivered to the consignee’s address.'),
 ('DIS', 'Discrepancy', 'Something does not match. A second code says what: see the next table.'),
]
DIS = [('OFLD', 'Offloaded', 'The cargo was taken off the planned flight, usually for space or weight, and will go on a later one.'),
 ('SSPD', 'Short shipped', 'Fewer pieces travelled than were manifested. The rest should follow.'),
 ('MSCA', 'Missing cargo', 'Pieces listed on the manifest were not found when the flight was unloaded.'),
 ('FDCA', 'Found cargo', 'Cargo was found that was not on the manifest.'),
 ('OVCD', 'Overcarried', 'The cargo was carried past its destination and must be sent back.'),
 ('MSAW', 'Missing air waybill', 'The cargo arrived but its documents did not.')]
B = lambda c: '<b style="font-family:\'Geist Mono\',monospace">%s</b>' % c
body = section(
    h2('THE CODES IN ORDER', 'Air cargo status codes, from booking to delivery') +
    p('Airlines report the progress of a shipment with three-letter codes from the IATA cargo messaging standard. Every airline’s tracking page uses the same codes, so once you know them you can read any air waybill status.') +
    table(['Code', 'Stands for', 'What it means for you'], [[B(c), e(n), e(d)] for c, n, d in ROWS], left=True) +
    btn('track-shipment', 'Track an air waybill') + btn('tracking/', 'All airlines and ports', True)
) + section(
    h2('WHEN SOMETHING IS WRONG', 'Discrepancy codes that follow DIS') +
    table(['Code', 'Stands for', 'What it means for you'], [[B(c), e(n), e(d)] for c, n, d in DIS], left=True) +
    h2('STUCK ON ONE STATUS', 'What a status that does not move usually means') +
    ul(['<b>Stuck on BKD or FOH.</b> The airline does not yet treat the cargo as ready. Ask the forwarder whether screening, the documents or the dangerous goods check is pending.',
        '<b>RCS but no DEP.</b> The cargo is accepted but has not flown. Common reasons are a full flight, an offload, or a cut-off missed by minutes. Ask for the flight it is now booked on.',
        '<b>DEP with fewer pieces.</b> A part shipment. The remaining pieces will show their own MAN and DEP on a later flight.',
        '<b>ARR but no RCF.</b> The flight has landed and the cargo is still being broken down. At busy airports this can take several hours.',
        '<b>RCF or NFD but no DLV.</b> The airline has done its part. The cargo is waiting for the consignee: delivery order, customs clearance and terminal charges.']) +
    h3('Clearing air cargo in India after NFD') +
    p('For an import into India the terminal will not release cargo on NFD alone. The importer or the customs broker collects the delivery order from the airline or the forwarder, files the bill of entry, pays the duty, obtains out of charge from customs and pays the terminal charges. Free storage at air cargo terminals is short, so start the paperwork when the status shows DEP, not NFD.') +
    cards([('customs-duty-calculator', 'Customs duty calculator', 'Work out the duty before the cargo lands.'),
           ('@@LATEHREF@@', '@@LATETXT@@', 'What a late bill of entry costs.'),
           ('awb-label-generator', 'AWB label generator', 'Print IATA-style air waybill labels free.'),
           ('cbm-calculator', 'Chargeable weight calculator', 'Actual against volume weight for air freight.')]), '#FFFFFF')
n = page('air-cargo-status-codes',
   'Air Cargo Status Codes Explained: RCS, DEP, RCF, NFD, DLV | YAM Logistics',
   'What air cargo tracking codes mean: BKD, FOH, RCS, MAN, DEP, ARR, RCF, NFD, AWD, DLV and DIS, in order from booking to delivery, with what to do when a status is stuck.',
   'Air cargo status codes', 'GUIDE · AIR WAYBILL TRACKING · IATA STATUS CODES',
   'Air cargo status codes.', 'RCS, DEP, RCF, NFD and DLV in plain words.',
   'Every airline reports an air waybill with the same three-letter codes. Here is what each one means, in the order a shipment passes through them, and what to do when the status stops moving.',
   body,
   [('What does RCS mean in air cargo tracking?', 'RCS means received from shipper: the airline has accepted the cargo and documents as ready for carriage.'),
    ('What does NFD mean?', 'NFD means notified for delivery: the airline has told the consignee or their agent that the cargo has arrived and is ready to collect.'),
    ('What is the difference between ARR and RCF?', 'ARR means the flight has arrived at the airport. RCF means the cargo has been unloaded and checked into the airline’s warehouse. Some airlines show only RCF.'),
    ('What does DLV mean?', 'DLV means delivered: the cargo has been handed to the consignee or their agent and the airline’s part is finished.'),
    ('What does DIS mean on an air waybill status?', 'DIS means a discrepancy. A second code explains it, for example OFLD (offloaded), SSPD (short shipped) or MSCA (missing cargo).'),
    ('My status shows NFD. Can I collect the cargo in India?', 'Not yet. You need the delivery order, a bill of entry with out of charge from customs and the terminal charges paid before the cargo terminal releases it.')],
   cta='Have an air waybill number? Track it on the airline’s own page, free.', cta_btn='Track a shipment', cta_href='track-shipment')
f='air-cargo-status-codes.html'; t=rd(f).replace('@@LATEHREF@@','customs-late-charges-calculator').replace('@@LATETXT@@','Late filing charge calculator'); wr(f,t)
print(n, t.count('@@'))
