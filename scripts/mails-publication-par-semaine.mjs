// scripts/mails-publication-par-semaine.mjs
// Lecture seule. Par semaine : dépôts gratuits enregistrés vs mail de publication
// réellement parti. Sert à mesurer combien de clients repartent sans leur mail.
//   node scripts/mails-publication-par-semaine.mjs [nb_semaines]

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") + "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const url =
  env.match(/^SUPABASE_URL=([^\s]+)/m)?.[1] ||
  env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/m)?.[1];
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/m)?.[1];
const sb = createClient(url, key, { auth: { persistSession: false } });

const WEEKS = Math.max(2, Number(process.argv[2] || 12));
const since = new Date(Date.now() - WEEKS * 7 * 864e5).toISOString();

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb
    .from("lost_items")
    .select("created_at, contribution, email, mail_sent, publication_mail_sent")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < 1000) break;
}

const lundi = (iso) => {
  const d = new Date(iso);
  const j = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - j);
  return d.toISOString().slice(0, 10);
};

const sem = new Map();
for (const r of rows) {
  const k = lundi(r.created_at);
  if (!sem.has(k)) sem.set(k, { tot: 0, payes: 0, gratuits: 0, mailOk: 0, mailKo: 0, sansEmail: 0 });
  const s = sem.get(k);
  s.tot++;
  if (Number(r.contribution) > 0) { s.payes++; continue; }
  s.gratuits++;
  if (!r.email) { s.sansEmail++; continue; }
  if (r.publication_mail_sent || r.mail_sent) s.mailOk++; else s.mailKo++;
}

console.log("\nsemaine      dépôts  payés  gratuits   mail parti   sans mail   taux");
console.log("─".repeat(74));
for (const [k, s] of [...sem.entries()].sort()) {
  const base = s.mailOk + s.mailKo;
  const taux = base ? `${((100 * s.mailOk) / base).toFixed(0)} %` : "—";
  console.log(
    `${k}   ${String(s.tot).padStart(5)}  ${String(s.payes).padStart(5)}` +
    `  ${String(s.gratuits).padStart(8)}   ${String(s.mailOk).padStart(10)}` +
    `  ${String(s.mailKo).padStart(10)}   ${taux.padStart(5)}`
  );
}
const tot = [...sem.values()].reduce((a, s) => ({ ok: a.ok + s.mailOk, ko: a.ko + s.mailKo }), { ok: 0, ko: 0 });
console.log("─".repeat(74));
console.log(`Total sur ${WEEKS} semaines : ${tot.ok} mails partis, ${tot.ko} clients gratuits sans mail.\n`);
