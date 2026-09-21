// app/api/org-maintenance/route.ts — ménage quotidien du portail établissements.
// Déclenché par Vercel Cron (vercel.json). Ce que le portail promet sur la durée
// de conservation n'est vrai que si quelque chose l'applique : jusqu'ici
// scripts/org-maintenance.mjs devait être lancé à la main, donc ne l'était pas.
//
// Tout part du DÉPART RÉEL de l'objet (disposed_at), jamais de l'échéance légale.
//   photo d'un objet parti ............ supprimée après 30 jours
//   fiche d'un objet parti ............ supprimée après 365 jours
//   dépôt QR non confirmé par l'accueil, qu'il ait été annoncé « je le dépose »
//   ou « je le garde » ................ supprimé après 180 jours (photo, contact)
//   contact du trouveur, dépôt confirmé  effacé après 90 jours
//   déclaration de perte .............. supprimée 365 jours après sa création
//   invitation expirée ................ supprimée après 30 jours
//
// GET ?dry=1 : compte sans rien supprimer.
// ⚠️ Fermé par défaut : sans CRON_SECRET défini, la route refuse tout. Une route
// qui supprime des données ne doit jamais être « ouverte en attendant ».
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { removePhoto } from "@/lib/orgPhotos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const iso = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const BATCH = 300; // borné : le reste part au passage suivant

function authorized(req: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return false;
  return (req.headers.get("authorization") || "") === `Bearer ${secret}`; // envoyé par Vercel Cron
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "supabase admin indisponible" }, { status: 500 });
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const done: Record<string, number> = {};

  // 1. Photos des objets partis
  {
    const { data } = await sb
      .from("found_items")
      .select("id, image_url")
      .not("org_id", "is", null)
      .lt("disposed_at", iso(30))
      .not("image_url", "is", null)
      .limit(BATCH);
    done.photos = data?.length || 0;
    if (!dry) for (const it of data || []) {
      await removePhoto(sb, it.image_url);
      // Vidée même si le fichier avait déjà disparu : aucune fiche ne doit
      // pointer vers une photo qui n'existe plus.
      await sb.from("found_items").update({ image_url: null, photo_purged_at: new Date().toISOString() }).eq("id", it.id);
    }
  }

  // 2. Fiches des objets partis depuis un an
  {
    const { data } = await sb
      .from("found_items")
      .select("id, image_url")
      .not("org_id", "is", null) // jamais les dépôts du site public
      .lt("disposed_at", iso(365))
      .limit(BATCH);
    done.records = data?.length || 0;
    if (!dry) for (const it of data || []) {
      await removePhoto(sb, it.image_url);
      await sb.from("org_matches").delete().eq("found_item_id", String(it.id));
      await sb.from("org_item_events").delete().eq("item_id", String(it.id));
      await sb.from("found_items").delete().eq("id", it.id);
    }
  }

  // 3. Dépôts par QR code jamais confirmés par l'accueil : 6 mois dans les deux cas
  for (const [key, heldBy, days] of [["intakes_desk", "desk", 180], ["intakes_finder", "finder", 180]] as const) {
    const { data } = await sb
      .from("org_intakes")
      .select("id, photo_url")
      .eq("status", "pending")
      .eq("held_by", heldBy)
      .lt("created_at", iso(days))
      .limit(BATCH);
    done[key] = data?.length || 0;
    if (!dry) for (const it of data || []) {
      await removePhoto(sb, it.photo_url);
      await sb.from("org_intakes").delete().eq("id", it.id);
    }
  }

  // 4. Contact du trouveur, une fois le dépôt confirmé depuis 90 jours
  {
    const q = sb.from("org_intakes").select("id", { count: "exact", head: true })
      .eq("status", "confirmed").lt("resolved_at", iso(90)).not("finder_email", "is", null);
    done.finder_contacts = (await q).count || 0;
    if (!dry) await sb.from("org_intakes").update({ finder_name: null, finder_email: null })
      .eq("status", "confirmed").lt("resolved_at", iso(90));
  }

  // 5. Déclarations de perte de plus d'un an (et leurs rapprochements)
  {
    const { data } = await sb.from("org_lost_reports").select("id").lt("created_at", iso(365)).limit(BATCH);
    done.lost_reports = data?.length || 0;
    if (!dry) for (const r of data || []) {
      await sb.from("org_matches").delete().eq("lost_item_id", `campus:${r.id}`);
      await sb.from("org_lost_reports").delete().eq("id", r.id);
    }
  }

  // 6. Invitations expirées
  {
    const q = sb.from("org_invites").select("id", { count: "exact", head: true }).lt("expires_at", iso(30));
    done.invites = (await q).count || 0;
    if (!dry) await sb.from("org_invites").delete().lt("expires_at", iso(30));
  }

  return NextResponse.json({ ok: true, dry, done });
}
