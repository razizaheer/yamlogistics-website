import sys
sys.path.insert(0, '/root/dbg/lp')
from lib import *

n = lambda x: '{:,}'.format(x)
def carton_table(cols, src='cartons'):
    head = ['Carton L × W × H (cm)'] + [SHORT.get(c, EQ[c]['name']) for c in cols]
    rows = []
    for k, v in CAP[src].items():
        rows.append([e(k)] + [(n(v[c]['n']) + ' <span style="color:#5E7891;font-size:13px">(' + str(v[c]['fill']) + '%)</span>') if isinstance(v[c], dict) else n(v[c]) for c in cols])
    return head, rows
def pallet_table(cols):
    head = ['Pallet (cm)'] + [SHORT.get(c, EQ[c]['name']) for c in cols]
    return head, [[e(k)] + [str(v[c]) for c in cols] for k, v in CAP['pallets'].items()]
PAL_NOTE = 'Single layer on the floor, pallets kept upright, load height 150 cm, exact inside dimensions. Overhanging cartons, wider pallets or a damaged wall can cost you one position. Stackable pallets double the count where height and weight allow.'
EX = [('Cartons 60 × 40 × 40', 60, 40, 40, 250, 12)]

made = []
def mk(slug, *a, **k): made.append((slug, a[0], page(slug, *a, **k)))

# ------------------------------------------------------------------ 20 ft
h, r = carton_table(['20gp']); ph, pr = pallet_table(['20gp', '20rf'])
body = section(
    h2('20 FT STANDARD · 20GP', 'What a 20 ft container holds') +
    p('A 20 ft standard container (20GP, also written 20′ DV) gives about 33 cubic metres inside and carries up to about 28 tonnes of cargo. It suits dense cargo that reaches the weight limit before the space runs out: tiles, chemicals in drums, metal parts, bagged rice.') +
    table(SPEC_HEAD, spec_rows(['20gp', '20rf', '20ot']), SPEC_NOTE) +
    btn(preset('dry', EX), 'Load 250 cartons into a 20 ft in 3D') + btn('container-load-planner', 'Enter your own cargo', True)
) + section(
    h2('PALLETS', 'How many pallets fit in a 20 ft container') +
    p('Eleven Euro pallets fit on the floor of a 20 ft standard container when some are turned. Standard 120 × 100 pallets give nine, and Asia 110 × 110 pallets give ten.') +
    table(ph, pr, PAL_NOTE) +
    h2('CARTONS', 'How many cartons fit in a 20 ft container') +
    p('The answer depends on the carton, so here are eight common export carton sizes. The percentage is how much of the container volume the cartons fill.') +
    table(h, r, ENGINE_NOTE), '#FFFFFF'
) + section(
    h2('BEFORE YOU BOOK', 'Four checks for a 20 ft load') +
    ul(['<b>Weight before volume.</b> At about 28 tonnes payload, cargo heavier than roughly 850 kg per cubic metre fills the weight limit first. Road limits in the country of delivery can be lower than the container limit.',
        '<b>Door height.</b> The door opening is 228 cm high, 11 cm lower than the roof inside. Tall crates must pass the door, not only fit inside.',
        '<b>Even weight.</b> Keep the centre of gravity near the middle of the length. The planner shows the weight balance and centre of gravity for every plan.',
        '<b>One 40 ft or two 20 ft?</b> A 40 ft gives twice the floor for well under twice the freight on most routes, but carries slightly less weight than a 20 ft. Light cargo goes in the 40 ft; very heavy cargo often goes in two 20 ft.']) +
    h3('More load calculators') + related('20ft-container-load-calculator')
)
mk('20ft-container-load-calculator',
   '20ft Container Load Calculator: Pallets & Cartons, Free 3D Plan | YAM Logistics',
   'Free 20 ft container load calculator. See how many pallets and cartons fit a 20GP (589 × 235 × 239 cm, 33 m³), then load your own packing list in 3D. No sign-up.',
   '20 ft container load calculator', 'FREE TOOL · 20 FT CONTAINER · 20GP · 33 M³',
   '20 ft container load calculator.', 'Know what fits before you book.',
   'Inside sizes, pallet counts and carton counts for a 20 ft standard container, worked out by the CargoKit 3D load planner. Open any example in the planner, change the numbers to your own cargo and get a loading plan, free and without signing up.',
   body,
   [('How many pallets fit in a 20 ft container?', 'On the floor in one layer: 11 Euro pallets (120 × 80 cm), 9 standard pallets (120 × 100 cm), 9 US pallets (48 × 40 in) or 10 Asia pallets (110 × 110 cm), using the usual inside size of 589 × 235 cm.'),
    ('What are the inside dimensions of a 20 ft container?', 'About 589 cm long, 235 cm wide and 239 cm high, with a door opening of 234 × 228 cm. That is roughly 33 cubic metres. Exact sizes differ slightly between container owners.'),
    ('How much weight can a 20 ft container carry?', 'About 28,200 kg of cargo in a standard 20 ft container. The road weight limit at origin or destination is often lower, so check it before loading to the maximum.'),
    ('How many CBM can I really load in a 20 ft container?', 'Plan on 26 to 30 cubic metres of cartons out of the 33 inside. Odd carton sizes leave gaps; the planner shows the real fill for your sizes.'),
    ('Is the 20 ft load calculator free?', 'Yes. It is free with no sign-up and no limit on the number of plans, including Excel import, pallet building, the PDF report and the loading video.')])

