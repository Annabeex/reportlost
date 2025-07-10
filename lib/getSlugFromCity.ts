export function getSlugFromCity(city: string, zip: string): string {
  return `${city.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}-${zip}`;
}

export function parseSlugToCityZip(slug: string): { city: string; zip: string } {
  const match = slug.match(/^(.*)-(\d{5})$/);
  if (!match) return { city: slug.replace(/-/g, ' '), zip: '' };
  const city = match[1].replace(/-/g, ' ');
  const zip = match[2];
  return { city, zip };
}
