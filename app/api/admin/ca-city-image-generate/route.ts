// app/api/admin/ca-city-image-generate/route.ts
// 🇨🇦 Génère la photo d'une ville canadienne (Gemini), sans toucher au guide.
// Protégé par le middleware Basic Auth (/api/admin/*).
// Utilisable depuis la barre d'adresse du navigateur :
//   /api/admin/ca-city-image-generate?province=ON&city=toronto
//   ajouter &force=1 pour remplacer une photo existante.
// Ne génère que pour une ville qui a un guide (pas d'appel payant pour rien).
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isCaProvince } from "@/lib/canada/canadaData";
import { loadCaCityRow } from "@/lib/ca/caCityRow";
import { generateCaCityPhoto } from "@/lib/ca/caCityImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(province: string, citySlug: string, force: boolean) {
  const prov = String(province || "").trim().toUpperCase();
  const slug = String(citySlug || "").trim().toLowerCase();
  if (!isCaProvince(prov) || !slug) {
    return NextResponse.json({ error: "province (ex. ON) et city (ex. toronto) requis" }, { status: 400 });
  }
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY manquant dans Vercel" }, { status: 400 });
  }

  const { data: guideRow } = await sb
    .from("ca_city_guides")
    .select("guide")
    .eq("province_id", prov)
    .eq("city_ascii", slug)
    .limit(1)
    .maybeSingle();
  if (!guideRow) return NextResponse.json({ error: `Aucun guide pour ${slug} (${prov})` }, { status: 404 });

  const cityName = (guideRow.guide as any)?.cityName as string | undefined;
  const city = await loadCaCityRow(sb, prov, slug, cityName);
  if (!city) return NextResponse.json({ error: `Ville absente de ca_cities : ${slug} (${prov})` }, { status: 404 });

  if (city.image_url && !force) {
    return NextResponse.json({ ok: true, image: city.image_url, note: "Photo déjà présente. Ajouter &force=1 pour la remplacer." });
  }

  const url = await generateCaCityPhoto(sb, city);
  if (!url) return NextResponse.json({ error: "Génération échouée (voir logs [ca-city-image])" }, { status: 502 });

  try {
    revalidatePath(`/ca/${prov.toLowerCase()}/${slug}`);
  } catch {
    /* non bloquant : la page se met à jour au plus tard dans l'heure */
  }
  return NextResponse.json({ ok: true, image: url });
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  return handle(p.get("province") || "", p.get("city") || "", p.get("force") === "1");
}

export async function POST(req: NextRequest) {
  try {
    const { province, city, force } = await req.json();
    return handle(province, city, !!force);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