# ------------------------------------------------------------------ 40 ft
h, r = carton_table(['40gp', '40hc']); ph, pr = pallet_table(['40gp', '40hc', '45hc'])
body = section(
    h2('40 FT · 40GP · 40HC · 45HC', 'What a 40 ft container holds') +
    p('A 40 ft standard container gives about 67 cubic metres. The high cube (40HC) is 30 cm taller inside and gives about 76 cubic metres on the same floor, usually for the same or nearly the same freight. Light, bulky cargo such as garments, furniture and plastic goods almost always goes in a high cube.') +
    table(SPEC_HEAD, spec_rows(['40gp', '40hc', '45hc', '40ot']), SPEC_NOTE) +
    btn(preset('dry', [('Cartons 60 × 40 × 40', 60, 40, 40, 620, 12)]), 'Load 620 cartons into a 40 ft HC in 3D') + btn('container-load-planner', 'Enter your own cargo', True)
) + section(
    h2('PALLETS', 'How many pallets fit in a 40 ft container') +
    p('Twenty-five Euro pallets fit on the floor of a 40 ft container. Standard 120 × 100 pallets give 22 on exact dimensions; many shippers plan 20 or 21 to leave handling room. The high cube takes the same number on the floor but lets you build each pallet 30 cm higher.') +
    table(ph, pr, PAL_NOTE) +
    h2('CARTONS', 'How many cartons fit in a 40 ft container') +
    p('The high cube adds one more layer for most carton heights, which is where the extra 8.5 cubic metres goes.') +
    table(h, r, ENGINE_NOTE), '#FFFFFF'
) + section(
    h2('BEFORE YOU BOOK', 'Four checks for a 40 ft load') +
    ul(['<b>Payload is lower than a 20 ft.</b> A 40 ft standard carries about 26,700 kg, less than a 20 ft, because the box itself is heavier. Dense cargo can hit the weight limit with the container half empty.',
        '<b>Standard or high cube.</b> If your stack ends between 239 and 269 cm, only the high cube takes the last layer. The planner picks the cheaper of the two automatically.',
        '<b>Door height.</b> 228 cm on a standard and 258 cm on a high cube.',
        '<b>Mixed cartons.</b> Put heavy cartons on the floor and near the middle of the length. The planner writes the loading steps for the stuffing crew, wall by wall.']) +
    h3('More load calculators') + related('40ft-container-load-calculator')
)
mk('40ft-container-load-calculator',
   '40ft Container Load Calculator: 40GP & 40HC, Free 3D Plan | YAM Logistics',
   'Free 40 ft container load calculator for 40GP, 40 ft high cube and 45HC. See how many pallets and cartons fit, then load your own packing list in 3D. No sign-up.',
   '40 ft container load calculator', 'FREE TOOL · 40 FT · 40GP · 40HC · 45HC',
   '40 ft container load calculator.', 'Standard or high cube, see it loaded.',
   'Inside sizes, pallet counts and carton counts for 40 ft standard, 40 ft high cube and 45 ft high cube containers, worked out by the CargoKit 3D load planner. Open the example, put in your own cargo and get a loading plan, free and without signing up.',
   body,
   [('How many pallets fit in a 40 ft container?', 'On the floor in one layer: 25 Euro pallets (120 × 80 cm), 22 standard pallets (120 × 100 cm) on exact dimensions, 20 US pallets (48 × 40 in) or 20 Asia pallets (110 × 110 cm). Many shippers plan 20 or 21 standard pallets to leave room for handling.'),
    ('What is the difference between a 40 ft standard and a 40 ft high cube?', 'The high cube is about 30 cm taller inside (269 cm against 239 cm) on the same floor, which adds about 8.5 cubic metres. Length, width and floor area are the same.'),
    ('What are the inside dimensions of a 40 ft high cube container?', 'About 1,203 cm long, 235 cm wide and 269 cm high, with a door opening of 234 × 258 cm, which is roughly 76 cubic metres.'),
    ('How much weight can a 40 ft container carry?', 'About 26,700 kg in a 40 ft standard and 26,500 kg in a 40 ft high cube. Road limits are often lower.'),
    ('Is the 40 ft load calculator free?', 'Yes. Free, no sign-up and no limit on plans, with Excel import, pallet building, a PDF report and a loading video.')])

