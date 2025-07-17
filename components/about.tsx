'use client';

export default function AboutPage() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold text-center mb-6">About ReportLost.org</h1>

      <p className="mb-6 text-sm text-center text-gray-600 italic">
        "Behind every lost item, there's a story. Behind every return, there's relief."
      </p>

      <h2 className="text-xl font-semibold mb-3">Why We Created ReportLost.org</h2>
      <p className="mb-5">
        It all started with a lost backpack in a busy airport. Despite hours of calls, emails, and online forms,
        we realized how fragmented and frustrating the process was. People either gave up or never even tried.
        We knew there had to be a better way — more accessible, more human.
      </p>
      <p className="mb-5">
        That's how ReportLost.org was born: out of a personal experience, and a desire to help people reconnect with what they’ve lost —
        whether it's a phone, a suitcase, or something more sentimental.
      </p>

      <h2 className="text-xl font-semibold mb-3">Combining Technology with Human Care</h2>
      <p className="mb-5">
        Our platform uses a custom-built algorithm powered by image recognition and contextual data
        (time, place, keywords, public databases) to match lost item reports with found items across multiple channels.
        This includes transport agencies, public listings, and community reports.
      </p>
      <p className="mb-5">
        But we don’t stop at automation. Each report is reviewed by a human, who follows up manually when a match looks promising.
        We believe technology is powerful — but compassion, intuition and persistence are equally essential.
      </p>

      <h2 className="text-xl font-semibold mb-3">A Fair and Accessible Model</h2>
      <p className="mb-5">
        We’ve chosen a “pay-what-you-can” model. Submitting a report is always possible, and the price is entirely up to you.
        Whether you give $5, $20, or nothing at all, your report will still be treated seriously.
      </p>
      <p className="mb-5">
        Why? Because we believe peace of mind shouldn’t have a price tag. And because most people are fair when they know they’re being helped by real humans.
      </p>

      <h2 className="text-xl font-semibold mb-3">Looking Ahead</h2>
      <p className="mb-5">
        Our goal is to make ReportLost.org the most trusted lost & found platform in the U.S.
        We’re building partnerships with transportation services, airports, hotels, schools, and local governments to make the process even faster.
      </p>
      <p>
        And we’re just getting started.
      </p>

      <div className="mt-10 text-center text-sm text-gray-500">
        💌 Questions, feedback or press inquiries? Reach us at <a href="mailto:support@reportlost.org" className="text-blue-600 hover:underline">support@reportlost.org</a>
      </div>
    </section>
  );
}
