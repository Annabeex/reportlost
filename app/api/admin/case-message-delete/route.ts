// app/api/admin/case-message-delete/route.ts
// Suppression d'un message non pertinent de la timeline d'un dossier.
// Protégé par le middleware Basic Auth (/api/admin/*).
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const { error } = await sb.from("case_messages").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
