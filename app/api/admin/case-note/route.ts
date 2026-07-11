// app/api/admin/case-note/route.ts
// Ajout d'une note interne à un dossier (visible dans la timeline + contexte de l'assistant IA).
// Protégé par le middleware Basic Auth (/api/admin/*).
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { lostItemId, text } = await req.json();
    if (!lostItemId || !text?.trim()) {
      return NextResponse.json({ error: "lostItemId et text requis" }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const { data: item, error } = await sb
      .from("lost_items")
      .select("id, public_id")
      .eq("id", lostItemId)
      .maybeSingle();
    if (error || !item) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    const { error: insErr } = await sb.from("case_messages").insert({
      lost_item_id: item.id,
      public_id: item.public_id,
      direction: "note",
      subject: "Note interne",
      body_text: String(text).trim(),
    });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
