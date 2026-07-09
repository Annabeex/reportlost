// lib/matchWatch/fbGroups.ts
// Helper "groupes fermés" : PAS de scraping. On fabrique seulement des liens de
// recherche Facebook prêts à cliquer (toi, membre, dans ton navigateur) et on
// signale les villes sans groupe lost & found connu (opportunité de partenariat).

export type FbGroup = { name: string; url: string };

// Registre éditable : ajoute ici les groupes dont TU es membre, par ville.
// Clé = "ETAT/ville en minuscules". Exemple fourni, à compléter.
export const FB_GROUPS: Record<string, FbGroup[]> = {
  // "NY/new york": [
  //   { name: "NYC Lost and Found", url: "https://www.facebook.com/groups/XXXXXXXX" },
  // ],
  // "CA/los angeles": [],
};

function key(state: string | null, city: string | null): string {
  return `${(state || "").toUpperCase()}/${String(city || "").trim().toLowerCase()}`;
}

/** Lien de recherche des posts Facebook pour une requête (ouvre FB, connecté). */
export function fbPostSearchLink(query: string): string {
  return `https://www.facebook.com/search/posts?q=${encodeURIComponent(query)}`;
}

/** Lien de recherche À L'INTÉRIEUR d'un groupe (si l'URL du groupe est connue). */
export function fbGroupSearchLink(groupUrl: string, query: string): string {
  const clean = groupUrl.replace(/\/+$/, "");
  return `${clean}/search/?q=${encodeURIComponent(query)}`;
}

export type FbHelp = {
  query: string;
  postSearchUrl: string;
  groups: { name: string; searchUrl: string }[];
  hasLostFoundGroup: boolean;
};

export function getFbHelp(
  state: string | null,
  city: string | null,
  terms: string[]
): FbHelp {
  const item = terms.filter(Boolean).join(" ") || "item";
  const query = `found ${item} ${city ?? ""}`.replace(/\s+/g, " ").trim();
  const groups = (FB_GROUPS[key(state, city)] || []).map((g) => ({
    name: g.name,
    searchUrl: fbGroupSearchLink(g.url, query),
  }));
  return {
    query,
    postSearchUrl: fbPostSearchLink(query),
    groups,
    hasLostFoundGroup: groups.length > 0,
  };
}
