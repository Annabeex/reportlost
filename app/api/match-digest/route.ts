// app/api/match-digest/route.ts
// Envoie UN digest quotidien de tous les candidats non encore envoyés (yes/maybe),
// puis les marque comme envoyés. Protégé par CRON_SECRET.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { LostReport, Candidate } from "@/lib/matchWatch/core";
import { getFbHelp } from "@/lib/matchWatch/fbGroups";
import { sendDigest, DigestEntry } from "@/lib/matchWatch/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return true;
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("key") === secret;
}

function shortTerm(report: { title?: string | null; category?: string | null }): string[] {
  const src = (report.category || report.title || "").toString().trim();
  const t = src.split(/\s+/).slice(0, 2).join(" ");
  return t ? [t] : [];
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "supabase admin indisponible" }, { status: 500 });

  // 1) Candidats crédibles pas encore envoyés
  const { data: cands, error } = await sb
    .from("match_candidates")
    .select("*")
    .eq("emailed", false)
    .in("verdict", ["yes", "maybe"])
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!cands || cands.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  // 2) Regroupement par signalement
  const byReport = new Map<string, any[]>();
  for (const c of cands) {
    if (!byReport.has(c.lost_item_id)) byReport.set(c.lost_item_id, []);
    byReport.get(c.lost_item_id)!.push(c);
  }

  const ids = Array.from(byReport.keys());
  const { data: reports } = await sb
    .from("lost_items")
    .select("id, title, description, primary_category, categories, circumstances, city, state_id, place_type, place_type_other, loss_street, loss_neighborhood, date, created_at, slug, public_id")
    .in("id", ids);

  const reportById = new Map<string, any>((reports || []).map((r: any) => [String(r.id), r]));

  const entries: DigestEntry[] = [];
  for (const [rid, list] of byReport) {
    const row = reportById.get(String(rid));
    if (!row) continue;
    const report: LostReport = {
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
    };
    const candidates: Candidate[] = list.map((c) => ({
      title: c.title,
      link: c.url,
      snippet: c.snippet || "",
      date: c.date || undefined,
      source: c.source || "web",
      verdict: c.verdict,
      confidence: c.confidence || 0,
      reason: c.reason || "",
    }));
    const fb = getFbHelp(report.state_id, report.city, shortTerm(report));
    entries.push({ report, candidates, fb });
  }

  // 3) Envoi
  await sendDigest(entries);

  // 4) Marquage envoyé
  const idsToMark = cands.map((c: any) => c.id);
  await sb.from("match_candidates").update({ emailed: true }).in("id", idsToMark);

  return NextResponse.json({ ok: true, sent: entries.length, candidates: cands.length });
}
