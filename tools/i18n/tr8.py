# Translations for step 8 (AWB label generator: how-to, check digit and series tool, new FAQs).
# Writes tr/s8-out-<lang>.json for every key in tr/s8-in-<lang>.json (+ partial8.json keys added to the input).
import json, os
H = os.path.dirname(os.path.abspath(__file__))
LANGS = 'ar de es fr hi ja ko pt ru zh'.split()
K = lambda *v: dict(zip(LANGS, v))
T = {
'How to make AWB labels': K('كيفية إنشاء ملصقات AWB', 'So erstellen Sie AWB-Etiketten', 'Cómo hacer etiquetas AWB', 'Comment créer des étiquettes AWB', 'AWB लेबल कैसे बनाएँ', 'AWBラベルの作り方', 'AWB 라벨 만드는 방법', 'Como fazer etiquetas AWB', 'Как сделать этикетки AWB', '如何制作 AWB 标签'),
'Enter the air waybill.': K('أدخل بوليصة الشحن الجوي.', 'Luftfrachtbrief eingeben.', 'Introduzca la guía aérea.', 'Saisissez la lettre de transport aérien.', 'एयर वेबिल दर्ज करें।', '航空運送状を入力します。', '항공화물운송장을 입력합니다.', 'Informe o conhecimento aéreo.', 'Введите авианакладную.', '输入航空运单。'),
'Add destination and pieces.': K('أضف الوجهة وعدد الطرود.', 'Ziel und Packstücke angeben.', 'Añada destino y bultos.', 'Ajoutez la destination et les colis.', 'गंतव्य और पैकेज जोड़ें।', '仕向地と個数を入力します。', '목적지와 개수를 입력합니다.', 'Adicione destino e volumes.', 'Укажите пункт назначения и места.', '添加目的地和件数。'),
'Check the preview.': K('راجع المعاينة.', 'Vorschau prüfen.', 'Revise la vista previa.', "Vérifiez l'aperçu.", 'प्रीव्यू जाँचें।', 'プレビューを確認します。', '미리보기를 확인합니다.', 'Confira a pré-visualização.', 'Проверьте предпросмотр.', '检查预览。'),
'Each label shows the airline, AWB number, destination, pieces and a Code {0} barcode with the piece number. Step through the pieces to check them.':
 K('يعرض كل ملصق شركة الطيران ورقم بوليصة الشحن والوجهة وعدد الطرود وباركود Code {0} مع رقم الطرد. تنقّل بين الطرود للتحقق منها.',
   'Jedes Etikett zeigt Fluggesellschaft, AWB-Nummer, Ziel, Packstücke und einen Code-{0}-Barcode mit der Packstücknummer. Blättern Sie durch die Packstücke, um sie zu prüfen.',
   'Cada etiqueta muestra la aerolínea, el número AWB, el destino, los bultos y un código de barras Code {0} con el número de bulto. Recorra los bultos para revisarlos.',
   "Chaque étiquette indique la compagnie aérienne, le numéro AWB, la destination, les colis et un code-barres Code {0} avec le numéro du colis. Parcourez les colis pour les vérifier.",
   'हर लेबल पर एयरलाइन, AWB नंबर, गंतव्य, पैकेज और पैकेज नंबर के साथ Code {0} बारकोड दिखता है। जाँचने के लिए पैकेज एक-एक कर देखें।',
   '各ラベルには航空会社、AWB番号、仕向地、個数、個番号入りのCode {0}バーコードが表示されます。個ごとに切り替えて確認してください。',
   '각 라벨에는 항공사, AWB 번호, 목적지, 개수, 화물 번호가 들어간 Code {0} 바코드가 표시됩니다. 화물별로 넘겨 가며 확인하세요.',
   'Cada etiqueta mostra a companhia aérea, o número AWB, o destino, os volumes e um código de barras Code {0} com o número do volume. Percorra os volumes para conferir.',
   'На каждой этикетке — авиакомпания, номер AWB, пункт назначения, количество мест и штрихкод Code {0} с номером места. Пролистайте места, чтобы проверить их.',
   '每张标签显示航空公司、AWB 号码、目的地、件数以及带件号的 Code {0} 条码。逐件翻看进行核对。'),
'Print and stick.': K('اطبع والصق.', 'Drucken und aufkleben.', 'Imprima y pegue.', 'Imprimez et collez.', 'प्रिंट करें और चिपकाएँ।', '印刷して貼ります。', '인쇄해서 붙입니다.', 'Imprima e cole.', 'Распечатайте и наклейте.', '打印并粘贴。'),
'Download the PDF for a {0}x{1} inch thermal printer, {2}x{3} cm labels or A{4} sheets, and stick one label on each piece next to the address.':
 K('نزّل ملف PDF لطابعة حرارية {0}x{1} بوصة أو ملصقات {2}x{3} سم أو أوراق A{4}، والصق ملصقاً واحداً على كل طرد بجانب العنوان.',
   'Laden Sie das PDF für einen {0}x{1}-Zoll-Thermodrucker, {2}x{3}-cm-Etiketten oder A{4}-Bögen herunter und kleben Sie auf jedes Packstück ein Etikett neben die Adresse.',
   'Descargue el PDF para impresora térmica de {0}x{1} pulgadas, etiquetas de {2}x{3} cm u hojas A{4}, y pegue una etiqueta en cada bulto junto a la dirección.',
   "Téléchargez le PDF pour une imprimante thermique {0}x{1} pouces, des étiquettes {2}x{3} cm ou des feuilles A{4}, et collez une étiquette sur chaque colis à côté de l'adresse.",
   '{0}x{1} इंच थर्मल प्रिंटर, {2}x{3} सेमी लेबल या A{4} शीट के लिए PDF डाउनलोड करें, और हर पैकेज पर पते के पास एक लेबल चिपकाएँ।',
   '{0}x{1}インチのサーマルプリンター、{2}x{3} cmラベル、またはA{4}用紙用のPDFをダウンロードし、各貨物の宛先の横にラベルを1枚貼ります。',
   '{0}x{1}인치 감열 프린터, {2}x{3} cm 라벨 또는 A{4} 용지용 PDF를 내려받아 각 화물의 주소 옆에 라벨을 한 장씩 붙이세요.',
   'Baixe o PDF para impressora térmica de {0}x{1} polegadas, etiquetas de {2}x{3} cm ou folhas A{4}, e cole uma etiqueta em cada volume ao lado do endereço.',
   'Скачайте PDF для термопринтера {0}x{1} дюйма, этикеток {2}x{3} см или листов A{4} и наклейте по одной этикетке на каждое место рядом с адресом.',
   '下载适用于 {0}x{1} 英寸热敏打印机、{2}x{3} 厘米标签或 A{4} 纸的 PDF，并在每件货物的地址旁贴一张标签。'),
'A sample label from this tool (example AWB number, not a real shipment).':
 K('ملصق نموذجي من هذه الأداة (رقم بوليصة توضيحي وليس شحنة حقيقية).', 'Ein Beispieletikett aus diesem Tool (Beispiel-AWB-Nummer, keine echte Sendung).', 'Una etiqueta de ejemplo de esta herramienta (número AWB de ejemplo, no un envío real).', "Une étiquette d'exemple créée avec cet outil (numéro AWB fictif, pas un envoi réel).", 'इस टूल से बना एक नमूना लेबल (उदाहरण AWB नंबर, असली शिपमेंट नहीं)।', 'このツールで作成したラベルの例（AWB番号は例で、実際の貨物ではありません）。', '이 도구로 만든 라벨 예시 (예시 AWB 번호이며 실제 화물이 아닙니다).', 'Uma etiqueta de exemplo desta ferramenta (número AWB de exemplo, não é um embarque real).', 'Пример этикетки из этого инструмента (номер AWB условный, не реальная отправка).', '本工具生成的示例标签（示例 AWB 号码，并非真实货物）。'),
'AWB number check digit and series generator': K('رقم التحقق لبوليصة AWB ومولّد السلسلة', 'AWB-Prüfziffer und Nummernreihen-Generator', 'Dígito de control AWB y generador de series', 'Chiffre de contrôle AWB et générateur de séries', 'AWB नंबर चेक डिजिट और सीरीज़ जनरेटर', 'AWB番号のチェックデジットと連番作成', 'AWB 번호 검증 숫자와 일련번호 생성기', 'Dígito verificador AWB e gerador de séries', 'Контрольная цифра AWB и генератор серий номеров', 'AWB 号码校验位与号段生成器'),
'Check an AWB number': K('تحقق من رقم AWB', 'AWB-Nummer prüfen', 'Comprobar un número AWB', 'Vérifier un numéro AWB', 'AWB नंबर जाँचें', 'AWB番号をチェック', 'AWB 번호 확인', 'Verificar um número AWB', 'Проверить номер AWB', '校验 AWB 号码'),
'Generate an AWB series': K('أنشئ سلسلة أرقام AWB', 'AWB-Nummernreihe erzeugen', 'Generar una serie AWB', 'Générer une série AWB', 'AWB सीरीज़ बनाएँ', 'AWB連番を作成', 'AWB 일련번호 생성', 'Gerar uma série AWB', 'Создать серию номеров AWB', '生成 AWB 号段'),
'First AWB number in your stock': K('أول رقم AWB في مخزونك', 'Erste AWB-Nummer in Ihrem Bestand', 'Primer número AWB de su stock', 'Premier numéro AWB de votre stock', 'आपके स्टॉक का पहला AWB नंबर', '手持ちストックの最初のAWB番号', '보유 재고의 첫 AWB 번호', 'Primeiro número AWB do seu estoque', 'Первый номер AWB в вашем стоке', '您库存中的第一个 AWB 号码'),
'How many numbers ({0} to {1})': K('كم رقماً ({0} إلى {1})', 'Wie viele Nummern ({0} bis {1})', 'Cuántos números ({0} a {1})', 'Combien de numéros ({0} à {1})', 'कितने नंबर ({0} से {1})', '番号の数（{0}〜{1}）', '번호 개수 ({0}~{1})', 'Quantos números ({0} a {1})', 'Сколько номеров (от {0} до {1})', '号码数量（{0} 至 {1}）'),
'List numbers': K('اعرض الأرقام', 'Nummern auflisten', 'Listar números', 'Lister les numéros', 'नंबर दिखाएँ', '番号を表示', '번호 나열', 'Listar números', 'Показать номера', '列出号码'),
'Copy': K('نسخ', 'Kopieren', 'Copiar', 'Copier', 'कॉपी करें', 'コピー', '복사', 'Copiar', 'Копировать', '复制'),
'How do I generate an AWB number series?': K('كيف أنشئ سلسلة أرقام AWB؟', 'Wie erzeuge ich eine AWB-Nummernreihe?', '¿Cómo genero una serie de números AWB?', 'Comment générer une série de numéros AWB ?', 'AWB नंबर सीरीज़ कैसे बनाएँ?', 'AWB番号の連番はどう作りますか？', 'AWB 일련번호는 어떻게 생성하나요?', 'Como gero uma série de números AWB?', 'Как создать серию номеров AWB?', '如何生成 AWB 号段？'),
'Enter the first air waybill number from the stock your airline allocated to you and how many numbers you need. The tool adds {0} to the {1}-digit serial each time and works out the check digit, so {2}-{3} is followed by {4}-{5} and {6}-{7}. Use only numbers the airline has issued to you.':
 K('أدخل أول رقم بوليصة شحن جوي من المخزون الذي خصصته لك شركة الطيران وعدد الأرقام التي تحتاجها. تضيف الأداة {0} إلى الرقم التسلسلي المكوّن من {1} أرقام في كل مرة وتحسب رقم التحقق، فيلي {2}-{3} الرقمان {4}-{5} و{6}-{7}. استخدم فقط الأرقام التي أصدرتها لك شركة الطيران.',
   'Geben Sie die erste Luftfrachtbriefnummer aus dem Bestand ein, den Ihnen die Fluggesellschaft zugeteilt hat, und wie viele Nummern Sie brauchen. Das Tool addiert jedes Mal {0} zur {1}-stelligen Seriennummer und berechnet die Prüfziffer, sodass auf {2}-{3} die Nummern {4}-{5} und {6}-{7} folgen. Verwenden Sie nur Nummern, die Ihnen die Fluggesellschaft zugeteilt hat.',
   'Introduzca el primer número de guía aérea del stock que le asignó la aerolínea y cuántos números necesita. La herramienta suma {0} al número de serie de {1} dígitos cada vez y calcula el dígito de control, así que a {2}-{3} le siguen {4}-{5} y {6}-{7}. Use solo números que la aerolínea le haya asignado.',
   "Saisissez le premier numéro de LTA du stock que la compagnie vous a attribué et le nombre de numéros voulus. L'outil ajoute {0} au numéro de série à {1} chiffres à chaque fois et calcule le chiffre de contrôle : après {2}-{3} viennent {4}-{5} et {6}-{7}. N'utilisez que des numéros attribués par la compagnie aérienne.",
   'एयरलाइन द्वारा आपको दिए गए स्टॉक का पहला एयर वेबिल नंबर और आपको चाहिए उतने नंबरों की संख्या दर्ज करें। टूल हर बार {1}-अंकों के सीरियल में {0} जोड़ता है और चेक डिजिट निकालता है, इसलिए {2}-{3} के बाद {4}-{5} और {6}-{7} आते हैं। केवल वही नंबर इस्तेमाल करें जो एयरलाइन ने आपको जारी किए हैं।',
   '航空会社から割り当てられたストックの最初の航空運送状番号と、必要な番号の数を入力します。ツールは{1}桁のシリアルに毎回{0}を足してチェックデジットを計算するので、{2}-{3}の次は{4}-{5}、{6}-{7}となります。航空会社から発行された番号だけを使ってください。',
   '항공사가 배정한 재고의 첫 항공화물운송장 번호와 필요한 번호 개수를 입력하세요. 도구가 {1}자리 일련번호에 매번 {0}을 더하고 검증 숫자를 계산하므로 {2}-{3} 다음은 {4}-{5}, {6}-{7}입니다. 항공사가 발급한 번호만 사용하세요.',
   'Informe o primeiro número de conhecimento aéreo do estoque que a companhia aérea lhe atribuiu e quantos números precisa. A ferramenta soma {0} ao número de série de {1} dígitos a cada vez e calcula o dígito verificador, então depois de {2}-{3} vêm {4}-{5} e {6}-{7}. Use apenas números emitidos pela companhia aérea para você.',
   'Введите первый номер авианакладной из стока, выделенного вам авиакомпанией, и нужное количество номеров. Инструмент каждый раз прибавляет {0} к {1}-значному серийному номеру и вычисляет контрольную цифру, поэтому за {2}-{3} следуют {4}-{5} и {6}-{7}. Используйте только номера, выданные вам авиакомпанией.',
   '输入航空公司分配给您的库存中第一个航空运单号码以及所需数量。工具每次在 {1} 位序列号上加 {0} 并计算校验位，因此 {2}-{3} 之后是 {4}-{5} 和 {6}-{7}。请只使用航空公司发给您的号码。'),
'How is the AWB check digit calculated?': K('كيف يُحسب رقم التحقق في بوليصة AWB؟', 'Wie wird die AWB-Prüfziffer berechnet?', '¿Cómo se calcula el dígito de control AWB?', 'Comment est calculé le chiffre de contrôle AWB ?', 'AWB चेक डिजिट कैसे निकाला जाता है?', 'AWBのチェックデジットはどう計算しますか？', 'AWB 검증 숫자는 어떻게 계산하나요?', 'Como é calculado o dígito verificador AWB?', 'Как рассчитывается контрольная цифра AWB?', 'AWB 校验位如何计算？'),
'Is an AWB label the same as an AWB sticker?': K('هل ملصق AWB هو نفسه ستيكر AWB؟', 'Ist ein AWB-Etikett dasselbe wie ein AWB-Aufkleber?', '¿Una etiqueta AWB es lo mismo que un adhesivo AWB?', "Une étiquette AWB est-elle la même chose qu'un autocollant AWB ?", 'क्या AWB लेबल और AWB स्टिकर एक ही हैं?', 'AWBラベルとAWBステッカーは同じですか？', 'AWB 라벨과 AWB 스티커는 같은 건가요?', 'Etiqueta AWB e adesivo AWB são a mesma coisa?', 'Этикетка AWB и наклейка AWB — это одно и то же?', 'AWB 标签和 AWB 贴纸是一回事吗？'),
'Yes. Forwarders and airlines call the piece label an AWB label, cargo label or AWB sticker. It is different from the air waybill document itself, which travels with the shipment.':
 K('نعم. يسمّي وكلاء الشحن وشركات الطيران ملصق الطرد ملصق AWB أو ملصق الشحنة أو ستيكر AWB. وهو يختلف عن مستند بوليصة الشحن الجوي نفسه الذي يرافق الشحنة.',
   'Ja. Spediteure und Fluggesellschaften nennen das Packstücketikett AWB-Etikett, Frachtetikett oder AWB-Aufkleber. Es ist nicht dasselbe wie der Luftfrachtbrief selbst, der die Sendung begleitet.',
   'Sí. Transitarios y aerolíneas llaman a la etiqueta del bulto etiqueta AWB, etiqueta de carga o adhesivo AWB. Es distinta del documento de guía aérea, que viaja con el envío.',
   "Oui. Transitaires et compagnies aériennes appellent l'étiquette du colis étiquette AWB, étiquette cargo ou autocollant AWB. Elle est différente du document LTA lui-même, qui accompagne l'envoi.",
   'हाँ। फ़्रेट फ़ॉरवर्डर और एयरलाइंस पैकेज लेबल को AWB लेबल, कार्गो लेबल या AWB स्टिकर कहते हैं। यह एयर वेबिल दस्तावेज़ से अलग है, जो शिपमेंट के साथ जाता है।',
   'はい。フォワーダーや航空会社は貨物に貼るラベルをAWBラベル、カーゴラベル、AWBステッカーと呼びます。貨物と一緒に送られる航空運送状そのものとは別物です。',
   '네. 포워더와 항공사는 화물에 붙이는 라벨을 AWB 라벨, 화물 라벨 또는 AWB 스티커라고 부릅니다. 화물과 함께 가는 항공화물운송장 서류 자체와는 다릅니다.',
   'Sim. Agentes de carga e companhias aéreas chamam a etiqueta do volume de etiqueta AWB, etiqueta de carga ou adesivo AWB. Ela é diferente do próprio documento do conhecimento aéreo, que acompanha o embarque.',
   'Да. Экспедиторы и авиакомпании называют этикетку на место этикеткой AWB, грузовой этикеткой или наклейкой AWB. Это не сама авианакладная, которая сопровождает груз.',
   '是的。货代和航空公司把贴在货物上的标签称为 AWB 标签、货运标签或 AWB 贴纸。它不同于随货同行的航空运单文件本身。'),
'Free AWB Label Generator: Print IATA Barcode Cargo Labels & Stickers | YAM Logistics':
 K('مولّد ملصقات AWB مجاني: اطبع ملصقات شحن جوي بباركود IATA | YAM Logistics', 'Kostenloser AWB-Etikettengenerator: IATA-Barcode-Frachtetiketten drucken | YAM Logistics', 'Generador gratuito de etiquetas AWB: imprima etiquetas de carga IATA con código de barras | YAM Logistics', "Générateur gratuit d'étiquettes AWB : imprimez des étiquettes cargo IATA à code-barres | YAM Logistics", 'मुफ़्त AWB लेबल जनरेटर: IATA बारकोड कार्गो लेबल और स्टिकर प्रिंट करें | YAM Logistics', '無料AWBラベル作成ツール：IATAバーコード貨物ラベルを印刷 | YAM Logistics', '무료 AWB 라벨 생성기: IATA 바코드 화물 라벨·스티커 인쇄 | YAM Logistics', 'Gerador gratuito de etiquetas AWB: imprima etiquetas de carga IATA com código de barras | YAM Logistics', 'Бесплатный генератор этикеток AWB: печать грузовых этикеток IATA со штрихкодом | YAM Logistics', '免费 AWB 标签生成器：打印 IATA 条码货运标签和贴纸 | YAM Logistics'),
'Make IATA air cargo labels (AWB stickers) free: one barcoded label per piece as a PDF for {0}x{1} thermal, {2}x{3} cm or A{4}. Reads your air waybill file. No sign-up.':
 K('أنشئ ملصقات شحن جوي IATA مجاناً: ملصق بباركود لكل طرد بصيغة PDF لطابعة حرارية {0}x{1} أو {2}x{3} سم أو A{4}. يقرأ ملف بوليصة الشحن. بدون تسجيل.',
   'IATA-Luftfrachtetiketten kostenlos erstellen: ein Barcode-Etikett pro Packstück als PDF für {0}x{1}-Thermo, {2}x{3} cm oder A{4}. Liest Ihren Luftfrachtbrief. Ohne Anmeldung.',
   'Cree gratis etiquetas de carga aérea IATA: una etiqueta con código de barras por bulto en PDF para térmica {0}x{1}, {2}x{3} cm o A{4}. Lee su guía aérea. Sin registro.',
   "Créez gratuitement des étiquettes de fret aérien IATA : une étiquette à code-barres par colis en PDF pour thermique {0}x{1}, {2}x{3} cm ou A{4}. Lit votre LTA. Sans inscription.",
   'IATA एयर कार्गो लेबल मुफ़्त बनाएँ: हर पैकेज के लिए एक बारकोड लेबल, {0}x{1} थर्मल, {2}x{3} सेमी या A{4} के लिए PDF में। आपकी एयर वेबिल फ़ाइल पढ़ता है। बिना साइन-अप।',
   'IATA航空貨物ラベルを無料で作成：1個につき1枚のバーコードラベルを{0}x{1}サーマル、{2}x{3} cm、A{4}用PDFで。航空運送状ファイルを読み取り。登録不要。',
   'IATA 항공화물 라벨을 무료로: 화물마다 바코드 라벨 한 장, {0}x{1} 감열·{2}x{3} cm·A{4}용 PDF. 항공화물운송장 파일 인식. 가입 불필요.',
   'Crie grátis etiquetas de carga aérea IATA: uma etiqueta com código de barras por volume em PDF para térmica {0}x{1}, {2}x{3} cm ou A{4}. Lê seu conhecimento aéreo. Sem cadastro.',
   'Бесплатно создавайте этикетки авиагруза IATA: по этикетке со штрихкодом на каждое место в PDF для термопринтера {0}x{1}, {2}x{3} см или A{4}. Читает файл авианакладной. Без регистрации.',
   '免费制作 IATA 航空货运标签：每件一张条码标签，PDF 适用于 {0}x{1} 热敏、{2}x{3} 厘米或 A{4}。可读取航空运单文件。无需注册。'),
'Airline': K('شركة الطيران', 'Fluggesellschaft', 'Aerolínea', 'Compagnie aérienne', 'एयरलाइन', '航空会社', '항공사', 'Companhia aérea', 'Авиакомпания', '航空公司'),
'(optional)': K('(اختياري)', '(optional)', '(opcional)', '(facultatif)', '(वैकल्पिक)', '（任意）', '(선택)', '(opcional)', '(необязательно)', '（可选）'),
'Enter {0} digits: {1}-digit prefix and {2}-digit serial.': K('أدخل {0} رقماً: بادئة من {1} أرقام ورقم تسلسلي من {2} أرقام.', 'Geben Sie {0} Ziffern ein: {1}-stelliges Präfix und {2}-stellige Seriennummer.', 'Introduzca {0} dígitos: prefijo de {1} y serie de {2}.', 'Saisissez {0} chiffres : préfixe de {1} et numéro de série de {2}.', '{0} अंक दर्ज करें: {1}-अंकों का प्रीफ़िक्स और {2}-अंकों का सीरियल।', '{0}桁を入力してください：{1}桁のプレフィックスと{2}桁のシリアル。', '{0}자리를 입력하세요: {1}자리 접두번호와 {2}자리 일련번호.', 'Informe {0} dígitos: prefixo de {1} e série de {2}.', 'Введите {0} цифр: {1}-значный префикс и {2}-значный серийный номер.', '请输入 {0} 位数字：{1} 位前缀和 {2} 位序列号。'),
'Enter the first AWB number: {0}-digit prefix and {1}-digit serial.': K('أدخل أول رقم AWB: بادئة من {0} أرقام ورقم تسلسلي من {1} أرقام.', 'Geben Sie die erste AWB-Nummer ein: {0}-stelliges Präfix und {1}-stellige Seriennummer.', 'Introduzca el primer número AWB: prefijo de {0} dígitos y serie de {1}.', 'Saisissez le premier numéro AWB : préfixe de {0} chiffres et numéro de série de {1}.', 'पहला AWB नंबर दर्ज करें: {0}-अंकों का प्रीफ़िक्स और {1}-अंकों का सीरियल।', '最初のAWB番号を入力してください：{0}桁のプレフィックスと{1}桁のシリアル。', '첫 AWB 번호를 입력하세요: {0}자리 접두번호와 {1}자리 일련번호.', 'Informe o primeiro número AWB: prefixo de {0} dígitos e série de {1}.', 'Введите первый номер AWB: {0}-значный префикс и {1}-значный серийный номер.', '请输入第一个 AWB 号码：{0} 位前缀和 {1} 位序列号。'),
'Clear everything typed on this form?': K('هل تريد مسح كل ما كُتب في هذا النموذج؟', 'Alles in diesem Formular Eingegebene löschen?', '¿Borrar todo lo escrito en este formulario?', 'Effacer tout ce qui a été saisi dans ce formulaire ?', 'इस फ़ॉर्म में लिखा सब कुछ मिटा दें?', 'このフォームに入力した内容をすべて消去しますか？', '이 양식에 입력한 내용을 모두 지울까요?', 'Apagar tudo o que foi digitado neste formulário?', 'Очистить всё, что введено в этой форме?', '清除此表单中输入的所有内容？'),
'Check digit should be {0}: {1}-{2}': K('يجب أن يكون رقم التحقق {0}: {1}-{2}', 'Die Prüfziffer sollte {0} sein: {1}-{2}', 'El dígito de control debería ser {0}: {1}-{2}', 'Le chiffre de contrôle devrait être {0} : {1}-{2}', 'चेक डिजिट {0} होना चाहिए: {1}-{2}', 'チェックデジットは{0}のはずです：{1}-{2}', '검증 숫자는 {0}이어야 합니다: {1}-{2}', 'O dígito verificador deveria ser {0}: {1}-{2}', 'Контрольная цифра должна быть {0}: {1}-{2}', '校验位应为 {0}：{1}-{2}'),
'✓ Check digit matches ({0}-{1}).': K('✓ رقم التحقق صحيح ({0}-{1}).', '✓ Prüfziffer stimmt ({0}-{1}).', '✓ El dígito de control coincide ({0}-{1}).', '✓ Le chiffre de contrôle correspond ({0}-{1}).', '✓ चेक डिजिट मेल खाता है ({0}-{1})।', '✓ チェックデジットは一致しています（{0}-{1}）。', '✓ 검증 숫자가 일치합니다 ({0}-{1}).', '✓ O dígito verificador confere ({0}-{1}).', '✓ Контрольная цифра совпадает ({0}-{1}).', '✓ 校验位正确（{0}-{1}）。'),
'⚠ Check digit is {0}, expected {1} ({2}-{3}).': K('⚠ رقم التحقق {0}، والمتوقع {1} ({2}-{3}).', '⚠ Prüfziffer ist {0}, erwartet {1} ({2}-{3}).', '⚠ El dígito de control es {0}, se esperaba {1} ({2}-{3}).', '⚠ Le chiffre de contrôle est {0}, attendu {1} ({2}-{3}).', '⚠ चेक डिजिट {0} है, अपेक्षित {1} ({2}-{3})।', '⚠ チェックデジットは{0}ですが、正しくは{1}です（{2}-{3}）。', '⚠ 검증 숫자가 {0}입니다. 예상값은 {1} ({2}-{3}).', '⚠ O dígito verificador é {0}, esperado {1} ({2}-{3}).', '⚠ Контрольная цифра {0}, ожидалась {1} ({2}-{3}).', '⚠ 校验位为 {0}，应为 {1}（{2}-{3}）。'),
'Choose between {0} and {1} numbers.': K('اختر بين {0} و{1} رقماً.', 'Wählen Sie zwischen {0} und {1} Nummern.', 'Elija entre {0} y {1} números.', 'Choisissez entre {0} et {1} numéros.', '{0} से {1} के बीच नंबर चुनें।', '{0}〜{1}の範囲で選んでください。', '{0}~{1} 사이로 선택하세요.', 'Escolha entre {0} e {1} números.', 'Выберите от {0} до {1} номеров.', '请选择 {0} 至 {1} 个号码。'),
'{0} numbers listed.': K('تم عرض {0} رقماً.', '{0} Nummern aufgelistet.', '{0} números listados.', '{0} numéros listés.', '{0} नंबर दिखाए गए।', '{0}件の番号を表示しました。', '{0}개 번호를 나열했습니다.', '{0} números listados.', 'Показано номеров: {0}.', '已列出 {0} 个号码。'),
'Copied.': K('تم النسخ.', 'Kopiert.', 'Copiado.', 'Copié.', 'कॉपी हो गया।', 'コピーしました。', '복사했습니다.', 'Copiado.', 'Скопировано.', '已复制。'),
# partial-match fixes
'Type the airline name or {0}-digit prefix and the {1}-digit air waybill number, or drop a PDF or photo of the air waybill and let the tool fill it in.':
 K('اكتب اسم شركة الطيران أو بادئتها المكوّنة من {0} أرقام ورقم بوليصة الشحن الجوي المكوّن من {1} رقماً، أو أسقط ملف PDF أو صورة للبوليصة ودع الأداة تملأ الحقول.',
   'Geben Sie den Namen der Fluggesellschaft oder das {0}-stellige Präfix und die {1}-stellige Luftfrachtbriefnummer ein, oder ziehen Sie ein PDF oder Foto des Luftfrachtbriefs hinein und lassen Sie das Tool ausfüllen.',
   'Escriba el nombre de la aerolínea o el prefijo de {0} dígitos y el número de guía aérea de {1} dígitos, o suelte un PDF o una foto de la guía aérea y deje que la herramienta lo rellene.',
   "Tapez le nom de la compagnie ou le préfixe à {0} chiffres et le numéro de LTA à {1} chiffres, ou déposez un PDF ou une photo de la LTA et laissez l'outil remplir les champs.",
   'एयरलाइन का नाम या {0}-अंकों का प्रीफ़िक्स और {1}-अंकों का एयर वेबिल नंबर लिखें, या एयर वेबिल का PDF या फ़ोटो डालें और टूल को भरने दें।',
   '航空会社名または{0}桁のプレフィックスと{1}桁の航空運送状番号を入力するか、航空運送状のPDFや写真をドロップしてツールに入力させます。',
   '항공사 이름이나 {0}자리 접두번호와 {1}자리 항공화물운송장 번호를 입력하거나, 운송장 PDF나 사진을 끌어다 놓아 도구가 채우게 하세요.',
   'Digite o nome da companhia aérea ou o prefixo de {0} dígitos e o número do conhecimento aéreo de {1} dígitos, ou solte um PDF ou foto do conhecimento aéreo e deixe a ferramenta preencher.',
   'Введите название авиакомпании или {0}-значный префикс и {1}-значный номер авианакладной либо перетащите PDF или фото авианакладной — инструмент заполнит поля сам.',
   '输入航空公司名称或 {0} 位前缀以及 {1} 位航空运单号码，或拖入航空运单的 PDF 或照片，让工具自动填写。'),
'Enter the destination airport and the total number of pieces. Origin, transfer points, piece weight, handling information and house waybill details are optional.':
 K('أدخل مطار الوجهة وإجمالي عدد الطرود. بلد المنشأ ونقاط الترانزيت ووزن الطرد ومعلومات المناولة وتفاصيل البوليصة الفرعية اختيارية.',
   'Geben Sie den Zielflughafen und die Gesamtzahl der Packstücke ein. Abgangsort, Umschlagpunkte, Packstückgewicht, Handhabungshinweise und House-AWB-Angaben sind optional.',
   'Introduzca el aeropuerto de destino y el total de bultos. Origen, puntos de transbordo, peso por bulto, información de manipulación y datos de la guía hija son opcionales.',
   "Saisissez l'aéroport de destination et le nombre total de colis. Origine, points de transit, poids du colis, informations de manutention et données de la LTA maison sont facultatifs.",
   'गंतव्य हवाई अड्डा और कुल पैकेज संख्या दर्ज करें। मूल स्थान, ट्रांसफ़र पॉइंट, पैकेज वज़न, हैंडलिंग जानकारी और हाउस वेबिल विवरण वैकल्पिक हैं।',
   '仕向地空港と総個数を入力します。出発地、経由地、1個あたりの重量、取扱情報、ハウス運送状の情報は任意です。',
   '목적지 공항과 총 개수를 입력하세요. 출발지, 환적지, 개당 중량, 취급 정보, 하우스 운송장 정보는 선택 사항입니다.',
   'Informe o aeroporto de destino e o total de volumes. Origem, pontos de transbordo, peso por volume, informações de manuseio e dados do conhecimento filhote são opcionais.',
   'Укажите аэропорт назначения и общее количество мест. Пункт отправления, пункты трансфера, вес места, информация по обработке и данные домашней накладной — по желанию.',
   '输入目的地机场和总件数。始发地、中转点、单件重量、操作信息和分运单信息为可选项。'),
'Sample IATA air cargo label made with the free AWB label generator: Emirates, air waybill {0}-{1} {2}, destination DXB, piece {3} of {4}, with Code {5} barcode':
 K('ملصق شحن جوي IATA نموذجي من مولّد ملصقات AWB المجاني: Emirates، بوليصة {0}-{1} {2}، الوجهة DXB، الطرد {3} من {4}، مع باركود Code {5}',
   'Beispiel für ein IATA-Luftfrachtetikett aus dem kostenlosen AWB-Etikettengenerator: Emirates, Luftfrachtbrief {0}-{1} {2}, Ziel DXB, Packstück {3} von {4}, mit Code-{5}-Barcode',
   'Etiqueta de carga aérea IATA de ejemplo hecha con el generador gratuito de etiquetas AWB: Emirates, guía aérea {0}-{1} {2}, destino DXB, bulto {3} de {4}, con código de barras Code {5}',
   "Exemple d'étiquette de fret aérien IATA créée avec le générateur gratuit d'étiquettes AWB : Emirates, LTA {0}-{1} {2}, destination DXB, colis {3} sur {4}, avec code-barres Code {5}",
   'मुफ़्त AWB लेबल जनरेटर से बना नमूना IATA एयर कार्गो लेबल: Emirates, एयर वेबिल {0}-{1} {2}, गंतव्य DXB, पैकेज {3} में से {4}, Code {5} बारकोड के साथ',
   '無料AWBラベル作成ツールで作ったIATA航空貨物ラベルの例：Emirates、航空運送状 {0}-{1} {2}、仕向地 DXB、{4}個中{3}個目、Code {5}バーコード付き',
   '무료 AWB 라벨 생성기로 만든 IATA 항공화물 라벨 예시: Emirates, 항공화물운송장 {0}-{1} {2}, 목적지 DXB, {4}개 중 {3}번째, Code {5} 바코드 포함',
   'Etiqueta de carga aérea IATA de exemplo feita com o gerador gratuito de etiquetas AWB: Emirates, conhecimento aéreo {0}-{1} {2}, destino DXB, volume {3} de {4}, com código de barras Code {5}',
   'Пример этикетки авиагруза IATA из бесплатного генератора этикеток AWB: Emirates, авианакладная {0}-{1} {2}, назначение DXB, место {3} из {4}, со штрихкодом Code {5}',
   '用免费 AWB 标签生成器制作的 IATA 航空货运标签示例：Emirates，航空运单 {0}-{1} {2}，目的地 DXB，第 {3} 件共 {4} 件，带 Code {5} 条码'),
'An air waybill number is a {0}-digit airline prefix and an {1}-digit serial. The last digit of the serial is a check digit: the first {2} digits divided by {3}, keep the remainder. Check one number, or list the next numbers in the stock your airline allocated to you.':
 K('يتكوّن رقم بوليصة الشحن الجوي من بادئة لشركة الطيران من {0} أرقام ورقم تسلسلي من {1} أرقام. آخر رقم في التسلسل هو رقم التحقق: اقسم أول {2} أرقام على {3} واحتفظ بالباقي. تحقق من رقم واحد، أو اعرض الأرقام التالية في المخزون الذي خصصته لك شركة الطيران.',
   'Eine Luftfrachtbriefnummer besteht aus einem {0}-stelligen Airline-Präfix und einer {1}-stelligen Seriennummer. Die letzte Ziffer ist eine Prüfziffer: die ersten {2} Ziffern geteilt durch {3}, der Rest. Prüfen Sie eine Nummer oder listen Sie die nächsten Nummern aus Ihrem zugeteilten Bestand auf.',
   'Un número de guía aérea es un prefijo de aerolínea de {0} dígitos y una serie de {1} dígitos. El último dígito de la serie es de control: los primeros {2} dígitos divididos entre {3}, se toma el resto. Compruebe un número o liste los siguientes del stock que le asignó la aerolínea.',
   "Un numéro de LTA se compose d'un préfixe compagnie à {0} chiffres et d'un numéro de série à {1} chiffres. Le dernier chiffre est un chiffre de contrôle : les {2} premiers chiffres divisés par {3}, on garde le reste. Vérifiez un numéro, ou listez les numéros suivants du stock attribué par la compagnie.",
   'एयर वेबिल नंबर में {0}-अंकों का एयरलाइन प्रीफ़िक्स और {1}-अंकों का सीरियल होता है। सीरियल का आख़िरी अंक चेक डिजिट है: पहले {2} अंकों को {3} से भाग दें और शेषफल लें। एक नंबर जाँचें, या एयरलाइन द्वारा दिए गए स्टॉक के अगले नंबर देखें।',
   '航空運送状番号は{0}桁の航空会社プレフィックスと{1}桁のシリアルで構成されます。シリアルの最後の桁はチェックデジットで、最初の{2}桁を{3}で割った余りです。1つの番号をチェックするか、割り当てられたストックの続きの番号を表示できます。',
   '항공화물운송장 번호는 {0}자리 항공사 접두번호와 {1}자리 일련번호로 이루어집니다. 일련번호의 마지막 자리는 검증 숫자로, 앞 {2}자리를 {3}로 나눈 나머지입니다. 번호 하나를 확인하거나 배정받은 재고의 다음 번호들을 나열하세요.',
   'Um número de conhecimento aéreo é um prefixo da companhia aérea de {0} dígitos e uma série de {1} dígitos. O último dígito da série é o verificador: os primeiros {2} dígitos divididos por {3}, fica o resto. Verifique um número ou liste os próximos do estoque que a companhia aérea lhe atribuiu.',
   'Номер авианакладной — это {0}-значный префикс авиакомпании и {1}-значный серийный номер. Последняя цифра серийного номера контрольная: первые {2} цифр делятся на {3}, берётся остаток. Проверьте один номер или выведите следующие номера из стока, выделенного вам авиакомпанией.',
   '航空运单号码由 {0} 位航空公司前缀和 {1} 位序列号组成。序列号最后一位是校验位：前 {2} 位除以 {3} 取余数。可校验单个号码，或列出航空公司分配给您的库存中的后续号码。'),
'Use only air waybill numbers issued to you by the airline. A few carriers use their own numbering, so a check digit mismatch is a warning, not proof of an error.':
 K('استخدم فقط أرقام البوليصة التي أصدرتها لك شركة الطيران. بعض الناقلين يستخدمون ترقيمهم الخاص، لذا فإن عدم تطابق رقم التحقق تنبيه وليس دليلاً على خطأ.',
   'Verwenden Sie nur Luftfrachtbriefnummern, die Ihnen die Fluggesellschaft zugeteilt hat. Einige Carrier nummerieren anders, daher ist eine abweichende Prüfziffer ein Hinweis, kein Beweis für einen Fehler.',
   'Use solo números de guía aérea que la aerolínea le haya asignado. Algunas aerolíneas usan su propia numeración, así que un dígito de control distinto es un aviso, no prueba de error.',
   "N'utilisez que des numéros de LTA attribués par la compagnie aérienne. Certains transporteurs ont leur propre numérotation : un chiffre de contrôle différent est un avertissement, pas la preuve d'une erreur.",
   'केवल वही एयर वेबिल नंबर इस्तेमाल करें जो एयरलाइन ने आपको जारी किए हैं। कुछ कैरियर अपनी नंबरिंग इस्तेमाल करते हैं, इसलिए चेक डिजिट का मेल न खाना चेतावनी है, गलती का सबूत नहीं।',
   '航空会社から発行された航空運送状番号だけを使ってください。独自の採番をする航空会社もあるため、チェックデジットの不一致は注意であり、誤りの証拠ではありません。',
   '항공사가 발급한 항공화물운송장 번호만 사용하세요. 일부 항공사는 자체 번호 체계를 쓰므로 검증 숫자 불일치는 경고일 뿐 오류의 증거는 아닙니다.',
   'Use apenas números de conhecimento aéreo emitidos para você pela companhia aérea. Algumas transportadoras usam numeração própria, então um dígito verificador divergente é um aviso, não prova de erro.',
   'Используйте только номера авианакладных, выданные вам авиакомпанией. Некоторые перевозчики используют свою нумерацию, поэтому несовпадение контрольной цифры — предупреждение, а не доказательство ошибки.',
   '请只使用航空公司发给您的航空运单号码。少数承运人使用自己的编号规则，因此校验位不符只是提示，并不一定是错误。'),
'The air waybill serial has {0} digits. The {1}th is normally the remainder when the first {2} digits are divided by {3}. For {4} the remainder is {5}, so the serial is {6}. A few carriers use their own numbering, so a mismatch is a warning, not proof of an error.':
 K('يتكوّن الرقم التسلسلي للبوليصة من {0} أرقام. الرقم رقم {1} هو عادةً باقي قسمة أول {2} أرقام على {3}. بالنسبة إلى {4} يكون الباقي {5}، فيصبح الرقم التسلسلي {6}. بعض الناقلين يستخدمون ترقيمهم الخاص، لذا فإن عدم التطابق تنبيه وليس دليلاً على خطأ.',
   'Die Seriennummer des Luftfrachtbriefs hat {0} Ziffern. Die {1}. ist normalerweise der Rest, wenn man die ersten {2} Ziffern durch {3} teilt. Für {4} ist der Rest {5}, die Seriennummer lautet also {6}. Einige Carrier nummerieren anders, daher ist eine Abweichung ein Hinweis, kein Beweis für einen Fehler.',
   'La serie de la guía aérea tiene {0} dígitos. El {1}.º suele ser el resto de dividir los primeros {2} dígitos entre {3}. Para {4} el resto es {5}, así que la serie es {6}. Algunas aerolíneas usan su propia numeración, así que una discrepancia es un aviso, no prueba de error.',
   "Le numéro de série de la LTA a {0} chiffres. Le {1}e est normalement le reste de la division des {2} premiers chiffres par {3}. Pour {4}, le reste est {5}, donc le numéro est {6}. Certains transporteurs ont leur propre numérotation : un écart est un avertissement, pas la preuve d'une erreur.",
   'एयर वेबिल सीरियल में {0} अंक होते हैं। {1}वाँ अंक आम तौर पर पहले {2} अंकों को {3} से भाग देने पर बचा शेषफल होता है। {4} के लिए शेषफल {5} है, इसलिए सीरियल {6} है। कुछ कैरियर अपनी नंबरिंग इस्तेमाल करते हैं, इसलिए मेल न खाना चेतावनी है, गलती का सबूत नहीं।',
   '航空運送状のシリアルは{0}桁です。{1}桁目は通常、最初の{2}桁を{3}で割った余りです。{4}なら余りは{5}なので、シリアルは{6}になります。独自の採番をする航空会社もあるため、不一致は注意であり、誤りの証拠ではありません。',
   '항공화물운송장 일련번호는 {0}자리입니다. {1}번째 자리는 보통 앞 {2}자리를 {3}로 나눈 나머지입니다. {4}의 나머지는 {5}이므로 일련번호는 {6}입니다. 일부 항공사는 자체 번호 체계를 쓰므로 불일치는 경고일 뿐 오류의 증거는 아닙니다.',
   'A série do conhecimento aéreo tem {0} dígitos. O {1}º normalmente é o resto da divisão dos primeiros {2} dígitos por {3}. Para {4} o resto é {5}, então a série é {6}. Algumas transportadoras usam numeração própria, então uma divergência é um aviso, não prova de erro.',
   'Серийный номер авианакладной состоит из {0} цифр. {1}-я цифра обычно равна остатку от деления первых {2} цифр на {3}. Для {4} остаток равен {5}, значит серийный номер {6}. Некоторые перевозчики используют свою нумерацию, поэтому несовпадение — предупреждение, а не доказательство ошибки.',
   '航空运单序列号共 {0} 位。第 {1} 位通常是前 {2} 位除以 {3} 的余数。例如 {4} 的余数是 {5}，所以序列号是 {6}。少数承运人使用自己的编号规则，因此不符只是提示，并不一定是错误。'),
}
partial = json.load(open(H + '/partial8.json'))
for g in LANGS:
    fin = H + '/tr/s8-in-%s.json' % g
    inp = json.load(open(fin))
    for k in partial:
        if k not in inp: inp.append(k)
    json.dump(inp, open(fin, 'w'), ensure_ascii=False, indent=1)
    out = {}
    for k in inp:
        out[k] = T[k][g] if k in T else k  # names, codes and brands stay as they are
    json.dump(out, open(H + '/tr/s8-out-%s.json' % g, 'w'), ensure_ascii=False, indent=1)
    unknown = [k for k in inp if k not in T]
    print(g, len(inp), 'kept as is:', unknown)
