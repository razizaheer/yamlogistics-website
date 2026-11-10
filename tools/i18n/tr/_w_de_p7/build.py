import json,re
src=json.load(open('tr/p7-in-de.json',encoding='utf-8'))
pick="). Wählen Sie die passende Position aus, dann wird der Zollsatz aus "
fixed={
0:"Kostenloser Einfuhrzollrechner für Indien: Durchsuchen Sie {0}+ HSN-Zolltarifpositionen nach Code oder Beschreibung, wählen Sie das Ursprungsland und sehen Sie BCD, Sozialabgabe, IGST, Einstandskosten und die DGFT-Einfuhrpolitik.",
1:pick+"dem Gemeinsamen Zolltarif der EU (TARIC) übernommen.",
2:"Der Zoll wird auf den CIF-Wert nach dem gemeinsamen Außenzolltarif der GCC erhoben, der überwiegend {0}% beträgt, mit vielen Ausnahmen. Die Sätze stammen aus den angewandten Zöllen der Weltbank (WITS), Daten {1}, auf HS-Ebene mit {2} Stellen. Weichen nationale Tariflinien innerhalb eines HS-Codes voneinander ab, wird eine Spanne angezeigt und der höchste Satz verwendet; prüfen Sie den vollständigen nationalen Code mit {3} Stellen (die GCC-Staaten sind im Jahr {5} auf {4} Stellen umgestiegen). Bestätigen Sie dies auf der",
3:pick+"den angewandten Zöllen der Weltbank (WITS), Daten {0}, übernommen.",
4:". Saudi-Arabien hat seinen Tarif im Dezember {0} überarbeitet, was in diesen Daten ({1}) möglicherweise noch nicht abgebildet ist. Auf CIF plus Zoll wird eine Mehrwertsteuer von {2}% erhoben.",
5:"Die Sätze entsprechen dem allgemeinen Einfuhrzoll (IGI) aus den angewandten Zöllen der Weltbank (WITS), Daten {0}. Die Daten verwenden die ältere HS-Nummerierung, daher erscheinen einige aktuelle HS-{1}-Codes unter ihrem früheren Code (Smartphones zum Beispiel unter {2}). Weichen Tariflinien innerhalb eines HS-Codes voneinander ab, wird eine Spanne angezeigt und der höchste Satz verwendet. Die Zollabfertigungsgebühr (DTA) wird mit {3}% des Zollwerts hinzugerechnet, und IVA von {4}% wird auf den Zollwert plus IGI plus DTA erhoben. Für Waren mit Ursprung in Freihandelsabkommen-Ländern (etwa USMCA) gelten niedrigere Sätze und eine pauschale DTA; diese werden hier nicht angewendet. Die Verbrauchsteuer IEPS und Antidumpingzölle sind nicht enthalten. Bestätigen Sie dies auf der",
6:"Maschinen und Geräte zur Prüfung der Härte, Festigkeit, Druckverformbarkeit, Elastizität oder anderer mechanischer Eigenschaften von Werkstoffen (z. B. Metalle, Holz, Textilien, Papier, Kunststoffe)",
7:"Teile von Atemschutzgeräten und Gasmasken zur Verwendung in bestimmten Luftfahrzeugtypen",
8:pick+"dem Zolltarif der Australian Border Force übernommen.",
}
out={}
for i,s in enumerate(src):
    if i in fixed: out[s]=fixed[i]; continue
    m=re.match(r": ₹\{0\} per (\{1\} )?([A-Z]{3}) \(export rate ₹\{(\d)\}\)\. Exchange rate notification No\. \{(\d)\}/\{(\d)\}, in force from \{(\d)\}\.",s)
    assert m,s
    q=m.group(1) or ''
    cur=m.group(2); e,a,b,d=m.group(3),m.group(4),m.group(5),m.group(6)
    out[s]=f": ₹{{0}} pro {q}{cur} (Exportkurs ₹{{{e}}}). Wechselkursbekanntmachung Nr. {{{a}}}/{{{b}}}, gültig ab {{{d}}}. Der Zoll verwendet den Kurs, der am Tag der Einreichung der Einfuhranmeldung (Bill of Entry) gilt. Sie können diesen Kurs bearbeiten."
json.dump(out,open('tr/p7-out-de.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
