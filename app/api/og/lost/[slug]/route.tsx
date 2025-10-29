// app/api/og-svg/lost/[slug]/route.ts
export const runtime = "nodejs";

type Row = {
  title: string | null;
  description: string | null;
  city: string | null;
  state_id: string | null;
  public_id: string | null;
};

function safe(v: unknown, max = 140) {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function svgEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Très simple “fallback” si la data ne charge pas
function renderFallbackSVG(msg = "ReportLost") {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#ffffff"/>
    <text x="600" y="315" font-family="Inter, Arial, sans-serif" font-weight="800"
          font-size="64" fill="#0f172a" text-anchor="middle" dominant-baseline="middle">
      ${svgEscape(msg)}
    </text>
  </svg>`;
  return new Response(svg, {
    headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return renderFallbackSVG("Missing Supabase env");

    // fetch REST (aucune lib, ultra fiable)
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

    if (!r.ok) return renderFallbackSVG("Fetch error");

    const rows = (await r.json()) as Row[];
    const row = rows?.[0];
    if (!row) return renderFallbackSVG("Not found");

    const title = safe(row.title || "Lost item", 90);
    const desc = safe(row.description || "—", 160);
    const city = safe(row.city || "—", 40);
    const state = safe(row.state_id || "—", 6);
    const email = `item${safe(row.public_id || "?????", 12)}@reportlost.org`;

    // SVG “propre” qui ressemble à ta maquette
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs>
        <style>
          @font-face { font-family: Inter; src: local("Inter"); }
          .bg { fill: #ffffff }
          .text { fill: #0f172a; font-family: Inter, Arial, sans-serif }
          .muted { fill: #334155 }
          .badge { fill: #f97316 }
          .chip { fill: #f1f5f9 }
          .chipText { fill: #0f172a }
          .box { fill: #ecfdf5 }
          .boxText { fill: #064e3b }
        </style>
      </defs>

      <rect class="bg" x="0" y="0" width="1200" height="630"/>

      <!-- Ligne top -->
      <rect class="badge" x="100" y="70" rx="8" ry="8" width="90" height="34"/>
      <text class="text" x="145" y="93" font-size="18" font-weight="800" text-anchor="middle">LOST</text>

      <rect class="chip" x="910" y="60" rx="10" ry="10" width="140" height="40"/>
      <text class="chipText" x="980" y="86" font-size="18" font-family="Inter, Arial">
        <tspan font-weight="700">City:</tspan> ${svgEscape(city)}
      </text>

      <rect class="chip" x="1060" y="60" rx="10" ry="10" width="100" height="40"/>
      <text class="chipText" x="1110" y="86" font-size="18">
        <tspan font-weight="700">State:</tspan> ${svgEscape(state)}
      </text>

      <!-- Titre -->
      <text class="text" x="100" y="180" font-size="56" font-weight="800">
        ${svgEscape(title)} lost in ${svgEscape(city)} ${state !== "—" ? `(${svgEscape(state)})` : ""}
      </text>

      <!-- Description -->
      <text class="muted" x="100" y="230" font-size="26">
        <tspan font-weight="700">Lost item:</tspan> ${svgEscape(desc)}
      </text>

      <!-- Encadré email -->
      <rect class="box" x="100" y="270" rx="14" ry="14" width="1000" height="150"/>
      <text class="boxText" x="120" y="310" font-size="24" font-weight="700">
        If you found it, please send an email:
      </text>
      <text class="boxText" x="120" y="350" font-size="28" text-decoration="underline" font-family="ui-monospace, Menlo, Consolas">
        ${svgEscape(email)}
      </text>
      <text class="boxText" x="120" y="390" font-size="18" opacity="0.9">
        This email is unique to this report and forwards directly to the owner.
      </text>
    </svg>`;

    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return renderFallbackSVG("OG SVG render error");
  }
}
