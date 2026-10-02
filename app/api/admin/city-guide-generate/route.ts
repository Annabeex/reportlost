// app/api/admin/city-guide-generate/route.ts
// Génère un brouillon de guide ville (objet CityGuide) : recherches Google réelles
// via Serper, puis rédaction Claude STRICTEMENT limitée aux liens trouvés.
// Le brouillon est enregistré dans city_guides (status: draft) — rien n'est publié
// sans validation manuelle dans /admin/city-guides.
import { NextRequest, NextResponse } from "next/server";
import { okEtat } from "@/lib/okEtat";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getNearbyCities } from "@/lib/getNearbyCities";
import { buildCityPath } from "@/lib/slugify";
import { generateCityPhoto } from "@/lib/cityImage";
import { extractJson } from "@/lib/extractJson";

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
    const setsBruts = await Promise.all(queries.map((q) => serper(q).catch(() => [])));

    // 🛑 Filtre « bon État ». Google répond à "Laurel FL city hall" par le site
    // de la mairie de Laurel, DELAWARE : le nom de la ville lui suffit, l'État
    // est traité comme un indice faible. Le modèle recopiait ensuite ce lien.
    // On retire donc, AVANT de les lui montrer, les résultats qui nomment
    // explicitement un autre État sans jamais nommer le nôtre. Conservateur :
    // en cas de doute on garde, c'est le prompt qui tranche ensuite.
    const setsFiltres = setsBruts.map((set) => set.filter((r) => okEtat(r, stateAbbr, stateName, cityName)));
    const sets = setsFiltres.map((set, i) => (set.length ? set : []));
    const retires = setsBruts.reduce((n, s2, i) => n + (s2.length - setsFiltres[i].length), 0);
    if (retires) console.log(`[city-guide] ${retires} résultat(s) écartés : autre État que ${stateAbbr}.`);
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
Tu rédiges une page d'information locale sur les objets perdus. Utilise un ton neutre, organisationnel et factuel. La page doit rester utile aux personnes qui publient un signalement gratuit ou contactent directement les services locaux. ReportLost est une option de recherche complémentaire, pas un service public.

Les options actuelles doivent être décrites correctement :
- Free public listing : publication publique et consultable, sans recherche web active ni démarches de l'équipe.
- Automatic search, $12 once : recherche sur les sources web publiques pendant 6 mois, certificat de signalement et feuille de stickers QR. Pas de démarches locales ni de notice.
- Team-assisted search, $25 once : recherche sur les sources web publiques pendant 12 mois, démarches locales pertinentes et notice pour les groupes locaux. Les signalements sont transmis aux services qui acceptent les démarches d'un tiers ; sinon, ReportLost fournit les coordonnées et instructions pour que la personne fasse la démarche.
Les correspondances potentielles des options payantes sont examinées avant notification. La récupération n'est jamais garantie.

EXEMPLES D'OBJETS : varie les exemples selon les objets courants et ceux utiles administrativement, comme wallet, phone, keys, jewelry, passport ou ID. Cite un animal perdu si c'est pertinent pour la ville, sans en faire l'exemple principal.

PRINCIPE DE RÉDACTION : conserve le schéma CityGuide et adapte les informations à la ville réelle. Reformule les phrases entre les villes. N'invente ni lieux, ni contacts, ni procédures. Pour une petite commune, préfère une page courte et exacte à des détails génériques.

Angle de rédaction :
- h1 : titre descriptif sur les démarches d'objets perdus dans la ville. N'annonce aucun résultat ni récupération.
- heroSubtitle : résume les principaux canaux locaux et, si utile, distingue la publication gratuite des options de recherche payantes. N'affirme pas que ReportLost est un organisme officiel.
- steps : décris les démarches de la personne, la publication gratuite et les services payants. Précise ce qui est inclus dans chaque option sans laisser entendre que l'option gratuite comprend la recherche de l'équipe ou la recherche web.
- intro : présente les services locaux utiles et explique clairement comment ReportLost complète les démarches directes.
- cards : cite les contacts locaux vérifiés et les procédures officielles. Indique où la personne peut faire la démarche elle-même et ce que l'équipe peut prendre en charge.
- midCta / finalCta : ton informatif et organisationnel. Aucun levier de peur, d'urgence ou de délai. Les délais de conservation peuvent être mentionnés seulement comme une information locale vérifiée et utile.
- ctaLabel / finalCtaLabel : libellés descriptifs comme "Create a report →" et "Compare search options →".
- FAQ : questions locales concrètes, avec des réponses prudentes fondées sur les sources. Termine par le statut indépendant de ReportLost et l'absence de garantie de récupération.

