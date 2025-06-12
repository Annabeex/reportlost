// app/sitemap.ts

export default async function sitemap() {
  return [
    {
      url: '/',
      lastModified: new Date().toISOString(),
    },
    {
      url: '/report',
      lastModified: new Date().toISOString(),
    },
    {
      url: '/legal',
      lastModified: new Date().toISOString(),
    },
    {
      url: '/privacy',
      lastModified: new Date().toISOString(),
    },
    {
      url: '/terms',
      lastModified: new Date().toISOString(),
    },
    {
      url: '/cookies',
      lastModified: new Date().toISOString(),
    },
  ];
}
