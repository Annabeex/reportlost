'use client';

import { createClient } from '@supabase/supabase-js';
import ReportForm from '@/components/ReportForm';
import '../../../app/globals.css';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ Déplacé ici
type PexelsPhoto = {
  src: { large: string };
  alt?: string;
  photographer?: string;
  url?: string;
};

type PexelsResponse = {
  photos: PexelsPhoto[];
};

interface Props {
  params: { state: string; city: string };
}

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function fetchCityImageFromPexels(
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
      Authorization: process.env.PEXELS_API_KEY!
    }
  });

  const responseData: PexelsResponse = await res.json();
  const photo = responseData.photos?.[0];

  return {
    url: photo?.src?.large || null,
    alt: photo?.alt || `Skyline of ${city}, ${state} – aerial view`,
    photographer: photo?.photographer || null,
    source_url: photo?.url || null
  };
}