# ------------------------------------------------------------------ reefer
ph, pr = pallet_table(['20rf', '40rh'])
body = section(
    h2('REEFER · 20RF · 40HC RF', 'What a reefer container holds') +
    p('A reefer is smaller inside than a dry container of the same length because of the insulation and the cooling unit. Cargo must also stay below the red load line near the roof and off the doors, so that cold air can travel along the T-shaped floor, up the door end and back over the top.') +
    table(SPEC_HEAD, spec_rows(['20rf', '40rh']), 'The planner already keeps the load height below the red line for both reefers. Sizes differ slightly by make of container.') +
    btn(preset('reefer', [('Cartons 50 × 40 × 30', 50, 40, 30, 900, 15)]), 'Load 900 cartons into a reefer in 3D') + btn('container-load-planner', 'Enter your own cargo', True)
) + section(
    h2('PALLETS', 'How many pallets fit in a reefer container') +
    p('The narrower inside (229 cm) matters most for pallets: a 40 ft high cube reefer takes 23 Euro pallets against 25 in a dry 40 ft.') +
    table(ph, pr, PAL_NOTE), '#FFFFFF'
) + section(
    h2('BEFORE YOU BOOK', 'Loading a reefer correctly') +
    ul(['<b>Never load above the red line.</b> Cargo above it blocks the return air and the far end warms up.',
        '<b>Do not block the floor.</b> Chilled cargo needs air through the cartons, frozen cargo needs air around the block. Cover the whole floor evenly so air cannot short-circuit through a gap.',
        '<b>Pre-cool the cargo, not the container.</b> A reefer holds temperature; it is not built to pull warm cargo down.',
        '<b>Stay off the doors.</b> Leave the cargo behind the door-end mark so air can turn at the back.',
        '<b>Check the weight.</b> Frozen meat, fish and fruit are dense; a 40 ft reefer often reaches its payload before it is full.']) +
    h3('More load calculators') + related('reefer-container-load-calculator')
)
mk('reefer-container-load-calculator',
   'Reefer Container Load Calculator: 20 & 40 ft, Free 3D Plan | YAM Logistics',
   'Free reefer container load calculator. Inside sizes of 20 ft and 40 ft high cube reefers, pallet counts below the red load line, and a 3D loading plan for your cargo.',
   'Reefer container load calculator', 'FREE TOOL · REEFER · 20RF · 40HC RF',
   'Reefer container load calculator.', 'Loaded below the red line.',
   'Inside sizes and pallet counts for 20 ft and 40 ft high cube reefer containers, with the load height already kept under the red line. Open the example in the CargoKit 3D load planner and change it to your own cargo. Free, no sign-up.',
   body,
   [('How many pallets fit in a 40 ft reefer container?', 'A 40 ft high cube reefer takes 23 Euro pallets (120 × 80 cm) or 20 standard pallets (120 × 100 cm) on the floor, fewer than a dry 40 ft because the inside is only about 229 cm wide.'),
    ('How many pallets fit in a 20 ft reefer?', 'Ten Euro pallets or nine standard 120 × 100 pallets in one layer.'),
    ('What are the inside dimensions of a 40 ft high cube reefer?', 'About 1,158 cm long and 229 cm wide. The planner uses a load height of 245 cm, which keeps cargo below the red load line.'),
    ('Why is there a red line inside a reefer?', 'It marks the highest point cargo may reach. The space above it carries the return air to the cooling unit; if it is blocked, the cargo at the door end warms up.'),
    ('Is the reefer load calculator free?', 'Yes. Free, no sign-up and no limit on the number of plans.')])

