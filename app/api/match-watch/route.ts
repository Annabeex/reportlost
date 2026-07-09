// app/api/match-watch/route.ts
// Worker de veille : sélectionne les signalements payants "dus", cherche en ligne,
// juge avec Haiku, stocke les candidats. N'ENVOIE PAS d'email (voir /api/match-digest).
// Déclenché par Vercel Cron (voir vercel.json). Protégé par CRON_SECRET.
// Boucle avec budget de temps : draine plusieurs lots dans une seule exécution.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { computeNextSearch } from "@/lib/matchWatch/core";
import { LOST_SELECT, toReport, runSearchForReport } from "@/lib/matchWatch/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = Number(process.env.MATCH_BATCH || 10);
const TIME_BUDGET_MS = Number(process.env.MATCH_TIME_BUDGET_MS || 50000);
const MIN_CONTRIB = Number(process.env.MATCH_MIN_CONTRIBUTION || 12); // veille si contribution >= ce montant

function authorized(req: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return true; // pas de secret défini -> ouvert (dev)
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true; // Vercel Cron envoie ce header
  return new URL(req.url).searchParams.get("key") === secret;
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
  const reportsDone: { ref: string; title: string; city: string; found: number }[] = [];

  while (Date.now() - startedAt < TIME_BUDGET_MS) {
    const { data: reports, error } = await sb
      .from("lost_items")
      .select(LOST_SELECT)
      .eq("search_status", "active")
      // payé & contribution >= seuil, OU forcé manuellement depuis l'admin
      .or(`and(paid.eq.true,contribution.gte.${MIN_CONTRIB}),force_search.eq.true`)
      .lte("next_search_at", new Date().toISOString())
      .order("next_search_at", { ascending: true })
      .limit(BATCH);

    if (error) return NextResponse.json({ error: error.message, processed }, { status: 500 });
    if (!reports || reports.length === 0) break;

    for (const row of reports) {
      const report = toReport(row);
      let found = 0;
      try {
        const judged = await runSearchForReport(sb, report);
        found = judged.filter((c) => c.verdict !== "no").length;
        candidatesFound += found;
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

      reportsDone.push({
        ref: report.public_id || report.id,
        title: report.title || "—",
        city: report.city || "—",
        found,
      });
      processed += 1;
      if (Date.now() - startedAt >= TIME_BUDGET_MS) break;
    }
  }

  return NextResponse.json({ ok: true, processed, candidatesFound, reports: reportsDone });
}
