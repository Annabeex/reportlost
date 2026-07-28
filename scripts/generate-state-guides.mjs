// scripts/generate-state-guides.mjs
// Génère les guides "lois lost & found" des États restants :
// recherche Serper (vraies sources) + rédaction Claude (JSON strict), écrit
// dans lib/stateGuidesGenerated.json. Les entrées écrites main dans
// lib/stateGuides.ts restent prioritaires. ⚠️ Contenu juridique : RELIRE
// chaque État généré avant de committer.
//
// Usage :
//   node scripts/generate-state-guides.mjs            → 5 États manquants
//   node scripts/generate-state-guides.mjs --count=10 → 10 États
//   node scripts/generate-state-guides.mjs --state=NV → un État précis
//
// Clés lues dans .env.local : SERPER_API_KEY, ANTHROPIC_API_KEY.

import fs from "fs";

const GEN_PATH = "lib/stateGuidesGenerated.json";
const HAND_PATH = "lib/stateGuides.ts";
const MODEL = process.env.STATE_GUIDE_MODEL || "claude-sonnet-5"; // légal → Sonnet

const STATES = {
  AL: "Alabama", AK: "Alaska", AR: "Arkansas", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", DC: "District of Columbia", HI: "Hawaii", ID: "Idaho", IN: "Indiana",
  IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine",
  MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NC: "North Carolina", ND: "North Dakota",
  OK: "Oklahoma", OR: "Oregon", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") +
  "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const SERPER = env.match(/^SERPER_API_KEY=([^\s]+)/m)?.[1];
const ANTHROPIC = env.match(/^ANTHROPIC_API_KEY=([^\s]+)/m)?.[1];
if (!SERPER || !ANTHROPIC) {
  console.error("SERPER_API_KEY / ANTHROPIC_API_KEY introuvables dans .env.local");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function serper(q) {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": SERPER, "Content-Type": "application/json" },
    body: JSON.stringify({ q, gl: "us", hl: "en", num: 8 }),
  });
  if (!res.ok) throw new Error(`Serper ${res.status}`);
  const data = await res.json();
  return (data?.organic || []).map((o) => ({ title: o.title, link: o.link, snippet: o.snippet || "" }));
}

