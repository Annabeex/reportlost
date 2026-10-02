// app/api/admin/group-kit/route.ts
// Génère un "kit de lancement" de groupe Facebook pour une ville :
// nom de groupe, description (promo page reportlost), 3 posts de démarrage,
// et 3 posts "FOUND ✅" basés sur de vrais objets trouvés publics (Serper).

import { NextRequest, NextResponse } from "next/server";
import { serperSearch } from "@/lib/matchWatch/core";
import { extractJson } from "@/lib/extractJson";
import { countyPath, countyToSlug, getEligibleCountySlugs } from "@/lib/county";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

function slugify(s: string): string {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
}

async function claudeJSON(system: string, user: string, maxTokens = 1400): Promise<any> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY manquant");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json();
  const txt = String(data?.content?.[0]?.text ?? "");
  // Extraction équilibrée : l'ancienne capture gloutonne allait du premier
  // « { » au DERNIER « } », donc deux blocs JSON dans la réponse donnaient
  // « Unexpected non-whitespace character after JSON ».
  const parsed = extractJson<any>(txt);
  if (!parsed.ok) throw new Error(`Réponse du modèle illisible : ${parsed.error}`);
  return parsed.value;
}

// Une annonce n'est utilisable que si elle dit clairement qu'un objet a ete
// TROUVE. L'ancien filtre /found/ laissait passer « lost but not found », que
// le modele transformait ensuite en « FOUND at the police station » : une
// fausse trouvaille publiee dans un groupe public, qui peut envoyer quelqu'un
// reclamer au commissariat un objet qui n'y est pas.
const FOUND_SIGNAL =
  /\b(i|we|someone|my (son|daughter|husband|wife|neighbor|friend)) (just )?found\b|\bfound (a|an|this|these|some|two|three|keys|wallet|phone|dog|cat|ring|bag)\b|\b(was|were|been) found\b|\bfound (at|on|in|near|by|outside|inside|behind)\b|\bturned (it |them )?in\b|\bhanded (it |them )?in\b|\bfound[: ]*[✅-]|^\s*found\b/i;
