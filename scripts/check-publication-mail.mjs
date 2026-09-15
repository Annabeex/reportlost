// scripts/check-publication-mail.mjs
// Lecture seule. Vérifie pourquoi l'e-mail de publication gratuite ne part pas.
//   node scripts/check-publication-mail.mjs

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") + "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const url =
  env.match(/^SUPABASE_URL=([^\s]+)/m)?.[1] ||
  env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/m)?.[1];
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/m)?.[1];
if (!url || !key) { console.error("Clés Supabase introuvables"); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

// 1) La colonne existe-t-elle ?
const probe = await sb.from("lost_items").select("publication_mail_sent").limit(1);
if (probe.error) {
  console.log(`\n❌ Colonne publication_mail_sent ABSENTE.`);
  console.log(`   Supabase répond : ${probe.error.message}`);
  console.log(`\n   C'est la cause : la route /api/public/send-publication-email`);
  console.log(`   échoue en 500 et le formulaire avale l'erreur (.catch vide).`);
  console.log(`\n   👉 À exécuter dans le SQL editor Supabase :\n`);
  console.log(`   alter table lost_items`);
  console.log(`     add column if not exists publication_mail_sent boolean not null default false;\n`);
  process.exit(0);
}
console.log("\n✅ Colonne publication_mail_sent présente.\n");

// 2) Les derniers dépôts, pour voir l'état réel
const { data, error } = await sb
  .from("lost_items")
  .select("public_id, created_at, contribution, email, mail_sent, publication_mail_sent")
  .order("created_at", { ascending: false })
  .limit(8);
if (error) { console.error("Erreur lecture:", error.message); process.exit(1); }

console.log("réf     créé                 contrib  email  mail_sent  publication_mail_sent");
for (const r of data) {
  console.log(
    String(r.public_id || "—").padEnd(7),
    String(r.created_at || "").slice(0, 19).padEnd(20),
    String(r.contribution ?? 0).padStart(6),
    (r.email ? "oui" : "NON").padEnd(6),
    String(!!r.mail_sent).padEnd(10),
    String(!!r.publication_mail_sent)
  );
}
console.log(`
Lecture :
  contribution = 0 et publication_mail_sent = false  → l'e-mail aurait dû partir
  publication_mail_sent = true                       → il est déjà parti une fois
  email = NON                                        → aucune adresse, rien à envoyer
`);
