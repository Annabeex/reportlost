// app/api/admin/update-report/route.ts
// Mise à jour des coordonnées client d'un signalement depuis l'admin
// (téléphone, adresse, date de naissance, détail privé...). Liste blanche
// stricte de champs. Protégé par Basic Auth via le middleware /api/admin/*.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = new Set([
  "first_name",
  "last_name",
  "email",
  "phone",
  "address",
  "birth_date",
  "private_detail",
]);

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const id = String(body?.id || "").trim();
    const fields = body?.fields || {};
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const patch: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (!ALLOWED_FIELDS.has(k)) continue;
      const val = typeof v === "string" ? v.trim() : v;
      patch[k] = val === "" ? null : val;
    }
    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: "aucun champ valide" }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const { error } = await sb.from("lost_items").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
