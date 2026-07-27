// scripts/generate-city-guides-batch.mjs
// Génère et PUBLIE des guides ville par lot (ordre de population), marqués
// "non vérifié" : la relecture se fait a posteriori dans /admin/city-guides
// (badge orange "à vérifier" + bouton "Marquer vérifié" / édition du contenu).
//
// Usage :
//   node scripts/generate-city-guides-batch.mjs 10        → les 10 prochaines villes sans guide
//   node scripts/generate-city-guides-batch.mjs 25        → les 25 prochaines, etc.
//
// Identifiants lus dans .env.local / .env (ADMIN_USER / ADMIN_PASS).

import fs from "fs";

const BASE = process.env.SITE_URL || "https://reportlost.org";
const COUNT = Math.max(1, Number(process.argv[2] || 5));
const DELAY_MS = 3000; // pause entre deux villes (Serper + Anthropic)

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") +
  "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const user = env.match(/ADMIN_USER=([^\s]+)/)?.[1];
const pass = env.match(/ADMIN_PASS=([^\s]+)/)?.[1];
if (!user || !pass) {
  console.error("ADMIN_USER / ADMIN_PASS introuvables dans .env.local");
  process.exit(1);
}
const AUTH = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 🔒 Verrou anti-lancements parallèles : deux batchs simultanés travaillent sur
// la même liste et régénèrent les mêmes villes (argent brûlé pour rien).
const LOCK = "/tmp/reportlost-batch.lock";
if (fs.existsSync(LOCK)) {
  const age = (Date.now() - fs.statSync(LOCK).mtimeMs) / 60000;
  if (age < 360) {
    console.error(`⛔ Un batch semble déjà en cours (verrou posé il y a ${age.toFixed(0)} min).`);
    console.error(`   Vérifie avec: ps aux | grep generate-city-guides | grep -v grep`);
    console.error(`   Si aucun processus ne tourne, supprime le verrou: rm ${LOCK}`);
    process.exit(1);
  }
}
fs.writeFileSync(LOCK, String(process.pid));
const releaseLock = () => { try { fs.unlinkSync(LOCK); } catch {} };
process.on("exit", releaseLock);
process.on("SIGINT", () => { releaseLock(); process.exit(130); });
process.on("SIGTERM", () => { releaseLock(); process.exit(143); });

// 1) Liste de travail : villes par population, sans guide existant
const listRes = await fetch(`${BASE}/api/admin/city-guide?cities=1&limit=6000`, {
  headers: { Authorization: AUTH },
});
if (!listRes.ok) {
  console.error("Impossible de récupérer la liste des villes:", listRes.status, await listRes.text());
  process.exit(1);
}
const { cities } = await listRes.json();
const todo = (cities || []).filter((c) => !c.guide_status).slice(0, COUNT);

if (!todo.length) {
  console.log("🎉 Aucune ville sans guide dans le top 6000 — tout est déjà généré.");
  process.exit(0);
}

console.log(`🏙️  ${todo.length} ville(s) à générer et publier (non vérifiées) :\n`);

let ok = 0;
let ko = 0;
for (const [i, c] of todo.entries()) {
  process.stdout.write(`  ${i + 1}/${todo.length} ${c.city} (${c.state}), pop. ${c.population?.toLocaleString?.() || "?"} … `);
  // 🛡️ Re-vérifie juste avant de générer (protège des listes périmées / doublons)
  try {
    const chk = await fetch(
      `${BASE}/api/admin/city-guide?state=${encodeURIComponent(c.state)}&city=${encodeURIComponent(c.city.toLowerCase())}`,
      { headers: { Authorization: AUTH } }
    );
    const cj = await chk.json().catch(() => ({}));
    if (cj?.row?.status) {
      console.log(`⏭️ déjà ${cj.row.status}, ignoré`);
      continue;
    }
  } catch {
    /* en cas de doute on laisse générer */
  }
  let done = false;
  const MAX_ATTEMPTS = 4;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !done; attempt++) {
    try {
      const r = await fetch(`${BASE}/api/admin/city-guide-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: AUTH },
        body: JSON.stringify({ city: c.city, state: c.state, autoPublish: true }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        ok++;
        console.log("✅ publié (non vérifié)");
        done = true;
      } else {
        const msg = String(j.error || r.status);
        // API Anthropic saturée (529/429) ou indispo passagère : on attend et on réessaie,
        // la saturation se dissipe généralement en 1 à 2 minutes.
        const transient = /529|429|503|overloaded|rate limit/i.test(msg);
        if (transient && attempt < MAX_ATTEMPTS) {
          const wait = 30_000 * attempt; // 30 s, 60 s, 90 s
          process.stdout.write(`API saturée, retry dans ${wait / 1000} s… `);
          await sleep(wait);
        } else {
          ko++;
          console.log(`⚠️ ${msg}${attempt > 1 ? ` (${attempt} tentatives)` : ""}`);
          done = true;
        }
      }
    } catch (e) {
      if (attempt < MAX_ATTEMPTS) {
        process.stdout.write(`réseau (${e.message}), retry dans 10 s… `);
        await sleep(10_000);
      } else {
        ko++;
        console.log(`⚠️ ${e.message} (${MAX_ATTEMPTS} tentatives)`);
      }
    }
  }
  if (i < todo.length - 1) await sleep(DELAY_MS);
}

console.log(`\n✅ ${ok} guide(s) publié(s) (non vérifiés)${ko ? `, ⚠️ ${ko} échec(s)` : ""}.`);
console.log("👉 Relis-les quand tu peux dans https://reportlost.org/admin/city-guides (badge orange « à vérifier »).");
