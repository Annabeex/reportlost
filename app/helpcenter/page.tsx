// File: app/helpcenter/page.tsx
// Drop this file into your Next.js App Router project.

export const metadata = {
  title: "Help Center | ReportLost.org",
  description:
    "Answers about ReportLost listings, optional search services, privacy, contact, and local lost-property procedures.",
};

export default function HelpCenterPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {/* Hero */}
      <section className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Help Center</h1>
        <p className="mt-3 text-base text-gray-600">
          Find information about reports, optional search services, privacy, and local lost-property procedures.
        </p>
      </section>

      {/* Quick links */}
      <nav aria-label="On this page" className="mb-8">
        <ul className="flex flex-wrap gap-3 text-sm">
          {[
            ["how-it-works", "How it works"],
            ["pricing", "Pricing & Options"],
            ["privacy", "Privacy & Safety"],
            ["manage", "Managing your report"],
            ["tips", "Practical tips after you lose something"],
            ["faq", "FAQ"],
            ["contact", "Contact"],
          ].map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="rounded-full border px-3 py-1 hover:bg-gray-50">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* How it works */}
      <section id="how-it-works" className="mb-12">
        <h2 className="text-2xl font-semibold">How does ReportLost.org work?</h2>
        <p className="mt-3 text-gray-700">
          You can publish a free public listing or choose one of two optional search services. Each option has a separate scope and one-time fee.
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-gray-700">
          <li>
            <span className="font-medium">Free listing:</span> your report is published publicly on ReportLost and may be found through public search.
          </li>
          <li>
            <span className="font-medium">Automatic search, $12:</span> public-web monitoring runs for six months. Potential matches are reviewed before notification.
          </li>
          <li>
            <span className="font-medium">Team-assisted search, $25:</span> includes 12 months of public-web monitoring and relevant local outreach. We submit reports where the service accepts third-party filings; otherwise, we provide its contact details and instructions.
          </li>
          <li>
            <span className="font-medium">Local notice:</span> the team-assisted search can include a visual notice for relevant local groups using a protected relay address.
          </li>
        </ol>
        <p className="mt-4 text-gray-700">
          ReportLost is independent of public agencies. Offices and venues set their own procedures, and item recovery is not guaranteed.
        </p>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mb-12">
        <h2 className="text-2xl font-semibold">Pricing & Options</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Free listing</h3>
            <p className="text-sm text-gray-500">$0</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Your report is published in our public database</li>
              <li>• A searchable public listing with a protected relay address</li>
              <li>• Does not include team outreach or active web monitoring</li>
            </ul>
          </div>
          <div className="rounded-2xl border p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Automatic search</h3>
            <p className="text-sm text-gray-500">$12 — one-time, never a subscription</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Public-web monitoring for 6 months: daily the first week, then weekly, then monthly</li>
              <li>• Loss report certificate, downloadable (not an official document)</li>
              <li>• Printable sheet of QR stickers linked to your relay address</li>
              <li>• Does not include local outreach or a published notice</li>
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-green-500 p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Team-assisted search</h3>
            <p className="text-sm text-gray-500">$25 — one-time, never a subscription</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Report sent to the relevant service where third-party filing is accepted</li>
              <li>• Relevant services and likely venues contacted based on the loss location</li>
              <li>• Visual notice submitted to relevant local pages and groups where posting is available</li>
              <li>• Anonymous relay email address linked to your case</li>
              <li>• Public-web monitoring for 12 months: daily the first week, then weekly, then monthly</li>
              <li>• Loss report certificate, downloadable (not an official document)</li>
              <li>• Printable sheet of QR stickers linked to your relay address</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Privacy & Safety */}
      <section id="privacy" className="mb-12">
        <h2 className="text-2xl font-semibold">Privacy & Safety</h2>
        <ul className="mt-4 space-y-3 text-gray-700">
          <li>
            <span className="font-medium">Anonymity by default:</span> for each report, we generate a dedicated relay email address (e.g., <code>itemXXXXX@reportlost.org</code>). This protects your personal address while allowing people to contact you securely.
          </li>
          <li>
            <span className="font-medium">Data minimization:</span> only the details necessary to identify the item are shown publicly. Sensitive personal data is never published.
          </li>
          <li>
            <span className="font-medium">Safe interactions:</span> communicate through our platform whenever possible and beware of anyone asking for payment or codes to “verify” ownership.
          </li>
        </ul>
      </section>

      {/* Managing */}
      <section id="manage" className="mb-12">
        <h2 className="text-2xl font-semibold">Managing your report</h2>
        <p className="mt-3 text-gray-700">
          If you need to correct information or remove a report, please contact <a className="underline" href="mailto:support@reportlost.org">support@reportlost.org</a>. Our team will assist promptly.
        </p>
      </section>

      {/* Practical tips */}
      <section id="tips" className="mb-12">
        <h2 className="text-2xl font-semibold">Practical tips after you lose something</h2>
        <p className="mt-3 text-gray-700">
          These steps can significantly improve the odds of recovering your property:
        </p>
        <ul className="mt-4 space-y-3 text-gray-700">
          <li>
            <span className="font-medium">Retrace your steps:</span> note exact times and locations; contact and visit the venues where the item may have been left (transport desk, café, venue staff, security).
          </li>
          <li>
            <span className="font-medium">Contact official lost‑and‑found services:</span> airlines, train and bus companies, city services, campus or venue offices. Provide a concise description and a way to confirm ownership.
          </li>
          <li>
            <span className="font-medium">Phones & electronics:</span> enable Lost Mode/Find My, remotely lock the device, and notify your carrier. Consider reporting the IMEI/serial to your carrier or relevant registry.
          </li>
          <li>
            <span className="font-medium">Wallets, IDs, keys:</span> block cards, monitor statements, and contact the issuer for replacements. For keys, consider re‑keying locks if sensitive addresses are involved.
          </li>
          <li>
            <span className="font-medium">Proof of ownership:</span> gather photos, serial numbers, purchase receipts, or unique identifiers to speed up verification.
          </li>
          <li>
            <span className="font-medium">Community channels:</span> check local community groups and bulletin boards relevant to the area where the loss occurred. Avoid posting personal contact details; use our relay email.
          </li>
          <li>
            <span className="font-medium">Stay alert to scams:</span> never pay a “release fee,” never share verification codes, and meet in public places when recovering an item.
          </li>
        </ul>
      </section>

      {/* FAQ */}
      <section id="faq" className="mb-12">
        <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
        <div className="mt-6 space-y-4">
          <details className="rounded-2xl border p-4">
            <summary className="cursor-pointer text-lg font-medium">What exactly does ReportLost.org do?</summary>
            <div className="mt-3 text-gray-700">
              <p>
                A free report is published as a searchable public listing. Automatic search adds six months of public-web monitoring. Team-assisted search adds relevant local outreach, a notice for local groups, and 12 months of monitoring. Potential matches are reviewed before notification.
              </p>
            </div>
          </details>

          <details className="rounded-2xl border p-4">
            <summary className="cursor-pointer text-lg font-medium">How are matches handled?</summary>
            <div className="mt-3 text-gray-700">
              <p>
                With a paid search service, a potential match is reviewed by a team member before you are notified. You can then review its source and decide whether it may be your item.
              </p>
            </div>
          </details>

          <details className="rounded-2xl border p-4">
            <summary className="cursor-pointer text-lg font-medium">Is my personal email exposed?</summary>
            <div className="mt-3 text-gray-700">
              <p>
                No. Each report uses a dedicated <em>relay</em> address (e.g., <code>itemXXXXX@reportlost.org</code>) so your identity remains protected while still allowing secure contact.
              </p>
            </div>
          </details>

          <details className="rounded-2xl border p-4">
            <summary className="cursor-pointer text-lg font-medium">Can I edit or delete my report myself?</summary>
            <div className="mt-3 text-gray-700">
              <p>
                Self‑service deletion is not available yet. Please email <a className="underline" href="mailto:support@reportlost.org">support@reportlost.org</a> and we will update or remove the report for you.
              </p>
            </div>
          </details>

          <details className="rounded-2xl border p-4">
            <summary className="cursor-pointer text-lg font-medium">Which report option should I choose?</summary>
            <div className="mt-3 text-gray-700">
              <p>
                Choose the free listing to publish a searchable report. Automatic search ($12) adds six months of public-web monitoring, a loss report certificate, and a QR sticker sheet. Team-assisted search ($25) adds relevant local outreach, a local notice, and 12 months of public-web monitoring. Recovery is not guaranteed.
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mb-6">
        <h2 className="text-2xl font-semibold">Contact</h2>
        <p className="mt-3 text-gray-700">
          Need more help? Email us at <a className="underline" href="mailto:support@reportlost.org">support@reportlost.org</a>.
        </p>
      </section>
    </main>
  );
}
