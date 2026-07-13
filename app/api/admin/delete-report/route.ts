// app/api/admin/delete-report/route.ts
// Suppression définitive d'un signalement (tests, spam) + données liées.
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

    // Données liées (non bloquant si tables absentes)
    await sb.from("case_messages").delete().eq("lost_item_id", String(id)).then(() => {}, () => {});
    await sb.from("case_establishments").delete().eq("lost_item_id", String(id)).then(() => {}, () => {});
    await sb.from("match_candidates").delete().eq("lost_item_id", String(id)).then(() => {}, () => {});

    const { error } = await sb.from("lost_items").delete().eq("id", String(id));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
