export const runtime = "edge";

export async function GET() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "env missing" }), { status: 500 });
  }

  const qs = "select=slug,title,city,state_id&order=created_at.desc&limit=3";
  const r = await fetch(`${url}/rest/v1/lost_items?${qs}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
    cache: "no-store",
  });

  const json = await r.json();
  return new Response(JSON.stringify(json, null, 2), {
    headers: { "content-type": "application/json" },
  });
}
