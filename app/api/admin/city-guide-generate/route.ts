// app/api/admin/city-guide-generate/route.ts
// Génère un brouillon de guide ville (objet CityGuide) : recherches Google réelles
// via Serper, puis rédaction Claude STRICTEMENT limitée aux liens trouvés.
// Le brouillon est enregistré dans city_guides (status: draft) — rien n'est publié
// sans validation manuelle dans /admin/city-guides.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getNearbyCities } from "@/lib/getNearbyCities";
import { buildCityPath } from "@/lib/slugify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MODEL =
  process.env.CITY_GUIDE_MODEL || process.env.CASE_CHAT_MODEL || process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

async function serper(q: string, num = 6): Promise<{ title: string; link: string; snippet: string }[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) throw new Error("SERPER_API_KEY manquant");
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q, gl: "us", hl: "en", num }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data?.organic) ? data.organic : [])
    .filter((o: any) => o?.link && o?.title)
    .map((o: any) => ({ title: String(o.title), link: String(o.link), snippet: String(o.snippet || "") }));
}

async function callClaude(system: string, user: string, maxTokens = 6000): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY manquant");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  const data = await res.json();
  return String(data?.content?.[0]?.text ?? "");
}

const GUIDE_SCHEMA = `type CityGuide = {
  state: string; citySlug: string; badge: string; h1: string;
  heroSubtitle: string; // HTML (<strong> autorisé)
  imageAltFallback: string;
  stepsHeading: string;
  steps: { icon: string; iconBg: string; title: string; body: string }[]; // 3 étapes, body HTML
  intro: string[]; // 2 paragraphes HTML
  guideHeading: string; guideSubtitle: string;
  cards: { icon: string; iconBg: string; title: string; body: string; links?: { label: string; href: string }[] }[];
  midCtaHeading: string; midCtaBody: string;
  areasHeading: string; areasSubtitle: string;
  areas: { name: string; blurb: string }[];
  socialHeading: string; socialSubtitle: string;
  social: [string, string][];
  faqHeading: string;
  faq: { q: string; a: string }[];
  nearby: { label: string; href: string }[]; // laisser [] — rempli automatiquement
  finalCtaHeading: string; finalCtaBody: string; ctaLabel: string; finalCtaLabel: string;
  disclaimer: string;
}`;

