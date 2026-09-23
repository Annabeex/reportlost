// app/api/publication-mail-catchup/route.ts — filet de sécurité.
//
// L'annonce est enregistrée à l'étape 2 du formulaire, mais le mail de
// publication n'est déclenché qu'à l'écran final, par le navigateur du
// visiteur. Celui qui referme l'onglet sur l'écran des formules a donc une
// annonce en ligne et n'a jamais rien reçu : ni preuve de dépôt, ni référence,
// ni lien pour activer la recherche. Il n'y a alors plus aucun moyen de le
// récupérer.
//
// Cette route repasse derrière : tout dépôt gratuit avec un e-mail, créé il y a
// plus de DELAI_MIN minutes et de moins de MAX_AGE_H heures, qui n'a pas reçu
// son mail, le reçoit. `publication_mail_sent` garantit qu'il ne part qu'une
// fois, y compris si le visiteur revient finir son parcours entre-temps.
//
// GET ?dry=1 : liste ce qui partirait, sans envoyer.
// ⚠️ Fermée sans CRON_SECRET : une route qui envoie des mails ne reste pas
// ouverte « en attendant ».
import { NextRequest, NextResponse } from "next/server";
import { publicationMailAdmin, sendPublicationMail } from "@/lib/publicationMail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DELAI_MIN = 30;   // laisse le temps de finir le parcours normalement
const MAX_AGE_H = 72;   // au-delà, le mail n'a plus de sens
const BATCH = 40;       // borné : le reste part au passage suivant

function authorized(req: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return false;
  return (req.headers.get("authorization") || "") === `Bearer ${secret}`;
}

function getBaseUrl(req: NextRequest): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (env) return env;
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "reportlost.org";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sb = publicationMailAdmin();
  if (!sb) return NextResponse.json({ error: "supabase admin indisponible" }, { status: 500 });

  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const avant = new Date(Date.now() - DELAI_MIN * 60000).toISOString();
  const apres = new Date(Date.now() - MAX_AGE_H * 3600000).toISOString();

  const { data, error } = await sb
    .from("lost_items")
    .select("id, public_id, created_at, email, contribution")
    .or("publication_mail_sent.is.null,publication_mail_sent.eq.false")
    .lte("created_at", avant)
    .gte("created_at", apres)
    .not("email", "is", null)
    .order("created_at", { ascending: true })
    .limit(BATCH);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Les dossiers payants reçoivent le mail de la formule choisie : ce
  // rattrapage-ci ne concerne que le gratuit.
  const cibles = (data || []).filter((r) => Number(r.contribution || 0) <= 0 && r.email);

  if (dry) {
    return NextResponse.json({
      ok: true,
      dry: true,
      candidats: cibles.length,
      apercu: cibles.slice(0, 20).map((r) => ({ ref: r.public_id, created_at: r.created_at })),
    });
  }

  const base = getBaseUrl(req);
  let envoyes = 0, ignores = 0, echecs = 0;
  const erreurs: string[] = [];

  for (const r of cibles) {
    try {
      const res = await sendPublicationMail(String(r.id), base);
      if (res.ok && res.skipped) ignores++;
      else if (res.ok) envoyes++;
      else { echecs++; if (erreurs.length < 5) erreurs.push(`${r.public_id}: ${res.error}`); }
    } catch (e: any) {
      echecs++;
      if (erreurs.length < 5) erreurs.push(`${r.public_id}: ${e?.message || e}`);
    }
  }

  return NextResponse.json({ ok: true, candidats: cibles.length, envoyes, ignores, echecs, erreurs });
}
