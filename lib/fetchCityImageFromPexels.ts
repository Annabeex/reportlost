export default async function fetchCityImageFromPexels(city: string, state: string): Promise<{
  url: string | null;
  alt: string;
  photographer: string | null;
  source_url: string | null;
}> {
  const query = `${city} ${state} skyline`;

  const res = await fetch(`/api/pexels?query=${encodeURIComponent(query)}`, {
    cache: 'no-store', // ou { next: { revalidate: 3600 } si nécessaire côté server
  });

  if (!res.ok) {
    console.error(`Local API /api/pexels error: ${res.status}`);
    return {
      url: null,
      alt: `View of ${city}, ${state}`,
      photographer: null,
      source_url: null,
    };
  }

  const data = await res.json();
  const photo = data.photos?.[0];

  return {
    url: photo?.src?.medium || null,
    alt: photo?.alt || `Skyline of ${city}, ${state}`,
    photographer: photo?.photographer || null,
    source_url: photo?.url || null,
  };
}
