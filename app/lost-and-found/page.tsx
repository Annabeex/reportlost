// app/lost-and-found/page.tsx
// Hub national des pages État.
//
// Trois raisons d'exister :
//  1. /lost-and-found était déclarée dans sitemap-static.xml alors qu'aucune
//     page.tsx n'existait : on soumettait une 404 à Google nous-mêmes.
//  2. Les 51 pages État n'avaient aucun lien interne suivable (UsaMap navigue
//     en router.push, sans <a href> : un crawler ne voit rien).
//  3. Le tableau comparatif des durées de garde n'existe ni sur les sites
//     officiels ni chez les concurrents. C'est la vraie valeur ajoutée de la
//     page, et la raison pour laquelle elle mérite d'être indexée.
//
// Aucune donnée inventée ici : les compteurs viennent de la base, les règles
// de droit viennent de lib/legalHolding.ts (uniquement les États relus à la
// main), et la date de dernière revue est écrite en dur, pas générée.
import Link from "next/link";
import states from "@/lib/states";
import { holdingRule, type HoldingRule } from "@/lib/legalHolding";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 86400; // ISR 24h

const LAST_REVIEWED = "September 2026";

export const metadata = {
  title: "Lost & Found in the United States, State by State | ReportLost",
  description:
    "How long police must hold found property, what a finder owes you, and where unclaimed items end up, state by state. Browse lost & found guidance for every US state.",
  alternates: { canonical: "https://reportlost.org/lost-and-found" },
};

type StateRow = { name: string; code: string; slug: string };

// --- données -----------------------------------------------------------------

/** Nombre de villes couvertes par un guide publié, par État. */
async function getCoveredCountByState(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  try {
    const sb = getSupabaseAdmin({ fresh: false });
    if (!sb) return out;
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await sb
        .from("city_guides")
        .select("state_id, city_slug")
        .eq("status", "published")
        .order("city_slug", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error || !data?.length) break;
      for (const g of data) {
        const k = String((g as any).state_id || "").toUpperCase();
        if (k) out[k] = (out[k] || 0) + 1;
      }
      if (data.length < PAGE) break;
    }
  } catch {
    /* non bloquant : la page s'affiche sans les compteurs */
  }
  return out;
}

async function getTotalReports(): Promise<number> {
  try {
    const sb = getSupabaseAdmin({ fresh: false });
    if (!sb) return 0;
    const { count } = await sb
      .from("lost_items")
      .select("id", { count: "exact", head: true });
    return count || 0;
  } catch {
    return 0;
  }
}

// --- présentation des règles --------------------------------------------------

function ruleShort(rule: HoldingRule): string {
  if (rule.kind === "fixed" && rule.days) return `${rule.days} days`;
  if (rule.kind === "scaled") return "Scales with value";
  return "No statewide period";
}

function ruleLong(rule: HoldingRule): string {
  if (rule.kind === "fixed" && rule.days)
    return `Found property must be held for at least ${rule.days} days before it can be auctioned, given to the finder or disposed of.`;
  if (rule.kind === "scaled")
    return "The holding period is not a single number: it grows with the declared value of the item.";
  return "Retention is decided department by department. Asking the specific desk that holds your item is the only reliable answer.";
}

// Ordre de lecture : durées fixes croissantes, puis barèmes, puis absence de règle.
function ruleWeight(rule: HoldingRule): number {
  if (rule.kind === "fixed") return 0 + (rule.days || 0) / 1000;
  if (rule.kind === "scaled") return 100;
  return 200;
}

// --- page ---------------------------------------------------------------------

