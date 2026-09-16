// app/api/org/matches/route.ts
//
// GET  : les rapprochements à traiter pour l'organisation connectée.
// PATCH: la décision du bureau sur un rapprochement.
//
// Règle de fond : RIEN n'est envoyé au propriétaire tant qu'un humain n'a pas
// tranché. Le moteur propose, le bureau dispose. C'est ce qui évite les faux
// espoirs, et ce qui rend l'outil défendable devant un service de sécurité.

import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const LOST_FIELDS = "id, public_id, title, description, date, city, slug";
const FOUND_FIELDS =
  "id, org_ref, title, description, image_url, date, dropoff_location, storage_location, status, legal_deadline";

function daysLeft(deadline?: string | null): number | null {
  if (!deadline) return null;
  const t = Date.parse(deadline);
  if (!Number.isFinite(t)) return null;
  return Math.ceil((t - Date.now()) / 86_400_000);
}

/* ------------------------------------------------------------------ */
/* GET : la file d'attente                                             */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin()!;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "new";
  const limit = Math.min(100, Number(url.searchParams.get("limit") || 40));

  const { data: matches, error } = await sb
    .from("org_matches")
    .select("id, lost_item_id, found_item_id, score, level, reasons, ai_verdict, ai_reason, status, created_at")
    .eq("org_id", ctx.org.id)
    .eq("status", status)
    .order("score", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!matches?.length) return NextResponse.json({ matches: [] });

  // Deux requêtes groupées plutôt qu'une jointure : found_items et lost_items
  // n'ont pas de clé étrangère entre elles, et PostgREST ne sait pas la deviner.
  const foundIds = [...new Set(matches.map((m) => m.found_item_id))];
  const lostIds = [...new Set(matches.map((m) => m.lost_item_id))];

  const [{ data: founds }, { data: losts }] = await Promise.all([
    sb.from("found_items").select(FOUND_FIELDS).in("id", foundIds),
    sb.from("lost_items").select(LOST_FIELDS).in("id", lostIds),
  ]);

  const fById = new Map((founds || []).map((f: any) => [String(f.id), f]));
  const lById = new Map((losts || []).map((l: any) => [String(l.id), l]));

  const rows = matches
    .map((m) => {
      const f = fById.get(String(m.found_item_id));
      const l = lById.get(String(m.lost_item_id));
      if (!f || !l) return null;
      return {
        id: m.id,
        score: m.score,
        level: m.level,
        reasons: m.reasons || [],
        ai: m.ai_verdict ? { verdict: m.ai_verdict, reason: m.ai_reason } : null,
        created_at: m.created_at,
        found: {
          id: f.id,
          ref: f.org_ref,
          title: f.title,
          description: f.description,
          photo: f.image_url,
          date: f.date,
          found_at: f.dropoff_location,
          stored_at: f.storage_location,
          status: f.status,
          hold_until: f.legal_deadline,
          days_left: daysLeft(f.legal_deadline),
        },
        // Côté perte, on n'expose QUE ce qui est nécessaire à la décision.
        // Ni e-mail, ni nom, ni détail privé : le bureau n'en a pas besoin
        // pour dire « est-ce le même objet ».
        lost: {
          reference: l.public_id,
          title: l.title,
          description: l.description,
          date: l.date,
          city: l.city,
        },
      };
    })
    .filter(Boolean);

  return NextResponse.json({ matches: rows });
}

/* ------------------------------------------------------------------ */
/* PATCH : la décision                                                 */
/* ------------------------------------------------------------------ */

const ACTIONS = ["confirm", "dismiss", "ask_proof"] as const;
type Action = (typeof ACTIONS)[number];

export async function PATCH(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin()!;

  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  const action = String(body?.action || "") as Action;
  if (!id || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: "id et action requis" }, { status: 400 });
  }

  // On relit la ligne en la bornant à l'organisation : un identifiant deviné
  // ne permet pas d'agir sur le dossier d'un autre établissement.
  const { data: match } = await sb
    .from("org_matches")
    .select("id, org_id, lost_item_id, found_item_id, status")
    .eq("id", id)
    .eq("org_id", ctx.org.id)
    .maybeSingle();
  if (!match) return NextResponse.json({ error: "not found" }, { status: 404 });

  const now = new Date().toISOString();
  const patch: Record<string, any> = {
    handled_by: ctx.email,
    handled_at: now,
  };

  if (action === "dismiss") {
    patch.status = "dismissed";
  } else if (action === "confirm") {
    patch.status = "confirmed";
    patch.notified_owner_at = now;
  } else {
    // ask_proof : la question part au propriétaire, mais le rapprochement
    // reste ouvert — la décision n'est pas prise.
    patch.status = "new";
  }

  const { error } = await sb.from("org_matches").update(patch).eq("id", match.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Journal d'audit : c'est la pièce que l'établissement pourra produire.
  await sb.from("org_item_events").insert({
    org_id: ctx.org.id,
    item_id: String(match.found_item_id),
    type:
      action === "confirm" ? "match_confirmed" : action === "dismiss" ? "match_dismissed" : "proof_requested",
    note:
      action === "confirm"
        ? `Rapprochement confirmé avec la déclaration ${match.lost_item_id}`
        : action === "dismiss"
        ? `Rapprochement écarté`
        : `Question d'identification envoyée au propriétaire présumé`,
    actor_email: ctx.email,
  });

  // Un objet confirmé passe en réclamation en cours : il ne doit plus être
  // proposé pour d'autres rapprochements ni sortir à l'échéance sans regard.
  if (action === "confirm") {
    await sb.from("found_items").update({ status: "claim_pending" }).eq("id", match.found_item_id);
  }

  return NextResponse.json({ ok: true, status: patch.status });
}
