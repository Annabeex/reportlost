// app/lost/page.tsx
// Index des signalements publics.
//
// /lost renvoyait 404 alors que quatre mille pages vivent sous /lost/<slug>.
// Ces pages n'étaient reliées que par le sitemap, qui fait découvrir mais ne
// hiérarchise rien. Cette page leur donne un point d'entrée, et donne au
// visiteur un endroit où voir que le site est vivant.
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { redactPublic } from "@/lib/redactPublic";
import { stateNameFromAbbr } from "@/lib/utils";

export const revalidate = 3600; // ISR 1h : la fraîcheur est tout l'intérêt

export const metadata = {
  title: "Recent lost item reports across the United States | ReportLost",
  description:
    "Browse the most recent lost item reports filed on ReportLost, state by state. Found something? Each report has its own relay address that reaches the owner directly.",
  alternates: { canonical: "https://reportlost.org/lost" },
};

type Row = {
  slug: string;
  title: string | null;
  city: string | null;
  state_id: string | null;
  created_at: string | null;
};

function stripStateFromCity(city?: string | null) {
  return String(city || "").replace(/\s*\([A-Z]{2}\)\s*$/i, "").trim();
}

function formatLongDate(v?: string | null) {
  if (!v) return "";
  const d = new Date(String(v).length <= 10 ? `${v}T12:00:00Z` : v);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}

async function getRecent(): Promise<Row[]> {
  try {
    const sb = getSupabaseAdmin({ fresh: false });
    if (!sb) return [];
    const { data, error } = await sb
      .from("lost_items")
      .select("slug, title, city, state_id, created_at")
      .not("slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(120);
    if (error || !data) return [];
    return data as Row[];
  } catch {
    return [];
  }
}

export default async function LostIndexPage() {
  const rows = await getRecent();

  // Regroupement par État, États les plus actifs d'abord.
  const byState = new Map<string, Row[]>();
  for (const r of rows) {
    const k = String(r.state_id || "").toUpperCase();
    if (!k) continue;
    if (!byState.has(k)) byState.set(k, []);
    byState.get(k)!.push(r);
  }
  const groups = Array.from(byState.entries())
    .map(([code, list]) => ({
      code,
      name: stateNameFromAbbr(code) || code,
      list: list.slice(0, 6),
      total: list.length,
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-5xl bg-white px-6 py-10">
      <h1 className="mb-4 text-center text-2xl font-bold text-gray-900 md:text-3xl">
        Recent lost item reports
      </h1>

      <p className="mx-auto max-w-2xl text-center leading-relaxed text-gray-700">
        Every report below was filed by someone who lost an item, and each one carries its own
        relay address. If you have found something, writing to that address reaches the owner
        directly, without either of you revealing a personal email.
      </p>

      <div className="mx-auto mt-8 max-w-3xl rounded-2xl bg-gradient-to-r from-[#26723e] to-[#2ea052] px-6 py-6 text-center">
        <p className="text-lg font-semibold text-white">Lost something yourself?</p>
        <p className="mx-auto mt-1 max-w-xl text-sm leading-relaxed text-emerald-50">
          Publishing your report is free. The $25 Active search adds the filing with the local
          lost-property service, outreach to the places likely to hold your item, a published
          visual notice and twelve months of web monitoring.
        </p>
        <Link
          href="/report"
          className="mt-4 inline-block rounded-lg bg-white px-6 py-2.5 font-semibold text-[#1f6b3a] shadow hover:bg-emerald-50"
        >
          Report my lost item →
        </Link>
      </div>

      {groups.length === 0 ? (
        <p className="mt-12 text-center text-sm text-gray-500">
          No report to display right now. Please check back shortly.
        </p>
      ) : (
        <div className="mt-12 space-y-10">
          {groups.map((g) => (
            <section key={g.code}>
              <div className="mb-3 flex items-baseline justify-between gap-4 border-b border-gray-200 pb-2">
                <h2 className="text-lg font-semibold text-gray-900">{g.name}</h2>
                <Link
                  prefetch={false}
                  href={`/lost-and-found/${g.code.toLowerCase()}`}
                  className="flex-none text-[13px] text-blue-700 hover:underline"
                >
                  Lost &amp; found guide for {g.name} →
                </Link>
              </div>
              <ul>
                {g.list.map((r) => {
                  const label = redactPublic(r.title) || "Lost item";
                  const where = stripStateFromCity(r.city);
                  return (
                    <li
                      key={r.slug}
                      className="-mx-2 flex items-baseline justify-between gap-4 rounded border-b border-gray-100 px-2 py-2.5 hover:bg-gray-50"
                    >
                      <Link
                        prefetch={false}
                        href={`/lost/${r.slug}`}
                        className="text-[15px] font-medium text-blue-800 hover:underline"
                      >
                        {label}
                        {where ? (
                          <span className="font-normal text-gray-500"> — {where}, {g.code}</span>
                        ) : null}
                      </Link>
                      <span className="flex-none text-xs tabular-nums text-gray-500">
                        {formatLongDate(r.created_at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="mx-auto mt-12 max-w-3xl text-center text-xs leading-relaxed text-gray-400">
        Reports are published by their owners. Identifying numbers written in a description are
        filtered out before publication. To browse by location instead, start from the{" "}
        <Link href="/lost-and-found" className="text-blue-700 hover:underline">
          lost &amp; found guides by state
        </Link>
        .
      </p>
    </div>
  );
}
