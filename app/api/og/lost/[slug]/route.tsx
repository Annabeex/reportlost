import { ImageResponse } from "next/og";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = getSupabaseAdmin();

  // ✅ Guard pour TypeScript (évite l'union null)
  if (!supabase) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 56,
            background: "#f8fafc",
            color: "#0f172a",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily:
              "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
          }}
        >
          Service unavailable
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // ✅ Maintenant TS sait que 'supabase' n'est plus null
  const { data } = await supabase
    .from("lost_items")
    .select("title, description, city, state_id, object_photo, public_id")
    .eq("slug", params.slug)
    .maybeSingle();

  // Fallback minimal si le report n'existe pas
  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 56,
            background: "#f8fafc",
            color: "#0f172a",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
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
  const city = data.city || "";
  const state = data.state_id ? ` (${data.state_id})` : "";
  const email = `item${data.public_id || "?????"}@reportlost.org`;

  // Visuel proche de ta carte (bandeau LOST, titre, lignes d’info, encart email vert)
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
          fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
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
          {/* Bandeau LOST */}
          <div
            style={{
              background: "#f97316",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 20,
              fontWeight: 800,
              width: "fit-content",
              letterSpacing: 1,
            }}
          >
            LOST
          </div>

          {/* Titre */}
          <div
            style={{
              fontSize: 60,
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            {title} lost in {city}
            {state ? ` ${state}` : ""}
          </div>

          {/* Sous-ligne “Lost item” */}
          <div style={{ fontSize: 26, color: "#334155", maxWidth: 1000 }}>
            <span style={{ fontWeight: 700 }}>Lost item:</span>{" "}
            {description || "—"}
          </div>

          {/* Lignes d’info */}
          <div
            style={{
              display: "flex",
              gap: 22,
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 6,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                color: "#0f172a",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 22,
              }}
            >
              <span style={{ opacity: 0.8 }}>City:</span> {city || "—"}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                color: "#0f172a",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 22,
              }}
            >
              <span style={{ opacity: 0.8 }}>State:</span> {data.state_id || "—"}
            </div>
          </div>

          {/* Encadré email vert */}
          <div
            style={{
              marginTop: 18,
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
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
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
