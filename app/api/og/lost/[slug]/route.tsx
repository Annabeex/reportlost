// app/api/og/lost/[slug]/route.tsx
import { ImageResponse } from "next/og";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = getSupabaseAdmin();

  // Guard si l'admin client n'est pas dispo
  if (!supabase) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#f8fafc",
            color: "#0f172a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily:
              "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
            fontSize: 48,
          }}
        >
          Service unavailable
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const { data } = await supabase
    .from("lost_items")
    .select(
      "title, description, city, state_id, object_photo, public_id"
    )
    .eq("slug", params.slug)
    .maybeSingle();

  // Fallback si pas de data
  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#ffffff",
            color: "#0f172a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily:
              "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
            fontSize: 56,
          }}
        >
          Lost item not found
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const title = data.title || "Lost item";
  const description = data.description || "";
  const city = data.city || "—";
  const state = data.state_id || "—";
  const email = `item${data.public_id || "?????"}@reportlost.org`;

  // Carte OG inspirée de ta page (sobre, lisible)
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
          {/* Ligne bandeau + badges à droite */}
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
                background: "#f97316",
                color: "#fff",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 1,
                display: "inline-block", // remplace fit-content
              }}
            >
              LOST
            </div>

            {/* Badges City / State */}
            <div style={{ display: "flex", gap: 10 }}>
              <div
                style={{
                  display: "inline-flex",
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
                  display: "inline-flex",
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
              fontSize: 60,
              fontWeight: 800,
              lineHeight: 1.1,
              maxWidth: 1030,
            }}
          >
            {title} lost in {city} {state !== "—" ? `(${state})` : ""}
          </div>

          {/* Ligne "Lost item:" */}
          <div style={{ fontSize: 26, color: "#334155", maxWidth: 1030 }}>
            <span style={{ fontWeight: 700 }}>Lost item:</span>{" "}
            {description || "—"}
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
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 8, fontWeight: 700 }}>
              ✅ If you found it, please send an email:
            </div>
            <div
              style={{
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
                fontSize: 30,
                textDecoration: "underline",
              }}
            >
              {email}
            </div>
            <div style={{ fontSize: 20, opacity: 0.9, marginTop: 6 }}>
              This email is unique to this report and forwards directly to the owner.
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
