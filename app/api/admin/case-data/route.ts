// app/api/admin/case-data/route.ts
// Renvoie tout le contexte d'un dossier : signalement + messages + candidats de veille.
// Protégé par le middleware Basic Auth (/api/admin/*).
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  const { data: item, error } = await sb
    .from("lost_items")
    .select(
      "id, public_id, created_at, title, description, circumstances, primary_category, categories, city, state_id, date, time_slot, first_name, last_name, email, phone, address, birth_date, private_detail, contribution, paid, object_photo, slug, case_token, search_status, last_searched_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !item) {
    return NextResponse.json({ error: error?.message || "Dossier introuvable" }, { status: 404 });
  }

  const [{ data: messages }, { data: candidates }, { data: establishments }] = await Promise.all([
    sb
      .from("case_messages")
      .select("id, direction, from_email, to_email, subject, body_text, body_html, created_at")
      .eq("lost_item_id", id)
      .order("created_at", { ascending: true })
      .limit(200),
    sb
      .from("match_candidates")
      .select("url, title, snippet, source, verdict, confidence, reason, created_at")
      .eq("lost_item_id", id)
      .in("verdict", ["yes", "maybe"])
      .order("created_at", { ascending: false })
      .limit(20),
    sb
      .from("case_establishments")
      .select("id, name, email, url, contacted_email, contacted_form, notes, created_at")
      .eq("lost_item_id", id)
      .order("created_at", { ascending: true }),
  ]);

  return NextResponse.json({
    item,
    messages: messages || [],
    candidates: candidates || [],
    establishments: establishments || [],
  });
}
