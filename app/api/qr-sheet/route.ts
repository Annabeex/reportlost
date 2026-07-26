// app/api/qr-sheet/route.ts
// Alias historique : redirige vers /api/sticker-sheet (la route canonique,
// liée depuis l'admin et la page de suivi client).
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  url.pathname = "/api/sticker-sheet";
  return NextResponse.redirect(url, 307);
}