# ------------------------------------------------------------------ trucks
TR = ['in20', 'in24', 'in32m', 'eu136', 'us53']
h, r = carton_table(TR, 'trucks'); h = ['Carton L × W × H (cm)', 'India 20 ft', 'India 24 ft', 'India 32 ft', 'EU 13.6 m', 'US 53 ft']
ph, pr = pallet_table(['in32m', 'eu136', 'us53']); ph = ['Pallet (cm)', 'India 32 ft', 'EU 13.6 m trailer', 'US 53 ft van']
body = section(
    h2('TRUCKS · INDIA · EUROPE · USA', 'Truck and trailer sizes in the planner') +
    p('Most online load calculators only know containers. The CargoKit planner also loads the trucks that actually carry cargo to the port or the customer: Indian closed-body and container trucks, the European 13.6 metre trailer and the American 53 ft dry van.') +
    table(SPEC_HEAD, spec_rows(['in20', 'in24', 'in32s', 'in32m', 'eu136', 'us53']), 'Typical inside sizes. Indian truck bodies vary by builder and the legal payload depends on the vehicle registration and the axle rules, so check the truck that is sent.') +
    btn(preset('truck', [('Cartons 60 × 40 × 40', 60, 40, 40, 500, 12)]), 'Load 500 cartons into an Indian truck in 3D') + btn(preset('truck', [('Pallets 120 × 80', 120, 80, 150, 33, 400)], truck='eu'), 'Load 33 Euro pallets on an EU trailer', True)
) + section(
    h2('CARTONS', 'How many cartons fit in a truck') +
    table(h, r, ENGINE_NOTE) +
    h2('PALLETS', 'How many pallets fit in a truck or trailer') +
    p('A European 13.6 metre trailer takes 33 Euro pallets and an American 53 ft van takes 30 pallets of 48 × 40 inches in one layer on these inside sizes. Many US loads are planned at 26 pallets, loaded straight, to stay inside axle weight limits.') +
    table(ph, pr, PAL_NOTE), '#FFFFFF'
) + section(
    h2('BEFORE YOU LOAD', 'What changes with a truck') +
    ul(['<b>Payload is the limit far more often.</b> A single-axle Indian 32 ft truck has a big body but carries about 7 tonnes; the multi-axle version carries about 15.',
        '<b>Axle loads.</b> Heavy cargo placed at one end can overload an axle even when the total weight is legal. Keep heavy pieces between the axles.',
        '<b>Side or rear loading.</b> Curtainsiders load from the side, so pallets can go in any order. Closed bodies load from the rear, so the last delivery goes in first.',
        '<b>Match the truck to the container.</b> Planning the truck and the container with the same cartons shows whether one truck fills one container or leaves cargo behind at the factory.']) +
    h3('More load calculators') + related('truck-load-calculator')
)
mk('truck-load-calculator',
   'Truck Load Calculator: India 32 ft, EU Trailer, US 53 ft, Free 3D | YAM Logistics',
   'Free truck load calculator for Indian 20, 24 and 32 ft trucks, the EU 13.6 m trailer and the US 53 ft van. Carton and pallet counts plus a 3D loading plan. No sign-up.',
   'Truck load calculator', 'FREE TOOL · TRUCKS · INDIA · EUROPE · USA',
   'Truck load calculator.', 'From 20 ft trucks to 53 ft trailers.',
   'Inside sizes, carton counts and pallet counts for Indian 20, 24 and 32 ft trucks, the European 13.6 metre trailer and the US 53 ft dry van. Open an example in the CargoKit 3D load planner and change it to your own cargo. Free, no sign-up.',
   body,
   [('How many pallets fit in a 53 ft trailer?', 'Up to 30 pallets of 48 × 40 inches in one layer on the inside size the planner uses (1,600 × 249 cm). Many loads are planned at 26 pallets, loaded straight, to keep within axle weight limits.'),
    ('How many Euro pallets fit on a 13.6 m trailer?', '33 Euro pallets (120 × 80 cm) in one layer, which is the standard full load in Europe.'),
    ('What is the size of a 32 ft truck in India?', 'About 975 cm long, 236 cm wide and 244 cm high inside. The single-axle type (SXL) carries about 7 tonnes and the multi-axle type (MXL) about 15 tonnes, depending on registration.'),
    ('Can I plan a truck and a container together?', 'Yes. Enter the cargo once, then switch between containers and trucks in the planner to see how the same cartons load in each.'),
    ('Is the truck load calculator free?', 'Yes. Free, no sign-up and no limit on plans.')])