Règles strictes sur le périmètre du service :
- N'écris jamais qu'un rapport est systématiquement déposé auprès de la police. Explique que les services décident s'ils acceptent un dépôt par un tiers ; indique les coordonnées et étapes à suivre si la personne doit faire le dépôt elle-même.
- Les durées sont celles de l'option choisie : 6 mois pour Automatic search, 12 mois pour Team-assisted search. Ne présente pas la recherche web comme incluse dans le signalement gratuit.
- Ne crée aucune urgence, peur de perdre l'objet, compte à rebours ou conseil d'agir avant une échéance.
- Ne promets aucun résultat. N'utilise pas "get it back", "we will find it", "guaranteed", "recover your item" ou des formulations équivalentes.
- N'utilise pas de statistiques de performance non publiées ni d'affirmations absolues telles que "every shelter" ou "all local groups".

Règles STRICTES de véracité :
- N'utilise QUE les URLs présentes dans les résultats de recherche fournis. N'invente JAMAIS d'URL, d'email, de téléphone ou d'adresse. Pas de résultat pertinent pour une carte, alors pas de "links" sur cette carte (le texte reste utile).
- ⛔ VÉRIFICATION DE L'ÉTAT, la règle la plus importante de cette liste. Des dizaines de villes
  américaines portent le même nom. Avant de retenir un lien, un téléphone ou une adresse, vérifie
  que le résultat de recherche désigne bien CETTE ville dans CET État : le nom de l'État, son
  abréviation, le nom du comté ou un domaine officiel de l'État doivent apparaître dans le titre,
  l'URL ou l'extrait. Si rien ne le confirme, N'UTILISE PAS ce contact. Un exemple réel de ce qu'il
  ne faut plus jamais produire : sur la page de Laurel, FLORIDE, avoir cité townoflaurel.net, qui
  est la mairie de Laurel, DELAWARE, et le 352-334-2600, qui est le réseau de bus de Gainesville.
- Mieux vaut UNE coordonnée juste que quatre dont une fausse. Quand la ville n'a pas d'administration
  propre (lieu-dit, census-designated place, quartier non incorporé), ne lui invente ni mairie ni
  police : le bon interlocuteur est le shérif du comté, et c'est lui qu'il faut nommer.
- L'indicatif téléphonique doit être cohérent avec la région. Un numéro dont l'indicatif dessert
  manifestement une autre partie de l'État est à écarter.
- ⛔ Une page Facebook, Instagram ou X n'est JAMAIS une coordonnée de service. Le lien d'une carte
  doit pointer vers le site officiel du service ou sa page contact. Si seul un profil social existe,
  la carte n'a pas de lien.
- Les liens doivent pointer vers les structures elles-mêmes : services officiels (police, ville/mairie, transports publics, aéroports, universités, animal control, humane society, SPCA) ou entreprises privées directement concernées (compagnie de taxi locale, Uber/Lyft, hôtel, centre commercial, stade, compagnie aérienne). INTERDIT : tout service d'objets trouvés tiers ou plateforme concurrente de ReportLost (annuaires lost & found, services d'alerte payants), agrégateurs, articles de presse, blogs. Le test : le lien est-il l'entité qui détient ou reçoit l'objet ? Oui, on garde. C'est un intermédiaire de recherche comme nous ? Non.
- N'inclus une carte "aéroport" ou "transit" QUE si la ville en a réellement un d'après les résultats. Une petite ville a typiquement : police, city hall, commerces/lieux publics, animaux perdus, 4 cartes suffisent alors.
- La carte "Lost pet" doit TOUJOURS terminer son texte par un lien interne vers le parcours dédié : <a href="/report-lost-pet"><strong>file a lost pet report</strong></a> (c'est le seul lien interne autorisé dans les cartes).
- "areas" : 3-5 vrais quartiers/zones de la ville si tu les connais avec certitude, sinon des zones génériques honnêtes (downtown, main street, parcs). Pas de href.
- "social" : cite les groupes/subreddits UNIQUEMENT s'ils apparaissent dans les résultats, sinon des catégories génériques ("Facebook groups", "Nextdoor"). JAMAIS d'URL brute dans les descriptions : uniquement des noms lisibles ("Philadelphia Lost and Found group", "r/philly"), comme sur le modèle New York.
- FAQ : 4-6 questions locales concrètes, réponses factuelles basées sur les résultats (délais de garde, où réclamer). En cas de doute, formule prudente ("check with..."). Termine par une question sur ReportLost ("Is ReportLost.org official / does it replace the police?" avec la réponse honnête : service indépendant).

Règles de STYLE :
- Anglais américain naturel, précis et sobre. Ton informatif, jamais promotionnel.
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
      // Repli équilibré : l'ancienne capture allait jusqu'au DERNIER « } »,
      // donc un second bloc JSON dans la réponse cassait le parsing.
      const parsed = extractJson<any>(cleaned);
      return parsed.ok ? parsed.value : null;
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

Rappels : les durées dépendent de l'option, 6 mois pour Automatic search et 12 mois pour Team-assisted search. N'utilise aucune urgence, aucune promesse de résultat, aucun absolu du type "every shelter" ou "all groups", et aucune statistique.

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
        tone_version: 2,
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
