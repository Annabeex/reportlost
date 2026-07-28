// app/api/org/items/route.ts — inventaire de l'organisation (liste + création)
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { legalDeadline } from "@/lib/legalHolding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin()!;

  const status = req.nextUrl.searchParams.get("status");
  let q = sb
    .from("found_items")
    .select("id, org_ref, title, description, image_url, date, dropoff_location, storage_location, status, legal_deadline, public_visible, public_label, created_at")
    .eq("org_id", ctx.org.id)
    .order("created_at", { ascending: false })
    .limit(500);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, items: data || [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin()!;

  const b = await req.json().catch(() => null);
  const title = String(b?.title || "").trim();
  const found_at = String(b?.found_at || "").slice(0, 10);
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(found_at)) return NextResponse.json({ error: "Date requise" }, { status: 400 });

  // Référence F-#### par organisation
  const { count } = await sb
    .from("found_items")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ctx.org.id);
  const org_ref = `F-${String((count || 0) + 1).padStart(4, "0")}`;

  const row = {
    org_id: ctx.org.id,
    org_ref,
    title: title.slice(0, 120),
    description: String(b?.description || "").trim().slice(0, 2000) || null,
    image_url: String(b?.photo_url || "").trim() || null,
    date: found_at,
    city: ctx.org.city,
    dropoff_location: String(b?.found_location || "").trim().slice(0, 200) || null,
    storage_location: String(b?.storage_location || "").trim().slice(0, 120) || null,
    status: "stored",
    legal_deadline: legalDeadline(found_at, ctx.org.state_id),
    // Visibilité publique : libellé générique uniquement (jamais la description)
    public_visible: b?.public_visible !== false,
    public_label: String(b?.public_label || "").trim().slice(0, 60) || title.split(/\s+/).slice(0, 2).join(" "),
    // Colonnes héritées des dépôts publics (analyse d'image) : NOT NULL en base
    labels: [] as string[],
    logos: [] as string[],
    objects: [] as string[],
    ocr_text: "",
  };

  const { data, error } = await sb.from("found_items").insert(row).select("id, org_ref").single();
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
