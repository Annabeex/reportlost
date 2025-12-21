// lib/categories/index.ts

// 🔹 Type central (une seule source de vérité)
export type CategorySpec = {
  label: string;
  title: string;
  intro: string[];
  whyReport: string[];
  howToDescribe: string[];
  faq: { q: string; a: string }[];
  ctaLabel: string;

  // optionnel : liens internes vers catégories plus spécifiques
  relatedLinks?: {
    label: string;
    href: string;
    note?: string;
  }[];
};

// 🔹 Imports des catégories
import { walletSpec } from "./wallet";
import { keysSpec } from "./keys";
import { jewelrySpec } from "./jewelry";
import { glassesSpec } from "./glasses";
import { electronicDevicesSpec } from "./Electronic-devices";
import { phoneSpec } from "./phone";
import { documentsSpec } from "./documents";
import { clothesSpec } from "./clothes";
import { bagSuitcaseSpec } from "./bag-suitcase";
import { petsSpec } from "./pets";
import { otherSpec } from "./other";

// 🔹 Map centrale (slug → contenu)
export const categorySpecs: Record<string, CategorySpec> = {
  wallet: walletSpec,
  keys: keysSpec,
  jewelry: jewelrySpec,
  glasses: glassesSpec,
  "electronic-devices": electronicDevicesSpec,
  phone: phoneSpec,
  documents: documentsSpec,
  clothes: clothesSpec,
  "bag-or-suitcase": bagSuitcaseSpec,
  pets: petsSpec,
  other: otherSpec,
};

// 🔹 Helper sûr
export function getCategorySpec(slug: string): CategorySpec | null {
  return categorySpecs[slug] ?? null;
}
