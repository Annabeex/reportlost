// lib/regions.ts
// Regions touristiques qui correspondent exactement a un comte. Les gens y
// cherchent par le nom de la region (« Cape Cod lost and found »), jamais par
// celui du comte : un kit Facebook regional porte donc le nom de la region et
// renvoie vers la page comte, qui liste toutes les villes couvertes.
//
// Ne mettre ici que des regions dont le comte a une page active : Etat present
// dans COUNTY_STATES (lib/county.ts) et au moins MIN_COUNTY_CITIES villes a
// guide publie. Sinon le lien du kit tomberait sur une 404.

export type Region = {
  name: string;   // nom utilise dans le groupe et les textes
  state: string;  // code a deux lettres
  county: string; // valeur exacte de us_cities.county_name
};

// Nantucket n'y figure pas : le comte ne compte qu'une commune, il n'aura jamais
// de page comte. Utiliser le kit ville classique (Nantucket, MA).
export const REGIONS: Region[] = [
  { name: "Cape Cod",          state: "MA", county: "Barnstable" },
  { name: "Martha's Vineyard", state: "MA", county: "Dukes" },
  { name: "Cape May",          state: "NJ", county: "Cape May" },
  { name: "Outer Banks",       state: "NC", county: "Dare" },
  { name: "Florida Keys",      state: "FL", county: "Monroe" },
  { name: "30A & Destin",      state: "FL", county: "Walton" },
];
