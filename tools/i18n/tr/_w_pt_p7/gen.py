import json
ins=json.load(open('tr/p7-in-pt.json'))
m={
ins[0]:"Calculadora gratuita de impostos de importação da Índia: pesquise mais de {0} linhas tarifárias HSN por código ou descrição, escolha o país de origem e veja BCD, sobretaxa de bem-estar social, IGST, custo de internação e a política de importação da DGFT.",
ins[1]:"). Escolha a linha correspondente e a alíquota do imposto é preenchida a partir da Pauta Aduaneira Comum da UE (TARIC).",
ins[2]:"O imposto incide sobre o valor CIF conforme a tarifa externa comum do GCC, que é de {0}% na maioria dos casos, com muitas exceções. As alíquotas vêm da tarifa aplicada do World Bank WITS, dados de {1}, no nível de {2} dígitos do SH. Quando as linhas nacionais dentro de um mesmo código SH diferem, é exibida uma faixa e o valor mais alto é usado; confira o código nacional completo de {3} dígitos (os países do GCC passaram para {4} dígitos em {5}). Confirme no",
ins[3]:"). Escolha a linha correspondente e a alíquota do imposto é preenchida a partir da tarifa aplicada do World Bank WITS, dados de {0}.",
ins[4]:". A Arábia Saudita revisou sua tarifa em dezembro de {0}, o que pode não aparecer nestes dados de {1}. O VAT de {2}% incide sobre o CIF mais o imposto.",
ins[5]:"As alíquotas são o imposto geral de importação (IGI) da tarifa aplicada do World Bank WITS, dados de {0}. Os dados usam a numeração antiga do SH, então alguns códigos SH {1} atuais aparecem sob o código anterior (smartphones, por exemplo, sob {2}). Quando as linhas tarifárias dentro de um mesmo código SH diferem, é exibida uma faixa e o valor mais alto é usado. A taxa de processamento aduaneiro (DTA) é acrescida à razão de {3}% do valor aduaneiro, e o IVA de {4}% incide sobre o valor aduaneiro mais IGI mais DTA. Alíquotas menores e um DTA fixo se aplicam a mercadorias originárias de países com acordo de livre comércio (como o USMCA); eles não são aplicados aqui. O imposto seletivo IEPS e os direitos antidumping não estão incluídos. Confirme no",
ins[6]:"Outros papéis e cartões não revestidos, em rolos ou folhas, não trabalhados nem processados além de…",
ins[7]:"Máquinas e aparelhos para ensaios de dureza, resistência, compressibilidade, elasticidade ou outras propriedades mecânicas de materiais (por exemplo, metais, madeira, têxteis, papel, plásticos)",
ins[8]:"Para uso em aeronaves civis",
ins[9]:"Aparelhos respiratórios (exceto suas partes), para uso em aeronaves civis",
ins[10]:"Partes de aparelhos respiratórios e de máscaras de gás, para uso em certos tipos de aeronaves",
ins[11]:"Produtos imunológicos não modificados, sendo poliéteres nas formas primárias descritas na Nota",
ins[12]:"Outros papéis e cartões não revestidos, em rolos ou folhas, não trabalhados nem processados além do especificado na nota {0} deste › Testliner (cartão de fibra reciclada): {1}",
ins[13]:"). Escolha a linha correspondente e a alíquota do imposto é preenchida a partir da tarifa da Australian Border Force.",
}
for s in ins[14:]:
    if "{1} JPY" in s or "{1} KRW" in s:
        cur=s.split("{1} ")[1][:3]
        t=": ₹{0} por {1} %s (taxa de exportação ₹{2}). Notificação de taxa de câmbio nº {3}/{4}, em vigor desde {5}. A alfândega usa a taxa em vigor na data do registro da declaração de importação. Você pode editar esta taxa."%cur
    else:
        cur=s.split(" per ")[1][:3]
        t=": ₹{0} por %s (taxa de exportação ₹{1}). Notificação de taxa de câmbio nº {2}/{3}, em vigor desde {4}. A alfândega usa a taxa em vigor na data do registro da declaração de importação. Você pode editar esta taxa."%cur
    m[s]=t
assert len(m)==len(ins)
json.dump(m,open('tr/p7-out-pt.json','w'),ensure_ascii=False,indent=1)
