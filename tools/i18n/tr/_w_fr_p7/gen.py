import json,re
src=json.load(open('tr/p7-in-fr.json'))
T={
src[0]:"Calculateur gratuit de droits d’importation en Inde : recherchez parmi plus de {0} lignes tarifaires HSN par code ou par description, choisissez le pays d’origine et obtenez les droits BCD, la surtaxe de protection sociale, l’IGST, le coût de revient rendu et la politique d’importation DGFT.",
src[1]:"). Choisissez la ligne correspondante et le taux de droit est renseigné à partir du Tarif douanier commun de l’UE (TARIC).",
src[2]:"Les droits sont perçus sur la valeur CIF selon le tarif extérieur commun du GCC, qui est le plus souvent de {0}% avec de nombreuses exceptions. Les taux proviennent des droits appliqués de WITS (Banque mondiale), données {1}, au niveau SH à {2} chiffres. Lorsque des lignes nationales d’un même code SH diffèrent, une fourchette est affichée et le taux le plus élevé est retenu ; vérifiez le code national complet à {3} chiffres (les États du GCC sont passés à {4} chiffres en {5}). Confirmez sur le",
src[3]:"). Choisissez la ligne correspondante et le taux de droit est renseigné à partir des droits appliqués de WITS (Banque mondiale), données {0}.",
src[4]:". L’Arabie saoudite a révisé son tarif en décembre {0}, ce que ces données {1} peuvent ne pas refléter. La TVA de {2}% est perçue sur la valeur CIF majorée des droits.",
src[5]:"Les taux correspondent au droit d’importation général (IGI) issu des droits appliqués de WITS (Banque mondiale), données {0}. Les données utilisent l’ancienne numérotation du SH, de sorte que certains codes SH {1} actuels apparaissent sous leur code antérieur (les smartphones, par exemple, sous {2}). Lorsque des lignes tarifaires d’un même code SH diffèrent, une fourchette est affichée et le taux le plus élevé est retenu. Les frais de traitement douanier (DTA) sont ajoutés à raison de {3}% de la valeur en douane, et l’IVA de {4}% est perçue sur la valeur en douane majorée de l’IGI et du DTA. Des taux réduits et un DTA forfaitaire s’appliquent aux marchandises originaires de pays liés par un accord de libre-échange (comme l’USMCA) ; ils ne sont pas appliqués ici. La taxe d’accise IEPS et les droits antidumping ne sont pas inclus. Confirmez sur le",
src[6]:"Autres papiers et cartons non couchés, en rouleaux ou en feuilles, n’ayant pas subi d’autre ouvraison ou traitement que…",
src[7]:"Machines et appareils pour essais de dureté, de résistance, de compressibilité, d’élasticité ou d’autres propriétés mécaniques des matériaux (par exemple, métaux, bois, textiles, papier, matières plastiques)",
src[8]:"Pour aéronefs civils",
src[9]:"Appareils respiratoires (à l’exclusion de leurs parties), pour aéronefs civils",
src[10]:"Parties d’appareils respiratoires et de masques à gaz, pour certains types d’aéronefs",
src[11]:"Produits immunologiques non modifiés, constitués de polyéthers sous formes primaires décrits dans la Note",
src[12]:"Autres papiers et cartons non couchés, en rouleaux ou en feuilles, n’ayant pas subi d’autre ouvraison ou traitement que celui spécifié dans la note {0} du présent › Testliner (carton doublure recyclé) : {1}",
src[13]:"). Choisissez la ligne correspondante et le taux de droit est renseigné à partir du tarif de l’Australian Border Force.",
}
tail=" (taux à l’export ₹{%d}). Notification de taux de change n° {%d}/{%d}, en vigueur à compter du {%d}. La douane applique le taux en vigueur à la date de dépôt de la déclaration en détail. Vous pouvez modifier ce taux."
for s in src[14:]:
    m=re.match(r": ₹\{0\} per (?:\{1\} )?(\w+) ",s)
    cur=m.group(1)
    if "{1} "+cur in s:
        T[s]=": ₹{0} pour {1} %s"%cur+tail%(2,3,4,5)
    else:
        T[s]=": ₹{0} par %s"%cur+tail%(1,2,3,4)
assert len(T)==len(src)
json.dump(T,open('tr/p7-out-fr.json','w'),ensure_ascii=False,indent=1)
