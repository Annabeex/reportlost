// app/api/og-svg/lost/[slug]/route.ts
// Génère une image OG au format SVG (robuste sur Edge + Facebook/Twitter)
export const runtime = "edge";

type Row = {
  title: string | null;
  description: string | null;
  city: string | null;
  state_id: string | null;
  public_id: string | null;
};

function esc(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function cut(s: unknown, n: number) {
  const t = String(s ?? "").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

function svgError(msg: string) {
  const body = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="40" y="40" width="1120" height="550" rx="24" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
  <text x="600" y="330" text-anchor="middle" font-family="Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto"
        font-size="44" fill="#0f172a">${esc(msg)}</text>
</svg>`;
  return new Response(body, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
  });
}

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  // ?debug=1 -> renvoie JSON brut pour diag
  const urlObj = new URL(req.url);
  const debug = urlObj.searchParams.get("debug");

  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return svgError("Supabase env missing");

    // REST (PostgREST) côté Edge
    const qs =
      "select=title,description,city,state_id,public_id&slug=eq." +
      encodeURIComponent(params.slug) +
      "&limit=1";
    const r = await fetch(`${url}/rest/v1/lost_items?${qs}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!r.ok) return svgError("Data fetch error");
    const rows = (await r.json()) as Row[];
    const row = rows?.[0];
    if (!row) return svgError("Lost item not found");

    if (debug) {
      return new Response(
        JSON.stringify({ ok: true, slug: params.slug, row }, null, 2),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const title = cut(row.title || "Lost item", 90);
    const desc = cut(row.description || "—", 180);
    const city = cut(row.city || "—", 40);
    const state = cut(row.state_id || "—", 6);
    const email = `item${cut(row.public_id || "?????", 12)}@reportlost.org`;

    // SVG “carte” fidèle au design de la page
    const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#000" flood-opacity="0.08"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="#ffffff"/>

  <!-- Carte -->
  <g filter="url(#shadow)">
    <rect x="40" y="40" width="1120" height="550" rx="24" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  </g>

  <!-- Bandeau LOST + badges -->
  <rect x="68" y="68" rx="8" ry="8" width="74" height="28" fill="#f97316"/>
  <text x="105" y="88" text-anchor="middle" font-size="14" font-weight="800"
        font-family="Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto" fill="#ffffff">LOST</text>

  <g>
    <!-- City -->
    <rect x="920" y="64" rx="10" ry="10" width="110" height="36" fill="#f1f5f9" stroke="#e2e8f0"/>
    <text x="930" y="86" font-size="14" font-family="Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto" fill="#0f172a">
      <tspan font-weight="700">City:</tspan> ${esc(city)}
    </text>
    <!-- State -->
    <rect x="1040" y="64" rx="10" ry="10" width="100" height="36" fill="#f1f5f9" stroke="#e2e8f0"/>
    <text x="1050" y="86" font-size="14" font-family="Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto" fill="#0f172a">
      <tspan font-weight="700">State:</tspan> ${esc(state)}
    </text>
  </g>

  <!-- Titre -->
  <text x="68" y="170"
        font-size="60" font-weight="800" fill="#0f172a"
        font-family="Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto">
    ${esc(title)} lost in ${esc(city)} ${state !== "—" ? "(" + esc(state) + ")" : ""}
  </text>

  <!-- Sous-titre -->
  <text x="68" y="220"
        font-size="26" fill="#334155"
        font-family="Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto">
    <tspan font-weight="700">Lost item:</tspan> ${esc(desc)}
  </text>

  <!-- Encadré email -->
  <rect x="68" y="260" width="1064" height="150" rx="16" fill="#ecfdf5" stroke="#bbf7d0"/>
  <text x="88" y="305"
        font-size="26" font-weight="700" fill="#064e3b"
        font-family="Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto">
    ✅ If you found it, please send an email:
  </text>
  <text x="88" y="345"
        font-size="30" text-decoration="underline" fill="#064e3b"
        font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas">
    ${esc(email)}
  </text>
  <text x="88" y="375"
        font-size="20" fill="#064e3b" opacity="0.9"
        font-family="Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto">
    This email is unique to this report and forwards directly to the owner.
  </text>
</svg>`.trim();

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        // Pas de cache agressif pendant les tests
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (e) {
    return svgError("OG render error");
  }
}
