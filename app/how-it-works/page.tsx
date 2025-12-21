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
        When reporting a lost item, several levels of search assistance are
        available.
      </p>

      <p className="mb-4">
        All assistance plans include <strong>manual review and action</strong> by
        a member of our team.
      </p>

      <p className="mb-4">At a minimum, this includes:</p>

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
        Our search engine regularly scans the web for relevant keywords
        associated with the lost item.
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
        Stickers and QR code (available with selected plans)
      </h2>

      <p className="mb-6">
        With the $25 assistance plan, a printable PDF sheet of stickers is
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
