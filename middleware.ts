// middleware.ts
import { NextRequest, NextResponse } from "next/server";

// N’appliquer le middleware que sur les pages villes (perf)
export const config = {
  matcher: ["/lost-and-found/:path*"],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Normalise seulement le pathname (pas besoin de toucher aux query strings)
  const original = url.pathname;

  // 1) Retire accolades & équivalents encodés, et caractères indésirables
  let normalized = original
    // retire { } et leurs versions encodées
    .replace(/%7B/gi, "")
    .replace(/%7D/gi, "")
    .replace(/[{}\[\]()]/g, "")
    // supprime doubles tirets et espaces parasites
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  // 2) Retire un éventuel tiret terminal (ex: "/city-")
  normalized = normalized.replace(/-+$/, "");

  // Si rien n’a changé, on laisse passer
  if (normalized === original) return NextResponse.next();

  url.pathname = normalized;
  // Redirection permanente : Google mettra à jour l’index
  return NextResponse.redirect(url, 301);
}
