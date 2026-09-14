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

// ---------------------------------------------------------------------------
// Seuils : une commune de 800 habitants n'a ni aéroport ni réseau de bus, et
// une photo générée pour elle ne ressemblera à rien de réel.
const SMALL_TOWN_POP = 5000; // en dessous : rédaction plus courte
const NO_PHOTO_POP = 2500;   // en dessous : pas d'image générée du tout

// ---------------------------------------------------------------------------
// Garde-fou de sortie. Une consigne dans le prompt se contourne, un contrôle
// sur le texte produit ne se contourne pas : on relit ce que le modèle a écrit
// avant de le publier.
const BANNED: { re: RegExp; why: string }[] = [
  { re: /\b(every|each)\s+(minute|second|hour)\s+counts\b/i, why: "urgence artificielle" },
  { re: /\btime is (critical|of the essence|running out)\b/i, why: "urgence artificielle" },
  { re: /\bthe clock is ticking\b/i, why: "urgence artificielle" },
  { re: /\b(do ?n[o']?t wait|before it'?s too late|act (now|fast)|hurry)\b/i, why: "urgence artificielle" },
  { re: /\bfirst\s+(24|48)\s+hours?\b[^.]{0,40}\b(critical|crucial|decisive)\b/i, why: "urgence artificielle" },
  { re: /\b6\s*(to|or)\s*12\s*months?\b/i, why: "durée obsolète, la formule unique dure 12 mois" },
  { re: /\b(we guarantee|guaranteed)\b/i, why: "promesse de résultat" },
  { re: /\b(every|all)\s+(shelter|shelters|group|groups|police department|departments)\b/i, why: "absolu sur la portée" },
  { re: /\b\d{1,3}\s?%\s+of\b/i, why: "statistique non sourcée" },
  { re: /\b(subscription|monthly fee)\b/i, why: "vocabulaire d'abonnement" },
];

function collectStrings(v: any, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => collectStrings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => collectStrings(x, out));
  return out;
}

function auditGuide(guide: any): { phrase: string; why: string }[] {
  const found: { phrase: string; why: string }[] = [];
  for (const s of collectStrings(guide)) {
    for (const b of BANNED) {
      const m = s.match(b.re);
      if (m) found.push({ phrase: m[0], why: b.why });
    }
  }
  return found;
}

