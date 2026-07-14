// app/api/admin/city-guide-generate/route.ts
// Génère un brouillon de guide ville (objet CityGuide) : recherches Google réelles
// via Serper, puis rédaction Claude STRICTEMENT limitée aux liens trouvés.
// Le brouillon est enregistré dans city_guides (status: draft) — rien n'est publié
// sans validation manuelle dans /admin/city-guides.
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getNearbyCities } from "@/lib/getNearbyCities";
import { buildCityPath } from "@/lib/slugify";
import { generateCityPhoto } from "@/lib/cityImage";

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
    const { city, state, autoPublish } = await req.json();
    if (!city || !state) return NextResponse.json({ error: "city et state requis" }, { status: 400 });

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const stateAbbr = String(state).toUpperCase();
    let { data: cityRow } = await sb
      .from("us_cities")
      .select("id, city_ascii, state_id, state_name, image_url")
      .eq("state_id", stateAbbr)
      .ilike("city_ascii", String(city).trim())
      .maybeSingle();
    // Rattrapage : noms avec espace final ou suffixe recensement ("Milford city ")
    if (!cityRow) {
      const { data: fuzzyRows } = await sb
        .from("us_cities")
        .select("id, city_ascii, state_id, state_name, image_url")
        .eq("state_id", stateAbbr)
        .ilike("city_ascii", `${String(city).trim()}%`)
        .order("population", { ascending: false })
        .limit(1);
      cityRow = fuzzyRows?.[0] || null;
    }
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

⚠️ PRINCIPE DIRECTEUR : des pages "similaires mais différentes". Garde exactement ce plan de page (le modèle New York ci-dessous), mais REFORMULE chaque phrase : synonymes, constructions retournées, jamais une phrase réutilisable sur une autre ville en changeant juste le nom. Et ajuste le contenu à la réalité locale : ajoute, modifie ou retire des détails selon la ville (pas de carte ni de question FAQ sur le métro s'il n'y a pas de métro, pas d'aéroport s'il n'y en a pas ; à l'inverse, mets en avant ce que CETTE ville a : une plage, un campus, un stade, une gare routière).