export async function POST(req: NextRequest) {
  try {
    const { city, state } = await req.json();
    if (!city || !state) return NextResponse.json({ error: "city et state requis" }, { status: 400 });

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const stateAbbr = String(state).toUpperCase();
    const { data: cityRow } = await sb
      .from("us_cities")
      .select("id, city_ascii, state_id, state_name")
      .eq("state_id", stateAbbr)
      .ilike("city_ascii", String(city).trim())
      .maybeSingle();
    if (!cityRow) return NextResponse.json({ error: `Ville introuvable : ${city}, ${stateAbbr}` }, { status: 404 });

    const cityName = cityRow.city_ascii;
    const stateName = cityRow.state_name || stateAbbr;

    // 1) Recherches réelles
    const queries = [
      `${cityName} ${stateAbbr} police department lost and found contact`,
      `${cityName} ${stateAbbr} city hall contact`,
      `${cityName} ${stateAbbr} public transit bus lost and found`,
      `${cityName} ${stateAbbr} airport lost and found`,
      `${cityName} ${stateAbbr} animal shelter lost pet`,
      `${cityName} ${stateAbbr} lost and found facebook group OR reddit`,
    ];
    const sets = await Promise.all(queries.map((q) => serper(q).catch(() => [])));
    const results = queries
      .map((q, i) => `### ${q}\n${sets[i].map((r) => `- ${r.title}\n  ${r.link}\n  ${r.snippet}`).join("\n") || "(aucun résultat)"}`)
      .join("\n\n");

    // 2) Rédaction stricte
    const raw = await callClaude(
      `Tu rédiges la page "lost & found" d'une ville américaine pour ReportLost.org, au format JSON CityGuide.
Tu es un EXPERT EN CONVERSION, pas un blogueur : cette page vend le service d'accompagnement de ReportLost
(un signalement, et l'équipe contacte les bons services locaux, publie une alerte sociale et surveille le web
pendant 6 à 12 mois). Chaque section doit ramener vers le formulaire de signalement.

Angle de rédaction (calqué sur les pages New York / LA / Chicago de ReportLost) :
- h1 : orienté action et bénéfice, ex "Lost something in <ville>? Report it and get it back."
- heroSubtitle : la promesse du service, "One report and we route it to the right <police locale>, the relevant lost & found offices, and active local social channels."
- steps : les 3 étapes DU SERVICE (1. You report the loss, 2. We route it to the right places, 3. You get matched & notified), adaptées à la ville.
- intro : 2 paragraphes qui posent le problème local (lieux où l'on perd, systèmes séparés) et présentent ReportLost comme le raccourci qui simplifie tout, sur un ton rassurant.
- cards : les vrais canaux locaux AVEC leurs liens officiels (l'utilisateur peut faire seul), mais chaque carte glisse quand c'est pertinent une phrase sur ce que ReportLost fait à sa place ("We tell you which precinct covers your loss location", "We generate the exact info to include", "We point you to the right desk").
- midCta / finalCta : le timing est un argument mais JAMAIS anxiogène ni commercial agressif. Pas de "Don't wait!", "The clock is ticking", "before it's too late". Formule positive et rassurante : agir tôt améliore les chances, et une fois le signalement déposé, l'utilisateur peut souffler, l'équipe prend le relais ("The sooner your report is in the system, the better the odds, and once it is, we take it from there", "One report. Every relevant channel in <ville>. You can breathe.").
- ctaLabel / finalCtaLabel : "Report my lost item →" / "Start my report →".

Règles STRICTES de véracité :
- N'utilise QUE les URLs présentes dans les résultats de recherche fournis. N'invente JAMAIS d'URL, d'email, de téléphone ou d'adresse. Pas de résultat pertinent pour une carte, alors pas de "links" sur cette carte (le texte reste utile).
- N'inclus une carte "aéroport" ou "transit" QUE si la ville en a réellement un d'après les résultats. Une petite ville a typiquement : police, city hall, commerces/lieux publics, animaux perdus, 4 cartes suffisent alors.
- "areas" : 3-5 vrais quartiers/zones de la ville si tu les connais avec certitude, sinon des zones génériques honnêtes (downtown, main street, parcs). Pas de href.
- "social" : cite les groupes/subreddits UNIQUEMENT s'ils apparaissent dans les résultats, sinon des catégories génériques ("Facebook groups", "Nextdoor").
- FAQ : 4-6 questions locales concrètes, réponses factuelles basées sur les résultats (délais de garde, où réclamer). En cas de doute, formule prudente ("check with..."). Termine par une question sur ReportLost ("Is ReportLost.org official / does it replace the police?" avec la réponse honnête : service indépendant).

Règles de STYLE :
- Anglais américain naturel, chaleureux et concret.
- JAMAIS de tiret cadratin ni de tiret de ponctuation ("—" ou " - "), utilise des virgules à la place.
- N'utilise JAMAIS le mot "guide" dans les textes visibles, préfère "what to do", "where to report", "the right channel".
- Icônes emoji + iconBg parmi : bg-blue-100, bg-yellow-100, bg-indigo-100, bg-sky-100, bg-green-100, bg-rose-100.
- state="${stateAbbr}", citySlug="${cityName.toLowerCase()}", nearby=[].
- disclaimer : indépendance de ReportLost vis-à-vis des entités citées.
Réponds UNIQUEMENT avec le JSON (pas de markdown).

Schéma :
${GUIDE_SCHEMA}`,
      `Ville : ${cityName}, ${stateName} (${stateAbbr})

Résultats de recherche Google :

${results}`,
      6000
    );

    let guide: any;
    try {
      guide = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      return NextResponse.json({ error: "JSON invalide renvoyé par le modèle — relance la génération", raw: raw.slice(0, 800) }, { status: 502 });
    }

    // 3) Villes voisines réelles (liens internes) injectées programmatiquement
    try {
      const nearby = await getNearbyCities(cityRow.id, stateAbbr);
      guide.nearby = (nearby || []).slice(0, 8).map((n: any) => ({
        label: `${n.city_ascii}${n.state_id ? ", " + String(n.state_id).toUpperCase() : ""}`,
        href: buildCityPath(n.state_id || stateAbbr, n.city_ascii),
      }));
    } catch {
      guide.nearby = guide.nearby || [];
    }
    guide.state = stateAbbr;
    guide.citySlug = cityName.toLowerCase();
    // Filets de sécurité : tableaux toujours présents (le rendu ne doit jamais casser)
    for (const k of ["steps", "intro", "cards", "areas", "social", "faq", "nearby"]) {
      if (!Array.isArray(guide[k])) guide[k] = [];
    }

    // 4) Sauvegarde en brouillon
    const { error: upErr } = await sb.from("city_guides").upsert(
      {
        state_id: stateAbbr,
        city_slug: cityName.toLowerCase(),
        guide,
        status: "draft",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "state_id,city_slug" }
    );
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, guide, queries });
  } catch (e: any) {
    console.error("[city-guide-generate] fatal:", e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
