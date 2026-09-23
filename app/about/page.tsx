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
        A small independent business, based in France
      </h2>

      <p className="mb-4">
        ReportLost is a small independent business, run from France. It is not a
        police department, an airport, a transit agency or a lost-and-found
        office, and it is not affiliated with any of them. Every office we work
        with is listed on our pages with its own contact details &mdash; you can
        always file directly, yourself, for free.
      </p>

      <p className="mb-4">
        What we do is the part most people don&apos;t have the time or the
        patience for: finding the right desk for where you lost your item,
        filing your report with the offices that accept third-party reports, and
        monitoring found-item listings across the web for months afterwards.
      </p>

      <p className="mb-6">
        What we cannot do is promise your item comes back. Most lost items are
        never handed in to anyone. We charge for the work, not for the result
        &mdash; and we say so before you pay, not after.
      </p>

      <div className="mb-10 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-7 text-gray-700">
        <div>
          <span className="inline-block w-36 text-gray-500">Trade name</span>
          ReportLost
        </div>
        <div>
          <span className="inline-block w-36 text-gray-500">Legal form</span>
          Entreprise individuelle (French sole proprietorship)
        </div>
        <div>
          <span className="inline-block w-36 text-gray-500">SIREN</span>
          753&nbsp;879&nbsp;477
        </div>
        <div>
          <span className="inline-block w-36 text-gray-500">Registered at</span>
          38 avenue du Calais, 44730 Saint-Michel-Chef-Chef, France
        </div>
        <div>
          <span className="inline-block w-36 text-gray-500">VAT</span>
          Not applicable &mdash; French small-business exemption (art. 293 B CGI)
        </div>
        <div>
          <span className="inline-block w-36 text-gray-500">Contact</span>
          support@reportlost.org
        </div>
      </div>

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
