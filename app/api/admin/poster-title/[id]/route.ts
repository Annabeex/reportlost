// app/api/admin/poster-title/[id]/route.ts
// Titre affiché sur le poster WANTED, choisi à la main depuis l'admin.
//
// Sans ce réglage, le titre venait uniquement du modèle, qui résume en 1-2 mots
// et coupait des intitulés dont le dernier mot porte le sens
// (« Car and Motorcycle Keys » → « Car & Motorcycle … », sans l'objet).
//
// L'identifiant accepté est le public_id à 5 chiffres ou l'UUID interne, comme
// pour /api/poster/[id] : l'éditeur de compte rendu insère l'UUID.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TITRE = 32;

function colonnePour(id: string) {
  return /^\d{5}$/.test(id) ? "public_id" : "id";
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "supabase admin indisponible" }, { status: 500 });

  const { data, error } = await sb
    .from("lost_items")
    .select("poster_title, title, primary_category")
    .eq(colonnePour(params.id), params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "dossier introuvable" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    posterTitle: data.poster_title || "",
    // Repères affichés sous le champ, pour écrire le titre sans rouvrir le dossier.
    reportTitle: data.title || "",
    category: data.primary_category || "",
    max: MAX_TITRE,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "supabase admin indisponible" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const brut = typeof body?.posterTitle === "string" ? body.posterTitle : "";
  const titre = brut.replace(/\s+/g, " ").trim().slice(0, MAX_TITRE);

  // Vider le champ rend la main au titre déduit par le modèle.
  const { error } = await sb
    .from("lost_items")
    .update({ poster_title: titre || null })
    .eq(colonnePour(params.id), params.id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, posterTitle: titre });
}
