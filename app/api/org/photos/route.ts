// app/api/org/photos/route.ts — envoi d'une photo d'inventaire.
// POST multipart { photo } → { ref, url }
//   ref : à renvoyer tel quel à la création de la fiche (photo_url)
//   url : lien signé de courte durée, pour l'aperçu à l'écran
// Le fichier va dans le bucket privé, sous le dossier de l'établissement du
// membre connecté. Voir lib/orgPhotos.ts.
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadOrgPhoto, signOne } from "@/lib/orgPhotos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin()!;

  const form = await req.formData().catch(() => null);
  const photo = form?.get("photo");
  if (!photo || typeof photo === "string") return NextResponse.json({ error: "Photo manquante" }, { status: 400 });

  const up = await uploadOrgPhoto(sb, ctx.org.id, photo);
  if ("error" in up) return NextResponse.json({ error: up.error }, { status: 400 });

  const url = await signOne(sb, up.ref, 3600);
  return NextResponse.json({ ok: true, ref: up.ref, url });
}
