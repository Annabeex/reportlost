// scripts/generateSitemap.ts
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// ⚠️ Utilise des variables d'env pour éviter les clés en dur
const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY! // ou une clé adaptée à ton environnement CI

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const BATCH_SIZE = 50000
const PUBLIC_URL = 'https://reportlost.org'

function slugify(str: string) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)+/g, '')
}

function toStateIdSlug(s: string) {
  return (s || '').toLowerCase()
}

function wrapUrlsInXml(urls: string[]) {
  const now = new Date().toISOString()
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) =>
      `<url><loc>${url}</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`
  )
  .join('\n')}
</urlset>`
}

function buildSitemapIndex(files: string[]) {
  const now = new Date().toISOString()
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files
  .map(
    (file) =>
      `<sitemap><loc>${PUBLIC_URL}/${file}</loc><lastmod>${now}</lastmod></sitemap>`
  )
  .join('\n')}
</sitemapindex>`
}

async function main() {
  console.log('🔄 Generating sitemap from Supabase...')

  // 📦 Villes (ne prends plus main_zip)
  const { data: cities, error: cityError } = await supabase
    .from('us_cities')
    .select('city_ascii, state_id')
    .order('id')

  if (cityError) throw new Error('Supabase error (cities): ' + cityError.message)

  // 📦 Catégories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('name')

  if (catError) throw new Error('Supabase error (categories): ' + catError.message)

  // 🔗 Pages statiques
  const staticPages = [
    '/',
    '/report',      // ← si la page s’appelle /report et plus /reportform
    '/privacy',
    '/terms',
    '/cookies',
    '/legal',
    '/login',
  ].map((p) => `${PUBLIC_URL}${p}`)

  // 🔗 Pages catégories
  const categoryUrls = (categories || []).map(({ name }) =>
    `${PUBLIC_URL}/category/${slugify(name)}`
  )

  // 🔗 Pages états (unicité par state_id) → /lost-and-found/{state}
  const uniqueStates = [...new Set((cities || []).map(({ state_id }) => (state_id || '').toUpperCase()))]
  const stateUrls = uniqueStates.map(
    (abbr) => `${PUBLIC_URL}/lost-and-found/${toStateIdSlug(abbr)}`
  )

  // 🔗 Pages villes → /lost-and-found/{state}/{city}
  const cityUrls = (cities || []).map(({ city_ascii, state_id }) =>
    `${PUBLIC_URL}/lost-and-found/${toStateIdSlug(state_id)}/${slugify(city_ascii)}`
  )

  // 🔗 URLs finales
  const allUrls = [...staticPages, ...categoryUrls, ...stateUrls, ...cityUrls]

  // 📄 Génération des fichiers sitemap-*.xml
  const sitemapDir = path.join(process.cwd(), 'public')
  if (!fs.existsSync(sitemapDir)) fs.mkdirSync(sitemapDir)

  const sitemaps: string[] = []
  for (let i = 0; i < allUrls.length; i += BATCH_SIZE) {
    const batch = allUrls.slice(i, i + BATCH_SIZE)
    const xml = wrapUrlsInXml(batch)
    const filename = `sitemap-${sitemaps.length + 1}.xml`
    fs.writeFileSync(path.join(sitemapDir, filename), xml, 'utf8')
    sitemaps.push(filename)
    console.log(`✅ Created ${filename} with ${batch.length} URLs`)
  }

  // 📄 Index
  const indexXml = buildSitemapIndex(sitemaps)
  fs.writeFileSync(path.join(sitemapDir, 'sitemap.xml'), indexXml, 'utf8')
  console.log(`✅ sitemap.xml (index) created.`)
}

main().catch((e) => {
  console.error('❌ Error generating sitemap:', e)
  process.exit(1)
})
