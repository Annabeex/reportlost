// app/api/ca/found-items/route.ts
// 🇨🇦 COPIE CANADIENNE de app/api/found-items/route.ts (US, non modifié).
// Enregistre un objet trouvé déclaré au Canada dans found_items (country = 'CA').
// Différences avec la version US :
//  - refuse toute région qui n'est pas une province ou un territoire canadien ;
//  - exige une photo ou une description ;
//  - pas de « récupération » par mise à jour d'une ligne existante (la version
//    US peut réécrire une ligne trouvée par image ou titre/date/ville) : ici un
//    échec d'insertion renvoie simplement une erreur.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isCaProvince } from "@/lib/canada/canadaData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function clean(value: unknown, max = 2000): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}
function nullable(value: unknown, max = 2000): string | null {
  const t = clean(value, max);
  return t.length > 0 ? t : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sb = getSupabaseAdmin();
    if (!sb) return json({ ok: false, error: "Missing Supabase credentials" }, { status: 500 });

    const state_id = clean(body.state_id, 4).toUpperCase();
    if (!isCaProvince(state_id)) {
      return json({ ok: false, error: "province_required" }, { status: 400 });
    }

    const image_url = nullable(body.image_url, 1000);
    const description = clean(body.description, 4000);
    if (!image_url && description.length < 10) {
      return json({ ok: false, error: "photo_or_description_required" }, { status: 400 });
    }

    const dateRaw = clean(body.date, 10);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : null;

    const row: Record<string, any> = {
      country: "CA",
      image_url,
      description: description || null,
      city: nullable(body.city, 120),
      state_id,
      date,
      labels: clean(body.labels),
      logos: clean(body.logos),
      objects: clean(body.objects),
      ocr_text: clean(body.ocr_text),
      title: nullable(body.title, 160),
      email: nullable(body.email, 200),
      phone: nullable(body.phone, 40),
      dropoff_location: nullable(body.dropoff_location, 300),
    };

    const { data, error } = await sb.from("found_items").insert([row]).select("id, created_at").maybeSingle();
    if (error || !data?.id) {
      console.error("[ca/found-items] insert failed:", error);
      return json({ ok: false, error: "insert_failed" }, { status: 500 });
    }
    return json({ ok: true, id: data.id, created_at: data.created_at }, { status: 200 });
  } catch (err: any) {
    console.error("[ca/found-items] unexpected error:", err);
    return json({ ok: false, error: "invalid_request" }, { status: 500 });
  }
}