const LOST_SIGNAL =
  /\b(lost|missing|looking for|have you seen|has anyone seen|stolen|not found|can'?t find|cannot find|please help (me )?find|help us find|reward)\b/i;

// « not found », « never found », « hasn't been found » : la negation doit etre
// neutralisee AVANT de chercher une trouvaille, sinon « not found wallet »
// declenche « found wallet ».
const NEGATED_FOUND =
  /\b(not|never|haven'?t|hasn'?t|have not|has not|still not|yet to be|wasn'?t|weren'?t)\s+(been\s+|yet\s+)?found\b/gi;

function isFoundLead(text: string): boolean {
  const t = String(text || "").replace(NEGATED_FOUND, " ");
  if (!/found/i.test(t)) return false;
  if (FOUND_SIGNAL.test(t)) return true;   // trouvaille explicite, meme si « lost » apparait aussi
  if (LOST_SIGNAL.test(t)) return false;   // perte sans trouvaille : on ecarte
  return false;                            // ambigu : on ecarte, un groupe public ne supporte pas l'erreur
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY manquant" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const city = String(body?.city || "").trim();
  const state = String(body?.state || "").trim().toUpperCase();
  if (!city || !state) return NextResponse.json({ ok: false, error: "ville et État requis" }, { status: 400 });

  // Kit regional (Cape Cod, Outer Banks...) : "city" porte le nom de la region
  // et le lien vise la page comte, faute de page ville a ce nom.
  const county = String(body?.county || "").trim();
  const cityUrl = county
    ? `https://reportlost.org${countyPath(state, county)}`
    : `https://reportlost.org/lost-and-found/${state.toLowerCase()}/${slugify(city)}`;

  // Le lien part dans un groupe Facebook public : il ne doit jamais aboutir a
  // une 404. Une page comte n'existe que si l'Etat est active et que le comte
  // compte assez de villes a guide publie.
  if (county) {
    const eligibles = await getEligibleCountySlugs(state).catch(() => new Set<string>());
    if (!eligibles.has(countyToSlug(county))) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `La page du comté de ${county} (${state}) n'existe pas encore : il faut au moins ` +
            `3 villes de ce comté avec un guide publié. Génère d'abord leurs guides, ` +
            `puis relance ce kit.`,
        },
        { status: 400 }
      );
    }
  }

  // Vrais objets/animaux trouvés publics récents (best effort, non bloquant).
  // Fenêtre "dernière semaine" (freshness qdr:w) + sources variées pour viser 3 posts.
  let foundLeads: { title: string; snippet: string; link: string }[] = [];
  if (process.env.SERPER_API_KEY) {
    try {
      const thisWeek = new Date().toISOString(); // -> freshness "qdr:w"
      // Priorité aux OBJETS (wallet, bag, phone, keys...), mais avec des requêtes
      // génériques en complément : dans les petites villes, les requêtes trop
      // étroites ne ramènent rien du tout.
      const queries = [
        `found wallet OR found keys OR found phone ${city} ${state}`,
        `"found" ${city} site:facebook.com`,
        `found ${city} ${state}`,
        `found ${city} ${state} site:craigslist.org OR site:nextdoor.com OR site:reddit.com`,
        `found dog OR found cat ${city} ${state}`,
      ];
      let sets = await Promise.all(queries.map((q) => serperSearch(q, thisWeek).catch(() => [])));
      // Filet : si la semaine ne donne rien (petite ville), on élargit au mois.
      if (sets.every((s) => !s.length)) {
        sets = await Promise.all(queries.map((q) => serperSearch(q, null).catch(() => [])));
      }
      const seen = new Set<string>();
      const all = sets
        .flat()
        .filter((r) => {
          if (seen.has(r.link)) return false;
          seen.add(r.link);
          return isFoundLead(`${r.title} ${r.snippet}`);
        })
        .map((r) => ({ title: r.title, snippet: r.snippet, link: r.link }));
      // Objets d'abord, animaux plafonnés à 4 leads : le modèle choisit ensuite
      // 2 objets + 1 animal max parmi eux.
      const isPet = (l: { title: string; snippet: string }) =>
        /\b(dog|cat|puppy|kitten|kitty|pet|pup|husky|terrier|labrador|pit ?bull|parrot|rabbit|bunny)\b/i.test(
          `${l.title} ${l.snippet}`
        );
      const objectLeads = all.filter((l) => !isPet(l)).slice(0, 11);
      const petLeads = all.filter(isPet).slice(0, 4);
      foundLeads = [...objectLeads, ...petLeads];
    } catch {
      foundLeads = [];
    }
  }

  const foundBlock = foundLeads.length
    ? foundLeads.map((l) => `- ${l.title} — ${l.snippet} (${l.link})`).join("\n")
    : "(no public 'found' leads available)";

  const tones = [
    "clear and factual",
    "practical and concise",
    "neutral and local",
  ];
  const tone = tones[Math.floor(Math.random() * tones.length)];

  // Tirages supplémentaires : l'angle d'ouverture et la structure changent la
  // construction même du texte (le ton seul ne suffisait pas, les descriptions
  // finissaient par se ressembler).
  const openings = [
    "start with a plain statement of what this group is for",
    "start by naming a relevant local lost-and-found channel",
    "start with the group's location and posting scope",
  ];
  const opening = openings[Math.floor(Math.random() * openings.length)];
  const structures = [
    "paragraph 1 group purpose and local scope, paragraph 2 how members can post, paragraph 3 optional reporting resources",
    "paragraph 1 local contacts and group purpose, paragraph 2 posting guidance for lost and found items",
    "two short paragraphs: one for group scope, one for posting guidance and optional resources",
  ];
  const structure = structures[Math.floor(Math.random() * structures.length)];

  const system =
    "You write fresh, natural, NON-templated Facebook group content for ReportLost.org (a lost & found service). Every output must feel human and unique. ITEM EXAMPLES: use a balanced mix of everyday objects and pets when examples are relevant. Do not rank examples by sales performance or imply that any category has a greater chance of being returned. Avoid AI clichés and repetitive phrasing. STYLE RULES: never use dashes as punctuation (no em dash, no ' - '), use commas or separate sentences instead; no bullet lists inside the texts. GLOBALLY BANNED PHRASING (applies to every field, including any close variant): 'reunite ... with ...' in any form ('reunite people with their lost items', 'reunite it with its owner', 'reunite pets with their families'), 'connect people with their belongings', 'connect neighbors with their lost items', 'belongings back home', 'back where it belongs'. Use plain, factual wording to describe the item and the steps to contact its owner. Do not imply a quick return or promise an outcome. SAFETY RULES: only everyday lost/found items and pets; NEVER mention found bodies, human remains, people, children, weapons, drugs or anything morbid, medical or disturbing, silently skip any lead of that kind. Reply ONLY with valid JSON.";
  const user = `City: ${city}, ${state}
ReportLost city page URL (promote this exact link): ${cityUrl}

Recent PUBLIC "found item" posts seen online in this area (real leads to reference, may be imperfect):
${foundBlock}

Produce JSON in US English:
{
  "groupName": "a clear, searchable Facebook group name people would search when they lose/find something in this city. MUST include the city name AND the 2-letter state code (${state}). NEVER use the word 'Exchange'. Good patterns: '<City>, ${state} - Lost & Found', 'Lost & Found <City> ${state}', '<City> ${state} Lost & Found Community'",
  "description": "a ${tone}, natural 110-180 word group description in US English, SPECIFIC to ${city}. MANDATORY for this generation, follow both: ${opening}; ${structure}. FORMAT: short paragraphs separated by BLANK LINES (write them as \\n\\n inside the JSON string, never one big block) and 2-4 well-placed emojis (👛 💍 📱 🐕 🐈 📍 etc.). BANNED phrases (never use, nor close variants): 'reunite people with their lost items', 'connect people/neighbors with their lost items', 'come to the right place', 'neighbors helping neighbors', 'neighbors support neighbors', 'we're here to help', 'trusted community', 'belongings back home', 'together we make ... a community', 'beloved pets'. Write fresh human copy; if you know ${city}, name a real local spot or two; invite members to post things they find, lost pets included (the group is for lost items AND lost pets, give both kinds of examples). NON-NEGOTIABLE: the description MUST contain this exact URL once, for reporting a lost item: ${cityUrl}",
  "posts": ["Create ONE pinned informational post in US English with a neutral, factual tone. Include the provided city ReportLost URL once as one optional reporting resource; do not put it first for visibility or suggest the service takes the search off someone's hands. Describe the scopes accurately: the free public listing publishes the report; automatic search is $12 for six months of public-web monitoring, a ReportLost certificate, an anonymous case address and printable QR stickers; team-assisted search is $25 for 12 months of monitoring, manual research, direct contact with relevant services, report submission, and local social sharing under group rules. State that official agencies and venues set their own procedures and that no recovery outcome is guaranteed. Then explain this group's posting rules for lost and found objects and pets. Do not use urgency, deadlines as sales pressure, recovery claims, promotional superlatives or fake testimonials. Use no more than two emojis. Link only the provided city URL."],
  "foundPosts": ["aim for EXACTLY 3 short shareable posts built ONLY from usable real 'found' leads above (everyday items or pets exclusively; silently drop any lead about people, remains or anything disturbing; pick the most local and most recent). MANDATORY MIX: AT MOST 1 of the 3 may be about a pet (dog, cat, or any animal); the other 2 MUST be about objects, prioritizing wallet, bag, phone and keys leads when available, then any other everyday item. If usable object leads run out, return fewer posts rather than adding a second pet. NEVER turn a LOST post into a FOUND post: use a lead ONLY if it clearly says someone FOUND the item; if it describes someone who lost it, is looking for it or offers a reward, drop it. NEVER invent a detail absent from the lead (no police station, venue, date or brand that the lead does not state). Each MUST start with 'FOUND ✅', summarize the item or pet and where it was found, add 'seen in a public group, verify before claiming', and include the source URL. If no usable leads at all, return []."]
}`;

  let kit: any;
  try {
    kit = await claudeJSON(system, user);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }

  // 🔒 Vérifications systématiques (le prompt ne suffit pas toujours) :
  // le lien de la page ville doit être dans la description ET dans le post épinglé.
  const descMissingLink = kit?.description && !String(kit.description).includes(cityUrl);
  const pinned = Array.isArray(kit?.posts) ? String(kit.posts[0] || "") : "";
  const pinnedMissingLink = pinned && !pinned.includes(cityUrl);
  if (descMissingLink || pinnedMissingLink) {
    try {
      const fixed = await claudeJSON(
        system,
        `${user}\n\nYOUR PREVIOUS ATTEMPT WAS REJECTED because this exact URL was missing from ${
          descMissingLink && pinnedMissingLink
            ? "the description AND the pinned post"
            : descMissingLink
            ? "the description"
            : "the pinned post"
        }: ${cityUrl}\nRegenerate the full JSON, same requirements, and make absolutely sure the URL appears once in the description and once at the very top of the pinned post.`
      );
      if (fixed?.description && fixed?.posts) kit = fixed;
    } catch {
      /* on garde la version initiale, réparée ci-dessous */
    }
  }
  // Dernier recours mécanique : on ajoute le lien plutôt que de livrer un kit sans lien.
  if (kit?.description && !String(kit.description).includes(cityUrl)) {
    kit.description = `${String(kit.description).trim()}\n\nLost something in ${city}? File your report here: ${cityUrl}`;
  }
  if (Array.isArray(kit?.posts) && kit.posts[0] && !String(kit.posts[0]).includes(cityUrl)) {
    kit.posts[0] = `📌 Lost something in ${city}? File your report at ${cityUrl} and let the search run for you.\n\n${String(kit.posts[0]).replace(/^📌\s*/, "")}`;
  }

  return NextResponse.json({
    ok: true,
    cityUrl,
    groupName: kit.groupName || "",
    description: kit.description || "",
    posts: Array.isArray(kit.posts) ? kit.posts : [],
    foundPosts: Array.isArray(kit.foundPosts) ? kit.foundPosts : [],
    // Diagnostic : nombre de pistes brutes ramenées par Serper (0 = problème
    // de recherche/crédits, >0 avec foundPosts vide = problème de prompt)
    foundLeadsCount: foundLeads.length,
    serperConfigured: !!process.env.SERPER_API_KEY,
  });
}
