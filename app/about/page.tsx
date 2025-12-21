// app/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About ReportLost.org",
  description:
    "Learn why ReportLost exists, how it works, and how the platform combines technology and human oversight to improve lost and found processes.",
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-8 text-center">
        About ReportLost.org
      </h1>

      <p className="text-lg italic text-center mb-10">
        Behind every lost item, there’s a story.
        <br />
        Behind every return, there’s relief.
      </p>

      <p className="mb-8">
        ReportLost was created to make lost and found information easier to
        record, easier to find, and easier to act on — for individuals, venues,
        and local services alike.
      </p>

      <h2 className="text-xl font-semibold mb-4">Why ReportLost Exists</h2>

      <p className="mb-4">
        ReportLost was born from a real-world experience that highlighted how
        fragmented and discouraging the lost-and-found process can be.
      </p>

      <p className="mb-4">
        Between phone calls, emails, online forms, and closed social media
        groups, important information is often scattered — or never shared at
        all. Many people give up before they even try, not because they don’t
        care, but because the process feels unclear and time-consuming.
      </p>

      <p className="mb-10">
        ReportLost was created to offer a more accessible and structured
        alternative: a place where lost and found information can be documented
        clearly and made searchable on the open web.
      </p>

      <h2 className="text-xl font-semibold mb-4">
        A Platform Designed to Be Useful — and Human
      </h2>

      <p className="mb-4">
        ReportLost combines technology with human oversight.
      </p>

      <p className="mb-4">
        The platform uses custom tools to analyze descriptions, images,
        locations, dates, and contextual keywords in order to surface potential
        matches between lost and found items. This may include publicly
        available sources, transport services, community listings, and web
        content.
      </p>

      <p className="mb-10">
        At the same time, reports are reviewed with human oversight. When a
        case requires follow-up, a member of the team takes manual action to
        verify information, contact relevant services, and assist with
        outreach.
      </p>

      <p className="mb-10">
        We believe technology can accelerate discovery — but human judgment,
        persistence, and care remain essential.
      </p>

      <h2 className="text-xl font-semibold mb-4">
        A Flexible and Fair Assistance Model
      </h2>

      <p className="mb-4">
        Submitting a report on ReportLost is always possible.
      </p>

      <p className="mb-4">
        The platform operates on a flexible contribution model, allowing users
        to choose the level of assistance that fits their situation. Some
        people simply want their item documented and searchable. Others prefer
        additional help with outreach, follow-up, and visibility.
      </p>

      <p className="mb-10">
        Access to help should not depend solely on financial constraints. At
        the same time, contributions allow the service to remain sustainable
        and to dedicate time to manual follow-up when it matters most.
      </p>

      <h2 className="text-xl font-semibold mb-4">
        Privacy, Transparency, and Trust
      </h2>

      <ul className="list-disc list-inside mb-10 space-y-1">
        <li>Sensitive personal information is never published publicly</li>
        <li>Contact details are protected</li>
        <li>Reports are handled with care and human oversight</li>
      </ul>

      <p className="mb-10">
        ReportLost does not guarantee the recovery of an item. What it provides
        is structure, visibility, and assistance — to improve the chances of a
        meaningful match.
      </p>

      <h2 className="text-xl font-semibold mb-4">Looking Ahead</h2>

      <p className="mb-4">
        ReportLost is built to work alongside existing systems, not replace
        them.
      </p>

      <p className="mb-10">
        The long-term goal is to collaborate with transportation services,
        public venues, schools, hotels, and local authorities to make
        lost-and-found processes more efficient and less fragmented.
      </p>

      <p className="mb-10">
        The platform is continuously evolving, guided by real use cases and a
        commitment to clarity, reliability, and respect for users.
      </p>

      <h2 className="text-xl font-semibold mb-4">
        A Small Team, A Clear Mission
      </h2>

      <p className="mb-10">
        ReportLost is operated by a small, dedicated team focused on improving
        how lost and found information is shared online — with care,
        responsibility, and attention to detail.
      </p>

      <p className="text-sm">
        💌 <strong>Questions, feedback, or press inquiries?</strong>
        <br />
        You can reach us at{" "}
        <a
          href="mailto:support@reportlost.org"
          className="text-blue-600 hover:underline"
        >
          support@reportlost.org
        </a>
      </p>
    </main>
  );
}
