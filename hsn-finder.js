(function () {
  var root = document.getElementById('hf-root');
  if (!root) return;
  var D = null, idx = null, chFilter = null, lastIds = [];
  var CH = {
    '01': 'Live animals', '02': 'Meat and edible offal', '03': 'Fish and seafood', '04': 'Dairy, eggs and honey', '05': 'Other animal products',
    '06': 'Plants and cut flowers', '07': 'Vegetables', '08': 'Fruit and nuts', '09': 'Coffee, tea and spices', '10': 'Cereals',
    '11': 'Flour, malt and starch', '12': 'Oil seeds and other seeds', '13': 'Lac, gums and resins', '14': 'Plaiting materials', '15': 'Fats and oils',
    '16': 'Meat and fish preparations', '17': 'Sugar and confectionery', '18': 'Cocoa and chocolate', '19': 'Cereal and bakery products', '20': 'Fruit and vegetable preparations',
    '21': 'Other food preparations', '22': 'Beverages and spirits', '23': 'Animal feed and food residues', '24': 'Tobacco', '25': 'Salt, stone, earths and cement',
    '26': 'Ores, slag and ash', '27': 'Mineral fuels and oils', '28': 'Inorganic chemicals', '29': 'Organic chemicals', '30': 'Pharmaceutical products',
    '31': 'Fertilisers', '32': 'Dyes, paints and inks', '33': 'Essential oils, perfumes and cosmetics', '34': 'Soap, detergents and waxes', '35': 'Glues and enzymes',
    '36': 'Explosives, matches and fireworks', '37': 'Photographic goods', '38': 'Other chemical products', '39': 'Plastics', '40': 'Rubber',
    '41': 'Hides, skins and leather', '42': 'Leather goods and travel bags', '43': 'Furskins', '44': 'Wood', '45': 'Cork',
    '46': 'Basketware', '47': 'Wood pulp', '48': 'Paper and paperboard', '49': 'Books and printed matter', '50': 'Silk',
    '51': 'Wool', '52': 'Cotton', '53': 'Jute and other plant fibres', '54': 'Man-made filaments', '55': 'Man-made staple fibres',
    '56': 'Wadding, felt, twine and rope', '57': 'Carpets', '58': 'Special fabrics, lace and embroidery', '59': 'Coated and technical textiles', '60': 'Knitted fabrics',
    '61': 'Knitted clothing', '62': 'Woven clothing', '63': 'Home textiles and worn clothing', '64': 'Footwear', '65': 'Headgear',
    '66': 'Umbrellas', '67': 'Artificial flowers and wigs', '68': 'Stone, plaster and cement articles', '69': 'Ceramics', '70': 'Glass',
    '71': 'Jewellery, gems and precious metals', '72': 'Iron and steel', '73': 'Iron and steel articles', '74': 'Copper', '75': 'Nickel',
    '76': 'Aluminium', '78': 'Lead', '79': 'Zinc', '80': 'Tin', '81': 'Other base metals',
    '82': 'Tools and cutlery', '83': 'Other metal articles', '84': 'Machinery and mechanical appliances', '85': 'Electrical and electronic goods', '86': 'Railway equipment',
    '87': 'Vehicles and parts', '88': 'Aircraft and drones', '89': 'Ships and boats', '90': 'Optical, medical and measuring instruments', '91': 'Clocks and watches',
    '92': 'Musical instruments', '93': 'Arms and ammunition', '94': 'Furniture and lighting', '95': 'Toys, games and sports goods', '96': 'Other manufactured articles',
    '97': 'Art and antiques', '98': 'Project imports and special classifications'
  };
  // everyday words -> words used in the tariff (any alternative counts as a match)
  var SYN = {
    mobile: ['telephone', 'mobile'], smartphone: ['smartphone', 'telephone'], phone: ['telephone'], cellphone: ['telephone'],
    laptop: ['portable automatic data processing'], notebook: ['notebook'], computer: ['automatic data processing', 'computer'], pc: ['automatic data processing'],
    tablet: ['automatic data processing', 'tablet'], ipad: ['automatic data processing'], tv: ['television'], television: ['television'],
    fridge: ['refrigerator'], refrigerator: ['refrigerator'], ac: ['air conditioning'], aircon: ['air conditioning'], washing: ['washing'], microwave: ['microwave'],
    tshirt: ['t shirt', 'singlet'], tee: ['t shirt'], jeans: ['denim', 'trouser'], shirt: ['shirt'], kurta: ['shirt', 'garment'], saree: ['sari', 'saree'], sari: ['sari', 'saree'],
    shoe: ['footwear'], shoes: ['footwear'], sneaker: ['footwear'], sandal: ['footwear', 'sandal'], slipper: ['footwear', 'slipper'], chappal: ['footwear'],
    car: ['motor car', 'vehicle'], cars: ['motor car', 'vehicle'], bike: ['motorcycle', 'bicycle'], scooter: ['motorcycle', 'scooter'], ev: ['electric', 'vehicle'], truck: ['goods vehicle', 'transport of goods'],
    tyre: ['tyre'], tyres: ['tyre'], tire: ['tyre'], tires: ['tyre'],
    solar: ['photovoltaic', 'solar'], led: ['light emitting diode', 'led'], bulb: ['lamp', 'bulb'], charger: ['static converter', 'charger'], adapter: ['static converter', 'adaptor'],
    battery: ['accumulator', 'cell', 'battery'], batteries: ['accumulator', 'cell', 'battery'], powerbank: ['accumulator'], lithium: ['lithium'],
    earphone: ['earphone', 'headphone'], earphones: ['earphone', 'headphone'], headphone: ['headphone', 'earphone'], headphones: ['headphone', 'earphone'], earbuds: ['earphone', 'headphone'], speaker: ['loudspeaker'],
    watch: ['wrist watch', 'watch'], smartwatch: ['wrist', 'watch', 'telephone'], drone: ['unmanned aircraft', 'drone'], cctv: ['television camera', 'video camera'],
    cable: ['insulated wire', 'cable'], wire: ['wire'], pipe: ['pipe', 'tube'], pipes: ['pipe', 'tube'], tube: ['tube', 'pipe'],
    medicine: ['medicament'], medicines: ['medicament'], tablets: ['medicament', 'tablet'], drug: ['medicament'], vaccine: ['vaccine'],
    cosmetics: ['beauty', 'make up', 'cosmetic'], makeup: ['make up', 'beauty'], cream: ['cream', 'beauty'], shampoo: ['shampoo'], perfume: ['perfume'], soap: ['soap'],
    furniture: ['furniture'], sofa: ['seat', 'upholstered'], chair: ['seat'], bed: ['bed', 'mattress'], mattress: ['mattress'],
    toy: ['toy'], toys: ['toy'], bottle: ['bottle', 'carboy'], bottles: ['bottle', 'carboy'], box: ['box', 'carton', 'case'], carton: ['carton', 'box'], cardboard: ['paperboard', 'corrugated'],
    plastic: ['plastic', 'polymer'], steel: ['iron or steel', 'steel'], ss: ['stainless steel'], aluminum: ['aluminium'], tiles: ['tile', 'flag'], tile: ['tile', 'flag'],
    granite: ['granite'], marble: ['marble'], scrap: ['waste and scrap', 'scrap'], chilli: ['capsicum', 'pepper', 'chilli'], chili: ['capsicum', 'chilli'], chillies: ['capsicum', 'chilli'],
    rice: ['rice'], basmati: ['basmati'], tea: ['tea'], coffee: ['coffee'], cashew: ['cashew'], onion: ['onion'], potato: ['potato'], garlic: ['garlic'], ginger: ['ginger'], turmeric: ['turmeric'],
    jaggery: ['jaggery', 'cane sugar'], sugar: ['sugar'], honey: ['honey'], ghee: ['ghee', 'butter'], paneer: ['cheese', 'curd'], biscuit: ['biscuit'], biscuits: ['biscuit'], namkeen: ['food preparation'],
    oil: ['oil'], diesel: ['diesel', 'gas oil'], petrol: ['motor spirit'], lpg: ['liquefied', 'propane', 'butane'], cng: ['natural gas'],
    gold: ['gold'], silver: ['silver'], diamond: ['diamond'], jewelry: ['jewellery'], jewellery: ['jewellery'],
    mask: ['mask'], gloves: ['glove'], glove: ['glove'], syringe: ['syringe'], pump: ['pump'], motor: ['motor'], engine: ['engine'], generator: ['generating set', 'generator'],
    spare: ['parts'], spares: ['parts'], parts: ['parts'], bag: ['bag', 'handbag', 'sack'], bags: ['bag', 'handbag', 'sack'], handbag: ['handbag'], suitcase: ['trunk', 'suit case', 'suitcase'],
    printer: ['printer', 'printing'], router: ['routing', 'switching'], modem: ['modem'], cpu: ['processing unit'], ssd: ['solid state', 'storage'], harddisk: ['disk drive', 'storage'],
    camera: ['camera'], fan: ['fan'], cooler: ['air cooler', 'evaporative'], heater: ['heater', 'heating'], iron: ['iron'], mixer: ['mixer', 'grinder'], grinder: ['grinder', 'mixer'],
    incense: ['agarbatti', 'odoriferous'], agarbatti: ['agarbatti'], handicraft: ['handicraft', 'article'], idol: ['statuette', 'idol'], rakhi: ['rakhi']
  };
  var STOP = { of: 1, and: 1, the: 1, for: 1, or: 1, with: 1, in: 1, a: 1, an: 1, to: 1, other: 1, made: 1, hs: 1, hsn: 1, code: 1, codes: 1, number: 1, what: 1, is: 1, my: 1 };

  function h(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fc(c) { return c.length === 8 ? c.slice(0, 4) + ' ' + c.slice(4, 6) + ' ' + c.slice(6) : c; }
  function norm(s) { return String(s || '').toLowerCase().replace(/t[\s-]?shirts?/g, 'tshirt t shirt').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function stem(w) { return w.length > 4 ? w.replace(/(ies)$/, 'y').replace(/(es|s)$/, '') : w; }
  function sp(s) { return ' ' + norm(s).split(' ').map(stem).join(' ') + ' '; }
  var POL = { F: ['Free', 'f'], R: ['Restricted', 'r'], P: ['Prohibited', 'p'], S: ['State trading', 'r'], M: ['Free (conditions)', 'r'] };

  var css = '<style>' +
    '.hf-warn{background:#FFF8E6;border:1px solid #F5D08A;border-radius:16px;padding:14px 18px;font-size:14px;line-height:1.55;color:#4A3200;margin-bottom:16px}.hf-warn a{color:#7A3E00;font-weight:600}' +
    '.hf-card{background:#FFFFFF;border:1px solid #E1EDF7;border-radius:24px;padding:26px;box-shadow:0 10px 30px -18px rgba(11,42,74,.25)}' +
    '.hf-l{display:block;font-weight:600;font-size:14px;margin-bottom:8px;color:#0B2A4A}' +
    '.hf-in{width:100%;box-sizing:border-box;font:inherit;font-size:18px;padding:16px 18px;border:1.5px solid #C9DCEC;border-radius:16px;outline:none;color:#0B2A4A}.hf-in:focus{border-color:#0A6CC2;box-shadow:0 0 0 4px rgba(10,108,194,.12)}' +
    '.hf-ex{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;font-size:13px;color:#5E7891;align-items:center}.hf-ex button{font:inherit;font-size:13px;border:1px solid #C9DCEC;background:#F2F8FD;color:#0B2A4A;border-radius:999px;padding:6px 12px;cursor:pointer}.hf-ex button:hover{background:#E1EDF7}' +
    '.hf-ack{display:flex;gap:10px;align-items:flex-start;background:#FFFBF0;border:1px solid #F5D08A;border-radius:14px;padding:14px 16px;font-size:14px;line-height:1.5;color:#4A3200;margin-top:16px;cursor:pointer}.hf-ack input{width:20px;height:20px;flex:none;margin-top:1px;accent-color:#0A6CC2}.hf-ack a{color:#7A3E00;font-weight:600}' +
    '.hf-res{margin-top:22px}.hf-meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px;font-size:14px;color:#3D5873}' +
    '.hf-chip{font:inherit;font-size:13px;border:1px solid #C9DCEC;background:#FFFFFF;color:#0B2A4A;border-radius:999px;padding:6px 12px;cursor:pointer}.hf-chip.on{background:#0B2A4A;color:#FFFFFF;border-color:#0B2A4A}' +
    '.hf-it{border:1px solid #E1EDF7;border-radius:18px;padding:18px 20px;margin-bottom:10px;background:#FFFFFF}' +
    '.hf-c{border-color:#9FC2E6;background:#F7FBFF}.hf-tag{display:inline-block;font-family:"Geist Mono",monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#0F5E36;background:#E7F6EE;border-radius:999px;padding:3px 10px;margin-bottom:8px}' +
    '.hf-top{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:baseline}.hf-code{font-family:"Geist Mono",monospace;font-size:20px;font-weight:500;color:#0A6CC2;letter-spacing:.02em}.hf-d{font-family:"Archivo",sans-serif;font-weight:700;font-size:17px;color:#0B2A4A}' +
    '.hf-p{font-size:13.5px;line-height:1.5;color:#5E7891;margin-top:6px}' +
    '.hf-b{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.hf-b span{font-size:12.5px;border-radius:999px;padding:4px 10px;background:#F2F8FD;color:#17436B}.hf-b .f{background:#E7F6EE;color:#0F5E36}.hf-b .r{background:#FFF4D6;color:#7A3E00}.hf-b .p{background:#FDECEC;color:#B42318}' +
    '.hf-a{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:12px;font-size:14px}.hf-a a,.hf-a button{color:#0A6CC2;font-weight:600;text-decoration:none;background:none;border:0;padding:0;font:inherit;font-size:14px;cursor:pointer}' +
    '.hf-empty{padding:28px;text-align:center;color:#5E7891;border:1px dashed #C9DCEC;border-radius:18px;line-height:1.6}.hf-empty a{color:#0A6CC2;font-weight:600}' +
    '.hf-chs{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,250px),1fr));gap:8px}.hf-chs button{font:inherit;text-align:left;border:1px solid #E1EDF7;background:#FFFFFF;border-radius:14px;padding:10px 14px;cursor:pointer;color:#0B2A4A;font-size:14px;line-height:1.35}.hf-chs button:hover{border-color:#0A6CC2;background:#F7FBFF}.hf-chs b{font-family:"Geist Mono",monospace;color:#0A6CC2;margin-right:8px;font-weight:500}' +
    '.hf-help{margin-top:16px;background:#F2F8FD;border-radius:18px;padding:18px 20px;font-size:15px;line-height:1.55;color:#17436B;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}.hf-help a{background:#25D366;color:#06331A;border-radius:999px;padding:11px 18px;font-weight:600;text-decoration:none;white-space:nowrap}' +
    '.hf-src{font-size:12.5px;color:#5E7891;margin-top:14px;line-height:1.5}' +
    '@media (max-width:640px){.hf-card{padding:16px;border-radius:18px}.hf-it{padding:14px}.hf-code{font-size:17px}.hf-d{font-size:15.5px}.hf-p{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.hf-in{font-size:16px;padding:14px}}' +
    '</style>';

  var ackd = false;
  try { ackd = sessionStorage.getItem('hf-ack') === '1'; } catch (e) {}

  root.innerHTML = css +
    '<div class="hf-warn" role="note"><b>For guidance only.</b> This finder suggests likely HSN codes from the published Customs Tariff. It is not a classification ruling, and the correct code for your goods depends on what they are made of, how they work and what they are used for. YAM Logistics Pvt. Ltd. accepts no legal responsibility for any use of these results. <a href="#disclaimer">Read the full disclaimer</a>.</div>' +
    '<div class="hf-card">' +
    '<label class="hf-l" for="hf-q">Describe your product, or type an HSN code</label>' +
    '<input id="hf-q" class="hf-in" placeholder="e.g. “cotton t-shirts”, “solar panel”, “basmati rice”, or 8517" autocomplete="off">' +
    '<div class="hf-ex">Try: <button data-q="mobile phone">mobile phone</button><button data-q="cotton t-shirt">cotton t-shirt</button><button data-q="solar panel">solar panel</button><button data-q="basmati rice">basmati rice</button><button data-q="lithium battery">lithium battery</button><button data-q="led bulb">LED bulb</button><button data-q="stainless steel bolts">stainless steel bolts</button></div>' +
    '<label class="hf-ack"><input type="checkbox" id="hf-ack"' + (ackd ? ' checked' : '') + '><span>I understand these are <b>suggested codes for guidance only</b>, not a classification ruling, that I am responsible for the code I declare, and that YAM Logistics Pvt. Ltd. accepts <b>no liability</b> for their use. I have read the <a href="#disclaimer">disclaimer</a>.</span></label>' +
    '<div class="hf-res" id="hf-res"><div class="hf-empty">Loading the Customs Tariff…</div></div>' +
    '</div>';

  var q = document.getElementById('hf-q'), res = document.getElementById('hf-res'), ack = document.getElementById('hf-ack');


  // common products -> the tariff headings/subheadings they usually fall under (boosted to the top, still guidance only)
  var CUR = [
    [['mobile phone','smartphone','cell phone','cellphone','iphone','android phone','mobile'],['85171300','85171400']],
    [['mobile charger','phone charger','charger','adapter','adaptor'],['850440']],[['power bank','powerbank'],['850760']],
    [['laptop','notebook computer','macbook'],['847130']],[['tablet computer','ipad','tablet pc'],['847130']],[['desktop computer','computer','pc'],['847141','847149','847150']],
    [['printer'],['844332']],[['computer monitor','monitor'],['852852']],[['tv','television','led tv','smart tv'],['852872']],[['smartwatch','smart watch'],['85176290']],
    [['earphone','headphone','earbud','earbuds','headset'],['851830']],[['speaker','bluetooth speaker'],['85182']],[['router','wifi router','modem'],['851762']],[['cctv','cctv camera','security camera'],['852589']],
    [['led bulb','led lamp','led light','led tube'],['853952']],[['solar panel','solar module'],['854143']],[['solar cell'],['854142']],
    [['lithium battery','lithium ion battery','li ion battery'],['850760','850650']],[['car battery','lead acid battery','inverter battery'],['850710','850720']],[['inverter','ups'],['850440']],
    [['ceiling fan','table fan','fan'],['841451']],[['air conditioner','ac','split ac'],['8415']],[['refrigerator','fridge'],['841821']],[['washing machine'],['8450']],
    [['microwave','microwave oven'],['851650']],[['mixer grinder','mixer','juicer'],['850940']],[['water purifier','ro purifier'],['842121']],[['electric motor'],['8501']],
    [['water pump','pump'],['8413']],[['generator','dg set','genset'],['8502']],[['electric cable','electric wire','cable','wire harness'],['8544']],
    [['tshirt','t shirt'],['6109']],[['polo shirt'],['6105']],[['formal shirt','shirt'],['6205']],[['jeans','denim trousers'],['620342','620462']],[['trousers','pants'],['62034','62046']],
    [['dress','ladies dress'],['62044','61044']],[['socks'],['6115']],[['towel','towels'],['63026','63029']],[['bed sheet','bedsheet','bed linen'],['63022','63023']],[['curtain','curtains'],['6303']],
    [['carpet','rug','rugs','dhurrie'],['5701','5702','5703','5705']],[['leather shoes','leather footwear'],['6403']],[['sports shoes','sneakers','running shoes'],['640411']],[['shoes','footwear'],['6403','6404','6402']],
    [['slippers','flip flops','chappal'],['640220']],[['handbag','purse','ladies bag'],['42022']],[['suitcase','luggage','trolley bag'],['42021']],[['backpack','school bag'],['420292']],
    [['leather belt','belt'],['420330']],[['wallet'],['420231','420232']],[['gold jewellery','gold jewelry'],['711319']],[['silver jewellery','silver jewelry'],['711311']],
    [['diamond','cut diamond','polished diamond'],['710239']],[['imitation jewellery','artificial jewellery','fashion jewellery'],['7117']],[['wrist watch','watch'],['9102']],
    [['sunglasses'],['900410']],[['spectacle frame','eyeglass frame'],['9003']],[['toy','toys'],['9503']],[['wooden furniture'],['940360']],[['furniture'],['9403']],
    [['office chair','chair','sofa'],['9401']],[['mattress'],['94042']],
    [['basmati rice','basmati'],['100630']],[['rice','non basmati rice'],['1006']],[['wheat'],['1001']],[['sugar'],['1701']],[['jaggery','gur'],['170113','170114']],
    [['tea'],['0902']],[['coffee'],['0901']],[['turmeric','haldi'],['091030']],[['chilli','red chilli','chili'],['09042']],[['cumin','jeera'],['090931']],[['black pepper'],['09041']],
    [['cardamom'],['09083']],[['ginger'],['09101']],[['cashew','cashew nut'],['08013']],[['almond','almonds'],['08021']],[['onion','onions'],['070310']],[['potato','potatoes'],['0701']],
    [['grapes'],['080610']],[['mango','mangoes'],['080450']],[['banana','bananas'],['0803']],[['shrimp','prawn','prawns'],['03061','03063','16052']],[['frozen fish'],['0303','0304']],
    [['honey'],['0409']],[['ghee'],['040590']],[['milk powder'],['0402']],[['cheese','paneer'],['0406']],[['biscuit','biscuits','cookies'],['19053']],[['chocolate'],['1806']],
    [['pasta','noodles'],['1902']],[['sauce','ketchup'],['2103']],[['pickle','pickles'],['2001']],[['fruit juice','juice'],['2009']],[['mineral water','drinking water'],['2201']],
    [['beer'],['2203']],[['whisky','whiskey'],['220830']],[['wine'],['2204']],[['cigarette','cigarettes'],['240220']],[['agarbatti','incense stick','incense'],['330741']],
    [['perfume','fragrance'],['330300']],[['shampoo'],['330510']],[['soap'],['3401']],[['toothpaste'],['330610']],[['cosmetics','makeup','lipstick','face cream'],['3304']],
    [['medicine','medicines','tablets','capsules','pharmaceuticals'],['3004']],[['vaccine'],['30024']],[['surgical gloves','nitrile gloves','examination gloves'],['40151']],
    [['plastic bottle','pet bottle'],['392330']],[['plastic bag','poly bag','polybag'],['392321','392329']],[['pvc pipe'],['391723']],[['steel pipe','steel tube'],['7304','7305','7306']],
    [['bolt','bolts','nut','nuts','screw','screws','fastener','fasteners'],['7318']],[['nail','nails'],['7317']],[['aluminium foil','aluminum foil'],['7607']],[['copper wire'],['7408']],
    [['ceramic tiles','vitrified tiles','tiles'],['6907']],[['granite'],['680293','251612']],[['marble'],['680291','2515']],[['glass bottle'],['7010']],[['paper cup','paper cups'],['482369']],
    [['carton','cartons','cardboard box','corrugated box'],['481910']],[['exercise book','notebook paper'],['482020']],[['notebook'],['847130','482020']],[['car','cars','motor car'],['8703']],
    [['car parts','auto parts','automobile parts'],['8708']],[['motorcycle','motorbike'],['8711']],[['bicycle','cycle'],['8712']],[['electric scooter','e scooter','ev scooter'],['871160']],
    [['tractor'],['87019']],[['car tyre','tyres for car','car tire'],['401110']],[['truck tyre','bus tyre'],['401120']],[['motorcycle tyre','bike tyre'],['401140']],[['drone','drones'],['8806']]
  ];
  var CURN = CUR.map(function (e) { return [e[0].map(function (k) { return norm(k).split(' ').map(stem); }), e[1]]; });
  function curated(t) {
    var toks = {}; norm(t).split(' ').forEach(function (w) { toks[stem(w)] = 1; });
    var best = 0, pre = [];
    CURN.forEach(function (e) {
      e[0].forEach(function (k) {
        if (k.every(function (w) { return toks[w]; })) {
          if (k.length > best) { best = k.length; pre = e[1].slice(); } else if (k.length === best) pre = pre.concat(e[1]);
        }
      });
    });
    return pre;
  }
  function build() {
    idx = D.rows.map(function (x) { return { d: sp(x[1]), p: sp(x[2] >= 0 ? D.paths[x[2]] : '') }; });
  }
  function alts(w) {
    var s = SYN[w] || SYN[stem(w)];
    var a = [stem(w)];
    if (s) s.forEach(function (t) { a.push(norm(t).split(' ').map(stem).join(' ')); });
    return a;
  }
  function search(t) {
    var digits = t.replace(/[\s.\-]/g, '');
    if (/^\d{2,8}$/.test(digits)) return D.rows.map(function (x, i) { return i; }).filter(function (i) { return D.rows[i][0].indexOf(digits) === 0; });
    var ws = norm(t).split(' ').filter(function (w) { return w && !STOP[w]; });
    if (!ws.length) return [];
    var A = ws.map(alts), sc = [], pre = curated(t), seen = {};
    for (var i = 0; i < idx.length; i++) {
      var s = 0, hit = 0;
      for (var k = 0; k < A.length; k++) {
        var best = 0;
        for (var j = 0; j < A[k].length; j++) {
          var w = A[k][j], v = 0;
          if (idx[i].d.indexOf(' ' + w + ' ') >= 0) v = 4; else if (idx[i].d.indexOf(' ' + w) >= 0) v = 3; else if (idx[i].p.indexOf(' ' + w + ' ') >= 0) v = 2; else if (idx[i].p.indexOf(' ' + w) >= 0) v = 1;
          if (j > 0 && v) v -= 0.5;
          if (v > best) best = v;
        }
        if (best) { s += best; hit++; }
      }
      var x0 = D.rows[i][0], cp = pre.length && pre.some(function (p) { return x0.indexOf(p) === 0; });
      if (cp) { s += 40; hit = A.length; }
      if (hit) {
        var x = D.rows[i];
        if (hit === A.length) s += 10;
        if (/^other\b/i.test(x[1])) s -= 0.5;
        sc.push([s, i]);
      }
    }
    sc.sort(function (a, b) { return b[0] - a[0] || (D.rows[a[1]][0] < D.rows[b[1]][0] ? -1 : 1); });
    var top = sc.length ? sc[0][0] : 0;
    TAG = {}; if (pre.length && top >= 40) sc.forEach(function (x) { if (x[0] >= top - 1 && x[0] >= 40) TAG[x[1]] = 1; });
    return sc.filter(function (x) { return x[0] >= Math.min(top, 10) || x[0] >= top - 3; }).slice(0, 200).map(function (x) { return x[1]; });
  }

  function wa(t) { return 'https://wa.me/YAMLOGISTICS?text=' + encodeURIComponent('Hello YAM, please help me confirm the HSN code for: ' + t); }
  function chapters() {
    var have = {};
    D.rows.forEach(function (x) { have[x[0].slice(0, 2)] = 1; });
    return '<div class="hf-meta"><b style="color:#0B2A4A">Or browse by chapter</b></div><div class="hf-chs">' + Object.keys(CH).filter(function (c) { return have[c]; }).map(function (c) { return '<button data-ch="' + c + '"><b>' + c + '</b>' + h(CH[c]) + '</button>'; }).join('') + '</div>';
  }
  var PRE = [], TAG = {};
  var UN = { kg: 'kg', kgs: 'kg', u: 'pieces', nos: 'pieces', m2: 'sq. metres', m: 'metres', m3: 'cubic metres', pa: 'pairs', l: 'litres', 'c/k': 'carats' };
  function card(i) {
    var x = D.rows[i], common = TAG[i], path = x[2] >= 0 ? D.paths[x[2]] : '', ch = x[0].slice(0, 2), b = [];
    if (x[4]) b.push('<span>Basic duty ' + h(x[4]) + '</span>');
    if (x[6] && POL[x[6]]) b.push('<span class="' + POL[x[6]][1] + '">Import: ' + POL[x[6]][0] + '</span>');
    if (x[7] && POL[x[7]]) b.push('<span class="' + POL[x[7]][1] + '">Export: ' + POL[x[7]][0] + '</span>');
    var un = UN[(x[3] || '').toLowerCase()]; if (un) b.push('<span>Unit: ' + un + '</span>');
    return '<div class="hf-it' + (common ? ' hf-c' : '') + '">' + (common ? '<div class="hf-tag">Commonly used for this product</div>' : '') + '<div class="hf-top"><span class="hf-code">' + fc(x[0]) + '</span><span class="hf-d">' + h(x[1]) + '</span></div>' +
      '<div class="hf-p">Chapter ' + ch + ' · ' + h(CH[ch] || '') + (path ? ' › ' + h(path.slice(0, 220)) : '') + '</div>' +
      '<div class="hf-b">' + b.join('') + '</div>' +
      '<div class="hf-a"><a href="customs-duty-calculator.html#hs=' + x[0] + '">Import duty on this code →</a><a href="export-benefit-finder.html#hs=' + x[0] + '">Export benefits →</a><button data-copy="' + x[0] + '">Copy code</button></div></div>';
  }
  function render() {
    if (!D) return;
    var t = q.value.trim();
    if (!ack.checked) { res.innerHTML = '<div class="hf-empty" style="color:#7A3E00">Please tick the box above to confirm you understand the codes are suggestions for guidance only. The results will then appear here.</div>'; return; }
    if (!t) { res.innerHTML = chapters(); return; }
    PRE = /^\d/.test(t) ? [] : curated(t);
    var ids = search(t);
    lastIds = ids;
    if (!ids.length) { res.innerHTML = '<div class="hf-empty">No matching tariff lines for “' + h(t) + '”. Try a simpler word (what it is made of, or what it does), or the first 4 digits of a code.<br><a href="' + wa(t) + '" target="_blank" rel="noopener">Ask our desk on WhatsApp →</a></div>' + chapters(); return; }
    var cnt = {};
    ids.forEach(function (i) { var c = D.rows[i][0].slice(0, 2); cnt[c] = (cnt[c] || 0) + 1; });
    var chs = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; });
    if (chFilter && !cnt[chFilter]) chFilter = null;
    var show = chFilter ? ids.filter(function (i) { return D.rows[i][0].slice(0, 2) === chFilter; }) : ids;
    var isCode = /^\d{2,8}$/.test(t.replace(/[\s.\-]/g, ''));
    var H = '<div class="hf-meta"><span>' + (isCode ? show.length + ' tariff line' + (show.length === 1 ? '' : 's') + ' under ' + h(t) : (ids.length >= 200 ? 'Top 200' : ids.length) + ' likely code' + (ids.length === 1 ? '' : 's') + ' for “' + h(t) + '”') + '</span></div>';
    if (chs.length > 1) H += '<div class="hf-meta"><span>Filter by chapter:</span><button class="hf-chip' + (chFilter ? '' : ' on') + '" data-f="">All</button>' + chs.slice(0, 10).map(function (c) { return '<button class="hf-chip' + (chFilter === c ? ' on' : '') + '" data-f="' + c + '">' + c + ' · ' + h(CH[c] || '') + ' (' + cnt[c] + ')</button>'; }).join('') + '</div>';
    H += show.slice(0, 60).map(card).join('');
    if (show.length > 60) H += '<div class="hf-empty">Showing the first 60. Add another word (material, use, or type) or pick a chapter above to narrow it down.</div>';
    H += '<div class="hf-help"><span><b>Not sure which line fits?</b> Send us the product details and a licensed customs broker will suggest the right code.</span><a href="' + wa(t) + '" target="_blank" rel="noopener">WhatsApp the desk</a></div>';
    H += '<div class="hf-src">Source: ' + h(D.v) + '. Duty shown is the standard Customs Tariff rate before exemptions; use the import duty calculator for the full working.</div>';
    res.innerHTML = H;
  }

  var tm;
  q.addEventListener('input', function () { chFilter = null; clearTimeout(tm); tm = setTimeout(render, 180); });
  ack.addEventListener('change', function () { try { sessionStorage.setItem('hf-ack', ack.checked ? '1' : '0'); } catch (e) {} render(); });
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-q]'); if (b) { q.value = b.getAttribute('data-q'); chFilter = null; render(); return; }
    b = e.target.closest('[data-ch]'); if (b) { q.value = b.getAttribute('data-ch'); chFilter = null; render(); q.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    b = e.target.closest('[data-f]'); if (b) { chFilter = b.getAttribute('data-f') || null; render(); return; }
    b = e.target.closest('[data-copy]'); if (b) { var c = b.getAttribute('data-copy'); try { navigator.clipboard.writeText(c); b.textContent = 'Copied ✓'; setTimeout(function () { b.textContent = 'Copy code'; }, 1500); } catch (er) { b.textContent = c; } }
  });

  fetch('hsn-data.json?v=2').then(function (x) { return x.json(); }).then(function (j) {
    D = j; build();
    var m = location.hash.match(/q=([^&]+)/);
    if (m) q.value = decodeURIComponent(m[1].replace(/\+/g, ' '));
    render();
  }).catch(function () { res.innerHTML = '<div class="hf-empty">Could not load the tariff. Please refresh the page.</div>'; });
})();
