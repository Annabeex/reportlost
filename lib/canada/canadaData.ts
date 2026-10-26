// lib/canada/canadaData.ts
// Données et chemins du marché canadien.
//
// Schéma d'URL retenu (voir CANADA-LAUNCH-URL-STRUCTURE.md) :
//   /ca                          hub Canada, anglais
//   /ca/fr                       hub Canada, français
//   /ca/<province>/<city>        page ville, anglais      ex. /ca/on/toronto
//   /ca/fr/<province>/<ville>    page ville, français     ex. /ca/fr/qc/montreal
// Les États-Unis restent à la racine (/lost-and-found/...), on n'y touche pas.
// Pas de slash final, comme le reste du site.

import type { Metadata } from "next";

export type CaProvince = { code: string; en: string; fr: string };

// ISO 3166-2:CA — 10 provinces + 3 territoires. Aucun code ne collisionne avec un État US.
export const caProvinces: CaProvince[] = [
  { code: "AB", en: "Alberta", fr: "Alberta" },
  { code: "BC", en: "British Columbia", fr: "Colombie-Britannique" },
  { code: "MB", en: "Manitoba", fr: "Manitoba" },
  { code: "NB", en: "New Brunswick", fr: "Nouveau-Brunswick" },
  { code: "NL", en: "Newfoundland and Labrador", fr: "Terre-Neuve-et-Labrador" },
  { code: "NS", en: "Nova Scotia", fr: "Nouvelle-Écosse" },
  { code: "NT", en: "Northwest Territories", fr: "Territoires du Nord-Ouest" },
  { code: "NU", en: "Nunavut", fr: "Nunavut" },
  { code: "ON", en: "Ontario", fr: "Ontario" },
  { code: "PE", en: "Prince Edward Island", fr: "Île-du-Prince-Édouard" },
  { code: "QC", en: "Quebec", fr: "Québec" },
  { code: "SK", en: "Saskatchewan", fr: "Saskatchewan" },
  { code: "YT", en: "Yukon", fr: "Yukon" },
];

export const CA_PROVINCE_CODES = caProvinces.map((p) => p.code);

export const provinceName = (code: string, lang: "en" | "fr" = "en"): string => {
  const p = caProvinces.find((x) => x.code === code.trim().toUpperCase());
  return p ? p[lang] : code;
};

export type CaLang = "en" | "fr";

export const CA_SITE = "https://reportlost.org";

// Préfixe de langue : /ca pour l'anglais, /ca/fr pour le français.
export const caBase = (lang: CaLang) => (lang === "fr" ? "/ca/fr" : "/ca");

// Slug d'URL canadien : minuscules, sans accents, tirets. Toujours trim().
export const toCaSlug = (s: string) =>
  String(s)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const buildCaCityPath = (lang: CaLang, province: string, city: string) =>
  `${caBase(lang)}/${province.trim().toLowerCase()}/${toCaSlug(city)}`;

/**
 * Métadonnées hreflang d'une page qui existe en anglais ET en français.
 * - canonique auto-référente (jamais vers l'autre langue) ;
 * - paires en-CA / fr-CA réciproques par construction (même fonction des deux côtés) ;
 * - x-default du groupe canadien = la version anglaise.
 * Une page sans jumelle ne doit PAS appeler cette fonction.
 */
export function caBilingualAlternates(
  self: CaLang,
  enPath: string,
  frPath: string
): Metadata["alternates"] {
  const en = `${CA_SITE}${enPath}`;
  const fr = `${CA_SITE}${frPath}`;
  return {
    canonical: self === "fr" ? fr : en,
    languages: { "en-CA": en, "fr-CA": fr, "x-default": en },
  };
}
