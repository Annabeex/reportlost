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
const MAX_LIEU = 72;

// Reglages de mise en page du poster, stockes dans lost_items.poster_opts.
// Les valeurs par defaut reproduisent exactement le rendu historique : un
// dossier jamais regle ne change pas d'aspect.
type Reglages = { where: string; fit: "cover" | "contain"; zoom: number; x: number; y: number };
const REGLAGES_DEFAUT: Reglages = { where: "", fit: "cover", zoom: 1, x: 50, y: 50 };

function borne(v: unknown, min: number, max: number, defaut: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return defaut;
  return Math.min(max, Math.max(min, Math.round(n * 100) / 100));
}

function normaliser(brut: any): Reglages {
  const o = brut && typeof brut === "object" ? brut : {};
  return {
    where: String(o.where ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_LIEU),
    fit: o.fit === "contain" ? "contain" : "cover",
    zoom: borne(o.zoom, 1, 3, REGLAGES_DEFAUT.zoom),
    x: borne(o.x, 0, 100, REGLAGES_DEFAUT.x),
    y: borne(o.y, 0, 100, REGLAGES_DEFAUT.y),
  };
}

// Un reglage identique au defaut n'est pas stocke : la colonne reste nulle et
// le poster reprend son comportement automatique.
function estDefaut(r: Reglages): boolean {
  return !r.where && r.fit === "cover" && r.zoom === 1 && r.x === 50 && r.y === 50;
}

function colonnePour(id: string) {
  return /^\d{5}$/.test(id) ? "public_id" : "id";
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "supabase admin indisponible" }, { status: 500 });

  const { data, error } = await sb
    .from("lost_items")
    .select("poster_title, poster_opts, title, primary_category")
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
    maxLieu: MAX_LIEU,
    opts: normaliser(data.poster_opts),
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "supabase admin indisponible" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const brut = typeof body?.posterTitle === "string" ? body.posterTitle : "";
  const titre = brut.replace(/\s+/g, " ").trim().slice(0, MAX_TITRE);
  const reglages = normaliser(body?.opts);

  // Vider un champ rend la main au comportement automatique.
  const { error } = await sb
    .from("lost_items")
    .update({
      poster_title: titre || null,
      poster_opts: estDefaut(reglages) ? null : reglages,
    })
    .eq(colonnePour(params.id), params.id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, posterTitle: titre, opts: reglages });
}
