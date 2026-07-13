// lib/fetchPoliceStations.ts
// Récupère les postes de police autour d'une ville via l'API Overpass (OpenStreetMap).
//
// ⚠️ Bug historique corrigé : la requête utilisait "out tags center;".
// Le modificateur `tags` d'Overpass n'imprime QUE les ids et les tags,
// SANS coordonnées → tous les nodes revenaient sans lat/lon et étaient filtrés
// ("No police stations found"). On utilise donc "out center;" qui conserve
// les coordonnées des nodes et ajoute un centre aux ways/relations.

export type RawStation = {
  id?: string;
  lat: number | null;
  lon: number | null;
  name: string | null;
};

// Miroirs publics Overpass (bascule si le premier échoue / limite le débit).
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export async function fetchPoliceStations(
  lat: number,
  lng: number,
  radiusMeters = 10000
): Promise<RawStation[]> {
  // Garde-fou : coordonnées manquantes/invalides → pas d'appel.
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    console.warn("[police] invalid coordinates", { lat, lng });
    return [];
  }

  const query =
    `[out:json][timeout:25];` +
    `(` +
    `node[amenity=police](around:${radiusMeters},${lat},${lng});` +
    `way[amenity=police](around:${radiusMeters},${lat},${lng});` +
    `relation[amenity=police](around:${radiusMeters},${lat},${lng});` +
    `);` +
    `out center;`; // ✅ conserve les coordonnées (contrairement à "out tags center")

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // Overpass demande un User-Agent identifiable (bonne pratique / évite certains blocages).
          "User-Agent": "ReportLost.org/1.0 (+https://reportlost.org)",
        },
        body: "data=" + encodeURIComponent(query),
        next: { revalidate: 86400 }, // cache 24h : la carte des commissariats bouge peu
        // ⏱️ 5s max par miroir : un Overpass lent/en panne ne doit JAMAIS
        // bloquer le rendu de la page (la carte s'affiche alors sans stations).
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        console.warn(`[police] Overpass ${res.status} on ${endpoint}`);
        continue; // essaie le miroir suivant
      }

      const data = await res.json();
      const raw = Array.isArray(data?.elements) ? data.elements : [];

      const stations: RawStation[] = raw
        .map((el: any) => ({
          id: el?.id != null ? String(el.id) : undefined,
          lat:
            typeof el?.lat === "number"
              ? el.lat
              : typeof el?.center?.lat === "number"
              ? el.center.lat
              : null,
          lon:
            typeof el?.lon === "number"
              ? el.lon
              : typeof el?.center?.lon === "number"
              ? el.center.lon
              : null,
          name: typeof el?.tags?.name === "string" ? el.tags.name : null,
        }))
        .filter((s: RawStation) => s.lat !== null && s.lon !== null);

      // Succès (même si 0 résultat : la zone est peut-être réellement vide).
      return stations;
    } catch (err) {
      console.warn(
        `[police] Overpass fetch failed on ${endpoint}:`,
        (err as Error)?.message
      );
      continue; // miroir suivant
    }
  }

  console.warn("[police] all Overpass endpoints failed");
  return [];
}