Angle de rédaction (calqué sur les pages New York / LA / Chicago de ReportLost) :
- h1 : orienté action et bénéfice, ex "Lost something in <ville>? Report it and get it back." (reformulé à chaque ville).
- heroSubtitle : la promesse du service, du type "One report and we route it to the right <police locale>, the relevant lost & found offices, and active local social channels.", avec les vrais noms locaux.
- steps : les 3 étapes DU SERVICE (1. You report the loss, 2. We route it to the right places, 3. Automated monitoring finds matches for you), adaptées à la ville. L'étape 3 insiste sur la veille : la recherche automatisée scanne le web entier, marketplaces et canaux sociaux locaux en continu pour détecter les posts "found" correspondants, pour que la personne n'ait pas à vérifier elle-même chaque jour, avec alerte dès qu'un match crédible sort.
- ARGUMENT CLÉ à mettre en avant (heroSubtitle ET intro) : la veille automatique. ReportLost surveille tout le web public (annonces, marketplaces, groupes et pages locales) avec des recherches répétées pendant des mois, en croisant description, lieu et date. Le bénéfice à verbaliser : le client n'a pas à refaire le tour des sites et des groupes tous les jours, la surveillance tourne pour lui.
- intro : 2 paragraphes qui posent le problème local (lieux où l'on perd, systèmes séparés) et présentent ReportLost comme le raccourci qui simplifie tout, sur un ton rassurant, en incluant la veille automatique continue comme différenciateur.
- cards : les vrais canaux locaux AVEC leurs liens officiels (l'utilisateur peut faire seul), mais chaque carte glisse quand c'est pertinent une phrase sur ce que ReportLost fait à sa place ("We tell you which precinct covers your loss location", "We generate the exact info to include", "We point you to the right desk").
- midCta / finalCta : le timing est un argument mais JAMAIS anxiogène ni commercial agressif. Pas de "Don't wait!", "The clock is ticking", "before it's too late". Formule positive et rassurante, reformulée à chaque page : agir tôt améliore les chances, et une fois le signalement déposé, l'utilisateur peut souffler, l'équipe prend le relais.
- ctaLabel / finalCtaLabel : "Report my lost item →" / "Start my report →".
- FAQ : questions locales concrètes tirées des systèmes trouvés (délais, où réclamer), formulées différemment d'une ville à l'autre. La dernière question (ReportLost est-il officiel ?) est commune, avec une réponse reformulée.

Règles STRICTES de véracité :
- N'utilise QUE les URLs présentes dans les résultats de recherche fournis. N'invente JAMAIS d'URL, d'email, de téléphone ou d'adresse. Pas de résultat pertinent pour une carte, alors pas de "links" sur cette carte (le texte reste utile).
- Les liens doivent pointer vers les structures elles-mêmes : services officiels (police, ville/mairie, transports publics, aéroports, universités, animal control, humane society, SPCA) ou entreprises privées directement concernées (compagnie de taxi locale, Uber/Lyft, hôtel, centre commercial, stade, compagnie aérienne). INTERDIT : tout service d'objets trouvés tiers ou plateforme concurrente de ReportLost (annuaires lost & found, services d'alerte payants), agrégateurs, articles de presse, blogs. Le test : le lien est-il l'entité qui détient ou reçoit l'objet ? Oui, on garde. C'est un intermédiaire de recherche comme nous ? Non.
- N'inclus une carte "aéroport" ou "transit" QUE si la ville en a réellement un d'après les résultats. Une petite ville a typiquement : police, city hall, commerces/lieux publics, animaux perdus, 4 cartes suffisent alors.
- La carte "Lost pet" doit TOUJOURS terminer son texte par un lien interne vers le parcours dédié : <a href="/report-lost-pet"><strong>file a priority lost pet report</strong></a> (c'est le seul lien interne autorisé dans les cartes).
- "areas" : 3-5 vrais quartiers/zones de la ville si tu les connais avec certitude, sinon des zones génériques honnêtes (downtown, main street, parcs). Pas de href.
- "social" : cite les groupes/subreddits UNIQUEMENT s'ils apparaissent dans les résultats, sinon des catégories génériques ("Facebook groups", "Nextdoor"). JAMAIS d'URL brute dans les descriptions : uniquement des noms lisibles ("Philadelphia Lost and Found group", "r/philly"), comme sur le modèle New York.
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
      8000
    );

    const parseGuide = (txt: string): any | null => {
      const cleaned = txt.replace(/```json|```/g, "").trim();
      try {
        return JSON.parse(cleaned);
      } catch {}
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          return JSON.parse(m[0]);
        } catch {}
      }
      return null;
    };

    let guide: any = parseGuide(raw);
    if (!guide) {
      // Retry automatique : les grosses villes produisent des guides longs qui
      // peuvent être tronqués ; on redemande une fois, plus compact.
      console.warn(`[city-guide] JSON invalide pour ${cityName}, retry...`);
      const raw2 = await callClaude(
        `Tu viens de renvoyer un JSON invalide (probablement tronqué). Regénère le même guide CityGuide, PLUS COMPACT : intro et cartes plus courtes, 4 questions FAQ maximum, 4 cartes maximum. Réponds UNIQUEMENT avec le JSON complet et valide.\n\nSchéma :\n${GUIDE_SCHEMA}`,
        `Ville : ${cityName}, ${stateName} (${stateAbbr})\n\nRésultats de recherche Google :\n\n${results}`,
        8000
      );
      guide = parseGuide(raw2);
    }
    if (!guide) {
      return NextResponse.json({ error: "JSON invalide renvoyé par le modèle (2 tentatives) — relance cette ville", raw: raw.slice(0, 500) }, { status: 502 });
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

    // 4) Sauvegarde (brouillon par défaut, ou publication directe non vérifiée)
    const status = autoPublish ? "published" : "draft";
    const { error: upErr } = await sb.from("city_guides").upsert(
      {
        state_id: stateAbbr,
        city_slug: cityName.toLowerCase(),
        guide,
        status,
        verified: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "state_id,city_slug" }
    );
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    // 4bis) Publication directe : invalide le cache ISR de la page pour que le
    // guide apparaisse immédiatement (sinon l'ancienne version reste servie 24h)
    if (autoPublish) {
      try {
        revalidatePath(buildCityPath(stateAbbr, cityName));
      } catch (e) {
        console.error("[city-guide] revalidatePath:", e);
      }
    }

    // 5) Publication directe : renseigne aussi title/meta SEO (us_cities) s'ils sont vides
    if (autoPublish) {
      try {
        const { data: seoRow } = await sb
          .from("us_cities")
          .select("id, static_title, static_content")
          .eq("id", cityRow.id)
          .maybeSingle();
        const stripHtml = (s: string) => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        const seoPatch: Record<string, string> = {};
        if (seoRow && !seoRow.static_title) {
          seoPatch.static_title = `Lost & Found in ${cityName}, ${stateAbbr}: Report a Lost Item`;
        }
        if (seoRow && !seoRow.static_content) {
          const desc = stripHtml(guide.heroSubtitle || (Array.isArray(guide.intro) ? guide.intro[0] : "") || "");
          if (desc) seoPatch.static_content = desc.slice(0, 300);
        }
        if (Object.keys(seoPatch).length) await sb.from("us_cities").update(seoPatch).eq("id", cityRow.id);
      } catch (e) {
        console.error("[city-guide-generate] maj SEO non bloquante:", e);
      }
    }

    // 6) Photo d'illustration unique (IA) — pour les villes traitées, on remplace
    //    aussi une éventuelle photo Pexels ; les villes non traitées gardent Pexels.
    let imageUrl: string | null = (cityRow as any).image_url || null;
    const isPexels = !!imageUrl && imageUrl.includes("images.pexels.com");
    if (!imageUrl || isPexels) {
      try {
        imageUrl = (await generateCityPhoto(sb, cityRow as any)) || imageUrl;
      } catch (e) {
        console.error("[city-image] échec non bloquant:", e);
      }
    }

    return NextResponse.json({ ok: true, guide, queries, status, image: imageUrl });
  } catch (e: any) {
    console.error("[city-guide-generate] fatal:", e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
