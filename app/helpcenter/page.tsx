// File: app/helpcenter/page.tsx
// Drop this file into your Next.js App Router project.

export const metadata = {
  title: "Help Center | ReportLost.org",
  description:
    "Answers to the most common questions about reporting and finding lost items with ReportLost.org: how it works, plans, privacy, contact, and practical recovery tips.",
};

export default function HelpCenterPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {/* Hero */}
      <section className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Help Center</h1>
        <p className="mt-3 text-base text-gray-600">
          Find clear answers about how ReportLost.org works, our plans and privacy, and what you can do right now to improve the chances of getting your item back.
        </p>
      </section>

      {/* Quick links */}
      <nav aria-label="On this page" className="mb-8">
        <ul className="flex flex-wrap gap-3 text-sm">
          {[
            ["how-it-works", "How it works"],
            ["pricing", "Pricing & Plans"],
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
          We combine careful human follow‑up with technology to maximize legitimate matches and help return items to their owners. Our standard process includes:
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-gray-700">
          <li>
            <span className="font-medium">AI automatic search:</span> a specialized engine looks for posts and listings across the web and social platforms using keywords derived from your description.
          </li>
          <li>
            <span className="font-medium">Checks across multiple databases:</span> we verify numerous national and local lost‑and‑found datasets to spot potential matches.
          </li>
          <li>
            <span className="font-medium">Local notifications:</span> we reach out to the relevant local lost‑and‑found offices and to places where your item could realistically have been misplaced (transport, venues, businesses).
          </li>
          <li>
            <span className="font-medium">Mass outreach:</span> we create a clear visual and share it across appropriate community groups and networks to broaden visibility.
          </li>
        </ol>
        <p className="mt-4 text-gray-700">
          All reports are taken seriously. Even when some details do not align perfectly, we may notify you about a possible match so you can verify.
        </p>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mb-12">
        <h2 className="text-2xl font-semibold">Pricing & Plans</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Basic</h3>
            <p className="text-sm text-gray-500">Free</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Your report is stored in our public database</li>
              <li>• Eligible for automatic matching</li>
            </ul>
          </div>
          <div className="rounded-2xl border p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Extended Search</h3>
            <p className="text-sm text-gray-500">$12</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• AI‑powered search across the web</li>
              <li>• Verification in multiple databases</li>
              <li>• Automated notifications to local offices</li>
            </ul>
          </div>
          <div className="rounded-2xl border p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Full Assistance</h3>
            <p className="text-sm text-gray-500">$25</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Everything in Extended Search</li>
              <li>• Human follow‑up and manual checks</li>
              <li>• Visual creation and social media outreach</li>
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
            <span className="font-medium">Retrace your steps:</span> note exact times and locations; call and visit the venues where the item may have been left (transport desk, café, venue staff, security).
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
                We run AI‑assisted searches, verify across multiple databases, notify relevant local offices and venues, and amplify your case on social channels using a clear visual. Our aim is to surface credible leads and connect you with the right person safely.
              </p>
            </div>
          </details>

          <details className="rounded-2xl border p-4">
            <summary className="cursor-pointer text-lg font-medium">How are matches handled?</summary>
            <div className="mt-3 text-gray-700">
              <p>
                When a possible match appears, we notify you so you can review photos and details. Even if not every detail is identical, you can confirm or reject the match with additional proof of ownership.
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
            <summary className="cursor-pointer text-lg font-medium">Which plan should I choose?</summary>
            <div className="mt-3 text-gray-700">
              <p>
                The free plan is a good starting point for visibility and automated matching. Choose <span className="font-medium">Extended Search</span> if you want broader automated coverage and official notifications. Select <span className="font-medium">Full Assistance</span> for human follow‑up, manual checks, and organized community outreach.
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
