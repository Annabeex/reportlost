// app/api/org/demo/route.ts
//
// Lecture SEULE de l'organisation de démonstration, sans authentification.
// C'est ce qui permet d'envoyer /org/demo dans un mail de prospection : le
// destinataire voit le vrai tableau de bord, avec de vraies données factices,
// sans compte et sans mot de passe partagé.
//
// Trois règles, et elles tiennent toute la sécurité de cette route :
//   1. Le slug est ÉCRIT EN DUR. Aucun paramètre ne choisit l'établissement :
//      sinon cette route deviendrait une lecture publique de n'importe quel
//      inventaire, commissariats compris.
//   2. GET uniquement. Aucune écriture n'existe ici (le portail en mode démo
//      n'envoie rien : voir lib/portalDemo.ts).
//   3. Rien de nominatif ne peut s'y trouver, puisque l'org de démo ne reçoit
//      que les lignes posées par demo-police.sql.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { toCsv } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Le seul établissement que cette route peut lire. Non exporté :
 *  Next.js refuse tout export non prévu dans un fichier route.ts. */
const DEMO_SLUG = "demo-police";

const ITEM_COLS =
  "id, org_ref, title, description, image_url, date, dropoff_location, storage_location, status, legal_deadline, public_visible, public_label, created_at";

const STATUS_LABEL: Record<string, string> = {
  stored: "In storage",
  claim_pending: "Claim pending",
  returned: "Returned",
  disposed: "Disposed",
};

const nope = () => NextResponse.json({ error: "unknown part" }, { status: 404 });

export async function GET(req: NextRequest) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const { data: org } = await sb
    .from("organizations")
    .select("*")
    .eq("slug", DEMO_SLUG)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "demo not set up" }, { status: 404 });

  const part = req.nextUrl.searchParams.get("part") || "me";

  if (part === "me") {
    return NextResponse.json({
      ok: true,
      email: "demo@reportlost.org",
      org,
      orgs: [org],
      allOrgs: [org],
      scope: "agency",
      role: "admin",
      demo: true,
    });
  }

  if (part === "items") {
    const { data } = await sb
      .from("found_items")
      .select(ITEM_COLS)
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(500);
    return NextResponse.json({ ok: true, items: data || [] });
  }

  if (part === "intakes") {
    const { data } = await sb
      .from("org_intakes")
      .select("id, code, title, description, found_location, found_at, photo_url, finder_name, finder_email, held_by, public_visible, public_label, created_at")
      .eq("org_id", org.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100);
    return NextResponse.json({ ok: true, intakes: data || [] });
  }

  if (part === "lost-reports") {
    const { data } = await sb
      .from("org_lost_reports")
      .select("id, code, title, description, lost_location, lost_at, name, email, phone, created_at, seen_at")
      .eq("org_id", org.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(100);
    return NextResponse.json({ ok: true, reports: data || [] });
  }

  if (part === "matches") {
    return NextResponse.json({ ok: true, matches: [] });
  }

  // Journal d'un objet. L'identifiant est vérifié contre l'org de démo : on ne
  // lit pas le journal d'une fiche qui appartient à quelqu'un d'autre.
  if (part === "item") {
    const id = String(req.nextUrl.searchParams.get("id") || "");
    if (!id) return nope();
    const { data: item } = await sb
      .from("found_items")
      .select("id, org_id")
      .eq("id", id)
      .maybeSingle();
    if (!item || item.org_id !== org.id) return NextResponse.json({ error: "introuvable" }, { status: 404 });
    const { data: events } = await sb
      .from("org_item_events")
      .select("id, type, note, actor_email, created_at")
      .eq("org_id", org.id)
      .eq("item_id", id)
      .order("created_at", { ascending: false })
      .limit(100);
    return NextResponse.json({ ok: true, events: events || [] });
  }

  if (part === "export") {
    const status = req.nextUrl.searchParams.get("status") || "";
    let q = sb
      .from("found_items")
      .select("org_ref, title, description, date, dropoff_location, storage_location, status, legal_deadline, public_label, public_visible, created_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: true })
      .limit(1000);
    if (STATUS_LABEL[status]) q = q.eq("status", status);
    const { data } = await q;
    const day = (v?: string | null) => (v ? String(v).slice(0, 10) : "");
    const rows: (string | number | null)[][] = [[
      "Reference", "Item", "Description", "Date found", "Found location",
      "Storage location", "Status", "Hold until", "Public label", "Listed publicly", "Logged on",
    ]];
    for (const it of data || []) {
      rows.push([
        it.org_ref, it.title, it.description, day(it.date), it.dropoff_location,
        it.storage_location, STATUS_LABEL[it.status] || it.status, day(it.legal_deadline),
        it.public_label, it.public_visible === false ? "no" : "yes", day(it.created_at),
      ]);
    }
    return new NextResponse(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lost-and-found-demo-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return nope();
}
