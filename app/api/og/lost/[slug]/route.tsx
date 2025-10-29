// app/api/og/lost/[slug]/route.tsx
import { ImageResponse } from "next/og";

export const runtime = process.env.VERCEL ? "edge" : "nodejs";

type Row = {
  title: string | null;
  description: string | null;
  city: string | null;
  state_id: string | null;
  public_id: string | null;
};

const FONT_STACK =
  "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

function safe(v: unknown, max = 140) {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function errorImage(msg: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#ffffff",
          color: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT_STACK,
        }}
      >
        <div style={{ display: "block", fontSize: 44, textAlign: "center", maxWidth: 1000 }}>
          {msg}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const q = new URL(req.url).searchParams;

  if (q.get("debug") === "1") {
    return new Response(
      JSON.stringify({
        ok: true,
        slug: params.slug,
        env: {
          hasURL: !!process.env.SUPABASE_URL,
          hasKEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          runtime,
        },
      }),
      { headers: { "content-type": "application/json" } }
    );
  }

  // Garde le mode simple si besoin de vérifier rapidement le pipeline
  if (q.get("simple") === "1") {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            background: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_STACK,
          }}
        >
          <div
            style={{
              display: "flex",
              background: "#f97316",
              color: "#ffffff",
              borderRadius: 20,
              paddingTop: 24,
              paddingBottom: 24,
              paddingLeft: 48,
              paddingRight: 48,
              fontSize: 80,
              fontWeight: 900,
              letterSpacing: 2,
            }}
          >
            LOST
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return new Response("Supabase env missing", { status: 500 });

    const qs =
      "select=title,description,city,state_id,public_id&slug=eq." +
      encodeURIComponent(params.slug) +
      "&limit=1";

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);

    const resp = await fetch(`${url}/rest/v1/lost_items?${qs}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
      cache: "no-store",
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));

    if (!resp.ok) return errorImage("Data fetch error");

    const row = (await resp.json())?.[0] as Row | undefined;
    if (!row) return errorImage("Lost item not found");

    const title = safe(row.title || "Lost item", 90);
    const description = safe(row.description || "—", 180);
    const city = safe(row.city || "—", 40);
    const state = safe(row.state_id || "—", 6);
    const email = `item${safe(row.public_id || "?????", 12)}@reportlost.org`;

    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            background: "#ffffff",
            color: "#0f172a",
            display: "flex",
            paddingTop: 48,
            paddingBottom: 48,
            paddingLeft: 56,
            paddingRight: 56,
            boxSizing: "border-box",
            fontFamily: FONT_STACK,
          }}
        >
          {/* Carte */}
          <div
            style={{
              borderRadius: 24,
              borderWidth: 2,
              borderColor: "#e2e8f0",
              borderStyle: "solid",
              width: "100%",
              height: "100%",
              paddingTop: 42,
              paddingBottom: 42,
              paddingLeft: 46,
              paddingRight: 46,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            {/* Ligne bandeau + badges */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              {/* Bandeau LOST */}
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  background: "#f97316",
                  color: "#ffffff",
                  paddingTop: 8,
                  paddingBottom: 8,
                  paddingLeft: 14,
                  paddingRight: 14,
                  borderRadius: 8,
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: 1,
                }}
              >
                LOST
              </div>

              {/* Badges City/State */}
              <div style={{ display: "flex", gap: 10 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#f1f5f9",
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderStyle: "solid",
                    color: "#0f172a",
                    borderRadius: 10,
                    paddingTop: 8,
                    paddingBottom: 8,
                    paddingLeft: 14,
                    paddingRight: 14,
                    fontSize: 18,
                  }}
                >
                  <span style={{ fontWeight: 700, display: "block" }}>City:</span> {city}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#f1f5f9",
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderStyle: "solid",
                    color: "#0f172a",
                    borderRadius: 10,
                    paddingTop: 8,
                    paddingBottom: 8,
                    paddingLeft: 14,
                    paddingRight: 14,
                    fontSize: 18,
                  }}
                >
                  <span style={{ fontWeight: 700, display: "block" }}>State:</span> {state}
                </div>
              </div>
            </div>

            {/* Titre */}
            <div
              style={{
                display: "block",
                fontSize: 60,
                fontWeight: 800,
                lineHeight: 1.1,
                maxWidth: 1030,
              }}
            >
              {title} lost in {city} {state !== "—" ? `(${state})` : ""}
            </div>

            {/* Ligne "Lost item:" */}
            <div
              style={{
                display: "block",
                fontSize: 26,
                color: "#334155",
                maxWidth: 1030,
              }}
            >
              <span style={{ fontWeight: 700, display: "inline" }}>Lost item:</span> {description}
            </div>

            {/* Encadré email vert */}
            <div
              style={{
                display: "block",
                marginTop: 6,
                background: "#ecfdf5",
                borderWidth: 1,
                borderColor: "#bbf7d0",
                borderStyle: "solid",
                borderRadius: 16,
                paddingTop: 22,
                paddingBottom: 22,
                paddingLeft: 24,
                paddingRight: 24,
                color: "#064e3b",
              }}
            >
              <div
                style={{
                  display: "block",
                  fontSize: 26,
                  marginBottom: 8,
                  fontWeight: 700,
                }}
              >
                If you found it, please send an email:
              </div>
              <div
                style={{
                  display: "block",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
                  fontSize: 30,
                  textDecoration: "underline",
                }}
              >
                {email}
              </div>
              <div
                style={{
                  display: "block",
                  fontSize: 20,
                  opacity: 0.9,
                  marginTop: 6,
                }}
              >
                This email is unique to this report and forwards directly to the owner.
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e: any) {
    return new Response(`OG render error: ${e?.message || String(e)}`, {
      headers: { "content-type": "text/plain" },
      status: 500,
    });
  }
}
