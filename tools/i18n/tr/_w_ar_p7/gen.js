const fs=require('fs');
const inp=require('../p7-in-ar.json');
const T={
"{0}, {1}, {2}-T(ISO) ({3}, {4}, {5}-trichlorophenoxyacetic acid), its salts and esters":"{0}, {1}, {2}-T(ISO) ({3}, {4}, {5}-ثلاثي كلوروفينوكسي حمض الأسيتيك)، وأملاحه وإستراته",
"P-{0}-P methyl glycidic acid and its":"حمض P-{0}-P ميثيل غليسيديك ومشتقاته",
"Free India import duty calculator: search {0}+ HSN tariff lines by code or description, choose the country of origin and see BCD, social welfare surcharge, IGST, landed cost and DGFT import policy.":"حاسبة مجانية لرسوم الاستيراد في الهند: ابحث في أكثر من {0} بند تعريفة HSN بالرمز أو بالوصف، واختر بلد المنشأ لتعرف BCD ورسم الرعاية الاجتماعية وIGST والتكلفة الواصلة وسياسة الاستيراد الصادرة عن DGFT.",
"). Pick the line that matches and the duty rate fills in from the EU Common Customs Tariff (TARIC).":"). اختر البند المطابق وسيُدرج معدل الرسوم تلقائيًا من التعريفة الجمركية المشتركة للاتحاد الأوروبي (TARIC).",
"Duty is charged on the CIF value under the GCC common external tariff, which is mostly {0}% with many exceptions. Rates come from World Bank WITS applied tariff, {1} data, at the {2}-digit HS level. Where national lines inside one HS code differ, a range is shown and the highest is used; check the full {3}-digit national code (GCC states moved to {4} digits in {5}). Confirm on the":"تُحتسب الرسوم على قيمة CIF وفق التعريفة الخارجية المشتركة لدول GCC، وهي في معظمها {0}% مع استثناءات كثيرة. تأتي المعدلات من بيانات التعريفة المطبّقة في WITS التابع للبنك الدولي لعام {1}، على مستوى HS المكوّن من {2} أرقام. وحيثما تختلف البنود الوطنية ضمن رمز HS واحد يُعرض نطاق ويُعتمد الأعلى؛ تحقق من الرمز الوطني الكامل المكوّن من {3} أرقام (انتقلت دول GCC إلى {4} أرقام في {5}). وتأكد من ذلك عبر",
"). Pick the line that matches and the duty rate fills in from the World Bank WITS applied tariff, {0} data.":"). اختر البند المطابق وسيُدرج معدل الرسوم تلقائيًا من بيانات التعريفة المطبّقة في WITS التابع للبنك الدولي لعام {0}.",
". Saudi Arabia revised its tariff in December {0}, which this {1} data may not show. VAT of {2}% is charged on CIF plus duty.":". عدّلت المملكة العربية السعودية تعريفتها الجمركية في ديسمبر {0}، وقد لا تظهر في بيانات {1} هذه. وتُحتسب ضريبة القيمة المضافة VAT بنسبة {2}% على قيمة CIF مضافًا إليها الرسوم.",
"Rates are the general import duty (IGI) from World Bank WITS applied tariff, {0} data. The data uses the older HS numbering, so some current HS {1} codes appear under their earlier code (smartphones, for example, under {2}). Where tariff lines inside one HS code differ, a range is shown and the highest is used. The customs processing fee (DTA) is added at {3}% of customs value, and IVA of {4}% is charged on customs value plus IGI plus DTA. Lower rates and a flat DTA apply to goods from free-trade-agreement origins (such as USMCA); they are not applied here. IEPS excise tax and anti-dumping duties are not included. Confirm on the":"المعدلات هي رسوم الاستيراد العامة (IGI) من بيانات التعريفة المطبّقة في WITS التابع للبنك الدولي لعام {0}. تعتمد البيانات ترقيم HS الأقدم، لذلك تظهر بعض رموز HS {1} الحالية تحت رمزها السابق (الهواتف الذكية مثلًا تحت {2}). وحيثما تختلف بنود التعريفة ضمن رمز HS واحد يُعرض نطاق ويُعتمد الأعلى. تُضاف رسوم المعالجة الجمركية (DTA) بنسبة {3}% من القيمة الجمركية، وتُحتسب ضريبة IVA بنسبة {4}% على القيمة الجمركية مضافًا إليها IGI وDTA. تنطبق معدلات أقل ورسم DTA ثابت على البضائع ذات المنشأ من دول اتفاقيات التجارة الحرة (مثل USMCA)؛ ولا تُطبَّق هنا. ولا تشمل الحسبة ضريبة الإنتاج IEPS ولا رسوم مكافحة الإغراق. وتأكد من ذلك عبر",
"Other uncoated paper and paperboard, in roll s o rsh eets, not furth e rwo rke d o rprocessed than…":"ورق وكرتون آخر غير مطلي، في لفات أو ألواح، لم يُشغَّل أو يُعالَج أكثر من…",
"Machines and appliances for testing the hardness, strength, compressibility, elasticity or other mechanical properties of materials (for example, metals, wood, textiles, paper, plastics)":"آلات وأجهزة لاختبار صلادة المواد أو متانتها أو انضغاطيتها أو مرونتها أو غير ذلك من خواصها الميكانيكية (مثل المعادن والخشب والمنسوجات والورق واللدائن)",
"For use in civil aircraft":"للاستخدام في الطائرات المدنية",
"Breathing appliances (excluding parts thereof), for use in civil aircraft":"أجهزة التنفس (باستثناء أجزائها)، للاستخدام في الطائرات المدنية",
"Parts of respiratory apparatus and of gas masks, for use in certain types of aircraft":"أجزاء أجهزة التنفس والكمامات الواقية من الغازات، للاستخدام في أنواع معينة من الطائرات",
"Unmodified immunological products, being polyethers in the primary forms described in Note":"منتجات مناعية غير معدّلة، وهي بولي إيثرات بالأشكال الأولية الموصوفة في الملاحظة",
"Other uncoated paper and paperboard, in roll s o rsh eets, not furth e rwo rke d o rprocessed than as specified in note {0} to this › Testliner (recycled liner board): {1}":"ورق وكرتون آخر غير مطلي، في لفات أو ألواح، لم يُشغَّل أو يُعالَج أكثر مما هو محدد في الملاحظة {0} من هذا الفصل › Testliner (كرتون التبطين المعاد تدويره): {1}",
"). Pick the line that matches and the duty rate fills in from the Australian Border Force tariff.":"). اختر البند المطابق وسيُدرج معدل الرسوم تلقائيًا من تعريفة قوة الحدود الأسترالية (Australian Border Force).",
};
const out={};
for(const s of inp){
  let t=T[s];
  if(!t){
    const m=s.match(/^: ₹\{0\} per (\{1\} )?([A-Z]{3}) \(export rate ₹\{(\d)\}\)\. Exchange rate notification No\. \{(\d)\}\/\{(\d)\}, in force from \{(\d)\}\./);
    if(!m) throw new Error('unhandled '+s);
    const n=m[1]?'{1} ':'';
    t=`: ₹{0} لكل ${n}${m[2]} (سعر التصدير ₹{${m[3]}}). إشعار سعر الصرف رقم {${m[4]}}/{${m[5]}}، ساري المفعول اعتبارًا من {${m[6]}}. تعتمد الجمارك السعر السائد في تاريخ تقديم بيان الدخول (bill of entry). يمكنك تعديل هذا السعر.`;
  }
  out[s]=t;
}
fs.writeFileSync('/home/claude/yamlogistics-website/tools/i18n/tr/p7-out-ar.json',JSON.stringify(out,null,1));
