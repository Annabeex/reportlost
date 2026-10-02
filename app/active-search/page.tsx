// app/active-search/page.tsx
// Information page for the team-assisted search option.
// - Tailwind CSS styling

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Check, Mail, Shield, Search, Bell, MapPin, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Team-assisted search — ReportLost",
  description:
    "One-time $25 team-assisted search for lost items in the United States, including local outreach and 12-month public-web monitoring.",
};

function Bulleted({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <Check aria-hidden className="mt-1 h-5 w-5" />
      <span>{children}</span>
    </li>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const ridParam = typeof searchParams?.rid === "string" ? searchParams!.rid : undefined;
  const contributeHref = `/report?go=contribute${ridParam ? `&rid=${encodeURIComponent(ridParam)}` : ""}`;

  // Put your file in /public/files/scan-demo.pdf
  const stickersPdfHref = "/files/scan-demo.pdf";

  return (
    <main className="min-h-screen bg-white text-gray-900 -mt-10">
      {/* HERO */}
      <section className="relative overflow-hidden -mt-10 md:-mt-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-400" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 text-white">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            {/* Left copy */}
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
                Team-assisted search
              </h1>
              <p className="mt-4 text-lg sm:text-xl/relaxed opacity-95">
                A team member reviews your report, contacts relevant local lost-property services and venues, and
                monitors public web sources for potential matches for 12 months.
              </p>

              {/* Small note + learn more */}
              <div className="mt-5">
                <p className="text-sm sm:text-base">
                  <span className="font-semibold">One-time fee: $25.</span> No subscription. A printable QR sticker
                  sheet is included.
                </p>
                <Link
                  href="#whats-included"
                  className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 font-semibold text-white ring-1 ring-white/40 backdrop-blur hover:bg-white/25"
                >
                  Read the service details
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={contributeHref}
                  className="inline-flex items-center gap-2 rounded-2xl bg-black/90 px-5 py-3 font-semibold text-white shadow-lg shadow-black/20 ring-emerald-200 transition hover:bg-black"
                >
                  Review this option — $25 <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#whats-included"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 font-semibold text-white ring-1 ring-white/40 backdrop-blur hover:bg-white/25"
                >
                  See what’s included
                </Link>
              </div>

              {ridParam && (
                <p className="mt-2 text-sm opacity-80">
                  Report reference preserved (<span className="font-mono">rid</span> attached).
                </p>
              )}
            </div>

            {/* Right visual */}
            <div className="relative">
              {/* Place your image at /public/images/hero.png */}
              <Image
                src="/images/hero.png"
                alt="Examples of items with secure QR stickers (keys, passport, bottle, laptop)"
                width={900}
                height={700}
                className="w-full h-auto rounded-2xl shadow-lg shadow-black/20 ring-1 ring-white/20"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PILLARS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border p-6 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Mail className="h-5 w-5 text-emerald-700" />
            </div>
            <h3 className="text-lg font-semibold">Outreach for you</h3>
            <p className="mt-2 text-gray-700">
              We notify and follow up with relevant Lost &amp; Found desks (transit, venues, and other likely
              locations) on your behalf.
            </p>
          </div>
          <div className="rounded-2xl border p-6 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Search className="h-5 w-5 text-emerald-700" />
            </div>
            <h3 className="text-lg font-semibold">Broader search</h3>
            <p className="mt-2 text-gray-700">
              We search across large databases and public listings relevant to your case to catch potential matches.
            </p>
          </div>
          <div className="rounded-2xl border p-6 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Bell className="h-5 w-5 text-emerald-700" />
            </div>
            <h3 className="text-lg font-semibold">Targeted alerts</h3>
            <p className="mt-2 text-gray-700">
              We monitor public web sources and email you when a team-reviewed potential match is identified.
            </p>
          </div>
        </div>
      </section>

      {/* PROCESS AND LIMITS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-bold">How the service works</h2>
            <p className="mt-3 text-gray-700">
              A team member reviews the report, identifies relevant offices and locations, and carries out the
              follow-up included with team-assisted search. Potential matches are reviewed before they are sent to you.
            </p>
            <ul className="mt-6 space-y-3">
              <Bulleted>We contact relevant lost-property services and likely venues.</Bulleted>
              <Bulleted>We publish a notice in relevant local groups using a protected relay address.</Bulleted>
              <Bulleted>We monitor public web sources for 12 months.</Bulleted>
            </ul>
            <div className="mt-8">
              <Link
                href={contributeHref}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow hover:bg-emerald-700"
              >
                Review this option — $25 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Service limits</h3>
            <ul className="mt-4 space-y-3 text-gray-700">
              <Bulleted>Official offices and venues retain control over their own procedures and property.</Bulleted>
              <Bulleted>A team member contacts relevant offices and submits the report to appropriate services; each organization controls its own filing process.</Bulleted>
              <Bulleted>Monitoring covers public web sources; it does not guarantee that an item will be found.</Bulleted>
            </ul>
          </div>
        </div>
      </section>

      {/* WHAT $25 COVERS */}
      <section id="what-you-get" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold">What the $25 fee covers</h2>
        <p className="mt-3 max-w-3xl text-gray-700">
          One-time service fee. Public-web monitoring remains active for 12 months.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {[
            {
              t: "Your report is sent to the relevant lost-property service",
              d: "We identify the local police department or city lost-property office based on where you lost the item. Where the service accepts third-party reports, we submit it. If the owner must file directly, we provide the office, link and steps.",
            },
            {
              t: "The places likely to hold it are contacted",
              d: "Selected from your loss location: transit operator, hotel, restaurant, venue, airport, taxi company, nearby shops and the lost-property desks around it.",
            },
            {
              t: "A visual notice is created and published",
              d: "On social media and in the local groups that matter, private ones included. It carries an anonymous relay address tied to your case, so finders reach you without seeing your personal email or phone number.",
            },
            {
              t: "An AI search engine scans the web for 12 months",
              d: "On your item's keywords: every day for the first week, then once a week, then once a month. Every credible match is reviewed by a team member before it reaches you.",
            },
            {
              t: "A loss report certificate",
              d: "Issued on our site and downloadable from your case page at any time. It records your declaration and its date. It is not an official document and does not replace a police report.",
            },
            {
              t: "A printable sheet of QR stickers",
              d: "For your everyday belongings, to print on adhesive paper. Each code routes a finder to your anonymous relay address.",
            },
          ].map((b, i) => (
            <div key={b.t} className="rounded-2xl border p-6">
              <div className="flex items-baseline gap-3">
                <span className="text-sm font-semibold text-emerald-700">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-semibold">{b.t}</h3>
              </div>
              <p className="mt-2 text-gray-700">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section id="whats-included" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-3xl border p-6 sm:p-10 shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
            Included with team-assisted search
          </span>
          <h2 className="mt-4 text-2xl font-bold">Prevention kit & secure stickers</h2>
          <p className="mt-3 max-w-3xl text-gray-700">
            You get a printable (PDF) sheet of secure ID stickers for your everyday items — luggage, keys, laptop,
            water bottle, or <b>anything you want to track</b>
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border p-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" /> Why they’re secure
              </h3>
              <p className="mt-2 text-gray-700">
                Each sticker routes finders to a <b>private, dedicated address we host for you</b>. People can contact
                you without your personal email or phone appearing on the object.
              </p>
              <ul className="mt-4 space-y-2 text-gray-700">
                <Bulleted>No personal contact info printed on the sticker.</Bulleted>
                <Bulleted>Messages reach you via a protected relay inbox.</Bulleted>
                <Bulleted>Quick scan with any smartphone camera (QR).</Bulleted>
              </ul>
            </div>
            <div className="rounded-2xl border p-6">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Where to use them
              </h3>
              <p className="mt-2 text-gray-700">
                Keys, luggage tag, laptop, passport cover, water bottle, kid’s backpack, and more.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">Keys</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">Luggage</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">Laptop</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">Passport</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">Water bottle</span>
              </div>
              <div className="mt-6">
                {/* Opens PDF in a new tab */}
                <Link
                  href={stickersPdfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-semibold hover:bg-gray-50"
                >
                  Preview the sticker sheet (PDF)
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href={contributeHref}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow hover:bg-emerald-700"
            >
              Review this option — $25 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-3xl border p-6 sm:p-10">
          <h2 className="text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold">How long do you keep searching?</h3>
              <p className="mt-2 text-gray-700">
              Public-web monitoring stays active for 12 months, starting the day
                the team-assisted search is activated.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Can I start without photos?</h3>
              <p className="mt-2 text-gray-700">
                Yes. A photo is optional and can be added to your report later.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Do the stickers expose my contact details?</h3>
              <p className="mt-2 text-gray-700">
                No. Stickers point to a private address hosted by us so finders can reach you without seeing your
                personal email or phone number.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
