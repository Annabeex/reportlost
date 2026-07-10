// lib/matchWatch/run.ts
// Orchestration partagée : recherche + jugement + stockage pour UN signalement.
// Utilisé par le cron (/api/match-watch) et le bouton admin (/api/admin/match-one).

import {
  LostReport,
  Candidate,
  generateItemTerms,
  buildQueries,
  serperSearch,
  prefilter,
  judgeCandidate,
  describePhoto,
  normalizeUrl,
} from "./core";

const MAX_JUDGE = Number(process.env.MATCH_MAX_JUDGE || 5);

export const LOST_SELECT =
  "id, title, description, primary_category, categories, circumstances, city, state_id, place_type, place_type_other, loss_street, loss_neighborhood, date, created_at, slug, public_id, email, object_photo";

export function toReport(row: any): LostReport {
  return {
    id: String(row.id),
    title: row.title ?? null,
    description: row.description ?? null,
    category: row.primary_category || row.categories || null,
    circumstances: row.circumstances ?? null,
    city: row.city ?? null,
    state_id: row.state_id ?? null,
    place: row.place_type_other || row.loss_street || row.loss_neighborhood || row.place_type || null,
    lossDate: row.date || row.created_at || null,
    slug: row.slug ?? null,
    public_id: row.public_id ?? null,
    email: row.email ?? null,
    photo: row.object_photo ?? null,
  };
}

/** Cherche en ligne pour un signalement, stocke les candidats, renvoie ceux jugés. */
export async function runSearchForReport(sb: any, report: LostReport): Promise<Candidate[]> {
  const { data: seenRows } = await sb.from("match_candidates").select("url").eq("lost_item_id", report.id);
  // clés normalisées : une annonce sous plusieurs URLs = un seul match
  const seen = new Set<string>((seenRows || []).map((r: any) => normalizeUrl(r.url)));
  const norm = (rs: any[]) => rs.map((r) => ({ ...r, link: normalizeUrl(r.link) }));

  const terms = await generateItemTerms(report);

  let results = norm(
    (await Promise.all(buildQueries(report, terms, "city").map((q) => serperSearch(q, report.lossDate).catch(() => [])))).flat()
  );
  let filtered = prefilter(results, terms, seen);
  if (filtered.length === 0 && report.place) {
    results = norm(
      (await Promise.all(buildQueries(report, terms, "place").map((q) => serperSearch(q, report.lossDate).catch(() => [])))).flat()
    );
    filtered = prefilter(results, terms, seen);
  }

  const toJudge = filtered.slice(0, MAX_JUDGE);
  // Décrit la photo une seule fois (uniquement s'il y a des candidats à juger)
  if (toJudge.length && report.photo && !report.visual) {
    report.visual = await describePhoto(report.photo);
  }
  const judged: Candidate[] = [];
  for (const r of toJudge) judged.push(await judgeCandidate(report, r));

  if (judged.length) {
    const rows = judged.map((c) => ({
      lost_item_id: report.id,
      url: c.link,
      title: c.title,
      snippet: c.snippet,
      source: c.source,
      verdict: c.verdict,
      confidence: c.confidence,
      reason: c.reason,
      emailed: c.verdict === "no",
    }));
    await sb.from("match_candidates").upsert(rows, { onConflict: "lost_item_id,url", ignoreDuplicates: true });
  }
  return judged;
}
