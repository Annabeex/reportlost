// components/CityGuide.tsx
// Moteur générique : rend une page ville enrichie à partir d'un objet CityGuide
// (voir lib/cityGuides.ts). Remplace les composants par ville (NycContent, etc.).
// Server component (pas de "use client").

import Image from "next/image";
import Link from "next/link";
import type { CityGuide } from "@/lib/cityGuides";

const ext = "text-blue-600 font-medium hover:underline";

export function CityGuideTitle({ guide }: { guide: CityGuide }) {
  return (
    <section className="text-center py-12 px-6 bg-gradient-to-r from-blue-50 to-white rounded-xl shadow border border-gray-100">
      <span className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
        {guide.badge}
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
        {guide.h1}
      </h1>
      <p
        className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mt-4"
        dangerouslySetInnerHTML={{ __html: guide.heroSubtitle }}
      />
    </section>
  );
}

export function CityGuideExtra({
  guide,
  cityImage,
  cityImageAlt,
  cityImageCredit,
}: {
  guide: CityGuide;
  cityImage?: string | null;
  cityImageAlt?: string | null;
  cityImageCredit?: string | null;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Étapes */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900 text-center">{guide.stepsHeading}</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {guide.steps.map((s) => (
            <div key={s.title} className="text-center">
              <div className={`w-12 h-12 mx-auto ${s.iconBg} rounded-full flex items-center justify-center text-2xl`}>
                {s.icon}
              </div>
              <h3 className="font-bold mt-3 text-gray-900">{s.title}</h3>
              <p className="text-sm text-gray-600 mt-2" dangerouslySetInnerHTML={{ __html: s.body }} />
            </div>
          ))}
        </div>
      </section>

      {/* Guide par lieu */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900 text-center">{guide.guideHeading}</h2>
        <p className="text-gray-600 mt-2 text-sm text-center max-w-3xl mx-auto">{guide.guideSubtitle}</p>
        <div className="grid md:grid-cols-2 gap-5 mt-8">
          {guide.cards.map((c) => (
            <div key={c.title} className="border border-gray-200 rounded-xl p-5">
              <div className={`w-11 h-11 ${c.iconBg} rounded-full flex items-center justify-center text-xl mb-3`}>
                {c.icon}
              </div>
              <h3 className="font-bold text-lg text-gray-900">{c.title}</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: c.body }} />
              {c.links && c.links.length > 0 && (
                <p className="mt-3 text-sm">
                  {c.links.map((l, i) => (
                    <span key={l.href}>
                      {i > 0 && <span className="mx-2 text-gray-300">|</span>}
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className={ext}>
                        {l.label}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-gray-400">
          <a
            href={`mailto:support@reportlost.org?subject=${encodeURIComponent(
              `Incorrect info on the ${guide.badge} page`
            )}&body=${encodeURIComponent(
              "Hi, I spotted something incorrect on this page:\n\n(please tell us what should be fixed, thank you!)"
            )}`}
            className="hover:text-gray-600 hover:underline"
          >
            ⚠️ Spotted incorrect or outdated info on this page? Let us know, we fix it fast.
          </a>
        </p>
      </section>

      {/* CTA milieu */}
      <section className="bg-blue-50 rounded-xl border border-blue-100 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">{guide.midCtaHeading}</h2>
        <p className="mt-2 text-gray-600">{guide.midCtaBody}</p>
        <a href="#report-form" className="mt-5 inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg shadow-md transition">
          {guide.ctaLabel}
        </a>
      </section>

      {/* Contexte local + image (volontairement plus bas dans la page) */}
      <section className="bg-white p-6 rounded-xl shadow">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="lg:w-3/5 w-full text-gray-800 leading-relaxed space-y-4">
            {guide.intro.map((p, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </div>
          {cityImage && (
            <div className="lg:w-2/5 w-full">
              <Image
                src={cityImage}
                alt={cityImageAlt || guide.imageAltFallback}
                width={600}
                height={400}
                className="w-full h-[240px] object-cover rounded-lg shadow"
              />
              {cityImageCredit && (
                <p className="text-xs text-gray-500 mt-1 text-center">{cityImageCredit}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Secteurs / quartiers */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900">{guide.areasHeading}</h2>
        <p className="text-gray-600 mt-2 text-sm max-w-3xl">{guide.areasSubtitle}</p>
        <div className="mt-6 space-y-4">
          {guide.areas.map((a) => (
            <div key={a.name} className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900">
                {a.href ? (
                  <Link href={a.href} className="text-blue-700 hover:underline">
                    {a.name}
                  </Link>
                ) : (
                  a.name
                )}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{a.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Réseaux sociaux */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900">{guide.socialHeading}</h2>
        <p className="text-gray-600 mt-2 text-sm max-w-3xl">{guide.socialSubtitle}</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-5 text-sm">
          {guide.social.map(([t, d]) => (
            <div key={t} className="border border-gray-200 rounded-xl p-4">
              <strong>{t}</strong>
              <br />
              <span className="text-gray-500">{d}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{guide.faqHeading}</h2>
        <div className="space-y-3 text-sm">
          {guide.faq.map((f) => (
            <details key={f.q} className="border-b border-gray-100 pb-3">
              <summary className="font-semibold cursor-pointer text-gray-800">{f.q}</summary>
              <p className="text-gray-600 mt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Nearby */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Lost &amp; found in nearby cities</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {guide.nearby.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-1.5 bg-gray-100 rounded-full text-blue-600 hover:bg-blue-50 font-medium"
            >
              {n.label}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="text-center py-6">
        <h2 className="text-2xl font-bold text-gray-900">{guide.finalCtaHeading}</h2>
        <p className="text-gray-600 mt-2">{guide.finalCtaBody}</p>
        <a href="#report-form" className="mt-5 inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg shadow-md transition">
          {guide.finalCtaLabel}
        </a>
      </section>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center max-w-3xl mx-auto">{guide.disclaimer}</p>
    </>
  );
}
