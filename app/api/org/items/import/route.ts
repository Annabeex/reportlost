// app/api/org/items/import/route.ts — reprise d'un inventaire existant.
// Le navigateur lit le CSV, fait correspondre les colonnes et envoie des
// lignes déjà normalisées, par paquets. Ici on REVALIDE tout : ce qui arrive
// reste une entrée utilisateur.
//
// POST { rows: [{ title, found_at, description?, found_location?,
//                 storage_location?, status?, ref? }], public_visible?: boolean }
// Réservé aux administrateurs : un import engage tout l'inventaire.
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { buildItemRow, reserveRefs, isIsoDate } from "@/lib/orgItems";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ROWS = 250;
const STATUSES = new Set(["stored", "claim_pending", "returned", "disposed"]);
const MATCH_WINDOW_DAYS = 45; // identique à lib/orgMatchRun.ts
const MATCH_BUDGET_MS = 20_000;

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const dupKey = (title: unknown, date: unknown, where: unknown) => `${norm(title)}|${String(date || "").slice(0, 10)}|${norm(where)}`;

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Only an administrator of this account can import items." }, { status: 403 });
  }
  const sb = getSupabaseAdmin()!;

  const b = await req.json().catch(() => null);
  const input: any[] = Array.isArray(b?.rows) ? b.rows : [];
  if (!input.length) return NextResponse.json({ error: "Aucune ligne" }, { status: 400 });
  if (input.length > MAX_ROWS) return NextResponse.json({ error: `${MAX_ROWS} lignes max par envoi` }, { status: 400 });
  const publicVisible = b?.public_visible !== false;

  // Ce qui existe déjà : relancer le même fichier ne doit rien doubler.
  const existingRefs = new Set<string>();
  const existingKeys = new Set<string>();
  for (let from = 0; from < 50000; from += 1000) {
    const { data, error } = await sb
      .from("found_items")
      .select("org_ref, title, date, dropoff_location")
      .eq("org_id", ctx.org.id)
      .range(from, from + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    for (const it of data || []) {
      if (it.org_ref) existingRefs.add(norm(it.org_ref));
      existingKeys.add(dupKey(it.title, it.date, it.dropoff_location));
    }
    if (!data || data.length < 1000) break;
  }

  const today = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const errors: { index: number; reason: string }[] = [];
  const accepted: { index: number; r: any; ref: string; status: string }[] = [];
  let duplicates = 0;

  input.forEach((r, i) => {
    const index = Number.isInteger(r?.index) ? r.index : i;
    const title = String(r?.title || "").trim();
    const found_at = String(r?.found_at || "").slice(0, 10);
    if (title.length < 2) return void errors.push({ index, reason: "missing item name" });
    if (!isIsoDate(found_at) || found_at > today) return void errors.push({ index, reason: "unreadable or future date" });

    const ref = String(r?.ref || "").trim().slice(0, 40);
    const key = dupKey(title, found_at, r?.found_location);
    if ((ref && existingRefs.has(norm(ref))) || (!ref && existingKeys.has(key))) { duplicates++; return; }
    if (ref) existingRefs.add(norm(ref));
    existingKeys.add(key);

    const status = STATUSES.has(String(r?.status)) ? String(r.status) : "stored";
    accepted.push({ index, r: { ...r, title, found_at }, ref, status });
  });

  if (!accepted.length) return NextResponse.json({ ok: true, imported: 0, duplicates, errors });

  // Une référence d'origine est conservée : c'est elle qui est écrite sur
  // l'étiquette de l'objet. Les autres lignes reçoivent un F-#### neuf.
  const needRef = accepted.filter((a) => !a.ref).length;
  let fresh: string[] = [];
  try {
    if (needRef) fresh = await reserveRefs(sb, ctx.org.id, needRef);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const nowIso = new Date().toISOString();
  let k = 0;
  const rows = accepted.map((a) => {
    const row: Record<string, any> = buildItemRow(ctx.org!, a.ref || fresh[k++], {
      title: a.r.title,
      found_at: a.r.found_at,
      description: a.r.description,
      found_location: a.r.found_location,
      storage_location: a.r.storage_location,
      public_visible: publicVisible,
    });
    row.status = a.status;
    // Insertion groupée : toutes les lignes doivent porter les mêmes clés.
    row.disposed_at = null;
    row.returned_at = null;
    row.disposition = null;
    if (a.status === "returned" || a.status === "disposed") {
      // Objet déjà parti dans l'ancien logiciel : jamais listé publiquement.
      // L'horloge de suppression de la fiche part de l'import, pas d'une date
      // de sortie qu'on ne connaît pas.
      row.public_visible = false;
      row.disposed_at = nowIso;
      if (a.status === "returned") { row.returned_at = nowIso; row.disposition = "returned_owner"; }
    }
    return row;
  });

  const { data: inserted, error } = await sb.from("found_items").insert(rows).select("id, title, date, status");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await sb.from("org_item_events").insert(
    (inserted || []).map((it: any) => ({
      org_id: ctx.org!.id,
      item_id: String(it.id),
      type: "created",
      actor_email: ctx.email,
      note: `${it.title} · found ${it.date} · imported from a previous system`,
    }))
  );

  // Rapprochement avec les pertes déclarées : seulement pour ce qui est encore
  // au bureau et assez récent pour que le moteur le regarde, dans un temps borné.
  const since = new Date(Date.now() - MATCH_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
  const started = Date.now();
  let matched = 0;
  try {
    const { runMatchForFoundItem } = await import("@/lib/orgMatchRun");
    for (const it of inserted || []) {
      if (Date.now() - started > MATCH_BUDGET_MS) break;
      if (it.status !== "stored" || String(it.date) < since) continue;
      matched += await runMatchForFoundItem(String(it.id));
    }
  } catch (e) {
    console.warn("import: rapprochement ignoré:", (e as Error)?.message || e);
  }

  return NextResponse.json({ ok: true, imported: inserted?.length || 0, duplicates, errors, matched });
}
