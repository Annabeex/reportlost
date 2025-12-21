// components/FaqJsonLd.tsx
import React from "react";

type FaqItem = { q: string; a: string };

function stripHtml(input: string) {
  // Au cas où : on garde du texte propre pour le JSON-LD
  return input.replace(/<[^>]*>/g, "").trim();
}

export default function FaqJsonLd({
  faq,
}: {
  faq: FaqItem[];
}) {
  if (!faq?.length) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.slice(0, 3).map((item) => ({
      "@type": "Question",
      name: stripHtml(item.q),
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtml(item.a),
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // Next/React attend une string JSON
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
