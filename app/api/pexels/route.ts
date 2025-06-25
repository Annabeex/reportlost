// app/api/pexels/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');

  if (!query) return NextResponse.json({ photos: [] });

  const res = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
    headers: {
      Authorization: process.env.PEXELS_API_KEY || ''
    }
  });

  if (!res.ok) return NextResponse.json({ photos: [] });

  const data = await res.json();
  return NextResponse.json(data);
}
