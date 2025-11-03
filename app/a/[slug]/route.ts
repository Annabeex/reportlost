// app/a/[slug]/route.ts
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Optionnel : si la page doit toujours être dynamique (pas mise en cache)
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  // 1) Récupération du client admin (service role)
  const admin = getSupabaseAdmin();
  if (!admin) {
    // Si l’admin n’est pas configuré, on renvoie une 500 claire
    return NextResponse.json(
      { ok: false, error: "Supabase admin client is not configured." },
      { status: 500 }
    );
  }
  const sb = admin as unknown as SupabaseClient;

  // 2) Lecture de l’agence par slug
  const { data, error } = await sb
    .from("agencies")
    .select("target_url, active")
    .eq("slug", params.slug)
    .single();

  // 3) Base URL (fallback sur l’origin de la requête si NEXT_PUBLIC_SITE_URL est absent)
  const envBase = process.env.NEXT_PUBLIC_SITE_URL;
  const base =
    envBase && /^https?:\/\//i.test(envBase) ? envBase : new URL(req.url).origin;

  // 4) Si erreur / agence inactive → 302 vers not-found
  if (error || !data || data.active === false) {
    return NextResponse.redirect(new URL("/not-found", base), 302);
  }

  // 5) Construction de la cible finale + paramètres de tracking simples
  const url = new URL(data.target_url, base);
  if (!url.searchParams.has("src")) url.searchParams.set("src", "qr");
  if (!url.searchParams.has("agency")) url.searchParams.set("agency", params.slug);

  // 6) Redirection 302
  return NextResponse.redirect(url, 302);
}
