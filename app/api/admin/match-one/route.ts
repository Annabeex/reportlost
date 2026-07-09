// app/api/admin/match-one/route.ts
// Lance la recherche en ligne pour UN dossier précis (bouton admin).
// Ignore la cadence et le filtre "payé" : recherche forcée à la demande.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { LOST_SELECT, toReport, runSearchForReport } from "@/lib/matchWatch/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.SERPER_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, error: "SERPER_API_KEY / ANTHROPIC_API_KEY manquants" }, { status: 400 });
  }
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "supabase admin indisponible" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const id = body?.id ? String(body.id) : "";
  if (!id) return NextResponse.json({ ok: false, error: "id manquant" }, { status: 400 });

  const { data: row, error } = await sb.from("lost_items").select(LOST_SELECT).eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ ok: false, error: "dossier introuvable" }, { status: 404 });

  try {
    await runSearchForReport(sb, toReport(row)); // cherche + stocke
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }

  // Renvoie TOUS les candidats crédibles connus pour ce dossier (nouveaux + anciens)
  const { data: cands } = await sb
    .from("match_candidates")
    .select("url, title, snippet, source, verdict, confidence, reason")
    .eq("lost_item_id", id)
    .in("verdict", ["yes", "maybe"])
    .order("confidence", { ascending: false });

  const candidates = (cands || []).map((c: any) => ({
    link: c.url,
    title: c.title,
    snippet: c.snippet,
    source: c.source,
    verdict: c.verdict,
    confidence: c.confidence,
    reason: c.reason,
  }));

  return NextResponse.json({ ok: true, candidates });
}
