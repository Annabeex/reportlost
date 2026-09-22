// lib/orgMatch.ts
//
// Rapprochement entre les déclarations de perte (lost_items) et l'inventaire
// des établissements (found_items). Entièrement DÉTERMINISTE : aucun appel à
// Anthropic, à Serper ni à aucun service payant. C'est une contrainte de
// conception, pas une simplification — l'outil établissement est gratuit, il
// ne doit donc rien coûter à l'usage. Tout se joue en mémoire, sur des lignes
// déjà chargées depuis Supabase.
//
// La veille web (match-watch) reste inchangée : elle, elle est payante et
// réservée aux dossiers qui l'ont activée.

export type LostRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  date?: string | null;
  city?: string | null;
  state_id?: string | null;
  created_at?: string | null;
};

export type FoundRow = {
  id: string;
  org_id?: string | null;
  org_ref?: string | null;
  title?: string | null;
  description?: string | null;
  date?: string | null;
  city?: string | null;
  dropoff_location?: string | null;
  status?: string | null;
};

export type MatchResult = {
  lost_item_id: string;
  found_item_id: string;
  score: number;          // 0–100
  reasons: string[];      // lisible par un humain, affiché au bureau
};

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

// Mots vides : ils apparaissent dans presque toutes les descriptions et
// feraient monter le score sans rien dire.
const STOP = new Set([
  "a","an","the","my","mine","it","its","is","was","были","and","or","of","in","on","at","to","for",
  "with","without","from","by","this","that","these","those","i","me","we","you","he","she","they",
  "have","has","had","lost","found","item","items","think","maybe","around","near","about","some",
  "any","very","really","just","left","forgot","forgotten","somewhere","please","help","thanks",
  // « don't know », « not sure », « unknown » : ce qu'on écrit dans un champ
  // lieu quand on ne sait pas. Ce ne sont pas des mots à comparer.
  "don","dont","t","know","not","sure","unknown","unsure","idk","no","idea","somewhere","anywhere",
]);

/** Motifs et matières : aussi discriminants qu'une couleur. */
const PATTERNS = new Set([
  "plaid","tartan","checkered","checked","striped","stripes","floral","polka","dots","leopard",
  "camo","camouflage","paisley","houndstooth","leather","suede","denim","wool","knit","knitted",
  "cashmere","silk","velvet","canvas","nylon","metal","metallic","wooden","glitter","transparent","clear",
]);

// Variantes courantes → forme canonique. Une personne écrit « cell phone »,
// le bureau note « iPhone » : sans ça, aucun mot commun.
const SYNONYMS: Record<string, string> = {
  cellphone: "phone", cell: "phone", mobile: "phone", smartphone: "phone",
  iphone: "phone", android: "phone", samsung: "phone",
  laptop: "laptop", notebook: "laptop", macbook: "laptop", chromebook: "laptop",
  billfold: "wallet", purse: "wallet", pocketbook: "wallet",
  rucksack: "backpack", bookbag: "backpack", knapsack: "backpack",
  spectacles: "glasses", eyeglasses: "glasses", sunglasses: "glasses",
  earbuds: "earphones", airpods: "earphones", headphones: "earphones",
  headset: "earphones", earpods: "earphones",
  keys: "key", keychain: "key", keyring: "key", fob: "key",
  id: "card", ids: "card", badge: "card", cards: "card",
  bottle: "bottle", flask: "bottle", thermos: "bottle",
  charger: "charger", cable: "charger", powerbank: "charger",
  jacket: "coat", parka: "coat", hoodie: "coat", sweater: "coat",
  umbrella: "umbrella", brolly: "umbrella",
  watch: "watch", smartwatch: "watch",
  ring: "ring", necklace: "jewelry", bracelet: "jewelry", earring: "jewelry",
};

// Couleurs et marques : très discriminantes quand elles coïncident.
const COLORS = new Set([
  "black","white","grey","gray","silver","gold","red","blue","navy","green","yellow","orange",
  "purple","pink","brown","beige","tan","teal","turquoise","burgundy","maroon","cream","rose",
]);

const BRANDS = new Set([
  "apple","samsung","sony","bose","dell","hp","lenovo","asus","acer","microsoft","google","nike",
  "adidas","northface","patagonia","jansport","herschel","fjallraven","kanken","hydroflask",
  "swell","contigo","nalgene","rayban","oakley","gucci","coach","fossil","casio","garmin","fitbit",
  "anker","logitech","canon","nikon","gopro","kindle","ipad","airpod","airpods","beats","jbl",
]);

