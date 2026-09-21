// app/api/org/items/export/route.ts — export CSV de l'inventaire.
// GET ?status=stored|claim_pending|returned|disposed (facultatif : tout sinon)
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { toCsv } from "@/lib/csv";
import { dispositionLabel } from "@/lib/orgDisposition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  stored: "In storage",
  claim_pending: "Claim pending",
  returned: "Returned",
  disposed: "Disposed",
};
const PAGE = 1000; // plafond de lignes par requête côté Supabase
const MAX = 50000;

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin()!;

  const status = req.nextUrl.searchParams.get("status") || "";
  const items: any[] = [];
  for (let from = 0; from < MAX; from += PAGE) {
    let q = sb
      .from("found_items")
      .select("org_ref, title, description, date, dropoff_location, storage_location, status, legal_deadline, disposed_at, returned_at, disposition, disposed_to, public_label, public_visible, created_at")
      .eq("org_id", ctx.org.id)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (STATUS_LABEL[status]) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    items.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }

  const day = (v?: string | null) => (v ? String(v).slice(0, 10) : "");
  const rows: (string | number | null)[][] = [[
    "Reference", "Item", "Description", "Date found", "Found location", "Storage location",
    "Status", "Hold until", "Left on", "Outcome", "Handed to", "Public label", "Listed publicly", "Logged on",
  ]];
  for (const it of items) {
    rows.push([
      it.org_ref, it.title, it.description, day(it.date), it.dropoff_location, it.storage_location,
      STATUS_LABEL[it.status] || it.status, day(it.legal_deadline), day(it.disposed_at || it.returned_at),
      it.disposition ? dispositionLabel(it.disposition) : "", it.disposed_to, it.public_label,
      it.public_visible === false ? "no" : "yes", day(it.created_at),
    ]);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lost-and-found-${ctx.org.slug}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
