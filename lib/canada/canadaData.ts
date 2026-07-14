// lib/canada/canadaData.ts
// Données de base Canada (provinces + villes majeures) pour /en-ca.
// Volontairement minimal : la richesse (POIs, guides) vit en base (ca_cities + city_guides),
// comme côté US. Ici on ne garde que ce qu'il faut pour la home draft.

import { toCitySlug } from "@/lib/slugify";

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

export const provinceName = (code: string): string =>
  caProvinces.find((p) => p.code === code.toUpperCase())?.en ?? code;

export type CaCity = { name: string; province: string };

// Villes prioritaires (ON/QC/BC/AB ≈ 86 % de la population) pour la vitrine home.
export const caMajorCities: CaCity[] = [
  { name: "Toronto", province: "ON" },
  { name: "Montréal", province: "QC" },
  { name: "Vancouver", province: "BC" },
  { name: "Calgary", province: "AB" },
  { name: "Ottawa", province: "ON" },
  { name: "Edmonton", province: "AB" },
  { name: "Winnipeg", province: "MB" },
  { name: "Québec City", province: "QC" },
];

// Base path Canada anglophone — miroir de buildCityPath() (US) mais sous /en-ca.
export const buildCaCityPath = (province: string, city: string) =>
  `/en-ca/lost-and-found/${province.toLowerCase()}/${toCitySlug(city)}`;
