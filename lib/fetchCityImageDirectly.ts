export default async function fetchCityImageDirectly(
  city: string,
  state: string
): Promise<{
  url: string | null;
  alt: string;
  photographer: string | null;
  source_url: string | null;
}> {
  const query = `${city} ${state} skyline`;

  const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
    headers: {
      Authorization: process.env.PEXELS_API_KEY || '',
    },
    next: { revalidate: 3600 } // ⏳ facultatif : cache ISR 1h
  });

  if (!res.ok) {
    console.error(`Error fetching from Pexels: ${res.status}`);
    return {
      url: null,
      alt: `Skyline of ${city}, ${state}`,
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
