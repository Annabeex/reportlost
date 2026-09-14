// lib/redactPublic.ts
// Nettoyage des textes AVANT affichage public (/lost/[slug], partages, OG).
//
// Le champ `private_detail` n'est jamais publié, c'est déjà acquis. Le risque
// restant vient des champs libres : titre, description, circonstances. Les gens
// y écrivent parfois un numéro de téléphone, un numéro de permis ou un IMEI.
// Publié et indexé de façon permanente, ça devient exploitable par un tiers.
//
// Principe retenu : on masque les IDENTIFIANTS, jamais la nature de l'objet.
// « wallet with a military ID » reste lisible — un inventeur doit pouvoir
// reconnaître l'objet — mais « military ID 1234567 » perd le numéro.
//
// Non destructif : la base garde la valeur d'origine, seul l'affichage filtre.
// Conséquence utile : ça s'applique rétroactivement aux signalements déjà en
// ligne, sans migration.

//
// Volontairement absent : le masquage des références alphanumériques type
// « MACBOOK2019 » ou « C02XY1234 ». La règle attrapait autant de noms de modèle
// que de numéros de série, et sur-filtrer 4 000 pages coûte plus cher que la
// poignée de numéros de série qu'on laisse passer.
const MASK = "[removed]";

const RULES: RegExp[] = [
  // Adresses e-mail
  /\b[\w.+-]+@[\w-]+\.[\w.-]{2,}\b/gi,

  // Téléphones nord-américains : séparateurs exigés pour éviter les faux positifs
  /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g,

  // Numéro de sécurité sociale
  /\b\d{3}-\d{2}-\d{4}\b/g,

  // Suites de 9 chiffres ou plus : IMEI, carte bancaire, numéro de permis,
  // numéro de compte. Une date (2025-12-29) contient des tirets, elle passe.
  /\b\d{9,}\b/g,

  // « license number: X », « passport no X », « serial # X »
  /\b(licen[cs]e|permit|passport|serial|imei|account|policy|card|id)\s*(?:number|no\.?|#)?\s*[:#]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9-]{4,}\b/gi,
];

/** Masque les identifiants d'un texte destiné à l'affichage public. */
export function redactPublic(input?: string | null): string {
  let out = String(input ?? "");
  if (!out) return "";
  for (const re of RULES) out = out.replace(re, MASK);
  // Deux masques collés ou espaces doublés après remplacement
  out = out.replace(/(\[removed\]\s*){2,}/g, `${MASK} `).replace(/[ \t]{2,}/g, " ").trim();
  return out;
}

/** Vrai si le filtre a effectivement retiré quelque chose. */
export function wasRedacted(input?: string | null): boolean {
  const src = String(input ?? "");
  return !!src && redactPublic(src) !== src;
}
