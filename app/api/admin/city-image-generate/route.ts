// app/api/admin/city-image-generate/route.ts
// (Re)génère UNIQUEMENT la photo IA d'une ville, sans toucher au guide.
// Protégé par le middleware Basic Auth (/api/admin/*).
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateCityPhoto } from "@/lib/cityImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { city, state } = await req.json();
    if (!city || !state) return NextResponse.json({ error: "city et state requis" }, { status: 400 });

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY manquant (à ajouter dans Vercel)" }, { status: 400 });
    }

    const { data: cityRow } = await sb
      .from("us_cities")
      .select("id, city_ascii, state_id, state_name")
      .eq("state_id", String(state).toUpperCase())
      .ilike("city_ascii", String(city).trim())
      .maybeSingle();
    if (!cityRow) return NextResponse.json({ error: `Ville introuvable : ${city}, ${state}` }, { status: 404 });

    const url = await generateCityPhoto(sb, cityRow as any);
    if (!url) return NextResponse.json({ error: "Génération échouée (voir logs [city-image])" }, { status: 502 });

    return NextResponse.json({ ok: true, image: url });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
