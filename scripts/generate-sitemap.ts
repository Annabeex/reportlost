import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mfxjzvqtkespoichhnkk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGp6dnF0a2VzcG9pY2hobmtrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODgwMDA2OSwiZXhwIjoyMDY0Mzc2MDY5fQ.4uf5ZSeApal9pXldVM6CYPKNKPcDguWwoQOTZgeU_-s'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const BATCH_SIZE = 50000
const PUBLIC_URL = 'https://reportlost.org'

async function main() {
  console.log('🔄 Generating sitemap from Supabase...')

  // 📦 Villes
  const { data: cities, error: cityError } = await supabase
    .from('us_cities')
    .select('city_ascii, main_zip, state_id')
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
    '/reportform',
    '/privacy',
    '/terms',
    '/cookies',
    '/legal',
    '/login'
  ].map((path) => `${PUBLIC_URL}${path}`)

  // 🔗 Pages catégories
  const categoryUrls = (categories || []).map(({ name }) =>
    `${PUBLIC_URL}/category/${slugify(name)}`
  )

  // 🔗 Pages états depuis les villes (unicité par `state_id`)
  const uniqueStates = [...new Set((cities || []).map(({ state_id }) => state_id))]
  const stateUrls = uniqueStates.map(
    (state) => `${PUBLIC_URL}/states/${slugify(state)}`
  )

  // 🔗 Pages villes
  const cityUrls = (cities || []).map(({ city_ascii, main_zip }) =>
    `${PUBLIC_URL}/lost-and-found/${slugify(city_ascii)}-${main_zip}`
  )

  // 🔗 URLs finales à regrouper
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

  // 📄 Génération du fichier index
  const indexXml = buildSitemapIndex(sitemaps)
  fs.writeFileSync(path.join(sitemapDir, 'sitemap.xml'), indexXml, 'utf8')
  console.log(`✅ sitemap.xml (index) created.`)
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function wrapUrlsInXml(urls: string[]) {
  const now = new Date().toISOString()
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `<url><loc>${url}</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`
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

main().catch((e) => {
  console.error('❌ Error generating sitemap:', e)
  process.exit(1)
})
