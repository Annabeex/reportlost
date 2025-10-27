// app/api/og/lost/[slug]/route.tsx
import { ImageResponse } from "next/og";

// ✅ Edge en prod, Node en local (évite les “failed to pipe response” en dev)
export const runtime = process.env.VERCEL ? "edge" : "nodejs";
export const contentType = "image/png";

type Row = {
  title: string | null;
  description: string | null;
  city: string | null;
  state_id: string | null;
  public_id: string | null;
};

function safe(text: unknown, max = 140) {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function errorImage(msg: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#fff",
          color: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        }}
      >
        <div
          style={{
            display: "block",
            fontSize: 44,
            textAlign: "center",
            maxWidth: 1000,
          }}
        >
          {msg}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const urlObj = new URL(req.url);

  // 🔧 1) Ping debug
  if (urlObj.searchParams.get("debug") === "1") {
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

  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      // En local sans env → texte brut, jamais vide
      return new Response("Supabase env missing", {
        status: 500,
        headers: { "content-type": "text/plain" },
      });
    }

    const qs =
      "select=title,description,city,state_id,public_id&slug=eq." +
      encodeURIComponent(params.slug) +
      "&limit=1";

    // ⏱️ Timeout pour éviter les pendages
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);

    const resp = await fetch(`${url}/rest/v1/lost_items?${qs}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));

    if (!resp.ok) {
      // Mode texte si on te teste dans le navigateur
      if (urlObj.searchParams.get("text") === "1") {
        return new Response(`Data fetch error (${resp.status})`, {
          status: 500,
          headers: { "content-type": "text/plain" },
        });
      }
      return errorImage("Data fetch error");
    }

    const rows = (await resp.json()) as Row[];
    const row = rows?.[0];

    // 🔎 2) Mode RAW JSON pour valider la donnée
    if (urlObj.searchParams.get("raw") === "1") {
      return new Response(JSON.stringify(row ?? null, null, 2), {
        headers: { "content-type": "application/json" },
        status: row ? 200 : 404,
      });
    }

    if (!row) {
      if (urlObj.searchParams.get("text") === "1") {
        return new Response("Lost item not found", {
          status: 404,
          headers: { "content-type": "text/plain" },
        });
      }
      return errorImage("Lost item not found");
    }

    const title = safe(row.title || "Lost item", 90);
    const description = safe(row.description || "—", 180);
    const city = safe(row.city || "—", 40);
    const state = safe(row.state_id || "—", 6);
    const email = `item${safe(row.public_id || "?????", 12)}@reportlost.org`;

    // 🔤 3) Forcer un rendu texte si demandé (isoler les soucis de piping ImageResponse)
    if (urlObj.searchParams.get("text") === "1") {
      return new Response(
        `LOST · ${title} · ${city}${state !== "—" ? ` (${state})` : ""}\n${description}\n${email}`,
        { headers: { "content-type": "text/plain" } }
      );
    }

    // 🖼️ Rendu image OG
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            background: "#ffffff",
            color: "#0f172a",
            display: "flex",
            padding: "48px 56px",
            boxSizing: "border-box",
            fontFamily:
              "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
          }}
        >
          {/* Carte */}
          <div
            style={{
              borderRadius: 24,
              border: "2px solid #e2e8f0",
              width: "100%",
              height: "100%",
              padding: "42px 46px",
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
                  color: "#fff",
                  padding: "8px 14px",
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
                    border: "1px solid #e2e8f0",
                    color: "#0f172a",
                    borderRadius: 10,
                    padding: "8px 14px",
                    fontSize: 18,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>City:</span> {city}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    color: "#0f172a",
                    borderRadius: 10,
                    padding: "8px 14px",
                    fontSize: 18,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>State:</span> {state}
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
              <span style={{ fontWeight: 700 }}>Lost item:</span> {description}
            </div>

            {/* Encadré email vert */}
            <div
              style={{
                marginTop: 6,
                background: "#ecfdf5",
                border: "1px solid #bbf7d0",
                borderRadius: 16,
                padding: "22px 24px",
                color: "#064e3b",
                display: "block",
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
                ✅ If you found it, please send an email:
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
    // Dernier filet : pas de réponse vide
    return new Response(`OG render error: ${e?.message || String(e)}`, {
      headers: { "content-type": "text/plain" },
      status: 500,
    });
  }
}
