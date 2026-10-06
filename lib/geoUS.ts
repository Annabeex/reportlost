// lib/geoUS.ts
//
// Géographie interne aux États-Unis, pour la veille.
//
// Pourquoi : filtreDur ne savait écarter que l'étranger (domaine national,
// anglais britannique). À l'intérieur des États-Unis, tout reposait sur le nom
// de la ville — or des centaines de noms sont partagés, et « Chula Vista » est
// aussi un nom de RUE dans plusieurs villes. Le dossier #51717 (Chula Vista,
// CALIFORNIE) s'est vu proposer une publication d'un groupe Facebook de la
// Willamette Valley, en OREGON, dont le texte citait une rue Chula Vista et un
// Food Lion — enseigne qui n'existe ni en Californie ni en Oregon.
//
// Deux signaux décisifs, que le nom de ville ne donne pas :
//   1. les noms de RÉGION, que les groupes locaux portent dans leur nom ;
//   2. les ENSEIGNES RÉGIONALES, que les gens citent comme points de repère
//      (« near the Food Lion ») et qui n'existent que dans certains États.

/** Régions et aires métropolitaines → États où elles se trouvent. */
export const REGIONS_US: Array<[RegExp, string[]]> = [
  [/\bwillamette valley\b/i, ["OR"]],
  [/\bpuget sound\b/i, ["WA"]],
  [/\binland empire\b/i, ["CA"]],
  [/\bbay area\b/i, ["CA"]],
  [/\bcentral valley\b/i, ["CA"]],
  [/\bhigh desert\b/i, ["CA", "OR", "NM"]],
  [/\bhudson valley\b/i, ["NY"]],
  [/\bcapital region\b/i, ["NY"]],
  [/\blong island\b/i, ["NY"]],
  [/\bjersey shore\b/i, ["NJ"]],
  [/\blehigh valley\b/i, ["PA"]],
  [/\bpoconos?\b/i, ["PA"]],
  [/\bdelmarva\b/i, ["MD", "DE", "VA"]],
  [/\bshenandoah valley\b/i, ["VA"]],
  [/\bhampton roads\b/i, ["VA"]],
  [/\bouter banks\b/i, ["NC"]],
  [/\b(the )?triangle\b.{0,20}\b(nc|north carolina|raleigh|durham)\b/i, ["NC"]],
  [/\btriad\b.{0,20}\b(nc|north carolina|greensboro)\b/i, ["NC"]],
  [/\blowcountry\b/i, ["SC"]],
  [/\bupstate\b.{0,15}\b(sc|south carolina)\b/i, ["SC"]],
  [/\bpanhandle\b.{0,15}\b(fl|florida)\b/i, ["FL"]],
  [/\btreasure coast\b/i, ["FL"]],
  [/\bspace coast\b/i, ["FL"]],
  [/\btampa bay\b/i, ["FL"]],
  [/\bgulf coast\b/i, ["FL", "AL", "MS", "LA", "TX"]],
  [/\bbluegrass\b/i, ["KY"]],
  [/\bupper peninsula\b/i, ["MI"]],
  [/\bnorthwoods\b/i, ["WI", "MN", "MI"]],
  [/\btwin cities\b/i, ["MN"]],
  [/\biron range\b/i, ["MN"]],
  [/\bozarks?\b/i, ["MO", "AR", "OK"]],
  [/\bhill country\b/i, ["TX"]],
  [/\bpermian basin\b/i, ["TX"]],
  [/\brio grande valley\b/i, ["TX"]],
  [/\bdfw\b|\bdallas.?fort worth\b/i, ["TX"]],
  [/\bfront range\b/i, ["CO"]],
  [/\bwestern slope\b/i, ["CO"]],
  [/\bwasatch\b/i, ["UT"]],
  [/\btreasure valley\b/i, ["ID"]],
  [/\bflathead\b/i, ["MT"]],
  [/\bblack hills\b/i, ["SD"]],
  [/\bcoachella valley\b/i, ["CA"]],
  [/\bcentral coast\b/i, ["CA"]],
  [/\bnorth shore\b.{0,15}\b(ma|massachusetts|boston)\b/i, ["MA"]],
  [/\bcape cod\b/i, ["MA"]],
  [/\bberkshires\b/i, ["MA"]],
  [/\bgreen mountains?\b/i, ["VT"]],
  [/\bwhite mountains?\b/i, ["NH", "AZ"]],
  [/\bfinger lakes\b/i, ["NY"]],
  [/\badirondacks?\b/i, ["NY"]],
];

