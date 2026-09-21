// lib/orgMatchRun.ts
//
// Exécution du rapprochement, côté serveur. Deux entrées :
//   runMatchForLostItem(lostId)   → quand quelqu'un déclare une perte
//   runMatchForFoundItem(foundId) → quand un établissement enregistre un objet
//
// Étage 1 (toujours) : moteur déterministe, gratuit, aucun appel externe.
// Étage 2 (optionnel) : avis d'un modèle sur la liste courte uniquement.
//   Il ne se déclenche que si ORG_MATCH_AI=1 ET organizations.match_ai = true.
//   Il ne peut jamais inventer un objet : il ne fait que juger des couples
//   déjà retenus par l'étage 1.
//
// Ces fonctions ne doivent JAMAIS faire échouer l'enregistrement qui les
// appelle : tout est encapsulé, les erreurs sont journalisées et avalées.

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { matchOneToMany, matchManyToOne, matchLevel, type LostRow, type FoundRow, type MatchResult } from "@/lib/orgMatch";

const LOST_FIELDS = "id, title, description, date, city, state_id, created_at";
const FOUND_FIELDS = "id, org_id, org_ref, title, description, date, city, dropoff_location, status";

/** Fenêtre de recherche : au-delà, un rapprochement n'a plus de sens. */
const WINDOW_DAYS = 45;

function isoDaysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Étage 2 : avis du modèle (optionnel, désactivé par défaut)          */
/* ------------------------------------------------------------------ */

// Indexé par COUPLE : dans le sens « objet trouvé → pertes ouvertes », un même
// found_item_id revient pour plusieurs pertes ; une clé par objet seul aurait
// écrasé tous les avis sauf le dernier.
type AiVerdict = {
  lost_item_id: string;
  found_item_id: string;
  verdict: "yes" | "maybe" | "no";
  confidence: number;
  reason: string;
};
const pairKey = (lostId: string, foundId: string) => `${lostId}|${foundId}`;

