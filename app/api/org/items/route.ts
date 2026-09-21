// app/api/org/items/route.ts — inventaire de l'organisation (liste + création)
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { buildItemRow, reserveRefs, isIsoDate } from "@/lib/orgItems";
import { signRows, ownsRef } from "@/lib/orgPhotos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin()!;

  const status = req.nextUrl.searchParams.get("status");
  // Supabase plafonne chaque requête à 1000 lignes : on pagine, sinon un
  // inventaire repris d'un autre logiciel serait tronqué sans rien dire.
  const PAGE = 1000;
  const items: any[] = [];
  for (let from = 0; from < 5000; from += PAGE) {
    let q = sb
      .from("found_items")
      .select("id, org_ref, title, description, image_url, date, dropoff_location, storage_location, status, legal_deadline, public_visible, public_label, created_at")
      .eq("org_id", ctx.org.id)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    items.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  // Les photos sont privées : le navigateur reçoit des liens signés, valables
  // quelques heures, jamais l'emplacement réel du fichier.
  return NextResponse.json({ ok: true, items: await signRows(sb, items) });
}

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin()!;

  const b = await req.json().catch(() => null);
  const title = String(b?.title || "").trim();
  const found_at = String(b?.found_at || "").slice(0, 10);
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  if (!isIsoDate(found_at)) return NextResponse.json({ error: "Date requise" }, { status: 400 });

  // La photo doit être une référence privée de CET établissement (obtenue par
  // /api/org/photos). Une adresse quelconque, ou la photo d'un autre, est refusée.
  const photoRef = String(b?.photo_url || "").trim();
  if (photoRef && !ownsRef(photoRef, ctx.org.id)) {
    return NextResponse.json({ error: "Photo invalide : renvoyez-la." }, { status: 400 });
  }

  // Référence F-#### : compteur atomique (voir lib/orgItems.ts).
  let ref: string;
  try {
    [ref] = await reserveRefs(sb, ctx.org.id, 1);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const row = buildItemRow(ctx.org, ref, {
    title,
    found_at,
    description: b?.description,
    photo_url: photoRef || null,
    found_location: b?.found_location,
    storage_location: b?.storage_location,
    public_visible: b?.public_visible !== false,
    public_label: b?.public_label,
  });

  const { data, error } = await sb.from("found_items").insert(row).select("id, org_ref").single();

  // Rapprochement immédiat avec les pertes déclarées. Volontairement `await` :
  // sur Vercel une promesse non attendue est tuée au gel de la fonction. Le
  // moteur est déterministe et borné (400 lignes max), donc négligeable ; et
  // il est encapsulé, il ne peut pas faire échouer l'enregistrement.
  if (data?.id) {
    try {
      const { runMatchForFoundItem } = await import("@/lib/orgMatchRun");
      await runMatchForFoundItem(String(data.id));
    } catch (e) {
      console.warn("runMatchForFoundItem (ignoré):", (e as Error)?.message || e);
    }
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await sb.from("org_item_events").insert({
    org_id: ctx.org.id,
    item_id: String(data.id),
    type: "created",
    actor_email: ctx.email,
    note: `${title} · found ${found_at}`,
  });

  return NextResponse.json({ ok: true, id: data.id, org_ref: data.org_ref });
}