# ------------------------------------------------------------------ air ULD
U = ['pmc-ld', 'pmc-md', 'pag-ld', 'ake', 'akh']
h, r = carton_table(U, 'uld'); h = ['Carton L × W × H (cm)', 'PMC lower deck', 'PMC main deck', 'PAG lower deck', 'AKE / LD3', 'AKH']
body = section(
    h2('AIR CARGO · PMC · PAG · AKE · AKH · LD7', 'Air pallets and containers in the planner') +
    p('Air cargo is built up on pallets and into containers called unit load devices (ULDs). The two questions before booking are how many pieces go on one pallet at the height the aircraft allows, and how many pallets the shipment needs. The planner answers both and draws the build-up.') +
    table(SPEC_HEAD, spec_rows(['pmc-ld', 'pmc-md', 'pag-ld', 'pag-md', 'ake', 'akh', 'ld7']), 'Usable base inside the net and typical build heights. The aircraft contour is not modelled: the planner treats each unit as a box, so the airline or handler confirms the final build-up.') +
    btn('container-load-planner#air', 'Open the planner on air cargo') + btn(preset('uld', [('Cartons 50 × 40 × 30', 50, 40, 30, 300, 9)]), 'Build 300 cartons on air pallets in 3D', True)
) + section(
    h2('CARTONS', 'How many cartons fit on an air pallet') +
    p('Lower-deck pallets are built to 160 cm and main-deck pallets on freighters to 244 cm, which is why the same PMC takes about half as many cartons again on the main deck.') +
    table(h, r, 'Counts from the CargoKit engine on the box sizes above, cartons turned any way up. Air cargo usually reaches a weight or contour limit before the box is full, so treat these as the upper end.'), '#FFFFFF'
) + section(
    h2('BEFORE YOU BOOK', 'Four checks for an air shipment') +
    ul(['<b>Chargeable weight.</b> Airlines charge on the greater of actual weight and volume weight (length × width × height in cm ÷ 6,000 per piece). The <a href="cbm-calculator" style="color:#0A6CC2">CBM and chargeable weight calculator</a> works it out.',
        '<b>Lower deck or main deck.</b> Passenger aircraft take cargo only in the lower deck, with a height limit of about 160 cm. Taller pieces need a freighter.',
        '<b>Door size.</b> A piece must pass the aircraft cargo door as well as fit the pallet. Ask the airline for the door size of the aircraft on your route.',
        '<b>Dangerous goods.</b> Lithium batteries and other dangerous goods have their own limits per package. Check them with the <a href="dg-cargo-checker" style="color:#0A6CC2">DG cargo checker</a> before building the pallet.']) +
    h3('More load calculators') + related('air-cargo-uld-load-calculator')
)
mk('air-cargo-uld-load-calculator',
   'Air Cargo ULD Load Calculator: PMC, PAG, AKE Pallets, Free 3D | YAM Logistics',
   'Free air cargo ULD load calculator. Sizes of PMC and PAG pallets, AKE, AKH and LD7 containers, carton counts for each, and a 3D build-up plan for your shipment.',
   'Air cargo ULD load calculator', 'FREE TOOL · AIR CARGO · PMC · PAG · AKE · LD7',
   'Air cargo ULD load calculator.', 'Build the pallet before the cargo moves.',
   'Sizes and carton counts for PMC and PAG air pallets and AKE, AKH and LD7 containers, worked out by the CargoKit 3D load planner. Open the example and change it to your own shipment. Free, no sign-up.',
   body,
   [('What is the size of a PMC air pallet?', 'The usable base inside the net is about 307 × 233 cm. It is built to about 160 cm high for the lower deck and up to 244 cm on the main deck of a freighter.'),
    ('What is the difference between a PMC and a PAG pallet?', 'Both are 307 cm long. The PMC is 233 cm wide and the PAG 213 cm wide on the usable base, so the PAG takes slightly less cargo.'),
    ('What is an AKE or LD3 container?', 'A lower-deck air container used on wide-body aircraft. The planner uses a box of 150 × 147 × 157 cm inside and a payload of about 1,500 kg.'),
    ('Does the planner model the aircraft contour?', 'No. Each pallet or container is planned as a box, so the airline or the ground handler confirms the final build-up.'),
    ('Is the air cargo load calculator free?', 'Yes. Free, no sign-up and no limit on plans.')])

