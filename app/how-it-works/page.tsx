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
        Publishing a lost item report is free. Two paid plans are offered, each a
        one-time payment and never a subscription:
        <strong> Active search, at $25</strong>, active for 12 months, and
        <strong> Automatic search, at $12</strong>, which covers the automated
        part alone for 6 months.
      </p>

      <p className="mb-4">
        It includes <strong>manual review and action</strong> by a member of our
        team, and covers the following:
      </p>

      <ul className="list-disc list-inside mb-6 space-y-1">
        <li>
          Declaring the loss to the city’s lost and found service (often managed
          by the municipal police or a public office)
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
        These contacts are made via online contact forms, email, and when
        available, phone numbers are provided so the owner may also follow up
        directly if they wish.
      </p>

      <h2 className="text-xl font-semibold mb-4">
        Continuous web search and alerts
      </h2>

      <p className="mb-6">
        An AI search engine scans the web for keywords associated with your lost
        item, <strong>every day for the first week, then once a week, then once a
        month, for 12 months</strong>.
      </p>

      <p className="mb-4">When a potential match is detected:</p>

      <ul className="list-disc list-inside mb-10 space-y-1">
        <li>an alert is sent to our team</li>
        <li>the information is reviewed manually</li>
        <li>the owner is notified if the match appears relevant</li>
      </ul>

      <p className="mb-10">
        This process runs continuously during the active search period.
      </p>

      <h2 className="text-xl font-semibold mb-4">Social media diffusion</h2>

      <p className="mb-4">As part of the search assistance:</p>

      <ul className="list-disc list-inside mb-6 space-y-1">
        <li>a visual “lost item notice” is created</li>
        <li>
          the notice is shared on social media channels to increase visibility
        </li>
      </ul>

      <p className="mb-10">
        This step helps reach people who may not be actively searching but could
        recognize the item.
      </p>

      <h2 className="text-xl font-semibold mb-4">
        Loss report certificate (included with Active search)
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
        Stickers and QR code (included with Active search)
      </h2>

      <p className="mb-6">
        With the $25 Active search plan, a printable PDF sheet of stickers is
        included.
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
        <li>Reports are reviewed with human oversight</li>
        <li>
          ReportLost does not guarantee recovery of an item, but provides
          structured tools and assistance to improve the chances of a match
        </li>
      </ul>

      {/* Repond frontalement a la requete « is reportlost a scam ». Le vide
          autour du site laissait les encadres IA combler avec la reputation de
          la categorie ; cette section leur donne de la matiere verifiable. */}
      <h2 className="text-xl font-semibold mb-4">Is ReportLost a scam?</h2>

      <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="mb-3 text-green-900">
          <strong>No &mdash; and you shouldn&apos;t take our word for it.</strong>{" "}
          Below is who we are, what your money buys, what we refuse to promise,
          and how to do the whole thing yourself for free if you&apos;d rather.
          Check the list, don&apos;t trust the claim.
        </p>
        <p className="text-green-900">
          ReportLost is a paid private service. We are not the police, not an
          airport, not a transit agency, and not affiliated with any
          lost-and-found office. Everything we do, you can do yourself &mdash;
          and we publish the contact details you would need to do it.
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
        You can verify that SIREN yourself on the French government&apos;s public
        business register at annuaire-entreprises.data.gouv.fr. Sites that are
        actually scams do not hand you a number to check.
      </p>

      <h3 className="text-lg font-semibold mb-3">
        You can do all of this yourself, for free
      </h3>

      <p className="mb-6">
        Every one of our city pages lists the lost-and-found desks for that place
        &mdash; the police department, the transit operator, the airport &mdash;
        with their own contact details and their own procedure. No account, no
        payment, no email address required to read them. If you have the time to
        work through them, do: you will not get a worse result than ours.
      </p>

      <h3 className="text-lg font-semibold mb-3">What we refuse to promise</h3>

      <p className="mb-6 border-l-4 border-amber-500 bg-amber-50 py-3 pl-4 pr-3 text-amber-900">
        <strong>That your item comes back.</strong> Most lost property is never
        handed in to anyone, anywhere. No service, paid or free, changes that.
        You are paying for the steps to be taken &mdash; and we say it here,
        before you pay, rather than in an email afterwards. Any service in this
        field promising you will recover your item is either careless or lying.
      </p>

      <h3 className="text-lg font-semibold mb-3">
        How to tell a real service from a fake one
      </h3>

      <p className="mb-3">
        Use this on us. Then use it on the next site you land on.
      </p>

      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200">
        {[
          ["Is there a registered company, with a number you can look up?", "Yes", true],
          ["Does the site tell you how to do it yourself, for free?", "Yes", true],
          ["Is the price shown before you enter anything?", "Yes", true],
          ["Does it promise you will get your item back?", "No", false],
          ["Does it claim to be an official or police service?", "No", false],
        ].map(([q, a, good], i) => (
          <div
            key={String(q)}
            className={`flex gap-4 px-4 py-3 text-[15px] ${
              i ? "border-t border-gray-100" : ""
            }`}
          >
            <span className="flex-1 text-gray-700">{q as string}</span>
            <span
              className={`whitespace-nowrap font-bold ${
                good ? "text-green-700" : "text-red-700"
              }`}
            >
              {a as string}
            </span>
          </div>
        ))}
      </div>

      <p className="mb-8 text-[15px] text-gray-600">
        A site that fails two of these is worth closing. Several well-known
        lost-and-found sites fail four.
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