async function aiReview(lost: LostRow, founds: FoundRow[]): Promise<AiVerdict[]> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || process.env.ORG_MATCH_AI !== "1" || !founds.length) return [];

  const model = process.env.ORG_MATCH_MODEL || "claude-haiku-4-5";
  const system =
    "You compare one lost-item report with a short list of items currently held by a lost & found office. " +
    "For each candidate, answer whether it is plausibly the same object. Be strict: a different type of object is 'no'. " +
    "The report may be written in any language. Answer ONLY with a JSON array of " +
    '{"id":string,"verdict":"yes"|"maybe"|"no","confidence":0-100,"reason":string}. ' +
    "Keep each reason under 20 words, factual, no speculation about what the owner should do.";

  const user = [
    `LOST REPORT\ntitle: ${lost.title || ""}\ndescription: ${lost.description || ""}\nlost on: ${lost.date || "?"}`,
    "",
    "CANDIDATES HELD BY THE OFFICE",
    ...founds.map((f) => `- id: ${f.id}\n  title: ${f.title || ""}\n  description: ${f.description || ""}\n  found on: ${f.date || "?"}`),
  ].join("\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens: 700, system, messages: [{ role: "user", content: user }] }),
      // Le rapprochement ne doit pas retarder une réponse HTTP : on coupe court.
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      console.warn("orgMatch AI non-ok:", res.status);
      return [];
    }
    const json: any = await res.json();
    const text: string = json?.content?.[0]?.text || "";
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) return [];
    const arr = JSON.parse(m[0]);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x: any) => x && x.id)
      .map((x: any) => ({
        lost_item_id: String(lost.id),
        found_item_id: String(x.id),
        verdict: ["yes", "maybe", "no"].includes(x.verdict) ? x.verdict : "maybe",
        confidence: Math.max(0, Math.min(100, Number(x.confidence) || 0)),
        reason: String(x.reason || "").slice(0, 300),
      }));
  } catch (e) {
    console.warn("orgMatch AI error:", (e as Error)?.message || e);
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Écriture des candidats                                              */
/* ------------------------------------------------------------------ */

async function persist(
  sb: any,
  results: MatchResult[],
  foundsById: Map<string, FoundRow>,
  ai: AiVerdict[],
): Promise<number> {
  if (!results.length) return 0;
  const aiByPair = new Map(ai.map((a) => [pairKey(a.lost_item_id, a.found_item_id), a]));

  const rows = results.map((r) => {
    const f = foundsById.get(r.found_item_id);
    const a = aiByPair.get(pairKey(r.lost_item_id, r.found_item_id));
    return {
      lost_item_id: r.lost_item_id,
      found_item_id: r.found_item_id,
      org_id: f?.org_id || null,
      score: r.score,
      level: matchLevel(r.score),
      reasons: r.reasons,
      ai_verdict: a?.verdict || null,
      ai_confidence: a?.confidence ?? null,
      ai_reason: a?.reason || null,
    };
  })
  // Un « no » franc du modèle retire le candidat de la pile du bureau :
  // c'est là que l'IA fait gagner du temps, pas en ajoutant des candidats.
  .filter((row) => !(row.ai_verdict === "no" && (row.ai_confidence ?? 0) >= 70));

  if (!rows.length) return 0;

  const { error } = await sb
    .from("org_matches")
    .upsert(rows, { onConflict: "lost_item_id,found_item_id", ignoreDuplicates: true });
  if (error) {
    console.warn("org_matches upsert:", error.message);
    return 0;
  }
  return rows.length;
}

/* ------------------------------------------------------------------ */
/* Entrées publiques                                                   */
/* ------------------------------------------------------------------ */

/** Une perte vient d'être déclarée : on la compare aux inventaires. */
export async function runMatchForLostItem(lostId: string): Promise<number> {
  try {
    const sb = getSupabaseAdmin();
    if (!sb || !lostId) return 0;

    const { data: lost } = await sb.from("lost_items").select(LOST_FIELDS).eq("id", lostId).maybeSingle();
    if (!lost) return 0;

    // On ne compare qu'aux objets encore détenus, dans la fenêtre utile.
    // La ville borne fortement la requête : un objet trouvé à Chicago n'a
    // rien à voir avec une perte à Boston.
    let q = sb
      .from("found_items")
      .select(FOUND_FIELDS)
      .not("org_id", "is", null)
      .in("status", ["stored", "claim_pending"])
      .gte("date", isoDaysAgo(WINDOW_DAYS))
      .limit(400);
    if ((lost as any).city) q = q.ilike("city", String((lost as any).city).trim());

    const { data: founds } = await q;
    if (!founds?.length) return 0;

    const results = matchOneToMany(lost as LostRow, founds as FoundRow[]);
    if (!results.length) return 0;

    const byId = new Map((founds as FoundRow[]).map((f) => [String(f.id), f]));
    const shortlist = results.slice(0, 12).map((r) => byId.get(r.found_item_id)!).filter(Boolean);

    // L'IA n'est consultée que si au moins une organisation concernée l'a activée.
    const orgIds = [...new Set(shortlist.map((f) => f.org_id).filter(Boolean))] as string[];
    let aiAllowed = false;
    if (orgIds.length) {
      const { data: orgs } = await sb.from("organizations").select("id, match_ai").in("id", orgIds);
      aiAllowed = !!orgs?.some((o: any) => o.match_ai);
    }
    const ai = aiAllowed ? await aiReview(lost as LostRow, shortlist) : [];

    return await persist(sb, results.slice(0, 12), byId, ai);
  } catch (e) {
    console.warn("runMatchForLostItem:", (e as Error)?.message || e);
    return 0;
  }
}

/** Un établissement vient d'enregistrer un objet : on le compare aux pertes ouvertes. */
/* ------------------------------------------------------------------ */
/* Déclarations faites directement à un établissement                   */
/* ------------------------------------------------------------------ */

/** Dans org_matches.lost_item_id, une déclaration campus porte ce préfixe :
 *  elle vit dans org_lost_reports, pas dans lost_items. */
export const CAMPUS_PREFIX = "campus:";

function campusToLost(r: any, city?: string | null): LostRow {
  return {
    id: `${CAMPUS_PREFIX}${r.id}`,
    title: r.title,
    // Le lieu de perte aide le moteur : « library » des deux côtés compte.
    description: [r.description, r.lost_location].filter(Boolean).join(" · ") || null,
    date: r.lost_at,
    city: city || null,
    created_at: r.created_at,
  };
}

async function campusReportsAsLost(sb: any, orgId: string, city?: string | null): Promise<LostRow[]> {
  const { data } = await sb
    .from("org_lost_reports")
    .select("id, title, description, lost_location, lost_at, created_at")
    .eq("org_id", orgId)
    .eq("status", "open")
    .gte("lost_at", isoDaysAgo(WINDOW_DAYS))
    .limit(400);
  return (data || []).map((r: any) => campusToLost(r, city));
}

/** Une perte vient d'être déclarée à un établissement : on la compare à SON
 *  inventaire, et à lui seul. */
export async function runMatchForCampusReport(reportId: string): Promise<number> {
  try {
    const sb = getSupabaseAdmin();
    if (!sb || !reportId) return 0;

    const { data: rep } = await sb
      .from("org_lost_reports")
      .select("id, org_id, title, description, lost_location, lost_at, created_at, status")
      .eq("id", reportId)
      .maybeSingle();
    if (!rep || rep.status !== "open") return 0;

    const { data: founds } = await sb
      .from("found_items")
      .select(FOUND_FIELDS)
      .eq("org_id", rep.org_id)
      .in("status", ["stored", "claim_pending"])
      .gte("date", isoDaysAgo(WINDOW_DAYS))
      .limit(1000);
    if (!founds?.length) return 0;

    const city = (founds as FoundRow[])[0]?.city || null;
    const results = matchOneToMany(campusToLost(rep, city), founds as FoundRow[]);
    if (!results.length) return 0;

    const byId = new Map((founds as FoundRow[]).map((f) => [String(f.id), f]));
    return await persist(sb, results.slice(0, 12), byId, []);
  } catch (e) {
    console.warn("runMatchForCampusReport:", (e as Error)?.message || e);
    return 0;
  }
}

export async function runMatchForFoundItem(foundId: string): Promise<number> {
  try {
    const sb = getSupabaseAdmin();
    if (!sb || !foundId) return 0;

    const { data: found } = await sb.from("found_items").select(FOUND_FIELDS).eq("id", foundId).maybeSingle();
    if (!found || !(found as any).org_id) return 0;

    let q = sb
      .from("lost_items")
      .select(LOST_FIELDS)
      .gte("date", isoDaysAgo(WINDOW_DAYS))
      .limit(400);
    if ((found as any).city) q = q.ilike("city", String((found as any).city).trim());

    const { data: siteLosts } = await q;

    // Les déclarations faites directement à CET établissement (page publique,
    // QR code « Lost something? ») : toujours comparées, quelle que soit la ville.
    const campus = await campusReportsAsLost(sb, String((found as any).org_id), (found as any).city);
    const losts = [...((siteLosts as LostRow[]) || []), ...campus];
    if (!losts.length) return 0;

    const results = matchManyToOne(losts as LostRow[], found as FoundRow);
    if (!results.length) return 0;

    const byId = new Map([[String((found as any).id), found as FoundRow]]);

    const { data: org } = await sb
      .from("organizations")
      .select("match_ai")
      .eq("id", (found as any).org_id)
      .maybeSingle();

    // Sens inverse : une requête par perte serait coûteuse, on se limite aux
    // trois meilleures, qui sont les seules que le bureau regardera.
    let ai: AiVerdict[] = [];
    if (org?.match_ai) {
      const lostById = new Map((losts as LostRow[]).map((l) => [String(l.id), l]));
      for (const r of results.slice(0, 3)) {
        const l = lostById.get(r.lost_item_id);
        if (!l) continue;
        const verdicts = await aiReview(l, [found as FoundRow]);
        ai.push(...verdicts);
      }
    }

    return await persist(sb, results.slice(0, 12), byId, ai);
  } catch (e) {
    console.warn("runMatchForFoundItem:", (e as Error)?.message || e);
    return 0;
  }
}