# ------------------------------------------------------------------ pallet
PP = ['euro', 'uspal', 'asia']
h, r = carton_table(PP, 'perPallet'); h = ['Carton L × W × H (cm)', 'Euro 120 × 80', 'Standard 120 × 100', 'Asia 110 × 110']
body = section(
    h2('PALLETS · EURO · STANDARD · ASIA · US', 'How many cartons fit on a pallet') +
    p('The planner builds pallets for you. Choose the pallet, the maximum height and the maximum weight; it stacks the cartons, shows each pallet in 3D and then loads the finished pallets into the container or truck.') +
    table(h, r, 'Cartons on one pallet at a load height of 160 cm (pallet deck not included), cartons turned any way up, no overhang. From the CargoKit engine. A lower height limit, a weight limit or cartons that must stay upright reduce the count.') +
    btn('container-load-planner#pallets', 'Build pallets in the planner') + btn('how-many-pallets-fit-in-a-container', 'Pallets per container', True)
) + section(
    h2('PALLET SIZES', 'The four pallets most shipments use') +
    table(['Pallet', 'Size (cm)', 'Where it is used'],
          [['Euro (EPAL)', '120 × 80', 'Europe; fits European trailers three across'],
           ['Standard', '120 × 100', 'UK, parts of Europe and Asia, much of India'],
           ['US (GMA)', '121.9 × 101.6 (48 × 40 in)', 'North America'],
           ['Asia', '110 × 110', 'Japan, Korea and much of East Asia; two across in a container']]) +
    ul(['<b>Height.</b> A pallet deck is about 15 cm. A common limit is 160 to 180 cm overall for sea freight and 160 cm for the lower deck of an aircraft.',
        '<b>Weight.</b> Many pallets are rated for 1,000 kg evenly spread. Racking and the buyer’s warehouse can set a lower limit.',
        '<b>Overhang.</b> Cartons that hang over the edge get crushed and cost a pallet position in the container. Choose a carton size that divides into the pallet.',
        '<b>Wood treatment.</b> Wooden pallets for export need ISPM 15 heat treatment and the stamp.'], ) +
    h3('More load calculators') + related('pallet-load-calculator'), '#FFFFFF'
)
mk('pallet-load-calculator',
   'Pallet Load Calculator: Cartons per Pallet, Free 3D Builder | YAM Logistics',
   'Free pallet load calculator. See how many cartons fit on a Euro, standard or Asia pallet, then build your own pallets in 3D and load them into a container.',
   'Pallet load calculator', 'FREE TOOL · PALLETS · EURO · STANDARD · ASIA · US',
   'Pallet load calculator.', 'Cartons per pallet, then pallets per container.',
   'Carton counts for Euro, standard and Asia pallets, worked out by the CargoKit 3D load planner. Build your own pallets with a height and weight limit, then load them into a container or truck. Free, no sign-up.',
   body,
   [('How many cartons fit on a Euro pallet?', 'It depends on the carton. For example 20 cartons of 60 × 40 × 30 cm or 25 cartons of 50 × 40 × 30 cm fit on a Euro pallet at a load height of 160 cm with no overhang.'),
    ('What is the size of a standard pallet?', 'A Euro pallet is 120 × 80 cm, the ISO standard pallet 120 × 100 cm, the US pallet 48 × 40 inches (121.9 × 101.6 cm) and the Asia pallet 110 × 110 cm.'),
    ('How high can I stack a pallet?', 'A common limit is 160 to 180 cm including the pallet for sea freight and about 160 cm for the lower deck of an aircraft. Your buyer or warehouse may set a lower limit.'),
    ('Can the planner build mixed pallets?', 'Yes. It builds full pallets of one carton first and then mixed pallets from what is left, and shows each one.'),
    ('Is the pallet calculator free?', 'Yes. Pallet building is free with no trial, no sign-up and no limit.')])

