// app/api/match-watch/route.ts
// Worker de veille : sélectionne les signalements "dus", cherche en ligne (Serper),
// juge avec Haiku, stocke les candidats. N'ENVOIE PAS d'email (voir /api/match-digest).
// Déclenché par Vercel Cron (voir vercel.json). Protégé par CRON_SECRET.
// Boucle avec budget de temps : draine plusieurs lots dans une seule exécution.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  LostReport,
  Candidate,
  generateItemTerms,
  buildQueries,
  serperSearch,
  prefilter,
  judgeCandidate,
  computeNextSearch,
} from "@/lib/matchWatch/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = Number(process.env.MATCH_BATCH || 10);
const MAX_JUDGE = Number(process.env.MATCH_MAX_JUDGE || 5);
const TIME_BUDGET_MS = Number(process.env.MATCH_TIME_BUDGET_MS || 50000);
const MIN_CONTRIB = Number(process.env.MATCH_MIN_CONTRIBUTION || 12); // veille si contribution > ce montant

function authorized(req: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return true; // pas de secret défini -> ouvert (dev)
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true; // Vercel Cron envoie ce header
  return new URL(req.url).searchParams.get("key") === secret;
}

async function processReport(sb: any, report: LostReport): Promise<number> {
  // URLs déjà vues pour ce signalement (anti-doublon)
  const { data: seenRows } = await sb.from("match_candidates").select("url").eq("lost_item_id", report.id);
  const seen = new Set<string>((seenRows || []).map((r: any) => r.url));

  const terms = await generateItemTerms(report);

  // Tier ville, puis escalade lieu précis si rien
  let results = (
    await Promise.all(buildQueries(report, terms, "city").map((q) => serperSearch(q, report.lossDate).catch(() => [])))
  ).flat();
  let filtered = prefilter(results, terms, seen);
  if (filtered.length === 0 && report.place) {
    results = (
      await Promise.all(buildQueries(report, terms, "place").map((q) => serperSearch(q, report.lossDate).catch(() => [])))
    ).flat();
    filtered = prefilter(results, terms, seen);
  }

  const toJudge = filtered.slice(0, MAX_JUDGE);
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
      emailed: c.verdict === "no", // 'no' mémorisé mais jamais envoyé
    }));
    await sb.from("match_candidates").upsert(rows, { onConflict: "lost_item_id,url", ignoreDuplicates: true });
  }
  return judged.filter((c) => c.verdict !== "no").length;
}

function toReport(row: any): LostReport {
  return {
    id: String(row.id),
    title: row.title ?? null,
    description: row.description ?? null,
    category: row.category ?? null,
    city: row.city ?? null,
    state_id: row.state_id ?? null,
    place: row.place_type_other || row.place_type || null,
    lossDate: row.date || row.created_at || null,
    slug: row.slug ?? null,
    public_id: row.public_id ?? null,
  };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.SERPER_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ disabled: true, reason: "SERPER_API_KEY / ANTHROPIC_API_KEY manquants" });
  }
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "supabase admin indisponible" }, { status: 500 });

  const startedAt = Date.now();
  let processed = 0;
  let candidatesFound = 0;

  const SELECT =
    "id, title, description, category, city, state_id, place_type, place_type_other, date, created_at, slug, public_id";

  while (Date.now() - startedAt < TIME_BUDGET_MS) {
    const { data: reports, error } = await sb
      .from("lost_items")
      .select(SELECT)
      .eq("search_status", "active")
      .eq("paid", true) // ⬅️ veille UNIQUEMENT sur les clients qui ont payé
      .gte("contribution", MIN_CONTRIB) // ⬅️ et seulement au seuil ou au-dessus (12 $ inclus par défaut, test)
      .lte("next_search_at", new Date().toISOString())
      .order("next_search_at", { ascending: true })
      .limit(BATCH);

    if (error) return NextResponse.json({ error: error.message, processed }, { status: 500 });
    if (!reports || reports.length === 0) break;

    for (const row of reports) {
      const report = toReport(row);
      try {
        candidatesFound += await processReport(sb, report);
      } catch (e) {
        console.error("match-watch report error", report.id, (e as Error).message);
      }
      const { next, done } = computeNextSearch(report.lossDate);
      await sb
        .from("lost_items")
        .update({
          last_searched_at: new Date().toISOString(),
          next_search_at: next ? next.toISOString() : null,
          search_status: done ? "done" : "active",
        })
        .eq("id", report.id);
      processed += 1;
      if (Date.now() - startedAt >= TIME_BUDGET_MS) break;
    }
  }

  return NextResponse.json({ ok: true, processed, candidatesFound });
}
