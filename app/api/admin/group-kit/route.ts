// app/api/admin/group-kit/route.ts
// Génère un "kit de lancement" de groupe Facebook pour une ville :
// nom de groupe, description (promo page reportlost), 3 posts de démarrage,
// et 3 posts "FOUND ✅" basés sur de vrais objets trouvés publics (Serper).

import { NextRequest, NextResponse } from "next/server";
import { serperSearch } from "@/lib/matchWatch/core";

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
  const m = txt.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : {};
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY manquant" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const city = String(body?.city || "").trim();
  const state = String(body?.state || "").trim().toUpperCase();
  if (!city || !state) return NextResponse.json({ ok: false, error: "ville et État requis" }, { status: 400 });

  const cityUrl = `https://reportlost.org/lost-and-found/${state.toLowerCase()}/${slugify(city)}`;

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
          return /found|lost and found/i.test(`${r.title} ${r.snippet}`);
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
    "warm and welcoming",
    "upbeat and energetic",
    "calm and reassuring",
    "practical and down-to-earth",
    "friendly and neighborly",
    "hopeful and encouraging",
  ];
  const tone = tones[Math.floor(Math.random() * tones.length)];

  // Tirages supplémentaires : l'angle d'ouverture et la structure changent la
  // construction même du texte (le ton seul ne suffisait pas, les descriptions
  // finissaient par se ressembler).
  const openings = [
    "start with a short question a local would actually ask",
    "start with a tiny everyday scene (someone realizing they lost something in a specific local spot)",
    "start with a plain, direct statement of what this group is for",
    "start by naming a couple of real local places where things get lost",
    "start from the finder's point of view (you just picked something up, now what)",
    "start with the lost pet angle, then widen to everyday items",
  ];
  const opening = openings[Math.floor(Math.random() * openings.length)];
  const structures = [
    "paragraph 1 what the group is for, paragraph 2 how to post, paragraph 3 the ReportLost link",
    "paragraph 1 hook and local flavor, paragraph 2 the ReportLost link woven in naturally, paragraph 3 how to post",
    "two paragraphs only: one for the group, one that ends on the ReportLost link",
    "paragraph 1 finders, paragraph 2 owners with the ReportLost link, paragraph 3 one-line welcome",
  ];
  const structure = structures[Math.floor(Math.random() * structures.length)];

  const system =
    "You write fresh, natural, NON-templated Facebook group content for ReportLost.org (a lost & found service). Every output must feel human and unique. ITEM EXAMPLES: whenever you mention lost/found items as examples, favor wallets, purses, rings, bracelets, phones, cats and dogs (highest-converting items); mention keys, laptops or glasses only occasionally for variety. Avoid AI clichés and repetitive phrasing. STYLE RULES: never use dashes as punctuation (no em dash, no ' - '), use commas or separate sentences instead; no bullet lists inside the texts. GLOBALLY BANNED PHRASING (applies to every field, including any close variant): 'reunite ... with ...' in any form ('reunite people with their lost items', 'reunite it with its owner', 'reunite pets with their families'), 'connect people with their belongings', 'connect neighbors with their lost items', 'belongings back home', 'back where it belongs'. Express the idea differently every time (e.g. 'so the owner gets it back fast', 'so it finds its way home', 'to get it back into the right hands', or simply describe the action). SAFETY RULES: only everyday lost/found items and pets; NEVER mention found bodies, human remains, people, children, weapons, drugs or anything morbid, medical or disturbing, silently skip any lead of that kind. Reply ONLY with valid JSON.";
  const user = `City: ${city}, ${state}
ReportLost city page URL (promote this exact link): ${cityUrl}

Recent PUBLIC "found item" posts seen online in this area (real leads to reference, may be imperfect):
${foundBlock}

Produce JSON in US English:
{
  "groupName": "a catchy, searchable Facebook group name people would search when they lose/find something in this city. MUST include the city name AND the 2-letter state code (${state}). NEVER use the word 'Exchange'. Good patterns: '<City>, ${state} - Lost & Found', 'Lost & Found <City> ${state}', '<City> ${state} Lost & Found Community'",
  "description": "a ${tone}, natural 110-180 word group description in US English, SPECIFIC to ${city}. MANDATORY for this generation, follow both: ${opening}; ${structure}. FORMAT: short paragraphs separated by BLANK LINES (write them as \\n\\n inside the JSON string, never one big block) and 2-4 well-placed emojis (👛 💍 📱 🐕 🐈 📍 etc.). BANNED phrases (never use, nor close variants): 'reunite people with their lost items', 'connect people/neighbors with their lost items', 'come to the right place', 'neighbors helping neighbors', 'neighbors support neighbors', 'we're here to help', 'trusted community', 'belongings back home', 'together we make ... a community', 'beloved pets'. Write fresh human copy; if you know ${city}, name a real local spot or two; invite members to post things they find, lost pets included (the group is for lost items AND lost pets, give both kinds of examples). NON-NEGOTIABLE: the description MUST contain this exact URL once, for reporting a lost item: ${cityUrl}",
  "posts": ["EXACTLY ONE outstanding PINNED post (the group's welcome + rules + resources, written by a conversion expert). CRITICAL: Facebook truncates posts after ~2 lines with 'See more', so the ReportLost link block MUST be the VERY FIRST block of the post, visible without clicking. Structure, with \\n\\n between each block and 3-5 well-placed emojis total: (1) FIRST, a short help block that ALWAYS starts with the red pin emoji "📌 " (mandatory, first character of the post), 1-2 sentences freshly worded each time (never a recycled template), containing the link ${cityUrl} and getting across that ReportLost can take the search off their hands: report filed, local services contacted, alerts posted, months of monitoring (e.g. spirit: "📌 Report lost items on ReportLost at <link> and get professional help: your report gets filed, local services are contacted, and the search gets monitored for months. 👛📱" but reworded per city); (2) a warm 1-2 sentence welcome specific to ${city} with a local touch; (3) how the group works: post what you LOST or FOUND, item or pet, with a photo, the area and the date, the more specific the better; (4) the golden rule for finders: keep one detail secret (an engraving, the color of a tag) so whoever claims it can prove it's really theirs; (5) a final line for pet owners: print a free lost pet poster in 2 minutes at https://reportlost.org/lost-pet-poster 🐕. Mix object and pet examples naturally, no dashes as punctuation, respect the globally banned phrasing, only cheerful ordinary examples, nothing dark."],
  "foundPosts": ["aim for EXACTLY 3 short shareable posts built ONLY from usable real 'found' leads above (everyday items or pets exclusively; silently drop any lead about people, remains or anything disturbing; pick the most local and most recent). MANDATORY MIX: AT MOST 1 of the 3 may be about a pet (dog, cat, or any animal); the other 2 MUST be about objects, prioritizing wallet, bag, phone and keys leads when available, then any other everyday item. If usable object leads run out, return fewer posts rather than adding a second pet. Each MUST start with 'FOUND ✅', summarize the item or pet and where it was found, add 'seen in a public group, verify before claiming', and include the source URL. If no usable leads at all, return []."]
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
