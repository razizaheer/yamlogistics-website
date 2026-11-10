import json,re
ins=json.load(open('tr/p7-in-es.json'))
M={
0:"Calculadora gratuita de aranceles de importación de India: busque más de {0} partidas arancelarias HSN por código o descripción, elija el país de origen y vea el BCD, el recargo de bienestar social, el IGST, el costo puesto en destino y la política de importación de la DGFT.",
1:"). Elija la partida que corresponda y la tasa arancelaria se completa a partir del Arancel Aduanero Común de la UE (TARIC).",
2:"El arancel se aplica sobre el valor CIF según el arancel externo común del GCC, que en su mayoría es del {0}%, con muchas excepciones. Las tasas provienen de los datos de aranceles aplicados de WITS del Banco Mundial, {1}, a nivel de {2} dígitos del SA. Cuando las partidas nacionales dentro de un mismo código SA difieren, se muestra un rango y se usa la tasa más alta; verifique el código nacional completo de {3} dígitos (los países del GCC pasaron a {4} dígitos en {5}). Confirme en el",
3:"). Elija la partida que corresponda y la tasa arancelaria se completa a partir de los datos de aranceles aplicados de WITS del Banco Mundial, {0}.",
4:". Arabia Saudita revisó su arancel en diciembre de {0}, lo cual podría no reflejarse en estos datos de {1}. El VAT del {2}% se aplica sobre el CIF más el arancel.",
5:"Las tasas corresponden al arancel general de importación (IGI) según los datos de aranceles aplicados de WITS del Banco Mundial, {0}. Los datos usan la numeración anterior del SA, por lo que algunos códigos actuales del SA {1} aparecen bajo su código anterior (los teléfonos inteligentes, por ejemplo, bajo {2}). Cuando las partidas arancelarias dentro de un mismo código SA difieren, se muestra un rango y se usa la tasa más alta. La tarifa de trámite aduanero (DTA) se suma al {3}% del valor en aduana, y el IVA del {4}% se aplica sobre el valor en aduana más el IGI más la DTA. A las mercancías originarias de países con tratados de libre comercio (como el T-MEC/USMCA) les corresponden tasas menores y una DTA fija; aquí no se aplican. No se incluyen el impuesto especial IEPS ni los derechos antidumping. Confirme en el",
6:"Los demás papeles y cartones sin estucar, en rollos u hojas, sin trabajar ni transformar más allá de…",
7:"Máquinas y aparatos para ensayos de dureza, resistencia, compresibilidad, elasticidad u otras propiedades mecánicas de materiales (por ejemplo, metales, madera, textiles, papel, plásticos)",
8:"Para uso en aeronaves civiles",
9:"Aparatos respiratorios (excepto sus partes), para uso en aeronaves civiles",
10:"Partes de aparatos respiratorios y de máscaras antigás, para uso en ciertos tipos de aeronaves",
11:"Productos inmunológicos sin mezclar, que sean poliéteres en formas primarias descritos en la Nota",
12:"Los demás papeles y cartones sin estucar, en rollos u hojas, sin trabajar ni transformar más allá de lo especificado en la nota {0} de este capítulo › Testliner (cartón liner reciclado): {1}",
13:"). Elija la partida que corresponda y la tasa arancelaria se completa a partir del arancel de la Fuerza Fronteriza de Australia (Australian Border Force).",
}
out={}
for i,s in enumerate(ins):
    if i in M: out[s]=M[i]; continue
    m=re.match(r': ₹\{0\} per (\{1\} )?([A-Z]{3}) ',s)
    cur=m.group(2)
    if m.group(1):
        t=": ₹{0} por {1} %s (tipo de cambio de exportación ₹{2}). Notificación de tipo de cambio n.º {3}/{4}, vigente desde {5}. La aduana aplica el tipo vigente en la fecha de presentación de la declaración de importación (bill of entry). Puede editar este tipo."%cur
    else:
        t=": ₹{0} por %s (tipo de cambio de exportación ₹{1}). Notificación de tipo de cambio n.º {2}/{3}, vigente desde {4}. La aduana aplica el tipo vigente en la fecha de presentación de la declaración de importación (bill of entry). Puede editar este tipo."%cur
    out[s]=t
json.dump(out,open('tr/p7-out-es.json','w'),ensure_ascii=False,indent=1)
