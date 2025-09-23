export default function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export const toCitySlug = (s: string) => slugify(s)
export const fromCitySlug = (s: string) => s.replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
export const toStateIdSlug = (s: string) => (s || '').toLowerCase()
export const buildCityPath = (state_id: string, city_ascii: string) =>
  `/lost-and-found/${toStateIdSlug(state_id)}/${toCitySlug(city_ascii)}`
