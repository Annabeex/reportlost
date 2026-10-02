// app/how-it-works/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How ReportLost Works",
  description:
    "Learn how ReportLost helps document lost and found items, improve online visibility, and provide optional search assistance.",
};

export default function HowItWorksPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-8 text-center">How ReportLost Works</h1>

      <p className="mb-6">
        ReportLost is designed to make lost and found information easier to
        record, easier to search, and easier to share — in a way that
        complements existing solutions rather than replacing them.
      </p>

      <p className="mb-10">
        Our goal is simple: help lost items and their owners find their way back
        to each other.
      </p>

      <h2 className="text-xl font-semibold mb-4">Reporting an item is free</h2>

      <p className="mb-4">
        Anyone can submit a report on ReportLost at no cost.
      </p>

      <p className="mb-4">Free reports allow:</p>

      <ul className="list-disc list-inside mb-6 space-y-1">
        <li>Lost items to be referenced online</li>
        <li>Found items to be documented and described</li>
        <li>Information to be indexed by search engines</li>
      </ul>

      <p className="mb-6">
        Unlike posts shared in closed Facebook groups or private forums, reports
        published on ReportLost are <strong>searchable on the open web</strong>,
        making them easier to discover by people who are actively looking for a
        specific item.
      </p>

      <p className="mb-10">
        This approach is <strong>complementary</strong> to social networks and
        local groups, not a replacement for them.
      </p>

      <h2 className="text-xl font-semibold mb-4">Reporting a found item</h2>

      <p className="mb-4">
        If you found an item, you can report it in two ways:
      </p>

      <h3 className="font-semibold mb-2">1. Automatic identification (optional)</h3>

      <p className="mb-6">
        You may upload a photo of the item. When available, Google Vision
        technology can help identify the object and suggest relevant
        characteristics.
      </p>

      <h3 className="font-semibold mb-2">2. Manual description</h3>

      <p className="mb-4">
        You can also describe the item yourself by providing details such as:
      </p>

      <ul className="list-disc list-inside mb-10 space-y-1">
        <li>Item type</li>
        <li>Color and material</li>
        <li>Brand or visible markings</li>
        <li>Location where it was found</li>
      </ul>

      <p className="mb-10">
        Both methods are valid and can be combined.
      </p>

      <h2 className="text-xl font-semibold mb-4">
        Reporting a lost item and search assistance options
      </h2>

      <p className="mb-4">
        Publishing a report is free. Automatic search costs $12 once and includes six months of public-web monitoring, a ReportLost certificate, an anonymous address linked to the report, and printable QR stickers. Team-assisted search costs $25 and adds manual research, direct contact with relevant services, report submission, local social sharing, and 12 months of monitoring.
      </p>

      <p className="mb-4">
        Team-assisted search includes manual research and follow-up by a team member. We contact relevant services and venues and submit the report to appropriate lost-property services.
      </p>

      <ul className="list-disc list-inside mb-6 space-y-1">
        <li>
          Submitting the report to the appropriate lost-property services
        </li>
        <li>Contacting the place where the item was likely lost:</li>
      </ul>

      <ul className="list-disc list-inside ml-6 mb-6 space-y-1">
        <li>parks</li>
        <li>public transportation services</li>
        <li>theaters or venues</li>
        <li>nearby shops (if the loss occurred in the street)</li>
      </ul>

      <p className="mb-6">
        A team member contacts relevant services directly by email, phone, or the channel each organization uses.
        Each organization controls its own filing and collection procedures.
      </p>

      <h2 className="text-xl font-semibold mb-4">
        Public-web monitoring
      </h2>

      <p className="mb-6">
        Automatic search includes public-web monitoring for six months. Team-assisted search includes monitoring for 12 months. Checks run daily during the first week, then weekly and monthly.
      </p>

      <p className="mb-4">When a potential match is detected:</p>

      <ul className="list-disc list-inside mb-10 space-y-1">
        <li>an alert is sent to our team</li>
        <li>the information is reviewed manually</li>
        <li>the owner is notified if the match appears relevant</li>
      </ul>

      <p className="mb-10">
        Potential matches are reviewed before notification. The service does not cover content that is inaccessible to public search tools.
      </p>

      <h2 className="text-xl font-semibold mb-4">Local sharing with team-assisted search</h2>

      <p className="mb-4">
        Team-assisted search includes sharing a visual notice with relevant local pages and community groups under
        their posting rules. Availability varies by location.
      </p>

      <h2 className="text-xl font-semibold mb-4">
        Loss report certificate (included with paid search services)
      </h2>

      <p className="mb-6">
        A certificate recording your declaration and its date is issued on our
        website and can be downloaded from your case page at any time. It is
        useful when a venue, an insurer or an employer asks for written proof
        that the loss was declared. <strong>It is not an official document and
        does not replace a police report</strong> or any document issued by a
        public authority.
      </p>

      <h2 className="text-xl font-semibold mb-4">
        Stickers and QR code (included with paid search services)
      </h2>

      <p className="mb-6">
        A printable PDF sheet of stickers is included with Automatic and team-assisted search.
      </p>

      <p className="mb-6">
        These stickers can be placed on personal belongings to help prevent
        future losses.
      </p>

      <p className="mb-10">
        Each sticker includes a QR code that allows the person who finds the
        item to contact the owner without making the owner’s email address
        public.
      </p>

      <h2 className="text-xl font-semibold mb-4">
        Privacy and transparency
      </h2>

      <ul className="list-disc list-inside mb-10 space-y-1">
        <li>Sensitive personal information is never published publicly</li>
        <li>Potential matches from paid search services are reviewed by a person</li>
        <li>
          ReportLost does not guarantee recovery. The service provides a structured way to publish a report and access the selected search option.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mb-4">About ReportLost</h2>

      <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="mb-3 text-green-900">
          ReportLost is an independent private service. The free public listing,
          optional search services, and their prices are described above.
        </p>
        <p className="text-green-900">
          ReportLost is not a police, airport, transit, or government service and
          is not affiliated with public lost-property offices. Official offices
          and venues set their own procedures. Contact details are provided on
          relevant local pages.
        </p>
      </div>

      <h3 className="text-lg font-semibold mb-3">Who is behind this site</h3>

      <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-7 text-gray-700">
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

      <p className="mb-6 text-sm text-gray-600">
        The SIREN can be checked in the French government&apos;s public business
        register at annuaire-entreprises.data.gouv.fr.
      </p>

      <h3 className="text-lg font-semibold mb-3">Contacting official services</h3>

      <p className="mb-6">
        Local pages list relevant lost-property offices and venues with their
        published contact details. People can contact those organizations
        directly and follow their procedures.
      </p>

      <h3 className="text-lg font-semibold mb-3">Service limitations</h3>

      <p className="mb-6 border-l-4 border-amber-500 bg-amber-50 py-3 pl-4 pr-3 text-amber-900">
        ReportLost cannot guarantee that an item will be found or returned.
        Paid services cover the specific review, monitoring, and outreach
        described above. Public offices and venues decide whether to accept
        reports filed by a third party.
      </p>

      <h2 className="text-xl font-semibold mb-4">A complementary approach</h2>

      <p className="mb-6">
        ReportLost works alongside local lost and found services, public
        institutions, social media groups, and individual initiatives.
      </p>

      <p>
        By centralizing information and making it searchable, we aim to reduce
        fragmentation and improve visibility — without replacing existing
        systems.
      </p>
    </main>
  );
}