async function claude(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 6000, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json();
  // ⚠️ la réponse peut contenir plusieurs blocs (le texte n'est pas forcément le 1er)
  const txt = (data?.content || [])
    .filter((b) => b?.type === "text")
    .map((b) => b.text)
    .join("");
  if (data?.stop_reason === "max_tokens") throw new Error("réponse tronquée (max_tokens)");
  // Extraction par comptage d'accolades : ignore tout texte avant/après le JSON
  const start = txt.indexOf("{");
  if (start === -1) throw new Error(`réponse sans JSON → début de la réponse : "${txt.slice(0, 150).replace(/\n/g, " ")}"`);
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = start; i < txt.length; i++) {
    const c = txt[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error("JSON incomplet dans la réponse");
  return JSON.parse(txt.slice(start, end + 1));
}

const SYSTEM = `You write the "How lost & found works in {State}" page for ReportLost.org, matching the exact structure and voice of the handwritten California and Texas pages.

ABSOLUTE RULES:
- Cite ONLY statutes, section numbers, deadlines and dollar amounts that appear in the provided search results. NEVER invent a statute number, a holding period or a threshold.
- If the results do not establish a dedicated lost property statute for the state, write the "no statewide statute" pattern (like Texas/Georgia): common law, the state's theft statute IF present in results, and local department policies.
- US English. No em dashes or dash punctuation, use commas. Never use "reunite ... with ..." or "connect people with their belongings".
- Each state must have its own angle based on what its law actually says. Do not produce interchangeable text.
- Include exactly ONE sentence in the intro's last paragraph: "ReportLost works inside this framework: we file reports with the right local departments, alert the places you visited, and your report keeps searching for a match during your entire search period."
- The FAQ must contain exactly 5 items and always include these two (adapted): proof of ownership ("Do I get my item back if someone turned it in?" → prove ownership, one private verification detail) and reward ("Is a reward mandatory in {State}?" → no, always your choice, unless results show a state reward rule).
- whereBody: name the state's real major airports, transit agencies and venue types found in results or widely known, and end with: "ReportLost routes your report to the right ones for your city, and the city pages below give you the exact local contacts."
- disclaimer: "This page provides general information about {State} law as of publication and is not legal advice. Procedures vary by city and department; verify details with your local authorities."
- updated: "July 2026". Law icons from: ⚖️ 🕒 🚔 📰 🏢 🏪 ✈️ 🔄 📮 🏖️.

Reply ONLY with valid JSON:
{"stateName":"...","updated":"July 2026","intro":["p1","p2"],"law":[{"icon":"...","title":"... (statute ref if verified)","body":"..."},{...},{...}],"whereTitle":"Where items end up in {State}","whereBody":"...","faq":[{"q":"...","a":"..."}x5],"disclaimer":"..."}`;

// --- États déjà couverts ---
const existing = new Set();
try {
  const hand = fs.readFileSync(HAND_PATH, "utf8");
  for (const m of hand.matchAll(/^  ([A-Z]{2}): \{/gm)) existing.add(m[1]);
} catch {}
let generated = {};
try {
  generated = JSON.parse(fs.readFileSync(GEN_PATH, "utf8"));
  Object.keys(generated).forEach((k) => existing.add(k));
} catch {}

const stateArg = process.argv.find((a) => a.startsWith("--state="))?.split("=")[1]?.toUpperCase();
const countArg = Number(process.argv.find((a) => a.startsWith("--count="))?.split("=")[1] || 5);
const todo = stateArg
  ? [stateArg].filter((s) => STATES[s])
  : Object.keys(STATES).filter((s) => !existing.has(s)).slice(0, countArg);

if (!todo.length) {
  console.log("🎉 Aucun État à générer (tout est couvert, ou --state inconnu).");
  process.exit(0);
}
console.log(`🏛️  ${todo.length} État(s) à générer : ${todo.join(", ")}\n`);

let ok = 0;
for (const code of todo) {
  const name = STATES[code];
  process.stdout.write(`  ${name} (${code}) … `);
  try {
    const queries = [
      `${name} lost property statute finder duty turn in police`,
      `${name} found property law how long police hold claim owner`,
      `${name} theft of lost mislaid property statute`,
      `${name} state code lost and found property holding period value`,
    ];
    const sets = [];
    for (const q of queries) {
      sets.push(await serper(q).catch(() => []));
      await sleep(400);
    }
    if (sets.every((s) => !s.length)) {
      console.log("⚠️ Serper sans résultats (crédits ?), État sauté");
      continue;
    }
    const results = queries
      .map((q, i) => `### ${q}\n${sets[i].map((r) => `- ${r.title}\n  ${r.link}\n  ${r.snippet}`).join("\n") || "(no results)"}`)
      .join("\n\n");

    const guide = await claude(
      SYSTEM.replaceAll("{State}", name),
      `State: ${name} (${code})\n\nSearch results (your ONLY source of legal facts):\n\n${results}`
    );

    // validation minimale
    if (!guide?.stateName || !Array.isArray(guide.law) || guide.law.length < 2 || !Array.isArray(guide.faq) || guide.faq.length !== 5) {
      console.log("⚠️ JSON incomplet, État sauté (relance-le seul avec --state=" + code + ")");
      continue;
    }
    generated[code] = guide;
    fs.writeFileSync(GEN_PATH, JSON.stringify(generated, null, 2) + "\n");
    ok++;
    console.log("✅ généré");
    await sleep(1500);
  } catch (e) {
    console.log(`⚠️ ${e.message}`);
  }
}

console.log(`\n✅ ${ok}/${todo.length} État(s) écrit(s) dans ${GEN_PATH}.`);
console.log("👉 RELIS chaque État (contenu juridique !), puis commit + push pour publier.");
console.log("👉 Pour corriger un État : édite le JSON à la main, ou relance --state=XX après l'avoir supprimé du JSON.");
