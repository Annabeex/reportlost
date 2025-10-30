// app/api/og-svg/lost/[slug].svg/route.ts
// ✅ Version corrigée — fonctionne sur Edge, pas d’erreur "headers" ni d'import inutile

export const runtime = "edge";

type Row = {
  title: string | null;
  description: string | null;
  city: string | null;
  state_id: string | null;
  public_id: string | null;
  slug: string | null;
};

function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]!)
  );
}

function svgNotFound(msg = "Lost item not found") {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="14" y="14" width="1172" height="602" rx="28" ry="28" fill="none" stroke="#e2e8f0" stroke-width="2"/>
  <text x="600" y="330" text-anchor="middle" fill="#0f172a" font-size="64" font-family="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto">
    ${esc(msg)}
  </text>
</svg>`;
  return new Response(svg, {
    headers: { "content-type": "image/svg+xml", "cache-control": "no-store" },
  });
}

export async function GET(req: Request, ctx: { params: { slug: string } }) {
  const { searchParams } = new URL(req.url);
  const DEBUG = searchParams.get("debug") === "1";

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return DEBUG
      ? new Response(
          JSON.stringify({ ok: false, reason: "missing env", hasURL: !!url, hasKEY: !!key }),
          { headers: { "content-type": "application/json" } }
        )
      : svgNotFound("Supabase env missing");
  }

  // slug décodé et nettoyé
  const rawSlug = decodeURIComponent(ctx.params.slug || "");
  const slug = rawSlug.replace(/\.svg$/i, "");

  async function fetchBySlug(s: string) {
    const qs =
      "select=slug,title,description,city,state_id,public_id&slug=eq." +
      encodeURIComponent(s) +
      "&limit=1";
    const r = await fetch(`${url}/rest/v1/lost_items?${qs}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      } as Record<string, string>,
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`postgrest ${r.status}`);
    const out = (await r.json()) as Row[];
    return out?.[0] || null;
  }

  try {
    // Recherche exacte
    let row = await fetchBySlug(slug);

    // Si slug trop long, retente avec troncature (cas supabase)
    if (!row && slug.length > 120) {
      const truncated = slug.slice(0, 120).replace(/-+$/, "");
      row = await fetchBySlug(truncated);
    }

    // Recherche large si rien trouvé
    if (!row) {
      const qs =
        "select=slug,title,description,city,state_id,public_id&" +
        `slug=ilike.*${encodeURIComponent(slug)}*&limit=1`;
      const r = await fetch(`${url}/rest/v1/lost_items?${qs}`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
        } as Record<string, string>,
        cache: "no-store",
      });

      if (r.ok) {
        const arr = (await r.json()) as Row[];
        row = arr?.[0] || null;
      }
    }

    if (DEBUG) {
      return new Response(
        JSON.stringify({ ok: true, slug, row, env: { hasURL: !!url, hasKEY: !!key } }, null, 2),
        { headers: { "content-type": "application/json" } }
      );
    }

    if (!row) return svgNotFound();

    const title = row.title || "Lost item";
    const city = row.city || "—";
    const state = row.state_id || "—";
    const pub = row.public_id ? `item${row.public_id}@reportlost.org` : "support@reportlost.org";
    const description = row.description || "—";

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="26" y="26" width="1148" height="578" rx="24" ry="24" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
  <!-- Bandeau -->
  <rect x="60" y="68" width="120" height="36" rx="8" fill="#f97316"/>
  <text x="120" y="92" text-anchor="middle" fill="#fff" font-size="18" font-weight="800"
        font-family="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto">LOST</text>

  <!-- Badges City/State -->
  <rect x="946" y="64" width="180" height="44" rx="10" fill="#f1f5f9" stroke="#e2e8f0"/>
  <text x="960" y="92" fill="#0f172a" font-size="18" font-family="Inter, ui-sans-serif">City: <tspan font-weight="700">${esc(city)}</tspan></text>
  <rect x="746" y="64" width="180" height="44" rx="10" fill="#f1f5f9" stroke="#e2e8f0"/>
  <text x="760" y="92" fill="#0f172a" font-size="18" font-family="Inter, ui-sans-serif">State: <tspan font-weight="700">${esc(state)}</tspan></text>

  <!-- Titre -->
  <text x="60" y="180" fill="#0f172a" font-size="54" font-weight="800"
        font-family="Inter, ui-sans-serif" style="letter-spacing:0">
    ${esc(title)} lost in ${esc(city)} ${state !== "—" ? "(" + esc(state) + ")" : ""}
  </text>

  <!-- Description -->
  <text x="60" y="230" fill="#334155" font-size="22" font-family="Inter, ui-sans-serif">
    Lost item: ${esc(description)}
  </text>

  <!-- Email vert -->
  <rect x="60" y="270" width="1080" height="120" rx="16" fill="#ecfdf5" stroke="#bbf7d0"/>
  <text x="80" y="314" fill="#064e3b" font-size="24" font-weight="700" font-family="Inter, ui-sans-serif">
    ✅ If you found it, please send an email:
  </text>
  <text x="80" y="350" fill="#064e3b" font-size="28" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" text-decoration="underline">
    ${esc(pub)}
  </text>
</svg>`;

    return new Response(svg, {
      headers: { "content-type": "image/svg+xml", "cache-control": "no-store" },
    });
  } catch (e: any) {
    if (DEBUG) {
      return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
        headers: { "content-type": "application/json" },
        status: 500,
      });
    }
    return svgNotFound("OG render error");
  }
}
