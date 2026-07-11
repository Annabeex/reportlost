// app/api/admin/case-establishment/route.ts
// CRUD du suivi des établissements contactés pour un dossier.
// Protégé par le middleware Basic Auth (/api/admin/*).
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { lostItemId, name, email, url } = await req.json();
    if (!lostItemId || !name?.trim()) {
      return NextResponse.json({ error: "lostItemId et name requis" }, { status: 400 });
    }
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const { data, error } = await sb
      .from("case_establishments")
      .insert({
        lost_item_id: String(lostItemId),
        name: String(name).trim(),
        email: email ? String(email).trim() : null,
        url: url ? String(url).trim() : null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, establishment: data });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, contacted_email, contacted_form, notes } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const patch: Record<string, any> = {};
    if (typeof contacted_email === "boolean") patch.contacted_email = contacted_email;
    if (typeof contacted_form === "boolean") patch.contacted_form = contacted_form;
    if (typeof notes === "string") patch.notes = notes;

    const { error } = await sb.from("case_establishments").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const { error } = await sb.from("case_establishments").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