export async function POST(req: NextRequest) {
  try {
    const { city, state, autoPublish } = await req.json();
    if (!city || !state) return NextResponse.json({ error: "city et state requis" }, { status: 400 });

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const stateAbbr = String(state).toUpperCase();
    let { data: cityRow } = await sb
      .from("us_cities")
      .select("id, city_ascii, state_id, state_name, image_url, population")
      .eq("state_id", stateAbbr)
      .ilike("city_ascii", String(city).trim())
      .maybeSingle();
    // Rattrapage : noms avec espace final ou suffixe recensement ("Milford city ")
    if (!cityRow) {
      const { data: fuzzyRows } = await sb
        .from("us_cities")
        .select("id, city_ascii, state_id, state_name, image_url, population")
        .eq("state_id", stateAbbr)
        .ilike("city_ascii", `${String(city).trim()}%`)
        .order("population", { ascending: false })
        .limit(1);
      cityRow = fuzzyRows?.[0] || null;
    }
    if (!cityRow) return NextResponse.json({ error: `Ville introuvable : ${city}, ${stateAbbr}` }, { status: 404 });

    const cityName = cityRow.city_ascii;
    const stateName = cityRow.state_name || stateAbbr;
    const population = Number((cityRow as any).population || 0);
    const isSmallTown = population > 0 && population < SMALL_TOWN_POP;

    // Une petite commune n'a ni transit, ni aéroport, ni quartiers : lui écrire
    // une page longue oblige le modèle à meubler, et meubler c'est inventer.
    const smallTownRule = isSmallTown
      ? `

📏 PETITE COMMUNE (${population.toLocaleString("en-US")} habitants). Écris COURT, c'est une contrainte, pas une suggestion :
- intro : 1 seul paragraphe, 3 phrases maximum.
- cards : 3 maximum (typiquement police, mairie ou services municipaux, animaux perdus). Pas de carte transit ni aéroport.
- areas : 2 ou 3 zones réelles, et si tu n'en connais pas avec certitude, n'en mets aucune plutôt que d'inventer des quartiers.
- faq : 3 questions maximum, dont celle sur l'indépendance de ReportLost.
- Ne compense JAMAIS la petite taille par des généralités. Une page courte et vraie vaut mieux qu'une page longue et vague.`
      : "";


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
    // 🛑 Garde-fou : sans AUCUN résultat de recherche (crédits Serper épuisés,
    // clé invalide...), on refuse de générer un guide dégradé sans vrais
    // contacts locaux, plutôt que de brûler des tokens pour une page vide.
    if (sets.every((s) => !s.length)) {
      return NextResponse.json(
        { error: "Serper n'a renvoyé aucun résultat (crédits épuisés ?). Génération annulée pour ne pas produire un guide sans données locales." },
        { status: 503 }
      );
    }
    const results = queries
      .map((q, i) => `### ${q}\n${sets[i].map((r) => `- ${r.title}\n  ${r.link}\n  ${r.snippet}`).join("\n") || "(aucun résultat)"}`)
      .join("\n\n");

    // 2) Rédaction stricte
    const raw = await callClaude(
      `Tu rédiges la page "lost & found" d'une ville américaine pour ReportLost.org, au format JSON CityGuide.
Tu es un EXPERT EN CONVERSION, pas un blogueur : cette page vend le service d'accompagnement de ReportLost
(un signalement, et l'équipe contacte les bons services locaux, publie une alerte sociale, et le signalement
reste actif en recherche de correspondances pendant 12 mois). Chaque section doit ramener vers le formulaire de signalement.

EXEMPLES D'OBJETS : quand tu cites des objets perdus en exemple (intro, FAQ, cartes, étapes), privilégie wallet, purse, ring, bracelet, phone, cat et dog (les objets qui convertissent le mieux) ; keys, laptop, backpack ou glasses seulement de temps en temps pour varier.

⚠️ PRINCIPE DIRECTEUR : des pages "similaires mais différentes". Garde exactement ce plan de page (le modèle New York ci-dessous), mais REFORMULE chaque phrase : synonymes, constructions retournées, jamais une phrase réutilisable sur une autre ville en changeant juste le nom. Et ajuste le contenu à la réalité locale : ajoute, modifie ou retire des détails selon la ville (pas de carte ni de question FAQ sur le métro s'il n'y a pas de métro, pas d'aéroport s'il n'y en a pas ; à l'inverse, mets en avant ce que CETTE ville a : une plage, un campus, un stade, une gare routière).

Angle de rédaction (calqué sur les pages New York / LA / Chicago de ReportLost) :
- h1 : orienté action et bénéfice, ex "Lost something in <ville>? Report it and get it back." (reformulé à chaque ville).
- heroSubtitle : la promesse du service, du type "One report and we route it to the right <police locale>, the relevant lost & found offices, and active local social channels.", avec les vrais noms locaux.
- steps : les 3 étapes DU SERVICE (1. You report the loss, 2. We route it to the right places, 3. Your report keeps searching for you), adaptées à la ville. L'étape 3 insiste sur la veille MAIS avec un cadrage rassurant, centré sur le signalement et non sur une "surveillance" : le signalement reste actif pendant toute la durée de la formule, la recherche automatisée continue de croiser les nouveaux posts "found", annonces et marketplaces avec la description, pour que la personne n'ait pas à vérifier elle-même chaque jour, avec alerte dès qu'un match crédible sort.
- ARGUMENT CLÉ à mettre en avant (heroSubtitle ET intro) : le signalement qui reste actif. FORMULATION IMPOSÉE : parler de "your report stays active", "keeps searching for a match", "for 12 months". La durée est de 12 mois, jamais "6 to 12 months" ni "6 or 12 months" : il n'existe plus qu'une seule formule payante. INTERDIT aussi : le mot "plan" (connotation abonnement) et tout vocabulaire d'abonnement ("subscription", "monthly") ; les formules payantes sont des paiements uniques. INTERDIT : "monitors the web for months", "we watch the web" et toute formulation qui évoque une surveillance diffuse et longue ; le mot "monitoring" seul est toléré mais jamais "for months" accolé. Le bénéfice à verbaliser : le client n'a pas à refaire le tour des sites et des groupes tous les jours, son signalement continue de chercher pour lui.
- intro : 2 paragraphes qui posent le problème local (lieux où l'on perd, systèmes séparés) et présentent ReportLost comme le raccourci qui simplifie tout, sur un ton rassurant, en incluant la veille automatique continue comme différenciateur.
- cards : les vrais canaux locaux AVEC leurs liens officiels (l'utilisateur peut faire seul), mais chaque carte glisse quand c'est pertinent une phrase sur ce que ReportLost fait à sa place ("We tell you which precinct covers your loss location", "We generate the exact info to include", "We point you to the right desk").
- midCta / finalCta : ton calme et rassurant. Le lecteur vient de perdre quelque chose, il est déjà inquiet : le texte doit le soulager, pas ajouter de la pression.

⛔ URGENCE ARTIFICIELLE, RÈGLE DE PRINCIPE : n'écris JAMAIS, nulle part dans la page, qu'il reste peu de temps, que chaque minute ou chaque heure compte, que les premières heures sont décisives, ou que le lecteur risque de perdre son objet en attendant. Cette règle s'applique à toute la page, pas seulement aux CTA, et à toute formulation équivalente même si elle n'est pas dans la liste ci-dessous.
Exemples interdits : "every minute counts", "time is critical", "time is of the essence", "time is running out", "the clock is ticking", "don't wait", "before it's too late", "act now", "act fast", "hurry", "the first 24/48 hours are critical/decisive/crucial".
Ce qui est AUTORISÉ, une seule fois par page, sans point d'exclamation : constater qu'un signalement déposé tôt est traité plus tôt. Puis rassurer : une fois le signalement fait, l'équipe prend le relais et la personne n'a plus à courir après.
- ctaLabel / finalCtaLabel : "Report my lost item →" / "Start my report →".
- FAQ : questions locales concrètes tirées des systèmes trouvés (délais, où réclamer), formulées différemment d'une ville à l'autre. La dernière question (ReportLost est-il officiel ?) est commune, avec une réponse reformulée.

Règles STRICTES d'ALIGNEMENT AVEC LES CONDITIONS GÉNÉRALES (ce que le service fait réellement) :
- Le dépôt auprès du service d'objets trouvés compétent se fait LÀ OÙ CE SERVICE ACCEPTE un signalement par un tiers. Écris donc "we file the report where the department accepts third-party reports, and give you the exact office, link and steps where it does not". N'écris JAMAIS que ReportLost dépose systématiquement une plainte ou un rapport de police.
- La veille dure 12 mois. Jamais d'autre durée.
- INTERDIT : toute promesse de résultat ("we will find it", "guaranteed", "we guarantee"). Le service est une obligation de moyens.
- INTERDIT : les absolus sur la portée ("every shelter", "all local groups", "all police departments", "everywhere", "any lost item"). Écris "the relevant shelters", "the local groups that matter", "the right department".
- INTERDIT : toute statistique, pourcentage ou chiffre de performance ("84% of lost items are found", "most items are recovered within X days"). Nous n'en publions aucun.
- INTERDIT : présenter une activité qui n'existe pas dans cette ville (nombre de signalements, objets récemment retrouvés sur place). Aucune donnée d'activité locale inventée.

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
Réponds UNIQUEMENT avec le JSON (pas de markdown).${smallTownRule}

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

    // 2bis) Audit de conformité. Si le modèle a glissé de l'urgence artificielle,
    // une durée obsolète ou une promesse de résultat, on lui fait réécrire une
    // fois en lui citant ses propres phrases. S'il récidive, on ne publie pas.
    let violations = auditGuide(guide);
    if (violations.length) {
      console.warn(`[city-guide] ${cityName} : ${violations.length} violation(s)`, violations);
      const list = violations.map((v) => `- "${v.phrase}" (${v.why})`).join("\n");
      const rawFix = await callClaude(
        `Le guide que tu viens de produire contient des formulations interdites. Réécris-le INTÉGRALEMENT en supprimant ces phrases et toute formulation équivalente, sans rien changer d'autre : mêmes contacts, mêmes liens, même structure.

Phrases à supprimer :
${list}

Rappels : la veille dure 12 mois (jamais "6 to 12 months"). Aucune urgence : ni "every minute counts", ni "time is critical", ni équivalent. Aucune promesse de résultat, aucun absolu du type "every shelter" ou "all groups", aucune statistique.

Réponds UNIQUEMENT avec le JSON complet et valide.\n\nSchéma :\n${GUIDE_SCHEMA}`,
        `Guide à corriger :\n\n${JSON.stringify(guide)}`,
        8000
      );
      const fixed = parseGuide(rawFix);
      if (fixed) {
        const stillBad = auditGuide(fixed);
        if (!stillBad.length) {
          guide = fixed;
          violations = [];
          console.log(`[city-guide] ${cityName} : corrigé au 2e passage`);
        } else {
          violations = stillBad;
        }
      }
      if (violations.length) {
        return NextResponse.json(
          {
            error: `Guide non conforme après correction, non publié : ${violations.map((v) => `"${v.phrase}" (${v.why})`).join(", ")}`,
            violations,
          },
          { status: 422 }
        );
      }
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
        // La page état liste les villes couvertes : à rafraîchir aussi
        revalidatePath(`/lost-and-found/${stateAbbr.toLowerCase()}`);
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
        // ⚠️ On ÉCRASE toujours l'ancien title/meta : les valeurs héritées des
        // 31k pages d'origine étaient génériques ou tronquées en pleine phrase,
        // ce qui plombait le CTR des pages enrichies.
        const seoPatch: Record<string, string> = {};
        if (seoRow) {
          seoPatch.static_title = `Lost & Found in ${cityName}, ${stateAbbr}: Report a Lost Item`;
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
    // Sous NO_PHOTO_POP, une image générée ne ressemblera à rien de réel :
    // mieux vaut pas d'illustration qu'une illustration inventée.
    const skipPhoto = population > 0 && population < NO_PHOTO_POP;
    if (skipPhoto) {
      console.log(`[city-image] ${cityName} (${population} hab.) : pas d'image générée`);
    } else if (!imageUrl || isPexels) {
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
