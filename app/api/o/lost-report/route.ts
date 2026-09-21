// app/api/o/lost-report/route.ts — déclaration de perte PUBLIQUE, faite
// directement à un établissement depuis sa page /o/<slug>.
//
// Elle appartient à l'établissement : son bureau la voit (contact compris), et
// elle est comparée à son inventaire, maintenant et à chaque nouvel objet
// enregistré. Rien n'est publié.
import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMailDirect } from "@/lib/mailer";
import { isIsoDate } from "@/lib/orgItems";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_PER_HOUR = 40; // par établissement : un campus partage la même adresse IP
const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => null);
    // Honeypot anti-bot : champ caché qui doit rester vide
    if (clean(b?.website, 200)) return NextResponse.json({ ok: true, code: "00000" });

    const slug = clean(b?.org_slug, 80).toLowerCase();
    const title = clean(b?.title, 120);
    const description = clean(b?.description, 1500);
    const lostLocation = clean(b?.lost_location, 200);
    const lostAt = clean(b?.lost_at, 10);
    const name = clean(b?.name, 80);
    const email = clean(b?.email, 160).toLowerCase();
    const phone = clean(b?.phone, 40);

    if (!slug || title.length < 2) return NextResponse.json({ error: "Please say what you lost." }, { status: 400 });
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (!isIsoDate(lostAt) || lostAt > tomorrow) {
      return NextResponse.json({ error: "Please enter the date you lost the item." }, { status: 400 });
    }
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter your name and a valid email address." }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "unavailable" }, { status: 500 });

    const { data: org } = await sb
      .from("organizations")
      .select("id, name, slug, verified")
      .eq("slug", slug)
      .maybeSingle();
    if (!org || !org.verified) return NextResponse.json({ error: "not found" }, { status: 404 });

    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const { count: recent } = await sb
      .from("org_lost_reports")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id)
      .gte("created_at", hourAgo);
    if ((recent || 0) >= MAX_PER_HOUR) {
      return NextResponse.json({ error: "Too many reports right now. Please try again later or ask at the front desk." }, { status: 429 });
    }

    // Même personne, même objet, même jour : un double clic ne crée pas deux lignes.
    const { data: dup } = await sb
      .from("org_lost_reports")
      .select("code")
      .eq("org_id", org.id)
      .eq("email", email)
      .eq("title", title)
      .eq("lost_at", lostAt)
      .eq("status", "open")
      .maybeSingle();
    if (dup?.code) return NextResponse.json({ ok: true, code: dup.code });

    const code = `L-${randomInt(10000, 100000)}`;
    const { data: row, error } = await sb
      .from("org_lost_reports")
      .insert({
        org_id: org.id,
        code,
        title,
        description: description || null,
        lost_location: lostLocation || null,
        lost_at: lostAt,
        name,
        email,
        phone: phone || null,
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Comparaison immédiate avec l'inventaire. `await` volontaire (une promesse
    // non attendue est tuée sur Vercel) ; encapsulée, elle ne peut rien casser.
    let matched = 0;
    try {
      const { runMatchForCampusReport } = await import("@/lib/orgMatchRun");
      matched = await runMatchForCampusReport(String(row.id));
    } catch (e) {
      console.warn("runMatchForCampusReport (ignoré):", (e as Error)?.message || e);
    }

    // Accusé de réception : factuel, sans promesse de résultat.
    await sendMailDirect({
      to: email,
      subject: `Your lost item report to ${org.name} (${code})`,
      text: `Hello ${name},

Your report was received by the lost and found office of ${org.name}.

Reference: ${code}
Item: ${title}
Date lost: ${lostAt}${lostLocation ? `\nPlace: ${lostLocation}` : ""}

The office compares your report with the items it holds, including items handed in after today. If one matches, the office contacts you at this address. You do not need to file the report again.

ReportLost.org, on behalf of ${org.name}`,
      fromName: "ReportLost",
      noBcc: true,
    }).catch(() => false);

    return NextResponse.json({ ok: true, code, matched: matched > 0 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
