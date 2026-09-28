// lib/okEtat.ts
//
// Un résultat de recherche désigne-t-il bien CET État ?
//
// Google répond au NOM de la ville et traite l'État comme un indice faible :
// "Laurel FL city hall" renvoie la mairie de Laurel, DELAWARE ; "Denton TX
// police" renvoie dentonmdpolice.com, la police de Denton, MARYLAND. Le modèle
// qui lit ces résultats les recopie. On les écarte donc avant qu'il les voie.
//
// Utilisé par le générateur de pages villes et par l'assistant « qui contacter »
// des dossiers.

const ETATS: [string, string][] = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
  ["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["FL","Florida"],["GA","Georgia"],
  ["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],
  ["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],
  ["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],
  ["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],
  ["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
  ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],
  ["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
  ["DC","District of Columbia"],["PR","Puerto Rico"],
];

/**
 * Un résultat de recherche est-il plausible pour CET État ?
 * Faux uniquement quand un AUTRE État est nommé en toutes lettres (ou porté par
 * le domaine, type ".de.us") et que le nôtre ne l'est nulle part. Tout le reste
 * passe : mieux vaut laisser filer un cas douteux que jeter le bon contact.
 */
export function okEtat(r: { title: string; link: string; snippet: string }, abbr: string, nom: string, ville = ""): boolean {
  const texte = `${r.title} ${r.link} ${r.snippet}`;
  const bas = texte.toLowerCase();
  const nous =
    new RegExp(`\\b${nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(texte) ||
    new RegExp(`\\b${abbr}\\b`).test(texte) ||
    new RegExp(`\\.${abbr.toLowerCase()}\\.us\\b`).test(bas) ||
    new RegExp(`\\b${abbr.toLowerCase()}\\.gov\\b`).test(bas);
  if (nous) return true;
  // ⚠️ Des villes portent le nom d'un État : California (PA), Indiana (PA),
  // Nevada (MO), Delaware (OH), Wyoming (MI), Oregon (OH), Washington (une
  // vingtaine). Sans cette garde, le filtre prenait le nom de la ville pour la
  // preuve d'un autre État et jetait la totalite des résultats.
  const villeBas = ville.toLowerCase().trim();
  for (const [a, n] of ETATS) {
    if (a === abbr) continue;
    if (villeBas && (villeBas === n.toLowerCase() || villeBas.includes(n.toLowerCase()))) continue;
    const autre =
      new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(texte) ||
      new RegExp(`\\.${a.toLowerCase()}\\.us\\b`).test(bas);
    if (autre) return false;
  }
  return true;
}
