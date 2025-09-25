// retry-wikimedia.js
// Usage (from tools/download-city-images):
// node retry-wikimedia.js [failed-log-file] [output-folder]
//
// Defaults:
// failed-log-file = ../../public/images/cities/failed-downloads.log
// output-folder = ../../public/images/cities

import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import sharp from "sharp";

const [, , failedLogArg, outDirArg] = process.argv;
const DEFAULT_FAILED = path.resolve("../../public/images/cities/failed-downloads.log");
const failedLog = failedLogArg ? path.resolve(failedLogArg) : DEFAULT_FAILED;
const outDir = outDirArg ? path.resolve(outDirArg) : path.resolve("../../public/images/cities");

function normalizeName(s) {
  return s.trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[,']/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-").replace(/^\-+|\-+$/g, "");
}
async function ensureDir(d){ await fs.mkdir(d, { recursive: true }); }
async function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function fetchSummaryThumbnail(titleOrCity) {
  const enc = encodeURIComponent(titleOrCity);
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${enc}`;
  const res = await fetch(url, { redirect: "follow", timeout: 20000 });
  if (!res.ok) return null;
  const j = await res.json();
  if (j && j.thumbnail && j.thumbnail.source) return j.thumbnail.source;
  return null;
}

async function wikiSearchFirstTitle(query) {
  // Use the MediaWiki search API to find a likely page title
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json`;
  const res = await fetch(url, { timeout: 20000 });
  if (!res.ok) return null;
  const j = await res.json();
  const hits = j?.query?.search;
  if (hits && hits.length > 0) return hits[0].title;
  return null;
}

async function commonsSearchImageUrl(query) {
  // Search on Wikimedia Commons for image file pages (namespace=6)
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5&format=json`;
  const res = await fetch(url, { timeout: 20000 });
  if (!res.ok) return null;
  const j = await res.json();
  const hits = j?.query?.search;
  if (!hits || hits.length === 0) return null;
  // Try to get the image info URL for the first hit
  for (const h of hits) {
    const title = h.title; // like "File:Example.jpg"
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json`;
    try {
      const r2 = await fetch(infoUrl, { timeout: 20000 });
      if (!r2.ok) continue;
      const j2 = await r2.json();
      const pages = j2?.query?.pages;
      if (!pages) continue;
      for (const k of Object.keys(pages)) {
        const pi = pages[k]?.imageinfo;
        if (pi && pi.length > 0 && pi[0].url) return pi[0].url;
      }
    } catch(e) { /* continue to next hit */ }
  }
  return null;
}

async function downloadAndSave(url, destPath) {
  const resp = await fetch(url, { redirect: "follow", timeout: 30000 });
  if (!resp.ok) throw new Error(`Failed download ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  const out = await sharp(buf).resize({ width: 1200 }).jpeg({ quality: 70 }).toBuffer();
  await fs.writeFile(destPath, out);
}

// main
(async () => {
  await ensureDir(outDir);
  // read failed list
  let raw;
  try {
    raw = await fs.readFile(failedLog, "utf8");
  } catch (e) {
    console.error("Impossible de lire le fichier failed log:", failedLog, e.message || e);
    process.exit(1);
  }
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  // extract unique city names (lines like "City -> ...")
  const cities = Array.from(new Set(lines.map(l => l.split("->")[0].trim())));
  console.log("Retrying", cities.length, "cities from", failedLog);

  const succeeded = [];
  const finalFailed = [];

  for (const city of cities) {
    const filename = normalizeName(city) + ".jpg";
    const dest = path.join(outDir, filename);

    try {
      console.log("=== processing:", city);

      // 1) try summary for city as-is
      let url = await fetchSummaryThumbnail(city);
      if (url) {
        console.log("found summary thumbnail for", city, "->", url);
        await downloadAndSave(url, dest);
        succeeded.push(city);
        await sleep(600);
        continue;
      }

      // 2) if line contains comma (City, State) try that explicitly (already maybe same)
      if (city.includes(",")) {
        url = await fetchSummaryThumbnail(city);
        if (url) {
          console.log("found summary thumbnail with comma for", city, "->", url);
          await downloadAndSave(url, dest);
          succeeded.push(city);
          await sleep(600);
          continue;
        }
      }

      // 3) try searching for a better page title
      const title = await wikiSearchFirstTitle(city);
      if (title) {
        console.log("wiki search returned title:", title);
        url = await fetchSummaryThumbnail(title);
        if (url) {
          console.log("found thumbnail from title", title, "->", url);
          await downloadAndSave(url, dest);
          succeeded.push(city);
          await sleep(800);
          continue;
        }
      }

      // 4) try commons search for images
      const commonsQuery = `${city} skyline OR ${city} city`;
      const commonsUrl = await commonsSearchImageUrl(commonsQuery);
      if (commonsUrl) {
        console.log("found commons image for", city, "->", commonsUrl);
        await downloadAndSave(commonsUrl, dest);
        succeeded.push(city);
        await sleep(1000);
        continue;
      }

      // nothing worked
      console.warn("still failed for", city);
      finalFailed.push(city);
      await fs.appendFile(path.join(outDir, "failed-downloads-retry.log"), `${city} -> no-image\n`);
      await sleep(800);
    } catch (err) {
      console.error("error processing", city, err.message || err);
      finalFailed.push(city);
      await fs.appendFile(path.join(outDir, "failed-downloads-retry.log"), `${city} -> ${err.message || err}\n`);
      await sleep(1200);
    }
  }

  console.log("DONE. succeeded:", succeeded.length, "failed remaining:", finalFailed.length);
  if (finalFailed.length) {
    console.log("See", path.join(outDir, "failed-downloads-retry.log"));
  }
})();