export function normalizeTokens(...parts: (string | null | undefined)[]): string[] {
  const raw = parts.filter(Boolean).join(" ").toLowerCase();
  const words = raw
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
  const out: string[] = [];
  for (let w of words) {
    if (!w || w.length < 2) continue;
    // ⚠️ Ordre important : on cherche le synonyme sur le mot TEL QUEL avant de
    // le mettre au singulier. Sinon « airpods » devient « airpod », qui n'est
    // dans aucune table, et « headphones » devient « headphone » : deux des
    // objets les plus perdus sur un campus passaient à côté.
    let canon = SYNONYMS[w];
    if (!canon) {
      const singular = w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w;
      canon = SYNONYMS[singular] || singular;
    }
    if (STOP.has(canon)) continue;
    out.push(canon);
  }
  return out;
}

/**
 * Le mot qui dit QUOI a été perdu. On saute les couleurs, les marques et les
 * tailles : « Black North Face backpack » doit donner « backpack », pas
 * « black », sinon deux fiches décrivant le même sac ne se reconnaissent pas.
 */
const QUALIFIERS = new Set(["small","big","large","tiny","new","old","dark","light"]);

// Vocabulaire des objets. Un mot de cette liste l'emporte toujours : sans elle,
// « Black North Face backpack » donnait « north » comme type, parce que
// « northface » n'est une marque qu'écrite en un seul mot.
const ITEM_TYPES = new Set([
  ...Object.values(SYNONYMS),
  "backpack","wallet","phone","laptop","key","glasses","earphones","bottle","charger","coat",
  "umbrella","watch","ring","jewelry","card","bag","purse","suitcase","folder","binder","notebook",
  "calculator","tablet","camera","scarf","hat","glove","shoe","helmet","badge","passport","book",
  "lunchbox","container","case","cable","mouse","headband","jacket","sweatshirt","ipad","stroller",
]);

export function typeToken(...parts: (string | null | undefined)[]): string | null {
  const toks = normalizeTokens(...parts);
  const known = toks.find((t) => ITEM_TYPES.has(t));
  if (known) return known;
  for (const t of toks) {
    if (COLORS.has(t) || BRANDS.has(t) || QUALIFIERS.has(t)) continue;
    return t;
  }
  return toks[0] || null;
}

/* ------------------------------------------------------------------ */
/* Score                                                               */
/* ------------------------------------------------------------------ */

const DAY = 24 * 60 * 60 * 1000;

function daysBetween(a?: string | null, b?: string | null): number | null {
  if (!a || !b) return null;
  const ta = Date.parse(a), tb = Date.parse(b);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return null;
  return Math.round((tb - ta) / DAY);
}

/**
 * Score 0–100. Barème volontairement lisible : le bureau doit pouvoir
 * comprendre pourquoi un objet lui est proposé, et nous devons pouvoir
 * ajuster un poids sans réentraîner quoi que ce soit.
 */
