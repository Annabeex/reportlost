// app/api/case_followup/[public_id]/dossier/route.ts
// Données du dossier pour préremplir le compte rendu client :
// établissements contactés (saisis via "qui contacter") + veille IA
// (candidats étudiés, dernier passage). Protégé par Basic Auth via le
// middleware /api/case_followup/*.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { public_id: string } }) {
  const publicId = String(params.public_id || "").trim();
  if (!/^\d{5}$/.test(publicId)) {
    return NextResponse.json({ error: "public_id invalide" }, { status: 400 });
  }
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  const { data: item } = await sb
    .from("lost_items")
    .select("id, search_status, last_searched_at, next_search_at")
    .eq("public_id", publicId)
    .maybeSingle();
  if (!item) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const [{ data: establishments }, { data: candidates }, { count: reviewedCount }] = await Promise.all([
    sb
      .from("case_establishments")
      .select("name, email, url, contacted_email, contacted_form, notes")
      .eq("lost_item_id", item.id)
      .order("created_at", { ascending: true }),
    sb
      .from("match_candidates")
      .select("title, source, verdict, created_at")
      .eq("lost_item_id", item.id)
      // Seules les pistes crédibles sont détaillées au client ; les rejets
      // n'alimentent que le compteur global.
      .in("verdict", ["yes", "maybe"])
      .order("created_at", { ascending: false })
      .limit(10),
    sb
      .from("match_candidates")
      .select("id", { count: "exact", head: true })
      .eq("lost_item_id", item.id),
  ]);

  return NextResponse.json({
    ok: true,
    establishments: establishments || [],
    candidates: candidates || [],
    reviewedCount: reviewedCount ?? 0,
    lastSearchedAt: item.last_searched_at,
    searchStatus: item.search_status,
  });
}
