// lib/ca/cityGuide.ts
// 🇨🇦 Modèle des guides de ville canadiens (table ca_city_guides, colonne guide).
// Un guide = une ville + une langue. Rendu par components/ca/CaCityGuide.tsx.
//
// Règles de contenu (brief §6 + CLAUDE.md) :
//  - chaque fait vient d'une page officielle listée dans `sources` ;
//  - rien d'inventé : un champ inconnu est absent, pas deviné ;
//  - on décrit ce que les organismes font, jamais ce qu'ils ne font pas
//    (sauf quand l'organisme le dit lui-même et que c'est utile au lecteur) ;
//  - aucune urgence, aucune promesse de résultat, un seul appel à l'action par écran.

export type CaGuideContact = { label: string; value: string; href?: string };

export type CaGuideCard = {
  kind: "police" | "transit" | "airport" | "animal" | "university" | "other";
  title: string;           // nom officiel de l'organisme
  where?: string;          // « Bay subway station », « Terminal 1, before security »
  body: string[];          // paragraphes, texte brut
  hold?: string;           // durée de conservation, telle que publiée
  contacts?: CaGuideContact[];
  links?: { label: string; href: string }[];
};

export type CaGuideFaq = { q: string; a: string };

export type CaCityGuide = {
  province: string;        // "ON"
  citySlug: string;        // "toronto" (= ca_cities.city_ascii)
  lang: "en" | "fr";
  cityName: string;        // nom affiché : "Toronto", "Montréal"
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lede: string;            // 1 à 2 phrases sous le titre
  lastReviewed: string;    // ISO "2026-11-05" : date de dernière vérification des sources
  cardsHeading: string;
  cards: CaGuideCard[];
  found: { heading: string; body: string[] };   // « Found something? » — sans formulaire en v1
  optionsHeading: string;
  options: string[];       // description des formules (prix CA$ identiques aux CGV /ca/terms)
  faq: CaGuideFaq[];
  sources: { label: string; href: string }[];
  disclaimer: string;
};
