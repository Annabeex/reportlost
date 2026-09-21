// app/api/org/poster/route.ts — kit d'affichage d'un établissement, en un seul
// PDF : affiche pleine page, puis demi-affiche + cartes à découper. Chaque
// support porte les DEUX QR codes (« Lost something? » et « Found something? »).
// Le dessin est dans lib/orgPosterPdf.ts.
//
// GET ?slug=...            Letter (format américain, par défaut)
// GET ?slug=...&paper=a4   A4
// Public : aucune donnée sensible, l'établissement doit pouvoir l'imprimer et
// le partager librement.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { buildPosterPdf } from "@/lib/orgPosterPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const slug = String(url.searchParams.get("slug") || "").trim().toLowerCase();
    if (!slug) return NextResponse.json({ ok: false, error: "Paramètre manquant: slug" }, { status: 400 });
    const paper = url.searchParams.get("paper") === "a4" ? "a4" : "letter";

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: false, error: "Supabase non configuré" }, { status: 500 });

    const { data: org } = await sb
      .from("organizations")
      .select("slug, name, city, state_id, verified, public_listing")
      .eq("slug", slug)
      .maybeSingle();
    if (!org) return NextResponse.json({ ok: false, error: "Organisation introuvable" }, { status: 404 });

    const base =
      (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "") ||
      `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host") || req.headers.get("host")}`;

    const bytes = await buildPosterPdf(
      {
        slug: org.slug,
        name: org.name,
        city: org.city,
        state_id: org.state_id,
        // L'adresse de la page publique n'est imprimée que si elle s'ouvre.
        publicPage: !!org.verified && !!org.public_listing,
      },
      base,
      paper
    );

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="reportlost-display-kit-${org.slug}.pdf"`,
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
