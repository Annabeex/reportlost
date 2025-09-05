// scripts/generate-sitemap.ts
import 'dotenv/config'   // 👈 ajoute cette ligne
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// ⚠️ Variables d'env requises (CI/CD ou local .env)
const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const BATCH_SIZE = 50000
const PUBLIC_URL = 'https://reportlost.org'
const PUBLIC_DIR = path.join(process.cwd(), 'public')

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

  // 0) Assure le dossier public/
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR)

  // 0bis) Nettoie les anciens sitemaps pour éviter les entrées périmées
  for (const f of fs.readdirSync(PUBLIC_DIR)) {
    if (/^sitemap-\d+\.xml$/.test(f)) {
      fs.unlinkSync(path.join(PUBLIC_DIR, f))
    }
  }

  // 1) Villes
  const { data: cities, error: cityError } = await supabase
    .from('us_cities')
    .select('city_ascii, state_id')
    .order('id')

  if (cityError) throw new Error('Supabase error (cities): ' + cityError.message)

  // Filtre sécurité : on garde seulement les villes avec state_id non vide
  const validCities = (cities || []).filter(
    (c) => typeof c.state_id === 'string' && c.state_id.trim().length === 2
  )

  // 2) Catégories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('name')

  if (catError) throw new Error('Supabase error (categories): ' + catError.message)

  // 3) Pages statiques
  const staticPages = [
    '/',
    '/report',
    '/privacy',
    '/terms',
    '/cookies',
    '/legal',
    '/login',
  ].map((p) => `${PUBLIC_URL}${p}`)

  // 4) Catégories
  const categoryUrls = (categories || []).map(({ name }) =>
    `${PUBLIC_URL}/category/${slugify(name)}`
  )

  // 5) États (unicité + normalisation)
  const uniqueStates = [...new Set(validCities.map(({ state_id }) => (state_id || '').toUpperCase()))]
    .filter(Boolean)
  const stateUrls = uniqueStates.map(
    (abbr) => `${PUBLIC_URL}/lost-and-found/${toStateIdSlug(abbr)}`
  )

  // 6) Villes
  const cityUrls = validCities.map(({ city_ascii, state_id }) =>
    `${PUBLIC_URL}/lost-and-found/${toStateIdSlug(state_id)}/${slugify(city_ascii)}`
  )

  // 7) Tout regrouper
  const allUrls = [...staticPages, ...categoryUrls, ...stateUrls, ...cityUrls]

  // 8) Découpe en lots et écriture sitemap-*.xml
  const sitemaps: string[] = []
  for (let i = 0; i < allUrls.length; i += BATCH_SIZE) {
    const batch = allUrls.slice(i, i + BATCH_SIZE)
    const xml = wrapUrlsInXml(batch)
    const filename = `sitemap-${sitemaps.length + 1}.xml`
    fs.writeFileSync(path.join(PUBLIC_DIR, filename), xml, 'utf8')
    sitemaps.push(filename)
    console.log(`✅ Created ${filename} with ${batch.length} URLs`)
  }

  // 9) Index
  const indexXml = buildSitemapIndex(sitemaps)
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), indexXml, 'utf8')
  console.log(`✅ sitemap.xml (index) created.`)

  // 10) (optionnel) robots.txt → assure la présence de la ligne Sitemap
  const robotsPath = path.join(PUBLIC_DIR, 'robots.txt')
  if (!fs.existsSync(robotsPath)) {
    fs.writeFileSync(robotsPath, `User-agent: *\nAllow: /\nSitemap: ${PUBLIC_URL}/sitemap.xml\n`, 'utf8')
    console.log('ℹ️ Created robots.txt with Sitemap directive.')
  } else {
    const content = fs.readFileSync(robotsPath, 'utf8')
    if (!/Sitemap:\s*https?:\/\/[^ \n]+\/sitemap\.xml/i.test(content)) {
      fs.writeFileSync(robotsPath, content.trim() + `\nSitemap: ${PUBLIC_URL}/sitemap.xml\n`, 'utf8')
      console.log('ℹ️ Updated robots.txt to include Sitemap directive.')
    }
  }
}

main().catch((e) => {
  console.error('❌ Error generating sitemap:', e)
  process.exit(1)
})