/** Enseignes à implantation régionale → États où elles opèrent. */
export const ENSEIGNES_REGIONALES: Array<[RegExp, string[]]> = [
  [/\bfood lion\b/i, ["NC", "SC", "VA", "GA", "MD", "DE", "PA", "TN", "KY", "WV"]],
  [/\bharris teeter\b/i, ["NC", "SC", "VA", "GA", "MD", "DE", "DC", "FL"]],
  [/\bpublix\b/i, ["FL", "GA", "AL", "SC", "TN", "NC", "VA", "KY"]],
  [/\bwinn.?dixie\b/i, ["FL", "AL", "LA", "MS", "GA"]],
  // Attention au piège : /h.?e.?b/ attrapait « herb ». On exige les séparateurs.
  [/\bH\.?-?E\.?-?B\b/i, ["TX"]],
  [/\bbuc.?ee.?s\b/i, ["TX", "AL", "GA", "FL", "SC", "KY", "TN", "MO", "CO"]],
  [/\bwegmans\b/i, ["NY", "PA", "NJ", "MD", "VA", "MA", "NC", "DE", "DC"]],
  [/\bshoprite\b/i, ["NJ", "NY", "PA", "CT", "DE", "MD"]],
  [/\bstop (&|and) shop\b/i, ["MA", "CT", "RI", "NY", "NJ", "NH"]],
  [/\bhannaford\b/i, ["ME", "NH", "VT", "MA", "NY"]],
  [/\bmarket basket\b/i, ["MA", "NH", "ME"]],
  [/\bgiant eagle\b/i, ["PA", "OH", "WV", "IN", "MD"]],
  [/\bmeijer\b/i, ["MI", "OH", "IN", "IL", "KY", "WI"]],
  [/\bhy.?vee\b/i, ["IA", "IL", "MO", "NE", "KS", "MN", "SD", "WI", "IN", "TN"]],
  [/\bschnucks\b/i, ["MO", "IL", "IN", "WI"]],
  [/\bpiggly wiggly\b/i, ["AL", "GA", "SC", "NC", "MS", "TN", "WI", "VA"]],
  [/\bwawa\b/i, ["PA", "NJ", "DE", "MD", "VA", "FL", "DC", "NC"]],
  [/\bsheetz\b/i, ["PA", "MD", "VA", "WV", "OH", "NC", "MI", "IN"]],
  [/\bquiktrip\b|\bqt\b(?= gas| station)/i, ["OK", "KS", "MO", "GA", "TX", "NC", "SC", "AZ", "IA", "NE", "AL", "TN", "FL"]],
  [/\bcumberland farms\b/i, ["MA", "CT", "RI", "NH", "VT", "ME", "NY", "FL"]],
  [/\bbi.?mart\b/i, ["OR", "WA", "ID"]],
  [/\bfred meyer\b/i, ["OR", "WA", "ID", "AK"]],
  [/\bwinco\b/i, ["OR", "WA", "ID", "CA", "NV", "UT", "AZ", "MT", "TX", "OK"]],
  [/\braley.?s\b/i, ["CA", "NV"]],
  [/\bstater bros\b/i, ["CA"]],
  [/\bvons\b/i, ["CA", "NV"]],
  [/\bking soopers\b/i, ["CO", "WY"]],
  [/\bcub foods\b/i, ["MN", "IL"]],
  [/\bjewel.?osco\b/i, ["IL", "IN", "IA"]],
];

export type IndiceGeo = { nom: string; etats: string[] };

/**
 * Cherche dans un texte les indices géographiques internes aux États-Unis.
 * Ne renvoie que ce qui est trouvé : l'absence d'indice n'est pas un signal.
 */
export function indicesGeoUS(texte: string): IndiceGeo[] {
  const t = String(texte || "");
  const trouves: IndiceGeo[] = [];
  for (const [re, etats] of REGIONS_US) {
    const m = t.match(re);
    if (m) trouves.push({ nom: m[0].trim(), etats });
  }
  for (const [re, etats] of ENSEIGNES_REGIONALES) {
    const m = t.match(re);
    if (m) trouves.push({ nom: m[0].trim(), etats });
  }
  return trouves;
}

/**
 * Un indice CONTREDIT l'État du dossier quand il désigne une zone où cet État
 * ne figure pas. On exige qu'AUCUN indice trouvé ne couvre l'État attendu :
 * un seul indice compatible suffit à ne pas écarter.
 */
export function contreditEtat(texte: string, etatAttendu: string): IndiceGeo | null {
  const etat = String(etatAttendu || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(etat)) return null;
  const indices = indicesGeoUS(texte);
  if (!indices.length) return null;
  if (indices.some((i) => i.etats.includes(etat))) return null;
  return indices[0];
}