export default async function LostAndFoundHub() {
  const all = states as StateRow[];
  const [covered, totalReports] = await Promise.all([
    getCoveredCountByState(),
    getTotalReports(),
  ]);

  const coveredCities = Object.values(covered).reduce((a, b) => a + b, 0);
  const statesCovered = Object.keys(covered).length;

  const verified = all
    .map((s) => ({ state: s, rule: holdingRule(s.code) }))
    .filter((r): r is { state: StateRow; rule: HoldingRule } => !!r.rule)
    .sort((a, b) => ruleWeight(a.rule) - ruleWeight(b.rule));

  const faq = [
    {
      q: "Is there one lost and found law for the whole United States?",
      a: "No. Found property is governed state by state, and in several states not even at state level. California sets 90 days in its Civil Code, Arizona 30 days, Washington 60. Texas and Pennsylvania set no statewide period at all: each police department, transit agency and venue writes its own retention policy.",
    },
    {
      q: "How long will the police keep an item I lost?",
      a: "Where a statute exists, it sets a minimum, not a maximum, and the clock usually starts when the item reaches law enforcement custody rather than when it was lost. Where no statute exists, the only reliable answer comes from the desk actually holding the item, which is why our city pages list local contacts rather than a national number.",
    },
    {
      q: "What happens to property nobody claims?",
      a: "Once the holding period has run, unclaimed property is typically auctioned, transferred to the finder, or disposed of, depending on the state and the agency. Several police departments in the United States sell through public auction platforms, which is where recognisable items sometimes resurface months later.",
    },
    {
      q: "Do hotels, airports and transit systems follow the same rules?",
      a: "Rarely. Private venues and transit operators set their own retention windows, often much shorter than the statutory one, and they are usually the first place an item lands. That is why reporting the loss to the venue and to the local service matters more than the statute itself.",
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="bg-white px-6 py-10 max-w-5xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
        Lost &amp; Found in the United States, State by State
      </h1>

      <p className="mx-auto max-w-2xl text-center text-gray-700 leading-relaxed">
        There is no national lost and found office, and no single law. What happens to
        an item you lost depends on the state it was lost in, and often on the single
        department, station or venue that picked it up. These pages set out what the
        law says where it says anything, who to contact where it does not, and how to
        put your loss on record.
      </p>

      {/* Compteurs réels : aucune donnée décorative. */}
      {(totalReports > 0 || coveredCities > 0) && (
        <div className="mt-8 flex flex-wrap items-baseline justify-center gap-x-12 gap-y-4">
          {totalReports > 0 && (
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900 tabular-nums">
                {totalReports.toLocaleString("en-US")}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
                reports filed
              </div>
            </div>
          )}
          {coveredCities > 0 && (
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900 tabular-nums">
                {coveredCities.toLocaleString("en-US")}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
                cities with a local guide
              </div>
            </div>
          )}
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 tabular-nums">
              {statesCovered > 0 ? statesCovered : all.length}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
              states covered
            </div>
          </div>
        </div>
      )}

      {/* Tableau des règles vérifiées : le contenu qui n'existe nulle part ailleurs. */}
      {verified.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            How long found property is held, where the law says so
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-600">
            The states below have a rule we have read and referenced. A fixed period is
            a minimum: it starts when the item enters custody, not when you lost it. The
            remaining states are covered on their own page, with the local contacts that
            actually decide the outcome there.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 pr-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    State
                  </th>
                  <th className="py-2 pr-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Holding period
                  </th>
                  <th className="py-2 pr-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    What that means
                  </th>
                  <th className="py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody>
                {verified.map(({ state, rule }) => (
                  <tr key={state.code} className="border-b border-gray-100 align-top">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <Link
                        prefetch={false}
                        href={`/lost-and-found/${state.code.toLowerCase()}`}
                        className="font-medium text-blue-800 hover:underline"
                      >
                        {state.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-sm font-medium text-gray-900 tabular-nums">
                      {ruleShort(rule)}
                    </td>
                    <td className="py-3 pr-4 text-sm leading-relaxed text-gray-700">
                      {ruleLong(rule)}
                    </td>
                    <td className="py-3 text-xs leading-relaxed text-gray-500">
                      {rule.citation || "Set locally"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Index des États : un lien interne stable et suivable vers chaque page. */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Browse every state
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-gray-600 mb-6">
          Each state page explains how lost and found works there and lists the cities
          we cover, with the local desks, transit operators and venues to contact.
        </p>

        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
          {all.map((s) => {
            const n = covered[s.code.toUpperCase()] || 0;
            const rule = holdingRule(s.code);
            return (
              <li key={s.code} className="border-b border-gray-100 py-2">
                <Link
                  prefetch={false}
                  href={`/lost-and-found/${s.code.toLowerCase()}`}
                  className="text-[15px] font-medium text-blue-800 hover:underline"
                >
                  {s.name}
                </Link>
                <div className="mt-0.5 text-[11.5px] text-gray-500 tabular-nums">
                  {n > 0 ? `${n.toLocaleString("en-US")} ${n > 1 ? "cities" : "city"}` : "State guide"}
                  {rule ? ` · ${ruleShort(rule)}` : ""}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* CTA aligné sur les CGV : formule unique, pas de promesse de résultat. */}
      <div className="mx-auto mt-14 max-w-3xl rounded-2xl bg-gradient-to-r from-[#26723e] to-[#2ea052] px-6 py-6 text-center">
        <p className="text-lg font-semibold text-white">Lost something in the United States?</p>
        <p className="mt-1 text-sm text-emerald-50 leading-relaxed">
          A free listing publishes your report on ReportLost. The $25 Active search adds
          the transfer of your file to the service handling lost property, outreach to
          the places likely to hold your item, a shareable visual with an anonymous relay
          address, twelve months of AI web monitoring, a downloadable loss report and a
          printable QR sticker sheet.
        </p>
        <Link
          href="/report"
          className="mt-4 inline-block rounded-lg bg-white px-6 py-2.5 font-semibold text-[#1f6b3a] shadow hover:bg-emerald-50"
        >
          Report my lost item →
        </Link>
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Lost &amp; found in the United States: common questions
        </h2>
        <div className="space-y-2">
          {faq.map((f, i) => (
            <details key={i} className="group rounded-xl border border-gray-200 bg-white px-5 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-gray-900">
                {f.q}
                <span className="text-emerald-700 transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-gray-400">
        General information about lost and found practice in the United States, not legal
        advice. Statutes and local policies change; check with the agency holding your
        item before relying on a deadline. Last reviewed: {LAST_REVIEWED}.
      </p>
    </div>
  );
}
