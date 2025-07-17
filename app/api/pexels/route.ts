// app/api/pexels/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');

  if (!query) {
    return new NextResponse(JSON.stringify({ photos: [] }), {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const res = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
    headers: {
      Authorization: process.env.PEXELS_API_KEY || '',
    },
  });

  if (!res.ok) {
    return new NextResponse(JSON.stringify({ photos: [] }), {
      status: res.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const data = await res.json();

  return new NextResponse(JSON.stringify(data), {
    headers: {
      'Access-Control-Allow-Origin': '*', // ✅ autorise les appels du client
      'Content-Type': 'application/json',
    },
  });
}