# ------------------------------------------------------------------ how many pallets
ALLC = ['20gp', '40gp', '40hc', '45hc', '20rf', '40rh']
ph, pr = pallet_table(ALLC); ph = ['Pallet (cm)', '20 ft', '40 ft', '40 ft HC', '45 ft HC', '20 ft reefer', '40 ft HC reefer']
th, tr = pallet_table(['in32m', 'eu136', 'us53']); th = ['Pallet (cm)', 'India 32 ft truck', 'EU 13.6 m trailer', 'US 53 ft van']
body = section(
    h2('THE SHORT ANSWER', 'Pallets per container') +
    p('A 20 ft container takes 11 Euro pallets or 9 standard pallets. A 40 ft container takes 25 Euro pallets or up to 22 standard pallets. The table gives every combination, worked out by the CargoKit load planner on the usual inside dimensions.') +
    table(ph, pr, PAL_NOTE) +
    btn(preset('dry', [('Pallets 120 × 80', 120, 80, 150, 25, 500)]), 'Load 25 Euro pallets in 3D') + btn('container-load-planner#pallets', 'Build your own pallets', True)
) + section(
    h2('TRUCKS AND TRAILERS', 'Pallets per truck') +
    table(th, tr, PAL_NOTE) +
    h2('WHY THE NUMBERS DIFFER', 'Three reasons you will see other figures') +
    ul(['<b>Turning pallets.</b> Eleven Euro pallets fit a 20 ft only when one row is loaded lengthways and the other sideways. Loaded all the same way round you get eight.',
        '<b>Handling room.</b> The table uses exact inside sizes with no gaps. Twenty-two standard pallets fit a 40 ft on paper; most warehouses plan 20 or 21.',
        '<b>Weight.</b> Twenty-five pallets at 1,000 kg each is 25 tonnes, close to the payload of a 40 ft container and above many road limits. Heavy pallets are limited by weight, not floor space.',
        '<b>Double stacking.</b> If the pallets are stackable and under about 115 cm high including the pallet (125 cm in a high cube), a second layer doubles the count, again subject to weight.']) +
    h3('More load calculators') + related('how-many-pallets-fit-in-a-container'), '#FFFFFF'
)
mk('how-many-pallets-fit-in-a-container',
   'How Many Pallets Fit in a 20ft & 40ft Container? (Table) | YAM Logistics',
   'A 20 ft container fits 11 Euro or 9 standard pallets; a 40 ft fits 25 Euro or up to 22 standard pallets. Full table for every container, reefer and trailer.',
   'How many pallets fit in a container', 'ANSWER · PALLETS PER CONTAINER · 20 FT · 40 FT · HC',
   'How many pallets fit in a container?', '11 in a 20 ft, 25 in a 40 ft, and the full table.',
   'Pallet counts for every container, reefer and trailer size, for Euro, standard, US and Asia pallets, worked out by the CargoKit 3D load planner. Open the example to see the layout, or build your own pallets. Free, no sign-up.',
   body,
   [('How many pallets fit in a 20 ft container?', '11 Euro pallets (120 × 80 cm), 9 standard pallets (120 × 100 cm), 9 US pallets (48 × 40 in) or 10 Asia pallets (110 × 110 cm) in one layer.'),
    ('How many pallets fit in a 40 ft container?', '25 Euro pallets, 22 standard 120 × 100 pallets on exact dimensions (usually planned as 20 or 21), 20 US pallets or 20 Asia pallets in one layer. A 40 ft high cube takes the same number on the floor.'),
    ('How many pallets fit in a 40 ft high cube if I double stack?', 'Twice the floor count if each loaded pallet is under about 125 cm high, the pallets are stackable and the total weight stays inside the payload of about 26,500 kg.'),
    ('How many pallets fit in a 45 ft container?', '27 Euro pallets or 24 standard, US or Asia pallets in one layer.'),
    ('How many pallets fit in a reefer container?', '10 Euro or 9 standard pallets in a 20 ft reefer; 23 Euro or 20 standard pallets in a 40 ft high cube reefer.')])

