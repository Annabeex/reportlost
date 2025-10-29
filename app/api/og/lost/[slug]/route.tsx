// app/api/og/lost/[slug]/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "nodejs"; // ✅ plus tolérant que Edge

type Row = {
  title: string | null;
  description: string | null;
  city: string | null;
  state_id: string | null;
  public_id: string | null;
};

const FONT =
  "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

function safe(v: unknown, max = 140) {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function text(msg: string, status = 500) {
  return new Response(msg, {
    headers: { "content-type": "text/plain; charset=utf-8" },
    status,
  });
}

function blankImage(title = "ReportLost", subtitle = "Open Graph ready") {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: 1200,
          height: 630,
          background: "#ffffff",
          color: "#0f172a",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
        }}
      >
        <div style={{ display: "block", textAlign: "center" }}>
          <div style={{ display: "block", fontSize: 64, fontWeight: 800 }}>
            {title}
          </div>
          <div style={{ display: "block", fontSize: 28, color: "#475569" }}>
            {subtitle}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const q = new URL(req.url).searchParams;

  // 🔧 Diagnostics rapides
  if (q.get("debug") === "1") {
    return text(
      JSON.stringify(
        {
          ok: true,
          slug: params.slug,
          env: {
            hasURL: !!process.env.SUPABASE_URL,
            hasKEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            runtime,
          },
        },
        null,
        2
      ),
      200
    );
  }

  // 🔁 Mode secours : image blanche garantie
  if (q.get("blank") === "1") {
    return blankImage("ReportLost", "Fallback image");
  }

  // 1) Fetch via REST Supabase (edge-safe & simple)
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return text("OG error: Supabase env missing");

  let row: Row | undefined;
  try {
    const qs =
      "select=title,description,city,state_id,public_id&slug=eq." +
      encodeURIComponent(params.slug) +
      "&limit=1";

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);

    const resp = await fetch(`${url}/rest/v1/lost_items?${qs}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));

    if (!resp.ok) return text(`OG error: fetch ${resp.status}`, 502);

    const arr = (await resp.json()) as Row[];
    row = arr?.[0];
    if (!row) return text("OG error: Lost item not found", 404);
  } catch (e: any) {
    // Si fetch plante, on renvoie une image “blank” pour éviter 500
    return blankImage("ReportLost", `Fetch failed: ${e?.message || e}`);
  }

  // 2) Normalisation
  const title = safe(row.title || "Lost item", 90);
  const description = safe(row.description || "—", 160);
  const city = safe(row.city || "—", 40);
  const state = safe(row.state_id || "—", 6);
  const email = `item${safe(row.public_id || "?????", 12)}@reportlost.org`;

  // 3) Rendu “safe” (display explicite partout, pas de border/shadow/gap)
  try {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: 1200,
            height: 630,
            background: "#ffffff",
            color: "#0f172a",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
          }}
        >
          <div style={{ display: "block", width: 1060 }}>
            {/* Ligne top */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  background: "#f97316",
                  color: "#ffffff",
                  borderRadius: 10,
                  paddingTop: 10,
                  paddingBottom: 10,
                  paddingLeft: 16,
                  paddingRight: 16,
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: 1,
                }}
              >
                LOST
              </div>

              <div style={{ display: "flex" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#f1f5f9",
                    color: "#0f172a",
                    borderRadius: 10,
                    paddingTop: 8,
                    paddingBottom: 8,
                    paddingLeft: 14,
                    paddingRight: 14,
                    fontSize: 18,
                    marginRight: 10,
                  }}
                >
                  <span style={{ display: "block", fontWeight: 700, marginRight: 6 }}>
                    City:
                  </span>
                  {city}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#f1f5f9",
                    color: "#0f172a",
                    borderRadius: 10,
                    paddingTop: 8,
                    paddingBottom: 8,
                    paddingLeft: 14,
                    paddingRight: 14,
                    fontSize: 18,
                  }}
                >
                  <span style={{ display: "block", fontWeight: 700, marginRight: 6 }}>
                    State:
                  </span>
                  {state}
                </div>
              </div>
            </div>

            <div style={{ display: "block", height: 26 }} />

            <div
              style={{
                display: "block",
                fontSize: 56,
                fontWeight: 800,
                lineHeight: 1.12,
              }}
            >
              {title} lost in {city} {state !== "—" ? `(${state})` : ""}
            </div>

            <div style={{ display: "block", height: 16 }} />

            <div
              style={{
                display: "block",
                fontSize: 26,
                lineHeight: 1.35,
                color: "#334155",
              }}
            >
              <span style={{ display: "inline", fontWeight: 700 }}>Lost item:</span>{" "}
              {description}
            </div>

            <div style={{ display: "block", height: 22 }} />

            <div
              style={{
                display: "block",
                background: "#ecfdf5",
                borderRadius: 14,
                paddingTop: 18,
                paddingBottom: 18,
                paddingLeft: 20,
                paddingRight: 20,
                color: "#064e3b",
              }}
            >
              <div
                style={{
                  display: "block",
                  fontSize: 24,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                If you found it, please send an email:
              </div>
              <div
                style={{
                  display: "block",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
                  fontSize: 28,
                  textDecoration: "underline",
                }}
              >
                {email}
              </div>
              <div
                style={{
                  display: "block",
                  fontSize: 18,
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
    // Dernier filet de sécurité → image “blank”
    return blankImage("ReportLost", `Render failed: ${e?.message || e}`);
  }
}
