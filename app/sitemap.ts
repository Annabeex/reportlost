// app/sitemap.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const staticUrls = [
    '/',
    '/about',
    '/contact',
    '/reportform',
    '/report',
    '/legal',
    '/privacy',
    '/cookies',
    '/faq',
    '/help',
    '/team',
    '/careers',
  ];

  const { data: cities } = await supabase
    .from('cities')
    .select('slug,state_slug')
    .limit(1000); // ajuste si nécessaire

  const dynamicUrls = (cities || []).map((city) => {
    return `/${city.state_slug}/${city.slug}`;
  });

  const allUrls = [...staticUrls, ...dynamicUrls];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls
    .map(
      (url) => `
    <url>
      <loc>${process.env.NEXT_PUBLIC_SITE_URL}${url}</loc>
    </url>
  `
    )
    .join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
