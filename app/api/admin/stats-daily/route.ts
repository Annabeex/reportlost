// app/api/admin/stats-daily/route.ts
// Dépôts et paiements par jour, pour le petit graphique de l'admin.
// Protégé par le Basic Auth du middleware, comme le reste de /api/admin.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Les journées sont découpées sur l'heure de Paris : c'est la journée de
// travail d'Anna, pas celle du serveur.
const TZ = "Europe/Paris";
const jour = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(iso)); // -> "2026-09-29"

export async function GET(req: NextRequest) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "supabase admin indisponible" }, { status: 500 });

  const jours = Math.min(120, Math.max(7, Number(new URL(req.url).searchParams.get("days") || 30)));
  const depuis = new Date(Date.now() - (jours - 1) * 86400000);
  depuis.setUTCHours(0, 0, 0, 0);

  const lignes: { created_at: string; contribution: number | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("lost_items")
      .select("created_at, contribution")
      .gte("created_at", depuis.toISOString())
      .order("created_at", { ascending: true })
      .range(from, from + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) break;
    lignes.push(...(data as any));
    if (data.length < 1000) break;
  }

  // Une entrée par jour, y compris les jours vides : un trou dans un graphique
  // se lit comme une absence de donnée, pas comme un zéro.
  const par = new Map<string, { total: number; payes: number; recette: number }>();
  for (let i = 0; i < jours; i++) {
    const d = new Date(Date.now() - (jours - 1 - i) * 86400000);
    par.set(jour(d.toISOString()), { total: 0, payes: 0, recette: 0 });
  }
  for (const l of lignes) {
    if (!l.created_at) continue;
    const k = jour(l.created_at);
    const e = par.get(k);
    if (!e) continue;
    e.total++;
    const c = Number(l.contribution || 0);
    if (c > 0) { e.payes++; e.recette += c; }
  }

  const serie = [...par.entries()].map(([day, v]) => ({ day, ...v }));
  const total = serie.reduce((s, d) => s + d.total, 0);
  const payes = serie.reduce((s, d) => s + d.payes, 0);
  const recette = serie.reduce((s, d) => s + d.recette, 0);

  return NextResponse.json({ jours, serie, total, payes, recette });
}
