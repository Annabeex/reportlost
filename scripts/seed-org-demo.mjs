// scripts/seed-org-demo.mjs
//
// Crée un établissement de DÉMONSTRATION avec des objets trouvés et des
// rapprochements, pour voir le rendu des écrans /org/*. Tout est marqué et
// supprimable d'un seul coup.
//
//   node scripts/seed-org-demo.mjs --email=toi@exemple.com --password=MotDePasse123
//   node scripts/seed-org-demo.mjs --purge
//
// Ce qui est créé : 1 organisation (slug demo-campus-safety), 1 compte admin,
// 6 objets trouvés, et les rapprochements correspondants.
//
// Ce qui n'est JAMAIS touché : tes déclarations de perte. Le script se
// contente de LIRE quelques lost_items existants et de fabriquer des objets
// trouvés qui leur correspondent. Le purge ne supprime donc rien de réel.

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : "";
};
const PURGE = process.argv.includes("--purge");
const SLUG = "demo-campus-safety";

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") + "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const url =
  env.match(/^SUPABASE_URL=([^\s]+)/m)?.[1] ||
  env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/m)?.[1];
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/m)?.[1];
if (!url || !key) { console.error("Clés Supabase introuvables dans .env.local"); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

const iso = (d) => new Date(d).toISOString().slice(0, 10);
const daysAgo = (n) => iso(Date.now() - n * 86400000);
const inDays = (n) => iso(Date.now() + n * 86400000);

/* ------------------------------------------------------------------ */
/* PURGE                                                               */
/* ------------------------------------------------------------------ */

async function purge() {
  const { data: org } = await sb.from("organizations").select("id, name").eq("slug", SLUG).maybeSingle();
  if (!org) { console.log("\nRien à supprimer : aucune organisation de démonstration.\n"); return; }

  const { data: items } = await sb.from("found_items").select("id").eq("org_id", org.id);
  const ids = (items || []).map((i) => i.id);

  await sb.from("org_matches").delete().eq("org_id", org.id);
  await sb.from("org_item_events").delete().eq("org_id", org.id);
  if (ids.length) await sb.from("found_items").delete().in("id", ids);
  await sb.from("org_members").delete().eq("org_id", org.id);
  await sb.from("organizations").delete().eq("id", org.id);

  console.log(`\n🧹 Supprimé : ${org.name}, ${ids.length} objet(s), rapprochements et journal.`);
  console.log("   Le compte de connexion reste actif (à supprimer dans Supabase > Authentication si tu veux).\n");
}

/* ------------------------------------------------------------------ */
/* SEED                                                                */
/* ------------------------------------------------------------------ */

// Chaque entrée fabrique un objet trouvé À PARTIR d'une vraie déclaration,
// avec un niveau de ressemblance choisi, pour montrer les trois cas :
// correspondance forte, correspondance douteuse, objet sans correspondance.
const RECIPES = [
  { kind: "strong",   ref: "F-0042", store: "Shelf B3",  foundAt: "Main library, 5th floor", ago: 5,  score: 87, level: "strong" },
  { kind: "strong",   ref: "F-0039", store: "Locker A1", foundAt: "Student center",          ago: 4,  score: 82, level: "strong" },
  { kind: "possible", ref: "F-0031", store: "Bin C",     foundAt: "Main entrance",           ago: 9,  score: 48, level: "possible" },
  { kind: "none",     ref: "F-0028", store: "Drawer 2",  foundAt: "Cafeteria",               ago: 12 },
  { kind: "none",     ref: "F-0019", store: "Shelf B1",  foundAt: "Sports hall",             ago: 29 },
  { kind: "none",     ref: "F-0011", store: "Bin A",     foundAt: "Parking structure",       ago: 30 },
];

const FILLERS = [
  { title: "Water bottle", description: "Green insulated bottle, one sticker on the side." },
  { title: "Charger",      description: "USB-C charger, black, no cable attached." },
  { title: "Scarf",        description: "Grey wool scarf, no label." },
];

async function seed() {
  const email = arg("email");
  const password = arg("password");
  if (!email || !password) {
    console.error("\nUsage : node scripts/seed-org-demo.mjs --email=toi@exemple.com --password=MotDePasse123\n");
    process.exit(1);
  }

  // 1) Des déclarations réelles à faire correspondre (lecture seule).
  const { data: losts, error: lErr } = await sb
    .from("lost_items")
    .select("id, public_id, title, description, date, city, state_id")
    .not("title", "is", null)
    .not("city", "is", null)
    .order("created_at", { ascending: false })
    .limit(40);
  if (lErr) { console.error("Lecture lost_items :", lErr.message); process.exit(1); }

  const usable = (losts || []).filter((l) => String(l.title || "").trim().length > 2);
  if (usable.length < 3) { console.error("Pas assez de déclarations existantes pour la démonstration."); process.exit(1); }

  const city = usable[0].city;
  const state = usable[0].state_id || null;

  // 2) L'organisation.
  let { data: org } = await sb.from("organizations").select("id").eq("slug", SLUG).maybeSingle();
  if (!org) {
    const { data, error } = await sb
      .from("organizations")
      .insert({
        slug: SLUG,
        name: "Demo University — Campus Safety",
        type: "university",
        state_id: state,
        city,
        public_email: "lostandfound@demo.edu",
        verified: true,
      })
      .select("id")
      .single();
    if (error) { console.error("Création organisation :", error.message); process.exit(1); }
    org = data;
  }

  // 3) Le compte de connexion.
  let userId = null;
  const created = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.data?.user) userId = created.data.user.id;
  else {
    // Déjà existant : on le retrouve.
    const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
    userId = list?.users?.find((u) => (u.email || "").toLowerCase() === email.toLowerCase())?.id || null;
    if (!userId) { console.error("Compte introuvable et non créé :", created.error?.message); process.exit(1); }
    console.log("ℹ️  Compte déjà existant, mot de passe inchangé.");
  }
  await sb.from("org_members").upsert(
    { org_id: org.id, user_id: userId, role: "admin" },
    { onConflict: "org_id,user_id" }
  );

  // 4) Les objets trouvés.
  const rows = [];
  const pairs = [];
  let fillerIndex = 0;

  RECIPES.forEach((r, i) => {
    const src = usable[i % usable.length];
    let title, description;

    if (r.kind === "strong") {
      // Même objet, décrit avec les mots d'un agent.
      title = String(src.title).trim();
      description = String(src.description || src.title).trim().slice(0, 300);
    } else if (r.kind === "possible") {
      // Même type d'objet, mais une couleur qui ne colle pas.
      title = String(src.title).trim();
      description = `Similar item, different colour from the description on file.`;
    } else {
      const f = FILLERS[fillerIndex++ % FILLERS.length];
      title = f.title;
      description = f.description;
    }

    rows.push({
      org_id: org.id,
      org_ref: r.ref,
      title,
      description,
      date: daysAgo(r.ago),
      city,
      dropoff_location: r.foundAt,
      storage_location: r.store,
      status: "stored",
      legal_deadline: inDays(30 - r.ago),
      public_visible: true,
      public_label: title.split(/\s+/).slice(0, 2).join(" "),
      labels: [],
      logos: [],
      objects: [],
      ocr_text: "",
    });
    if (r.score) pairs.push({ idx: rows.length - 1, lost: src, score: r.score, level: r.level, kind: r.kind });
  });

  const { data: inserted, error: fErr } = await sb.from("found_items").insert(rows).select("id, org_ref, title");
  if (fErr) { console.error("Création objets trouvés :", fErr.message); process.exit(1); }

  // 5) Les rapprochements. Valeurs posées pour la démonstration : le vrai
  //    moteur tourne à l'enregistrement d'un objet depuis l'interface.
  const matchRows = pairs.map((p) => {
    const f = inserted[p.idx];
    return {
      lost_item_id: p.lost.id,
      found_item_id: f.id,
      org_id: org.id,
      score: p.score,
      level: p.level,
      reasons:
        p.kind === "strong"
          ? ["Same item type", "Found within a few days of the loss", "Colour in common", "Several terms in common"]
          : ["Same item type", "Different colours from the description on file"],
      status: "new",
    };
  });
  const { error: mErr } = await sb.from("org_matches").insert(matchRows);
  if (mErr) console.error("⚠️ Rapprochements :", mErr.message);

  // 6) Un peu de journal, pour que l'écran Registre ne soit pas vide.
  await sb.from("org_item_events").insert(
    inserted.map((f) => ({
      org_id: org.id,
      item_id: String(f.id),
      type: "created",
      note: `Enregistré : ${f.title}`,
      actor_email: email,
    }))
  );

  console.log(`
✅ Démonstration en place.

   Organisation : Demo University — Campus Safety  (${city}${state ? ", " + state : ""})
   Objets       : ${inserted.length}
   À traiter    : ${matchRows.length} rapprochement(s)

   Connexion    : ${email}
   Mot de passe : celui que tu viens de choisir

   Écrans       : /org/login  puis  /org/review  ·  /org/dashboard  ·  /org/items/new

   Pour tout retirer : node scripts/seed-org-demo.mjs --purge
`);
}

await (PURGE ? purge() : seed());