export function scoreMatch(lost: LostRow, found: FoundRow): MatchResult | null {
  // Un objet déjà rendu ou détruit ne doit plus être proposé.
  if (found.status && !["stored", "claim_pending"].includes(String(found.status))) return null;

  const reasons: string[] = [];
  let score = 0;

  // 1) Fenêtre de dates. Au-delà de 45 jours le rapprochement n'a plus de sens
  //    sur un campus. Un objet trouvé AVANT la date de perte déclarée reste un
  //    candidat jusqu'à 7 jours d'écart : les gens se trompent sur le jour où
  //    ils ont perdu l'objet (une écharpe ramassée le 8, déclarée perdue « le
  //    10 », était rejetée). Le score est plus bas : c'est au bureau de juger.
  const gap = daysBetween(lost.date, found.date);
  if (gap !== null) {
    if (gap < -7 || gap > 45) return null;
    // Trouvé avant la date déclarée : à 1 ou 2 jours c'est presque toujours
    // une erreur de mémoire, on garde une bonne part des points ; au-delà,
    // moins.
    // 1 à 2 jours avant : erreur de mémoire probable, on garde une bonne part
    // des points. 3 à 7 jours avant : gros doute, malus franc — seul un objet
    // très ressemblant (type + couleur/motif/marque) reste candidat.
    if (gap < 0) {
      score += gap >= -2 ? 16 : -20;
      reasons.push(`trouvé ${-gap} j avant la date de perte déclarée`);
    }
    else if (gap >= 0 && gap <= 2) { score += 25; reasons.push(`trouvé ${gap === 0 ? "le jour même" : `${gap} j après`}`); }
    else if (gap <= 7) { score += 18; reasons.push(`trouvé ${gap} j après`); }
    else if (gap <= 21) { score += 10; reasons.push(`trouvé ${gap} j après`); }
    else { score += 4; reasons.push(`trouvé ${gap} j après`); }
  }

  const lostTokens = normalizeTokens(lost.title, lost.description);
  const foundTokens = normalizeTokens(found.title, found.description);
  if (!lostTokens.length || !foundTokens.length) return null;

  const lostSet = new Set(lostTokens);
  const foundSet = new Set(foundTokens);
  const common = [...lostSet].filter((t) => foundSet.has(t));

  // 2) Le type d'objet, couleurs et marques exclues (voir typeToken).
  //    On le cherche dans le titre, puis dans la description si le titre n'en
  //    contient pas — un bureau écrit parfois « Sac » et tout le reste en note.
  const lostHead = typeToken(lost.title) || typeToken(lost.description);
  const foundHead = typeToken(found.title) || typeToken(found.description);
  if (lostHead && foundHead && lostHead === foundHead) {
    score += 35;
    reasons.push(`même type d'objet (${lostHead})`);
  } else if (lostHead && foundSet.has(lostHead)) {
    score += 22;
    reasons.push(`« ${lostHead} » apparaît dans la fiche`);
  } else if (!common.length) {
    // Aucun mot commun du tout : ce n'est pas un candidat.
    return null;
  }

  // 3) Recoupement général, plafonné : dix mots communs ne valent pas dix fois
  //    un mot commun.
  const overlap = common.length / Math.min(lostSet.size, foundSet.size);
  score += Math.round(Math.min(overlap, 1) * 15);
  if (common.length) reasons.push(`${common.length} terme(s) en commun`);

  // 4) Couleurs et marques : les signaux les plus discriminants.
  const colorHit = common.filter((t) => COLORS.has(t));
  if (colorHit.length) { score += 12; reasons.push(`couleur : ${colorHit.join(", ")}`); }
  const brandHit = common.filter((t) => BRANDS.has(t));
  if (brandHit.length) { score += 13; reasons.push(`marque : ${brandHit.join(", ")}`); }
  const patternHit = common.filter((t) => PATTERNS.has(t));
  if (patternHit.length) { score += 12; reasons.push(`motif / matière : ${patternHit.join(", ")}`); }

  // 5) Contradiction de couleur : deux couleurs citées, aucune commune.
  const lostColors = [...lostSet].filter((t) => COLORS.has(t));
  const foundColors = [...foundSet].filter((t) => COLORS.has(t));
  if (lostColors.length && foundColors.length && !colorHit.length) {
    // Assez forte pour faire retomber un même type d'objet en « à vérifier »,
    // sans l'écarter : quelqu'un peut décrire un bleu marine comme du noir.
    score -= 25;
    reasons.push(`couleurs différentes (${lostColors[0]} / ${foundColors[0]})`);
  }

  // 6) Même ville : sur un campus c'est presque toujours vrai, donc poids faible.
  if (lost.city && found.city && lost.city.trim().toLowerCase() === found.city.trim().toLowerCase()) {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));
  if (score < 40) return null;

  return { lost_item_id: String(lost.id), found_item_id: String(found.id), score, reasons };
}

/** Seuil d'affichage ferme / à vérifier. */
export function matchLevel(score: number): "strong" | "possible" {
  return score >= 70 ? "strong" : "possible";
}

/** Compare une perte à un lot d'objets trouvés (ou l'inverse). */
export function matchOneToMany(lost: LostRow, founds: FoundRow[]): MatchResult[] {
  return founds
    .map((f) => scoreMatch(lost, f))
    .filter((m): m is MatchResult => !!m)
    .sort((a, b) => b.score - a.score);
}

export function matchManyToOne(losts: LostRow[], found: FoundRow): MatchResult[] {
  return losts
    .map((l) => scoreMatch(l, found))
    .filter((m): m is MatchResult => !!m)
    .sort((a, b) => b.score - a.score);
}
