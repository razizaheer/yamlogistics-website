/* YAM Logistics — free multi-carrier tracker (container / AWB / B/L router) */
(function () {
  var root = document.getElementById('trk-root'); if (!root) return;
  var WA = 'YAMLOGISTICS';
  // Ocean carriers: name, url template ({n} = number) or plain page (number copied), owner prefixes, B/L prefixes
  var SEA = [
    ["Maersk", "https://www.maersk.com/tracking/{n}", ["MAEU", "MSKU", "MRKU", "MRSU", "MCRU", "MSWU", "MCAU", "MCHU", "MCIU", "MCPU", "MIEU", "MMAU", "MSAU", "MSFU", "MSVU", "MVIU", "MWCU", "MWMU", "MNBU", "MGBU", "MHHU", "MALU", "APMU", "KNLU", "TORU", "NDLU", "PONU"], ["MAEU", "MAEI"], 1],
    ["MSC", "https://www.msc.com/en/track-a-shipment?agencyPath=msc&trackingNumber={n}", ["MSCU", "MEDU", "MSDU", "MSMU", "MSNU", "MSBU"], ["MEDU"], 0],
    ["CMA CGM", "https://www.cma-cgm.com/ebusiness/tracking/search?SearchBy=Container&Reference={n}", ["CMAU", "CGMU", "ECMU", "CMNU", "AMCU", "CGHU", "CGTU", "DVRU", "OTAU", "STMU", "MMCU"], ["CMDU"], 0],
    ["Hapag-Lloyd", "https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html?container={n}", ["HLXU", "HLBU", "HLCU", "UACU", "UASU", "UAEU", "CPSU", "CSQU", "CASU", "CLGU", "CMUU", "DAYU", "DALU", "FANU", "HAMU", "ITAU", "IVLU", "LYKU", "NDSU", "PCRU", "PLVU", "PSBU", "QIBU", "QNNU", "SIUU", "TLEU", "USCU", "AZLU", "FMGU"], ["HLCU"], 0],
    ["ONE (Ocean Network Express)", "https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking?ctrack-field={n}&trakNoParam={n}", ["ONEU", "NYKU", "MOLU", "KKFU", "KKLU", "KKTU", "MOAU", "MOEU", "MOFU", "MOGU", "MORU", "MOTU", "NYNU", "FDCU", "MOSU"], ["ONEY"], 0],
    ["COSCO Shipping", "https://elines.coscoshipping.com/ebusiness/cargoTracking?trackingType=CONTAINER&number={n}", ["CBHU", "CCLU", "CSNU", "CSLU", "CXDU"], ["COSU"], 0],
    ["OOCL", "https://www.oocl.com/eng/ourservices/eservices/cargotracking/Pages/cargotracking.aspx", ["OOLU", "OOCU"], ["OOLU"], 0],
    ["Evergreen", "https://ct.shipmentlink.com/servlet/TDB1_CargoTracking.do", ["EGHU", "EGSU", "EMCU", "EISU", "EITU", "HMCU"], ["EGLV"], 0],
    ["Yang Ming", "https://www.yangming.com/e-service/Track_Trace/track_trace_cargo_tracking.aspx", ["YMLU", "YMMU", "OCGU"], ["YMLU", "YMJA"], 0],
    ["HMM", "https://www.hmm21.com/e-service/general/trackNTrace/TrackNTrace.do", ["HDMU", "HMMU", "KOCU"], ["HDMU"], 0],
    ["ZIM", "https://www.zim.com/tools/track-a-shipment?consnumber={n}", ["ZIMU", "ZCSU", "ZCLU", "ZHLU", "ZMOU", "JXLU", "JZPU"], ["ZIMU"], 0],
    ["Wan Hai Lines", "https://www.wanhai.com/views/cargoTrack/CargoTrack.xhtml", ["WHLU", "WHSU"], ["WHLC"], 0],
    ["PIL (Pacific International Lines)", "https://www.pilship.com/", ["PCIU", "PILU", "PIDU", "HPCU"], ["PCIU"], 0],
    ["KMTC", "https://www.ekmtc.com/", ["KMTU"], ["KMTC"], 0],
    ["RCL (Regional Container Lines)", "https://www.rclgroup.com/", ["REGU"], ["REGU"], 0],
    ["SITC", "https://www.sitcline.com/", [], ["SITC"], 0],
    ["X-Press Feeders", "https://www.x-pressfeeders.com/", [], [], 0],
    ["Emirates Shipping Line", "https://www.emiratesline.com/", [], [], 0],
    ["TS Lines", "https://www.tslines.com/", [], [], 0],
    ["Shipping Corporation of India", "https://www.shipindia.com/", ["SCIU"], [], 0],
    ["Unifeeder", "https://www.unifeeder.com/", [], [], 0],
    ["APL", "https://www.apl.com/ebusiness/tracking/search?SearchBy=Container&Reference={n}", ["APLU", "APZU", "APHU", "APRU"], ["APLU"], 0],
    ["ANL", "https://www.anl.com.au/ebusiness/tracking/search?SearchBy=Container&Reference={n}", ["ANNU"], ["ANLC"], 0],
    ["CNC Line", "https://www.cnc-line.com/", [], [], 0],
    ["Hamburg Süd", "https://www.maersk.com/tracking/{n}", ["SUDU", "HASU"], ["SUDU"], 1],
    ["Sealand", "https://www.maersk.com/tracking/{n}", ["SEAU"], [], 1],
    ["Safmarine", "https://www.maersk.com/tracking/{n}", [], [], 1],
    ["UASC", "https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html?container={n}", ["UACU", "UASU", "UAEU"], [], 0],
    ["NYK Line", "https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking?ctrack-field={n}&trakNoParam={n}", ["NYKU", "NYNU"], [], 0],
    ["MOL", "https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking?ctrack-field={n}&trakNoParam={n}", ["MOLU", "MOAU", "MOEU", "MOFU", "MOGU", "MORU", "MOTU"], [], 0],
    ["K Line", "https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking?ctrack-field={n}&trakNoParam={n}", ["KKFU", "KKLU", "KKTU"], [], 0],
    ["Gold Star Line", "https://www.goldstarline.com/", ["GSLU"], [], 0],
    ["Matson", "https://www.matson.com/", ["MATU"], [], 0],
    ["Crowley", "https://www.crowley.com/", ["CMCU"], [], 0],
    ["Seaboard Marine", "https://www.seaboardmarine.com/", ["SMLU"], [], 0],
    ["Turkon Line", "https://www.turkon.com/", ["TRKU"], [], 0],
    ["Arkas Line", "https://www.arkasline.com.tr/", ["ARKU"], [], 0],
    ["Sinokor", "https://www.sinokor.co.kr/", ["SKLU", "SKHU"], [], 0],
    ["CU Lines", "https://www.culines.com/", ["CULU"], [], 0],
    ["InterAsia Lines", "https://www.interasia.cc/", ["IAAU"], [], 0],
    ["SM Line", "https://www.smlines.com/", ["SMCU"], [], 0],
    ["CK Line", "https://www.ckline.co.kr/", ["CKLU"], [], 0],
    ["Namsung Shipping", "https://www.namsung.co.kr/", ["NSSU"], [], 0],
    ["Pan Continental Shipping", "https://www.pancon.co.kr/", ["PCLU"], [], 0],
    ["Dongyoung Shipping", "", ["DYLU"], [], 0],
    ["Marfret", "https://www.marfret.fr/", ["MFTU"], [], 0],
    ["Swire Shipping", "https://www.swireshipping.com/", [], [], 0],
    ["Messina Line", "https://www.messinaline.it/", [], [], 0],
    ["Grimaldi", "https://www.grimaldi.napoli.it/", [], [], 0],
    ["Sallaum Lines", "https://www.sallaumlines.com/", [], [], 0],
    ["Sea Lead Shipping", "https://www.sea-lead.com/", [], [], 0],
    ["Simatech Shipping", "https://www.simatechshipping.com/", [], [], 0],
    ["Global Feeder Shipping", "", [], [], 0],
    ["Bengal Tiger Line", "https://www.bengaltigerline.com/", [], [], 0],
    ["Transworld Feeders", "", [], [], 0],
    ["Shreyas Shipping", "", [], [], 0],
    ["Sarjak Container Lines", "", [], [], 0]
  ];
  var LEASE = ["TGHU", "TCNU", "TCLU", "TRHU", "TRLU", "TEMU", "TTNU", "TXGU", "GESU", "GLDU", "CAIU", "CAXU", "SEGU", "SEKU", "FCIU", "FSCU", "BMOU", "DRYU", "CRXU", "CRSU", "BEAU", "IPXU", "UETU", "TGBU", "INKU", "DFSU", "FFAU", "NIDU", "GATU", "HJCU", "TLLU", "CLHU", "BSIU", "CBXU", "TCKU", "TIIU", "TLXU"];
  var AIR = {"001": "American Airlines Cargo", "006": "Delta Cargo", "014": "Air Canada Cargo", "016": "United Cargo", "020": "Lufthansa Cargo", "023": "FedEx", "027": "Alaska Air Cargo", "040": "Camair-Co", "044": "Aerolíneas Argentinas Cargo", "045": "LATAM Cargo", "047": "TAP Air Cargo", "053": "Aer Lingus Cargo", "055": "ITA Airways Cargo", "057": "Air France Cargo", "061": "Air Seychelles", "065": "Saudia Cargo", "070": "Syrian Air", "071": "Ethiopian Cargo", "072": "Gulf Air Cargo", "074": "KLM Cargo", "075": "Iberia Cargo", "076": "Middle East Airlines Cargo", "077": "EgyptAir Cargo", "079": "Philippine Airlines Cargo", "080": "LOT Cargo", "081": "Qantas Freight", "082": "Brussels Airlines Cargo", "083": "South African Airways Cargo", "086": "Air New Zealand Cargo", "096": "Iran Air Cargo", "098": "Air India Cargo", "105": "Finnair Cargo", "106": "Caribbean Airlines Cargo", "108": "Icelandair Cargo", "112": "China Cargo Airlines", "114": "El Al Cargo", "115": "Air Serbia Cargo", "117": "SAS Cargo", "118": "TAAG Angola Airlines Cargo", "124": "Air Algérie Cargo", "125": "British Airways World Cargo (IAG Cargo)", "126": "Garuda Indonesia Cargo", "127": "GOL Linhas Aéreas Cargo", "129": "Martinair Cargo", "131": "JAL Cargo", "139": "Aeroméxico Cargo", "141": "flydubai Cargo", "145": "LATAM Cargo Chile", "147": "Royal Air Maroc Cargo", "148": "Libyan Airlines", "157": "Qatar Airways Cargo", "160": "Cathay Cargo", "172": "Cargolux", "173": "Hawaiian Airlines Cargo", "176": "Emirates SkyCargo", "180": "Korean Air Cargo", "199": "Tunisair Cargo", "205": "ANA Cargo", "214": "PIA Cargo", "217": "Thai Cargo", "229": "Kuwait Airways Cargo", "230": "Copa Airlines Cargo", "232": "MASkargo (Malaysia Airlines)", "235": "Turkish Cargo", "239": "Air Mauritius Cargo", "244": "Air Tahiti Nui", "257": "Austrian Airlines Cargo", "258": "Madagascar Airlines", "265": "Far Eastern Air Transport", "272": "Kalitta Air", "281": "TAROM Cargo", "288": "Air Hong Kong", "297": "China Airlines Cargo", "312": "IndiGo CarGo", "318": "Air Atlanta Icelandic", "324": "Shandong Airlines", "345": "Northern Air Cargo", "369": "Atlas Air", "378": "Cayman Airways Cargo", "390": "Aegean Airlines Cargo", "403": "Polar Air Cargo", "406": "UPS Airlines", "416": "National Airlines Cargo", "421": "S7 Cargo", "423": "DHL Aviation (Americas)", "463": "Silk Way Airlines", "465": "Air Astana Cargo", "479": "Shenzhen Airlines Cargo", "485": "Astral Aviation", "501": "Silk Way West Airlines", "512": "Royal Jordanian Cargo", "526": "Southwest Cargo", "549": "LATAM Cargo Brasil", "555": "Aeroflot Cargo", "603": "SriLankan Cargo", "607": "Etihad Cargo", "615": "DHL Aviation (European Air Transport)", "618": "Singapore Airlines Cargo", "623": "Bulgaria Air Cargo", "631": "Air Greenland Cargo", "635": "Yemenia Cargo", "649": "Air Transat Cargo", "657": "airBaltic Cargo", "672": "Royal Brunei Cargo", "675": "Air Macau Cargo", "687": "Aloha Air Cargo", "695": "EVA Air Cargo", "700": "CAL Cargo Airlines (Challenge Group)", "706": "Kenya Airways Cargo", "716": "MNG Airlines", "724": "Swiss WorldCargo", "729": "Avianca Cargo", "731": "Xiamen Airlines Cargo", "738": "Vietnam Airlines Cargo", "756": "ASL Airlines Belgium", "771": "AZAL Cargo (Azerbaijan Airlines)", "774": "Shanghai Airlines Cargo", "775": "SpiceXpress (SpiceJet Cargo)", "781": "China Eastern Cargo", "784": "China Southern Cargo", "803": "Mandarin Airlines", "807": "AirAsia Cargo (Teleport)", "810": "Amerijet International", "817": "South American Airways", "831": "Croatia Airlines Cargo", "838": "WestJet Cargo", "843": "AirAsia X Cargo", "851": "Hong Kong Airlines Cargo", "865": "MasAir", "873": "AeroUnión", "876": "Sichuan Airlines Cargo", "880": "Hainan Airlines Cargo", "910": "Oman Air Cargo", "923": "Corsair", "932": "Virgin Atlantic Cargo", "933": "Nippon Cargo Airlines", "988": "Asiana Cargo", "992": "DHL Aero Expreso", "996": "Air Europa Cargo", "997": "Biman Bangladesh Cargo", "999": "Air China Cargo", "832": "ABX Air", "970": "Aero Mongolia", "419": "Aeroitalia", "394": "Africa World Airlines", "514": "Air Arabia", "610": "Air Astra", "760": "Air Austral", "636": "Air Botswana", "381": "Air Cairo", "190": "Air Caledonie", "188": "Air Cambodia", "427": "Air Caraibes", "856": "Air Changan", "146": "Air Corsica", "101": "Air Dolomiti", "730": "Air Guilin", "236": "Air India Express", "120": "Air Koryo", "400": "Air Montenegro", "656": "Air Niugini", "694": "Air Nostrum", "710": "Air Peace", "350": "Air Premia", "490": "Air Senegal", "135": "Air Tahiti", "197": "Air Tanzania", "264": "Air Vanuatu", "063": "Aircalin", "521": "Airhub Airlines", "330": "Airline GEO SKY", "749": "Airlink", "994": "AirZeta", "204": "AJet", "516": "Akasa Air", "110": "AlMasria Universal Airlines", "948": "Amelia", "275": "APG Airlines", "181": "Arajet", "238": "Arkia Israeli Airlines", "032": "ASKY", "558": "ASL Airlines France", "914": "ASL Airlines Ireland", "767": "Atlantic Airways", "134": "Avianca", "133": "Avianca Costa Rica", "547": "Avianca Ecuador", "331": "Azores Airlines", "577": "Azul Brazilian Airlines", "367": "Badr Airlines", "111": "Bahamasair", "926": "Bamboo Airways", "829": "Bangkok Airways", "938": "Batik Air", "816": "Batik Air Malaysia", "386": "BBN Airlines", "245": "BBN Airlines Indonesia", "474": "Binter Canarias", "404": "Blue Bird Airways", "930": "BoA Boliviana de Aviacion", "276": "Braathens Regional Airways", "898": "Capital Airlines", "489": "Cargojet Airways", "021": "Carpatair", "203": "Cebu Pacific", "225": "CemAir", "581": "Chair Airlines", "980": "Chalair", "744": "Challenge Airlines (BE)", "811": "Chengdu Airlines", "987": "China Express Airlines", "804": "China Postal Airlines", "822": "China United Airlines", "629": "Citilink", "689": "CityJet", "246": "Clic Air", "881": "Condor", "395": "Corendon Airlines", "136": "Cubana", "078": "Cyprus Airways", "936": "DHL Air", "155": "DHL Air (Bahrain)", "693": "Discover Airlines", "515": "Domestic Airlines", "787": "Drukair - Royal Bhutan Airlines", "839": "Eastar Jet", "945": "Edelweiss Air", "355": "Estafeta Cargo", "551": "EuroAtlantic Airways", "104": "Eurowings", "334": "Fastjet Zimbabwe", "260": "Fiji Airways", "365": "FlexFlight", "017": "Fly Baghdad", "560": "flyadeal", "164": "FlyArystan", "277": "FlyGabon", "593": "Flynas", "130": "FlyOne", "396": "French Bee", "422": "Frontier Airlines", "666": "Fuzhou Airlines", "606": "Georgian Airways", "944": "German Airways", "059": "GetJet Airlines", "698": "Global Airways and Lift", "402": "GlobalX", "283": "Greater Bay Airlines", "872": "GX Airlines", "169": "Hahnair", "836": "Hebei Airlines", "769": "Himalaya Airlines", "828": "Hong Kong Air Cargo", "128": "Hong Kong Express Airways", "182": "Iberojet", "783": "Iberojet Airlines", "704": "Ibom Air", "770": "Ikar", "491": "Iran Airtour Airline", "815": "Iran Aseman Airlines", "818": "Israir", "353": "Japan Transocean Air", "486": "Jazeera Airways", "619": "JD Airlines", "806": "Jeju Air", "279": "JetBlue", "974": "JetSMART Argentina", "973": "JetSMART Chile", "984": "JetSMART Colombia", "981": "JetSMART Peru", "718": "Jin Air", "151": "Jordan Aviation", "018": "Juneyao Airlines", "384": "Kam Air", "643": "KM Malta Airlines", "833": "Kunming Airlines", "002": "La Compagnie", "068": "LAM Mozambique Airlines", "627": "Lao Airlines", "957": "LATAM Airlines Brasil", "035": "LATAM Airlines Colombia", "462": "LATAM Airlines Ecuador", "692": "LATAM Airlines Paraguay", "544": "LATAM Airlines Peru", "441": "Link Airways", "990": "Lion Air", "682": "Loganair", "891": "Loong Air", "859": "Lucky Air", "220": "Lufthansa", "448": "Lufthansa City Airlines", "683": "Lufthansa CityLine", "149": "Luxair", "500": "Marathon Airlines", "495": "Mauritania Airlines International", "734": "Mavi Gök Airlines (MGA)", "289": "MIAT Mongolian Airlines", "599": "Myanmar Airways International", "665": "Myanmar National Airlines", "123": "Nauru Airlines", "703": "Neos", "477": "Nesma Airlines", "325": "Nile Air", "596": "Nok Air", "476": "NordStar", "216": "Nordwind Airlines", "796": "Nouvelair", "866": "Okay Airways", "050": "Olympic Air", "559": "Overland Airways", "211": "PAL Express", "445": "Paranair", "505": "Petroleum Air Services", "624": "Pegasus Airlines", "663": "Plus Ultra", "415": "PopulAir", "451": "Porter Airlines", "408": "Poste Air Cargo", "031": "Precision Air", "433": "Privilege Style", "659": "Proflight Zambia", "912": "Qingdao Airlines", "122": "Riyadh Air", "195": "Rossiya Airlines", "299": "Ruili Airlines", "362": "RusLine", "459": "RwandAir", "640": "Safair", "960": "Salam Air", "737": "SATA Air Açores", "655": "SCAT Airlines", "668": "Scoot", "921": "SF Airlines", "605": "SKY Airline", "633": "Sky Express", "010": "SkyUp Airlines", "316": "Smartavia", "797": "Smartwings", "193": "Solomon Airlines", "413": "Somon Air", "263": "Southwind Airlines", "189": "STARLUX Airlines", "337": "Sun Country Airlines", "564": "SunExpress", "871": "Suparna Airlines", "221": "Swiftair", "202": "TACA", "411": "TAG Airlines", "768": "Tailwind Airlines", "310": "Thai Lion Air", "826": "Tianjin Airlines", "722": "Trinity Airways", "617": "TUIfly", "034": "TUS Airways", "444": "ULS Airlines Cargo", "525": "Uni Air", "262": "Ural Airlines", "886": "Urumqi Air", "779": "US-Bangla Airlines", "298": "UTair", "250": "Uzbekistan Airways", "978": "Vietjet", "795": "Virgin Australia", "036": "Volaris", "712": "Volotea", "030": "Vueling", "460": "Wamos Air", "847": "West Air", "701": "Wideroe", "825": "World2Fly", "088": "Xizang Airlines", "860": "YTO Cargo Airlines", "038": "Hungary Airlines", "175": "IBC Airways", "233": "MSC Air Cargo", "488": "My Freighter", "585": "My Indo Airlines", "506": "Norse Atlantic Airways", "328": "Norwegian", "626": "PNG Air", "901": "TAB Cargo", "877": "Tianjin Air Cargo", "612": "TUI fly Belgium", "542": "Turkmenistan Airlines", "109": "Uganda Airlines", "399": "Uniworld Air Cargo", "658": "Airmax Cargo", "574": "Allied Air", "417": "Bringer Air Cargo", "575": "Coyne Airways", "772": "Fly Jinnah", "319": "Fits Air", "598": "Aurora Airlines", "622": "Calm Air", "219": "Air Creebec", "466": "Air Inuit", "356": "Cargolux Italia", "752": "Challenge Airlines (Malta)", "483": "Air Côte d'Ivoire", "696": "Cabo Verde Airlines"};
  // Airline cargo tracking: [url, mode] mode 1 = AWB filled in via link ({p} prefix, {s} 8-digit serial); 0 = official page, AWB copied; 2 = page takes the full 11-digit number
  var LHC = ["https://www.lufthansa-cargo.com/en/eservices/etracking/awb-details/-/awb/{p}/{s}?searchFilter=awb", 1], AI = ["https://aicargoportal.airindia.com/icargoneoportal/app/main/#/app?.html", 2], IAG = ["https://www.iagcargo.com/en/home/", 0], AFKL = ["https://www.afklcargo.com/mycargo/shipment/singlesearch", 2], CLX = ["https://www.cargolux.com/track-and-trace/", 0];
  var AIRT = {"157": ["https://www.qrcargo.com/s/track-your-shipment?documentType=MAWB&documentPrefix={p}&documentNumber={s}", 1], "607": ["https://www.etihadcargo.com/en/e-services/shipment-tracking?awb={p}{s}", 1], "020": LHC, "220": LHC, "016": ["https://www.unitedcargo.com/en/us/track/awb/{p}-{s}", 1],
    "098": AI, "236": AI, "312": ["https://6ecargo.goindigo.in/", 2, null, "Paste {s} in the Track your Air Waybill box"], "775": ["https://www.spicexpress.com/", 2, null, "Open the Track your Shipment tab, then paste {s}"], "176": ["https://eskycargo.emirates.com/app/offerandorder/#/shipments/list?type=D&values={p}{s}", 1], "738": ["https://track.champ.aero/vn", 2, "Vietnam Airlines Cargo"], "724": ["https://offerandorder.swissworldcargo.com/app/offerandorder/#/home/find-offer", 2, null, "Paste {s} in the Search & Track box at the top"], "141": ["https://cargo.flydubai.com/", 2, null, "Paste {s} in the Search & Track box at the top"],
    "618": ["https://www.siacargo.com/e-services/quicksearch_public/", 2], "160": ["https://www.cathaycargo.com/en-us/track-and-trace.html", 0], "180": ["https://cargo.koreanair.com/en/tracking", 0], "235": ["https://www.turkishcargo.com/en/cargo-tracking", 0], "057": AFKL, "074": AFKL, "129": AFKL, "014": ["https://www.aircanada.com/cargo/tracking", 2], "172": CLX, "356": CLX,
    "065": ["https://www.saudiacargo.com/en/digital-services", 0], "071": ["https://cargo.ethiopianairlines.com/my-cargo/track-your-shipment", 2], "603": ["https://srilankancargo.ibsplc.aero/icargoneoportal/app/main/", 2, null, "Open the Track Shipments tab, then paste {s}"], "910": ["https://cargo.omanair.com/track-shipment", 0], "072": ["https://www.gulfair.com/cargo", 0], "125": IAG, "075": IAG, "053": IAG,
    "706": ["https://www.kqcargo.com/", 0], "217": ["https://www.thaicargo.com/en/main", 0], "232": ["https://www.malaysiaairlines.com/content/mk/en/shipment-tracking.html", 0], "514": ["https://cargo.airarabia.com/cargo-tracking/", 0], "229": ["https://www.kuwaitairways.com/en/cargo/pages/tracking.aspx", 0], "077": ["https://egyptair-cargo.com/home.htm", 0],
    "006": ["https://www.deltacargo.com/Cargo/", 2], "001": ["https://www.aacargo.com/mobile/tracking-details.html", 0], "999": ["https://www.airchinacargo.com/", 0, null, "Paste {s} in the air waybill box (999 is already set)"], "297": ["https://cargo.china-airlines.com/ccnetv2/content/manage/ShipmentTracking.aspx", 0], "695": ["https://www.brcargo.com/NEC_WEB/Tracking/QuickTracking/Index", 0], "205": ["https://www.anacargo.jp/en/int/", 0], "081": ["https://freight.qantas.com/en-au/online-tracking", 0], "555": ["https://www.moscow-cargo.com/index.php/en/", 0, "Moscow Cargo (Sheremetyevo)", "Type 555 in the first box, then paste {s}"]};
  function airBtn(p, s, al) {
    var a = AIRT[p], name = h(al || 'the airline'), full = p + '-' + s;
    if (a && a[1] === 1) return '<a class="tk-b pri" target="_blank" rel="noopener" data-copy="' + full + '" data-direct="1" href="' + h(a[0].replace('{p}', p).replace('{s}', s)) + '"><b>Track on ' + name + ' ↗</b><span>Official airline tracking, AWB filled in</span></a>';
    if (a) { var c = a[1] === 2 ? full : s; return '<a class="tk-b pri" target="_blank" rel="noopener" data-copy="' + c + '" data-hint="' + c + '" href="' + h(a[0]) + '"><b>Track on ' + h(a[2] || al || 'the airline') + ' ↗</b><span>' + (a[3] ? h(a[3].replace('{s}', c)) + ' (copied)' : 'Official airline tracking · AWB ' + c + ' copied, paste it in') + '</span></a>'; }
    return '<a class="tk-b pri" target="_blank" rel="noopener" data-copy="' + full + '" data-hint="' + full + '" href="https://www.google.com/search?q=' + encodeURIComponent((al || 'airline ' + p) + (/cargo/i.test(al || '') ? '' : ' cargo') + ' AWB tracking -site:track-trace.com -site:trackingmore.com -site:parcelsapp.com -site:shipsgo.com') + '"><b>Find ' + name + ' tracking ↗</b><span>Takes you to the airline\'s own cargo tracking · AWB copied</span></a>';
  }
  var LDB = 'https://ldb.co.in/ldb/containersearch';
  var PRE = null, EX = root.getAttribute('data-ex'), EXL = root.getAttribute('data-exl'), ps = root.getAttribute('data-sea');
  if (ps) for (var pi = 0; pi < SEA.length; pi++) if (SEA[pi][0] === ps) PRE = SEA[pi];
  var css = '.tk-card{background:#fff;border:1px solid #E1EDF7;border-radius:24px;padding:28px}.tk-row{display:flex;gap:10px;flex-wrap:wrap}.tk-in{flex:1 1 360px;min-width:0;font:inherit;font-size:20px;padding:18px 20px;border:2px solid #CFE3F5;border-radius:16px;outline:none;letter-spacing:.02em}.tk-in:focus{border-color:#0A6CC2}.tk-go{background:#0A6CC2;color:#fff;border:0;border-radius:16px;padding:0 30px;font:inherit;font-weight:700;font-size:18px;cursor:pointer;min-height:62px}.tk-go:hover{background:#0B4F8F}.tk-hint{font-size:13px;color:#5E7891;margin-top:10px}.tk-hint button{background:none;border:0;color:#0A6CC2;font:inherit;cursor:pointer;padding:0 4px;text-decoration:underline}.tk-res{margin-top:18px}.tk-kind{font-family:"Geist Mono",monospace;font-size:12px;letter-spacing:.1em;color:#5E7891}.tk-h{font-family:Archivo,sans-serif;font-weight:900;font-size:28px;line-height:1.15;margin:6px 0 4px}.tk-num{font-family:"Geist Mono",monospace;font-size:16px;color:#17436B}.tk-ok{color:#0F7B3F;font-size:13px;margin-top:6px}.tk-bad{color:#B42318;font-size:13px;margin-top:6px}.tk-btns{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin-top:18px}.tk-b{display:block;text-align:left;border-radius:16px;padding:16px 18px;font:inherit;cursor:pointer;text-decoration:none;border:1px solid #CFE3F5;background:#F7FBFF;color:#0B2A4A}.tk-b b{display:block;font-size:16px;margin-bottom:3px}.tk-b span{font-size:13px;color:#5E7891}.tk-b.pri{background:#0A6CC2;border-color:#0A6CC2;color:#fff}.tk-b.pri span{color:#DDEBFA}.tk-b.wa{background:#25D366;border-color:#25D366;color:#06331A}.tk-b.wa span{color:#0B4D24}.tk-b:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(10,108,194,.14)}.tk-sel{font:inherit;font-size:15px;padding:12px 14px;border:1px solid #CFE3F5;border-radius:12px;margin-top:12px;max-width:100%}.tk-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#0B2A4A;color:#fff;padding:12px 18px;border-radius:12px;font-size:14px;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,.25)}.tk-rec{margin-top:14px;font-size:13px;color:#5E7891}.tk-up{display:flex;gap:12px;align-items:center;margin-top:14px;padding:12px 14px;border:1.5px dashed #9CC5EA;border-radius:14px;background:#F7FBFF;cursor:pointer}.tk-up:hover{border-color:#0A6CC2;background:#EEF5FC}.tk-up-i{flex:none;width:38px;height:38px;border-radius:10px;background:#0B2A4A;color:#FFC93C;display:flex;align-items:center;justify-content:center;font-size:20px}.tk-up b{display:block;font-size:15px;color:#0B2A4A}.tk-up i{display:block;font-style:normal;font-size:12.5px;color:#5E7891;margin-top:2px}.tk-upm{font-size:13.5px;color:#3D5873;margin-top:8px}.tk-upm .bar{height:5px;border-radius:9px;background:#E1EDF7;margin-top:6px;overflow:hidden}.tk-upm .bar i{display:block;height:100%;background:#0A6CC2;transition:width .3s}.tk-b.sum{background:#FFF8E6;border-color:#F5D58A}.tk-rec button{background:#EEF5FC;border:0;border-radius:999px;padding:5px 10px;margin:4px 4px 0 0;font:inherit;font-size:12px;color:#0B2A4A;cursor:pointer}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  root.innerHTML = '<div class="tk-card"><div class="tk-row"><input class="tk-in" id="tk-q" placeholder="Container, AWB or B/L number, e.g. MSKU 123456 5" autocomplete="off" spellcheck="false" aria-label="Tracking number"><button class="tk-go" id="tk-go">Track →</button></div><div class="tk-hint">Try: ' + (EX ? '<button data-x="' + h(EX) + '">' + h(EXL || EX) + '</button>' : '<button data-x="MSKU1234565">MSKU 123456 5</button><button data-x="176-12345675">176-1234 5675</button><button data-x="HLCUBO1251012345">Hapag-Lloyd B/L</button>') + '</div><label class="tk-up"><input type="file" id="tk-file" accept=".pdf,image/*" hidden><span class="tk-up-i">⇪</span><span><b>Or upload your air waybill copy</b><i>PDF, scan or phone photo · we read the AWB number for you · the file never leaves your device</i></span></label><div id="tk-upm" class="tk-upm"></div><div id="tk-rec" class="tk-rec"></div><div id="tk-res" class="tk-res"></div></div>';
  var q = document.getElementById('tk-q'), res = document.getElementById('tk-res');
  function h(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(t) { var d = document.createElement('div'); d.className = 'tk-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3500); }
  function copy(t) { try { navigator.clipboard.writeText(t); } catch (e) { } }
  function ctrCheck(c) { // ISO 6346 check digit
    var v = '0123456789A?BCDEFGHIJK?LMNOPQRSTU?VWXYZ', s = 0;
    for (var i = 0; i < 10; i++) s += v.indexOf(c[i]) * Math.pow(2, i);
    return (s % 11) % 10 === +c[10];
  }
  function awbCheck(a) { return parseInt(a.slice(3, 10), 10) % 7 === +a[10]; }
  function seaBy(pref, bl) { for (var i = 0; i < SEA.length; i++) if ((bl ? SEA[i][3] : SEA[i][2]).indexOf(pref) >= 0) return SEA[i]; return null; }
  function carrierBtn(c, n) {
    if (!c[1]) return '';
    var direct = c[4] === 1; // verified to prefill; others: number copied to clipboard
    return '<a class="tk-b pri" target="_blank" rel="noopener" data-copy="' + h(n) + '" data-direct="' + (direct ? 1 : 0) + '" href="' + h(c[1].split('{n}').join(encodeURIComponent(n))) + '"><b>Track on ' + h(c[0]) + ' ↗</b><span>' + (direct ? 'Official live tracking, number filled in' : 'Official live tracking · number copied, paste if it is not filled in') + '</span></a>';
  }
  function waBtn(n, who) {
    var msg = 'Hello YAM, I need help with shipment ' + n + (who ? ' (' + who + ')' : '') + '.';
    return '<a class="tk-b wa" target="_blank" rel="noopener" href="https://wa.me/' + WA + '?text=' + encodeURIComponent(msg) + '"><b>Need it cleared? WhatsApp a broker</b><span>Customs, delivery or a stuck shipment: we reply fast</span></a>';
  }
  function picker(n) {
    return '<select class="tk-sel" id="tk-pick"><option value="">Choose the shipping line…</option>' + SEA.map(function (c, i) { return '<option value="' + i + '">' + h(c[0]) + '</option>'; }).join('') + '</select>';
  }
  function remember(n) { try { var r = JSON.parse(localStorage.getItem('yam-trk') || '[]').filter(function (x) { return x !== n; }); r.unshift(n); localStorage.setItem('yam-trk', JSON.stringify(r.slice(0, 6))); } catch (e) { } showRec(); }
  function showRec() { var el = document.getElementById('tk-rec'); try { var r = JSON.parse(localStorage.getItem('yam-trk') || '[]'); el.innerHTML = r.length ? 'Recent: ' + r.map(function (x) { return '<button data-x="' + h(x) + '">' + h(x) + '</button>'; }).join('') : ''; } catch (e) { el.innerHTML = ''; } }
  function run() {
    var raw = q.value.trim(); if (!raw) { res.innerHTML = ''; return; }
    var n = raw.toUpperCase().replace(/[\s\-\.\/]/g, ''), H = '';
    if (/^[A-Z]{3}[UJZ]\d{7}$/.test(n)) {
      var pref = n.slice(0, 4), c = seaBy(pref), ok = ctrCheck(n), lease = LEASE.indexOf(pref) >= 0, pre = !c && PRE;
      if (pre) c = PRE;
      H += '<div class="tk-kind">CONTAINER NUMBER</div><div class="tk-h">' + (c ? h(c[0]) : lease ? 'Leased container' : 'Shipping line not recognised') + '</div><div class="tk-num">' + h(n.slice(0, 4) + ' ' + n.slice(4, 10) + ' ' + n[10]) + '</div>';
      H += ok ? '<div class="tk-ok">✓ Check digit valid</div>' : '<div class="tk-bad">⚠ The check digit doesn\'t match. Please re-check the number.</div>';
      if (pre) H += '<div style="font-size:14px;color:#3D5873;margin-top:8px">' + (lease ? 'The ' + pref + ' prefix belongs to a container leasing company. ' : '') + 'Showing ' + h(PRE[0]) + ' tracking because you are on its page. If the box is on another line, choose it below.' + picker(n) + '</div>';
      else if (!c) H += '<div style="font-size:14px;color:#3D5873;margin-top:8px">' + (lease ? 'The ' + pref + ' prefix belongs to a container leasing company, so the box is tracked by the line carrying it.' : 'We don\'t know the owner of prefix ' + pref + '.') + ' Choose the line below. The India leg link works for any line.</div>' + picker(n);
      H += '<div class="tk-btns" id="tk-btns">' + (c ? carrierBtn(c, n) : '') + '<a class="tk-b" target="_blank" rel="noopener" data-copy="' + n + '" href="' + LDB + '"><b>India leg: ports, CFS, ICD &amp; rail ↗</b><span>Logistics Data Bank · number copied</span></a>' + waBtn(n, c && c[0]) + '</div>';
    } else if (/^\d{11}$/.test(n)) {
      var p = n.slice(0, 3), al = AIR[p], ok2 = awbCheck(n), fmt = p + '-' + n.slice(3, 7) + ' ' + n.slice(7);
      H += '<div class="tk-kind">AIR WAYBILL (AWB)</div><div class="tk-h">' + (al ? h(al) : 'Airline prefix ' + p) + '</div><div class="tk-num">' + fmt + '</div>';
      H += ok2 ? '<div class="tk-ok">✓ Check digit valid</div>' : '<div class="tk-bad">⚠ The check digit doesn\'t match. Please re-check the AWB number.</div>';
      H += '<div class="tk-btns">' + airBtn(p, n.slice(3), al) + waBtn(fmt, al) + '</div>';
      n = fmt.replace(' ', '');
    } else if (/^[A-Z]{4}[A-Z0-9]{4,16}$/.test(n) && seaBy(n.slice(0, 4), true)) {
      var cb = seaBy(n.slice(0, 4), true);
      H += '<div class="tk-kind">BILL OF LADING</div><div class="tk-h">' + h(cb[0]) + '</div><div class="tk-num">' + h(n) + '</div>';
      H += '<div class="tk-btns">' + carrierBtn([cb[0], /maersk|msc\.com/.test(cb[1]) ? cb[1] : cb[1].split('?')[0].replace('/{n}', ''), 0, 0, cb[4]], n) + waBtn(n, cb[0]) + '</div>';
    } else if (/^[A-Z0-9]{6,20}$/.test(n) && PRE) {
      H += '<div class="tk-kind">BOOKING / BILL OF LADING</div><div class="tk-h">' + h(PRE[0]) + '</div><div class="tk-num">' + h(n) + '</div><div class="tk-btns">' + carrierBtn(PRE, n) + waBtn(n, PRE[0]) + '</div>';
    } else if (/^[A-Z0-9]{6,20}$/.test(n)) {
      H += '<div class="tk-kind">BOOKING / BILL OF LADING</div><div class="tk-h">Which shipping line?</div><div class="tk-num">' + h(n) + '</div><div style="font-size:14px;color:#3D5873;margin-top:8px">Bookings and B/Ls don\'t always show the carrier. Pick the line to open its tracking.</div>' + picker(n) + '<div class="tk-btns" id="tk-btns">' + waBtn(n) + '</div>';
    } else {
      H += '<div class="tk-bad" style="font-size:15px">That doesn\'t look like a container (4 letters + 7 digits), AWB (11 digits) or B/L number. Please check and try again.</div>';
    }
    if (H.indexOf('tk-btns') >= 0) H = H.replace(/<\/div>$/, '') + '<button class="tk-b sum" id="tk-sum" type="button"><b>Download tracking summary (PDF) ↓</b><span>Number, carrier and where to track it, to save or share</span></button></div>';
    res.innerHTML = H; res.setAttribute('data-n', n); if (H.indexOf('doesn\'t look like') < 0) remember(raw.toUpperCase());
  }
  document.getElementById('tk-go').addEventListener('click', run);
  q.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
  root.addEventListener('click', function (e) {
    var x = e.target.closest('[data-x]'); if (x) { q.value = x.getAttribute('data-x'); run(); return; }
    if (e.target.closest('#tk-sum')) { summary(); return; }
    var c = e.target.closest('[data-copy]'); if (c) { copy(c.getAttribute('data-copy')); if (c.getAttribute('data-direct') !== '1') toast((c.getAttribute('data-hint') || 'Number') + ' copied: paste it into the tracking box on the page that opens.'); }
  });
  root.addEventListener('change', function (e) {
    if (e.target.id !== 'tk-pick' || e.target.value === '') return;
    var c = SEA[+e.target.value], n = res.getAttribute('data-n'), b = document.getElementById('tk-btns');
    var old = b.querySelector('.tk-b.pri'); if (old) old.remove();
    b.insertAdjacentHTML('afterbegin', carrierBtn(c, n));
  });

  // ---- upload an air waybill: read the AWB number in the browser (same reader as the AWB label tool) ----
  var TB = (function () { var sc = document.currentScript || [].slice.call(document.scripts).filter(function (x) { return /track\.js/.test(x.src); })[0]; return sc ? sc.src.replace(/[^\/]*$/, '') : ''; })();
  function load(src) { return new Promise(function (ok, no) { var x = document.createElement('script'); x.src = TB + src; x.onload = ok; x.onerror = no; document.head.appendChild(x); }); }
  var RD = null;
  function reader() {
    if (!RD) RD = Promise.all([window.AWBRead ? 0 : load('awb-reader.js?v=2'), fetch(TB + 'awb-data.json?v=1').then(function (x) { return x.json(); })]).then(function (a) { return { R: window.AWBRead, D: a[1] }; });
    return RD;
  }
  var upm = document.getElementById('tk-upm');
  function msg(t, p) { upm.innerHTML = h(t) + (p != null ? '<div class="bar"><i style="width:' + Math.round(p * 100) + '%"></i></div>' : ''); }
  document.getElementById('tk-file').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
    msg('Reading ' + f.name + '…', 0.03); res.innerHTML = '';
    reader().then(function (o) { return o.R.read(f, o.D, function (p) { msg(p.stage + '…', p.p); }); }).then(function (r) {
      var a = r && r.fields && r.fields.awb;
      if (!a) { upm.innerHTML = '<span class="tk-bad" style="font-size:13.5px">We couldn\'t find an air waybill number in this file. Please type it above, or WhatsApp us the copy and we\'ll track it for you.</span>'; return; }
      var ok = a.conf === 'ok';
      upm.innerHTML = (ok ? '<span class="tk-ok" style="font-size:13.5px">✓ Read from your file: AWB ' : '<span style="color:#8A5A00">Read from your file: AWB ') + h(a.v) + (r.isHouse ? ' (this looks like a house AWB; we used the airline\'s master AWB number on it)' : '') + (ok ? '' : '. ' + h(a.why || 'Please compare it with your document.')) + '</span>';
      q.value = a.v; run();
    }).catch(function () { RD = null; upm.innerHTML = '<span class="tk-bad" style="font-size:13.5px">Sorry, this file could not be read here. Please type the number above.</span>'; });
  });

  // ---- branded one-page tracking summary (PDF) ----
  function summary() {
    var b = document.getElementById('tk-sum'); if (b) b.disabled = true;
    var need = [window.jspdf ? 0 : load('vendor/jspdf.umd.min.js'), window.YAMBrand ? 0 : load('yam-brand.js?v=2')];
    Promise.all(need).then(function () { var BR = window.YAMBrand; BR.logoSrc = TB + 'yam-logo.svg'; BR.qrSrc = TB + 'yam-qr.png'; return BR.ready(); }).then(function (BR) {
      var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' }), W = 210, M = 16, y = 40;
      var kind = (res.querySelector('.tk-kind') || {}).textContent || '', who = (res.querySelector('.tk-h') || {}).textContent || '', num = (res.querySelector('.tk-num') || {}).textContent || '';
      var chk = res.querySelector('.tk-ok') ? 'Check digit valid' : res.querySelector('.tk-bad') ? 'Check digit does not match: please re-check the number' : '';
      var link = res.querySelector('.tk-b.pri'), lt = link ? link.querySelector('b').textContent.replace(' ↗', '') : '', lh = link ? link.href : '';
      var when = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      BR.header(doc, 'Tracking summary', when); BR.footer(doc, 'Live status is shown on the carrier\'s own website. This summary records the number and where to track it.');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(94, 120, 145); doc.text(kind, M, y); y += 9;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(11, 42, 74); doc.text(doc.splitTextToSize(who, W - 2 * M), M, y); y += 11;
      doc.setFont('courier', 'bold'); doc.setFontSize(18); doc.setTextColor(23, 67, 107); doc.text(num, M, y); y += 8;
      if (chk) { doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(chk[0] === 'C' && chk.indexOf('not') < 0 ? 15 : 180, chk.indexOf('not') < 0 ? 123 : 35, chk.indexOf('not') < 0 ? 63 : 24); doc.text(chk, M, y); y += 10; }
      doc.setFillColor(242, 248, 253); doc.roundedRect(M, y, W - 2 * M, 34, 3, 3, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(11, 42, 74); doc.text('Where to see the live status', M + 6, y + 9);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(43, 66, 92);
      doc.text(doc.splitTextToSize(lt || 'On the carrier\'s own tracking page', W - 2 * M - 12), M + 6, y + 16);
      if (lh) { doc.setTextColor(10, 108, 194); doc.textWithLink(doc.splitTextToSize(lh, W - 2 * M - 12)[0], M + 6, y + 23, { url: lh }); }
      doc.setTextColor(94, 120, 145); doc.setFontSize(9); doc.text('Track it again any time at www.yamlogistics.com/track-shipment', M + 6, y + 30); y += 44;
      BR.promo(doc, M, y, W - 2 * M, 'Need this shipment cleared or delivered? Talk to YAM.'); y += 38;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(94, 120, 145);
      doc.text(doc.splitTextToSize('YAM Logistics Pvt. Ltd. is a licensed customs broker (since 1992) with offices in New Delhi, Mumbai (sea and air) and Mundra. Customs clearance, sea and air freight, ICD trucking, insurance and project cargo.', W - 2 * M), M, y);
      BR.finish(doc);
      doc.save('YAM-tracking-' + (res.getAttribute('data-n') || 'summary').replace(/[^A-Z0-9-]/gi, '') + '.pdf');
    }).catch(function () { toast('Sorry, the PDF could not be created in this browser.'); }).then(function () { if (b) b.disabled = false; });
  }
  var u = new URLSearchParams(location.search).get('n'); if (u) { q.value = u; run(); }
  showRec();
})();
