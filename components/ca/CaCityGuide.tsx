// components/ca/CaCityGuide.tsx
// 🇨🇦 Rendu d'un guide de ville canadien (lib/ca/cityGuide.ts).
// Composant SERVEUR : tout le contenu est dans le HTML initial (SEO, CLS nul),
// aucun JavaScript client. Un seul appel à l'action par écran (CLAUDE.md).
import Link from "next/link";
import type { CaCityGuide, CaGuideCard } from "@/lib/ca/cityGuide";
import { provinceName } from "@/lib/canada/canadaData";

const ICON: Record<CaGuideCard["kind"], { emoji: string; bg: string }> = {
  police: { emoji: "👮", bg: "bg-indigo-100" },
  transit: { emoji: "🚇", bg: "bg-blue-100" },
  airport: { emoji: "✈️", bg: "bg-sky-100" },
  animal: { emoji: "🐾", bg: "bg-rose-100" },
  university: { emoji: "🎓", bg: "bg-yellow-100" },
  other: { emoji: "📍", bg: "bg-green-100" },
};

function formatReviewed(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export default function CaCityGuideView({ guide }: { guide: CaCityGuide }) {
  const prov = provinceName(guide.province);
  const reportHref = `/ca/report?city=${encodeURIComponent(`${guide.cityName} (${guide.province})`)}`;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Fil d'Ariane */}
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <Link href="/ca" prefetch={false} className="hover:underline">Canada</Link>
        <span className="mx-2">›</span>
        <span>{prov}</span>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{guide.cityName}</span>
      </nav>

      {/* Écran 1 : titre + un seul appel à l'action */}
      <section className="rounded-xl border border-gray-100 bg-gradient-to-r from-blue-50 to-white px-6 py-10 text-center shadow">
        <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
          {guide.cityName}, {guide.province} · Lost &amp; found
        </span>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">{guide.h1}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">{guide.lede}</p>
        <Link
          href={reportHref}
          prefetch={false}
          className="mt-6 inline-block rounded-lg bg-green-600 px-7 py-3 font-bold text-white shadow-md transition hover:bg-green-700"
        >
          Report a lost item in {guide.cityName} →
        </Link>
        <p className="mt-4 text-xs text-gray-500">
          Contacts and procedures last reviewed on {formatReviewed(guide.lastReviewed)} from official sources.
        </p>
      </section>

      {/* Écran 2 : contacts par type de lieu */}
      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-center text-2xl font-bold text-gray-900">{guide.cardsHeading}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {guide.cards.map((c) => (
            <article key={c.title} className="rounded-xl border border-gray-200 p-5">
              <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full text-xl ${ICON[c.kind].bg}`} aria-hidden="true">
                {ICON[c.kind].emoji}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{c.title}</h3>
              {c.where && <p className="mt-0.5 text-sm text-gray-500">{c.where}</p>}
              {c.body.map((p, i) => (
                <p key={i} className="mt-2 text-sm leading-relaxed text-gray-700">{p}</p>
              ))}
              {c.hold && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <span className="font-semibold">Holding period: </span>{c.hold}
                </p>
              )}
              {c.contacts && c.contacts.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {c.contacts.map((ct) => (
                    <li key={ct.label + ct.value}>
                      <span className="text-gray-500">{ct.label}: </span>
                      {ct.href ? (
                        <a href={ct.href} className="font-medium text-blue-700 hover:underline">{ct.value}</a>
                      ) : (
                        <span className="font-medium text-gray-800">{ct.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {c.links && c.links.length > 0 && (
                <p className="mt-3 text-sm">
                  {c.links.map((l, i) => (
                    <span key={l.href}>
                      {i > 0 && <span className="mx-2 text-gray-300">|</span>}
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                        {l.label}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </article>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-gray-400">
          <a
            href={`mailto:support@reportlost.org?subject=${encodeURIComponent(`Incorrect info on the ${guide.cityName} (${guide.province}) page`)}`}
            className="hover:text-gray-600 hover:underline"
          >
            Spotted incorrect or outdated information? Let us know so we can review it.
          </a>
        </p>
      </section>

      {/* Écran 3 : objet trouvé (information, pas de formulaire en v1) */}
      <section id="found-something" className="rounded-xl border border-blue-100 bg-blue-50 p-6">
        <h2 className="text-2xl font-bold text-gray-900">{guide.found.heading}</h2>
        {guide.found.body.map((p, i) => (
          <p key={i} className="mt-3 leading-relaxed text-gray-700">{p}</p>
        ))}
      </section>

      {/* Écran 4 : formules + rappel de l'appel à l'action */}
      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-2xl font-bold text-gray-900">{guide.optionsHeading}</h2>
        <ul className="mt-4 space-y-3">
          {guide.options.map((o, i) => (
            <li key={i} className="leading-relaxed text-gray-700">{o}</li>
          ))}
        </ul>
        <div className="mt-6 text-center">
          <Link
            href={reportHref}
            prefetch={false}
            className="inline-block rounded-lg bg-green-600 px-7 py-3 font-bold text-white shadow-md transition hover:bg-green-700"
          >
            Report a lost item in {guide.cityName} →
          </Link>
        </div>
      </section>

      {/* Écran 5 : FAQ */}
      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-2xl font-bold text-gray-900">Frequently asked questions</h2>
        <div className="mt-4 divide-y divide-gray-200">
          {guide.faq.map((f) => (
            <div key={f.q} className="py-4">
              <h3 className="font-semibold text-gray-900">{f.q}</h3>
              <p className="mt-1 leading-relaxed text-gray-700">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sources + indépendance */}
      <section className="rounded-xl bg-gray-50 p-6 text-sm text-gray-600">
        <h2 className="text-base font-semibold text-gray-800">Sources</h2>
        <p className="mt-1">Official pages used for this page, last reviewed on {formatReviewed(guide.lastReviewed)}:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {guide.sources.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">{s.label}</a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-gray-500">{guide.disclaimer}</p>
      </section>
    </div>
  );
}
