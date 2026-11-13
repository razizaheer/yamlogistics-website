# cc|Country|Region|Port|LOCODE|svc(d,f,t,L)|hub or gateway-country text
ROWS = """
LK|Sri Lanka|South Asia|Colombo|LKCMB|d|
BD|Bangladesh|South Asia|Chattogram (Chittagong)|BDCGP|f|Colombo
MV|Maldives|South Asia|Malé|MVMLE|t|Colombo
MM|Myanmar|South Asia|Yangon|MMRGN|t|Singapore or Port Klang
AE|United Arab Emirates|Gulf and Middle East|Jebel Ali|AEJEA|d|
SA|Saudi Arabia|Gulf and Middle East|Jeddah|SAJED|d|
OM|Oman|Gulf and Middle East|Sohar|OMSOH|d|
QA|Qatar|Gulf and Middle East|Hamad Port|QAHMD|d|
KW|Kuwait|Gulf and Middle East|Shuwaikh|KWSWK|d|
BH|Bahrain|Gulf and Middle East|Khalifa Bin Salman Port|BHKBS|d|
IQ|Iraq|Gulf and Middle East|Umm Qasr|IQUQR|f|Jebel Ali
IR|Iran|Gulf and Middle East|Bandar Abbas|IRBND|f|Jebel Ali
JO|Jordan|Gulf and Middle East|Aqaba|JOAQJ|f|Jeddah
EG|Egypt|Gulf and Middle East|Port Said|EGPSD|d|
IL|Israel|Gulf and Middle East|Haifa|ILHFA|f|Port Said, Piraeus or Mersin
LB|Lebanon|Gulf and Middle East|Beirut|LBBEY|f|Port Said or Piraeus
TR|Türkiye|Gulf and Middle East|Istanbul (Ambarli)|TRAMR|d|
SG|Singapore|Southeast Asia|Singapore|SGSIN|d|
MY|Malaysia|Southeast Asia|Port Klang|MYPKG|d|
TH|Thailand|Southeast Asia|Laem Chabang|THLCH|d|
VN|Vietnam|Southeast Asia|Ho Chi Minh City (Cat Lai, Cai Mep)|VNSGN|f|Singapore or Port Klang
ID|Indonesia|Southeast Asia|Jakarta (Tanjung Priok)|IDJKT|f|Singapore or Port Klang
PH|Philippines|Southeast Asia|Manila|PHMNL|t|Singapore, Port Klang or Kaohsiung
KH|Cambodia|Southeast Asia|Sihanoukville|KHKOS|t|Singapore or Laem Chabang
BN|Brunei|Southeast Asia|Muara|BNMUA|t|Singapore or Port Klang
LA|Laos|Southeast Asia|Laem Chabang|THLCH|L|Thailand
CN|China|East Asia|Shanghai|CNSHA|d|
HK|Hong Kong|East Asia|Hong Kong|HKHKG|d|
TW|Taiwan|East Asia|Kaohsiung|TWKHH|f|Singapore or Hong Kong
KR|South Korea|East Asia|Busan|KRPUS|d|
JP|Japan|East Asia|Yokohama|JPYOK|f|Singapore, Shanghai or Busan
MN|Mongolia|East Asia|Tianjin (Xingang)|CNTXG|L|China
NL|Netherlands|Europe|Rotterdam|NLRTM|d|
BE|Belgium|Europe|Antwerp|BEANR|d|
DE|Germany|Europe|Hamburg|DEHAM|d|
GB|United Kingdom|Europe|London Gateway or Felixstowe|GBFXT|d|
FR|France|Europe|Le Havre|FRLEH|d|
ES|Spain|Europe|Valencia|ESVLC|d|
PT|Portugal|Europe|Sines|PTSIE|f|Tanger Med, Algeciras or Valencia
IT|Italy|Europe|Genoa|ITGOA|d|
GR|Greece|Europe|Piraeus|GRPIR|d|
MT|Malta|Europe|Marsaxlokk|MTMAR|f|Port Said or Piraeus
CY|Cyprus|Europe|Limassol|CYLMS|t|Port Said or Piraeus
SI|Slovenia|Europe|Koper|SIKOP|f|Piraeus or Port Said
HR|Croatia|Europe|Rijeka|HRRJK|f|Piraeus or Port Said
AL|Albania|Europe|Durrës|ALDRZ|t|Piraeus or Gioia Tauro
ME|Montenegro|Europe|Bar|MEBAR|t|Piraeus or Gioia Tauro
BG|Bulgaria|Europe|Varna|BGVAR|t|Istanbul (Ambarli) or Piraeus
RO|Romania|Europe|Constanta|ROCND|t|Istanbul (Ambarli) or Piraeus
GE|Georgia|Europe|Poti|GEPTI|t|Istanbul (Ambarli) or Piraeus
PL|Poland|Europe|Gdansk|PLGDN|f|Rotterdam, Hamburg or Antwerp
LT|Lithuania|Europe|Klaipeda|LTKLJ|f|Rotterdam, Hamburg or Antwerp
LV|Latvia|Europe|Riga|LVRIX|t|Rotterdam, Hamburg or Antwerp
EE|Estonia|Europe|Tallinn (Muuga)|EETLL|t|Rotterdam, Hamburg or Antwerp
FI|Finland|Europe|Helsinki|FIHEL|t|Rotterdam, Hamburg or Antwerp
SE|Sweden|Europe|Gothenburg|SEGOT|t|Rotterdam, Hamburg or Antwerp
DK|Denmark|Europe|Aarhus|DKAAR|t|Rotterdam, Hamburg or Antwerp
NO|Norway|Europe|Oslo|NOOSL|t|Rotterdam, Hamburg or Antwerp
IS|Iceland|Europe|Reykjavik|ISREY|t|Rotterdam or Hamburg
IE|Ireland|Europe|Dublin|IEDUB|t|Rotterdam, Antwerp or a UK port
CH|Switzerland|Europe|Rotterdam|NLRTM|L|the Netherlands
AT|Austria|Europe|Hamburg|DEHAM|L|Germany
CZ|Czechia|Europe|Hamburg|DEHAM|L|Germany
SK|Slovakia|Europe|Koper|SIKOP|L|Slovenia
HU|Hungary|Europe|Koper|SIKOP|L|Slovenia
RS|Serbia|Europe|Piraeus|GRPIR|L|Greece
MK|North Macedonia|Europe|Thessaloniki|GRSKG|L|Greece
LU|Luxembourg|Europe|Antwerp|BEANR|L|Belgium
AM|Armenia|Europe|Poti|GEPTI|L|Georgia
AZ|Azerbaijan|Europe|Poti|GEPTI|L|Georgia
MA|Morocco|Africa|Tanger Med|MAPTM|d|
DZ|Algeria|Africa|Algiers|DZALG|t|Tanger Med, Algeciras or Valencia
TN|Tunisia|Africa|Radès (Tunis)|TNRDS|t|Malta, Gioia Tauro or Piraeus
LY|Libya|Africa|Misrata|LYMRA|t|Malta or Port Said
KE|Kenya|Africa|Mombasa|KEMBA|f|Jebel Ali or Salalah
TZ|Tanzania|Africa|Dar es Salaam|TZDAR|f|Jebel Ali or Mombasa
DJ|Djibouti|Africa|Djibouti|DJJIB|f|Jebel Ali or Jeddah
MZ|Mozambique|Africa|Maputo|MZMPM|f|Durban
MG|Madagascar|Africa|Toamasina|MGTOA|t|Port Louis or Réunion
MU|Mauritius|Africa|Port Louis|MUPLU|f|Colombo
SC|Seychelles|Africa|Victoria|SCPOV|t|Colombo, Jebel Ali or Port Louis
ZA|South Africa|Africa|Durban|ZADUR|d|
NA|Namibia|Africa|Walvis Bay|NAWVB|t|Durban or Cape Town
AO|Angola|Africa|Luanda|AOLAD|t|Durban, Walvis Bay or Pointe-Noire
NG|Nigeria|Africa|Lagos (Apapa, Tin Can, Lekki)|NGAPP|f|Durban or Lomé
GH|Ghana|Africa|Tema|GHTEM|f|Durban or Lomé
CI|Côte d’Ivoire|Africa|Abidjan|CIABJ|f|Durban or Lomé
TG|Togo|Africa|Lomé|TGLFW|f|Durban
BJ|Benin|Africa|Cotonou|BJCOO|f|Lomé or Tema
SN|Senegal|Africa|Dakar|SNDKR|t|Tanger Med, Algeciras or Abidjan
CM|Cameroon|Africa|Douala|CMDLA|t|Lomé, Pointe-Noire or Tanger Med
GA|Gabon|Africa|Libreville (Owendo)|GALBV|t|Lomé or Pointe-Noire
CG|Republic of the Congo|Africa|Pointe-Noire|CGPNR|f|Durban or Lomé
CD|DR Congo|Africa|Matadi|CDMAT|t|Pointe-Noire
GN|Guinea|Africa|Conakry|GNCKY|t|Tanger Med, Algeciras or Abidjan
SL|Sierra Leone|Africa|Freetown|SLFNA|t|Tanger Med, Algeciras or Abidjan
LR|Liberia|Africa|Monrovia|LRMLW|t|Tanger Med, Algeciras or Abidjan
GM|Gambia|Africa|Banjul|GMBJL|t|Dakar, Tanger Med or Algeciras
MR|Mauritania|Africa|Nouakchott|MRNKC|t|Tanger Med, Algeciras or Las Palmas
ET|Ethiopia|Africa|Djibouti|DJJIB|L|Djibouti
UG|Uganda|Africa|Mombasa|KEMBA|L|Kenya
RW|Rwanda|Africa|Dar es Salaam|TZDAR|L|Tanzania
BI|Burundi|Africa|Dar es Salaam|TZDAR|L|Tanzania
SS|South Sudan|Africa|Mombasa|KEMBA|L|Kenya
ZM|Zambia|Africa|Dar es Salaam|TZDAR|L|Tanzania
ZW|Zimbabwe|Africa|Durban|ZADUR|L|South Africa
MW|Malawi|Africa|Beira|MZBEW|L|Mozambique
BW|Botswana|Africa|Durban|ZADUR|L|South Africa
LS|Lesotho|Africa|Durban|ZADUR|L|South Africa
SZ|Eswatini|Africa|Durban|ZADUR|L|South Africa
ML|Mali|Africa|Dakar|SNDKR|L|Senegal
BF|Burkina Faso|Africa|Abidjan|CIABJ|L|Côte d’Ivoire
NE|Niger|Africa|Cotonou|BJCOO|L|Benin
TD|Chad|Africa|Douala|CMDLA|L|Cameroon
CF|Central African Republic|Africa|Douala|CMDLA|L|Cameroon
US|United States, East Coast|North America|New York and New Jersey|USNYC|d|
US|United States, Gulf Coast|North America|Houston|USHOU|f|an East Coast port or Freeport (Bahamas)
US|United States, West Coast|North America|Los Angeles and Long Beach|USLAX|t|Singapore, Port Klang, Shanghai or Busan
CA|Canada, East|North America|Halifax|CAHAL|f|New York or a Mediterranean hub
CA|Canada, West|North America|Vancouver|CAVAN|t|Singapore, Shanghai or Busan
CU|Cuba|Caribbean|Mariel|CUMAR|t|Kingston, Caucedo or Cartagena
HT|Haiti|Caribbean|Port-au-Prince|HTPAP|t|Kingston or Caucedo
BS|Bahamas|Caribbean|Freeport|BSFPO|t|Kingston or a US East Coast port
BB|Barbados|Caribbean|Bridgetown|BBBGI|t|Kingston, Caucedo or Port of Spain
BZ|Belize|Caribbean|Belize City|BZBZE|t|Kingston or Cartagena
AU|Australia|Oceania|Sydney|AUSYD|t|Singapore, Port Klang or Colombo
NZ|New Zealand|Oceania|Auckland|NZAKL|t|Singapore or Port Klang
PG|Papua New Guinea|Oceania|Lae|PGLAE|t|Singapore
FJ|Fiji|Oceania|Suva|FJSUV|t|Singapore or Auckland
"""
