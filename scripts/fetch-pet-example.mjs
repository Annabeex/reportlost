// scripts/fetch-pet-example.mjs
// Télécharge une photo de chien libre de droits (Pexels) comme exemple
// de l'affiche animal perdu. À lancer une fois : node scripts/fetch-pet-example.mjs
// Licence Pexels : utilisation libre, attribution non requise.
import fs from "fs";

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") +
  "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const key = env.match(/PEXELS_API_KEY=([^\s]+)/)?.[1];
if (!key) {
  console.error("PEXELS_API_KEY introuvable dans .env.local / .env");
  process.exit(1);
}

const search = await fetch(
  "https://api.pexels.com/v1/search?query=dog%20portrait%20outdoor&orientation=landscape&per_page=10",
  { headers: { Authorization: key } }
);
if (!search.ok) {
  console.error("Pexels:", search.status, await search.text());
  process.exit(1);
}
const data = await search.json();
const photo = data.photos?.[0];
if (!photo) {
  console.error("Aucune photo trouvée");
  process.exit(1);
}

const img = await fetch(photo.src.large2x || photo.src.large);
fs.writeFileSync("public/images/lost-pet-example.jpg", Buffer.from(await img.arrayBuffer()));
console.log(`✅ Sauvé : public/images/lost-pet-example.jpg`);
console.log(`   Photo par ${photo.photographer} — ${photo.url}`);
console.log(`   (si elle ne te plaît pas, relance avec une autre requête dans le script,`);
console.log(`    ex: "golden retriever portrait", "cute dog park")`);