# ------------------------------------------------------------------ how many cartons
h, r = carton_table(['20gp', '40gp', '40hc']); h = ['Carton L × W × H (cm)', '20 ft', '40 ft', '40 ft HC']
body = section(
    h2('THE SHORT ANSWER', 'Cartons per container') +
    p('There is no single number, because it depends on the carton. As a guide, a 20 ft container takes about 260 cartons of 60 × 40 × 40 cm and a 40 ft high cube about 660. The table covers eight common export carton sizes; for your own size, use the planner.') +
    table(h, r, ENGINE_NOTE) +
    btn(preset('dry', EX), 'See 250 cartons loaded in 3D') + btn('container-load-planner', 'Enter your own carton size', True)
) + section(
    h2('HOW TO WORK IT OUT', 'Why dividing the volumes gives the wrong answer') +
    p('Dividing 33 cubic metres by the carton volume always gives too many cartons. Cartons are rigid boxes: only whole cartons fit along each side, and what is left over is wasted. A 20 ft container is 235 cm wide, so cartons 60 cm wide go three across and leave 55 cm empty unless some are turned.') +
    ul(['<b>Step 1.</b> Count whole cartons along the length, the width and the height of the container for each way the carton can be turned.',
        '<b>Step 2.</b> Mix the turns. Turning the last row or the top layer often recovers the leftover space. This is the part a 3D planner does for you.',
        '<b>Step 3.</b> Check the weight. Multiply the count by the carton weight and compare it with the payload: about 28,200 kg for a 20 ft and 26,500 kg for a 40 ft high cube.',
        '<b>Step 4.</b> Check what must stay upright or cannot be stacked. Both reduce the count.']) +
    p('A carton that divides neatly into 235 cm and into the container height loads far better than one that does not. If you can still choose the carton size, try two or three sizes in the planner before you print the boxes; a small change can add a whole extra row or layer.') +
    h3('More load calculators') + related('how-many-cartons-fit-in-a-container'), '#FFFFFF'
)
mk('how-many-cartons-fit-in-a-container',
   'How Many Cartons Fit in a 20ft & 40ft Container? (Table) | YAM Logistics',
   'Carton counts for 20 ft, 40 ft and 40 ft high cube containers for eight common export carton sizes, worked out by a 3D load planner. Check your own carton free.',
   'How many cartons fit in a container', 'ANSWER · CARTONS PER CONTAINER · 20 FT · 40 FT · HC',
   'How many cartons fit in a container?', 'A table, the method, and a free planner.',
   'Carton counts for 20 ft, 40 ft and 40 ft high cube containers for eight common export carton sizes, worked out by the CargoKit 3D load planner. Open the example to see the layout, then enter your own carton. Free, no sign-up.',
   body,
   [('How many cartons fit in a 20 ft container?', 'It depends on the carton size. For example about 261 cartons of 60 × 40 × 40 cm, 492 of 50 × 40 × 30 cm or 760 of 40 × 30 × 30 cm, turned any way up with no gaps.'),
    ('How many cartons fit in a 40 ft high cube container?', 'For example about 660 cartons of 60 × 40 × 40 cm, 1,140 of 50 × 40 × 30 cm or 1,840 of 40 × 30 × 30 cm.'),
    ('How do I calculate how many boxes fit in a container?', 'Count whole boxes along the length, width and height for each way the box can be turned, mix the turns to use leftover space, then check the total weight against the payload. A 3D load planner does this in a second.'),
    ('Why can I not just divide the container volume by the carton volume?', 'Because only whole cartons fit along each side. The leftover strips are wasted, so real loads fill roughly 70 to 90 percent of the volume depending on the carton size.'),
    ('Does carton weight change the answer?', 'Yes. If the count times the carton weight is more than the payload (about 28,200 kg for a 20 ft), weight is the limit and the container leaves partly empty.')])

if __name__ == '__main__':
    for s, t, ln in made: print(ln, len(t), s)
