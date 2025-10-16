// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export const config = {
  // On cible à la fois les pages villes ET l'admin
  matcher: ["/lost-and-found/:path*", "/admin/:path*"],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- 1) Protection Basic Auth pour /admin ---
  if (pathname.startsWith("/admin")) {
    const user = process.env.ADMIN_USER || "";
    const pass = process.env.ADMIN_PASS || "";

    if (!user || !pass) {
      return new Response("Admin not configured", { status: 500 });
    }

    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Basic ")) {
      return new Response("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="ReportLost Admin"' },
      });
    }

    // Décodage Basic <base64(login:password)>
    const base64 = auth.split(" ")[1] ?? "";
    let decoded = "";
    try {
      decoded = atob(base64);
    } catch {
      return new Response("Invalid auth header", { status: 400 });
    }
    const [login, password] = decoded.split(":");

    if (login !== user || password !== pass) {
      return new Response("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="ReportLost Admin"' },
      });
    }

    // Auth OK -> on laisse passer
    return NextResponse.next();
  }

  // --- 2) Normalisation des URLs pour /lost-and-found ---
  if (pathname.startsWith("/lost-and-found")) {
    const url = req.nextUrl.clone();
    const original = url.pathname;

    let normalized = original
      .replace(/%7B/gi, "")
      .replace(/%7D/gi, "")
      .replace(/[{}\[\]()]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/-+$/, "");

    if (normalized === original) return NextResponse.next();

    url.pathname = normalized;
    return NextResponse.redirect(url, 301);
  }

  // Par défaut
  return NextResponse.next();
}
