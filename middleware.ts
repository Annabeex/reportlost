// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/lost-and-found/:path*",

    // UI admin
    "/admin/:path*",
    "/poster-preview/:path*",

    // APIs sensibles (service-role derrière)
    "/api/admin/:path*",
    "/api/stations/update",

    // pages case (lecture publique OK, mais on protège l’édition ?edit=1)
    "/case/:path*",
  ],
};

function requireBasicAuth(req: NextRequest) {
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

  return null;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // --------------------------------------------------
  // 1) PROTECTION ADMIN (UI + API sensibles)
  // --------------------------------------------------
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/poster-preview") ||
    pathname.startsWith("/api/admin") ||
    pathname === "/api/stations/update"
  ) {
    const res = requireBasicAuth(req);
    if (res) return res;
    return NextResponse.next();
  }

  // --------------------------------------------------
  // 2) Protection édition des /case (uniquement si ?edit=1|true|yes)
  //    Lecture publique OK.
  // --------------------------------------------------
  if (pathname.startsWith("/case")) {
    const edit = (searchParams.get("edit") || "").toLowerCase();
    const isEdit = ["1", "true", "yes"].includes(edit);

    if (isEdit) {
      const res = requireBasicAuth(req);
      if (res) return res;
    }

    return NextResponse.next();
  }

  // --------------------------------------------------
  // 3) Normalisation SEO pour /lost-and-found
  // --------------------------------------------------
  if (pathname.startsWith("/lost-and-found")) {
    const url = req.nextUrl.clone();
    const original = url.pathname;

    const normalized = original
      .replace(/%7B/gi, "")
      .replace(/%7D/gi, "")
      .replace(/[{}\[\]()]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/-+$/, "");

    if (normalized !== original) {
      url.pathname = normalized;
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}
